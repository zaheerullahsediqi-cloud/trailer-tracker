"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadTrailerDocument, deleteTrailerDocument } from "./actions";
import { useRouter } from "next/navigation";
import { FileText, X } from "lucide-react";

function DocSlot({
  trailerId,
  docType,
  label,
  url,
  filename,
  path,
}: {
  trailerId: string;
  docType: "registration" | "insurance";
  label: string;
  url: string | null;
  filename: string | null;
  path: string | null;
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
    const newPath = `${trailerId}/${docType}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(newPath, file, { contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    await uploadTrailerDocument(trailerId, docType, newPath, file.name);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <FileText size={13} className="text-muted shrink-0" />
        <span className="text-muted shrink-0">{label}:</span>
        {url ? (
          <a href={url} target="_blank" className="text-accent underline truncate">
            {filename || "view"}
          </a>
        ) : (
          <span className="text-muted">not uploaded</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <label className="btn-secondary text-xs cursor-pointer py-1 px-2">
          {uploading ? "..." : url ? "Replace" : "Upload"}
          <input type="file" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {url && path && (
          <button
            className="text-danger"
            onClick={async () => {
              if (confirm(`Remove ${label.toLowerCase()}?`)) {
                await deleteTrailerDocument(trailerId, docType, path);
                router.refresh();
              }
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {error && <p className="text-danger">{error}</p>}
    </div>
  );
}

export default function TrailerDocuments({
  trailerId,
  registration,
  insurance,
}: {
  trailerId: string;
  registration: { url: string | null; filename: string | null; path: string | null };
  insurance: { url: string | null; filename: string | null; path: string | null };
}) {
  return (
    <div className="space-y-2 pt-2 border-t border-border dark:border-slate-800">
      <DocSlot
        trailerId={trailerId}
        docType="registration"
        label="Registration"
        url={registration.url}
        filename={registration.filename}
        path={registration.path}
      />
      <DocSlot
        trailerId={trailerId}
        docType="insurance"
        label="Insurance"
        url={insurance.url}
        filename={insurance.filename}
        path={insurance.path}
      />
    </div>
  );
}
