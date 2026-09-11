import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/invoice";
import { getCompanySettings, fetchLogoForPdf } from "@/lib/settings";

export async function GET(req: NextRequest, { params }: { params: { invoiceId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", params.invoiceId)
    .single();
  if (error || !invoice) return new NextResponse("Not found", { status: 404 });

  const snapshot = invoice.snapshot || {};
  const { companyName, contactEmail, logoUrl } = await getCompanySettings(supabase);
  const logo = await fetchLogoForPdf(logoUrl);

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber: invoice.invoice_number || invoice.id.slice(0, 8),
    companyName,
    companyEmail: contactEmail,
    logoBytes: logo?.bytes,
    logoContentType: logo?.contentType,
    trailer: snapshot.trailers || { vin: "—", make: "", model: "" },
    renter: snapshot.renters || { name: invoice.sent_to || "—" },
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    rate: Number(invoice.amount),
    dueDate: invoice.period_start,
  });

  const download = req.nextUrl.searchParams.get("download") === "1";
  const filename = `invoice-${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    },
  });
}
