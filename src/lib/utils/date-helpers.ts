/**
 * Date helper utilities for quick ranges, comparison periods, and formatting.
 */

export interface DateRange {
  start: Date;
  end: Date;
}

type QuickRangeLabel = '近 7 天' | '近 30 天' | '近 90 天' | '本月' | '上月';

/**
 * Get a date range for a named quick-select label.
 */
export function getQuickRange(label: QuickRangeLabel): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (label) {
    case '近 7 天': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: today };
    }
    case '近 30 天': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: today };
    }
    case '近 90 天': {
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      return { start, end: today };
    }
    case '本月': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start, end: today };
    }
    case '上月': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start, end };
    }
  }
}

/**
 * Get the comparison (prior) period for a given date range.
 * The prior period has the same duration and ends the day before the start.
 */
export function getComparisonPeriod(start: Date, end: Date): DateRange {
  const durationMs = end.getTime() - start.getTime();
  const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));

  const priorEnd = new Date(start);
  priorEnd.setDate(priorEnd.getDate() - 1);

  const priorStart = new Date(priorEnd);
  priorStart.setDate(priorStart.getDate() - durationDays);

  return { start: priorStart, end: priorEnd };
}

/**
 * Calculate the percentage change (delta) between current and previous values.
 * Returns 0 if previous is 0 to avoid division by zero.
 */
export function calculateDelta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return (current - previous) / previous;
}

/**
 * Format a Date object as a YYYY-MM-DD string for API calls.
 */
export function formatDateForApi(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
