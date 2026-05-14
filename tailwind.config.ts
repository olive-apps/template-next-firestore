import type { Config } from "tailwindcss";

// Olive editorial palette. The accent is disciplined — apply it only where it
// genuinely earns attention (single CTA per surface, an active state, a hairline
// underline). The neutral background and serif typography do most of the work.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oliveGold: "#B5944F",
        primaryBackground: "#f7f5ef",
        ink: "#1a1a1a",
        inkMuted: "#5a5a5a",
        hairline: "#d8d2c4",
      },
      fontFamily: {
        serif: [
          "New York",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
      },
      letterSpacing: {
        editorial: "-0.01em",
      },
    },
  },
  plugins: [],
};

export default config;
