# Your Area: Coverage (Key `coverage`)

Read `common.md` beside this file first: it applies in full. Your brief is
`docs/verification/prompts-2026-10-16/coverage-classes-and-evidence-totals.txt`, carried to this pass's baseline, and
the owner's brief of this pass (`docs/verification/briefs-2026-10-16/08-complete-integration-and-acceptance-pass.txt`)
in its sections 13 and 14: "the completed coverage matrix with evidence links", denominators reported, skipped coverage
reported, and no aggregate that conceals unfinished behavior.

## What You Own

`tools/coverage.mjs`, `tools/capabilities.mjs` if needed, `docs/verification/pipeline/` (read its README first: the audit
and `docs/GAMEPLAY-COVERAGE.md` are generated, never edited by hand), and the coverage records. You don't edit `src/` or
`tests/`, except a static test for `i-stale-claims` if one is needed. You don't touch `tools/completion-matrix.mjs` or
`docs/verification/integration-2026-10-16/` beyond your own result: the session that launched you owns them.

## The Items

1. **Separate totals** (the brief's item 1): a per-row evidence class written by the pipeline into each audit row
   (player journey, retained engine verification through labelled fixtures, documentation and static checks, deferred
   scope), without changing any row's status; a second table on `docs/GAMEPLAY-COVERAGE.md` beside the status totals;
   `coverage.mjs --check` failing a row whose class disagrees with its evidence kinds. No row moved to Deferred or out of
   the denominator.
2. **`i-stale-claims`** (its item 2): the `static` evidence kind defined on the page, its standard (reaches the text the
   claim is about, must-catch and must-accept examples, not vacuous), the old classification kept in the row, and the
   three tests it cites read to see that they meet it.
3. **The 14 unresolved rows** (its item 3): each row's words distinguish current Yale-player acceptance (unreachable,
   and why), retained engine behavior tested through fixtures (which tests), deferred gameplay (if the owner's scope
   defers it), and unfinished implementation (report it to the launching session; don't implement). Corrected through
   `inputs/doc-fields.json`, not the audit.
4. **This pass's areas folded in.** Health (eligibility, billing) and school have finished; banking and tax are finishing
   now. Their results are `docs/verification/remaining/<key>-result.json`, each with `rowText {auditRowId: {field:
   text}}` and `evidence`. Add a fold step (as `scope-fold.cjs` folds `docs/verification/scope/`) that reads every
   `remaining/*-result.json` present, so that running it again after banking and tax finish takes theirs too. A test
   title an area renamed goes in `inputs/renames.json`, not into the audit. Some areas edited audit rows by hand
   (`git diff docs/verification/audit/`); bring each such edit into the pipeline's inputs so a regeneration reproduces
   it, and say which. Then regenerate (the README's order), `node tools/coverage.mjs`, `--check`, and
   `node tools/capabilities.mjs --write` and `--check`. A check that fails on a row whose area is still at work: say
   which, and don't fix the area's tests.

Write `docs/verification/remaining/coverage-checklist.json` before your first change and `coverage-result.json` after,
as `common.md` says. Your final message: each item's disposition, the totals before and after (every class and every
status, counted by the tool), every file changed, every check run and its exit, and what you found outside your area.
