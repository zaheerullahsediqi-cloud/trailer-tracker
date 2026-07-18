"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCompanySettings(formData: FormData) {
  const supabase = createClient();
  const company_name = String(formData.get("company_name") || "").trim() || "Your Company";
  const contact_email = String(formData.get("contact_email") || "").trim() || null;

  const { data: existing } = await supabase.from("company_settings").select("id").limit(1).maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("company_settings")
      .update({ company_name, contact_email, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("company_settings").insert({ company_name, contact_email });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/settings");
}
