export async function getCompanySettings(supabase: any) {
  const { data } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();
  return {
    companyName: data?.company_name || process.env.COMPANY_NAME || "Trailer Tracker",
    contactEmail: data?.contact_email || process.env.OWNER_EMAIL || "",
    logoUrl: data?.logo_url || null,
    companyAddress: data?.company_address || "",
    invoiceFooter: data?.invoice_footer || "",
  };
}

export async function fetchLogoForPdf(
  logoUrl: string | null
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!logoUrl) return null;
  try {
    const url = new URL(logoUrl);
    const base = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (url.origin !== base.origin || !url.pathname.startsWith("/storage/v1/object/public/branding/")) return null;
    const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!/^image\/(png|jpeg)(;|$)/i.test(contentType)) return null;
    if (Number(res.headers.get("content-length")) > 5 * 1024 * 1024) return null;
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const {value,done} = await reader.read(); if(done) break; size += value.length; if(size > 5*1024*1024) { await reader.cancel(); return null; } chunks.push(value); }
    const arrayBuffer = Buffer.concat(chunks);
    return { bytes: new Uint8Array(arrayBuffer), contentType };
  } catch {
    return null;
  }
}
