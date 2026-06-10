# Evaluation Contract — <INSTRUMENT NAME — set at commission>

One-line purpose: the binding pass bar for this instrument. The build worker iterates dev↔eval until this contract is green; the PLATFORM re-executes it at the commission and every revision gate (worker results are advisory — Agency Art 19 rule 1). The proven lever: artifacts that carry their contract inline score 9.30 vs 3.79 without (olive-eval/build_handoff/prd_quality).

## How this file is used

- The worker fills the **Dimensions** table at commission (4–8 rows; each with a one-sentence definition and a runnable predicate), keeps `fixtures/`, `checks.py`, and `playwright/` consistent with it, and NEVER edits this file after the commission gate accepts it (it is hash-frozen; an edit quarantines the revision — Art 19 rule 6).
- Deterministic gates must ALL equal 1.0. The composite (judged dimensions) must be ≥ 0.90. Held-out scenarios are generated at gate time with a platform seed this repo never sees; the public-vs-held-out gap is reported.
- **Abstention is honest and sanctioned:** if the spec and the tests cannot both be satisfied, STOP and report "cannot pass honestly" with the conflict — that becomes a receipt, never a hack (ImpossibleBench: an abstention path cuts cheating 54%→9%).

## Dimensions (TEMPLATE — replace at commission)

| # | Dimension | Definition (one sentence) | Predicate | Bar |
|---|---|---|---|---|
| 1 | renders_truthfully | Every value on screen equals the fixtures' oracle label for the same seed. | `playwright: values-match-oracle` | ==1.0 |
| 2 | honest_absence | Empty/missing-data states name the future plainly; no invented numbers. | `playwright: empty-state` + `checks: synthetic_labeled` | ==1.0 |
| 3 | hostile_inert | Every string in `bridge/protocol-fixtures.json#hostileStrings` renders as inert text. | `playwright: hostile-strings` | ==1.0 |
| 4 | scope_honesty | The app requests only `instrument.json#scopes` and degrades cleanly on `scope_denied`. | `checks: scopes_subset` + `playwright: denied-path` | ==1.0 |
| 5 | offline_bundle | The bundle serves with no network: fonts self-hosted, manifest present, ≤5MB. | `checks: bundle_*` | ==1.0 |
| 6 | usefulness | A person with this need would reach for it tomorrow (anchored 0/3/7/10). | `judge.md axis 1` | ≥7 |
| 7 | register | Reads as Olive-made: serif restraint, honest latency, no banned elements. | `judge.md axis 2` + `checks: banned_apis` | ≥7 and ==1.0 |

## Benchmark

`composite >= 0.90 AND every deterministic gate == 1.0` — mirrored in `instrument.json#benchmark`. `run.py --no-llm` runs gates only (what the platform gate re-executes first); judged axes run under the platform's judge harness (this repo contributes axes via `judge.md`, never the harness).
