"use client";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRental } from "./actions";
import Modal from "../modal";
import { Truck, Plus } from "lucide-react";

type TrailerOption = { id: string; vin: string; make: string; model: string };
type RenterOption = { id: string; name: string };

const periodLabels: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  semiannual: "Every 6 months",
  annual: "Yearly",
  custom: "Custom",
};

export default function NewRentalModal({
  trailers,
  renters,
}: {
  trailers: TrailerOption[];
  renters: RenterOption[];
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trailerId, setTrailerId] = useState("");
  const [renterId, setRenterId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [rate, setRate] = useState("");
  const [deposit, setDeposit] = useState("0");
  const [downPayment, setDownPayment] = useState("0");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const selectedTrailer = trailers.find((t) => t.id === trailerId);
  const selectedRenter = renters.find((r) => r.id === renterId);
  const dueAtSigning = (Number(rate) || 0) + (Number(deposit) || 0);

  function reset() {
    setTrailerId("");
    setRenterId("");
    setStartDate("");
    setPeriod("monthly");
    setRate("");
    setDeposit("0");
    setDownPayment("0");
    setError(null);
    formRef.current?.reset();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData(formRef.current);
      await createRental(formData);
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
        <Plus size={16} /> New Rental
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="New rental"
        subtitle="Create a new trailer rental agreement. Fill in the details below."
        wide
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
              {saving ? "Creating..." : "Create rental"}
            </button>
          </>
        }
      >
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        <div className="grid lg:grid-cols-3 gap-6">
          <form ref={formRef} className="lg:col-span-2 space-y-4">
            <div>
              <label className="label">Available trailer *</label>
              <select
                name="trailer_id"
                value={trailerId}
                onChange={(e) => setTrailerId(e.target.value)}
                required
                className="input"
              >
                <option value="">Select trailer</option>
                {trailers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.vin} — {t.make} {t.model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Customer *</label>
              <select
                name="renter_id"
                value={renterId}
                onChange={(e) => setRenterId(e.target.value)}
                required
                className="input"
              >
                <option value="">Select renter</option>
                {renters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Start date *</label>
                <input
                  name="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Billing period *</label>
                <select name="period" value={period} onChange={(e) => setPeriod(e.target.value)} className="input">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="semiannual">Every 6 months</option>
                  <option value="annual">Yearly</option>
                  <option value="custom">Custom (days)</option>
                </select>
              </div>
            </div>
            {period === "custom" && (
              <div>
                <label className="label">Custom period (days)</label>
                <input name="custom_days" type="number" className="input" placeholder="e.g. 14" />
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Rent rate (per period) *</label>
                <input
                  name="rate"
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Security deposit *</label>
                <input
                  name="security_deposit_amount"
                  type="number"
                  step="0.01"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Down payment *</label>
              <input
                name="down_payment_amount"
                type="number"
                step="0.01"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                className="input"
              />
            </div>
            <p className="text-xs text-muted">
              No trailer or customer listed? Add them on the{" "}
              <Link href="/trailers" className="text-accent underline">Trailers</Link> or{" "}
              <Link href="/renters" className="text-accent underline">Customers</Link> page first.
            </p>
          </form>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 space-y-3 h-fit">
            <p className="font-bold text-primary dark:text-white">Rental summary</p>
            <div className="space-y-1">
              <p className="text-xs text-muted">Trailer</p>
              {selectedTrailer ? (
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-accent shrink-0" />
                  <p className="text-sm font-medium text-primary dark:text-white">
                    {selectedTrailer.vin} — {selectedTrailer.make} {selectedTrailer.model}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted">Not selected</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted">Customer</p>
              <p className="text-sm font-medium text-primary dark:text-white">{selectedRenter?.name || "Not selected"}</p>
            </div>
            <div className="border-t border-border dark:border-slate-700 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Start date</span>
                <span className="text-primary dark:text-white">{startDate || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Billing period</span>
                <span className="text-primary dark:text-white">{periodLabels[period]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Rent rate</span>
                <span className="text-primary dark:text-white">${(Number(rate) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Security deposit</span>
                <span className="text-primary dark:text-white">${(Number(deposit) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Down payment</span>
                <span className="text-primary dark:text-white">${(Number(downPayment) || 0).toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-border dark:border-slate-700 pt-3">
              <p className="text-xs text-muted">Due at signing</p>
              <p className="text-xl font-bold text-accent">${dueAtSigning.toFixed(2)}</p>
              <p className="text-xs text-muted mt-0.5">First period rent + security deposit</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
