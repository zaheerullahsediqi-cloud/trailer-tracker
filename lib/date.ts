// Timezone-safe date math. Using `new Date(dateStr)` + local getDate/setDate
// mixes a UTC-parsed instant with local-timezone methods, which silently
// shifts the result by a day depending on the server's timezone offset.
// Working entirely in UTC avoids that.

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}
