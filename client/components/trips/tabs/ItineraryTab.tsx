"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Clock,
  MoreHorizontal,
  Plus,
  MapPin,
  IndianRupee,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  activityColor,
  formatDisplayTime,
  computeDuration,
} from "@/lib/helpers";
import { TimePicker } from "@/components/ui/time-picker";
import { useDays } from "@/hooks/useDays";
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useReorderActivities,
} from "@/hooks/useActivities";
import CommentsSection from "@/components/itinerary/CommentsSection";
import type { Activity } from "shared/types";
import { activityTypes } from "shared/validations";

interface ActivityForm {
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  estimatedCost: string;
}

const emptyForm: ActivityForm = {
  title: "",
  type: "other",
  startTime: "",
  endTime: "",
  location: "",
  notes: "",
  estimatedCost: "",
};

function SortableActivityCard({
  activity,
  tripId,
  dayId,
  canEdit,
  onEdit,
}: {
  activity: Activity;
  tripId: string;
  dayId: string;
  canEdit: boolean;
  onEdit: (activity: Activity) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const deleteActivity = useDeleteActivity(tripId, dayId);

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group flex items-start gap-3 bg-white border-2 border-[#1A1A1A] rounded-lg p-3 shadow-[3px_3px_0px_#1A1A1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] transition-all duration-150">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="text-[#d1d5db] group-hover:text-[#9CA3AF] shrink-0 mt-1 cursor-grab transition-colors touch-none"
          >
            <GripVertical size={14} />
          </button>
        )}
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full border-2 border-[#1A1A1A] shrink-0 mt-1.5",
            activityColor(activity.type),
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display font-semibold text-sm text-[#111] leading-snug">
              {activity.title}
            </p>
            <span className="shrink-0 capitalize text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1A1A]/20 text-[#6B7280] bg-[#f3f4f6] flex items-center gap-1">
              <Tag size={9} />
              {activity.type}
            </span>
          </div>
          {activity.notes && (
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5 leading-snug">
              {activity.notes}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {activity.startTime && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#9CA3AF]">
                <Clock size={10} />
                {formatDisplayTime(activity.startTime)}
                {activity.endTime && (
                  <>
                    <span className="mx-0.5">→</span>
                    {formatDisplayTime(activity.endTime)}
                  </>
                )}
              </span>
            )}
            {activity.startTime && activity.endTime && (
              <span className="text-[10px] text-[#9CA3AF] font-medium bg-[#f3f4f6] px-1.5 py-0.5 rounded-full">
                {computeDuration(activity.startTime, activity.endTime)}
              </span>
            )}
            {activity.location && (
              <span className="flex items-center gap-1 text-[10px] text-[#6B7280] font-medium">
                <MapPin size={10} />
                {activity.location}
              </span>
            )}
            {activity.estimatedCost != null && activity.estimatedCost > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#6B7280] font-medium">
                <IndianRupee size={10} />
                {activity.estimatedCost.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <div className="mt-2">
            <CommentsSection
              tripId={tripId}
              targetType="activity"
              targetId={activity._id}
            />
          </div>
        </div>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 border border-transparent hover:border-[#1A1A1A] rounded transition-all shrink-0"
              >
                <MoreHorizontal size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl"
            >
              <DropdownMenuItem
                className="text-xs font-medium cursor-pointer"
                onSelect={() => onEdit(activity)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs font-medium text-red-600 cursor-pointer"
                onSelect={() => deleteActivity.mutate(activity._id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function DayCard({
  day,
  dayIndex,
  tripId,
  canEdit,
}: {
  day: { _id: string; date: string; label?: string };
  dayIndex: number;
  tripId: string;
  canEdit: boolean;
}) {
  const { data: activities = [], isLoading } = useActivities(tripId, day._id);
  const reorder = useReorderActivities(tripId, day._id);
  const createActivity = useCreateActivity(tripId, day._id);
  const updateActivity = useUpdateActivity(tripId, day._id);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Activity | null>(null);
  const [form, setForm] = useState<ActivityForm>(emptyForm);

  const sensors = useSensors(useSensor(PointerSensor));

  function openAdd() {
    setForm(emptyForm);
    setAddOpen(true);
  }

  function openEdit(activity: Activity) {
    setEditTarget(activity);
    setForm({
      title: activity.title,
      type: activity.type,
      startTime: activity.startTime ?? "",
      endTime: activity.endTime ?? "",
      location: activity.location ?? "",
      notes: activity.notes ?? "",
      estimatedCost: activity.estimatedCost?.toString() ?? "",
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activities.findIndex((a) => a._id === active.id);
    const newIndex = activities.findIndex((a) => a._id === over.id);
    const reordered = arrayMove(activities, oldIndex, newIndex);
    reorder.mutate(reordered.map((a) => a._id));
  }

  function submitAdd() {
    createActivity.mutate(
      {
        title: form.title,
        type: form.type as Activity["type"],
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        location: form.location || undefined,
        notes: form.notes || undefined,
        estimatedCost: form.estimatedCost
          ? parseFloat(form.estimatedCost)
          : undefined,
      },
      { onSuccess: () => setAddOpen(false) },
    );
  }

  function submitEdit() {
    if (!editTarget) return;
    updateActivity.mutate(
      {
        actId: editTarget._id,
        payload: {
          title: form.title,
          type: form.type as Activity["type"],
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
          location: form.location || undefined,
          notes: form.notes || undefined,
          estimatedCost: form.estimatedCost
            ? parseFloat(form.estimatedCost)
            : undefined,
        },
      },
      { onSuccess: () => setEditTarget(null) },
    );
  }

  const formattedDate = (() => {
    try {
      return format(new Date(day.date), "MMM d, EEE");
    } catch {
      return day.date;
    }
  })();

  return (
    <>
      <div className="bg-white border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#1A1A1A] bg-brand-cream">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-sm uppercase tracking-wide">
              Day {dayIndex + 1}
            </span>
            <span className="text-xs font-medium text-[#6B7280]">
              {formattedDate}
            </span>
            <span className="text-[11px] font-semibold text-[#9CA3AF] bg-white border border-[#e5e7eb] px-2 py-0.5 rounded-full">
              {activities.length} activities
            </span>
          </div>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs font-bold border border-transparent hover:border-[#1A1A1A] hover:bg-white rounded-lg gap-1"
              onClick={openAdd}
            >
              <Plus size={12} />
              Add
            </Button>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          {isLoading ? (
            [1, 2].map((i) => (
              <div
                key={i}
                className="h-16 bg-[#f3f4f6] rounded-lg animate-pulse"
              />
            ))
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activities.map((a) => a._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2.5">
                  {activities.map((activity) => (
                    <SortableActivityCard
                      key={activity._id}
                      activity={activity}
                      tripId={tripId}
                      dayId={day._id}
                      canEdit={canEdit}
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {canEdit && (
            <button
              onClick={openAdd}
              className="w-full py-2.5 border-2 border-dashed border-[#d1d5db] rounded-lg text-xs font-semibold text-[#9CA3AF] hover:border-[#1A1A1A] hover:text-[#6B7280] hover:bg-brand-cream transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              <Plus size={12} />
              Add activity
            </button>
          )}
        </div>
      </div>

      <ActivityDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Activity"
        form={form}
        setForm={setForm}
        onSubmit={submitAdd}
        isPending={createActivity.isPending}
      />

      <ActivityDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title="Edit Activity"
        form={form}
        setForm={setForm}
        onSubmit={submitEdit}
        isPending={updateActivity.isPending}
      />
    </>
  );
}

function ActivityDialog({
  open,
  onOpenChange,
  title,
  form,
  setForm,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: ActivityForm;
  setForm: (f: ActivityForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  function field(key: keyof ActivityForm, value: string) {
    setForm({ ...form, [key]: value });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-2 border-[#1A1A1A] shadow-[8px_8px_0px_#1A1A1A] rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-black text-xl uppercase">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide">
              Title *
            </Label>
            <Input
              value={form.title}
              onChange={(e) => field("title", e.target.value)}
              className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
              placeholder="Activity name"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide">
              Type
            </Label>
            <Select value={form.type} onValueChange={(v) => field("type", v)}>
              <SelectTrigger className="mt-1 border-2 border-[#1A1A1A] rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-2 border-[#1A1A1A] rounded-xl shadow-[4px_4px_0px_#1A1A1A]">
                {activityTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize text-sm">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                Start Time
              </Label>
              <TimePicker
                value={form.startTime}
                onChange={(v) => field("startTime", v)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wide">
                End Time
              </Label>
              <TimePicker
                value={form.endTime}
                onChange={(v) => field("endTime", v)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide">
              Location
            </Label>
            <Input
              value={form.location}
              onChange={(e) => field("location", e.target.value)}
              className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
              placeholder="Optional"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide">
              Notes
            </Label>
            <Input
              value={form.notes}
              onChange={(e) => field("notes", e.target.value)}
              className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
              placeholder="Optional"
            />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wide">
              Estimated Cost (₹)
            </Label>
            <Input
              type="number"
              min="0"
              value={form.estimatedCost}
              onChange={(e) => field("estimatedCost", e.target.value)}
              onKeyDown={(e) => e.key === "-" && e.preventDefault()}
              className="mt-1 border-2 border-[#1A1A1A] rounded-lg"
              placeholder="0"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            className="border-2 border-[#1A1A1A] rounded-lg font-bold"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!form.title.trim() || isPending}
            onClick={onSubmit}
            className="bg-brand-blue text-[#111] border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] font-bold hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1A1A1A] hover:bg-brand-blue transition-all duration-150 rounded-lg"
          >
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ItineraryTab({
  tripId,
  canEdit,
}: {
  tripId: string;
  canEdit: boolean;
}) {
  const { data: days = [], isLoading } = useDays(tripId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border-2 border-[#1A1A1A] rounded-xl overflow-hidden animate-pulse"
          >
            <div className="h-12 bg-brand-cream border-b-2 border-[#1A1A1A]" />
            <div className="p-4 space-y-2.5">
              <div className="h-16 bg-[#f3f4f6] rounded-lg" />
              <div className="h-16 bg-[#f3f4f6] rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-display font-black text-xl uppercase text-[#9CA3AF]">
          No days yet
        </p>
        <p className="text-sm text-[#6B7280] mt-1">
          Days are automatically created when you set the trip dates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day, i) => (
        <DayCard
          key={day._id}
          day={day}
          dayIndex={i}
          tripId={tripId}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
