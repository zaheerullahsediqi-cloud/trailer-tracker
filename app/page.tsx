import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import { daysUntil } from "@/lib/billing";
import Link from "next/link";
import RevenueChart from "./revenue-chart";
import {
  Truck,
  FileCheck,
  Wallet,
  AlertTriangle,
  Clock,
  FileText,
  CreditCard,
  Plus,
  ArrowRight,
} from "lucide-react";

export default async function Dashboard() {
  const supabase = createClient();

  const { rentals, trailers, payments, balances, today } = await loadBillingData(supabase);
  const list = rentals.filter((r: any) => r.status === "active");
  const actionable = list
    .map((r: any) => ({ ...r, next_due_date: balances.get(r.id)!.nextUnpaid }))
    .filter((r: any) => r.next_due_date);
  const overdue = actionable.filter((r: any) => balances.get(r.id)!.overdue > 0);
  const dueSoon = actionable.filter((r: any) => balances.get(r.id)!.overdue === 0 && balances.get(r.id)!.upcoming > 0);
  const monthPayments = payments.filter((p: any) => p.payment_date >= today.slice(0, 7) + "-01");
  const totalTrailers = trailers.filter((t: any) => t.status !== "sold").length;
  const activeRentalCount = list.length;
  const collectedThisMonth = monthPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const outstandingBalance = [...balances.values()].reduce((sum, b: any) => sum + b.outstanding, 0);
  const needsReviewCount = [...balances.values()].filter((b: any) => b.needsReview).length;

  const rentalByTrailer = new Map<string, any>();
  list.forEach((r: any) => rentalByTrailer.set(r.trailer_id, r));
  const yourTrailers = trailers
    .filter((t: any) => t.status !== "sold")
    .slice(0, 3)
    .map((t: any) => ({ ...t, rental: rentalByTrailer.get(t.id) }));

  const needsAttention = [
    ...overdue.map((r: any) => ({
      kind: "overdue" as const,
      rental: r,
      due: r.next_due_date,
      amount: balances.get(r.id)!.overdue,
    })),
    ...dueSoon.map((r: any) => ({
      kind: "due_soon" as const,
      rental: r,
      due: r.next_due_date,
      amount: balances.get(r.id)!.upcoming,
    })),
  ]
    .sort((a, b) => daysUntil(a.due) - daysUntil(b.due))
    .slice(0, 6);

  const recentPayments = [...payments]
    .sort((a: any, b: any) => b.payment_date.localeCompare(a.payment_date))
    .slice(0, 5);

  const recentActivity = [
    ...payments.map((p: any) => ({
      type: "payment" as const,
      date: p.payment_date,
      title: "Payment received",
      subtitle: `${p.rentals?.trailers?.vin ?? ""} · ${p.rentals?.renters?.name ?? ""}`,
      amount: Number(p.amount),
    })),
    ...list.map((r: any) => ({
      type: "rental" as const,
      date: r.start_date,
      title: "Rental started",
      subtitle: `${r.trailers?.vin ?? ""} · ${r.renters?.name ?? ""}`,
      amount: null as number | null,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const nowUtc = new Date();
  const months: { key: string; month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const y = nowUtc.getUTCFullYear();
    const m = nowUtc.getUTCMonth() - i;
    const d = new Date(Date.UTC(y, m, 1));
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      revenue: 0,
    });
  }
  payments.forEach((p: any) => {
    if (!p.payment_date) return;
    const d = new Date(p.payment_date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.revenue += parseFloat(p.amount) || 0;
  });

  const stats = [
    { label: "Current fleet", sub: "Trailers in your fleet", value: totalTrailers, icon: Truck },
    { label: "Active rentals", sub: "Trailers on rent", value: activeRentalCount, icon: FileCheck },
    {
      label: "Collected this month",
      sub: "Rental payments received",
      value: `$${collectedThisMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: Wallet,
    },
    {
      label: "Outstanding",
      sub: `Across ${overdue.length} overdue payment${overdue.length === 1 ? "" : "s"}`,
      value: `$${outstandingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title text-[28px]">Fleet overview</h1>
          <p className="text-sm text-muted mt-1">Your fleet, clearly organized.</p>
        </div>
        <Link href="/rentals" className="btn-primary">
          <Plus size={16} /> New rental
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-icon bg-accent/10 text-accent">
                <Icon size={18} strokeWidth={2} />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary dark:text-white tabular-nums">{s.value}</p>
                <p className="text-sm font-medium text-primary dark:text-slate-200 mt-1">{s.label}</p>
                <p className="text-xs text-muted mt-0.5">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <p className="section-title">Your trailers</p>
            <Link href="/trailers" className="text-sm text-accent font-medium flex items-center gap-1">
              View all trailers <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {yourTrailers.map((t: any) => (
              <div key={t.id} className="card overflow-hidden">
                {t.photo_url ? (
                  <img
                    src={supabase.storage.from("trailer-photos").getPublicUrl(t.photo_url).data.publicUrl}
                    alt={t.vin}
                    className="w-full aspect-[4/3] object-cover"
                  />
                ) : (
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Truck size={36} className="text-white/30" strokeWidth={1.5} />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-primary dark:text-white truncate">
                      {t.unit_number || t.vin.slice(-6)}
                    </p>
                    <span className={t.rental ? "badge-success" : "badge-neutral"}>
                      {t.rental ? "Rented" : "Available"}
                    </span>
                  </div>
                  {t.rental ? (
                    <div className="text-xs text-muted space-y-0.5">
                      <p>Renter: {t.rental.renters?.name}</p>
                      <p>Rental since: {t.rental.start_date}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted">No active rental</p>
                  )}
                  <Link href={`/trailers/${t.id}`} className="text-xs text-accent font-medium flex items-center gap-1 pt-1">
                    View trailer <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
            {yourTrailers.length === 0 && (
              <p className="text-sm text-muted sm:col-span-3">
                No trailers yet.{" "}
                <Link href="/trailers" className="text-accent underline">
                  Add one
                </Link>
                .
              </p>
            )}
          </div>
        </div>

        <div className="card p-5 space-y-1">
          <p className="section-title mb-3">Needs attention</p>
          {needsAttention.length === 0 && <p className="text-sm text-muted">Nothing needs attention right now.</p>}
          {needsAttention.map((item, i) => {
            const r = item.rental;
            const isOverdue = item.kind === "overdue";
            return (
              <Link
                key={i}
                href={`/rentals/${r.id}`}
                className="flex items-start gap-3 py-2.5 border-b border-border dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isOverdue ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"
                  }`}
                >
                  {isOverdue ? <AlertTriangle size={13} /> : <Clock size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary dark:text-white truncate">
                    {r.trailers?.vin ? `Trailer ${r.trailers.vin.slice(-6)}` : "Rental"}
                  </p>
                  <p className={`text-xs ${isOverdue ? "text-danger" : "text-warning"}`}>
                    {isOverdue ? "Payment overdue" : "Upcoming payment"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary dark:text-white">${item.amount.toFixed(0)}</p>
                  <p className="text-xs text-muted">{item.due}</p>
                </div>
              </Link>
            );
          })}
          {needsReviewCount > 0 && (
            <Link
              href="/history"
              className="flex items-center gap-1 text-xs text-accent font-medium pt-3 mt-2 border-t border-border dark:border-slate-800"
            >
              {needsReviewCount} historical record{needsReviewCount === 1 ? "" : "s"} to review
              <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>

      <div className="card p-5">
        <p className="section-title mb-1">Revenue Trend</p>
        <p className="text-xs text-muted mb-4">Payments received by month, last 6 months</p>
        <RevenueChart data={months} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Recent activity</p>
          </div>
          <div className="card divide-y divide-border dark:divide-slate-800 overflow-hidden">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    {a.type === "payment" ? <CreditCard size={14} /> : <FileText size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary dark:text-white">{a.title}</p>
                    <p className="text-xs text-muted truncate">{a.subtitle}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {a.amount != null && <p className="text-sm font-semibold text-success">+${a.amount.toFixed(0)}</p>}
                  <p className="text-xs text-muted">{a.date}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="text-sm text-muted px-5 py-4">No activity yet.</p>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Recent payments</p>
            <Link href="/payments" className="text-sm text-accent font-medium flex items-center gap-1">
              View all payments <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card overflow-hidden">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Trailer</th>
                  <th>Renter</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p: any) => (
                  <tr key={p.id}>
                    <td>{p.payment_date}</td>
                    <td className="plate">{p.rentals?.trailers?.vin?.slice(-6) ?? "—"}</td>
                    <td>{p.rentals?.renters?.name ?? "—"}</td>
                    <td>${Number(p.amount).toFixed(0)}</td>
                    <td>
                      <span className="badge-success">Paid</span>
                    </td>
                  </tr>
                ))}
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-6">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
