import { createClient } from "@/lib/supabase/server";
import { createRental } from "./actions";
import Link from "next/link";

export default async function RentalsPage() {
  const supabase = createClient();
  const [{ data: rentals }, { data: trailers }, { data: renters }] = await Promise.all([
    supabase
      .from("rentals")
      .select("*, trailers(vin, make, model), renters(name)")
      .order("created_at", { ascending: false }),
    supabase.from("trailers").select("id, vin, make, model").order("vin"),
    supabase.from("renters").select("id, name").order("name"),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Agreements</p>
        <h1 className="page-title">Rentals</h1>
      </div>

      <form action={createRental} className="card p-4 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Trailer</label>
          <select name="trailer_id" required className="input">
            <option value="">Select trailer</option>
            {(trailers ?? []).map((t: any) => (
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
          <label className="label">Billing period</label>
          <select name="period" className="input" id="period-select">
            <option value="weekly">Weekly</option>
            <option value="monthly" selected>Monthly</option>
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
            <Link href="/renters" className="text-accent underline">Renters</Link> page first.
          </p>
          <button className="btn-primary">Create rental</button>
        </div>
      </form>

      <div className="space-y-2">
        {(rentals ?? []).map((r: any) => (
          <Link
            key={r.id}
            href={`/rentals/${r.id}`}
            className="card card-hover p-5 flex items-center justify-between"
          >
            <div>
              <p className="plate">{r.trailers?.vin}</p>
              <p className="text-sm font-medium text-primary mt-0.5">
                {r.trailers?.make} {r.trailers?.model} — {r.renters?.name}
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className={r.status === "active" ? "badge-success" : "badge-neutral"}>
                {r.status}
              </span>
              <p className="text-xs text-muted">Next due {r.next_due_date}</p>
            </div>
          </Link>
        ))}
        {(!rentals || rentals.length === 0) && (
          <p className="text-muted text-sm">No rentals yet. Create your first one above.</p>
        )}
      </div>
    </div>
  );
}
