"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { DataTable, Empty, Gate, PageHeader, Section, Spinner, Tabs, V3Tag } from "@/components/v3/ui";
import { Legacy } from "@/components/v3/Legacy";
import { api, UserTimelineData } from "@/lib/api";
import { V3_BASE, humanize, useV3 } from "@/lib/v3";
import { cn } from "@/lib/utils";
import ClassicExplorer from "./classic/page";

interface UserRow {
  user_id: string; username: string | null; email: string | null; name: string | null; created_at: string | null;
  stage: string; subscription: string | null; paying: boolean; is_v3: boolean; is_comp: boolean; is_internal: boolean;
  founding_member: boolean; workouts_count: number; last_workout_at: string | null; goal: string | null; experience: string | null;
  [k: string]: unknown;
}
interface UsersData { total: number; users: UserRow[]; stages: { stage: string; users: number }[]; paying: number; note: string }
interface UserDetail {
  user_id: string; username: string; email: string; name: string; created_at: string | null; stage: string;
  subscription_state: string | null; subscription: { product_id: string | null; plan: string | null; status: string | null; expiration_date: string | null };
  is_v3: boolean; is_comp: boolean; is_internal: boolean; founding_member: boolean; workouts_count: number; streak: number;
  milestones: Record<string, string>; training_profile: Record<string, unknown>;
  v3_summary: { generated: number; started: number; completed: number; states_used: { state: string; count: number }[] };
  v3_workouts: { workout_id: string; created_at: string | null; direction: string | null; archetype: string | null; requested_minutes: number | null;
    estimated_minutes: number | null; states: string[]; target: string | null; different_workout_count: number; started: boolean; status: string;
    completed_at: string | null; duration_actual: number | null; fit_rating: string | null; [k: string]: unknown }[];
}

const MILESTONES: [string, string][] = [
  ["v3_onboarded_at", "V3 onboarding done"], ["first_workout_generated_at", "First workout generated"],
  ["first_workout_started_at", "First workout started"], ["first_workout_completed_at", "First workout completed"],
  ["second_workout_attempted_at", "Tried workout #2"], ["first_paywall_at", "First paywall"],
  ["trial_started_at", "Trial started"], ["first_paid_at", "First payment"],
];
const STAGE_STYLE: Record<string, string> = {
  Onboarding: "text-muted-foreground", Onboarded: "text-muted-foreground", Activated: "text-sky-400", Returned: "text-sky-300",
  Habit: "text-green-400", "At risk": "text-amber-400", Lapsed: "text-red-400",
};
const d = (iso: string | null | undefined, time = false) =>
  iso ? new Date(iso).toLocaleString("en-US", time ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" }) : "—";

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] font-medium", className)}>{children}</span>;
}

function UserDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const [u, setU] = useState<UserDetail | null>(null);
  const [tl, setTl] = useState<UserTimelineData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    setU(null); setTl(null); setErr(null);
    api.get<UserDetail>(`${V3_BASE}/users/${id}`).then((r) => (r.error ? setErr(r.error) : setU(r.data ?? null)));
    api.getUserTimeline(id).then((r) => setTl(r.data ?? ({ events: [] } as unknown as UserTimelineData)));
  }, [id]);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl h-full overflow-y-auto bg-background border-l border-border p-5 space-y-4">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        {err && <p className="text-destructive text-sm">{err}</p>}
        {!u && !err && <Spinner label="Loading user..." />}
        {u && (
          <>
            <div>
              <h2 className="text-xl font-bold">{u.name || u.username}</h2>
              <p className="text-sm text-muted-foreground">@{u.username} · {u.email} · joined {d(u.created_at)}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge className={STAGE_STYLE[u.stage]}>{u.stage}</Badge>
                {u.is_v3 && <V3Tag />}
                {u.subscription_state && <Badge>{humanize(u.subscription_state)}{u.subscription.plan ? ` · ${u.subscription.plan}` : ""}</Badge>}
                {u.founding_member && <Badge>Founding Member</Badge>}
                {u.is_comp && <Badge>Comp</Badge>}
                {u.is_internal && <Badge className="text-amber-400">Internal</Badge>}
                <Badge>{u.workouts_count} workouts</Badge>
                <Badge>{u.streak}-day streak</Badge>
                <button
                  onClick={async () => {
                    const r = await api.post<{ is_internal: boolean }>(`${V3_BASE}/users/${u.user_id}/internal?value=${!u.is_internal}`);
                    if (!r.error) setU({ ...u, is_internal: !u.is_internal });
                  }}
                  className="ml-auto text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  {u.is_internal ? "Unmark as test account" : "Mark as test account"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Section title="Milestones">
                <ol className="space-y-1.5 text-sm">
                  {MILESTONES.map(([k, label]) => (
                    <li key={k} className="flex justify-between gap-3">
                      <span className={u.milestones[k] ? "" : "text-muted-foreground/60"}>{label}</span>
                      <span className="tabular-nums text-muted-foreground">{u.milestones[k] ? d(u.milestones[k], true) : "—"}</span>
                    </li>
                  ))}
                </ol>
              </Section>
              <Section title="Training profile">
                {Object.keys(u.training_profile).length === 0 ? <Empty text="No V3 training profile." /> : (
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    {Object.entries(u.training_profile).filter(([k]) => !["version", "updated_at", "created_at"].includes(k)).map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-muted-foreground">{humanize(k)}</dt>
                        <dd className="truncate">{Array.isArray(v) ? v.join(", ") : typeof v === "string" && v.includes("T") && k.endsWith("_at") ? d(v) : humanize(String(v ?? "—"))}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </Section>
            </div>
            <Section title={`V3 workouts · ${u.v3_summary.generated} generated, ${u.v3_summary.started} started, ${u.v3_summary.completed} completed`}
              note={u.v3_summary.states_used.length ? `States used: ${u.v3_summary.states_used.map((s) => `${humanize(s.state)} ×${s.count}`).join(", ")}` : undefined}>
              <DataTable
                rows={u.v3_workouts.map((w) => ({ ...w, created: d(w.created_at, true), direction: humanize(w.direction), states_l: w.states.map(humanize).join(", ") || "—",
                  len: w.requested_minutes ? `${w.requested_minutes} min` : "—", outcome: w.status === "completed" ? `Done${w.duration_actual ? ` · ${Math.round(w.duration_actual)} min` : ""}` : w.started ? "Started" : "Not started" }))}
                columns={[{ key: "created", label: "Built", align: "left" }, { key: "direction", label: "Direction", align: "left" }, { key: "archetype", label: "Type", align: "left" },
                  { key: "len", label: "Length", align: "left" }, { key: "states_l", label: "States", align: "left" }, { key: "outcome", label: "Outcome", align: "left" }]}
                empty="No V3 workouts yet." maxRows={10}
              />
            </Section>
            <Section title="Event timeline" note="Every tracked event, newest first.">
              {!tl ? <Spinner label="Loading timeline..." /> : !tl.events?.length ? <Empty text="No events." /> : (
                <ul className="text-sm divide-y divide-border/50 max-h-[420px] overflow-y-auto">
                  {tl.events.slice(0, 200).map((e) => (
                    <li key={e.event_id} className="py-1.5 flex justify-between gap-3">
                      <span>{e.event_label || humanize(e.event_type)}</span>
                      <span className="text-muted-foreground tabular-nums whitespace-nowrap">{d(e.timestamp, true)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function V3Users() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [query, setQuery] = useState(params.get("q") || "");
  const [stage, setStage] = useState<string>("");
  const [open, setOpen] = useState<string | null>(params.get("user"));
  const { data, error, loading } = useV3<UsersData>("/users", { q: query, stage, limit: 200 });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q); }} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username, email or user id"
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary/60" />
        </form>
      </div>
      <Gate loading={loading} error={error} label="users">
        {data && (
          <>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setStage("")} className={cn("rounded-md border px-3 py-1.5 text-sm", !stage ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                All
              </button>
              {data.stages.map((s) => (
                <button key={s.stage} onClick={() => setStage(stage === s.stage ? "" : s.stage)}
                  className={cn("rounded-md border px-3 py-1.5 text-sm", stage === s.stage ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  <span className={STAGE_STYLE[s.stage]}>{s.stage}</span> <span className="tabular-nums">{s.users}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{data.note}</p>
            <Section title={`${data.total.toLocaleString()} people`} note="Most recently active first. Click a row for the full story.">
              <DataTable
                rows={data.users.map((u) => ({ ...u, who: u.username || u.email || u.user_id, joined: d(u.created_at), last: d(u.last_workout_at),
                  v3: u.is_v3 ? "V3" : "—", sub: u.subscription ? humanize(u.subscription) : "—", flags: [u.founding_member && "Founding", u.is_comp && "Comp", u.is_internal && "Internal"].filter(Boolean).join(", ") || "" }))}
                columns={[{ key: "who", label: "User", align: "left" }, { key: "stage", label: "Stage", align: "left" }, { key: "v3", label: "App", align: "left" },
                  { key: "sub", label: "Subscription", align: "left" }, { key: "workouts_count", label: "Workouts", fmt: "int" }, { key: "last", label: "Last workout", align: "right" },
                  { key: "joined", label: "Joined", align: "right" }, { key: "flags", label: "", align: "left" }]}
                onRowClick={(r) => setOpen(r.user_id as string)}
                empty="No users match." maxRows={100}
              />
            </Section>
          </>
        )}
      </Gate>
      {open && <UserDrawer id={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function UsersInner() {
  const [tab, setTab] = useState<"v3" | "classic">("v3");
  return (
    <div className="space-y-5">
      <PageHeader title="Users" question="What exactly did this person do?" />
      <FilterBar showGranularity={false} showVersion={tab === "v3"} />
      <Tabs tabs={[{ value: "v3", label: "People" }, { value: "classic", label: "Classic explorer (sessions, logins)" }]} value={tab} onChange={setTab} />
      {tab === "v3" ? <V3Users /> : <Legacy><ClassicExplorer /></Legacy>}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersInner />
    </Suspense>
  );
}
