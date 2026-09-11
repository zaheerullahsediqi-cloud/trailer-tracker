import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import { addTrailer } from "./actions";
import TrailerList from "./trailer-list";
import ToggleForm from "../toggle-form";


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
      </div>

      <ToggleForm label="Add Trailer">
      <form action={addTrailer} className="card p-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Trailer # (unit number)</label>
          <input name="unit_number" className="input" placeholder="T-102" />
        </div>
        <div>
          <label className="label">VIN</label>
          <input name="vin" required className="input plate" placeholder="1UYVS2536NA123456" />
        </div>
        <div>
          <label className="label">Plate (optional)</label>
          <input name="plate" className="input" />
        </div>
        <div>
          <label className="label">Title # (optional, for lease agreements)</label>
          <input name="title_number" className="input" />
        </div>
        <div>
          <label className="label">Plate type (optional, for lease agreements)</label>
          <input name="plate_type" className="input" placeholder="e.g. Commercial (Non-Expiring) Trailer" />
        </div>
        <div>
          <label className="label">Trailer type</label>
          <select name="trailer_type" className="input" defaultValue="">
            <option value="">Not set</option>
            <option value="Dry Van">Dry Van</option>
            <option value="Reefer">Reefer</option>
            <option value="Flatbed">Flatbed</option>
            <option value="Step Deck">Step Deck</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Last service date (optional)</label>
          <input name="last_service_date" type="date" className="input" />
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" className="input" defaultValue="available">
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of service</option>
            <option value="sold">Sold (retain records)</option>
          </select>
        </div>
        <div>
          <label className="label">Make</label>
          <input name="make" required className="input" placeholder="Wabash" />
        </div>
        <div>
          <label className="label">Model</label>
          <input name="model" required className="input" placeholder="DuraPlate" />
        </div>
        <div>
          <label className="label">Year</label>
          <input name="year" type="number" className="input" placeholder="2022" />
        </div>
        <div className="sm:col-span-2">
          <button className="btn-primary">Add trailer</button>
        </div>
      </form>
      </ToggleForm>

      <TrailerList trailers={enriched.filter((t: any) => t.status !== "sold")} />
    </div>
  );
}
