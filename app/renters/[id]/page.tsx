import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import NotesEdit from "./notes-edit";
import { FileText, Receipt, Clock } from "lucide-react";

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export default async function CustomerProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: renter } = await supabase.from("renters").select("*").eq("id", params.id).single();
  if (!renter) notFound();

  const { data: rentals } = await supabase
    .from("rentals")
    .select("*, trailers(vin, make, model)")
    .eq("renter_id", params.id)
    .order("created_at", { ascending: false });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, rentals!inner(renter_id, trailers(vin))")
    .eq("rentals.renter_id", params.id)
    .order("sent_at", { ascending: false });

  const list = rentals ?? [];
  const activeRental = list.find((r: any) => r.status === "active");
  const balanceDue = list
    .filter((r: any) => r.status === "active" && daysUntil(r.next_due_date) < 0)
    .reduce((sum: number, r: any) => sum + Number(r.rate || 0), 0);

  // Documents = contract PDFs across all rentals for this customer
  const contractRentals = list.filter((r: any) => r.contract_url);
  const documents = await Promise.all(
    contractRentals.map(async (r: any) => {
      const { data } = await supabase.storage.from("contracts").createSignedUrl(r.contract_url, 60 * 60);
      return { rentalId: r.id, vin: r.trailers?.vin, filename: r.contract_filename, url: data?.signedUrl };
    })
  );

  // Timeline = rental starts + invoices sent, merged and sorted
  const timeline = [
    ...list.map((r: any) => ({
      type: "rental_start" as const,
      date: r.start_date,
      label: `Rental started — ${r.trailers?.vin}`,
    })),
    ...(invoices ?? []).map((inv: any) => ({
      type: "invoice" as const,
      date: inv.sent_at,
      label: `Invoice sent — $${Number(inv.amount).toFixed(2)}`,
    })),
  ]
    .filter((t) => t.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Customer</p>
        <h1 className="page-title mt-1">{renter.name}</h1>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-xs text-muted">Balance Due</p>
          <p className={`text-2xl font-bold ${balanceDue > 0 ? "text-danger" : "text-primary"}`}>
            ${balanceDue.toFixed(2)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted">Current Trailer</p>
          <p className="text-lg font-bold text-primary plate">{activeRental?.trailers?.vin || "None"}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted">Total Rentals</p>
          <p className="text-2xl font-bold text-primary">{list.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted">Invoices Sent</p>
          <p className="text-2xl font-bold text-primary">{invoices?.length ?? 0}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="eyebrow mb-3">Contact information</p>
          <p className="text-sm font-medium text-primary">{renter.name}</p>
          <p className="text-sm text-muted mt-1">{renter.phone || "No phone on file"}</p>
          <p className="text-sm text-muted">{renter.email || "No email on file"}</p>
          <p className="text-sm text-muted">{renter.address || "No address on file"}</p>
        </div>
        <div className="card p-5">
          <p className="eyebrow mb-3">Notes</p>
          <NotesEdit renterId={renter.id} notes={renter.notes} />
        </div>
      </div>

      <div>
        <p className="section-title mb-3 flex items-center gap-2">
          <FileText size={14} /> Rental history
        </p>
        <div className="card divide-y divide-border overflow-hidden">
          {list.map((r: any) => (
            <Link
              key={r.id}
              href={`/rentals/${r.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div>
                <p className="plate">{r.trailers?.vin}</p>
                <p className="text-xs text-muted mt-0.5">
                  {r.start_date} — ${Number(r.rate).toFixed(2)}/{r.period}
                </p>
              </div>
              <span className={r.status === "active" ? "badge-success" : "badge-neutral"}>{r.status}</span>
            </Link>
          ))}
          {list.length === 0 && <p className="text-sm text-muted px-5 py-4">No rentals yet.</p>}
        </div>
      </div>

      <div>
        <p className="section-title mb-3 flex items-center gap-2">
          <Receipt size={14} /> Payment history
        </p>
        <div className="card divide-y divide-border overflow-hidden">
          {(invoices ?? []).map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between px-5 py-3">
              <p className="text-sm text-primary">
                {inv.period_start} → {inv.period_end}
              </p>
              <p className="text-sm font-medium text-primary">${Number(inv.amount).toFixed(2)}</p>
              <p className="text-xs text-muted">
                {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : "—"}
              </p>
            </div>
          ))}
          {(!invoices || invoices.length === 0) && (
            <p className="text-sm text-muted px-5 py-4">No invoices sent yet.</p>
          )}
        </div>
      </div>

      <div>
        <p className="section-title mb-3">Documents</p>
        <div className="card divide-y divide-border overflow-hidden">
          {documents.map(
            (doc) =>
              doc.url && (
                <a
                  key={doc.rentalId}
                  href={doc.url}
                  target="_blank"
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <p className="text-sm text-primary">{doc.filename || "Contract"}</p>
                  <p className="text-xs text-accent">View · {doc.vin}</p>
                </a>
              )
          )}
          {documents.length === 0 && <p className="text-sm text-muted px-5 py-4">No documents uploaded yet.</p>}
        </div>
      </div>

      <div>
        <p className="section-title mb-3 flex items-center gap-2">
          <Clock size={14} /> Timeline
        </p>
        <div className="card p-5 space-y-3">
          {timeline.slice(0, 20).map((t, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <div>
                <p className="text-primary">{t.label}</p>
                <p className="text-xs text-muted">{new Date(t.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {timeline.length === 0 && <p className="text-sm text-muted">No activity yet.</p>}
        </div>
      </div>
    </div>
  );
}
