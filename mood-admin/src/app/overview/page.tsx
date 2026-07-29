"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFilters } from "@/lib/filter-context";
import {
  api,
  ComparisonData,
  MetricComparison,
  TimeSeriesData,
  EngagementData,
  ComprehensiveStats,
  AppStoreDownloadsData,
} from "@/lib/api";
import { KPICard } from "@/components/KPICard";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { FilterBar } from "@/components/FilterBar";
import { LiveSnapshot } from "@/components/LiveSnapshot";
import { DrilldownDrawer } from "@/components/DrilldownDrawer";
import { InsightsCard } from "@/components/InsightsCard";
import { METRIC_TOOLTIPS, METRIC_LABELS, Tooltip } from "@/components/Tooltip";
import {
  Users,
  UserPlus,
  Dumbbell,
  CheckCircle,
  FileText,
  Heart,
  Activity,
  Smartphone,
  Globe,
  UserCheck,
  Download,
} from "lucide-react";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Small layout helpers
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SkeletonGrid({ count, cols }: { count: number; cols: string }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-muted rounded-lg h-24" />
      ))}
    </div>
  );
}

const GRANULARITY_NOUN: Record<string, string> = {
  day: "day",
  week: "week",
  month: "month",
};

// ---------------------------------------------------------------------------
// Overview page — the investor-ready front page.
// ---------------------------------------------------------------------------

