# Brief 19's Final Runs, 2026-10-21

These are brief 17's final runs again, on brief 19's tested code, `728b4972`:
- the build, the regenerated scenario saves, and the built app at 1440 and 390;
- the long runs and the mastery plans;
- the advice's fresh set again, and its regression set;
- the acting area's measurements and the judge's (`../final/`);
- the journeys (`../journeys-final/`) and the interface playthroughs (`../interface-final/`), with brief 14's three
  journeys beside them (`../journeys14-final/`).

## Why They Were Made Again

Brief 19 added the career after the degree, and with it changed what earlier measurements watch: the School's last term
(the Actor Showcase as DRAM 793b's coursework, W1), the clock's stops and commitments (D1 to D5), the understudy's part
(D6), and the engine's whole source. So each measurement brief 17 made went stale (85 rows of the completion matrix
read "measured before what it reads last changed"). Brief 19 changed play on purpose, so the runs aren't held to brief
17's numbers but the judge's, which no part of brief 19 was meant to move. They're compared with brief 17's file by file
(`../numbers-same.py`, `../numbers-same.json`), and each difference is said where it starts.

## How They Ran

They ran in clones of the branch, one per lane, through `runs19.sh`, which is brief 17's `runs17.sh` writing to brief 19's
folder. `queue19.sh` ran the lanes four at a time, then the journeys' compare (JRC) and the judge's merge (MF) once
their parts were done, and `collect19.sh` gathered them here.
- **One game:** every lane ran on `728b4972`'s game.
- **Started three times:** the first queue, on `a483247d`, was stopped when the employment check under Equity's rule
  changed `src/engine`, and the second, on `9c3e6fa5`, when the 90 days' extension changed it again; neither's outputs
  are here, their clones removed. The third, on `728b4972`, began at 10:00 UTC.
- **Started again once:** the container restarted at 12:31 UTC while the session sat idle, and stopped the queue with C,
  ADVR and UI partway and JRC and MF not begun. They were started again by name at 12:36 (`queue19.sh <commit>
  "<lanes>"`), detached, and each skipped the steps it had passed. No step has two exit lines; a step the stop cut short
  left none, and ran again in full.
- **The trees:** each lane's `exits-<lane>.txt` starts with its commit and "0 tracked files uncommitted", but the
  journeys' (below). The judge's `../final/exits.txt` counts one: its lanes' own `runs/` folder, which isn't tracked.
- **Each step's command and exit** is in `exits-<lane>.txt`. Every one exit 0.

**The journeys played again** (`journeys-again19.sh`), from 13:01 UTC, in the clones of `728b4972`, with
`tools/journeys.ts`'s check 2 reading each piece's own record where two of one title are shown at one moment. The first
play failed that check in 22 of 25 journeys, each on the Actor Showcase's two scenes: both are Your Showcase Scene and
shown together, so each read both records (`9afb8548`). That tool isn't the game, and their exits count it uncommitted:
one file. The replay passed 24 of 25: F1's two scenes scored the same, 61.8, so the score couldn't tell their records
apart either. The check was made to pair such pieces one to one, a record more than its pieces still failing (`a9654e24`),
and F1 alone was played again with it, from 13:46 UTC, then the compare and summary (`journeys-f1-again19.sh`, its exits
in `exits-F1-again.txt`). The first play's exits, summary and compare are in `../journeys-first-play/`.

`figures.py` reads each figure from these outputs into `figures.json`. `../../../integration-2026-10-16/criteria.py`
reads that for the matrix, `../verify.py` reads the journeys' and the interface's results into
`../verification-result.json`, and `../advice/close.py` the advice's four rows into `../final-result.json`. The gate ran
after the runs, on the commit `gate.txt` names on its first line, with only documents and tools changed after
`728b4972`.

## The Outputs

| Output | Command | Result |
|---|---|---|
| `build.log` | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 15 of 15 exit 0 (the saves themselves aren't kept) |
| `acceptance/` | `node node_modules/vite/bin/vite.js preview --port 4219`, its page checked as the lane's own build, then `SLATE_BASE=http://localhost:4219 node tools/acceptance-ui.mjs <out> 1440 <saves>`, and the same at 390 | 77 passed, 0 failed, 0 skipped at each width; 0 errors, 0 overflows, as in brief 17 |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives: 20 graduated, and the 4 dismissed are the autopilot control's (Reykjavík), as in brief 17; breaches 0, unbalanced 0, errors 0. Every standing is brief 17's, and 4 lives are brief 17's in every number. Of the other 20, the monthly record of 8 is brief 17's to the end and only their end figures differ (abilities, bank); 10 first differ in the last term, February to April 2029; one in November 2027 and one in June 2028 |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | brief 17's in every number, all eight: 7 of 8 in good standing, the neglect policy's dismissed |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | 6 of 6 at 100 on every payoff tape, as in brief 17. Each reached mastery 3 to 7 days sooner, with 72 to 168 fewer hours; the first take that differs is in the last term (11 April 2029 for nordic_noir m-0, 89.7 then and 90 now), which brief 19 changed. Traced no further |
| `variety-v-0.json` | `tools/variety.ts --seed v-0 --years 3` | graduated, breaches 0, 8 distinct top recommendations over 157 weeks, as in brief 17; 8 numbers differ, among them coursework met again 11 times where brief 17's was 17 |
| `freshness.json` | `tools/freshness.ts --months 4 --seeds fr-0,fr-1` | brief 17's in every number |
| `../advice/` | brief 17's advice batches, fresh and held out, then `--summarize`; `--cases tuning` | brief 17's in every number (only each run's commit and seconds differ): F2-A 40 of 40; F2-A10 (f), (h), (c) and the held-out set close as in brief 17 (`../final-result.json`) |
| `../final/` | `../../../decisions-2026-10-16/measure.sh <out> <part>`, 23 parts in lanes M1 to M4 and MF; the acting area's in lane J | every JSON file brief 17's in every number (`../final/README.md`) |
| `../interface-final/` | `node tools/playthroughs-ui.mjs <normal\|setback\|specialist> <1440\|390> <saves> <out>`, then `summary.py` | normal 14 of 14, setback 9 of 9, specialist 11 of 11, at each width, as in brief 17. The dialogs the normal playthrough went through differ, 23 at 1440 and 25 at 390 where brief 17's were 24 at each, the clock's dialogs being brief 19's (D1 to D5) |
| `../journeys14-final/` | `node tools/playthroughs-ui.mjs <banking\|document\|health> <1440\|390> <saves> <out>` | banking 10 of 10, document 8 of 8 and health 10 of 10 at each width. Banking was 9 of 10 in brief 17: its step 8 asks One Week from a Friday evening and expects On The Way to ask first (brief 14's `journeys-3`), and it passes now, after brief 19's clock work (D1 to D5), which brief 18 had named for it |
| `../journeys-final/` | `tools/journeys.ts`, each of brief 13's 25 journeys in four parts, then `--compare` and `--summarize` | as played again (above): 25 of 25 played to the end, all ten checks passed in each, each ending as brief 17's (`../verify.py`). Parts 1 and 2, to 1 June 2028, are brief 17's in every number but the run's own record, the notices' counts and the measures of words; each journey's notices first differ on the last term's first day, at the Actor Showcase (17 of 22), or at an understudy's night on now named for its part (4), or, in J01, at a classmate's request to rehearse in October 2027 that brief 17's life had and this one's didn't, not traced; 3 are brief 17's notice for notice |
