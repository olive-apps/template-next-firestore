# Olive Bridge Protocol — v1

One-line purpose: the wire contract between an instrument's web bundle (`window.olive`, implemented in `src/lib/olive-bridge.ts`) and the native OliveBridge (`WKScriptMessageHandlerWithReply`, handler name `olive`, `.page` world) — versioned, additive-only, consumed in lockstep by this repo's SDK/mocks and by `olive-ios-app`'s `OliveBridgeScopeTests`.
Status: v1, frozen with the M2 instrument profile (PLAN-2026-06-09-brief-instruments). `bridge/protocol-fixtures.json` is the machine-readable single source both sides test against.

## Transport

One native handler: `window.webkit.messageHandlers.olive.postMessage(request)`. The native side conforms to `WKScriptMessageHandlerWithReply`, so `postMessage` **returns a Promise** that resolves with the reply envelope or rejects with a string error (rejections are reserved for transport-level refusals: non-main frame, malformed body; every in-protocol outcome — including denials — RESOLVES with `ok:false` so instrument code never needs try/catch for policy).

- No correlation ids: the reply-handler form pairs request/reply per call.
- Requests and replies are JSON-serializable plain objects only.
- `protocolVersion` is `1`; the SDK exposes it and the native `context` reply echoes it. Additions are backward-compatible (new ops, new optional fields); breaking changes bump the version and the native side keeps serving v1 forever (template-generated repos never pull updates).

## Reply envelope

```json
{ "ok": true,  "data": { } }
{ "ok": false, "code": "scope_denied" | "rate_limited" | "unknown_op" | "malformed" | "unavailable", "message": "human-readable, no user data" }
```

## Ops

### `context` — boot handshake
Request: `{ "op": "context" }`
Reply data: `{ "protocolVersion": 1, "appId": "<appId>", "displayMode": "tile" | "full", "grantedScopes": ["health.summary", …], "synthetic": false }`
The SDK calls this once at boot and caches it. In web/demo mode (no native handler) the SDK fabricates `{ displayMode: "web", grantedScopes: [], synthetic: true }`.

### `read` — scoped data snapshot
Request: `{ "op": "read", "scope": "<scope>", "query": { … } }`
Scopes are a **closed vocabulary** (v1): `health.summary`, `calendar.window`, `memories.related`, `conversations.search`. The native side enforces against the REGISTRY's consented manifest (never anything inside the bundle); an undeclared or unconsented scope replies `scope_denied`. Reply data is the scope's typed snapshot (see fixtures), always carrying `"synthetic": true|false` — synthetic data is labeled at write and the UI MUST render the rehearsal framing when true (Agency Art 19 rule 5).

Query shapes (all fields optional):
- `health.summary`: `{ "windowDays": 7 | 30 }` → `{ summary: { sleepHours, restingHR, hrvMs, steps, daylightMin } per window, synthetic }` — coarse derived values only; never raw samples.
- `calendar.window`: `{ "days": 7 }` → `{ events: [{ title, startISO, endISO, allDay }], synthetic }` — titles are ATTACKER-INFLUENCEABLE strings; render as text, never as HTML.
- `memories.related`: `{ "topic": "…", "topK": 5 }` → `{ memories: [{ text, score }], synthetic }` — same hostility rule.
- `conversations.search`: `{ "text": "…", "limit": 5 }` → `{ threads: [{ title, snippet, dateISO }], synthetic }` — same hostility rule.

### `store.get` / `store.set` — per-instrument key-value state
`{ "op": "store.get", "key": "…" }` → `{ "key", "value": <json|null> }`
`{ "op": "store.set", "key": "…", "value": <json> }` → `{ "ok": true }` envelope.
On-device, namespaced to this instrument, backup-excluded + file-protected when the instrument is health-scoped. Values ≤ 64 KiB JSON; keys ≤ 128 chars. Always available (not a consent scope).

### `ingest.read` — server-ingested external data
Request: `{ "op": "ingest.read", "sinceISO": "…", "limit": 50 }`
Reply data: `{ "docs": [{ "id", "receivedISO", "source": "email" | "manual", "fields": { … } }], "synthetic": false }`
Bridge-proxied authenticated read of `apps/{appId}/ingest` (e.g. forwarded scale e-mails routed by the manifest's declared sender filter). Requires the `ingest` scope in the manifest. Field values are attacker-influenceable strings.

### `signal` — usage telemetry (fire-and-forget)
Request: `{ "op": "signal", "event": "<closed enum>", "context": { "surface": "tile" | "full" } }`
Events (closed, v1): `open`, `expand`, `interact`, `chart_viewed`, `entry_added`, `error`. Anything else replies `malformed`. Natively RATE-CAPPED (≤ 60/session); counted into the per-day digest — never raw content, and the digest is what the revision loop reads. Reply: `{ "ok": true }` (or `rate_limited`).

### `feedback` — explicit user feedback
Request: `{ "op": "feedback", "kind": "helped" | "didnt" | "note", "note": "≤ 280 chars, optional" }`
Reply: `{ "ok": true }`. Notes from health-scoped instruments are natively scrubbed of numerics/health terms before any revision brief (Art 19 rule 8).

## Hostility rules (binding on instrument code)

Every string arriving through the bridge — calendar titles, memory text, ingest fields, conversation snippets — is **untrusted input**: render via text nodes/React text children only. `dangerouslySetInnerHTML` is banned in instrument code (checked by `eval/checks.py`; the sole exemption is the template's pre-paint theme script in `src/app/layout.tsx`). `bridge/protocol-fixtures.json` ships a hostile-string corpus every instrument's Playwright suite must render inert.

## Versioning & lockstep

- `bridge/protocol-fixtures.json` is the canonical machine-readable contract: ops, reply shapes, error codes, scope vocabulary, signal vocabulary, hostile strings, and golden request/reply pairs.
- Consumers: `src/lib/olive-bridge.ts` (SDK), `eval/playwright/mock-bridge.js` (test shim), `eval/checks.py` (schema gates), and `olive-ios-app` `OliveBridgeScopeTests` (the native side replays the same golden pairs).
- Change discipline: additive only; update fixtures + both consumers in the same change; the iOS tests and this repo's tests must stay green against the SAME fixtures file content.
