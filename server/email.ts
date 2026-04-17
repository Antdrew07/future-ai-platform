import nodemailer from "nodemailer";

// ─── Email Transport ──────────────────────────────────────────────────────────
// If SMTP_HOST is configured, use real SMTP. Otherwise, log to console (dev mode).
function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Dev fallback: Ethereal test account or console logging
  return null;
}

const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Future AI";
const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@futureai.app";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const transport = createTransport();

  if (!transport) {
    // Dev mode: log to console so the reset link is still accessible
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧  EMAIL (dev mode — no SMTP configured)`);
    console.log(`To:      ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(`Body:\n${opts.text}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  await transport.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}

// ─── Password Reset Email Template ───────────────────────────────────────────
export function buildPasswordResetEmail(opts: {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = "Reset your Future AI password";

  const text = `
Hi ${opts.name},

You requested a password reset for your Future AI account.

Click the link below to set a new password (expires in ${opts.expiresInMinutes} minutes):

${opts.resetUrl}

If you didn't request this, you can safely ignore this email — your password won't change.

— The Future AI Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7B2FFF 0%,#3B4FFF 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Future AI</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Password Reset</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:16px;font-weight:600;">Hi ${opts.name},</p>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
                You requested a password reset for your Future AI account. Click the button below to set a new password.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${opts.resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#7B2FFF 0%,#3B4FFF 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 8px;color:#888;font-size:13px;text-align:center;">
                This link expires in <strong>${opts.expiresInMinutes} minutes</strong>.
              </p>
              <p style="margin:0 0 24px;color:#888;font-size:13px;text-align:center;">
                If the button doesn't work, copy and paste this URL into your browser:
              </p>
              <p style="margin:0 0 24px;background:#f8f8ff;border:1px solid #e8e0ff;border-radius:6px;padding:12px;font-size:12px;color:#7B2FFF;word-break:break-all;text-align:center;">
                ${opts.resetUrl}
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
              <p style="margin:0;color:#aaa;font-size:12px;text-align:center;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#bbb;font-size:12px;">© 2026 Future AI. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return { subject, html, text };
}
