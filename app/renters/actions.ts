"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addRenter(formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name")).trim();
  const address = String(formData.get("address") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const drivers_license = String(formData.get("drivers_license") || "").trim() || null;
  const dobRaw = String(formData.get("date_of_birth") || "");
  const date_of_birth = dobRaw || null;

  const { error } = await supabase
    .from("renters")
    .insert({ name, address, phone, email, drivers_license, date_of_birth });
  if (error) throw new Error(error.message);
  revalidatePath("/renters");
}

export async function updateRenter(id: string, formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name")).trim();
  const address = String(formData.get("address") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const drivers_license = String(formData.get("drivers_license") || "").trim() || null;
  const dobRaw = String(formData.get("date_of_birth") || "");
  const date_of_birth = dobRaw || null;

  const { error } = await supabase
    .from("renters")
    .update({ name, address, phone, email, drivers_license, date_of_birth })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/renters");
}

export async function updateRenterNotes(id: string, notes: string) {
  const supabase = createClient();
  const { error } = await supabase.from("renters").update({ notes }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/renters/${id}`);
}

export async function deleteRenter(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("renters").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/renters");
}
