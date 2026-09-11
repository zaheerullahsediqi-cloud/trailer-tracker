import { createClient } from "@/lib/supabase/server";
import SidebarNav from "./sidebar-nav";

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
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="w-11 h-11 rounded-xl object-contain bg-white/95 p-1 shrink-0" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-white/95 flex items-center justify-center shrink-0">
            <span className="text-primary font-extrabold text-base tracking-tight">
              {companyName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>
        )}
        <div className="leading-tight min-w-0">
          <p className="font-bold text-[15px] tracking-tight truncate">{companyName}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Fleet Management</p>
        </div>
      </div>

      <SidebarNav />

      <div className="px-6 py-5 border-t border-white/10">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Reliable trailers.
          <br />
          Stronger tomorrow.
        </p>
      </div>
    </aside>
  );
}
