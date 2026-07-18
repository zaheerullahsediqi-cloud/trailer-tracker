"use server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/invoice";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { getCompanySettings } from "@/lib/settings";
import { advanceByPeriod } from "@/lib/date";
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
  const { companyName, contactEmail } = await getCompanySettings(supabase);

  const periodStart = rental.next_due_date; // billing for the upcoming period
  const periodEnd = advanceByPeriod(rental.next_due_date, rental.period, rental.period_days);

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("rental_id", rentalId);
  const invoiceNumber = `${rental.trailers.vin.slice(-6)}-${String((count ?? 0) + 1).padStart(3, "0")}`;

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber,
    companyName,
    companyEmail: contactEmail,
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
  const { data: sendData, error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: rental.renters.email,
    subject: `Invoice ${invoiceNumber} — Trailer ${rental.trailers.vin}`,
    text: `Hi ${rental.renters.name},\n\nPlease find attached your invoice for trailer ${rental.trailers.vin} (${rental.trailers.make} ${rental.trailers.model}) for the period ${periodStart} to ${periodEnd}.\n\nAmount due: $${Number(rental.rate).toFixed(2)}\nDue date: ${rental.next_due_date}\n\nThank you,\n${companyName}`,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
  });

  if (sendError) {
    // Resend returns {error} instead of throwing — surface it so the UI
    // doesn't show "Invoice sent" when it wasn't.
    throw new Error(`Resend rejected the email: ${sendError.message || JSON.stringify(sendError)}`);
  }
  if (!sendData?.id) {
    throw new Error("Resend did not confirm the email was sent. Check your RESEND_API_KEY and INVOICE_FROM_EMAIL.");
  }

  await supabase.from("invoices").insert({
    rental_id: rentalId,
    invoice_number: invoiceNumber,
    amount: rental.rate,
    period_start: periodStart,
    period_end: periodEnd,
    sent_to: rental.renters.email,
    sent_at: new Date().toISOString(),
  });

  revalidatePath(`/rentals/${rentalId}`);
  revalidatePath("/rentals");
}

export async function deleteRental(rentalId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("rentals").delete().eq("id", rentalId);
  if (error) throw new Error(error.message);
}
