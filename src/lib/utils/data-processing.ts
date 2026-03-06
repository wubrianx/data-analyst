/**
 * Data processing types and utility functions for merging and analyzing
 * GA4 and Meta advertising data.
 */

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  sessions?: number;
  activeUsers?: number;
  bounceRate?: number;
  engagementRate?: number;
  conversions?: number;
  revenue?: number;
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
}

const WEEKDAY_LABELS_ZH: Record<number, string> = {
  0: '日',
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
};

export interface DailyMetricWithWeekday extends DailyMetric {
  weekday: number;
  weekdayLabel: string;
}

/**
 * Outer-join GA4 daily data and Meta daily data on the date field.
 * All dates present in either dataset will appear in the result.
 */
export function mergeGaMetaDaily(
  gaData: DailyMetric[],
  metaData: DailyMetric[]
): DailyMetric[] {
  const map = new Map<string, DailyMetric>();

  for (const row of gaData) {
    map.set(row.date, { ...row });
  }

  for (const row of metaData) {
    const existing = map.get(row.date);
    if (existing) {
      map.set(row.date, { ...existing, ...row });
    } else {
      map.set(row.date, { ...row });
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) => a.date.localeCompare(b.date));
  return result;
}

/**
 * Calculate the Pearson correlation coefficient between two arrays.
 * Returns 0 if the arrays have fewer than 2 elements or zero variance.
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Add weekday number (0=Sunday) and Chinese day label to each row.
 */
export function addWeekday(data: DailyMetric[]): DailyMetricWithWeekday[] {
  return data.map((row) => {
    const d = new Date(row.date + 'T00:00:00');
    const weekday = d.getDay();
    return {
      ...row,
      weekday,
      weekdayLabel: WEEKDAY_LABELS_ZH[weekday],
    };
  });
}
