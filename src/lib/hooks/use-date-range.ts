"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PresetKey = "7d" | "30d" | "90d" | "this_month" | "last_month";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getDefaultRange(): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 29);
  return { start: formatDate(start), end: formatDate(today) };
}

export function useDateRange() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaults = getDefaultRange();

  const startDate = searchParams.get("start") || defaults.start;
  const endDate = searchParams.get("end") || defaults.end;
  const preset = (searchParams.get("preset") as PresetKey | null) || "30d";

  const setDateRange = useCallback(
    (start: string, end: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("start", start);
      params.set("end", end);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const queryString = useMemo(
    () => `start=${startDate}&end=${endDate}`,
    [startDate, endDate]
  );

  return { startDate, endDate, setDateRange, preset, queryString };
}
