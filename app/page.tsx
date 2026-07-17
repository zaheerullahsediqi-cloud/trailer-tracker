import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export default async function Dashboard() {
  const supabase = createClient();
  const { data: rentals } = await supabase
    .from("rentals")
    .select("*, trailers(vin, make, model), renters(name, email)")
    .eq("status", "active")
    .order("next_due_date", { ascending: true });

  const list = rentals ?? [];
  const overdue = list.filter((r: any) => daysUntil(r.next_due_date) < 0);
  const dueSoon = list.filter((r: any) => {
    const d = daysUntil(r.next_due_date);
    return d >= 0 && d <= 5;
  });
  const upcoming = list.filter((r: any) => daysUntil(r.next_due_date) > 5);

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Fleet status</p>
        <h1 className="font-display text-3xl">Dashboard</h1>
      </div>

      <Section title="Overdue" tone="alert" rentals={overdue} emptyText="Nothing overdue." />
      <Section title="Due within 5 days" tone="signal" rentals={dueSoon} emptyText="Nothing due soon." />
      <Section title="Upcoming" tone="go" rentals={upcoming} emptyText="No other active rentals." />

      {list.length === 0 && (
        <p className="text-rig-400">
          No active rentals yet.{" "}
          <Link href="/rentals" className="text-signal underline">
            Create one
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  tone,
  rentals,
  emptyText,
}: {
  title: string;
  tone: "alert" | "signal" | "go";
  rentals: any[];
  emptyText: string;
}) {
  const toneClass = { alert: "text-alert", signal: "text-signal", go: "text-go" }[tone];
  if (rentals.length === 0) return null;
  return (
    <div>
      <h2 className={`font-display uppercase tracking-wide text-sm mb-2 ${toneClass}`}>
        {title} ({rentals.length})
      </h2>
      <div className="space-y-2">
        {rentals.map((r: any) => {
          const d = daysUntil(r.next_due_date);
          return (
            <Link
              key={r.id}
              href={`/rentals/${r.id}`}
              className="card p-4 flex items-center justify-between hover:border-signal transition-colors"
            >
              <div>
                <p className="plate text-sm">{r.trailers?.vin}</p>
                <p className="text-rig-100">
                  {r.trailers?.make} {r.trailers?.model} — rented to {r.renters?.name}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-display ${toneClass}`}>
                  {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `Due in ${d}d`}
                </p>
                <p className="text-xs text-rig-400">{r.next_due_date}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
