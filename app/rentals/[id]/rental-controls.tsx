"use client";
import { updateRentalStatus } from "../actions";
import { deleteRental } from "./actions";

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
      ) : (
        <button
          className="btn-secondary text-xs"
          onClick={async () => {
            try { await updateRentalStatus(rentalId, "active"); router.refresh(); } catch(e: any) { setError(e.message); }
          }}
        >
          Reactivate
        </button>
      )}
      <button
        className="btn-danger text-xs"
        onClick={async () => {
          if (!confirm("Permanently delete this rental? This erases it completely — no record kept in History, and all its invoices, payments, and photos are deleted with it. This cannot be undone.\n\nOnly use this for a rental created by mistake. For a normal rental that's ending (trailer returned or sold), click Cancel and use \"Mark completed\" instead — that keeps the record in your history.")) return;
          try {
            await deleteRental(rentalId);
            router.push("/rentals");
          } catch (e: any) {
            setError(e.message);
          }
        }}
      >
        Delete
      </button>
      {error && <p className="text-danger text-sm">{error}</p>}
    </div>
  );
}