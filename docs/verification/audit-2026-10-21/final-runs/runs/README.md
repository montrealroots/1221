# Brief 20's Final Runs, 2026-10-22

Brief 19's final runs again, on brief 20's tested commit, `cbec90d8`, with brief 20's own journeys and the built app
beside them. Every lane ran in a clone of that commit, its tree clean (each `exits-<lane>.txt` starts "at cbec90d8, 0
tracked files uncommitted"), through `runs20.sh`, four lanes at a time by `queue20.sh` from 02:17 to 04:05 UTC, and was
gathered here by `collect20.sh`. Each step's command, exit and seconds are in `exits-<lane>.txt`.

## Why They Were Made

Brief 20's D2 changed `src/engine` (`c4832549`), and every later area with it, so the 46 completion-matrix rows that brief
19's final runs measured on the engine's or the app's whole source read as measured before what they read last changed.
Brief 20 changed play on purpose (a card's limit, the career's request to meet and its parts posted again, a short
night's cost, a work day's energy), so each figure is set beside brief 19's and a figure that moved would have to be said
where it starts. Brief 20's starting point, `340ce7ae`, has the source brief 19 measured: no file under `src/engine`
changed after `63fe7391`, none under `src` after `ef2ab8b9`. So brief 19's runs are the same runs with brief 20's changes
taken out, and no run of that is made again here.

## The Lanes

| Lane | What | Steps | Exit 0 | Seconds |
|---|---|---|---|---|
| JR1, JR2, JR3 | Brief 13's 25 journeys, four parts each | 32, 32, 36 | all | 2,230, 2,056, 1,667 |
| BJ1, BJ2, BJ3 | Brief 20's eight lives and seven older saves (`../../journeys/REPORT.md`) | 20, 23, 15 | all | 1,186, 1,394, 1,281 |
| B, C | The long runs: 24 lives, the variety run, freshness | 13, 13 | all | 2,231, 3,029 |
| D | The workloads and the six mastery plans | 14 | all | 1,683 |
| A | The build, the scenario saves, the acceptance walk at 1440 and 390 | 5 | all | 1,810 |
| ADVF, ADVR | The advice's fresh set and its regression set | 13, 18 | all | 1,001, 1,352 |
| UI | Brief 13's three playthroughs and brief 14's three journeys at 1440 and 390 | 19 | all | 1,482 |
| APP | Brief 19's career walk on a played life's saves, and the seven older saves, at 1440 and 390 | 7 | all | 719 |
| JRC | The journeys' compare and summary; brief 20's journeys' table; brief 19's lives played again and set beside their transcripts | 5 | 4 | 225 |

JRC's fifth step, `b19-lives-diff`, exits 1 because brief 19's four lives no longer play line for line as their
transcripts were written (below). That's what the step is for: it records whether they do.

## The Figures

`figures.py` reads them into `figures.json`. Each is the same as brief 19's (`../../../career-2026-10-20/final-runs/runs/figures.json`) but the gate's own:

- **INT-navigation, INT-skipped:** the built app's acceptance walk, 77 passed, 0 failed, 0 skipped, 0 errors and 0
  overflows at 1440 and at 390.
- **INT-long-runs:** 24 lives, 20 graduated and 4 dismissed (the Reykjavík autopilot), breaches 0, unbalanced 0, errors 0;
  workload 7 of 8 in good standing (the neglecting London life dismissed), breaches 0; the six mastery plans at 100 on
  every payoff tape; the variety run graduated, 8 distinct top recommendations over 157 weeks; freshness 8 runs, none with
  a take or scene repeated outside the mastered profile; the scenario saves 15 of 15.
- **MA5:** each plan mastered on the day it was, its payoff 100, 100, 100.
- **F2-A:** 40 of 40 advice cases.
- **INT-gate:** `npm run gate` on `cbec90d8` in a clean clone (`gate.txt`, its exit read from the file): 479 of 479 test
  files, 5,481 of 5,481 tests, none skipped, all 22 checks, exit 0.

`../advice/close.py` holds the advice's four rows on these runs (`../final-result.json`): F2-A10 (f) and (h) on the fresh
set, 120 of 120 throughout; (c) at or above the others' median on 120 of 120, the advised input's mean 1.96 times a random
input's; and the held-out set run whole in 16 batches.

## The Journeys And The Interface

`../verify.py` holds brief 13's clauses (`../verification-result.json`): the 25 journeys played to the end, all ten checks
passed in each, each ending as brief 19's final run ended; the three playthroughs 14 of 14, 9 of 9 and 11 of 11 at each
width (`../interface-final/summary.json`). 36 rows held on `cbec90d8`. Brief 14's three journeys, run in the same lane
(`../journeys14-final/`): banking 10 of 10, the document 8 of 8, health 10 of 10 at each width, no language check failed.

## Brief 20's Journeys Again

`../b20-journeys/` is `../../journeys/` played again on `cbec90d8`, the same fixed seeds, the same players, the same
runner. Every life and older save played to the end, every check passed, every coherence check passed. Saved and opened
at the transitions, 165 of 165 the same to the byte; the straight-against-reopened forks, 53 of 53 the same. Against the
first run, on `12c04ee1` before any repair:
- **Fatigue as a first limit on the work** (the table's `routes.fatigue`): 2, 3, 1, 5, 3 and 3 in the lives that met it
  then (b20-1, b20-2, b20-4, b20-6, b20-7, b20-8), and the older J01 degree's 3; 0 in every life now. Their shoots run two
  or three days, and the short night counted twice was what tired them (D3, `../../areas/life/REPORT.md`).
- **The credit limit:** where the savings carry a raise, it comes as before (b20-1 $19,474, its bank $73,594); where they
  don't, it stops: b20-6 at $162,280 against $194,736, its income $2,107 a year once its savings went to the state, and
  the older `old-leave` the same. `old-tax-plan`'s limit stood at $38,347 at the end of 2027, against $46,017 then.
- **The career's draws:** successes, failures, declines and delays moved in each life, as the auditions now meet a
  better-rested actor, a part posted again waits for the work it cast, and a request to meet lapses. Represented: none of
  the eight, as before.

## Brief 19's Lives Again

`play.ts lives` (brief 19's own script) on `cbec90d8`, set beside `../../../career-2026-10-20/playthroughs/transcripts/`
(`../b20-journeys/b19-lives-diff.log`, 645 lines changed). Life B and the V16 mid-term life play as before but for the
limit's words and, in life B, the times of three presses; everything that moved is brief 20's:
- **D2:** "Your Card Limit Went Up" now says "and your income or savings cover the payments on it." In life A and the V16
  graduate, the raise of October 2029 to $194,736 doesn't come.
- **Sam is Robin** in Last Bus To Eastview for the V16 graduate, the career area's renaming beside the classmate Samuel
  Patel.
- **The bedtime:** life A's presses after the School's follow-up come at 10:20, not 10:00, as she now sleeps the night
  before; the sides are prepared at other hours throughout.
- **A part posted again** says so ("It's a new casting of the part. The last time it was posted to you, …") and waits for
  the work it cast, so life A's submissions for Hester Vane and Nell fall in other weeks.
- **Life A's career after the School:** still represented by Thomas Ashgrove, still asks to move, joins SAG-AFTRA on The
  Calloway Files and is paid through Halberd Talent's client trust account less his commission, and ends the agreement
  on 1 May 2030. Her auditions draw more callbacks (Nell in August 2029, Hester Vane twice), and Jess in Static On Route 9,
  offered in March 2030 before, now goes to another actor, so its three shoot days and its pay don't come.
