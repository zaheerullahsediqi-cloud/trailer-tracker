import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ContractUpload from "./contract-upload";
import InvoiceActions from "./invoice-actions";
import RentalControls from "./rental-controls";
import RentalTermsEdit from "./rental-terms-edit";
import SecurityDepositEdit from "./security-deposit-edit";
import DownPaymentEdit from "./down-payment-edit";
import PaymentsLog from "./payments-log";
import ConditionPhotos from "./condition-photos";

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

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("rental_id", rental.id)
    .order("payment_date", { ascending: false });

  const { data: photoRows } = await supabase
    .from("condition_photos")
    .select("*")
    .eq("rental_id", rental.id)
    .order("created_at", { ascending: true });

  const photosWithUrls = await Promise.all(
    (photoRows ?? []).map(async (p: any) => {
      const { data } = await supabase.storage
        .from("condition-photos")
        .createSignedUrl(p.photo_path, 60 * 60);
      return { id: p.id, url: data?.signedUrl ?? null, photo_path: p.photo_path, caption: p.caption, stage: p.stage };
    })
  );
  const pickupPhotos = photosWithUrls.filter((p) => p.stage === "pickup");
  const returnPhotos = photosWithUrls.filter((p) => p.stage === "return");

  const defaultLeaseMonths =
    rental.period === "annual" ? 12 : rental.period === "semiannual" ? 6 : rental.period === "weekly" ? 1 : 6;

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

      <div className="grid sm:grid-cols-2 gap-4">
        <SecurityDepositEdit rental={rental} />
        <DownPaymentEdit rental={rental} />
      </div>

      <PaymentsLog rentalId={rental.id} payments={payments ?? []} />

      <ConditionPhotos rentalId={rental.id} pickupPhotos={pickupPhotos} returnPhotos={returnPhotos} />

      <form
        method="GET"
        action={`/api/lease-agreement/${rental.id}`}
        target="_blank"
        className="card p-5 space-y-4"
      >
        <div>
          <p className="eyebrow">Lease Agreement</p>
          <p className="text-xs text-muted mt-1">
            Fills in your template with this rental's details and opens a print/download-ready PDF for the
            renter to sign.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Lease start date</label>
            <input
              name="lease_start_date"
              type="date"
              defaultValue={rental.start_date}
              className="input"
            />
          </div>
          <div>
            <label className="label">Lease term (months)</label>
            <input
              name="lease_months"
              type="number"
              defaultValue={defaultLeaseMonths}
              min={1}
              className="input"
            />
          </div>
          <div>
            <label className="label">Early termination notice (days)</label>
            <input name="notice_days" type="number" defaultValue={30} min={0} className="input" />
          </div>
          <div>
            <label className="label">Inspection location</label>
            <input
              name="inspection_location"
              className="input"
              placeholder="e.g. TA Travel Center"
            />
          </div>
          <div>
            <label className="label">Renter's driver's license #</label>
            <input
              name="drivers_license"
              defaultValue={rental.renters.drivers_license ?? ""}
              className="input"
              placeholder="Add on the Customers page to save it for next time"
            />
          </div>
          <div>
            <label className="label">Renter's date of birth</label>
            <input
              name="dob"
              type="date"
              defaultValue={rental.renters.date_of_birth ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label">Governing law — state</label>
            <input name="gov_state" defaultValue="Texas" className="input" />
          </div>
          <div>
            <label className="label">Governing law — county</label>
            <input name="gov_county" defaultValue="Bexar County" className="input" />
          </div>
        </div>
        <button type="submit" className="btn-primary">
          Generate &amp; preview PDF
        </button>
      </form>

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
