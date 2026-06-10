#!/usr/bin/env python3
"""
eval/run.py — the instrument eval runner.

    python3 eval/run.py --no-llm [--seed 7]

Sequence:
  1. eval/fixtures/build.py --seed N   (generate/refresh fixtures + oracle)
  2. eval/checks.py                    (deterministic gates, ALL must == 1.0)
  3. Playwright behavioral suite       (values/hostile/denied/no-network)
     — skipped with a loud FAIL row if the bundle or browsers are missing.
  4. Writes results/<ts>/summary.json  {gate_table, overall_pass}

--no-llm is the only mode this script implements: judged axes (judge.md)
run under the PLATFORM's judge harness, never the builder's (Agency Art 19
rule 1). The platform release gate re-executes this script with its own
--seed (held-out) and byte-compares out/bundle-manifest.json.

Exit code 0 iff overall_pass.
"""

from __future__ import annotations

import argparse
import datetime
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVAL = ROOT / "eval"


def sh(cmd: list[str], cwd: Path) -> tuple[int, str]:
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    return proc.returncode, (proc.stdout + proc.stderr)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-llm", action="store_true", default=True,
                        help="gates + behavioral only (the only builder-side mode)")
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--skip-playwright", action="store_true",
                        help="gates only (used by quick pre-commit loops; the gate never skips)")
    args = parser.parse_args()

    gate_table: dict[str, dict] = {}

    # 1. fixtures
    code, out = sh([sys.executable, str(EVAL / "fixtures" / "build.py"),
                    "--seed", str(args.seed)], cwd=ROOT)
    gate_table["fixtures_generated"] = {"score": 1.0 if code == 0 else 0.0,
                                        "detail": out.strip().splitlines()[-1] if out.strip() else ""}

    # 2. deterministic gates
    sys.path.insert(0, str(EVAL))
    import checks  # noqa: E402

    for name, row in checks.run_all().items():
        gate_table[name] = row

    # 3. behavioral
    if args.skip_playwright:
        gate_table["playwright_behavioral"] = {"score": 0.0, "detail": "SKIPPED by flag — not a pass"}
    else:
        pw_dir = EVAL / "playwright"
        if not (pw_dir / "node_modules").exists():
            code, out = sh(["npm", "install", "--no-audit", "--no-fund"], cwd=pw_dir)
            if code != 0:
                gate_table["playwright_behavioral"] = {"score": 0.0, "detail": f"npm install failed: {out[-300:]}"}
        if "playwright_behavioral" not in gate_table:
            env_seed = {"BRIDGE_SEED": str(args.seed)}
            import os
            env = {**os.environ, **env_seed}
            proc = subprocess.run(["npx", "playwright", "test"], cwd=pw_dir,
                                  capture_output=True, text=True, env=env)
            tail = (proc.stdout + proc.stderr)[-800:]
            gate_table["playwright_behavioral"] = {
                "score": 1.0 if proc.returncode == 0 else 0.0,
                "detail": tail.strip().splitlines()[-1] if tail.strip() else "",
            }

    overall_pass = all(row["score"] == 1.0 for row in gate_table.values())

    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    results_dir = EVAL / "results" / ts
    results_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "ranAtISO": ts,
        "seed": args.seed,
        "mode": "no-llm",
        "gate_table": gate_table,
        "overall_pass": overall_pass,
    }
    (results_dir / "summary.json").write_text(json.dumps(summary, indent=2))

    width = max(len(k) for k in gate_table)
    for name, row in gate_table.items():
        flag = "PASS" if row["score"] == 1.0 else "FAIL"
        print(f"{flag}  {name.ljust(width)}  {row['detail'][:140]}")
    print(f"\nrun: overall_pass={overall_pass}  -> {results_dir / 'summary.json'}")
    sys.exit(0 if overall_pass else 1)


if __name__ == "__main__":
    main()
