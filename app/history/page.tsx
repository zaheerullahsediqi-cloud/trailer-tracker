import Link from "next/link";
import { Truck, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";

export default async function HistoryPage({ searchParams }: { searchParams: { view?: string } }) {
  const { trailers, rentals } = await loadBillingData(createClient());
  const previous = rentals.filter(r => r.status !== "active").sort((a, b) => b.start_date.localeCompare(a.start_date));
  const previousTrailers = trailers.filter(t => t.status === "sold" || previous.some(r => r.trailer_id === t.id));
  const rentalView = searchParams.view === "rentals";
  function rentalCard(r: any) {
    return <Link key={r.id} href={`/rentals/${r.id}`} className="block card card-hover p-5 space-y-2">
      <div className="flex justify-between gap-3"><p className="font-semibold">{r.renters?.name}</p><span className="badge-neutral">Completed</span></div>
      <p className="plate break-all">{r.trailers?.vin}</p>
      <p className="text-sm text-muted">{r.trailers?.make} {r.trailers?.model}</p>
      <p className="text-sm">{r.start_date} → {r.end_date || "End date not recorded"}</p>
      {r.completion_note && <p className="text-sm text-muted">{r.completion_note}</p>}
      <p className="text-sm text-accent font-medium">View full record, contracts, photos and payments →</p>
    </Link>;
  }
  return <div className="space-y-6">
    <div><p className="eyebrow">Records</p><h1 className="page-title mt-1">History</h1><p className="text-muted mt-2">Previous trailers and completed rental agreements. Open a record to see its saved documents, photos and payments.</p></div>
    <nav aria-label="History views" className="flex flex-wrap gap-2">
      <Link href="/history" aria-current={!rentalView ? "page" : undefined} className={!rentalView ? "btn-primary" : "btn-secondary"}><Truck size={18} /> Previous trailers ({previousTrailers.length})</Link>
      <Link href="/history?view=rentals" aria-current={rentalView ? "page" : undefined} className={rentalView ? "btn-primary" : "btn-secondary"}><FileText size={18} /> Previous rentals ({previous.length})</Link>
    </nav>
    {rentalView ? <div className="grid md:grid-cols-2 gap-4">{previous.map(rentalCard)}{!previous.length && <p>No previous rentals yet.</p>}</div> : <div className="space-y-6">
      {previousTrailers.map(t => {
        const current = rentals.find(r => r.trailer_id === t.id && r.status === "active");
        const records = previous.filter(r => r.trailer_id === t.id);
        return <section key={t.id} className="card p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3"><Truck className="text-accent shrink-0 mt-1" size={28} /><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2 items-center"><h2 className="font-bold text-lg">{t.unit_number || "Trailer"}</h2><span className={t.status === "sold" ? "badge-neutral" : "badge-success"}>{t.status === "sold" ? "Sold" : "In current fleet"}</span></div><p className="plate break-all">{t.vin}</p><p className="text-sm text-muted">{t.year} {t.make} {t.model}{t.plate ? ` · Plate ${t.plate}` : ""}</p></div></div>
          {current && <p className="text-sm">Currently rented to <Link className="text-accent underline" href={`/rentals/${current.id}`}>{current.renters?.name}</Link></p>}
          <h3 className="font-semibold">Previous rental records</h3><div className="grid md:grid-cols-2 gap-3">{records.map(rentalCard)}</div>
          {!records.length && <p className="text-muted text-sm">No previous rental agreements recorded.</p>}
        </section>;
      })}
      {!previousTrailers.length && <p>No previous trailers yet.</p>}
    </div>}
  </div>;
}
