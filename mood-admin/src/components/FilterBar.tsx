"use client";

import { useState } from "react";
import { createContext, useContext } from "react";
import { Calendar, ChevronDown, Users, Check, Layers } from "lucide-react";
import {
  useFilters,
  RANGE_PRESETS,
  GRANULARITY_OPTIONS,
  Granularity,
} from "@/lib/filter-context";
import { Tooltip, METRIC_TOOLTIPS } from "./Tooltip";
import { cn } from "@/lib/utils";

/**
 * The one time/segment control used on every analytics page.
 * Backed by the global filter context, so switching pages keeps your
 * selected range, granularity, and internal-users setting.
 */
/** Legacy pages rendered inside a new page's tab hide their own filter bar (the host page shows one). */
export const EmbeddedContext = createContext(false);

export function FilterBar({
  showGranularity = true,
  showVersion = false,
  versionNote,
  children,
}: {
  showGranularity?: boolean;
  showVersion?: boolean;
  /** shown next to the toggle, e.g. "V3-only cards ignore this" */
  versionNote?: string;
  children?: React.ReactNode;
}) {
  const { filters, updateFilters, rangeLabel } = useFilters();
  const [dateOpen, setDateOpen] = useState(false);
  const embedded = useContext(EmbeddedContext);
  if (embedded) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Date range */}
        <div className="relative">
          <button
            onClick={() => setDateOpen(!dateOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm hover:bg-accent transition-colors"
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{rangeLabel}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
          {dateOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDateOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-lg shadow-lg p-1 min-w-[160px]">
                {RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.days}
                    onClick={() => {
                      updateFilters({ rangeDays: preset.days });
                      setDateOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-1.5 text-sm rounded transition-colors",
                      filters.rangeDays === preset.days
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent"
                    )}
                  >
                    {preset.label}
                    {filters.rangeDays === preset.days && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Granularity: Daily / Weekly / Monthly segmented control */}
        {showGranularity && (
          <div className="flex items-center rounded-md border border-border bg-background p-0.5">
            {GRANULARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilters({ granularity: opt.value as Granularity })}
                className={cn(
                  "px-3 py-1 text-sm rounded transition-colors",
                  filters.granularity === opt.value
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Version scope: All versions (V2 + V3) / V3 only */}
        {showVersion && (
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              {([["all", "All versions"], ["v3", "V3 only"]] as const).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => updateFilters({ version: v })}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors",
                    filters.version === v ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v === "v3" && <Layers className="h-3.5 w-3.5" />}
                  {label}
                </button>
              ))}
            </div>
            <Tooltip
              content={
                versionNote ||
                "All versions counts V2 and V3 together. V3 only keeps people who used the V3 app and events from V3 builds. Cards tagged V3 always show V3 data."
              }
            />
          </div>
        )}

        {/* Internal users toggle */}
        <button
          onClick={() => updateFilters({ includeInternal: !filters.includeInternal })}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
            filters.includeInternal
              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
              : "bg-background border border-border hover:bg-accent"
          )}
        >
          <Users className="h-4 w-4" />
          <span>{filters.includeInternal ? "Internal included" : "Internal excluded"}</span>
          <Tooltip content={METRIC_TOOLTIPS.includeInternal} />
        </button>

        {/* Page-specific extra controls */}
        {children}

        <div className="flex-1" />

        <div className="text-xs text-muted-foreground">
          {rangeLabel}
          {showGranularity && ` · ${GRANULARITY_OPTIONS.find((g) => g.value === filters.granularity)?.label}`}
          {showVersion && (filters.version === "v3" ? " · V3 only" : " · all versions")}
          {filters.includeInternal && " · incl. internal"}
        </div>
      </div>
    </div>
  );
}
