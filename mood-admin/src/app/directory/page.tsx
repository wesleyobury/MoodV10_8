"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Download, MailCheck, Search } from "lucide-react";
import { Gate, PageHeader, Pills, Section } from "@/components/v3/ui";
import { api } from "@/lib/api";
import { V3_BASE, humanize } from "@/lib/v3";
import { cn } from "@/lib/utils";

type EmailKind = "real" | "relay" | "none";
type Push = "on" | "off_in_app" | "expired" | "never";

interface Row {
  user_id: string; name: string | null; username: string | null; email: string | null; email_kind: EmailKind;
  provider: string; created_at: string | null; subscription: string | null; founding_member: boolean; is_comp: boolean;
  is_internal: boolean; workouts_count: number; push: Push; push_platforms: string[]; push_last_seen: string | null;
  emailed: boolean; emailed_at: string | null;
}
interface DirectoryData {
  total: number; users: Row[]; email: Partial<Record<EmailKind, number>>; push: Partial<Record<Push, number>>; emailed: number; note: string;
}

const EMAIL_LABEL: Record<EmailKind, string> = { real: "Real", relay: "Apple relay", none: "No email" };
const EMAIL_STYLE: Record<EmailKind, string> = { real: "text-green-400", relay: "text-sky-400", none: "text-red-400" };
const PUSH_LABEL: Record<Push, string> = { on: "On", off_in_app: "Off in app", expired: "Expired", never: "Never" };
const PUSH_STYLE: Record<Push, string> = { on: "text-green-400", off_in_app: "text-amber-400", expired: "text-red-400", never: "text-muted-foreground" };
const PROVIDER_LABEL: Record<string, string> = { email: "Email", apple: "Apple", google: "Google" };
const PAGE = 200;

const d = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap", className)}>{children}</span>;
}

