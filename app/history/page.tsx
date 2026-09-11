import Link from "next/link";
import { Truck, FileText, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";

function monthsBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = end.split("-").map(Number);
  let months = (ey - sy) * 12 + (em - sm);
  if (ed < sd) months -= 1;
  return Math.max(months, 1);
}

export default async function HistoryPage({ searchParams }: { searchParams: { view?: string } }) {
  const supabase = createClient();
  const { trailers, rentals, payments, today } = await loadBillingData(supabase);
  const previous = rentals.filter((r) => r.status !== "active").sort((a, b) => b.start_date.localeCompare(a.start_date));
  const previousTrailers = trailers.filter((t) => t.status === "sold" || previous.some((r) => r.trailer_id === t.id));
  const rentalView = searchParams.view === "rentals";

  function rentalCard(r: any) {
    return (
      <Link key={r.id} href={`/rentals/${r.id}`} className="block card card-hover p-5 space-y-2">
        <div className="flex justify-between gap-3">
          <p className="font-semibold text-primary dark:text-white">{r.renters?.name}</p>
          <span className="badge-neutral">Completed</span>
        </div>
        <p className="plate break-all">{r.trailers?.vin}</p>
        <p className="text-sm text-muted">{r.trailers?.make} {r.trailers?.model}</p>
        <p className="text-sm text-primary dark:text-slate-200">{r.start_date} → {r.end_date || "End date not recorded"}</p>
        {r.completion_note && <p className="text-sm text-muted italic">{r.completion_note}</p>}
        <p className="text-sm text-accent font-medium">View full record, contracts, photos and payments →</p>
      </Link>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title text-[28px]">History</h1>
        <p className="text-sm text-muted mt-1">Track past trailers and rental activity. Every move leaves a record.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/history"
          aria-current={!rentalView ? "page" : undefined}
          className={!rentalView ? "btn-primary" : "btn-secondary"}
        >
          <Truck size={16} /> Previous trailers ({previousTrailers.length})
        </Link>
        <Link
          href="/history?view=rentals"
          aria-current={rentalView ? "page" : undefined}
          className={rentalView ? "btn-primary" : "btn-secondary"}
        >
          <FileText size={16} /> Previous rentals ({previous.length})
        </Link>
      </div>

      {rentalView ? (
        <div className="grid md:grid-cols-2 gap-4">
          {previous.map(rentalCard)}
          {!previous.length && <p className="text-muted text-sm">No previous rentals yet.</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {previousTrailers.map((t: any) => {
            const current = rentals.find((r) => r.trailer_id === t.id && r.status === "active");
            const records = previous
              .filter((r) => r.trailer_id === t.id)
              .sort((a, b) => a.start_date.localeCompare(b.start_date));
            const recordIds = records.map((r) => r.id);
            const trailerPayments = payments.filter((p: any) => recordIds.includes(p.rental_id));
            const totalRevenue = trailerPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const totalMonths = records.reduce(
              (sum, r) => sum + monthsBetween(r.start_date, r.end_date || today),
              0
            );
            const photoUrl = t.photo_url
              ? supabase.storage.from("trailer-photos").getPublicUrl(t.photo_url).data.publicUrl
              : null;

            return (
              <section key={t.id} className="card overflow-hidden">
                <div className="grid lg:grid-cols-3">
                  <div className="lg:col-span-1">
                    {photoUrl ? (
                      <img src={photoUrl} alt={t.vin} className="w-full h-full min-h-[160px] object-cover" />
                    ) : (
                      <div className="w-full h-full min-h-[160px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Truck size={32} className="text-white/30" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-1 p-5 space-y-2 border-t lg:border-t-0 lg:border-l border-border dark:border-slate-800">
                    <h2 className="text-lg font-bold text-primary dark:text-white">
                      {t.year} {t.make} {t.model}
                    </h2>
                    <p className="plate break-all">
                      {t.vin} {t.unit_number ? `| Unit #${t.unit_number}` : ""}
                    </p>
                    {t.status === "sold" && (
                      <div className="flex items-center gap-2">
                        <span className="badge-danger">SOLD</span>
                        {t.sold_date && <span className="text-xs text-muted">Sold on {t.sold_date}</span>}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-sm pt-2">
                      <div>
                        <p className="text-xs text-muted">Length</p>
                        <p className="font-semibold text-primary dark:text-slate-200">{t.length_ft ? `${t.length_ft}'` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Type</p>
                        <p className="font-semibold text-primary dark:text-slate-200">{t.trailer_type || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Capacity</p>
                        <p className="font-semibold text-primary dark:text-slate-200">
                          {t.capacity_lbs ? `${Number(t.capacity_lbs).toLocaleString()} lbs` : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Year</p>
                        <p className="font-semibold text-primary dark:text-slate-200">{t.year || "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-1 p-5 space-y-2 bg-slate-50 dark:bg-slate-800/40 border-t lg:border-t-0 lg:border-l border-border dark:border-slate-800">
                    {t.status === "sold" ? (
                      <>
                        <p className="eyebrow">Final Buyer</p>
                        <p className="font-semibold text-primary dark:text-white">{t.buyer_name || "Not recorded"}</p>
                        {t.sold_price && (
                          <p className="text-sm text-primary dark:text-slate-200">
                            Purchased for ${Number(t.sold_price).toLocaleString()}
                          </p>
                        )}
                        {t.sold_note && (
                          <p className="text-sm text-muted italic border-l-2 border-accent/30 pl-3 py-1 bg-white dark:bg-slate-900 rounded-r-lg">
                            "{t.sold_note}"
                          </p>
                        )}
                      </>
                    ) : current ? (
                      <>
                        <p className="eyebrow">Currently Rented</p>
                        <p className="font-semibold text-primary dark:text-white">{current.renters?.name}</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted">In current fleet, no active rental.</p>
                    )}
                    <Link href={`/trailers/${t.id}`} className="text-accent text-sm font-medium inline-block pt-1">
                      View full record →
                    </Link>
                  </div>
                </div>

                <div className="border-t border-border dark:border-slate-800 p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-primary dark:text-white text-sm">Rental History</p>
                        <p className="text-xs text-muted">Complete timeline of renters for this trailer.</p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="text-xs text-muted">Total Rental Time</p>
                        <p className="font-bold text-primary dark:text-white">{totalMonths} months</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Total Rental Revenue</p>
                        <p className="font-bold text-primary dark:text-white">${totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-0">
                      {records.map((r, i) => {
                        const months = monthsBetween(r.start_date, r.end_date || today);
                        const isLast = i === records.length - 1 && t.status !== "sold";
                        return (
                          <div key={r.id} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <span className="w-3 h-3 rounded-full bg-accent mt-1.5 shrink-0" />
                              {!isLast && <span className="w-px flex-1 bg-border dark:bg-slate-700" />}
                            </div>
                            <div className="flex-1 flex items-start justify-between gap-3 pb-5">
                              <div>
                                <p className="text-sm font-medium text-primary dark:text-white">
                                  {r.start_date} – {r.end_date || "ongoing"} ({months} month{months === 1 ? "" : "s"})
                                </p>
                                <p className="text-sm font-semibold text-primary dark:text-white">{r.renters?.name}</p>
                                <p className="text-xs text-muted">Monthly Rate: ${Number(r.rate).toFixed(0)}</p>
                              </div>
                              <span className="badge-success shrink-0">Completed</span>
                            </div>
                          </div>
                        );
                      })}
                      {t.status === "sold" && (
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5 shrink-0" />
                          </div>
                          <div className="flex-1 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-primary dark:text-white">Sold {t.sold_date || ""}</p>
                              <p className="text-xs text-muted">Trailer sold{t.buyer_name ? ` to ${t.buyer_name}` : ""}</p>
                            </div>
                            <span className="badge-neutral shrink-0">Ownership Ended</span>
                          </div>
                        </div>
                      )}
                      {records.length === 0 && t.status !== "sold" && (
                        <p className="text-sm text-muted">No previous rental agreements recorded.</p>
                      )}
                    </div>

                    <div className="card p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                      <p className="eyebrow">Previous Renters</p>
                      <div className="space-y-2.5">
                        {records.map((r) => {
                          const months = monthsBetween(r.start_date, r.end_date || today);
                          const revenue = payments
                            .filter((p: any) => p.rental_id === r.id)
                            .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                          return (
                            <div key={r.id} className="flex items-start justify-between gap-2 text-sm border-b border-border dark:border-slate-800 last:border-0 pb-2.5">
                              <div>
                                <p className="font-medium text-primary dark:text-white">{r.renters?.name}</p>
                                <p className="text-xs text-muted">
                                  {r.start_date} – {r.end_date || "ongoing"}
                                  <br />
                                  {months} month{months === 1 ? "" : "s"} · ${revenue.toLocaleString()} total
                                </p>
                              </div>
                              <span className="badge-success shrink-0">Completed</span>
                            </div>
                          );
                        })}
                        {records.length === 0 && <p className="text-xs text-muted">None yet.</p>}
                      </div>
                      <div className="pt-2 border-t border-border dark:border-slate-800">
                        <p className="eyebrow mb-1">Current Renter</p>
                        {current ? (
                          <p className="text-sm font-medium text-primary dark:text-white">{current.renters?.name}</p>
                        ) : (
                          <p className="text-sm text-muted">
                            No current renter.
                            {t.status === "sold" && " This trailer has been sold and is no longer in the fleet."}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
          {!previousTrailers.length && <p className="text-muted text-sm">No previous trailers yet.</p>}
        </div>
      )}
    </div>
  );
}
