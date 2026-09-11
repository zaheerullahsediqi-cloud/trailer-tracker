import { createClient } from "@/lib/supabase/server";
import { createRental } from "./actions";
import Link from "next/link";
import ToggleForm from "../toggle-form";
import RentalList from "./rental-list";

export default async function RentalsPage() {
  const supabase = createClient();
  const [{ data: rentals }, { data: trailers }, { data: renters }] = await Promise.all([
    supabase
      .from("rentals")
      .select("*, trailers(id, vin, unit_number, make, model, trailer_type, photo_url), renters(name)")
      .order("created_at", { ascending: false }),
    supabase.from("trailers").select("id, vin, make, model").eq("status", "available").order("vin"),
    supabase.from("renters").select("id, name").order("name"),
  ]);

  const occupied = new Set((rentals ?? []).filter((r: any) => r.status === "active").map((r: any) => r.trailer_id));

  const activeRentals = (rentals ?? [])
    .filter((r: any) => r.status === "active")
    .map((r: any) => ({
      ...r,
      trailers: r.trailers
        ? {
            ...r.trailers,
            photoUrl: r.trailers.photo_url
              ? supabase.storage.from("trailer-photos").getPublicUrl(r.trailers.photo_url).data.publicUrl
              : null,
          }
        : null,
    }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title text-[28px]">Rentals</h1>
          <p className="text-sm text-muted mt-1">Active rental agreements for our trailer fleet.</p>
          <Link href="/history?view=rentals" className="text-accent underline text-sm">View previous rentals</Link>
        </div>
      </div>

      <ToggleForm label="New Rental">
      <form action={createRental} className="card p-5 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Trailer</label>
          <select name="trailer_id" required className="input">
            <option value="">Select trailer</option>
            {(trailers ?? []).filter((t: any) => !occupied.has(t.id)).map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.vin} — {t.make} {t.model}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Renter</label>
          <select name="renter_id" required className="input">
            <option value="">Select renter</option>
            {(renters ?? []).map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Start date</label>
          <input name="start_date" type="date" required className="input" />
        </div>
        <div>
          <label className="label">Rent rate ($)</label>
          <input name="rate" type="number" step="0.01" required className="input" />
        </div>
        <div>
          <label className="label">Security deposit ($)</label>
          <input name="security_deposit_amount" type="number" step="0.01" defaultValue="0" className="input" />
        </div>
        <div>
          <label className="label">Down payment ($)</label>
          <input name="down_payment_amount" type="number" step="0.01" defaultValue="0" className="input" />
        </div>
        <div>
          <label className="label">Billing period</label>
          <select name="period" className="input" defaultValue="monthly">
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="semiannual">Every 6 months</option>
            <option value="annual">Yearly</option>
            <option value="custom">Custom (days)</option>
          </select>
        </div>
        <div>
          <label className="label">Custom period (days, if selected above)</label>
          <input name="custom_days" type="number" className="input" placeholder="e.g. 14" />
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted mb-2">
            No trailer or renter listed? Add them on the{" "}
            <Link href="/trailers" className="text-accent underline">Trailers</Link> or{" "}
            <Link href="/renters" className="text-accent underline">Customers</Link> page first.
          </p>
          <button className="btn-primary">Create rental</button>
        </div>
      </form>
      </ToggleForm>

      <RentalList rentals={activeRentals} />
    </div>
  );
}
