# Brief 11, Acting: ST6-R And The Judge's Clauses (2026-10-16)

Read `common.md` first. Your area is `acting`; your clone is `…/scratchpad/acting11`, branch `acting11`.

## What The Brief Says (Section 8)

> Use the already approved design direction. Do not reopen the entire balance model.
>
> For restrained interpretation:
>
> - Determine which remaining failures indicate missing gameplay and which indicate a test that contradicts the approved design.
> - Preserve meaningful restrained choices without making one strength erase unrelated weaknesses.
> - Ensure tests detect when restraint's own relevant abilities cease to matter.
> - Do not declare all of ST6 resolved because one replacement subclause passes.
> - Finish justified implementation work before escalating a genuine design conflict.
>
> Document any necessary criterion clarification before changing its test. Map it to the approved behavior and retain the
> earlier result. If a material design decision truly remains unresolved, finish all independent work before presenting it.

The approved design is in `docs/verification/decisions-2026-10-16/brief-10.md` and the owner's decisions it records, with
the criteria in `docs/verification/decisions-2026-10-16/criteria.md` (ST6-R, H4-R, ST3-R, L3-R). The owner's H4 requirement
(one strength doesn't erase an unrelated weakness) is approved design.

## The Rows

| Row | Status | What it lacks |
|---|---|---|
| `ST6-R.a` Viable | Decision Required | 2 of 44 at the 600 budget (a quarter asked); the cause measured: the whole's weakest-dimension term, which H4 requires |
| `ST6-R.c` Success depends on what it should | Decision Required | rests on (a)'s wins |
| `ST6-R.e` Diverse, independent examples | Decision Required | rests on (a)'s wins |
| `ST6-R.g` It catches what it should | Decision Required | (b) as written survives restraint's draws removed |
| `ST6-R.bPrime` | Decision Required | whether (b′) replaces (b): the restrained lift with restraint's draws against without them |
| `ST3-R.e`, `H4-R.e`, `L3-R.a`, `L3-R.b`, `L3-R.e`, `judge.together` | Verification Incomplete | met by measurement; no gate test holds the clause |
| `judge.tests` | Verification Incomplete | tests/decisions-judge.test.ts cited by file, not by title |
| `judge.coverage-row` | Verification Incomplete | `docs/COVERAGE-MATRIX.md`'s scene count corrected by hand, held by no test |

Each row's full record is in `baseline.json` (its `decision` holds what brief 10 measured and every change considered), and
`docs/verification/remaining-10/judge-result.json` holds the measurements.

## How To Work It

1. **Sort ST6-R's failures.** For each failing clause, say whether it shows missing gameplay (restraint's own abilities not
   read where the approved design says they should be) or a criterion that contradicts the approved design (for one, a
   threshold set beside a figure measured on unequal budgets, against H4). Measure, don't argue: `tools/interpretation.ts
   --st6` and in-process probes in a copy.
2. **Implement what's justified.** Where restraint's own abilities (emotional depth, composure, focus, the control the
   approach draws) fail to matter where the approved design says they do, fix the engine within that design, from a
   source where the house asks one. A judging change moves `RULESET` to evaluation-12 (common.md). Measure every
   interpretation and stage criterion again after it (`docs/verification/decisions-2026-10-16/measure.sh`), with H2, H4-R
   (c) and the others held.
3. **Clarify only what contradicts the approved design.** Write it first in `clarifications.md` (common.md), with the
   earlier result kept, then change the test. Don't call ST6 resolved because (b′) passes: each clause gets its own status.
4. **Detect when restraint's abilities stop mattering.** A gate test that fails when restraint's draws are removed, and one
   that fails when the specialist's own restrained abilities (emotional depth, composure, focus) are set to the even
   actor's while everything else is held. Break each in a copy and record what caught it.
5. **The measured clauses:** a gate test for each where the clause allows one cheaply (the property held directly on a
   small fixed set of materials, figures worked from the rule); otherwise the measurement's command, its seeds and its
   output file for the coordinator to run again on the tested commit.
6. **judge.tests:** cite each test in `tests/decisions-judge.test.ts` that holds a part of section 1's list by its exact title.
7. **judge.coverage-row:** a gate test that the scene count `docs/COVERAGE-MATRIX.md` states is `SCENES.length`, corrected
   where the count has moved.

Where a genuine design conflict remains after all of this, write it as a decision in your result (the question, the
evidence, the options each measured, your recommendation), and finish every other row first.
