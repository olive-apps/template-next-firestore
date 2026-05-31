import type { ReactNode, ButtonHTMLAttributes } from "react";

// Stamp — the gold editorial stamp on a primary CTA. Echoes the iOS
// EditorialStampLabel. Rectangle (no rounded corners), olive-gold
// background, paper text, tracked uppercase Inter bold. No shadow, no
// gradient, no glow. Hover is a quiet opacity dip — not performative.
//
// Use it for the ONE primary action per surface. Anything else is a
// secondary control (hairline border, no fill, ink-muted text).

type StampElement = "button" | "link";

type ButtonOnlyProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "as">;

export type StampProps =
  | (ButtonOnlyProps & {
      readonly as?: "button";
      readonly children: ReactNode;
    })
  | {
      readonly as: "link";
      readonly href: string;
      readonly children: ReactNode;
      readonly className?: string;
    };

const baseClasses =
  "inline-flex items-center justify-center bg-olive-gold px-5 py-3 font-sans text-[0.75rem] font-bold uppercase tracking-eyebrow text-paper transition-opacity hover:opacity-90 focus-visible:opacity-90 disabled:opacity-50";

export function Stamp(props: StampProps) {
  if (props.as === "link") {
    const { href, children, className } = props;
    return (
      <a
        href={href}
        className={`${baseClasses}${className ? ` ${className}` : ""}`}
      >
        {children}
      </a>
    );
  }

  const { children, className, type, ...rest } = props as ButtonOnlyProps & {
    readonly children: ReactNode;
  };

  return (
    <button
      {...rest}
      type={type ?? "button"}
      className={`${baseClasses}${className ? ` ${className}` : ""}`}
    >
      {children}
    </button>
  );
}
