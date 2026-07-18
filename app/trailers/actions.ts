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

  const { error } = await supabase.from("trailers").insert({ vin, make, model, year, plate });
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

  const { error } = await supabase
    .from("trailers")
    .update({ vin, make, model, year, plate })
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
