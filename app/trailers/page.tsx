import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import TrailerList from "./trailer-list";
import AddTrailerModal from "./add-trailer-modal";


export default async function TrailersPage() {
  const supabase = createClient();
  const [{ data: trailers }, { data: activeRentals }] = await Promise.all([
    supabase.from("trailers").select("*").order("created_at", { ascending: false }),
    supabase
      .from("rentals")
      .select("id, trailer_id, renter_id, rate, next_due_date, start_date, renters(name)")
      .eq("status", "active"),
  ]);

  const { balances } = await loadBillingData(supabase);
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
          <h1 className="page-title text-[28px]">Trailers</h1>
          <p className="text-sm text-muted mt-1">
            Manage your trailer fleet, track availability and monitor rentals in real time.
          </p>
          <Link href="/history" className="text-accent underline text-sm">View previous trailers and rental history</Link>
        </div>
        <AddTrailerModal />
      </div>



      <TrailerList trailers={enriched.filter((t: any) => t.status !== "sold")} />
    </div>
  );
}
