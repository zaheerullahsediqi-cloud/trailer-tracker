"use client";
import DataTable, { Column } from "../data-table";
import Link from "next/link";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  vin: string;
  renter: string;
  period: string;
  amount: number;
  sent_to: string;
  sent_at: string | null;
  rental_id: string | null;
};

export default function InvoicesTable({ rows }: { rows: InvoiceRow[] }) {
  const columns: Column<InvoiceRow>[] = [
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

  return <DataTable columns={columns} rows={rows} filename="invoices" />;
}
