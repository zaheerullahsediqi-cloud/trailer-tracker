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
  const title_number = String(formData.get("title_number") || "").trim() || null;
  const plate_type = String(formData.get("plate_type") || "").trim() || null;
  const trailer_type = String(formData.get("trailer_type") || "").trim() || null;
  const last_service_date = String(formData.get("last_service_date") || "") || null;

  const { error } = await supabase
    .from("trailers")
    .insert({ vin, make, model, year, plate, unit_number, status, title_number, plate_type, trailer_type, last_service_date });
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
  const title_number = String(formData.get("title_number") || "").trim() || null;
  const plate_type = String(formData.get("plate_type") || "").trim() || null;
  const trailer_type = String(formData.get("trailer_type") || "").trim() || null;
  const last_service_date = String(formData.get("last_service_date") || "") || null;
  const length_ft = formData.get("length_ft") ? Number(formData.get("length_ft")) : null;
  const capacity_lbs = formData.get("capacity_lbs") ? Number(formData.get("capacity_lbs")) : null;
  const sold_date = String(formData.get("sold_date") || "") || null;
  const sold_price = formData.get("sold_price") ? Number(formData.get("sold_price")) : null;
  const buyer_name = String(formData.get("buyer_name") || "").trim() || null;
  const sold_note = String(formData.get("sold_note") || "").trim() || null;

  const { error } = await supabase
    .from("trailers")
    .update({
      vin, make, model, year, plate, unit_number, status, title_number, plate_type, trailer_type, last_service_date,
      length_ft, capacity_lbs, sold_date, sold_price, buyer_name, sold_note,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
  revalidatePath(`/trailers/${id}`);
}

export async function deleteTrailer(id: string) {
  const supabase = createClient();
  const { count, error: checkError } = await supabase.from("rentals").select("id", {count:"exact",head:true}).eq("trailer_id",id);
  if (checkError) throw new Error(checkError.message);
  if (count) throw new Error("This record has rental history and cannot be deleted.");
  const { error } = await supabase.from("trailers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
}

export async function uploadTrailerPhoto(trailerId: string, path: string) {
  const supabase = createClient();
  const { error } = await supabase.from("trailers").update({ photo_url: path }).eq("id", trailerId);
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
  revalidatePath(`/trailers/${trailerId}`);
  revalidatePath("/");
}

export async function deleteTrailerPhoto(trailerId: string, path: string) {
  const supabase = createClient();
  await supabase.storage.from("trailer-photos").remove([path]);
  const { error } = await supabase.from("trailers").update({ photo_url: null }).eq("id", trailerId);
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
  revalidatePath(`/trailers/${trailerId}`);
  revalidatePath("/");
}

export async function uploadTrailerDocument(
  trailerId: string,
  docType: "registration" | "insurance",
  path: string,
  filename: string
) {
  const supabase = createClient();
  const update =
    docType === "registration"
      ? { registration_url: path, registration_filename: filename }
      : { insurance_url: path, insurance_filename: filename };
  const { error } = await supabase.from("trailers").update(update).eq("id", trailerId);
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
  revalidatePath(`/trailers/${trailerId}`);
}

export async function deleteTrailerDocument(
  trailerId: string,
  docType: "registration" | "insurance",
  path: string
) {
  const supabase = createClient();
  await supabase.storage.from("documents").remove([path]);
  const update =
    docType === "registration"
      ? { registration_url: null, registration_filename: null }
      : { insurance_url: null, insurance_filename: null };
  const { error } = await supabase.from("trailers").update(update).eq("id", trailerId);
  if (error) throw new Error(error.message);
  revalidatePath("/trailers");
  revalidatePath(`/trailers/${trailerId}`);
}
