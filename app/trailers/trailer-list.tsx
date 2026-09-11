"use client";
import { useState, useMemo } from "react";
import TrailerRow from "./trailer-row";
import { SlidersHorizontal, X } from "lucide-react";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "rented", label: "Rented" },
  { key: "available", label: "Available" },
  { key: "maintenance", label: "Maintenance" },
  { key: "out_of_service", label: "Out of Service" },
];

export default function TrailerList({ trailers }: { trailers: any[] }) {
  const [filter, setFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return trailers;
    if (filter === "rented") return trailers.filter((t) => !!t.rental);
    return trailers.filter((t) => !t.rental && t.status === filter);
  }, [trailers, filter]);

  return (
    <div className="space-y-4">
      {/* Desktop: inline filter pills */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? "badge-accent" : "badge-neutral"}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Mobile: Filters button opening a slide-up sheet */}
      <div className="sm:hidden">
        <button onClick={() => setSheetOpen(true)} className="btn-secondary text-sm">
          <SlidersHorizontal size={14} />
          Filters {filter !== "all" && `· ${FILTERS.find((f) => f.key === filter)?.label}`}
        </button>
      </div>

      {sheetOpen && (
        <div className="sm:hidden fixed inset-0 z-40" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/40 animate-in" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl pb-[env(safe-area-inset-bottom)] animate-in"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="font-bold text-primary dark:text-white">Filter trailers</p>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-muted">
                <X size={20} />
              </button>
            </div>
            <div className="px-3 pb-6 space-y-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setFilter(f.key);
                    setSheetOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-xl text-sm font-medium ${
                    filter === f.key ? "bg-accent/10 text-accent" : "text-primary dark:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
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
