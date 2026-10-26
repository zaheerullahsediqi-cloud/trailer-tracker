# Download inventory as a PDF

Open **Trailers** and click **Download inventory PDF**. A PDF is generated from the current database and downloaded to your computer, ready to attach to a message. The app does not send it to anyone automatically.

The report follows the supplied landscape inventory layout with the company header, report date, four category counts, and separate tables for Under Our MC, Pending Insurance, Rented Out, and Sold.

It includes every trailer's year/make/model, VIN and plate; unit numbers; renter names or pending renter assignments; buyer names and sold dates; and maintenance/out-of-service availability where relevant. Unit numbers keep leading zeros and dates display as MM/DD/YYYY. Empty categories are shown, and large inventories continue onto additional pages.

The PDF always includes all inventory categories, even when you are searching or filtering the on-screen list. It uses current app data, so differences from the old reference document reflect current records. Missing fields display a dash. Review and edit inaccurate/missing details in the app before exporting.

The reference company details are the default USDOT 4457566 and MC 1757440. Company name/address come from your saved company settings when set. Optional server environment variables `COMPANY_USDOT`, `COMPANY_MC` and `REPORT_TIME_ZONE` override the reference identifiers and the default America/Chicago report date timezone.

Signed-in users with inventory read access can generate the report; the route uses the same database access controls as the app. It exports inventory fields, not payments, customer contact details, or private documents.

The PDF is generated on demand and downloaded. No PDF copy or extra history record is stored in Supabase.

## Publish

Commit and push the code changes in GitHub Desktop. No Supabase migration or new service is required for this feature. The existing `pdf-lib` dependency generates the document. A clearly labeled sample using the original supplied inventory was visually checked alongside the reference PDF.
