# Brief 11's Final Runs, 2026-10-17

These are the checks brief 11's section 10 asks for, on the tested code: the build, the scenario saves, the built app at
1440 and 390, the long runs, the mastery plans, and the advice's cases. They ran in clones of the branch, a lane each,
through the scratchpad's `runs11.sh` (brief 10's lanes, its outputs here and in `../advice/`). Each step's exit is
recorded (`exits-A.txt` to `exits-D.txt`, and `../advice/exits.txt`), and every step exited 0. `figures.py` reads each
figure from these outputs into `figures.json`, which `../../integration-2026-10-16/criteria.py` reads for the matrix. The
gate ran after, on the commit `gate.txt` names on its first line.

## What Ran On Which Commit

- **On `3de26e0b`:** the engine's runs: the 24 lives, the workloads, the mastery plans, variety, freshness, and the
  advice's 40 F2-A cases, 120 held-out cases and the tuning set.
- **On `43a82efa`:** the build, the saves and the built app, once that commit had corrected three apostrophes in the
  ability look's comments, which changed a screen's source and no engine file.

They ran first on `81eadac9`. The tutorial's sentence on What To Work On and a comment on the 2027 work rule then changed
two files under `src/engine`. Those changed no simulation, but every engine and app measurement watches them. So the runs
were stopped and made again on `3de26e0b`. The judge's measurements (`../final/`) read neither file and stand on `81eadac9`.

## The Outputs

**Every output the engine's runs share with brief 10's final runs** (`../../integration-2026-10-16/runs-10/`) **is byte for
byte the same:** the 24 lives, all eight workloads, all six mastery plans, variety and freshness. The advice's held-out
summary has the same figure in all 390 fields the two share. It has more fields beside them: the clarified clauses' and
the tuning group's.

| Output | Command | Result |
|---|---|---|
| `build.log` | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 14 of 14 exit 0 (the saves aren't kept) |
| `acceptance/` | `npx vite preview --port 4185`, then `SLATE_BASE=http://localhost:4185 node tools/acceptance-ui.mjs <out> 1440 <saves>` and 390 | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows at 1440; 390 below |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --why --profile <p> --seed lives-<n> --years 3.2`, a life at a time | 24 lives: 20 graduated, the 4 dismissed the autopilot control's (Reykjavík), as on every run since 2026-10-10; breaches, unbalanced and errors 0 |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | as brief 10's: the seven attentive in good standing, London lives-0 neglected dismissed as the control is; breaches 0 |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | as brief 10's: 6 of 6 at 100 on every payoff tape |
| `variety-v-0.json` | `npx vite-node tools/variety.ts -- --seed v-0 --years 3` | as brief 10's |
| `freshness.json` | `npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1` | as brief 10's |
| `../advice/` | `npx vite-node tools/advice.ts -- --cases adv-0..9`, fifteen held-out batches, `--summarize`, `--cases tuning` | F2-A 40 of 40; F2-A10 (c) 120 of 120 at or above the median, 1.965 times random; (f) and (h) as clarified not borne out (`../integration-result.json`) |

The held-out files read `clean: false` on `3de26e0b`. They were committed from the run on `81eadac9`, so each batch
rewrote a tracked file while it ran. Every figure in them is the first run's.

`tools/freshness.ts` writes into `docs/verification/connected-journey/`, so its output was copied here and that folder put
back as it was.
