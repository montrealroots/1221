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
