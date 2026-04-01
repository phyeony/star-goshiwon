import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#182126",
        mist: "#eef1eb",
        clay: "#d8cab8",
        sand: "#f7f2ea",
        pine: "#31473a",
        coral: "#d66b4d"
      },
      fontFamily: {
        sans: ["'Avenir Next'", "Avenir", "system-ui", "sans-serif"],
        display: ["'Arial Narrow'", "'Avenir Next Condensed'", "'Trebuchet MS'", "sans-serif"]
      },
      boxShadow: {
        card: "0 24px 60px rgba(24, 33, 38, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
