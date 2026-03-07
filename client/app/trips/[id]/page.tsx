"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Globe,
  MapPin,
  Pencil,
  Settings,
  Users,
  UserPlus,
} from "lucide-react";
import { useTrip } from "@/hooks/useTrips";
import { useMembers } from "@/hooks/useMembers";
import { mapRole, memberBg, toInitials } from "@/lib/helpers";
import { roleConfig } from "@/components/trips/tabs/_shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ItineraryTab } from "@/components/trips/tabs/ItineraryTab";
import { BudgetTab } from "@/components/trips/tabs/BudgetTab";
import { FilesTab } from "@/components/trips/tabs/FilesTab";
import { ChecklistsTab } from "@/components/trips/tabs/ChecklistsTab";
import { ReservationsTab } from "@/components/trips/tabs/ReservationsTab";
import { MembersTab } from "@/components/trips/tabs/MembersTab";
import { SettingsTab } from "@/components/trips/tabs/SettingsTab";
import TripEditSheet from "@/components/trips/TripEditSheet";

const TAB_CONFIG = [
  { value: "itinerary", label: "Itinerary", Icon: Calendar },
  { value: "budget", label: "Budget", Icon: DollarSign },
  { value: "files", label: "Files", Icon: FileText },
  { value: "checklists", label: "Checklists", Icon: CheckCircle2 },
  { value: "reservations", label: "Reservations", Icon: MapPin },
  { value: "members", label: "Members", Icon: Users },
  { value: "settings", label: "Settings", Icon: Settings },
] as const;

