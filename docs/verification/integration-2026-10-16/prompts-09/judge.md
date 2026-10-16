# Your Area: The Stage And The Attributes (Key `judge`)

Read `common.md` beside this file. Your section of the brief is section 2 (ST3, ST6, H4, L3), in full.

## Where You Work

Your own clone: `/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/judge`, branch `judge`,
at `d7127819` (the shared branch with the brief added). `node_modules` is linked. Commit there; never push. The session
that launched you brings your commits into the shared branch. Another agent changes the genre briefs
(`content/briefs/briefs-*.ts`, `second-*.ts`) in its own clone: don't edit those files; put any new material of yours in
new files (as `content/scenes-public.ts` was), and say in your result which files you changed.

## What Was Found Last Time (Read Before Measuring)

`docs/verification/integration-2026-10-16/`: `st3.md`, `st6.md`, `h4.md` (with `h4/grid.txt`, `h4/switches.patch`,
`h4/landscape-probe.ts.txt`), `l3.md`, `closeout/`. The criteria: `../stage-2026-10-16/criteria.md` (ST1 to ST9),
`../attributes-genres-2026-10-16/acceptance-criteria.md` (A to O, H1 to H7, L1 to L3), `../interpretation-2026-10-16/criteria.md`
(I1 to I5), `../genres-2026-10-16/g1-replacement.md` (S1 to S4). The tools: `tools/interpretation.ts -- --fresh --stage`,
`tools/ag-baseline.ts` and `tools/ag-criteria.mjs`, `tools/brief-journeys.ts -- --trace`, `tools/genre-signature.ts`,
`tools/genre-identity.ts`, `tools/genre-audit.ts`.

## The Order

1. **Reproduce on the current code first** (your clone at `d7127819`): ST3, ST6, H4 and L3, and every criterion that
   holds, into `docs/verification/integration-2026-10-16/baseline-09/`. Preserve the original results and criteria.
2. **ST3.** Keep full-precision calculation and final-boundary rounding. Tests that identical effective inputs give
   identical results (stage and close frame, the same performer, every input the formula reads equal, stamina not
   draining). Separate rounding from legitimate differences (stage demands, stamina, execution weighting), case by case
   on the 171, and show on the evidence why each remaining difference exists. If the criterion demands equality while a
   relevant input varies, document the conflict and the amended criterion, proposed, not counted.
3. **ST6.** Trace each failing case (the restrained specialist against the grain) through abilities, material,
   suitability, preparation and scoring; `st6.md` found the grain's cost on believability. Implement corrections only
   where the evidence and a source justify them (the scene's circumstances read wrongly from its text; a demand the model
   misweighs; restraint's craft under-read where the literature says it carries). No restraint bonus, no difficult case
   removed, no manufactured split; expansive acting and scene demands stay meaningful.
4. **H4.** All twelve specialist profiles: for each, missing opportunities (no work in the catalog where the ability is
   what the work is about), benchmark assignments that don't fit (the pieces H4 counts as the ability's), and actual
   scoring weaknesses. Add in-scope material and development paths where an ability is underrepresented, presence,
   discipline and stamina above all (`h4.md` §3 and its "For The Owner" 2), researched and read from public-domain texts
   or original exercises as the four drama scenes were, each committed before it's measured. Specialists should have
   real advantages on fitting work without every ability being equally strong everywhere. Measure H2 and H5 (which pull
   against H4) after every change. Keep the original H4 beside any replacement you propose.
5. **L3.** Controlled progress: the same work, interpretation, preparation and conditions at earlier and later levels
   (the trace does it), reported apart from the changing mix and difficulty of the work attempted. Fix any unintended
   regression you find. Don't force a rising mean by keeping a student from harder material. Keep the journey metric
   and the controlled measure side by side.
6. **Everything measured again** after your changes: ST1 to ST9, F1 and F2 of the stage, I1 to I5, every attribute
   criterion (`ag-criteria.mjs`), M1 (mastery at 100), S1 to S4 on all four samples, G2, the genre audit's isolation, the
   suite's judge tests. A criterion that held and now fails is a regression you fix or report with its cause.

Every change to the judge moves `RULESET` (`content/tasks.ts`) and its row in `docs/ENGINE-MODEL.md`. Tests' expected
figures are worked from the rule, never typed from the engine.

Write your accounts beside the last pass's (`st3.md`, `st6.md`, `h4.md`, `l3.md`: add a dated section, past tense for
what's no longer true), and `docs/verification/remaining-09/judge-result.json`.
