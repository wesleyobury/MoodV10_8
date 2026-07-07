"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, SubscribersData, SubscriberRow, SubscriberStatus } from "@/lib/api";
import { KPICard } from "@/components/KPICard";
import { CSVExport } from "@/components/CSVExport";
import { redirect } from "next/navigation";
import {
  Users,
  CreditCard,
  Gift,
  Clock,
  UserX,
  Sparkles,
  DollarSign,
  Search,
  User,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const usd = (n: number | undefined) =>
  `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLES: Record<SubscriberStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/15 text-green-400 border border-green-500/30" },
  trial: { label: "Trial", className: "bg-blue-500/15 text-blue-400 border border-blue-500/30" },
  comp: { label: "Comp", className: "bg-purple-500/15 text-purple-400 border border-purple-500/30" },
  lapsed: { label: "Lapsed", className: "bg-red-500/15 text-red-400 border border-red-500/30" },
};

const FILTERS: { key: "all" | SubscriberStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "trial", label: "Trials" },
  { key: "comp", label: "Comp" },
  { key: "lapsed", label: "Lapsed" },
];

function StatusBadge({ status }: { status: SubscriberStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", s.className)}>
      {s.label}
    </span>
  );
}

export default function SubscribersPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const [data, setData] = useState<SubscribersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"all" | SubscriberStatus>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [includeInternal, setIncludeInternal] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      redirect("/");
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await api.getSubscribers({
      status,
      search: query || undefined,
      includeInternal,
      limit: 500,
    });
    if (res.data) setData(res.data);
    setLoading(false);
  }, [status, query, includeInternal]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) fetchData();
  }, [fetchData, isAuthenticated, isAdmin]);

  const summary = data?.summary;
  const rows = data?.subscribers || [];

  const exportData = rows.map((r: SubscriberRow) => ({
    Username: r.username,
    Email: r.email,
    Status: r.status,
    Plan: r.plan || "",
    "Product ID": r.product_id || "",
    "List Price (USD)": r.price_usd,
    "MRR (USD)": r.mrr_usd,
    "Founding Member": r.founding_member ? "yes" : "no",
    Platform: r.platform,
    Purchased: r.purchase_date || "",
    Expires: r.expiration_date || "",
    "Last Validated": r.last_validated_at || "",
  }));

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground">
            Everyone who has paid, is in a trial, is comped, or has lapsed — by name.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={includeInternal}
              onChange={(e) => setIncludeInternal(e.target.checked)}
            />
            Include internal
          </label>
          {rows.length > 0 && (
            <CSVExport data={exportData} filename={`subscribers-${status}.csv`} />
          )}
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Paying Customers"
          value={summary?.active ?? 0}
          icon={<CreditCard className="h-4 w-4" />}
          tooltip="Active paid subscriptions (excludes trials and comps). Your real revenue base."
        />
        <KPICard
          title="Est. MRR"
          value={usd(summary?.mrr_usd)}
          icon={<DollarSign className="h-4 w-4" />}
          tooltip="Monthly recurring revenue at list price (annual plans ÷ 12). Trials/comps count as $0."
        />
        <KPICard
          title="Trials"
          value={summary?.trial ?? 0}
          icon={<Clock className="h-4 w-4" />}
          tooltip="Users currently in a free trial (haven't paid yet)."
        />
        <KPICard
          title="Comped"
          value={summary?.comp ?? 0}
          icon={<Gift className="h-4 w-4" />}
          tooltip="Admin-granted free access."
        />
        <KPICard
          title="Lapsed"
          value={summary?.lapsed ?? 0}
          icon={<UserX className="h-4 w-4" />}
          tooltip="Previously subscribed, no longer entitled (expired / churned)."
        />
        <KPICard
          title="Founding Members"
          value={summary?.founding_members ?? 0}
          icon={<Sparkles className="h-4 w-4" />}
          tooltip="Claimed the founding-member pricing."
        />
      </div>

      {/* Controls: filter tabs + search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => {
            const count =
              f.key === "all"
                ? summary?.total
                : (summary?.[f.key as keyof typeof summary] as number | undefined);
            return (
              <button
                key={f.key}
                onClick={() => setStatus(f.key)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  status === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-accent"
                )}
              >
                {f.label}
                {typeof count === "number" && (
                  <span className="ml-1.5 opacity-70">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setQuery(search.trim());
            }}
            onBlur={() => setQuery(search.trim())}
            placeholder="Search username or email…"
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-medium">
            {loading ? "Loading…" : `${data?.total ?? 0} ${status === "all" ? "subscribers" : status}`}
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading subscribers…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subscribers match this filter yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-right p-3 font-medium">MRR</th>
                  <th className="text-left p-3 font-medium">Purchased</th>
                  <th className="text-left p-3 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {r.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.avatar} alt={r.username} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium truncate">@{r.username || "—"}</span>
                            {r.founding_member && (
                              <Sparkles className="h-3 w-3 text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3 capitalize">{(r.plan || "—").replace(/_/g, " ")}</td>
                    <td className="p-3 text-right font-mono">{r.price_usd ? usd(r.price_usd) : "—"}</td>
                    <td className="p-3 text-right font-mono">
                      {r.mrr_usd ? usd(r.mrr_usd) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {r.purchase_date ? formatDate(r.purchase_date) : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {r.expiration_date ? formatDate(r.expiration_date) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
