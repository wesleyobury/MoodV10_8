"use client";

import { useState, useEffect } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar, ChevronDown, Filter, ToggleLeft, ToggleRight, Users, X } from "lucide-react";
import { Tooltip, METRIC_TOOLTIPS } from "./Tooltip";
import { cn } from "@/lib/utils";

export interface GlobalFilters {
  startDate: Date;
  endDate: Date;
  granularity: "hour" | "day" | "week";
  compareEnabled: boolean;
  includeInternal: boolean;
  segments: {
    userType: string[];
    platform: string[];
  };
}

interface GlobalFilterBarProps {
  filters: GlobalFilters;
  onChange: (filters: GlobalFilters) => void;
}

const DATE_PRESETS = [
  { label: "Today", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 12 months", days: 365 },
  { label: "All time", days: 3650 },
];

const GRANULARITY_OPTIONS = [
  { value: "hour", label: "Hourly" },
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
];

export function GlobalFilterBar({ filters, onChange }: GlobalFilterBarProps) {
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [granularityDropdownOpen, setGranularityDropdownOpen] = useState(false);

  const handlePreset = (days: number) => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days - 1));
    // Auto-pick granularity so long ranges don't render thousands of daily
    // points (e.g. "All time" → weekly). Users can still override below.
    const granularity: GlobalFilters["granularity"] =
      days <= 2 ? "hour" : days <= 120 ? "day" : "week";
    onChange({ ...filters, startDate: start, endDate: end, granularity });
    setDateDropdownOpen(false);
  };

  const handleGranularity = (granularity: GlobalFilters["granularity"]) => {
    onChange({ ...filters, granularity });
    setGranularityDropdownOpen(false);
  };

  const toggleCompare = () => {
    onChange({ ...filters, compareEnabled: !filters.compareEnabled });
  };

  const toggleInternal = () => {
    onChange({ ...filters, includeInternal: !filters.includeInternal });
  };

  const formatDateRange = () => {
    return `${format(filters.startDate, "MMM d")} - ${format(filters.endDate, "MMM d, yyyy")}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3 mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Date Range */}
        <div className="relative">
          <button
            onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm hover:bg-accent transition-colors"
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDateRange()}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {dateDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDateDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg p-1 min-w-[140px]">
                {DATE_PRESETS.map((preset) => (
                  <button
                    key={preset.days}
                    onClick={() => handlePreset(preset.days)}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent rounded transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Granularity */}
        <div className="relative">
          <button
            onClick={() => setGranularityDropdownOpen(!granularityDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm hover:bg-accent transition-colors"
          >
            <span className="capitalize">{filters.granularity}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {granularityDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setGranularityDropdownOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg p-1 min-w-[100px]">
                {GRANULARITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleGranularity(opt.value as GlobalFilters["granularity"])}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded transition-colors",
                      filters.granularity === opt.value ? "bg-primary/10 text-primary" : "hover:bg-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Compare Toggle */}
        <button
          onClick={toggleCompare}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
            filters.compareEnabled
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-background border border-border hover:bg-accent"
          )}
        >
          {filters.compareEnabled ? (
            <ToggleRight className="h-4 w-4" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          )}
          <span>Compare</span>
          <Tooltip content={METRIC_TOOLTIPS.comparePeriod} />
        </button>

        {/* Internal Users Toggle */}
        <button
          onClick={toggleInternal}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
            filters.includeInternal
              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
              : "bg-background border border-border hover:bg-accent"
          )}
        >
          <Users className="h-4 w-4" />
          <span>{filters.includeInternal ? "Internal ON" : "Internal OFF"}</span>
          <Tooltip content={METRIC_TOOLTIPS.includeInternal} />
        </button>

        <div className="flex-1" />

        {/* Active Filters Summary */}
        <div className="text-xs text-muted-foreground">
          {Math.ceil((filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
          {filters.compareEnabled && " • comparing"}
          {filters.includeInternal && " • incl. internal"}
        </div>
      </div>
    </div>
  );
}

export const defaultFilters: GlobalFilters = {
  startDate: subDays(new Date(), 7),
  endDate: new Date(),
  granularity: "day",
  compareEnabled: false,
  includeInternal: false,
  segments: {
    userType: [],
    platform: [],
  },
};
