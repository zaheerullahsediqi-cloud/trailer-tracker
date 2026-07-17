"use client";
import { deleteRenter } from "./actions";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <button
      className="btn-danger text-xs"
      onClick={() => {
        if (confirm("Delete this renter? This cannot be undone.")) {
          deleteRenter(id);
        }
      }}
    >
      Delete
    </button>
  );
}
