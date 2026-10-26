# Fleet inventory update

The code is ready to review and commit in GitHub Desktop. No commit, push, live database migration, live email, or deployment was performed by this update.

## Before pushing if GitHub automatically deploys

1. Back up the live Supabase database through your Supabase backup/export process. The local source backup is not a database backup.
2. Confirm the existing database already has `schema.sql` and legacy migrations through `migration_015.sql`. Apply only missing migrations, in numeric order. Do not rerun already-applied migrations.
3. Run `supabase/migrations/20261025231048_fleet_inventory_safeguards.sql` once in the correct project's Supabase SQL Editor. It runs as a transaction and inserts no trailer records. The updated application requires its columns, functions and policies.
4. In GitHub Desktop, review the changes, commit, and push. Suggested summary: `Merge fleet inventory and fix rental history and access controls`.
5. Set the deployment Node.js version to 22 or 24 (minimum 20.9). Next.js is now 16.4.3 with React 19; request APIs and lint configuration have been migrated. Development/build retain Webpack for compatibility with this Windows setup.

No live database credentials or linked project configuration were present in the supplied directory. Database changes were verified against an isolated PostgreSQL test database, not applied to your live account.

## Import the original 17 trailers

After deploying and signing in as an administrator:

1. Open **Trailers → Review original inventory**.
2. Review the new, matching and conflicting VINs. Follow **Review trailer** for conflicts. Existing records are never overwritten, even if another import happens concurrently.
3. Click **Add missing trailers**. Repeating this action skips existing VINs.
4. For a new empty inventory, the counts will be Under Our MC 7, Pending Insurance 1, Rented Out 6, Sold 3. An existing inventory may have different counts depending on its current records and conflicts.

The six original rented assignments appear as **Rental setup needed**. Their exact renter names are retained without invented rates or start dates. Create/select the customer with the supplied name, then open **Rentals → New rental**, choose the trailer, enter the actual agreed billing terms, and confirm the assignment. Creating the agreement clears the setup marker transactionally. If the assignment has ended, clear the assignment on the trailer's Edit form before marking it sold or available. The original source record remains preserved.

## Daily use

- Click a dashboard category count to open filtered inventory.
- The inventory category and availability are separate. Maintenance and out-of-service trailers do not display as available. Pending insurance blocks rental creation until cleared.
- Use **Insurance cleared** on the trailer detail page; its maintenance/out-of-service availability remains unchanged.
- Search by VIN, plate, model, unit, renter or buyer. Sold trailers are included in the Sold category and retain history.
- Complete a rental to stop its billing schedule. Create a new agreement when service resumes; historical rentals cannot be reactivated or deleted.
- Administrators can add/edit records and manage photos. Database policies reject photo uploads, replacements and deletion by read-only users.
- **Export inventory** downloads the entire inventory as JSON, including original import text and assignment/category details. It is an inventory snapshot, not a complete database/document backup or an automatic restore facility. Keep it private.

## Local setup and checks

Install Node.js 22 or 24, run `npm ci`, copy `.env.example` to `.env.local`, and fill in your existing Supabase settings. Never commit `.env.local`. Start with `npm run dev`, then open the address printed in the terminal.

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`. Production dependencies can be checked with `npm audit --omit=dev`.

Supabase remains the persistent database and document store. This is not an offline application; internet access and your existing Supabase project are required. The 17 source records are intentionally included in the repository because the owner requested their merge; protect repository access appropriately.

## Verification completed

- All 15 automated tests passed, including isolated PostgreSQL migration, photo-policy and inventory-import checks.
- TypeScript and ESLint checks passed.
- The Next.js 16.4.3 production build passed.
- Production dependency audit: zero known vulnerabilities at verification time.
- Browser checks against a disposable local backend confirmed sign-in, 17-record import, 7/1/6/3 counts, exact plate search, edit/save, renter setup visibility, and insurance clearance preserving maintenance availability.
- No live database data or email was used for these checks.

## Optional-note Undo completion

The new Undo completion feature is documented in [UNDO-COMPLETION.md](UNDO-COMPLETION.md). Its database migration was applied on October 25, 2026; commit and push the associated UI changes. Notes are off by default, and no extra history rows are created.
