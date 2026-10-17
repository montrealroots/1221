# Brief 13's Final Runs, 2026-10-17

These are the checks brief 13's section 8 asks for, on the tested code, `7e7a3af6`:
- the build, the regenerated scenario saves, and the built app at 1440 and 390;
- the long runs and the mastery plans;
- the advice's fresh set again, and its regression set;
- the acting area's measurements and the judge's (`../final/`);
- the journeys (`../journeys-final/`) and the interface playthroughs (`../interface-final/`).

They ran in clones of the branch, one per lane, through the scratchpad's `runs13.sh`. It is brief 12's `runs12.sh` with
brief 11's judge lanes (M1 to MF), the acting area's measurements (J), the interface's playthroughs (UI) and the
journeys (JR1 to JR3, then JRC) added. Each step's commit, command and exit is recorded in `exits-<lane>.txt`, and no
tracked file changed in any clone. `figures.py` reads each figure from these outputs into `figures.json`, which
`../../integration-2026-10-16/criteria.py` reads for the matrix. `../advice/close.py` reads the advice's into
`../final-result.json`, and `../verify.py` reads the journeys' and the interface's into `../verification-result.json`.
The gate ran after, on the commit `gate.txt` names on its first line, with only documents changed in between.

## Why They Were Made Again

The journeys area's five fixes (D1 to D5) changed `systems/coursework.ts`, `classmates.ts` and `school.ts`, and the
opening step for older saves in `index.ts`. The coordinator's OPT fix changed `systems/permission.ts`. The interface
area's fixes changed Home, the looks and the guide. So every engine and app measurement brief 12 made went stale.

## Lane A, Twice

Lane A ran first on `7e7a3af6` (`exits-A-first.txt`). The build and the saves exited 0. The built app's acceptance
exited 1 at each width: 75 of 76 steps. The one that failed, on the workload save, looked for a stage piece whose suited
side rests on its circumstances. The only such piece there was Table Work, which is written work. D3 now refuses a way of
playing on written work, as the coursework pane does, so the step had been relying on D3's defect.

The tool was changed in `51cdd7d6`, and the game's code wasn't. On the workload save the step now checks that Table Work
offers no way of playing. The circumstances choice runs on the roundups save's scene study, which suits restraint by
what it keeps hidden. Lane A ran again in a fresh clone of `51cdd7d6` (`exits-A.txt`), its build, saves and acceptance
all over. That is the run the figures read.

## The Outputs

| Output | Command | Result |
|---|---|---|
| `build.log` | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 14 of 14 exit 0 (the saves aren't kept) |
| `acceptance/` | `npx vite preview --port 4189`, then `SLATE_BASE=http://localhost:4189 node tools/acceptance-ui.mjs <out> 1440 <saves>` and 390 | 77 passed, 0 failed, 0 skipped, 0 errors, 0 overflows at each width, on `51cdd7d6`; brief 12 had 76, and the workload save’s step is two now (above) |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives: 20 graduated, the 4 dismissed the autopilot control's (Reykjavík); breaches, unbalanced and errors 0, as brief 12's |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | every standing as brief 12's, 0 breaches |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | brief 12's byte for byte: 6 of 6 at 100 on every payoff tape |
| `variety-v-0.json`, `freshness.json` | `tools/variety.ts --seed v-0 --years 3`, `tools/freshness.ts --months 4 --seeds fr-0,fr-1` | brief 12's byte for byte |
| `../advice/fresh-*` | `npx vite-node tools/advice.ts -- --cases adv-v-<a>..<b> --fresh`, twelve batches, then `--summarize` | brief 12's in every field but the commit, the command and the paths |
| `../advice/f2a-*`, `regression-*`, `tuning-final.json` | `--cases adv-0..9`, then `adv-10..39` and `adv-h-0..119` with `--held-out`, sixteen batches, then `--summarize`; `--cases tuning` | the same: brief 12's in every field but those three |

**What moved since brief 12, and only that.** Six of the 24 lives differ from brief 12's, all of them still graduated:
- London's early riser, `lives-0`: a cast score or two by a tenth, and the bank by $10.
- New York's practicing actor, `lives-0`: its best cast 71.7 against 71.6, and two abilities a point lower at the end.
- The four pressure lives (scraping, the flu and an injury): a few terms' averages and cast scores by a tenth, and one
  illness's days. Their bank is unchanged.

The engine changes in between are D1 to D5's and OPT's, besides the acting area's comments in two files and the guide's
words. Each fix refuses a command, takes a way of playing off written work, or changes a warning's words. Which one moved
which life wasn't measured one fix at a time.

Four workloads differ (London `lives-0` to `lives-2`, attentive and neglect), in their notices: the coursework warning
and the term's review now say no one part was short more often than the others, where they had named the first part
in the list's order (D2). One of them, London `lives-0` attentive, also spent half an hour of its 12,264 differently
around a partner's rehearsal. The other four workloads are byte for byte brief 12's.

`tools/freshness.ts` writes into `docs/verification/connected-journey/`, so its output was copied here and that folder
put back as it was. The lives' lines were taken from each life's output, the last JSON line, in the order p0 to p5 and
`lives-0` to `lives-3`.
