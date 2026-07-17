import { createClient } from "@/lib/supabase/server";
import { addRenter } from "./actions";
import DeleteButton from "./delete-button";

export default async function RentersPage() {
  const supabase = createClient();
  const { data: renters } = await supabase
    .from("renters")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Contacts</p>
        <h1 className="font-display text-3xl">Renters</h1>
      </div>

      <form action={addRenter} className="card p-4 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address</label>
          <input name="address" className="input" />
        </div>
        <div className="sm:col-span-2">
          <button className="btn-primary">Add renter</button>
        </div>
      </form>

      <div className="space-y-2">
        {(renters ?? []).map((r: any) => (
          <div key={r.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{r.name}</p>
              <p className="text-sm text-rig-400">
                {[r.phone, r.email, r.address].filter(Boolean).join(" · ")}
              </p>
            </div>
            <DeleteButton id={r.id} />
          </div>
        ))}
        {(!renters || renters.length === 0) && (
          <p className="text-rig-400">No renters yet. Add your first one above.</p>
        )}
      </div>
    </div>
  );
}
