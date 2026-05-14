import type { ReactNode } from "react";

// Editorial card: no shadow, no rounded corners, no fill — just a hairline rule
// on the top edge that lets the serif heading carry the weight.
export interface CardProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <section className="border-t border-[var(--hairline)] pt-6">
      <h2 className="mb-2 font-serif text-xl tracking-editorial">{title}</h2>
      <div className="text-base text-[var(--foreground)]">{children}</div>
    </section>
  );
}
