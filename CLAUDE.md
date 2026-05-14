# CLAUDE.md

This file is the contract for any Claude session — local or worker-driven —
that edits code inside a generated Olive user app. Read it once before
touching the repo. Re-read it when in doubt.

This is the **user's app**, not Olive's app. Olive built it. The end user
opens this app and interacts with their thing. Nothing in the user-facing
surface refers to Olive.

## Register

The voice of every visible string in this app:

- **Serif. Editorial. Quiet.** Match the font family declared in
  `tailwind.config.ts` and `globals.css`. Never reach for a sans-serif
  display font, never reach for a chunky display weight.
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

## What never lives in this repo

- Olive iOS code, Olive workers, anything from the broader Olive
  monorepo.
- API keys, service accounts, `.env` files with real values. The
  provisioning endpoint sets `FIREBASE_SERVICE_ACCOUNT_JSON` at deploy
  time. Locally, `.env.local` is git-ignored.
- Build artifacts (`.next/`, `out/`, `node_modules/`).
- Emojis in source code or documentation.

## Before you commit

1. `npm run typecheck` — clean.
2. `npm run build` — clean.
3. Tests pass for the file you touched.
4. Commit message has a conventional prefix.
5. No `console.log` left behind. No `TODO` without a name attached to it.
6. The user-visible copy reads like a caption, not a tooltip.

That's the contract. Keep the surface quiet, keep the bundle small, keep
the commits legible. The next session will thank you.
