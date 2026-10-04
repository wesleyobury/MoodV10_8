"use client";

import { FilterBar } from "@/components/FilterBar";
import { Alerts, Gate, MetricGrid, PageHeader, Section } from "@/components/v3/ui";
import { Card, useV3 } from "@/lib/v3";

interface PulseData {
  cards: Card[];
  alerts: { level: string; title: string; detail?: string }[];
  freshness: { last_event_at: string | null; minutes_ago: number | null };
}

const LOOP = ["active_users", "signups", "workouts_generated", "workouts_started", "workouts_completed"];
const MONEY = ["trials", "paid", "revenue"];

export default function PulsePage() {
  const { data, error, loading } = useV3<PulseData>("/pulse");
  const pick = (keys: string[]) => (data?.cards || []).filter((c) => keys.includes(c.key)).sort((a, b) => keys.indexOf(a.key) - keys.indexOf(b.key));
  const fresh = data?.freshness?.minutes_ago;
  return (
    <div className="space-y-5">
      <PageHeader title="Pulse" question="How is MOOD doing right now?">
        {data && (
          <p className="text-xs text-muted-foreground">
            Last event {fresh === null || fresh === undefined ? "never" : fresh < 1 ? "just now" : fresh < 60 ? `${fresh} min ago` : `${Math.round(fresh / 60)} h ago`}
          </p>
        )}
      </PageHeader>
      <FilterBar showGranularity={false} showVersion />
      <Gate loading={loading} error={error} label="pulse">
        {data && (
          <>
            <Alerts alerts={data.alerts} />
            <Section title="The loop" note="People and workouts in the selected range, compared with the period just before it. Small numbers today show what has happened since midnight Central.">
              <MetricGrid cards={pick(LOOP).slice(0, 2)} cols={2} emphasis />
              <div className="mt-4">
                <MetricGrid cards={pick(LOOP).slice(2)} cols={3} />
              </div>
            </Section>
            <Section title="Money" note="Trials and first payments are per person; revenue is gross list price from store events.">
              <MetricGrid cards={pick(MONEY)} cols={3} />
            </Section>
          </>
        )}
      </Gate>
    </div>
  );
}
