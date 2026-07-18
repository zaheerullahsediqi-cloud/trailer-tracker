"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./theme-toggle";
import {
  Package,
  Menu,
  X,
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trailers", label: "Trailers", icon: Truck },
  { href: "/renters", label: "Customers", icon: Users },
  { href: "/rentals", label: "Rentals", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav({ userEmail }: { userEmail: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  if (!userEmail) return null;

  return (
    <>
      <header className="md:hidden bg-primary text-white sticky top-0 z-30 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <Package size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm">Trailer Tracker</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setOpen(true)} className="p-2">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-primary text-white flex flex-col animate-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-bold text-sm">Menu</span>
            <button onClick={() => setOpen(false)} className="p-2">
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${
                    pathname === item.href ? "bg-white/10 text-white" : "text-slate-300"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-white/10">
            <p className="text-xs text-slate-400 truncate mb-2">{userEmail}</p>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
                router.refresh();
              }}
              className="flex items-center gap-2 text-sm text-danger"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
