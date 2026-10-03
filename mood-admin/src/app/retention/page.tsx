"use client";

import { FilterBar } from "@/components/FilterBar";
import { BarList, DataTable, Empty, Gate, MetricGrid, PageHeader, Section } from "@/components/v3/ui";
import { Card, useV3 } from "@/lib/v3";

interface RetentionData {
  headline: Card[];
  curve: { day: number; rate: number | null; eligible: number }[];
  cohorts: { cohort: string; size: number; weeks: { week: number; rate: number | null; active: number }[] }[];
  workouts_per_active_user: { week: string; active_users: number; workouts: number; per_active_user: number | null }[];
  streaks: { bucket: string; users: number }[];
  note: string;
}

function Heatmap({ cohorts }: { cohorts: RetentionData["cohorts"] }) {
  if (!cohorts.length) return <Empty text="No signup cohorts in this range." />;
  const maxWeeks = Math.max(...cohorts.map((c) => c.weeks.length));
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr className="text-muted-foreground">
            <th className="text-left font-medium pr-3 py-1">Signup week</th>
            <th className="text-right font-medium pr-3">People</th>
            {Array.from({ length: maxWeeks }, (_, k) => (
              <th key={k} className="font-medium w-11 text-center">W{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((c) => (
            <tr key={c.cohort}>
              <td className="pr-3 whitespace-nowrap">{c.cohort}</td>
              <td className="pr-3 text-right tabular-nums text-muted-foreground">{c.size}</td>
              {Array.from({ length: maxWeeks }, (_, k) => {
                const cell = c.weeks[k];
                if (!cell) return <td key={k} />;
                const r = cell.rate ?? 0;
                return (
                  <td key={k} title={`${c.cohort}, week ${k}: ${cell.active} of ${c.size} active (${r}%)`}
                    className="h-7 w-11 text-center rounded tabular-nums"
                    style={{ background: `hsl(var(--chart-1) / ${0.08 + (r / 100) * 0.85})`, color: r > 45 ? "white" : undefined }}>
                    {r}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RetentionPage() {
  const { data, error, loading } = useV3<RetentionData>("/retention");
  return (
    <div className="space-y-5">
      <PageHeader title="Retention" question="Do people come back and make MOOD a habit?" />
      <FilterBar showGranularity={false} showVersion versionNote="The date range picks the signup cohorts (default: last 90 days). V3 only keeps people who used the V3 app." />
      <Gate loading={loading} error={error} label="retention">
        {data && (
          <>
            <MetricGrid cards={data.headline.filter((c) => ["w2_attempt", "return_after_1", "second_completed"].includes(c.key))} cols={3} emphasis />
            <MetricGrid cards={data.headline.filter((c) => ["d1", "d7", "d30", "resurrected"].includes(c.key))} cols={4} />
            <Section title="Weekly cohorts" note={`Share of each signup week active in the weeks after. ${data.note}`}>
              <Heatmap cohorts={data.cohorts} />
            </Section>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Section title="Workouts per active user, by week" note="Completed workouts divided by people active that week.">
                <DataTable
                  rows={[...data.workouts_per_active_user].reverse()}
                  columns={[
                    { key: "week", label: "Week of", align: "left" },
                    { key: "active_users", label: "Active", fmt: "int" },
                    { key: "workouts", label: "Workouts", fmt: "int" },
                    { key: "per_active_user", label: "Per active user", align: "right" },
                  ]}
                  maxRows={8}
                />
              </Section>
              <Section title="Current streaks" note="Workout-day streaks for people active in the last 30 days.">
                <BarList rows={data.streaks.map((s) => ({ label: s.bucket, value: s.users }))} />
              </Section>
            </div>
          </>
        )}
      </Gate>
    </div>
  );
}
