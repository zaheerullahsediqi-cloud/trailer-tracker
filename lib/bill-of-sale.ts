import { PDFDocument, PDFFont, rgb, StandardFonts } from "pdf-lib";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
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
  if (current) lines.push(current);
  return lines;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export async function generateBillOfSalePdf(params: {
  companyName: string;
  companyAddress: string;
  companyEmail?: string;
  logoBytes?: Uint8Array | null;
  logoContentType?: string | null;
  buyerName: string;
  buyerAddress: string;
  trailer: {
    vin: string;
    make: string;
    model: string;
    year: number | null;
    plate: string | null;
    titleNumber: string | null;
    plateType: string | null;
  };
  salePrice: number;
  saleDate: string;
  paymentMethod: string;
  notes: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const navy = rgb(0.059, 0.09, 0.165);
  const accent = rgb(0.145, 0.388, 0.922);
  const maroon = rgb(0.5, 0.09, 0.13);
  const black = rgb(0.06, 0.06, 0.07);
  const gray = rgb(0.4, 0.44, 0.53);

  let logoImage: any = null;
  if (params.logoBytes) {
    try {
      logoImage = params.logoContentType?.includes("png")
        ? await doc.embedPng(params.logoBytes)
        : await doc.embedJpg(params.logoBytes);
    } catch {
      logoImage = null;
    }
  }

  // Header bar
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 60, width: PAGE_WIDTH, height: 60, color: navy });
  let headerX = MARGIN;
  if (logoImage) {
    const logoH = 34;
    const logoW = (logoImage.width / logoImage.height) * logoH;
    page.drawImage(logoImage, { x: MARGIN, y: PAGE_HEIGHT - 47, width: logoW, height: logoH });
    headerX = MARGIN + logoW + 12;
  }
  page.drawText(params.companyName.toUpperCase(), {
    x: headerX,
    y: PAGE_HEIGHT - 36,
    size: 12,
    font: bold,
    color: accent,
  });
  page.drawText("BILL OF SALE", {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize("BILL OF SALE", 20),
    y: PAGE_HEIGHT - 42,
    size: 20,
    font: bold,
    color: rgb(1, 1, 1),
  });

  let y = PAGE_HEIGHT - 90;

  const introLines = wrapText(
    `This Bill of Sale documents the transfer of ownership of the trailer described below from Seller to Buyer, effective ${formatDate(
      params.saleDate
    )}, in exchange for the sale price stated herein.`,
    font,
    10.5,
    CONTENT_WIDTH
  );
  introLines.forEach((line) => {
    page.drawText(line, { x: MARGIN, y, size: 10.5, font, color: black });
    y -= 15;
  });
  y -= 10;

  // Seller / Buyer two-column block
  const col2X = MARGIN + 280;
  page.drawText("SELLER", { x: MARGIN, y, size: 9, font: bold, color: accent });
  page.drawText("BUYER", { x: col2X, y, size: 9, font: bold, color: accent });
  y -= 15;
  page.drawText(params.companyName, { x: MARGIN, y, size: 11, font: bold, color: black });
  page.drawText(params.buyerName, { x: col2X, y, size: 11, font: bold, color: black });
  y -= 14;
  const sellerAddrLines = wrapText(params.companyAddress || "Address on file", font, 9.5, 220);
  const buyerAddrLines = wrapText(params.buyerAddress || "Address on file", font, 9.5, 220);
  sellerAddrLines.forEach((line, i) => {
    page.drawText(line, { x: MARGIN, y: y - i * 13, size: 9.5, font, color: gray });
  });
  buyerAddrLines.forEach((line, i) => {
    page.drawText(line, { x: col2X, y: y - i * 13, size: 9.5, font, color: gray });
  });
  y -= Math.max(sellerAddrLines.length, buyerAddrLines.length) * 13 + 18;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: gray });
  y -= 26;

  // Trailer details
  page.drawText("TRAILER DESCRIPTION", { x: MARGIN, y, size: 10, font: bold, color: accent });
  y -= 18;

  const details: [string, string][] = [
    ["VIN", params.trailer.vin],
    ["Year", params.trailer.year ? String(params.trailer.year) : "N/A"],
    ["Make", params.trailer.make],
    ["Model", params.trailer.model],
  ];
  if (params.trailer.titleNumber) details.push(["Title #", params.trailer.titleNumber]);
  if (params.trailer.plate) details.push(["License Plate", params.trailer.plate]);
  if (params.trailer.plateType) details.push(["Plate Type", params.trailer.plateType]);

  const colWidth = CONTENT_WIDTH / 2;
  details.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = MARGIN + col * colWidth;
    const rowY = y - row * 16;
    page.drawText(`${label}:`, { x, y: rowY, size: 9.5, font: bold, color: black });
    const labelW = bold.widthOfTextAtSize(`${label}: `, 9.5);
    page.drawText(value, { x: x + labelW, y: rowY, size: 9.5, font, color: black });
  });
  y -= Math.ceil(details.length / 2) * 16 + 20;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: gray });
  y -= 26;

  // Sale terms
  page.drawText("SALE TERMS", { x: MARGIN, y, size: 10, font: bold, color: accent });
  y -= 18;
  page.drawText("Sale Price:", { x: MARGIN, y, size: 11, font: bold, color: black });
  page.drawText(`$${params.salePrice.toFixed(2)}`, { x: MARGIN + 80, y, size: 11, font: bold, color: black });
  page.drawText("Sale Date:", { x: col2X, y, size: 11, font: bold, color: black });
  page.drawText(formatDate(params.saleDate), { x: col2X + 75, y, size: 11, font, color: black });
  y -= 18;
  if (params.paymentMethod) {
    page.drawText("Payment Method:", { x: MARGIN, y, size: 10, font: bold, color: black });
    page.drawText(params.paymentMethod, { x: MARGIN + 105, y, size: 10, font, color: black });
    y -= 18;
  }
  if (params.notes) {
    const noteLines = wrapText(`Notes: ${params.notes}`, font, 9.5, CONTENT_WIDTH);
    noteLines.forEach((line) => {
      page.drawText(line, { x: MARGIN, y, size: 9.5, font, color: gray });
      y -= 13;
    });
  }
  y -= 12;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: gray });
  y -= 24;

  // As-is / condition clause
  const clause =
    "This trailer is sold \u201cAS-IS, WHERE-IS,\u201d with no warranties, express or implied, as to its condition, merchantability, or fitness for a particular purpose. Buyer acknowledges having inspected the trailer and accepts it in its current condition. Seller warrants that it holds clear title to the trailer, free of liens and encumbrances, and has full authority to sell it. Ownership and all rights, title, and interest in the trailer transfer to Buyer upon receipt of payment in full as stated above.";
  const clauseLines = wrapText(clause, font, 9.5, CONTENT_WIDTH);
  clauseLines.forEach((line) => {
    page.drawText(line, { x: MARGIN, y, size: 9.5, font, color: black });
    y -= 13.5;
  });
  y -= 30;

  // Signatures
  page.drawText("Seller:", { x: MARGIN, y, size: 10, font: italic, color: black });
  page.drawText("Buyer:", { x: col2X, y, size: 10, font: italic, color: black });
  y -= 55;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + 220, y }, thickness: 1, color: black });
  page.drawLine({ start: { x: col2X, y }, end: { x: col2X + 220, y }, thickness: 1, color: black });
  y -= 15;
  page.drawText(params.companyName, { x: MARGIN, y, size: 9.5, font: bold, color: black });
  page.drawText(params.buyerName, { x: col2X, y, size: 9.5, font: bold, color: black });
  y -= 13;
  page.drawText(`Date: ${formatDate(params.saleDate)}`, { x: MARGIN, y, size: 9, font, color: gray });
  page.drawText(`Date: ${formatDate(params.saleDate)}`, { x: col2X, y, size: 9, font, color: gray });

  // Footer bar
  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH * 0.85, height: 12, color: navy });
  page.drawRectangle({ x: PAGE_WIDTH * 0.85, y: 0, width: PAGE_WIDTH * 0.15, height: 12, color: maroon });

  return doc.save();
}
