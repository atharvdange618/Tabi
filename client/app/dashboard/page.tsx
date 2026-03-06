import type { Metadata } from "next";
import DashboardContent from "../../components/trips/DashboardContent";
import CreateTripDialog from "../../components/trips/CreateTripDialog";
import { currentUser } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await currentUser();
  const firstName = user?.firstName || "Traveler";

  return (
    <main className="min-h-screen bg-brand-cream p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="brutal-card rounded-2xl bg-white overflow-hidden anim-1">
          {/* top accent strip */}
          <div className="h-2.5 bg-brand-blue w-full" />

          {/* grid-dotted background area */}
          <div className="hero-grid px-8 py-10 md:px-12 md:py-12 relative">
            {/* kanji watermark */}
            <div className="absolute top-0 right-6 text-[200px] leading-none opacity-[0.035] font-kanji select-none pointer-events-none">
              旅
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div>
                <span className="badge bg-brand-lemon tag-rotate-1 inline-flex mb-5">
                  ✦ Your Dashboard
                </span>
                <h1 className="font-display font-extrabold text-[clamp(36px,5vw,60px)] leading-[1.05] tracking-tight text-[#111] uppercase mb-4">
                  Welcome back,{" "}
                  <span className="text-brand-blue">{firstName}</span>
                </h1>
                <p className="text-muted-foreground font-body text-base max-w-md leading-relaxed">
                  Plan your next adventure, track itineraries, or pick up where
                  you left off.
                </p>
              </div>

              <div className="shrink-0">
                <CreateTripDialog />
              </div>
            </div>
          </div>
        </div>

        {/* Trips Content */}
        <DashboardContent />
      </div>
    </main>
  );
}
