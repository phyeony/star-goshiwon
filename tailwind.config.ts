import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        caveat: ["Caveat", "cursive"],
        shadows: ["Shadows Into Light", "cursive"],
        patrick: ["Patrick Hand", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
