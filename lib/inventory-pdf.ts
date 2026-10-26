import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { safeText } from "./pdf-text";
import type { InventoryPdfRow } from "./inventory-pdf-data";

export const INVENTORY_BRANDING = {
  companyName: "STAR LINK FREIGHT INC.",
  usdot: "4457566",
  mc: "1757440",
  address: "8710 Datapoint Dr #6004, San Antonio, TX",
};
const WIDTH = 792,
  HEIGHT = 612,
  MARGIN = 36,
  CONTENT = 720,
  BOTTOM = 54;
const navy = rgb(0.085, 0.13, 0.23),
  gray = rgb(0.34, 0.39, 0.48),
  border = rgb(0.81, 0.84, 0.89),
  pale = rgb(0.95, 0.96, 0.98),
  white = rgb(1, 1, 1);
const sections = [
  {
    key: "under_mc",
    title: "Trailers Under Our MC",
    summary: "UNDER OUR MC",
    color: rgb(0.17, 0.49, 0.31),
  },
  {
    key: "pending_insurance",
    title: "Pending with Insurance",
    summary: "PENDING WITH INSURANCE",
    color: rgb(0.71, 0.45, 0.09),
  },
  {
    key: "rented_out",
    title: "Rented Out",
    summary: "RENTED OUT",
    color: rgb(0.17, 0.36, 0.65),
  },
  {
    key: "sold",
    title: "Sold Trailers",
    summary: "SOLD",
    color: rgb(0.66, 0.17, 0.18),
  },
] as const;

export function inventoryReportDate(
  date = new Date(),
  timeZone = "America/Chicago",
) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (part: string) => parts.find((p) => p.type === part)!.value;
  return {
    filename: `${get("year")}-${get("month")}-${get("day")}`,
    long: new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date),
    short: new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date),
  };
}

// Split long words as well as sentences, so neither VINs nor long customer
// names can escape a cell. Keep every line; page continuation handles overflow.
export function wrapInventoryText(
  value: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of safeText(value).split("\n")) {
    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const trial = current ? current + " " + word : word;
      if (font.widthOfTextAtSize(trial, size) <= width) {
        current = trial;
        continue;
      }
      if (current) {
        lines.push(current);
        current = "";
      }
      for (const letter of word) {
        if (current && font.widthOfTextAtSize(current + letter, size) > width) {
          lines.push(current);
          current = "";
        }
        current += letter;
      }
    }
    lines.push(current);
  }
  return lines.length ? lines : [""];
}

