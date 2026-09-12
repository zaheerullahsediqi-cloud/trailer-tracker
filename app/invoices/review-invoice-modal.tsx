"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendExistingInvoice } from "./actions";
import Modal from "../modal";
import { Download, Mail, Eye } from "lucide-react";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  renter: string;
  amount: number;
  sent_to: string | null;
  created_at: string | null;
  due_date: string;
  delivery_status: string;
};

export default function ReviewInvoiceModal({ invoice }: { invoice: InvoiceRow }) {
  const [open, setOpen] = useState(false);
  const [toEmail, setToEmail] = useState(invoice.sent_to || "");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(invoice.delivery_status === "sent");
  const router = useRouter();

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      await sendExistingInvoice(invoice.id, toEmail, message);
      setSent(true);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-xs py-1 px-2">
        <Eye size={12} /> Review
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Review invoice"
        subtitle="Review the invoice details and PDF before sending to the customer."
        wide
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSend} disabled={sending || sent}>
              <Mail size={14} /> {sent ? "Already sent" : sending ? "Sending..." : "Send invoice"}
            </button>
          </>
        }
      >
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 border border-border dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 h-[70vh]">
            <iframe
              src={`/api/invoice/record/${invoice.id}`}
              className="w-full h-full"
              title={`Invoice ${invoice.invoice_number}`}
            />
          </div>

          <div className="space-y-5">
            <div>
              <p className="eyebrow mb-2">Invoice information</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Invoice number</span>
                  <span className="text-primary dark:text-white font-medium">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Issue date</span>
                  <span className="text-primary dark:text-white">
                    {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Due date</span>
                  <span className="text-primary dark:text-white">{invoice.due_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total amount</span>
                  <span className="text-primary dark:text-white font-semibold">${invoice.amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border dark:border-slate-800 pt-4">
              <p className="eyebrow mb-2">Recipient</p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-muted">Customer: </span>
                  <span className="text-primary dark:text-white font-medium">{invoice.renter}</span>
                </p>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="input"
                    disabled={sent}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border dark:border-slate-800 pt-4">
              <label className="label">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                rows={5}
                className="input"
                placeholder="Please find your invoice attached. Let us know if you have any questions."
                disabled={sent}
              />
              <p className="text-xs text-muted text-right mt-1">{message.length}/500</p>
            </div>

            <a
              href={`/api/invoice/record/${invoice.id}?download=1`}
              className="btn-secondary w-full flex items-center justify-center gap-1.5"
            >
              <Download size={14} /> Download PDF
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
}
