"use client";

import { useMemo } from "react";
import { differenceInDays, format } from "date-fns";
import {
  Calendar,
  Users,
  Wallet,
  Vote,
  TrendingUp,
  MapPin,
  Plane,
  Hotel,
  Car,
  UtensilsCrossed,
  Ticket,
} from "lucide-react";
import { useTrip } from "@/hooks/useTrips";
import { useBudgetSummary } from "@/hooks/useBudget";
import { useReservations } from "@/hooks/useReservations";
import { useChecklists } from "@/hooks/useChecklists";
import { useMembers } from "@/hooks/useMembers";
import { usePolls } from "@/hooks/usePolls";
import { useTripStore } from "@/store/tripStore";
import { memberBg, toInitials } from "@/lib/helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TabValue } from "@/store/tripStore";

const RESERVATION_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  flight: Plane,
  hotel: Hotel,
  car_rental: Car,
  restaurant: UtensilsCrossed,
  activity: Ticket,
  other: MapPin,
};

export function OverviewTab({ tripId }: { tripId: string; canEdit: boolean }) {
  const { data: trip } = useTrip(tripId);
  const { data: budgetSummary } = useBudgetSummary(tripId);
  const { data: reservations = [] } = useReservations(tripId);
  const { data: checklists = [] } = useChecklists(tripId);
  const { data: membersData } = useMembers(tripId);
  const { data: polls = [] } = usePolls(tripId);
  const { setActiveTab } = useTripStore();

  const activeMembers = membersData?.active ?? [];

  const tripStats = useMemo(() => {
    if (!trip) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tripStart = new Date(trip.startDate);
    tripStart.setHours(0, 0, 0, 0);
    const tripEnd = new Date(trip.endDate);
    tripEnd.setHours(0, 0, 0, 0);

    const tripDays = differenceInDays(tripEnd, tripStart) + 1;
    const status =
      tripEnd < today
        ? "completed"
        : tripStart <= today
          ? "ongoing"
          : "upcoming";
    const daysUntilStart = Math.max(0, differenceInDays(tripStart, today));
    const daysRemaining = Math.max(0, differenceInDays(tripEnd, today));

    return { tripDays, status, daysUntilStart, daysRemaining };
  }, [trip]);

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return reservations
      .filter((r) => r.datetime && new Date(r.datetime) > now)
      .sort(
        (a, b) =>
          new Date(a.datetime!).getTime() - new Date(b.datetime!).getTime(),
      )
      .slice(0, 3);
  }, [reservations]);

  const checklistStats = useMemo(() => {
    let total = 0;
    let pending = 0;
    for (const cl of checklists) {
      for (const item of cl.items) {
        total++;
        if (!item.isChecked) pending++;
      }
    }
    return { total, pending };
  }, [checklists]);

  const openPolls = useMemo(
    () => polls.filter((p) => p.status === "open").slice(0, 3),
    [polls],
  );

  const budgetPercent =
    budgetSummary?.totalBudget && budgetSummary.totalBudget > 0
      ? Math.min(
          100,
          Math.round(
            (budgetSummary.totalSpent / budgetSummary.totalBudget) * 100,
          ),
        )
      : 0;

  if (!tripStats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A]"
            >
              <Skeleton className="w-8 h-8 rounded-lg mb-2" />
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { tripDays, status, daysUntilStart, daysRemaining } = tripStats;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label={
            status === "upcoming"
              ? "Starts In"
              : status === "ongoing"
                ? "Days Left"
                : "Trip Status"
          }
          value={
            status === "upcoming"
              ? `${daysUntilStart}d`
              : status === "ongoing"
                ? `${daysRemaining}d`
                : "Done"
          }
          Icon={Calendar}
          accentClass="bg-brand-blue"
        />
        <StatCard
          label="Duration"
          value={`${tripDays}d`}
          Icon={TrendingUp}
          accentClass="bg-brand-mint"
        />
        <StatCard
          label="Members"
          value={String(activeMembers.length)}
          Icon={Users}
          accentClass="bg-brand-lemon"
        />
        {budgetSummary?.totalBudget ? (
          <StatCard
            label="Budget Used"
            value={`${budgetPercent}%`}
            Icon={Wallet}
            accentClass="bg-brand-peach"
          />
        ) : (
          <StatCard
            label="Budget"
            value="Not set"
            Icon={Wallet}
            accentClass="bg-brand-peach"
            dim
          />
        )}
      </div>

      {budgetSummary && budgetSummary.totalBudget > 0 && (
        <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-tight">
              Budget
            </h3>
            <button
              onClick={() => setActiveTab(tripId, "budget" as TabValue)}
              className="text-xs font-bold underline underline-offset-2 hover:no-underline"
            >
              View Details →
            </button>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-display font-black text-xl">
              ₹{budgetSummary.totalSpent.toLocaleString()}
            </span>
            <span className="text-sm text-[#6B7280]">
              of ₹{budgetSummary.totalBudget.toLocaleString()}
            </span>
          </div>
          <div className="h-3 bg-[#f0f0ec] rounded-full border border-[#1A1A1A]/20 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                budgetPercent >= 90
                  ? "bg-red-500"
                  : budgetPercent >= 70
                    ? "bg-amber-500"
                    : "bg-brand-mint",
              )}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            {budgetPercent}% used · ₹{budgetSummary.remaining.toLocaleString()}{" "}
            remaining
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-tight">
              Upcoming
            </h3>
            <button
              onClick={() => setActiveTab(tripId, "reservations" as TabValue)}
              className="text-xs font-bold underline underline-offset-2 hover:no-underline"
            >
              View All →
            </button>
          </div>
          {upcomingReservations.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No upcoming reservations</p>
          ) : (
            <div className="space-y-2.5">
              {upcomingReservations.map((r) => {
                const Icon = RESERVATION_ICONS[r.type] ?? MapPin;
                return (
                  <div key={r._id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-cream border border-[#1A1A1A]/20 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{r.title}</p>
                      {r.datetime && (
                        <p className="text-[10px] text-[#9CA3AF]">
                          {format(new Date(r.datetime), "MMM d, h:mm a")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A]">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm uppercase tracking-tight">
                Checklists
              </h3>
              <button
                onClick={() => setActiveTab(tripId, "checklists" as TabValue)}
                className="text-xs font-bold underline underline-offset-2 hover:no-underline"
              >
                View →
              </button>
            </div>
            {checklistStats.total === 0 ? (
              <p className="text-sm text-[#9CA3AF] mt-1.5">No items yet</p>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <span className="font-display font-black text-2xl">
                  {checklistStats.pending}
                </span>
                <span className="text-sm text-[#6B7280]">
                  of {checklistStats.total} items pending
                </span>
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-sm uppercase tracking-tight">
                Polls
              </h3>
              <button
                onClick={() => setActiveTab(tripId, "polls" as TabValue)}
                className="text-xs font-bold underline underline-offset-2 hover:no-underline"
              >
                View All →
              </button>
            </div>
            {openPolls.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No active polls</p>
            ) : (
              <div className="space-y-1.5">
                {openPolls.map((p) => (
                  <div key={p._id} className="flex items-center gap-2">
                    <Vote size={12} className="shrink-0 text-[#6B7280]" />
                    <p className="text-xs font-medium truncate flex-1">
                      {p.question}
                    </p>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0">
                      {p.options.reduce((s, o) => s + o.votes.length, 0)} votes
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-sm uppercase tracking-tight">
            Members ({activeMembers.length})
          </h3>
          <button
            onClick={() => setActiveTab(tripId, "members" as TabValue)}
            className="text-xs font-bold underline underline-offset-2 hover:no-underline"
          >
            Manage →
          </button>
        </div>
        {activeMembers.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No members yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeMembers.map((m, i) => (
              <div
                key={m._id}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#1A1A1A]/15",
                  memberBg(i),
                )}
              >
                <div className="w-5 h-5 rounded-full border border-[#1A1A1A]/30 flex items-center justify-center text-[9px] font-black bg-white/60">
                  {toInitials(m.userId?.name)}
                </div>
                <span className="text-[11px] font-bold truncate max-w-20">
                  {m.userId?.name?.split(" ")[0]}
                </span>
                <span className="text-[10px] text-[#6B7280] capitalize">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  accentClass,
  dim,
}: {
  label: string;
  value: string;
  Icon: React.ComponentType<{ size?: number }>;
  accentClass: string;
  dim?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white border-2 border-[#1A1A1A] rounded-xl p-4 shadow-[4px_4px_0px_#1A1A1A]",
        dim && "opacity-60",
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center mb-2 border border-[#1A1A1A]/20",
          accentClass,
        )}
      >
        <Icon size={15} />
      </div>
      <p className="font-display font-black text-xl leading-tight">{value}</p>
      <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">{label}</p>
    </div>
  );
}
