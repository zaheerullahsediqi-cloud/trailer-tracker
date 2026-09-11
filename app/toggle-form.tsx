"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";

export default function ToggleForm({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-end">
        <button onClick={() => setOpen((v) => !v)} className="btn-primary">
          {open ? <X size={16} /> : <Plus size={16} />}
          {open ? "Cancel" : label}
        </button>
      </div>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
