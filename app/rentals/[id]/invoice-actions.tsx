"use client";
import { useState } from "react";
import { sendInvoiceEmail } from "./actions";
import { advanceDueDate } from "../actions";
import { useRouter } from "next/navigation";

export default function InvoiceActions({
  rentalId,
  nextDueDate,
}: {
  rentalId: string;
  nextDueDate: string;
}) {
  const [sending, setSending] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [advanced, setAdvanced] = useState(false);
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
    if (
      !confirm(
        `Mark the period due ${nextDueDate} as paid and advance to the next due date? This can only be undone by manually editing the rental terms.`
      )
    ) {
      return;
    }
    setAdvancing(true);
    setError(null);
    setAdvanced(false);
    try {
      await advanceDueDate(rentalId);
      setAdvanced(true);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdvancing(false);
    }
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
        <button className="btn-secondary" onClick={handleAdvance} disabled={advancing}>
          {advancing ? "Updating..." : "Mark period paid → advance due date"}
        </button>
      </div>
      {done && <p className="text-sm text-success">Invoice sent.</p>}
      {advanced && <p className="text-sm text-success">Due date advanced.</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
