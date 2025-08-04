import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {},
  plugins: [tailwindcssAnimate],
} satisfies Config;
