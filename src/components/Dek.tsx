import type { ReactNode } from "react";

// Dek — the italic serif line beneath a headline that names the *why*,
// not the *what*. Always Fraunces italic, always muted ink. Read
// OLIVE_APPS_DESIGN_LANGUAGE.md "Voice" §5 before editing copy that lands
// here.
export interface DekProps {
  readonly children: ReactNode;
}

export function Dek({ children }: DekProps) {
  return (
    <p className="font-serif text-base italic text-ink-muted leading-relaxed">
      {children}
    </p>
  );
}
