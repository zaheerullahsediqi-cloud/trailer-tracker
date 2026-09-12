"use server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/invoice";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import { getCompanySettings, fetchLogoForPdf } from "@/lib/settings";
import { revalidatePath } from "next/cache";

export async function sendExistingInvoice(invoiceId: string, toEmail: string, message: string) {
  const supabase = createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, rentals(id, trailers(*), renters(*))")
    .eq("id", invoiceId)
    .single();
  if (error || !invoice) throw new Error("Invoice not found");
  if (invoice.delivery_status === "sent" || invoice.sent_at) {
    throw new Error("This invoice has already been sent.");
  }
  if (!toEmail.trim()) throw new Error("Enter a recipient email address.");

  const { data: claimed, error: claimError } = await supabase
    .from("invoices")
    .update({ delivery_status: "sending", delivery_error: null })
    .eq("id", invoiceId)
    .in("delivery_status", ["pending", "failed"])
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) {
    throw new Error("Invoice is already sending or needs delivery review. Check invoice history before retrying.");
  }

  const { companyName, contactEmail, logoUrl, invoiceFooter } = await getCompanySettings(supabase);
  const logo = await fetchLogoForPdf(logoUrl);
  const snapshot = invoice.snapshot || invoice.rentals;
  const trailer = snapshot?.trailers || invoice.rentals?.trailers;
  const renter = snapshot?.renters || invoice.rentals?.renters;

  let sendData: any;
  try {
    const pdfBytes = await generateInvoicePdf({
      invoiceNumber: invoice.invoice_number,
      companyName,
      companyEmail: contactEmail,
      footerText: invoiceFooter,
      logoBytes: logo?.bytes,
      logoContentType: logo?.contentType,
      trailer,
      renter,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      rate: Number(invoice.amount),
      dueDate: invoice.period_start,
    });

    const resend = getResend();
    const bodyText = message.trim()
      ? message.trim()
      : `Please find attached invoice ${invoice.invoice_number}. Amount due: USD ${Number(invoice.amount).toFixed(2)}. Due date: ${invoice.period_start}.`;

    const { data, error: sendError } = await resend.emails.send(
      {
        from: FROM_EMAIL,
        to: toEmail.trim(),
        subject: `Invoice ${invoice.invoice_number} — Trailer ${trailer?.vin ?? ""}`,
        text: bodyText,
        attachments: [
          {
            filename: `invoice-${invoice.invoice_number}.pdf`,
            content: Buffer.from(pdfBytes).toString("base64"),
          },
        ],
      },
      { idempotencyKey: invoiceId }
    );

    sendData = data;
    if (sendError) throw new Error(`Resend rejected the email: ${sendError.message || JSON.stringify(sendError)}`);
    if (!sendData?.id) throw new Error("Resend did not confirm the email was sent.");
  } catch (err: any) {
    await supabase.from("invoices").update({ delivery_status: "review_required", delivery_error: err.message }).eq("id", invoiceId);
    throw err;
  }

  const { error: saveError } = await supabase
    .from("invoices")
    .update({ delivery_status: "sent", email_id: sendData.id, sent_at: new Date().toISOString(), sent_to: toEmail.trim() })
    .eq("id", invoiceId);
  if (saveError) {
    throw new Error(`Email provider accepted invoice ${invoice.invoice_number}, but delivery status could not be saved. Do not resend; review invoice history.`);
  }

  revalidatePath("/invoices");
  if (invoice.rental_id) revalidatePath(`/rentals/${invoice.rental_id}`);
}
