/**
 * mock-bridge.js — the test shim standing in for Olive's native bridge.
 *
 * Injected by Playwright (addInitScript) BEFORE any page script, exactly
 * where WKScriptMessageHandlerWithReply would be. Implements the v1
 * protocol from bridge/BRIDGE_PROTOCOL.md, replying from the seeded
 * fixtures, so eval assertions compare RENDERED VALUES against the
 * ORACLE for the same seed — the anti-Potemkin discipline (Replit's
 * named enemy: UIs that pass inspection while handlers and data are fake).
 *
 * Configuration is injected by serve/spec via window.__bridgeConfig:
 *   { appId, displayMode, grantedScopes, fixtures, hostileMode }
 * hostileMode swaps every string field arriving from "data" for entries
 * from the hostile corpus — the strings must render inert.
 */

(() => {
  const config = window.__bridgeConfig || {
    appId: "test-app",
    displayMode: "full",
    grantedScopes: [],
    fixtures: null,
    hostile: null,
  };

  const store = new Map();
  let signalCount = 0;
  const calls = [];
  window.__bridgeCalls = calls;

  function hostileize(text, index) {
    const corpus = config.hostile || [];
    if (!corpus.length) return text;
    return corpus[index % corpus.length];
  }

  function seriesSummary(fixtures) {
    // Mirror the bridge's health.summary shape off the fixtures so the
    // app under test renders fixture-derived values.
    const sleep = fixtures?.series?.sleep_hours || [];
    const present = sleep.filter((r) => r.value !== null).map((r) => r.value);
    const mean = present.length ? present.reduce((a, b) => a + b, 0) / present.length : 0;
    return {
      summary: {
        sleepHours: Math.round(mean * 10) / 10,
        restingHR: 56,
        hrvMs: 63,
        steps: 8200,
        daylightMin: 40,
      },
      windowDays: 7,
      synthetic: true,
    };
  }

  function reply(request) {
    const op = request && request.op;
    calls.push(request);
    switch (op) {
      case "context":
        return {
          ok: true,
          data: {
            protocolVersion: 1,
            appId: config.appId,
            displayMode: config.displayMode,
            grantedScopes: config.grantedScopes,
            synthetic: true,
          },
        };
      case "read": {
        const scope = request.scope;
        const known = ["health.summary", "calendar.window", "memories.related", "conversations.search"];
        if (!known.includes(scope)) {
          return { ok: false, code: "malformed", message: "unknown scope" };
        }
        if (!config.grantedScopes.includes(scope)) {
          return { ok: false, code: "scope_denied", message: "scope not in the consented manifest" };
        }
        if (scope === "health.summary") {
          return { ok: true, data: seriesSummary(config.fixtures) };
        }
        if (scope === "calendar.window") {
          const titles = ["Studio block", "Walk with Sam", "Quarterly review"];
          return {
            ok: true,
            data: {
              events: titles.map((t, i) => ({
                title: config.hostile ? hostileize(t, i) : t,
                startISO: "2026-06-09T13:00:00Z",
                endISO: "2026-06-09T14:00:00Z",
                allDay: false,
              })),
              synthetic: true,
            },
          };
        }
        if (scope === "memories.related") {
          const texts = ["June mentioned tracking this on Tuesday.", "The scale lives in the bathroom."];
          return {
            ok: true,
            data: {
              memories: texts.map((t, i) => ({ text: config.hostile ? hostileize(t, i + 3) : t, score: 0.9 - i * 0.1 })),
              synthetic: true,
            },
          };
        }
        return {
          ok: true,
          data: {
            threads: [{ title: config.hostile ? hostileize("Scale thread", 6) : "Scale thread", snippet: config.hostile ? hostileize("…readings…", 7) : "…readings…", dateISO: "2026-06-01" }],
            synthetic: true,
          },
        };
      }
      case "store.set":
        store.set(String(request.key), request.value);
        return { ok: true, data: { ok: true } };
      case "store.get":
        return { ok: true, data: { key: String(request.key), value: store.has(String(request.key)) ? store.get(String(request.key)) : null } };
      case "ingest.read": {
        if (!config.grantedScopes.includes("ingest")) {
          return { ok: false, code: "scope_denied", message: "scope not in the consented manifest" };
        }
        const docs = (config.fixtures?.ingestDocs || []).map((d, i) =>
          config.hostile
            ? { ...d, fields: Object.fromEntries(Object.entries(d.fields).map(([k, v], j) => [k, hostileize(String(v), i + j)])) }
            : d,
        );
        return { ok: true, data: { docs, synthetic: true } };
      }
      case "signal": {
        const events = ["open", "expand", "interact", "chart_viewed", "entry_added", "error"];
        if (!events.includes(request.event)) {
          return { ok: false, code: "malformed", message: "unknown signal event" };
        }
        signalCount += 1;
        if (signalCount > 60) return { ok: false, code: "rate_limited", message: "signal cap" };
        return { ok: true, data: { ok: true } };
      }
      case "feedback":
        return { ok: true, data: { ok: true } };
      default:
        return { ok: false, code: "unknown_op", message: `unknown op: ${String(op)}` };
    }
  }

  window.webkit = window.webkit || {};
  window.webkit.messageHandlers = window.webkit.messageHandlers || {};
  window.webkit.messageHandlers.olive = {
    postMessage(body) {
      return Promise.resolve(reply(body));
    },
  };
})();
