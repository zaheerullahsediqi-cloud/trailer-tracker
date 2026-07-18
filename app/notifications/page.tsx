import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export default async function NotificationsPage() {
  const supabase = createClient();
  const { data: rentals } = await supabase
    .from("rentals")
    .select("*, trailers(vin, make, model), renters(name)")
    .eq("status", "active")
    .order("next_due_date", { ascending: true });

  const list = rentals ?? [];
  const overdue = list.filter((r: any) => daysUntil(r.next_due_date) < 0);
  const dueSoon = list.filter((r: any) => {
    const d = daysUntil(r.next_due_date);
    return d >= 0 && d <= 5;
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Alerts</p>
        <h1 className="page-title mt-1">Notifications</h1>
        <p className="text-sm text-muted mt-1">
          Live alerts generated from your rentals — nothing here is stored, it reflects what's due right now.
        </p>
      </div>

      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-danger" /> Overdue ({overdue.length})
        </h2>
        {overdue.length === 0 ? (
          <p className="text-sm text-muted">Nothing overdue.</p>
        ) : (
          <div className="card divide-y divide-border overflow-hidden">
            {overdue.map((r: any) => (
              <Link key={r.id} href={`/rentals/${r.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div>
                  <p className="plate">{r.trailers?.vin}</p>
                  <p className="text-sm font-medium text-primary mt-0.5">
                    {r.trailers?.make} {r.trailers?.model} — {r.renters?.name}
                  </p>
                </div>
                <span className="badge-danger">{Math.abs(daysUntil(r.next_due_date))}d overdue</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <Clock size={14} className="text-warning" /> Due within 5 days ({dueSoon.length})
        </h2>
        {dueSoon.length === 0 ? (
          <p className="text-sm text-muted">Nothing due soon.</p>
        ) : (
          <div className="card divide-y divide-border overflow-hidden">
            {dueSoon.map((r: any) => (
              <Link key={r.id} href={`/rentals/${r.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800">
                <div>
                  <p className="plate">{r.trailers?.vin}</p>
                  <p className="text-sm font-medium text-primary mt-0.5">
                    {r.trailers?.make} {r.trailers?.model} — {r.renters?.name}
                  </p>
                </div>
                <span className="badge-warning">
                  {daysUntil(r.next_due_date) === 0 ? "Due today" : `Due in ${daysUntil(r.next_due_date)}d`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
