import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface FilterPanelProps {
  destination: string;
  tags: string[];
  minDuration?: number;
  maxDuration?: number;
  onDestinationChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onDurationChange: (min?: number, max?: number) => void;
  onClearFilters: () => void;
}

const DURATION_PRESETS = [
  { label: "Weekend", min: 2, max: 3 },
  { label: "Week", min: 5, max: 7 },
  { label: "Extended", min: 8, max: 14 },
  { label: "Long-term", min: 15, max: undefined },
];

const POPULAR_TAGS = [
  "adventure",
  "beach",
  "city",
  "culture",
  "food",
  "hiking",
  "nature",
  "relaxation",
  "roadtrip",
  "sightseeing",
];

function FilterContent({
  destination,
  tags,
  minDuration,
  maxDuration,
  onDestinationChange,
  onTagsChange,
  onDurationChange,
  onClearFilters,
}: FilterPanelProps) {
  const [customTag, setCustomTag] = useState("");

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed]);
      setCustomTag("");
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const selectDurationPreset = (min?: number, max?: number) => {
    onDurationChange(min, max);
  };

  const hasActiveFilters =
    destination ||
    tags.length > 0 ||
    minDuration !== undefined ||
    maxDuration !== undefined;

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <Button
          onClick={onClearFilters}
          variant="outline"
          size="sm"
          className="w-full border-2 border-[#1A1A1A] font-medium hover:bg-zinc-100"
        >
          <X size={16} className="mr-2" />
          Clear all filters
        </Button>
      )}

      <div>
        <Label className="text-sm font-bold text-[#111] mb-2 block">
          Destination
        </Label>
        <Input
          type="text"
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
          placeholder="Enter destination..."
          className="border-2 border-[#1A1A1A] rounded-lg font-medium focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-brand-blue"
        />
      </div>

      <div>
        <Label className="text-sm font-bold text-[#111] mb-2 block">
          Duration
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {DURATION_PRESETS.map((preset) => {
            const isActive =
              minDuration === preset.min && maxDuration === preset.max;
            return (
              <Button
                key={preset.label}
                onClick={() => selectDurationPreset(preset.min, preset.max)}
                variant="outline"
                size="sm"
                className={cn(
                  "border-2 border-[#1A1A1A] font-bold text-xs uppercase transition-colors",
                  isActive
                    ? "bg-brand-blue text-white"
                    : "bg-white hover:bg-zinc-50",
                )}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-sm font-bold text-[#111] mb-2 block">Tags</Label>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => removeTag(tag)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-brand-blue text-white border-2 border-[#1A1A1A] hover:bg-opacity-90 transition-colors"
              >
                {tag}
                <X size={12} />
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-2 py-1 rounded-full text-xs font-bold border-2 border-[#1A1A1A] transition-colors uppercase",
                tags.includes(tag)
                  ? "bg-brand-blue text-white"
                  : "bg-white hover:bg-zinc-50",
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            placeholder="Add custom tag..."
            className="flex-1 border-2 border-[#1A1A1A] rounded-lg font-medium text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-brand-blue"
          />
          <Button
            onClick={addCustomTag}
            size="sm"
            className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-bold border-2 border-[#1A1A1A]"
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FilterPanel(props: FilterPanelProps) {
  return (
    <>
      <div className="hidden lg:block">
        <div className="bg-white rounded-xl border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] p-6">
          <h2 className="text-xl font-display font-bold text-[#111] mb-6 flex items-center gap-2">
            <SlidersHorizontal size={20} />
            Filters
          </h2>
          <FilterContent {...props} />
        </div>
      </div>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-2 border-[#1A1A1A] font-bold hover:bg-zinc-50"
            >
              <SlidersHorizontal size={18} className="mr-2" />
              Filters
              {(props.destination ||
                props.tags.length > 0 ||
                props.minDuration !== undefined ||
                props.maxDuration !== undefined) && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-brand-blue text-white text-xs">
                  Active
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-75 sm:w-100">
            <SheetHeader>
              <SheetTitle className="text-xl font-display font-bold text-[#111] flex items-center gap-2">
                <SlidersHorizontal size={20} />
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
