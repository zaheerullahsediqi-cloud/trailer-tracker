"use client";
import { updateRentalStatus } from "../actions";
import { deleteRental } from "./actions";
import { useRouter } from "next/navigation";

export default function RentalControls({
  rentalId,
  status,
}: {
  rentalId: string;
  status: string;
}) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      {status === "active" ? (
        <button
          className="btn-secondary text-xs"
          onClick={async () => {
            await updateRentalStatus(rentalId, "completed");
            router.refresh();
          }}
        >
          Mark completed
        </button>
      ) : (
        <button
          className="btn-secondary text-xs"
          onClick={async () => {
            await updateRentalStatus(rentalId, "active");
            router.refresh();
          }}
        >
          Reactivate
        </button>
      )}
      <button
        className="btn-danger text-xs"
        onClick={async () => {
          if (confirm("Delete this rental permanently?")) {
            await deleteRental(rentalId);
            router.push("/rentals");
          }
        }}
      >
        Delete
      </button>
    </div>
  );
}
