import { addDays, addMonths } from './date';
export const todayISO = () => new Date().toISOString().slice(0, 10);
export function daysUntil(date: string, today = todayISO()) {
  return Math.round((Date.parse(date + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
}
export function monthlyEquivalent(r: any): number {
  const rate = Number(r.rate);
  if (r.period === 'monthly') return rate;
  if (r.period === 'annual') return rate / 12;
  if (r.period === 'semiannual') return rate / 6;
  return rate * 365 / (12 * (r.period === 'weekly' ? 7 : Number(r.period_days)));
}
export function dueAt(r: any, index: number): string {
  const months = ({monthly: 1, semiannual: 6, annual: 12} as Record<string, number>)[r.period];
  return months ? addMonths(r.start_date, months * index) : addDays(r.start_date, index * (r.period === 'weekly' ? 7 : Number(r.period_days)));
}
export function nextInvoiceDate(r: any): string {
  for (let i = 1; i <= 100000; i++) { const date = dueAt(r, i); if (date > r.next_due_date) return date; }
  throw new Error('Invalid invoice schedule');
}
function invoiceScheduleDate(r: any, date: string): string {
  const months = ({monthly:1,semiannual:6,annual:12} as Record<string,number>)[r.period];
  const [y,m] = date.split('-').map(Number), [sy,sm] = r.start_date.split('-').map(Number);
  const index = months ? Math.round(((y-sy)*12+m-sm)/months) : Math.round(daysUntil(date,r.start_date)/(r.period === 'weekly' ? 7 : r.period_days));
  return dueAt(r, Math.max(1,index));
}
// Rent is due after the first billing period. Payments apply oldest-first;
// deposits and down payments are tracked separately and are not rent payments.
export function rentalBalance(r: any, payments: any[] = [], invoices: any[] = [], today = todayISO()) {
  const horizon = addDays(today, 5);
  const charges = new Map<string, number>();
  const needsReview = r.status !== 'active' && !r.end_date;
  const end = r.status === 'active' ? horizon : r.end_date;
  if (!Number.isFinite(Number(r.rate)) || Number(r.rate) < 0 || !Number.isInteger(Number(r.period_days)) || Number(r.period_days) <= 0) throw new Error('Invalid rental billing terms');
  for (let i = 1; !needsReview; i++) {
    const due = dueAt(r, i);
    if (due > horizon || (r.status !== 'active' && due > end)) break;
    if (i > 100000) throw new Error('Rental schedule is too long');
    charges.set(due, Math.round(Number(r.rate) * 100));
  }
  // An invoice snapshots the agreed charge; repeated legacy emails are not new charges.
  for (const inv of [...invoices].sort((a,b) => String(a.created_at).localeCompare(String(b.created_at)))) {
    if (inv.rental_id === r.id) {
      const due = invoiceScheduleDate(r, inv.period_start);
      if (due <= horizon) charges.set(due, Math.round(Number(inv.amount) * 100));
    }
  }
  let credit = payments.filter(p => p.rental_id === r.id && p.payment_date <= today).reduce((n,p) => n + Math.round(Number(p.amount) * 100), 0);
  let outstanding = 0, overdue = 0, upcoming = 0;
  let nextUnpaid: string | null = null;
  for (const [due, amount] of [...charges].sort(([a],[b]) => a.localeCompare(b))) {
    const applied = Math.min(credit, amount); credit -= applied;
    const remaining = amount - applied;
    if (remaining > 0 && !nextUnpaid) nextUnpaid = due;
    if (due <= today) outstanding += remaining;
    if (due < today) overdue += remaining;
    if (due >= today) upcoming += remaining;
  }
  let nextScheduled: string | null = null;
  if (r.status === 'active' && Number(r.rate) > 0) {
    let futureCredit = credit;
    for (let i = 1; i <= 100000; i++) {
      const due = dueAt(r, i);
      if (due <= horizon) continue;
      const amount = Math.round(Number(r.rate) * 100);
      if (futureCredit < amount) { nextScheduled = due; break; }
      futureCredit -= amount;
    }
  }
  return { needsReview, nextScheduled, outstanding: outstanding / 100, overdue: overdue / 100, upcoming: upcoming / 100, nextUnpaid, credit: credit / 100 };
}
