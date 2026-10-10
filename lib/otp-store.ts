import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase-server";

/**
 * Stores a hashed OTP in public.password_resets with a 10-minute expiry.
 * Invalidates any prior active OTPs for the same email.
 */
export async function storeOtp(
  email: string,
  rawOtp: string
): Promise<{ otpHash: string; expiresAt: Date }> {
  const cleanEmail = email.toLowerCase().trim();
  const otpHash = crypto.createHash("sha256").update(rawOtp.trim()).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const supabase = createAdminClient();

  // Invalidate any existing unused OTPs for this email
  await supabase
    .from("password_resets")
    .update({ used: true })
    .eq("email", cleanEmail)
    .eq("used", false);

  // Insert fresh OTP record into database
  const { error } = await supabase.from("password_resets").insert({
    email: cleanEmail,
    otp_hash: otpHash,
    expires_at: expiresAt.toISOString(),
    used: false,
    attempts: 0,
  });

  if (error) {
    console.error("[OTP Store Error] Failed to persist OTP to DB:", error.message);
    throw new Error("Failed to store verification code. Please try again.");
  }

  return { otpHash, expiresAt };
}

/**
 * Verifies a supplied OTP against the database record, enforcing expiration and attempt limits.
 * On success, generates a 32-byte cryptographic reset token.
 */
export async function verifyOtpCode(
  email: string,
  rawOtp: string
): Promise<{ success: boolean; error?: string; resetToken?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const incomingHash = crypto.createHash("sha256").update(rawOtp.trim()).digest("hex");
  const supabase = createAdminClient();

  // 1. Primary: Atomic PostgreSQL Verification via RPC (eliminates TOCTOU race conditions)
  try {
    const { data, error } = await supabase.rpc("verify_and_increment_otp_attempt", {
      p_email: cleanEmail,
      p_otp_hash: incomingHash,
      p_max_attempts: 5,
    });

    if (!error && data) {
      if (data.status === "MATCH") {
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetHash = crypto.createHash("sha256").update(resetToken).digest("hex");
        const resetExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const { error: tokErr } = await supabase
          .from("password_resets")
          .update({ reset_token: resetHash, expires_at: resetExpiresAt })
          .eq("id", data.id);
        if (tokErr) {
          console.error("[OTP] reset token store failed:", tokErr.message);
          return { success: false, error: "Failed to generate reset session. Please try again." };
        }
        return { success: true, resetToken };
      }

      if (data.status === "EXPIRED") {
        return { success: false, error: "This verification code has expired. Please request a new code." };
      }

      if (data.status === "MAX_ATTEMPTS_EXCEEDED") {
        return { success: false, error: "Maximum verification attempts exceeded. Please request a new code." };
      }

      if (data.status === "MISMATCH") {
        const remaining = typeof data.remaining === "number" ? data.remaining : 0;
        return {
          success: false,
          error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Code invalidated."}`,
        };
      }

      if (data.status === "NOT_FOUND") {
        return {
          success: false,
          error: "No active verification request found for this email. Please request a new code.",
        };
      }
    }
  } catch (_rpcErr) {
    // Fallback if RPC is refreshing or unavailable
  }

  // 2. Direct DB Fallback with attempt limit guard
  const { data: record, error } = await supabase
    .from("password_resets")
    .select("*")
    .eq("email", cleanEmail)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !record) {
    return {
      success: false,
      error: "No active verification request found for this email. Please request a new code.",
    };
  }

  // Check expiration
  if (new Date(record.expires_at).getTime() < Date.now()) {
    await supabase.from("password_resets").update({ used: true }).eq("id", record.id);
    return {
      success: false,
      error: "This verification code has expired. Please request a new code.",
    };
  }

  // Check max attempts
  if ((record.attempts || 0) >= 5) {
    await supabase.from("password_resets").update({ used: true }).eq("id", record.id);
    return {
      success: false,
      error: "Maximum verification attempts exceeded. Please request a new code.",
    };
  }

  // Verify hash — constant-time compare to avoid timing oracle
  const a = Buffer.from(incomingHash, "hex");
  const b = Buffer.from(String(record.otp_hash), "hex");
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!match) {
    const newAttempts = (record.attempts || 0) + 1;
    await supabase
      .from("password_resets")
      .update({ attempts: newAttempts, used: newAttempts >= 5 })
      .eq("id", record.id);

    const remaining = 5 - newAttempts;
    return {
      success: false,
      error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Code invalidated."}`,
    };
  }

  // Generate One-Time Cryptographic Reset Token (store only sha256 hash)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetHash = crypto.createHash("sha256").update(resetToken).digest("hex");
  const resetExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { error: updateError } = await supabase
    .from("password_resets")
    .update({ reset_token: resetHash, expires_at: resetExpiresAt })
    .eq("id", record.id);

  if (updateError) {
    console.error("[OTP Store Error] Failed to store reset token:", updateError.message);
    return { success: false, error: "Failed to generate reset session. Please try again." };
  }

  return { success: true, resetToken };
}

/**
 * Validates whether a reset token is valid and unexpired.
 */
export async function validateResetToken(
  email: string,
  resetToken: string
): Promise<{ valid: boolean; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const supabase = createAdminClient();
  const tokenHash = crypto.createHash("sha256").update(String(resetToken)).digest("hex");

  const { data: record, error } = await supabase
    .from("password_resets")
    .select("*")
    .eq("email", cleanEmail)
    .eq("reset_token", tokenHash)
    .eq("used", false)
    .maybeSingle();

  if (error || !record) {
    return {
      valid: false,
      error: "Invalid or expired password reset session. Please request a new verification code.",
    };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await supabase.from("password_resets").update({ used: true }).eq("id", record.id);
    return {
      valid: false,
      error: "Password reset session has expired. Please request a new verification code.",
    };
  }

  return { valid: true };
}

/**
 * Consumes the reset token upon successful password update to prevent reuse.
 */
export async function consumeResetToken(email: string, resetToken: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const supabase = createAdminClient();
  const tokenHash = crypto.createHash("sha256").update(String(resetToken)).digest("hex");

  await supabase
    .from("password_resets")
    .update({ used: true })
    .eq("email", cleanEmail)
    .eq("reset_token", tokenHash);
}
