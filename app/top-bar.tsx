"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "./theme-toggle";
import { Search, Bell, Plus, ChevronDown, LogOut, Settings as SettingsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TopBar({
  alertCount,
  userEmail,
}: {
  alertCount: number;
  userEmail: string;
}) {
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="hidden md:flex items-center justify-between gap-4 px-8 py-3.5 border-b border-border dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20">
      <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trailers, customers, rentals..."
          className="input pl-9"
        />
      </form>

      <div className="flex items-center gap-2 shrink-0">
        <ThemeToggle />

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={17} />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-64 card p-3 z-30 animate-in">
              <p className="text-xs text-muted mb-2">
                {alertCount > 0
                  ? `${alertCount} unread notification${alertCount === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </p>
              <Link
                href="/notifications"
                onClick={() => setNotifOpen(false)}
                className="text-xs font-medium text-accent"
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={quickRef}>
          <button
            onClick={() => setQuickOpen((v) => !v)}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent text-white hover:bg-accent-dark transition-colors"
          >
            <Plus size={17} />
          </button>
          {quickOpen && (
            <div className="absolute right-0 mt-2 w-44 card p-1.5 z-30 animate-in">
              <Link href="/trailers" className="block px-3 py-2 text-sm rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
                Add trailer
              </Link>
              <Link href="/renters" className="block px-3 py-2 text-sm rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
                Add customer
              </Link>
              <Link href="/rentals" className="block px-3 py-2 text-sm rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
                New rental
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
              {userEmail?.[0]?.toUpperCase()}
            </div>
            <ChevronDown size={14} className="text-muted" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 card p-1.5 z-30 animate-in">
              <p className="px-3 py-2 text-xs text-muted truncate border-b border-border dark:border-slate-800 mb-1">
                {userEmail}
              </p>
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <SettingsIcon size={14} /> Settings
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                  router.refresh();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 text-danger"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
