import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function generateInvoicePdf(params: {
  invoiceNumber: string;
  companyName: string;
  companyEmail?: string;
  trailer: { vin: string; make: string; model: string; year?: number | null };
  renter: { name: string; address?: string | null; phone?: string | null; email?: string | null };
  periodStart: string;
  periodEnd: string;
  rate: number;
  dueDate: string;
}): Promise<Uint8Array> {
  const {
    invoiceNumber,
    companyName,
    companyEmail,
    trailer,
    renter,
    periodStart,
    periodEnd,
    rate,
    dueDate,
  } = params;

  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.059, 0.09, 0.165); // #0F172A
  const amber = rgb(0.145, 0.388, 0.922); // #2563EB accent
  const gray = rgb(0.4, 0.44, 0.53);

  let y = 740;
  page.drawRectangle({ x: 0, y: 760, width: 612, height: 32, color: navy });
  page.drawText(companyName.toUpperCase(), {
    x: 40,
    y: 769,
    size: 14,
    font: bold,
    color: amber,
  });

  page.drawText("INVOICE", { x: 40, y, size: 22, font: bold, color: navy });
  page.drawText(`# ${invoiceNumber}`, { x: 40, y: y - 20, size: 11, font, color: gray });
  page.drawText(`Due: ${dueDate}`, { x: 480, y, size: 11, font, color: gray });

  y -= 60;
  page.drawText("BILL TO", { x: 40, y, size: 9, font: bold, color: amber });
  y -= 16;
  page.drawText(renter.name, { x: 40, y, size: 12, font: bold, color: navy });
  y -= 16;
  if (renter.address) {
    page.drawText(renter.address, { x: 40, y, size: 10, font, color: gray });
    y -= 14;
  }
  if (renter.phone) {
    page.drawText(renter.phone, { x: 40, y, size: 10, font, color: gray });
    y -= 14;
  }
  if (renter.email) {
    page.drawText(renter.email, { x: 40, y, size: 10, font, color: gray });
    y -= 14;
  }

  y -= 20;
  page.drawText("TRAILER", { x: 40, y, size: 9, font: bold, color: amber });
  y -= 16;
  page.drawText(
    `${trailer.year ?? ""} ${trailer.make} ${trailer.model}`.trim(),
    { x: 40, y, size: 11, font, color: navy }
  );
  y -= 14;
  page.drawText(`VIN: ${trailer.vin}`, { x: 40, y, size: 10, font, color: gray });

  // Table
  y -= 40;
  page.drawRectangle({ x: 40, y: y - 6, width: 532, height: 24, color: navy });
  page.drawText("DESCRIPTION", { x: 48, y: y, size: 9, font: bold, color: amber });
  page.drawText("PERIOD", { x: 320, y: y, size: 9, font: bold, color: amber });
  page.drawText("AMOUNT", { x: 480, y: y, size: 9, font: bold, color: amber });

  y -= 34;
  page.drawText(`Trailer rental — ${trailer.vin}`, { x: 48, y, size: 10, font, color: navy });
  page.drawText(`${periodStart} to ${periodEnd}`, { x: 320, y, size: 10, font, color: navy });
  page.drawText(`$${rate.toFixed(2)}`, { x: 480, y, size: 10, font, color: navy });

  y -= 30;
  page.drawLine({ start: { x: 40, y }, end: { x: 572, y }, thickness: 1, color: gray });

  y -= 24;
  page.drawText("TOTAL DUE", { x: 400, y, size: 12, font: bold, color: navy });
  page.drawText(`$${rate.toFixed(2)}`, { x: 480, y, size: 12, font: bold, color: navy });

  y -= 60;
  page.drawText(
    "Thank you for your business. Please remit payment by the due date above.",
    { x: 40, y, size: 9, font, color: gray }
  );
  if (companyEmail) {
    y -= 14;
    page.drawText(`Questions? ${companyEmail}`, { x: 40, y, size: 9, font, color: gray });
  }

  return doc.save();
}
