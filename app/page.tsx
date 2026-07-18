import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import RevenueChart from "./revenue-chart";
import {
  Truck,
  FileCheck,
  DollarSign,
  AlertTriangle,
  Clock,
  PackageCheck,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export default async function Dashboard() {
  const supabase = createClient();

  const [{ data: rentals }, { data: trailers }, { data: invoices }] = await Promise.all([
    supabase
      .from("rentals")
      .select("*, trailers(vin, make, model), renters(name, email)")
      .eq("status", "active")
      .order("next_due_date", { ascending: true }),
    supabase.from("trailers").select("id"),
    supabase.from("invoices").select("amount, sent_at").order("sent_at", { ascending: true }),
  ]);

  const list = rentals ?? [];
  const overdue = list.filter((r: any) => daysUntil(r.next_due_date) < 0);
  const dueSoon = list.filter((r: any) => {
    const d = daysUntil(r.next_due_date);
    return d >= 0 && d <= 5;
  });
  const upcoming = list.filter((r: any) => daysUntil(r.next_due_date) > 5);

  const totalTrailers = trailers?.length ?? 0;
  const activeRentalCount = list.length;
  const rentedTrailerIds = new Set(list.map((r: any) => r.trailer_id));
  const availableTrailers = Math.max(totalTrailers - rentedTrailerIds.size, 0);
  const occupancyRate = totalTrailers > 0 ? Math.round((rentedTrailerIds.size / totalTrailers) * 100) : 0;
  const monthlyRevenue = list.reduce((sum: number, r: any) => sum + Number(r.rate || 0), 0);
  const outstandingBalance = overdue.reduce((sum: number, r: any) => sum + Number(r.rate || 0), 0);

  // Build last-6-months revenue series from real invoice sends
  const now = new Date();
  const months: { key: string; month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      month: d.toLocaleString("en-US", { month: "short" }),
      revenue: 0,
    });
  }
  (invoices ?? []).forEach((inv: any) => {
    if (!inv.sent_at) return;
    const d = new Date(inv.sent_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((m) => m.key === key);
    if (bucket) bucket.revenue += Number(inv.amount || 0);
  });

  const stats = [
    {
      label: "Total Trailers",
      value: totalTrailers,
      icon: Truck,
      tint: "bg-accent/10 text-accent",
    },
    {
      label: "Active Rentals",
      value: activeRentalCount,
      icon: FileCheck,
      tint: "bg-success/10 text-success",
    },
    {
      label: "Monthly Revenue",
      value: `$${monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      tint: "bg-accent/10 text-accent",
    },
    {
      label: "Outstanding Balance",
      value: `$${outstandingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: AlertTriangle,
      tint: "bg-danger/10 text-danger",
    },
    {
      label: "Upcoming Due",
      value: dueSoon.length,
      icon: Clock,
      tint: "bg-warning/10 text-warning",
    },
    {
      label: "Late Payments",
      value: overdue.length,
      icon: AlertTriangle,
      tint: "bg-danger/10 text-danger",
    },
    {
      label: "Available Trailers",
      value: availableTrailers,
      icon: PackageCheck,
      tint: "bg-success/10 text-success",
    },
    {
      label: "Occupancy Rate",
      value: `${occupancyRate}%`,
      icon: Gauge,
      tint: "bg-accent/10 text-accent",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Fleet overview</p>
        <h1 className="page-title mt-1">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.tint}`}>
                <Icon size={19} strokeWidth={2} />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary tabular-nums">{s.value}</p>
                <p className="text-xs text-muted font-medium mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-title">Revenue Trend</p>
            <p className="text-xs text-muted mt-0.5">Invoiced amount by month, last 6 months</p>
          </div>
        </div>
        <RevenueChart data={months} />
      </div>

      {/* Activity sections */}
      <div className="space-y-6">
        <Section title="Overdue" tone="danger" rentals={overdue} emptyText="Nothing overdue." />
        <Section title="Due within 5 days" tone="warning" rentals={dueSoon} emptyText="Nothing due soon." />
        <Section title="Upcoming" tone="success" rentals={upcoming} emptyText="No other active rentals." />
      </div>

      {list.length === 0 && (
        <p className="text-muted text-sm">
          No active rentals yet.{" "}
          <Link href="/rentals" className="text-accent underline font-medium">
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
  tone: "danger" | "warning" | "success";
  rentals: any[];
  emptyText: string;
}) {
  if (rentals.length === 0) return null;
  const toneClass = { danger: "text-danger", warning: "text-warning", success: "text-success" }[tone];
  const badgeClass = {
    danger: "badge-danger",
    warning: "badge-warning",
    success: "badge-success",
  }[tone];
  const TrendIcon = tone === "danger" ? ArrowDownRight : ArrowUpRight;

  return (
    <div>
      <h2 className="section-title mb-3 flex items-center gap-2">
        {title}
        <span className={badgeClass}>{rentals.length}</span>
      </h2>
      <div className="card divide-y divide-border overflow-hidden">
        {rentals.map((r: any) => {
          const d = daysUntil(r.next_due_date);
          return (
            <Link
              key={r.id}
              href={`/rentals/${r.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors duration-150"
            >
              <div>
                <p className="plate">{r.trailers?.vin}</p>
                <p className="text-sm text-primary font-medium mt-0.5">
                  {r.trailers?.make} {r.trailers?.model} — {r.renters?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TrendIcon size={14} className={toneClass} />
                <div className="text-right">
                  <p className={`text-sm font-semibold ${toneClass}`}>
                    {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `Due in ${d}d`}
                  </p>
                  <p className="text-xs text-muted">{r.next_due_date}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
