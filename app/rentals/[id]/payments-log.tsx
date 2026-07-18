"use client";
import { useState } from "react";
import { recordPayment, deletePayment } from "./actions";
import { useRouter } from "next/navigation";

const methodLabels: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  zelle: "Zelle",
  ach: "ACH / Bank Transfer",
  card: "Card",
  other: "Other",
};

export default function PaymentsLog({
  rentalId,
  payments,
}: {
  rentalId: string;
  payments: any[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="eyebrow">Payments Received</p>
          <p className="text-2xl font-bold text-primary mt-1">${totalCollected.toFixed(2)}</p>
        </div>
        <button className="btn-secondary text-xs" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Record payment"}
        </button>
      </div>

      {showForm && (
        <form
          action={async (formData) => {
            setSaving(true);
            setError(null);
            try {
              await recordPayment(rentalId, formData);
              setShowForm(false);
              router.refresh();
            } catch (e: any) {
              setError(e.message);
            } finally {
              setSaving(false);
            }
          }}
          className="grid sm:grid-cols-2 gap-3 border border-border dark:border-slate-700 rounded-lg p-4 mb-4"
        >
          {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
          <div>
            <label className="label">Amount ($)</label>
            <input name="amount" type="number" step="0.01" required className="input" />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              name="payment_date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
              className="input"
            />
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
            <input name="notes" className="input" placeholder="e.g. covers June rent" />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save payment"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-1.5">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between text-sm border-b border-border dark:border-slate-800 last:border-0 py-2"
          >
            <div>
              <span className="font-medium text-primary">${Number(p.amount).toFixed(2)}</span>
              <span className="text-muted">
                {" "}
                — {methodLabels[p.method] || p.method} — {p.payment_date}
                {p.notes ? ` — ${p.notes}` : ""}
              </span>
            </div>
            <button
              className="text-xs text-danger"
              onClick={async () => {
                if (confirm("Delete this payment record? This cannot be undone.")) {
                  await deletePayment(p.id, rentalId);
                  router.refresh();
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
        {payments.length === 0 && <p className="text-sm text-muted">No payments recorded yet.</p>}
      </div>
    </div>
  );
}
