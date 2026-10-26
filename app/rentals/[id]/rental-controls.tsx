"use client";
import Link from "next/link";
import { updateRentalStatus } from "../actions";
import { undoRentalCompletion } from "../undo-actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function RentalControls({
  rentalId,
  status,
  canUndo = false,
}: {
  rentalId: string;
  status: string;
  canUndo?: boolean;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [saveNote, setSaveNote] = useState(false);
  const [message, setMessage] = useState("");
  async function undoCompletion() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await undoRentalCompletion(rentalId, saveNote);
      setConfirmUndo(false);
      setMessage(
        saveNote
          ? "Rental restored. Correction note saved."
          : "Rental restored. No correction note added.",
      );
      setSaveNote(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not undo completion.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      {status === "active" ? (
        <button
          className="btn-secondary text-xs"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            setMessage("");
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
            For a trailer returning after a real break, start a new agreement.
            Undo completion is only for correcting a mistake.
          </p>
          <Link className="btn-secondary text-xs" href="/rentals">
            New rental agreement
          </Link>
          {canUndo && !confirmUndo && (
            <button
              type="button"
              className="btn-secondary text-xs ml-2"
              disabled={busy}
              onClick={() => {
                setSaveNote(false);
                setError("");
                setMessage("");
                setConfirmUndo(true);
              }}
            >
              Undo completion
            </button>
          )}
          {canUndo && confirmUndo && (
            <section
              aria-label="Confirm undo completion"
              className="card p-4 space-y-3 max-w-sm"
            >
              <p className="text-sm">
                Undo an accidental completion? This restores the original rental
                timeline and billing. For a trailer returning after a real
                break, create a new agreement.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={saveNote}
                  onChange={(e) => setSaveNote(e.target.checked)}
                  disabled={busy}
                />
                Save a correction note in history
              </label>
              <p className="text-xs text-muted">
                Off by default. No extra correction record is created.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={busy}
                  onClick={undoCompletion}
                >
                  {busy ? "Restoring…" : "Restore rental"}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  disabled={busy}
                  onClick={() => {
                    setConfirmUndo(false);
                    setSaveNote(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-success">
          {message}
        </p>
      )}
    </div>
  );
}
