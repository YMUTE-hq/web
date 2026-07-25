import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

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
  await resend.emails.send({
    from: "YMUTE <noreply@ymute.com>",
    to: casterEmail,
    subject: `Application Submitted – ${jobTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
        <h1 style="color:#001F3F;">Hi ${casterName}! 🎙️</h1>
        <p style="color:#1F3A5F;font-size:16px;">Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been submitted successfully.</p>
        <p style="color:#1F3A5F;">We'll notify you as soon as the company reviews your application.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/caster/applications" 
           style="display:inline-block;background:#c8a137;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
          View My Applications
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px;">© 2024 YMUTE. All rights reserved.</p>
      </div>
    `,
  });
}

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
  await resend.emails.send({
    from: "YMUTE <noreply@ymute.com>",
    to: casterEmail,
    subject: `🎉 You've been hired for ${jobTitle}!`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
        <h1 style="color:#c8a137;">Congratulations, ${casterName}! 🎙️</h1>
        <p style="color:#1F3A5F;font-size:16px;">You've been selected for <strong>${jobTitle}</strong> by <strong>${companyName}</strong>.</p>
        <p style="color:#1F3A5F;">The company will reach out to you with further details about the event.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/caster/applications" 
           style="display:inline-block;background:#c8a137;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
          View My Dashboard
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px;">© 2024 YMUTE. All rights reserved.</p>
      </div>
    `,
  });
}

export async function sendVerificationApproved({
  companyEmail,
  companyName,
}: {
  companyEmail: string;
  companyName: string;
}) {
  await resend.emails.send({
    from: "YMUTE <noreply@ymute.com>",
    to: companyEmail,
    subject: "Your company is now verified on YMUTE ✅",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fdfcf0;padding:40px;border-radius:16px;">
        <h1 style="color:#001F3F;">Great news, ${companyName}! ✅</h1>
        <p style="color:#1F3A5F;font-size:16px;">Your company profile has been verified on YMUTE. You can now post jobs and hire top casting talent.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/company" 
           style="display:inline-block;background:#c8a137;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px;">
          Post Your First Job
        </a>
        <p style="color:#999;font-size:12px;margin-top:24px;">© 2024 YMUTE. All rights reserved.</p>
      </div>
    `,
  });
}
