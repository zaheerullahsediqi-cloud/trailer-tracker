"use client";
import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.classList.contains("dark"), () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle dark mode"
      aria-pressed={dark}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
