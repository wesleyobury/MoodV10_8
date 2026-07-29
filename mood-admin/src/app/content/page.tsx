"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFilters } from "@/lib/filter-context";
import {
  api,
  MoodBreakdownData,
  EquipmentBreakdownData,
  DifficultyBreakdownData,
  ExercisesBreakdownData,
} from "@/lib/api";
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

type ContentTab = "moods" | "equipment" | "difficulty" | "exercises";

const TABS: { key: ContentTab; label: string }[] = [
  { key: "moods", label: "Moods" },
  { key: "equipment", label: "Equipment" },
  { key: "difficulty", label: "Difficulty" },
  { key: "exercises", label: "Exercises" },
];

// One-line description of exactly what each tab counts.
const TAB_DESCRIPTIONS: Record<ContentTab, string> = {
  moods:
    "Counts of mood_selected events in the period — one user picking Energize 5 times counts 5.",
  equipment:
    "Counts of equipment selections in workout setup in the period — repeat selections by the same user each count.",
  difficulty:
    "Counts of difficulty-level selections in workout setup in the period — repeat selections by the same user each count.",
  exercises:
    "Counts of exercise_completed events in the period — every finished exercise counts, including repeats by the same user.",
};

const DIFFICULTY_COLORS: { fg: string; bg: string }[] = [
  { fg: "hsl(var(--chart-1))", bg: "hsl(var(--chart-1) / 0.15)" },
  { fg: "hsl(var(--chart-2))", bg: "hsl(var(--chart-2) / 0.15)" },
  { fg: "hsl(var(--chart-3))", bg: "hsl(var(--chart-3) / 0.15)" },
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

function EmptyState() {
  return (
    <div className="bg-card border border-border rounded-lg p-8 text-center">
      <p className="text-muted-foreground">No data in this period</p>
    </div>
  );
}

export default function ContentPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const { days, startDateStr, endDateStr } = useFilters();

  const [moods, setMoods] = useState<MoodBreakdownData | null>(null);
  const [equipment, setEquipment] = useState<EquipmentBreakdownData | null>(null);
  const [difficulties, setDifficulties] = useState<DifficultyBreakdownData | null>(null);
  const [exercises, setExercises] = useState<ExercisesBreakdownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>("moods");

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

      const [moodsRes, equipRes, diffRes, exRes] = await Promise.all([
        api.getMoodBreakdown(days),
        api.getEquipmentBreakdown(days),
        api.getDifficultyBreakdown(days),
        api.getExercisesBreakdown(days),
      ]);
      if (cancelled) return;

      if (moodsRes.data) setMoods(moodsRes.data);
      if (equipRes.data) setEquipment(equipRes.data);
      if (diffRes.data) setDifficulties(diffRes.data);
      if (exRes.data) setExercises(exRes.data);

      const firstError = moodsRes.error || equipRes.error || diffRes.error || exRes.error;
      if (firstError) setError(firstError);

      setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, days]);

  const getExportData = (): Record<string, unknown>[] => {
    switch (activeTab) {
      case "moods":
        return (
          moods?.moods.map((m) => ({
            Mood: m.mood,
            Selections: m.selection_count,
            "Unique Users": m.unique_users,
            Percentage: `${m.percentage}%`,
          })) || []
        );
      case "equipment":
        return (
          equipment?.equipment.map((e) => ({
            Equipment: e.equipment,
            Selections: e.selection_count,
            "Unique Users": e.unique_users,
            Percentage: `${e.percentage}%`,
          })) || []
        );
      case "difficulty":
        return (
          difficulties?.difficulties.map((d) => ({
            Difficulty: d.difficulty,
            Selections: d.selection_count,
            "Unique Users": d.unique_users,
            Percentage: `${d.percentage}%`,
          })) || []
        );
      case "exercises":
        return (
          exercises?.exercises.slice(0, 50).map((e) => ({
            Exercise: e.exercise_name,
            Completions: e.completion_count,
            "Unique Users": e.unique_users,
            Percentage: `${e.percentage}%`,
          })) || []
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Content</h1>
        <p className="text-muted-foreground">
          Which moods, equipment, difficulties, and exercises get used
        </p>
      </div>

      {/* Breakdowns are totals over the period — granularity doesn't apply */}
      <FilterBar showGranularity={false} />

      {/* Tab selector + per-tab export */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-1.5 text-sm rounded transition-colors",
                activeTab === tab.key
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <CSVExport
          data={getExportData()}
          filename={`${activeTab}-${startDateStr}-${endDateStr}.csv`}
        />
      </div>

      {/* What this tab counts */}
      <p className="text-sm text-muted-foreground -mt-2">{TAB_DESCRIPTIONS[activeTab]}</p>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <SectionSkeleton rows={3} />
      ) : (
        <>
          {/* ── Moods ─────────────────────────────────────────────── */}
          {activeTab === "moods" &&
            (moods && moods.moods.length > 0 ? (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Mood selections ({moods.total_selections.toLocaleString()} total)
                  </h3>
                  <Tooltip content={METRIC_TOOLTIPS.moodSelections} />
                </div>
                <div className="space-y-3">
                  {moods.moods.map((mood, index) => (
                    <div key={mood.mood} className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{mood.mood}</span>
                          <span className="text-sm text-muted-foreground">
                            {mood.selection_count.toLocaleString()} ({mood.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(mood.percentage, 100)}%`,
                              backgroundColor: "hsl(var(--chart-1))",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState />
            ))}

          {/* ── Equipment ─────────────────────────────────────────── */}
          {activeTab === "equipment" &&
            (equipment && equipment.equipment.length > 0 ? (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Equipment selections ({equipment.total_selections.toLocaleString()} total)
                  </h3>
                  <Tooltip content={METRIC_TOOLTIPS.equipmentSelections} />
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={equipment.equipment.slice(0, 15)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="equipment"
                      tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                      width={90}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [value.toLocaleString(), "Selections"]}
                    />
                    <Bar
                      dataKey="selection_count"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 4, 4, 0]}
                      name="Selections"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            ))}

          {/* ── Difficulty ────────────────────────────────────────── */}
          {activeTab === "difficulty" &&
            (difficulties && difficulties.difficulties.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Difficulty selections ({difficulties.total_selections.toLocaleString()} total)
                  </h3>
                  <Tooltip content={METRIC_TOOLTIPS.difficultySelections} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {difficulties.difficulties.map((diff, index) => (
                    <div
                      key={diff.difficulty}
                      className="bg-card border border-border rounded-lg p-6 text-center"
                    >
                      <div
                        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{
                          backgroundColor: DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length].bg,
                        }}
                      >
                        <span
                          className="text-2xl font-bold"
                          style={{ color: DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length].fg }}
                        >
                          {diff.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <h3 className="text-lg font-bold capitalize">{diff.difficulty}</h3>
                      <p className="text-muted-foreground">
                        {diff.selection_count.toLocaleString()} selections
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {diff.unique_users.toLocaleString()} unique users
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState />
            ))}

          {/* ── Exercises ─────────────────────────────────────────── */}
          {activeTab === "exercises" &&
            (exercises && exercises.exercises.length > 0 ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-2">
                  <h3 className="font-medium">
                    Top Exercises ({exercises.total_completions.toLocaleString()} total completions)
                  </h3>
                  <Tooltip content={METRIC_TOOLTIPS.exerciseCompletions} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-3 text-sm font-medium">#</th>
                        <th className="text-left p-3 text-sm font-medium">Exercise</th>
                        <th className="text-right p-3 text-sm font-medium">Completions</th>
                        <th className="text-right p-3 text-sm font-medium">Unique Users</th>
                        <th className="text-right p-3 text-sm font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exercises.exercises.slice(0, 20).map((ex, index) => (
                        <tr key={ex.exercise_name} className="border-b border-border last:border-0">
                          <td className="p-3 text-muted-foreground font-mono">{index + 1}</td>
                          <td className="p-3 font-medium">{ex.exercise_name}</td>
                          <td className="p-3 text-right font-mono">
                            {ex.completion_count.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-mono">
                            {ex.unique_users.toLocaleString()}
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {ex.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState />
            ))}
        </>
      )}
    </div>
  );
}
