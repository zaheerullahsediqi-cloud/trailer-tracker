import {
  availabilityLabel,
  inventoryCategory,
  type InventoryCategory,
} from "./inventory";

export interface InventoryPdfTrailer {
  id: string;
  vin: string;
  make: string;
  model: string;
  year?: number | string | null;
  plate?: string | null;
  unit_number?: string | null;
  status: string;
  inventory_category?: string;
  inventory_renter_name?: string | null;
  buyer_name?: string | null;
  sold_date?: string | null;
}
export interface InventoryPdfRental {
  trailer_id: string;
  status: string;
  renters: { name?: string | null } | { name?: string | null }[] | null;
}
export interface InventoryPdfRow {
  id: string;
  category: InventoryCategory;
  makeModel: string;
  vin: string;
  plate: string;
  unit: string;
  renter: string;
  buyer: string;
  soldDate: string;
  availability: string;
}
export function buildInventoryPdfRows(
  trailers: InventoryPdfTrailer[],
  rentals: InventoryPdfRental[],
): InventoryPdfRow[] {
  const active = new Map<string, InventoryPdfRental>();
  for (const rental of rentals) {
    if (rental.status !== "active") continue;
    if (active.has(rental.trailer_id))
      throw new Error(
        "A trailer has more than one active rental. Review the inventory before exporting.",
      );
    active.set(rental.trailer_id, rental);
  }
  return trailers
    .map((trailer) => {
      const rental = active.get(trailer.id);
      const renter = Array.isArray(rental?.renters)
        ? rental.renters[0]
        : rental?.renters;
      const enriched = { ...trailer, rental };
      return {
        id: trailer.id,
        category: inventoryCategory(enriched),
        makeModel: [trailer.year, trailer.make, trailer.model]
          .filter(
            (value) => value !== null && value !== undefined && value !== "",
          )
          .join(" "),
        vin: trailer.vin,
        plate: trailer.plate || "",
        unit: trailer.unit_number || "",
        renter: renter?.name || trailer.inventory_renter_name || "",
        buyer: trailer.buyer_name || "",
        soldDate: trailer.sold_date || "",
        availability: availabilityLabel(enriched),
      };
    })
    .sort((a, b) => {
      if (a.unit && b.unit)
        return (
          a.unit.localeCompare(b.unit, "en", { numeric: true }) ||
          a.vin.localeCompare(b.vin)
        );
      if (a.unit || b.unit) return a.unit ? -1 : 1;
      return (
        a.makeModel.localeCompare(b.makeModel) || a.vin.localeCompare(b.vin)
      );
    });
}

// Fetch only the inventory fields needed for this shareable report. Do not load
// payments, invoice snapshots, customer contact details, or private document URLs.
export async function loadInventoryPdfData(supabase: any) {
  async function all(table: string, fields: string, activeOnly = false) {
    const result: any[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabase.from(table).select(fields);
      if (activeOnly) query = query.eq("status", "active");
      const { data, error } = await query
        .order("id")
        .range(offset, offset + 999);
      if (error) throw new Error(error.message);
      result.push(...(data ?? []));
      if (!data || data.length < 1000) return result;
    }
  }
  const [trailers, rentals, settings] = await Promise.all([
    all(
      "trailers",
      "id,vin,make,model,year,plate,unit_number,status,inventory_category,inventory_renter_name,buyer_name,sold_date",
    ),
    all("rentals", "trailer_id,status,renters(name)", true),
    supabase
      .from("company_settings")
      .select("company_name,company_address,city,state,zip")
      .limit(1)
      .maybeSingle(),
  ]);
  if (settings.error) throw new Error(settings.error.message);
  return {
    rows: buildInventoryPdfRows(trailers, rentals),
    settings: settings.data,
  };
}
