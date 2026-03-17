import Link from "next/link";
import Image from "next/image";
import { MapPin, Users, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscoverTrip } from "@/hooks/useTrips";
import { ACCENT_COLORS } from "@/lib/helpers";

interface DiscoverTripCardProps {
  trip: DiscoverTrip;
  index: number;
}

function getDaysCount(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DiscoverTripCard({ trip, index }: DiscoverTripCardProps) {
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const daysCount = getDaysCount(trip.startDate, trip.endDate);
  const dateRange = `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`;
  const visibleTags = trip.tags?.slice(0, 3) || [];
  const overflowTags = (trip.tags?.length || 0) - 3;

  return (
    <Link href={`/public/${trip._id}`} className="block group h-full">
      <div
        className={cn(
          "bg-white rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A]",
          "transition-all duration-150 ease-out h-full flex flex-col",
          "group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[6px_6px_0px_#1A1A1A]",
        )}
      >
        <div className="relative overflow-hidden rounded-t-[10px] shrink-0">
          {trip.coverImageUrl ? (
            <Image
              src={trip.coverImageUrl}
              alt={trip.title}
              width={400}
              height={192}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-full h-48 flex items-center justify-center overflow-hidden",
                accentColor,
              )}
            >
              <svg
                viewBox="0 0 280 192"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
                aria-hidden="true"
              >
                <circle
                  cx="228"
                  cy="40"
                  r="22"
                  fill="#FFF3B0"
                  stroke="#1A1A1A"
                  strokeWidth="2.5"
                />
                <line
                  x1="254"
                  y1="40"
                  x2="261"
                  y2="40"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="202"
                  y1="40"
                  x2="195"
                  y2="40"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="228"
                  y1="14"
                  x2="228"
                  y2="7"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="247"
                  y1="21"
                  x2="252"
                  y2="16"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="209"
                  y1="21"
                  x2="204"
                  y2="16"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <rect
                  x="18"
                  y="30"
                  width="80"
                  height="26"
                  rx="13"
                  fill="white"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                />
                <rect
                  x="32"
                  y="20"
                  width="54"
                  height="26"
                  rx="13"
                  fill="white"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                />

                <rect
                  x="148"
                  y="25"
                  width="50"
                  height="20"
                  rx="10"
                  fill="white"
                  stroke="#1A1A1A"
                  strokeWidth="1.5"
                />
                <rect
                  x="158"
                  y="17"
                  width="34"
                  height="20"
                  rx="10"
                  fill="white"
                  stroke="#1A1A1A"
                  strokeWidth="1.5"
                />

                <path
                  d="M0 140 L40 90 L80 120 L120 75 L160 105 L200 80 L240 110 L280 88 L280 192 L0 192Z"
                  fill="#FFD6C0"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M0 160 L50 115 L90 140 L135 100 L175 132 L215 108 L260 138 L280 118 L280 192 L0 192Z"
                  fill="white"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M0 192 Q60 155 120 170 Q180 185 240 162 Q260 155 280 160 L280 192Z"
                  fill="#B8F0D4"
                  stroke="#1A1A1A"
                  strokeWidth="2"
                />

                <g transform="translate(118, 62) rotate(-12)">
                  <path
                    d="M14 5 L20 -10 L28 -8 L24 5Z"
                    fill="#93CDFF"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 5 L20 18 L28 16 L24 5Z"
                    fill="#93CDFF"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M0 5 L30 0 L36 5 L30 10 L0 5Z" fill="#1A1A1A" />
                  <path
                    d="M0 5 L4 -2 L10 2 L8 5Z"
                    fill="#FFB8B8"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="28"
                    cy="5"
                    r="3"
                    fill="#FFF3B0"
                    stroke="#1A1A1A"
                    strokeWidth="1.5"
                  />
                </g>
              </svg>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <div className="mb-3">
            <h3 className="font-display font-bold text-lg text-[#111] leading-snug mb-1 line-clamp-2">
              {trip.title}
            </h3>
            {trip.destination && (
              <p className="flex items-center gap-1 text-sm font-medium text-[#6B7280]">
                <MapPin size={14} />
                {trip.destination}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-3">
            <Calendar size={14} />
            <span className="font-medium">
              {dateRange} • {daysCount}d
            </span>
          </div>

          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {visibleTags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 border border-zinc-300 text-zinc-700 uppercase"
                >
                  {tag}
                </span>
              ))}
              {overflowTags > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 border border-zinc-300 text-zinc-700 uppercase">
                  +{overflowTags}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-auto pt-3">
            <Users size={14} />
            <span className="font-medium">
              {trip.memberCount} {trip.memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
