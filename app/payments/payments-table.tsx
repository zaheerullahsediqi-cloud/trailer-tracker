"use client";
import { useRouter } from "next/navigation";
import DataTable, { Column } from "../data-table";
import { advanceDueDate } from "../rentals/actions";
import Link from "next/link";

type PaymentRow = {
  id: string;
  vin: string;
  renter: string;
  rate: number;
  next_due_date: string;
  status: "Overdue" | "Due Soon" | "Upcoming";
  daysUntil: number;
};

export default function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  const router = useRouter();

  const columns: Column<PaymentRow>[] = [
    { key: "vin", label: "VIN", render: (r) => <span className="plate">{r.vin}</span> },
    { key: "renter", label: "Customer" },
    {
      key: "rate",
      label: "Amount",
      render: (r) => `$${r.rate.toFixed(2)}`,
      sortValue: (r) => r.rate,
    },
    { key: "next_due_date", label: "Due Date" },
    {
      key: "status",
      label: "Status",
      render: (r) => {
        const cls =
          r.status === "Overdue" ? "badge-danger" : r.status === "Due Soon" ? "badge-warning" : "badge-success";
        return <span className={cls}>{r.status}</span>;
      },
    },
    {
      key: "view",
      label: "",
      render: (r) => (
        <Link href={`/rentals/${r.id}`} className="text-accent text-xs font-medium">
          View →
        </Link>
      ),
    },
  ];

  async function markPaidBulk(ids: string[]) {
    if (!confirm(`Mark ${ids.length} rental(s) as paid and advance their due dates?`)) return;
    for (const id of ids) {
      await advanceDueDate(id);
    }
    router.refresh();
  }

  return (
    <DataTable
      columns={columns}
      rows={rows}
      filename="payments"
      bulkActions={[{ label: "Mark paid & advance", onClick: markPaidBulk }]}
    />
  );
}
