/**
 * olive-bridge.ts — the instrument's typed client for the native Olive
 * bridge (window.webkit.messageHandlers.olive, WKScriptMessageHandlerWithReply).
 *
 * Contract: bridge/BRIDGE_PROTOCOL.md (v1); machine-readable golden pairs +
 * hostile-string corpus in bridge/protocol-fixtures.json — this SDK, the
 * Playwright mock bridge, and olive-ios-app's OliveBridgeScopeTests all test
 * against that one file.
 *
 * Two modes, decided once at boot:
 *  - NATIVE (inside Olive's tile): every call forwards to the handler; the
 *    returned Promise resolves with the reply envelope. Policy outcomes
 *    (scope_denied, rate_limited) RESOLVE with ok:false — instrument code
 *    branches on the envelope, never try/catches policy.
 *  - WEB DEMO (public slug URL, no handler): reads resolve from a small,
 *    clearly-labeled synthetic sample (synthetic:true everywhere; the UI is
 *    REQUIRED to render the rehearsal framing — Agency Art 19 rule 5);
 *    store is in-memory; signal/feedback are no-ops that resolve ok.
 *
 * Hostility rule (binding): every string that arrives through this bridge —
 * calendar titles, memory text, ingest fields — is untrusted input. Render
 * it as text only; raw-HTML injection APIs are banned in instrument code
 * (eval/checks.py enforces the ban by token, which is also why this comment
 * does not name the React prop).
 */

export const PROTOCOL_VERSION = 1;

export type OliveScope =
  | "health.summary"
  | "calendar.window"
  | "memories.related"
  | "conversations.search"
  | "ingest";

export type SignalEvent =
  | "open"
  | "expand"
  | "interact"
  | "chart_viewed"
  | "entry_added"
  | "error";

export type BridgeErrorCode =
  | "scope_denied"
  | "rate_limited"
  | "unknown_op"
  | "malformed"
  | "unavailable";

export type BridgeReply<T> =
  | { ok: true; data: T }
  | { ok: false; code: BridgeErrorCode; message: string };

export interface OliveContext {
  protocolVersion: number;
  appId: string;
  displayMode: "tile" | "full" | "web";
  grantedScopes: OliveScope[];
  synthetic: boolean;
}

interface WebKitHandler {
  postMessage(body: unknown): Promise<unknown>;
}

function nativeHandler(): WebKitHandler | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    webkit?: { messageHandlers?: { olive?: WebKitHandler } };
  };
  return w.webkit?.messageHandlers?.olive ?? null;
}

/** Normalizes whatever the native side resolved with into a BridgeReply. */
function asReply<T>(raw: unknown): BridgeReply<T> {
  if (raw && typeof raw === "object" && "ok" in raw) {
    return raw as BridgeReply<T>;
  }
  return { ok: false, code: "malformed", message: "non-envelope reply" };
}

