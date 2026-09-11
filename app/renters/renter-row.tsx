"use client";
import { useState } from "react";
import { updateRenter, deleteRenter } from "./actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash)];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function RenterRow({ renter }: { renter: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const isActive = renter.activeRentals > 0;

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
        className="card p-5 grid gap-3 sm:col-span-2 lg:col-span-3"
      >
        <div className="grid sm:grid-cols-2 gap-3">
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
          <div>
            <label className="label">Driver's license #</label>
            <input name="drivers_license" defaultValue={renter.drivers_license ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Date of birth</label>
            <input name="date_of_birth" type="date" defaultValue={renter.date_of_birth ?? ""} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address</label>
            <input name="address" defaultValue={renter.address ?? ""} className="input" />
          </div>
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
    <div className="card card-hover p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`avatar-circle ${avatarColor(renter.name)}`}>{initials(renter.name)}</div>
          <p className="text-sm font-bold text-primary dark:text-white truncate">{renter.name}</p>
        </div>
        <span className={isActive ? "badge-success" : "badge-neutral"}>{isActive ? "Active" : "Inactive"}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted">Active Rentals</p>
          <p className="text-lg font-bold text-primary dark:text-white">{renter.activeRentals}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Outstanding Balance</p>
          <p className="text-lg font-bold text-primary dark:text-white">${renter.outstandingBalance.toFixed(0)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Link href={`/renters/${renter.id}`} className="text-sm text-accent font-medium flex items-center gap-1">
          View Customer →
        </Link>
        <div className="flex gap-3">
          <button className="text-xs text-muted hover:text-primary dark:hover:text-white" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button
            className="text-xs text-danger"
            onClick={async () => {
              if (confirm("Delete this customer? This cannot be undone.")) {
                try {
                  await deleteRenter(renter.id);
                } catch (e: any) {
                  alert(e.message);
                }
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
