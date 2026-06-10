#!/usr/bin/env python3
"""
eval/fixtures/build.py — the seeded personal-data simulator + INDEPENDENT oracle.

Generates deterministic synthetic fixtures for this instrument's eval suite:

    python3 eval/fixtures/build.py --seed 7 --days 90
      -> eval/fixtures/data_7.json    (what the app ingests via the mock bridge)
      -> eval/fixtures/oracle_7.json  (ground-truth labels the tests assert)

Design rules (binding — the commission gate's mutant battery checks them):

1. ORACLE INDEPENDENCE. The oracle is computed HERE, from the generated
   series, with plain arithmetic — never by importing the app's own logic.
   An eval whose ground truth comes from the code under test grades nothing
   (olive-eval/my_day synthetic/build.py doctrine).

2. EXTERNAL SEED. Everything derives from --seed. The platform release gate
   re-runs this script with a seed THIS REPO NEVER SEES to generate held-out
   fixtures; if the app only passes on the public seeds, the public-vs-
   held-out gap exposes the overfit (Art 19 rule 1).

3. LABELED SYNTHETIC. Every emitted file carries "synthetic": true. The app
   must surface the rehearsal framing whenever it renders this data
   (Art 19 rule 5) — checks.py greps for the label.

4. REALISTIC SHAPE, KNOWN TRUTH. Persona-conditioned trend + weekly
   seasonality + autocorrelated noise + MNAR gaps + one labeled regime
   change — the failure modes a personal-data app must survive — with the
   parameters recorded in the oracle so assertions are exact.

The worker EXTENDS the `series` map for the instrument's domain (e.g. a
body-composition series for a scale tracker) following the same four rules;
the generic health-ish series below stay as the cross-checkable example.
"""

from __future__ import annotations

import argparse
import json
import math
import random
from pathlib import Path

HERE = Path(__file__).resolve().parent


def gen_series(
    rng: random.Random,
    days: int,
    base: float,
    trend_per_day: float,
    weekly_amp: float,
    noise_sd: float,
    ar1: float,
    missing_rate: float,
    regime_day: int | None,
    regime_shift: float,
    decimals: int,
) -> list[dict]:
    """One persona-conditioned daily series with AR(1) noise, weekly
    seasonality, MNAR gaps (worse on weekends), and an optional labeled
    regime change."""
    rows: list[dict] = []
    prev_noise = 0.0
    for d in range(days):
        noise = ar1 * prev_noise + rng.gauss(0, noise_sd)
        prev_noise = noise
        weekly = weekly_amp * math.sin(2 * math.pi * (d % 7) / 7)
        shift = regime_shift if (regime_day is not None and d >= regime_day) else 0.0
        value = base + trend_per_day * d + weekly + shift + noise
        # MNAR: weekends drop out more often (people skip weigh-ins on trips).
        p_missing = missing_rate * (2.0 if d % 7 in (5, 6) else 1.0)
        rows.append(
            {
                "day": d,
                "value": None if rng.random() < p_missing else round(value, decimals),
            }
        )
    return rows


def oracle_stats(rows: list[dict]) -> dict:
    """Plain-arithmetic ground truth. Deliberately simple and dependency-free —
    and NEVER imported from the app."""
    present = [r["value"] for r in rows if r["value"] is not None]
    n = len(present)
    if n == 0:
        return {"count": 0, "mean": None, "min": None, "max": None, "last": None,
                "first_week_mean": None, "last_week_mean": None, "delta_first_to_last_week": None,
                "missing_days": len(rows)}
    mean = sum(present) / n
    first_week = [r["value"] for r in rows[:7] if r["value"] is not None]
    last_week = [r["value"] for r in rows[-7:] if r["value"] is not None]
    fw = sum(first_week) / len(first_week) if first_week else None
    lw = sum(last_week) / len(last_week) if last_week else None
    return {
        "count": n,
        "mean": round(mean, 3),
        "min": min(present),
        "max": max(present),
        "last": present[-1],
        "first_week_mean": round(fw, 3) if fw is not None else None,
        "last_week_mean": round(lw, 3) if lw is not None else None,
        "delta_first_to_last_week": round(lw - fw, 3) if fw is not None and lw is not None else None,
        "missing_days": len(rows) - n,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, required=True)
    parser.add_argument("--days", type=int, default=90)
    parser.add_argument("--out-dir", default=str(HERE))
    args = parser.parse_args()

    rng = random.Random(args.seed)
    regime_day = args.days // 2 if rng.random() < 0.7 else None

    series_params = {
        # name: (base, trend/day, weekly_amp, noise_sd, ar1, missing, regime_shift, decimals)
        "body_fat_pct": (22.0, -0.015, 0.15, 0.35, 0.55, 0.18, -0.6, 1),
        "weight_kg": (79.5, -0.02, 0.25, 0.45, 0.6, 0.18, -0.8, 1),
        "sleep_hours": (7.1, 0.0, 0.5, 0.7, 0.3, 0.08, 0.4, 1),
        "steps": (8200, 4.0, 1500.0, 1800.0, 0.4, 0.05, 900.0, 0),
    }

    persona = {
        "name": "June",
        "note": "the fixtures persona — every instrument rehearses with June before it ever touches the user",
        "seed": args.seed,
        "days": args.days,
        "regime_day": regime_day,
    }

    data: dict = {"synthetic": True, "persona": persona, "series": {}}
    oracle: dict = {"synthetic": True, "persona": persona, "series": {}}

    for name, (base, trend, amp, sd, ar1, miss, shift, decimals) in series_params.items():
        rows = gen_series(rng, args.days, base, trend, amp, sd, ar1, miss,
                          regime_day, shift, decimals)
        data["series"][name] = rows
        oracle["series"][name] = oracle_stats(rows)
        oracle["series"][name]["regime_day"] = regime_day

    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    (out / f"data_{args.seed}.json").write_text(json.dumps(data, indent=2))
    (out / f"oracle_{args.seed}.json").write_text(json.dumps(oracle, indent=2))
    print(f"fixtures: seed={args.seed} days={args.days} regime_day={regime_day} "
          f"-> data_{args.seed}.json oracle_{args.seed}.json")


if __name__ == "__main__":
    main()
