import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fleetSeed } from "@/lib/fleet-seed";
import { compareInventory } from "@/lib/inventory";
import ImportReview from "./review";
export default async function ImportPage() {
  const supabase = await createClient();
  const [{ data, error }, { data: admin }] = await Promise.all([
    supabase
      .from("trailers")
      .select("*")
      .in(
        "vin",
        fleetSeed.map((t) => t.vin),
      ),
    supabase.rpc("tracker_admin"),
  ]);
  if (error) throw new Error(error.message);
  return (
    <div className="space-y-5">
      <Link href="/trailers" className="text-accent">
        ← Inventory
      </Link>
      <h1 className="page-title">Review original inventory</h1>
      <p className="text-muted">
        Compare the 17 supplied trailers by VIN. Only missing VINs will be
        added. Existing records are never overwritten. Review conflicts on each
        trailer’s detail page.
      </p>
      <p className="text-muted">
        Imported renter names are assignments needing rental setup. No rates,
        start dates, invoices, or balances will be invented.
      </p>
      <ImportReview
        rows={compareInventory(data ?? [], fleetSeed)}
        canImport={!!admin}
      />
    </div>
  );
}
