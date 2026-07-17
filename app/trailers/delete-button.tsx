"use client";
import { deleteTrailer } from "./actions";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <button
      className="btn-danger text-xs"
      onClick={() => {
        if (confirm("Delete this trailer? This cannot be undone.")) {
          deleteTrailer(id);
        }
      }}
    >
      Delete
    </button>
  );
}
