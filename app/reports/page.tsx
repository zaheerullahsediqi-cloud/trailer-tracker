import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import RevenueChart from "../revenue-chart";
import { OccupancyPie, CollectionsPie, UtilizationBar, PaymentHistoryArea } from "./reports-charts";

export default async function ReportsPage() {
  const supabase = createClient();
  const { trailers, rentals, payments, balances } = await loadBillingData(supabase);
  const activeRentals = rentals.filter(r => r.status === 'active');
  const totalTrailers = trailers?.length ?? 0;
  const rentedTrailerIds = new Set((activeRentals ?? []).map((r: any) => r.trailer_id));
  const availableCount = trailers.filter(t => t.status === "available" && !rentedTrailerIds.has(t.id)).length;

  const overdueTotal = [...balances.values()].reduce((n,b) => n + b.outstanding, 0);
  const collectedTotal = payments.reduce((n,p) => n + Number(p.amount), 0);
  const revenueByVin = new Map<string, number>();
  payments.forEach((inv: any) => {
    const vin = inv.rentals?.trailers?.vin;
    if (!vin) return;
    revenueByVin.set(vin, (revenueByVin.get(vin) || 0) + (parseFloat(inv.amount) || 0));
  });
  const utilizationData = Array.from(revenueByVin.entries())
    .map(([vin, revenue]) => ({ vin, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const nowUtc = new Date();
  const months: { key: string; month: string; revenue: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const y = nowUtc.getUTCFullYear();
    const m = nowUtc.getUTCMonth() - i;
    const d = new Date(Date.UTC(y, m, 1));
    months.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      revenue: 0,
      count: 0,
    });
  }
  payments.forEach((inv: any) => {
    if (!inv.payment_date) return;
    const d = new Date(inv.payment_date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) {
      bucket.revenue += parseFloat(inv.amount) || 0;
      bucket.count += 1;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Analytics</p>
        <h1 className="page-title mt-1">Reports</h1>
      </div>

      <div className="card p-5">
        <p className="section-title mb-4">Payments Received</p>
        <RevenueChart data={months} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="section-title mb-2">Occupancy</p>
          <OccupancyPie rented={rentedTrailerIds.size} available={availableCount} unavailable={Math.max(totalTrailers - rentedTrailerIds.size - availableCount, 0)} />
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">Collections</p>
          <CollectionsPie collected={collectedTotal} outstanding={overdueTotal} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="section-title mb-2">Payments by trailer (top 8)</p>
          {utilizationData.length > 0 ? (
            <UtilizationBar data={utilizationData} />
          ) : (
            <p className="text-sm text-muted py-8 text-center">No revenue data yet.</p>
          )}
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">Payment History (payments received per month)</p>
          <PaymentHistoryArea data={months} />
        </div>
      </div>
    </div>
  );
}
