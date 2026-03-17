"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ImageIcon, Loader2, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTrip,
  useUpdateTrip,
  useUploadTripCoverImage,
} from "@/hooks/useTrips";
import type { Trip } from "shared/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";

interface TripEditSheetProps {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TripEditSheet({
  tripId,
  open,
  onOpenChange,
}: TripEditSheetProps) {
  const { data: trip } = useTrip(tripId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md border-l-2 border-[#1A1A1A] bg-[#FAFAF8] p-0 overflow-y-auto"
      >
        <SheetHeader className="sticky top-0 z-10 bg-[#FAFAF8] border-b-2 border-[#1A1A1A] px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display font-black text-xl uppercase tracking-tight">
              Edit Trip
            </SheetTitle>
          </div>
        </SheetHeader>

        {trip && open && (
          <TripEditForm
            key={`${tripId}-${trip.updatedAt}`}
            trip={trip}
            tripId={tripId}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TripEditForm({
  trip,
  tripId,
  onClose,
}: {
  trip: Trip;
  tripId: string;
  onClose: () => void;
}) {
  const updateTrip = useUpdateTrip(tripId);
  const uploadCover = useUploadTripCoverImage(tripId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(trip.title ?? "");
  const [destination, setDestination] = useState(trip.destination ?? "");
  const [description, setDescription] = useState(trip.description ?? "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    trip.startDate ? new Date(trip.startDate) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    trip.endDate ? new Date(trip.endDate) : undefined,
  );
  const [tags, setTags] = useState<string[]>(trip.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadCover.mutate(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const dirty: Record<string, unknown> = {};
    if (title.trim() && title !== trip.title) dirty.title = title.trim();
    if (destination !== (trip.destination ?? ""))
      dirty.destination = destination;
    if (description !== (trip.description ?? ""))
      dirty.description = description;
    if (startDate && startDate.toISOString() !== trip.startDate)
      dirty.startDate = startDate.toISOString();
    if (endDate && endDate.toISOString() !== trip.endDate)
      dirty.endDate = endDate.toISOString();
    if (JSON.stringify(tags) !== JSON.stringify(trip.tags ?? []))
      dirty.tags = tags;

    if (Object.keys(dirty).length === 0) {
      onClose();
      return;
    }

    updateTrip.mutate(dirty, {
      onSuccess: () => onClose(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-bold font-display uppercase tracking-wide">
          Cover Image
        </Label>
        <div
          className={cn(
            "relative w-full h-36 border-2 border-dashed border-[#1A1A1A] rounded-xl overflow-hidden bg-white transition-colors",
            uploadCover.isPending
              ? "cursor-not-allowed"
              : "cursor-pointer hover:bg-[#f5f5f0]",
          )}
          onClick={() =>
            !uploadCover.isPending && fileInputRef.current?.click()
          }
        >
          {trip.coverImageUrl ? (
            <>
              <Image
                src={trip.coverImageUrl}
                alt="Cover"
                width={500}
                height={200}
                className="w-full h-full object-cover"
              />
              {uploadCover.isPending ? (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                  <span className="text-white text-xs font-bold tracking-wide uppercase">
                    Uploading…
                  </span>
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Pencil className="w-4 h-4" />
                    Change cover
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[#6B7280]">
              {uploadCover.isPending ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm font-bold tracking-wide uppercase">
                    Uploading…
                  </span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm font-medium">
                    Click to upload cover
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.webp"
          className="hidden"
          onChange={handleCoverChange}
        />
        <p className="text-xs text-muted-foreground">
          JPEG, JPG, and WebP files are supported.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="title"
          className="text-sm font-bold font-display uppercase tracking-wide"
        >
          Trip Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Tokyo Spring 2026"
          required
          className="border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-lg focus-visible:ring-0 focus-visible:shadow-[3px_3px_0px_#1A1A1A]"
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="destination"
          className="text-sm font-bold font-display uppercase tracking-wide"
        >
          Destination
        </Label>
        <Input
          id="destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Tokyo, Japan"
          className="border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-lg focus-visible:ring-0 focus-visible:shadow-[3px_3px_0px_#1A1A1A]"
        />
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="description"
          className="text-sm font-bold font-display uppercase tracking-wide"
        >
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A brief description of the trip..."
          className="border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-lg focus-visible:ring-0 focus-visible:shadow-[3px_3px_0px_#1A1A1A] resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-bold font-display uppercase tracking-wide">
            Start Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-lg h-10",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                classNames={{
                  today: "ring-2 ring-[#1A1A1A] rounded-md font-bold",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-bold font-display uppercase tracking-wide">
            End Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-lg h-10",
                  !endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
                classNames={{
                  today: "ring-2 ring-[#1A1A1A] rounded-md font-bold",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-bold font-display uppercase tracking-wide">
          Tags
        </Label>
        <div className="space-y-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setTags(tags.filter((_, i) => i !== index));
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-brand-blue text-white border-2 border-[#1A1A1A] hover:bg-opacity-90 transition-colors"
                >
                  {tag}
                  <X size={12} />
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="text"
              value={tagInput}
              onChange={(e) =>
                setTagInput(e.target.value.toLowerCase().slice(0, 20))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = tagInput.trim();
                  if (trimmed && tags.length < 10 && !tags.includes(trimmed)) {
                    setTags([...tags, trimmed]);
                    setTagInput("");
                  }
                }
              }}
              placeholder="Add a tag (e.g. beach, adventure)..."
              className="border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] rounded-lg focus-visible:ring-0 focus-visible:shadow-[3px_3px_0px_#1A1A1A] flex-1"
            />
            <Button
              type="button"
              onClick={() => {
                const trimmed = tagInput.trim();
                if (trimmed && tags.length < 10 && !tags.includes(trimmed)) {
                  setTags([...tags, trimmed]);
                  setTagInput("");
                }
              }}
              className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-bold border-2 border-[#1A1A1A]"
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add up to 10 tags to help others discover your trip
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] font-bold rounded-lg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1A1A1A] transition-all"
          onClick={() => onClose()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={updateTrip.isPending || !title.trim()}
          className="flex-1 bg-[#111] text-white border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold rounded-lg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] transition-all"
        >
          {updateTrip.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
