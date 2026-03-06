"use client";

import Link from "next/link";
import { useTrips } from "../../hooks/useTrips";
import CreateTripDialog from "./CreateTripDialog";
import {
  Plus,
  Calendar,
  Users,
  Map,
  Wallet,
  CheckSquare,
  MapPin,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Trip } from "shared/types";

const ACCENT_COLORS = [
  "bg-brand-blue",
  "bg-brand-mint",
  "bg-brand-peach",
  "bg-brand-lemon",
  "bg-brand-coral",
];

const TRAVEL_TIPS = [
  {
    icon: MapPin,
    tip: "Add locations to activities for quick map reference.",
    color: "bg-brand-blue",
  },
  {
    icon: Users,
    tip: "Invite collaborators early so everyone can plan together.",
    color: "bg-brand-mint",
  },
  {
    icon: CheckSquare,
    tip: "Use checklists to never forget packing essentials.",
    color: "bg-brand-peach",
  },
  {
    icon: Wallet,
    tip: "Set a budget before booking to avoid overspending.",
    color: "bg-brand-lemon",
  },
];

type TripStatus =
  | { label: string; type: "upcoming"; daysUntil: number }
  | { label: string; type: "ongoing"; daysUntil: 0 }
  | { label: string; type: "completed"; daysUntil: null };

