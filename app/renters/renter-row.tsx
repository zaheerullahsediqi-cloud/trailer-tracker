"use client";
import { useState } from "react";
import { updateRenter, deleteRenter } from "./actions";
import { useRouter } from "next/navigation";

export default function RenterRow({ renter }: { renter: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          await updateRenter(renter.id, formData);
          setSaving(false);
          setEditing(false);
          router.refresh();
        }}
        className="card p-4 grid sm:grid-cols-2 gap-3"
      >
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input name="name" defaultValue={renter.name} required className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" defaultValue={renter.phone ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" defaultValue={renter.email ?? ""} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address</label>
          <input name="address" defaultValue={renter.address ?? ""} className="input" />
        </div>
        <div className="sm:col-span-2 flex gap-2">
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
    <div className="card card-hover p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
          <span className="text-secondary text-xs font-bold">{renter.name?.[0]?.toUpperCase() ?? "?"}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-primary">{renter.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {[renter.phone, renter.email, renter.address].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          className="btn-danger text-xs"
          onClick={() => {
            if (confirm("Delete this renter? This cannot be undone.")) {
              deleteRenter(renter.id);
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
