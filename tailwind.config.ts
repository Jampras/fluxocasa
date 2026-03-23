import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        neo: {
          yellow: "#FFE800",
          cyan: "#00E5FF",
          pink: "#FF2A85",
          lime: "#A6FF00",
          bg: "#FDFDFD",
          dark: "#0F172A",
        },
      },
      boxShadow: {
        neo: "4px 4px 0px 0px rgba(15,23,42,1)",
        "neo-sm": "2px 2px 0px 0px rgba(15,23,42,1)",
        "neo-lg": "8px 8px 0px 0px rgba(15,23,42,1)",
      },
      borderWidth: {
        "3": "3px",
      },
      keyframes: {
        "squish": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.95) translateY(2px)" }
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" }
        }
      },
      animation: {
        "squish": "squish 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
      }
    }
  },
  plugins: []
};

export default config;
