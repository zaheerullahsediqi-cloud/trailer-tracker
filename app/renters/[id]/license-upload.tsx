"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadRenterLicense, deleteRenterLicense } from "../actions";
import { useRouter } from "next/navigation";

export default function LicenseUpload({
  renterId,
  existingUrl,
  existingFilename,
  existingPath,
}: {
  renterId: string;
  existingUrl: string | null;
  existingFilename: string | null;
  existingPath: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const path = `${renterId}/license-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    await uploadRenterLicense(renterId, path, file.name);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {existingUrl ? (
        <p className="text-sm">
          Current file:{" "}
          <a href={existingUrl} target="_blank" className="text-accent underline">
            {existingFilename || "view"}
          </a>
        </p>
      ) : (
        <p className="text-sm text-muted">No driver's license uploaded yet.</p>
      )}
      <div className="flex gap-2">
        <label className="btn-secondary text-xs cursor-pointer">
          {uploading ? "Uploading..." : existingUrl ? "Replace" : "Upload driver's license"}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {existingUrl && existingPath && (
          <button
            className="btn-danger text-xs"
            onClick={async () => {
              if (confirm("Remove the driver's license file?")) {
                await deleteRenterLicense(renterId, existingPath);
                router.refresh();
              }
            }}
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
