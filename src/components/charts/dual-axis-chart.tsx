"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
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

interface LineConfig {
  key: string;
  name: string;
  color?: string;
}

interface DualAxisChartProps {
  data: any[];
  xKey: string;
  leftLine: LineConfig;
  rightLine: LineConfig;
  height?: number;
}

export function DualAxisChart({
  data,
  xKey,
  leftLine,
  rightLine,
  height = 350,
}: DualAxisChartProps) {
  const leftColor = leftLine.color ?? COLORS[0];
  const rightColor = rightLine.color ?? COLORS[1];

  return (
    <div className="w-full" style={{ fontFamily: "system-ui, sans-serif" }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: leftColor }}
            tickLine={false}
            axisLine={{ stroke: leftColor }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: rightColor }}
            tickLine={false}
            axisLine={{ stroke: rightColor }}
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
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey={leftLine.key}
            name={leftLine.name}
            stroke={leftColor}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={rightLine.key}
            name={rightLine.name}
            stroke={rightColor}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
