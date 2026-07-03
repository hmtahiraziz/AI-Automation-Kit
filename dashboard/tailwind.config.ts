import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8F6",
        surface: "#FFFFFF",
        accent: {
          DEFAULT: "#0E7C5C",
          dark: "#0B6B4F",
          light: "#E4F3EC",
        },
        status: {
          success: { bg: "#DCF5E8", text: "#0E7C5C" },
          error: { bg: "#FDE2E2", text: "#D93636" },
          pending: { bg: "#FDF0D5", text: "#B8860B" },
          info: { bg: "#DCE9FD", text: "#1D5FD9" },
        },
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
};

export default config;
