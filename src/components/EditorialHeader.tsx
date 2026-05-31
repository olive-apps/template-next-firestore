import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { Dek } from "./Dek";

// EditorialHeader — the canonical page-title pattern. Optional eyebrow →
// serif H1 → optional italic dek, closed by a single hairline rule. Every
// page surface uses this; do not invent new header registers. Read
// OLIVE_APPS_DESIGN_LANGUAGE.md "Components" before editing.
export interface EditorialHeaderProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly dek?: string;
  readonly trailing?: ReactNode;
}

export function EditorialHeader({
  eyebrow,
  title,
  dek,
  trailing,
}: EditorialHeaderProps) {
  return (
    <header className="border-b border-hairline pb-6 mb-8 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight tracking-editorial">
            {title}
          </h1>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
      {dek ? <Dek>{dek}</Dek> : null}
    </header>
  );
}
