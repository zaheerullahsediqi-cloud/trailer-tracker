import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import TopBar from "./top-bar";
import ThemeScript from "./theme-script";
import { createClient } from "@/lib/supabase/server";
import { syncNotifications, currentNotifications } from "@/lib/notifications";
import { getCompanySettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Trailer Tracker",
  description: "Trailer rental tracking, contracts, and invoicing.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alertCount = 0;
  if (user) {
    const current = await syncNotifications(supabase);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .is("read_at", null)
      .is("dismissed_at", null);
    alertCount = currentNotifications(data ?? [], current).length;
  }

  const { companyName, logoUrl } = await getCompanySettings(supabase);

  return (
    <html lang="en">
      <head>
        <ThemeScript />
      </head>
      <body>
        <div className="flex min-h-screen">
          <Sidebar companyName={companyName} logoUrl={logoUrl} />
          <div className="flex-1 min-w-0">
            <MobileNav userEmail={user?.email ?? null} companyName={companyName} logoUrl={logoUrl} />
            {user && <TopBar alertCount={alertCount} userEmail={user.email ?? ""} />}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
