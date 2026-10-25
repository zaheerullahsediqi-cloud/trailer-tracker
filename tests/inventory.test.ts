import { test } from "node:test";
import assert from "node:assert/strict";
import { fleetSeed } from "../lib/fleet-seed";
import {
  inventoryCategory,
  availabilityLabel,
  compareInventory,
  displaySoldDate,
} from "../lib/inventory";
test("category and availability remain independent", () => {
  assert.equal(
    inventoryCategory({
      status: "maintenance",
      inventory_category: "under_mc",
    }),
    "under_mc",
  );
  assert.equal(availabilityLabel({ status: "maintenance" }), "In maintenance");
  assert.equal(
    availabilityLabel({ status: "out_of_service" }),
    "Out of service",
  );
  assert.equal(
    availabilityLabel({
      status: "available",
      inventory_category: "pending_insurance",
    }),
    "Pending insurance",
  );
  assert.equal(
    inventoryCategory({ status: "available", rental: { id: "active" } }),
    "rented_out",
  );
  assert.equal(
    availabilityLabel({ status: "available", inventory_renter_name: "Name" }),
    "Rental setup needed",
  );
  assert.equal(inventoryCategory({ status: "sold" }), "sold");
});
test("import preview detects new, matching and conflicting VINs without mutating records", () => {
  const original = JSON.stringify(fleetSeed);
  const existing = [
    { ...fleetSeed[0], id: "one" },
    { ...fleetSeed[1], id: "two", plate: "OTHER" },
  ];
  const rows = compareInventory(existing, fleetSeed);
  assert.equal(rows[0].result, "matched");
  assert.equal(rows[1].result, "conflict");
  assert.deepEqual(rows[1].differences, ["plate"]);
  assert.equal(rows.filter((r) => r.result === "new").length, 15);
  assert.equal(JSON.stringify(fleetSeed), original);
  assert.equal(fleetSeed[2].unit_number, "08");
  assert.equal(fleetSeed[8].inventory_renter_name, "Mirwais Yousafi");
  assert.equal(fleetSeed[9].inventory_renter_name, "Mir Wais Yousafi");
  assert.equal(fleetSeed[9].plate, "540-8342 /ME");
  assert.equal(fleetSeed[14].vin, "13N2532CJ1525383");
  assert.equal(displaySoldDate(fleetSeed[14].sold_date), "05/11/2026");
  assert.equal(displaySoldDate(fleetSeed[15].sold_date), "06/20/2026");
  assert.equal(displaySoldDate(fleetSeed[16].sold_date), "07/25/2026");
});
