"use client";
import { useState } from "react";
import { updateSecurityDeposit } from "../actions";
import { useRouter } from "next/navigation";

const statusLabels: Record<string, string> = {
  held: "Held",
  partially_returned: "Partially returned",
  returned: "Returned",
  forfeited: "Forfeited",
};
const statusBadge: Record<string, string> = {
  held: "badge-accent",
  partially_returned: "badge-warning",
  returned: "badge-success",
  forfeited: "badge-danger",
};

export default function SecurityDepositEdit({ rental }: { rental: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(rental.security_deposit_status || "held");
  const router = useRouter();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          await updateSecurityDeposit(rental.id, formData);
          setSaving(false);
          setEditing(false);
          router.refresh();
        }}
        className="card p-5 space-y-3"
      >
        <p className="eyebrow mb-1">Edit security deposit</p>
        <div>
          <label className="label">Deposit amount ($)</label>
          <input
            name="security_deposit_amount"
            type="number"
            step="0.01"
            defaultValue={rental.security_deposit_amount ?? 0}
            className="input"
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select
            name="security_deposit_status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="held">Held</option>
            <option value="partially_returned">Partially returned</option>
            <option value="returned">Returned</option>
            <option value="forfeited">Forfeited</option>
          </select>
        </div>
        {(status === "partially_returned" || status === "returned") && (
          <>
            <div>
              <label className="label">Amount returned ($)</label>
              <input
                name="security_deposit_returned_amount"
                type="number"
                step="0.01"
                defaultValue={rental.security_deposit_returned_amount ?? 0}
                className="input"
              />
            </div>
            <div>
              <label className="label">Date returned</label>
              <input
                name="security_deposit_returned_date"
                type="date"
                defaultValue={rental.security_deposit_returned_date ?? ""}
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

  const depositStatus = rental.security_deposit_status || "held";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="eyebrow">Security Deposit</p>
        <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
      <p className="text-2xl font-bold text-primary">
        ${Number(rental.security_deposit_amount ?? 0).toFixed(2)}
      </p>
      <div className="mt-2">
        <span className={statusBadge[depositStatus] || "badge-neutral"}>
          {statusLabels[depositStatus] || depositStatus}
        </span>
      </div>
      {(depositStatus === "partially_returned" || depositStatus === "returned") && (
        <p className="text-xs text-muted mt-2">
          ${Number(rental.security_deposit_returned_amount ?? 0).toFixed(2)} returned
          {rental.security_deposit_returned_date ? ` on ${rental.security_deposit_returned_date}` : ""}
        </p>
      )}
    </div>
  );
}
