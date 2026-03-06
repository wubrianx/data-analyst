"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateFilterProps {
  onChange: (start: string, end: string) => void;
}

type PresetKey = "7d" | "30d" | "90d" | "this_month" | "last_month";

const presets: { key: PresetKey; label: string }[] = [
  { key: "7d", label: "\u8FD1 7 \u5929" },
  { key: "30d", label: "\u8FD1 30 \u5929" },
  { key: "90d", label: "\u8FD1 90 \u5929" },
  { key: "this_month", label: "\u672C\u6708" },
  { key: "last_month", label: "\u4E0A\u6708" },
];

function getPresetRange(key: PresetKey): { start: string; end: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (key) {
    case "7d": {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start: fmt(start), end: fmt(today) };
    }
    case "30d": {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return { start: fmt(start), end: fmt(today) };
    }
    case "90d": {
      const start = new Date(today);
      start.setDate(today.getDate() - 89);
      return { start: fmt(start), end: fmt(today) };
    }
    case "this_month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: fmt(start), end: fmt(today) };
    }
    case "last_month": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: fmt(start), end: fmt(end) };
    }
  }
}

export function DateFilter({ onChange }: DateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPreset = searchParams.get("preset") as PresetKey | null;
  const currentStart = searchParams.get("start") || "";
  const currentEnd = searchParams.get("end") || "";

  const [customStart, setCustomStart] = useState(currentStart);
  const [customEnd, setCustomEnd] = useState(currentEnd);

  const updateParams = useCallback(
    (start: string, end: string, preset?: PresetKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("start", start);
      params.set("end", end);
      if (preset) {
        params.set("preset", preset);
      } else {
        params.delete("preset");
      }
      router.push(`?${params.toString()}`, { scroll: false });
      onChange(start, end);
    },
    [router, searchParams, onChange]
  );

  const handlePresetClick = (key: PresetKey) => {
    const { start, end } = getPresetRange(key);
    setCustomStart(start);
    setCustomEnd(end);
    updateParams(start, end, key);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      updateParams(customStart, customEnd);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(({ key, label }) => (
        <Button
          key={key}
          variant={currentPreset === key ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(key)}
          className={cn(
            currentPreset === key && "pointer-events-none"
          )}
        >
          {label}
        </Button>
      ))}
      <div className="flex items-center gap-1.5 ml-2">
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        />
        <span className="text-muted-foreground text-sm">&ndash;</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm"
        />
        <Button size="sm" variant="outline" onClick={handleCustomApply}>
          {"\u5957\u7528"}
        </Button>
      </div>
    </div>
  );
}
