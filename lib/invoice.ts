import { PDFDocument, rgb, StandardFonts, PDFFont } from "pdf-lib";
import { safeText } from "./pdf-text";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const RIGHT_EDGE = PAGE_WIDTH - MARGIN;
const HEADER_HEIGHT = 150;

const navy = rgb(0.075, 0.11, 0.19);
const gray = rgb(0.42, 0.46, 0.53);
const lightGray = rgb(0.88, 0.89, 0.91);
const tableHeaderBg = rgb(0.93, 0.94, 0.96);
const white = rgb(1, 1, 1);
const offWhite = rgb(0.75, 0.79, 0.87);

function formatMoney(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLongDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatPeriod(startStr: string, endStr: string): string {
  const startYear = startStr.slice(0, 4);
  const endYear = endStr.slice(0, 4);
  if (startYear === endYear) {
    return `${formatShortDate(startStr)} - ${formatShortDate(endStr)}, ${endYear}`;
  }
  return `${formatShortDate(startStr)}, ${startYear} - ${formatShortDate(endStr)}, ${endYear}`;
}

function drawRight(page: any, text: string, rightX: number, y: number, size: number, font: PDFFont, color: any) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - width, y, size, font, color });
}

function wrapFooter(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    lines.push(current);
  }
  return lines.slice(0, 6);
}

