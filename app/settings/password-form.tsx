"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "error", text: "Passwords don't match." });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Password updated." });
    setPassword("");
    setConfirm("");
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      <p className="eyebrow">Change password</p>
      {message && (
        <p
          className={`text-sm rounded-lg px-3 py-2.5 ${
            message.type === "success" ? "text-success bg-success/5" : "text-danger bg-danger/5"
          }`}
        >
          {message.text}
        </p>
      )}
      <div>
        <label className="label">New password</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Confirm new password</label>
        <input
          type="password"
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <button className="btn-primary" disabled={saving}>
        {saving ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}
