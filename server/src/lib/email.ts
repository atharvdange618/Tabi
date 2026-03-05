import { Resend } from "resend";
import logger from "./logger.ts";
import { env } from "./env.ts";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const FROM_ADDRESS = "Tabi <noreply@tabi.hogyoku.cloud>";

/**
 * Send a trip invitation email with accept/decline links.
 * In test/dev environments without RESEND_API_KEY, logs instead of sending.
 */
export async function sendInviteEmail(
  to: string,
  inviterName: string,
  tripTitle: string,
  token: string,
): Promise<void> {
  const baseUrl = env.CLIENT_URL || "http://localhost:3000";
  const acceptUrl = `${baseUrl}/invites/${token}/accept`;
  const declineUrl = `${baseUrl}/invites/${token}/decline`;

  const subject = `${inviterName} invited you to join "${tripTitle}" on Tabi`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    @media (prefers-color-scheme: dark) {
      .wrapper   { background-color: #111118 !important; }
      .card      { background-color: #1e1e2e !important; border-color: #2e2e42 !important; }
      .title     { color: #f0f0f5 !important; }
      .body-text { color: #b4b4c8 !important; }
      .body-text strong { color: #e0e0f0 !important; }
      .btn-decline { background-color: #2e2e42 !important; color: #d1d5db !important; }
      .footer-text { color: #6b7280 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f8;">
  <div class="wrapper" style="background-color: #f4f4f8; padding: 40px 16px;">
    <div class="card" style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 520px;
      margin: 0 auto;
      padding: 40px 32px;
      background-color: #ffffff;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
    ">
      <h2 class="title" style="margin: 0 0 16px; color: #1a1a1a; font-size: 22px; font-weight: 700;">
        You're invited!
      </h2>
      <p class="body-text" style="color: #4a4a4a; line-height: 1.6; margin: 0 0 28px; font-size: 15px;">
        <strong>${inviterName}</strong> has invited you to collaborate on the trip
        <strong>"${tripTitle}"</strong>.
      </p>
      <div style="margin: 0 0 32px;">
        <a href="${acceptUrl}"
           style="display: inline-block; padding: 12px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 12px; font-size: 15px;">
          Accept Invite
        </a>
        <a href="${declineUrl}"
           class="btn-decline"
           style="display: inline-block; padding: 12px 28px; background-color: #e5e7eb; color: #374151; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Decline
        </a>
      </div>
      <p class="footer-text" style="color: #9ca3af; font-size: 13px; margin: 0; line-height: 1.5;">
        This invite expires in 7 days. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
  </div>
</body>
</html>`;

  if (!resend) {
    logger.info("Invite email (no Resend key, logging only)", {
      to,
      subject,
      acceptUrl,
      declineUrl,
    });
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  });

  if (error) {
    logger.error("Failed to send invite email", { error, to });
    throw new Error(`Failed to send invite email: ${error.message}`);
  }

  logger.info("Invite email sent", { to, subject });
}
