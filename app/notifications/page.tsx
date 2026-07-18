import { createClient } from "@/lib/supabase/server";
import { syncNotifications } from "@/lib/notifications";
import NotificationRow from "./notification-row";
import MarkAllButton from "./mark-all-button";

export default async function NotificationsPage() {
  const supabase = createClient();

  // Self-healing: generates any new notification rows for rentals that are
  // currently overdue/due-soon. Safe to call every time this page loads —
  // it never duplicates or resurrects a notification you already dismissed.
  await syncNotifications(supabase);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .is("dismissed_at", null)
    .order("created_at", { ascending: false });

  const list = notifications ?? [];
  const unreadCount = list.filter((n: any) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Alerts</p>
          <h1 className="page-title mt-1">Notifications</h1>
          <p className="text-sm text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && <MarkAllButton />}
      </div>

      <div className="card divide-y divide-border overflow-hidden">
        {list.map((n: any) => (
          <NotificationRow key={n.id} notif={n} />
        ))}
        {list.length === 0 && (
          <p className="text-sm text-muted px-5 py-8 text-center">No notifications.</p>
        )}
      </div>
    </div>
  );
}
