import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trip Invite",
};

export default function InvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream">
      <div className="brutal-card rounded-lg p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold font-display mb-4">
          Trip Invitation
        </h1>
        <p className="text-muted-foreground font-body mb-6">
          You have been invited to join a trip. Accept or decline the invitation
          below.
        </p>
        <div className="flex gap-4 justify-center">
          <button className="brutal-button bg-brand-mint px-6 py-3 rounded-md text-sm">
            Accept
          </button>
          <button className="brutal-button bg-brand-coral px-6 py-3 rounded-md text-sm">
            Decline
          </button>
        </div>
      </div>
    </main>
  );
}
