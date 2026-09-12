import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import NewRentalModal from "./new-rental-modal";
import RentalList from "./rental-list";

export default async function RentalsPage() {
  const supabase = createClient();
  const [{ data: rentals }, { data: trailers }, { data: renters }] = await Promise.all([
    supabase
      .from("rentals")
      .select("*, trailers(id, vin, unit_number, make, model, trailer_type, photo_url), renters(name)")
      .order("created_at", { ascending: false }),
    supabase.from("trailers").select("id, vin, make, model").eq("status", "available").order("vin"),
    supabase.from("renters").select("id, name").order("name"),
  ]);

  const occupied = new Set((rentals ?? []).filter((r: any) => r.status === "active").map((r: any) => r.trailer_id));
  const availableTrailers = (trailers ?? []).filter((t: any) => !occupied.has(t.id));

  const activeRentals = (rentals ?? [])
    .filter((r: any) => r.status === "active")
    .map((r: any) => ({
      ...r,
      trailers: r.trailers
        ? {
            ...r.trailers,
            photoUrl: r.trailers.photo_url
              ? supabase.storage.from("trailer-photos").getPublicUrl(r.trailers.photo_url).data.publicUrl
              : null,
          }
        : null,
    }));

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-title text-[28px]">Rentals</h1>
          <p className="text-sm text-muted mt-1">Active rental agreements for our trailer fleet.</p>
          <Link href="/history?view=rentals" className="text-accent underline text-sm">View previous rentals</Link>
        </div>
        <NewRentalModal trailers={availableTrailers} renters={renters ?? []} />
      </div>

      <RentalList rentals={activeRentals} />
    </div>
  );
}
