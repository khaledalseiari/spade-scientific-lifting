import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand palette — see BRAND.md for usage rules.
        brand: {
          ink: "#2F0147", // deepest tone: nav, footer, hero bg, dark-mode base
          primary: "#610F7F", // primary buttons, links, active states
          accent: "#065A82", // headings, data viz, dividers
          support: "#84C7D0", // cards, badges, chips, secondary buttons
          highlight: "#75DDDD", // success/progress/hover highlight, used sparingly
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #2F0147 0%, #065A82 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