export default function OverviewPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const {
    days,
    granularity,
    includeInternal,
    startDateStr,
    endDateStr,
  } = useFilters();

  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [newUsersSeries, setNewUsersSeries] = useState<TimeSeriesData | null>(null);
  const [activeUsersSeries, setActiveUsersSeries] = useState<TimeSeriesData | null>(null);
  const [workoutsSeries, setWorkoutsSeries] = useState<TimeSeriesData | null>(null);
  const [completionSeries, setCompletionSeries] = useState<TimeSeriesData | null>(null);
  const [totals, setTotals] = useState<ComprehensiveStats | null>(null);
  const [appstore, setAppstore] = useState<AppStoreDownloadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failedSections, setFailedSections] = useState<string[]>([]);

  // Drilldown state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownMetric, setDrilldownMetric] = useState("");
  const [drilldownDateLabel, setDrilldownDateLabel] = useState("");

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
      const [
        engRes,
        compRes,
        newUsersRes,
        activeUsersRes,
        workoutsRes,
        completionRes,
        totalsRes,
        appstoreRes,
      ] = await Promise.all([
        api.getEngagement(includeInternal),
        api.getComparison(startDateStr, endDateStr),
        api.getTimeSeries("new_users", granularity, days, includeInternal),
        api.getTimeSeries("active_users", granularity, days, includeInternal),
        api.getTimeSeries("workouts_completed", granularity, days, includeInternal),
        api.getTimeSeries("completion_rate", granularity, days, includeInternal),
        api.getComprehensiveStats(0),
        api.getAppStoreDownloads(0),
      ]);

      if (cancelled) return;

      const failed: string[] = [];
      if (engRes.data) setEngagement(engRes.data);
      else failed.push("Platform health");

      if (compRes.data) setComparison(compRes.data);
      else failed.push("This period");

      if (newUsersRes.data) setNewUsersSeries(newUsersRes.data);
      if (activeUsersRes.data) setActiveUsersSeries(activeUsersRes.data);
      if (workoutsRes.data) setWorkoutsSeries(workoutsRes.data);
      if (completionRes.data) setCompletionSeries(completionRes.data);
      if (
        newUsersRes.error ||
        activeUsersRes.error ||
        workoutsRes.error ||
        completionRes.error
      ) {
        failed.push("Trends");
      }

      if (totalsRes.data) setTotals(totalsRes.data);
      else failed.push("All-time totals");

      // App Store downloads are optional (not configured ≠ failed)
      if (appstoreRes.data) setAppstore(appstoreRes.data);

      setFailedSections(failed);
      setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [days, granularity, includeInternal, startDateStr, endDateStr, isAuthenticated, isAdmin]);

  // Drilldown wiring
  const handleChartClick = useCallback((metric: string, dateLabel: string) => {
    setDrilldownMetric(metric);
    setDrilldownDateLabel(dateLabel);
    setDrilldownOpen(true);
  }, []);

  const handleKPIClick = useCallback((metric: string) => {
    setDrilldownMetric(metric);
    setDrilldownDateLabel("");
    setDrilldownOpen(true);
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldownOpen(false);
    setDrilldownMetric("");
    setDrilldownDateLabel("");
  }, []);

  const getMetric = (key: string): MetricComparison | undefined =>
    comparison?.metrics?.[key];

  // Completion rate: from comparison if present, else derived from
  // completed / started in the same comparison payload.
  const completionMetric = getMetric("completion_rate");
  const derivedCompletionRate = (() => {
    if (completionMetric) return null;
    const started = getMetric("workouts_started")?.current ?? 0;
    const completed = getMetric("workouts_completed")?.current ?? 0;
    return started > 0 ? (completed / started) * 100 : 0;
  })();

  const toChartData = (series: TimeSeriesData | null) =>
    (series?.labels || []).map((label, i) => ({
      name: label,
      value: series?.values[i] ?? 0,
    }));

  const granularityNoun = GRANULARITY_NOUN[granularity] || "day";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">
          How MOOD is doing at a glance — all times UTC
        </p>
      </div>

      {/* Live snapshot — auto-refreshes every minute, independent of the range filter */}
      <LiveSnapshot includeInternal={includeInternal} />

      <FilterBar />

      {/* Error banner */}
      {failedSections.length > 0 && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-500 rounded-lg p-3 text-sm">
          Some data failed to load: {failedSections.join(", ")}. Showing what we
          have — try refreshing.
        </div>
      )}

      {/* ── Platform health ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Platform health"
          description="Are people using the app right now, and do they keep coming back?"
        />
        {loading ? (
          <div className="animate-pulse bg-muted rounded-lg h-24" />
        ) : engagement ? (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-3xl font-bold">{engagement.mau}</p>
                  <Tooltip content={METRIC_TOOLTIPS.mau} />
                </div>
                <p className="text-sm text-muted-foreground">MAU</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold">{engagement.wau}</p>
                  <Tooltip content={METRIC_TOOLTIPS.wau} />
                </div>
                <p className="text-sm text-muted-foreground">WAU</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold">{engagement.dau}</p>
                  <Tooltip content={METRIC_TOOLTIPS.dau} />
                </div>
                <p className="text-sm text-muted-foreground">DAU</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold text-green-500">
                    {engagement.stickiness_dau_mau}%
                  </p>
                  <Tooltip content={METRIC_TOOLTIPS.stickiness} />
                </div>
                <p className="text-sm text-muted-foreground">Stickiness DAU/MAU</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold text-blue-500">
                    {engagement.wau_mau_ratio}%
                  </p>
                  <Tooltip content={METRIC_TOOLTIPS.wauMauRatio} />
                </div>
                <p className="text-sm text-muted-foreground">WAU/MAU</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Rolling windows ending now (UTC) · signed-in users only
            </p>
          </div>
        ) : null}
      </section>

      {/* ── This period ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="This period"
          description={`Compared with the previous ${days} days`}
        />
        {loading ? (
          <SkeletonGrid count={8} cols="grid-cols-2 lg:grid-cols-4" />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="New Users"
              value={getMetric("new_users")?.current ?? 0}
              previousValue={getMetric("new_users")?.previous}
              changePercent={getMetric("new_users")?.change_pct}
              trend={getMetric("new_users")?.trend}
              icon={<UserPlus className="h-4 w-4" />}
              tooltip={METRIC_TOOLTIPS.newUsers}
              onClick={() => handleKPIClick("new_users")}
            />
            <KPICard
              title="Active Users"
              value={getMetric("active_users")?.current ?? 0}
              previousValue={getMetric("active_users")?.previous}
              changePercent={getMetric("active_users")?.change_pct}
              trend={getMetric("active_users")?.trend}
              icon={<Users className="h-4 w-4" />}
              tooltip={METRIC_TOOLTIPS.activeUsers}
              onClick={() => handleKPIClick("active_users")}
            />
            <KPICard
              title="Workouts Started"
              value={getMetric("workouts_started")?.current ?? 0}
              previousValue={getMetric("workouts_started")?.previous}
              changePercent={getMetric("workouts_started")?.change_pct}
              trend={getMetric("workouts_started")?.trend}
              icon={<Dumbbell className="h-4 w-4" />}
              tooltip={METRIC_TOOLTIPS.workoutsStarted}
              onClick={() => handleKPIClick("workouts_started")}
            />
            <KPICard
              title="Workouts Completed"
              value={getMetric("workouts_completed")?.current ?? 0}
              previousValue={getMetric("workouts_completed")?.previous}
              changePercent={getMetric("workouts_completed")?.change_pct}
              trend={getMetric("workouts_completed")?.trend}
              icon={<CheckCircle className="h-4 w-4" />}
              tooltip={METRIC_TOOLTIPS.workoutsCompleted}
              onClick={() => handleKPIClick("workouts_completed")}
            />
            <KPICard
              title="Completion Rate"
              value={completionMetric?.current ?? derivedCompletionRate ?? 0}
              previousValue={completionMetric?.previous}
              changePercent={completionMetric?.change_pct}
              trend={completionMetric?.trend}
              format="percentage"
              icon={<Activity className="h-4 w-4" />}
              tooltip={METRIC_TOOLTIPS.completionRate}
            />
            <KPICard
              title="Posts Created"
              value={getMetric("posts_created")?.current ?? 0}
              previousValue={getMetric("posts_created")?.previous}
              changePercent={getMetric("posts_created")?.change_pct}
              trend={getMetric("posts_created")?.trend}
              icon={<FileText className="h-4 w-4" />}
              tooltip={METRIC_TOOLTIPS.postsCreated}
              onClick={() => handleKPIClick("posts_created")}
            />
            <KPICard
              title="App Sessions"
              value={getMetric("app_sessions")?.current ?? 0}
              previousValue={getMetric("app_sessions")?.previous}
              changePercent={getMetric("app_sessions")?.change_pct}
              trend={getMetric("app_sessions")?.trend}
              icon={<Smartphone className="h-4 w-4" />}
              tooltip={METRIC_TOOLTIPS.sessions}
            />
            <KPICard
              title="Social Interactions"
              value={getMetric("social_interactions")?.current ?? 0}
              previousValue={getMetric("social_interactions")?.previous}
              changePercent={getMetric("social_interactions")?.change_pct}
              trend={getMetric("social_interactions")?.trend}
              icon={<Heart className="h-4 w-4" />}
              tooltip={METRIC_TOOLTIPS.socialParticipation}
              onClick={() => handleKPIClick("social_interactions")}
            />
          </div>
        )}
      </section>

      {/* ── Trends ──────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Trends"
          description={`Bucketed by ${granularityNoun}, over the last ${days} days`}
        />
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted rounded-lg h-72" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {newUsersSeries && (
              <TimeSeriesChart
                title={`New users per ${granularityNoun}`}
                data={toChartData(newUsersSeries)}
                type="bar"
                color="hsl(var(--chart-1))"
                metric="new_users"
                onChartClick={handleChartClick}
              />
            )}
            {activeUsersSeries && (
              <TimeSeriesChart
                title="Active users"
                data={toChartData(activeUsersSeries)}
                type="area"
                color="hsl(var(--chart-1))"
                metric="active_users"
                onChartClick={handleChartClick}
              />
            )}
            {workoutsSeries && (
              <TimeSeriesChart
                title="Workouts completed"
                data={toChartData(workoutsSeries)}
                type="area"
                color="hsl(var(--chart-1))"
                metric="workouts_completed"
                onChartClick={handleChartClick}
              />
            )}
            {completionSeries && (
              <TimeSeriesChart
                title="Completion rate (%)"
                data={toChartData(completionSeries)}
                type="line"
                color="hsl(var(--chart-1))"
                yDomain={[0, 100]}
              />
            )}
          </div>
        )}
      </section>

      {/* ── All-time totals ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="All-time totals"
          description="Lifetime numbers — these use different definitions than App Store Connect, hover the ⓘ to see how"
        />
        {loading ? (
          <SkeletonGrid count={4} cols="grid-cols-2 md:grid-cols-4" />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                title="App Store Downloads"
                value={
                  appstore?.configured ? appstore?.total ?? 0 : "—"
                }
                icon={<Download className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.appStoreDownloads}
              />
              <KPICard
                title="First Opens (tracked)"
                value={totals?.unique_guest_devices ?? 0}
                icon={<Globe className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.firstOpens}
              />
              <KPICard
                title="Total Accounts"
                value={totals?.total_users ?? 0}
                icon={<Users className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.totalUsers}
              />
              <KPICard
                title="Guest → Account Conversions"
                value={totals?.guest_conversions ?? 0}
                icon={<UserCheck className="h-4 w-4" />}
                tooltip={METRIC_TOOLTIPS.guestConversions}
              />
            </div>
            {appstore && !appstore.configured && (
              <div className="border border-yellow-500/30 bg-yellow-500/5 rounded-lg p-3 text-xs text-muted-foreground mt-4">
                <p className="font-medium text-yellow-500 mb-1">
                  App Store downloads not connected yet
                </p>
                <p>
                  Set the App Store Connect API credentials on the backend to
                  pull real download numbers from Apple — see{" "}
                  <span className="font-mono">APPSTORE_SETUP.md</span> in the
                  repo root ({appstore.missing?.join(", ")} still needed). Until
                  then this card shows —.
                </p>
              </div>
            )}
            <div className="border border-border bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground mt-4">
              <p className="font-medium mb-1">
                Reading these four numbers together:
              </p>
              <p>
                App Store Downloads is Apple&apos;s count (per Apple ID, at
                download time). First Opens is our server&apos;s count of devices
                that actually launched the app and reported home — always lower,
                since some people download but never open, and tracking only
                exists since it shipped. Downloads → First Opens → Accounts →
                Conversions is effectively your install funnel.
              </p>
            </div>
          </>
        )}
      </section>

      {/* ── Automated insights ──────────────────────────────────────────── */}
      <InsightsCard />

      {/* Drilldown Drawer */}
      <DrilldownDrawer
        isOpen={drilldownOpen}
        onClose={closeDrilldown}
        metric={drilldownMetric}
        metricLabel={METRIC_LABELS[drilldownMetric] || drilldownMetric}
        value={drilldownDateLabel || undefined}
        dateLabel={drilldownDateLabel}
      />
    </div>
  );
}
