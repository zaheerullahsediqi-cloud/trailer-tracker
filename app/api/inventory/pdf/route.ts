import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadInventoryPdfData } from "@/lib/inventory-pdf-data";
import {
  generateInventoryPdf,
  INVENTORY_BRANDING,
  inventoryReportDate,
} from "@/lib/inventory-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return new NextResponse("Sign in to download inventory.", { status: 401 });
  try {
    const { rows, settings } = await loadInventoryPdfData(supabase);
    const generatedAt = new Date(),
      timeZone = process.env.REPORT_TIME_ZONE || "America/Chicago";
    const location = [settings?.city, settings?.state, settings?.zip]
      .filter(Boolean)
      .join(", ");
    const street = settings?.company_address?.trim();
    const address = street
      ? [street, location].filter(Boolean).join(", ")
      : INVENTORY_BRANDING.address;
    const pdf = await generateInventoryPdf({
      rows,
      companyName: settings?.company_name || INVENTORY_BRANDING.companyName,
      address,
      usdot: process.env.COMPANY_USDOT || INVENTORY_BRANDING.usdot,
      mc: process.env.COMPANY_MC || INVENTORY_BRANDING.mc,
      generatedAt,
      timeZone,
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Star_Link_Trailer_Inventory_${inventoryReportDate(generatedAt, timeZone).filename}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Inventory PDF could not be generated. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
