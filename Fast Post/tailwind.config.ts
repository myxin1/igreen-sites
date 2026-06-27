import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090B",
        panel: "#111827",
        border: "#27272A",
        primary: "#7C3AED",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        subtext: "#94A3B8"
      },
      borderRadius: {
        card: "8px"
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
