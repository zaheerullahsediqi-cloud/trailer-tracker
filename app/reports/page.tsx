import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import ReportsClient from "./reports-client";

export default async function ReportsPage() {
  const supabase = createClient();
  const { trailers, rentals, payments, balances } = await loadBillingData(supabase);

  const overdueTotal = [...balances.values()].reduce((n, b) => n + b.outstanding, 0);
  const overdueCount = [...balances.values()].filter((b) => b.outstanding > 0).length;

  return (
    <ReportsClient
      rentals={rentals}
      payments={payments}
      trailers={trailers}
      overdueTotal={overdueTotal}
      overdueCount={overdueCount}
    />
  );
}
