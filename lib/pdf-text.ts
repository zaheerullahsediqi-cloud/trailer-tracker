// pdf-lib's built-in fonts (Helvetica, etc.) can only render the WinAnsi
// character set. Any text that reaches page.drawText() with a character
// outside that set — smart quotes from some sources, guillemets, arrows,
// emoji, non-Latin scripts — throws and breaks PDF generation entirely.
// Since names, addresses, and other fields are free-typed or pasted by
// users, this can happen with completely ordinary-looking data. Running
// every dynamic string through this first prevents that class of failure
// regardless of what gets typed or pasted in.

const REPLACEMENTS: Record<string, string> = {
  "\u2018": "'", // ‘
  "\u2019": "'", // ’
  "\u201C": '"', // “
  "\u201D": '"', // ”
  "\u2013": "-", // –
  "\u2014": "-", // —
  "\u2026": "...", // …
  "\u2039": "<", // ‹
  "\u203A": ">", // ›
  "\u00AB": "<<", // «
  "\u00BB": ">>", // »
  "\u2192": "->", // →
  "\u2190": "<-", // ←
  "\u2022": "-", // •
  "\u00A0": " ", // non-breaking space
};

export function safeText(input: string | null | undefined): string {
  if (!input) return "";
  let out = "";
  for (const ch of input) {
    const replacement = REPLACEMENTS[ch];
    if (replacement !== undefined) {
      out += replacement;
      continue;
    }
    const code = ch.codePointAt(0) || 0;
    if (code >= 0x20 && code <= 0x7e) {
      out += ch; // basic ASCII — always safe
    } else if (code >= 0xa0 && code <= 0xff) {
      out += ch; // Latin-1 supplement (é, ñ, ü, etc.) — WinAnsi-compatible
    }
    // anything else (emoji, CJK, other exotic punctuation) is dropped
    // rather than risk breaking the PDF
  }
  return out;
}
