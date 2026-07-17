"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addRenter(formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name")).trim();
  const address = String(formData.get("address") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;

  const { error } = await supabase.from("renters").insert({ name, address, phone, email });
  if (error) throw new Error(error.message);
  revalidatePath("/renters");
}

export async function deleteRenter(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("renters").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/renters");
}
