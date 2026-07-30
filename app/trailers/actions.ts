"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTrailer(formData: FormData) {
  const supabase = createClient();
  const vin = String(formData.get("vin")).trim().toUpperCase();
  const make = String(formData.get("make")).trim();
  const model = String(formData.get("model")).trim();
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const plate = String(formData.get("plate") || "").trim() || null;
  const unit_number = String(formData.get("unit_number") || "").trim() || null;
  const status = String(formData.get("status") || "available");

  const { error } = await supabase
    .from("trailers")
    .insert({ vin, make, model, year, plate, unit_number, status });
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
}

export async function updateTrailer(id: string, formData: FormData) {
  const supabase = createClient();
  const vin = String(formData.get("vin")).trim().toUpperCase();
  const make = String(formData.get("make")).trim();
  const model = String(formData.get("model")).trim();
  const year = formData.get("year") ? Number(formData.get("year")) : null;
  const plate = String(formData.get("plate") || "").trim() || null;
  const unit_number = String(formData.get("unit_number") || "").trim() || null;
  const status = String(formData.get("status") || "available");

  const { error } = await supabase
    .from("trailers")
    .update({ vin, make, model, year, plate, unit_number, status })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
}

export async function deleteTrailer(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("trailers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
}
