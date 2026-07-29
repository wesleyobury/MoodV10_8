"use client";

import { useState, useEffect } from "react";
import { api, InsightsResponse, Insight } from "@/lib/api";
import { useFilters } from "@/lib/filter-context";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  X,
} from "lucide-react";

interface InsightsCardProps {
  className?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    iconColor: "text-red-500",
    label: "Critical",
  },
  warning: {
    icon: AlertCircle,
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30",
    iconColor: "text-yellow-500",
    label: "Warning",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-500",
    label: "Info",
  },
};

export function InsightsCard({ className }: InsightsCardProps) {
  const { filters } = useFilters();
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchInsights = async () => {
    setLoading(true);
    const res = await api.getInsights(filters.includeInternal);
    if (res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, [filters.includeInternal]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  const visibleInsights = data?.insights.filter((i) => !dismissedIds.has(i.id)) || [];

  if (loading) {
    return (
      <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Analyzing metrics...</span>
        </div>
      </div>
    );
  }

  if (!data || visibleInsights.length === 0) {
    return (
      <div className={cn("bg-card border border-border rounded-lg p-4", className)}>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium">All Good!</p>
            <p className="text-sm text-muted-foreground">No significant changes detected this week</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border border-border rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Automated Insights</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {data.critical_count > 0 && (
            <span className="px-2 py-0.5 bg-red-500/20 text-red-500 rounded">
              {data.critical_count} Critical
            </span>
          )}
          {data.warning_count > 0 && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded">
              {data.warning_count} Warning
            </span>
          )}
          {data.info_count > 0 && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded">
              {data.info_count} Info
            </span>
          )}
          <button
            onClick={fetchInsights}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="Refresh insights"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Insights Stack */}
      <div className="max-h-[400px] overflow-y-auto">
        {visibleInsights.map((insight) => {
          const config = SEVERITY_CONFIG[insight.severity];
          const Icon = config.icon;
          const isExpanded = expandedId === insight.id;

          return (
            <div
              key={insight.id}
              className={cn(
                "border-b border-border last:border-0 transition-colors",
                config.bgColor
              )}
            >
              <div
                className="group p-4 cursor-pointer hover:bg-accent/30"
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{insight.title}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(insight.id);
                        }}
                        className="p-1 hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{insight.description}</p>
                    
                    {/* Metric Change */}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        {insight.change_percent >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={insight.change_percent >= 0 ? "text-green-500" : "text-red-500"}>
                          {insight.change_percent > 0 ? "+" : ""}{insight.change_percent}%
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {insight.previous_value} → {insight.current_value}
                      </span>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform ml-auto",
                        isExpanded && "rotate-90"
                      )} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && insight.recommendation && (
                <div className="px-4 pb-4 pt-0">
                  <div className="ml-8 p-3 bg-background/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-1">Recommendation</p>
                    <p className="text-sm">{insight.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground">
        {data.comparison_period} • Updated {new Date(data.generated_at).toLocaleTimeString()}
      </div>
    </div>
  );
}
