"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Truck } from "lucide-react";

const STATUS_OPTIONS = [
  { key: "all", label: "All Statuses" },
  { key: "active", label: "Active" },
];

const SORT_OPTIONS = [
  { key: "start_desc", label: "Start Date (Newest)" },
  { key: "start_asc", label: "Start Date (Oldest)" },
  { key: "rate_desc", label: "Monthly Rate (High-Low)" },
  { key: "due_asc", label: "Next Invoice (Soonest)" },
];

export default function RentalList({ rentals }: { rentals: any[] }) {
  const [search, setSearch] = useState("");
  const [trailerType, setTrailerType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("start_desc");

  const types = useMemo(() => {
    const set = new Set<string>();
    rentals.forEach((r) => r.trailers?.trailer_type && set.add(r.trailers.trailer_type));
    return Array.from(set);
  }, [rentals]);

  const filtered = useMemo(() => {
    let result = rentals;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.trailers?.vin?.toLowerCase().includes(q) || r.renters?.name?.toLowerCase().includes(q)
      );
    }
    if (trailerType !== "all") result = result.filter((r) => r.trailers?.trailer_type === trailerType);
    if (status !== "all") result = result.filter((r) => r.status === status);

    const sorted = [...result];
    if (sortBy === "start_desc") sorted.sort((a, b) => b.start_date.localeCompare(a.start_date));
    if (sortBy === "start_asc") sorted.sort((a, b) => a.start_date.localeCompare(b.start_date));
    if (sortBy === "rate_desc") sorted.sort((a, b) => Number(b.rate) - Number(a.rate));
    if (sortBy === "due_asc") sorted.sort((a, b) => a.next_due_date.localeCompare(b.next_due_date));
    return sorted;
  }, [rentals, search, trailerType, status, sortBy]);

  const hasActiveFilters = trailerType !== "all" || status !== "all" || sortBy !== "start_desc";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or trailer..."
            className="input pl-8"
          />
        </div>
        <select value={trailerType} onChange={(e) => setTrailerType(e.target.value)} className="input sm:w-44">
          <option value="all">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-40">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input sm:w-56">
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setTrailerType("all");
              setStatus("all");
              setSortBy("start_desc");
            }}
            className="text-sm text-accent font-medium whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="section-title">
          {filtered.length} Active Rental{filtered.length === 1 ? "" : "s"}
        </p>
        <p className="text-xs text-muted">Showing active rental agreements</p>
      </div>

      <div className="card divide-y divide-border dark:divide-slate-800 overflow-hidden">
        {filtered.map((r: any) => (
          <Link
            key={r.id}
            href={`/rentals/${r.id}`}
            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            {r.trailers?.photoUrl ? (
              <img src={r.trailers.photoUrl} alt={r.trailers.vin} className="w-16 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <Truck size={18} className="text-white/40" />
              </div>
            )}
            <div className="min-w-0 w-40 shrink-0">
              <p className="text-sm font-bold text-primary dark:text-white truncate">
                {r.trailers?.unit_number || r.trailers?.vin?.slice(-6)}
              </p>
              <p className="text-xs text-muted">{r.trailers?.trailer_type || `${r.trailers?.make} ${r.trailers?.model}`}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary dark:text-white truncate">{r.renters?.name}</p>
            </div>
            <div className="hidden md:block text-right w-28 shrink-0">
              <p className="text-xs text-muted">Start Date</p>
              <p className="text-sm text-primary dark:text-slate-200">{r.start_date}</p>
            </div>
            <div className="hidden md:block text-right w-24 shrink-0">
              <p className="text-xs text-muted">Monthly Rate</p>
              <p className="text-sm text-primary dark:text-slate-200">${Number(r.rate).toFixed(0)}</p>
            </div>
            <div className="hidden lg:block text-right w-28 shrink-0">
              <p className="text-xs text-muted">Next Invoice</p>
              <p className="text-sm text-primary dark:text-slate-200">{r.next_due_date}</p>
            </div>
            <span className="badge-success shrink-0">{r.status}</span>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-muted text-sm px-5 py-6">No rentals match this filter.</p>}
      </div>
    </div>
  );
}
