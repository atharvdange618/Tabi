import type { Metadata } from "next";
import InviteActions from "../../../components/shared/InviteActions";
import { Mail, MapPin, Users, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Trip Invite",
};

export default function InvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-cream p-6">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in-up">
        <div className="brutal-card rounded-2xl p-8 md:p-10 bg-white relative overflow-hidden">
          <div className="absolute top-4 right-4 text-6xl md:text-8xl opacity-5 font-kanji select-none pointer-events-none">
            旅
          </div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-blue rounded-full opacity-10 blur-2xl" />
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-mint rounded-full opacity-10 blur-2xl" />

          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-brand-blue rounded-2xl border-2 border-brutal-border flex items-center justify-center mb-6 shadow-[6px_6px_0px_theme(--color-brutal-shadow)] mx-auto -rotate-3">
              <Mail size={32} strokeWidth={2} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-display mb-3 text-foreground">
              You&apos;re Invited!
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-md mx-auto">
              Someone wants you to join their trip on Tabi. Accept the
              invitation to start collaborating on this adventure.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="brutal-card bg-white p-5 rounded-xl text-center hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-brand-peach rounded-lg border-2 border-brutal-border shadow-[3px_3px_0px_theme(--color-brutal-shadow)] flex items-center justify-center mx-auto mb-3">
              <Calendar size={24} strokeWidth={2} />
            </div>
            <h3 className="font-bold font-display text-sm mb-1">
              Plan Together
            </h3>
            <p className="text-xs text-muted-foreground font-body">
              Build itineraries as a team
            </p>
          </div>
          <div className="brutal-card bg-white p-5 rounded-xl text-center hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-brand-mint rounded-lg border-2 border-brutal-border shadow-[3px_3px_0px_theme(--color-brutal-shadow)] flex items-center justify-center mx-auto mb-3">
              <Users size={24} strokeWidth={2} />
            </div>
            <h3 className="font-bold font-display text-sm mb-1">Collaborate</h3>
            <p className="text-xs text-muted-foreground font-body">
              Share tasks and expenses
            </p>
          </div>
          <div className="brutal-card bg-white p-5 rounded-xl text-center hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-brand-lemon rounded-lg border-2 border-brutal-border shadow-[3px_3px_0px_theme(--color-brutal-shadow)] flex items-center justify-center mx-auto mb-3">
              <MapPin size={24} strokeWidth={2} />
            </div>
            <h3 className="font-bold font-display text-sm mb-1">Track</h3>
            <p className="text-xs text-muted-foreground font-body">
              Stay organized together
            </p>
          </div>
        </div>

        <div className="brutal-card rounded-2xl p-8 bg-white">
          <InviteActions />
        </div>

        <p className="text-center text-sm text-muted-foreground font-body">
          By accepting, you&apos;ll be added as a member of this trip.
        </p>
      </div>
    </main>
  );
}
