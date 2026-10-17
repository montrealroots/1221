# Brief 13: The Final Acting Clauses And The Playthroughs, 2026-10-17

The owner's "Resolve The Final Acting Clauses And Validate Through Multiple Playthroughs"
(`../briefs-2026-10-16/13-resolve-the-final-acting-clauses-and-validate-through-multiple-playthroughs.txt`, kept
verbatim). It finishes ST6-R2.c and ST6-R2.e, then validates the game through complete playthroughs, in the engine and
on the built app. It adds no scope, and decision 4's rows are untouched.

## Where It Started

Read on `102ba8f2`, `main` at #39's merge, the branch restarted from it. The figures are brief 12's receipt's
(`../resolution-2026-10-17/RECEIPT.md`), which found no problems:
- **Against brief 11's frozen baseline** (608 rows in scope): 572 Implemented And Verified (94.0%).
- **The 46 actionable rows:** 39 closed, 4 superseded, 1 scope resolution, 2 research assumptions, 0 remaining.
- **The matrix's own count:** 574 of 599 (95.8%). Its 20 rows still Implemented, Verification Incomplete are all decision
  4's. Its 5 Decision Required are decision 4's three, and ST6-R2.c and ST6-R2.e.

ST6-R2.c and ST6-R2.e are the replacements of ST6-R (c) and (e), counted apart from the 46 actionable rows. Each failed
as brief 12 wrote it only at a limit its criteria didn't name (`../resolution-2026-10-17/acting-result.json`):
- **(c):** 10 brief readings at a suitability of ±0.01 don't move, and none moves the wrong way. Specialists come out
  ahead on 65 of 6,344 pairs (1.02%, against 1%).
- **(e):** "more than the even actor" can't hold on stage, where the even actor has every suitable piece, 66 of 66.

## How It's Worked

Three areas, each in its own clone, from instructions written before their work (`prompts/`):
- **acting:** ST6-R2.c and ST6-R2.e, as section 1 to 3 authorize;
- **journeys:** at least twelve complete school journeys, then the continuity and freshness checks (sections 4 and 6);
- **interface:** three multi-step playthroughs of the built app, and the owner's short manual route (section 5).

The coordinator integrates them and checks the guarantees (section 7). It runs the final verification on the integrated
code (section 8) and writes the close-out (section 9): this folder's receipt, the handoff and the pull request.

## Where It Ended

Each figure here is read from a file in this folder, and `RECEIPT.md` and `GUARANTEES.md` are written by scripts from
them. The tested code is `7e7a3af6`'s.

- **ST6-R2.c: Implemented And Verified** (`acting-criteria.md`, `acting-result.json`, `acting/`).
  - The ten readings at ±0.01 are `grainOf`'s hundredth, not display rounding and not a limit.
  - "Unrelated" is read from the engine's dependency path, piece by piece, and 1/12 wasn't adopted.
  - The 65 pairs are the equal budget's arithmetic, each with a path into the take.
  - Brief 12's (c2) and (c4) stay not met as written.
- **ST6-R2.e: Decision Required.** (e1) holds. (e2) and (e3) aren't met as written, and the area's question for the
  owner is in its row.
- **The journeys:** 25 runs, 23 complete journeys and 2 focused scenarios (`journeys-result.json`, `journeys/`).
  - The area fixed five game defects, D1 to D5, each with a test.
  - Played again on the tested commit (`journeys-final/`): all ten checks passed on all 25, each ending as the area's
    run ended.
  - J21 ended at 26 by the mortality draw, before its degree; J23 was added to the same profile.
- **The interface:** three playthroughs at 1440 and 390 (`interface-result.json`, `interface/`), and again on the
  tested commit (`interface-final/`), every step passed. The area fixed two defects. `PLAYTEST.md` is the owner's
  route, and no automated run is a judgment of how the game feels.
- **The coordinator's fixes:**
  - OPT approved after the degree was withheld (`fa36c201`);
  - the acceptance step that relied on D3 (`51cdd7d6`);
  - the matrix's fold dropping a later result's measurement.
- **The guarantees** (section 7): `GUARANTEES.md`, all ten held.
- **The final runs:** `runs/README.md`, `final/README.md`. The gate ran on `0cf3a9bc`: 376 of 376 files, 4,587 of
  4,587 tests, exit 0 (`runs/gate.txt`).
- **The figures:** 572 of 608 against the frozen baseline (94.0%); the matrix's own, 612 of 636 (96.2%).
- **Decision 4's 23 rows are unchanged.** Merging and deploying are the owner's.
