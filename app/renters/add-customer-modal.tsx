"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addRenter, uploadRenterLicense } from "./actions";
import Modal from "../modal";
import { FileText, X, UserPlus } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
  "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function AddCustomerModal() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function reset() {
    setNotes("");
    setLicenseFile(null);
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
      const renterId = await addRenter(formData);
      if (licenseFile && renterId) {
        const path = `${renterId}/license-${Date.now()}-${licenseFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, licenseFile, { contentType: licenseFile.type });
        if (!uploadError) await uploadRenterLicense(renterId, path, licenseFile.name);
      }
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
        <UserPlus size={16} /> Add Customer
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="Add customer"
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
              {saving ? "Saving..." : "Save customer"}
            </button>
          </>
        }
      >
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        <form ref={formRef} className="space-y-5">
          <div>
            <p className="eyebrow mb-3">Basic information</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Customer name *</label>
                <input name="name" required className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" type="email" className="input" />
              </div>
              <div>
                <label className="label">Address</label>
                <input name="address" className="input" />
              </div>
              <div>
                <label className="label">City</label>
                <input name="city" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">State</label>
                  <select name="state" className="input" defaultValue="">
                    <option value="">—</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">ZIP code</label>
                  <input name="zip" className="input" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border dark:border-slate-800 pt-4">
            <p className="eyebrow mb-3">Additional details (optional)</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Driver's license #</label>
                <input name="drivers_license" className="input" />
              </div>
              <div>
                <label className="label">Date of birth</label>
                <input name="date_of_birth" type="date" className="input" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  name="notes"
                  rows={4}
                  className="input"
                />
                <p className="text-xs text-muted text-right mt-1">{notes.length}/500</p>
              </div>
              <div>
                <label className="label">Driver license file</label>
                {licenseFile ? (
                  <div className="flex items-center justify-between border border-border dark:border-slate-700 rounded-xl px-3 py-2.5">
                    <span className="flex items-center gap-2 text-sm min-w-0">
                      <FileText size={16} className="text-danger shrink-0" />
                      <span className="truncate">{licenseFile.name}</span>
                    </span>
                    <button type="button" onClick={() => setLicenseFile(null)} className="text-muted hover:text-danger shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl h-[74px] flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:border-accent/50 transition-colors">
                    <span className="text-xs text-accent font-medium">Choose a file or drag and drop</span>
                    <span className="text-[11px] text-muted">PDF, JPG or PNG (Max 5 MB)</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && setLicenseFile(e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
