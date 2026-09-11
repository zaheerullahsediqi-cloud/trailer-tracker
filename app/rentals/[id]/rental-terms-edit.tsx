"use client";
import { useState } from "react";
import { updateRentalTerms } from "../actions";
import { useRouter } from "next/navigation";
import { periodLabel } from "@/lib/date";

export default function RentalTermsEdit({ rental }: { rental: any }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          setError(null);
          try { await updateRentalTerms(rental.id, formData); setEditing(false); router.refresh(); }
          catch(e: any) { setError(e.message); }
          finally { setSaving(false); }
        }}
        className="card p-5 space-y-3"
      >
        <p className="eyebrow mb-1">Edit rental terms</p>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div>
          <label className="label">Start date</label>
          <input name="start_date" type="date" defaultValue={rental.start_date} required className="input" />
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
          <input name="rate" type="number" step="0.01" defaultValue={rental.rate} required className="input" />
        </div>
        <div>
          <label className="label">Next invoice date</label>
          <input name="next_due_date" type="date" defaultValue={rental.next_due_date} required className="input" />
        </div>
        {rental.status !== "active" && (
          <>
            <div>
              <label className="label">End date (actual — when it really ended)</label>
              <input name="end_date" type="date" defaultValue={rental.end_date ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Note (e.g. early termination, original term, reason)</label>
              <textarea
                name="completion_note"
                defaultValue={rental.completion_note ?? ""}
                rows={2}
                className="input"
                placeholder="e.g. Early terminated — original 6-month term was to run through Jan 31, 2027"
              />
            </div>
          </>
        )}
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
      <p className="text-sm">Billing period: {periodLabel(rental.period, rental.period_days)}</p>
      <p className="text-sm">Rate: ${Number(rental.rate).toFixed(2)}</p>
      <p className="text-sm text-accent">Next invoice: {rental.next_due_date}</p>
      {rental.status !== "active" && (
        <p className={`text-sm ${rental.end_date ? "text-muted" : "text-warning"}`}>
          End date: {rental.end_date || "Not set — click Edit to add it"}
        </p>
      )}
    </div>
  );
}
