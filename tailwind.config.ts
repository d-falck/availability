import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media", // follow the system light/dark setting
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
