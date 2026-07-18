"use client";
import { useRouter } from "next/navigation";
import { markAllRead } from "./actions";

export default function MarkAllButton() {
  const router = useRouter();
  return (
    <button
      className="btn-secondary text-xs"
      onClick={async () => {
        await markAllRead();
        router.refresh();
      }}
    >
      Mark all read
    </button>
  );
}
