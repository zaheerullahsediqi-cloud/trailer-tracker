export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const totalMonths = (m - 1) + months;
  const targetYear = y + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const targetDay = Math.min(d, daysInTargetMonth);
  return new Date(Date.UTC(targetYear, targetMonth, targetDay)).toISOString().slice(0, 10);
}

export function advanceByPeriod(dateStr: string, period: string, periodDays: number): string {
  if (period === "monthly") return addMonths(dateStr, 1);
  if (period === "weekly") return addDays(dateStr, 7);
  if (period === "semiannual") return addMonths(dateStr, 6);
  if (period === "annual") return addMonths(dateStr, 12);
  return addDays(dateStr, periodDays);
}

export function periodLabel(period: string, periodDays?: number): string {
  switch (period) {
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "semiannual":
      return "Every 6 months";
    case "annual":
      return "Yearly";
    case "custom":
      return periodDays ? `Every ${periodDays} days` : "Custom";
    default:
      return period;
  }
}
