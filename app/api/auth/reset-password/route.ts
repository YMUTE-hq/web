import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { validateResetToken, consumeResetToken } from "@/lib/otp-store";

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

    // 1. Verify Reset Token against Memory Store
    const memValidation = validateResetToken(cleanEmail, resetToken);
    let tokenIsValid = memValidation.valid;

    // 2. If memory validation failed, check DB backup
    if (!tokenIsValid) {
      const { data: record } = await adminSupabase
        .from("password_resets")
        .select("*")
        .eq("email", cleanEmail)
        .eq("reset_token", resetToken)
        .eq("used", false)
        .maybeSingle();

      if (record && new Date(record.expires_at).getTime() >= Date.now()) {
        tokenIsValid = true;
        // Invalidate DB record
        await adminSupabase.from("password_resets").update({ used: true }).eq("id", record.id);
      }
    }

    if (!tokenIsValid) {
      return NextResponse.json(
        { error: memValidation.error || "Invalid or expired password reset session. Please request a new OTP." },
        { status: 400 }
      );
    }

    // 3. Find User ID in users table
    const { data: userProfile } = await adminSupabase
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // 4. Update Password in Supabase Auth via Admin Client
    const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(
      userProfile.id,
      { password: newPassword }
    );

    if (updateErr) {
      console.error("[Reset Password] Admin update error:", updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Consume Memory Token
    consumeResetToken(cleanEmail);

    return NextResponse.json({
      success: true,
      message: "Your password has been updated successfully. You can now log in.",
    });
  } catch (error: any) {
    console.error("[Reset Password API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
