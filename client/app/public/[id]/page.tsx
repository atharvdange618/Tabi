import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicTrip } from "shared/types";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  MapPin,
  Plane,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ACCENT_COLORS,
  formatDateLabel,
  formatDateRange,
  formatTime,
  MEMBER_COLORS,
} from "@/lib/helpers";
import { HomeFooter } from "@/components/home/HomeFooter";
import { PublicTripNav } from "@/components/shared/PublicTripNav";
import { PublicTripCTA } from "@/components/shared/PublicTripCTA";
import {
  generateOGImageUrl,
  createCanonicalUrl,
  generateTripSchema,
  SITE_NAME,
} from "@/lib/seo";

type FetchPublicTripResult =
  | { status: "ok"; trip: PublicTrip }
  | { status: "private" }
  | { status: "not_found" };

const fetchPublicTrip = async (id: string): Promise<FetchPublicTripResult> => {
  try {
    const baseUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000";
    const res = await fetch(`${baseUrl}/api/v1/trips/public/${id}`, {
      cache: "no-store",
    });
    if (res.status === 403) return { status: "private" };
    if (!res.ok) return { status: "not_found" };
    const data = await res.json();
    return { status: "ok", trip: data.data };
  } catch (error) {
    console.error("Failed to fetch public trip:", error);
    return { status: "not_found" };
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchPublicTrip(id);

  if (result.status !== "ok") {
    return {
      title: result.status === "private" ? "Private Trip" : "Trip Not Found",
      robots: { index: false, follow: false },
    };
  }

  const { trip } = result;
  const description =
    trip.description ||
    `Explore the itinerary for ${trip.destination || "this trip"} on ${SITE_NAME}. View activities, timeline, and trip details.`;

  const ogImageUrl = generateOGImageUrl({
    title: trip.title,
    description: trip.destination || description,
    coverImage: trip.coverImageUrl,
  });

  const tripUrl = createCanonicalUrl(`/public/${id}`);

  return {
    title: trip.title,
    description,
    alternates: {
      canonical: tripUrl,
    },
    openGraph: {
      title: `${trip.title} | ${SITE_NAME}`,
      description,
      url: tripUrl,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: trip.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${trip.title} | ${SITE_NAME}`,
      description,
      images: [ogImageUrl],
    },
  };
}

const TYPE_LABEL: Record<string, string> = {
  sightseeing: "Sightseeing",
  food: "Food",
  transport: "Transport",
  accommodation: "Accommodation",
  activity: "Activity",
  other: "Other",
};

const TYPE_COLOR: Record<string, string> = {
  sightseeing: "bg-brand-blue",
  food: "bg-brand-lemon",
  transport: "bg-brand-mint",
  accommodation: "bg-brand-peach",
  activity: "bg-brand-peach",
  other: "bg-brand-lemon",
};

const CATEGORY_LEGEND: { label: string; color: string }[] = [
  { label: "Sightseeing", color: "bg-brand-blue" },
  { label: "Food", color: "bg-brand-lemon" },
  { label: "Transport", color: "bg-brand-mint" },
  { label: "Accommodation", color: "bg-brand-peach" },
];

export default async function PublicTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchPublicTrip(id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "private") {
    return (
      <div className="min-h-screen bg-brand-cream font-body text-[#111] flex flex-col">
        <nav className="sticky top-0 z-50 h-14 bg-white border-b-2 border-[#1A1A1A] flex items-center px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-brand-blue border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-md flex items-center justify-center font-kanji text-sm group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_#1A1A1A] transition-all duration-150">
              旅
            </div>
            <span className="font-display font-black text-base tracking-tight">
              tabi
            </span>
          </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-brand-lemon border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock size={24} />
            </div>
            <h1 className="font-display font-black text-3xl uppercase tracking-tight mb-2">
              Private Trip
            </h1>
            <p className="text-[#6B7280] font-medium text-sm leading-relaxed mb-8">
              This trip is not publicly accessible. The owner hasn&apos;t shared
              it publicly yet.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/sign-in">
                <Button className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 h-auto px-5 py-2.5 rounded-lg text-sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  className="border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150 h-auto px-5 py-2.5 rounded-lg text-sm"
                >
                  Go home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const trip = result.trip;

  const activitiesByDay = trip.activities.reduce<
    Record<string, typeof trip.activities>
  >((acc, act) => {
    if (!acc[act.dayId]) acc[act.dayId] = [];
    acc[act.dayId]!.push(act);
    return acc;
  }, {});

  const totalActivities = trip.activities.length;

  const tripSchema = generateTripSchema({
    name: trip.title,
    description: trip.description || undefined,
    startDate: trip.startDate,
    endDate: trip.endDate,
    url: createCanonicalUrl(`/public/${id}`),
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: createCanonicalUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: trip.title,
        item: createCanonicalUrl(`/public/${id}`),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-brand-cream font-body text-[#111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <PublicTripNav />

      {trip.coverImageUrl && (
        <div className="relative w-full h-64 sm:h-87.5 border-b-2 border-[#1A1A1A]">
          <Image
            src={trip.coverImageUrl}
            alt={trip.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="bg-white border-b-2 border-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 text-xs font-medium text-[#9CA3AF] mb-6">
            <Globe size={11} />
            <span>Public itinerary</span>
            <span>/</span>
            <span className="text-[#6B7280]">{trip.destination}</span>
          </div>
          <div className="flex items-start justify-between gap-8 flex-wrap">
            <div className="flex-1">
              <h1 className="font-display font-black text-5xl tracking-tight uppercase leading-[1.05] mb-4">
                {trip.title}
              </h1>
              {trip.description && (
                <p className="text-[#6B7280] font-medium text-base leading-relaxed max-w-xl mb-6">
                  {trip.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {trip.destination && (
                  <span className="flex items-center gap-1.5 bg-brand-cream border-2 border-[#1A1A1A] px-3 py-1.5 rounded-full text-sm font-semibold">
                    <MapPin size={13} />
                    {trip.destination}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-brand-cream border-2 border-[#1A1A1A] px-3 py-1.5 rounded-full text-sm font-semibold">
                  <Calendar size={13} />
                  {formatDateRange(trip.startDate, trip.endDate)}
                </span>
                <span className="flex items-center gap-1.5 bg-brand-cream border-2 border-[#1A1A1A] px-3 py-1.5 rounded-full text-sm font-semibold">
                  <Plane size={13} />
                  {trip.days.length} days
                </span>
              </div>
              {trip.tags && trip.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {trip.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-zinc-100 border border-zinc-300 text-zinc-700 uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-brand-blue border-2 border-[#1A1A1A] shadow-[6px_6px_0px_#1A1A1A] rounded-2xl p-5 min-w-50">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-4">
                Trip at a glance
              </p>
              <div className="space-y-3">
                {[
                  { label: "Days", value: trip.days.length, Icon: Calendar },
                  {
                    label: "Activities",
                    value: totalActivities,
                    Icon: CheckCircle2,
                  },
                  {
                    label: "Planners",
                    value: trip.members.length,
                    Icon: Users,
                  },
                ].map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-[#374151]">
                      <Icon size={13} />
                      {label}
                    </div>
                    <span className="font-display font-black text-lg">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <Separator className="my-4 bg-[#1A1A1A]/20" />
              <p className="text-[11px] font-semibold text-[#374151] mb-2">
                Planned by
              </p>
              <div className="flex -space-x-1.5">
                {trip.members.map((member, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center text-[10px] font-bold",
                      MEMBER_COLORS[i % MEMBER_COLORS.length],
                    )}
                  >
                    {member.initials}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b-2 border-[#1A1A1A] bg-white px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
            Categories
          </span>
          {CATEGORY_LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full border border-[#1A1A1A]",
                  color,
                )}
              />
              <span className="text-xs font-semibold text-[#6B7280]">
                {label}
              </span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#9CA3AF]">
            <Lock size={10} />
            Budget &amp; files hidden
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-black text-2xl uppercase tracking-tight">
            Full Itinerary
          </h2>
          <span className="text-sm font-medium text-[#9CA3AF]">
            {totalActivities} activities · {trip.days.length} days
          </span>
        </div>

        <div className="relative">
          <div className="absolute left-4.75 top-8 bottom-8 w-0.5 bg-[#e5e7eb]" />
          <div className="space-y-6">
            {trip.days.map((day, dayIdx) => {
              const dayActivities = (activitiesByDay[day._id] ?? []).sort(
                (a, b) => a.position - b.position,
              );
              const accentColor = ACCENT_COLORS[dayIdx % ACCENT_COLORS.length];

              return (
                <div key={day._id} className="flex gap-5">
                  <div className="flex flex-col items-center shrink-0 w-10 pt-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] flex items-center justify-center font-display font-black text-xs z-10 relative",
                        accentColor,
                      )}
                    >
                      {dayIdx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <p className="font-display font-bold text-base">
                          {day.label ?? `Day ${dayIdx + 1}`}
                        </p>
                        <p className="text-xs font-medium text-[#9CA3AF]">
                          {formatDateLabel(day.date)}
                        </p>
                      </div>
                      <Badge className="text-[11px] font-semibold bg-white border border-[#e5e7eb] text-[#6B7280] px-2 py-0.5">
                        {dayActivities.length} stops
                      </Badge>
                    </div>

                    {dayActivities.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] font-medium italic">
                        No activities planned for this day.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {dayActivities.map((act, actIdx) => {
                          const categoryLabel =
                            TYPE_LABEL[act.type] ?? act.type;
                          const categoryColor =
                            TYPE_COLOR[act.type] ?? "bg-brand-lemon";
                          const startTime = formatTime(act.startTime);

                          return (
                            <div
                              key={act._id}
                              className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-4 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] transition-all duration-150"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-brand-cream border-2 border-[#1A1A1A] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                  {actIdx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div>
                                      <p className="font-display font-bold text-sm">
                                        {act.title}
                                      </p>
                                      {act.location && (
                                        <p className="flex items-center gap-1 text-[11px] text-[#9CA3AF] font-medium mt-0.5">
                                          <MapPin size={10} />
                                          {act.location}
                                        </p>
                                      )}
                                      {act.notes && (
                                        <p className="text-[12px] text-[#6B7280] font-medium mt-0.5 leading-snug max-w-sm">
                                          {act.notes}
                                        </p>
                                      )}
                                    </div>
                                    <Badge
                                      className={cn(
                                        "border-2 border-[#1A1A1A] text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                                        categoryColor,
                                      )}
                                    >
                                      {categoryLabel}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-3 mt-2">
                                    {startTime && (
                                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#9CA3AF]">
                                        <Clock size={10} />
                                        {startTime}
                                      </span>
                                    )}
                                    {act.endTime && act.startTime && (
                                      <span className="text-[11px] text-[#9CA3AF] font-medium">
                                        → {formatTime(act.endTime)}
                                      </span>
                                    )}
                                    <div
                                      className={cn(
                                        "w-2 h-2 rounded-full border border-[#1A1A1A] ml-auto",
                                        categoryColor,
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-brand-lemon border-2 border-[#1A1A1A] rounded-lg flex items-center justify-center shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <p className="font-display font-bold text-sm mb-1">
              Some sections are private
            </p>
            <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
              Budget details, uploaded files, checklists, and reservations are
              only visible to trip members. Only the itinerary is shared
              publicly.
            </p>
          </div>
        </div>
      </div>

      <PublicTripCTA />

      <HomeFooter />
    </div>
  );
}
