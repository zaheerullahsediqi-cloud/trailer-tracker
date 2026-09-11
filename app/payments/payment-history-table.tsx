"use client";
import DataTable, { Column } from "../data-table";
import Link from "next/link";
import { CreditCard, Banknote, Landmark, Smartphone, FileQuestion } from "lucide-react";

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
const methodIcons: Record<string, any> = {
  cash: Banknote,
  check: FileQuestion,
  zelle: Smartphone,
  ach: Landmark,
  card: CreditCard,
  other: FileQuestion,
};

export default function PaymentHistoryTable({ rows }: { rows: PaymentHistoryRow[] }) {
  const columns: Column<PaymentHistoryRow>[] = [
    { key: "payment_date", label: "Date" },
    { key: "renter", label: "Customer" },
    { key: "vin", label: "Trailer", render: (r) => <span className="plate">{r.vin.slice(-6)}</span> },
    { key: "amount", label: "Amount", render: (r) => `$${r.amount.toFixed(2)}`, sortValue: (r) => r.amount },
    {
      key: "method",
      label: "Method",
      render: (r) => {
        const Icon = methodIcons[r.method] || FileQuestion;
        return (
          <span className="flex items-center gap-1.5">
            <Icon size={13} className="text-muted" />
            {methodLabels[r.method] || r.method}
          </span>
        );
      },
    },
    { key: "notes", label: "Notes", render: (r) => r.notes || "—" },
    {
      key: "status",
      label: "Status",
      render: () => <span className="badge-success">Completed</span>,
    },
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
