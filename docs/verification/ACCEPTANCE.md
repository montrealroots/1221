# Acceptance: SLATE's Current Gameplay Loop

The brief of 2026-10-10, "Complete And Verify SLATE's Current Gameplay Loop", requirement by requirement. Each row
keeps four judgments apart, as the brief asks:

- **Built**: is it implemented, entered by the player, reading and changing state, and reaching what consumes it?
- **Evidence**: what proves it, with the test or the run.
- **Research**: how well the numbers behind it are sourced.
- **Balance**: what the played runs say about how it plays.

Final code: `e7a4b3b4` on `claude/loop-verification`, whose `src` and `tests` are those of `e31dbffc`. The gate passed
on `e31dbffc`: exit 0 read from a file, 129 files and 1,476 tests, all fifteen checks. The suites' figures are in
`docs/verification/REPORT.md`; the feature matrix is in `docs/GAMEPLAY-COVERAGE.md`.

## 1. Scope

- **Built.** All of it is kept: creation, attributes and practice, genres and self-tapes, school, money, Papers,
  wellbeing, the calendar, the Profile, Home, and save/load.
  - The Interests are not restored. Nothing reads them, and migration 94 drops them.
  - Industry, career, housing, vehicles, travel and shopping are not restored.
  - Height and weight are asked in Your Body, first on Starting Point.
- **Evidence.** The full suite, the UI pass and `grep` all agree that no interest is read at runtime.
- **Research.** Not applicable.
- **Balance.** Not applicable.

## 2. Acceptance Checklist

This page.

## 3. The 18 Lives

- **Built.** `tools/verify.mjs lives` runs six profiles × three seeds, 3.3 years each, through public commands.
  - Each life is saved and reopened every 30 days.
  - Each result is written as the job finishes, with its commit, tree and dirty count.
- **Evidence.** All 18 ran on tree `5aff35ab`, commit `e7a4b3b4`, with nothing dirty.
  - 15 graduated. The 3 that didn't are the autopilot profile: dismissed in its third term, every seed.
  - Breaches: 0. Unbalanced ledgers: 0. Exceptions: 0. Reloads: 39–40 each.
  - An earlier pass, kept as `results-profile-unread.jsonl`, ran the first profile under every name, because profiles with spaces weren't quoted. It was found by its sameness, fixed and rerun.
- **Research.** Not applicable.
- **Balance.** Attentive and practicing players get four or five leads in five productions in most seeds. That's a question for the owner.

## 4. Mastery Through Commands

- **Built.** `tools/mastery.ts` covers 29 single targets and plans for a musical and a drama.
  - It counts sessions, calendar days and refusals, by reason.
  - Practice stays available after the degree: both plans reach full in June and November 2029.
- **Evidence.** All 29 targets reach full, and stay full after a reload.
  - It takes 314–398 sessions and 252–294 days.
  - Discipline grows by itself in 362 days.
  - Stamina is full at 99.4 in 64 days.
  - The most common refusal is the day's session limit, which is a cap, not a trap.
- **Research.** The diminishing returns and the deliberate-practice rate are SLATE's estimates, said so in `content/practice.ts`.
- **Balance.** About nine months of daily practice per target. A plan of 8–10 targets runs to the end of the degree and past it.

## 5. The Mastery Contract

- **Built.** With every relevant ability full, every technique mastered, preparation complete and a sufficient condition, every dimension and the overall score are 100.
  - This holds for every play, difficulty, template and genre demand.
- **Evidence.**
  - `tests/mastery-contract.test.ts`, 4 tests: monotonic; irrelevant ratings ignored; preparation short lowers only the dimensions that read it; each condition lowers exactly its dimensions, once; recovery restores 100.
  - `tests/mastery-integration.test.ts`, 2 tests: through `school.prepare` and the class's own showing; a sprain at the showing limits only execution and consistency.
  - Quality stays out of casting: `castScore` reads fit, delivery and balance, never a result's score.
- **Research.** The bands follow LAMDA's Pass/Merit/Distinction, as before.
- **Balance.** Not applicable.

## 6. Fitness And Recovery

- **Built.** Fitness is built by `life.look_after` exercise.
  - It holds for 3 days, then detrains 0.18 a day, down to 35.
  - Gains diminish, and the ceiling falls with age.
  - Exercise is refused in hospital and with the flu (new today).
- **Evidence.** 14 scenarios ran: full by day 84 training daily at 25, and by day 178 at three times a week.
  - At 45, fitness tops out at 91.6.
  - Training twice a week tops out at 97.7.
  - With no training, fitness falls to 35.
  - Injuries interrupt and the return recovers.
  - The 18 lives never train, so they end at 35. That was true before the Interests went too.
- **Research.** The decay and the ceilings are SLATE's estimates (`FITNESS`); the injury rates are per thousand hours, sourced in `content/injury.ts`.
- **Balance.** No played policy chooses to train. A player must decide to.

## 7. Illness And Injury

