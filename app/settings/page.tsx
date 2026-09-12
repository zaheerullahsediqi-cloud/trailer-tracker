import { createClient } from "@/lib/supabase/server";
import { updateCompanySettings } from "./actions";
import PasswordForm from "./password-form";
import LogoUpload from "./logo-upload";
import SettingsTabs from "./settings-tabs";
import InvoiceFooterForm from "./invoice-footer-form";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA",
  "ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: settings } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();

  const profileTab = (
    <div className="grid lg:grid-cols-3 gap-6">
      <form action={updateCompanySettings} className="lg:col-span-2 card p-5 space-y-4">
        <div>
          <p className="eyebrow">Company Information</p>
          <p className="text-xs text-muted mt-1">
            Update your company details. This information appears on invoices and customer communications.
          </p>
        </div>
        <div>
          <label className="label">Company Name</label>
          <input
            name="company_name"
            className="input"
            defaultValue={settings?.company_name || ""}
            placeholder="Star Link Freight Inc."
            required
          />
        </div>
        <div>
          <label className="label">Address</label>
          <input
            name="company_address"
            className="input"
            defaultValue={settings?.company_address || ""}
            placeholder="1234 Logistics Way"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">City</label>
            <input name="city" className="input" defaultValue={settings?.city || ""} />
          </div>
          <div>
            <label className="label">State</label>
            <select name="state" className="input" defaultValue={settings?.state || ""}>
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">ZIP Code</label>
            <input name="zip" className="input" defaultValue={settings?.zip || ""} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone Number</label>
            <input name="phone" className="input" defaultValue={settings?.phone || ""} placeholder="(555) 555-0100" />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              name="contact_email"
              type="email"
              className="input"
              defaultValue={settings?.contact_email || ""}
              placeholder="billing@yourcompany.com"
            />
          </div>
        </div>
        <div>
          <label className="label">Website</label>
          <input name="website" className="input" defaultValue={settings?.website || ""} placeholder="www.yourcompany.com" />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button className="btn-primary">Save Changes</button>
          {settings?.updated_at && (
            <p className="text-xs text-muted">
              Last updated {new Date(settings.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </form>

      <div className="space-y-4">
        <div className="card p-5">
          <p className="eyebrow mb-2">Signed in as</p>
          <p className="text-sm font-medium text-primary dark:text-white">{user?.email ?? "..."}</p>
        </div>
        <PasswordForm />
      </div>
    </div>
  );

  const brandingTab = <LogoUpload currentLogoUrl={settings?.logo_url || null} />;

  const invoiceTab = <InvoiceFooterForm initialValue={settings?.invoice_footer || ""} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title text-[28px]">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your company details, branding and invoice preferences.</p>
      </div>
      <SettingsTabs profile={profileTab} branding={brandingTab} invoice={invoiceTab} />
    </div>
  );
}
