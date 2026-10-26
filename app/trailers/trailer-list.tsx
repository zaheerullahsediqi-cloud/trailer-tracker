"use client";
import { useState, useMemo } from "react";
import TrailerRow from "./trailer-row";
import InventoryTable, { categoryBadge } from "./inventory-table";
import Link from "next/link";
import { categoryLabels, inventoryCategory, displaySoldDate, type InventoryCategory } from "@/lib/inventory";
import { Search, SlidersHorizontal, List, LayoutGrid, ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  { key: "all", label: "All Statuses" },
  { key: "rented", label: "In Rental" },
  { key: "available", label: "Available" },
  { key: "maintenance", label: "In Maintenance" },
  { key: "out_of_service", label: "Out of Service" },
  { key: "sold", label: "Sold" },
];

const SORT_OPTIONS = [
  { key: "unit", label: "Unit Number" },
  { key: "vin", label: "VIN" },
  { key: "last_service", label: "Last Service" },
];

export default function TrailerList({ trailers, initialCategory = "all" }: { trailers: any[]; initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory in categoryLabels ? initialCategory : "all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [renterId, setRenterId] = useState("all");
  const [trailerType, setTrailerType] = useState("all");
  const [sortBy, setSortBy] = useState("unit");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");

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
    let result = category === "all" ? trailers : trailers.filter(t => inventoryCategory(t) === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          [t.vin,t.unit_number,t.plate,t.make,t.model,t.year,t.inventory_renter_name,t.buyer_name,t.rental?.renters?.name].some(value => String(value ?? "").toLowerCase().includes(q))
      );
    }
    if (status === "rented") result = result.filter((t) => inventoryCategory(t) === "rented_out");
    else if (status !== "all") result = result.filter((t) => !t.rental && t.status === status && (status !== "available" || (!t.inventory_renter_name && t.inventory_category !== "pending_insurance")));
    if (renterId !== "all") result = result.filter((t) => t.rental?.renter_id === renterId);
    if (trailerType !== "all") result = result.filter((t) => t.trailer_type === trailerType);

    const sorted = [...result];
    if (sortBy === "unit") sorted.sort((a, b) => (a.unit_number ? 0 : 1) - (b.unit_number ? 0 : 1) || (a.unit_number || a.vin).localeCompare(b.unit_number || b.vin, undefined, { numeric: true }));
    if (sortBy === "vin") sorted.sort((a, b) => a.vin.localeCompare(b.vin));
    if (sortBy === "last_service")
      sorted.sort((a, b) => (b.last_service_date || "").localeCompare(a.last_service_date || ""));
    return sorted;
  }, [trailers, category, search, status, renterId, trailerType, sortBy]);

  const hasActiveFilters = !!search.trim() || category !== "all" || status !== "all" || renterId !== "all" || trailerType !== "all" || sortBy !== "unit";

  function clearFilters() {
    setCategory("all");
    setSearch("");
    setStatus("all");
    setRenterId("all");
    setTrailerType("all");
    setSortBy("unit");
  }

  function exportInventory() {
    const rows = trailers.map(t => ({...t, inventory_category_label: categoryLabels[inventoryCategory(t)], sold_date_display: displaySoldDate(t.sold_date)}));
    const url = URL.createObjectURL(new Blob([JSON.stringify({exported_at:new Date().toISOString(),trailers:rows},null,2)],{type:"application/json"}));
    const link=document.createElement("a"); link.href=url; link.download=`trailer-inventory-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const filterControls = (
    <>
      <div>
        <label className="label">Status</label>
        <select aria-label="Filter availability" value={status} onChange={(e) => setStatus(e.target.value)} className="input">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Current Renter</label>
        <select aria-label="Filter renter" value={renterId} onChange={(e) => setRenterId(e.target.value)} className="input">
          <option value="all">All Renters</option>
          {renters.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Trailer Type</label>
        <select aria-label="Filter trailer type" value={trailerType} onChange={(e) => setTrailerType(e.target.value)} className="input">
          <option value="all">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Sort By</label>
        <select aria-label="Sort inventory" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(categoryLabels) as [InventoryCategory,string][]).map(([key,label]) => <button key={key} onClick={() => setCategory(category === key ? "all" : key)} aria-pressed={category === key} className={`card p-4 sm:p-5 text-left transition-shadow hover:shadow-md ${category === key ? "ring-2 ring-accent" : ""}`}><span className={`inventory-badge ${categoryBadge[key]}`}>{label}</span><span className="block text-3xl font-semibold mt-3 tabular-nums">{trailers.filter(t => inventoryCategory(t) === key).length}</span></button>)}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Search inventory" placeholder="Search VIN, plate, unit or name…" className="input !pl-9" />
        </div>
        <button onClick={() => setSheetOpen(!sheetOpen)} aria-expanded={sheetOpen} aria-controls="inventory-filters" className="btn-secondary"><SlidersHorizontal size={15} aria-hidden="true" />Filters</button>
        <div className="flex gap-1" role="group" aria-label="Inventory view">
          <button className={view === "table" ? "btn-primary" : "btn-secondary"} onClick={() => setView("table")} aria-pressed={view === "table"} aria-label="Table view"><List size={16} aria-hidden="true" /></button>
          <button className={view === "cards" ? "btn-primary" : "btn-secondary"} onClick={() => setView("cards")} aria-pressed={view === "cards"} aria-label="Card view"><LayoutGrid size={16} aria-hidden="true" /></button>
        </div>
        <details className="relative inventory-more">
          <summary className="btn-secondary list-none cursor-pointer">More options <ChevronDown size={14} aria-hidden="true" /></summary>
          <div className="absolute right-0 top-full mt-2 z-20 w-64 card p-2 shadow-lg">
            <Link href="/trailers/import" className="inventory-menu-item">Review original inventory</Link>
            <Link href="/history" className="inventory-menu-item">Trailer and rental history</Link>
            <button className="inventory-menu-item w-full text-left" onClick={exportInventory}>Export inventory data (JSON)</button>
          </div>
        </details>
        {hasActiveFilters && <button onClick={clearFilters} className="btn-ghost text-accent dark:text-blue-300">Clear filters</button>}
      </div>

      {sheetOpen && (
        <div id="inventory-filters" className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{filterControls}</div>
        </div>
      )}

      <p className="text-sm text-muted" role="status">Showing {filtered.length} of {trailers.length} trailers{category!=="all"?` · ${categoryLabels[category as InventoryCategory]}`:""}</p>
      {view === "table" ? <InventoryTable trailers={filtered} /> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t: any) => (
          <TrailerRow key={t.id} trailer={t} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted text-sm sm:col-span-2 lg:col-span-3">No trailers match this filter.</p>
        )}
      </div>}
    </div>
  );
}
