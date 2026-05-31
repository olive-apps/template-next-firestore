import type { Config } from "tailwindcss";

// Olive Apps Design Language — Tailwind tokens. Read
// OLIVE_APPS_DESIGN_LANGUAGE.md before editing. The CSS variables live in
// globals.css; the Tailwind tokens below are aliases so utility classes
// (text-ink, bg-paper, font-serif, etc.) read the same single source.
//
// Discipline: the accent (olive-gold) belongs on exactly six surfaces
// (eyebrows, the gold Stamp, link hover underline, focus rings, active
// tab underline, one warmest word per standfirst). Anything else is the
// register breaking.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        paper: "var(--paper)",
        "ink-muted": "var(--ink-muted)",
        "olive-gold": "var(--olive-gold)",
        hairline: "var(--hairline)",
        // Legacy aliases retained for any existing surface that may
        // reference them; new code uses the tokens above.
        oliveGold: "var(--olive-gold)",
        primaryBackground: "var(--paper)",
        inkMuted: "var(--ink-muted)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      letterSpacing: {
        editorial: "-0.015em",
        eyebrow: "0.12em",
      },
    },
  },
  plugins: [],
};

export default config;
