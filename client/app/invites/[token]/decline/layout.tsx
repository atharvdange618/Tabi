import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Decline Invite",
  description: "Decline a trip invitation.",
};

export default function DeclineInviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
