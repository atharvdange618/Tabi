import type { Metadata } from "next";
import DashboardContent from "../../components/trips/DashboardContent";
import CreateTripDialog from "../../components/trips/CreateTripDialog";
import { Compass, Map } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName || "Traveler";

  return (
    <main className="min-h-screen bg-brand-cream p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        {/* Hero Section - Redesigned */}
        <div className="relative">
          <div className="brutal-card bg-white rounded-2xl p-8 md:p-10 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 text-6xl md:text-8xl opacity-5 font-kanji select-none pointer-events-none">
              旅
            </div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-mint rounded-full opacity-10 blur-2xl" />
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-blue rounded-full opacity-10 blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-brand-blue rounded-lg border-2 border-brutal-border shadow-[2px_2px_0px_theme(--color-brutal-shadow)] flex items-center justify-center">
                    <Map size={20} />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Dashboard
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold font-display mb-3 text-foreground">
                  Welcome back, {firstName}
                </h1>
                <p className="text-muted-foreground font-body text-lg max-w-xl">
                  Your journey continues. Plan your next adventure, track your
                  itineraries, or pick up where you left off.
                </p>
              </div>

              <CreateTripDialog />
            </div>
          </div>
        </div>

        {/* Trips Section */}
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-brand-blue rounded-xl border-2 border-brutal-border shadow-[3px_3px_0px_theme(--color-brutal-shadow)] flex items-center justify-center rotate-3">
              <Compass size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-display">Your Trips</h2>
              <p className="text-sm text-muted-foreground font-body">
                All your adventures in one place
              </p>
            </div>
          </div>

          <DashboardContent />
        </div>
      </div>
    </main>
  );
}
