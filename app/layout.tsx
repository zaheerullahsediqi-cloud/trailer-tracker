import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";

export const metadata: Metadata = {
  title: "Trailer Tracker",
  description: "Trailer rental tracking, contracts, and invoicing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0">
            <MobileNav />
            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 animate-in">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
