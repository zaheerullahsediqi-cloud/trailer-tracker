"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordPayment } from "../rentals/[id]/actions";

export default function RecordPaymentForm({ rentals }: { rentals: { id: string; label: string }[] }) {
  const [rentalId, setRentalId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        if (!rentalId) {
          setError("Select a rental first.");
          return;
        }
        setSaving(true);
        setError(null);
        try {
          await recordPayment(rentalId, formData);
          router.refresh();
        } catch (e: any) {
          setError(e.message);
        } finally {
          setSaving(false);
        }
      }}
      className="card p-5 grid sm:grid-cols-2 gap-4"
    >
      {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <label className="label">Rental</label>
        <select value={rentalId} onChange={(e) => setRentalId(e.target.value)} required className="input">
          <option value="">Select an active rental</option>
          {rentals.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Amount ($)</label>
        <input name="amount" type="number" step="0.01" required className="input" />
      </div>
      <div>
        <label className="label">Date</label>
        <input name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="input" />
      </div>
      <div>
        <label className="label">Method</label>
        <select name="method" defaultValue="cash" className="input">
          <option value="cash">Cash</option>
          <option value="check">Check</option>
          <option value="zelle">Zelle</option>
          <option value="ach">ACH / Bank Transfer</option>
          <option value="card">Card</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <input name="notes" className="input" />
      </div>
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Record payment"}
        </button>
      </div>
    </form>
  );
}
