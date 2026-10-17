# Brief 11's Batches

Each batch as brief 11's section 9 asks for it. The actionable portion is the classification's 46 rows. Decision 4's 23
and the 9 administrative rows are outside it.

## Batch 0: The Administrative Reconciliations (`1d9afa4e`)

- **Rows addressed:** ST3.asWritten, H4.asWritten, L3.asWritten (superseded); tax.s8.residence_naturalization,
  judge.stamina-load (duplicates); tax.s8.jurisdiction, judge.baseline twice, stamina.measure (records of a process step).
- **Administrative:** all 9 Explicitly Deferred, each with its reason (`criteria.py`, brief 11's overrides). None is
  progress, and none is counted closed.
- **Actionable incomplete:** 46 before, 46 after.
- **Implemented and verified:** none.
- **New defects:** none.
- **Tests and evidence:** `node tools/completion-matrix.mjs --check`, exit 0. The matrix's own figure moved to 530 of 599.

## Batch 1: The Audit Pipeline And The Genre Table (`752d8488`)

- **Rows addressed:** coverage09.4-fold, coverage09.5-journeys-fold, coverage09.6-journeys-followup-fold, genres.4-kept,
  genres.6-table.
- **Actionable incomplete:** 46 before, 41 after.
- **Implemented and verified:** the five, each by gate tests cited by title (`integration-result.json`):
  - `tests/audit-pipeline.test.ts`: the pipeline run in a copy makes the committed audit byte for byte, and each fold's
    claim is read from the copy;
  - `tests/remaining-genres.test.ts` (`genres-09.md’s table of the 55, against the code`): each row read against
    `tools/genre-pairs.ts`.

  Eleven mutations in a copy, each caught. Two survived the test's first version, an add not placed and settled not
  placed, because the fold reads its own last output; the test now takes those out first.
- **Administrative:** none.
- **New defects:** the fold never read `remaining-10/`, so brief 10's results never reached the audit. It's recorded, it
  isn't a gameplay defect, and it doesn't block completion.
- **Tests:** the two files, each exit 0; `npm run typecheck` 0; eslint 0; the document checks, devmap and traceability
  each 0; `node tools/completion-matrix.mjs --check` 0.
