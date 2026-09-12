"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getOrCreateSettingsId(supabase: any) {
  const { data: existing } = await supabase.from("company_settings").select("id").limit(1).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("company_settings")
    .insert({})
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id;
}

export async function updateCompanySettings(formData: FormData) {
  const supabase = createClient();
  const company_name = String(formData.get("company_name") || "").trim() || "Your Company";
  const contact_email = String(formData.get("contact_email") || "").trim() || null;
  const company_address = String(formData.get("company_address") || "").trim() || null;
  const city = String(formData.get("city") || "").trim() || null;
  const state = String(formData.get("state") || "").trim() || null;
  const zip = String(formData.get("zip") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const website = String(formData.get("website") || "").trim() || null;

  const { data: existing } = await supabase.from("company_settings").select("id").limit(1).maybeSingle();
  const payload = { company_name, contact_email, company_address, city, state, zip, phone, website };

  if (existing) {
    const { error } = await supabase
      .from("company_settings")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("company_settings").insert(payload);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/settings");
}

export async function updateInvoiceFooter(formData: FormData) {
  const supabase = createClient();
  const invoice_footer = String(formData.get("invoice_footer") || "").trim() || null;
  const id = await getOrCreateSettingsId(supabase);
  const { error } = await supabase
    .from("company_settings")
    .update({ invoice_footer, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateCompanyLogo(logoUrl: string | null) {
  const supabase = createClient();
  const id = await getOrCreateSettingsId(supabase);
  const { error } = await supabase
    .from("company_settings")
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
