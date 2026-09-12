"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addTrailer, uploadTrailerPhoto } from "./actions";
import Modal from "../modal";
import { ImageIcon, Plus } from "lucide-react";

export default function AddTrailerModal() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function reset() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setError(null);
    formRef.current?.reset();
  }

  function handlePhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData(formRef.current);
      const trailerId = await addTrailer(formData);
      if (photoFile && trailerId) {
        const path = `${trailerId}/${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("trailer-photos")
          .upload(path, photoFile, { contentType: photoFile.type });
        if (!uploadError) await uploadTrailerPhoto(trailerId, path);
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
        <Plus size={16} /> Add Trailer
      </button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="Add trailer"
        subtitle="Enter the details for the new trailer."
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
              {saving ? "Saving..." : "Save trailer"}
            </button>
          </>
        }
      >
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        <form ref={formRef} className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Trailer photo</label>
            <label className="border-2 border-dashed border-border dark:border-slate-700 rounded-xl h-40 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent/50 transition-colors overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon size={22} className="text-muted" />
                  <span className="text-sm font-medium text-primary dark:text-white">Click to upload a photo</span>
                  <span className="text-xs text-muted">JPG, PNG or WEBP · Max 5 MB</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
            </label>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Unit number *</label>
              <input name="unit_number" required className="input" placeholder="TL-1025" />
              <p className="text-xs text-muted mt-1">Unique identifier for this trailer</p>
            </div>
            <div>
              <label className="label">Status *</label>
              <select name="status" className="input" defaultValue="available">
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of service</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">VIN *</label>
            <input name="vin" required className="input plate" placeholder="1UYVS2538RP123456" />
            <p className="text-xs text-muted mt-1">17-character vehicle identification number</p>
          </div>
          <div>
            <label className="label">Make *</label>
            <input name="make" required className="input" placeholder="Great Dane" />
          </div>
          <div>
            <label className="label">Model *</label>
            <input name="model" required className="input" placeholder="Dry Van" />
          </div>
          <div>
            <label className="label">Year *</label>
            <input name="year" type="number" required className="input" placeholder="2024" />
          </div>
          <div>
            <label className="label">License plate (optional)</label>
            <input name="plate" className="input" placeholder="7KQ8921" />
            <p className="text-xs text-muted mt-1">Enter license plate number if available</p>
          </div>

          <details className="sm:col-span-2 pt-1">
            <summary className="text-sm text-accent font-medium cursor-pointer">More details (optional)</summary>
            <div className="grid sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="label">Trailer type</label>
                <select name="trailer_type" className="input" defaultValue="">
                  <option value="">Not set</option>
                  <option value="Dry Van">Dry Van</option>
                  <option value="Reefer">Reefer</option>
                  <option value="Flatbed">Flatbed</option>
                  <option value="Step Deck">Step Deck</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Last service date</label>
                <input name="last_service_date" type="date" className="input" />
              </div>
              <div>
                <label className="label">Title #</label>
                <input name="title_number" className="input" />
              </div>
              <div>
                <label className="label">Plate type</label>
                <input name="plate_type" className="input" placeholder="e.g. Commercial (Non-Expiring) Trailer" />
              </div>
            </div>
          </details>
        </form>
      </Modal>
    </>
  );
}
