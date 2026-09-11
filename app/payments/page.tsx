import BillingReviewNotice from "@/app/billing-review-notice";
import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import { daysUntil } from "@/lib/billing";
import PaymentsTable from "./payments-table";
import PaymentHistoryTable from "./payment-history-table";


export default async function PaymentsPage() {
  const supabase = createClient();
  const { rentals, payments: paymentRows, balances } = await loadBillingData(supabase);
  const rows = rentals.filter(r => r.status === 'active' && balances.get(r.id)!.nextUnpaid).map((r: any) => {
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

  const totalDue = rows.reduce((sum, r) => sum + r.rate, 0);
  const overdueTotal = [...balances.values()].reduce((sum, b) => sum + b.overdue, 0);

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

  return (
    <div className="space-y-6">
      <BillingReviewNotice count={[...balances.values()].filter(b => b.needsReview).length} />
      <div>
        <p className="eyebrow">Billing</p>
        <h1 className="page-title mt-1">Payments</h1>
        <p className="text-sm text-muted mt-1">
          {rows.length} rental with a balance{rows.length === 1 ? "" : "s"} — ${totalDue.toFixed(2)} total,{" "}
          <span className="text-danger font-medium">${overdueTotal.toFixed(2)} overdue</span>
        </p>
      </div>
      <PaymentsTable rows={rows} />

      <div>
        <p className="section-title mb-1">Payment History</p>
        <p className="text-sm text-muted mb-3">${totalCollected.toFixed(2)} collected all-time, across {historyRows.length} payment{historyRows.length === 1 ? "" : "s"}.</p>
        <PaymentHistoryTable rows={historyRows} />
      </div>
    </div>
  );
}