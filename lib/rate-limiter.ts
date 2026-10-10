import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-Memory Fallback Store (ensures 100% uptime if DB migration/connection is refreshing)
// NOTE: serverless-safe — lazy expiry on access only, no setInterval (prevents lambda timer leaks/billing).
const memoryRateLimitMap = new Map<string, RateLimitRecord>();

function pruneExpiredRateLimits(now: number) {
  // Opportunistic cleanup, capped per call to avoid long scans.
  let scanned = 0;
  for (const [key, record] of memoryRateLimitMap.entries()) {
    if (scanned++ > 100) break;
    if (now > record.resetTime) memoryRateLimitMap.delete(key);
  }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1"
  );
}

export interface RateLimitOptions {
  limit: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
  prefix?: string; // Route identifier prefix
}

/**
 * Dual-Layer Distributed Rate Limiter:
 * Layer 1: Atomic PostgreSQL RPC `check_and_increment_rate_limit` (multi-instance, serverless-persistent)
 * Layer 2: In-Memory Map Fallback (guarantees zero downtime if DB is temporarily unreachable)
 */
export async function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number; resetMs: number; response?: NextResponse }> {
  const ip = getClientIp(req);
  const prefix = options.prefix || req.nextUrl.pathname;
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));

  // 1. Primary: Distributed Database Rate Limiting via Supabase RPC
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("check_and_increment_rate_limit", {
      p_key: key,
      p_limit: options.limit,
      p_window_seconds: windowSeconds,
    });

    if (!error && data && typeof data.allowed === "boolean") {
      const allowed = data.allowed as boolean;
      const remaining = typeof data.remaining === "number" ? data.remaining : 0;
      const resetMs = typeof data.reset_ms === "number" ? data.reset_ms : options.windowMs;

      if (!allowed) {
        const resetSec = Math.max(1, Math.ceil(resetMs / 1000));
        const response = NextResponse.json(
          {
            error: `Too many requests. Please try again in ${resetSec} seconds.`,
            retryAfter: resetSec,
          },
          {
            status: 429,
            headers: {
              "Retry-After": resetSec.toString(),
              "X-RateLimit-Limit": options.limit.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": (now + resetMs).toString(),
            },
          }
        );
        return { allowed: false, remaining: 0, resetMs, response };
      }

      return { allowed: true, remaining, resetMs };
    }
  } catch (dbErr) {
    console.error("[RateLimiter] DB RPC unavailable, using memory fallback:", dbErr);
  }

  // 2. Secondary Fallback: In-Memory Sliding Window
  pruneExpiredRateLimits(now);
  let record = memoryRateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    memoryRateLimitMap.set(key, record);
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetMs: options.windowMs,
    };
  }

  if (record.count >= options.limit) {
    const resetMs = Math.max(0, record.resetTime - now);
    const resetSec = Math.max(1, Math.ceil(resetMs / 1000));

    const response = NextResponse.json(
      {
        error: `Too many requests. Please try again in ${resetSec} seconds.`,
        retryAfter: resetSec,
      },
      {
        status: 429,
        headers: {
          "Retry-After": resetSec.toString(),
          "X-RateLimit-Limit": options.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": record.resetTime.toString(),
        },
      }
    );

    return { allowed: false, remaining: 0, resetMs, response };
  }

  record.count += 1;
  const remaining = options.limit - record.count;
  const resetMs = Math.max(0, record.resetTime - now);

  return { allowed: true, remaining, resetMs };
}
