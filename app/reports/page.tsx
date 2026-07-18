import { createClient } from "@/lib/supabase/server";
import RevenueChart from "../revenue-chart";
import { OccupancyPie, CollectionsPie, UtilizationBar, PaymentHistoryArea } from "./reports-charts";

export default async function ReportsPage() {
  const supabase = createClient();
  const [{ data: trailers }, { data: activeRentals }, { data: invoices }, { data: allRentals }] =
    await Promise.all([
      supabase.from("trailers").select("id, vin"),
      supabase.from("rentals").select("*, trailers(vin)").eq("status", "active"),
      supabase.from("invoices").select("amount, sent_at, rentals(trailers(vin))").order("sent_at"),
      supabase.from("rentals").select("rate, trailers(vin)"),
    ]);

  const totalTrailers = trailers?.length ?? 0;
  const rentedTrailerIds = new Set((activeRentals ?? []).map((r: any) => r.trailer_id));
  const availableCount = Math.max(totalTrailers - rentedTrailerIds.size, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTotal = (activeRentals ?? [])
    .filter((r: any) => new Date(r.next_due_date) < today)
    .reduce((sum: number, r: any) => sum + Number(r.rate || 0), 0);
  const collectedTotal = (invoices ?? []).reduce((sum: number, i: any) => sum + (parseFloat(i.amount) || 0), 0);

  // Revenue by trailer (top 8, by invoiced amount; falls back to rate if no invoices yet)
  const revenueByVin = new Map<string, number>();
  (invoices ?? []).forEach((inv: any) => {
    const vin = inv.rentals?.trailers?.vin;
    if (!vin) return;
    revenueByVin.set(vin, (revenueByVin.get(vin) || 0) + (parseFloat(inv.amount) || 0));
  });
  if (revenueByVin.size === 0) {
    (allRentals ?? []).forEach((r: any) => {
      const vin = r.trailers?.vin;
      if (!vin) return;
      revenueByVin.set(vin, (revenueByVin.get(vin) || 0) + Number(r.rate || 0));
    });
  }
  const utilizationData = Array.from(revenueByVin.entries())
    .map(([vin, revenue]) => ({ vin, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Revenue trend + payment history, same month buckets
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
  (invoices ?? []).forEach((inv: any) => {
    if (!inv.sent_at) return;
    const d = new Date(inv.sent_at);
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
        <p className="section-title mb-4">Revenue Trend</p>
        <RevenueChart data={months} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="section-title mb-2">Occupancy</p>
          <OccupancyPie rented={rentedTrailerIds.size} available={availableCount} />
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">Collections</p>
          <CollectionsPie collected={collectedTotal} outstanding={overdueTotal} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="section-title mb-2">Trailer Utilization (top 8 by revenue)</p>
          {utilizationData.length > 0 ? (
            <UtilizationBar data={utilizationData} />
          ) : (
            <p className="text-sm text-muted py-8 text-center">No revenue data yet.</p>
          )}
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">Payment History (invoices sent per month)</p>
          <PaymentHistoryArea data={months} />
        </div>
      </div>
    </div>
  );
}