- **Built.** A condition at a showing lowers only the dimensions it names.
  - Flu takes execution and consistency, about 9–10 points each.
  - A sprain or back strain takes execution and consistency in movement work, about 25 each.
  - Voice work is untouched by a body injury, and a deep cut leaves the work as it is. A concussion excuses the student, and the showing moves to their return.
  - Calling in sick is excused and moves the showing.
- **Evidence.** `tools/condition.ts` ran 3 templates × 11 variants.
  - Interpretation is never lowered.
  - No ability is lower afterwards.
  - Penalties apply once (`mastery-contract`).
- **Research.** The flu's days and the injury kinds are sourced in `content/injury.ts` and `content/safetynet.ts`.
- **Balance.** A body injury at a movement showing drops it to unready. Calling in sick costs nothing but the days.

## 8. Genre Accounting

- **Built.** The counts are unchanged: 41 genres ask 52 techniques, 10 are held at medium or high confidence and ask none, and 98 are low confidence.
  - 41 + 10 + 98 = 149.
- **Evidence.** `docs/GENRE-COVERAGE.md`, held by `tests/genre-coverage.test.ts`, which plays every genre.
- **Research.** 98 are low confidence, each with its reason.
- **Balance.** Not applicable.

## 9. Casting And School Consequences

- **Built.** The faculty now read the term's coursework, judge a run played after the evaluation at the next one, and read the Cabaret's nights.
  - Nights are judged before they grow you.
  - The solo showing is judged.
  - The dead casting fields are gone.
- **Evidence.**
  - `tests/school-fixes.test.ts`, 7 tests.
  - `tests/casting.test.ts` and `tests/school.test.ts` pass with a student who does the work.
  - Mutations of the coursework floor and of judge-once were killed.
- **Research.** The floors are SLATE's reading of "appropriate standards".
- **Balance.** A student who never prepares is dismissed in their third term. Two attentive lives drew one concern in the second-year fall, at exactly half unready, and recovered.

## 10. Interests Removal

- **Built.** Nothing reads them.
  - `capabilities.json` and the comments were corrected.
  - A legacy save migrates, losing its interests.
- **Evidence.** The schema-92 save opened in the built app, through the "Before you continue" notice; its Profile has no Interests.
- **Research.** Not applicable.
- **Balance.** Not applicable.

## 11. History And Duplicate Protection

- **Built.**
  - Two self-tapes on one day are two records (fixed today).
  - Retries are refused by `actionId`.
  - Daily limits survive save and load.
  - The journey's lifetime totals survive past the 160 kept records.
  - A decision is acted on once (fixed today).
  - The history is bounded (`historyKept`, `WORK_KEPT`, `ACTIONS_KEPT`).
- **Evidence.** `tests/history-continuity.test.ts`, `tests/life-fixes.test.ts`, and the journey tests.
- **Research.** Not applicable.
- **Balance.** Not applicable.

## 12. Whole-World Journeys

- **Built.** The journey tests: life, money, school year, production and three students.
- **Evidence.** All pass in the gate.
- **Research.** Not applicable.
- **Balance.** Not applicable.

## 13. The UI

- **Built.** Both widths are photographed: 82 shots at 1440 and 58 at 390. See `docs/verification/UI.md`.
- **Evidence.**
  - No element runs past the right edge and no page errors, at either width.
  - Back and Forward work.
  - The keyboard reaches buttons.
  - The drawer opens at 390.
  - The fixes this pass found are in `a4e8b645`.
- **Research.** Not applicable.
- **Balance.** Not applicable.

## 14. Gates

- **Built.** `npm run gate` and `npm run build` both pass.
- **Evidence.**
  - Gate exit 0, read from a file.
  - Mutations are named in the repairs' commits: 9 killed, none surviving.
- **Research.** Not applicable.
- **Balance.** Not applicable.

## 15. Report

- **Built.** The handoff, this page, REPORT.md and GAMEPLAY-COVERAGE.md.
- **Evidence.** All are in the repo.
- **Research.** Not applicable.
- **Balance.** Not applicable.

## 16. Feature Audit

- **Built.** 292 items were traced: 247 verified, 19 partial, 18 unresolved, 8 informational.
- **Evidence.** `docs/GAMEPLAY-COVERAGE.md`, from `docs/verification/audit/*.json`.
- **Research.** Varies by item.
- **Balance.** The unresolved items are the Papers reachable only through removed systems, and the `receipts` knob.

## Reproducing

    npm run gate *> "$env:TEMP\gate.txt"; "exit=$LASTEXITCODE" | Out-File "$env:TEMP\gate-exit.txt"
    node tools/verify.mjs lives --max 3        # and mastery, fitness, condition; resumes by tree
    node tools/verify.mjs --status lives
    node tools/verify-report.mjs               # docs/verification/REPORT.md
    node tools/coverage.mjs                    # docs/GAMEPLAY-COVERAGE.md
    npx vite-node tools/genre-coverage.ts      # docs/GENRE-COVERAGE.md