async function call<T>(body: Record<string, unknown>): Promise<BridgeReply<T>> {
  const handler = nativeHandler();
  if (!handler) return webDemo.call<T>(body);
  try {
    return asReply<T>(await handler.postMessage(body));
  } catch (err) {
    // Transport-level rejection (non-main frame, malformed) — surfaced as
    // an envelope so callers stay branch-only.
    return { ok: false, code: "malformed", message: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Web demo mode — the public slug URL renders a labeled rehearsal.
// ---------------------------------------------------------------------------

const webDemo = (() => {
  const store = new Map<string, unknown>();
  const demoContext: OliveContext = {
    protocolVersion: PROTOCOL_VERSION,
    appId: "web-demo",
    displayMode: "web",
    grantedScopes: [],
    synthetic: true,
  };

  function demoRead(scope: string): BridgeReply<unknown> {
    // Deterministic, OBVIOUSLY-labeled rehearsal data ("June", the fixture
    // persona). Never plausible enough to mistake for a real account.
    switch (scope) {
      case "health.summary":
        return {
          ok: true,
          data: {
            summary: { sleepHours: 7.2, restingHR: 57, hrvMs: 62, steps: 8400, daylightMin: 38 },
            windowDays: 7,
            synthetic: true,
          },
        };
      case "calendar.window":
        return {
          ok: true,
          data: {
            events: [
              { title: "Rehearsal: morning walk", startISO: "2026-06-09T13:00:00Z", endISO: "2026-06-09T13:30:00Z", allDay: false },
              { title: "Rehearsal: studio block", startISO: "2026-06-09T16:00:00Z", endISO: "2026-06-09T18:00:00Z", allDay: false },
            ],
            synthetic: true,
          },
        };
      case "memories.related":
        return { ok: true, data: { memories: [{ text: "Rehearsal memory: June mentioned wanting to track this.", score: 0.91 }], synthetic: true } };
      case "conversations.search":
        return { ok: true, data: { threads: [{ title: "Rehearsal thread", snippet: "…we talked about the scale readings…", dateISO: "2026-06-03" }], synthetic: true } };
      default:
        return { ok: false, code: "malformed", message: "unknown scope" };
    }
  }

  return {
    call<T>(body: Record<string, unknown>): Promise<BridgeReply<T>> {
      const op = body.op;
      let reply: BridgeReply<unknown>;
      switch (op) {
        case "context":
          reply = { ok: true, data: demoContext };
          break;
        case "read":
          reply = demoRead(String(body.scope));
          break;
        case "store.set":
          store.set(String(body.key), body.value);
          reply = { ok: true, data: { ok: true } };
          break;
        case "store.get":
          reply = { ok: true, data: { key: String(body.key), value: store.get(String(body.key)) ?? null } };
          break;
        case "ingest.read":
          reply = { ok: true, data: { docs: [], synthetic: true } };
          break;
        case "signal":
        case "feedback":
          reply = { ok: true, data: { ok: true } };
          break;
        default:
          reply = { ok: false, code: "unknown_op", message: `unknown op: ${String(op)}` };
      }
      return Promise.resolve(reply as BridgeReply<T>);
    },
  };
})();

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

let cachedContext: OliveContext | null = null;

export const olive = {
  /** True when running inside Olive's native tile. */
  get native(): boolean {
    return nativeHandler() !== null;
  },

  /** Boot handshake; cached after the first call. */
  async context(): Promise<OliveContext> {
    if (cachedContext) return cachedContext;
    const reply = await call<OliveContext>({ op: "context" });
    cachedContext = reply.ok
      ? reply.data
      : { protocolVersion: PROTOCOL_VERSION, appId: "unknown", displayMode: "web", grantedScopes: [], synthetic: true };
    return cachedContext;
  },

  /** Scoped data snapshot. Branch on the envelope; scope_denied is normal. */
  read<T = unknown>(scope: OliveScope, query?: Record<string, unknown>): Promise<BridgeReply<T>> {
    return call<T>({ op: "read", scope, ...(query ? { query } : {}) });
  },

  store: {
    get<T = unknown>(key: string): Promise<BridgeReply<{ key: string; value: T | null }>> {
      return call({ op: "store.get", key });
    },
    set(key: string, value: unknown): Promise<BridgeReply<{ ok: true }>> {
      return call({ op: "store.set", key, value });
    },
  },

  ingest: {
    read(opts?: { sinceISO?: string; limit?: number }): Promise<
      BridgeReply<{ docs: Array<{ id: string; receivedISO: string; source: string; fields: Record<string, string> }>; synthetic: boolean }>
    > {
      return call({ op: "ingest.read", ...(opts ?? {}) });
    },
  },

  /** Fire-and-forget telemetry (closed vocabulary; natively rate-capped). */
  signal(event: SignalEvent, context?: { surface?: "tile" | "full" }): void {
    void call({ op: "signal", event, ...(context ? { context } : {}) });
  },

  feedback(kind: "helped" | "didnt" | "note", note?: string): Promise<BridgeReply<{ ok: true }>> {
    return call({ op: "feedback", kind, ...(note ? { note } : {}) });
  },
};

export type Olive = typeof olive;
