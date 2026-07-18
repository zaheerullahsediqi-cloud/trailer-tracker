"use client";
import { useState } from "react";
import { updateRenterNotes } from "../actions";
import { useRouter } from "next/navigation";

export default function NotesEdit({ renterId, notes }: { renterId: string; notes: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="input"
          placeholder="Notes about this customer..."
        />
        <div className="flex gap-2">
          <button
            className="btn-primary text-xs"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await updateRenterNotes(renterId, value);
              setSaving(false);
              setEditing(false);
              router.refresh();
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button className="btn-secondary text-xs" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted whitespace-pre-wrap">{notes || "No notes yet."}</p>
      <button className="btn-secondary text-xs mt-3" onClick={() => setEditing(true)}>
        Edit notes
      </button>
    </div>
  );
}
