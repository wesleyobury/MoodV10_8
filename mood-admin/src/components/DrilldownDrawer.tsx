"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Users, Activity, Download, ChevronRight, ChevronLeft, Loader2, ExternalLink } from "lucide-react";
import { api, DrilldownUser, DrilldownEvent } from "@/lib/api";
import { useFilters } from "@/lib/filter-context";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DrilldownDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metric: string;
  metricLabel: string;
  value?: string;
  dateLabel?: string;
}

type TabType = "users" | "events";

export function DrilldownDrawer({
  isOpen,
  onClose,
  metric,
  metricLabel,
  value,
  dateLabel,
}: DrilldownDrawerProps) {
  const { filters, startDate, endDate } = useFilters();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [users, setUsers] = useState<DrilldownUser[]>([]);
  const [events, setEvents] = useState<DrilldownEvent[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const startStr = format(startDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");
  const endStr = format(endDate, "yyyy-MM-dd'T'HH:mm:ss'Z'");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await api.getDrilldownUsers(metric, startStr, endStr, {
      value,
      limit: pageSize,
      skip: page * pageSize,
      includeInternal: filters.includeInternal,
    });
    if (res.data) {
      setUsers(res.data.users);
      setTotalUsers(res.data.total);
    }
    setLoading(false);
  }, [metric, startStr, endStr, value, page, filters.includeInternal]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const res = await api.getDrilldownEvents(metric, startStr, endStr, {
      value,
      limit: pageSize,
      skip: page * pageSize,
      includeInternal: filters.includeInternal,
    });
    if (res.data) {
      setEvents(res.data.events);
      setTotalEvents(res.data.total);
    }
    setLoading(false);
  }, [metric, startStr, endStr, value, page, filters.includeInternal]);

  useEffect(() => {
    if (!isOpen) return;
    setPage(0);
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchEvents();
    }
  }, [isOpen, activeTab, metric, value]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "users") {
      fetchUsers();
    } else {
      fetchEvents();
    }
  }, [page, filters.includeInternal]);

  const exportToCSV = () => {
    const headers = activeTab === "users"
      ? ["Username", "Email", "Name", "Metric Value", "Created At"]
      : ["Event Type", "Username", "Timestamp", "Metadata"];

    const rows = activeTab === "users"
      ? users.map((u) => [u.username, u.email, u.name, u.metric_value, u.created_at || ""])
      : events.map((e) => [e.event_type, e.username, e.timestamp || "", JSON.stringify(e.metadata)]);

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${metric}_${activeTab}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalItems = activeTab === "users" ? totalUsers : totalEvents;
  const totalPages = Math.ceil(totalItems / pageSize);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l border-border shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">{metricLabel}</h2>
            <p className="text-sm text-muted-foreground">
              {dateLabel || `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`}
              {value && <span className="ml-2">• {value}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab("users"); setPage(0); }}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === "users"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-4 w-4" />
            Users ({totalUsers})
          </button>
          <button
            onClick={() => { setActiveTab("events"); setPage(0); }}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
              activeTab === "events"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="h-4 w-4" />
            Events ({totalEvents})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeTab === "users" ? (
            <div className="divide-y divide-border">
              {users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No users found for this metric
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.user_id}
                    className="p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {(user.username || user.name || "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{user.username || user.name || "Unknown"}</p>
                          <a
                            href={`/users?q=${user.user_id}`}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{user.metric_value}</p>
                        <p className="text-xs text-muted-foreground">{user.metric_detail}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No events found for this metric
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.event_id}
                    className="p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                        {event.event_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {event.timestamp
                          ? format(new Date(event.timestamp), "MMM d, h:mm a")
                          : "No timestamp"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">by</span>
                      <span className="font-medium">{event.username}</span>
                    </div>
                    {Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer with pagination and export */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-accent hover:bg-accent/80 rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 hover:bg-accent rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 hover:bg-accent rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
