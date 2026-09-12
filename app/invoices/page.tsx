import { createClient } from "@/lib/supabase/server";
import InvoicesTable from "./invoices-table";
import Link from "next/link";
import { Plus } from "lucide-react";

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
    created_at: inv.created_at,
    due_date: inv.period_start,
    delivery_status: inv.delivery_status,
    rental_id: inv.rentals?.id ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title text-[28px]">Invoices</h1>
          <p className="text-sm text-muted mt-1">View and manage all trailer rental invoices.</p>
        </div>
        <Link href="/rentals" className="btn-primary">
          <Plus size={16} /> Create Invoice
        </Link>
      </div>
      <InvoicesTable rows={rows} />
    </div>
  );
}
