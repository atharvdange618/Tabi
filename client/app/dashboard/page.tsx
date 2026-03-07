"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Plus,
  Users,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Plane,
  LogOut,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTrips, useDeleteTrip } from "@/hooks/useTrips";
import type { DashboardTrip } from "shared/types";
import {
  ACCENT_COLORS,
  formatTripDate,
  getDaysCount,
  getDaysUntil,
  getInitials,
  MEMBER_COLORS,
} from "@/lib/helpers";
import { HomeFooter } from "@/components/home/HomeFooter";
import CreateTripForm from "@/components/trips/CreateTripForm";

type TripStatus = "upcoming" | "planning" | "completed";

function getTripStatus(startDate: string, endDate: string): TripStatus {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  if (end < now) return "completed";
  const daysUntil = getDaysUntil(startDate);
  return daysUntil >= 90 ? "planning" : "upcoming";
}

interface NormalizedTrip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  memberCount: number;
  activityCount: number;
  status: TripStatus;
  daysUntil: number;
  accentColor: string;
  members: Array<{ initials: string; bg: string }>;
}

function normalizeTrip(trip: DashboardTrip, index: number): NormalizedTrip {
  return {
    id: trip._id,
    name: trip.title,
    destination: trip.destination ?? "",
    startDate: formatTripDate(trip.startDate),
    endDate: formatTripDate(trip.endDate),
    daysCount: getDaysCount(trip.startDate, trip.endDate),
    memberCount: trip.memberCount,
    activityCount: trip.activityCount,
    status: getTripStatus(trip.startDate, trip.endDate),
    daysUntil: getDaysUntil(trip.startDate),
    accentColor: ACCENT_COLORS[index % ACCENT_COLORS.length],
    members: trip.members.map((m, i) => ({
      initials: getInitials(m.name),
      bg: MEMBER_COLORS[i % MEMBER_COLORS.length],
    })),
  };
}

function buildStats(trips: NormalizedTrip[], rawTrips: DashboardTrip[]) {
  const totalTrips = trips.length;
  const upcoming = trips.filter(
    (t) => t.status === "upcoming" || t.status === "planning",
  ).length;

  const collaboratorEmails = new Set<string>();
  for (const t of rawTrips) {
    for (const m of t.members) collaboratorEmails.add(m.email);
  }

  const totalActivities = trips.reduce((sum, t) => sum + t.activityCount, 0);

  return [
    {
      label: "Total trips",
      value: String(totalTrips),
      icon: Plane,
      bg: "bg-brand-blue",
    },
    {
      label: "Upcoming",
      value: String(upcoming),
      icon: Calendar,
      bg: "bg-brand-lemon",
    },
    {
      label: "Collaborators",
      value: String(collaboratorEmails.size),
      icon: Users,
      bg: "bg-brand-mint",
    },
    {
      label: "Activities",
      value: String(totalActivities),
      icon: CheckCircle2,
      bg: "bg-brand-peach",
    },
  ];
}

const statusConfig = {
  upcoming: {
    label: "Upcoming",
    className: "bg-brand-lemon border-[#1A1A1A] text-[#111] font-bold",
  },
  planning: {
    label: "Planning",
    className: "bg-brand-peach border-[#1A1A1A] text-[#111] font-bold",
  },
  completed: {
    label: "Completed",
    className: "bg-[#e5e7eb] border-[#1A1A1A] text-[#6B7280] font-bold",
  },
};

const filterOptions = ["all", "upcoming", "planning", "completed"] as const;

