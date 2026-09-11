"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadTrailerPhoto, deleteTrailerPhoto } from "./actions";
import { useRouter } from "next/navigation";
import { Camera, X } from "lucide-react";

export default function TrailerPhotoUpload({
  trailerId,
  photoUrl,
  photoPath,
}: {
  trailerId: string;
  photoUrl: string | null;
  photoPath: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Please use an image under 5MB.");
      return;
    }
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop();
    const path = `${trailerId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("trailer-photos")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    await uploadTrailerPhoto(trailerId, path);
    setUploading(false);
    router.refresh();
  }

  return (
    <div className="relative group">
      {photoUrl ? (
        <div className="relative">
          <img src={photoUrl} alt="Trailer" className="w-full aspect-[4/3] object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <label className="btn-secondary text-xs cursor-pointer">
              {uploading ? "Uploading..." : "Replace"}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
            {photoPath && (
              <button
                className="btn-danger text-xs"
                onClick={async () => {
                  if (confirm("Remove this trailer photo?")) {
                    await deleteTrailerPhoto(trailerId, photoPath);
                    router.refresh();
                  }
                }}
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <label className="aspect-[4/3] bg-gradient-to-br from-primary to-secondary flex flex-col items-center justify-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          <Camera size={28} className="text-white/50" strokeWidth={1.5} />
          <span className="text-xs text-white/60 font-medium">{uploading ? "Uploading..." : "Add photo"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
      {error && <p className="text-xs text-danger px-3 py-1">{error}</p>}
    </div>
  );
}
