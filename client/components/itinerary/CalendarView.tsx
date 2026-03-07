"use client";

import { parseISO, format } from "date-fns";
import { Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { activityColor, formatDisplayTime } from "@/lib/helpers";
import type { Day, Activity } from "shared/types";

// ─── Constants ───────────────────────────────────────────────────────────────
const START_HOUR = 6; // 6 AM
const END_HOUR = 23; // 11 PM
const HOUR_HEIGHT = 64; // px per hour
const COL_WIDTH = 220; // px per day column
const HOUR_GUTTER = 52; // px for the hour-label left column

const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);
const TOTAL_HEIGHT = HOURS.length * HOUR_HEIGHT;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseTotalMinutes(time: string): number {
  const ampm = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1]!, 10);
    const m = parseInt(ampm[2]!, 10);
    if (ampm[3]!.toUpperCase() === "AM" && h === 12) h = 0;
    if (ampm[3]!.toUpperCase() === "PM" && h !== 12) h += 12;
    return h * 60 + m;
  }
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// ─── Activity block (positioned on the timeline) ─────────────────────────────
function ActivityBlock({ activity }: { activity: Activity }) {
  const startMin = activity.startTime
    ? parseTotalMinutes(activity.startTime)
    : null;
  const endMin = activity.endTime ? parseTotalMinutes(activity.endTime) : null;

  const clampedStartOffset =
    startMin !== null
      ? Math.max(0, startMin - START_HOUR * 60) * (HOUR_HEIGHT / 60)
      : 0;

  const durationMin =
    startMin !== null && endMin !== null && endMin > startMin
      ? endMin - startMin
      : 60;

  const height = Math.max(28, durationMin * (HOUR_HEIGHT / 60));
  const colorClass = activityColor(activity.type);

  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-md border border-[#1A1A1A]/25 px-2 py-1",
        "overflow-hidden select-none hover:z-10 hover:shadow-[2px_2px_0px_#1A1A1A]",
        "transition-shadow duration-100",
        colorClass,
      )}
      style={{ top: clampedStartOffset, height }}
      title={activity.title}
    >
      <p className="font-display font-bold text-[11px] text-[#111] leading-tight truncate">
        {activity.title}
      </p>
      {height > 38 && activity.startTime && (
        <p className="text-[9px] font-mono text-[#333] flex items-center gap-0.5 mt-0.5">
          <Clock size={7} />
          {formatDisplayTime(activity.startTime)}
          {activity.endTime && ` → ${formatDisplayTime(activity.endTime)}`}
        </p>
      )}
      {height > 56 && activity.location && (
        <p className="text-[9px] text-[#444] flex items-center gap-0.5 mt-0.5 truncate">
          <MapPin size={7} />
          {activity.location}
        </p>
      )}
    </div>
  );
}

// ─── Main CalendarView ────────────────────────────────────────────────────────
export function CalendarView({
  days,
  activitiesByDay,
}: {
  days: Day[];
  activitiesByDay: Record<string, Activity[]>;
}) {
  // Partition activities into scheduled (has startTime) vs unscheduled
  const scheduled: Record<string, Activity[]> = {};
  const unscheduled: Record<string, Activity[]> = {};
  let hasUnscheduled = false;

  for (const day of days) {
    const acts = activitiesByDay[day._id] ?? [];
    scheduled[day._id] = acts.filter((a) => !!a.startTime);
    unscheduled[day._id] = acts.filter((a) => !a.startTime);
    if (unscheduled[day._id].length > 0) hasUnscheduled = true;
  }

  const totalInnerWidth = HOUR_GUTTER + days.length * COL_WIDTH;

  return (
    <div className="rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: totalInnerWidth }}>
          {/* ── Day header row ───────────────────────────────────── */}
          <div className="flex border-b-2 border-[#1A1A1A] bg-brand-cream sticky top-0 z-20">
            {/* gutter spacer */}
            <div
              style={{ width: HOUR_GUTTER }}
              className="shrink-0 border-r border-[#1A1A1A]/20"
            />
            {days.map((day, i) => {
              let dateLabel = day.date;
              try {
                dateLabel = format(parseISO(day.date), "EEE, MMM d");
              } catch {
                /* keep raw */
              }
              const isLast = i === days.length - 1;
              return (
                <div
                  key={day._id}
                  style={{ width: COL_WIDTH }}
                  className={cn(
                    "shrink-0 px-3 py-2.5",
                    !isLast && "border-r border-[#1A1A1A]/20",
                  )}
                >
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">
                    Day {i + 1}
                  </p>
                  <p className="font-display font-black text-sm text-[#111] mt-0.5">
                    {dateLabel}
                  </p>
                  {day.label && (
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5 truncate">
                      {day.label}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Unscheduled row (only renders if any day has untimed activities) ── */}
          {hasUnscheduled && (
            <div className="flex border-b border-[#1A1A1A]/15 bg-[#fafaf7]">
              <div
                style={{ width: HOUR_GUTTER }}
                className="shrink-0 border-r border-[#1A1A1A]/20 flex items-center justify-center py-2"
              >
                <span
                  className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  No time
                </span>
              </div>
              {days.map((day, i) => {
                const acts = unscheduled[day._id] ?? [];
                const isLast = i === days.length - 1;
                return (
                  <div
                    key={day._id}
                    style={{ width: COL_WIDTH }}
                    className={cn(
                      "shrink-0 p-1.5 flex flex-col gap-1 min-h-10",
                      !isLast && "border-r border-[#1A1A1A]/20",
                    )}
                  >
                    {acts.map((act) => (
                      <div
                        key={act._id}
                        title={act.title}
                        className={cn(
                          "rounded-md border border-[#1A1A1A]/20 px-2 py-0.5",
                          "text-[10px] font-bold text-[#111] truncate",
                          activityColor(act.type),
                        )}
                      >
                        {act.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Timeline grid ─────────────────────────────────────── */}
          <div className="flex" style={{ height: TOTAL_HEIGHT }}>
            {/* Hour labels */}
            <div
              style={{ width: HOUR_GUTTER }}
              className="shrink-0 relative border-r border-[#1A1A1A]/20 bg-white"
            >
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{
                    height: HOUR_HEIGHT,
                    top: (h - START_HOUR) * HOUR_HEIGHT,
                  }}
                  className="absolute left-0 right-0 flex items-start justify-end pr-2 pt-1"
                >
                  <span className="text-[9px] font-mono text-[#9CA3AF] leading-none">
                    {formatHour(h)}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, i) => {
              const isLast = i === days.length - 1;
              return (
                <div
                  key={day._id}
                  style={{ width: COL_WIDTH }}
                  className={cn(
                    "shrink-0 relative",
                    !isLast && "border-r border-[#1A1A1A]/20",
                  )}
                >
                  {/* Hour gridlines */}
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{
                        top: (h - START_HOUR) * HOUR_HEIGHT,
                        height: HOUR_HEIGHT,
                      }}
                      className="absolute left-0 right-0 border-b border-[#1A1A1A]/[0.07]"
                    />
                  ))}
                  {/* Half-hour dashed gridlines */}
                  {HOURS.map((h) => (
                    <div
                      key={`${h}-half`}
                      style={{
                        top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                      }}
                      className="absolute left-0 right-0 border-b border-dashed border-[#1A1A1A]/[0.04]"
                    />
                  ))}
                  {/* Scheduled activities */}
                  {(scheduled[day._id] ?? []).map((act) => (
                    <ActivityBlock key={act._id} activity={act} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
