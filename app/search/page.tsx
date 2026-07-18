import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Truck, Users, FileText } from "lucide-react";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();
  const supabase = createClient();

  let trailers: any[] = [];
  let renters: any[] = [];
  let rentals: any[] = [];

  if (q) {
    const [trailerRes, renterRes, rentalRes] = await Promise.all([
      supabase
        .from("trailers")
        .select("*")
        .or(`vin.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%,unit_number.ilike.%${q}%`)
        .limit(20),
      supabase
        .from("renters")
        .select("*")
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(20),
      supabase
        .from("rentals")
        .select("*, trailers(vin, make, model), renters(name)")
        .limit(50),
    ]);
    trailers = trailerRes.data ?? [];
    renters = renterRes.data ?? [];
    rentals = (rentalRes.data ?? []).filter(
      (r: any) =>
        r.trailers?.vin?.toLowerCase().includes(q.toLowerCase()) ||
        r.renters?.name?.toLowerCase().includes(q.toLowerCase())
    );
  }

  const totalResults = trailers.length + renters.length + rentals.length;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Search results</p>
        <h1 className="page-title mt-1">"{q}"</h1>
        <p className="text-sm text-muted mt-1">{totalResults} result{totalResults === 1 ? "" : "s"}</p>
      </div>

      {trailers.length > 0 && (
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Truck size={14} /> Trailers
          </h2>
          <div className="card divide-y divide-border overflow-hidden">
            {trailers.map((t: any) => (
              <Link key={t.id} href="/trailers" className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                <p className="plate">{t.vin}</p>
                <p className="text-sm text-primary">{t.year} {t.make} {t.model}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {renters.length > 0 && (
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Users size={14} /> Customers
          </h2>
          <div className="card divide-y divide-border overflow-hidden">
            {renters.map((r: any) => (
              <Link key={r.id} href={`/renters/${r.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                <p className="text-sm font-medium text-primary">{r.name}</p>
                <p className="text-xs text-muted">{r.email}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {rentals.length > 0 && (
        <div>
          <h2 className="section-title mb-3 flex items-center gap-2">
            <FileText size={14} /> Rentals
          </h2>
          <div className="card divide-y divide-border overflow-hidden">
            {rentals.map((r: any) => (
              <Link key={r.id} href={`/rentals/${r.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                <p className="plate">{r.trailers?.vin}</p>
                <p className="text-sm text-primary">{r.renters?.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {q && totalResults === 0 && (
        <p className="text-muted text-sm">No results for "{q}".</p>
      )}
    </div>
  );
}
