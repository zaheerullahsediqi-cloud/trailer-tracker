"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { advanceByPeriod } from "@/lib/date";

function periodToDays(period: string, customDays?: number) {
  if (period === "weekly") return 7;
  if (period === "monthly") return 30; // informational only; monthly advancement uses real calendar months, not this count
  if (period === "semiannual") return 182; // informational only; uses real calendar months
  if (period === "annual") return 365; // informational only; uses real calendar months
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
  const security_deposit_amount = Number(formData.get("security_deposit_amount") || 0);
  const down_payment_amount = Number(formData.get("down_payment_amount") || 0);

  const period_days = periodToDays(period, customDays);
  const next_due_date = advanceByPeriod(start_date, period, period_days);

  const { error } = await supabase.from("rentals").insert({
    trailer_id,
    renter_id,
    start_date,
    period,
    period_days,
    rate,
    next_due_date,
    status: "active",
    security_deposit_amount,
    security_deposit_status: "held",
    down_payment_amount,
    down_payment_status: "not_collected",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/rentals");
}

export async function updateSecurityDeposit(id: string, formData: FormData) {
  const supabase = createClient();
  const security_deposit_amount = Number(formData.get("security_deposit_amount") || 0);
  const security_deposit_status = String(formData.get("security_deposit_status"));
  const security_deposit_returned_amount = Number(formData.get("security_deposit_returned_amount") || 0);
  const returnedDateRaw = String(formData.get("security_deposit_returned_date") || "");
  const security_deposit_returned_date = returnedDateRaw || null;

  const { error } = await supabase
    .from("rentals")
    .update({
      security_deposit_amount,
      security_deposit_status,
      security_deposit_returned_amount,
      security_deposit_returned_date,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${id}`);
}

export async function updateDownPayment(id: string, formData: FormData) {
  const supabase = createClient();
  const down_payment_amount = Number(formData.get("down_payment_amount") || 0);
  const down_payment_status = String(formData.get("down_payment_status"));
  const down_payment_collected_amount = Number(formData.get("down_payment_collected_amount") || 0);
  const collectedDateRaw = String(formData.get("down_payment_collected_date") || "");
  const down_payment_collected_date = collectedDateRaw || null;

  const { error } = await supabase
    .from("rentals")
    .update({
      down_payment_amount,
      down_payment_status,
      down_payment_collected_amount,
      down_payment_collected_date,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${id}`);
}

export async function updateRentalTerms(id: string, formData: FormData) {
  const supabase = createClient();
  const start_date = String(formData.get("start_date"));
  const period = String(formData.get("period"));
  const customDays = Number(formData.get("custom_days") || 0);
  const rate = Number(formData.get("rate") || 0);
  const next_due_date = String(formData.get("next_due_date"));
  const period_days = periodToDays(period, customDays);

  const { error } = await supabase
    .from("rentals")
    .update({ start_date, period, period_days, rate, next_due_date })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${id}`);
  revalidatePath("/rentals");
  revalidatePath("/");
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
  const next_due_date = advanceByPeriod(rental.next_due_date, rental.period, rental.period_days);
  const { error } = await supabase.from("rentals").update({ next_due_date }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${id}`);
  revalidatePath("/rentals");
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
