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
          tag: "#f5f7fb"
        },
        blue: {
          50: "#e9f7ff",
          100: "#dffafa",
          200: "#c9f7fb",
          300: "#8beef7",
          400: "#4bdcec",
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
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neon-blue': 'linear-gradient(135deg, #1677ff 0%, #0969e8 100%)',
        'neon-cyan': 'linear-gradient(135deg, #16c5d9 0%, #1677ff 100%)',
        'neon-pink': 'linear-gradient(135deg, #ff5c8a 0%, #1677ff 100%)',
        'neon-gradient': 'linear-gradient(135deg, #1677ff 0%, #16c5d9 52%, #8ec63f 100%)'
      },
      boxShadow: {
        soft: "0 18px 45px rgba(30, 80, 90, 0.08)",
        neon: "0 0 20px rgba(22,119,255,0.22), 0 0 40px rgba(22, 197, 217, 0.16)",
        glow: "0 0 30px rgba(22,119,255,0.22), inset 0 1px 0 0 rgba(255,255,255,0.7)",
        'glow-cyan': "0 0 30px rgba(22, 197, 217, 0.24), inset 0 1px 0 0 rgba(255,255,255,0.72)",
        'glow-pink': "0 0 30px rgba(255, 92, 138, 0.22), inset 0 1px 0 0 rgba(255,255,255,0.72)"
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'neon-glow': 'neon-glow 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s infinite',
        'slide-in-left': 'slide-in-left 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-in-right': 'slide-in-right 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'bounce-in': 'bounce-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both'
      },
      keyframes: {
        'gradient-shift': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' }
        },
        'neon-glow': {
          '0%, 100%': { 'text-shadow': '0 0 10px rgba(37, 99, 235, 0.3), 0 0 20px rgba(37, 99, 235, 0.15)' },
          '50%': { 'text-shadow': '0 0 20px rgba(59, 130, 246, 0.4), 0 0 30px rgba(37, 99, 235, 0.25)' }
        },
        'pulse-ring': {
          '0%': { 'box-shadow': '0 0 0 0 rgba(37, 99, 235, 0.5)' },
          '70%': { 'box-shadow': '0 0 0 15px rgba(37, 99, 235, 0)' },
          '100%': { 'box-shadow': '0 0 0 0 rgba(37, 99, 235, 0)' }
        }
      }
    }
  },
  plugins: []
};

export default config;
