import { createClient } from "@/lib/supabase/server";
import DataTable, { Column } from "../data-table";
import Link from "next/link";

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
    rental_id: inv.rentals?.id,
  }));

  const columns: Column<(typeof rows)[number]>[] = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "vin", label: "VIN" },
    { key: "renter", label: "Customer" },
    { key: "period", label: "Period" },
    {
      key: "amount",
      label: "Amount",
      render: (r) => `$${r.amount.toFixed(2)}`,
      sortValue: (r) => r.amount,
    },
    { key: "sent_to", label: "Sent To" },
    {
      key: "sent_at",
      label: "Sent",
      render: (r) => (r.sent_at ? new Date(r.sent_at).toLocaleDateString() : "—"),
      sortValue: (r) => r.sent_at || "",
    },
    {
      key: "view",
      label: "",
      render: (r) =>
        r.rental_id ? (
          <Link href={`/rentals/${r.rental_id}`} className="text-accent text-xs font-medium">
            View rental →
          </Link>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Billing</p>
        <h1 className="page-title mt-1">Invoices</h1>
        <p className="text-sm text-muted mt-1">Every invoice sent, across all rentals.</p>
      </div>
      <DataTable columns={columns} rows={rows} filename="invoices" />
    </div>
  );
}
