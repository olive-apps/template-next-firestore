# eval/ — the instrument's evaluation scaffold

One-line purpose: the self-contained dev↔eval loop the build worker iterates to green at commission and every revision — and the suite the PLATFORM re-executes at the gate, because worker-reported results are advisory (Agency Art 19 rule 1).

## How to run

```bash
# 1. build the bundle (also writes out/bundle-manifest.json via postbuild)
npm run build

# 2. gates + behavioral, public seed
python3 eval/run.py --seed 7
# fast pre-commit loop, gates only (NOT a pass):
python3 eval/run.py --seed 7 --skip-playwright
```

First behavioral run: `cd eval/playwright && npm install && npx playwright install chromium` (Playwright lives HERE, never in the app's devDependencies — template dependency discipline).

## What lives here

| File | Role |
|---|---|
| `CONTRACT.md` | The binding pass bar (4–8 dimensions). Hash-frozen at commission; editing it after acceptance quarantines the revision. |
| `fixtures/build.py` | Seeded simulator + INDEPENDENT oracle (plain arithmetic, never app code). `--seed` is external: the gate re-runs with a seed this repo never sees (held-out). |
| `checks.py` | Deterministic gates, ALL == 1.0: manifest/scopes, banned APIs, offline bundle, synthetic labeling, oracle independence, hostile corpus, contract presence. |
| `playwright/` | Behavioral suite against the BUILT bundle under device conditions (serve.mjs mirrors the iOS CSP; all non-local network aborted; mock-bridge.js implements protocol v1 from `bridge/protocol-fixtures.json`). Values-match-oracle is the anti-Potemkin core: assert rendered VALUES, never element existence. |
| `judge.md` | Judged axes only (usefulness, register, honesty). The platform owns the judge harness. |
| `run.py` | Orchestrates 1→3, writes `results/<ts>/summary.json` `{gate_table, overall_pass}`. Exit 0 iff pass. |

## Rules the gate enforces (don't fight them)

1. **Never weaken an assertion to pass** — if the spec and a test conflict, STOP and report "cannot pass honestly" with the conflict. Abstention is a sanctioned, receipted outcome; weakening is gamed-gate quarantine.
2. **Fixtures/oracle are frozen after commission** (hash-checked platform-side). New scenarios come from the platform's held-out seed, not from editing history.
3. **Assert values, not existence.** A chart that exists but renders fixture constants is the named enemy (Potemkin); the commission's mutant battery includes exactly that mutant.
4. **Synthetic is labeled** end to end — generator output, bridge replies, rendered framing.
