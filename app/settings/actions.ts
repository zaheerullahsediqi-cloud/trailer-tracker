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

  const { data: existing } = await supabase.from("company_settings").select("id").limit(1).maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("company_settings")
      .update({ company_name, contact_email, company_address, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("company_settings")
      .insert({ company_name, contact_email, company_address });
    if (error) throw new Error(error.message);
  }
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
