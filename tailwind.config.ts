import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

import type { Config } from "tailwindcss";
// @ts-expect-error - typography does not have types exposed in this way usually but works in build

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "Manrope", "Sora", "sans-serif"],
        display: ["Sora", "Inter", "Manrope", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        highlight: {
          DEFAULT: "hsl(var(--highlight))",
          foreground: "hsl(var(--highlight-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        cyan: {
          50: "hsl(var(--cyan-50))",
          100: "hsl(var(--cyan-100))",
          200: "hsl(var(--cyan-200))",
          300: "hsl(var(--cyan-300))",
          400: "hsl(var(--cyan-400))",
          500: "hsl(var(--cyan-500))",
          600: "hsl(var(--cyan-600))",
          700: "hsl(var(--cyan-700))",
          800: "hsl(var(--cyan-800))",
          900: "hsl(var(--cyan-900))",
        },
        purple: {
          50: "hsl(var(--purple-50))",
          100: "hsl(var(--purple-100))",
          200: "hsl(var(--purple-200))",
          300: "hsl(var(--purple-300))",
          400: "hsl(var(--purple-400))",
          500: "hsl(var(--purple-500))",
          600: "hsl(var(--purple-600))",
          700: "hsl(var(--purple-700))",
          800: "hsl(var(--purple-800))",
          900: "hsl(var(--purple-900))",
        },
        engineering: {
          blue: "hsl(var(--engineering-blue))",
          cyan: "hsl(var(--engineering-cyan))",
          teal: "hsl(var(--engineering-teal))",
          emerald: "hsl(var(--engineering-emerald))",
          orange: "hsl(var(--engineering-orange))",
          amber: "hsl(var(--engineering-amber))",
          red: "hsl(var(--engineering-red))",
          purple: "hsl(var(--engineering-purple))",
          indigo: "hsl(var(--engineering-indigo))",
        },
        brand: {
          orange: "hsl(var(--brand-orange))",
          amber: "hsl(var(--brand-amber))",
          red: "hsl(var(--brand-red))",
          dark: "hsl(var(--brand-dark))",
          slate: "hsl(var(--brand-slate))",
        },
        steel: {
          50: "hsl(var(--steel-50))",
          100: "hsl(var(--steel-100))",
          200: "hsl(var(--steel-200))",
          300: "hsl(var(--steel-300))",
          400: "hsl(var(--steel-400))",
          500: "hsl(var(--steel-500))",
          600: "hsl(var(--steel-600))",
          700: "hsl(var(--steel-700))",
          800: "hsl(var(--steel-800))",
          900: "hsl(var(--steel-900))",
        },
        slate: {
          50: "hsl(var(--slate-50))",
          100: "hsl(var(--slate-100))",
          200: "hsl(var(--slate-200))",
          300: "hsl(var(--slate-300))",
          400: "hsl(var(--slate-400))",
          500: "hsl(var(--slate-500))",
          600: "hsl(var(--slate-600))",
          700: "hsl(var(--slate-700))",
          800: "hsl(var(--slate-800))",
          900: "hsl(var(--slate-900))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "light-accent": "hsl(var(--light-brand-accent))",
        "light-neutral": "hsl(var(--light-neutral-focus))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-x": "gradient-x 15s ease infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gradient-x": {
          "0%, 100%": {
            "background-size": "200% 200%",
            "background-position": "left center",
          },
          "50%": {
            "background-size": "200% 200%",
            "background-position": "right center",
          },
        },
      },
    },
  },
  plugins: [animate, typography],
} satisfies Config;
