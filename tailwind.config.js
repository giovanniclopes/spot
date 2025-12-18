/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans Flex"', "sans-serif"],
      },
      colors: {
        brand: {
          primary: "#0F6CBD",
          secondary: "#005A9E",
          accent: "#8AB4F8",
          neutral: "#323130",
          surface: "#FAF9F8",
          DEFAULT: "#0F6CBD",
          light: "#8AB4F8",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        success: {
          DEFAULT: "oklch(0.6 0.15 150)",
          foreground: "oklch(0.98 0 0)",
        },
        error: {
          DEFAULT: "var(--color-destructive)",
          foreground: "oklch(0.98 0 0)",
        },
        warning: {
          DEFAULT: "oklch(0.75 0.15 70)",
          foreground: "oklch(0.2 0.04 265)",
        },
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.08)",
        medium: "0 4px 16px rgba(0, 0, 0, 0.12)",
        strong: "0 8px 24px rgba(0, 0, 0, 0.16)",
        "inner-soft": "inset 0 2px 4px rgba(0, 0, 0, 0.06)",
        card: "0 1px 3px rgba(15, 108, 189, 0.04), 0 2px 8px rgba(15, 108, 189, 0.06)",
        "card-hover": "0 4px 12px rgba(15, 108, 189, 0.08), 0 8px 24px rgba(15, 108, 189, 0.10)",
        elevated: "0 8px 16px rgba(15, 108, 189, 0.08), 0 12px 32px rgba(15, 108, 189, 0.12)",
      },
      fontSize: {
        "display-1": ["3.5rem", { lineHeight: "1.2", fontWeight: "600" }],
        "display-2": ["2.5rem", { lineHeight: "1.25", fontWeight: "600" }],
        "heading-1": ["2rem", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-2": ["1.5rem", { lineHeight: "1.35", fontWeight: "600" }],
        "heading-3": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["0.875rem", { lineHeight: "1.4", fontWeight: "400" }],
        overline: ["0.75rem", { lineHeight: "1.3", fontWeight: "500", letterSpacing: "0.05em" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      transitionDuration: {
        smooth: "250ms",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
