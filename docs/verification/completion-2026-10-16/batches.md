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

## Batch 2: The Journeys Area (`f478afa5` to `3db028c9`, folded in `dcd59fba`)

- **Rows addressed:** tax.s8.f1_status, tax.s8.ssn, tax.s8.opt, tax.s8.license, tax.s8.visas_authorizations,
  health.enroll, l-actor; defect.yale-credit-hold and defect.personality-year (added work).
- **Actionable incomplete:** 41 before, 36 after. Two of the 36, health.enroll and l-actor, have their area's verdict
  and wait on a second reader before the audit moves them.
- **Implemented and verified:** the five tax.s8 items, each by gate tests cited by title. Each part's existing tests were
  read, and two new ones written for the parts none held: a passport run out under an F-1 (`tests/remaining-papers.test.ts`),
  and Going Abroad deciding nothing (`tests/defects-g25-1.test.ts`).
- **Added work:**
  - **defect.yale-credit-hold, fixed.** Two credits reach a hold in play: a medical leave's tuition rebate, and a term
    begun under the hold, refunded. `creditAccount` reconciles through `liftHold`, and an older save's hold over
    nothing owed is lifted on opening.
  - **defect.personality-year, fixed.** One case's lives ended 11.29 days in; every year now runs 365 days, alive on
    every day it reads. Mortality and the ended-life setup are unchanged.
- **New defect:** registering on a leave registered the student for the term the leave left. It's fixed, and it doesn't
  block completion.
- **Administrative:** none.
- **Regressions in verification, not behavior:** six measured rows read the changed files (F2-A, MA5, INT-skipped,
  INT-navigation, INT-long-runs, INT-gate) and are stale until they're measured again on the final commit.
- **Tests:** the journeys area's 14 changed or cited files rerun on its last commit, and 26 more cited files, each
  exit 0; typecheck, lint and the document checks 0 (the area's report, `journeys-result.json`). After the fold:
  `tests/audit-pipeline.test.ts` 0, `tools/coverage.mjs --check` 0, `tools/capabilities.mjs --check` 0.

## Batch 3: The Acting Area (`e5de5982` to `9ef67042`, as cherry-picked)

- **Rows addressed:** ST6-R.a, ST6-R.c, ST6-R.e, ST6-R.g, ST6-R.bPrime, ST3-R.e, H4-R.e, L3-R.a, L3-R.b, L3-R.e,
  judge.together, judge.tests, judge.coverage-row.
- **Actionable incomplete:** 36 before, 29 after.
- **Implemented and verified:** ST6-R.bPrime, ST3-R.e, H4-R.e, L3-R.a, L3-R.e, judge.tests and judge.coverage-row, each
  by gate tests cited by title (`acting-result.json`), each new test broken in a copy and caught (18 of 18). The (f)
  test passed vacuously on 0 of 0 under one mutation; that test defect is fixed.
- **Clarifications, written before any test changed** (`clarifications.md`):
  - **A1:** (g)'s first check is read against (b′), with (b) as written kept. It's mapped to the owner's brief 10 words,
    not adopted because it passes.
  - **A2:** "it fails" means a clause that holds must fail under the mutation.
- **Decision Required, for the owner:** ST6-R.a, .c, .e and .g. Each option is measured, and the recommendation is in
  `acting-result.json`.
- **Left to the final measurement:** L3-R.b and judge.together. Both were met here, but the gate can't carry them.
- **The judge:** unchanged. No file under `src` moved, and RULESET stays evaluation-11.
- **New defects:** none in the game.
- **Tests:** `tests/decisions-judge.test.ts` 29 passed, `tests/scenes.test.ts` 5, `tests/stage-interpretation.test.ts`
  12, each exit 0; typecheck, lint and the 18 checks each exit 0 on the area's clone.

## Batch 4: Research, And The Journeys' Audit Rows Read Again (`1037b1ce` to `ea66293b`, and the fold after)

- **Rows addressed:** KS-ct-idcard, KS-passport-fees, health.enroll, l-actor.
- **Actionable incomplete:** 29 before, 28 after.
- **Implemented and verified:** l-actor. A second reader's check upheld the journeys area's claim. The row is Older Saves
  Only, a path only a save from before schema 94 reaches, so its audit status stays legacy, and its `tests` field now
  cites the test. The coordinator recorded the check's verdict as legacy and said why in the check.
- **Blocked Externally, with the part each source settled implemented and tested:**
  - **KS-ct-idcard:** seven years to a birthday (CGS 1-1h(b)(2)), the card mailed in twenty business days, and SAVE's ten
    days first for somebody not a citizen. No source gives a non-citizen's term.
  - **KS-passport-fees:** Iceland's fee and its express service, Brazil's US$60 and Latvia's €140 from their offices.
    Japan's consulate and New Zealand's passport office refused every request.

  Both are mutation-tested: M1 to M10 and P1 to P5, each caught.
- **Not verified:** health.enroll. The second reader kept it partial: its work arm is unreachable in play and changes
  only the notice's words. The journeys area's verdict didn't hold, and the row stays incomplete with that blocker, the
  owner's to decide.
- **Administrative:** the audit rows' own words corrected (`audit-text-result.json`, folded):
  - documents.apply_idcard and documents.idcard_arrives, for the mail's titles;
  - l-actor's tests and line;
  - health.enroll's line references, its tests and the unreachable arm.
- **New defects:** a dead DMV link and a wrong citation, CGS 14-36(c), for a non-citizen's term, both corrected; and
  `docs/WORLD.md` said every US state card is REAL ID. None blocks completion.
- **Tests:** the research area's 19 files, each exit 0 on its clone. Here, `tests/remaining-papers.test.ts` gave 14
  passed after the merge of the two areas' imports; `tsc -p tsconfig.app.json` and `tsconfig.node.json` 0;
  `tools/coverage.mjs --check` 0, `tools/capabilities.mjs --check` 0, `tests/audit-pipeline.test.ts` 0.

## Batch 5: The Attributes Area (`f7341c23` to `4284e869`, as cherry-picked)

- **Rows addressed:** A4, A5, T1, O3, F1, F3, A1 (brief 10's judge item), stamina.A1, and section 7.
- **Actionable incomplete:** 28 before, 21 after.
- **Implemented and verified:** all eight, by 22 new tests in `tests/attributes-phase-2b.test.ts`, every one cited by
  title (`attributes-result.json`). Each criterion that covers all twelve abilities is tested on all twelve. 30
  mutations were made in a copy, and each was caught.
- **Added work, six defects each blocking a row:**
  - the ability look's own sentence was shown nowhere;
  - stamina's readers were said as consistency, not the drain;
  - four ability sentences contradicted the code: presence, memory, composure and discipline, each old clause kept dated;
  - the Profile's Last Change rounded the history twice (+0.24 against the toast's +0.25);
  - the Look After menu said fitness to the whole point ("51 → 51" for 0.8);
  - stamina's drain was advised as rest, not fitness.

  None changes what the game judges, so RULESET is unchanged; the final measurement holds that.
- **Section 7:**
  - The flu takes condition and energy, is told, and leaves fitness.
  - It reaches a night once, through readiness, with no second count.
  - Rest restores energy without curing the flu or building fitness.
- **Regressions in verification, not behavior:** `systems/material.ts` is in every judge measurement's watch, so 41
  measured rows are stale until the final run, and the matrix's figure fell to 514.
- **Administrative:** l-actor's line reference moved again with `actor.tsx` (now :65).
- **Tests:** the area's 50 files, each exit 0 on its clone. On the combined tree: `tsc -p tsconfig.app.json` 0, lint 0,
  and sixteen of the gate's checks each 0 (devmap, traceability, the document checks, wired, deciders, inventory,
  capabilities, coverage, student-matrix); `tests/audit-pipeline.test.ts` 0.

