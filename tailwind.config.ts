import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0B1B33",
        secondary: "#1E293B",
        accent: {
          DEFAULT: "#2454E0",
          light: "#5478E8",
          dark: "#1B3FB8",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        surface: "#FAF9F6",
        muted: "#6B7280",
        border: "#E8E6E0",
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
