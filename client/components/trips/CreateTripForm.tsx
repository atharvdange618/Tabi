"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTripSchema,
  tripBaseSchema,
  type CreateTripPayload,
} from "shared/validations";
import { z } from "zod";
import { useCreateTrip } from "../../hooks/useTrips";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfDay } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { useState } from "react";

export default function CreateTripForm({
  onSuccess,
}: { onSuccess?: () => void } = {}) {
  const createTrip = useCreateTrip();
  const [tagInput, setTagInput] = useState("");

  const form = useForm<z.infer<typeof tripBaseSchema>>({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      title: "",
      description: "",
      destination: "",
      travelerCount: 1,
      tags: [],
    },
  });

  function onSubmit(data: CreateTripPayload) {
    createTrip.mutate(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold font-display">
                Trip Title
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Tokyo Spring 2026"
                  className="brutal-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold font-display">
                Destination
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Kyoto, Japan"
                  className="brutal-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold font-display">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="A brief description of the trip..."
                  className="brutal-input resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold font-display">
                Tags
              </FormLabel>
              <div className="space-y-2">
                {field.value && field.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.value.map((tag, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const newTags = field.value?.filter(
                            (_, i) => i !== index,
                          );
                          field.onChange(newTags);
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
                        if (
                          trimmed &&
                          (!field.value || field.value.length < 10) &&
                          !field.value?.includes(trimmed)
                        ) {
                          field.onChange([...(field.value || []), trimmed]);
                          setTagInput("");
                        }
                      }
                    }}
                    placeholder="Add a tag (e.g. beach, adventure)..."
                    className="brutal-input flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const trimmed = tagInput.trim();
                      if (
                        trimmed &&
                        (!field.value || field.value.length < 10) &&
                        !field.value?.includes(trimmed)
                      ) {
                        field.onChange([...(field.value || []), trimmed]);
                        setTagInput("");
                      }
                    }}
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white font-bold border-2 border-[#1A1A1A]"
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add up to 10 tags to help others discover your trip (max 20
                  characters each)
                </p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-semibold font-display">
                  Start Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "brutal-input w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 brutal-card"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date?.toISOString() || "")
                      }
                      disabled={(date) => date < startOfDay(new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-sm font-semibold font-display">
                  End Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "brutal-input w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 brutal-card"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date?.toISOString() || "")
                      }
                      disabled={(date) => {
                        const minDate = form.getValues("startDate")
                          ? startOfDay(new Date(form.getValues("startDate")))
                          : startOfDay(new Date());
                        return date < minDate;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="travelerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold font-display">
                  Number of Travelers
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="e.g. 4"
                    className="brutal-input w-full"
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initialBudget"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold font-display">
                  Initial Budget
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="e.g. 5000"
                    className="brutal-input w-full"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseInt(e.target.value)
                        : undefined;
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  You can update the budget anytime from the trip&apos;s
                  Settings tab.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || createTrip.isPending}
            className="brutal-button bg-brand-blue hover:bg-brand-lemon px-8"
          >
            {createTrip.isPending ? "Creating..." : "Create Trip"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
