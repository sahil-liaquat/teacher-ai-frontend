import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teachpad: {
          ink: "#25262b",
          muted: "#6d6f78",
          blue: "#1677ff",
          aqua: "#dffafa",
          pink: "#ffdce8",
          yellow: "#fff0bf",
          lavender: "#e9e1ff",
          lilac: "#f2dcff",
          green: "#e5ffc6",
          mint: "#c7f7ed",
          sky: "#c9f7fb",
          peach: "#ffe1d2",
          red: "#ffd9de",
          panel: "#f8ffff",
          input: "#f7f8fb",
          tag: "#f5f7fb",
          cardBorder: "#eceef3"
        },
        fg: "#25262b",
        "fg-muted": "#6d6f78",
        brand: "#1677ff",
        "brand-text": "#0969e8",
        surface: "#ffffff",
        "surface-sunken": "#f7f8fb",
        blue: {
          50: "#f1f7ff",
          100: "#e3efff",
          200: "#c5ddff",
          300: "#96c2ff",
          400: "#61a3ff",
          500: "#1677ff",
          600: "#0969e8",
          700: "#075ac7",
          800: "#064a9f",
          900: "#073b7c",
          950: "#05264f"
        },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          cyan: "hsl(var(--accent-cyan))",
          pink: "hsl(var(--accent-pink))",
          green: "hsl(var(--accent-green))",
          orange: "hsl(var(--accent-orange))"
        }
      },
      fontSize: {
        micro: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lead: ["1.125rem", { lineHeight: "1.75rem" }],
        h3: ["1.375rem", { lineHeight: "1.75rem" }],
        h2: ["1.75rem", { lineHeight: "2.25rem" }],
        h1: ["2.25rem", { lineHeight: "2.5rem" }],
        display: ["3rem", { lineHeight: "1.1" }]
      },
      borderRadius: { chip: "4px", control: "8px", card: "12px", sheet: "16px" },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
      },
      boxShadow: {
        soft: "0 18px 45px rgba(30, 80, 90, 0.08)",
        e1: "0 1px 2px rgba(16,24,40,.06)",
        e2: "0 4px 12px rgba(16,24,40,.08)",
        e3: "0 12px 32px rgba(16,24,40,.12)"
      },
      animation: {
        'slide-in-left': 'slide-in-left 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-in-right': 'slide-in-right 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both'
      }
    }
  },
  plugins: []
};

export default config;
