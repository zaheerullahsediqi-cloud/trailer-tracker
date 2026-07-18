"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateCompanyLogo } from "./actions";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";

export default function LogoUpload({ currentLogoUrl }: { currentLogoUrl: string | null }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG or JPG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Please use an image under 2MB.");
      return;
    }
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("branding")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("branding").getPublicUrl(path);
    await updateCompanyLogo(publicUrlData.publicUrl);
    setUploading(false);
    router.refresh();
  }

  async function handleRemove() {
    if (!confirm("Remove your logo? It'll fall back to the default icon everywhere.")) return;
    await updateCompanyLogo(null);
    router.refresh();
  }

  return (
    <div className="card p-5 space-y-3">
      <div>
        <p className="eyebrow">Logo</p>
        <p className="text-xs text-muted mt-1">
          Shown in the sidebar and on every invoice PDF sent to customers.
        </p>
      </div>

      {currentLogoUrl ? (
        <div className="flex items-center gap-4">
          <img
            src={currentLogoUrl}
            alt="Company logo"
            className="w-16 h-16 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 border border-border dark:border-slate-700 p-1"
          />
          <div className="flex gap-2">
            <label className="btn-secondary text-xs cursor-pointer">
              {uploading ? "Uploading..." : "Replace"}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
            <button className="btn-danger text-xs" onClick={handleRemove}>
              <X size={13} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label className="btn-secondary text-xs cursor-pointer inline-flex">
          <Upload size={13} />
          {uploading ? "Uploading..." : "Upload logo"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
