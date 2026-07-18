"use client";
import { useState } from "react";
import { updateTrailer, deleteTrailer } from "./actions";
import { useRouter } from "next/navigation";

export default function TrailerRow({ trailer }: { trailer: any }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          await updateTrailer(trailer.id, formData);
          setSaving(false);
          setEditing(false);
          router.refresh();
        }}
        className="card p-4 grid sm:grid-cols-2 gap-3"
      >
        <div>
          <label className="label">VIN</label>
          <input name="vin" defaultValue={trailer.vin} required className="input plate" />
        </div>
        <div>
          <label className="label">Plate</label>
          <input name="plate" defaultValue={trailer.plate ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Make</label>
          <input name="make" defaultValue={trailer.make} required className="input" />
        </div>
        <div>
          <label className="label">Model</label>
          <input name="model" defaultValue={trailer.model} required className="input" />
        </div>
        <div>
          <label className="label">Year</label>
          <input name="year" type="number" defaultValue={trailer.year ?? ""} className="input" />
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
    <div className="card p-4 flex items-center justify-between">
      <div>
        <p className="plate text-sm">{trailer.vin}</p>
        <p>
          {trailer.year} {trailer.make} {trailer.model} {trailer.plate ? `— Plate ${trailer.plate}` : ""}
        </p>
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary text-xs" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          className="btn-danger text-xs"
          onClick={() => {
            if (confirm("Delete this trailer? This cannot be undone.")) {
              deleteTrailer(trailer.id);
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
