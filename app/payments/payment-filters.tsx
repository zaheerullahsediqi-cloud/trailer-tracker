"use client";
import { useState, useMemo } from "react";
import PaymentHistoryTable from "./payment-history-table";

const methodLabels: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  zelle: "Zelle",
  ach: "ACH / Bank Transfer",
  card: "Card",
  other: "Other",
};

export default function PaymentFilters({ rows }: { rows: any[] }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customer, setCustomer] = useState("all");
  const [method, setMethod] = useState("all");

  const customers = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.renter && set.add(r.renter));
    return Array.from(set).sort();
  }, [rows]);

  const methods = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.method && set.add(r.method));
    return Array.from(set);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (fromDate && r.payment_date < fromDate) return false;
      if (toDate && r.payment_date > toDate) return false;
      if (customer !== "all" && r.renter !== customer) return false;
      if (method !== "all" && r.method !== method) return false;
      return true;
    });
  }, [rows, fromDate, toDate, customer, method]);

  const hasActiveFilters = fromDate || toDate || customer !== "all" || method !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">From date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">To date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">Customer</label>
          <select value={customer} onChange={(e) => setCustomer(e.target.value)} className="input">
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="input">
            <option value="all">All Methods</option>
            {methods.map((m) => (
              <option key={m} value={m}>
                {methodLabels[m] || m}
              </option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
              setCustomer("all");
              setMethod("all");
            }}
            className="text-sm text-accent font-medium pb-2.5"
          >
            Clear Filters
          </button>
        )}
      </div>
      <PaymentHistoryTable rows={filtered} />
    </div>
  );
}
