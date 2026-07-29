"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  UserPlus,
  Users,
  Smartphone,
  Zap,
  Timer,
  TrendingUp,
  Download,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useFilters } from "@/lib/filter-context";
import {
  api,
  ActivationMetrics,
  AppStoreComparisonData,
  ComprehensiveStats,
  FunnelData,
  MetricComparison,
  TimeSeriesData,
} from "@/lib/api";
import { FilterBar } from "@/components/FilterBar";
import { Tooltip, METRIC_TOOLTIPS } from "@/components/Tooltip";
import { KPICard } from "@/components/KPICard";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { CSVExport } from "@/components/CSVExport";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Journey funnel definitions (same steps as the old Funnels page).
// ---------------------------------------------------------------------------
const FUNNEL_OPTIONS = [
  {
    key: "main",
    label: "Main journey",
    steps: [
      "app_session_start",
      "mood_selected",
      "workout_started",
      "workout_completed",
      "post_created",
    ],
  },
  {
    key: "workout",
    label: "Workout builder",
    steps: [
      "app_session_start",
      "mood_selected",
      "equipment_selected",
      "difficulty_selected",
      "workout_started",
      "workout_completed",
    ],
  },
  {
    key: "featured",
    label: "Featured workouts",
    steps: [
      "app_session_start",
      "featured_workout_clicked",
      "featured_workout_started",
      "featured_workout_completed",
    ],
  },
] as const;

type FunnelKey = (typeof FUNNEL_OPTIONS)[number]["key"];

// Human-readable labels for raw event names.
const STEP_LABELS: Record<string, string> = {
  app_session_start: "Opened app",
  mood_selected: "Picked a mood",
  workout_started: "Started workout",
  workout_completed: "Completed workout",
  post_created: "Posted to feed",
  equipment_selected: "Picked equipment",
  difficulty_selected: "Picked difficulty",
  featured_workout_clicked: "Clicked featured workout",
  featured_workout_started: "Started featured workout",
  featured_workout_completed: "Completed featured workout",
};

const stepLabel = (event: string, fallback?: string) =>
  STEP_LABELS[event] ??
  fallback ??
  event.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const formatHours = (hours: number | null): string => {
  if (hours === null) return "N/A";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours >= 48) return `${(hours / 24).toFixed(1)}d`;
  return `${hours.toFixed(1)}h`;
};

function SectionSkeleton({ blocks = 2 }: { blocks?: number }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
        ))}
      </div>
      {Array.from({ length: blocks - 1 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted rounded-lg h-64" />
      ))}
    </div>
  );
}

function NoData() {
  return <p className="text-sm text-muted-foreground">No data in this period</p>;
}

