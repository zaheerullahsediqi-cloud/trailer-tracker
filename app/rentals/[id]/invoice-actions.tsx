"use client";
import { useState } from "react";
import { sendInvoiceEmail } from "./actions";
import { advanceDueDate } from "../actions";
import { useRouter } from "next/navigation";

export default function InvoiceActions({ rentalId }: { rentalId: string }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  async function handleSend() {
    setSending(true);
    setError(null);
    setDone(false);
    try {
      await sendInvoiceEmail(rentalId);
      setDone(true);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleAdvance() {
    await advanceDueDate(rentalId);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <a href={`/api/invoice/${rentalId}`} target="_blank" className="btn-secondary">
          Preview / download PDF
        </a>
        <button className="btn-primary" onClick={handleSend} disabled={sending}>
          {sending ? "Sending..." : "Email invoice to renter"}
        </button>
        <button className="btn-secondary" onClick={handleAdvance}>
          Mark period paid → advance due date
        </button>
      </div>
      {done && <p className="text-sm text-go">Invoice sent.</p>}
      {error && <p className="text-sm text-alert">{error}</p>}
    </div>
  );
}
