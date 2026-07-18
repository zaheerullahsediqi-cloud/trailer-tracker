"use client";
import DataTable, { Column } from "../data-table";
import Link from "next/link";

type PaymentHistoryRow = {
  id: string;
  vin: string;
  renter: string;
  amount: number;
  payment_date: string;
  method: string;
  notes: string | null;
  rental_id: string;
};

const methodLabels: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  zelle: "Zelle",
  ach: "ACH / Bank Transfer",
  card: "Card",
  other: "Other",
};

export default function PaymentHistoryTable({ rows }: { rows: PaymentHistoryRow[] }) {
  const columns: Column<PaymentHistoryRow>[] = [
    { key: "vin", label: "VIN", render: (r) => <span className="plate">{r.vin}</span> },
    { key: "renter", label: "Customer" },
    {
      key: "amount",
      label: "Amount",
      render: (r) => `$${r.amount.toFixed(2)}`,
      sortValue: (r) => r.amount,
    },
    { key: "payment_date", label: "Date" },
    { key: "method", label: "Method", render: (r) => methodLabels[r.method] || r.method },
    { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
    {
      key: "view",
      label: "",
      render: (r) => (
        <Link href={`/rentals/${r.rental_id}`} className="text-accent text-xs font-medium">
          View →
        </Link>
      ),
    },
  ];

  return <DataTable columns={columns} rows={rows} filename="payment-history" />;
}