## Batch 6: The Advice Area (`ab7fcabc` to `b72c22eb`, cherry-picked to `598f5dcd`)

- **Rows addressed:** L1, advice.F2A10-f, advice.F2A10-h, advice.harness, advice.F2A10-a, advice.harness-hospital,
  advice.tests.
- **Actionable incomplete:** 21 before, 13 after. Eight closed: the seven here, and stamina.A1, which brief 10's override
  had kept incomplete over the attributes area's result until the matrix's reader let a later result replace it.
- **Implemented and verified:** all seven, by 19 tests in `tests/decisions-advice.test.ts` cited by title, the ten of
  brief 10 unchanged and nine new; 32 mutations in a copy, 31 caught. M20 survives: it removes a guard no tuning seed
  reaches, since the draw leaves 4 to 11 inputs at full.
- **Clarifications, committed before any test changed** (`clarifications.md`, `ab7fcabc`). Each is mapped to brief 11,
  section 8, with the earlier result kept:
  - **L1:** read on a follower and an ignorer. The ignorer's target may stay while its message changes each week with
    the player's state. As written, still 8 and 6 weeks.
  - **F2-A10 (f):** preparation is apart from training, on like-for-like hours. Diminishing returns are held below
    three quarters of full, and the constant rate above it.
  - **F2-A10 (h):** the input's own part falls, and a rise is no more than discipline's lift, said.
- **Added work, each to complete a row:**
  - the advice's note of what it put first (`Experience.advised`, optional, no schema change);
  - the state-aware first recommendation, with how long it has stood, what has moved and the next action;
  - `Forecast.preparation`;
  - `forecastAtDiscipline`;
  - the harness made testable.
- **New defects:**
  - brief 10's L1 record said the journeys' student never trained the named input, which it does, as the school allows;
  - a slowdown the area brought in and took out.

  Neither blocks completion.
- **The judge:** nothing judged moved on the 30 tuning cases or the journeys, and RULESET is unchanged. But
  `systems/briefs.ts` is watched, so the judge's measurements wait on the final run.
- **Administrative:**
  - `clarifications.md` merged from the two areas' copies;
  - `criteria.py` lets a later result replace an earlier override and drops the fields a row's old status carried;
  - `receipt.py` reads the field each status asks for.
- **Tests:** after the merge, `tsc -p tsconfig.app.json` 0, lint 0, the gate's checks each 0 (traceability after
  `--write`); `decisions-advice` 19, `attributes-phase-2b` 35, `guide-examples-craft` 10, `whynot-profile` 3, `guide` 12,
  `ability-mastered` 2, `genre-mastered` 5 and `remaining-school` 33 passed, each exit 0. The area ran 55 more files, each
  exit 0, on its clone.
