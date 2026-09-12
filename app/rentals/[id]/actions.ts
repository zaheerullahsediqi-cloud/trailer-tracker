"use server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/invoice";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { getCompanySettings, fetchLogoForPdf } from "@/lib/settings";
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
  const { companyName, contactEmail, logoUrl, invoiceFooter } = await getCompanySettings(supabase);
  const logo = await fetchLogoForPdf(logoUrl);

  if (!rental.renters.email) throw new Error('Add an email address for this renter first.');
  const { data: invoice, error: reserveError } = await supabase.rpc('reserve_invoice', { p_rental_id: rentalId, p_snapshot: rental });
  if (reserveError || !invoice) throw new Error(reserveError?.message || 'Could not reserve invoice');
  if (invoice.sent_at || invoice.delivery_status === 'sent') throw new Error('This billing period already has a sent invoice.');
  const { data: claimed, error: claimError } = await supabase.from('invoices').update({delivery_status:'sending', delivery_error:null}).eq('id',invoice.id).in('delivery_status',['pending','failed']).select('id').maybeSingle();
  if (claimError || !claimed) throw new Error('Invoice is already sending or needs delivery review. Check invoice history before retrying.');
  const invoiceNumber = invoice.invoice_number;
  const snapshot = invoice.snapshot;
  let sendData: any;
  try {
  const pdfBytes = await generateInvoicePdf({
    invoiceNumber,
    companyName,
    companyEmail: contactEmail,
    footerText: invoiceFooter,
    logoBytes: logo?.bytes,
    logoContentType: logo?.contentType,
    trailer: snapshot.trailers,
    renter: snapshot.renters,
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    rate: Number(invoice.amount),
    dueDate: invoice.period_start,
  });

  if (!rental.renters.email) {
    throw new Error("This renter has no email on file. Add one on the Renters page.");
  }

  const resend = getResend();
  const { data, error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: invoice.sent_to,
    subject: `Invoice ${invoiceNumber} — Trailer ${rental.trailers.vin}`,
    text: `Please find attached invoice ${invoiceNumber}. Amount due: USD ${Number(invoice.amount).toFixed(2)}. Due date: ${invoice.period_start}.`,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
  }, { idempotencyKey: invoice.id });

  sendData = data;
  if (sendError) {
    throw new Error(`Resend rejected the email: ${sendError.message || JSON.stringify(sendError)}`);
  }
  if (!sendData?.id) {
    throw new Error("Resend did not confirm the email was sent. Check your RESEND_API_KEY and INVOICE_FROM_EMAIL.");
  }

  } catch (error: any) {
    // Delivery can be uncertain after a network failure: do not blindly resend.
    await supabase.from('invoices').update({delivery_status:'review_required', delivery_error:error.message}).eq('id',invoice.id);
    throw error;
  }
  const { error: saveError } = await supabase.from('invoices').update({delivery_status:'sent', email_id:sendData.id, sent_at:new Date().toISOString()}).eq('id',invoice.id).select('id').single();
  if (saveError) throw new Error('Email provider accepted invoice ' + invoiceNumber + ', but delivery status could not be saved. Do not resend; review invoice history.');
  revalidatePath(`/rentals/${rentalId}`);
  revalidatePath("/", "layout");
}

export async function deleteRental(rentalId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("rentals").delete().eq("id", rentalId);
  if (error) throw new Error(error.message);
  revalidatePath("/rentals");
  revalidatePath("/history");
  revalidatePath("/", "layout");
}

export async function recordPayment(rentalId: string, formData: FormData) {
  const supabase = createClient();
  const amount = Number(formData.get("amount") || 0);
  const payment_date = String(formData.get("payment_date") || new Date().toISOString().slice(0, 10));
  const method = String(formData.get("method") || "other");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(payment_date) || !Number.isFinite(Date.parse(payment_date))) throw new Error("Enter a valid payment date.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a payment amount greater than $0.");

  const { error } = await supabase.from("payments").insert({
    rental_id: rentalId,
    amount,
    payment_date,
    method,
    notes,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${rentalId}`);
  revalidatePath("/", "layout");
  revalidatePath("/renters", "layout");
  revalidatePath("/");
  revalidatePath("/reports");
}

export async function deletePayment(id: string, rentalId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id).eq("rental_id", rentalId);
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${rentalId}`);
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/reports");
}

export async function recordConditionPhoto(
  rentalId: string,
  stage: "pickup" | "return",
  photoPath: string,
  caption?: string
) {
  const supabase = createClient();
  const { error } = await supabase.from("condition_photos").insert({
    rental_id: rentalId,
    stage,
    photo_path: photoPath,
    caption: caption || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${rentalId}`);
}

export async function deleteConditionPhoto(id: string, photoPath: string, rentalId: string) {
  const supabase = createClient();
  await supabase.storage.from("condition-photos").remove([photoPath]);
  const { error } = await supabase.from("condition_photos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/rentals/${rentalId}`);
}