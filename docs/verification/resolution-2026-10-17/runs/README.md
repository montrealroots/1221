# Brief 12's Final Runs, 2026-10-17

These are the checks brief 12's section 6 asks for, on the tested code, `ed24ff3b`:
- the build, the regenerated scenario saves, and the built app at 1440 and 390;
- the long runs and the mastery plans;
- the advice's fresh set, run once, and its regression set;
- the acting area's measurement.

They ran in clones of the branch, one per lane, through the scratchpad's `runs12.sh`, which is brief 11's `runs11.sh`
with three lanes added: ADVF, ADVR and J. Each step's commit, command and exit is recorded in `exits-<lane>.txt`, and
every step exited 0. No tracked file changed in any clone. `figures.py` reads each figure from these outputs into
`figures.json`, which `../../integration-2026-10-16/criteria.py` reads for the matrix. `../advice/close.py` reads the
advice's into `../final-result.json`. The gate ran after, on the commit `gate.txt` names on its first line, with only
documents changed in between.

## Why They Were Made Again

The advice area changed `systems/advice.ts`, `systems/next-steps.ts`, `systems/experience.ts` and the guide. Then
`ed24ff3b` renamed its fields, after the whole suite found them read as a person's genres (`tests/cohesion.test.ts`). So
every engine and app measurement brief 11 made went stale. The judge's measurements read none of these files, and stand.

## The Outputs

**Every output the engine's runs share with brief 11's** (`../../completion-2026-10-16/runs/`) **is byte for byte the
same:** the 24 lives, all eight workloads, all six mastery plans, variety and freshness. Cutting health.enroll's work
branch, the advice's new words and SNAP's notice moved nothing a played life reaches. The regression set's summary gives
brief 11's held-out figures exactly.

| Output | Command | Result |
|---|---|---|
| `build.log` | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 14 of 14 exit 0 (the saves aren't kept) |
| `acceptance/` | `npx vite preview --port 4186`, then `SLATE_BASE=http://localhost:4186 node tools/acceptance-ui.mjs <out> 1440 <saves>` and 390 | 76 passed, 0 failed, 0 skipped, 0 errors, 0 overflows at each width; brief 11 had 72, and the four new steps are the walkthrough's (`../PLAYTEST.md`) |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives: 20 graduated, the 4 dismissed the autopilot control's (Reykjavík); breaches, unbalanced and errors 0 |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | as brief 11's |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | as brief 11's: 6 of 6 at 100 on every payoff tape |
| `variety-v-0.json`, `freshness.json` | `tools/variety.ts --seed v-0 --years 3`, `tools/freshness.ts --months 4 --seeds fr-0,fr-1` | as brief 11's |
| `../advice/fresh-*` | `npx vite-node tools/advice.ts -- --cases adv-v-<a>..<b> --fresh`, twelve batches, then `--summarize` | F1 to F6 and H1 to H6 on 120 of 120; F3 on every band and stage; 1,965 reads, 0 stale; 3,371 changes, 0 unexplained |
| `../advice/f2a-*`, `regression-*` | `--cases adv-0..9`, then `adv-10..39` and `adv-h-0..119` with `--held-out`, sixteen batches, then `--summarize` | F2-A 40 of 40; (c) 120 of 120 at or above the median, 1.965 times random; brief 11's figures exactly |
| `../advice/tuning-final.json` | `--cases tuning` | the tuning set on the tested commit |
| `../final/` | `npx vite-node tools/interpretation.ts -- --st6r2 <out>/st6r2.json --st6r2-only`; `measure.sh <out> stage` | `st6r2.json` the acting area's byte for byte; `stage.json`, `st3.json` and `st6.json` brief 11's byte for byte |

The fresh set was refused without `--fresh` and was run by no test, probe or area before this. Its seeds are `adv-v-0` to
`adv-v-119`. Case n's band is `BAND_ORDER[floor(n / 30)]` and its stage `STAGE_ORDER[floor((n mod 30) / 10)]`, ten a
stratum (`tools/advice-harness.ts`). `measure.sh` writes "2 files
uncommitted" in `../final/exits.txt` because it counts untracked files too: the clone's `node_modules` link and this new
folder. The lane's own record, `exits-J.txt`, counts tracked files and says 0.

`tools/freshness.ts` writes into `docs/verification/connected-journey/`, so its output was copied here and that folder
put back as it was.
