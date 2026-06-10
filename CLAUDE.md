# CLAUDE.md

This file is the contract for any Claude session — local or worker-driven —
that edits code inside a generated Olive user app. Read it once before
touching the repo. Re-read it when in doubt.

This is the **user's app**, not Olive's app. Olive built it. The end user
opens this app and interacts with their thing. Nothing in the user-facing
surface refers to Olive.

## Design Language — read it before writing UI

**Before you write any UI for this repo, read
[`OLIVE_APPS_DESIGN_LANGUAGE.md`](./OLIVE_APPS_DESIGN_LANGUAGE.md).** It
is canonical for everything visual in an Olive-built app: typography
(Fraunces titles, Inter body, JetBrains Mono code), color (the
disciplined olive-gold accent, ink + paper variables, dark mode via CSS
variables), icons (Material Symbols Outlined — never emoji), components
(`<EditorialHeader>`, `<Stamp>`, `<Eyebrow>`, `<Dek>`), what never gets
used (rounded card backgrounds, gradients, spinners, generated art, the
word "Loading…"). The fonts and CSS variables are already wired in
`src/app/layout.tsx` + `src/app/globals.css` + `tailwind.config.ts` — you
inherit them, you don't redefine them.

This `CLAUDE.md` governs editor behavior (commits, TypeScript strictness,
dependency discipline, the latency framing). The design language governs
what gets *rendered*. They complement each other; do not duplicate one
inside the other.

## Register

The voice of every visible string in this app:

- **Serif. Editorial. Quiet.** Use the type stack the design language
  ships — `font-serif` (Fraunces) for headings, `font-sans` (Inter) for
  body, `font-mono` (JetBrains Mono) for code. Never reach for a
  chunky display weight above 700.
- **Third register, not second.** Do not address the end user as "you" in
  copy. Write "Tap to begin," not "Tap below to begin your journey."
  Write "A small note," not "Your small note." This is the same register
  the New Yorker uses for a caption: descriptive, restrained, not
  performative.
- **Never refer to Olive in user-facing copy.** No "powered by Olive," no
  "Olive built this," no "ask Olive." The user knows where the app came
  from. The app is the user's now.
- **No marketing voice.** No exclamation points, no "Welcome!", no "Let's
  get started." If a sentence could appear in a SaaS landing page, rewrite
  it.

## Latency framing

This is load-bearing. Never write "Loading..." anywhere in the app.
Never render a spinning gear, never render a progress bar.

When the app is waiting on Firestore, on a Server Action, on a build-time
fetch, on anything — the user-facing surface should either:

1. Show a quiet ellipsis ("…") on its own line, in serif, in muted ink.
2. Show the phrase **"Olive is thinking."** verbatim. This is the one
   acceptable place to name Olive in the surface, because it frames the
   wait as consideration, not loading.

Either is fine. A spinner is not.

## Conventional commits

Every commit message uses one of these prefixes, lowercase, followed by a
colon and a short imperative summary. No exceptions.

| Prefix | Use for |
| --- | --- |
| `feat:` | A new user-visible capability |
| `fix:` | A bug fix |
| `refactor:` | A restructuring with no behavior change |
| `perf:` | A performance improvement |
| `test:` | Adding or updating tests |
| `docs:` | Documentation changes (README, this file, code comments) |
| `chore:` | Tooling, config, lockfile, CI |
| `style:` | Formatting, whitespace, semicolons — no logic change |

A breaking change appends `!` before the colon: `feat!: rename collection`.
The body of the commit explains why; the title is for the prefix and the
verb.

Do not write "WIP," "fix stuff," "update," or any other unprefixed message.
Do not chain prefixes (`feat: fix:`). Do not write the prefix in caps.

## TypeScript

- `tsconfig.json` is strict. Do not turn off `strict`, do not turn off
  `noUncheckedIndexedAccess`, do not turn off `noImplicitAny`.
- **Zero `any`.** If a value is genuinely untyped, write `unknown` and
  narrow it before use.
- **No `// @ts-ignore`, no `// @ts-expect-error` without a written
  explanation.** If the type system is in your way, the type system is
  usually right. Restructure.
- **No `!` non-null assertions** unless the line immediately above proves
  the value is non-null with a runtime check.
- **Prefer `readonly`** for component props and for arrays passed across
  module boundaries.

## Dependencies

Do not run `npm install <package>` without justification written into the
commit body. A user app's `package.json` should stay small — fewer
dependencies means faster cold start, smaller bundle, fewer supply-chain
surfaces.

Rules of thumb:

- **Firestore.** Use the helpers in `src/lib/olive-app.ts`. Do not add a
  Firestore wrapper library (no `react-firebase-hooks`, no `firestorter`).
  The bare Admin SDK is enough.
- **UI primitives.** Do not add `shadcn/ui` or Radix unless a specific
  user-visible feature genuinely needs an unmanaged-component primitive
  (a date picker, a combobox with type-ahead). One-off composition in a
  small file under `src/components/` is the default.
