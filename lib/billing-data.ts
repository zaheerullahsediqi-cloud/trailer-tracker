import { rentalBalance, todayISO } from './billing';
export async function loadBillingData(supabase: any) {
  async function all(table: string, select: string) {
    const rows: any[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from(table).select(select).order('id').range(offset, offset + 999);
      if (error) throw new Error(error.message);
      rows.push(...data);
      if (data.length < 1000) return rows;
    }
  }
  const [rentals, payments, invoices, trailers] = await Promise.all([
    all('rentals', '*, trailers(vin, make, model), renters(name, email)'),
    all('payments', '*, rentals(id, trailers(vin), renters(name))'),
    all('invoices', '*'), all('trailers', '*')
  ]);
  const today = todayISO();
  const balances = new Map<string, ReturnType<typeof rentalBalance>>(rentals.map(r => [r.id, rentalBalance(r, payments, invoices, today)]));
  return { rentals, payments: payments.filter(p => p.payment_date <= today), invoices, trailers, balances, today };
}
