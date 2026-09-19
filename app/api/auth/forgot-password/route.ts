import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import crypto from "crypto";
import { storeOtp } from "@/lib/otp-store";
import { getErrorMessage } from "@/types";
import { sendPasswordResetOtp, sendOAuthAccountNotification } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    // 1. Unified Sliding-Window Rate Limit: Max 5 attempts per 15 minutes per IP
    const rateCheck = checkRateLimit(req, {
      prefix: "forgot-password",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateCheck.allowed && rateCheck.response) {
      return rateCheck.response;
    }

    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminSupabase = createAdminClient();

    // 2. Look up user account in database
    const { data: userProfile } = await adminSupabase
      .from("users")
      .select("id, email, full_name")
      .eq("email", cleanEmail)
      .maybeSingle();

    // Anti-User Enumeration: Return uniform success response even if account doesn't exist
    if (!userProfile) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email address, a verification code has been sent.",
      });
    }

    // 3. Check if user is registered purely via OAuth (Google)
    try {
      const { data: authUserData } = await adminSupabase.auth.admin.getUserById(userProfile.id);
      const authUser = authUserData?.user;
      const identities = authUser?.identities || [];
      const hasPasswordAuth = identities.some((id: { provider: string }) => id.provider === "email");
      const isOAuthOnly =
        !hasPasswordAuth &&
        (authUser?.app_metadata?.provider === "google" ||
          identities.some((id: { provider: string }) => id.provider === "google"));

      if (isOAuthOnly) {
        // Send email notice reminding user to sign in with Google
        await sendOAuthAccountNotification({
          email: cleanEmail,
          name: userProfile.full_name || undefined,
          provider: "Google",
        });

        return NextResponse.json({
          success: true,
          isOAuth: true,
          provider: "Google",
          message:
            "Your account is registered with Google Sign-In. We sent sign-in instructions to your email. Please use 'Continue with Google'.",
        });
      }
    } catch (_oauthCheckErr) {
      console.warn("[OAuth Check Warning]: Proceeding with standard OTP flow.");
    }

    // 4. Generate Cryptographically Secure 6-digit OTP and store directly in DB
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    await storeOtp(cleanEmail, rawOtp);

    // 5. Dispatch OTP code via Resend email service (Never logged to console)
    await sendPasswordResetOtp({ email: cleanEmail, otpCode: rawOtp });

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email address, a verification code has been sent.",
    });
  } catch (error: unknown) {
    console.error("[Forgot Password API Error]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "An unexpected error occurred.") },
      { status: 500 }
    );
  }
}
