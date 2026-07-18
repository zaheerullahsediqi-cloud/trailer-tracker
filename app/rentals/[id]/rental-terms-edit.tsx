"use client";
import { useState } from "react";
import { updateRentalTerms } from "../actions";
import { useRouter } from "next/navigation";
import { periodLabel } from "@/lib/date";

export default function RentalTermsEdit({ rental }: { rental: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          await updateRentalTerms(rental.id, formData);
          setSaving(false);
          setEditing(false);
          router.refresh();
        }}
        className="card p-5 space-y-3"
      >
        <p className="eyebrow mb-1">Edit rental terms</p>
        <div>
          <label className="label">Start date</label>
          <input
            name="start_date"
            type="date"
            defaultValue={rental.start_date}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Billing period</label>
          <select name="period" defaultValue={rental.period} className="input">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="semiannual">Every 6 months</option>
            <option value="annual">Yearly</option>
            <option value="custom">Custom (days)</option>
          </select>
        </div>
        <div>
          <label className="label">Custom period (days, if selected above)</label>
          <input
            name="custom_days"
            type="number"
            defaultValue={rental.period === "custom" ? rental.period_days : ""}
            className="input"
            placeholder="e.g. 14"
          />
        </div>
        <div>
          <label className="label">Rent rate ($)</label>
          <input
            name="rate"
            type="number"
            step="0.01"
            defaultValue={rental.rate}
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Next due date</label>
          <input
            name="next_due_date"
            type="date"
            defaultValue={rental.next_due_date}
            required
            className="input"
          />
        </div>
        <div className="flex gap-2">
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

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="eyebrow">Rental terms</p>
        <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
      <p className="text-sm">Start: {rental.start_date}</p>
      <p className="text-sm">
        Billing period: {periodLabel(rental.period, rental.period_days)}
      </p>
      <p className="text-sm">Rate: ${Number(rental.rate).toFixed(2)}</p>
      <p className="text-sm text-accent">Next due: {rental.next_due_date}</p>
    </div>
  );
}
