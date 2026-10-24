# Brief 26: The Complete Game Connectivity, Logic And Functionality Sweep

The owner's brief 26 (`../briefs-2026-10-16/26-complete-game-connectivity-logic-and-functionality-sweep.txt`, kept as
sent, 2026-10-24), given with "We’re going to work on everything here plus starting with fix of whatever and all thats
stale": the account of #62's changes given in the same session, and the records it found behind the code, then the
sweep itself. One agent throughout, as asked. This is the receipt; it grows with the milestones and ends with what brief
26's §13 asks for. `CHECKPOINT.md` is the trail, `REGISTER.md` the inventory with each feature's status.

## The Starting Point

- **`main` at `b46ee301`** (#63), the handoff's account of #62's merge; `src` as #62's head `8d4139de` left it.
- **Worked on `claude/connectivity-sweep`,** from that commit, pushed and never force-pushed.
- **Not built on:** `claude/peaceful-hamilton-59zdbb`, where the other account holds brief 25 (the career expansion),
  eight commits past `main` and unmerged. Brief 26 says not to begin that expansion.
- **The schema stays 94** (`SAVE_SCHEMA_VERSION`, `SUPPORTED_SCHEMA_VERSION`), with no migration.

## The Baseline

`npm run gate` in a clean clone of `b46ee301` (`baseline/gate.txt`, its header the commit, the clean tree and the time;
`baseline/gate-exit.txt`), before any change: **exit 0**. 488 of 488 test files, 5,616 of 5,616 tests, none skipped, in
1,302 seconds, and all 22 checks; the completion matrix read 634 of 658 (96.3%). No failure stood before this work began,
so any failure after it is this work's. The merge message of #62 had claimed a run on its head `8d4139de` with no receipt
in the tree; `src`, `tests`, `tools` and `package.json` are the same at `b46ee301`, so this receipt stands for that claim too.

## What Was Stale After #62, And Fixed (M1)

Each correction says in the past tense what stood and until when; none rewrites what a record measured.

| Record | What it said | What stands |
|---|---|---|
| `../audit-2026-10-21/effects/guide.json`: `ui.calendar`, `ui.open-calendar`, `ui.needs` | the Calendar and Updates "on the menu"; What Needs You listing "every unread notice"; Open Calendar waiting for "Your Own Plans" | both open from Home alone since brief 24, with Back To Home; the notices are Recent Updates' and Updates'; Open Calendar opens with "What's Coming" |
| the same, `world.mark_read`'s consumers | "the rail's count and the You line's N Unread" | Recent Updates' subtitle and count, and Updates' Unread (N) and All (N); the rail counts questions alone since brief 23 |
| `src/engine/content/attributes-matrix.ts`, `docs/ATTRIBUTES-MATRIX.md` | Calendar and Updates reached by "the rail"; "Profile Sections: 7 of 7" | Home's Up Next and Recent Updates alone; eight sections in the page's order, Your Work So Far among them |
| `../ui-2026-10-23/coverage.md`, `CHECKPOINT.md`, `inventory.md`, `README.md` | the menu's "eight places"; a before walk of 2,112 steps; the matrix at 588 with no sequel; the final runs "weren't made here" | six places since brief 24; 2,040 steps, the figure both summaries hold; 634 again since brief 24's replay; the runs made on brief 24's commits |
| `../integration-2026-10-16/COMPLETION-MATRIX.md`, Home's six rows | the review's claim of 2026-10-13 as each row's goal: Your Affairs' Money, School and Papers lines, Where You Are and Weather panels, notices under the questions, a Calendar section | a `claim` as the code stands, set through the pipeline's inputs (`../pipeline/fix-citations-1024.cjs`, applied by `merge-review.cjs`, shown by `tools/completion-matrix.mjs` before the review's) |
| `src/styles/app.css` | `.link.strong { min-height: 32px }` on touch and `.rail-badge-quiet` | gone: no element carried either (the first never matched; the second's badge went with brief 24) |
| `../career-genre-2026-10-22/final-runs/interface-final/` | 21 `fail-*.jpg` from brief 23's stopped browser lanes | gone, said in `runs/README.md` |
| `../briefs-2026-10-16/README.md` | no row for briefs 23 and 24; brief 22 "in progress" | rows for 23, 24 and 26; 22 merged in #54, #56, #58 and #60 |
| `SLATE_CURRENT_MASTER_HANDOFF.md` | (#63 had already corrected "not merged") | a top section for brief 26 |

Held by: `node tools/effects.mjs --check`, `tests/attributes-matrix.test.ts`, `tests/audit-pipeline.test.ts` (the
pipeline run in a copy makes the committed audit byte for byte), `node tools/coverage.mjs --check`,
`node tools/completion-matrix.mjs --check`, `node tools/text-inventory.mjs --check` (the attributes matrix's text read
again), `tests/b23-pages.test.ts` (the stylesheet's scroll boxes), typecheck and lint.

## The Register (M2)

`tools/sweep.mjs` finds every feature in the code: the feature-to-effect matrix's 541 rows and 406 promises (held to the
code by `tools/effects.mjs --check`), and what that matrix has no row for, which brief 26's §2 names: 17 techniques, 149
genres, the Player Profile's 8 sections, the 8 places Home and the menu open, 12 persistence behaviours (a new life, a
save opened, brought forward, validated, the stores, the deployment's guard, the schema pin, Your Saves, the start) and 4
world mechanics (holidays, stops, the running clock, time zones): 1,145 in all. Each has an entry in `register/<area>.json`
with the sweep's status (Verified, Fixed And Verified, Failed, Blocked, Deferred, Not Tested), how it was verified
(inspection, automated, interactive), the commit, the evidence and what was found; `REGISTER.md` is written from them. The
gate's twenty-third check (`--check`) fails a feature with no entry, an entry for a feature that's gone, a status without
what it needs, and a page behind the entries. Every feature began Not Tested; nothing is counted done for having a row.

## The Traces (M3 to M11)

(Written as each milestone closes.)

## Final Runs, Gate And Report (M12)

(Written at the close.)
