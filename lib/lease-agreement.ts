import { PDFDocument, PDFPage, PDFFont, rgb, StandardFonts } from "pdf-lib";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const black = rgb(0.06, 0.06, 0.07);
const gray = rgb(0.35, 0.37, 0.4);
const maroon = rgb(0.5, 0.09, 0.13);

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

class DocWriter {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;

  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  ensureSpace(height: number) {
    if (this.y - height < MARGIN + 20) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }

  heading(text: string) {
    this.ensureSpace(30);
    this.y -= 6;
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 13, font: this.bold, color: black });
    this.y -= 8;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.75,
      color: rgb(0.85, 0.85, 0.86),
    });
    this.y -= 18;
  }

  paragraph(text: string, opts: { size?: number; bold?: boolean; color?: any } = {}) {
    const size = opts.size ?? 10.5;
    const f = opts.bold ? this.bold : this.font;
    const color = opts.color ?? black;
    const lines = wrapText(text, f, size, CONTENT_WIDTH);
    this.ensureSpace(lines.length * (size + 5) + 10);
    for (const line of lines) {
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: f, color });
      this.y -= size + 5;
    }
    this.y -= 8;
  }

  bullet(label: string, value: string) {
    const size = 10.5;
    this.ensureSpace(size + 6);
    this.page.drawText("•", { x: MARGIN, y: this.y, size, font: this.font, color: black });
    this.page.drawText(label + ":", { x: MARGIN + 14, y: this.y, size, font: this.bold, color: black });
    const labelWidth = this.bold.widthOfTextAtSize(label + ": ", size);
    this.page.drawText(value, { x: MARGIN + 14 + labelWidth, y: this.y, size, font: this.font, color: black });
    this.y -= size + 6;
  }

  spacer(amount = 10) {
    this.y -= amount;
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function generateLeaseAgreementPdf(params: {
  companyName: string;
  companyAddress: string;
  logoBytes?: Uint8Array | null;
  logoContentType?: string | null;
  renterName: string;
  renterAddress: string;
  driversLicense: string;
  dateOfBirth: string;
  trailer: {
    vin: string;
    make: string;
    model: string;
    year: number | null;
    plate: string | null;
    titleNumber: string | null;
    plateType: string | null;
  };
  leaseStartDate: string;
  leaseEndDate: string;
  leaseMonths: number;
  monthlyRent: number;
  dueDay: number;
  noticeDays: number;
  inspectionLocation: string;
  govState: string;
  govCounty: string;
  signDate: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

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

  const w = new DocWriter(doc, font, bold);

  const headerTop = PAGE_HEIGHT - MARGIN;
  let logoBottom = headerTop;
  if (logoImage) {
    const logoH = 70;
    const logoW = (logoImage.width / logoImage.height) * logoH;
    w.page.drawImage(logoImage, { x: MARGIN, y: headerTop - logoH, width: logoW, height: logoH });
    logoBottom = headerTop - logoH;
  }

  const titleX = logoImage ? MARGIN + 110 : MARGIN;
  w.page.drawText("COMMERCIAL TRAILER", { x: titleX, y: headerTop - 20, size: 22, font: bold, color: black });
  w.page.drawText("LEASE AGREEMENT", { x: titleX, y: headerTop - 44, size: 22, font: bold, color: black });
  w.page.drawText(params.companyName.toUpperCase(), {
    x: titleX,
    y: headerTop - 62,
    size: 9,
    font,
    color: gray,
  });

  w.y = Math.min(logoBottom, headerTop - 80) - 10;

  const introDate = new Date(params.signDate);
  const introText = `This Commercial Trailer Lease Agreement ("Agreement") is made and entered into on this ${ordinal(
    introDate.getUTCDate()
  )} day of ${introDate.toLocaleString("en-US", { month: "long", timeZone: "UTC" })}, ${introDate.getUTCFullYear()}, by and between:`;
  w.paragraph(introText);

  w.spacer(6);
  const colY = w.y;
  w.page.drawText(params.companyName, { x: MARGIN, y: colY, size: 10.5, font: bold, color: black });
  const companyAddrLines = wrapText(params.companyAddress, font, 10, 220);
  companyAddrLines.forEach((line, i) => {
    w.page.drawText(line, { x: MARGIN, y: colY - 16 - i * 13, size: 10, font, color: gray });
  });

  const col2X = MARGIN + 280;
  w.page.drawText(params.renterName, { x: col2X, y: colY, size: 10.5, font: bold, color: black });
  const renterAddrLines = wrapText(params.renterAddress, font, 10, 220);
  renterAddrLines.forEach((line, i) => {
    w.page.drawText(line, { x: col2X, y: colY - 16 - i * 13, size: 10, font, color: gray });
  });

  w.y = colY - 16 - Math.max(companyAddrLines.length, renterAddrLines.length) * 13 - 14;
  w.page.drawLine({
    start: { x: MARGIN, y: w.y },
    end: { x: PAGE_WIDTH - MARGIN, y: w.y },
    thickness: 1.25,
    color: black,
  });
  w.y -= 24;

  w.heading("ARTICLE 1 – PARTIES");
  w.paragraph(
    `Lessor (Owner): ${params.companyName}, a company duly organized and existing under the laws of the State of ${params.govState}, with its principal place of business at ${params.companyAddress} (hereinafter referred to as "Lessor").`
  );
  w.paragraph(
    `Lessee (Driver/Operator): ${params.renterName}, holder of ${params.govState} Commercial Driver License No. ${params.driversLicense}, Date of Birth: ${params.dateOfBirth}, residing at ${params.renterAddress} (hereinafter referred to as "Lessee").`
  );

  w.heading("ARTICLE 2 – LEASED EQUIPMENT");
  w.paragraph("The Lessor hereby leases to the Lessee the following commercial trailer:");
  w.bullet("VIN", params.trailer.vin);
  if (params.trailer.titleNumber) w.bullet("Title #", params.trailer.titleNumber);
  if (params.trailer.year) w.bullet("Year", String(params.trailer.year));
  w.bullet("Make", params.trailer.make);
  w.bullet("Model", params.trailer.model);
  w.bullet("Class", "Commercial Trailer");
  if (params.trailer.plate) w.bullet("License Plate", params.trailer.plate);
  if (params.trailer.plateType) w.bullet("Plate Type", params.trailer.plateType);
  w.spacer(4);
  w.paragraph(
    `The trailer is leased in its current condition, and the Lessee acknowledges having inspected the equipment${
      params.inspectionLocation ? ` at ${params.inspectionLocation}` : ""
    } and found it to be in satisfactory working order. Also, while returning it${
      params.inspectionLocation ? ` it should be inspected at ${params.inspectionLocation}` : ""
    } and pass inspection.`
  );

  w.heading("ARTICLE 3 – LEASE TERM");
  w.paragraph(
    `This Agreement shall commence on ${formatDate(params.leaseStartDate)} and shall terminate on ${formatDate(
      params.leaseEndDate
    )}, unless earlier terminated in accordance with the provisions herein. This constitutes a ${
      params.leaseMonths
    } month lease term.`
  );

  w.heading("ARTICLE 4 – RENT AND PAYMENT TERMS");
  w.paragraph(
    `4.1 Monthly Rent: The Lessee agrees to pay the Lessor a monthly rental fee of ${numberToWords(
      params.monthlyRent
    )} Dollars ($${params.monthlyRent.toFixed(2)} USD) per month.`
  );
  w.paragraph(`4.2 Due Date: Rent is due on the ${ordinal(params.dueDay)} day of each calendar month.`);

  w.heading("ARTICLE 5 – EARLY TERMINATION");
  w.paragraph(
    `5.1 Lessee Early Termination: In the event that the Lessee terminates this Agreement prior to the expiration of the full ${params.leaseMonths} month term, the Lessee shall be obligated to pay the Lessor an early termination penalty equal to one (1) month's rent ($${params.monthlyRent.toFixed(
      2
    )}), in addition to all rent due and payable through the date of termination.`
  );
  w.paragraph(
    `5.2 Notice: The Lessee must provide a minimum of ${params.noticeDays} days written notice prior to early termination. Failure to provide such notice does not waive the obligation to pay the early termination penalty.`
  );
  w.paragraph(
    "5.3 Lessor Early Termination: The Lessor may terminate this Agreement immediately and without penalty in the event of material breach by the Lessee, including but not limited to: failure to pay rent, unauthorized use of the trailer, or damage to the equipment."
  );

  w.heading("ARTICLE 6 – LESSEE'S OBLIGATIONS");
  w.paragraph(
    "6.1 Lawful Use: The Lessee shall use the trailer solely for lawful commercial purposes and in compliance with all applicable federal, state, and local laws and regulations."
  );
  w.paragraph(
    "6.2 Maintenance: The Lessee shall maintain the trailer in good working condition, performing routine upkeep and promptly notifying the Lessor of any damage, mechanical failure, or accident."
  );
  w.paragraph(
    "6.3 Insurance: The Lessee shall maintain adequate insurance coverage on the trailer throughout the duration of this Agreement, including liability coverage as required by law. Proof of insurance shall be provided to the Lessor upon request."
  );
  w.paragraph(
    "6.4 No Sublease: The Lessee shall not sublease, assign, or transfer the trailer to any third party without the prior written consent of the Lessor."
  );
  w.paragraph(
    "6.5 Return of Equipment: Upon termination of this Agreement, the Lessee shall return the trailer to the Lessor in the same condition as received, reasonable wear and tear excepted."
  );

  w.heading("ARTICLE 7 – LESSOR'S OBLIGATIONS");
  w.paragraph(
    "The Lessor warrants that it holds clear title to the trailer and has full authority to enter into this lease. The Lessor shall not interfere with the Lessee's lawful and peaceful use of the trailer during the lease term, provided the Lessee is not in default."
  );

  w.heading("ARTICLE 8 – LIABILITY AND INDEMNIFICATION");
  w.paragraph(
    "The Lessee shall indemnify, defend, and hold harmless the Lessor from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorney's fees) arising out of or related to the Lessee's use, operation, or possession of the trailer during the lease term."
  );
  w.paragraph(
    "The Lessor shall not be liable for any loss of income, consequential damages, or other indirect damages arising from mechanical failure or downtime of the trailer."
  );

  w.heading("ARTICLE 9 – DEFAULT");
  w.paragraph(
    "The Lessee shall be in default under this Agreement upon: (a) failure to pay rent when due; (b) material breach of any term or condition of this Agreement; or (c) unauthorized use, abandonment, or misuse of the trailer. Upon default, the Lessor may repossess the trailer and pursue all available legal remedies."
  );

  w.heading("ARTICLE 10 – GOVERNING LAW");
  w.paragraph(
    `This Agreement shall be governed by and construed in accordance with the laws of the State of ${params.govState}. Any disputes arising hereunder shall be resolved in the appropriate courts of ${params.govCounty}, ${params.govState}.`
  );

  w.heading("ARTICLE 11 – ENTIRE AGREEMENT");
  w.paragraph(
    "This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, and agreements, whether written or oral. This Agreement may only be amended in writing signed by both parties."
  );

  w.heading("ARTICLE 12 – SIGNATURES");
  w.paragraph(
    "IN WITNESS WHEREOF, the parties have executed this Commercial Trailer Lease Agreement as of the date first written below."
  );
  w.ensureSpace(120);
  w.spacer(20);
  const sigY = w.y;
  w.page.drawText("Owner (Lessor)", { x: MARGIN + 40, y: sigY, size: 10, font: italic, color: black });
  w.page.drawText(`${params.companyName}:`, { x: MARGIN + 40, y: sigY - 13, size: 10, font: italic, color: black });
  w.page.drawText("Renter (Lessee)", { x: col2X + 40, y: sigY, size: 10, font: italic, color: black });
  w.page.drawText(`${params.renterName}:`, { x: col2X + 40, y: sigY - 13, size: 10, font: italic, color: black });

  const lineY = sigY - 70;
  w.page.drawLine({ start: { x: MARGIN, y: lineY }, end: { x: MARGIN + 220, y: lineY }, thickness: 1, color: black });
  w.page.drawLine({ start: { x: col2X, y: lineY }, end: { x: col2X + 220, y: lineY }, thickness: 1, color: black });
  w.page.drawText(params.companyName, { x: MARGIN + 30, y: lineY - 16, size: 10, font: bold, color: black });
  w.page.drawText(formatDate(params.signDate).toUpperCase(), { x: MARGIN + 50, y: lineY - 30, size: 10, font: bold, color: black });
  w.page.drawText(params.renterName, { x: col2X + 30, y: lineY - 16, size: 10, font: bold, color: black });
  w.page.drawText(formatDate(params.signDate).toUpperCase(), { x: col2X + 50, y: lineY - 30, size: 10, font: bold, color: black });

  w.page.drawRectangle({ x: MARGIN, y: lineY - 60, width: CONTENT_WIDTH * 0.85, height: 18, color: black });
  w.page.drawRectangle({
    x: MARGIN + CONTENT_WIDTH * 0.85,
    y: lineY - 60,
    width: CONTENT_WIDTH * 0.15,
    height: 18,
    color: maroon,
  });

  return doc.save();
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function numberToWords(n: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function chunk(num: number): string {
    if (num === 0) return "";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + chunk(num % 100) : "");
  }

  const whole = Math.floor(n);
  if (whole === 0) return "Zero";
  if (whole >= 1_000_000) return whole.toLocaleString();
  const thousands = Math.floor(whole / 1000);
  const remainder = whole % 1000;
  const parts = [];
  if (thousands) parts.push(chunk(thousands) + " Thousand");
  if (remainder) parts.push(chunk(remainder));
  return parts.join(" ") || "Zero";
}
