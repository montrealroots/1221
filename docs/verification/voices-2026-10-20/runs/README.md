# Brief 16's Final Runs, 2026-10-20

These are brief 15's final runs again, on brief 16's tested code, `4ef5e961`:
- the build, the regenerated scenario saves, and the built app at 1440 and 390;
- the long runs and the mastery plans;
- the advice's fresh set again, and its regression set;
- the acting area's measurements and the judge's (`../final/`);
- the journeys (`../journeys-final/`) and the interface playthroughs (`../interface-final/`), with brief 14's three
  journeys beside them (`../journeys14-final/`).

## Why They Were Made Again

Brief 16 changed the words the school, the directors, the classmates and the Profile say, and with them files these
measurements watch: the coursework, the classmates, the advice and the notices the engine writes. So each measurement
brief 15 made went stale. Running them again shows that a pass that changed how things are said left every number
where it was (brief 16, section 10: "Narrative variation does not change gameplay results").

## How They Ran

They ran in clones of the branch, one per lane, through `runs16.sh`, which is brief 15's `runs15.sh` writing to brief
16's folder. `queue16.sh` ran the lanes four at a time, then the journeys' compare (JRC) and the judge's merge (MF) once
their parts were done, and `collect16.sh` gathered them here.
- **One commit:** every lane ran once, on `4ef5e961`, from 06:20 to 08:08 UTC. No step ran twice and the container
  didn't restart.
- **The trees:** each lane's `exits-<lane>.txt` starts with its commit and "0 tracked files uncommitted". The judge's
  `../final/exits.txt` counts one: its lanes' own `runs/` folder, which isn't tracked.
- **201 steps:** each step's command and exit is in `exits-<lane>.txt`. All exit 0 but banking's two (below).

`figures.py` reads each figure from these outputs into `figures.json`. `../../integration-2026-10-16/criteria.py` reads
that for the matrix, and `../verify.py` reads the journeys' and the interface's results into
`../verification-result.json`. The gate ran after the runs, on the commit `gate.txt` names on its first line, with only
documents changed in between.

## The Outputs

| Output | Command | Result |
|---|---|---|
| `build.log` | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 15 of 15 exit 0 (the saves themselves aren't kept) |
| `acceptance/` | `node node_modules/vite/bin/vite.js preview --port 4219`, its page checked as the lane's own build, then `SLATE_BASE=http://localhost:4219 node tools/acceptance-ui.mjs <out> 1440 <saves>`, and the same at 390 | 77 passed, 0 failed, 0 skipped, 0 errors, 0 overflows at each width |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives, every line brief 15's byte for byte: 20 graduated, and the 4 dismissed are the autopilot control's (Reykjavík) |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | six of eight brief 15's byte for byte. The other two differ in three notices' words (below) |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | brief 15's byte for byte |
| `variety-v-0.json` | `tools/variety.ts --seed v-0 --years 3` | brief 15's byte for byte |
| `freshness.json` | `tools/freshness.ts --months 4 --seeds fr-0,fr-1` | brief 15's byte for byte |
| `../advice/` | brief 15's advice batches, fresh and held out, then `--summarize`; `--cases tuning` | brief 15's in every number. Only each run's own record differs: its commit, the files it read, its seconds |
| `../final/` | `../../decisions-2026-10-16/measure.sh <out> <part>`, 23 parts in lanes M1 to M4 and MF; the acting area's in lane J | every file brief 15's byte for byte (`../final/README.md`) |
| `../interface-final/` | `node tools/playthroughs-ui.mjs <normal\|setback\|specialist> <1440\|390> <saves> <out>`, then `summary.py` | normal 14 of 14, setback 9 of 9, specialist 11 of 11, at each width |
| `../journeys14-final/` | `node tools/playthroughs-ui.mjs <banking\|document\|health> <1440\|390> <saves> <out>` | document 8 of 8 and health 10 of 10 at each width; banking 9 of 10 at each width (below) |
| `../journeys-final/` | `npx vite-node tools/journeys.ts -- --journey <id> --part <n> …`, then `--compare` and `--summarize` | 25 journeys played to the end, all ten checks passed on each, each ending as brief 15's ended |

**Banking's step 8**, at both widths, asks One Week from a Friday evening and expects On The Way to ask first. It's
brief 14's `journeys-3`, the engine's week planning, which is left for the owner. Brief 16 didn't change it, and
brief 15's final runs failed it the same way, in the same words.

**What differs from brief 15's, and only that** (`../numbers-same.py`, which compares every number, id, key and list
length, and lets only the words a player reads differ; `../numbers-same.json`):
- **The coursework warnings** in two workloads. One that follows another says which it is: "This is a warning." became
  "This is your second coursework warning, after one last term." Each was checked against the warnings before it in its
  run.
- **The journeys' notice counts.** A notice merges into an unread one with the same title and body
  (`Simulation.notify`). A classmate's notice that comes again now says so, so it no longer merges with the last. In
  the 25 journeys, 880 more are kept apart: a request for help (482), a partner who didn't come (229), an apology
  (161), lines run again (8). Every notice brief 15's run had on a day is in brief 16's on that day, under the same
  titles, and none is had fewer times. `numbers-same.py` checks each of those, journey by journey.
- **The journeys' continuity** counts words, and the words changed.
- **Each run's own record:** its commit, the files it read, its seconds.

`tools/freshness.ts` writes into `docs/verification/connected-journey/`. It ran in its lane's clone, whose tracked files
stayed as they were.
