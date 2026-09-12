"use client";
import { useState, useMemo } from "react";
import DataTable, { Column } from "../data-table";
import Link from "next/link";
import { Download } from "lucide-react";
import ReviewInvoiceModal from "./review-invoice-modal";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  vin: string;
  renter: string;
  period: string;
  amount: number;
  sent_to: string;
  sent_at: string | null;
  created_at: string | null;
  due_date: string;
  delivery_status: string;
  rental_id: string | null;
};

const statusLabels: Record<string, string> = {
  sent: "Sent",
  pending: "Pending",
  sending: "Sending",
  failed: "Failed",
  review_required: "Needs Review",
};
const statusBadge: Record<string, string> = {
  sent: "badge-success",
  pending: "badge-neutral",
  sending: "badge-warning",
  failed: "badge-danger",
  review_required: "badge-warning",
};

export default function InvoicesTable({ rows }: { rows: InvoiceRow[] }) {
  const [status, setStatus] = useState("all");
  const [customer, setCustomer] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const customers = useMemo(() => Array.from(new Set(rows.map((r) => r.renter))).sort(), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== "all" && r.delivery_status !== status) return false;
      if (customer !== "all" && r.renter !== customer) return false;
      if (fromDate && (!r.sent_at || r.sent_at.slice(0, 10) < fromDate)) return false;
      if (toDate && (!r.sent_at || r.sent_at.slice(0, 10) > toDate)) return false;
      return true;
    });
  }, [rows, status, customer, fromDate, toDate]);

  const hasFilters = status !== "all" || customer !== "all" || fromDate || toDate;

  const columns: Column<InvoiceRow>[] = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "renter", label: "Customer" },
    { key: "vin", label: "Trailer", render: (r) => <span className="plate">{r.vin.slice(-6)}</span> },
    {
      key: "sent_at",
      label: "Invoice Date",
      render: (r) => (r.sent_at ? new Date(r.sent_at).toLocaleDateString() : "—"),
      sortValue: (r) => r.sent_at || "",
    },
    { key: "amount", label: "Amount", render: (r) => `$${r.amount.toFixed(2)}`, sortValue: (r) => r.amount },
    {
      key: "delivery_status",
      label: "Status",
      render: (r) => (
        <span className={statusBadge[r.delivery_status] || "badge-neutral"}>
          {statusLabels[r.delivery_status] || r.delivery_status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2">
          <ReviewInvoiceModal invoice={r} />
          <a href={`/api/invoice/record/${r.id}?download=1`} className="btn-secondary text-xs py-1 px-2">
            <Download size={12} /> Download
          </a>
        </div>
      ),
    },
    {
      key: "view",
      label: "",
      render: (r) =>
        r.rental_id ? (
          <Link href={`/rentals/${r.rental_id}`} className="text-accent text-xs font-medium whitespace-nowrap">
            View rental →
          </Link>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-44">
          <option value="all">All Statuses</option>
          {Object.entries(statusLabels).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="input sm:w-52">
          <option value="all">All Customers</option>
          {customers.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input sm:w-40" />
          <span className="text-muted text-sm">—</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input sm:w-40" />
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setStatus("all");
              setCustomer("all");
              setFromDate("");
              setToDate("");
            }}
            className="text-sm text-accent font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      <DataTable columns={columns} rows={filtered} filename="invoices" />
    </div>
  );
}
