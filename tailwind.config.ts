import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./views/**/*.{js,ts,jsx,tsx,mdx}",
    "./entities/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F5",
        navy: {
          DEFAULT: "#1A2B4A",
          light: "#5A6B8A",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          dark: "#EE5A5A",
        },
        sage: {
          DEFAULT: "#6BCF9F",
          dark: "#4AB881",
        },
        ocean: {
          DEFAULT: "#4A90E2",
          dark: "#3A7BC8",
        },
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
