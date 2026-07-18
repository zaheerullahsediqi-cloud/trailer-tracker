import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import { Package } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/trailers", label: "Trailers" },
  { href: "/renters", label: "Customers" },
  { href: "/rentals", label: "Rentals" },
];

export default async function MobileNav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <header className="md:hidden bg-primary text-white sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <Package size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">Trailer Tracker</span>
        </Link>
        <LogoutButton />
      </div>
      <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-xs font-medium text-slate-300 hover:text-white whitespace-nowrap px-3 py-1.5 rounded-md hover:bg-white/5"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
