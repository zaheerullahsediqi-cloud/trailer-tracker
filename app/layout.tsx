import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import TopBar from "./top-bar";
import ThemeScript from "./theme-script";
import { createClient } from "@/lib/supabase/server";
import { syncNotifications } from "@/lib/notifications";

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
    await syncNotifications(supabase);
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null)
      .is("dismissed_at", null);
    alertCount = count ?? 0;
  }

  return (
    <html lang="en">
      <head>
        <ThemeScript />
      </head>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <MobileNav userEmail={user?.email ?? null} />
            {user && <TopBar alertCount={alertCount} userEmail={user.email ?? ""} />}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
