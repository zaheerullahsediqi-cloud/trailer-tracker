"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors duration-150 py-1.5"
    >
      <LogOut size={14} />
      Log out
    </button>
  );
}
