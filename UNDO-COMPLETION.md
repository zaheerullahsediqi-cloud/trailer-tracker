# Undo an accidental rental completion

After this update is deployed, sign in as an administrator and open the completed rental from **History → Previous rentals**.

1. Click **Undo completion**.
2. Leave **Save a correction note in history** unchecked to restore the rental without adding a correction note or extra history row. This is the default each time you open the confirmation.
3. Check that option only if you want a short dated note appended to the rental's existing note.
4. Click **Restore rental**. The original agreement becomes active again and its completion date is cleared.

Existing rental terms, payments, invoices, customer notes and documents are preserved. Restoring the original timeline can change the calculated balance. Use this only to undo a mistake; create a new agreement when a genuinely completed rental starts again after a break.

Only administrators can undo, and only the latest agreement for a trailer can be restored. Undo is blocked if another rental is active, a new renter assignment is pending, the trailer is sold/in maintenance/out of service/pending insurance, or the historical rental lacks a completion date.

No correction-history table, extra rental or payment row is created. Existing notes are not erased when the option is unchecked. Normal infrastructure/database operation logs are separate from application history.

## Deployment

The feature uses `supabase/migrations/20261025235130_undo_rental_completion.sql`, applied after the fleet inventory migration. Deploy the UI changes after this migration. Keep the migration in Git with the feature so new databases can reproduce the setup.

The database function was applied and verified on the trailer-tracker Supabase project on October 25, 2026. Commit and push the local interface changes to make the button available in the deployed app. No live rental data was changed while enabling this feature.

Verification: all 16 tests, lint, TypeScript and production build passed. Browser tests against disposable local data verified both note choices, cancellation, and the default-off reset.
