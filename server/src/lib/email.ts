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

  const subject = `${inviterName} invited you to "${tripTitle}" on Tabi`;

  const html = `
  <!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <noscript>
      <xml
        ><o:OfficeDocumentSettings
          ><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings
        ></xml
      >
    </noscript>
    <style>
      @media (prefers-color-scheme: dark) {
        .page-bg {
          background-color: #0d0d0d !important;
        }
        .card-outer {
          background-color: #0d0d0d !important;
        }
        .card {
          background-color: #1a1a1a !important;
          border-color: #333333 !important;
          box-shadow: 4px 4px 0px #93cdff !important;
        }
        .logo-mark {
          background-color: #93cdff !important;
          border-color: #93cdff !important;
        }
        .kanji {
          color: #0d0d0d !important;
        }
        .wordmark {
          color: #fafaf8 !important;
        }
        .tag {
          background-color: #93cdff !important;
          color: #0d0d0d !important;
          border-color: #93cdff !important;
        }
        .headline {
          color: #fafaf8 !important;
        }
        .body-text {
          color: #9ca3af !important;
        }
        .trip-pill {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }
        .trip-name {
          color: #fafaf8 !important;
        }
        .trip-meta {
          color: #6b7280 !important;
        }
        .divider {
          border-color: #2d2d2d !important;
        }
        .btn-accept {
          background-color: #93cdff !important;
          color: #0d0d0d !important;
          border-color: #93cdff !important;
          box-shadow: 3px 3px 0px rgba(147, 205, 255, 0.4) !important;
        }
        .btn-decline {
          background-color: #1f1f1f !important;
          color: #6b7280 !important;
          border-color: #333333 !important;
          box-shadow: 3px 3px 0px #0d0d0d !important;
        }
        .note {
          color: #4b5563 !important;
        }
        .footer-bg {
          background-color: #111111 !important;
          border-color: #1f1f1f !important;
        }
        .footer-text {
          color: #374151 !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: #fafaf8">
    <table
      class="page-bg"
      role="presentation"
      cellspacing="0"
      cellpadding="0"
      border="0"
      width="100%"
      style="background-color: #fafaf8; padding: 48px 16px"
    >
      <tr>
        <td align="center">
          <table
            class="card"
            role="presentation"
            cellspacing="0"
            cellpadding="0"
            border="0"
            width="100%"
            style="
              max-width: 560px;
              background-color: #ffffff;
              border: 2px solid #1a1a1a;
              border-radius: 16px;
              box-shadow: 6px 6px 0px #1a1a1a;
              overflow: hidden;
            "
          >
            <tr>
              <td
                style="
                  background-color: #93cdff;
                  height: 6px;
                  line-height: 6px;
                  font-size: 6px;
                "
              >
                &nbsp;
              </td>
            </tr>

            <tr>
              <td style="padding: 36px 40px 32px">
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                  style="margin-bottom: 32px"
                >
                  <tr>
                    <td>
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="display: inline-table"
                      >
                        <tr>
                          <td
                            class="logo-mark"
                            style="
                              background-color: #93cdff;
                              border: 2px solid #1a1a1a;
                              border-radius: 8px;
                              box-shadow: 3px 3px 0px #1a1a1a;
                              width: 36px;
                              height: 36px;
                              text-align: center;
                              vertical-align: middle;
                              padding: 0;
                            "
                          >
                            <span
                              class="kanji"
                              style="
                                font-family:
                                  &quot;Hiragino Sans&quot;,
                                  &quot;Yu Gothic&quot;,
                                  &quot;Noto Sans JP&quot;, sans-serif;
                                font-size: 18px;
                                color: #111111;
                                line-height: 36px;
                                display: block;
                              "
                              >旅</span
                            >
                          </td>
                          <td
                            style="padding-left: 10px; vertical-align: middle"
                          >
                            <span
                              class="wordmark"
                              style="
                                font-family:
                                  -apple-system, BlinkMacSystemFont,
                                  &quot;Helvetica Neue&quot;, Arial, sans-serif;
                                font-size: 20px;
                                font-weight: 800;
                                color: #111111;
                                letter-spacing: -0.03em;
                              "
                              >tabi</span
                            >
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" valign="middle">
                      <span
                        class="tag"
                        style="
                          display: inline-block;
                          background-color: #fff3b0;
                          border: 1.5px solid #1a1a1a;
                          border-radius: 999px;
                          padding: 4px 12px;
                          font-family:
                            -apple-system, BlinkMacSystemFont,
                            &quot;Helvetica Neue&quot;, Arial, sans-serif;
                          font-size: 11px;
                          font-weight: 700;
                          color: #111111;
                        "
                        >Trip invite ✈️</span
                      >
                    </td>
                  </tr>
                </table>

                <h1
                  class="headline"
                  style="
                    font-family:
                      -apple-system, BlinkMacSystemFont,
                      &quot;Helvetica Neue&quot;, Arial, sans-serif;
                    font-size: 28px;
                    font-weight: 800;
                    color: #111111;
                    margin: 0 0 12px;
                    letter-spacing: -0.03em;
                    line-height: 1.15;
                    text-transform: uppercase;
                  "
                >
                  You're invited<br />to join a trip.
                </h1>

                <p
                  class="body-text"
                  style="
                    font-family:
                      -apple-system, BlinkMacSystemFont,
                      &quot;Helvetica Neue&quot;, Arial, sans-serif;
                    font-size: 15px;
                    color: #6b7280;
                    line-height: 1.65;
                    margin: 0 0 28px;
                    font-weight: 500;
                  "
                >
                  <strong style="color: #111111; font-weight: 700"
                    >${inviterName}</strong
                  >
                  wants you on the team for an upcoming trip. Jump in, help plan
                  the itinerary, split expenses, and actually know what's going
                  on.
                </p>

                <table
                  class="trip-pill"
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                  style="
                    background-color: #fafaf8;
                    border: 2px solid #1a1a1a;
                    border-radius: 12px;
                    margin-bottom: 32px;
                    overflow: hidden;
                  "
                >
                  <tr>
                    <td style="background-color: #93cdff; width: 5px">
                      &nbsp;
                    </td>
                    <td style="padding: 16px 20px">
                      <p
                        style="
                          font-family:
                            -apple-system, BlinkMacSystemFont,
                            &quot;Helvetica Neue&quot;, Arial, sans-serif;
                          font-size: 11px;
                          font-weight: 700;
                          color: #9ca3af;
                          text-transform: uppercase;
                          letter-spacing: 0.1em;
                          margin: 0 0 4px;
                        "
                      >
                        Trip
                      </p>
                      <p
                        class="trip-name"
                        style="
                          font-family:
                            -apple-system, BlinkMacSystemFont,
                            &quot;Helvetica Neue&quot;, Arial, sans-serif;
                          font-size: 18px;
                          font-weight: 800;
                          color: #111111;
                          margin: 0 0 4px;
                          letter-spacing: -0.02em;
                        "
                      >
                        ${tripTitle}
                      </p>
                      <p
                        class="trip-meta"
                        style="
                          font-family:
                            -apple-system, BlinkMacSystemFont,
                            &quot;Helvetica Neue&quot;, Arial, sans-serif;
                          font-size: 12px;
                          font-weight: 600;
                          color: #9ca3af;
                          margin: 0;
                        "
                      >
                        Invited by ${inviterName}
                      </p>
                    </td>
                  </tr>
                </table>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                >
                  <tr>
                    <td style="padding-right: 10px">
                      <a
                        class="btn-accept"
                        href="${acceptUrl}"
                        style="
                          display: inline-block;
                          background-color: #93cdff;
                          color: #111111;
                          text-decoration: none;
                          font-family:
                            -apple-system, BlinkMacSystemFont,
                            &quot;Helvetica Neue&quot;, Arial, sans-serif;
                          font-size: 14px;
                          font-weight: 700;
                          padding: 12px 24px;
                          border-radius: 10px;
                          border: 2px solid #1a1a1a;
                          box-shadow: 4px 4px 0px #1a1a1a;
                          letter-spacing: -0.01em;
                        "
                        >Accept invite →</a
                      >
                    </td>
                    <td>
                      <a
                        class="btn-decline"
                        href="${declineUrl}"
                        style="
                          display: inline-block;
                          background-color: #ffffff;
                          color: #6b7280;
                          text-decoration: none;
                          font-family:
                            -apple-system, BlinkMacSystemFont,
                            &quot;Helvetica Neue&quot;, Arial, sans-serif;
                          font-size: 14px;
                          font-weight: 700;
                          padding: 12px 24px;
                          border-radius: 10px;
                          border: 2px solid #1a1a1a;
                          box-shadow: 4px 4px 0px #1a1a1a;
                          letter-spacing: -0.01em;
                        "
                        >Decline</a
                      >
                    </td>
                  </tr>
                </table>

                <hr
                  class="divider"
                  style="
                    border: none;
                    border-top: 2px dashed #e5e7eb;
                    margin: 32px 0 24px;
                  "
                />

                <p
                  class="note"
                  style="
                    font-family:
                      -apple-system, BlinkMacSystemFont,
                      &quot;Helvetica Neue&quot;, Arial, sans-serif;
                    font-size: 12px;
                    color: #9ca3af;
                    line-height: 1.6;
                    margin: 0;
                    font-weight: 500;
                  "
                >
                  This invite expires in
                  <strong style="color: #6b7280">7 days</strong>. If you didn't
                  expect this, ignore it nothing will happen. Buttons not
                  working? Copy this link into your browser:<br />
                  <span
                    style="
                      font-family:
                        &quot;SF Mono&quot;, &quot;Fira Code&quot;,
                        &quot;Consolas&quot;, monospace;
                      font-size: 11px;
                      color: #9ca3af;
                      word-break: break-all;
                    "
                    >${acceptUrl}</span
                  >
                </p>
              </td>
            </tr>

            <tr>
              <td
                class="footer-bg"
                style="
                  background-color: #fafaf8;
                  border-top: 2px solid #e5e7eb;
                  padding: 20px 40px;
                "
              >
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  width="100%"
                >
                  <tr>
                    <td>
                      <p
                        class="footer-text"
                        style="
                          font-family:
                            -apple-system, BlinkMacSystemFont,
                            &quot;Helvetica Neue&quot;, Arial, sans-serif;
                          font-size: 12px;
                          color: #9ca3af;
                          margin: 0;
                          font-weight: 500;
                        "
                      >
                        © ${new Date().getFullYear()} Tabi &nbsp;·&nbsp;
                        <a
                          href="${baseUrl}/privacy"
                          style="
                            color: #9ca3af;
                            text-decoration: none;
                            font-weight: 700;
                          "
                          >Privacy</a
                        >
                        &nbsp;·&nbsp;
                        <a
                          href="${baseUrl}/terms"
                          style="
                            color: #9ca3af;
                            text-decoration: none;
                            font-weight: 700;
                          "
                          >Terms</a
                        >
                      </p>
                    </td>
                    <td align="right">
                      <span
                        style="
                          font-family:
                            &quot;Hiragino Sans&quot;, &quot;Yu Gothic&quot;,
                            &quot;Noto Sans JP&quot;, sans-serif;
                          font-size: 18px;
                          color: #d1d5db;
                        "
                        >旅</span
                      >
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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
