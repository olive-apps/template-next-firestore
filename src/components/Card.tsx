import type { ReactNode } from "react";

// Editorial card: no shadow, no rounded corners, no fill — just a hairline
// rule on the top edge that lets the serif heading carry the weight. Read
// OLIVE_APPS_DESIGN_LANGUAGE.md "Components" before reaching for cards as
// the default grouping primitive; lists with hairline dividers usually
// read better.
export interface CardProps {
  readonly title: string;
  readonly children: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <section className="border-t border-hairline pt-6">
      <h2 className="mb-2 font-serif text-xl font-semibold tracking-editorial">
        {title}
      </h2>
      <div className="font-sans text-base text-ink leading-relaxed">
        {children}
      </div>
    </section>
  );
}
