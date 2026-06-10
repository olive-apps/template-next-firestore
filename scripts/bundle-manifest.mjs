#!/usr/bin/env node
/**
 * bundle-manifest.mjs — postbuild step for the instrument profile.
 *
 * Walks the static export in out/ and writes out/bundle-manifest.json:
 *   {
 *     generatedAtISO, fileCount, totalBytes,
 *     files: { "/index.html": { sha256, bytes, mime }, ... },
 *     cspScriptHashes: ["sha256-...", ...]   // every inline <script> body
 *   }
 *
 * Consumers:
 *  - olive-ios-app InstrumentHost: exact-membership serving (a path not in
 *    `files` is refused), per-file sha256 verification after download, and
 *    the CSP response header — script-src 'self' + the inline hashes (Next
 *    static export emits inline hydration scripts; a bare 'self' policy
 *    would blank every page).
 *  - the release gate (M3): re-runs this script on the candidate bundle and
 *    byte-compares the manifest, so a tampered postbuild can't lie.
 *  - eval/checks.py: presence + shape gates.
 *
 * No dependencies; Node ≥ 20. Runs automatically via package.json postbuild.
 * Harmless for non-instrument apps (manifest simply isn't consumed).
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, extname, sep } from "node:path";

const OUT = "out";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".map": "application/json; charset=utf-8",
};

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) entries.push(...walk(full));
    else entries.push(full);
  }
  return entries;
}

function sha256B64(buf) {
  return createHash("sha256").update(buf).digest("base64");
}

if (!existsSync(OUT)) {
  console.error(`bundle-manifest: no ${OUT}/ directory — run next build first`);
  process.exit(1);
}

const files = {};
const cspHashes = new Set();
let totalBytes = 0;

// Matches inline scripts WITH BODIES only (src= scripts are external and
// covered by 'self'). CSP hashes cover the exact byte content between the
// tags.
const inlineScript = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

for (const abs of walk(OUT)) {
  const rel = "/" + relative(OUT, abs).split(sep).join("/");
  if (rel === "/bundle-manifest.json") continue;
  const buf = readFileSync(abs);
  totalBytes += buf.length;
  files[rel] = {
    sha256: sha256B64(buf),
    bytes: buf.length,
    mime: MIME[extname(abs).toLowerCase()] ?? "application/octet-stream",
  };
  if (rel.endsWith(".html")) {
    const html = buf.toString("utf8");
    for (const match of html.matchAll(inlineScript)) {
      const body = match[1];
      if (body.length > 0) cspHashes.add(`sha256-${sha256B64(Buffer.from(body, "utf8"))}`);
    }
  }
}

const manifest = {
  generatedAtISO: new Date().toISOString(),
  fileCount: Object.keys(files).length,
  totalBytes,
  files,
  cspScriptHashes: [...cspHashes].sort(),
};

writeFileSync(join(OUT, "bundle-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(
  `bundle-manifest: ${manifest.fileCount} files, ${(totalBytes / 1024).toFixed(0)} KiB, ${cspHashes.size} inline-script hashes`,
);

// 5 MB inline-deploy cap (hosted-olive-control MAX_INLINE_BUNDLE_BYTES) —
// fail the build loudly rather than fail the deploy silently.
const CAP = 5 * 1024 * 1024;
if (totalBytes > CAP) {
  console.error(`bundle-manifest: bundle ${totalBytes} bytes exceeds the 5MB cap`);
  process.exit(1);
}
