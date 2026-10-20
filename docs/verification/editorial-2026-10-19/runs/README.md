# Brief 15's Final Runs, 2026-10-20

These are brief 14's final runs again, on brief 15's tested code, `d6f6527a`:
- the build, the regenerated scenario saves, and the built app at 1440 and 390;
- the long runs and the mastery plans;
- the advice's fresh set again, and its regression set;
- the acting area's measurements and the judge's (`../final/`);
- the journeys (`../journeys-final/`) and the interface playthroughs (`../interface-final/`), with brief 14's three
  journeys beside them (`../journeys14-final/`).

## Why They Were Made Again

Brief 15 changed the player's words, and with them files these measurements watch: the coursework, the looks, the
briefs' content, the advice and the notices the engine writes. So each measurement brief 14 made went stale. Running
them again shows that a pass that changed only words left every number where it was.

## How They Ran

They ran in clones of the branch, one per lane, through `runs15.sh`, which is brief 14's `runs14.sh` writing to brief
15's folder. Each step's commit, command and exit is in `exits-<lane>.txt`, and no tracked file changed in any clone.
`queue15.sh` and `queue15b.sh` ran the lanes four at a time, and `collect15b.sh` gathered them here.

- **First, on `c3478f9e`** (`queue15.sh`). Every engine lane exited 0. Lanes A and UI failed, and `../uitools/README.md`
  judges each failure:
  - seven of the interface tools' matchers looked for words brief 15 had changed;
  - the steps after them failed behind the dialogs they left open;
  - one failure was the game: the coursework warning ran past the playthroughs' wall of text.

  These exits are kept in `first/`. The container restarted once during these runs. The queue was started again, and
  each step already recorded on the commit was skipped.
- **Then, on `d6f6527a`** (`queue15b.sh`), every lane again. `e5fdacb7` moved the matchers and shortened the warning.
  `d6f6527a` put the coursework forecast back to a tenth, after a trial found that whole points hid a day's work. The
  warning's file, `src/engine/systems/coursework.ts`, is read by the engine's measurements, so every lane ran again, not
  only A and UI.
  - The container restarted once during these runs too, at 00:44 UTC. The queue was started again: steps already
    recorded were skipped, and lane A's half-written acceptance walk was deleted and walked again.
  - The judge's parts don't skip a part already run, so they ran twice (`../final/README.md`).

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
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives; each life's last JSON line is brief 14's byte for byte: 20 graduated, and the 4 dismissed are the autopilot control's (Reykjavík) |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | every field brief 14's but the notices' words: each workload has as many notices as brief 14's, with the same titles on the same days |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | brief 14's byte for byte |
| `variety-v-0.json` | `tools/variety.ts --seed v-0 --years 3` | brief 14's byte for byte |
| `freshness.json` | `tools/freshness.ts --months 4 --seeds fr-0,fr-1` | brief 14's byte for byte |
| `../advice/` | brief 14's advice batches, fresh and held out, then `--summarize`; `--cases tuning` | brief 14's in every number. Only each run's own record differs: its commit, the files it read, its seconds |
| `../interface-final/` | `node tools/playthroughs-ui.mjs <normal\|setback\|specialist> <1440\|390> <saves> <out>` | normal 14 of 14, setback 9 of 9, specialist 11 of 11, at each width |
| `../journeys14-final/` | `node tools/playthroughs-ui.mjs <banking\|document\|health> <1440\|390> <saves> <out>` | document 8 of 8 and health 10 of 10 at each width; banking 9 of 10 at each width (below) |
| `../journeys-final/` | `npx vite-node tools/journeys.ts -- --journey <id> --part <n> …`, then `--compare` and `--summarize` | 25 journeys played to the end, all ten checks passed on each, each ending as brief 14's ended |

**Banking's step 8**, at both widths, asks One Week from a Friday evening and expects On The Way to ask first. It's
brief 14's `journeys-3`, the engine's week planning, which is left for the owner. Brief 15 didn't change it, and
brief 14's final runs failed it the same way.

**What differs from brief 14's, and only that** (`../numbers-same.py`, which compares every number, id, key and list
length, and lets only the words a player reads differ):
- **The workloads' notices** say the same events in brief 15's words. A term review that said "Your craft grew 1.7
  points, and the class’s middle student’s grew 1.2" now says "Your craft grew 1.7 points this term, and the middle
  student in your class grew 1.2".
- **The journeys' continuity** counts words, and the words changed.
- **Each run's own record:** its commit, the files it read, its seconds.

`tools/freshness.ts` writes into `docs/verification/connected-journey/`, so its output was copied here and that folder
was put back as it was.
