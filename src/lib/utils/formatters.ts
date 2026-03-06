/**
 * Formatting utility functions for display values.
 */

/**
 * Format a number with thousands separators.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format a number as NT$ currency with thousands separators.
 */
export function formatCurrency(n: number): string {
  const rounded = Math.round(n);
  return `NT$ ${rounded.toLocaleString('en-US')}`;
}

/**
 * Format a number as a percentage string.
 */
export function formatPercentage(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

/**
 * Format a delta value with a leading + or - sign.
 */
export function formatDelta(n: number): string {
  const value = (n * 100).toFixed(1);
  if (n >= 0) {
    return `+${value}%`;
  }
  return `${value}%`;
}

/**
 * Format a duration in seconds to "Xm Ys" format.
 */
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
