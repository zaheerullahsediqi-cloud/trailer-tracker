"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "./theme-toggle";
import {
  Package,
  X,
  History,
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
  MoreHorizontal,
} from "lucide-react";

const bottomTabs = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/trailers", label: "Fleet", icon: Truck },
  { href: "/rentals", label: "Rentals", icon: FileText },
  { href: "/history", label: "History", icon: History },
];

const moreItems = [
  { href: "/renters", label: "Customers", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav({
  userEmail,
  companyName,
  logoUrl,
}: {
  userEmail: string | null;
  companyName: string;
  logoUrl: string | null;
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  if (!userEmail) return null;

  const isMoreActive = moreItems.some((i) => pathname?.startsWith(i.href));

  return (
    <>
      <header className="md:hidden bg-primary text-white sticky top-0 z-30 flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={companyName} className="w-7 h-7 rounded-md object-contain bg-white/95 p-0.5 shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
              <Package size={14} className="text-white" />
            </div>
          )}
          <span className="font-bold text-sm truncate">{companyName}</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Persistent bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-border dark:border-slate-800 flex items-stretch pb-[env(safe-area-inset-bottom)]">
        {bottomTabs.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.3 : 2} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
            isMoreActive ? "text-accent" : "text-muted"
          }`}
        >
          <MoreHorizontal size={20} strokeWidth={isMoreActive ? 2.3 : 2} />
          More
        </button>
      </nav>

      {/* Slide-up "More" sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40 animate-in" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl pb-[env(safe-area-inset-bottom)] animate-in max-h-[75vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="font-bold text-primary dark:text-white">More</p>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-muted">
                <X size={20} />
              </button>
            </div>
            <div className="px-3 pb-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium ${
                      active ? "bg-accent/10 text-accent" : "text-primary dark:text-slate-200"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-border dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-muted truncate">{userEmail}</p>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                  router.refresh();
                }}
                className="flex items-center gap-1.5 text-sm text-danger font-medium"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
