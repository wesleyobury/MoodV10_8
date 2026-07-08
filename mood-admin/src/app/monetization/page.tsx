"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, MonetizationData, TimeSeriesData } from "@/lib/api";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { TimeSeriesChart } from "@/components/charts/TimeSeriesChart";
import { KPICard } from "@/components/KPICard";
import { DateRangePicker } from "@/components/DateRangePicker";
import { CSVExport } from "@/components/CSVExport";
import { Tooltip } from "@/components/Tooltip";
import { subDays, format } from "date-fns";
import { redirect } from "next/navigation";
import { DollarSign, CreditCard, Percent, TrendingUp, Sparkles, Users } from "lucide-react";

const humanize = (s: string) =>
  !s ? s : s.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const usd = (n: number) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function MonetizationPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [data, setData] = useState<MonetizationData | null>(null);
  const [revenue, setRevenue] = useState<TimeSeriesData | null>(null);
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
      const days = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
      const [monRes, revRes] = await Promise.all([
        api.getMonetization(start, end, includeInternal),
        api.getTimeSeries("revenue", "day", days, includeInternal),
      ]);
      if (monRes.data) setData(monRes.data);
      if (revRes.data) setRevenue(revRes.data);
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated, isAdmin, startDate, endDate, includeInternal]);

  const funnelData = (data?.funnel || []).map((s) => ({
    name: s.label,
    value: s.unique,
    conversion: s.step_conversion,
    dropoff: Math.round((100 - s.step_conversion) * 10) / 10,
  }));

  const revenueSeries = (revenue?.labels || []).map((label, i) => ({
    name: label,
    value: revenue?.values[i] ?? 0,
  }));

  const exportRows = (data?.by_trigger || []).map((t) => ({
    Trigger: humanize(t.trigger),
    "Paywalls viewed": t.viewed,
    Purchased: t.purchased,
    "Conversion %": `${t.conversion}%`,
  }));

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading monetization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monetization</h1>
          <p className="text-muted-foreground">Paywall conversion, revenue, trials, and churn.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={includeInternal} onChange={(e) => setIncludeInternal(e.target.checked)} className="accent-primary" />
            Include internal
          </label>
          <CSVExport data={exportRows} filename={`monetization-${format(startDate, "yyyy-MM-dd")}-${format(endDate, "yyyy-MM-dd")}.csv`} />
          <DateRangePicker startDate={startDate} endDate={endDate} onChange={(s, e) => { setStartDate(s); setEndDate(e); }} />
        </div>
      </div>

      {data?.error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">Error: {data.error}</div>
      )}

      {/* Headline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard title="Paywall Viewers" value={data?.headline.paywall_viewers || 0} icon={<Users className="h-4 w-4" />} tooltip="Unique users who saw a paywall in this range." />
        <KPICard title="Purchasers" value={data?.headline.purchasers || 0} icon={<CreditCard className="h-4 w-4" />} tooltip="Unique users who completed the purchase flow — includes free-trial starts, so this is ≥ Paying Customers." />
        <KPICard title="Paying Customers" value={data?.headline.paying_customers || 0} icon={<CreditCard className="h-4 w-4" />} tooltip="Unique users who made a paid (non-trial, non-comp) purchase. This is the real paying-customer count." />
        <KPICard title="Conversion" value={data?.headline.conversion_rate || 0} format="percentage" icon={<Percent className="h-4 w-4" />} tooltip="Purchasers ÷ paywall viewers." />
        <KPICard title="Revenue (gross)" value={usd(data?.headline.revenue_usd || 0)} icon={<DollarSign className="h-4 w-4" />} tooltip="Gross bookings: paid purchases priced from plan_id (list price), de-duped and excluding trials + comps." />
        <KPICard title="Net Revenue" value={usd(data?.headline.net_revenue_usd || 0)} icon={<DollarSign className="h-4 w-4" />} tooltip={`Take-home after the ${Math.round((data?.store_commission_rate ?? 0.15) * 100)}% App/Play store commission. Adjust STORE_COMMISSION_RATE in product_pricing.py if you're not on the Small Business Program.`} />
        <KPICard title="Trials Started" value={data?.headline.trials_started || 0} icon={<TrendingUp className="h-4 w-4" />} tooltip="Unique users who started a free trial." />
        <KPICard title="Founding Claim" value={data?.headline.founding_claim_rate || 0} format="percentage" icon={<Sparkles className="h-4 w-4" />} tooltip="Founding-modal claimed ÷ shown." />
      </div>

      {/* Recurring revenue snapshot (live subscriber base — range-independent) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="MRR" value={usd(data?.headline.mrr_usd || 0)} icon={<TrendingUp className="h-4 w-4" />} tooltip="Monthly recurring revenue from active paid subscriptions (annual plans ÷ 12). Live snapshot — not affected by the date range." />
        <KPICard title="ARR" value={usd(data?.headline.arr_usd || 0)} icon={<TrendingUp className="h-4 w-4" />} tooltip="Annual recurring revenue (MRR × 12)." />
        <KPICard title="Active Subscribers" value={data?.headline.active_subscribers || 0} icon={<Users className="h-4 w-4" />} tooltip="Users with an active paid subscription right now (excludes trials, comps, internal)." />
      </div>

      {/* Paywall funnel */}
      <FunnelChart title="Paywall funnel" data={funnelData} height={Math.max(280, funnelData.length * 60)} />

      {/* Conversion by stage + Revenue over time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">Conversion by paywall stage</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Of users who saw each hard-paywall stage, how many purchased. A buyer who saw multiple stages is counted in each — so this column can sum to more than total Purchasers.</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-sm font-medium">Stage</th>
                <th className="text-right p-3 text-sm font-medium">Viewed</th>
                <th className="text-right p-3 text-sm font-medium">Dismissed</th>
                <th className="text-right p-3 text-sm font-medium">Purchased</th>
                <th className="text-right p-3 text-sm font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {(data?.by_stage || []).map((s) => (
                <tr key={s.stage} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">#{s.stage}</td>
                  <td className="p-3 text-right font-mono">{s.viewed.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-muted-foreground">{s.dismissed.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono">{s.purchased.toLocaleString()}</td>
                  <td className="p-3 text-right"><span className="text-green-500 font-medium">{s.conversion.toFixed(1)}%</span></td>
                </tr>
              ))}
              {(data?.by_stage || []).every((s) => s.viewed === 0) && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground text-sm">No paywall views with a stage in this range.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <TimeSeriesChart title="Revenue over time (USD)" data={revenueSeries} type="area" color="#22c55e" height={300} />
      </div>

      {/* Conversion by trigger */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-medium mb-1">Conversion by trigger</h3>
        <p className="text-xs text-muted-foreground mb-3">Which moment drove the paywall, and how well it converted to a purchase.</p>
        <div className="space-y-2.5">
          {(data?.by_trigger || []).length === 0 && <p className="text-sm text-muted-foreground">No paywall triggers recorded.</p>}
          {(() => {
            const max = Math.max(1, ...(data?.by_trigger || []).map((t) => t.viewed));
            return (data?.by_trigger || []).map((t) => (
              <div key={t.trigger} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{humanize(t.trigger)}</span>
                  <span className="text-muted-foreground">
                    <span className="text-green-500 font-medium">{t.conversion.toFixed(1)}%</span>
                    <span className="mx-1.5 opacity-30">·</span>
                    {t.purchased.toLocaleString()}/{t.viewed.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(t.viewed / max) * 100}%` }} />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Plan mix + Founding + Churn */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Plan mix</h3>
          <div className="space-y-2.5">
            {(data?.plan_mix || []).length === 0 && <p className="text-sm text-muted-foreground">No purchases yet.</p>}
            {(() => {
              const max = Math.max(1, ...(data?.plan_mix || []).map((p) => p.count));
              return (data?.plan_mix || []).map((p) => (
                <div key={p.plan} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{humanize(p.plan)}</span>
                    <span className="text-muted-foreground"><span className="text-foreground font-medium">{p.count}</span> · {usd(p.revenue_usd)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(p.count / max) * 100}%` }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Founding members</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Modal shown</span><span className="font-mono">{(data?.founding.shown || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Claimed</span><span className="font-mono text-green-500">{(data?.founding.claimed || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Dismissed</span><span className="font-mono">{(data?.founding.dismissed || 0).toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">Claim rate</span><span className="font-medium text-green-500">{(data?.founding.claim_rate || 0).toFixed(1)}%</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">Churn signals</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Trials cancelled</span><span className="font-mono text-red-400">{(data?.churn.trial_cancelled || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subscriptions lapsed</span><span className="font-mono text-red-400">{(data?.churn.subscription_lapsed || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Payment failed</span><span className="font-mono text-red-400">{(data?.churn.purchase_failed || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Checkout abandoned <Tooltip content="Users who opened the store sheet then backed out (failure_reason = user_cancelled). Not a failure — a checkout-abandonment signal." /></span><span className="font-mono text-muted-foreground">{(data?.churn.checkout_abandoned || 0).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Range: {data?.start_date?.slice(0, 10)} → {data?.end_date?.slice(0, 10)}. Funnel = paywall viewed → plan selected →
        purchase started → purchased (unique users, de-duped guest→signup).
      </p>
    </div>
  );
}
