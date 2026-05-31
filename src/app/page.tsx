import { EditorialHeader } from "@/components/EditorialHeader";
import { Stamp } from "@/components/Stamp";

// The home page is intentionally sparse. The worker will replace this with
// whatever the PRD describes. The current shape exists so a freshly-
// provisioned repo renders a surface that READS as design-system-compliant,
// and so anyone landing on the template repo sees the register in action.
export default function HomePage() {
  return (
    <article className="space-y-12">
      <EditorialHeader
        eyebrow="Today"
        title="A small new app."
        dek="The shape of this page will become specific as the first note lands."
      />

      <section className="space-y-6">
        <p className="font-sans text-base leading-relaxed">
          This page is the starting point. Soon it will be the thing it
          should be — drawn from the conversation that built it.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <Stamp as="link" href="#begin">
            BEGIN
          </Stamp>
          <a
            href="#about"
            className="inline-flex items-center gap-1 font-sans text-sm text-ink-muted hover:text-ink"
          >
            <span>About this</span>
            <span
              aria-hidden="true"
              className="material-symbols-outlined align-middle text-[1.125em]"
            >
              arrow_outward
            </span>
          </a>
        </div>
      </section>

      <section
        id="about"
        className="border-t border-hairline pt-8 space-y-3"
      >
        <p className="font-sans text-[0.6875rem] font-bold uppercase tracking-eyebrow text-olive-gold">
          II
        </p>
        <h2 className="font-serif text-2xl font-semibold leading-tight">
          A small section
        </h2>
        <p className="font-serif italic text-ink-muted leading-relaxed">
          The dek names why the section exists.
        </p>
        <p className="font-sans text-base leading-relaxed">
          The first paragraph of body content sets the situation, the
          complication, and the resolution. The register is editorial, not
          marketing.
        </p>
      </section>
    </article>
  );
}
