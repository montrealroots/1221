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
  as since brief 20: `create.livesWhereBorn`, written and read by no player-made life (Blocked). 267 rows Verified or Fixed
  And Verified, 1 Blocked; the craft area's 145 guide promises wait for M4, whose coursework they describe.
- **M4 to M11:** the traces, area by area (the handoff's top section lists them with what each found).
- **M12:** brief 22's final runs again on the finished commit, the gate, the receipt.

## The Completion Matrix While The Sweep Runs

Touching `src` at all moves the 46 rows brief 22's final runs measured on the engine's or the app's whole source to
Implemented, Verification Incomplete, as it did through briefs 23 and 24: the matrix reads 588 of 658 from M1's first
source change until the runs are played again on the finished commit (M12). That is the rule working, not a loss.

## Next Step

Begin M4, the School: its 102 effects rows and the craft area's 145 promises (`node tools/sweep.mjs --todo school`,
`--todo craft`), reading `systems/school.ts`, `coursework.ts`, `production.ts`, `leave.ts` and the commands' UI.