- **Auth.** Do not add Clerk, Auth.js, NextAuth, Lucia, or any auth
  library. v1 user apps are anonymous; the Firestore security rules scope
  data per-app, not per-user.
- **State.** Do not add Redux, Zustand, Jotai, Recoil. React's built-in
  state is the right tool for v1 surfaces. If global state genuinely
  appears, write a small Context provider in `src/lib/`.
- **Forms.** Do not add `react-hook-form`, `formik`, `zod`-based form
  libraries. Native `<form>` + Server Actions is the right shape.
- **Validation.** A small handwritten validator is the default. `zod` is
  allowed if and only if you write three or more parsers.
- **ORMs.** Do not add Drizzle, Prisma, or any ORM. Firestore is the
  database.
- **Date libraries.** Use `Intl.DateTimeFormat` and native `Date` first.
  Add `date-fns` only if you reach for three or more of its functions in
  the same change.

When in doubt, write 30 lines instead of installing 30 kilobytes.

## Server Components, not client

Default every new component to a Server Component. Add the `"use client"`
directive only when the component genuinely needs:

- An event handler (`onClick`, `onChange`, `onSubmit` — though Server
  Actions cover most form cases).
- A browser-only API (`window`, `localStorage`, `IntersectionObserver`).
- A hook that requires the client (`useState`, `useEffect`, `useRouter`).

Server Components compose cleanly, prerender to static HTML for the
static export, and never ship their code to the user's browser. They are
the default for a reason.

## Tests

- Use **Vitest** (already a devDependency). Do not add `jest`, `mocha`,
  `ava`, or another runner.
- Co-locate tests: `Foo.tsx` and `Foo.test.tsx` in the same directory.
- A test is **required** for any component or helper with branching
  logic, data shaping, or Firestore interaction.
- A test is **optional** for a small presentational component that just
  renders props. Do not pad the test suite with assertions on static
  markup.
- Test the contract, not the implementation: assert what the component
  does, not how.

## Empty states

There is no "No data," "No results found," or "Nothing here yet" in this
app. If a Firestore query returns an empty array, render a sentence in
serif that explains what will appear once the relevant action happens.

A correct empty state names the action and the future state:

> Notes you save will appear here.

A wrong empty state names the absence:

> No notes yet.

The first is editorial; the second is administrative.

## Errors

Server Actions and route handlers can fail. When they do, the surface
should:

- Show one sentence in serif, in muted ink, that names what didn't
  happen and what the user can do.
- Not show a stack trace. Not show an error code. Not show a red box.
- Use the existing `Card` component or plain `<p>` — not an alert
  pattern lifted from a UI library.

```
The note didn't save. Tap again, or come back in a moment.
```

## File layout

- `src/app/` — App Router routes. One folder per route. `page.tsx` for the
  route, `layout.tsx` for nested layouts, `loading.tsx` and `error.tsx`
  only when they would meaningfully improve the user surface (and even
  then, write them in this voice).
- `src/components/` — small, named, focused components. One responsibility
  each. If a component exceeds ~120 lines, ask whether it should split.
- `src/lib/` — helpers, Firestore wrappers, formatters, validators.
  Anything non-React lives here.
- `public/` — static assets served as-is.

## Per-app Firestore

This app reads and writes Firestore under `/apps/{appId}/**` — never
anywhere else. The scoping is enforced at the database, not just by
convention: the custom token signed at deploy time carries the `appId`
as a claim, and Firestore security rules reject any path outside that
namespace.

Use the helpers in `src/lib/olive-app.ts` — `appCollection('notes')`
and `appDoc('notes', id)`. Do not reach for the Firestore SDK directly;
the helpers ensure the path stays scoped.

Every data-reading component must `await ensureReady()` once at mount
before reading. The underlying sign-in promise is cached, so calling it
from every component is cheap.

Custom tokens live 24 hours. After that, the deployed app's Firestore
reads fail with `unauthenticated`. The fix is to redeploy — the per-app
credential mints a fresh token. Treat 24-hour expiry as a known
limitation; longer-lived auth is a v2 concern.

## The instrument profile (Brief Instruments)

**When the build's skill is `brief-instrument`** (the spec or claim says so),
this repo is being commissioned as an *instrument* — a mini app living as a
section of Olive's Brief, rendered inside iOS from a locally cached bundle
with NO network, reading the user's data only through the native bridge.
Constitutional frame: Agency Article 19 (Instrument Autonomy). The rules
below are gate-enforced (`eval/checks.py` + the platform release gate), not
suggestions.

- **Set `instrument.json`**: `instrument: true`, the name chosen with the
  user, the appId from the project setup, and the declared `scopes`
  (closed vocabulary; see `bridge/instrument.schema.json`). **Scopes are
  WRITE-ONCE** — a revision that changes them is refused at the gate;
  widening requires a fresh commission. `schemaVersion` bumps are
  additive-only.
- **Data comes from `src/lib/olive-bridge.ts` ONLY** (`import { olive } from
  "@/lib/olive-bridge"`). No firebase imports, no credentials, no fetch to
  anywhere — the bundle must render offline (`eval/checks.py
  bundle_offline`). Per-instrument state = `olive.store`; external data
  (e.g. forwarded e-mails) = `olive.ingest.read`.
