"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markRead, dismissNotification } from "./actions";
import { AlertTriangle, Clock, X } from "lucide-react";

export default function NotificationRow({ notif }: { notif: any }) {
  const router = useRouter();
  const isRead = !!notif.read_at;
  const Icon = notif.type === "overdue" ? AlertTriangle : Clock;
  const iconColor = notif.type === "overdue" ? "text-danger" : "text-warning";

  return (
    <div className={`flex items-start justify-between gap-4 px-5 py-4 ${isRead ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3 min-w-0">
        <Icon size={16} className={`${iconColor} mt-0.5 shrink-0`} />
        <div className="min-w-0">
          <p className="text-sm text-primary">{notif.message}</p>
          <p className="text-xs text-muted mt-0.5">{new Date(notif.created_at).toLocaleString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {notif.rental_id && (
          <Link href={`/rentals/${notif.rental_id}`} className="text-xs text-accent font-medium">
            View →
          </Link>
        )}
        {!isRead && (
          <button
            className="text-xs text-muted hover:text-primary"
            onClick={async () => {
              await markRead(notif.id);
              router.refresh();
            }}
          >
            Mark read
          </button>
        )}
        <button
          className="text-muted hover:text-danger"
          onClick={async () => {
            await dismissNotification(notif.id);
            router.refresh();
          }}
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
