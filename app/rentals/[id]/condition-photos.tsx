"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordConditionPhoto, deleteConditionPhoto } from "./actions";
import { useRouter } from "next/navigation";

type Photo = { id: string; url: string | null; photo_path: string; caption: string | null };

function PhotoSection({
  rentalId,
  stage,
  label,
  photos,
}: {
  rentalId: string;
  stage: "pickup" | "return";
  label: string;
  photos: Photo[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const path = `${rentalId}/${stage}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("condition-photos")
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      await recordConditionPhoto(rentalId, stage, path);
    }
    setUploading(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</p>
        <label className="btn-secondary text-xs cursor-pointer">
          {uploading ? "Uploading..." : "Add photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="text-xs text-danger mb-2">{error}</p>}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p) =>
            p.url ? (
              <div key={p.id} className="relative group">
                <a href={p.url} target="_blank">
                  <img
                    src={p.url}
                    alt={p.caption || label}
                    className="w-full aspect-square object-cover rounded-lg border border-border dark:border-slate-700"
                  />
                </a>
                <button
                  onClick={async () => {
                    if (confirm("Delete this photo?")) {
                      await deleteConditionPhoto(p.id, p.photo_path, rentalId);
                      router.refresh();
                    }
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">No {label.toLowerCase()} photos yet.</p>
      )}
    </div>
  );
}

export default function ConditionPhotos({
  rentalId,
  pickupPhotos,
  returnPhotos,
}: {
  rentalId: string;
  pickupPhotos: Photo[];
  returnPhotos: Photo[];
}) {
  return (
    <div className="card p-5 space-y-5">
      <p className="eyebrow">Condition Photos</p>
      <PhotoSection rentalId={rentalId} stage="pickup" label="Pickup" photos={pickupPhotos} />
      <PhotoSection rentalId={rentalId} stage="return" label="Return" photos={returnPhotos} />
    </div>
  );
}
