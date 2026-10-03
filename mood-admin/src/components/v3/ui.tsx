"use client";

/**
 * Building blocks for the V3 founder dashboard. One look everywhere: cards carry their own note
 * (what the number counts), V3-only metrics wear a V3 tag, and new tracking shows "Tracking since".
 */
import { useState } from "react";
import { AlertTriangle, AlertOctagon, Info, Layers, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LoginForm } from "@/components/LoginForm";
import { cn } from "@/lib/utils";
import { Card, Fmt, Funnel, fmtValue } from "@/lib/v3";

const SERIES = "hsl(var(--chart-1))";

export function PageHeader({ title, question, children }: { title: string; question: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{question}</p>
      </div>
      {children}
    </div>
  );
}

/** Auth gate + loading / error states shared by every V3 page. */
export function Gate({ loading, error, children, label }: { loading: boolean; error: string | null; children: React.ReactNode; label: string }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <Spinner label="Loading..." />;
  if (!isAuthenticated) return <LoginForm />;
  if (!isAdmin) return <p className="text-destructive">Admin access required.</p>;
  if (error)
    return (
      <div className="bg-card border border-destructive/40 rounded-lg p-4 text-sm">
        <p className="font-medium text-destructive mb-1">Couldn&apos;t load {label}</p>
        <p className="text-muted-foreground">{error}. If this persists, check that the backend has the V3 dashboard endpoints deployed.</p>
      </div>
    );
  if (loading) return <Spinner label={`Loading ${label}...`} />;
  return <>{children}</>;
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>
    </div>
  );
}

export function V3Tag() {
  return (
    <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary border border-primary/20">
      <Layers className="h-3 w-3" />
      V3
    </span>
  );
}

