import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { availabilityLabel, categoryLabels, displaySoldDate, inventoryCategory } from "@/lib/inventory";

export const categoryBadge = {
  under_mc: "inventory-badge-mc",
  pending_insurance: "inventory-badge-pending",
  rented_out: "inventory-badge-rented",
  sold: "inventory-badge-sold",
};

export default function InventoryTable({ trailers }: { trailers: any[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="dtable inventory-table">
          <caption className="sr-only">Trailer inventory with unit, VIN, plate, category, operating status, and renter or buyer</caption>
          <thead><tr><th scope="col">Unit / Trailer</th><th scope="col">VIN / Plate</th><th scope="col">Category / Status</th><th scope="col">Renter / Buyer</th><th scope="col"><span className="sr-only">Details</span></th></tr></thead>
          <tbody>
            {trailers.map(t => {
              const category = inventoryCategory(t);
              const person = category === "sold" ? t.buyer_name : t.rental?.renters?.name || t.inventory_renter_name;
              return <tr key={t.id}>
                <td className="min-w-[170px]">
                  <Link href={`/trailers/${t.id}`} className="font-semibold hover:underline">{t.unit_number ? `Unit ${t.unit_number}` : "Unassigned unit"}</Link>
                  <span className="inventory-secondary">{[t.year, t.make, t.model].filter(Boolean).join(" ") || "Trailer"}</span>
                </td>
                <td><span className="font-mono text-xs whitespace-nowrap">{t.vin}</span><span className="inventory-secondary">Plate: {t.plate || "—"}</span></td>
                <td><span className={`inventory-badge ${categoryBadge[category]}`}>{categoryLabels[category]}</span><span className="inventory-secondary">{availabilityLabel(t)}</span></td>
                <td className="min-w-[150px] max-w-[240px] break-words">{person || "—"}{category === "sold" && <span className="inventory-secondary">Sold {displaySoldDate(t.sold_date)}</span>}{t.paymentStatus && <span className={`inventory-secondary ${t.paymentStatus === "Overdue" ? "!text-red-700 dark:!text-red-300" : ""}`}>{t.paymentStatus}</span>}</td>
                <td><Link href={`/trailers/${t.id}`} className="inline-flex min-h-10 items-center gap-1 text-accent dark:text-blue-300 text-sm font-medium whitespace-nowrap" aria-label={`View trailer ${t.unit_number || t.vin}`}>View <ArrowUpRight size={14} aria-hidden="true" /></Link></td>
              </tr>;
            })}
            {trailers.length === 0 && <tr><td colSpan={5} className="!py-12 text-center"><p className="font-medium">No matching trailers</p><p className="inventory-secondary">Try another search or clear your filters.</p></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
