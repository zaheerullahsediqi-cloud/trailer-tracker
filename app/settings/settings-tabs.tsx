"use client";
import { useState } from "react";
import { Building2, ImageIcon, FileText } from "lucide-react";

const TABS = [
  { key: "profile", label: "Company Profile", icon: Building2 },
  { key: "branding", label: "Branding", icon: ImageIcon },
  { key: "invoice", label: "Invoice Preferences", icon: FileText },
];

export default function SettingsTabs({
  profile,
  branding,
  invoice,
}: {
  profile: React.ReactNode;
  branding: React.ReactNode;
  invoice: React.ReactNode;
}) {
  const [tab, setTab] = useState("profile");

  return (
    <div className="space-y-6">
      <div className="card p-1.5 flex gap-1 flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-accent/10 text-accent border-b-2 border-accent"
                  : "text-muted hover:text-primary dark:hover:text-white"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>
      {tab === "profile" && profile}
      {tab === "branding" && branding}
      {tab === "invoice" && invoice}
    </div>
  );
}
