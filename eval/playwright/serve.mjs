#!/usr/bin/env node
/**
 * serve.mjs — serves the built bundle the way the DEVICE serves it.
 *
 * Static file server over out/ that mirrors the native scheme handler's
 * conditions so the eval measures the production posture, not a friendly
 * dev server:
 *   - exact-membership from out/bundle-manifest.json (unknown path → 404)
 *   - the SAME CSP header the iOS handler injects:
 *       default-src 'none'; script-src 'self' <hashes>; style-src 'self'
 *       'unsafe-inline'; img-src 'self' data:; font-src 'self'
 *   - Cache-Control: no-store
 *
 * Usage: node serve.mjs [port]   (default 4173)
 */

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const OUT = join(ROOT, "out");
const PORT = Number(process.argv[2] || 4173);

if (!existsSync(join(OUT, "bundle-manifest.json"))) {
  console.error("serve: out/bundle-manifest.json missing — run npm run build first");
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(join(OUT, "bundle-manifest.json"), "utf8"));
const csp = [
  "default-src 'none'",
  `script-src 'self'${manifest.cspScriptHashes.map((h) => ` '${h}'`).join("")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
].join("; ");

const server = createServer((req, res) => {
  let path = decodeURIComponent((req.url || "/").split("?")[0]);
  if (path.endsWith("/")) path += "index.html";
  if (!manifest.files[path]) {
    // trailingSlash export shape: /foo -> /foo/index.html
    const alt = `${path}/index.html`;
    if (manifest.files[alt]) path = alt;
  }
  const entry = manifest.files[path];
  if (!entry) {
    res.writeHead(404, { "Content-Security-Policy": csp });
    res.end("not in bundle manifest");
    return;
  }
  const body = readFileSync(join(OUT, path));
  res.writeHead(200, {
    "Content-Type": entry.mime,
    "Content-Security-Policy": csp,
    "Cache-Control": "no-store",
    "Content-Length": body.length,
  });
  res.end(body);
});

server.listen(PORT, () => console.log(`serve: out/ at http://127.0.0.1:${PORT} with device CSP`));
