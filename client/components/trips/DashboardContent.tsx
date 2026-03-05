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
  Clock,
  ArrowRight,
  Sparkles,
  Mountain,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    tip: "Invite collaborators early to plan together.",
    color: "bg-brand-mint",
  },
  {
    icon: CheckSquare,
    tip: "Use checklists to track packing and preparation.",
    color: "bg-brand-peach",
  },
  {
    icon: Wallet,
    tip: "Set a budget before booking to avoid overspending.",
    color: "bg-brand-lemon",
  },
];

function getTripStatus(startDate: string, endDate: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now < start) {
    const diffTime = Math.abs(start.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      label: `In ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
      type: "upcoming",
    };
  } else if (now > end) {
    return { label: "Completed", type: "completed" };
  } else {
    return { label: "Ongoing", type: "ongoing" };
  }
}

function TripCard({
  trip,
  index,
}: {
  trip: {
    _id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    travelerCount?: number;
  };
  index: number;
}) {
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

  const animationDelay = `${index * 0.1}s`;

  return (
    <Link href={`/trips/${trip._id}/itinerary`} className="group">
      <div
        className="brutal-card rounded-xl p-0 hover:-translate-y-1 hover:shadow-[6px_6px_0px_theme(--color-brutal-shadow)] transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-full opacity-0 animate-fade-in-up bg-white"
        style={{ animationDelay }}
      >
        <div
          className={`h-4 w-full border-b-2 border-brutal-border ${accentColor} relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </div>

        <div className="p-6 flex flex-col grow">
          <div className="flex justify-between items-start gap-4 mb-3">
            <h3
              className="text-xl font-bold font-display line-clamp-1 group-hover:text-brand-blue transition-colors"
              title={trip.title}
            >
              {trip.title}
            </h3>
            <span
              className={`shrink-0 brutal-badge rounded-md text-[10px] uppercase tracking-wider font-bold ${
                status.type === "upcoming"
                  ? "bg-brand-mint"
                  : status.type === "ongoing"
                    ? "bg-brand-lemon"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {status.label}
            </span>
          </div>

          <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-4 grow">
            {trip.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground font-body font-medium mt-auto pt-4 border-t-2 border-dashed border-gray-200">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-brand-blue shrink-0" />
              <span className="truncate text-xs">
                {start} – {end}
              </span>
            </div>
            {trip.travelerCount && trip.travelerCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-brand-coral shrink-0" />
                <span className="text-xs">{trip.travelerCount}</span>
              </div>
            )}
            <ArrowRight
              size={16}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-blue shrink-0"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function TripListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="brutal-card rounded-xl p-0 overflow-hidden h-50 flex flex-col bg-white"
        >
          <div className="h-4 w-full bg-gray-200 border-b-2 border-brutal-border" />
          <div className="p-6 flex flex-col grow">
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 rounded w-4/5 grow" />
            <div className="mt-4 pt-4 flex gap-4 border-t-2 border-dashed border-gray-200">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="space-y-8">
      {/* Main Empty State */}
      <div className="brutal-card rounded-2xl p-8 md:p-12 text-center bg-white animate-fade-in-up flex flex-col items-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 text-[120px] opacity-5 font-kanji select-none pointer-events-none">
          旅
        </div>

        <div className="relative z-10 w-full">
          <div className="w-24 h-24 bg-brand-peach rounded-2xl border-2 border-brutal-border flex items-center justify-center mb-6 shadow-[6px_6px_0px_theme(--color-brutal-shadow)] rotate-3 mx-auto">
            <Map size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
            No trips yet
          </h2>
          <p className="text-muted-foreground font-body text-lg max-w-md mx-auto mb-10">
            Create your first trip to start organizing itineraries, tracking
            budgets, and collaborating with travel companions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10 text-left">
            <div className="p-5 rounded-xl bg-brand-blue/10 border-2 border-brutal-border shadow-[3px_3px_0px_theme(--color-brand-blue)] hover:-translate-y-1 transition-transform">
              <Calendar
                className="text-brand-blue mb-3"
                size={28}
                strokeWidth={2}
              />
              <h4 className="font-bold font-display mb-2 text-base">
                Smart Itineraries
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Plan day by day with locations and times.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-brand-mint/10 border-2 border-brutal-border shadow-[3px_3px_0px_theme(--color-brand-mint)] hover:-translate-y-1 transition-transform">
              <Wallet
                className="text-brand-mint mb-3"
                size={28}
                strokeWidth={2}
              />
              <h4 className="font-bold font-display mb-2 text-base">
                Budget Tracking
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Split expenses and stay on budget easily.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-brand-peach/10 border-2 border-brutal-border shadow-[3px_3px_0px_theme(--color-brand-peach)] hover:-translate-y-1 transition-transform">
              <CheckSquare
                className="text-brand-peach mb-3"
                size={28}
                strokeWidth={2}
              />
              <h4 className="font-bold font-display mb-2 text-base">
                Group Checklists
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Don&apos;t forget anything with shared lists.
              </p>
            </div>
          </div>

          <CreateTripDialog>
            <Button className="brutal-button bg-brand-blue px-8 py-4 rounded-lg text-base inline-flex items-center gap-3 hover:bg-brand-lemon transition-colors group h-auto">
              <Plus size={20} strokeWidth={2.5} />
              Create Your First Trip
            </Button>
          </CreateTripDialog>
        </div>
      </div>

      {/* Travel Tips Section */}
      <div className="brutal-card rounded-2xl p-8 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-lemon rounded-lg border-2 border-brutal-border shadow-[2px_2px_0px_theme(--color-brutal-shadow)] flex items-center justify-center -rotate-6">
            <Sparkles size={20} strokeWidth={2} />
          </div>
          <h3 className="text-2xl font-bold font-display">Planning Tips</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TRAVEL_TIPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div
                  className={`w-8 h-8 ${item.color} rounded-md border-2 border-brutal-border flex items-center justify-center shrink-0 shadow-[2px_2px_0px_theme(--color-brutal-shadow)]`}
                >
                  <Icon size={16} strokeWidth={2.5} />
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
      <div className="brutal-card rounded-xl p-8 text-center bg-brand-coral/20">
        <p className="text-brand-coral font-bold font-body">
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
    <div
      className="space-y-8 animate-fade-in-up"
      style={{ animationDelay: "0.1s" }}
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="brutal-card bg-brand-peach p-5 rounded-xl flex flex-col justify-center hover:-translate-y-1 transition-transform">
          <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Mountain size={12} />
            Total
          </span>
          <span className="text-3xl font-black font-display">
            {trips.length}
          </span>
        </div>
        <div className="brutal-card bg-brand-mint p-5 rounded-xl flex flex-col justify-center hover:-translate-y-1 transition-transform">
          <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock size={12} />
            Upcoming
          </span>
          <span className="text-3xl font-black font-display">
            {upcomingCount}
          </span>
        </div>
        <div className="brutal-card bg-brand-lemon p-5 rounded-xl flex flex-col justify-center hover:-translate-y-1 transition-transform">
          <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Compass size={12} />
            Ongoing
          </span>
          <span className="text-3xl font-black font-display">
            {ongoingCount}
          </span>
        </div>
        <div className="brutal-card bg-white p-5 rounded-xl flex flex-col justify-center overflow-hidden hover:-translate-y-1 transition-transform">
          <span className="text-xs font-bold opacity-70 uppercase tracking-wider mb-2">
            Newest
          </span>
          <span
            className="text-lg font-bold font-display w-full truncate"
            title={trips[0]?.title}
          >
            {trips[0]?.title || "-"}
          </span>
        </div>
      </div>

      {/* Trip Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-display">
            All Trips ({trips.length})
          </h3>
          {completedCount > 0 && (
            <span className="text-sm text-muted-foreground font-body">
              {completedCount} completed
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {trips.map((trip, idx) => (
            <TripCard key={trip._id} trip={trip} index={idx} />
          ))}
        </div>
      </div>

      {/* Quick Tip for users with trips */}
      {trips.length > 0 && trips.length < 3 && (
        <div className="brutal-card bg-brand-blue/10 border-2 border-brand-blue/30 rounded-xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-brand-blue rounded-lg border-2 border-brutal-border shadow-[2px_2px_0px_theme(--color-brutal-shadow)] flex items-center justify-center shrink-0">
            <Sparkles size={20} strokeWidth={2} />
          </div>
          <div>
            <h4 className="font-bold font-display mb-1">
              Planning multiple trips?
            </h4>
            <p className="text-sm text-muted-foreground font-body">
              Create separate trips for each destination to keep everything
              organized. You can easily switch between them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
