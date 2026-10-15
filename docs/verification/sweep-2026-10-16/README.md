# The Sweep, 2026-10-16

The owner's request after pull request #32 (`../briefs-2026-10-16/06-sweep.txt`): sweep the whole code and game against
the house standard, then push and merge every note so a new session can pick the work up. Done on
`claude/zen-mccarthy-i88ujw` from `main` at `0d66ce60`, merged in #33 (`297452ed`). Until the session handoff of the same
day, the sweep's account was the handoff's top section and the work plan's section 9; this file keeps it where each
brief's account is kept.

## How It Was Swept

Three audits, each read-only, each finding read against the code before anything changed, and each figure below measured
again rather than taken from an audit:
- **The docs:** the handoff, the work plan, the accounts and the top-level docs, for claims the tree contradicted.
- **The comments:** every claim in `src/`, `tools/` and `tests/` that the week's changes could have falsified.
- **The bugs:** the week's code, `5b27379a..0d66ce60` in `src/` and `tools/`.

Older code was held by the gate and the reviews before it, not read again line by line. The baseline gate on `0d66ce60`
exited 0 (348 files, 4,184 tests), read from a file.

## What Was Found And Fixed

| Finding | Measured | Fix | Held By |
|---|---|---|---|
| A step of rehearsal stopped rehearsing a way of playing in at 90% once its own part was full, where suitability (from evaluation-5) puts the mark at 80% to 100% | A mastered actor prepared twenty days taped 99.3 on brief-rockumentary-2 played Set (mark 97%), the choice stuck at 93.5%. Of the sides that fit, 16 of 1,769 on briefs and 49 of 511 on class scenes and plays ask more than 93.5%. | `prepareRefusal` (briefs) and the coursework step read the scene's own mark (`requiredFor`, `choiceMark`) | `tests/briefs.test.ts`, "found by the sweep" (3) |
| The term's warning counted the pieces shown; the review also counts a piece missed unexcused as due and Unready | Six shown with two Unready, then two missed: 2 of 6 to the warning, 4 of 8 to the review | Both read `termTally`; the warning is looked at after every piece due, missed or shown again, after its own notice | `tests/workload.test.ts`, "found by the sweep" |
| The part most often short was grouped by its key across templates, in the first piece's words | On a played term, 19 pieces put under a part's name and remedy that 4 of them had | `mostShort` groups by name and remedy | the same |
| A scene's table work was answered by "its own step" | Every scene template with table work | `remedyWords` names the Table Work's questions | the same |
| "N more are still to come" counted the pieces already set, one a course; "a notice of concern follows" was true only from good standing | Read in `setWork` and the review's steps | "Of the work set so far, N … still to be shown"; "your standing falls a step" | the same |
| Shown Today and Due Soonest banded a smaller piece by its score, where the showing caps it at Working | `bandFor` | The forecast uses `bandFor` | the same |
| Each circumstance's reason, written for all 86 class scenes and plays, was shown on no screen | Nothing read `why.concealment` and the others | What It Asks lists each circumstance with its level and reason | `tests/stage-interpretation.test.ts` |
| `tools/workload.ts` read a piece's parts at the run's end, the reader's evenings left out | London lives-0, third term: the partner part 14 short at the run's end and 10 at the showing; rehearsal 17 and 18 | Read at the showing, as `shortParts` does | `../workload-2026-10-16/at-showing-london-lives-0-attentive.json` |

Each fix's test was mutation-checked by putting the old rule back: the 90% at either site, the tally without the misses,
grouping by key, and the remedy without the table each failed their test. No evaluation formula moved, so `RULESET`
stayed evaluation-8 and the save schema 94.

Notes made true: ten comments and screen notes the stage change had falsified and one citing a test that didn't exist;
the guide's "complete at 90%" in coursework, briefs and productions; each account's merge; the gate's seventeen checks
and the IndexedDB saves in AGENTS.md and README.md; ENGINE-MODEL.md's ruleset cutoff; the genre coverage page's register.

## What The Built App Showed

Captured in the session at 1440 and 390 on the build of `f06331be` (whose code is `main`'s at `297452ed`), by the script
that became `tools/captures.mjs`, from the saves of `tools/scenario-saves.mjs` and the generator that became
`tools/rehearsal-mark-saves.ts`. The images were sent in the session and aren't kept here (the repository keeps no
images); the tools take them again, and were run from the repository at 1440 against both builds, with the same
results. The same `rock-mid.json` save, opened in a build of `0d66ce60` and in the
sweep's:
- **Before:** Rehearse It On Your Feet grayed, "Not now: There's nothing more to gain from it now."; "Your choice now is
  rehearsed in to 93% (complete at 97%)"; the take "about 99.3 … rehearsed in wasn't complete, which cost the consistency
  2.3 points".
- **After:** the same save, Rehearse It On Your Feet open.
- **After, twenty days on (`rock.json`):** "rehearsed in to 98% (complete at 97%)", the step grayed only then, the take
  "about 100.0".

The workload save's Home read: "3 of the 6 pieces shown this term so far were Unready. Most often short on them: with your
partner, on 2 of the 3 shown. Rehearse With Your Partner, asked for an evening at least 2 hours ahead, or Run It With A
Reader answers it. Of the work set so far, 10 pieces are still to be shown. The faculty reviews the term on December 10,
2027: half the term's pieces Unready or not shown by then is short of what the program asks, and your standing falls a
step." King Lear 4.7's What It Asks read "A Private Exchange: Built On It. Quiet: an old man woken to music and his
daughter's kiss."

## Verified

| Check | Revision | Command | Result |
|---|---|---|---|
| Baseline gate | `0d66ce60` | `npm run gate`, exit read from a file | exit 0; 348 files, 4,184 tests |
| Build | `f06331be` | `npm run build` | exit 0 |
| Scenario saves | `f06331be` | `node tools/scenario-saves.mjs DIR` | 14 of 14 exit 0; each 0 breaches, 0 unbalanced |
| Built app, 1440, first run | `f06331be` build | `node tools/acceptance-ui.mjs OUT 1440 DIR` | 66 passed, 4 failed, 2 skipped: the tool's warning pattern was the old words; fixed in `027f3631` |
| Built app, 390 | the same | the fixed tool | 70 passed, 0 failed, 2 skipped, 0 errors, 0 overflows |
| Built app, 1440, again | the same | the fixed tool | 70 passed, 0 failed, 2 skipped, 0 errors, 0 overflows |
| Gate | `027f3631` | `npm run gate`, from a file | exit 0; 348 files, 4,192 tests; the tree unchanged |
| Gate | `ebe8e5b3` (the figures written) | the same | exit 0; 348 files, 4,192 tests; the tree unchanged |

The two skipped steps have been skipped since 2026-10-12, each because the save doesn't reach what it needs: Work It
Through's way tried and kept or put back ("no way at The First Half Isn't Secure, … can be tried now"), and the rehearsal
controls where a part has calls ("no part with calls yet"). All of it
ran in a cloud container (Linux), not the owner's PowerShell machine.

## Left Open

- **No played term misses a piece.** The warning's new call sites (after a miss, a revision missed, a showing again) are
  held by the counting's test, which calls the warning directly. The next brief names it.
- **The workload tool's demand** still counts each step's part, a revision's among them (its header says so).
