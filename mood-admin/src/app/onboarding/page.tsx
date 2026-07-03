"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, OnboardingData } from "@/lib/api";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { DateRangePicker } from "@/components/DateRangePicker";
import { CSVExport } from "@/components/CSVExport";
import { subDays, format } from "date-fns";
import { redirect } from "next/navigation";

// snake_case / kebab answers → readable label
const humanize = (s: string) =>
  !s ? s : s.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const fmtMs = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s` : `${Math.round(ms)}ms`;

export default function OnboardingPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [includeInternal, setIncludeInternal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) redirect("/");
  }, [isLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      const start = format(startDate, "yyyy-MM-dd");
      const end = format(endDate, "yyyy-MM-dd");
      const res = await api.getOnboarding(start, end, includeInternal);
      if (res.data) setData(res.data);
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated, isAdmin, startDate, endDate, includeInternal]);

  const funnelChartData = (data?.funnel || []).map((s) => ({
    name: s.label,
    value: s.unique,
    conversion: s.step_conversion,
    dropoff: s.step_dropoff,
  }));

  // Worst leak: the step (after entry) with the highest drop-off.
  const biggestDrop = (data?.funnel || [])
    .slice(1)
    .reduce<null | { label: string; step_dropoff: number }>(
      (worst, s) => (!worst || s.step_dropoff > worst.step_dropoff ? s : worst),
      null
    );

  const exportRows = (data?.funnel || []).map((s) => ({
    Step: s.label,
    Event: s.step,
    Participants: s.unique,
    "% of entry": `${s.pct_of_entry}%`,
    "Step conversion": `${s.step_conversion}%`,
    "Step dropoff": `${s.step_dropoff}%`,
  }));

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading onboarding funnel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Onboarding</h1>
          <p className="text-muted-foreground">
            The post-signup funnel — every screen from intro to reveal, tracked per signed-in user.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={includeInternal}
              onChange={(e) => setIncludeInternal(e.target.checked)}
              className="accent-primary"
            />
            Include internal
          </label>
          <CSVExport
            data={exportRows}
            filename={`onboarding-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}.csv`}
          />
          <DateRangePicker startDate={startDate} endDate={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} />
        </div>
      </div>

      {data?.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          Error loading data: {data.error}
        </div>
      )}

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Entered onboarding</p>
          <p className="text-2xl font-bold">{(data?.entry_participants || 0).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold">{(data?.completed_participants || 0).toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Completion rate</p>
          <p className="text-2xl font-bold text-green-500">{(data?.overall_completion_rate || 0).toFixed(1)}%</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Biggest drop-off</p>
          {biggestDrop ? (
            <>
              <p className="text-2xl font-bold text-red-500">{biggestDrop.step_dropoff.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">at {biggestDrop.label}</p>
            </>
          ) : (
            <p className="text-2xl font-bold">—</p>
          )}
        </div>
      </div>

      {/* Attribution / data-quality. Onboarding runs after login, so this
          should read ~100% logged-in. A guest slice means a token wasn't
          passed on those events. */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Attribution · data quality</h3>
          <span className="text-xs text-muted-foreground">
            {(data?.auth_entries || 0).toLocaleString()} logged-in · {(data?.guest_entries || 0).toLocaleString()} unattributed
          </span>
        </div>
        {(() => {
          const guest = data?.guest_entries || 0;
          const auth = data?.auth_entries || 0;
          const total = guest + auth || 1;
          const authPct = (auth / total) * 100;
          return (
            <div className="h-3 w-full rounded-full overflow-hidden bg-muted flex">
              <div className="h-full bg-green-500" style={{ width: `${authPct}%` }} title={`Logged-in: ${auth}`} />
              <div className="h-full bg-amber-500" style={{ width: `${100 - authPct}%` }} title={`Unattributed (guest): ${guest}`} />
            </div>
          );
        })()}
        <p className="text-xs text-muted-foreground mt-2">
          Onboarding runs after login, so this should be ~100% logged-in. A guest slice means some events fired without a token.
        </p>
      </div>

      {/* Step funnel chart */}
      <FunnelChart
        title="Onboarding step funnel"
        data={funnelChartData}
        height={Math.max(360, funnelChartData.length * 52)}
      />

      {/* Step details table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium">Step details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conversion is vs the previous step; % of entry is vs everyone who started.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Step</th>
                <th className="text-right p-3 text-sm font-medium">Participants</th>
                <th className="text-right p-3 text-sm font-medium">% of entry</th>
                <th className="text-right p-3 text-sm font-medium">Converted</th>
                <th className="text-right p-3 text-sm font-medium">Dropped</th>
                <th className="text-right p-3 text-sm font-medium">Conversion</th>
                <th className="text-right p-3 text-sm font-medium">Dropoff</th>
              </tr>
            </thead>
            <tbody>
              {(data?.funnel || []).map((s, index) => (
                <tr key={s.step} className="border-b border-border last:border-0">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{index + 1}. {s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.step}</p>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono">{s.unique.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-muted-foreground">{s.pct_of_entry.toFixed(1)}%</td>
                  <td className="p-3 text-right font-mono">{index > 0 ? s.converted.toLocaleString() : "-"}</td>
                  <td className="p-3 text-right font-mono">{index > 0 ? s.dropped.toLocaleString() : "-"}</td>
                  <td className="p-3 text-right">
                    {index > 0 ? <span className="text-green-500 font-medium">{s.step_conversion.toFixed(1)}%</span> : "-"}
                  </td>
                  <td className="p-3 text-right">
                    {index > 0 ? (
                      <span className={s.step_dropoff >= 30 ? "text-red-500 font-medium" : "text-red-500/70"}>
                        {s.step_dropoff.toFixed(1)}%
                      </span>
                    ) : "-"}
                  </td>
                </tr>
              ))}
              {(data?.funnel || []).length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground text-sm">No onboarding events in this range.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time per step */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium">Time on each step</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Median hesitation per question — long times flag confusing steps.</p>
        </div>
        <div className="p-4 space-y-3">
          {(data?.timing || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No timing captured yet.</p>
          )}
          {(() => {
            const maxMedian = Math.max(1, ...(data?.timing || []).map((t) => t.median_ms));
            return (data?.timing || []).map((t) => (
              <div key={t.step} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{t.label}</span>
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-medium">{fmtMs(t.median_ms)}</span> median
                    <span className="mx-1.5 opacity-30">·</span>
                    {fmtMs(t.avg_ms)} avg
                    <span className="mx-1.5 opacity-30">·</span>
                    {t.samples.toLocaleString()} samples
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full" style={{ width: `${(t.median_ms / maxMedian) * 100}%` }} />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Per-question answer breakdowns */}
      <div>
        <h3 className="font-medium mb-3">What people pick</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(data?.answers || []).map((q) => (
            <div key={q.step} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{q.question}</h4>
                <span className="text-xs text-muted-foreground">{q.total.toLocaleString()} answered</span>
              </div>
              <div className="space-y-2.5">
                {q.options.length === 0 && (
                  <p className="text-sm text-muted-foreground">No answers yet.</p>
                )}
                {q.options.map((o) => (
                  <div key={o.answer} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{humanize(o.answer)}</span>
                      <span className="text-muted-foreground">
                        <span className="text-foreground font-medium">{o.pct.toFixed(1)}%</span>
                        <span className="mx-1.5 opacity-30">·</span>
                        {o.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${o.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reveal CTA + abandonment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-1">Reveal screen — CTA taps</h3>
          <p className="text-xs text-muted-foreground mb-3">What people do on the payoff screen at the end.</p>
          <div className="space-y-2.5">
            {(data?.reveal_ctas || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No CTA taps yet.</p>
            )}
            {(() => {
              const max = Math.max(1, ...(data?.reveal_ctas || []).map((c) => c.count));
              return (data?.reveal_ctas || []).map((c) => (
                <div key={c.cta} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{humanize(c.cta)}</span>
                    <span className="text-foreground font-medium">{c.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-green-500/70 rounded-full" style={{ width: `${(c.count / max) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-1">Explicit abandonment</h3>
          <p className="text-xs text-muted-foreground mb-3">Where users fired an <span className="font-mono">onboarding_abandoned</span> event.</p>
          <div className="space-y-2.5">
            {(data?.abandonment || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No explicit abandonment recorded.</p>
            )}
            {(() => {
              const max = Math.max(1, ...(data?.abandonment || []).map((a) => a.count));
              return (data?.abandonment || []).map((a) => (
                <div key={`${a.step}-${a.label}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{a.label}</span>
                    <span className="text-foreground font-medium">{a.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${(a.count / max) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Range: {data?.start_date?.slice(0, 10)} → {data?.end_date?.slice(0, 10)}. Participants are counted per user
        (user_id), with a device-id fallback for any events that fired before auth.
      </p>
    </div>
  );
}
