import { createClient } from "@/lib/supabase/server";
import PaymentsTable from "./payments-table";

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export default async function PaymentsPage() {
  const supabase = createClient();
  const { data: rentals } = await supabase
    .from("rentals")
    .select("*, trailers(vin), renters(name)")
    .eq("status", "active")
    .order("next_due_date", { ascending: true });

  const rows = (rentals ?? []).map((r: any) => {
    const d = daysUntil(r.next_due_date);
    const status = d < 0 ? "Overdue" : d <= 5 ? "Due Soon" : "Upcoming";
    return {
      id: r.id,
      vin: r.trailers?.vin || "—",
      renter: r.renters?.name || "—",
      rate: Number(r.rate),
      next_due_date: r.next_due_date,
      status: status as "Overdue" | "Due Soon" | "Upcoming",
      daysUntil: d,
    };
  });

  const totalDue = rows.reduce((sum, r) => sum + r.rate, 0);
  const overdueTotal = rows.filter((r) => r.status === "Overdue").reduce((sum, r) => sum + r.rate, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Billing</p>
        <h1 className="page-title mt-1">Payments</h1>
        <p className="text-sm text-muted mt-1">
          {rows.length} active rental{rows.length === 1 ? "" : "s"} — ${totalDue.toFixed(2)} total,{" "}
          <span className="text-danger font-medium">${overdueTotal.toFixed(2)} overdue</span>
        </p>
      </div>
      <PaymentsTable rows={rows} />
    </div>
  );
}
