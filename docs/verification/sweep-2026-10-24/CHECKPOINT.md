# Checkpoint: The Connectivity Sweep, Brief 26

The one place the sweep's progress is kept (brief 26, §12: "Maintain one current inventory and checkpoint"). Updated at
each milestone's end, with the branch, the commit, what's covered, what remains and the exact next step. The register
(`REGISTER.md`, `register/*.json`, `node tools/sweep.mjs`) is the inventory; this is the trail.

## Where It Stands

- **Branch:** `claude/connectivity-sweep`, from `main` at `b46ee301` (#63, the handoff's account of #62's merge).
- **Brief:** `../briefs-2026-10-16/26-complete-game-connectivity-logic-and-functionality-sweep.txt`, kept as sent.
- **Other work left alone:** `claude/peaceful-hamilton-59zdbb` holds brief 25 (the career expansion, the other account's,
  eight commits past `main` on 2026-10-24). Brief 26 says not to begin that expansion; nothing here builds on it.
- **One agent, no subagents,** as the brief and the owner's message asked.

## Milestones

- **M1, 2026-10-24: the actual state, the baseline, the stale records.** Done when the baseline gate's receipt is in
  `baseline/` and the commit is pushed. What was stale after #62, and fixed (each in the past tense where it stood):
  the feature-to-effect matrix's three rows that still had Calendar and Updates "on the menu" and What Needs You holding
  every unread notice (`ui.calendar`, `ui.open-calendar`, `ui.needs`, and `world.mark_read`'s consumer that read the
  rail's unread count); the attributes matrix's destinations table ("the rail" for both) and its Profile Sections table
  (seven where the page has eight; Your Work So Far was never on it); brief 23's `coverage.md` ("eight places" four
  times, and 2,112 before-walk steps where both summaries hold 2,040), `CHECKPOINT.md` and `inventory.md` (the same
  2,112), its `README.md` (588 with no sequel, and "the final runs weren't made here"); the completion matrix's
  descriptions of Home's six rows, which showed the review's claim of 2026-10-13 (Your Affairs' lines, two panels, the
  notices under the questions), now a `claim` as the code stands through the pipeline's inputs
  (`../pipeline/fix-citations-1024.cjs`); two stylesheet rules nothing matched (`.link.strong` on touch, `.rail-badge-quiet`);
  21 `fail-*.jpg` brief 23's stopped browser lanes left under the final runs; and the briefs' README, which had no row for
  briefs 23 and 24 and said brief 22 was in progress.
- **M2:** the register, `tools/sweep.mjs`, 1,145 features from the code, every one Not Tested until it's traced, and the
  gate's twenty-third check holding it to the code.
- **M3, 2026-10-24: creation, the Profile, the abilities, the techniques, the genres, progression.** Read bootstrap.ts and
  populateWorld whole, the evaluation's guarantee, the one way anything grows, the practice cap, the enjoyment and
  personality knobs, the Profile's eight panels; ran the area's 37 test files (449 tests). Found and fixed: creation's
  Genres step marked six genres the career's projects carry as shown only, while a work day on one had lifted the mood
  since brief 20 (`genresRead` reads the projects' genres now; tests/b26-creation-genres.test.ts, which fails with the
  projects dropped; `22bfcd35`). Found and corrected: three effects rows recording that gap as open. Left to the owner,
  as since brief 20: `create.livesWhereBorn`, written and read by no player-made life (Blocked). 266 rows Verified or Fixed
  And Verified, 1 Blocked; the craft area's 145 guide promises waited for M4, whose coursework they describe.
- **M4, 2026-10-24: the School.** Read `systems/school.ts` whole and the leave, coursework, production, classmates, course
  record, workbook, play-reading, briefs, practice, engagement and showcase systems at their commands, refusals,
  scheduled kinds and notices, and the School's five looks; ran the School's 86 test files (1,304 tests, green on
  `bd7b9d02`). Traced the brief's repeated presses (each refused in its words, an elective shift another evening),
  cancellations (`setStanding`, `startLeave`, `callOff`, `leaveCabaret`, the showcase's `decide`) and reloads (each
  payment, decision and judging once across a save). Found no defect. 294 rows Verified: the School's 145, the craft
  area's 145 promises, the career area's 4 Actor Showcase promises. 559 Verified in all.
- **M5, 2026-10-24: the career.** Read `systems/pro.ts`, `projobs.ts`, `propay.ts`, `proagent.ts` and
  `content/careerwork.ts` whole; ran the career's 32 test files (423 tests, green on `9018cc4e`). Traced the brief's
  repeated presses (each refused in its words; a headshot session alone repeats, and is charged), cancellations (an offer's
  lapse, work called off with its paydays, a request's due date, an agreement's lapse and term) and reloads (payments
  keyed and paid once, days logged once, draws keyed to what they decide). Found no defect; noted an engagement status
  nothing sets and the career's content bound (the receipt's M5). 89 rows Verified. 644 Verified in all.
- **M6, 2026-10-24: money and banking.** Read the banking, credit, lending, payments, cash, finance, bank moves, card
  life, card offers, security, account life, abroad, spending, round-ups, obligations and statements systems at their
  handlers, refusals, scheduled kinds and notices, and the six money looks; ran the money area's 69 test files (843
  tests, green on `bf0ef776`). Found and fixed: a card closed holding a credit balance kept the credit in the closed
  account for good, and net worth counted a credit as nothing (`closeCard` and `netWorth`;
  tests/b26-card-credit-on-close.test.ts fails on the old code, 2 of 3). 161 rows: 156 Verified, 5 Fixed And Verified.
  800 Verified in all.
