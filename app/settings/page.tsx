import { createClient } from "@/lib/supabase/server";
import { updateCompanySettings } from "./actions";
import PasswordForm from "./password-form";
import LogoUpload from "./logo-upload";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: settings } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="page-title mt-1">Settings</h1>
      </div>

      <div className="card p-5">
        <p className="eyebrow mb-2">Signed in as</p>
        <p className="text-sm font-medium text-primary">{user?.email ?? "..."}</p>
      </div>

      <LogoUpload currentLogoUrl={settings?.logo_url || null} />

      <form action={updateCompanySettings} className="card p-5 space-y-4">
        <div>
          <p className="eyebrow">Company info</p>
          <p className="text-xs text-muted mt-1">Shown on invoices sent to customers.</p>
        </div>
        <div>
          <label className="label">Company name</label>
          <input
            name="company_name"
            className="input"
            defaultValue={settings?.company_name || ""}
            placeholder="Star Link Freight Inc."
            required
          />
        </div>
        <div>
          <label className="label">Contact email (shown on invoices)</label>
          <input
            name="contact_email"
            type="email"
            className="input"
            defaultValue={settings?.contact_email || ""}
            placeholder="billing@yourcompany.com"
          />
        </div>
        <button className="btn-primary">Save company info</button>
      </form>

      <PasswordForm />
    </div>
  );
}
