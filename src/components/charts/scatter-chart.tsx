"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

interface ScatterChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  xName?: string;
  yName?: string;
  height?: number;
  showTrendLine?: boolean;
}

function computeTrendLine(
  data: any[],
  xKey: string,
  yKey: string
): { slope: number; intercept: number; points: any[] } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0, points: [] };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const d of data) {
    const x = Number(d[xKey]);
    const y = Number(d[yKey]);
    if (isNaN(x) || isNaN(y)) continue;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const xValues = data.map((d) => Number(d[xKey])).filter((v) => !isNaN(v));
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);

  const points = [
    { [xKey]: minX, trendLine: slope * minX + intercept },
    { [xKey]: maxX, trendLine: slope * maxX + intercept },
  ];

  return { slope, intercept, points };
}

export function ScatterChart({
  data,
  xKey,
  yKey,
  xName,
  yName,
  height = 350,
  showTrendLine = false,
}: ScatterChartProps) {
  const trendData = useMemo(() => {
    if (!showTrendLine) return [];
    return computeTrendLine(data, xKey, yKey).points;
  }, [data, xKey, yKey, showTrendLine]);

  if (showTrendLine) {
    // Use ComposedChart for scatter + trend line
    return (
      <div className="w-full" style={{ fontFamily: "system-ui, sans-serif" }}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xKey}
              type="number"
              name={xName ?? xKey}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={
                xName
                  ? { value: xName, position: "insideBottom", offset: -5, fontSize: 12, fill: "#6b7280" }
                  : undefined
              }
            />
            <YAxis
              dataKey={yKey}
              type="number"
              name={yName ?? yKey}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={
                yName
                  ? { value: yName, angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }
                  : undefined
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: 12,
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Scatter data={data} fill={COLORS[0]} fillOpacity={0.7} r={4} />
            <Line
              data={trendData}
              type="linear"
              dataKey="trendLine"
              stroke={COLORS[3]}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ fontFamily: "system-ui, sans-serif" }}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            type="number"
            name={xName ?? xKey}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            label={
              xName
                ? { value: xName, position: "insideBottom", offset: -5, fontSize: 12, fill: "#6b7280" }
                : undefined
            }
          />
          <YAxis
            dataKey={yKey}
            type="number"
            name={yName ?? yKey}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            label={
              yName
                ? { value: yName, angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }
                : undefined
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: 12,
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            cursor={{ strokeDasharray: "3 3" }}
          />
          <Scatter data={data} fill={COLORS[0]} fillOpacity={0.7} r={4} />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
