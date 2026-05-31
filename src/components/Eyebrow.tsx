import type { ReactNode } from "react";

// Eyebrow — the tracked uppercase category label above an H1 or H2.
// Olive-gold by default because that is the one place the accent earns
// its keep on every editorial surface. Read OLIVE_APPS_DESIGN_LANGUAGE.md
// "Components" before editing. Keep this small; the shape matters more
// than the file.
export interface EyebrowProps {
  readonly children: ReactNode;
  readonly muted?: boolean;
}

export function Eyebrow({ children, muted = false }: EyebrowProps) {
  return (
    <p
      className={`font-sans text-[0.6875rem] font-bold uppercase tracking-eyebrow ${
        muted ? "text-ink-muted" : "text-olive-gold"
      }`}
    >
      {children}
    </p>
  );
}
