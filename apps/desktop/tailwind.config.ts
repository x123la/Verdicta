import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        }
      },
      borderRadius: {
        lg: "1rem",
        md: "0.8rem",
        sm: "0.6rem"
      },
      fontFamily: {
        sans: ["\"IBM Plex Sans\"", "ui-sans-serif", "system-ui"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "monospace"]
      },
      boxShadow: {
        panel: "0 20px 40px rgba(0, 0, 0, 0.24)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
} satisfies Config;
