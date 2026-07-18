"use client";
import { useState } from "react";
import { updateDownPayment } from "../actions";
import { useRouter } from "next/navigation";

const statusLabels: Record<string, string> = {
  not_collected: "Not collected",
  partially_collected: "Partially collected",
  collected: "Collected",
};
const statusBadge: Record<string, string> = {
  not_collected: "badge-danger",
  partially_collected: "badge-warning",
  collected: "badge-success",
};

export default function DownPaymentEdit({ rental }: { rental: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(rental.down_payment_status || "not_collected");
  const router = useRouter();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          await updateDownPayment(rental.id, formData);
          setSaving(false);
          setEditing(false);
          router.refresh();
        }}
        className="card p-5 space-y-3"
      >
        <p className="eyebrow mb-1">Edit down payment</p>
        <div>
          <label className="label">Down payment amount ($)</label>
          <input
            name="down_payment_amount"
            type="number"
            step="0.01"
            defaultValue={rental.down_payment_amount ?? 0}
            className="input"
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select
            name="down_payment_status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="not_collected">Not collected</option>
            <option value="partially_collected">Partially collected</option>
            <option value="collected">Collected</option>
          </select>
        </div>
        {(status === "partially_collected" || status === "collected") && (
          <>
            <div>
              <label className="label">Amount collected ($)</label>
              <input
                name="down_payment_collected_amount"
                type="number"
                step="0.01"
                defaultValue={rental.down_payment_collected_amount ?? 0}
                className="input"
              />
            </div>
            <div>
              <label className="label">Date collected</label>
              <input
                name="down_payment_collected_date"
                type="date"
                defaultValue={rental.down_payment_collected_date ?? ""}
                className="input"
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

  const downStatus = rental.down_payment_status || "not_collected";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="eyebrow">Down Payment</p>
        <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
      <p className="text-2xl font-bold text-primary">
        ${Number(rental.down_payment_amount ?? 0).toFixed(2)}
      </p>
      <div className="mt-2">
        <span className={statusBadge[downStatus] || "badge-neutral"}>
          {statusLabels[downStatus] || downStatus}
        </span>
      </div>
      {(downStatus === "partially_collected" || downStatus === "collected") && (
        <p className="text-xs text-muted mt-2">
          ${Number(rental.down_payment_collected_amount ?? 0).toFixed(2)} collected
          {rental.down_payment_collected_date ? ` on ${rental.down_payment_collected_date}` : ""}
        </p>
      )}
      {downStatus === "partially_collected" && (
        <p className="text-xs text-danger mt-1">
          ${(Number(rental.down_payment_amount ?? 0) - Number(rental.down_payment_collected_amount ?? 0)).toFixed(2)} still owed
        </p>
      )}
    </div>
  );
}
