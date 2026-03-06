"use client";

import { useParams } from "next/navigation";
import { useDays } from "../../hooks/useDays";
import {
  useActivities,
  useCreateActivity,
  useDeleteActivity,
  useReorderActivities,
  useUpdateActivity,
} from "../../hooks/useActivities";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createActivitySchema,
  type CreateActivityPayload,
  activityTypes,
} from "../../../shared/validations";
import CommentsSection from "./CommentsSection";
import {
  Plus,
  Trash2,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
  CalendarDays,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { TimePicker } from "@/components/ui/time-picker";
import type { Day, Activity } from "../../../shared/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SortableActivityCardProps {
  activity: Activity;
  tripId: string;
  dayId: string;
}

function SortableActivityCard({
  activity,
  tripId,
  dayId,
}: SortableActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const deleteActivity = useDeleteActivity(tripId, dayId);
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

  const typeColors: Record<string, string> = {
    sightseeing: "bg-brand-blue border-brand-blue",
    food: "bg-brand-peach border-brand-peach",
    transport: "bg-brand-lemon border-brand-lemon",
    accommodation: "bg-brand-mint border-brand-mint",
    activity: "bg-brand-blue border-brand-blue",
    other: "bg-gray-200 border-gray-200",
  };

  if (isEditing) {
    return (
      <div className="mb-3">
        <EditActivityForm
          activity={activity}
          tripId={tripId}
          dayId={dayId}
          onClose={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`brutal-card rounded-lg p-4 flex items-start gap-3 bg-white hover:shadow-[5px_5px_0px_theme(--color-brutal-shadow)] transition-shadow ${
        isDragging ? "cursor-grabbing" : ""
      }`}
    >
      {/* Drag Handle */}
      <Button
        variant="ghost"
        {...attributes}
        {...listeners}
        className="p-1 text-muted-foreground hover:text-foreground hover:bg-transparent cursor-grab active:cursor-grabbing shrink-0 size-auto h-auto"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge
            className={`brutal-badge text-[10px] ${typeColors[activity.type] || "bg-gray-200"}`}
          >
            {activity.type}
          </Badge>
          <h4 className="text-sm font-semibold font-display truncate">
            {activity.title}
          </h4>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {(activity.startTime || activity.endTime) && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {activity.startTime}
              {activity.endTime && ` – ${activity.endTime}`}
            </span>
          )}
          {activity.location && (
            <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
              <MapPin size={12} />
              <span className="truncate">{activity.location}</span>
            </span>
          )}
          {activity.estimatedCost != null && activity.estimatedCost > 0 && (
            <span className="font-mono font-semibold">
              ₹{activity.estimatedCost}
            </span>
          )}
        </div>

        {activity.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 font-body">
            {activity.notes}
          </p>
        )}

        <CommentsSection
          tripId={tripId}
          targetType="activity"
          targetId={activity._id}
        />
      </div>

      <div className="flex flex-col gap-1 items-center shrink-0">
        <Button
          onClick={() => setIsEditing(true)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-brand-blue hover:bg-brand-blue/10"
          title="Edit activity"
          aria-label="Edit activity"
        >
          <Pencil size={14} />
        </Button>
        <Button
          onClick={() => deleteActivity.mutate(activity._id)}
          disabled={deleteActivity.isPending}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-brand-coral hover:bg-brand-coral/10"
          title="Delete activity"
          aria-label="Delete activity"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const typeColors: Record<string, string> = {
    sightseeing: "bg-brand-blue border-brand-blue",
    food: "bg-brand-peach border-brand-peach",
    transport: "bg-brand-lemon border-brand-lemon",
    accommodation: "bg-brand-mint border-brand-mint",
    activity: "bg-brand-blue border-brand-blue",
    other: "bg-gray-200 border-gray-200",
  };

  return (
    <div className="brutal-card rounded-lg p-4 flex items-start gap-3 bg-white">
      <div className="w-4" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge
            className={`brutal-badge text-[10px] ${typeColors[activity.type] || "bg-gray-200"}`}
          >
            {activity.type}
          </Badge>
          <h4 className="text-sm font-semibold font-display truncate">
            {activity.title}
          </h4>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {(activity.startTime || activity.endTime) && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {activity.startTime}
              {activity.endTime && ` – ${activity.endTime}`}
            </span>
          )}
          {activity.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} />
              {activity.location}
            </span>
          )}
          {activity.estimatedCost != null && activity.estimatedCost > 0 && (
            <span className="font-mono font-semibold">
              ₹{activity.estimatedCost}
            </span>
          )}
        </div>

        {activity.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {activity.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function AddActivityForm({
  tripId,
  dayId,
  onClose,
}: {
  tripId: string;
  dayId: string;
  onClose: () => void;
}) {
  const createActivity = useCreateActivity(tripId, dayId);
  const [selectedType, setSelectedType] = useState<string>("sightseeing");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<CreateActivityPayload>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: { type: "sightseeing" },
  });

  function onSubmit(data: CreateActivityPayload) {
    createActivity.mutate(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="brutal-card rounded-lg p-5 space-y-4 mt-3 bg-brand-cream/50"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold font-display">Add Activity</h4>
        <Button
          type="button"
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Input
            {...register("title")}
            placeholder="Activity title *"
            className="brutal-input"
          />
          {errors.title && (
            <p className="text-xs text-brand-coral">{errors.title.message}</p>
          )}
        </div>
        <Select
          value={selectedType}
          onValueChange={(value) => {
            setSelectedType(value);
            setValue("type", value as CreateActivityPayload["type"]);
          }}
        >
          <SelectTrigger className="brutal-input">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="brutal-card">
            {activityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground ml-1">Start Time</p>
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <TimePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground ml-1">End Time</p>
          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <TimePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>
      <div>
        <Input
          {...register("location")}
          placeholder="Location"
          className="brutal-input w-full"
        />
      </div>

      <Textarea
        {...register("notes")}
        rows={2}
        placeholder="Notes (optional)"
        className="brutal-input resize-none"
      />

      <div className="flex items-center gap-3">
        <Input
          type="number"
          step="0.01"
          {...register("estimatedCost", { valueAsNumber: true })}
          placeholder="Est. cost (₹)"
          className="brutal-input w-40"
        />
        <div className="flex-1" />
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createActivity.isPending}
          className="brutal-button bg-brand-mint hover:bg-brand-mint/90"
        >
          {createActivity.isPending ? "Adding..." : "Add"}
        </Button>
      </div>
    </form>
  );
}

function EditActivityForm({
  tripId,
  dayId,
  activity,
  onClose,
}: {
  tripId: string;
  dayId: string;
  activity: Activity;
  onClose: () => void;
}) {
  const updateActivity = useUpdateActivity(tripId, dayId);
  const [selectedType, setSelectedType] = useState<string>(activity.type);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<CreateActivityPayload>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      title: activity.title,
      type: activity.type,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      notes: activity.notes,
      estimatedCost: activity.estimatedCost,
    },
  });

  function onSubmit(data: CreateActivityPayload) {
    updateActivity.mutate(
      { actId: activity._id, payload: data },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="brutal-card rounded-lg p-5 space-y-4 bg-brand-cream/50 w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold font-display">Edit Activity</h4>
        <Button
          type="button"
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
        >
          <X size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Input
            {...register("title")}
            placeholder="Activity title *"
            className="brutal-input"
          />
          {errors.title && (
            <p className="text-xs text-brand-coral">{errors.title.message}</p>
          )}
        </div>
        <Select
          value={selectedType}
          onValueChange={(value) => {
            setSelectedType(value);
            setValue("type", value as CreateActivityPayload["type"]);
          }}
        >
          <SelectTrigger className="brutal-input">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent className="brutal-card">
            {activityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground ml-1">Start Time</p>
          <Controller
            control={control}
            name="startTime"
            render={({ field }) => (
              <TimePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground ml-1">End Time</p>
          <Controller
            control={control}
            name="endTime"
            render={({ field }) => (
              <TimePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>
      <div>
        <Input
          {...register("location")}
          placeholder="Location"
          className="brutal-input w-full"
        />
      </div>

      <Textarea
        {...register("notes")}
        rows={2}
        placeholder="Notes (optional)"
        className="brutal-input resize-none"
      />

      <div className="flex items-center gap-3">
        <Input
          type="number"
          step="0.01"
          {...register("estimatedCost", { valueAsNumber: true })}
          placeholder="Est. cost (₹)"
          className="brutal-input w-40"
        />
        <div className="flex-1" />
        <Button type="button" onClick={onClose} variant="outline">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={updateActivity.isPending}
          className="brutal-button bg-brand-blue hover:bg-brand-blue/90 text-white"
        >
          {updateActivity.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}

function DayCard({ day, tripId }: { day: Day; tripId: string }) {
  const { data: activities, isLoading } = useActivities(tripId, day._id);
  const reorderActivities = useReorderActivities(tripId, day._id);
  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const dateStr = new Date(day.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id || !activities) {
      return;
    }

    const oldIndex = activities.findIndex((act) => act._id === active.id);
    const newIndex = activities.findIndex((act) => act._id === over.id);

    const reordered = arrayMove(activities, oldIndex, newIndex);
    const newOrder = reordered.map((act) => act._id);

    reorderActivities.mutate(newOrder);
  }

  const activeActivity = activities?.find((act) => act._id === activeId);

  return (
    <div className="mb-6">
      {/* Day Header */}
      <div className="flex items-center gap-3 mb-3">
        <Button
          onClick={() => setCollapsed(!collapsed)}
          variant="ghost"
          size="icon"
          className="h-7 w-7"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </Button>
        <Badge className="brutal-badge bg-brand-blue border-brand-blue rounded-md px-3 py-1 text-xs">
          {dateStr}
        </Badge>
        {day.label && (
          <h3 className="font-display font-extrabold text-base uppercase tracking-tight">
            {day.label}
          </h3>
        )}
        <div className="flex-1" />
        <Button
          onClick={() => setShowForm(!showForm)}
          className="brutal-button bg-brand-mint hover:bg-brand-mint/90 text-foreground"
          size="sm"
        >
          <Plus size={14} />
          Activity
        </Button>
      </div>

      {day.notes && !collapsed && (
        <p className="text-sm text-muted-foreground font-body ml-10 mb-3">
          {day.notes}
        </p>
      )}

      {/* Activity List */}
      {!collapsed && (
        <div className="ml-10 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activities.map((act) => act._id)}
                strategy={verticalListSortingStrategy}
              >
                {activities.map((act) => (
                  <SortableActivityCard
                    key={act._id}
                    activity={act}
                    tripId={tripId}
                    dayId={day._id}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeActivity ? (
                  <ActivityCard activity={activeActivity} />
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="border-2 border-dashed border-[#1a1a1a]/20 rounded-lg p-6 text-center bg-white/30">
              <p className="text-sm text-muted-foreground font-body">
                No activities yet. Add your first stop.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Activity Form */}
      {showForm && !collapsed && (
        <div className="ml-10">
          <AddActivityForm
            tripId={tripId}
            dayId={day._id}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}

function ItinerarySkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-md" />
            <Skeleton className="h-6 w-32 rounded-md" />
          </div>
          <div className="ml-10 space-y-3">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ItineraryContent() {
  const params = useParams<{ id: string }>();
  const { data: days, isLoading, isError } = useDays(params.id);

  if (isLoading) return <ItinerarySkeleton />;

  if (isError) {
    return (
      <div className="brutal-card rounded-xl p-8 text-center bg-white">
        <p className="text-brand-coral font-body font-semibold">
          Failed to load itinerary. Please try again.
        </p>
      </div>
    );
  }

  if (!days || days.length === 0) {
    return (
      <div className="brutal-card rounded-xl p-12 text-center bg-white">
        <div className="w-16 h-16 bg-brand-peach rounded-2xl border-2 border-brutal-border flex items-center justify-center mb-6 shadow-[4px_4px_0px_theme(--color-brutal-shadow)] mx-auto -rotate-3">
          <CalendarDays size={32} />
        </div>
        <h2 className="text-xl font-bold font-display mb-2">No days yet</h2>
        <p className="text-muted-foreground font-body">
          Days are automatically generated from your trip date range.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {days.map((day) => (
        <DayCard key={day._id} day={day} tripId={params.id} />
      ))}
    </div>
  );
}
