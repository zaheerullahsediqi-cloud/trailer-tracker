"use client";
import { useState, useMemo } from "react";
import { ArrowUpDown, Download, Search } from "lucide-react";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  csvValue?: (row: T) => string | number;
};

export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  filename = "export",
  bulkActions,
  pageSize = 10,
}: {
  columns: Column<T>[];
  rows: T[];
  filename?: string;
  bulkActions?: { label: string; onClick: (ids: string[]) => void; danger?: boolean }[];
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        const val = col.sortValue ? col.sortValue(row) : (row as any)[col.key];
        return String(val ?? "").toLowerCase().includes(q);
      })
    );
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.sortValue ? col.sortValue(a) : (a as any)[col.key];
      const bv = col.sortValue ? col.sortValue(b) : (b as any)[col.key];
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });
    return copy;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(Math.ceil(sorted.length / pageSize), 1);
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === pageRows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageRows.map((r) => r.id)));
    }
  }

  function exportCsv() {
    const header = columns.map((c) => c.label).join(",");
    const lines = sorted.map((row) =>
      columns
        .map((c) => {
          const val = c.csvValue ? c.csvValue(row) : c.sortValue ? c.sortValue(row) : (row as any)[c.key];
          return `"${String(val ?? "").replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className="input pl-8 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          {bulkActions && selected.size > 0 && (
            <>
              <span className="text-xs text-muted">{selected.size} selected</span>
              {bulkActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    action.onClick(Array.from(selected));
                    setSelected(new Set());
                  }}
                  className={action.danger ? "btn-danger text-xs" : "btn-secondary text-xs"}
                >
                  {action.label}
                </button>
              ))}
            </>
          )}
          <button onClick={exportCsv} className="btn-secondary text-xs">
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="dtable">
          <thead>
            <tr>
              {bulkActions && (
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={pageRows.length > 0 && selected.size === pageRows.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key}>
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    {col.label}
                    <ArrowUpDown size={11} className={sortKey === col.key ? "text-accent" : "text-slate-300"} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id}>
                {bulkActions && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : (row as any)[col.key]}</td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length + (bulkActions ? 1 : 0)} className="text-center text-muted py-8">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted px-1">
          <span>
            Page {page} of {totalPages} — {sorted.length} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="btn-secondary text-xs py-1 px-2.5"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="btn-secondary text-xs py-1 px-2.5"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
