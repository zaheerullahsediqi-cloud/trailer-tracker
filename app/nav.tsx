import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function Nav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-rig-700 bg-rig-900">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-wide text-rig-100">
          TRAILER <span className="text-signal">TRACKER</span>
        </Link>
        {user && (
          <nav className="flex items-center gap-4 text-sm font-display uppercase tracking-wide">
            <Link href="/" className="hover:text-signal">Dashboard</Link>
            <Link href="/trailers" className="hover:text-signal">Trailers</Link>
            <Link href="/renters" className="hover:text-signal">Renters</Link>
            <Link href="/rentals" className="hover:text-signal">Rentals</Link>
            <LogoutButton />
          </nav>
        )}
      </div>
    </header>
  );
}
