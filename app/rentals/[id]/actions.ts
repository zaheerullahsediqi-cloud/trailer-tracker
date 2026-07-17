"use server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/invoice";
import { getResend, FROM_EMAIL, COMPANY_NAME, OWNER_EMAIL } from "@/lib/resend";
import { revalidatePath } from "next/cache";

async function loadRentalBundle(rentalId: string) {
  const supabase = createClient();
  const { data: rental, error } = await supabase
    .from("rentals")
    .select("*, trailers(*), renters(*)")
    .eq("id", rentalId)
    .single();
  if (error || !rental) throw new Error("Rental not found");
  return rental;
}

export async function sendInvoiceEmail(rentalId: string) {
  const rental = await loadRentalBundle(rentalId);
  const supabase = createClient();

  const periodStart = rental.next_due_date; // billing for the upcoming period
  const periodEndDate = new Date(rental.next_due_date);
  periodEndDate.setDate(periodEndDate.getDate() + rental.period_days);
  const periodEnd = periodEndDate.toISOString().slice(0, 10);

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("rental_id", rentalId);
  const invoiceNumber = `${rental.trailers.vin.slice(-6)}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber,
    companyName: COMPANY_NAME,
    companyEmail: OWNER_EMAIL,
    trailer: rental.trailers,
    renter: rental.renters,
    periodStart,
    periodEnd,
    rate: Number(rental.rate),
    dueDate: rental.next_due_date,
  });

  if (!rental.renters.email) {
    throw new Error("This renter has no email on file. Add one on the Renters page.");
  }

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: rental.renters.email,
    subject: `Invoice ${invoiceNumber} — Trailer ${rental.trailers.vin}`,
    text: `Hi ${rental.renters.name},\n\nPlease find attached your invoice for trailer ${rental.trailers.vin} (${rental.trailers.make} ${rental.trailers.model}) for the period ${periodStart} to ${periodEnd}.\n\nAmount due: $${Number(rental.rate).toFixed(2)}\nDue date: ${rental.next_due_date}\n\nThank you,\n${COMPANY_NAME}`,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
  });

  await supabase.from("invoices").insert({
    rental_id: rentalId,
    amount: rental.rate,
    period_start: periodStart,
    period_end: periodEnd,
    sent_to: rental.renters.email,
    sent_at: new Date().toISOString(),
  });

  revalidatePath(`/rentals/${rentalId}`);
}

export async function deleteRental(rentalId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("rentals").delete().eq("id", rentalId);
  if (error) throw new Error(error.message);
}
