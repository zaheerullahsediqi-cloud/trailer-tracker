"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trailers", label: "Trailers", icon: Truck },
  { href: "/rentals", label: "Rentals", icon: FileText },
  { href: "/history", label: "History", icon: History },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/renters", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
              active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-accent-light" />}
            <Icon size={18} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
