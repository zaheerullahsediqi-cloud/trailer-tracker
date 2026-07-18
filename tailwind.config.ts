import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0F172A",
        secondary: "#1E293B",
        accent: {
          DEFAULT: "#2563EB",
          light: "#3B82F6",
          dark: "#1D4ED8",
        },
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        surface: "#F8FAFC",
        muted: "#64748B",
        border: "#E2E8F0",
      },
      fontFamily: {
        sans: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.06)",
        elevated: "0 10px 30px rgba(15, 23, 42, 0.10)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        slideUp: "slideUp 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
