export async function getCompanySettings(supabase: any) {
  const { data } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();
  return {
    companyName: data?.company_name || process.env.COMPANY_NAME || "Trailer Tracker",
    contactEmail: data?.contact_email || process.env.OWNER_EMAIL || "",
    logoUrl: data?.logo_url || null,
    companyAddress: data?.company_address || "",
  };
}

// Fetches the logo image bytes for embedding into a PDF. Returns null on
// any failure so a broken/unreachable logo never breaks invoice generation.
export async function fetchLogoForPdf(
  logoUrl: string | null
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    const arrayBuffer = await res.arrayBuffer();
    return { bytes: new Uint8Array(arrayBuffer), contentType };
  } catch {
    return null;
  }
}
