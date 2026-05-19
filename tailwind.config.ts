import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
        'neon-blue': 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        'neon-cyan': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'neon-pink': 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        'neon-gradient': 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #10b981 100%)'
      },
      boxShadow: {
        soft: "0 18px 45px rgba(37, 99, 235, 0.15)",
        neon: "0 0 20px rgba(37, 99, 235, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)",
        glow: "0 0 30px rgba(37, 99, 235, 0.4), inset 0 1px 0 0 rgba(232, 236, 241, 0.08)",
        'glow-cyan': "0 0 30px rgba(59, 130, 246, 0.4), inset 0 1px 0 0 rgba(232, 236, 241, 0.08)",
        'glow-pink': "0 0 30px rgba(96, 165, 250, 0.4), inset 0 1px 0 0 rgba(232, 236, 241, 0.08)"
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
