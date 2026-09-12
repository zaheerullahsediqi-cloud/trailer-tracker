"use client";
import { useState } from "react";
import { updateInvoiceFooter } from "./actions";
import { useRouter } from "next/navigation";

const MAX = 500;

export default function InvoiceFooterForm({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        setSaving(true);
        await updateInvoiceFooter(formData);
        setSaving(false);
        router.refresh();
      }}
      className="card p-5 space-y-3"
    >
      <div>
        <p className="eyebrow">Invoice Footer</p>
        <p className="text-xs text-muted mt-1">This message will appear at the bottom of all invoices.</p>
      </div>
      <textarea
        name="invoice_footer"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX))}
        rows={5}
        className="input"
      />
      <div className="flex items-center justify-between">
        <button className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <p className="text-xs text-muted">
          {value.length}/{MAX}
        </p>
      </div>
    </form>
  );
}
