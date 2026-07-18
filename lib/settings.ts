export async function getCompanySettings(supabase: any) {
  const { data } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();
  return {
    companyName: data?.company_name || process.env.COMPANY_NAME || "Trailer Tracker",
    contactEmail: data?.contact_email || process.env.OWNER_EMAIL || "",
  };
}
