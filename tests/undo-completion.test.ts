import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("undo completion preserves records, defaults to no note, and enforces admin and occupancy checks", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create role service_role; create role anon; create schema auth; create schema storage;
      create table auth.users(id uuid primary key,raw_app_meta_data jsonb);
      create function auth.role() returns text language sql as $$ select coalesce(current_setting('request.jwt.claim.role',true),'authenticated') $$;
      create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table storage.buckets(id text primary key,name text,public boolean);
      create table storage.objects(id uuid default gen_random_uuid(),bucket_id text);
      alter table storage.objects enable row level security;
      insert into auth.users values('00000000-0000-0000-0000-000000000001','{}');`);
    for (const name of [
      "schema.sql",
      ...fs
        .readdirSync("supabase")
        .filter((n) => /^migration_/.test(n))
        .sort(),
      ...fs
        .readdirSync("supabase/migrations")
        .filter((n) => n.endsWith(".sql"))
        .sort()
        .map((n) => "migrations/" + n),
    ]) {
      await db.exec(
        fs
          .readFileSync("supabase/" + name, "utf8")
          .replace('create extension if not exists "pgcrypto";', ""),
      );
    }
    const access = (await db.query<{anonymous:boolean; signed_in:boolean; privileged:boolean}>("select has_function_privilege('anon','public.undo_rental_completion(uuid,boolean)','EXECUTE') as anonymous, has_function_privilege('authenticated','public.undo_rental_completion(uuid,boolean)','EXECUTE') as signed_in, (select prosecdef from pg_proc where oid='public.undo_rental_completion(uuid,boolean)'::regprocedure) as privileged")).rows[0];
    assert.deepEqual(access,{anonymous:false,signed_in:true,privileged:false});
    const t = "10000000-0000-0000-0000-000000000010",
      c = "20000000-0000-0000-0000-000000000010",
      r = "30000000-0000-0000-0000-000000000010";
    await db.exec(`insert into trailers(id,vin,make,model) values('${t}','UNDO-VIN','Test','Flatbed');
      insert into renters(id,name) values('${c}','Test renter');
      insert into rentals(id,trailer_id,renter_id,start_date,next_due_date,rate,completion_note,created_at)
      values('${r}','${t}','${c}','2026-01-01','2026-02-01',100,'Existing customer note','2026-01-01');
      insert into payments(rental_id,amount,payment_date,notes) values('${r}',50,'2026-02-01','Original payment');
      insert into invoices(rental_id,amount,period_start,period_end,invoice_number) values('${r}',100,'2026-02-01','2026-03-01','TEST-UNDO');`);
    async function rental() {
      return (
        await db.query<any>(
          "select to_jsonb(r) as value from rentals r where id=$1",
          [r],
        )
      ).rows[0].value;
    }
    async function accounting() {
      return (
        await db.query<any>(
          "select jsonb_build_object('payments',(select jsonb_agg(to_jsonb(p)) from payments p),'invoices',(select jsonb_agg(to_jsonb(i)) from invoices i),'rental_count',(select count(*) from rentals)) as value",
        )
      ).rows[0].value;
    }
    const original = await rental(),
      money = await accounting();
    await db.exec(`update rentals set status='completed' where id='${r}';
      grant usage on schema auth to authenticated;
      insert into auth.users values('00000000-0000-0000-0000-000000000002','{}');
      set role authenticated;
      select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);`);
    await assert.rejects(
      db.query("select undo_rental_completion($1)", [r]),
      /Only an administrator/,
    );
    await db.exec(
      "select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false)",
    );
    await db.query("select undo_rental_completion($1)", [r]);
    assert.deepEqual(await rental(), original); // default false adds no note and restores the same row
    assert.deepEqual(await accounting(), money); // no new history/payment/invoice records
    assert.equal(
      (
        await db.query<any>(
          "select current_setting('trailer_tracker.undo_rental_id',true) as context",
        )
      ).rows[0].context,
      "",
    );
    await assert.rejects(
      db.query("select undo_rental_completion($1)", [r]),
      /already active/,
    );
    await db.query(
      "update rentals set status='completed',completion_note=null where id=$1",
      [r],
    );
    await db.query("select undo_rental_completion($1,false)", [r]);
    assert.equal((await rental()).completion_note, null);
    await db.query(
      "update rentals set status='completed',completion_note='Original note' where id=$1",
      [r],
    );
    await db.query("select undo_rental_completion($1,true)", [r]);
    assert.match(
      (await rental()).completion_note,
      /^Original note\nCompletion undone on .* UTC\.$/,
    );
    assert.deepEqual(await accounting(), money);
    await db.query("update rentals set status='completed' where id=$1", [r]);
    const completed = await rental();
    await assert.rejects(
      db.query("update rentals set status='active' where id=$1", [r]),
      /Completed rental history/,
    );
    for (const status of ["maintenance", "sold", "out_of_service"]) {
      await db.query("update trailers set status=$1 where id=$2", [status, t]);
      await assert.rejects(
        db.query("select undo_rental_completion($1)", [r]),
        /must be available/,
      );
      assert.deepEqual(await rental(), completed);
    }
    await db.query(
      "update trailers set status='available',inventory_category='pending_insurance' where id=$1",
      [t],
    );
    await assert.rejects(
      db.query("select undo_rental_completion($1)", [r]),
      /Clear pending insurance/,
    );
    await db.query(
      "update trailers set inventory_category='under_mc',inventory_renter_name='Other assignment' where id=$1",
      [t],
    );
    await assert.rejects(
      db.query("select undo_rental_completion($1)", [r]),
      /Resolve the new renter assignment/,
    );
    await db.query(
      "update trailers set inventory_renter_name=null where id=$1",
      [t],
    );
    await db.query("update rentals set end_date=null where id=$1", [r]);
    await assert.rejects(
      db.query("select undo_rental_completion($1)", [r]),
      /no completion date/,
    );
    await db.query("update rentals set end_date=$1 where id=$2", [
      completed.end_date,
      r,
    ]);
    const newer = (
      await db.query<{ id: string }>(
        "insert into rentals(trailer_id,renter_id,start_date,next_due_date,rate) values($1,$2,'2026-03-01','2026-04-01',120) returning id",
        [t, c],
      )
    ).rows[0].id;
    await assert.rejects(
      db.query("select undo_rental_completion($1)", [r]),
      /Another rental is already active/,
    );
    await db.query("update rentals set status='completed' where id=$1", [
      newer,
    ]);
    await assert.rejects(
      db.query("select undo_rental_completion($1)", [r]),
      /newer agreement exists/,
    );
    assert.deepEqual(await rental(), completed);
  } finally {
    await db.close();
  }
});
