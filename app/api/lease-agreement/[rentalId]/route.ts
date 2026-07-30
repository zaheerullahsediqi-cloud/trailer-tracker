import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLeaseAgreementPdf } from "@/lib/lease-agreement";
import { getCompanySettings, fetchLogoForPdf } from "@/lib/settings";
import { addMonths } from "@/lib/date";

export async function GET(req: NextRequest, { params }: { params: { rentalId: string } }) {
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

  const sp = req.nextUrl.searchParams;
  const leaseMonths = Number(sp.get("lease_months") || 6);
  const noticeDays = Number(sp.get("notice_days") || 30);
  const inspectionLocation = sp.get("inspection_location") || "";
  const driversLicense = sp.get("drivers_license") || rental.renters.drivers_license || "N/A";
  const dobRaw = sp.get("dob") || rental.renters.date_of_birth || "";
  const govState = sp.get("gov_state") || "Texas";
  const govCounty = sp.get("gov_county") || "Bexar County";
  const leaseStartDate = sp.get("lease_start_date") || rental.start_date;

  const dob = dobRaw ? formatMDY(dobRaw) : "N/A";
  const leaseEndDate = addMonths(leaseStartDate, leaseMonths);
  const dueDay = Number(leaseStartDate.split("-")[2]);

  const { companyName, contactEmail, logoUrl, companyAddress } = await getCompanySettings(supabase);
  const logo = await fetchLogoForPdf(logoUrl);

  const renterAddress = rental.renters.address || "";

  const pdfBytes = await generateLeaseAgreementPdf({
    companyName,
    companyAddress: companyAddress || "Address on file",
    logoBytes: logo?.bytes,
    logoContentType: logo?.contentType,
    renterName: rental.renters.name,
    renterAddress: renterAddress || "Address on file",
    driversLicense,
    dateOfBirth: dob,
    trailer: {
      vin: rental.trailers.vin,
      make: rental.trailers.make,
      model: rental.trailers.model,
      year: rental.trailers.year,
      plate: rental.trailers.plate,
      titleNumber: rental.trailers.title_number,
      plateType: rental.trailers.plate_type,
    },
    leaseStartDate,
    leaseEndDate,
    leaseMonths,
    monthlyRent: Number(rental.rate),
    dueDay,
    noticeDays,
    inspectionLocation,
    govState,
    govCounty,
    signDate: leaseStartDate,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lease-agreement-${rental.trailers.vin}.pdf"`,
    },
  });
}

function formatMDY(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${m}/${d}/${y}`;
}
