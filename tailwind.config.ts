import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        rig: {
          950: "#0B1220",
          900: "#111B2E",
          800: "#182640",
          700: "#233252",
          600: "#334469",
          400: "#7A8CAD",
          200: "#C7D0E0",
          100: "#EEF1F6",
        },
        signal: {
          DEFAULT: "#E8A33D",
          dim: "#B9812C",
        },
        alert: "#D5493B",
        go: "#3E9B6F",
      },
      fontFamily: {
        display: ["'Barlow Condensed'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
