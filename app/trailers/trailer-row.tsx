"use client";
import { useState } from "react";
import { updateTrailer, deleteTrailer } from "./actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck } from "lucide-react";

const statusBadge: Record<string, string> = {
  available: "badge-success",
  maintenance: "badge-warning",
  out_of_service: "badge-danger",
};
const statusLabel: Record<string, string> = {
  available: "Available",
  maintenance: "Maintenance",
  out_of_service: "Out of Service",
};
const paymentBadge: Record<string, string> = {
  "Paid up": "badge-success",
  "Due Soon": "badge-warning",
  Overdue: "badge-danger",
};

export default function TrailerRow({ trailer }: { trailer: any }) {
  const [editing, setEditing] = useState(false);
  const [showBillOfSale, setShowBillOfSale] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const rental = trailer.rental;

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          await updateTrailer(trailer.id, formData);
          setSaving(false);
          setEditing(false);
          router.refresh();
        }}
        className="card p-5 grid grid-cols-2 gap-3"
      >
        <div>
          <label className="label">Trailer #</label>
          <input name="unit_number" defaultValue={trailer.unit_number ?? ""} className="input" />
        </div>
        <div>
          <label className="label">VIN</label>
          <input name="vin" defaultValue={trailer.vin} required className="input plate" />
        </div>
        <div>
          <label className="label">Plate</label>
          <input name="plate" defaultValue={trailer.plate ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Title #</label>
          <input name="title_number" defaultValue={trailer.title_number ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Plate type</label>
          <input name="plate_type" defaultValue={trailer.plate_type ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={trailer.status ?? "available"} className="input">
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of service</option>
          </select>
        </div>
        <div>
          <label className="label">Make</label>
          <input name="make" defaultValue={trailer.make} required className="input" />
        </div>
        <div>
          <label className="label">Model</label>
          <input name="model" defaultValue={trailer.model} required className="input" />
        </div>
        <div>
          <label className="label">Year</label>
          <input name="year" type="number" defaultValue={trailer.year ?? ""} className="input" />
        </div>
        <div className="col-span-2 flex gap-2">
          <button className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  const isRented = !!rental;
  const displayStatusBadge = isRented ? "badge-accent" : statusBadge[trailer.status] || "badge-neutral";
  const displayStatusLabel = isRented ? "Rented" : statusLabel[trailer.status] || trailer.status;

  return (
    <div className="card card-hover p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Truck size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">{trailer.unit_number || "Unassigned #"}</p>
            <p className="plate">{trailer.vin}</p>
          </div>
        </div>
        <span className={displayStatusBadge}>{displayStatusLabel}</span>
      </div>

      <p className="text-sm text-secondary dark:text-slate-300">
        {trailer.year} {trailer.make} {trailer.model} {trailer.plate ? `· Plate ${trailer.plate}` : ""}
      </p>

      {isRented ? (
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
          <div>
            <p className="text-muted">Customer</p>
            <p className="text-primary font-medium mt-0.5">{rental.renters?.name}</p>
          </div>
          <div>
            <p className="text-muted">Monthly rent</p>
            <p className="text-primary font-medium mt-0.5">${Number(rental.rate).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted">Due date</p>
            <p className="text-primary font-medium mt-0.5">{rental.next_due_date}</p>
          </div>
          <div>
            <p className="text-muted">Payment status</p>
            <span className={`${paymentBadge[trailer.paymentStatus]} mt-0.5`}>{trailer.paymentStatus}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted">No active rental.</p>
      )}

      <div className="flex gap-2 pt-1">
        {isRented && (
          <Link href={`/rentals/${rental.id}`} className="btn-secondary text-xs">
            View rental
          </Link>
        )}
        <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className="btn-secondary text-xs" onClick={() => setShowBillOfSale((v) => !v)}>
          {showBillOfSale ? "Cancel" : "Bill of sale"}
        </button>
        <button
          className="btn-danger text-xs"
          onClick={() => {
            if (confirm("Delete this trailer? This cannot be undone.")) {
              deleteTrailer(trailer.id);
            }
          }}
        >
          Delete
        </button>
      </div>

      {showBillOfSale && (
        <form
          method="GET"
          action={`/api/bill-of-sale/${trailer.id}`}
          target="_blank"
          className="border border-border dark:border-slate-700 rounded-lg p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Generate Bill of Sale</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Buyer name</label>
              <input name="buyer_name" required className="input" />
            </div>
            <div>
              <label className="label">Buyer address</label>
              <input name="buyer_address" className="input" />
            </div>
            <div>
              <label className="label">Sale price ($)</label>
              <input name="sale_price" type="number" step="0.01" required className="input" />
            </div>
            <div>
              <label className="label">Sale date</label>
              <input
                name="sale_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Payment method</label>
              <select name="payment_method" defaultValue="Cash" className="input">
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Zelle">Zelle</option>
                <option value="ACH / Bank Transfer">ACH / Bank Transfer</option>
                <option value="Financed">Financed</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <input name="notes" className="input" placeholder="e.g. sold with spare tire" />
            </div>
          </div>
          <button type="submit" className="btn-primary text-xs">
            Generate &amp; preview PDF
          </button>
        </form>
      )}
    </div>
  );
}
