"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import { useAuth } from "./auth-context";
import { useFilters } from "./filter-context";

/** Shapes returned by the backend's /analytics/admin/v3/* endpoints (backend/admin_v3.py). */
export type Fmt = "int" | "pct" | "usd" | "sec" | "min";

export interface Card {
  key: string;
  label: string;
  value: number | null;
  prev: number | null;
  change_pct: number | null;
  fmt: Fmt;
  note: string;
  series: { date: string; value: number }[] | null;
  v3_only: boolean;
  tracking_since: string | null;
  today: number | null;
}

export interface FunnelStep {
  key: string;
  label: string;
  users: number;
  pct_of_top: number | null;
  step_conversion: number | null;
  drop: number | null;
}

export interface Funnel {
  steps: FunnelStep[];
  note: string;
}

export interface SegmentRow {
  segment: string;
  [k: string]: string | number | null;
}

export const V3_BASE = "/analytics/admin/v3";

/** Fetch a V3 dashboard endpoint with the global filters; refetches when filters change. */
export function useV3<T>(path: string, extra?: Record<string, string | number | boolean | undefined>) {
  const { isAuthenticated, isAdmin } = useAuth();
  const { v3Query } = useFilters();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const extraQs = extra
    ? Object.entries(extra)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("")
    : "";

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    let cancelled = false;
    setLoading(true);
    api.get<T>(`${V3_BASE}${path}${path.includes("?") ? "&" : "?"}${v3Query}${extraQs}`).then((res) => {
      if (cancelled) return;
      if (res.error) setError(res.error);
      else {
        setError(null);
        setData(res.data ?? null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, path, v3Query, extraQs, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload };
}

export function fmtValue(v: number | null | undefined, fmt: Fmt = "int"): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  switch (fmt) {
    case "pct":
      return `${v.toFixed(1)}%`;
    case "usd":
      return `$${v.toLocaleString(undefined, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
    case "sec":
      return `${v.toFixed(1)}s`;
    case "min":
      return `${Math.round(v)} min`;
    default:
      return v >= 10000 ? `${(v / 1000).toFixed(1)}K` : v.toLocaleString();
  }
}

export function fmtHours(h: number | null | undefined): string {
  if (h === null || h === undefined) return "—";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} days`;
}

export const humanize = (s: string | null | undefined) =>
  (s || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
