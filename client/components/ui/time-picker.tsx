"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({
  value,
  onChange,
  className,
  disabled,
}: TimePickerProps) {
  const match = value?.match(/(\d{2}):(\d{2})\s(AM|PM)/);
  const [hour, setHour] = React.useState<string>(match ? match[1] : "");
  const [minute, setMinute] = React.useState<string>(match ? match[2] : "");
  const [period, setPeriod] = React.useState<string>(match ? match[3] : "AM");

  const updateTime = (h: string, m: string, p: string) => {
    if (!onChange) return;
    if (h && m && p) {
      onChange(`${h}:${m} ${p}`);
    } else {
      onChange("");
    }
  };

  const handleHourChange = (v: string) => {
    setHour(v);
    updateTime(v, minute, period);
  };

  const handleMinuteChange = (v: string) => {
    setMinute(v);
    updateTime(hour, v, period);
  };

  const handlePeriodChange = (v: string) => {
    setPeriod(v);
    updateTime(hour, minute, v);
  };

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 12 }, (_, i) =>
    String(i * 5).padStart(2, "0"),
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={hour} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger className="w-[80px] brutal-input">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="brutal-card">
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="font-bold">:</span>
      <Select
        value={minute}
        onValueChange={handleMinuteChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[80px] brutal-input">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="brutal-card">
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={period}
        onValueChange={handlePeriodChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[80px] brutal-input">
          <SelectValue placeholder="AM" />
        </SelectTrigger>
        <SelectContent className="brutal-card">
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
