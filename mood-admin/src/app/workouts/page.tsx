"use client";

import { useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { BarList, DataTable, Empty, FunnelBars, Gate, MetricGrid, PageHeader, Pills, Section, V3Tag } from "@/components/v3/ui";
import { Card, Funnel, SegmentRow, humanize, useV3 } from "@/lib/v3";

type Dim = "direction" | "duration" | "state" | "state_combo" | "target" | "selection";

interface WorkoutsData {
  key_cards: Card[];
  volume: Card[];
  funnel: Funnel;
  breakdowns: Record<Dim, SegmentRow[]>;
  generation: { tracking_since: string | null; requests: number; by_status: Record<string, number>; conflicts: { code: string; count: number }[]; p50_ms: number | null; p95_ms: number | null };
  top_swapped_out: { id: string; name: string; count: number }[];
  top_skipped: { id: string; name: string; count: number }[];
  ended_early_by_block: { block: string; count: number }[];
  duration_fit: { length: string; planned_median: number | null; actual_median: number | null; sessions: number }[];
  session_mode: { initial: Record<string, number>; switches: Record<string, number> };
  fit_rating: Record<string, number>;
}

const DIMS: { value: Dim; label: string }[] = [
  { value: "direction", label: "Direction" },
  { value: "duration", label: "Duration" },
  { value: "state", label: "State" },
  { value: "state_combo", label: "State combo" },
  { value: "target", label: "Target" },
  { value: "selection", label: "MOOD's Pick" },
];

export default function WorkoutsPage() {
  const { data, error, loading } = useV3<WorkoutsData>("/workouts");
  const [dim, setDim] = useState<Dim>("direction");
  return (
    <div className="space-y-5">
      <PageHeader title="Workouts" question="Is the generator producing workouts people actually want to do and finish?">
        <V3Tag />
      </PageHeader>
      <FilterBar showGranularity={false} />
      <Gate loading={loading} error={error} label="workouts">
        {data && (
          <>
            <MetricGrid cards={data.key_cards} cols={4} emphasis />
            <Section title="Generated → Started → Completed" note={data.funnel.note}>
              <FunnelBars funnel={data.funnel} unit="workouts" />
            </Section>
            <MetricGrid cards={data.volume.filter((c) => ["ended_early", "gen_success", "gen_p50"].includes(c.key))} cols={3} />
            <Section title="Breakdown" note="Started % is of generated; Completed % is of started. Swap % and Different % are of generated." right={<Pills options={DIMS} value={dim} onChange={setDim} />}>
              <DataTable
                rows={data.breakdowns[dim]}
                columns={[
                  { key: "segment", label: DIMS.find((d) => d.value === dim)!.label, align: "left" },
                  { key: "generated", label: "Generated", fmt: "int" },
                  { key: "started_pct", label: "Started", fmt: "pct" },
                  { key: "completed_pct", label: "Completed", fmt: "pct" },
                  { key: "swap_pct", label: "Exercise swap", fmt: "pct" },
                  { key: "different_pct", label: "Different Workout", fmt: "pct" },
                ]}
                maxRows={12}
              />
            </Section>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Section title="Most swapped-out exercises" note="Exercises people replaced in the Cart. A repeat offender is a programming signal.">
                <BarList rows={data.top_swapped_out.map((x) => ({ label: x.name, value: x.count }))} empty="No swaps yet." />
              </Section>
              <Section title="Most skipped exercises" note="Exercises skipped during a Guided Session.">
                <BarList rows={data.top_skipped.map((x) => ({ label: x.name, value: x.count }))} empty="No skips yet." />
              </Section>
              <Section title="Where sessions end early" note="The block people were on when they tapped End workout.">
                <BarList rows={data.ended_early_by_block.map((x) => ({ label: x.block, value: x.count }))} empty="No sessions ended early." />
              </Section>
              <Section title="Planned vs actual minutes" note="Median for finished sessions, by the length people asked for.">
                <DataTable
                  rows={data.duration_fit}
                  columns={[
                    { key: "length", label: "Requested", align: "left" },
                    { key: "sessions", label: "Sessions", fmt: "int" },
                    { key: "planned_median", label: "Planned", fmt: "min" },
                    { key: "actual_median", label: "Actual", fmt: "min" },
                  ]}
                  empty="No finished sessions yet."
                />
              </Section>
              <Section title="Generation conflicts" note={data.generation.tracking_since ? `Build requests that didn't produce a workout. Tracking since ${data.generation.tracking_since}.` : "Starts with the V3 release."}>
                <BarList rows={data.generation.conflicts.map((c) => ({ label: humanize(c.code), value: c.count }))} empty="No conflicts." />
              </Section>
              <Section title="Session mode and fit" note="How sessions start (Guided or Overview), how often people switch, and the post-workout fit rating.">
                {Object.keys(data.session_mode.initial).length + Object.keys(data.fit_rating).length === 0 ? (
                  <Empty text="No sessions yet." />
                ) : (
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground mb-1">Started in</p>
                      {Object.entries(data.session_mode.initial).map(([k, v]) => (
                        <p key={k} className="flex justify-between"><span>{humanize(k)}</span><span className="tabular-nums font-medium">{v}</span></p>
                      ))}
                      <p className="text-xs text-muted-foreground mt-3 mb-1">Switched to</p>
                      {Object.entries(data.session_mode.switches).map(([k, v]) => (
                        <p key={k} className="flex justify-between"><span>{humanize(k)}</span><span className="tabular-nums font-medium">{v}</span></p>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground mb-1">Fit rating</p>
                      {Object.entries(data.fit_rating).map(([k, v]) => (
                        <p key={k} className="flex justify-between"><span>{humanize(k)}</span><span className="tabular-nums font-medium">{v}</span></p>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            </div>
          </>
        )}
      </Gate>
    </div>
  );
}
