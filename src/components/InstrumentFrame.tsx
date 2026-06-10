"use client";

/**
 * InstrumentFrame — the instrument profile's layout shell.
 *
 * RootLayout wraps children in this frame when instrument.json has
 * instrument:true. It resolves the display mode from the bridge's boot
 * handshake and adapts:
 *
 *  - "tile": the Brief beat already provides the editorial chrome (eyebrow,
 *    headline, gold rule) — the instrument renders CONTENT ONLY: compact
 *    padding, no masthead, height clamped to the viewport so the outer
 *    Brief scroll owns the gesture.
 *  - "full": the expanded instrument; roomier padding, the app's own
 *    EditorialHeader is appropriate here.
 *  - "web": the public slug URL — full layout plus the standing rehearsal
 *    line, because web-demo data is synthetic by construction and synthetic
 *    data NEVER renders as user truth (Agency Art 19 rule 5; the design
 *    language's honesty register).
 *
 * It also fires the `open` signal once per mount — the platform's cheapest
 * honest usage event.
 */

import { useEffect, useState, type ReactNode } from "react";
import { olive, type OliveContext } from "@/lib/olive-bridge";

export default function InstrumentFrame({
  children,
}: {
  readonly children: ReactNode;
}) {
  const [context, setContext] = useState<OliveContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    void olive.context().then((resolved) => {
      if (cancelled) return;
      setContext(resolved);
      olive.signal("open", {
        surface: resolved.displayMode === "tile" ? "tile" : "full",
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const mode = context?.displayMode ?? "tile";
  const synthetic = context?.synthetic ?? false;

  if (mode === "tile") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-4">
        {synthetic && <RehearsalLine />}
        {children}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 lg:px-12">
      {synthetic && <RehearsalLine />}
      {children}
    </main>
  );
}

/**
 * The standing synthetic-data label. Serif italic, quiet, unmissable —
 * "invented numbers, so you can judge it." Rendered whenever the bridge
 * context says the data underneath is rehearsal data.
 */
function RehearsalLine() {
  return (
    <p className="mb-4 font-serif italic text-sm" style={{ color: "var(--secondary, #6b6b6b)" }}>
      A rehearsal — invented numbers, so you can judge the shape of it.
    </p>
  );
}