- **Every bridge string is hostile input.** Render as text. The contract,
  corpus, and golden pairs live in `bridge/BRIDGE_PROTOCOL.md` +
  `bridge/protocol-fixtures.json` — additive changes only, in lockstep with
  the iOS tests.
- **Synthetic data is labeled and framed.** Bridge replies carry
  `synthetic`; when true the UI shows the rehearsal framing (the
  InstrumentFrame does this at the top level; in-content renderings of
  rehearsal values must keep the framing too). Synthetic NEVER renders as
  user truth.
- **The eval loop is the build loop.** Fill `eval/CONTRACT.md` (4–8
  dimensions), extend `eval/fixtures/build.py` for the domain (seeded,
  independent oracle), extend `eval/playwright/instrument.spec.ts` with
  values-match-oracle assertions, then iterate `npm run build && python3
  eval/run.py` until ALL gates are 1.0. If the spec and the tests cannot
  both be satisfied, STOP and report "cannot pass honestly" — abstention is
  a sanctioned, receipted outcome; weakening an assertion is gamed-gate
  quarantine.
- **Health-scoped instruments** (rendering ANY biometrics, including
  user-forwarded scale readings): no daily scores, no streaks, no
  restriction mechanics; honest absence; erasure is real (Article 18 rules
  1/3/4/5/9/10 via Article 19 rule 8). Never propose experiments over
  physiological data — that crosses into the Health Rhythm loop's
  jurisdiction, not yours.
- **Layout**: `InstrumentFrame` handles tile/full/web modes from the bridge
  handshake; build content for the tile first (one viewport, finishable),
  full mode second. The design language's "The Instrument Tile" section
  binds.

## What never lives in this repo

- Olive iOS code, Olive workers, anything from the broader Olive
  monorepo.
- API keys, service accounts, `.env` files with real values. The
  deployer injects `NEXT_PUBLIC_OLIVE_APP_ID` and
  `NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64` at build time. Locally,
  `.env.local` is git-ignored.
- Build artifacts (`.next/`, `out/`, `node_modules/`).
- Emojis in source code or documentation.

## End-user signups (opt-in)

**Default mode is anonymous-per-app.** The deployer mints a per-app
customToken and `ensureSignedIn()` in `src/lib/firebase.ts` signs in
immediately. There is no end-user identity inside the app — every visitor
shares one app-scoped session. Use `appCollection('notes')` and
`appDoc('notes', id)` for everything. Do NOT wire `SignInPage`; do NOT
import from `@/lib/auth`. The constitution prohibits Clerk / Auth.js /
Lucia and v1 user apps stay anonymous.

**When the PRD calls for end-user accounts**, the deployer provisions an
Identity Platform tenant for the app and the envelope flips to
`authMode: 'tenant'` with a `tenantId` field. The opt-in is dormant until
Bill flips Identity Platform multi-tenancy on the project — every
envelope before that flip is `authMode: 'anonymous-appid'` and the
sign-in UI never appears.

To detect the mode at runtime, read `envelope.authMode` from
`readEnvelopeFromEnv()` in `src/lib/firebase.ts`. The standard composition
when tenant mode is in play:

```tsx
"use client";
import { useCurrentUser } from "@/lib/auth";
import { SignInPage } from "@/components/SignInPage";

export default function Page() {
  const user = useCurrentUser();
  if (!user) return <SignInPage />;
  return <HomePage />;
}
```

Two data scopes are available in tenant mode:

- **`appCollection` / `appDoc`** — app-shared scope at
  `apps/{appId}/{collection}/{doc}`. Gated by `request.auth.token.appId`.
  Use for data every signed-in (or anonymous) user of the deployed app
  shares: public content, app settings, etc.
- **`userCollection` / `userDoc`** — per-user scope at
  `apps/{appId}/users/{uid}/{collection}/{doc}`. Gated by BOTH
  `request.auth.uid` AND `request.auth.token.appId`. Use for data that
  belongs to a single end-user: their notes, their preferences, their
  history.

The `signUpWithEmail` helper in `src/lib/auth.ts` automatically attaches
the `appId` custom claim to the new user via the api-pipeline
`set-app-claim` route — without it, Firestore + Storage rules deny
per-user reads. Do not call `createUserWithEmailAndPassword` directly.

`SignInPage` also offers a "Continue without an account" link backed by
`continueAsAppAnonymous` — this signs in with the envelope's customToken,
which carries the appId claim only (no uid). Visitors taking this path
can read app-shared data but cannot read or write per-user data.
Surface or hide the link based on the spec.

## Before you commit

1. `npm run typecheck` — clean.
2. `npm run build` — clean.
3. Tests pass for the file you touched.
4. Commit message has a conventional prefix.
5. No `console.log` left behind. No `TODO` without a name attached to it.
6. The user-visible copy reads like a caption, not a tooltip.

That's the contract. Keep the surface quiet, keep the bundle small, keep
the commits legible. The next session will thank you.
