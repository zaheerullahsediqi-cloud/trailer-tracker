"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { importOriginalInventory } from "../inventory-actions";
import {
  categoryLabels,
  inventoryCategory,
  displaySoldDate,
  compareInventory,
} from "@/lib/inventory";
export default function ImportReview({
  rows,
  canImport,
}: {
  rows: ReturnType<typeof compareInventory>;
  canImport: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  const count = rows.filter((r) => r.result === "new").length;
  async function runImport() {
    setBusy(true);
    setMessage("");
    try {
      const result = await importOriginalInventory();
      setMessage(
        `Added ${result.inserted} trailers. Kept ${result.skipped} existing records unchanged.`,
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <span>
          {count} new · {rows.filter((r) => r.result === "matched").length}{" "}
          matching · {rows.filter((r) => r.result === "conflict").length}{" "}
          conflicts
        </span>
        <button
          className="btn-primary"
          disabled={busy || !count || !canImport}
          onClick={runImport}
        >
          {busy ? "Importing…" : `Add ${count} missing trailers`}
        </button>
        {!canImport && <span>Administrator access required.</span>}
        <p role="status">{message}</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="dtable">
          <thead>
            <tr>
              <th>VIN / make & model</th>
              <th>Plate / unit</th>
              <th>Category</th>
              <th>Renter / buyer</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ record: r, result, differences, existingId }) => (
              <tr key={r.vin}>
                <td>
                  <p className="plate">{r.vin}</p>
                  <p>
                    {String(r.year)} {String(r.make)} {String(r.model)}
                  </p>
                </td>
                <td>
                  {String(r.plate)}
                  <p>Unit: {String(r.unit_number ?? "—")}</p>
                </td>
                <td>
                  {
                    categoryLabels[
                      inventoryCategory(r as unknown as { status: string })
                    ]
                  }
                </td>
                <td>
                  {String(r.inventory_renter_name || r.buyer_name || "—")}
                  <p>
                    {r.sold_date ? displaySoldDate(String(r.sold_date)) : ""}
                  </p>
                </td>
                <td>
                  {result === "new"
                    ? "Will add"
                    : result === "matched"
                      ? "Already present"
                      : "Conflict — kept unchanged"}
                  {differences.length > 0 && (
                    <p className="text-xs">
                      Different: {differences.join(", ")}
                    </p>
                  )}
                  {existingId ? (
                    <Link
                      href={`/trailers/${existingId}`}
                      className="text-accent"
                    >
                      Review trailer
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
