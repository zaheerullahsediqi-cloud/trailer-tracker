# Trailer Tracker

Next.js 14 / React 18 / TypeScript, with Supabase authentication, database and private document storage, Resend email, and Vercel scheduled reminders.

## Local setup

1. Install Node.js and run `npm ci`.
2. Copy `.env.example` to `.env.local` and provide the Supabase and email settings. Never commit secrets. Keep the service-role key server-only.
3. For a new database, apply `supabase/schema.sql`, then the numbered migrations in ascending order (there is no migration 004).
4. For an existing database, review and apply `supabase/migration_010.sql` after all earlier migrations. It is transactional and deliberately stops if a trailer has multiple active rentals. Resolve those records explicitly; it does not delete or pick records automatically.
5. Run `npm run dev`.

## Verification

- `npm test`: billing calculations, reminder authorization, notification freshness, and database migration/policy tests against an isolated PGlite PostgreSQL database. No live database or email is used.
- `npm run typecheck`: TypeScript checks.
- `npm run lint`: lint checks.
- `npm run build`: production build; requires the public Supabase environment settings.

## Billing rules

Rent first becomes due one billing period after the start date, matching the original creation workflow. Scheduled charges use the start-date anniversary, including month-end and leap-year clamping. Payments apply oldest-first in integer cents. Deposits and down payments remain separate from rent payments. Future-dated payments are excluded from collected totals until their payment date. Billing uses UTC calendar dates consistently.

Outstanding includes unpaid scheduled charges due today or earlier. Overdue excludes today. Upcoming means today through five days ahead. Monthly estimated rent annualizes weekly/custom rates using 365 days divided by 12; annual rates divide by 12 and semiannual rates by 6. Reports use actual payments, not invoices, for collected money.

Invoice snapshots override the charge for their corresponding billing period. Repeated historical invoice emails do not create additional charges. Historical monthly invoice dates that drifted after February are assigned to their scheduled calendar period. Invoice dates control which invoice is prepared; advancing an invoice date never records a payment or erases a balance.

**Existing-data reconciliation is required before relying on migrated balances.** The old Mark paid action only changed a date, so payments made that way cannot be reconstructed from this repository. Record missing payments from your actual records; do not invent receipts. Historical rate changes without invoice snapshots likewise cannot be reconstructed. For old completed rentals with no end_date, balances use recorded invoices and payments only and show a reconciliation notice; no termination date or recurring charges are invented. Review and set the actual end_date in Supabase where known. Newly completed rentals save the completion date. Accrued/snapshotted terms cannot be rewritten; use a new agreement for new terms.

## Safeguards and access

Migration 010 enforces one active rental per trailer, rejects rentals for unavailable trailers, and prevents taking a rented trailer out of service. Rental deletion is blocked. Customers and trailers with rental history cannot be deleted. Sold trailers remain visible for records, are excluded from current fleet counts, and cannot be rented. Completed rentals retain their history; a new rental is needed to resume service.

Existing Supabase users without an explicit trailer_tracker_role keep their previous trusted-team access by receiving admin during migration. New users default to read-only. Administrators are determined from server-owned auth.users.raw_app_meta_data.trailer_tracker_role, never user-editable metadata. To grant or remove admin access, edit that app-metadata field through a trusted Supabase administrative tool. Read-only users may see existing edit controls, but database and storage policies reject writes. Notification read/dismiss state is shared, as in the original application.

## Invoice delivery recovery

Invoices are reserved before any email is sent. Database row locking and a unique period delivery key prevent duplicate reservation. A conditional claim permits only one send attempt at a time, and the provider receives the invoice ID as its idempotency key. A provider/network failure leaves a visible record requiring review; it is not automatically resent. A failure to save confirmation reports that the provider already accepted the invoice.

For an interrupted sending/review_required record, check the provider delivery log using the invoice number and recipient. If accepted, save its provider email ID, sent_at and delivery_status=sent in Supabase. Only if the provider confirms no acceptance, reset delivery_status to pending and retry. Never reset an uncertain delivery blindly.

## Deployment

Apply migration 010 before deploying this code. Set all environment variables on Vercel, including a nonempty CRON_SECRET. Without it the reminder endpoint returns 401. Vercel runs the reminder at 13:00 UTC daily; provider failures return 500 instead of claiming success. No live migration, deployment, or email delivery is performed by local tests.
