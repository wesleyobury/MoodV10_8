"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { api, LiveSnapshotData } from "@/lib/api";
import { UserPlus, Download, Sparkles, CreditCard } from "lucide-react";

const REFRESH_MS = 60_000;

function Stat({
  label,
  value,
  sub,
  subMuted,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  subMuted?: boolean;
  icon: ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className={`text-xs mt-1 ${subMuted ? "text-muted-foreground" : "text-green-500"}`}>{sub}</p>
    </div>
  );
}

export function LiveSnapshot({ includeInternal = false }: { includeInternal?: boolean }) {
  const [data, setData] = useState<LiveSnapshotData | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const res = await api.getLiveSnapshot(includeInternal);
    if (res.data) {
      setData(res.data);
      setUpdatedAt(new Date());
    }
  }, [includeInternal]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const n = (x?: number) => (x ?? 0).toLocaleString();
  const dl = data?.downloads;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <h3 className="text-sm font-medium text-muted-foreground">Live snapshot</h3>
        {updatedAt && (
          <span className="text-xs text-muted-foreground/60">updated {updatedAt.toLocaleTimeString()}</span>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Sign-ups"
          value={n(data?.signups.total)}
          sub={`+${n(data?.signups.today)} today`}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <Stat
          label="Downloads"
          value={dl?.synced ? n(dl?.total) : "—"}
          sub={dl?.synced ? `+${n(dl?.today)} today` : "App Store sync not configured"}
          subMuted={!dl?.synced}
          icon={<Download className="h-4 w-4" />}
        />
        <Stat
          label="Free trials"
          value={n(data?.trials.active)}
          sub={`+${n(data?.trials.today)} started today`}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <Stat
          label="Subscriptions"
          value={n(data?.subscriptions.active)}
          sub={`+${n(data?.subscriptions.today)} today`}
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>
      <p className="text-xs text-muted-foreground/60 mt-2">
        Sign-ups &amp; downloads are lifetime totals; trials &amp; subscriptions are active right now. Auto-refreshes each minute.
      </p>
    </div>
  );
}