function Stat({ label, value, hint, onClick, active }: { label: string; value: number | string; hint?: string; onClick?: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={!onClick}
      className={cn("text-left bg-card border rounded-lg p-3 transition-colors", active ? "border-primary/60 bg-primary/5" : "border-border",
        onClick && "hover:border-primary/40")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums mt-0.5">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </button>
  );
}

function toCSV(rows: Row[]) {
  const cols: (keyof Row)[] = ["name", "username", "email", "email_kind", "provider", "created_at", "subscription", "workouts_count",
    "push", "push_platforms", "push_last_seen", "emailed", "emailed_at", "user_id"];
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.join(" ") : v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export default function DirectoryPage() {
  const [data, setData] = useState<DirectoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [includeInternal, setIncludeInternal] = useState(false);
  const [q, setQ] = useState("");
  const [emailF, setEmailF] = useState<"all" | EmailKind>("all");
  const [pushF, setPushF] = useState<"all" | Push>("all");
  const [emailedF, setEmailedF] = useState<"all" | "yes" | "no">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [shown, setShown] = useState(PAGE);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    api.get<DirectoryData>(`${V3_BASE}/directory?include_internal=${includeInternal}`).then((r) => {
      if (cancelled) return;
      if (r.error) setError(r.error); else setData(r.data ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [includeInternal]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.users.filter((u) =>
      (emailF === "all" || u.email_kind === emailF) &&
      (pushF === "all" || u.push === pushF) &&
      (emailedF === "all" || (emailedF === "yes") === u.emailed) &&
      (!needle || [u.name, u.username, u.email, u.user_id].some((v) => (v || "").toLowerCase().includes(needle))));
  }, [data, q, emailF, pushF, emailedF]);

  useEffect(() => { setShown(PAGE); }, [q, emailF, pushF, emailedF]);

  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 2500); };

  const markEmailed = async (ids: string[], value: boolean) => {
    if (!ids.length || !data) return;
    setBusy(true);
    const r = await api.post<{ updated: number; emailed_at: string | null }>(`${V3_BASE}/directory/emailed`, { user_ids: ids, value });
    setBusy(false);
    if (r.error || !r.data) { say(`Couldn't save: ${r.error ?? "unknown error"}`); return; }
    const set = new Set(ids);
    const at = r.data.emailed_at;
    const users = data.users.map((u) => (set.has(u.user_id) ? { ...u, emailed: value, emailed_at: value ? at : null } : u));
    setData({ ...data, users, emailed: users.filter((u) => u.emailed).length });
    if (ids.length > 1) { setSelected(new Set()); say(`Marked ${r.data.updated} ${value ? "emailed" : "not emailed"}`); }
  };

  const reachable = filtered.filter((u) => u.email_kind !== "none" && u.email);
  const copyEmails = async () => {
    const list = reachable.map((u) => u.email).join(", ");
    try { await navigator.clipboard.writeText(list); say(`Copied ${reachable.length} emails`); } catch { say("Clipboard blocked by the browser"); }
  };
  const exportCSV = () => {
    const blob = new Blob([toCSV(filtered)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mood-directory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((u) => selected.has(u.user_id));
  const toggleAll = () => setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((u) => u.user_id)));
  const toggleOne = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-5">
      <PageHeader title="Directory" question="Every account: who can I reach, and have I reached them?">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={includeInternal} onChange={(e) => setIncludeInternal(e.target.checked)} />
          Include test accounts
        </label>
      </PageHeader>
      <Gate loading={loading && !data} error={error} label="directory">
        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <Stat label="Accounts" value={data.total} onClick={() => { setEmailF("all"); setPushF("all"); setEmailedF("all"); }} />
              <Stat label="Real email" value={data.email.real ?? 0} onClick={() => setEmailF(emailF === "real" ? "all" : "real")} active={emailF === "real"} />
              <Stat label="Apple relay" value={data.email.relay ?? 0} hint="Hide My Email" onClick={() => setEmailF(emailF === "relay" ? "all" : "relay")} active={emailF === "relay"} />
              <Stat label="No email" value={data.email.none ?? 0} hint="Placeholder, will bounce" onClick={() => setEmailF(emailF === "none" ? "all" : "none")} active={emailF === "none"} />
              <Stat label="Push on" value={data.push.on ?? 0} hint={`${Math.round(((data.push.on ?? 0) / Math.max(data.total, 1)) * 100)}% of accounts`} onClick={() => setPushF(pushF === "on" ? "all" : "on")} active={pushF === "on"} />
              <Stat label="Emailed" value={data.emailed} hint={`${(data.total - data.emailed).toLocaleString()} not yet`} onClick={() => setEmailedF(emailedF === "no" ? "all" : "no")} active={emailedF === "no"} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, username, email or id"
                  className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary/60" />
              </div>
              <Pills value={emailF} onChange={setEmailF} options={[{ value: "all", label: "Any email" }, { value: "real", label: "Real" }, { value: "relay", label: "Relay" }, { value: "none", label: "None" }]} />
              <Pills value={pushF} onChange={setPushF} options={[{ value: "all", label: "Any push" }, { value: "on", label: "On" }, { value: "off_in_app", label: "Off in app" }, { value: "expired", label: "Expired" }, { value: "never", label: "Never" }]} />
              <Pills value={emailedF} onChange={setEmailedF} options={[{ value: "all", label: "All" }, { value: "no", label: "Not emailed" }, { value: "yes", label: "Emailed" }]} />
            </div>

            <Section
              title={`${filtered.length.toLocaleString()} ${filtered.length === 1 ? "person" : "people"}`}
              note={data.note}
              right={
                <div className="flex flex-wrap items-center gap-2 justify-end">
                  {flash && <span className="text-xs text-primary">{flash}</span>}
                  {selected.size > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">{selected.size} selected</span>
                      <button disabled={busy} onClick={() => markEmailed(Array.from(selected), true)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50">
                        <MailCheck className="h-3.5 w-3.5" /> Mark emailed
                      </button>
                      <button disabled={busy} onClick={() => markEmailed(Array.from(selected), false)}
                        className="px-2.5 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
                        Mark not emailed
                      </button>
                    </>
                  )}
                  <button onClick={copyEmails} disabled={!reachable.length}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-accent disabled:opacity-50" title="Copies deliverable emails in the current filter">
                    <Copy className="h-3.5 w-3.5" /> Copy {reachable.length.toLocaleString()} emails
                  </button>
                  <button onClick={exportCSV} disabled={!filtered.length}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-accent disabled:opacity-50">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="py-2 pr-2 w-8"><input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} aria-label="Select all" /></th>
                      <th className="py-2 pr-3 font-medium">Person</th>
                      <th className="py-2 pr-3 font-medium">Email</th>
                      <th className="py-2 pr-3 font-medium">Sign-in</th>
                      <th className="py-2 pr-3 font-medium">Joined</th>
                      <th className="py-2 pr-3 font-medium">Plan</th>
                      <th className="py-2 pr-3 font-medium text-right">Workouts</th>
                      <th className="py-2 pr-3 font-medium">Push</th>
                      <th className="py-2 font-medium">Emailed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, shown).map((u) => (
                      <tr key={u.user_id} className={cn("border-b border-border/50 align-top", selected.has(u.user_id) && "bg-primary/5")}>
                        <td className="py-2 pr-2"><input type="checkbox" checked={selected.has(u.user_id)} onChange={() => toggleOne(u.user_id)} aria-label="Select" /></td>
                        <td className="py-2 pr-3">
                          <a href={`/users?user=${u.user_id}`} className="hover:underline">{u.name || u.username || "—"}</a>
                          <div className="text-xs text-muted-foreground">@{u.username || "—"}{u.is_internal && <span className="text-amber-400"> · test</span>}</div>
                        </td>
                        <td className="py-2 pr-3 max-w-[280px]">
                          <div className={cn("truncate", u.email_kind === "none" && "text-muted-foreground line-through")} title={u.email || ""}>{u.email || "—"}</div>
                          <Badge className={EMAIL_STYLE[u.email_kind]}>{EMAIL_LABEL[u.email_kind]}</Badge>
                        </td>
                        <td className="py-2 pr-3">{PROVIDER_LABEL[u.provider] ?? humanize(u.provider)}</td>
                        <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{d(u.created_at)}</td>
                        <td className="py-2 pr-3">
                          {u.subscription ? humanize(u.subscription) : <span className="text-muted-foreground">Free</span>}
                          {u.founding_member && <div className="text-[11px] text-muted-foreground">Founding</div>}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{u.workouts_count}</td>
                        <td className="py-2 pr-3">
                          <Badge className={PUSH_STYLE[u.push]}>{PUSH_LABEL[u.push]}</Badge>
                          {u.push_platforms.length > 0 && <div className="text-[11px] text-muted-foreground mt-0.5">{u.push_platforms.map((p) => (p === "ios" ? "iOS" : humanize(p))).join(", ")}</div>}
                        </td>
                        <td className="py-2">
                          <button disabled={busy} onClick={() => markEmailed([u.user_id], !u.emailed)}
                            className={cn("px-2 py-1 text-xs rounded-md border whitespace-nowrap disabled:opacity-50",
                              u.emailed ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-border text-muted-foreground hover:text-foreground")}
                            title={u.emailed ? "Click to mark not emailed" : "Click to mark emailed"}>
                            {u.emailed ? `✓ ${d(u.emailed_at)}` : "Not emailed"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No one matches these filters.</p>}
                {filtered.length > shown && (
                  <button onClick={() => setShown(shown + PAGE)} className="mt-3 w-full py-2 text-sm text-muted-foreground border border-border rounded-md hover:text-foreground">
                    Show {Math.min(PAGE, filtered.length - shown)} more ({(filtered.length - shown).toLocaleString()} hidden)
                  </button>
                )}
              </div>
            </Section>
          </>
        )}
      </Gate>
    </div>
  );
}
