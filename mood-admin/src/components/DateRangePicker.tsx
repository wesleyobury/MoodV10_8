"use client";

import { useState } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

const rolling = (days: number): [Date, Date] => {
  const end = endOfDay(new Date());
  return [startOfDay(subDays(end, days - 1)), end];
};
const singleDay = (daysAgo: number): [Date, Date] => {
  const d = subDays(new Date(), daysAgo);
  return [startOfDay(d), endOfDay(d)];
};

const presets: { label: string; range: () => [Date, Date] }[] = [
  { label: "Today", range: () => singleDay(0) },
  { label: "Yesterday", range: () => singleDay(1) },
  { label: "Last 7 days", range: () => rolling(7) },
  { label: "Last 14 days", range: () => rolling(14) },
  { label: "Last 30 days", range: () => rolling(30) },
  { label: "Last 90 days", range: () => rolling(90) },
];

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (range: () => [Date, Date]) => {
    const [start, end] = range();
    onChange(start, end);
    setIsOpen(false);
  };

  const formatRange = () => {
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md text-sm hover:bg-accent transition-colors"
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{formatRange()}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-20 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[180px]">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset.range)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
