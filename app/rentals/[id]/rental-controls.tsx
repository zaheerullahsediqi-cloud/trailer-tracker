"use client";
import Link from "next/link";
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
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div className="space-y-2">
      {status === "active" ? (
        <button
          className="btn-secondary text-xs"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await updateRentalStatus(rentalId, "completed");
              router.refresh();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not complete rental.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Saving…" : "Mark completed"}
        </button>
      ) : (
        <>
          <p className="text-sm text-muted">
            Completed rental history is preserved. Start a new agreement if the
            trailer returns to service.
          </p>
          <Link className="btn-secondary text-xs" href="/rentals">
            New rental agreement
          </Link>
        </>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
