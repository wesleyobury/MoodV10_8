"use client";

import { useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { DataTable, FunnelBars, Gate, MetricGrid, PageHeader, Pills, Section } from "@/components/v3/ui";
import { Card, Funnel, SegmentRow, fmtHours, useV3 } from "@/lib/v3";

interface ActivationData {
  cohort_size: number;
  funnel: Funnel;
  continuation: Funnel;
  timing: { key: string; label: string; median_hours: number | null }[];
  rates: Card[];
  splits: Record<"goal" | "experience" | "first_direction", SegmentRow[]>;
  note?: string;
}

const SPLITS = [
  { value: "goal", label: "Goal" },
  { value: "experience", label: "Experience" },
  { value: "first_direction", label: "First workout Direction" },
] as const;

export default function ActivationPage() {
  const { data, error, loading } = useV3<ActivationData>("/activation");
  const [split, setSplit] = useState<(typeof SPLITS)[number]["value"]>("goal");
  return (
    <div className="space-y-5">
      <PageHeader title="Activation" question="Do new users reach their first successful workout, and what happens afterward?" />
      <FilterBar showGranularity={false} showVersion versionNote="Activation follows people who signed up in the range. V3 only keeps those who used the V3 app." />
      <Gate loading={loading} error={error} label="activation">
        {data && (
          <>
            <MetricGrid cards={data.rates} cols={3} emphasis />
            <Section title={`First workout funnel · ${data.cohort_size.toLocaleString()} signups`} note={data.funnel.note}>
              <FunnelBars funnel={data.funnel} />
            </Section>
            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
              <Section title="After the first workout" note={data.continuation.note}>
                <FunnelBars funnel={data.continuation} />
              </Section>
              <Section title="Time to first workout" note="Median time from signup, for people who got there.">
                <div className="space-y-3">
                  {data.timing.map((t) => (
                    <div key={t.key} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-muted-foreground">{t.label}</span>
                      <span className="text-lg font-semibold tabular-nums">{fmtHours(t.median_hours)}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
            <Section title="Who activates" note="Each segment's share who finished a first workout, and of those, who came back and tried workout #2."
              right={<Pills options={[...SPLITS]} value={split} onChange={setSplit} />}>
              <DataTable
                rows={data.splits[split]}
                columns={[
                  { key: "segment", label: SPLITS.find((s) => s.value === split)!.label, align: "left" },
                  { key: "users", label: "Signups", fmt: "int" },
                  { key: "first_completed_pct", label: "Finished workout #1", fmt: "pct" },
                  { key: "returned_pct", label: "Came back", fmt: "pct" },
                  { key: "w2_attempt_pct", label: "Tried workout #2", fmt: "pct" },
                ]}
              />
            </Section>
          </>
        )}
      </Gate>
    </div>
  );
}
