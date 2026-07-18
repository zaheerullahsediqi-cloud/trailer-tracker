// Timezone-safe date math. Using `new Date(dateStr)` + local getDate/setDate
// mixes a UTC-parsed instant with local-timezone methods, which silently
// shifts the result by a day depending on the server's timezone offset.
// Working entirely in UTC avoids that.

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

// Adds real calendar months (not a fixed day count), so "monthly" billing
// lands on the same day next month (e.g. Apr 15 -> May 15 -> Jun 15)
// instead of drifting earlier every time a 31-day month is crossed.
// Clamps to the last day of the target month when the start day doesn't exist
// there (e.g. Jan 31 + 1 month -> Feb 28/29).
export function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const totalMonths = (m - 1) + months;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(d, daysInTargetMonth);
  return new Date(Date.UTC(targetYear, targetMonth, targetDay)).toISOString().slice(0, 10);
}

// Advances a date by one billing cycle, using calendar-accurate math for
// monthly/weekly periods and a literal day count only for custom periods.
export function advanceByPeriod(dateStr: string, period: string, periodDays: number): string {
  if (period === "monthly") return addMonths(dateStr, 1);
  if (period === "weekly") return addDays(dateStr, 7);
  return addDays(dateStr, periodDays);
}
