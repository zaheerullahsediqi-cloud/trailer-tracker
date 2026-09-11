import BillingReviewNotice from "@/app/billing-review-notice";
import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import { daysUntil } from "@/lib/billing";
import ToggleForm from "../toggle-form";
import RecordPaymentForm from "./record-payment-form";
import PaymentsTable from "./payments-table";
import PaymentFilters from "./payment-filters";
import { Wallet, Clock } from "lucide-react";

export default async function PaymentsPage() {
  const supabase = createClient();
  const { rentals, payments: paymentRows, balances, today } = await loadBillingData(supabase);
  const rows = rentals.filter((r) => r.status === "active" && balances.get(r.id)!.nextUnpaid).map((r: any) => {
    const balance = balances.get(r.id)!;
    const d = daysUntil(balance.nextUnpaid!);
    const status = d < 0 ? "Overdue" : d <= 5 ? "Due Soon" : "Upcoming";
    return {
      id: r.id,
      vin: r.trailers?.vin || "—",
      renter: r.renters?.name || "—",
      rate: balance.outstanding + (d > 0 ? balance.upcoming : 0),
      next_due_date: balance.nextUnpaid!,
      status: status as "Overdue" | "Due Soon" | "Upcoming",
      daysUntil: d,
    };
  });

  const overdueTotal = [...balances.values()].reduce((sum, b) => sum + b.overdue, 0);
  const openInvoiceCount = rows.length;

  const monthPayments = paymentRows.filter((p: any) => p.payment_date >= today.slice(0, 7) + "-01");
  const collectedThisMonth = monthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const historyRows = (paymentRows ?? []).map((p: any) => ({
    id: p.id,
    vin: p.rentals?.trailers?.vin || "—",
    renter: p.rentals?.renters?.name || "—",
    amount: Number(p.amount),
    payment_date: p.payment_date,
    method: p.method,
    notes: p.notes,
    rental_id: p.rentals?.id,
  }));
  const totalCollected = historyRows.reduce((sum, r) => sum + r.amount, 0);

  const activeRentalOptions = rentals
    .filter((r: any) => r.status === "active")
    .map((r: any) => ({ id: r.id, label: `${r.trailers?.vin ?? "Trailer"} — ${r.renters?.name ?? "Renter"}` }));

  return (
    <div className="space-y-6">
      <BillingReviewNotice count={[...balances.values()].filter((b) => b.needsReview).length} />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title text-[28px]">Payments</h1>
          <p className="text-sm text-muted mt-1">Track and manage all customer payments for your trailer rentals.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        <div className="stat-card">
          <div className="stat-icon bg-success/10 text-success">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary dark:text-white tabular-nums">${collectedThisMonth.toFixed(0)}</p>
            <p className="text-sm font-medium text-primary dark:text-slate-200 mt-1">Collected This Month</p>
            <p className="text-xs text-muted mt-0.5">{monthPayments.length} payments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-danger/10 text-danger">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary dark:text-white tabular-nums">${overdueTotal.toFixed(0)}</p>
            <p className="text-sm font-medium text-primary dark:text-slate-200 mt-1">Outstanding</p>
            <p className="text-xs text-muted mt-0.5">{openInvoiceCount} open balances</p>
          </div>
        </div>
        <div className="lg:flex lg:items-center">
          <ToggleForm label="Record Payment">
            <RecordPaymentForm rentals={activeRentalOptions} />
          </ToggleForm>
        </div>
      </div>

      <div>
        <p className="section-title mb-1">Open Balances</p>
        <p className="text-sm text-muted mb-3">
          {rows.length} active rental{rows.length === 1 ? "" : "s"} with a balance due.
        </p>
        <PaymentsTable rows={rows} />
      </div>

      <div>
        <p className="section-title mb-1">Payment History</p>
        <p className="text-sm text-muted mb-3">
          ${totalCollected.toFixed(2)} collected all-time, across {historyRows.length} payment{historyRows.length === 1 ? "" : "s"}.
        </p>
        <PaymentFilters rows={historyRows} />
      </div>
    </div>
  );
}