export async function generateInvoicePdf(params: {
  invoiceNumber: string;
  companyName: string;
  companyEmail?: string;
  footerText?: string;
  logoBytes?: Uint8Array | null;
  logoContentType?: string | null;
  trailer: {
    vin: string;
    make: string;
    model: string;
    year?: number | null;
    unit_number?: string | null;
    trailer_type?: string | null;
  };
  renter: { name: string; address?: string | null; phone?: string | null; email?: string | null };
  periodStart: string;
  periodEnd: string;
  rate: number;
  dueDate: string;
}): Promise<Uint8Array> {
  const {
    invoiceNumber: rawInvoiceNumber,
    companyName: rawCompanyName,
    companyEmail: rawCompanyEmail,
    footerText: rawFooterText,
    logoBytes,
    logoContentType,
    trailer: rawTrailer,
    renter: rawRenter,
    periodStart,
    periodEnd,
    rate,
    dueDate,
  } = params;

  const invoiceNumber = safeText(rawInvoiceNumber);
  const companyName = safeText(rawCompanyName);
  const companyEmail = rawCompanyEmail ? safeText(rawCompanyEmail) : undefined;
  const footerText = rawFooterText ? safeText(rawFooterText) : undefined;
  const trailer = {
    vin: safeText(rawTrailer.vin),
    make: safeText(rawTrailer.make),
    model: safeText(rawTrailer.model),
    year: rawTrailer.year,
    unitNumber: rawTrailer.unit_number ? safeText(rawTrailer.unit_number) : null,
    trailerType: rawTrailer.trailer_type ? safeText(rawTrailer.trailer_type) : null,
  };
  const renter = {
    name: safeText(rawRenter.name),
    address: rawRenter.address ? safeText(rawRenter.address) : null,
    phone: rawRenter.phone ? safeText(rawRenter.phone) : null,
    email: rawRenter.email ? safeText(rawRenter.email) : null,
  };

  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serifBoldItalic = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);

  let logoImage: any = null;
  if (logoBytes) {
    try {
      logoImage = logoContentType?.includes("png") ? await doc.embedPng(logoBytes) : await doc.embedJpg(logoBytes);
    } catch {
      logoImage = null;
    }
  }

  // --- Full-width navy header band ---
  const headerTop = PAGE_HEIGHT;
  const headerBottom = PAGE_HEIGHT - HEADER_HEIGHT;
  page.drawRectangle({ x: 0, y: headerBottom, width: PAGE_WIDTH, height: HEADER_HEIGHT, color: navy });

  let markWidth = 0;
  if (logoImage) {
    const logoH = 46;
    const logoW = (logoImage.width / logoImage.height) * logoH;
    page.drawImage(logoImage, { x: MARGIN, y: headerTop - 34 - logoH, width: logoW, height: logoH });
    markWidth = logoW;
  } else {
    page.drawText("SL", { x: MARGIN, y: headerTop - 62, size: 42, font: serifBoldItalic, color: white });
    markWidth = serifBoldItalic.widthOfTextAtSize("SL", 42) + 14;
  }

  const nameParts = companyName.toUpperCase().split(" ");
  const splitIdx = nameParts.length > 2 ? Math.ceil(nameParts.length / 2) : 1;
  const nameLine1 = nameParts.slice(0, splitIdx).join(" ");
  const nameLine2 = nameParts.slice(splitIdx).join(" ");
  page.drawText(nameLine1, { x: MARGIN + markWidth, y: headerTop - 46, size: 19, font: bold, color: white });
  if (nameLine2) {
    page.drawText(nameLine2, { x: MARGIN + markWidth, y: headerTop - 68, size: 14, font, color: offWhite });
  }

  drawRight(page, "INVOICE", RIGHT_EDGE, headerTop - 50, 26, bold, white);
  drawRight(page, invoiceNumber, RIGHT_EDGE, headerTop - 70, 11, font, offWhite);

  page.drawText("TRAILER RENTAL", {
    x: MARGIN,
    y: headerBottom + 18,
    size: 9,
    font: bold,
    color: offWhite,
  });

  // --- Content area ---
  let y = headerBottom - 34;
  const detailColX = MARGIN + 300;
  const rowTop = y;

  page.drawText("BILL TO", { x: MARGIN, y, size: 8.5, font: bold, color: gray });
  let leftY = y - 20;
  page.drawText(renter.name, { x: MARGIN, y: leftY, size: 14, font: bold, color: navy });
  leftY -= 16;
  if (renter.email) {
    page.drawText(renter.email, { x: MARGIN, y: leftY, size: 10, font, color: gray });
    leftY -= 14;
  }
  if (renter.address) {
    page.drawText(renter.address, { x: MARGIN, y: leftY, size: 10, font, color: gray });
    leftY -= 14;
  }
  if (renter.phone) {
    page.drawText(renter.phone, { x: MARGIN, y: leftY, size: 10, font, color: gray });
    leftY -= 14;
  }

  page.drawText("INVOICE DETAILS", { x: detailColX, y: rowTop, size: 8.5, font: bold, color: gray });
  let rightY = rowTop - 20;
  const detailRows: [string, string][] = [
    ["Invoice date", formatLongDate(new Date().toISOString().slice(0, 10))],
    ["Due date", formatLongDate(dueDate)],
    ["Currency", "USD"],
  ];
  for (const [label, value] of detailRows) {
    page.drawText(label, { x: detailColX, y: rightY, size: 10, font, color: gray });
    drawRight(page, value, RIGHT_EDGE, rightY, 10, font, navy);
    rightY -= 18;
  }

  y = Math.min(leftY, rightY) - 12;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: RIGHT_EDGE, y }, thickness: 1, color: lightGray });
  y -= 26;

  const rowTop2 = y;
  page.drawText("TRAILER", { x: MARGIN, y, size: 8.5, font: bold, color: gray });
  const trailerLabel = trailer.unitNumber || trailer.vin;
  const trailerSub = trailer.trailerType || `${trailer.make} ${trailer.model}`.trim();
  page.drawText(`${trailerLabel} | ${trailerSub}`, { x: MARGIN, y: rowTop2 - 18, size: 12, font: bold, color: navy });

  page.drawText("RENTAL PERIOD", { x: detailColX, y: rowTop2, size: 8.5, font: bold, color: gray });
  page.drawText(formatPeriod(periodStart, periodEnd), { x: detailColX, y: rowTop2 - 18, size: 12, font, color: navy });

  y -= 46;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: RIGHT_EDGE, y }, thickness: 1, color: lightGray });
  y -= 30;

  // --- Line items table ---
  const colDesc = MARGIN + 12;
  const colQty = MARGIN + 340;
  const colRate = MARGIN + 400;
  const colAmount = RIGHT_EDGE - 12;

  page.drawRectangle({ x: MARGIN, y: y - 8, width: CONTENT_WIDTH, height: 26, color: tableHeaderBg });
  page.drawText("DESCRIPTION", { x: colDesc, y, size: 8.5, font: bold, color: gray });
  page.drawText("QTY", { x: colQty, y, size: 8.5, font: bold, color: gray });
  page.drawText("RATE", { x: colRate, y, size: 8.5, font: bold, color: gray });
  drawRight(page, "AMOUNT", colAmount, y, 8.5, bold, gray);
  y -= 34;

  page.drawText("Monthly trailer rental", { x: colDesc, y, size: 11, font: bold, color: navy });
  y -= 15;
  page.drawText(`Trailer ${trailerLabel} | One monthly billing period`, {
    x: colDesc,
    y,
    size: 9.5,
    font,
    color: gray,
  });
  page.drawText("1", { x: colQty, y: y + 15, size: 10.5, font, color: navy });
  page.drawText(formatMoney(rate), { x: colRate, y: y + 15, size: 10.5, font, color: navy });
  drawRight(page, formatMoney(rate), colAmount, y + 15, 10.5, bold, navy);

  y -= 24;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: RIGHT_EDGE, y }, thickness: 1, color: lightGray });
  y -= 26;

  const summaryLabelX = colAmount - 190;
  page.drawText("Subtotal", { x: summaryLabelX, y, size: 10.5, font, color: gray });
  drawRight(page, formatMoney(rate), colAmount, y, 10.5, font, navy);
  y -= 18;
  page.drawText("Payments applied", { x: summaryLabelX, y, size: 10.5, font, color: gray });
  drawRight(page, formatMoney(0), colAmount, y, 10.5, font, navy);

  y -= 30;
  const barHeight = 42;
  const barX = summaryLabelX - 14;
  page.drawRectangle({ x: barX, y: y - barHeight + 12, width: RIGHT_EDGE - barX, height: barHeight, color: navy });
  page.drawText("TOTAL DUE", { x: summaryLabelX, y: y - barHeight / 2 + 14, size: 12, font: bold, color: white });
  drawRight(page, formatMoney(rate), colAmount, y - barHeight / 2 + 10, 18, bold, white);

  // --- Footer ---
  y -= barHeight + 46;
  page.drawText("THANK YOU FOR YOUR BUSINESS", { x: MARGIN, y, size: 11, font: bold, color: navy });
  y -= 18;
  const footerLines = footerText
    ? wrapFooter(footerText, font, 9.5, CONTENT_WIDTH)
    : ["Please remit payment by the due date above."];
  for (const line of footerLines) {
    page.drawText(line, { x: MARGIN, y, size: 9.5, font, color: gray });
    y -= 14;
  }
  if (companyEmail) {
    y -= 2;
    page.drawText(`Questions? ${companyEmail}`, { x: MARGIN, y, size: 9.5, font, color: gray });
    y -= 14;
  }

  // --- Bottom page footer ---
  const footerY = 40;
  page.drawLine({ start: { x: MARGIN, y: footerY + 18 }, end: { x: RIGHT_EDGE, y: footerY + 18 }, thickness: 1, color: lightGray });
  page.drawText(companyName.toUpperCase(), { x: MARGIN, y: footerY, size: 8.5, font: bold, color: gray });
  drawRight(page, "Page 1 of 1", RIGHT_EDGE, footerY, 8.5, font, gray);

  return doc.save();
}
