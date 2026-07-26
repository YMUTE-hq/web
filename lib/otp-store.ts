import crypto from "crypto";

interface OtpRecord {
  email: string;
  otpHash: string;
  resetToken?: string;
  expiresAt: number;
  attempts: number;
  used: boolean;
  createdAt: number;
}

// In-Memory Global Store for Bulletproof OTP session persistence across requests
const globalOtpStore = new Map<string, OtpRecord>();

export function storeOtp(email: string, rawOtp: string): { otpHash: string; expiresAt: Date } {
  const cleanEmail = email.toLowerCase().trim();
  const otpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
  const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes

  globalOtpStore.set(cleanEmail, {
    email: cleanEmail,
    otpHash,
    expiresAt: expiresAtMs,
    attempts: 0,
    used: false,
    createdAt: Date.now(),
  });

  return { otpHash, expiresAt: new Date(expiresAtMs) };
}

export function verifyOtpCode(email: string, rawOtp: string): { success: boolean; error?: string; resetToken?: string } {
  const cleanEmail = email.toLowerCase().trim();
  const record = globalOtpStore.get(cleanEmail);

  if (!record || record.used) {
    return { success: false, error: "No active OTP request found for this email. Please request a new verification code." };
  }

  if (Date.now() > record.expiresAt) {
    globalOtpStore.delete(cleanEmail);
    return { success: false, error: "This OTP code has expired. Please request a new code." };
  }

  if (record.attempts >= 5) {
    globalOtpStore.delete(cleanEmail);
    return { success: false, error: "Maximum verification attempts exceeded. Please request a new code." };
  }

  const incomingHash = crypto.createHash("sha256").update(rawOtp.trim()).digest("hex");
  if (incomingHash !== record.otpHash) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    return {
      success: false,
      error: `Invalid OTP code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Code invalidated."}`,
    };
  }

  // Generate One-Time Reset Token
  const resetToken = crypto.randomBytes(32).toString("hex");
  record.resetToken = resetToken;

  return { success: true, resetToken };
}

export function validateResetToken(email: string, resetToken: string): { valid: boolean; error?: string } {
  const cleanEmail = email.toLowerCase().trim();
  const record = globalOtpStore.get(cleanEmail);

  if (!record || record.used || !record.resetToken) {
    return { valid: false, error: "Invalid or expired password reset session. Please request a new OTP." };
  }

  if (record.resetToken !== resetToken) {
    return { valid: false, error: "Invalid password reset token." };
  }

  if (Date.now() > record.expiresAt) {
    globalOtpStore.delete(cleanEmail);
    return { valid: false, error: "Reset session expired. Please request a new OTP." };
  }

  return { valid: true };
}

export function consumeResetToken(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  const record = globalOtpStore.get(cleanEmail);
  if (record) {
    record.used = true;
    globalOtpStore.delete(cleanEmail);
  }
}
