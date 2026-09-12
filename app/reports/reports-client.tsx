"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import RevenueChart from "../revenue-chart";
import { OccupancyPie } from "./reports-charts";
import { Download, DollarSign, FileText, Users, BarChart3, AlertTriangle, Truck, ChevronRight } from "lucide-react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function startOfYear(year: number) {
  return `${year}-01-01`;
}
function endOfYear(year: number) {
  return `${year}-12-31`;
}
function monthsBetween(from: string, to: string) {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return Math.max((ty - fy) * 12 + (tm - fm) + 1, 1);
}

export default function ReportsClient({
  rentals,
  payments,
  trailers,
  overdueTotal,
  overdueCount,
}: {
  rentals: any[];
  payments: any[];
  trailers: any[];
  overdueTotal: number;
  overdueCount: number;
}) {
  const [fromDate, setFromDate] = useState(startOfYear(new Date().getFullYear()));
  const [toDate, setToDate] = useState(todayStr());
  const [quickRange, setQuickRange] = useState("this_year");

  function applyQuickRange(key: string) {
    setQuickRange(key);
    const now = new Date();
    if (key === "7d") {
      setFromDate(daysAgo(7));
      setToDate(todayStr());
    } else if (key === "30d") {
      setFromDate(daysAgo(30));
      setToDate(todayStr());
    } else if (key === "this_year") {
      setFromDate(startOfYear(now.getFullYear()));
      setToDate(todayStr());
    } else if (key === "last_year") {
      setFromDate(startOfYear(now.getFullYear() - 1));
      setToDate(endOfYear(now.getFullYear() - 1));
    }
  }

  const trailerTypeById = useMemo(() => {
    const map = new Map<string, string>();
    trailers.forEach((t: any) => map.set(t.id, t.trailer_type || "Other"));
    return map;
  }, [trailers]);

  const rentalById = useMemo(() => {
    const map = new Map<string, any>();
    rentals.forEach((r: any) => map.set(r.id, r));
    return map;
  }, [rentals]);

  const filteredPayments = useMemo(
    () => payments.filter((p: any) => p.payment_date >= fromDate && p.payment_date <= toDate),
    [payments, fromDate, toDate]
  );

  const rangeDays = Math.max(
    Math.round((Date.parse(toDate) - Date.parse(fromDate)) / 86400000),
    1
  );
  const prevFrom = new Date(Date.parse(fromDate) - rangeDays * 86400000).toISOString().slice(0, 10);
  const prevTo = new Date(Date.parse(fromDate) - 86400000).toISOString().slice(0, 10);
  const prevPayments = payments.filter((p: any) => p.payment_date >= prevFrom && p.payment_date <= prevTo);

  const totalCollections = filteredPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
  const prevCollections = prevPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

  const rentalsInRange = rentals.filter((r: any) => r.start_date >= fromDate && r.start_date <= toDate);
  const prevRentalsInRange = rentals.filter((r: any) => r.start_date >= prevFrom && r.start_date <= prevTo);

  const activeCustomerIds = new Set(rentalsInRange.map((r: any) => r.renter_id));
  const prevActiveCustomerIds = new Set(prevRentalsInRange.map((r: any) => r.renter_id));

  const avgMonthly = totalCollections / monthsBetween(fromDate, toDate);
  const prevAvgMonthly = prevCollections / monthsBetween(prevFrom, prevTo);

  function pctChange(current: number, previous: number): string | null {
    if (previous <= 0) return null;
    return (((current - previous) / previous) * 100).toFixed(0);
  }

  const stats = [
    {
      label: "Total Collections",
      value: `$${totalCollections.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: pctChange(totalCollections, prevCollections),
      icon: DollarSign,
    },
    {
      label: "Total Rentals",
      value: rentalsInRange.length,
      change: pctChange(rentalsInRange.length, prevRentalsInRange.length),
      icon: FileText,
    },
    {
      label: "Active Customers",
      value: activeCustomerIds.size,
      change: pctChange(activeCustomerIds.size, prevActiveCustomerIds.size),
      icon: Users,
    },
    {
      label: "Average Monthly Collections",
      value: `$${avgMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: pctChange(avgMonthly, prevAvgMonthly),
      icon: BarChart3,
    },
  ];

  const months: { key: string; month: string; revenue: number }[] = [];
  const cursor = new Date(fromDate);
  cursor.setUTCDate(1);
  const end = new Date(toDate);
  while (cursor <= end && months.length < 24) {
    months.push({
      key: `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`,
      month: cursor.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
      revenue: 0,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  filteredPayments.forEach((p: any) => {
    const key = p.payment_date.slice(0, 7);
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.revenue += Number(p.amount);
  });

  const totalTrailers = trailers.filter((t: any) => t.status !== "sold").length;
  const occupiedIds = new Set(rentals.filter((r: any) => r.status === "active").map((r: any) => r.trailer_id));
  const availableCount = trailers.filter((t: any) => t.status === "available" && !occupiedIds.has(t.id)).length;

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; renterId: string; collections: number; rentalIds: Set<string> }>();
    filteredPayments.forEach((p: any) => {
      const rental = rentalById.get(p.rental_id);
      if (!rental) return;
      const key = rental.renter_id;
      const entry = map.get(key) || {
        name: rental.renters?.name || "—",
        renterId: rental.renter_id,
        collections: 0,
        rentalIds: new Set(),
      };
      entry.collections += Number(p.amount);
      entry.rentalIds.add(rental.id);
      map.set(key, entry);
    });
    return Array.from(map.values())
      .sort((a, b) => b.collections - a.collections)
      .slice(0, 5);
  }, [filteredPayments, rentalById]);

  const collectionsByType = useMemo(() => {
    const map = new Map<string, number>();
    filteredPayments.forEach((p: any) => {
      const rental = rentalById.get(p.rental_id);
      const type = rental ? trailerTypeById.get(rental.trailer_id) || "Other" : "Other";
      map.set(type, (map.get(type) || 0) + Number(p.amount));
    });
    return Array.from(map.entries())
      .map(([type, collections]) => ({ type, collections }))
      .sort((a, b) => b.collections - a.collections);
  }, [filteredPayments, rentalById, trailerTypeById]);

  function exportReport() {
    const lines = [
      "Report Summary",
      `Period,${fromDate} to ${toDate}`,
      `Total Collections,$${totalCollections.toFixed(2)}`,
      `Total Rentals,${rentalsInRange.length}`,
      `Active Customers,${activeCustomerIds.size}`,
      `Average Monthly Collections,$${avgMonthly.toFixed(2)}`,
      "",
      "Top Customers by Collections",
      "Customer,Collections,Rentals",
      ...topCustomers.map((c) => `${c.name},$${c.collections.toFixed(2)},${c.rentalIds.size}`),
      "",
      "Collections by Trailer Type",
      "Type,Collections",
      ...collectionsByType.map((c) => `${c.type},$${c.collections.toFixed(2)}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const quickRanges = [
    { key: "7d", label: "Last 7 Days" },
    { key: "30d", label: "Last 30 Days" },
    { key: "this_year", label: "This Year" },
    { key: "last_year", label: "Last Year" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title text-[28px]">Reports</h1>
          <p className="text-sm text-muted mt-1">Insights into your fleet, revenue and performance.</p>
        </div>
        <button onClick={exportReport} className="btn-primary">
          <Download size={16} /> Export Report
        </button>
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setQuickRange("custom");
            }}
            className="input"
          />
        </div>
        <div>
          <label className="label">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setQuickRange("custom");
            }}
            className="input"
          />
        </div>
        <div className="flex gap-2 flex-wrap pb-0.5">
          {quickRanges.map((q) => (
            <button
              key={q.key}
              onClick={() => applyQuickRange(q.key)}
              className={quickRange === q.key ? "badge-accent" : "badge-neutral"}
            >
              {q.label}
            </button>
          ))}
          <span className={quickRange === "custom" ? "badge-accent" : "badge-neutral"}>Custom</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">{s.label}</p>
                <div className="stat-icon bg-accent/10 text-accent shrink-0">
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold text-primary dark:text-white tabular-nums">{s.value}</p>
              {s.change !== null && (
                <p className={`text-xs font-medium ${Number(s.change) >= 0 ? "text-success" : "text-danger"}`}>
                  {Number(s.change) >= 0 ? "↑" : "↓"} {Math.abs(Number(s.change))}% vs previous period
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <p className="section-title mb-4">Monthly Collections</p>
          <RevenueChart data={months} />
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="section-title">Fleet Occupancy</p>
            <Truck size={16} className="text-accent" />
          </div>
          <OccupancyPie
            rented={occupiedIds.size}
            available={availableCount}
            unavailable={Math.max(totalTrailers - occupiedIds.size - availableCount, 0)}
          />
          <div className="space-y-1.5 text-sm mt-2">
            <div className="flex justify-between">
              <span className="text-muted">Occupied</span>
              <span className="font-medium text-primary dark:text-white">{occupiedIds.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Available</span>
              <span className="font-medium text-primary dark:text-white">{availableCount}</span>
            </div>
            <div className="flex justify-between border-t border-border dark:border-slate-800 pt-1.5">
              <span className="text-muted">Total Trailers</span>
              <span className="font-medium text-primary dark:text-white">{totalTrailers}</span>
            </div>
          </div>
        </div>
      </div>

      {overdueCount > 0 && (
        <Link href="/payments" className="card p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="font-semibold text-primary dark:text-white text-sm">Overdue Balances</p>
              <p className="text-xl font-bold text-primary dark:text-white">${overdueTotal.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-danger">{overdueCount} Overdue</span>
            <ChevronRight size={16} className="text-muted" />
          </div>
        </Link>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="section-title mb-3">Top Customers by Collections</p>
          <div className="space-y-2.5">
            {topCustomers.map((c, i) => (
              <div key={c.renterId} className="flex items-center justify-between gap-2 text-sm border-b border-border dark:border-slate-800 last:border-0 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted w-4 shrink-0">{i + 1}</span>
                  <Link href={`/renters/${c.renterId}`} className="text-accent font-medium truncate">
                    {c.name}
                  </Link>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-primary dark:text-white font-medium">${c.collections.toFixed(0)}</span>
                  <span className="text-muted text-xs">{c.rentalIds.size} rental{c.rentalIds.size === 1 ? "" : "s"}</span>
                  <span className="text-xs text-muted w-10 text-right">
                    {totalCollections > 0 ? ((c.collections / totalCollections) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-sm text-muted">No collections in this period.</p>}
          </div>
        </div>

        <div className="card p-5">
          <p className="section-title mb-3">Collections by Trailer Type</p>
          <div className="space-y-2.5">
            {collectionsByType.map((c) => (
              <div key={c.type} className="flex items-center justify-between gap-2 text-sm border-b border-border dark:border-slate-800 last:border-0 pb-2.5">
                <span className="text-primary dark:text-white">{c.type}</span>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-medium text-primary dark:text-white">${c.collections.toFixed(0)}</span>
                  <span className="text-xs text-muted w-10 text-right">
                    {totalCollections > 0 ? ((c.collections / totalCollections) * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              </div>
            ))}
            {collectionsByType.length === 0 && <p className="text-sm text-muted">No collections in this period.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
