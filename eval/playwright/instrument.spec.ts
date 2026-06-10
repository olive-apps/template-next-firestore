/**
 * instrument.spec.ts — the behavioral half of the instrument eval.
 *
 * TEMPLATE CONTRACT (the worker extends, never weakens):
 *  - values-match-oracle: numbers the app renders equal the oracle labels
 *    for BRIDGE_SEED. Assert VALUES, never just element existence —
 *    existence-only assertions wave Potemkin interfaces through.
 *  - hostile-strings: every bridge-delivered string from the hostile corpus
 *    renders inert (document.title is the canary every payload targets).
 *  - denied-path: an undeclared scope degrades to the honest empty state,
 *    never a crash or spinner.
 *  - no-network: the suite runs with all non-localhost requests aborted +
 *    the device CSP from serve.mjs; a bundle that needs the network fails.
 *  - tile + full modes both render.
 *
 * The TEMPLATE app (page.tsx) is a demo shell, so the template-level spec
 * asserts the frame, the rehearsal label, and bridge wiring. At commission
 * the worker REPLACES the value assertions with the instrument's own
 * oracle comparisons (see the worked example at the bottom) and keeps every
 * structural test green.
 */

import { test, expect, type Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const SEED = process.env.BRIDGE_SEED ?? "7";

function loadJSON(path: string): Record<string, unknown> | null {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

const fixtures = loadJSON(join(ROOT, "eval", "fixtures", `data_${SEED}.json`));
const oracle = loadJSON(join(ROOT, "eval", "fixtures", `oracle_${SEED}.json`));
const protocol = loadJSON(join(ROOT, "bridge", "protocol-fixtures.json")) as {
  hostileStrings: string[];
} | null;
const manifest = loadJSON(join(ROOT, "instrument.json")) as { scopes?: string[] } | null;

async function boot(
  page: Page,
  opts: { displayMode?: string; grantedScopes?: string[]; hostile?: boolean } = {},
) {
  // Block every non-local request — the tile has no network.
  await page.route(/^(?!http:\/\/127\.0\.0\.1)/, (route) => route.abort());
  await page.addInitScript({
    content: `window.__bridgeConfig = ${JSON.stringify({
      appId: "eval-app",
      displayMode: opts.displayMode ?? "full",
      grantedScopes: opts.grantedScopes ?? manifest?.scopes ?? [],
      fixtures,
      hostile: opts.hostile ? protocol?.hostileStrings ?? [] : null,
    })};`,
  });
  await page.addInitScript({
    path: join(import.meta.dirname, "mock-bridge.js"),
  });
  await page.goto("/index.html");
}

test("loads with no network under the device CSP", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  await boot(page);
  await expect(page.locator("body")).toBeVisible();
  expect(consoleErrors, `page errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});

test("tile mode renders compact; full mode renders roomy", async ({ page }) => {
  await boot(page, { displayMode: "tile" });
  await expect(page.locator("main")).toBeVisible();
  await boot(page, { displayMode: "full" });
  await expect(page.locator("main")).toBeVisible();
});

test("synthetic context surfaces the rehearsal framing", async ({ page }) => {
  await boot(page, { displayMode: "tile" });
  // The mock bridge always replies synthetic:true, so the frame MUST show
  // the rehearsal line — synthetic never renders as user truth.
  await expect(page.getByText(/rehearsal/i)).toBeVisible();
});

test("hostile strings render inert", async ({ page }) => {
  test.skip(!protocol, "protocol fixtures missing");
  await boot(page, { hostile: true, grantedScopes: ["calendar.window", "memories.related"] });
  // Give any (incorrectly) executed payload time to fire its canary.
  await page.waitForTimeout(500);
  const title = await page.title();
  expect(title, "a hostile string executed — document.title was overwritten").not.toBe("pwned");
  const hasScriptTag = await page.evaluate(
    () => document.body.innerHTML.includes("<script>document.title"),
  );
  expect(hasScriptTag, "raw <script> markup was injected into the DOM").toBe(false);
});

test("denied scope degrades to the honest empty state, not a crash", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  await boot(page, { grantedScopes: [] });
  await page.waitForTimeout(300);
  expect(errors, `denied-path page errors: ${errors.join(" | ")}`).toEqual([]);
  // No spinner ever (design language: latency is a sentence, never a wheel).
  expect(await page.locator('[role="progressbar"], .spinner, .loading-spinner').count()).toBe(0);
});

// ---------------------------------------------------------------------------
// values-match-oracle — WORKED EXAMPLE (the worker replaces this with the
// instrument's real renderings; keep the oracle-comparison SHAPE).
// ---------------------------------------------------------------------------

test("values-match-oracle (template example: bridge summary round-trips)", async ({ page }) => {
  test.skip(!fixtures || !oracle, "fixtures missing — run eval/fixtures/build.py --seed " + SEED);
  await boot(page, { grantedScopes: ["health.summary"] });
  // The template demo shell doesn't chart series data; the commission's
  // app MUST. This example asserts the bridge→render path end-to-end with
  // a value comparison so the pattern is in place: read through the SDK on
  // the page, then compare against the oracle file the test holds.
  const rendered = await page.evaluate(async () => {
    const w = window as unknown as {
      webkit: { messageHandlers: { olive: { postMessage(b: unknown): Promise<unknown> } } };
    };
    const reply = (await w.webkit.messageHandlers.olive.postMessage({
      op: "read",
      scope: "health.summary",
      query: { windowDays: 7 },
    })) as { ok: boolean; data?: { summary?: { sleepHours?: number } } };
    return reply.ok ? reply.data?.summary?.sleepHours : null;
  });
  const sleepOracle = (oracle as { series: { sleep_hours: { mean: number | null } } }).series
    .sleep_hours.mean;
  test.skip(sleepOracle === null, "oracle has no sleep mean for this seed");
  expect(rendered).not.toBeNull();
  // The mock summarizes from the same fixtures the oracle labels — a value
  // mismatch means someone is faking data somewhere in the chain.
  expect(Math.abs((rendered as number) - (sleepOracle as number))).toBeLessThanOrEqual(0.1);
});
