"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary px-4">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-sm space-y-5 animate-in">
        <div>
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
            <span className="text-white font-bold text-sm">TT</span>
          </div>
          <p className="eyebrow">Sign in</p>
          <h1 className="page-title mt-1">Trailer Tracker</h1>
        </div>
        {error && (
          <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}
        <div>
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
