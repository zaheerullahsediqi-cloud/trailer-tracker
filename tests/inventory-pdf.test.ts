import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { fleetSeed } from "../lib/fleet-seed";
import {
  buildInventoryPdfRows,
  loadInventoryPdfData,
  type InventoryPdfTrailer,
} from "../lib/inventory-pdf-data";
import {
  generateInventoryPdf,
  inventoryReportDate,
  wrapInventoryText,
} from "../lib/inventory-pdf";

const originals = fleetSeed.map((record, i) => ({ ...record, id: String(i) }));
test("inventory report includes all categories and preserves VINs, plates, units, names and dates", async () => {
  const rows = buildInventoryPdfRows(originals, []);
  assert.equal(rows.length, 17);
  assert.deepEqual(
    ["under_mc", "pending_insurance", "rented_out", "sold"].map(
      (category) => rows.filter((r) => r.category === category).length,
    ),
    [7, 1, 6, 3],
  );
  for (const trailer of originals) {
    const row = rows.find((r) => r.id === trailer.id)!;
    assert.equal(row.vin, trailer.vin);
    assert.equal(row.plate, trailer.plate);
    assert.equal(row.unit, trailer.unit_number || "");
    assert.equal(row.renter, trailer.inventory_renter_name || "");
    assert.equal(row.buyer, trailer.buyer_name || "");
    assert.equal(row.soldDate, trailer.sold_date || "");
  }
  const pdf = await PDFDocument.load(
    await generateInventoryPdf({
      rows,
      generatedAt: new Date("2026-10-25T18:00:00Z"),
    }),
  );
  assert.equal(pdf.getPageCount(), 2);
  assert.equal(pdf.getTitle(), "Trailer Inventory Report");
  for (const page of pdf.getPages()) {
    assert.equal(page.getWidth(), 792);
    assert.equal(page.getHeight(), 612);
  }
});
test("inventory report uses current rentals and availability instead of original template counts", () => {
  const trailer = { ...originals[7], inventory_category: "pending_insurance" };
  const rows = buildInventoryPdfRows(
    [trailer],
    [
      {
        trailer_id: trailer.id,
        status: "active",
        renters: { name: "Current renter" },
      },
      {
        trailer_id: trailer.id,
        status: "completed",
        renters: { name: "Old renter" },
      },
    ],
  );
  assert.equal(rows[0].category, "rented_out");
  assert.equal(rows[0].renter, "Current renter");
  const maintenance = buildInventoryPdfRows(
    [{ ...originals[0], status: "maintenance" }],
    [],
  )[0];
  assert.equal(maintenance.availability, "In maintenance");
  assert.equal(maintenance.category, "under_mc");
  assert.throws(
    () =>
      buildInventoryPdfRows(
        [trailer],
        [
          { trailer_id: trailer.id, status: "active", renters: null },
          { trailer_id: trailer.id, status: "active", renters: null },
        ],
      ),
    /more than one active/,
  );
});
test("inventory PDF paginates growing inventories and long names without truncation", async () => {
  const rows = buildInventoryPdfRows(
    Array.from({ length: 95 }, (_, i) => ({
      ...originals[i % 17],
      id: String(i),
      vin: "TESTVIN" + String(i).padStart(10, "0"),
    })),
    [],
  );
  rows.find((r) => r.category === "sold")!.buyer =
    "A long customer name ".repeat(250);
  const pdf = await PDFDocument.load(await generateInventoryPdf({ rows }));
  assert.ok(pdf.getPageCount() > 3);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const longWord = "VINWITHOUTSPACES".repeat(25),
    lines = wrapInventoryText(longWord, font, 9, 70);
  assert.equal(lines.join(""), longWord);
  assert.ok(lines.every((line) => font.widthOfTextAtSize(line, 9) <= 70));
});
test("empty inventory exports and report dates use the configured calendar timezone", async () => {
  const pdf = await PDFDocument.load(await generateInventoryPdf({ rows: [] }));
  assert.equal(pdf.getPageCount(), 2);
  assert.equal(
    inventoryReportDate(new Date("2026-10-26T02:00:00Z")).filename,
    "2026-10-25",
  );
  assert.equal(
    inventoryReportDate(new Date("2026-10-26T02:00:00Z"), "UTC").filename,
    "2026-10-26",
  );
});
test("inventory data loader retrieves more than 1000 records and excludes unrelated personal/billing data", async () => {
  const records: InventoryPdfTrailer[] = Array.from(
    { length: 1002 },
    (_, i) => ({ ...originals[0], id: String(i), vin: "VIN" + i }),
  );
  const calls: { table: string; fields?: string; filter?: string }[] = [];
  const client = {
    from(table: string) {
      const call: { table: string; fields?: string; filter?: string } = {
        table,
      };
      calls.push(call);
      return {
        select(fields: string) {
          call.fields = fields;
          return this;
        },
        eq(field: string, value: string) {
          call.filter = field + "=" + value;
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
        async range(start: number, end: number) {
          return {
            data: table === "trailers" ? records.slice(start, end + 1) : [],
            error: null,
          };
        },
        async maybeSingle() {
          return { data: { company_name: "Test Company" }, error: null };
        },
      };
    },
  };
  const result = await loadInventoryPdfData(client);
  assert.equal(result.rows.length, 1002);
  assert.equal(result.settings.company_name, "Test Company");
  assert.ok(calls.filter((c) => c.table === "trailers").length >= 2);
  assert.equal(
    calls.find((c) => c.table === "rentals")?.filter,
    "status=active",
  );
  assert.ok(
    calls.every((c) =>
      ["trailers", "rentals", "company_settings"].includes(c.table),
    ),
  );
  assert.ok(
    calls.every(
      (c) =>
        !/(phone|email|address|snapshot)/.test(c.fields || "") ||
        c.table === "company_settings",
    ),
  );
});
