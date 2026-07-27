import { NextRequest, NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Memory Store for Sliding Window Rate Limiting
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

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

export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetMs: number; response?: NextResponse } {
  const ip = getClientIp(req);
  const prefix = options.prefix || req.nextUrl.pathname;
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  let record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + options.windowMs,
    };
    rateLimitMap.set(key, record);
    return {
      allowed: true,
      remaining: options.limit - 1,
      resetMs: options.windowMs,
    };
  }

  if (record.count >= options.limit) {
    const resetMs = Math.max(0, record.resetTime - now);
    const resetSec = Math.ceil(resetMs / 1000);

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
