"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addDays } from "@/lib/date";

function periodToDays(period: string, customDays?: number) {
  if (period === "weekly") return 7;
  if (period === "monthly") return 30;
  return customDays && customDays > 0 ? customDays : 30;
}

export async function createRental(formData: FormData) {
  const supabase = createClient();
  const trailer_id = String(formData.get("trailer_id"));
  const renter_id = String(formData.get("renter_id"));
  const start_date = String(formData.get("start_date"));
  const period = String(formData.get("period"));
  const customDays = Number(formData.get("custom_days") || 0);
  const rate = Number(formData.get("rate") || 0);

  const period_days = periodToDays(period, customDays);
  const next_due_date = addDays(start_date, period_days);

  const { error } = await supabase.from("rentals").insert({
    trailer_id,
    renter_id,
    start_date,
    period,
    period_days,
    rate,
    next_due_date,
    status: "active",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/rentals");
}

export async function updateRentalStatus(id: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from("rentals").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/rentals");
  revalidatePath(`/rentals/${id}`);
}

export async function advanceDueDate(id: string) {
  const supabase = createClient();
  const { data: rental } = await supabase.from("rentals").select("*").eq("id", id).single();
  if (!rental) throw new Error("Rental not found");
  const next_due_date = addDays(rental.next_due_date, rental.period_days);
  const { error } = await supabase.from("rentals").update({ next_due_date }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${id}`);
  revalidatePath("/");
}

export async function uploadContract(rentalId: string, filePath: string, filename: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("rentals")
    .update({ contract_url: filePath, contract_filename: filename })
    .eq("id", rentalId);
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${rentalId}`);
}
