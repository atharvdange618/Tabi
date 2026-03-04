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

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="margin: 0 0 16px; color: #1a1a1a;">You're invited!</h2>
      <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 24px;">
        <strong>${inviterName}</strong> has invited you to collaborate on the trip
        <strong>"${tripTitle}"</strong>.
      </p>
      <div style="margin: 24px 0;">
        <a href="${acceptUrl}"
           style="display: inline-block; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 12px;">
          Accept Invite
        </a>
        <a href="${declineUrl}"
           style="display: inline-block; padding: 12px 28px; background: #e5e7eb; color: #374151; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Decline
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0;">
        This invite expires in 7 days. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
  `;

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