export async function generateInventoryPdf(options: {
  rows: InventoryPdfRow[];
  companyName?: string;
  usdot?: string;
  mc?: string;
  address?: string;
  generatedAt?: Date;
  timeZone?: string;
  sample?: boolean;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const [normal, bold, mono] = await Promise.all([
    doc.embedFont(StandardFonts.Helvetica),
    doc.embedFont(StandardFonts.HelveticaBold),
    doc.embedFont(StandardFonts.Courier),
  ]);
  const brand = {
    ...INVENTORY_BRANDING,
    ...Object.fromEntries(
      Object.entries(options).filter(
        ([key, value]) =>
          ["companyName", "usdot", "mc", "address"].includes(key) &&
          typeof value === "string" &&
          value.trim(),
      ),
    ),
  };
  const dates = inventoryReportDate(options.generatedAt, options.timeZone);
  doc.setTitle("Trailer Inventory Report");
  doc.setAuthor(brand.companyName);
  doc.setSubject("Complete trailer inventory by category");
  doc.setCreationDate(options.generatedAt ?? new Date());
  let page!: PDFPage;
  let y = 0;
  const text = (
    value: string,
    x: number,
    baseline: number,
    size = 9,
    font = normal,
    color = navy,
  ) => page.drawText(safeText(value), { x, y: baseline, size, font, color });
  const right = (
    value: string,
    rightX: number,
    baseline: number,
    size = 9,
    font = normal,
    color = navy,
  ) =>
    text(
      value,
      rightX - font.widthOfTextAtSize(safeText(value), size),
      baseline,
      size,
      font,
      color,
    );
  const fitted = (
    value: string,
    x: number,
    baseline: number,
    maxWidth: number,
    size: number,
    font: PDFFont,
    color = navy,
  ) => {
    const clean = safeText(value).replace(/\n/g, " ");
    const measured = font.widthOfTextAtSize(clean, size);
    text(
      clean,
      x,
      baseline,
      Math.min(size, (size * maxWidth) / Math.max(measured, 1)),
      font,
      color,
    );
  };
  function newPage(first = false) {
    page = doc.addPage([WIDTH, HEIGHT]);
    page.drawRectangle({
      x: 0,
      y: HEIGHT - 46,
      width: WIDTH,
      height: 46,
      color: navy,
    });
    page.drawRectangle({
      x: 0,
      y: HEIGHT - 49,
      width: WIDTH,
      height: 3,
      color: rgb(0.77, 0.59, 0.22),
    });
    fitted(
      brand.companyName.toUpperCase(),
      MARGIN,
      HEIGHT - 29,
      380,
      16,
      bold,
      white,
    );
    right(
      `USDOT ${brand.usdot}   |   MC ${brand.mc}`,
      WIDTH - MARGIN,
      HEIGHT - 20,
      9,
      normal,
      white,
    );
    const addressWidth = 310;
    const address = safeText(brand.address).replace(/\n/g, ", ");
    const addressSize = Math.min(
      8.6,
      (8.6 * addressWidth) /
        Math.max(normal.widthOfTextAtSize(address, 8.6), 1),
    );
    right(address, WIDTH - MARGIN, HEIGHT - 32, addressSize, normal, white);
    y = 534;
    if (first) {
      text("Trailer Inventory", MARGIN, y, 23, bold);
      text(`As of ${dates.long}`, MARGIN, y - 16, 9, normal, gray);
      const top = 498,
        h = 64,
        w = CONTENT / 4;
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i],
          x = MARGIN + i * w;
        page.drawRectangle({
          x,
          y: top - h,
          width: w,
          height: h,
          color: pale,
          borderColor: border,
          borderWidth: 0.6,
        });
        const count = String(
          options.rows.filter((r) => r.category === section.key).length,
        );
        text(
          count,
          x + (w - bold.widthOfTextAtSize(count, 20)) / 2,
          top - 30,
          20,
          bold,
          section.color,
        );
        text(
          section.summary,
          x + (w - normal.widthOfTextAtSize(section.summary, 8)) / 2,
          top - 49,
          8,
          normal,
          gray,
        );
      }
      y = 404;
    }
  }
  const descriptions: Record<string, string> = {
    under_mc: `Units operating under MC ${brand.mc}`,
    pending_insurance: "Awaiting insurance processing",
    rented_out: "Trailers currently leased or assigned to customers",
    sold: "Sold units retained for inventory history",
  };
  type Column = { label: string; width: number; font: PDFFont; size: number };
  function columns(sold: boolean, last: string): Column[] {
    const widths = sold
      ? [24, 202, 158, 86, 175, 75]
      : [28, 238, 188, 115, 151];
    const labels = sold
      ? ["#", "Year / Make / Model", "VIN", "Plate #", "Sold To", "Sold Date"]
      : ["#", "Year / Make / Model", "VIN", "Plate #", last];
    return labels.map((label, i) => ({
      label,
      width: widths[i],
      font: i === 1 ? bold : i === 2 ? mono : normal,
      size: i === 2 ? 8.5 : 9,
    }));
  }
  function tableHeader(cols: Column[], color: ReturnType<typeof rgb>) {
    page.drawRectangle({
      x: MARGIN,
      y: y - 22,
      width: CONTENT,
      height: 22,
      color,
    });
    let x = MARGIN;
    for (const col of cols) {
      text(col.label, x + 7, y - 14, 8.3, bold, white);
      x += col.width;
    }
    y -= 22;
  }
  function sectionHeading(
    index: number,
    cols: Column[],
    count: number,
    continued = false,
  ) {
    const section = sections[index];
    text(
      section.title + (continued ? " (continued)" : ""),
      MARGIN,
      y,
      13.5,
      bold,
    );
    right(
      `${count} ${count === 1 ? "unit" : "units"}`,
      WIDTH - MARGIN,
      y,
      10.5,
      bold,
      section.color,
    );
    page.drawLine({
      start: { x: MARGIN, y: y - 8 },
      end: { x: WIDTH - MARGIN, y: y - 8 },
      thickness: 1.6,
      color: section.color,
    });
    text(descriptions[section.key], MARGIN, y - 20, 8.5, normal, gray);
    y -= 29;
    tableHeader(cols, section.color);
  }
  newPage(true);
  for (let index = 0; index < sections.length; index++) {
    const section = sections[index];
    const rows = options.rows.filter((r) => r.category === section.key);
    // Match the reference's second-page grouping for rented and sold trailers.
    if (index === 2) newPage();
    const last =
      index === 0 ? "Unit Hauling" : index === 1 ? "Status" : "Rented To";
    const cols = columns(index === 3, last);
    if (y - 100 < BOTTOM) newPage();
    sectionHeading(index, cols, rows.length);
    if (!rows.length) {
      page.drawRectangle({
        x: MARGIN,
        y: y - 25,
        width: CONTENT,
        height: 25,
        color: pale,
        borderColor: border,
        borderWidth: 0.5,
      });
      text(
        "No trailers in this category.",
        MARGIN + 8,
        y - 16,
        9,
        normal,
        gray,
      );
      y -= 25;
    }
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      const extra: string[] = [];
      if (index !== 0 && row.unit) extra.push(`Unit hauling: ${row.unit}`);
      if (
        ![
          "Available",
          "Rented",
          "Sold",
          "Pending insurance",
          "Rental setup needed",
        ].includes(row.availability)
      )
        extra.push(row.availability);
      const model = [row.makeModel, ...extra].join("\n");
      const date = row.soldDate
        ? /^\d{4}-\d{2}-\d{2}$/.test(row.soldDate)
          ? row.soldDate.slice(5, 7) +
            "/" +
            row.soldDate.slice(8, 10) +
            "/" +
            row.soldDate.slice(0, 4)
          : row.soldDate
        : "-";
      const values =
        index === 3
          ? [
              String(rowIndex + 1),
              model,
              row.vin,
              row.plate || "-",
              row.buyer || "-",
              date,
            ]
          : [
              String(rowIndex + 1),
              model,
              row.vin,
              row.plate || "-",
              index === 0
                ? row.unit || "-"
                : index === 1
                  ? "Pending with insurance"
                  : row.renter || "-",
            ];
      const lines = values.map((value, i) =>
        wrapInventoryText(
          value,
          cols[i].font,
          cols[i].size,
          cols[i].width - 14,
        ),
      );
      const total = Math.max(...lines.map((l) => l.length));
      let offset = 0;
      while (offset < total) {
        if (y - 23 < BOTTOM) {
          newPage();
          sectionHeading(index, cols, rows.length, true);
        }
        const capacity = Math.max(1, Math.floor((y - BOTTOM - 12) / 11));
        const take = Math.min(total - offset, capacity),
          height = Math.max(23, take * 11 + 12);
        page.drawRectangle({
          x: MARGIN,
          y: y - height,
          width: CONTENT,
          height,
          color: rowIndex % 2 ? pale : white,
          borderColor: border,
          borderWidth: 0.5,
        });
        let x = MARGIN;
        for (let c = 0; c < cols.length; c++) {
          const visible = lines[c].slice(offset, offset + take);
          visible.forEach((line, l) =>
            text(line, x + 7, y - 15 - l * 11, cols[c].size, cols[c].font),
          );
          x += cols[c].width;
        }
        y -= height;
        offset += take;
      }
    }
    y -= 31;
  }
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    page = pages[i];
    page.drawLine({
      start: { x: MARGIN, y: 36 },
      end: { x: WIDTH - MARGIN, y: 36 },
      thickness: 0.6,
      color: border,
    });
    text(
      `${options.sample ? "SAMPLE - " : ""}Trailer Inventory Report  |  As of ${dates.short}`,
      MARGIN,
      25,
      8,
      normal,
      gray,
    );
    right(
      `Page ${i + 1} of ${pages.length}`,
      WIDTH - MARGIN,
      25,
      8,
      normal,
      gray,
    );
  }
  return doc.save();
}
