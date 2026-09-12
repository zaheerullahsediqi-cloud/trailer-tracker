"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addRenter(formData: FormData) {
  const supabase = createClient();
  const name = String(formData.get("name")).trim();
  const streetAddress = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const zip = String(formData.get("zip") || "").trim();
  const address = [streetAddress, [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(", ") || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const drivers_license = String(formData.get("drivers_license") || "").trim() || null;
  const dobRaw = String(formData.get("date_of_birth") || "");
  const date_of_birth = dobRaw || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  const { data, error } = await supabase
    .from("renters")
    .insert({ name, address, phone, email, drivers_license, date_of_birth, notes })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/renters");
  return data.id;
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
  const { count, error: checkError } = await supabase.from("rentals").select("id", {count:"exact",head:true}).eq("renter_id",id);
  if (checkError) throw new Error(checkError.message);
  if (count) throw new Error("This record has rental history and cannot be deleted.");
  const { error } = await supabase.from("renters").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/renters");
}

export async function uploadRenterLicense(renterId: string, path: string, filename: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("renters")
    .update({ license_document_url: path, license_document_filename: filename })
    .eq("id", renterId);
  if (error) throw new Error(error.message);
  revalidatePath(`/renters/${renterId}`);
  revalidatePath("/renters");
}

export async function deleteRenterLicense(renterId: string, path: string) {
  const supabase = createClient();
  await supabase.storage.from("documents").remove([path]);
  const { error } = await supabase
    .from("renters")
    .update({ license_document_url: null, license_document_filename: null })
    .eq("id", renterId);
  if (error) throw new Error(error.message);
  revalidatePath(`/renters/${renterId}`);
  revalidatePath("/renters");
}
