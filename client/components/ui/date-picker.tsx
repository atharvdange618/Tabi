"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  className?: string;
  showTimePicker?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
  showTimePicker = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value) : undefined;
  const getTimeFromDate = (date?: Date) => {
    if (!date) return "";
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const [time, setTime] = useState<string>(getTimeFromDate(selectedDate));

  const combineDateAndTime = (date: Date, timeStr: string) => {
    if (!showTimePicker || !timeStr) {
      return date.toISOString();
    }

    const match = timeStr.match(/(\d{2}):(\d{2})\s(AM|PM)/);
    if (!match) return date.toISOString();

    const [, hourStr, minuteStr, period] = match;
    let hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const isoString = combineDateAndTime(date, time);
    onChange(isoString);

    if (!showTimePicker) {
      setOpen(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (selectedDate) {
      const isoString = combineDateAndTime(selectedDate, newTime);
      onChange(isoString);
    }
  };

  const displayFormat = showTimePicker && value && time ? "PPP 'at' p" : "PPP";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal border-2 border-[#1A1A1A] rounded-lg h-10 px-3",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {value ? (
            format(selectedDate!, displayFormat)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-2 border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] rounded-xl"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          disabled={disabled}
          initialFocus
        />
        {showTimePicker && (
          <div className="border-t border-[#1A1A1A] p-3">
            <TimePicker value={time} onChange={handleTimeChange} />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