function getTripStatus(startDate: string, endDate: string): TripStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now < start) {
    const diffDays = Math.ceil(
      (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      label: `In ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
      type: "upcoming",
      daysUntil: diffDays,
    };
  } else if (now > end) {
    return { label: "Completed", type: "completed", daysUntil: null };
  } else {
    return { label: "Ongoing", type: "ongoing", daysUntil: 0 };
  }
}

/* ------------------------------------------------------------------ */
/* Next Trip Countdown Banner                                           */
/* ------------------------------------------------------------------ */

function NextTripBanner({ trips }: { trips: Trip[] }) {
  const now = new Date();

  const ongoing = trips.filter(
    (t) => getTripStatus(t.startDate, t.endDate).type === "ongoing",
  );

  if (ongoing.length > 0) {
    const trip = ongoing[0];
    const end = new Date(trip.endDate);
    const daysLeft = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return (
      <div className="brutal-card rounded-xl bg-brand-mint overflow-hidden relative">
        <div className="absolute top-0 right-4 text-[140px] leading-none opacity-[0.06] font-kanji select-none pointer-events-none">
          旅
        </div>
        <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
          <div className="flex-1">
            <span className="badge bg-white mb-3 inline-flex items-center gap-2">
              <span className="live-dot" /> Currently Travelling
            </span>
            <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight text-[#111] mb-1">
              {trip.title}
            </h3>
            <p className="text-sm text-muted-foreground font-body">
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
            </p>
          </div>
          <Link
            href={`/trips/${trip._id}/itinerary`}
            className="brutal-btn bg-white rounded-lg px-5 py-2.5 text-sm shrink-0"
          >
            Open Trip <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const upcoming = trips
    .filter((t) => getTripStatus(t.startDate, t.endDate).type === "upcoming")
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    );

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const status = getTripStatus(next.startDate, next.endDate);
  const daysUntil = status.type === "upcoming" ? status.daysUntil : 0;
  const startFormatted = new Date(next.startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="brutal-card rounded-xl bg-brand-blue overflow-hidden relative">
      <div className="absolute top-0 right-4 text-[160px] leading-none opacity-[0.05] font-kanji select-none pointer-events-none">
        旅
      </div>
      <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
        <div className="flex items-end gap-2 shrink-0">
          <span className="text-[72px] font-black font-display leading-none text-[#111]">
            {daysUntil}
          </span>
          <span className="mb-2 text-xs font-bold uppercase tracking-widest leading-tight text-[#111]/70">
            days
            <br />
            to go
          </span>
        </div>
        <div className="hidden sm:block h-16 w-0.5 bg-[#1a1a1a]/20 shrink-0" />
        <div className="flex-1">
          <span className="badge bg-brand-lemon mb-3 inline-flex">
            ✈ Next Trip
          </span>
          <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight text-[#111] mb-1">
            {next.title}
          </h3>
          <p className="text-sm text-muted-foreground font-body flex items-center gap-1.5">
            <Calendar size={13} />
            {startFormatted}
          </p>
        </div>
        <Link
          href={`/trips/${next._id}/itinerary`}
          className="brutal-btn bg-white rounded-lg px-5 py-2.5 text-sm shrink-0"
        >
          Open <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function TripCard({ trip, index }: { trip: Trip; index: number }) {
  const start = new Date(trip.startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const end = new Date(trip.endDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const status = getTripStatus(trip.startDate, trip.endDate);

  return (
    <Link href={`/trips/${trip._id}/itinerary`} className="group block h-full">
      <div
        className="border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white rounded-xl overflow-hidden flex flex-col h-full opacity-0 animate-fade-in-up transition-all duration-200 hover:-translate-y-1 hover:shadow-[7px_7px_0px_#1a1a1a] cursor-pointer"
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        <div className={`h-2 w-full ${accentColor} shrink-0`} />
        <div className="p-6 flex flex-col grow">
          <div className="flex justify-between items-start gap-3 mb-3">
            <h3
              className="text-base font-extrabold font-display uppercase tracking-tight text-[#111] line-clamp-1 group-hover:text-brand-blue transition-colors"
              title={trip.title}
            >
              {trip.title}
            </h3>
            <span
              className={`shrink-0 badge text-[10px] uppercase tracking-wider ${
                status.type === "upcoming"
                  ? "bg-brand-mint"
                  : status.type === "ongoing"
                    ? "bg-brand-lemon"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-4 grow leading-relaxed">
            {trip.description || "No description provided."}
          </p>
          <div className="flex items-center gap-3 pt-4 border-t-2 border-dashed border-gray-200 text-xs text-muted-foreground font-semibold mt-auto">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} className="text-brand-blue shrink-0" />
              <span>
                {start} &rarr; {end}
              </span>
            </div>
            {trip.travelerCount && trip.travelerCount > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Users size={13} className="text-brand-coral shrink-0" />
                <span>{trip.travelerCount}</span>
              </div>
            )}
            <ArrowRight
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue shrink-0 ml-auto"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function TripListSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-32 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] rounded-xl bg-gray-100 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] rounded-xl bg-white overflow-hidden"
          >
            <div className="h-2 bg-gray-200" />
            <div className="p-6 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-4/5" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-6">
      <div className="border-2 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] bg-white rounded-2xl overflow-hidden">
        <div className="h-2.5 bg-brand-peach" />
        <div className="hero-grid p-10 md:p-14 text-center flex flex-col items-center relative">
          <div className="absolute top-0 right-0 text-[180px] leading-none opacity-[0.04] font-kanji select-none pointer-events-none">
            旅
          </div>
          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="w-20 h-20 bg-brand-peach border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] rounded-2xl flex items-center justify-center mb-6 rotate-3">
              <Map size={40} strokeWidth={1.5} />
            </div>
            <span className="badge bg-brand-lemon mb-4 inline-flex">
              Ready to explore?
            </span>
            <h2 className="font-display font-extrabold text-[clamp(28px,4vw,44px)] uppercase tracking-tight text-[#111] mb-4">
              No trips yet.
            </h2>
            <p className="text-muted-foreground font-body text-base max-w-md mx-auto mb-10 leading-relaxed">
              Create your first trip to start building itineraries, tracking
              budgets, and collaborating with travel companions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10 text-left">
              {[
                {
                  icon: Calendar,
                  label: "Day-by-Day Plans",
                  desc: "Build a visual day-by-day itinerary.",
                  bg: "bg-brand-blue",
                },
                {
                  icon: Wallet,
                  label: "Budget Tracking",
                  desc: "Split expenses and stay on budget.",
                  bg: "bg-brand-mint",
                },
                {
                  icon: CheckSquare,
                  label: "Group Checklists",
                  desc: "Shared packing and task lists.",
                  bg: "bg-brand-peach",
                },
              ].map(({ icon: Icon, label, desc, bg }) => (
                <div
                  key={label}
                  className="border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded-xl p-5 bg-white hover:-translate-y-1 transition-transform"
                >
                  <div
                    className={`w-10 h-10 ${bg} border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-lg flex items-center justify-center mb-4`}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                  </div>
                  <h4 className="font-extrabold font-display text-sm uppercase tracking-tight mb-1">
                    {label}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
            <CreateTripDialog>
              <Button className="brutal-button bg-brand-blue px-8 py-4 rounded-xl text-base h-auto">
                <Plus size={18} strokeWidth={2.5} /> Create Your First Trip
              </Button>
            </CreateTripDialog>
          </div>
        </div>
      </div>

      <div className="border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white rounded-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-lemon border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-lg flex items-center justify-center -rotate-3">
            <Sparkles size={18} />
          </div>
          <h3 className="font-display font-extrabold text-xl uppercase tracking-tight">
            Planning Tips
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TRAVEL_TIPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-lg border-2 border-[#1a1a1a]/10 bg-gray-50"
              >
                <div
                  className={`w-8 h-8 ${item.color} border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-md flex items-center justify-center shrink-0`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </div>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">
                  {item.tip}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardContent() {
  const { data: trips, isLoading, isError } = useTrips();

  if (isLoading) return <TripListSkeleton />;

  if (isError) {
    return (
      <div className="border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] rounded-xl p-8 text-center bg-brand-coral/20">
        <p className="text-[#111] font-bold font-body">
          Failed to load trips. Check your connection and try again.
        </p>
      </div>
    );
  }

  if (!trips || trips.length === 0) {
    return <EmptyState />;
  }

  const upcomingCount = trips.filter(
    (t) => getTripStatus(t.startDate, t.endDate).type === "upcoming",
  ).length;
  const ongoingCount = trips.filter(
    (t) => getTripStatus(t.startDate, t.endDate).type === "ongoing",
  ).length;
  const completedCount = trips.filter(
    (t) => getTripStatus(t.startDate, t.endDate).type === "completed",
  ).length;

  return (
    <div className="space-y-8">
      {/* Section heading */}
      <div className="flex items-center gap-3 anim-2">
        <div className="w-10 h-10 bg-brand-blue border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded-xl flex items-center justify-center rotate-3 shrink-0">
          <Clock size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight text-[#111]">
            Your Trips
          </h2>
          <p className="text-xs text-muted-foreground font-body">
            All your adventures in one place
          </p>
        </div>
      </div>

      {/* Next Trip / Ongoing Banner */}
      <NextTripBanner trips={trips} />

      {/* Trip grid with filter tabs */}
      <Tabs defaultValue="all" className="anim-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="font-display font-extrabold text-lg uppercase tracking-tight">
            All Trips
          </h3>
          <TabsList className="border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] rounded-lg h-auto p-1 bg-white gap-1">
            <TabsTrigger
              value="all"
              className="rounded-md text-xs font-bold uppercase tracking-wide data-[state=active]:bg-brand-blue data-[state=active]:shadow-[2px_2px_0px_#1a1a1a] data-[state=active]:border data-[state=active]:border-[#1a1a1a]"
            >
              All ({trips.length})
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="rounded-md text-xs font-bold uppercase tracking-wide data-[state=active]:bg-brand-mint data-[state=active]:shadow-[2px_2px_0px_#1a1a1a] data-[state=active]:border data-[state=active]:border-[#1a1a1a]"
            >
              Upcoming ({upcomingCount})
            </TabsTrigger>
            <TabsTrigger
              value="ongoing"
              className="rounded-md text-xs font-bold uppercase tracking-wide data-[state=active]:bg-brand-lemon data-[state=active]:shadow-[2px_2px_0px_#1a1a1a] data-[state=active]:border data-[state=active]:border-[#1a1a1a]"
            >
              Ongoing ({ongoingCount})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-md text-xs font-bold uppercase tracking-wide data-[state=active]:bg-brand-peach data-[state=active]:shadow-[2px_2px_0px_#1a1a1a] data-[state=active]:border data-[state=active]:border-[#1a1a1a]"
            >
              Done ({completedCount})
            </TabsTrigger>
          </TabsList>
        </div>

        {(["all", "upcoming", "ongoing", "completed"] as const).map((tab) => {
          const filtered =
            tab === "all"
              ? trips
              : trips.filter(
                  (t) => getTripStatus(t.startDate, t.endDate).type === tab,
                );
          return (
            <TabsContent key={tab} value={tab}>
              {filtered.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl py-14 text-center">
                  <p className="text-sm text-muted-foreground font-body font-medium">
                    No {tab === "all" ? "" : tab} trips yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {filtered.map((trip, idx) => (
                    <TripCard key={trip._id} trip={trip} index={idx} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {trips.length > 0 && trips.length < 3 && (
        <div className="border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-brand-blue/10 rounded-xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-brand-blue border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-lg flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="font-extrabold font-display uppercase tracking-tight mb-1">
              Planning multiple trips?
            </h4>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              Create separate trips for each destination to keep everything
              organized. You can easily switch between them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
