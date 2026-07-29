"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFilters } from "@/lib/filter-context";
import {
  api,
  EngagementData,
  TimeSeriesData,
  RetentionData,
  WorkoutQualityMetrics,
} from "@/lib/api";
import { KPICard } from "@/components/KPICard";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { RetentionHeatmap } from "@/components/charts/RetentionHeatmap";
import { FilterBar } from "@/components/FilterBar";
import { CSVExport } from "@/components/CSVExport";
import { Tooltip, METRIC_TOOLTIPS } from "@/components/Tooltip";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

type CohortPeriod = "day" | "week" | "month";

const COHORT_PERIODS: { key: CohortPeriod; label: string }[] = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
      ))}
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-4 text-sm">
      Failed to load data: {message}
    </div>
  );
}

function EmptyState({ message = "No data in this period" }: { message?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

export default function EngagementPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const { days, granularity, includeInternal, startDateStr, endDateStr } = useFilters();

  // Activity rhythm + workout quality
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [activeUsersTs, setActiveUsersTs] = useState<TimeSeriesData | null>(null);
  const [sessionsTs, setSessionsTs] = useState<TimeSeriesData | null>(null);
  const [quality, setQuality] = useState<WorkoutQualityMetrics | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [qualityLoading, setQualityLoading] = useState(true);
  const [qualityError, setQualityError] = useState<string | null>(null);

  // Retention cohorts
  const [cohortPeriod, setCohortPeriod] = useState<CohortPeriod>("week");
  const [retention, setRetention] = useState<RetentionData | null>(null);
  const [retentionLoading, setRetentionLoading] = useState(true);
  const [retentionError, setRetentionError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      redirect("/");
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  // Activity rhythm + workout quality fetch
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    let cancelled = false;

    const fetchData = async () => {
      setActivityLoading(true);
      setQualityLoading(true);
      setActivityError(null);
      setQualityError(null);

      const [engRes, auRes, sessRes, qualRes] = await Promise.all([
        api.getEngagement(includeInternal),
        api.getTimeSeries("active_users", granularity, days, includeInternal),
        api.getTimeSeries("app_sessions", granularity, days, includeInternal),
        api.getWorkoutQuality(days, includeInternal),
      ]);
      if (cancelled) return;

      if (engRes.data) setEngagement(engRes.data);
      if (auRes.data) setActiveUsersTs(auRes.data);
      if (sessRes.data) setSessionsTs(sessRes.data);
      const activityErr = engRes.error || auRes.error || sessRes.error;
      if (activityErr) setActivityError(activityErr);

      if (qualRes.data) setQuality(qualRes.data);
      if (qualRes.error) setQualityError(qualRes.error);

      setActivityLoading(false);
      setQualityLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, days, granularity, includeInternal]);

  // Retention cohorts fetch (own key: cohortPeriod + date range)
  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    let cancelled = false;

    const fetchRetention = async () => {
      setRetentionLoading(true);
      setRetentionError(null);

      const res = await api.getRetention(startDateStr, endDateStr, cohortPeriod, 28);
      if (cancelled) return;

      if (res.data) setRetention(res.data);
      if (res.error) setRetentionError(res.error);
      setRetentionLoading(false);
    };

    fetchRetention();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, startDateStr, endDateStr, cohortPeriod]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading engagement...</p>
        </div>
      </div>
    );
  }

  // ── Retention derived values ──────────────────────────────────────────
  const avgD1 = retention?.average_retention?.["D1"];
  const avgD7 = retention?.average_retention?.["D7"];
  const avgD28 = retention?.average_retention?.["D28"];
  const avgD21 = retention?.average_retention?.["D21"];
  // Fall back to D21 if the window didn't reach D28 — and say so honestly.
  const lateDayLabel = avgD28 !== undefined && avgD28 !== null ? "Avg D28" : "Avg D21";
  const lateDayValue = avgD28 ?? avgD21;

  const getRetentionExportData = (): Record<string, unknown>[] => {
    if (!retention) return [];
    return retention.cohorts.map((cohort) => {
      const row: Record<string, string | number> = {
        Cohort: cohort.cohort_label,
        "Cohort Size": cohort.cohort_size,
      };
      retention.retention_days.forEach((day) => {
        const cell = cohort.retention[day];
        row[day] =
          cell && cell.percentage !== null && cell.percentage !== undefined
            ? `${cell.percentage}%`
            : "—";
      });
      return row;
    });
  };

  // Drop null/undefined cells so the heatmap renders them as empty ("-")
  // instead of a misleading 0%.
  const heatmapData = (retention?.heatmap_data ?? []).filter(
    (cell) => cell.value !== null && cell.value !== undefined
  );

  const moodChartData =
    quality?.by_mood_category.map((m) => ({
      category: m.category,
      completion_rate: m.completion_rate,
    })) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Engagement</h1>
        <p className="text-muted-foreground">Retention, activity rhythm, and workout quality</p>
      </div>

      <FilterBar />

      {/* ── Activity rhythm ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Activity rhythm</h2>

        {activityError && <ErrorBanner message={activityError} />}
        {activityLoading ? (
          <SectionSkeleton rows={2} />
        ) : (
          <>
            {engagement ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="DAU" value={engagement.dau} tooltip={METRIC_TOOLTIPS.dau} />
                <KPICard title="WAU" value={engagement.wau} tooltip={METRIC_TOOLTIPS.wau} />
                <KPICard title="MAU" value={engagement.mau} tooltip={METRIC_TOOLTIPS.mau} />
                <KPICard
                  title="DAU/MAU Stickiness"
                  value={engagement.stickiness_dau_mau}
                  format="percentage"
                  tooltip={METRIC_TOOLTIPS.stickiness}
                />
              </div>
            ) : (
              !activityError && <EmptyState />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeUsersTs && activeUsersTs.labels.length > 0 ? (
                <TimeSeriesChart
                  title="Active users"
                  type="area"
                  color="hsl(var(--chart-1))"
                  data={activeUsersTs.labels.map((label, i) => ({
                    name: label,
                    value: activeUsersTs.values[i] ?? 0,
                  }))}
                />
              ) : (
                !activityError && <EmptyState />
              )}
              {sessionsTs && sessionsTs.labels.length > 0 ? (
                <TimeSeriesChart
                  title="App sessions"
                  type="bar"
                  color="hsl(var(--chart-1))"
                  data={sessionsTs.labels.map((label, i) => ({
                    name: label,
                    value: sessionsTs.values[i] ?? 0,
                  }))}
                />
              ) : (
                !activityError && <EmptyState />
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Retention cohorts ───────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Retention cohorts</h2>
              <Tooltip content={METRIC_TOOLTIPS.retentionCohort} />
            </div>
            <p className="text-sm text-muted-foreground">
              Each row = everyone who signed up that period; each column = % who came back N days
              after their signup.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Cohort granularity segmented control */}
            <div className="flex items-center rounded-md border border-border bg-background p-0.5">
              {COHORT_PERIODS.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setCohortPeriod(period.key)}
                  className={cn(
                    "px-3 py-1 text-sm rounded transition-colors",
                    cohortPeriod === period.key
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {period.label}
                </button>
              ))}
            </div>
            <CSVExport
              data={getRetentionExportData()}
              filename={`retention-${cohortPeriod}-${startDateStr}-${endDateStr}.csv`}
            />
          </div>
        </div>

        {retentionError && <ErrorBanner message={retentionError} />}
        {retentionLoading ? (
          <SectionSkeleton rows={3} />
        ) : retention && retention.cohorts.length > 0 ? (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Cohort Users"
                value={retention.total_users}
                tooltip="Total users across all signup cohorts in the selected range."
              />
              <KPICard
                title="Avg D1"
                value={avgD1 ?? "—"}
                format="percentage"
                tooltip={METRIC_TOOLTIPS.d1Retention}
              />
              <KPICard
                title="Avg D7"
                value={avgD7 ?? "—"}
                format="percentage"
                tooltip={METRIC_TOOLTIPS.d7Retention}
              />
              <KPICard
                title={lateDayLabel}
                value={lateDayValue ?? "—"}
                format="percentage"
                tooltip={METRIC_TOOLTIPS.d28Retention}
              />
            </div>

            <RetentionHeatmap
              title="Retention Cohort Heatmap"
              data={heatmapData}
              cohorts={retention.cohorts.map((c) => c.cohort_label)}
              days={retention.retention_days}
            />

            {/* Cohort details table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-medium">Cohort Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 text-sm font-medium">Cohort</th>
                      <th className="text-right p-3 text-sm font-medium">Size</th>
                      {retention.retention_days.map((day) => (
                        <th key={day} className="text-right p-3 text-sm font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {retention.cohorts.map((cohort) => (
                      <tr key={cohort.cohort} className="border-b border-border last:border-0">
                        <td className="p-3 font-medium">{cohort.cohort_label}</td>
                        <td className="p-3 text-right font-mono">
                          {cohort.cohort_size.toLocaleString()}
                        </td>
                        {retention.retention_days.map((day) => {
                          const cell = cohort.retention[day];
                          const pct =
                            cell && cell.percentage !== null && cell.percentage !== undefined
                              ? cell.percentage
                              : null;
                          return (
                            <td key={day} className="p-3 text-right">
                              {pct === null ? (
                                <span className="font-mono text-muted-foreground">—</span>
                              ) : (
                                <span
                                  className={cn(
                                    "font-mono",
                                    pct >= 30
                                      ? "text-green-500"
                                      : pct >= 10
                                      ? "text-yellow-500"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {pct.toFixed(1)}%
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Cohorts too recent to reach a given day show &lsquo;—&rsquo; and are excluded from
              averages.
            </p>
          </>
        ) : (
          !retentionError && (
            <EmptyState message="No retention data available for this period. Try expanding the date range." />
          )
        )}
      </section>

      {/* ── Workout quality ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Workout quality</h2>

        {qualityError && <ErrorBanner message={qualityError} />}
        {qualityLoading ? (
          <SectionSkeleton rows={2} />
        ) : quality ? (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KPICard
                title="Workouts Started"
                value={quality.overall.total_started}
                tooltip={METRIC_TOOLTIPS.workoutsStarted}
              />
              <KPICard
                title="Completed"
                value={quality.overall.total_completed}
                tooltip={METRIC_TOOLTIPS.workoutsCompleted}
              />
              <KPICard
                title="Abandoned"
                value={quality.overall.total_abandoned}
                tooltip="Workouts started but explicitly abandoned before completion in the period."
              />
              <KPICard
                title="Completion Rate"
                value={quality.overall.completion_rate}
                format="percentage"
                tooltip={METRIC_TOOLTIPS.completionRate}
              />
              <KPICard
                title="Abandon Rate"
                value={quality.overall.abandon_rate}
                format="percentage"
                tooltip="Workouts abandoned ÷ workouts started in the period."
              />
            </div>

            {/* Completion rate by mood */}
            {moodChartData.length > 0 ? (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Completion rate by mood
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={moodChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`${value}%`, "Completion rate"]}
                    />
                    <Bar
                      dataKey="completion_rate"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                      name="Completion %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}

            {/* Difficulty cards */}
            {quality.by_difficulty.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quality.by_difficulty.map((diff) => (
                  <div key={diff.difficulty} className="bg-card border border-border rounded-lg p-4">
                    <h4 className="font-medium capitalize mb-3">{diff.difficulty}</h4>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{diff.started}</p>
                        <p className="text-xs text-muted-foreground">Started</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">{diff.completion_rate}%</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(diff.completion_rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completion by equipment */}
            {quality.by_equipment.length > 0 && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-medium">Completion by equipment</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 text-sm font-medium">Equipment</th>
                        <th className="text-right p-3 text-sm font-medium">Started</th>
                        <th className="text-right p-3 text-sm font-medium">Completed</th>
                        <th className="text-right p-3 text-sm font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quality.by_equipment.map((eq) => (
                        <tr key={eq.equipment} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium">{eq.equipment}</td>
                          <td className="p-3 text-right font-mono">{eq.started}</td>
                          <td className="p-3 text-right font-mono">{eq.completed}</td>
                          <td className="p-3 text-right">
                            <span
                              className={
                                eq.completion_rate >= 50 ? "text-green-500" : "text-red-500"
                              }
                            >
                              {eq.completion_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          !qualityError && <EmptyState />
        )}
      </section>
    </div>
  );
}
