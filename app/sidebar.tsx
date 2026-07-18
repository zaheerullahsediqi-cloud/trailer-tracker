import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  Package,
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

export default async function Sidebar({
  companyName,
  logoUrl,
}: {
  companyName: string;
  logoUrl: string | null;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-primary text-white min-h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-6 py-6 border-b border-white/10">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="w-9 h-9 rounded-lg object-contain bg-white/5 shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Package size={18} className="text-white" />
          </div>
        )}
        <div className="leading-tight min-w-0">
          <p className="font-bold text-[15px] tracking-tight truncate">{companyName}</p>
          <p className="text-[11px] text-slate-400">Fleet Management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors duration-150"
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
      </div>
    </aside>
  );
}
