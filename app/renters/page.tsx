import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import CustomerList from "./customer-list";
import AddCustomerModal from "./add-customer-modal";

export default async function RentersPage() {
  const supabase = createClient();
  const { data: renters } = await supabase
    .from("renters")
    .select("*")
    .order("created_at", { ascending: false });

  const { rentals, balances } = await loadBillingData(supabase);

  const enriched = (renters ?? []).map((r: any) => {
    const theirActiveRentals = rentals.filter((rent: any) => rent.renter_id === r.id && rent.status === "active");
    const outstandingBalance = theirActiveRentals.reduce(
      (sum: number, rent: any) => sum + (balances.get(rent.id)?.outstanding ?? 0),
      0
    );
    return { ...r, activeRentals: theirActiveRentals.length, outstandingBalance };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title text-[28px]">Customers</h1>
          <p className="text-sm text-muted mt-1">Manage your customer relationships and view rental activity at a glance.</p>
        </div>
        <AddCustomerModal />
      </div>

      <CustomerList renters={enriched} />
    </div>
  );
}
