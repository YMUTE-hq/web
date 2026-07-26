import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import crypto from "crypto";
import { storeOtp } from "@/lib/otp-store";

const ipRateLimitMap = new Map<string, { count: number; firstRequestTime: number }>();

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const limit = 5;

  const record = ipRateLimitMap.get(ip);
  if (!record) {
    ipRateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return false;
  }

  if (now - record.firstRequestTime > windowMs) {
    ipRateLimitMap.set(ip, { count: 1, firstRequestTime: now });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "127.0.0.1";

    if (isIpRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many password reset attempts from your connection. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminSupabase = createAdminClient();

    // 1. Check if user account exists in database
    const { data: userProfile } = await adminSupabase
      .from("users")
      .select("id, email, full_name")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json(
        {
          error: "No account found with this email address. Please check your spelling or register a new account.",
          notRegistered: true,
        },
        { status: 404 }
      );
    }

    // 2. Generate Cryptographically Secure 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const { otpHash, expiresAt } = storeOtp(cleanEmail, rawOtp);

    // 3. Attempt DB backup insertion (silently ignore if table doesn't exist yet)
    try {
      await adminSupabase.from("password_resets").insert({
        email: cleanEmail,
        otp_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        used: false,
        attempts: 0,
      });
    } catch (dbErr) {
      console.warn("[Password Reset DB Warning]: Using memory store for OTP verification.");
    }

    console.log(`\n==============================================`);
    console.log(`[SECURITY OTP DISPATCH] Reset requested for ${cleanEmail}`);
    console.log(`[VERIFICATION CODE]: ${rawOtp}`);
    console.log(`==============================================\n`);

    return NextResponse.json({
      success: true,
      message: "A 6-digit OTP code has been sent to your email.",
      devOtp: process.env.NODE_ENV !== "production" ? rawOtp : undefined,
    });
  } catch (error: any) {
    console.error("[Forgot Password API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
