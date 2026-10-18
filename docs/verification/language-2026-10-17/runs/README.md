# Brief 14's Final Runs, 2026-10-18

These are brief 13's final runs again, on brief 14's tested code (`ebdb5577`'s):
- the build, the regenerated scenario saves, and the built app at 1440 and 390;
- the long runs and the mastery plans;
- the advice's fresh set again, and its regression set;
- the acting area's measurements and the judge's (`../final/`);
- the journeys (`../journeys-final/`) and the interface playthroughs (`../interface-final/`), with brief 14's own three
  journeys beside them (`../journeys14-final/`).

## Why They Were Made Again

Brief 14 changed the player's words, and with them files these measurements watch: the coursework, the looks, the
briefs' content, the notices the engine writes. So each measurement brief 13 made went stale. The point of running
them again is to show that a pass that changed only words left every number where it was.

## How They Ran

They ran in clones of the branch, one per lane, through the scratchpad's `runs14.sh`, copied here as `runs14.sh`. Each
step's commit, command and exit is recorded in `exits-<lane>.txt`, and no tracked file changed in any clone.
- **Every lane but A and UI** ran on `6d83601a`. Between it and `ebdb5577`, `src/` differs only in Work On The Note's
  toast (`src/ui/components/CourseworkPane.tsx`). The engine's runs don't read that toast, so it moves nothing they
  measure. The tools differ in the interface tools' matchers and the journeys' OPT check (`tools/journeys.ts`), and
  J16's final part was checked again with that fixed check (`exits-JRR.txt`).
- **Lanes A and UI** ran on `edd7be91`, which is `ebdb5577` with records added. They ran first on `6d83601a` too. Those
  runs are kept in `first/`, and `first/README.md` says what failed and why.

`figures.py` reads each figure from these outputs into `figures.json`. `../../integration-2026-10-16/criteria.py` reads
that for the matrix, and `../verify.py` reads the journeys' and the interface's into `../verification-result.json`. The
gate ran after, on the commit `gate.txt` names on its first line, with only documents changed in between.

## The Outputs

| Output | Command | Result |
|---|---|---|
| `build.log` | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 15 of 15 exit 0, on `edd7be91` (the saves aren't kept) |
| `acceptance/` | `node node_modules/vite/bin/vite.js preview --port 4219`, its page checked as the lane's own build, then `SLATE_BASE=http://localhost:4219 node tools/acceptance-ui.mjs <out> 1440 <saves>` and 390 | 77 passed, 0 failed, 0 skipped, 0 errors, 0 overflows at each width, on `edd7be91`, as brief 13's second run |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives, each life's last JSON line brief 13's byte for byte: 20 graduated, the 4 dismissed the autopilot control's (Reykjavík) |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | every number brief 13's; only the notices' words differ |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | brief 13's byte for byte |
| `variety-v-0.json` | `tools/variety.ts --seed v-0 --years 3` | brief 13's byte for byte |
| `freshness.json` | `tools/freshness.ts --months 4 --seeds fr-0,fr-1` | every number brief 13's but one count of words (below) |
| `../advice/` | brief 13's advice batches, fresh and held out, then `--summarize`; `--cases tuning` | brief 13's in every number; only each run's own record differs: its commit, the files it read, its seconds |

**What differs from brief 13's, and only that** (`../numbers-same.py`, which compares every number, id, key and list
length, and lets only the words a player reads differ):
- **The workloads' notices** say the same events in brief 14's words. A term review that said "You were at 100% of
  the classes" now says "You came to 100% of the classes". The coursework warning that said "5 of the 14 pieces shown
  this term so far" now says "So far this term, 5 of the 14 pieces you've shown". Each workload has as many notices as
  brief 13's, with the same titles on the same days.
- **Freshness's count of the advice's suggestions it finds in the record** fell from 304 to 298 and from 328 to 321, in
  its two mastered runs. The tool finds a suggestion by its phrases, and brief 14 changed the phrases. Every count of
  takes, scenes and repeats is brief 13's.
- **The scenario saves** are 15, where brief 13's were 14. `tools/scenario-saves.mjs` writes a fifteenth from brief
  14 (`22b3a302`): `health.json`, the sprained ankle brief 14's health journey opens. The other fourteen exit 0, as
  brief 13's did.
- **`lives.jsonl`** holds each life's whole output, its `--why` lines with it. Brief 13's kept only each life's last JSON
  line. The 24 JSON lines are brief 13's byte for byte.

`tools/freshness.ts` writes into `docs/verification/connected-journey/`, so its output was copied here and that folder
put back as it was.
