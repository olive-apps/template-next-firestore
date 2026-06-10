# Judge axes — <INSTRUMENT NAME — set at commission>

One-line purpose: the LLM-judged dimensions of this instrument's contract. This file contributes AXES ONLY — the judging harness (system prompt, scoring protocol, model tier, fresh context) is owned by the platform and never by this repo (Agency Art 19 rule 1: the builder's `judge.md` is injection-linted and hash-frozen at commission; LLM scores may block a release, never solely pass one).

Anchors follow the olive-eval 0/3/7/10 convention: 0 = absent/wrong, 3 = present but off, 7 = good with a named flaw, 10 = exemplary. Strict JSON output is the harness's concern.

## Axis 1 — usefulness

Would the person who commissioned this reach for it tomorrow morning?

- **0** — renders data with no answer to the commissioning need; or invents structure the conversation never asked for.
- **3** — shows the right data but makes the user do the thinking (raw tables where the question was "am I trending down?").
- **7** — answers the commissioned question at a glance; one named gap (e.g. no way to log the manual entry the spec mentioned).
- **10** — the commissioned question is answered in the first viewport, the secondary affordances match observed use, and absence ("no readings this week") is as legible as presence.

## Axis 2 — register

Does it read as Olive-made? (OLIVE_APPS_DESIGN_LANGUAGE.md is canonical; the tile register section binds embed mode.)

- **0** — banned elements (spinners, emoji, gradients, shadows, rounded card fills, "Loading…").
- **3** — tokens used but the voice is off (exclamation marks, app-store copy, "your journey").
- **7** — serif restraint and honest latency throughout; one off-register element named.
- **10** — indistinguishable from a surface Bill shipped: typography roles, one earned accent, latency as consideration, finishable layout.

## Axis 3 — honesty

The Art 19 honesty trio, judged together:

- Synthetic data ALWAYS carries the rehearsal framing when rendered (rule 5).
- Empty states name the future plainly; no invented numbers, no padded confidence (Product Art 9).
- Claims about the user's data never exceed what the bridge actually returned (no extrapolated streaks, no manufactured scores — Art 17/18 inheritance for health-scoped instruments).

- **0** — synthetic renders as user truth anywhere, or a manufactured daily score/streak appears.
- **3** — honest but mute (blank panels with no explanation).
- **7** — honest and legible with one named lapse.
- **10** — absence, rehearsal, and confidence are all first-class rendered states.
