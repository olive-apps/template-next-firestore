# olive-apps/template-next-firestore

The starter scaffold every Olive-managed app is generated from. The
provisioning endpoint hits
`POST /repos/olive-apps/template-next-firestore/generate` to create a per-user
repository, then the worker layer iterates on top of it from the user's voice
PRD.

## Shape

- Next.js 16 with the App Router, static export (`output: "export"`).
- React 19, TypeScript 5 in strict mode, ESM throughout.
- Tailwind CSS 4 with a five-token editorial palette.
- Firebase Admin SDK for server-side Firestore access, lazy-initialized.
- Every Firestore read/write is scoped to `apps/{appId}/{collection}` via the
  helpers in `src/lib/olive-app.ts` — security rules enforce the boundary.
- Anonymous v1: no auth, no Clerk, no Auth.js.

## Environment

Two variables. The provisioning endpoint sets both at deploy time.

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_OLIVE_APP_ID` | The app identifier. All Firestore paths nest under `apps/{this}/`. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Base64-encoded service account JSON, scoped to the app's Firestore subtree. |

See `.env.example` for the template.

## Run locally

```bash
npm install
npm run dev
```

The dev server boots without Firestore access — `firebase-admin` is lazy and
only initializes when a Server Component, Route Handler, or build-time
prerender actually touches Firestore. To exercise a Firestore-backed surface
locally, copy `.env.example` to `.env.local` and fill in real values.

## Build

```bash
npm run typecheck
npm run build
```

The build emits a static site to `out/`. `olive_host_deploy` (runtime
`static`) serves it.

## How the worker extends this scaffold

The worker reads the user's PRD, plans a change, and writes a conventional
commit that:

1. Adds a Server Component under `src/app/.../page.tsx`.
2. Adds Firestore-backed helpers under `src/lib/` using `appCollection()`.
3. Adds a small, self-contained component under `src/components/`.
4. Updates `src/app/page.tsx` to link the new surface.

The contract for those edits is in `CLAUDE.md`. Read that before generating
code into this template.

## Tests

Vitest is the only testing dependency. Add tests next to the file they cover
(`Component.tsx` + `Component.test.tsx`). Small components without logic can
skip tests; anything that branches, queries Firestore, or formats data should
have one.

## Empty states

There is no "No data" placeholder anywhere in the scaffold, and there should
not be one in any surface the worker adds. When a collection is empty, write
one sentence in serif explaining what will appear when the relevant action
happens. That sentence is the empty state.