export default function GrowthPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const {
    days,
    granularity,
    includeInternal,
    startDateStr,
    endDateStr,
    rangeLabel,
  } = useFilters();

  const [newUsersComparison, setNewUsersComparison] =
    useState<MetricComparison | null>(null);
  const [totals, setTotals] = useState<ComprehensiveStats | null>(null);
  const [newUsersSeries, setNewUsersSeries] = useState<TimeSeriesData | null>(null);
  const [activation, setActivation] = useState<ActivationMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [selectedFunnel, setSelectedFunnel] = useState<FunnelKey>("main");
  const [appstoreComp, setAppstoreComp] =
    useState<AppStoreComparisonData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      redirect("/");
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const funnelDef =
        FUNNEL_OPTIONS.find((f) => f.key === selectedFunnel) ?? FUNNEL_OPTIONS[0];

      const [compRes, totalsRes, seriesRes, actRes, funnelRes, appstoreRes] =
        await Promise.all([
          api.getComparison(startDateStr, endDateStr),
          api.getComprehensiveStats(0),
          api.getTimeSeries("new_users", granularity, days, includeInternal),
          api.getActivation(days, includeInternal),
          api.getFunnel(startDateStr, endDateStr, [...funnelDef.steps]),
          api.getAppStoreComparison(days, granularity),
        ]);

      if (cancelled) return;

      setNewUsersComparison(compRes.data?.metrics?.["new_users"] ?? null);
      setTotals(totalsRes.data ?? null);
      setNewUsersSeries(seriesRes.data ?? null);
      setActivation(actRes.data ?? null);
      setFunnel(funnelRes.data ?? null);
      // Optional: absent/unconfigured App Store data is not an error
      setAppstoreComp(appstoreRes.data ?? null);

      const errors = [
        compRes.error && `signup comparison (${compRes.error})`,
        totalsRes.error && `platform totals (${totalsRes.error})`,
        seriesRes.error && `signup trend (${seriesRes.error})`,
        actRes.error && `activation (${actRes.error})`,
        funnelRes.error && `funnel (${funnelRes.error})`,
      ].filter(Boolean);
      if (errors.length > 0) {
        setError(`Some data failed to load: ${errors.join(", ")}`);
      }

      setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [
    days,
    granularity,
    includeInternal,
    startDateStr,
    endDateStr,
    isAuthenticated,
    isAdmin,
    selectedFunnel,
  ]);

  const showSkeletons = isLoading || loading;

  // Manual App Store sync (backfills the trailing 90 days, then refreshes)
  const handleAppStoreSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    const res = await api.syncAppStore(90);
    if (res.data?.configured === false) {
      setSyncMessage(
        `Not configured — missing: ${res.data.missing?.join(", ") ?? "credentials"}`
      );
    } else if (res.data) {
      setSyncMessage(
        `Synced ${res.data.synced ?? 0} day(s)` +
          ((res.data.not_ready_yet?.length ?? 0) > 0
            ? ` · ${res.data.not_ready_yet!.length} not published by Apple yet`
            : "")
      );
      const refreshed = await api.getAppStoreComparison(days, granularity);
      if (refreshed.data) setAppstoreComp(refreshed.data);
    } else {
      setSyncMessage(`Sync failed: ${res.error ?? "unknown error"}`);
    }
    setSyncing(false);
  };

  // ── Derived chart data ────────────────────────────────────────────────
  const signupChartData =
    newUsersSeries?.labels.map((label, i) => ({
      name: label,
      value: newUsersSeries.values[i] ?? 0,
    })) ?? [];

  const downloadsChartData =
    appstoreComp?.labels.map((label, i) => ({
      name: label,
      appstore: appstoreComp.appstore_downloads[i],
      firstOpens: appstoreComp.first_opens[i] ?? 0,
    })) ?? [];

  const activationFunnelData =
    activation?.activation_funnel.map((step, i, arr) => {
      const prevUsers = i > 0 ? arr[i - 1].users : step.users;
      const conversion =
        i === 0 ? 100 : prevUsers > 0 ? (step.users / prevUsers) * 100 : 0;
      return {
        name: stepLabel(step.step),
        value: step.users,
        conversion,
        dropoff: i === 0 ? 0 : 100 - conversion,
      };
    }) ?? [];

  const timeDistribution = activation?.time_to_first_workout.distribution ?? [];

  const journeyFunnelData =
    funnel?.steps.map((step) => ({
      name: stepLabel(step.step, step.step_label),
      value: step.unique_users,
      conversion: step.conversion_rate,
      dropoff: step.dropoff_rate,
    })) ?? [];

  const funnelExportData =
    funnel?.steps.map((step) => ({
      Step: stepLabel(step.step, step.step_label),
      "Event Type": step.step,
      "Unique Users": step.unique_users,
      "Conversion Rate": `${step.conversion_rate}%`,
      "Dropoff Rate": `${step.dropoff_rate}%`,
    })) ?? [];

  const selectedFunnelDef =
    FUNNEL_OPTIONS.find((f) => f.key === selectedFunnel) ?? FUNNEL_OPTIONS[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Growth</h1>
        <p className="text-muted-foreground">
          Signups, activation, and how new users move through the app
        </p>
      </div>

      <FilterBar />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Section: New accounts ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">New accounts</h2>
          <p className="text-sm text-muted-foreground">
            How many people are signing up, and the signup trend over time.
          </p>
        </div>

        {showSkeletons ? (
          <SectionSkeleton blocks={2} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title={`New Users (${rangeLabel.toLowerCase()})`}
                value={newUsersComparison?.current ?? newUsersSeries?.total ?? 0}
                previousValue={newUsersComparison?.previous}
                changePercent={newUsersComparison?.change_pct}
                trend={newUsersComparison?.trend}
                icon={<UserPlus className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.newUsers}
              />
              <KPICard
                title="Total Accounts (all-time)"
                value={totals?.total_users ?? 0}
                icon={<Users className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.totalUsers}
              />
              <KPICard
                title="First Opens (tracked)"
                value={totals?.unique_guest_devices ?? 0}
                icon={<Smartphone className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.firstOpens}
              />
            </div>

            {signupChartData.length > 0 ? (
              <TimeSeriesChart
                title={`New users per ${granularity}`}
                data={signupChartData}
                type="bar"
                color="hsl(var(--chart-1))"
              />
            ) : (
              <NoData />
            )}
          </>
        )}
      </section>

      {/* ── Section: Downloads vs first opens ─────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-semibold">
                App Store downloads vs first opens
              </h2>
              <Tooltip content={METRIC_TOOLTIPS.downloadsVsFirstOpens} />
            </div>
            <p className="text-sm text-muted-foreground">
              Apple&apos;s real download numbers next to the first launches our
              tracking actually saw.
            </p>
          </div>
          {appstoreComp?.configured && (
            <div className="flex items-center gap-3">
              {appstoreComp.last_synced_at && (
                <span className="text-xs text-muted-foreground">
                  Synced{" "}
                  {new Date(appstoreComp.last_synced_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <button
                onClick={handleAppStoreSync}
                disabled={syncing}
                className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md text-sm hover:bg-accent transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                {syncing ? "Syncing…" : "Sync now"}
              </button>
            </div>
          )}
        </div>

        {syncMessage && (
          <div className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2">
            {syncMessage}
          </div>
        )}

        {showSkeletons ? (
          <SectionSkeleton blocks={1} />
        ) : !appstoreComp || !appstoreComp.configured ? (
          <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-4 text-sm">
            <p className="font-medium text-yellow-500 mb-1">
              App Store Connect not connected yet
            </p>
            <p className="text-muted-foreground text-xs">
              Add the App Store Connect API credentials to the backend
              environment to pull Apple&apos;s real download numbers — the setup
              guide is in <span className="font-mono">APPSTORE_SETUP.md</span> at
              the repo root
              {appstoreComp?.missing?.length
                ? ` (still needed: ${appstoreComp.missing.join(", ")})`
                : ""}
              . Tracked first opens will chart alongside downloads once
              connected.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <KPICard
                title={`App Store Downloads (${rangeLabel.toLowerCase()})`}
                value={appstoreComp.appstore_total ?? 0}
                icon={<Download className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.appStoreDownloads}
              />
              <KPICard
                title={`First Opens tracked (${rangeLabel.toLowerCase()})`}
                value={appstoreComp.first_opens_total ?? 0}
                icon={<Smartphone className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.firstOpens}
              />
            </div>

            {downloadsChartData.length > 0 ? (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Downloads vs first opens per {granularity}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={downloadsChartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value) => (
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          {value}
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="appstore"
                      name="App Store downloads"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="firstOpens"
                      name="First opens (tracked)"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">
                  Gaps in the App Store line are days Apple hasn&apos;t published
                  yet (reports appear the next day and can be restated). The gap
                  between the lines ≈ people who downloaded but haven&apos;t
                  opened the app.
                </p>
              </div>
            ) : (
              <NoData />
            )}
          </>
        )}
      </section>

      {/* ── Section: Activation ───────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Activation</h2>
          <p className="text-sm text-muted-foreground">
            Do new users reach their first workout? The best early predictor of
            retention.
          </p>
        </div>

        {showSkeletons ? (
          <SectionSkeleton blocks={3} />
        ) : activation ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="New Users"
                value={activation.total_new_users}
                icon={<UserPlus className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.newUsers}
              />
              <KPICard
                title="Activated Users"
                value={activation.activated_users}
                icon={<Zap className="h-4 w-4" />}
                tooltip="New users who started at least one workout in the period"
              />
              <KPICard
                title="Activation Rate"
                value={activation.activation_rate}
                format="percentage"
                icon={<TrendingUp className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.activationRate}
              />
              <KPICard
                title="Median Time to First Workout"
                value={formatHours(activation.time_to_first_workout.median_hours)}
                icon={<Timer className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.timeToFirstWorkout}
              />
            </div>

            {activationFunnelData.length > 0 ? (
              <FunnelChart
                title="Activation funnel"
                data={activationFunnelData}
                height={Math.max(240, activationFunnelData.length * 60)}
              />
            ) : (
              <NoData />
            )}

            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">
                Time to first workout
              </h3>
              {timeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickFormatter={(val: string) =>
                        val.replace(/_/g, " ").replace("within ", "<")
                      }
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [
                        `${value.toLocaleString()} users`,
                        "Reached first workout",
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoData />
              )}
            </div>
          </>
        ) : (
          <NoData />
        )}
      </section>

      {/* ── Section: Journey funnels ──────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-semibold">Journey funnels</h2>
            <Tooltip content={METRIC_TOOLTIPS.funnelConversion} />
          </div>
          <p className="text-sm text-muted-foreground">
            How users move through key flows in the selected period. Steps are
            matched within the period, not in strict order — treat conversions as
            directional.
          </p>
        </div>

        {/* Funnel picker — same segmented-control style as FilterBar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
            {FUNNEL_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSelectedFunnel(opt.key)}
                className={cn(
                  "px-3 py-1 text-sm rounded transition-colors",
                  selectedFunnel === opt.key
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <CSVExport
            data={funnelExportData}
            filename={`growth-funnel-${selectedFunnel}-${startDateStr}-${endDateStr}.csv`}
          />
        </div>

        {showSkeletons ? (
          <SectionSkeleton blocks={3} />
        ) : funnel ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPICard
                title="Entry Users"
                value={funnel.total_entry_users}
                icon={<Users className="h-4 w-4" />}
                tooltip={`Unique users who did the first step (${stepLabel(
                  selectedFunnelDef.steps[0]
                )}) in the period.`}
              />
              <KPICard
                title="Completed Users"
                value={funnel.total_completed_users}
                icon={<Zap className="h-4 w-4" />}
                tooltip="Unique users who did every step of the funnel within the period."
              />
              <KPICard
                title="Overall Conversion"
                value={funnel.overall_conversion}
                format="percentage"
                icon={<TrendingUp className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.overallConversion}
              />
            </div>

            {journeyFunnelData.length > 0 ? (
              <FunnelChart
                title={`${selectedFunnelDef.label} funnel`}
                data={journeyFunnelData}
                height={Math.max(300, journeyFunnelData.length * 60)}
              />
            ) : (
              <NoData />
            )}

            {/* Step details table */}
            {funnel.steps.length > 0 && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-medium">Step details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 text-sm font-medium">Step</th>
                        <th className="text-right p-3 text-sm font-medium">Users</th>
                        <th className="text-right p-3 text-sm font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            Conversion
                            <Tooltip content={METRIC_TOOLTIPS.funnelConversion} />
                          </span>
                        </th>
                        <th className="text-right p-3 text-sm font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            Drop-off
                            <Tooltip content={METRIC_TOOLTIPS.funnelDropoff} />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {funnel.steps.map((step, index) => (
                        <tr
                          key={step.step}
                          className="border-b border-border last:border-0"
                        >
                          <td className="p-3">
                            <p className="font-medium">
                              {stepLabel(step.step, step.step_label)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {step.step}
                            </p>
                          </td>
                          <td className="p-3 text-right font-mono">
                            {step.unique_users.toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            {index > 0 ? (
                              <span className="text-green-500 font-medium">
                                {step.conversion_rate.toFixed(1)}%
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {index > 0 ? (
                              <span className="text-red-500/70">
                                {step.dropoff_rate.toFixed(1)}%
                              </span>
                            ) : (
                              "-"
                            )}
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
          <NoData />
        )}
      </section>
    </div>
  );
}