export function Section({ title, note, children, right, className }: { title: string; note?: string; children: React.ReactNode; right?: React.ReactNode; className?: string }) {
  return (
    <section className={cn("bg-card border border-border rounded-lg p-4", className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {note && <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">{note}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Sparkline({ data, fmt }: { data: { date: string; value: number }[]; fmt: Fmt }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!data || data.length < 2) return null;
  const w = 120, h = 32, max = Math.max(...data.map((d) => d.value), 1);
  const x = (i: number) => (i / (data.length - 1)) * (w - 4) + 2;
  const y = (v: number) => h - 3 - (v / max) * (h - 6);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.value).toFixed(1)}`).join("");
  const step = (w - 4) / (data.length - 1);
  return (
    <div className="relative">
      <svg width={w} height={h} className="overflow-visible" onMouseLeave={() => setHover(null)}>
        <path d={path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.4} />
            <circle cx={x(hover)} cy={y(data[hover].value)} r={3.5} fill={SERIES} stroke="hsl(var(--card))" strokeWidth={2} />
          </>
        )}
        {data.map((d, i) => (
          <rect key={d.date} x={x(i) - step / 2} y={0} width={step} height={h} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="absolute -top-7 right-0 whitespace-nowrap rounded border border-border bg-popover px-2 py-0.5 text-[11px] shadow">
          {data[hover].date.slice(5)}: <span className="font-medium">{fmtValue(data[hover].value, fmt)}</span>
        </div>
      )}
    </div>
  );
}

export function MetricCard({ c, emphasis = false }: { c: Card; emphasis?: boolean }) {
  const up = (c.change_pct ?? 0) > 0;
  const changeLabel =
    c.change_pct === null || c.change_pct === undefined || c.change_pct === 0
      ? null
      : c.fmt === "pct"
      ? `${up ? "+" : ""}${c.change_pct.toFixed(1)} pts`
      : `${up ? "+" : ""}${c.change_pct.toFixed(1)}%`;
  return (
    <div className={cn("bg-card border border-border rounded-lg p-4 flex flex-col gap-2", emphasis && "border-primary/30")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground font-medium">{c.label}</span>
        {c.v3_only && <V3Tag />}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className={cn("font-bold tabular-nums", emphasis ? "text-3xl" : "text-2xl")}>{fmtValue(c.value, c.fmt)}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {changeLabel && (
              <span className={cn("inline-flex items-center gap-0.5 font-medium", up ? "text-green-500" : "text-red-400")}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {changeLabel}
              </span>
            )}
            {c.prev !== null && c.prev !== undefined && <span>vs {fmtValue(c.prev, c.fmt)} prior</span>}
            {c.today !== null && c.today !== undefined && <span>· {fmtValue(c.today, c.fmt)} today</span>}
          </div>
        </div>
        {c.series && <Sparkline data={c.series} fmt={c.fmt} />}
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground/80">{c.note}</p>
      {c.tracking_since ? (
        <p className="text-[11px] text-amber-400/90">Tracking since {c.tracking_since}</p>
      ) : c.tracking_since === null && c.v3_only && c.value === null ? (
        <p className="text-[11px] text-amber-400/90">No data yet: this event starts with the V3 release.</p>
      ) : null}
    </div>
  );
}

export function MetricGrid({ cards, cols = 4, emphasis = false }: { cards: Card[]; cols?: 2 | 3 | 4; emphasis?: boolean }) {
  const grid = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 xl:grid-cols-4" }[cols];
  return (
    <div className={cn("grid grid-cols-1 gap-4", grid)}>
      {cards.map((c) => (
        <MetricCard key={c.key} c={c} emphasis={emphasis} />
      ))}
    </div>
  );
}

/** Horizontal funnel: bar length = share of the first step; the step with the biggest drop is called out. */
export function FunnelBars({ funnel, unit = "people" }: { funnel: Funnel; unit?: string }) {
  const steps = funnel.steps || [];
  if (!steps.length || steps[0].users === 0) return <Empty text="No one has reached this funnel in the selected range yet." />;
  let worst = -1, worstRate = 101;
  steps.forEach((s, i) => {
    if (i > 0 && s.step_conversion !== null && steps[i - 1].users > 0 && s.step_conversion < worstRate) {
      worstRate = s.step_conversion;
      worst = i;
    }
  });
  return (
    <div className="space-y-1.5">
      {steps.map((s, i) => (
        <div key={s.key} className="grid grid-cols-[minmax(140px,220px)_1fr_190px_96px] items-center gap-3 text-sm group" title={`${s.label}: ${s.users} ${unit}`}>
          <span className="truncate text-muted-foreground group-hover:text-foreground">{s.label}</span>
          <div className="relative h-6 rounded bg-muted/40">
            <div className="absolute inset-y-0 left-0 rounded" style={{ width: `${Math.max(s.pct_of_top ?? 0, s.users ? 1 : 0)}%`, background: SERIES, opacity: i === worst ? 1 : 0.7 }} />
          </div>
          <span className={cn("text-[11px] tabular-nums", i === worst ? "text-amber-400 font-semibold" : "text-muted-foreground")}>
            {i > 0 && s.step_conversion !== null ? `${s.step_conversion}% of previous${i === worst ? " \u00b7 biggest drop" : ""}` : ""}
          </span>
          <span className="tabular-nums text-right">
            <span className="font-semibold">{s.users.toLocaleString()}</span>
            <span className="text-muted-foreground text-xs"> · {s.pct_of_top ?? 0}%</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{text}</p>;
}

export interface Column<R> {
  key: keyof R & string;
  label: string;
  fmt?: Fmt;
  align?: "left" | "right";
}

export function DataTable<R extends Record<string, unknown>>({ rows, columns, empty = "No data in this range.", onRowClick, maxRows }: {
  rows: R[]; columns: Column<R>[]; empty?: string; onRowClick?: (r: R) => void; maxRows?: number;
}) {
  const [all, setAll] = useState(false);
  if (!rows?.length) return <Empty text={empty} />;
  const shown = maxRows && !all ? rows.slice(0, maxRows) : rows;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            {columns.map((c) => (
              <th key={c.key} className={cn("py-2 px-2 font-medium", c.align === "left" || (!c.fmt && c.align !== "right") ? "text-left" : "text-right")}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn("border-b border-border/50 last:border-0", onRowClick && "cursor-pointer hover:bg-accent/40")}>
              {columns.map((c) => {
                const v = r[c.key];
                return (
                  <td key={c.key} className={cn("py-1.5 px-2", c.fmt || c.align === "right" ? "text-right tabular-nums" : "text-left")}>
                    {c.fmt ? fmtValue(v as number | null, c.fmt) : v === null || v === undefined || v === "" ? "—" : String(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {maxRows && rows.length > maxRows && (
        <button onClick={() => setAll(!all)} className="mt-2 text-xs text-primary hover:underline">
          {all ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

/** Ranked horizontal bars for a top-N list (single series). */
export function BarList({ rows, empty }: { rows: { label: string; value: number; hint?: string }[]; empty?: string }) {
  if (!rows?.length) return <Empty text={empty || "Nothing yet."} />;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(120px,200px)_1fr_auto] items-center gap-3 text-sm" title={r.hint || `${r.label}: ${r.value}`}>
          <span className="truncate">{r.label}</span>
          <div className="h-4 rounded bg-muted/40">
            <div className="h-4 rounded" style={{ width: `${(r.value / max) * 100}%`, background: SERIES, opacity: 0.8 }} />
          </div>
          <span className="tabular-nums w-10 text-right font-medium">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Alerts({ alerts }: { alerts: { level: string; title: string; detail?: string }[] }) {
  if (!alerts?.length)
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-2.5 text-sm text-green-400">
        <Info className="h-4 w-4" /> All clear: no generation, completion or data-freshness problems.
      </div>
    );
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => {
        const crit = a.level === "critical";
        const Icon = crit ? AlertOctagon : AlertTriangle;
        return (
          <div key={i} className={cn("flex items-start gap-2 rounded-lg border px-4 py-2.5 text-sm", crit ? "border-red-500/40 bg-red-500/5" : "border-amber-500/40 bg-amber-500/5")}>
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", crit ? "text-red-400" : "text-amber-400")} />
            <div>
              <p className="font-medium">
                <span className={crit ? "text-red-400" : "text-amber-400"}>{crit ? "Critical: " : "Warning: "}</span>
                {a.title}
              </p>
              {a.detail && <p className="text-muted-foreground text-xs mt-0.5">{a.detail}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-border mb-5">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "px-3 py-2 text-sm -mb-px border-b-2 transition-colors",
            value === t.value ? "border-primary text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Pills<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center rounded-md border border-border bg-background p-0.5">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn("px-2.5 py-1 text-xs rounded transition-colors", value === o.value ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
