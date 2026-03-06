"use client";

import { useMemo } from "react";
import { Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface HeatmapDataItem {
  x: string;
  y: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapDataItem[];
  xLabels: string[];
  yLabels: string[];
  height?: number;
  colorRange?: [string, string];
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function interpolateColor(low: string, high: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(low);
  const [r2, g2, b2] = hexToRgb(high);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export function HeatmapChart({
  data,
  xLabels,
  yLabels,
  height = 300,
  colorRange = ["#e0e7ff", "#6366f1"],
}: HeatmapChartProps) {
  const { valueMap, minVal, maxVal } = useMemo(() => {
    const map = new Map<string, number>();
    let min = Infinity;
    let max = -Infinity;
    for (const d of data) {
      const key = `${d.x}__${d.y}`;
      map.set(key, d.value);
      if (d.value < min) min = d.value;
      if (d.value > max) max = d.value;
    }
    return { valueMap: map, minVal: min, maxVal: max };
  }, [data]);

  const range = maxVal - minVal || 1;
  const cellHeight = Math.max(
    28,
    Math.floor((height - 40) / yLabels.length)
  );
  const computedHeight = yLabels.length * cellHeight + 40;

  return (
    <div
      className="w-full overflow-x-auto"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div style={{ minHeight: height }}>
        {/* X-axis labels */}
        <div className="flex" style={{ paddingLeft: 100 }}>
          {xLabels.map((label) => (
            <div
              key={label}
              className="flex-1 text-center text-xs text-gray-500 truncate px-0.5"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {yLabels.map((yLabel) => (
          <div key={yLabel} className="flex items-center" style={{ height: cellHeight }}>
            {/* Y-axis label */}
            <div
              className="text-xs text-gray-500 text-right pr-2 truncate shrink-0"
              style={{ width: 100 }}
            >
              {yLabel}
            </div>

            {/* Cells */}
            {xLabels.map((xLabel) => {
              const key = `${xLabel}__${yLabel}`;
              const value = valueMap.get(key) ?? 0;
              const t = (value - minVal) / range;
              const bgColor = interpolateColor(colorRange[0], colorRange[1], t);

              return (
                <div
                  key={key}
                  className="flex-1 flex items-center justify-center text-xs font-medium mx-0.5 rounded cursor-default transition-transform hover:scale-105"
                  style={{
                    backgroundColor: bgColor,
                    height: cellHeight - 4,
                    color: t > 0.6 ? "#fff" : "#374151",
                  }}
                  title={`${xLabel}, ${yLabel}: ${value}`}
                >
                  {value}
                </div>
              );
            })}
          </div>
        ))}

        {/* Color legend */}
        <div className="flex items-center justify-end gap-2 mt-3 pr-2">
          <span className="text-xs text-gray-500">{minVal}</span>
          <div
            className="h-3 w-24 rounded"
            style={{
              background: `linear-gradient(to right, ${colorRange[0]}, ${colorRange[1]})`,
            }}
          />
          <span className="text-xs text-gray-500">{maxVal}</span>
        </div>
      </div>
    </div>
  );
}