export default function TripPage() {
  const params = useParams();
  const tripId = params.id as string;

  const { data: trip, isPending: tripPending } = useTrip(tripId);
  const { data: membersData } = useMembers(tripId);

  const [activeTab, setActiveTab] = useState("itinerary");
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const displayRole = mapRole(trip?.role ?? "viewer");
  const canEdit = displayRole !== "viewer";
  const isOwner = trip?.role === "owner";

  const activeMembers = membersData?.active ?? [];
  const stackMembers = activeMembers.slice(0, 3);
  const overflowCount = Math.max(0, activeMembers.length - 3);

  const {
    Icon: RoleIcon,
    label: roleLabel,
    cls: roleCls,
  } = roleConfig[displayRole];

  if (tripPending) {
    return (
      <div className="min-h-screen bg-brand-cream">
        <div className="sticky top-0 z-50 h-16 bg-white border-b-2 border-[#1A1A1A] flex items-center px-4 gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40 rounded" />
        </div>
        <div className="bg-white border-b-2 border-[#1A1A1A] px-6 py-5">
          <div className="max-w-6xl mx-auto space-y-3">
            <Skeleton className="h-9 w-64 rounded" />
            <Skeleton className="h-4 w-80 rounded" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <Skeleton className="h-10 w-140 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const startDateStr = trip.startDate
    ? format(new Date(trip.startDate), "MMM d, yyyy")
    : null;
  const endDateStr = trip.endDate
    ? format(new Date(trip.endDate), "MMM d, yyyy")
    : null;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-brand-cream font-body text-[#111]">
        <header className="sticky top-0 z-50 h-16 bg-white border-b-2 border-[#1A1A1A] flex items-center px-4 md:px-6 gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-8 h-8 border border-transparent hover:border-[#1A1A1A] hover:bg-brand-cream rounded-lg transition-all"
          >
            <ArrowLeft size={15} />
          </Link>

          <Separator orientation="vertical" className="h-6 bg-[#1A1A1A]/20" />

          {trip.coverImageUrl ? (
            <div className="w-6 h-6 rounded border-2 border-[#1A1A1A] shrink-0 overflow-hidden">
              <Image
                src={trip.coverImageUrl}
                alt={trip.title}
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-5 h-5 rounded bg-brand-blue border-2 border-[#1A1A1A] shrink-0" />
          )}

          <span className="font-display font-bold text-base truncate max-w-50 md:max-w-xs">
            {trip.title}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex -space-x-1.5 mr-1">
              {stackMembers.map((m, i) => (
                <Tooltip key={m._id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-7 h-7 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center text-[10px] font-black cursor-default ${memberBg(i)}`}
                    >
                      {toInitials(m.userId?.name)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{m.userId?.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {overflowCount > 0 && (
                <div className="w-7 h-7 rounded-full border-2 border-[#1A1A1A] bg-[#e5e7eb] flex items-center justify-center text-[10px] font-black">
                  +{overflowCount}
                </div>
              )}
            </div>

            {trip.isPublic && (
              <Link
                href={`/public/${tripId}`}
                target="_blank"
                className="hidden md:flex items-center gap-1.5 h-8 px-3 text-xs font-bold border-2 border-[#1A1A1A] rounded-lg shadow-[2px_2px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all bg-white"
              >
                <Globe className="w-3.5 h-3.5" />
                Public view
              </Link>
            )}

            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setEditSheetOpen(true)}
                    className="flex items-center gap-1.5 h-8 px-3 text-xs font-bold border-2 border-[#1A1A1A] rounded-lg shadow-[2px_2px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all bg-white"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Edit trip</TooltipContent>
              </Tooltip>
            )}
          </div>
        </header>

        <div
          className={`relative border-b-2 border-[#1A1A1A] px-4 md:px-6 ${
            trip.coverImageUrl ? "py-16 md:py-24" : "py-5 bg-white"
          }`}
        >
          {trip.coverImageUrl && (
            <>
              <Image
                src={trip.coverImageUrl}
                alt={trip.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/40 to-black/10" />
            </>
          )}
          <div
            className={`relative max-w-6xl mx-auto flex items-start justify-between gap-4`}
          >
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className={`font-display font-black text-2xl md:text-3xl uppercase tracking-tight ${
                    trip.coverImageUrl ? "text-white drop-shadow-md" : ""
                  }`}
                >
                  {trip.title}
                </h1>
                <Badge
                  className={`border text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    trip.coverImageUrl
                      ? "bg-white/20 border-white/40 text-white backdrop-blur-sm"
                      : roleCls
                  }`}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleLabel}
                </Badge>
              </div>

              <div
                className={`flex items-center gap-4 flex-wrap text-sm font-medium ${
                  trip.coverImageUrl ? "text-white/80" : "text-[#6B7280]"
                }`}
              >
                {trip.destination && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {trip.destination}
                  </span>
                )}
                {startDateStr && endDateStr && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {startDateStr} → {endDateStr}
                  </span>
                )}
                {activeMembers.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {activeMembers.length} member
                    {activeMembers.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => setActiveTab("members")}
                className={`shrink-0 flex items-center gap-1.5 h-auto px-4 py-2 text-sm font-bold border-2 border-[#1A1A1A] rounded-lg shadow-[4px_4px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#1A1A1A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_#1A1A1A] transition-all duration-150 ${
                  trip.coverImageUrl
                    ? "bg-white text-[#111]"
                    : "bg-brand-blue text-[#111]"
                }`}
              >
                <UserPlus size={14} />
                Invite
              </button>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto pb-1 mb-6">
              <TabsList className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl p-1 h-auto gap-1 w-max">
                {TAB_CONFIG.map(({ value, label, Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap data-[state=active]:bg-[#111] data-[state=active]:text-white data-[state=active]:shadow-none data-[state=inactive]:hover:bg-[#f0f0ec]"
                  >
                    <Icon size={13} />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="itinerary" className="mt-0">
              <ItineraryTab tripId={tripId} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="budget" className="mt-0">
              <BudgetTab tripId={tripId} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="files" className="mt-0">
              <FilesTab tripId={tripId} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="checklists" className="mt-0">
              <ChecklistsTab tripId={tripId} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="reservations" className="mt-0">
              <ReservationsTab tripId={tripId} canEdit={canEdit} />
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              <MembersTab tripId={tripId} currentUserRole={displayRole} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <SettingsTab
                tripId={tripId}
                isOwner={isOwner}
                canEdit={canEdit}
                tripTitle={trip.title}
              />
            </TabsContent>
          </Tabs>
        </div>

        <TripEditSheet
          tripId={tripId}
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
        />
      </div>
    </TooltipProvider>
  );
}
