import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#c8a137",
        "navy-deep": "#001F3F",
        "navy-muted": "#1F3A5F",
        "background-light": "#FDFCF0",
        "background-dark": "#1f1c13",
        navy: "#001F3F",
        "secondary-blue": "#1f3a5f",
        "clay-shadow": "rgba(200, 161, 55, 0.15)",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        full: "9999px",
      },
      boxShadow: {
        clay: "inset 4px 4px 8px rgba(255,255,255,0.4), inset -4px -4px 8px rgba(0,0,0,0.05), 8px 8px 16px rgba(0,0,0,0.1)",
        "clay-hover":
          "inset 6px 6px 12px rgba(255,255,255,0.5), inset -6px -6px 12px rgba(0,0,0,0.08), 12px 12px 24px rgba(0,0,0,0.12)",
        "clay-inner":
          "inset 4px 4px 12px rgba(0,0,0,0.05), inset -4px -4px 12px rgba(255,255,255,0.5)",
        "clay-primary":
          "8px 8px 16px 0 rgba(200, 161, 55, 0.2), inset -4px -4px 8px 0 rgba(0, 0, 0, 0.1), inset 4px 4px 8px 0 rgba(255, 255, 255, 0.3)",
        "clay-btn":
          "8px 8px 16px 0 rgba(200, 161, 55, 0.3), inset -4px -4px 8px 0 rgba(0, 0, 0, 0.1), inset 4px 4px 8px 0 rgba(255, 255, 255, 0.3)",
        "clay-card":
          "12px 12px 24px #e0dfda, -12px -12px 24px #ffffff",
      },
    },
  },
  plugins: [],
};

export default config;
