import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#121417",
        graphite: "#262b31",
        line: "#d9dee3",
        mist: "#f5f7f8",
        teal: {
          50: "#edfafa",
          100: "#d2f1ef",
          500: "#16817a",
          600: "#106a66",
          900: "#0e3938"
        },
        amber: {
          100: "#fff0c2",
          500: "#d1911f",
          700: "#8c5c0f"
        },
        coral: {
          100: "#ffe2db",
          500: "#d85b43"
        }
      },
      boxShadow: {
        panel: "0 18px 60px rgba(18, 20, 23, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

