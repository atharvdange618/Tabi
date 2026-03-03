import type { ClerkUserPayload } from "../../../shared/types/index.ts";

/**
 * Extracts the primary email address from a Clerk user payload.
 */
export function getPrimaryEmail(payload: ClerkUserPayload): string {
  const primary = payload.email_addresses.find(
    (e) => e.id === payload.primary_email_address_id,
  );
  return (
    primary?.email_address ?? payload.email_addresses[0]?.email_address ?? ""
  );
}

/**
 * Builds a full display name from a Clerk user payload.
 */
export function getFullName(payload: ClerkUserPayload): string {
  const parts = [payload.first_name, payload.last_name].filter(Boolean);
  return parts.join(" ") || "Unknown";
}

/**
 * Returns an array of UTC-midnight `Date` objects for every calendar day in
 * the closed interval `[start, end]`.
 *
 * Both `start` and `end` are normalised to `00:00:00.000 UTC` before
 * iteration so that timezone offsets in the inputs do not affect which days
 * are included. The returned dates are also set to UTC midnight.
 */
export function getDatesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setUTCHours(0, 0, 0, 0);

  while (current <= last) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Converts a `Date` to a stable `YYYY-MM-DD` string key.
 */
export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