- **M7, 2026-10-24: papers and benefits.** Read the documents, identity, tax-id, permission, residence, citizenship,
  visits, appointments, health, therapy, assistance, unemployment, universal credit, home benefits, pension, federal
  and state tax systems at their handlers, refusals, scheduled kinds and notices, the four papers looks and the guide's
  thirteen entries; ran the two areas' 70 test files (507 tests, green on `388d9a1e`) and a repeat, reload and call-off
  probe on a New Haven life (`tests/b26-papers-repeats.test.ts`). Found no defect; noted EI's posting category and
  `idCardRefusal`'s order (the README's M7). 180 rows: 160 Verified, 20 kept Deferred as the owner's scope reset of
  2026-10-09 left them (the pensions, EI, Jobseeker's, Universal Credit, residence and naturalizing, England's
  prepayment certificate). 960 Verified in all.
- **M8, 2026-10-24: life, the body, the day and the world.** Read the life system whole, the plans, the clock, the
  calendar and the world, the body, injury, birthdays, mortality, weather and seasons systems, the clock's arming and
  failure notice, the running clock, the holidays and the zones, the thirteen life looks and the guide's nine entries;
  ran the life area's 55 test files (732 tests, green on `27369727`) and a repeat, reload and call-off probe on a New
  Haven life (`tests/b26-life-repeats.test.ts`). Found no defect; noted the birthday notice's missing player check,
  which nothing needs (the README's M8). 84 rows Verified. 1044 Verified in all; 75 Not Tested remain, the guide's 63
  and persistence's 12.
- **M9, 2026-10-24: notices, decisions, scheduled events, continuity and freshness.** Read the world's tick and
  commands, `requireDecision` and `notify`, the game provider, the time controls, Home's What Needs You and Up Next,
  Updates, the calendar's forms, the decision and notice looks, and every scheduled handler's opening guard with the
  nine arm functions as one list; ran the shell's 55 test files (green on `86890e43`) and a What Needs You probe
  (`tests/b26-needs-repeats.test.ts`). Found no defect; noted that Dismiss takes a question already answered, which
  nothing offers (the README's M9). 14 rows Verified. 1058 Verified in all; 61 Not Tested remain, the guide's 49 and
  persistence's 12.
- **M10, 2026-10-24: the guide, the tutorial, the help, navigation and the journeys.** Read the twenty chapters and
  their `opens` lists, the gate (`isOpen`, `lockedBecause`, `tutorial.read`, the bus's check while guided), Gated,
  LockedPanel, the strip and the dialog, the reference and How This Works, the shell's rail, drawer and foot, the
  router, the menu, Home's panels, the time controls' gates and the start entries; ran the area's 32 test files (413
  tests, green on `691556f0`); walked the built app (`walk/README.md`): a new life through creation and five chapters
  at 1440×900 and 844×390, every check true; every screen of two played lives at three sizes, 132 entries with no
  problem; the cohesion walk's eleven screens, nothing broken. Found no defect in the game; corrected
  `tools/cohesion-walk.mjs`, stale since 2026-09-24 against the birthplace picker and the guide's locks. 49 rows
  Verified, 25 by the walks as well. 1107 Verified in all; 12 Not Tested remain, persistence's.
- **M11, 2026-10-24: persistence, save compatibility and the longer playthroughs.** Read `createSave`, `loadSave` and
  its once-on-opening list, `migrate`, `openSlot`, `validateUniverse`, the adapter, the local and Base44 stores and the
  three server functions, the guard, the schema pin in its two places, Your Saves, the start and the autosave; ran the
  area's 19 test files (172 tests, green on `3e359d4b`), which open the seven fixtures and play each on a day; probed
  the repeats (`tests/b26-persistence-repeats.test.ts`: a step once, a refusal twice, a failed write, a delete and a
  restore twice, thirty days reopened every five the same to the byte; three mutations caught). Found and fixed: the
  guard reported a save's size in the string's length where it measured the limit in UTF-8 bytes
  (`base44/shared/guard.js`; `tests/server-guards.test.ts` fails on the old code). 12 rows: 11 Verified, 1 Fixed And
  Verified. 1118 Verified, 7 Fixed And Verified in all; nothing Not Tested.
- **M12:** brief 22's final runs again on the finished commit, the gate, the receipt.

## The Completion Matrix While The Sweep Runs

Touching `src` at all moves the 46 rows brief 22's final runs measured on the engine's or the app's whole source to
Implemented, Verification Incomplete, as it did through briefs 23 and 24: the matrix reads 588 of 658 from M1's first
source change until the runs are played again on the finished commit (M12). That is the rule working, not a loss.

## Next Step

Begin M12: brief 22's final runs again on the finished commit (prefix `f26`, the scripts under
`../career-genre-2026-10-22/final-runs/runs/`), so the completion matrix's 46 rows measured on the whole source are
measured on it; then `npm run gate` in a clean clone of that commit, its exit read from a file; then the receipt with
everything brief 26's §13 asks (the SHAs, the totals, the defects, the chains, the decorative features left, the test
commands and results, the playthroughs, save compatibility, the UI evidence, the blockers, the handoff), the handoff
brought up to it, and the push. Nothing merges to `main` and nothing deploys without the owner.
