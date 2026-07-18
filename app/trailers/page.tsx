import { createClient } from "@/lib/supabase/server";
import { addTrailer } from "./actions";
import TrailerRow from "./trailer-row";

export default async function TrailersPage() {
  const supabase = createClient();
  const { data: trailers } = await supabase
    .from("trailers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Fleet</p>
        <h1 className="page-title">Trailers</h1>
      </div>

      <form action={addTrailer} className="card p-4 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">VIN</label>
          <input name="vin" required className="input plate" placeholder="1UYVS2536NA123456" />
        </div>
        <div>
          <label className="label">Plate (optional)</label>
          <input name="plate" className="input" />
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

      <div className="space-y-2">
        {(trailers ?? []).map((t: any) => (
          <TrailerRow key={t.id} trailer={t} />
        ))}
        {(!trailers || trailers.length === 0) && (
          <p className="text-muted">No trailers yet. Add your first one above.</p>
        )}
      </div>
    </div>
  );
}