function TripCard({
  trip,
  onDelete,
}: {
  trip: NormalizedTrip;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const status = statusConfig[trip.status];
  const visibleMembers = trip.members.slice(0, 3);
  const overflow = trip.members.length - 3;

  return (
    <Link href={`/trips/${trip.id}`} className="block group">
      <div
        className={cn(
          "bg-white rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]",
          "transition-all duration-150 ease-out",
          "group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[6px_6px_0px_#1A1A1A]",
          trip.status === "completed" && "opacity-70",
        )}
      >
        <div className={cn("h-2 rounded-t-[10px]", trip.accentColor)} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-[17px] text-[#111] leading-snug truncate">
                {trip.name}
              </h3>
              <p className="flex items-center gap-1 text-xs font-medium text-[#6B7280] mt-0.5">
                <MapPin size={11} />
                {trip.destination || "-"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                className={cn(
                  "border text-[11px] px-2 py-0.5 rounded-full",
                  status.className,
                )}
              >
                {status.label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.preventDefault()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 border border-transparent hover:border-[#1A1A1A] rounded-md hover:bg-brand-cream"
                  >
                    <MoreHorizontal size={13} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-44 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl"
                >
                  <DropdownMenuItem
                    className="font-medium text-sm cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/trips/${trip.id}`);
                    }}
                  >
                    Edit trip
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="font-medium text-sm cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/trips/${trip.id}`);
                    }}
                  >
                    Invite members
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="font-medium text-sm cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/public/${trip.id}`);
                    }}
                  >
                    Share public link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="font-medium text-sm text-red-600 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(trip.id);
                    }}
                  >
                    Delete trip
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7280] bg-brand-cream border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 mb-4">
            <Calendar size={11} />
            <span>
              {trip.startDate} → {trip.endDate}
            </span>
            <span className="ml-auto font-mono text-[10px] text-[#9CA3AF]">
              {trip.daysCount}d
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {visibleMembers.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center text-[9px] font-bold text-[#111]",
                      m.bg,
                    )}
                  >
                    {m.initials}
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="w-6 h-6 rounded-full border-2 border-[#1A1A1A] bg-[#e5e7eb] flex items-center justify-center text-[9px] font-bold text-[#6B7280]">
                    +{overflow}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-[#6B7280]">
                {trip.memberCount} members
              </span>
            </div>

            <span className="flex items-center gap-1 text-[11px] font-medium text-[#6B7280]">
              <CheckCircle2 size={11} />
              {trip.activityCount} activities
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-[#f3f4f6] flex items-center justify-between">
            {trip.status !== "completed" ? (
              <p className="flex items-center gap-1 text-[11px] font-semibold text-[#9CA3AF]">
                <Clock size={11} />
                {trip.daysUntil > 0
                  ? `${trip.daysUntil} days away`
                  : "Happening now"}
              </p>
            ) : (
              <span className="text-[11px] font-semibold text-[#9CA3AF]">
                Trip completed
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#111] sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
              View trip <ArrowRight size={11} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24">
      <div className="w-20 h-20 bg-brand-blue border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-2xl flex items-center justify-center font-kanji text-3xl mb-6">
        旅
      </div>
      <h3 className="font-display font-bold text-2xl text-[#111] mb-2">
        No trips yet.
      </h3>
      <p className="text-[#6B7280] text-sm font-medium text-center max-w-xs mb-8">
        Create your first trip and invite your crew. The planning starts here.
      </p>
      <Button
        onClick={onCreateClick}
        className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] hover:bg-brand-blue active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150 h-auto px-6 py-2.5 rounded-lg"
      >
        <Plus size={16} className="mr-2" /> Create your first trip
      </Button>
    </div>
  );
}

function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] animate-pulse">
      <div className="h-2 rounded-t-[10px] bg-[#e5e7eb]" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-[#f3f4f6] rounded w-3/4" />
        <div className="h-3 bg-[#f3f4f6] rounded w-1/2" />
        <div className="h-8 bg-[#f3f4f6] rounded" />
        <div className="flex justify-between">
          <div className="h-3 bg-[#f3f4f6] rounded w-24" />
          <div className="h-3 bg-[#f3f4f6] rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [filter, setFilter] = useState<(typeof filterOptions)[number]>("all");

  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: rawTrips = [], isLoading } = useTrips();
  const deleteTrip = useDeleteTrip();

  const trips: NormalizedTrip[] = rawTrips.map(normalizeTrip);

  const filteredTrips =
    filter === "all" ? trips : trips.filter((t) => t.status === filter);

  const stats = buildStats(trips, rawTrips);

  const userName = user?.fullName ?? user?.firstName ?? "there";
  const userEmail = user?.emailAddresses[0]?.emailAddress ?? "";
  const userInitials = getInitials(userName);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-brand-cream font-body text-[#111] flex flex-col">
      <nav className="sticky top-0 z-50 h-16 bg-white border-b-2 border-[#1A1A1A] flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-brand-blue border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] rounded-lg flex items-center justify-center font-kanji text-base text-[#111] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[5px_5px_0px_#1A1A1A] transition-all duration-150">
            旅
          </div>
          <span className="font-display font-black text-lg tracking-tight">
            tabi
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-lg border border-transparent hover:border-[#1A1A1A] hover:bg-brand-cream transition-all">
                <div className="w-7 h-7 rounded-full bg-brand-blue border-2 border-[#1A1A1A] flex items-center justify-center text-[11px] font-bold">
                  {userInitials}
                </div>
                <span className="font-semibold text-sm hidden sm:block">
                  {userName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-1"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-bold">{userName}</p>
                <p className="text-xs text-[#6B7280] font-medium">
                  {userEmail}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="font-medium text-sm text-red-600 cursor-pointer gap-2 rounded-lg"
                onClick={() => signOut({ redirectUrl: "/" })}
              >
                <LogOut size={13} /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-[#6B7280] mb-0.5">
              {greeting} 👋
            </p>
            <h1 className="font-display font-black text-4xl tracking-tight uppercase">
              Your Trips
            </h1>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] hover:bg-brand-blue active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150 h-auto px-5 py-2.5 rounded-lg text-sm">
                <Plus size={15} className="mr-1.5" /> New trip
              </Button>
            </DialogTrigger>
            <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl sm:max-w-md gap-0">
              <DialogHeader className="pb-4">
                <DialogTitle className="font-display font-bold text-xl">
                  Create a new trip
                </DialogTitle>
              </DialogHeader>
              <div className="pt-2 px-1">
                <CreateTripForm onSuccess={() => setCreateOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-4 flex items-center gap-3"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center shrink-0",
                    stat.bg,
                  )}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <p className="font-display font-black text-2xl tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-[#6B7280] font-medium">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all duration-150 capitalize",
                filter === f
                  ? "bg-[#111] text-white border-[#111] shadow-[3px_3px_0px_#555]"
                  : "bg-white text-[#111] border-[#1A1A1A] hover:bg-brand-cream",
              )}
            >
              {f === "all" ? `All (${trips.length})` : f}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <>
              <TripCardSkeleton />
              <TripCardSkeleton />
              <TripCardSkeleton />
            </>
          ) : filteredTrips.length === 0 ? (
            <EmptyState onCreateClick={() => setCreateOpen(true)} />
          ) : (
            filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={(id) => deleteTrip.mutate(id)}
              />
            ))
          )}
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}
