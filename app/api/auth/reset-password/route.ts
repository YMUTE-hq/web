import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { validateResetToken, consumeResetToken } from "@/lib/otp-store";
import { getErrorMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { email, resetToken, newPassword } = await req.json();

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json({ error: "Missing required reset details." }, { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminSupabase = createAdminClient();

    // 1. Validate reset session against database
    const validation = await validateResetToken(cleanEmail, resetToken);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid or expired password reset session. Please request a new verification code." },
        { status: 400 }
      );
    }

    // 2. Fetch user profile
    const { data: userProfile } = await adminSupabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // 3. Update password via Supabase Admin Auth
    const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(
      userProfile.id,
      { password: newPassword }
    );

    if (updateErr) {
      console.error("[Reset Password] Admin update error:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 4. Mark reset token as consumed
    await consumeResetToken(cleanEmail, resetToken);

    return NextResponse.json({
      success: true,
      message: "Your password has been updated successfully. You can now log in.",
    });
  } catch (error: unknown) {
    console.error("[Reset Password API Error]:", error);
    return NextResponse.json(
      { error: getErrorMessage(error, "An unexpected error occurred.") },
      { status: 500 }
    );
  }
}
