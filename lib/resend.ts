import { Resend } from "resend";

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Domain Subdomain Senders
export const EMAIL_SENDERS = {
  AUTH: "YMUTE Security <auth.noreply@ymute.com>",
  NOTIFICATIONS: "YMUTE Notifications <notifications.noreply@ymute.com>",
  BILLING: "YMUTE Billing <billing.noreply@ymute.com>",
} as const;

// 1. Password Reset OTP (Auth)
export async function sendPasswordResetOtp({
  email,
  otpCode,
}: {
  email: string;
  otpCode: string;
}) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: EMAIL_SENDERS.AUTH,
      to: email,
      subject: "Your YMUTE Password Reset Code 🔒",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;border:1px solid rgba(200,161,55,0.2);">
          <h2 style="color:#001F3F;margin-top:0;">Password Reset Request</h2>
          <p style="color:#1F3A5F;font-size:15px;">Use the verification code below to reset your password. This code will expire in 10 minutes.</p>
          <div style="background:#ffffff;padding:20px;border-radius:12px;text-align:center;margin:24px 0;border:1px solid #e2e8f0;">
            <span style="font-size:32px;font-weight:800;letter-spacing:6px;color:#c8a137;">${otpCode}</span>
          </div>
          <p style="color:#64748b;font-size:13px;">If you did not request a password reset, please ignore this email.</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;border-t:1px solid #e2e8f0;padding-top:16px;">© ${new Date().getFullYear()} YMUTE. All rights reserved.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Resend sendPasswordResetOtp Error]:", err);
  }
}

// 2. Account Welcome Email (Auth)
export async function sendWelcomeEmail({
  email,
  name,
  role,
}: {
  email: string;
  name: string;
  role: "caster" | "company";
}) {
  if (!resend) return;
  try {
    const targetUrl = role === "caster" ? "/explore-talent" : "/dashboard/company/post-job";
    const actionLabel = role === "caster" ? "Explore Opportunities" : "Post a Job";

    await resend.emails.send({
      from: EMAIL_SENDERS.AUTH,
      to: email,
      subject: "Welcome to YMUTE! 🎙️ Your Voice Deserves a Stage",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
          <h1 style="color:#001F3F;margin-top:0;">Welcome to YMUTE, ${name}! 🎙️</h1>
          <p style="color:#1F3A5F;font-size:16px;">Your account as a <strong>${role}</strong> has been created successfully.</p>
          <p style="color:#1F3A5F;">We're excited to have you on board.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ymute.com"}${targetUrl}" 
             style="display:inline-block;background:#c8a137;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            ${actionLabel}
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} YMUTE. All rights reserved.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Resend sendWelcomeEmail Error]:", err);
  }
}

// 3. Application Submitted (Applications / Info)
export async function sendApplicationSubmitted({
  casterEmail,
  casterName,
  jobTitle,
  companyName,
}: {
  casterEmail: string;
  casterName: string;
  jobTitle: string;
  companyName: string;
}) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: EMAIL_SENDERS.NOTIFICATIONS,
      to: casterEmail,
      subject: `Application Submitted – ${jobTitle}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
          <h1 style="color:#001F3F;margin-top:0;">Hi ${casterName}! 🎙️</h1>
          <p style="color:#1F3A5F;font-size:16px;">Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been submitted successfully.</p>
          <p style="color:#1F3A5F;">We'll notify you as soon as the company reviews your application.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ymute.com"}/dashboard/caster/applications" 
             style="display:inline-block;background:#c8a137;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            View My Applications
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} YMUTE. All rights reserved.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Resend sendApplicationSubmitted Error]:", err);
  }
}

// 4. Caster Hired (Hiring / Info)
export async function sendCasterHired({
  casterEmail,
  casterName,
  jobTitle,
  companyName,
}: {
  casterEmail: string;
  casterName: string;
  jobTitle: string;
  companyName: string;
}) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: EMAIL_SENDERS.NOTIFICATIONS,
      to: casterEmail,
      subject: `🎉 You've been hired for ${jobTitle}!`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
          <h1 style="color:#c8a137;margin-top:0;">Congratulations, ${casterName}! 🎙️</h1>
          <p style="color:#1F3A5F;font-size:16px;">You've been selected for <strong>${jobTitle}</strong> by <strong>${companyName}</strong>.</p>
          <p style="color:#1F3A5F;">The company will reach out to you with further details about the event.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ymute.com"}/dashboard/caster/applications" 
             style="display:inline-block;background:#c8a137;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            View My Dashboard
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} YMUTE. All rights reserved.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Resend sendCasterHired Error]:", err);
  }
}

// 5. Application Declined (Applications / Info)
export async function sendApplicationDeclined({
  casterEmail,
  casterName,
  jobTitle,
}: {
  casterEmail: string;
  casterName: string;
  jobTitle: string;
}) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: EMAIL_SENDERS.NOTIFICATIONS,
      to: casterEmail,
      subject: `Update on your application for ${jobTitle}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
          <h2 style="color:#001F3F;margin-top:0;">Hi ${casterName},</h2>
          <p style="color:#1F3A5F;font-size:15px;">Thank you for applying for <strong>${jobTitle}</strong>. The company has reviewed applications and moved forward with another candidate for this opportunity.</p>
          <p style="color:#1F3A5F;">Don't get discouraged! New casting opportunities are posted regularly.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ymute.com"}/jobs" 
             style="display:inline-block;background:#001F3F;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Explore Other Opportunities
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} YMUTE. All rights reserved.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Resend sendApplicationDeclined Error]:", err);
  }
}

// 6. Company Verification Approved (Auth / Account)
export async function sendVerificationApproved({
  companyEmail,
  companyName,
}: {
  companyEmail: string;
  companyName: string;
}) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: EMAIL_SENDERS.AUTH,
      to: companyEmail,
      subject: "Your company is now verified on YMUTE ✅",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
          <h1 style="color:#001F3F;margin-top:0;">Great news, ${companyName}! ✅</h1>
          <p style="color:#1F3A5F;font-size:16px;">Your company profile has been verified on YMUTE. You can now post jobs and hire top casting talent.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://ymute.com"}/dashboard/company" 
             style="display:inline-block;background:#c8a137;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Post Your First Job
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} YMUTE. All rights reserved.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Resend sendVerificationApproved Error]:", err);
  }
}

// 7. Payment Processed Receipt (Payments)
export async function sendPaymentReceipt({
  email,
  name,
  amount,
  jobTitle,
  transactionId,
}: {
  email: string;
  name: string;
  amount: string;
  jobTitle: string;
  transactionId: string;
}) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: EMAIL_SENDERS.BILLING,
      to: email,
      subject: `Payment Receipt: ${amount} for ${jobTitle} 💳`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
          <h2 style="color:#001F3F;margin-top:0;">Payment Receipt</h2>
          <p style="color:#1F3A5F;font-size:15px;">Hi ${name}, your payment for <strong>${jobTitle}</strong> has been processed successfully.</p>
          <div style="background:#ffffff;padding:20px;border-radius:12px;margin:20px 0;border:1px solid #e2e8f0;">
            <p style="margin:4px 0;color:#64748b;font-size:13px;">Amount: <strong style="color:#001F3F;font-size:16px;">${amount}</strong></p>
            <p style="margin:4px 0;color:#64748b;font-size:13px;">Transaction ID: <code style="color:#c8a137;">${transactionId}</code></p>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">© ${new Date().getFullYear()} YMUTE. All rights reserved.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Resend sendPaymentReceipt Error]:", err);
  }
}
