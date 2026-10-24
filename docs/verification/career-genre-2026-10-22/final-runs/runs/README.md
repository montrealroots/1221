# Brief 22's Final Runs, 2026-10-22

Brief 21's final runs again, and its judge lanes, on brief 22's tested commit, `16b50e07`, with brief 22's walk of the
built app beside them. Every lane ran in a clean clone (each `exits-<lane>.txt` starts "at <commit>, 0 tracked files
uncommitted"), through `runs22.sh`, four lanes at a time by `queue22.sh` from 16:58 to 19:09 UTC, and was gathered here by
`collect22.sh`. Each step's command, exit and seconds are in `exits-<lane>.txt`.

Two sets of lanes were played again on later commits whose `src` is the tested commit's, each because a check in its
runner stated a rule brief 22 replaced, not because the game did anything wrong:
- **Brief 20's journeys (BJ1 to BJ3), on `afe751f1`:** its coherence check read a play's tags alone and called b20-2's farce,
  practised as Bottom (whose part asks farce), practised with no play of its own. It reads each part's stated genres now.
- **Brief 13's journeys (JR1 to JR3, and JRC after them), on `0ae97df3`:** its check 3 expected the first genre not met to
  read nothing, and J18's absurdist, a direct kind of the comedy it had worked in, read 1.06 under the transfer the owner
  approved. It takes the first genre neither met nor directly linked to one met now, which must read nothing.

## Played Again On Brief 24's Commits, 2026-10-23

Briefs 23 and 24 changed `src` (the interface, and the guide's and tutorial's words), and the 46 rows these runs measure
on the engine's or the app's whole source read as measured before what they read last changed. The owner asked for the
final runs again ("So we can get it back to 634"). Brief 23's own replay (prefix `f23`, on `97404e70`) had every engine
lane the same in every number and was stopped in its browser lanes for brief 24; these replace it. Every lane but the
judge's, whose watched files neither brief touched, prefix `f24`, each in a clean clone:
- **The engine's lanes, on `cb8b19eb`**, whose `src/engine` is the tested commit's (`git diff cb8b19eb 05060742 --
  src/engine` is empty), four at a time from 16:04 to 18:13 UTC: JR1 to JR3, BJ1 to BJ3, B, C, D, J, ADVF, ADVR, then JRC.
  Every step exit 0 but JRC's `b19-lives-diff`, which exits 1 as on every commit since brief 19 (948 lines, as before).
- **The browser's lanes, A, UI and APP, on `05060742`**, from 18:52 to 19:22, every step exit 0. Four earlier starts
  were stopped and their clones set aside, so no lane's record holds a step it ran twice:
  - on `23b8a77a` at 17:35, A's scenario saves and UI's second save stopped at the system's limit on file watchers
    (`ENOSPC`), five lanes' vite-node processes watching their whole clones at once;
  - on `23b8a77a` again from 17:42, once fewer ran, UI's specialist playthrough at 390 read the date from the header's
    words, which brief 24 left without the date below 1024, and found a birth date in a card instead. Both tools read
    the bar's own date since (`8ad20c4d`);
  - on `8ad20c4d`, A's first-day check looked for "No questions are waiting on you.", the line brief 24 took from over
    All Clear; it reads All Clear since, and the line went from `needsLine`, where nothing showed it (`4bfb3f33`);
  - on `4bfb3f33`, brief 14's health journey at 390 found Home's cards in a squeezed second column under 600 wide,
    brief 24's defect, fixed in `05060742`.
  APP passed on `23b8a77a` and on `4bfb3f33` too; its record here is `05060742`'s.
- **Gathered** by `collect22.sh` with `P=f24`.

**Against brief 22's close** (`a00f159a`, by `../../../ui-polish-2026-10-23/final-runs/compare.py`):
- **The same in every number:** the judge's outputs (35 files), the runs (17), the interface (1); the advice (31),
  brief 13's journeys (102), brief 20's journeys (74) and the walks of briefs 21 and 22 but their own records (commit,
  clean tree, seconds); the older-save walk but six save-opening times in milliseconds, which vary from run to run.
- **The text outputs:** 211 the same byte for byte, 667 different: the walks' screens and pictures, where briefs 23 and
  24 changed what the screens say, the records' commits and seconds, and the acceptance walk, 77 of 77 at each width as
  before, its figures varying as a walk in real time does and two lines in its new words: the first day's What Needs You
  says All Clear, and a new guided player starts with 9 controls locked, not 12. Measured on a new guided life, brief
  23's build and brief 24's both show 9: the three went with brief 23's Home.

Folded by `../verify.py`, `../advice/close.py` and `../../../integration-2026-10-16/criteria.py`: the 46 rows hold again
on the commits they ran on, 633 of 658 before the gate's own figure. The gate on `859bacdb`, which holds the fold, in a
clean clone, its exit read from its file: 0, 488 of 488 test files, 5,616 of 5,616 tests, every check (`gate.txt`; brief
22's, on `576a0e88`, stood there until then and is in git). Folded, 634 of 658; run again on `1ba6ac00`, which holds
that: the same (`gate-receipt.txt`, brief 22's in git as gate.txt's is).

Brief 23's stopped browser lanes (`113765a6`) left 21 `fail-*.jpg` under `../interface-final/`, the runners' pictures of the
interface they no longer read. They stayed through the replay above, whose every step is ok, and went on 2026-10-24 (brief 26).

## Played Again On Brief 26's Finished Source, 2026-10-24

Brief 26 (the connectivity sweep, `../../../sweep-2026-10-24/`) changed `src` three times (creation's Genres step reading
the career projects' genres, a closed card sending its credit back and net worth counting a credit, and `base44/shared/
guard.js`'s reported size), and the 46 rows these runs measure on the engine's or the app's whole source read as measured
before what they read last changed. Every lane but the judge's, whose watched files the sweep didn't touch, prefix `f26`,
on `124bec77` (the sweep's last source commit, M11's), each in a clean clone (`git clone --shared`, every record
"at 124bec77, 0 tracked files uncommitted"), four at a time by `queue22.sh` from 13:34 to 15:53 UTC: JR1 to JR3, BJ1 to
BJ3, B, C, D, J, A, ADVF, ADVR, UI, APP, then JRC. Every step exit 0 but JRC's `b19-lives-diff`, which exits 1 as on
every commit since brief 19 (948 lines, as before: its four changed lines name this run's folder). The queue and the
gatherer take the scratchpad from the environment from this run (`S=`); until then they named brief 22's session's
folder. Gathered by `collect22.sh` with `P=f26`.

**Against the runs as committed at `b46ee301`** (brief 24's replay, the sweep's starting point;
`../../../sweep-2026-10-24/final-runs/compare.py`, its results beside it):
- **The same in every number:** the judge's outputs (35 files, not run again), the runs (17), the interface (1); the
  advice (31), brief 13's journeys (102), brief 20's journeys (74), the older-save, brief 21's and brief 22's app walks
  (2 each), each differing only in the run's own record (its commit, its clean tree, its seconds). No file differs in a
  number a player's life makes.
- **The text outputs:** 849 the same byte for byte; 86 differ: the lanes' own records (the 17 `exits-*.txt`, the build
  logs, the saves and acceptance logs, this README), the walks' pictures (41 of the app walk's, 8 of the interface's, 8
  of brief 14's journeys', 4 of the older saves', 1 of brief 21's), which real-time walks redraw, and brief 19's lives'
  diff log (its folder's name); 21 missing, the `fail-*.jpg` brief 23's stopped lanes left, which the sweep's M1 removed.
- **The acceptance walk:** 77 of 77 at 1440 and at 390, no error and no overflow, as before.

Folded by `../verify.py` (25 journeys played to the end, every check passed, each ending as brief 21's final run ended;
36 rows held on `124bec77`), `../advice/close.py` (every advice row Implemented And Verified on `124bec77`) and
`../../../integration-2026-10-16/criteria.py`: the 46 rows hold again, 633 of 658 before the gate's own figure. The gate
in a clean clone of the commit that holds the fold, and its figure folded in, are in the sweep's receipt
(`../../../sweep-2026-10-24/README.md`, The Gate).

## Played Again On The Paydays Fix, 2026-10-22 And 23

After #54's merge, the paydays fix (`a2af3b46`, the receipt's After The Merge) changed `src/engine`, and the 46 rows these
runs measured on the engine's or the app's whole source read as measured before what they read last changed. The owner
said to run the final runs again, then merge. Every lane here but the judge's was played again: the judge's rows read
only the files `WATCH.judge` names, none of which the fix touched, so they stay as measured on `16b50e07`.
- **The runs lanes, on `933f1ae6`** (its `src` the fix's), prefix `f22d`, four at a time from 22:08 UTC: JR1 to JR3, BJ1
  to BJ3, B, C, D, J, A, ADVF, ADVR, UI and APP, then JRC, each clone starting with nothing tracked uncommitted. The
  container restarted between 22:45 and 23:00 with seven lanes done or under way; the queue was started again with the rest, each
  lane taking up its record where it stopped (A's preview started twice), and ended at 00:00. Every step exit 0 but
  JRC's `b19-lives-diff`, which exits 1 as it did on the tested commit (Brief 19's Lives Again, below).
- **The advice lanes again, on `54b4e96f`**, prefix `f22e`: on `933f1ae6` their batches said their tree unclean, since
  each lane wrote over the outputs its first run had committed and `tools/advice.ts` counted any tracked change. It
  counts every tracked change but the final runs' own outputs now (still unclean for a change to `src` or to code
  anywhere else, checked in a lane's clone), and ADVF and ADVR were played again: every batch on `54b4e96f`, its tree
  clean. The queue's JRC after them had no journeys of its own and was set aside, not gathered.
- **Gathered** by `collect22.sh` with `P`, each lane's own outputs only (what its clone's git reads as changed or new).

**Against brief 22's first runs** (the outputs at `16aa0b6d`, every number compared as `../numbers-same.py` compares):
- **The same in every number, each run's own record aside:** the runs (17 of 17 files), the advice (31), brief 13's
  journeys (102), the interface and brief 14's journeys.
- **Brief 20's journeys:** the same but their seconds, and b20-4's save at its fourteenth transition 45 bytes longer
  (1,810,488 to 1,810,533): the released run's nine paydays kept as cancelled at the release, which is the fix. 161 of
  161 transitions and 52 of 52 forks the same to the byte, saved and opened; every check passed.
- **The text outputs** (467 files): the same byte for byte but the build logs, the walks' timings, the release page
  (`app/b22/*/released-01.txt`: no "Payday: The Winter Ledger", the fix), brief 19's lives' log (its folder's name), and
  the acceptance walk: 77 of 77 at each width as before, its coursework figures (a scene's Knows The Scene 35% on the
  first runs, 42% and 43% here, 43% on briefs 20's and 21's) varying as a walk in real time varies from run to run.
- **Against brief 21's** (`../numbers-same.json`): every folder as on the first runs, the same files differing by the
  same counts.

The matrix's 46 rows moved to the commits they ran on: 633 of 658 before the gate's own figure, as on the first runs.
The gate on `576a0e88`, which holds the fold, in a clean clone, its exit read from its file: 0, 486 of 486 test files,
5,598 of 5,598 tests, every check (`gate.txt`; brief 22's first gate, on `cf83e61d`, stood there until then and is in git
at `16aa0b6d`). Folded, 634 of 658; run again on `6f44b403`, which holds that: the same (`gate-receipt.txt`).

## Why They Were Made

Brief 22 changed `src/engine` and `src/ui`, and what the judge reads (`content/genre-weights.ts`, `systems/engagement.ts`).
So every completion-matrix row measured on the engine's, the app's or the judge's source read as measured before what it
reads last changed. Brief 22 changed play on purpose: each work asks its genres as its material states them, a related
genre counts across one direct link at 0.65 or 0.40 beside the genre's own, OPT is counted by the day, and permission is
read at each work day. A figure that moved is said where it starts.

## The Lanes

| Lane | What | Commit | Steps | Exit 0 | Seconds |
|---|---|---|---|---|---|
| JR1, JR2, JR3 | Brief 13's 25 journeys, four parts each | `0ae97df3` | 32, 32, 36 | all | 2,602, 2,444, 2,045 |
| BJ1, BJ2, BJ3 | Brief 20's eight lives and seven older saves | `afe751f1` | 20, 23, 15 | all | 1,638, 1,792, 1,667 |
| B, C | The long runs: 24 lives, the variety run, freshness | `16b50e07` | 13, 13 | all | 2,471, 3,415 |
| D | The workloads and the six mastery plans | `16b50e07` | 14 | all | 1,852 |
| A | The build, the scenario saves, the acceptance walk at 1440 and 390 | `16b50e07` | 5 | all | 1,860 |
| ADVF, ADVR | The advice's fresh set and its regression set | `16b50e07` | 13, 18 | all | 1,146, 1,553 |
| UI | Brief 13's three playthroughs and brief 14's three journeys at 1440 and 390 | `16b50e07` | 20 | all | 1,489 |
| APP | Brief 19's career walk, the seven older saves, brief 21's walk and brief 22's walk, at 1440 and 390 | `16b50e07` | 13 | all | 965 |
| J | The acting area's measurements | `16b50e07` | 4 | all | 502 |
| JRC | The journeys' compare and summary; brief 20's journeys' table; brief 19's lives played again and set beside their transcripts | `0ae97df3` | 5 | 4 | 260 |
| M1 to M4, MF | The judge (`../final/exits.txt`) | `16b50e07` | 23 parts | all | |

The first queue reached the two-hour limit on a background command in the UI lane, which was started again and skipped
the steps it had passed (its record shows the preview started twice). JRC's fifth step, `b19-lives-diff`, exits 1 because
brief 19's four lives don't play line for line as their transcripts were written, as on briefs 20's and 21's commits: that
step records whether they do (below).

## The Figures

`figures.py` reads them into `figures.json`. Set beside brief 21's
(`../../../genre-banking-2026-10-22/final-runs/runs/figures.json`):
- **INT-navigation, INT-skipped, INT-long-runs, F2-A:** the same, word for word: the acceptance walk 77 passed, 0 failed, 0
  skipped, 0 errors and 0 overflows at each width; 24 lives, 20 graduated and 4 dismissed (the Reykjavík autopilot),
  breaches 0, unbalanced 0, errors 0; the workloads 6 of 8 in good standing; the six mastery plans at 100 on every payoff
  tape; the variety run; freshness 8 runs, none repeated; the scenario saves 15 of 15; 40 of 40 advice cases.
- **MA5:** every payoff 100; the musical plan mastered on 4 October 2030, a day later than brief 21's 3 October, its
  practice shared by the material's weights. The other five plans on the same days.
- **INT-gate:** run after the fold, on `cf83e61d`, the commit holding it and the receipt (`gate.txt`): exit 0, 486 of 486
  test files, 5,596 of 5,596 tests, none skipped, every check. Folded in after it ran.

What moved inside the files, every number compared (`../numbers-same.json`, "runs"), none of it a figure the matrix reads:
the lives' casting fits by a tenth here and there, the mastery plans' hours and readiness by the day or so their practice
moved, three London workloads' last term by one or two pieces short at a showing, and freshness's best lean share in two
runs. Each is what practice and preparation speed by the material's weights and the new credit make of the same days.

`../advice/close.py` holds the advice's four rows on these runs (`../final-result.json`): F2-A10 (f) and (h) on the fresh
set, 120 of 120 throughout; (c) at or above the others' median on 120 of 120; the held-out set run whole in 16 batches.

## The Journeys And The Interface

`../verify.py` holds brief 13's clauses (`../verification-result.json`): the 25 journeys played to the end, all ten
checks passed in each, each ending as brief 21's final run ended; the three playthroughs 14 of 14, 9 of 9 and 11 of 11 at
each width (`../interface-final/summary.json`). 36 rows held. Brief 14's three journeys (`../journeys14-final/`): banking
10 of 10, the document 8 of 8, health 10 of 10 at each width, no language check failed.

## Brief 20's Journeys Again (J1, J2)

`../b20-journeys/` is brief 20's journeys played again: the same fixed seeds, players and runner.
- **The same to the byte:** saved and opened at the transitions, 161 of 161; the straight-against-reopened forks, 52 of 52.
- **Played through:** every life and older save to its end, every check and every coherence check passed, in all 15.
- **b20-4, the international graduate (J1):**
  - **Before** (the starting commit, `../../before/b20-4/`): OPT ended at 14:25 UTC on 6 September 2029 by the weekly
    count, and The Winter Ledger went on, 47 of its days worked after that instant; "papers and work" failed.
  - **After:** the offer for Hester Vane, on 16 August, says before it's taken that OPT's 90 days without work run out on
    1 September, before the run begins on the 4th. It's taken. OPT ends at the end of 1 September, the "OPT Ended" notice
    at midnight, and "Released As Hester Vane" with it: nothing worked, nothing owed, its days off the calendar, no credit.
    Paper Moons' three days, worked with permission in August, stand. "Papers and work" passes: no day worked without
    permission.
  - **After that:** out of status and without permission, b20-4 is still called to audition (an audition isn't work) and
    isn't called back. An offer would be refused at acceptance, by the same reading.
- **The career's draws moved** in two lives: b20-2's successes and failures 4 and 6 became 3 and 8; b20-4's failures 5
  became 6, the December audition above. Every other life's routes are brief 21's.

## Brief 19's Lives Again

`play.ts lives` on `0ae97df3`, set beside brief 19's transcripts (`../b20-journeys/b19-lives-diff.log`), with briefs 20's
and 21's own changes running through it. Set beside brief 21's run of the same lives
(`../../../genre-banking-2026-10-22/final-runs/b20-journeys/b19-lives/`), brief 22 changes two, both in the Actor
Showcase's scenes:
- **Life A:** the faculty's shortlist now reads what each scene asks, and the life takes Lovborg in Hedda Gabler and The
  Father in Office Hours where brief 21's took The Father and Priya in Bed Fourteen; the rehearsal partner's notices follow
  the scene (38 lines). Both scenes come out Working, 60 to 62, as before.
- **V16 mid-term:** The Father in Office Hours in place of Konstantin in The Seagull, 63 where it was 59 to 60 (10 lines).
- **Life B and V16 graduate:** line for line as on brief 21's commit. The career in every life (agents, auditions, offers,
  work and pay) is brief 21's.
