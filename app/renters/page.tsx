import { createClient } from "@/lib/supabase/server";
import { loadBillingData } from "@/lib/billing-data";
import { addRenter } from "./actions";
import ToggleForm from "../toggle-form";
import CustomerList from "./customer-list";

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
      </div>

      <ToggleForm label="Add Customer">
      <form action={addRenter} className="card p-5 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Full name</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input name="phone" className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" className="input" />
        </div>
        <div>
          <label className="label">Driver's license # (optional, for lease agreements)</label>
          <input name="drivers_license" className="input" />
        </div>
        <div>
          <label className="label">Date of birth (optional, for lease agreements)</label>
          <input name="date_of_birth" type="date" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Address</label>
          <input name="address" className="input" />
        </div>
        <div className="sm:col-span-2">
          <button className="btn-primary">Add customer</button>
        </div>
      </form>
      </ToggleForm>

      <CustomerList renters={enriched} />
    </div>
  );
}
