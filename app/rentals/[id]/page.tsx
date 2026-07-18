import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ContractUpload from "./contract-upload";
import InvoiceActions from "./invoice-actions";
import RentalControls from "./rental-controls";
import RentalTermsEdit from "./rental-terms-edit";

export default async function RentalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: rental } = await supabase
    .from("rentals")
    .select("*, trailers(*), renters(*)")
    .eq("id", params.id)
    .single();

  if (!rental) notFound();

  let contractUrl: string | null = null;
  if (rental.contract_url) {
    const { data } = await supabase.storage
      .from("contracts")
      .createSignedUrl(rental.contract_url, 60 * 60);
    contractUrl = data?.signedUrl ?? null;
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("rental_id", rental.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <span className={rental.status === "active" ? "badge-success" : "badge-neutral"}>
            {rental.status}
          </span>
          <h1 className="page-title plate mt-2">{rental.trailers.vin}</h1>
          <p className="text-secondary text-sm mt-0.5">
            {rental.trailers.year} {rental.trailers.make} {rental.trailers.model}
          </p>
        </div>
        <RentalControls rentalId={rental.id} status={rental.status} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="eyebrow mb-2">Renter</p>
          <p className="font-semibold text-primary">{rental.renters.name}</p>
          <p className="text-sm text-muted mt-1">{rental.renters.phone}</p>
          <p className="text-sm text-muted">{rental.renters.email}</p>
          <p className="text-sm text-muted">{rental.renters.address}</p>
        </div>
        <RentalTermsEdit rental={rental} />
      </div>

      <div className="card p-5">
        <p className="eyebrow mb-3">Contract</p>
        <ContractUpload
          rentalId={rental.id}
          existingUrl={contractUrl}
          existingFilename={rental.contract_filename}
        />
      </div>

      <div className="card p-5">
        <p className="eyebrow mb-3">Invoicing</p>
        <InvoiceActions rentalId={rental.id} nextDueDate={rental.next_due_date} />
        <div className="mt-4 space-y-1.5">
          {(invoices ?? []).map((inv: any) => (
            <p key={inv.id} className="text-sm text-muted">
              {inv.period_start} → {inv.period_end} — <span className="font-medium text-primary">${Number(inv.amount).toFixed(2)}</span> — sent to{" "}
              {inv.sent_to} on {new Date(inv.sent_at).toLocaleDateString()}
            </p>
          ))}
          {(!invoices || invoices.length === 0) && (
            <p className="text-sm text-muted">No invoices sent yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
