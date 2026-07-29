"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MousePointer2 } from "lucide-react";

interface ChartData {
  name: string;
  value: number;
  previousValue?: number;
  [key: string]: string | number | undefined;
}

interface TimeSeriesChartProps {
  data: ChartData[];
  title: string;
  type?: "line" | "area" | "bar";
  showPrevious?: boolean;
  color?: string;
  height?: number;
  // Drilldown support
  metric?: string;
  onChartClick?: (metric: string, dateLabel: string) => void;
  /** Clamp the y-axis (e.g. [0, 100] for percentage series). */
  yDomain?: [number, number];
}

export function TimeSeriesChart({
  data,
  title,
  type = "area",
  showPrevious = false,
  color = "hsl(var(--chart-1))",
  height = 300,
  metric,
  onChartClick,
  yDomain,
}: TimeSeriesChartProps) {
  const isClickable = !!metric && !!onChartClick;

  const chartData = data;

  // Determine effective chart type and comparison mode
  const effectiveType = type;
  const effectiveShowPrevious = showPrevious;

  const handleClick = (chartData: { activeLabel?: string }) => {
    if (isClickable && chartData?.activeLabel && metric) {
      onChartClick(metric, chartData.activeLabel);
    }
  };

  const commonProps = {
    data: chartData,
    margin: { top: 10, right: 10, left: 0, bottom: 0 },
    onClick: isClickable ? handleClick : undefined,
    style: isClickable ? { cursor: "pointer" } : undefined,
  };

  const renderChart = () => {
    switch (effectiveType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              domain={yDomain}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              name="Current"
              activeDot={isClickable ? { r: 6, strokeWidth: 2 } : undefined}
            />
            {effectiveShowPrevious && (
              <Line
                type="monotone"
                dataKey="previousValue"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Previous"
              />
            )}
            {effectiveShowPrevious && <Legend />}
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              domain={yDomain}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar 
              dataKey="value" 
              fill={color} 
              radius={[4, 4, 0, 0]} 
              name="Current"
              className={isClickable ? "cursor-pointer" : ""}
            />
            {effectiveShowPrevious && (
              <Bar
                dataKey="previousValue"
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
                name="Previous"
              />
            )}
            {effectiveShowPrevious && <Legend />}
          </BarChart>
        );
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`colorValue-${metric || 'default'}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              domain={yDomain}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#colorValue-${metric || 'default'})`}
              name="Current"
              activeDot={isClickable ? { r: 6, strokeWidth: 2 } : undefined}
            />
            {effectiveShowPrevious && (
              <Line
                type="monotone"
                dataKey="previousValue"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Previous"
              />
            )}
            {effectiveShowPrevious && <Legend />}
          </AreaChart>
        );
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${isClickable ? 'hover:border-primary/50 transition-colors' : ''}`}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {isClickable && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MousePointer2 className="h-3 w-3" />
              Click to drill down
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
