const REPLACEMENTS: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2026": "...",
  "\u2039": "<",
  "\u203A": ">",
  "\u00AB": "<<",
  "\u00BB": ">>",
  "\u2192": "->",
  "\u2190": "<-",
  "\u2022": "-",
  "\u00A0": " ",
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
      out += ch;
    } else if (code >= 0xa0 && code <= 0xff) {
      out += ch;
    }
  }
  return out;
}
