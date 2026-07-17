import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ContractUpload from "./contract-upload";
import InvoiceActions from "./invoice-actions";
import RentalControls from "./rental-controls";

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
          <p className="eyebrow">{rental.status}</p>
          <h1 className="font-display text-3xl plate">{rental.trailers.vin}</h1>
          <p className="text-rig-300">
            {rental.trailers.year} {rental.trailers.make} {rental.trailers.model}
          </p>
        </div>
        <RentalControls rentalId={rental.id} status={rental.status} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="eyebrow mb-2">Renter</p>
          <p className="font-medium">{rental.renters.name}</p>
          <p className="text-sm text-rig-400">{rental.renters.phone}</p>
          <p className="text-sm text-rig-400">{rental.renters.email}</p>
          <p className="text-sm text-rig-400">{rental.renters.address}</p>
        </div>
        <div className="card p-4">
          <p className="eyebrow mb-2">Rental terms</p>
          <p className="text-sm">Start: {rental.start_date}</p>
          <p className="text-sm">Billing period: {rental.period} ({rental.period_days} days)</p>
          <p className="text-sm">Rate: ${Number(rental.rate).toFixed(2)}</p>
          <p className="text-sm text-signal">Next due: {rental.next_due_date}</p>
        </div>
      </div>

      <div className="card p-4">
        <p className="eyebrow mb-3">Contract</p>
        <ContractUpload
          rentalId={rental.id}
          existingUrl={contractUrl}
          existingFilename={rental.contract_filename}
        />
      </div>

      <div className="card p-4">
        <p className="eyebrow mb-3">Invoicing</p>
        <InvoiceActions rentalId={rental.id} />
        <div className="mt-4 space-y-1">
          {(invoices ?? []).map((inv: any) => (
            <p key={inv.id} className="text-sm text-rig-400">
              {inv.period_start} → {inv.period_end} — ${Number(inv.amount).toFixed(2)} — sent to{" "}
              {inv.sent_to} on {new Date(inv.sent_at).toLocaleDateString()}
            </p>
          ))}
          {(!invoices || invoices.length === 0) && (
            <p className="text-sm text-rig-500">No invoices sent yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
