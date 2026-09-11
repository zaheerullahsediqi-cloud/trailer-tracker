"use client";
import { useState, useMemo } from "react";
import RenterRow from "./renter-row";
import { Search } from "lucide-react";

export default function CustomerList({ renters }: { renters: any[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const filtered = useMemo(() => {
    let result = renters;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (status !== "all") result = result.filter((r) => (status === "active" ? r.activeRentals > 0 : r.activeRentals === 0));

    const sorted = [...result];
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "balance") sorted.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    if (sortBy === "rentals") sorted.sort((a, b) => b.activeRentals - a.activeRentals);
    return sorted;
  }, [renters, search, status, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="input pl-8"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-40">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <p className="text-sm text-muted whitespace-nowrap">
          {filtered.length} customer{filtered.length === 1 ? "" : "s"}
        </p>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input sm:w-44">
          <option value="name">Sort by Name</option>
          <option value="balance">Sort by Balance</option>
          <option value="rentals">Sort by Active Rentals</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r: any) => (
          <RenterRow key={r.id} renter={r} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted text-sm sm:col-span-2 lg:col-span-3">No customers match this filter.</p>
        )}
      </div>
    </div>
  );
}
