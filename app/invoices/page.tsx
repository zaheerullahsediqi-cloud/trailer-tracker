import { createClient } from "@/lib/supabase/server";
import InvoicesTable from "./invoices-table";

export default async function InvoicesPage() {
  const supabase = createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, rentals(id, trailers(vin), renters(name))")
    .order("sent_at", { ascending: false });

  const rows = (invoices ?? []).map((inv: any) => ({
    id: inv.id,
    invoice_number: inv.invoice_number || "—",
    vin: inv.rentals?.trailers?.vin || "—",
    renter: inv.rentals?.renters?.name || "—",
    period: `${inv.period_start} → ${inv.period_end}`,
    amount: Number(inv.amount),
    sent_to: inv.sent_to,
    sent_at: inv.sent_at,
    rental_id: inv.rentals?.id ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Billing</p>
        <h1 className="page-title mt-1">Invoices</h1>
        <p className="text-sm text-muted mt-1">Every invoice sent, across all rentals.</p>
      </div>
      <InvoicesTable rows={rows} />
    </div>
  );
}
