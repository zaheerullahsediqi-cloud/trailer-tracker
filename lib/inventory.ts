export const categoryLabels = {
  under_mc: "Under Our MC",
  pending_insurance: "Pending Insurance",
  rented_out: "Rented Out",
  sold: "Sold",
} as const;
export type InventoryCategory = keyof typeof categoryLabels;
export type InventoryTrailer = {
  status: string;
  inventory_category?: string;
  inventory_renter_name?: string | null;
  rental?: unknown;
};
export function inventoryCategory(t: InventoryTrailer): InventoryCategory {
  if (t.status === "sold") return "sold";
  if (t.rental || t.inventory_renter_name) return "rented_out";
  return t.inventory_category === "pending_insurance"
    ? "pending_insurance"
    : "under_mc";
}
export function availabilityLabel(t: InventoryTrailer): string {
  if (t.status === "sold") return "Sold";
  if (t.rental) return "Rented";
  if (t.inventory_renter_name) return "Rental setup needed";
  if (t.inventory_category === "pending_insurance") return "Pending insurance";
  return (
    (
      {
        available: "Available",
        maintenance: "In maintenance",
        out_of_service: "Out of service",
      } as Record<string, string>
    )[t.status] || t.status
  );
}
const compareFields = [
  "make",
  "model",
  "year",
  "plate",
  "unit_number",
  "status",
  "inventory_category",
  "inventory_renter_name",
  "buyer_name",
  "sold_date",
] as const;
type ImportRow = { vin: string; [key: string]: unknown };
export function compareInventory(
  existing: ImportRow[],
  incoming: readonly ImportRow[],
) {
  const byVin = new Map(existing.map((t) => [t.vin, t]));
  return incoming.map((record) => {
    const found = byVin.get(record.vin);
    const differences = found
      ? compareFields.filter(
          (key) =>
            String(found[key] ?? "") !==
            String(
              record[key] ?? (key === "inventory_category" ? "under_mc" : ""),
            ),
        )
      : [];
    return {
      record,
      existingId: found?.id,
      result: !found
        ? ("new" as const)
        : differences.length
          ? ("conflict" as const)
          : ("matched" as const),
      differences,
    };
  });
}
export function displaySoldDate(value?: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${month}/${day}/${year}`;
}
