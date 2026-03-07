import { format, parseISO } from "date-fns";

export function formatDateLabel(isoDate: string) {
  try {
    return format(parseISO(isoDate), "MMM d, EEEE");
  } catch {
    return isoDate;
  }
}

export function formatDateRange(start: string, end: string) {
  try {
    return `${format(parseISO(start), "MMM d, yyyy")} → ${format(parseISO(end), "MMM d, yyyy")}`;
  } catch {
    return `${start} → ${end}`;
  }
}

export function formatTime(time?: string) {
  if (!time) {
    return null;
  }
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h ?? "0", 10);
    const minute = m ?? "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  } catch {
    return time;
  }
}

export const ACCENT_COLORS = [
  "bg-brand-blue",
  "bg-brand-peach",
  "bg-brand-mint",
  "bg-brand-lemon",
  "bg-brand-coral",
];

export const MEMBER_COLORS = [
  "bg-brand-blue",
  "bg-brand-peach",
  "bg-brand-mint",
  "bg-brand-lemon",
  "bg-brand-coral",
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatTripDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getDaysCount(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return (
    Math.max(
      1,
      Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)),
    ) + 1
  );
}

export function getDaysUntil(startDate: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const BG_CYCLE = [
  "bg-brand-blue",
  "bg-brand-peach",
  "bg-brand-mint",
  "bg-brand-lemon",
] as const;

export function toInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function memberBg(index: number): string {
  return BG_CYCLE[index % BG_CYCLE.length];
}

const ACTIVITY_COLOR: Record<string, string> = {
  sightseeing: "bg-brand-mint",
  food: "bg-brand-lemon",
  transport: "bg-brand-blue",
  accommodation: "bg-brand-peach",
  activity: "bg-brand-blue",
  other: "bg-[#e5e7eb]",
};

export function activityColor(type: string): string {
  return ACTIVITY_COLOR[type] ?? "bg-[#e5e7eb]";
}

function parseTimeToMinutes(time: string): number {
  const ampmMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1]!, 10);
    const m = parseInt(ampmMatch[2]!, 10);
    const period = ampmMatch[3]!.toUpperCase();
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;
    return h * 60 + m;
  }
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatDisplayTime(hhmm?: string): string {
  if (!hhmm) return "";
  const ampmMatch = hhmm.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    const hour = parseInt(ampmMatch[1]!, 10);
    const minute = ampmMatch[2]!;
    const period = ampmMatch[3]!.toUpperCase();
    return `${hour}:${minute} ${period}`;
  }
  const totalMin = parseTimeToMinutes(hhmm);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 || 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

export function computeDuration(start?: string, end?: string): string {
  if (!start || !end) return "";
  const totalMin = parseTimeToMinutes(end) - parseTimeToMinutes(start);
  if (totalMin <= 0) return "";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/** Maps API role "owner" → "admin" for display purposes */
export function mapRole(role: string): "admin" | "editor" | "viewer" {
  if (role === "owner") return "admin";
  if (role === "editor") return "editor";
  return "viewer";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeLabel(originalName: string): string {
  return originalName.split(".").pop()?.toUpperCase() ?? "FILE";
}
