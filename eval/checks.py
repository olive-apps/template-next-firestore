#!/usr/bin/env python3
"""
eval/checks.py — deterministic gates for the instrument profile.

Every gate returns 1.0 or 0.0; the suite passes only at ALL == 1.0
(code_negotiation zero-tolerance doctrine). Run directly or via
eval/run.py. The PLATFORM re-executes these at the commission and release
gates — they are written to be grep/file-based and dependency-free so the
gate runner needs nothing but python3 + a built bundle.

Gates:
  manifest_valid          instrument.json parses, schema-shaped, scopes ⊆ vocabulary
  scopes_subset           every scope the CODE references is declared in the manifest
  banned_apis             no WebSocket/RTCPeerConnection/EventSource/XMLHttpRequest/
                          dangerouslySetInnerHTML in src/ (theme-script exemption)
  no_firebase_in_instrument  instrument mode imports no firebase (bridge-only data)
  bundle_manifest_present out/bundle-manifest.json exists, files + cspScriptHashes
  bundle_under_cap        total bundle ≤ 5MB
  bundle_offline          no external origins referenced by out/ html/css (fonts self-hosted)
  synthetic_labeled       every fixtures data_*.json carries synthetic:true
  oracle_independent      fixtures/build.py imports nothing from src/ or node_modules
  hostile_corpus_wired    bridge/protocol-fixtures.json hostile strings present (≥10)
  contract_present        eval/CONTRACT.md has a filled Dimensions table
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SCOPE_VOCAB = {"health.summary", "calendar.window", "memories.related", "conversations.search", "ingest"}

BANNED_PATTERNS = [
    (r"\bnew\s+WebSocket\b|\bWebSocket\s*\(", "WebSocket"),
    (r"\bRTCPeerConnection\b", "RTCPeerConnection"),
    (r"\bnew\s+EventSource\b|\bEventSource\s*\(", "EventSource"),
    (r"\bXMLHttpRequest\b", "XMLHttpRequest"),
    (r"dangerouslySetInnerHTML", "dangerouslySetInnerHTML"),
]

# The template's pre-paint theme script is the single sanctioned
# dangerouslySetInnerHTML site (hashed into the CSP).
THEME_EXEMPT = ROOT / "src" / "app" / "layout.tsx"


def src_files() -> list[Path]:
    return [p for p in (ROOT / "src").rglob("*") if p.suffix in {".ts", ".tsx", ".js", ".jsx"}]


def manifest() -> dict | None:
    try:
        return json.loads((ROOT / "instrument.json").read_text())
    except Exception:
        return None


def gate_manifest_valid() -> tuple[float, str]:
    m = manifest()
    if m is None:
        return 0.0, "instrument.json missing or unparseable"
    required = {"instrument", "name", "appId", "version", "schemaVersion", "scopes"}
    if not required.issubset(m.keys()):
        return 0.0, f"missing keys: {sorted(required - set(m.keys()))}"
    if not isinstance(m["scopes"], list) or not set(m["scopes"]).issubset(SCOPE_VOCAB):
        return 0.0, f"scopes outside vocabulary: {m['scopes']}"
    if "ingest" in m["scopes"] and not m.get("ingest", {}).get("senderFilter"):
        return 0.0, "ingest scope declared without ingest.senderFilter"
    if not isinstance(m["schemaVersion"], int) or m["schemaVersion"] < 1:
        return 0.0, "schemaVersion must be a positive integer"
    return 1.0, "ok"


def gate_scopes_subset() -> tuple[float, str]:
    m = manifest() or {}
    declared = set(m.get("scopes", []))
    referenced: set[str] = set()
    scope_re = re.compile(r"""olive\.read[^)]*?["'](?P<scope>[a-z]+\.[a-z]+)["']""")
    ingest_re = re.compile(r"\bolive\.ingest\.read\b")
    for path in src_files():
        text = path.read_text(errors="ignore")
        if path.name == "olive-bridge.ts":
            continue  # the SDK itself names every scope
        for match in scope_re.finditer(text):
            referenced.add(match.group("scope"))
        if ingest_re.search(text):
            referenced.add("ingest")
    undeclared = referenced - declared
    if undeclared:
        return 0.0, f"code reads undeclared scopes: {sorted(undeclared)}"
    return 1.0, f"referenced={sorted(referenced) or 'none'}"


def gate_banned_apis() -> tuple[float, str]:
    hits: list[str] = []
    for path in src_files():
        text = path.read_text(errors="ignore")
        for pattern, name in BANNED_PATTERNS:
            if re.search(pattern, text):
                if name == "dangerouslySetInnerHTML" and path == THEME_EXEMPT:
                    continue
                hits.append(f"{name} in {path.relative_to(ROOT)}")
    return (0.0, "; ".join(hits)) if hits else (1.0, "ok")


def gate_no_firebase_in_instrument() -> tuple[float, str]:
    """Bundle-level truth: the template keeps firebase libs for normal apps,
    and Next tree-shakes what nothing imports — so the gate checks what the
    BUILT bundle ships, not what sits in src/. An instrument page importing
    firebase/olive-app pulls the SDK into out/ and fails here."""
    m = manifest() or {}
    if m.get("instrument") is not True:
        return 1.0, "not an instrument build (n/a)"
    out = ROOT / "out"
    if not out.exists():
        return 0.0, "no out/ (run npm run build)"
    markers = re.compile(r"firebaseapp\.com|firebase/firestore|firebaseio\.com|FirebaseError")
    hits = []
    for path in out.rglob("*.js"):
        if markers.search(path.read_text(errors="ignore")):
            hits.append(str(path.relative_to(out)))
    return (0.0, f"bundle ships firebase: {hits[:3]}") if hits else (1.0, "ok")


def gate_bundle_manifest_present() -> tuple[float, str]:
    p = ROOT / "out" / "bundle-manifest.json"
    if not p.exists():
        return 0.0, "out/bundle-manifest.json missing (run npm run build)"
    try:
        bm = json.loads(p.read_text())
    except Exception:
        return 0.0, "bundle-manifest unparseable"
    if not bm.get("files") or "cspScriptHashes" not in bm:
        return 0.0, "bundle-manifest missing files/cspScriptHashes"
    return 1.0, f"{bm['fileCount']} files, {len(bm['cspScriptHashes'])} script hashes"


def gate_bundle_under_cap() -> tuple[float, str]:
    p = ROOT / "out" / "bundle-manifest.json"
    if not p.exists():
        return 0.0, "no bundle manifest"
    total = json.loads(p.read_text()).get("totalBytes", 10**9)
    return (1.0, f"{total} bytes") if total <= 5 * 1024 * 1024 else (0.0, f"{total} bytes > 5MB")


def gate_bundle_offline() -> tuple[float, str]:
    m = manifest() or {}
    out = ROOT / "out"
    if not out.exists():
        return 0.0, "no out/ (run npm run build)"
    if m.get("instrument") is not True:
        return 1.0, "not an instrument build (n/a)"
    external = re.compile(r"""(?:src|href)=["']https?://""")
    hits = []
    for path in list(out.rglob("*.html")) + list(out.rglob("*.css")):
        for line in path.read_text(errors="ignore").splitlines():
            if external.search(line):
                hits.append(f"{path.relative_to(out)}: {line.strip()[:100]}")
    return (0.0, "; ".join(hits[:5])) if hits else (1.0, "ok")


def gate_synthetic_labeled() -> tuple[float, str]:
    fixtures = list((ROOT / "eval" / "fixtures").glob("data_*.json"))
    if not fixtures:
        return 0.0, "no fixtures generated (run eval/fixtures/build.py --seed N)"
    for f in fixtures:
        try:
            if json.loads(f.read_text()).get("synthetic") is not True:
                return 0.0, f"{f.name} not labeled synthetic:true"
        except Exception:
            return 0.0, f"{f.name} unparseable"
    return 1.0, f"{len(fixtures)} fixture files labeled"


def gate_oracle_independent() -> tuple[float, str]:
    text = (ROOT / "eval" / "fixtures" / "build.py").read_text(errors="ignore")
    if re.search(r"from\s+src|import\s+src|node_modules|require\(", text):
        return 0.0, "fixtures/build.py reaches into app code"
    return 1.0, "ok"


def gate_hostile_corpus_wired() -> tuple[float, str]:
    try:
        fixtures = json.loads((ROOT / "bridge" / "protocol-fixtures.json").read_text())
    except Exception:
        return 0.0, "bridge/protocol-fixtures.json missing/unparseable"
    n = len(fixtures.get("hostileStrings", []))
    return (1.0, f"{n} hostile strings") if n >= 10 else (0.0, f"only {n} hostile strings")


def gate_contract_present() -> tuple[float, str]:
    p = ROOT / "eval" / "CONTRACT.md"
    if not p.exists():
        return 0.0, "eval/CONTRACT.md missing"
    text = p.read_text(errors="ignore")
    rows = len(re.findall(r"^\|\s*\d+\s*\|", text, re.MULTILINE))
    return (1.0, f"{rows} dimensions") if rows >= 4 else (0.0, f"only {rows} dimension rows")


GATES = {
    "manifest_valid": gate_manifest_valid,
    "scopes_subset": gate_scopes_subset,
    "banned_apis": gate_banned_apis,
    "no_firebase_in_instrument": gate_no_firebase_in_instrument,
    "bundle_manifest_present": gate_bundle_manifest_present,
    "bundle_under_cap": gate_bundle_under_cap,
    "bundle_offline": gate_bundle_offline,
    "synthetic_labeled": gate_synthetic_labeled,
    "oracle_independent": gate_oracle_independent,
    "hostile_corpus_wired": gate_hostile_corpus_wired,
    "contract_present": gate_contract_present,
}


def run_all() -> dict:
    results = {}
    for name, fn in GATES.items():
        try:
            score, detail = fn()
        except Exception as err:  # a crashed gate is a failed gate
            score, detail = 0.0, f"gate crashed: {err}"
        results[name] = {"score": score, "detail": detail}
    return results


if __name__ == "__main__":
    results = run_all()
    width = max(len(k) for k in results)
    all_pass = True
    for name, row in results.items():
        flag = "PASS" if row["score"] == 1.0 else "FAIL"
        if row["score"] != 1.0:
            all_pass = False
        print(f"{flag}  {name.ljust(width)}  {row['detail']}")
    print(f"\nchecks: {'ALL GATES 1.0' if all_pass else 'GATES FAILED'}")
    sys.exit(0 if all_pass else 1)
