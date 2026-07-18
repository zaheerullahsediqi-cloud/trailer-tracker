import { createClient } from "@/lib/supabase/server";
import { addTrailer } from "./actions";
import TrailerRow from "./trailer-row";

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export default async function TrailersPage() {
  const supabase = createClient();
  const [{ data: trailers }, { data: activeRentals }] = await Promise.all([
    supabase.from("trailers").select("*").order("created_at", { ascending: false }),
    supabase
      .from("rentals")
      .select("id, trailer_id, rate, next_due_date, renters(name)")
      .eq("status", "active"),
  ]);

  const rentalByTrailer = new Map<string, any>();
  (activeRentals ?? []).forEach((r: any) => rentalByTrailer.set(r.trailer_id, r));

  const enriched = (trailers ?? []).map((t: any) => {
    const rental = rentalByTrailer.get(t.id);
    let paymentStatus: "Paid up" | "Due Soon" | "Overdue" | null = null;
    if (rental) {
      const d = daysUntil(rental.next_due_date);
      paymentStatus = d < 0 ? "Overdue" : d <= 5 ? "Due Soon" : "Paid up";
    }
    return { ...t, rental, paymentStatus };
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Fleet</p>
        <h1 className="page-title mt-1">Trailers</h1>
      </div>

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
          <label className="label">Status</label>
          <select name="status" className="input" defaultValue="available">
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of service</option>
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

      <div className="grid sm:grid-cols-2 gap-4">
        {enriched.map((t: any) => (
          <TrailerRow key={t.id} trailer={t} />
        ))}
        {enriched.length === 0 && (
          <p className="text-muted text-sm sm:col-span-2">No trailers yet. Add your first one above.</p>
        )}
      </div>
    </div>
  );
}
