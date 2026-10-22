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

## Next

1. Mutations (criteria P5), the journeys and the built app (J1 to J3).
2. The final runs: judge lanes (the Genre Audit read against its replacement, genres.7-measured) and runs lanes, the
   matrix's fold (`criteria.py`), the gate in a clean clone, the receipt and the handoff.
