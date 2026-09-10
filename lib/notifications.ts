import { loadBillingData } from './billing-data';
import { daysUntil } from './billing';
export async function syncNotifications(supabase: any) {
  const { rentals, balances, today } = await loadBillingData(supabase);
  const rows: any[] = [];
  for (const r of rentals) {
    const balance = balances.get(r.id)!;
    if (!balance.nextUnpaid) continue;
    const days = daysUntil(balance.nextUnpaid, today);
    const type = days < 0 ? 'overdue' : 'due_soon';
    const when = days < 0 ? Math.abs(days) + 'd overdue' : days === 0 ? 'due today' : 'due in ' + days + 'd';
    rows.push({ rental_id: r.id, type, due_date: balance.nextUnpaid, message: r.trailers?.vin + ' — ' + r.renters?.name + ' is ' + when + ' (' + balance.nextUnpaid + ')' });
  }
  const { data: admin, error: roleError } = await supabase.rpc("tracker_admin");
  if (roleError) throw new Error(roleError.message);
  if (rows.length && admin) {
    const { error } = await supabase.from('notifications').upsert(rows, { onConflict: 'rental_id,due_date,type' });
    if (error) throw new Error(error.message);
  }
  // Filter obsolete alerts at read time; never clear a user's read/dismissed state.
  return rows;
}
export function currentNotifications(notifications: any[], current: any[]) {
  const keys = new Set(current.map(n => [n.rental_id,n.due_date,n.type].join('|')));
  return notifications.filter(n => keys.has([n.rental_id,n.due_date,n.type].join('|'))).map(n => ({...n, message: current.find(c => c.rental_id===n.rental_id && c.due_date===n.due_date && c.type===n.type)!.message}));
}
