import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import TrailerList from "./trailer-list";
import AddTrailerModal from "./add-trailer-modal";
import InventoryPdfButton from "./inventory-pdf-button";


export default async function TrailersPage({searchParams}:{searchParams:Promise<{category?:string}>}) {
  const supabase = await createClient();
  const { trailers, rentals, balances } = await loadBillingData(supabase);
  const activeRentals = rentals.filter((r: any) => r.status === "active");
  const rentalByTrailer = new Map<string, any>();
  (activeRentals ?? []).forEach((r: any) => rentalByTrailer.set(r.trailer_id, r));

  const enriched = await Promise.all(
    (trailers ?? []).map(async (t: any) => {
      const rental = rentalByTrailer.get(t.id);
      let paymentStatus: "Paid up" | "Due Soon" | "Overdue" | null = null;
      if (rental) {
        const balance = balances.get(rental.id)!;
        paymentStatus = balance.overdue > 0 ? "Overdue" : balance.upcoming > 0 ? "Due Soon" : "Paid up";
      }
      let registrationUrl: string | null = null;
      let insuranceUrl: string | null = null;
      if (t.registration_url) {
        const { data } = await supabase.storage.from("documents").createSignedUrl(t.registration_url, 60 * 60);
        registrationUrl = data?.signedUrl ?? null;
      }
      if (t.insurance_url) {
        const { data } = await supabase.storage.from("documents").createSignedUrl(t.insurance_url, 60 * 60);
        insuranceUrl = data?.signedUrl ?? null;
      }
      const photoUrl = t.photo_url
        ? supabase.storage.from("trailer-photos").getPublicUrl(t.photo_url).data.publicUrl
        : null;
      return { ...t, rental, paymentStatus, registrationUrl, insuranceUrl, photoUrl };
    })
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title text-[28px]">Trailer inventory</h1>
          <p className="text-sm text-muted mt-1">
            Your entire fleet, clearly organized.
          </p>
        </div>
        <div className="flex flex-wrap gap-2"><InventoryPdfButton /><AddTrailerModal /></div>
      </div>



      <TrailerList trailers={enriched} initialCategory={(await searchParams).category} />
    </div>
  );
}
