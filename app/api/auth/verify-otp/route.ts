import { NextRequest, NextResponse } from "next/server";
import { verifyOtpCode } from "@/lib/otp-store";
import { getErrorMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: "Please enter the 6-digit verification OTP code." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Verify against single source of truth in database
    const result = await verifyOtpCode(cleanEmail, cleanOtp);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Verification failed. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      resetToken: result.resetToken,
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
