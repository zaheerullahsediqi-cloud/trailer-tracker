"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadContract } from "../actions";
import { useRouter } from "next/navigation";

export default function ContractUpload({
  rentalId,
  existingUrl,
  existingFilename,
}: {
  rentalId: string;
  existingUrl: string | null;
  existingFilename: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setUploading(true);
    setError(null);
    const path = `${rentalId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(path, file, { contentType: "application/pdf" });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    await uploadContract(rentalId, path, file.name);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {existingUrl ? (
        <p className="text-sm">
          Current contract:{" "}
          <a href={existingUrl} target="_blank" className="text-signal underline">
            {existingFilename || "view PDF"}
          </a>
        </p>
      ) : (
        <p className="text-sm text-rig-400">No contract uploaded yet.</p>
      )}
      <div>
        <label className="btn-secondary cursor-pointer inline-block">
          {uploading ? "Uploading..." : existingUrl ? "Replace contract" : "Upload contract PDF"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="text-sm text-alert">{error}</p>}
    </div>
  );
}
