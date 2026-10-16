# Brief 09's Final Runs, 2026-10-16

The checks section 7 of the owner's brief asks for, on the tested commit. The gate ran on `7c1198a2` (`gate.txt`, its exit
at the end). The build, the scenario saves, the built app and the long runs were played on `bcd75970`, which differs from
`7c1198a2` in no file under `src`, `tools`, `index.html` or `vite.config.ts`: what came between is the audit's fold.
`figures.py` reads each figure from these outputs into `figures.json`, which `../criteria.py` reads for the completion
matrix.

The runs went in two scripts at once, to finish inside the background limit: `exits.txt` (the build, the saves, the
built app, the 24 lives, then the same workload and plans again until the limit stopped it during the fifth plan) and
`exits-parallel.txt` (the workload, the mastery plans, the advice, variety and freshness). Every exit in both is 0. The
eight workload runs and the four plans both finished came out byte for byte alike in each.

| Output | Command | Result |
|---|---|---|
| `gate.txt` | `npm run gate`, the exit to a file | exit 0: 368 files, 4,401 tests, none skipped; all eighteen checks |
| `exits.txt` (build) | `npm run build` | exit 0 |
| `saves/` | `node tools/scenario-saves.mjs <dir>` | 14 of 14 exit 0; breaches 0, unbalanced 0 (the saves, 9.9 MB, aren't kept) |
| `acceptance/` | `npx vite preview --port 4183`, then `SLATE_BASE=http://localhost:4183 node tools/acceptance-ui.mjs <out> 1440 <saves>` and 390 | 72 passed, 0 failed, 0 skipped, 0 errors, 0 overflows at each width |
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --years 3.2` | 24 lives: 20 graduated, 4 of 4 in each of London, Mexico City, New York attentive and practicing, and Scraping with the flu and an injury; the 4 dismissed the autopilot control's (Reykjavík), as on every run since 2026-10-10; breaches, unbalanced and errors 0 |
| `workload-*.json` | `npx vite-node tools/workload.ts -- --seed <s> --profile <p> --years 1.4 --policy <q> --out <file>` | the seven attentive in good standing; London lives-0 neglected dismissed, as the control is; breaches 0 |
| `plan-*.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <g> --seed <s> --years 8` | 6 of 6 at 100 on every payoff tape, each mastered three or four days sooner than the last pass's; graduated; breaches 0 |
| `advice-cases.json`, `advice.txt` | `npx vite-node tools/advice.ts -- --from 0 --to 40 --out <file>` | F2-A 40 of 40 |
| `variety-v-0.json` | `npx vite-node tools/variety.ts -- --seed v-0 --years 3` | graduated; breaches 0, unbalanced 0; 10 distinct top recommendations over 157 weeks, none at full, the longest unresolved 2 weeks; 2,112 hours of practice, each hour's feedback different, **the same situation 4 in a row at most** (3 on the last pass's run: a figure, no criterion's limit); 33 director's notes, none said again after taken |
| `freshness.json` | `npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1` | eight runs: no take or scene repeated for the beginner, developing and specialist profiles, no advice kept for an input at full; the mastered profile retapes 0.549 and 0.525 of its takes, each an earned callback (0.545 and 0.563 on the last pass's) |
