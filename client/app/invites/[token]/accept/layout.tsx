import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept Invite",
  description: "Accept a trip invitation and join the group.",
};

export default function AcceptInviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
