"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DataTable, Empty, Gate, PageHeader, Section, Tabs } from "@/components/v3/ui";
import { Legacy } from "@/components/v3/Legacy";
import { api } from "@/lib/api";
import { V3_BASE, useV3 } from "@/lib/v3";
import ClassicAdmin from "./classic/page";
import CreatorsPage from "../creators/page";

interface Health {
  events: { event: string; label: string; first_seen: string | null; last_seen: string | null; last_7d: number; v3_share_pct: number | null; [k: string]: unknown }[];
  users_with_milestones: number;
  internal_accounts: number;
  app_versions_7d: { version: string; events: number; [k: string]: unknown }[];
}
interface Delivery { by_type?: { type: string; total: number; delivered: number; delivery_rate_pct: number }[]; reach?: { users: number; users_with_a_valid_token: number; coverage_pct: number } }
interface ClientErrors { total: number; errors: Record<string, unknown>[] }

function TrackingHealth() {
  const { data, error, loading, reload } = useV3<Health>("/tracking-health");
  const [backfill, setBackfill] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [worker, setWorker] = useState<{ running: boolean; message: string } | null>(null);
  const [errs, setErrs] = useState<ClientErrors | null>(null);
  useEffect(() => {
    api.get<Delivery>("/admin/notifications/delivery-health").then((r) => setDelivery(r.data ?? null));
    api.get<{ running: boolean; message: string }>("/admin/notifications/worker-status").then((r) => setWorker(r.data ?? null));
    api.get<ClientErrors>("/admin/client-errors?limit=25").then((r) => setErrs(r.data ?? null));
  }, []);
  const runBackfill = async (dry: boolean) => {
    setBackfill(dry ? "Counting..." : "Backfilling...");
    const r = await api.post<{ stamped: Record<string, number> }>(`${V3_BASE}/backfill-milestones?dry_run=${dry}`);
    if (r.error) setBackfill(`Failed: ${r.error}`);
    else {
      const total = Object.values(r.data!.stamped).reduce((a, b) => a + b, 0);
      setBackfill(`${dry ? "Would stamp" : "Stamped"} ${total} milestone(s): ${Object.entries(r.data!.stamped).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(", ") || "nothing missing"}`);
      if (!dry) reload();
    }
  };
  return (
    <Gate loading={loading} error={error} label="tracking health">
      {data && (
        <div className="space-y-5">
          <Section title="Launch-critical events" note="Is each event arriving? V3 share is the part of the last 7 days that came from V3 builds or the V3 server paths.">
            <DataTable rows={data.events.map((e) => ({ ...e, last: e.last_seen ? new Date(e.last_seen).toLocaleString() : "never" }))}
              columns={[{ key: "label", label: "Event", align: "left" }, { key: "event", label: "Name", align: "left" }, { key: "first_seen", label: "First seen", align: "left" },
                { key: "last", label: "Last seen", align: "left" }, { key: "last_7d", label: "Last 7 days", fmt: "int" }, { key: "v3_share_pct", label: "V3 share", fmt: "pct" }]} />
          </Section>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <Section title="User milestones" note="First-time timestamps on each user (onboarded, first workout, workout #2 attempt, paywall, trial, paid). Run the backfill once after deploying so past users are included. Safe to re-run.">
              <p className="text-sm mb-3"><span className="font-semibold tabular-nums">{(data.users_with_milestones ?? 0).toLocaleString()}</span> users have milestones · <span className="font-semibold tabular-nums">{data.internal_accounts}</span> internal / test accounts excluded from metrics</p>
              <div className="flex gap-2">
                <button onClick={() => runBackfill(true)} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-accent">Preview backfill</button>
                <button onClick={() => runBackfill(false)} className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Run backfill</button>
              </div>
              {backfill && <p className="text-xs text-muted-foreground mt-3">{backfill}</p>}
            </Section>
            <Section title="App versions sending events (7 days)" note="After the V3 release, 3.0 should take over quickly.">
              <DataTable rows={data.app_versions_7d} columns={[{ key: "version", label: "Version", align: "left" }, { key: "events", label: "Events", fmt: "int" }]} />
            </Section>
            <Section title="Push notifications" note={worker ? worker.message : "Worker status unavailable."}>
              {!delivery?.by_type?.length ? <Empty text="No delivery data." /> : (
                <>
                  {delivery.reach?.users !== undefined && <p className="text-sm mb-2">{delivery.reach.users_with_a_valid_token} of {delivery.reach.users} users reachable ({delivery.reach.coverage_pct}%)</p>}
                  <DataTable rows={delivery.by_type.map((t) => ({ ...t }))} columns={[{ key: "type", label: "Type", align: "left" }, { key: "total", label: "Sent", fmt: "int" }, { key: "delivered", label: "Delivered", fmt: "int" }, { key: "delivery_rate_pct", label: "Rate", fmt: "pct" }]} maxRows={8} />
                </>
              )}
            </Section>
            <Section title="Recent client errors" note={errs?.total !== undefined ? `${errs.total.toLocaleString()} reported in total. Newest 25.` : undefined}>
              {!errs?.errors?.length ? <Empty text="No client errors reported." /> : (
                <ul className="text-xs space-y-1.5 max-h-72 overflow-y-auto">
                  {errs.errors.map((e, i) => (
                    <li key={i} className="border-b border-border/50 pb-1.5">
                      <span className={e.is_fatal ? "text-red-400 font-medium" : "text-amber-400"}>{e.is_fatal ? "Fatal" : "Error"}</span>{" "}
                      <span>{String(e.message || e.error || e.name || "Unknown error").slice(0, 160)}</span>
                      <span className="text-muted-foreground"> · {String(e.app_version || "")} {e.created_at ? new Date(String(e.created_at)).toLocaleString() : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      )}
    </Gate>
  );
}

type Tab = "health" | "ops" | "creators";

function AdminInner() {
  const params = useSearchParams();
  const initial = (params.get("tab") as Tab) || "health";
  const [tab, setTab] = useState<Tab>(["health", "ops", "creators"].includes(initial) ? initial : "health");
  return (
    <div className="space-y-5">
      <PageHeader title="Admin & Ops" question="Run the app: tracking health, access, config and creators." />
      <Tabs tabs={[{ value: "health", label: "Tracking & health" }, { value: "ops", label: "Access & config" }, { value: "creators", label: "Creator applications" }]} value={tab} onChange={setTab} />
      {tab === "health" && <TrackingHealth />}
      {tab === "ops" && <Legacy><ClassicAdmin /></Legacy>}
      {tab === "creators" && <Legacy><CreatorsPage /></Legacy>}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminInner />
    </Suspense>
  );
}
