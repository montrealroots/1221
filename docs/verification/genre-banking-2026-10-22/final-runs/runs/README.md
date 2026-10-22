# Brief 21's Final Runs, 2026-10-22

Brief 20's final runs again, and brief 19's judge lanes, on brief 21's tested commit, `fd32e869`, with brief 21's walk of
the built app beside them. Every lane ran in a clone of that commit, its tree clean (each `exits-<lane>.txt` starts "at
fd32e869, 0 tracked files uncommitted"), through `runs21.sh`, four lanes at a time by `queue21.sh` from 09:43 to 11:54
UTC, and was gathered here by `collect21.sh`. Each step's command, exit and seconds are in `exits-<lane>.txt`.

## Why They Were Made

Brief 21 changed `src/engine` and `src/ui`, and three files the judge watches (`content/tasks.ts`, `systems/briefs.ts`,
`content/plays.ts`). So every completion-matrix row measured on the engine's, the app's or the judge's source read as
measured before what it reads last changed. The judge's last measurement was brief 19's, so its lanes (M1 to M4, MF) ran
too (`../final/README.md`). Brief 21 changed play on purpose: genres are read and weighed on every path, the Seagull
teaches its kinds, and a yield, a US card's late days and due day and a standing order follow their rules. A figure that
moved is said where it starts.

## The Lanes

| Lane | What | Steps | Exit 0 | Seconds |
|---|---|---|---|---|
| JR1, JR2, JR3 | Brief 13's 25 journeys, four parts each | 32, 32, 36 | all | 2,612, 2,428, 1,946 |
| BJ1, BJ2, BJ3 | Brief 20's eight lives and seven older saves | 20, 23, 15 | all | 1,422, 1,594, 1,425 |
| B, C | The long runs: 24 lives, the variety run, freshness | 13, 13 | all | 2,544, 3,508 |
| D | The workloads and the six mastery plans | 14 | all | 1,893 |
| A | The build, the scenario saves, the acceptance walk at 1440 and 390 | 5 | all | 1,874 |
| ADVF, ADVR | The advice's fresh set and its regression set | 13, 18 | all | 1,143, 1,505 |
| UI | Brief 13's three playthroughs and brief 14's three journeys at 1440 and 390 | 19 | all | 1,471 |
| APP | Brief 19's career walk, the seven older saves, and brief 21's walk (three saves), at 1440 and 390 | 10 | all | 851 |
| J | The acting area's measurements | 4 | all | 506 |
| JRC | The journeys' compare and summary; brief 20's journeys' table; brief 19's lives played again and set beside their transcripts | 5 | 4 | 269 |
| M1 to M4, MF | The judge (`../final/exits.txt`) | 23 parts | all | |

JRC's fifth step, `b19-lives-diff`, exits 1 because brief 19's four lives don't play line for line as their transcripts
were written, as on brief 20's commit: that step records whether they do (below).

## The Figures

`figures.py` reads them into `figures.json`. Set beside brief 20's (`../../../audit-2026-10-21/final-runs/runs/figures.json`):
- **INT-navigation, INT-skipped, F2-A:** the same: the acceptance walk 77 passed, 0 failed, 0 skipped, 0 errors and 0
  overflows at each width; 40 of 40 advice cases.
- **INT-long-runs:** the same but one figure: 24 lives, 20 graduated and 4 dismissed (the Reykjavík autopilot),
  breaches 0, unbalanced 0, errors 0; the six mastery plans at 100; the variety run; freshness 8 runs, none repeated;
  the scenario saves 15 of 15. The workloads are 6 of 8 in good standing where they were 7: New York's attentive life
  ends its third term on 10 December 2027 with a notice of academic concern, its work in the Carlotta's new play and
  Blood Wedding at the work floor.
  - **Why:** a School night now reads its play's genres, and a student who knows tragedy and romantic drama at about
    66 (from the calls) and not the 90 that completes it plays Blood Wedding's eight nights 1% lower (396.1 points
    against 400.0, the life played again on both commits).
  - **The threshold holds:** the row's threshold (breaches, unbalanced and errors 0) is met. The life was at the floor's
    edge, and it's a consequence of brief 21's G5, not a fault.
