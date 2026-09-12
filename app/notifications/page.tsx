import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { syncNotifications, currentNotifications } from "@/lib/notifications";
import { loadBillingData } from "@/lib/billing-data";
import NotificationRow from "./notification-row";
import MarkAllButton from "./mark-all-button";
import { AlertTriangle, CalendarClock, FileWarning } from "lucide-react";

export default async function NotificationsPage() {
  const supabase = createClient();
  const current = await syncNotifications(supabase);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  const list = currentNotifications(notifications ?? [], current);
  const overdue = list.filter((n: any) => n.type === "overdue");
  const dueSoon = list.filter((n: any) => n.type === "due_soon");
  const unreadCount = list.filter((n: any) => !n.read_at).length;

  const { rentals, balances } = await loadBillingData(supabase);
  const needsReview = rentals.filter((r: any) => balances.get(r.id)?.needsReview);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title text-[28px]">Notifications</h1>
          <p className="text-sm text-muted mt-1">Stay informed and keep your fleet running smoothly.</p>
        </div>
        {unreadCount > 0 && <MarkAllButton />}
      </div>

      {overdue.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between bg-danger/5 px-5 py-3 border-b border-danger/10">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-danger" />
              <p className="font-semibold text-primary dark:text-white text-sm">Overdue Payments</p>
              <span className="badge-danger">{overdue.length}</span>
            </div>
          </div>
          <div className="divide-y divide-border dark:divide-slate-800">
            {overdue.map((n: any) => (
              <NotificationRow key={n.id} notif={n} />
            ))}
          </div>
        </div>
      )}

      {dueSoon.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between bg-accent/5 px-5 py-3 border-b border-accent/10">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-accent" />
              <p className="font-semibold text-primary dark:text-white text-sm">Upcoming Invoice</p>
              <span className="badge-accent">{dueSoon.length}</span>
            </div>
          </div>
          <div className="divide-y divide-border dark:divide-slate-800">
            {dueSoon.map((n: any) => (
              <NotificationRow key={n.id} notif={n} />
            ))}
          </div>
        </div>
      )}

      {needsReview.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between bg-warning/5 px-5 py-3 border-b border-warning/10">
            <div className="flex items-center gap-2">
              <FileWarning size={16} className="text-warning" />
              <p className="font-semibold text-primary dark:text-white text-sm">Records Needing Review</p>
              <span className="badge-warning">{needsReview.length}</span>
            </div>
            <Link href="/history" className="text-sm text-accent font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border dark:divide-slate-800">
            {needsReview.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm text-primary dark:text-white">
                    {r.trailers?.vin} — {r.renters?.name} has no confirmed end date
                  </p>
                  <p className="text-xs text-muted mt-0.5">Balances for this rental may be incomplete.</p>
                </div>
                <Link href={`/rentals/${r.id}`} className="text-xs text-accent font-medium shrink-0">
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {list.length === 0 && needsReview.length === 0 && (
        <p className="text-sm text-muted px-5 py-8 text-center card">You're all caught up. No notifications.</p>
      )}
    </div>
  );
}
