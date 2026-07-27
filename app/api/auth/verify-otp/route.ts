import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { verifyOtpCode } from "@/lib/otp-store";
import crypto from "crypto";
import { getErrorMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json({ error: "Please enter the 6-digit verification OTP code." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // 1. Verify against memory store first
    const memResult = verifyOtpCode(cleanEmail, cleanOtp);
    if (memResult.success) {
      return NextResponse.json({
        success: true,
        resetToken: memResult.resetToken,
        message: "OTP verified successfully. Please set your new password.",
      });
    }

    if (memResult.error && !memResult.error.includes("No active OTP request")) {
      return NextResponse.json({ error: memResult.error }, { status: 400 });
    }

    // 2. Database Backup Check
    const adminSupabase = createAdminClient();
    const { data: record } = await adminSupabase
      .from("password_resets")
      .select("*")
      .eq("email", cleanEmail)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!record) {
      return NextResponse.json(
        { error: "No active OTP request found. Please request a new verification code." },
        { status: 400 }
      );
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This OTP code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    if (record.attempts >= 5) {
      return NextResponse.json(
        { error: "Maximum verification attempts exceeded. Please request a new code." },
        { status: 429 }
      );
    }

    const incomingHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
    if (incomingHash !== record.otp_hash) {
      const newAttempts = (record.attempts || 0) + 1;
      await adminSupabase
        .from("password_resets")
        .update({ attempts: newAttempts })
        .eq("id", record.id);

      const remaining = 5 - newAttempts;
      return NextResponse.json(
        { error: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code invalidated.'}` },
        { status: 400 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    await adminSupabase
      .from("password_resets")
      .update({ reset_token: resetToken })
      .eq("id", record.id);

    return NextResponse.json({
      success: true,
      resetToken,
      message: "OTP verified successfully. Please set your new password.",
    });
  } catch (error: unknown) {
    console.error("[Verify OTP API Error]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "An unexpected error occurred.") },
      { status: 500 }
    );
  }
}
