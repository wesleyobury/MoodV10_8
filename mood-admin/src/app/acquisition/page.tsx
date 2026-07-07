"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, AcquisitionData } from "@/lib/api";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { KPICard } from "@/components/KPICard";
import { DateRangePicker } from "@/components/DateRangePicker";
import { subDays, format } from "date-fns";
import { redirect } from "next/navigation";
import {
  Download,
  UserPlus,
  Clock,
  CreditCard,
  Percent,
  RefreshCw,
  Apple,
  Smartphone,
  AlertTriangle,
} from "lucide-react";

const pct = (n: number | undefined) => `${(n ?? 0).toFixed(1)}%`;
const num = (n: number | undefined) => (n ?? 0).toLocaleString();

export default function AcquisitionPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [data, setData] = useState<AcquisitionData | null>(null);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [includeInternal, setIncludeInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) redirect("/");
  }, [isLoading, isAuthenticated, isAdmin]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const start = format(startDate, "yyyy-MM-dd");
    const end = format(endDate, "yyyy-MM-dd");
    const res = await api.getAcquisition(start, end, includeInternal);
    if (res.data) setData(res.data);
    setLoading(false);
  }, [startDate, endDate, includeInternal]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchData();
  }, [fetchData, isAuthenticated, isAdmin]);

  const handleSync = async () => {
    setSyncing(true);
    await api.syncStoreMetrics(14);
    await fetchData();
    setSyncing(false);
  };

  const conv = data?.conversions || {};
  const split = data?.paid_split || {};
  const dl = data?.downloads;
  const appleOk = dl?.configured?.apple;
  const googleOk = dl?.configured?.google;

  const funnelData = (data?.stages || []).map((s) => ({
    name: s.label,
    value: s.value,
    conversion: s.from_prev_pct,
    dropoff: Math.round((100 - s.from_prev_pct) * 10) / 10,
  }));

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading acquisition…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Acquisition</h1>
          <p className="text-muted-foreground">
            Downloads → signups → free trials → paid subscribers.
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
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
            title="Pull the latest download numbers from the stores"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync downloads"}
          </button>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />
        </div>
      </div>

      {data?.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
          Error: {data.error}
        </div>
      )}

      {/* Store connection status — only when something needs attention */}
      {(!appleOk || !googleOk) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
          <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
            <AlertTriangle className="h-4 w-4" />
            Download reporting not fully connected
          </div>
          <ul className="space-y-1 text-muted-foreground">
            {!appleOk && (
              <li>
                <span className="text-foreground">App Store Connect:</span> set{" "}
                <code className="text-xs bg-muted px-1 rounded">ASC_ISSUER_ID</code> and{" "}
                <code className="text-xs bg-muted px-1 rounded">ASC_VENDOR_NUMBER</code> (Key ID{" "}
                <code className="text-xs bg-muted px-1 rounded">F8FY9GALTH</code> + the .p8 private key).
              </li>
            )}
            {!googleOk && (
              <li>
                <span className="text-foreground">Google Play:</span> set{" "}
                <code className="text-xs bg-muted px-1 rounded">GOOGLE_PLAY_REPORTS_BUCKET</code> and grant the
                existing service account read access to it.
              </li>
            )}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Until connected, the download row shows 0 and downstream conversions can&apos;t be computed.
          </p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Downloads" value={num(data?.counts?.downloads)} icon={<Download className="h-4 w-4" />} tooltip="First-time installs from the App Store + Google Play in this range." />
        <KPICard title="Signups" value={num(data?.counts?.signups)} icon={<UserPlus className="h-4 w-4" />} tooltip="Accounts created in-app during this range." />
        <KPICard title="Free trials" value={num(data?.counts?.trials)} icon={<Clock className="h-4 w-4" />} tooltip="Unique users who started a free trial." />
        <KPICard title="Paid subscribers" value={num(data?.counts?.paid)} icon={<CreditCard className="h-4 w-4" />} tooltip="Unique users who made a real (non-trial, non-comp) purchase." />
      </div>

      {/* Conversion row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard title="Download → Signup" value={pct(conv.download_to_signup)} format="percentage" icon={<Percent className="h-4 w-4" />} tooltip="Share of downloaders who created an account." />
        <KPICard title="Signup → Trial" value={pct(conv.signup_to_trial)} format="percentage" icon={<Percent className="h-4 w-4" />} tooltip="Share of signups who started a free trial." />
        <KPICard title="Trial → Paid" value={pct(conv.trial_to_paid)} format="percentage" icon={<Percent className="h-4 w-4" />} tooltip="Share of trials that converted to a paid subscription." />
        <KPICard title="Signup → Paid" value={pct(conv.signup_to_paid)} format="percentage" icon={<Percent className="h-4 w-4" />} tooltip="Share of signups who became paying customers (any path)." />
        <KPICard title="Download → Paid" value={pct(conv.download_to_paid)} format="percentage" icon={<Percent className="h-4 w-4" />} tooltip="End-to-end: share of downloaders who became paying customers." />
      </div>

      {/* Funnel + right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FunnelChart
            title="Acquisition funnel"
            data={funnelData}
            height={Math.max(280, funnelData.length * 70)}
          />
        </div>

        <div className="space-y-6">
          {/* Path to paid: trial vs direct */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Path to paid</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Trial → Paid</span>
                  <span className="font-medium">
                    {num(split.trial_converted)} · {pct(split.trial_converted_pct)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${split.trial_converted_pct ?? 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Straight to Paid</span>
                  <span className="font-medium">
                    {num(split.direct)} · {pct(split.direct_pct)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${split.direct_pct ?? 0}%` }} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
              How your paying customers arrived — via a free trial vs. purchasing directly.
            </p>
          </div>

          {/* Downloads by platform */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Downloads by store</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Apple className="h-4 w-4" /> App Store
                </span>
                <span className="font-mono">{num(dl?.by_platform?.apple)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4" /> Google Play
                </span>
                <span className="font-mono">{num(dl?.by_platform?.google)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-medium">Total</span>
                <span className="font-mono font-medium">{num(dl?.total)}</span>
              </div>
            </div>
            {dl?.last_synced_date && (
              <p className="mt-4 text-xs text-muted-foreground border-t border-border pt-3">
                Last synced: {dl.last_synced_date} · {dl.days_with_data} day(s) with data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Methodology notes */}
      {data?.notes && data.notes.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            {data.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
