import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateInvoicePdf } from "@/lib/invoice";
import { COMPANY_NAME, OWNER_EMAIL } from "@/lib/resend";
import { advanceByPeriod } from "@/lib/date";

export async function GET(
  req: NextRequest,
  { params }: { params: { rentalId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: rental, error } = await supabase
    .from("rentals")
    .select("*, trailers(*), renters(*)")
    .eq("id", params.rentalId)
    .single();
  if (error || !rental) return new NextResponse("Not found", { status: 404 });

  const periodStart = rental.next_due_date;
  const periodEnd = advanceByPeriod(rental.next_due_date, rental.period, rental.period_days);

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber: `${rental.trailers.vin.slice(-6)}-PREVIEW`,
    companyName: COMPANY_NAME,
    companyEmail: OWNER_EMAIL,
    trailer: rental.trailers,
    renter: rental.renters,
    periodStart,
    periodEnd,
    rate: Number(rental.rate),
    dueDate: rental.next_due_date,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${rental.trailers.vin}.pdf"`,
    },
  });
}
