"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  api,
  type CreatorApplication,
  type CreatorAppStatus,
} from "@/lib/api";
import { redirect } from "next/navigation";
import {
  UserPlus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Instagram,
  Music2,
  ExternalLink,
  Copy,
  Check,
  X,
  PenLine,
  Mail,
} from "lucide-react";

type Filter = "all" | CreatorAppStatus;

const STATUS_STYLES: Record<CreatorAppStatus, string> = {
  pending: "bg-amber-500/15 text-amber-500",
  approved: "bg-blue-500/15 text-blue-400",
  signed: "bg-green-500/15 text-green-500",
  rejected: "bg-muted text-muted-foreground",
};

const TIER_LABELS: Record<string, string> = {
  weekly: "Weekly · $25/wk",
  monthly: "Monthly · $100/mo",
  oneoff: "One-off (per piece)",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function CreatorsPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  const [apps, setApps] = useState<CreatorApplication[]>([]);
  const [counts, setCounts] = useState<Record<CreatorAppStatus, number>>({
    pending: 0,
    approved: 0,
    signed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("pending");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Per-row approve controls
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveTier, setApproveTier] = useState<string>("weekly");
  const [approveCode, setApproveCode] = useState<string>("");

  const [copied, setCopied] = useState<string | null>(null);
  const [signature, setSignature] = useState<{ name: string; image: string } | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) redirect("/");
  }, [isLoading, isAuthenticated, isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.listCreatorApplications("all");
    if (res.data) {
      setApps(res.data.applications);
      setCounts(res.data.counts);
    } else if (res.error) {
      setResult({ type: "error", message: res.error });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    load();
  }, [isAuthenticated, isAdmin, load]);

  const openApprove = (a: CreatorApplication) => {
    setApprovingId(a.id);
    setApproveTier(a.tier || "weekly");
    setApproveCode("");
    setResult(null);
  };

  const handleApprove = async (a: CreatorApplication) => {
    setActionLoading(`approve-${a.id}`);
    setResult(null);
    const res = await api.approveCreatorApplication(a.id, {
      tier: approveTier || undefined,
      code: approveCode.trim() || undefined,
    });
    if (res.data?.ok) {
      setResult({
        type: "success",
        message: `Approved ${a.name} — code ${res.data.code}. ${
          res.data.emailed ? "Sign link emailed." : "Email not sent (check Resend key)."
        }`,
      });
      setApprovingId(null);
      await load();
    } else {
      setResult({ type: "error", message: res.error || "Failed to approve." });
    }
    setActionLoading(null);
  };

  const handleReject = async (a: CreatorApplication) => {
    setActionLoading(`reject-${a.id}`);
    setResult(null);
    const res = await api.rejectCreatorApplication(a.id);
    if (res.data?.ok) {
      setResult({ type: "success", message: `${a.name} moved to rejected.` });
      await load();
    } else {
      setResult({ type: "error", message: res.error || "Failed to reject." });
    }
    setActionLoading(null);
  };

  const handleResend = async (a: CreatorApplication) => {
    setActionLoading(`resend-${a.id}`);
    setResult(null);
    const res = await api.approveCreatorApplication(a.id, { tier: a.tier || undefined });
    if (res.data?.ok) {
      setResult({ type: "success", message: `Re-sent sign link to ${a.email}.` });
      await load();
    } else {
      setResult({ type: "error", message: res.error || "Failed to resend." });
    }
    setActionLoading(null);
  };

  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const viewSignature = async (a: CreatorApplication) => {
    setActionLoading(`sig-${a.id}`);
    const res = await api.getCreatorSignature(a.id);
    setActionLoading(null);
    if (res.data?.signature_image) {
      setSignature({ name: a.signature_name || a.name, image: res.data.signature_image });
    } else {
      setResult({ type: "error", message: "No drawn signature on file (typed signature only)." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "pending", label: `Pending${counts.pending ? ` (${counts.pending})` : ""}` },
    { key: "approved", label: `Approved${counts.approved ? ` (${counts.approved})` : ""}` },
    { key: "signed", label: `Signed${counts.signed ? ` (${counts.signed})` : ""}` },
    { key: "rejected", label: `Rejected${counts.rejected ? ` (${counts.rejected})` : ""}` },
    { key: "all", label: "All" },
  ];

  const visible = apps.filter((a) => filter === "all" || a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Creators
          </h1>
          <p className="text-muted-foreground">
            Review applicants, approve to mint a code and email their sign link, and track signed agreements.
          </p>
        </div>
        <button
          onClick={load}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {result && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            result.type === "success"
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <p className={result.type === "success" ? "text-green-500" : "text-red-500"}>
            {result.message}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              filter === t.key
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-muted-foreground">
            {loading ? "Loading applications…" : "No applications here yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => {
            const isApproving = approvingId === a.id;
            return (
              <div key={a.id} className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: identity */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base truncate">{a.name || "(no name)"}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[a.status]}`}
                      >
                        {a.status}
                      </span>
                      {a.tier && TIER_LABELS[a.tier] && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {TIER_LABELS[a.tier]}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {a.email && (
                        <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                          <Mail className="h-3.5 w-3.5" /> {a.email}
                        </a>
                      )}
                      {a.instagram_url && (
                        <a
                          href={a.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <Instagram className="h-3.5 w-3.5" /> {a.instagram || "Instagram"}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      )}
                      {a.tiktok_url && (
                        <a
                          href={a.tiktok_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <Music2 className="h-3.5 w-3.5" /> {a.tiktok || "TikTok"}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {a.audience && <span>Audience: <span className="text-foreground">{a.audience}</span></span>}
                      {a.niche && <span>Niche: <span className="text-foreground">{a.niche}</span></span>}
                      {a.created_at && <span>Applied {timeAgo(a.created_at)}</span>}
                      {a.link && (
                        <a href={a.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                          Best work <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      )}
                    </div>

                    {a.why && (
                      <p className="mt-2 text-sm text-foreground/80 italic border-l-2 border-border pl-3">
                        “{a.why}”
                      </p>
                    )}

                    {/* Approved / signed detail strip */}
                    {(a.status === "approved" || a.status === "signed") && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        {a.code && (
                          <button
                            onClick={() => copy(`code-${a.id}`, a.code)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/60 font-mono hover:bg-muted"
                            title="Copy code"
                          >
                            {a.code}
                            {copied === `code-${a.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                        {a.sign_link && (
                          <button
                            onClick={() => copy(`link-${a.id}`, a.sign_link)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/60 hover:bg-muted"
                            title="Copy sign link"
                          >
                            {copied === `link-${a.id}` ? "Copied" : "Copy sign link"}
                            {copied === `link-${a.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                        {a.store_link && (
                          <button
                            onClick={() => copy(`bio-${a.id}`, a.store_link)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/60 hover:bg-muted"
                            title="Copy the creator's App Store bio link"
                          >
                            {copied === `bio-${a.id}` ? "Copied" : "Copy bio link"}
                            {copied === `bio-${a.id}` ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        )}
                        {a.status === "signed" && (
                          <>
                            <span className="text-muted-foreground">
                              Signed {timeAgo(a.signed_at)}
                              {a.signature_name ? ` by ${a.signature_name}` : ""}
                              {a.payout_method ? ` · ${a.payout_method} ${a.payout_handle}` : ""}
                            </span>
                            {a.has_signature && (
                              <button
                                onClick={() => viewSignature(a)}
                                disabled={actionLoading === `sig-${a.id}`}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/60 hover:bg-muted disabled:opacity-50"
                              >
                                <PenLine className="h-3 w-3" /> View signature
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex flex-col items-stretch gap-2 w-full sm:w-auto">
                    {a.status === "pending" && !isApproving && (
                      <>
                        <button
                          onClick={() => openApprove(a)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(a)}
                          disabled={actionLoading === `reject-${a.id}`}
                          className="px-4 py-2 text-sm bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading === `reject-${a.id}` ? "…" : "Reject"}
                        </button>
                      </>
                    )}

                    {a.status === "approved" && (
                      <button
                        onClick={() => handleResend(a)}
                        disabled={actionLoading === `resend-${a.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {actionLoading === `resend-${a.id}` ? "…" : "Resend link"}
                      </button>
                    )}

                    {a.status === "rejected" && (
                      <button
                        onClick={() => openApprove(a)}
                        className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                      >
                        Reconsider
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline approve controls */}
                {isApproving && (
                  <div className="mt-4 border-t border-border pt-4 flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Tier</label>
                      <select
                        value={approveTier}
                        onChange={(e) => setApproveTier(e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      >
                        <option value="weekly">Weekly · $25/wk</option>
                        <option value="monthly">Monthly · $100/mo</option>
                        <option value="oneoff">One-off (per piece)</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Custom code (optional)</label>
                      <input
                        type="text"
                        value={approveCode}
                        onChange={(e) => setApproveCode(e.target.value)}
                        placeholder="auto: MOOD-NAME"
                        className="w-full mt-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(a)}
                        disabled={actionLoading === `approve-${a.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {actionLoading === `approve-${a.id}` ? "Approving…" : "Confirm & email link"}
                      </button>
                      <button
                        onClick={() => setApprovingId(null)}
                        className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Signature modal */}
      {signature && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSignature(null)}
        >
          <div
            className="bg-card border border-border rounded-lg p-5 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Signature — {signature.name}</h3>
              <button onClick={() => setSignature(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signature.image}
              alt={`Signature of ${signature.name}`}
              className="w-full rounded-md bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
