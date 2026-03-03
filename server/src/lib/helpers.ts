import type { ClerkUserPayload } from "../../../shared/types/index.ts";

export function getPrimaryEmail(payload: ClerkUserPayload): string {
  const primary = payload.email_addresses.find(
    (e) => e.id === payload.primary_email_address_id,
  );
  return (
    primary?.email_address ?? payload.email_addresses[0]?.email_address ?? ""
  );
}

export function getFullName(payload: ClerkUserPayload): string {
  const parts = [payload.first_name, payload.last_name].filter(Boolean);
  return parts.join(" ") || "Unknown";
}
