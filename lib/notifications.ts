// Generates persisted notification rows for rentals that are currently
// overdue or due soon. Uses an upsert with ON CONFLICT DO NOTHING (via
// ignoreDuplicates) keyed on (rental_id, due_date, type), so:
// - a rental that's already overdue doesn't get duplicate rows every time
//   this runs (cron, or on page load)
// - once you dismiss or read a notification, it stays dismissed/read —
//   re-running this never resurrects it
// - when a due date actually advances (payment marked paid), that's a new
//   due_date value, so a fresh, unread notification is created for it
export async function syncNotifications(supabase: any) {
  const { data: rentals } = await supabase
    .from("rentals")
    .select("id, next_due_date, trailers(vin), renters(name)")
    .eq("status", "active");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: any[] = [];
  for (const r of rentals ?? []) {
    const due = new Date(r.next_due_date);
    const days = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (days > 5) continue;

    const type = days < 0 ? "overdue" : "due_soon";
    const vin = r.trailers?.vin ?? "Trailer";
    const name = r.renters?.name ?? "Customer";
    const message =
      days < 0
        ? `${vin} — ${name} is ${Math.abs(days)}d overdue (was due ${r.next_due_date})`
        : days === 0
        ? `${vin} — ${name} is due today`
        : `${vin} — ${name} is due in ${days}d (${r.next_due_date})`;

    rows.push({ rental_id: r.id, type, due_date: r.next_due_date, message });
  }

  if (rows.length > 0) {
    await supabase
      .from("notifications")
      .upsert(rows, { onConflict: "rental_id,due_date,type", ignoreDuplicates: true });
  }
}
