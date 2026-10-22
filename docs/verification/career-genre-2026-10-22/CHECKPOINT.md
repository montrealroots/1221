# Brief 22: Where The Work Stands

For the next session or the other account, beside the handoff. The tree outranks this file: read `git log` first.

## Done

- **The brief, verbatim:** `../briefs-2026-10-16/22-finish-the-three-remaining-career-and-genre-issues.txt` (`69996adb`).
- **Criteria before any fix:** `criteria.md`, with the fixed seeds (`b22-proof-1` to `-8`) and the journeys named.
- **The sources, dated:** `authorization-sources.md`.
- **A1, the failure reproduced** on the starting commit `69996adb` in a clean clone (`before/b20-4/`, its script
  `repro.sh` and `exits.txt`): b20-4's OPT ended at 14:25 UTC on 6 September 2029, and The Winter Ledger went on, 47 of
  its days worked after that instant, 6 September's rehearsal 25 minutes before it, so the journey's own coherence check
  reads 48 days from the 6th, as brief 21's record has it. Its OPT had counted 88 days without work by 1 September; the
  run began on the 4th. The life's save on 1 September 2029, before the end, is `tests/fixtures/b22/b20-4-opt-2029-09-01.json.gz`,
  kept out of the seven older saves `tests/b20-guide-startup.test.ts` counts.

- **A, authorization** (`34b748ee`): OPT counted by the day, permission read at every work day, release with its
  notice, pay for days worked kept; `tests/b22-authorization.test.ts`.
- **W and T, genres** (the commit after `34b748ee`): `content/genre-weights.ts` read at the most precise level by every
  consumer; transfer across one direct link, the genre's own counted beside it; the coefficients measured
  (`comparisons.md`, `tests/b22-comparisons.test.ts`) and set to 0.65 and 0.40; the decision history
  (`decision-history.md`); `tests/b22-genre-weights.test.ts`, `tests/b22-transfer.test.ts`. The full suite on the tree
  before that commit: 11 failures in 8 files, each a figure the weights or the coefficients moved, read and restated
  with a dated note, then all 11 files passing (194 tests).

- **The faults and the built app** (`8aa87539`): 26 faults in a clean clone of `d69ad309`, 24 killed; the two that
  survived each wanted a test, added (the older save's first work day, the shoot day split at OPT's end). The walk of the
  built app found Papers' status a day late, fixed.
- **The tested commit** (`16b50e07`): both survivors killed on the rerun; the final runs' lanes written.
- **The final runs** on `16b50e07`, each lane in a clean clone (`final-runs/runs/README.md`, `final-runs/final/README.md`):
  the judge's 36 figures brief 21's, Genre Audit-R verified, the advice, interface and acceptance as before. Brief 20's
  and brief 13's journeys were played again on `afe751f1` and `0ae97df3`, whose `src` is the tested commit's, because
  their runners' checks stated the rule brief 22 replaced.
- **The fold** (`07ae403c`): 633 of 658 Implemented And Verified, INT-gate waiting on the gate.
- **The receipt and the handoff:** `README.md`, and the handoff's top section.

- **The gate** in a clean clone of `cf83e61d`: exit 0, 486 of 486 files, 5,596 of 5,596 tests, every check
  (`final-runs/runs/gate.txt`); folded, the matrix at 634 of 658.

- **The gate again** in a clean clone of `0014aff6`, the fold: exit 0, the same totals, the matrix at 634
  (`final-runs/runs/gate-receipt.txt`).

## Next

Nothing in the brief is left. Until 2026-10-22 nothing was merged; at the owner's "lets just merge everything" it went to
`main` in #54 (`9aed9ed4`). Nothing is deployed.
