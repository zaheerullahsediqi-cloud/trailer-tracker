import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { fleetSeed } from "../lib/fleet-seed";
import { inventoryCategory } from "../lib/inventory";
test("database migration enforces rental, history, invoice and role safeguards", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create role service_role; create schema auth; create schema storage;
 create table auth.users(id uuid primary key, raw_app_meta_data jsonb);
 create function auth.role() returns text language sql as $$ select coalesce(current_setting('request.jwt.claim.role',true),'authenticated') $$;
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text); alter table storage.objects enable row level security;
 insert into auth.users values ('00000000-0000-0000-0000-000000000001','{}');`);
    for (const name of [
      "schema.sql",
      ...fs
        .readdirSync("supabase")
        .filter((n) => /^migration_/.test(n))
        .sort(),
    ]) {
      await db.exec(
        fs
          .readFileSync("supabase/" + name, "utf8")
          .replace('create extension if not exists "pgcrypto";', ""),
      );
    }
    for (const name of fs
      .readdirSync("supabase/migrations")
      .filter((n) => n.endsWith(".sql"))
      .sort())
      await db.exec(fs.readFileSync("supabase/migrations/" + name, "utf8"));
    const t = "10000000-0000-0000-0000-000000000001",
      c = "20000000-0000-0000-0000-000000000001",
      r = "30000000-0000-0000-0000-000000000001";
    await db.exec(`insert into trailers(id,vin,make,model) values ('${t}','VIN','Make','Model'); insert into renters(id,name) values ('${c}','Customer');
 insert into rentals(id,trailer_id,renter_id,start_date,next_due_date,rate) values ('${r}','${t}','${c}','2026-01-01','2026-02-01',100);`);
    await assert.rejects(
      db.exec(
        `insert into rentals(trailer_id,renter_id,start_date,next_due_date) values ('${t}','${c}','2026-01-01','2026-02-01')`,
      ),
      /duplicate/,
    );
    await assert.rejects(
      db.exec(`update trailers set status='maintenance' where id='${t}'`),
      /Complete the active rental/,
    );
    await assert.rejects(
      db.exec(`delete from trailers where id='${t}'`),
      /foreign key/,
    );
    await assert.rejects(
      db.exec(`delete from renters where id='${c}'`),
      /foreign key/,
    );
    await assert.rejects(
      db.exec(`delete from rentals where id='${r}'`),
      /history is preserved/,
    );
    await assert.rejects(
      db.exec(`insert into payments(rental_id,amount) values ('${r}',-1)`),
      /check constraint/,
    );
    await assert.rejects(
      db.exec(`update trailers set status='sold' where id='${t}'`),
      /Complete the active rental/,
    );
    const sql = `select (reserve_invoice('${r}','{"renters":{"email":"customer@example.com"}}')).id`;
    const a = await db.query(sql),
      b = await db.query(sql);
    assert.deepEqual(a.rows, b.rows);
    await assert.rejects(
      db.exec(`update rentals set rate=200 where id='${r}'`),
      /Historical billing terms/,
    );
    await db.exec(
      `update rentals set status='completed' where id='${r}'; update trailers set status='maintenance' where id='${t}'`,
    );
    await assert.rejects(
      db.exec(`update rentals set status='active' where id='${r}'`),
      /Completed rental history/,
    );
    await assert.rejects(
      db.exec(
        `insert into rentals(trailer_id,renter_id,start_date,next_due_date) values ('${t}','${c}','2026-01-01','2026-02-01')`,
      ),
      /must be available/,
    );
    await db.exec(`update trailers set status='sold' where id='${t}'`);
    await assert.rejects(
      db.exec(
        `insert into rentals(trailer_id,renter_id,start_date,next_due_date) values ('${t}','${c}','2026-01-01','2026-02-01')`,
      ),
      /must be available/,
    );
    await db.exec(`grant usage on schema auth,storage to authenticated; grant select,insert,update,delete on storage.objects to authenticated;
 insert into storage.objects(bucket_id) values ('trailer-photos');
 insert into auth.users values ('00000000-0000-0000-0000-000000000002','{}');
 set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);`);
    assert.equal(
      (await db.query<{ admin: boolean }>("select tracker_admin() as admin"))
        .rows[0].admin,
      false,
    );
    assert.equal((await db.query("select * from rentals")).rows.length, 1);
    await assert.rejects(
      db.exec(
        "insert into storage.objects(bucket_id) values ('trailer-photos')",
      ),
      /row-level security/,
    );
    assert.equal(
      (
        await db.query(
          "update storage.objects set bucket_id='trailer-photos' where bucket_id='trailer-photos' returning id",
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "delete from storage.objects where bucket_id='trailer-photos' returning id",
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select import_fleet_inventory($1::jsonb)", [
        JSON.stringify(fleetSeed),
      ]),
      /Administrator access/,
    );
    await assert.rejects(
      db.exec("insert into renters(name) values ('Blocked')"),
      /row-level security/,
    );
    await db.exec(
      "select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)",
    );
    assert.equal(
      (await db.query<{ admin: boolean }>("select tracker_admin() as admin"))
        .rows[0].admin,
      true,
    );
    await db.exec("insert into renters(name) values ('Allowed')");
    await db.exec(
      "insert into storage.objects(bucket_id) values ('trailer-photos')",
    );
    assert.equal(
      (
        await db.query(
          "update storage.objects set bucket_id='trailer-photos' where bucket_id='trailer-photos' returning id",
        )
      ).rows.length,
      2,
    );
    assert.equal(
      (
        await db.query(
          "delete from storage.objects where bucket_id='trailer-photos' returning id",
        )
      ).rows.length,
      2,
    );
    const imported = await db.query<{
      result: { inserted: number; skipped: number };
    }>("select import_fleet_inventory($1::jsonb) as result", [
      JSON.stringify(fleetSeed),
    ]);
    assert.deepEqual(imported.rows[0].result, { inserted: 17, skipped: 0 });
    assert.deepEqual(
      (
        await db.query<{ result: unknown }>(
          "select import_fleet_inventory($1::jsonb) as result",
          [JSON.stringify(fleetSeed)],
        )
      ).rows[0].result,
      { inserted: 0, skipped: 17 },
    );
    const stored = (
      await db.query<any>(
        "select * from trailers where source_record is not null",
      )
    ).rows;
    assert.deepEqual(
      ["under_mc", "pending_insurance", "rented_out", "sold"].map(
        (c) => stored.filter((t) => inventoryCategory(t) === c).length,
      ),
      [7, 1, 6, 3],
    );
    for (const expected of fleetSeed) {
      const actual = stored.find((t) => t.vin === expected.vin);
      assert.ok(actual);
      for (const key of [
        "vin",
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
        "source_record",
      ] as const)
        assert.deepEqual(
          actual[key] instanceof Date
            ? actual[key].toISOString().slice(0, 10)
            : actual[key],
          expected[key],
          expected.vin + " " + key,
        );
    }
    assert.equal((await db.query("select * from rentals")).rows.length, 1); // import creates no billing
    const pending = stored.find(
      (t) => t.inventory_category === "pending_insurance",
    );
    await assert.rejects(
      db.query(
        "insert into rentals(trailer_id,renter_id,start_date,next_due_date) values ($1,$2,'2026-01-01','2026-02-01')",
        [pending.id, c],
      ),
      /Clear pending insurance/,
    );
    const assignment = stored.find((t) => t.inventory_renter_name);
    await assert.rejects(
      db.query(
        "insert into rentals(trailer_id,renter_id,start_date,next_due_date) values ($1,$2,'2026-01-01','2026-02-01')",
        [assignment.id, c],
      ),
      /Choose the assigned renter/,
    );
    const assignedRenter = (
      await db.query<{ id: string }>(
        "insert into renters(name) values ($1) returning id",
        [assignment.inventory_renter_name],
      )
    ).rows[0].id;
    const agreement = (
      await db.query<{ id: string }>(
        "insert into rentals(trailer_id,renter_id,start_date,next_due_date,rate) values ($1,$2,'2026-01-01','2026-02-01',100) returning id",
        [assignment.id, assignedRenter],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query<any>(
          "select inventory_renter_name from trailers where id=$1",
          [assignment.id],
        )
      ).rows[0].inventory_renter_name,
      null,
    );
    await assert.rejects(
      db.query(
        "update trailers set inventory_category='pending_insurance' where id=$1",
        [assignment.id],
      ),
      /Complete the rental assignment/,
    );
    await db.query("update rentals set status='completed' where id=$1", [
      agreement,
    ]);
    const endDate = (
      await db.query<any>("select end_date from rentals where id=$1", [
        agreement,
      ])
    ).rows[0].end_date;
    await assert.rejects(
      db.query("update rentals set status='active' where id=$1", [agreement]),
      /Completed rental history/,
    );
    assert.deepEqual(
      (
        await db.query<any>("select end_date from rentals where id=$1", [
          agreement,
        ])
      ).rows[0].end_date,
      endDate,
    );
    await assert.rejects(
      db.query("update trailers set source_record='{}' where id=$1", [
        assignment.id,
      ]),
      /original import source/,
    );
    // A conflict must retain the existing record rather than overwrite it on reimport.
    await db.query("update trailers set plate='KEEP-EXISTING' where id=$1", [
      assignment.id,
    ]);
    await db.query("select import_fleet_inventory($1::jsonb)", [
      JSON.stringify(fleetSeed),
    ]);
    assert.equal(
      (
        await db.query<any>("select plate from trailers where id=$1", [
          assignment.id,
        ])
      ).rows[0].plate,
      "KEEP-EXISTING",
    );
    await db.exec(
      "reset role; grant usage on schema public,auth to service_role; set role service_role; select set_config('request.jwt.claim.role','service_role',false)",
    );
    assert.equal(
      (await db.query<{ admin: boolean }>("select tracker_admin() as admin"))
        .rows[0].admin,
      true,
    );
  } finally {
    await db.close();
  }
});
