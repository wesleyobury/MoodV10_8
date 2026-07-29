"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { subDays, format } from "date-fns";

/**
 * One global filter state shared by every analytics page.
 * - rangeDays: how far back we look (7 / 30 / 90 / 180 / 365)
 * - granularity: how points are bucketed on trend charts (day / week / month)
 * - includeInternal: whether staff/test accounts are included (default OFF)
 */
export type Granularity = "day" | "week" | "month";

export interface GlobalFilters {
  rangeDays: number;
  granularity: Granularity;
  includeInternal: boolean;
}

export const RANGE_PRESETS: { label: string; days: number }[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "Last 12 months", days: 365 },
];

export const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

export const defaultFilters: GlobalFilters = {
  rangeDays: 30,
  granularity: "day",
  includeInternal: false,
};

interface FilterContextType {
  filters: GlobalFilters;
  updateFilters: (updates: Partial<GlobalFilters>) => void;
  resetFilters: () => void;
  // Convenience values for API calls
  days: number;
  granularity: Granularity;
  includeInternal: boolean;
  startDate: Date;
  endDate: Date;
  startDateStr: string;
  endDateStr: string;
  rangeLabel: string;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);

  const updateFilters = useCallback((updates: Partial<GlobalFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      // Keep granularity sensible for the chosen range:
      // daily buckets over 6+ months are unreadable; monthly over a week is empty.
      if (updates.rangeDays !== undefined && updates.granularity === undefined) {
        if (next.rangeDays >= 180 && next.granularity === "day") next.granularity = "week";
        if (next.rangeDays <= 14 && next.granularity !== "day") next.granularity = "day";
      }
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => setFilters(defaultFilters), []);

  const value = useMemo<FilterContextType>(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, filters.rangeDays);
    const preset = RANGE_PRESETS.find((p) => p.days === filters.rangeDays);
    return {
      filters,
      updateFilters,
      resetFilters,
      days: filters.rangeDays,
      granularity: filters.granularity,
      includeInternal: filters.includeInternal,
      startDate,
      endDate,
      startDateStr: format(startDate, "yyyy-MM-dd"),
      endDateStr: format(endDate, "yyyy-MM-dd"),
      rangeLabel: preset ? preset.label : `Last ${filters.rangeDays} days`,
    };
  }, [filters, updateFilters, resetFilters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
