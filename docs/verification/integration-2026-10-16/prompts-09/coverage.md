# Your Area: Coverage's Remaining Gaps (Key `coverage`)

Read `common.md` beside this file. Your section of the brief is section 5, except the completion matrix, which the
launching session owns (`tools/completion-matrix.mjs`, `docs/verification/integration-2026-10-16/criteria.*`,
`COMPLETION-MATRIX.md`). You own the audit pipeline (`docs/verification/pipeline/`), `tools/coverage.mjs`,
`tools/capabilities.mjs` and `docs/capabilities.json`. You work in the shared tree.

1. **Audit rows for the nine commands** traced outside the audit: `brief.choose`, `brief.prepare`, `brief.reader`,
   `school.choose_playing`, `school.choose_part_playing`, `work.identify`, `work.try`, `work.settle`, and
   `life.look_after` as a command (the audit keys it by its actions). Through `inputs/added-rows.json`, each with every
   field a row has (entry, reads, changes, downstream, explanation, tests, status, issue), read against the page's
   standard from the code and the tests yourself; where no gate test reaches what a row claims, write the test (a played
   journey through the command, as `tests/scope-*.test.ts` do) or give the row the status its evidence earns.
2. **`health.request_hardship`'s renewal branch**: a member's renewal notice answered by a hardship, played through the
   game (the notice, the command as Papers issues it, the decision, persistence across a reload, one jump against day by
   day), in a new gate test, `tests/remaining-09-hardship.test.ts`; then the row's status from its evidence.
3. **The 13 unresolved rows**, each read again: what a Yale player meets now (the last pass found `bank.savings_notice`
   reachable through a home-country account; others may be too), what can be implemented in scope, and what's genuinely
   unreachable because the owner removed the systems that reached it (travel, a life abroad: `docs/REQUIREMENTS.md`).
   Resolve every implementable requirement: a played test where play now reaches it, a fix where it's broken. Keep
   explicit deferrals apart from what's merely unresolved. Don't restore removed systems.
4. **The banking area** (in this tree beside you) will change German closing fees and may rename three test titles;
   fold its result (`docs/verification/remaining-09/banking-result.json`) and the others in `remaining-09/` when they
   come (extend `remaining-fold.cjs` to read that folder), and regenerate at the end.

Your result: `docs/verification/remaining-09/coverage-result.json`, with the totals by status and class before and after.
