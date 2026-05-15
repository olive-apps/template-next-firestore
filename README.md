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
- Firebase Web SDK for client-side Firestore access. The deployer mints a
  per-app custom token at build time; the bundle decodes it on boot and calls
  `signInWithCustomToken` to enter an authenticated session whose `appId`
  claim gates Firestore reads.
- Every Firestore read/write is scoped to `apps/{appId}/{collection}` via the
  helpers in `src/lib/olive-app.ts` — security rules enforce the boundary.
- Anonymous v1: no Clerk, no Auth.js. The custom-token sign-in is the auth.

## Environment

Four `NEXT_PUBLIC_*` variables. The deployer (the Routine that calls
`olive_mint_per_app_credential` and then `olive_host_deploy`) sets them at
build time, where Next.js inlines the values into the static `out/` bundle.

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_OLIVE_APP_ID` | The app identifier. All Firestore paths nest under `apps/{this}/`. |
| `NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64` | Base64-encoded per-app credential envelope. Decoded at boot; the custom token inside is exchanged into an ID token with the `appId` claim. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public Firebase Web SDK API key for `api-pipeline-prod-231c3`. Not secret — only identifies which Firebase project the client talks to. The template defaults to the production project's value. |
| `NEXT_PUBLIC_FIREBASE_WEB_APP_ID` | Public Firebase Web SDK app ID. Same scope as `API_KEY`. |

See `.env.example` for the template values. The deployer is responsible for
ensuring `NEXT_PUBLIC_OLIVE_APP_ID` and `NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64`
are present at build time; the Firebase config values default to the
production project so a freshly-deployed app works without further plumbing.

The custom token has a 24-hour TTL. After it expires, the deployed app's
Firestore reads fail with `unauthenticated` and the app must be rebuilt +
redeployed (the deployer mints a fresh credential as part of each build).

## Run locally

```bash
npm install
npm run dev
```

The dev server boots without Firestore access — `firebase` is lazy-initialized
and only opens a connection when a component awaits `ensureReady()`. To
exercise a Firestore-backed surface locally, copy `.env.example` to
`.env.local` and fill in a real `NEXT_PUBLIC_OLIVE_APP_ID` and
`NEXT_PUBLIC_FIREBASE_CUSTOM_TOKEN_B64` minted by api-pipeline's
`olive_mint_per_app_credential` tool.

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

1. Adds a Client Component under `src/app/.../page.tsx` (or a Server
   Component that defers Firestore work to a child Client Component).
2. Adds Firestore-backed helpers under `src/lib/` using `appCollection()`
   and awaits `ensureReady()` before reading.
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
