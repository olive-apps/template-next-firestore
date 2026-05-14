import { Card } from "@/components/Card";

// The home page is intentionally sparse. The worker will replace this with
// whatever the PRD describes. The current text exists so a freshly-provisioned
// repo renders something honest before any iteration has happened.
export default function HomePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-serif tracking-editorial">
          A small new app.
        </h1>
        <p className="text-base text-[var(--muted)]">
          This page is the starting point. Soon it will be the thing it should
          be.
        </p>
      </header>

      <Card title="What happens next">
        <p>
          The shape of this app will be drawn from a short conversation. When
          that conversation is done, this page will become the home of
          something specific.
        </p>
      </Card>
    </div>
  );
}
