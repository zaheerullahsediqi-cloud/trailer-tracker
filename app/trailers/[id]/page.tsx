import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import TrailerDetailTabs from "./trailer-detail-tabs";

export default async function TrailerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: trailer } = await supabase.from("trailers").select("*").eq("id", params.id).single();
  if (!trailer) notFound();

  const { data: allRentals } = await supabase
    .from("rentals")
    .select("*, renters(name, email, phone)")
    .eq("trailer_id", params.id)
    .order("start_date", { ascending: false });

  const rentalIds = (allRentals ?? []).map((r: any) => r.id);

  const [{ data: payments }, { data: photoRows }] = await Promise.all([
    rentalIds.length
      ? supabase
          .from("payments")
          .select("*, rentals(id, renters(name))")
          .in("rental_id", rentalIds)
          .order("payment_date", { ascending: false })
      : Promise.resolve({ data: [] }),
    rentalIds.length
      ? supabase
          .from("condition_photos")
          .select("*")
          .in("rental_id", rentalIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const photoUrl = trailer.photo_url
    ? supabase.storage.from("trailer-photos").getPublicUrl(trailer.photo_url).data.publicUrl
    : null;

  let registrationUrl: string | null = null;
  let insuranceUrl: string | null = null;
  if (trailer.registration_url) {
    const { data } = await supabase.storage.from("documents").createSignedUrl(trailer.registration_url, 60 * 60);
    registrationUrl = data?.signedUrl ?? null;
  }
  if (trailer.insurance_url) {
    const { data } = await supabase.storage.from("documents").createSignedUrl(trailer.insurance_url, 60 * 60);
    insuranceUrl = data?.signedUrl ?? null;
  }

  const rentalsWithContracts = await Promise.all(
    (allRentals ?? []).map(async (r: any) => {
      let contractUrl: string | null = null;
      if (r.contract_url) {
        const { data } = await supabase.storage.from("contracts").createSignedUrl(r.contract_url, 60 * 60);
        contractUrl = data?.signedUrl ?? null;
      }
      return { ...r, contractUrl };
    })
  );

  const photosWithUrls = await Promise.all(
    (photoRows ?? []).map(async (p: any) => {
      const { data } = await supabase.storage.from("condition-photos").createSignedUrl(p.photo_path, 60 * 60);
      return { ...p, url: data?.signedUrl ?? null };
    })
  );

  return (
    <TrailerDetailTabs
      trailer={trailer}
      photoUrl={photoUrl}
      registrationUrl={registrationUrl}
      insuranceUrl={insuranceUrl}
      rentals={rentalsWithContracts}
      payments={payments ?? []}
      photos={photosWithUrls}
    />
  );
}
