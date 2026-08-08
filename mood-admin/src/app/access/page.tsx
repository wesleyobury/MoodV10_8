"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, type CompUser, type AppConfig, type CreatorCode } from "@/lib/api";
import { redirect } from "next/navigation";
import {
  Gift,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Trash2,
  RefreshCw,
  Ticket,
  Plus,
  Copy,
  Check,
} from "lucide-react";

export default function AccessPage() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  const [compUsers, setCompUsers] = useState<CompUser[]>([]);
  const [compLoading, setCompLoading] = useState(false);
  const [grantId, setGrantId] = useState("");

  const [codes, setCodes] = useState<CreatorCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState("");
  const [newCustomCode, setNewCustomCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [testUsername, setTestUsername] = useState("");
  const [testing, setTesting] = useState(false);

  // V2.1 — send to one account first. The blast reaches everyone and is
  // idempotent, so a bad video URL or caption is not something you get to undo;
  // this is the dry run.
  const handleTestSend = async () => {
    const handle = testUsername.trim().replace(/^@/, "");
    if (!handle) {
      setResult({ type: "error", message: "Enter a username to test with." });
      return;
    }
    if (!config?.welcome_video_url) {
      setResult({ type: "error", message: "Set a welcome video URL (and Save) before testing." });
      return;
    }
    setTesting(true);
    setResult(null);
    const res = await api.testWelcomeVideo(handle);
    if (res.data?.ok) {
      setResult({
        type: "success",
        message: `Test video DM'd to @${res.data.sent_to}. They're still eligible for the real blast. Check Messages on that account.`,
      });
    } else {
      setResult({ type: "error", message: res.error || "Test send failed." });
    }
    setTesting(false);
  };

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      redirect("/");
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  const loadCompUsers = useCallback(async () => {
    setCompLoading(true);
    const res = await api.listCompUsers();
    if (res.data) setCompUsers(res.data.users);
    setCompLoading(false);
  }, []);

  const loadConfig = useCallback(async () => {
    const res = await api.getAppConfig();
    if (res.data) setConfig(res.data);
  }, []);

  const loadCodes = useCallback(async () => {
    setCodesLoading(true);
    const res = await api.listCreatorCodes();
    if (res.data) setCodes(res.data.codes);
    setCodesLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    loadCompUsers();
    loadCodes();
    loadConfig();
  }, [isAuthenticated, isAdmin, loadCompUsers, loadCodes, loadConfig]);

  const handleGrant = async () => {
    if (!grantId.trim()) return;
    setActionLoading("grant");
    setResult(null);
    const res = await api.grantComp(grantId.trim());
    if (res.data?.ok) {
      setResult({ type: "success", message: `Comp access granted to ${grantId}.` });
      setGrantId("");
      await loadCompUsers();
    } else {
      setResult({ type: "error", message: res.error || `No user matched "${grantId}".` });
    }
    setActionLoading(null);
  };

  const handleRevoke = async (identifier: string, label: string) => {
    setActionLoading(`revoke-${identifier}`);
    setResult(null);
    const res = await api.revokeComp(identifier);
    if (res.data?.ok) {
      setResult({ type: "success", message: `Comp access revoked for ${label}.` });
      await loadCompUsers();
    } else {
      setResult({ type: "error", message: res.error || "Failed to revoke." });
    }
    setActionLoading(null);
  };

  const handleCreateCode = async () => {
    if (!newCreatorName.trim()) return;
    setActionLoading("create-code");
    setResult(null);
    const res = await api.createCreatorCode({
      creator_name: newCreatorName.trim(),
      code: newCustomCode.trim() || undefined,
    });
    if (res.data?.ok) {
      setResult({ type: "success", message: `Code ${res.data.code} created for ${newCreatorName}.` });
      setNewCreatorName("");
      setNewCustomCode("");
      await loadCodes();
    } else {
      setResult({ type: "error", message: res.error || "Failed to create code." });
    }
    setActionLoading(null);
  };

  const handleRevokeCode = async (code: string) => {
    setActionLoading(`revoke-code-${code}`);
    setResult(null);
    const res = await api.revokeCreatorCode(code);
    if (res.data?.ok) {
      setResult({ type: "success", message: `Code ${code} deactivated. Creators who already redeemed it keep access.` });
      await loadCodes();
    } else {
      setResult({ type: "error", message: res.error || "Failed to deactivate code." });
    }
    setActionLoading(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1500);
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    setResult(null);
    const res = await api.updateAppConfig({
      min_supported_build_ios: Number(config.min_supported_build_ios) || 0,
      min_supported_build_android: Number(config.min_supported_build_android) || 0,
      latest_build_ios: Number(config.latest_build_ios) || 0,
      latest_build_android: Number(config.latest_build_android) || 0,
      force_update_message: config.force_update_message || "",
      ios_store_url: config.ios_store_url || "",
      android_store_url: config.android_store_url || "",
      update_check_enabled: !!config.update_check_enabled,
      welcome_video_enabled: !!config.welcome_video_enabled,
      welcome_video_url: config.welcome_video_url || "",
      welcome_video_thumbnail_url: config.welcome_video_thumbnail_url || "",
      welcome_video_caption: config.welcome_video_caption || "",
    });
    if (res.data?.ok) {
      setResult({ type: "success", message: "App config saved." });
      await loadConfig();
    } else {
      setResult({ type: "error", message: res.error || "Failed to save config." });
    }
    setSavingConfig(false);
  };

  const setCfg = (patch: Partial<AppConfig>) =>
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleBroadcast = async () => {
    if (!config?.welcome_video_enabled || !config?.welcome_video_url) {
      setResult({ type: "error", message: "Enable the welcome video and set a URL (then Save) before blasting." });
      return;
    }
    if (!window.confirm("Send this welcome video as a DM to ALL users? Safe to re-run, but this reaches everyone.")) {
      return;
    }
    setBroadcasting(true);
    setResult(null);
    const res = await api.broadcastWelcomeVideo();
    if (res.data?.ok) {
      setResult({
        type: "success",
        message: `Blasted to ${res.data.sent.toLocaleString()} users (${res.data.skipped.toLocaleString()} already had it).`,
      });
    } else {
      setResult({ type: "error", message: res.error || "Broadcast failed." });
    }
    setBroadcasting(false);
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

  const numField = "w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Access & App Config</h1>
        <p className="text-muted-foreground">
          Comp accounts (lifetime free access) and forced-update controls
        </p>
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

      {/* Comp Accounts */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Comp Accounts</h2>
          </div>
          <button
            onClick={loadCompUsers}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${compLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Grant lifetime full access by email, username, or user ID. Takes effect on the
          user&apos;s next entitlement check.
        </p>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={grantId}
            onChange={(e) => setGrantId(e.target.value)}
            placeholder="email / username / user id"
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleGrant}
            disabled={!grantId.trim() || actionLoading === "grant"}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {actionLoading === "grant" ? "Granting..." : "Grant Comp"}
          </button>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            {compUsers.length} comp {compUsers.length === 1 ? "user" : "users"}
          </p>
          {compUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No comp users yet.</p>
          ) : (
            <div className="space-y-2">
              {compUsers.map((u) => (
                <div
                  key={u.user_id}
                  className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {u.name || u.username || "(no name)"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email || u.user_id}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(u.user_id, u.email || u.username || u.user_id)}
                    disabled={actionLoading === `revoke-${u.user_id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {actionLoading === `revoke-${u.user_id}` ? "..." : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creator Codes */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Creator Codes</h2>
          </div>
          <button
            onClick={loadCodes}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${codesLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Per-creator codes the creator redeems inside the app to unlock lifetime access —
          works no matter how they sign in (email, Google, or Apple Hide My Email). Single-use
          by default. Give the creator their code; access goes live the moment they enter it.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            value={newCreatorName}
            onChange={(e) => setNewCreatorName(e.target.value)}
            placeholder="Creator name (e.g. Steph)"
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            value={newCustomCode}
            onChange={(e) => setNewCustomCode(e.target.value)}
            placeholder="Custom code (optional)"
            className="flex-1 px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleCreateCode}
            disabled={!newCreatorName.trim() || actionLoading === "create-code"}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {actionLoading === "create-code" ? "Creating..." : "Generate"}
          </button>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            {codes.length} {codes.length === 1 ? "code" : "codes"}
          </p>
          {codes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No creator codes yet.</p>
          ) : (
            <div className="space-y-2">
              {codes.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-2 gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-medium truncate">{c.code}</code>
                      <button
                        onClick={() => handleCopyCode(c.code)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === c.code ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      {!c.active && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.creator_name || "(no name)"} ·{" "}
                      {c.redemption_count >= c.max_redemptions ? (
                        <span className="text-foreground">
                          redeemed{c.redemptions[0]?.username ? ` by ${c.redemptions[0].username}` : ""}
                        </span>
                      ) : (
                        `${c.redemption_count}/${c.max_redemptions} redeemed`
                      )}
                    </p>
                  </div>
                  {c.active && (
                    <button
                      onClick={() => handleRevokeCode(c.code)}
                      disabled={actionLoading === `revoke-code-${c.code}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 disabled:opacity-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {actionLoading === `revoke-code-${c.code}` ? "..." : "Deactivate"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Forced Update / App Config */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-medium">Forced Update</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Builds below the minimum get a non-dismissible update screen. Toggle off to disable
          all version checks instantly. Defaults are safe (checks disabled, min = 0).
        </p>

        {!config ? (
          <p className="text-sm text-muted-foreground">Loading config…</p>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!config.update_check_enabled}
                onChange={(e) => setCfg({ update_check_enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="font-medium">Version checks enabled</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Min build — iOS</label>
                <input
                  type="number"
                  value={config.min_supported_build_ios}
                  onChange={(e) => setCfg({ min_supported_build_ios: Number(e.target.value) })}
                  className={numField}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Min build — Android</label>
                <input
                  type="number"
                  value={config.min_supported_build_android}
                  onChange={(e) =>
                    setCfg({ min_supported_build_android: Number(e.target.value) })
                  }
                  className={numField}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Latest build — iOS</label>
                <input
                  type="number"
                  value={config.latest_build_ios}
                  onChange={(e) => setCfg({ latest_build_ios: Number(e.target.value) })}
                  className={numField}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Latest build — Android</label>
                <input
                  type="number"
                  value={config.latest_build_android}
                  onChange={(e) => setCfg({ latest_build_android: Number(e.target.value) })}
                  className={numField}
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Force-update message</label>
              <textarea
                value={config.force_update_message}
                onChange={(e) => setCfg({ force_update_message: e.target.value })}
                rows={2}
                className={numField}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">iOS store URL</label>
                <input
                  type="text"
                  value={config.ios_store_url}
                  onChange={(e) => setCfg({ ios_store_url: e.target.value })}
                  className={numField}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Android store URL</label>
                <input
                  type="text"
                  value={config.android_store_url}
                  onChange={(e) => setCfg({ android_store_url: e.target.value })}
                  className={numField}
                />
              </div>
            </div>

            {/* Welcome video — DM sent to new signups */}
            <div className="border-t border-border pt-4 space-y-4">
              <div>
                <h3 className="font-medium">Welcome video (new-signup DM)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When enabled, new users get this video from officialmoodapp instead of the text welcome.
                  Upload the video to Cloudinary, paste the URL, and Save — no app build or backend deploy needed to swap it.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.welcome_video_enabled}
                  onChange={(e) => setCfg({ welcome_video_enabled: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="font-medium">Send video welcome</span>
              </label>

              <div>
                <label className="text-sm text-muted-foreground">Cloudinary video URL</label>
                <input
                  type="text"
                  value={config.welcome_video_url || ""}
                  onChange={(e) => setCfg({ welcome_video_url: e.target.value })}
                  placeholder="https://res.cloudinary.com/.../welcome.mp4"
                  className={numField}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Thumbnail URL (optional)</label>
                <input
                  type="text"
                  value={config.welcome_video_thumbnail_url || ""}
                  onChange={(e) => setCfg({ welcome_video_thumbnail_url: e.target.value })}
                  placeholder="Poster image; blank = video's first frame"
                  className={numField}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Caption (optional)</label>
                <textarea
                  value={config.welcome_video_caption || ""}
                  onChange={(e) => setCfg({ welcome_video_caption: e.target.value })}
                  rows={2}
                  placeholder="Shown under the video in the DM"
                  className={numField}
                />
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium text-foreground">Test it on one account first.</span> Sends only to the
                  username below, tagged separately so that account still receives the real blast. Re-sendable while
                  you tweak the video or caption.
                </p>
                <div className="flex gap-2 mb-5">
                  <input
                    type="text"
                    value={testUsername}
                    onChange={(e) => setTestUsername(e.target.value)}
                    placeholder="username"
                    className="flex-1 max-w-xs px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                  <button
                    onClick={handleTestSend}
                    disabled={testing || !config.welcome_video_url || !testUsername.trim()}
                    className="px-4 py-2 bg-background text-foreground border border-border rounded-md font-medium hover:bg-muted disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {testing ? "Sending…" : "Send test"}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  Send this video to <span className="font-medium text-foreground">every user</span>, not just new
                  signups. Save your changes first. Safe to re-run — anyone who already received it is skipped.
                </p>
                <button
                  onClick={handleBroadcast}
                  disabled={broadcasting || !config.welcome_video_enabled || !config.welcome_video_url}
                  className="px-4 py-2 bg-amber-500/15 text-amber-400 border border-amber-500/40 rounded-md font-medium hover:bg-amber-500/25 disabled:opacity-50 transition-colors"
                >
                  {broadcasting ? "Blasting…" : "Blast to all users"}
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingConfig ? "Saving..." : "Save Config"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
