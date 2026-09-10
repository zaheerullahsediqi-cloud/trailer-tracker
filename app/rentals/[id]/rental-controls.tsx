"use client";
import { updateRentalStatus } from "../actions";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RentalControls({
  rentalId,
  status,
}: {
  rentalId: string;
  status: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex gap-2">
      {status === "active" ? (
        <button
          className="btn-secondary text-xs"
          onClick={async () => {
            try { await updateRentalStatus(rentalId, "completed"); router.refresh(); } catch(e: any) { setError(e.message); }
          }}
        >
          Mark completed
        </button>
      ) : null}
      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}
