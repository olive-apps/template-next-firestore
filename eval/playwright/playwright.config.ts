import { defineConfig } from "@playwright/test";

/**
 * Instrument eval harness. Serves the BUILT bundle through serve.mjs (the
 * device-CSP mirror) and blocks every non-local request at the network
 * layer — the suite must pass under exactly the conditions the tile
 * imposes. BRIDGE_SEED selects the fixtures; the platform gate re-runs
 * with a seed this repo never sees.
 */
export default defineConfig({
  testDir: ".",
  testMatch: "instrument.spec.ts",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "results/playwright-report.json" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: "node serve.mjs 4173",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
