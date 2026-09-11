"use client";
import { useState, useMemo } from "react";
import TrailerRow from "./trailer-row";
import { Search, SlidersHorizontal, X } from "lucide-react";

const STATUS_OPTIONS = [
  { key: "all", label: "All Statuses" },
  { key: "rented", label: "In Rental" },
  { key: "available", label: "Available" },
  { key: "maintenance", label: "In Maintenance" },
  { key: "out_of_service", label: "Out of Service" },
];

const SORT_OPTIONS = [
  { key: "unit", label: "Unit Number" },
  { key: "vin", label: "VIN" },
  { key: "last_service", label: "Last Service" },
];

export default function TrailerList({ trailers }: { trailers: any[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [renterId, setRenterId] = useState("all");
  const [trailerType, setTrailerType] = useState("all");
  const [sortBy, setSortBy] = useState("unit");
  const [sheetOpen, setSheetOpen] = useState(false);

  const renters = useMemo(() => {
    const map = new Map<string, string>();
    trailers.forEach((t) => {
      if (t.rental?.renters) map.set(t.rental.renter_id, t.rental.renters.name);
    });
    return Array.from(map.entries());
  }, [trailers]);

  const types = useMemo(() => {
    const set = new Set<string>();
    trailers.forEach((t) => t.trailer_type && set.add(t.trailer_type));
    return Array.from(set);
  }, [trailers]);

  const filtered = useMemo(() => {
    let result = trailers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.vin.toLowerCase().includes(q) ||
          t.unit_number?.toLowerCase().includes(q) ||
          t.rental?.renters?.name?.toLowerCase().includes(q)
      );
    }
    if (status === "rented") result = result.filter((t) => !!t.rental);
    else if (status !== "all") result = result.filter((t) => !t.rental && t.status === status);
    if (renterId !== "all") result = result.filter((t) => t.rental?.renter_id === renterId);
    if (trailerType !== "all") result = result.filter((t) => t.trailer_type === trailerType);

    const sorted = [...result];
    if (sortBy === "unit") sorted.sort((a, b) => (a.unit_number || a.vin).localeCompare(b.unit_number || b.vin));
    if (sortBy === "vin") sorted.sort((a, b) => a.vin.localeCompare(b.vin));
    if (sortBy === "last_service")
      sorted.sort((a, b) => (b.last_service_date || "").localeCompare(a.last_service_date || ""));
    return sorted;
  }, [trailers, search, status, renterId, trailerType, sortBy]);

  const hasActiveFilters = status !== "all" || renterId !== "all" || trailerType !== "all" || sortBy !== "unit";

  function clearFilters() {
    setStatus("all");
    setRenterId("all");
    setTrailerType("all");
    setSortBy("unit");
  }

  const filterControls = (
    <>
      <div>
        <label className="label sm:hidden">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label sm:hidden">Current Renter</label>
        <select value={renterId} onChange={(e) => setRenterId(e.target.value)} className="input">
          <option value="all">All Renters</option>
          {renters.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label sm:hidden">Trailer Type</label>
        <select value={trailerType} onChange={(e) => setTrailerType(e.target.value)} className="input">
          <option value="all">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label sm:hidden">Sort By</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trailers..."
            className="input pl-8"
          />
        </div>
        <div className="hidden sm:flex gap-3">{filterControls}</div>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="hidden sm:block text-sm text-accent font-medium whitespace-nowrap">
            Clear Filters
          </button>
        )}
        <button onClick={() => setSheetOpen(true)} className="btn-secondary text-sm sm:hidden">
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      {sheetOpen && (
        <div className="sm:hidden fixed inset-0 z-40" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/40 animate-in" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl pb-[env(safe-area-inset-bottom)] animate-in max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="font-bold text-primary dark:text-white">Filter trailers</p>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-muted">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 pb-6 space-y-3">
              {filterControls}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setSheetOpen(false)} className="btn-primary flex-1">
                  Apply
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      clearFilters();
                      setSheetOpen(false);
                    }}
                    className="btn-secondary flex-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t: any) => (
          <TrailerRow key={t.id} trailer={t} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted text-sm sm:col-span-2 lg:col-span-3">No trailers match this filter.</p>
        )}
      </div>
    </div>
  );
}
