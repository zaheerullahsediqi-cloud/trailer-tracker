import { createClient } from "@/lib/supabase/server";
import { addTrailer } from "./actions";
import DeleteButton from "./delete-button";

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
        <h1 className="font-display text-3xl">Trailers</h1>
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
          <div key={t.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="plate text-sm">{t.vin}</p>
              <p>
                {t.year} {t.make} {t.model} {t.plate ? `— Plate ${t.plate}` : ""}
              </p>
            </div>
            <DeleteButton id={t.id} />
          </div>
        ))}
        {(!trailers || trailers.length === 0) && (
          <p className="text-rig-400">No trailers yet. Add your first one above.</p>
        )}
      </div>
    </div>
  );
}