- **MA5:** every payoff 100; two plans mastered a day sooner (nordic noir and social realism, seed m-1: 23 November 2029,
  not the 24th), the calls' and tapes' practice now by weight.
- **INT-gate:** run after the fold, on the commit that holds it (`gate.txt`).

`../advice/close.py` holds the advice's four rows on these runs (`../final-result.json`): F2-A10 (f) and (h) on the fresh
set, 120 of 120 throughout; (c) at or above the others' median on 120 of 120, the advised input's mean 1.96 times a
random input's; the held-out set run whole in 16 batches.

## The Journeys And The Interface

`../verify.py` holds brief 13's clauses (`../verification-result.json`): the 25 journeys played to the end, all ten checks
passed in each, each ending as brief 20's final run ended; the three playthroughs 14 of 14, 9 of 9 and 11 of 11 at each
width (`../interface-final/summary.json`). 36 rows held on `fd32e869`. Brief 14's three journeys (`../journeys14-final/`):
banking 10 of 10, the document 8 of 8, health 10 of 10 at each width, no language check failed.

## Brief 20's Journeys Again

`../b20-journeys/` is brief 20's journeys played again on `fd32e869`: the same fixed seeds, players and runner.
- **The same to the byte:** saved and opened at the transitions, 163 of 163; the straight-against-reopened forks, 52 of
  52.
- **Played through:** every life and older save to its end, every check passed, every coherence check passed but one.
- **The one that failed, b20-4's "papers and work":**
  - **What happened:** its OPT ended on 6 September 2029, more than 90 days without work counted, in the middle of a
    booked run as Hester Vane in The Winter Ledger (50 days, 4 September to 5 November). The run went on being worked:
    48 of its days, 6 September to 5 November, without permission to work. Brief 20's run of this life worked 3 days,
    as Ivy in Paper Moons, all with permission.
  - **Where the gap is:** the OPT week's count (`systems/permission.ts`) ends permission whatever is booked ahead, and
    the work day (`systems/projobs.ts`) doesn't read permission after the booking. Brief 21 changed neither file. On
    brief 20's commit this life's auditions fell otherwise and met no such run.
  - **What it waits on:** OPT's rules are outside this brief at the owner's word. What a booked run should do when
    permission ends, and whether days between gigs count (brief 20's F3), are the owner's. Recorded in the receipt, not
    fixed.
- **The career's draws moved** in six lives, as the auditions and callbacks now read the project's genres:
  - b20-1: 5 successes and 8 failures became 3 and 10;
  - b20-2: 3 and 8 became 4 and 6;
  - b20-4: 4 and 6 became 5 and 5;
  - b20-8: 4 successes became 3;
  - J01's degree: 3 and 4 became 2 and 5;
  - J01's last term: 8 and 4 became 3 and 7, and its rounds went in strongly prepared 5 times, not 9. Its actor knows
    the School's plays' genres and auditions for films in others.
- **Unchanged:** represented 0 in the eight lives, as before. Fatigue as a first limit is as brief 20's run had it: 0
  but in two older saves, 5 each in both runs.

## Brief 19's Lives Again

`play.ts lives` on `fd32e869`, set beside brief 19's transcripts (`../b20-journeys/b19-lives-diff.log`, 854 lines), with
brief 20's own changes running through it as on its commit (645 lines then). Set beside brief 20's run of the same lives
(`../../../audit-2026-10-21/final-runs/b20-journeys/b19-lives/`), brief 21 changes one life:
- **Life A, 12 February 2030:** where brief 20's run had Pennick Casting not call it back for Nell in A House On Calder
  Street, it now calls it back. On the 21st it offers the part; the life accepts, prepares it and rehearses from
  12 March, and from there plays otherwise to its end (229 lines).
- **Why:** Calder Street is a domestic drama, the life knows drama from the School, and an in-person audition and
  callback now read the project's genres.
- **The other three lives:** line for line as on brief 20's commit.
