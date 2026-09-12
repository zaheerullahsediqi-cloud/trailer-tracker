"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { recordPayment } from "../rentals/[id]/actions";
import Modal from "../modal";
import { Truck, Plus } from "lucide-react";

type RentalOption = {
  id: string;
  label: string;
  vin: string;
  make: string;
  model: string;
  renterName: string;
  renterEmail: string;
};

export default function RecordPaymentModal({ rentals }: { rentals: RentalOption[] }) {
  const [open, setOpen] = useState(false);
  const [rentalId, setRentalId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const selected = rentals.find((r) => r.id === rentalId);

  function reset() {
    setRentalId("");
    setNotes("");
    setError(null);
    formRef.current?.reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rentalId) {
      setError("Select a rental first.");
      return;
    }
    if (!formRef.current) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData(formRef.current);
      await recordPayment(rentalId, formData);
      reset();
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus size={16} /> Record Payment
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="Record payment"
        subtitle="Record money already received."
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </button>
            <button className="btn-primary" disabled={saving} onClick={handleSubmit}>
              {saving ? "Saving..." : "Save payment"}
            </button>
          </>
        }
      >
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        <form ref={formRef} className="space-y-4">
          <div>
            <label className="label">Select rental *</label>
            <select value={rentalId} onChange={(e) => setRentalId(e.target.value)} required className="input">
              <option value="">Select an active rental</option>
              {rentals.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                <Truck size={18} className="text-white/50" />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted">Trailer</p>
                  <p className="font-semibold text-primary dark:text-white plate">{selected.vin}</p>
                  <p className="text-xs text-muted">{selected.make} {selected.model}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Customer</p>
                  <p className="font-semibold text-primary dark:text-white">{selected.renterName}</p>
                  {selected.renterEmail && <p className="text-xs text-muted">{selected.renterEmail}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Amount received *</label>
              <input name="amount" type="number" step="0.01" required className="input" />
            </div>
            <div>
              <label className="label">Payment date *</label>
              <input
                name="payment_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
                className="input"
              />
            </div>
            <div>
              <label className="label">Payment method *</label>
              <select name="method" defaultValue="cash" className="input">
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="zelle">Zelle</option>
                <option value="ach">ACH Transfer</option>
                <option value="card">Credit Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                name="notes"
                rows={1}
                className="input"
              />
              <p className="text-xs text-muted text-right mt-1">{notes.length}/500</p>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
