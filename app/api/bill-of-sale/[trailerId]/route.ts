import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBillOfSalePdf } from "@/lib/bill-of-sale";
import { getCompanySettings, fetchLogoForPdf } from "@/lib/settings";

export async function GET(req: NextRequest, { params }: { params: { trailerId: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: trailer, error } = await supabase
    .from("trailers")
    .select("*")
    .eq("id", params.trailerId)
    .single();
  if (error || !trailer) return new NextResponse("Not found", { status: 404 });

  const sp = req.nextUrl.searchParams;
  const buyerName = sp.get("buyer_name") || "";
  const buyerAddress = sp.get("buyer_address") || "";
  const salePrice = Number(sp.get("sale_price") || 0);
  const saleDate = sp.get("sale_date") || new Date().toISOString().slice(0, 10);
  const paymentMethod = sp.get("payment_method") || "";
  const notes = sp.get("notes") || "";

  if (!buyerName) return new NextResponse("Buyer name is required", { status: 400 });

  const { companyName, contactEmail, logoUrl, companyAddress } = await getCompanySettings(supabase);
  const logo = await fetchLogoForPdf(logoUrl);

  const pdfBytes = await generateBillOfSalePdf({
    companyName,
    companyAddress,
    companyEmail: contactEmail,
    logoBytes: logo?.bytes,
    logoContentType: logo?.contentType,
    buyerName,
    buyerAddress,
    trailer: {
      vin: trailer.vin,
      make: trailer.make,
      model: trailer.model,
      year: trailer.year,
      plate: trailer.plate,
      titleNumber: trailer.title_number,
      plateType: trailer.plate_type,
    },
    salePrice,
    saleDate,
    paymentMethod,
    notes,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="bill-of-sale-${trailer.vin}.pdf"`,
    },
  });
}
