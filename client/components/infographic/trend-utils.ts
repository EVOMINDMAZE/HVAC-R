export function getTrendDirection(current: number, previous: number): "up" | "down" | "neutral" {
  const diff = current - previous;
  const threshold = previous * 0.01;
  if (diff > threshold) return "up";
  if (diff < -threshold) return "down";
  return "neutral";
}

export function formatTrendValue(current: number, previous: number): string {
  if (previous === 0) return "N/A";
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}