# The Final Runs, 2026-10-16

Each output of the integration pass's final measurements, played on `d1452195` from a copy of the tree (`git archive`).
The code since differs by one comment's apostrophe (`src/ui/looks/papers.tsx`), so every figure here is the final
code's. The account is `../README.md`, "What The Pass Did, And What It Measured".

| File | Command |
|---|---|
| `lives.jsonl` | `npx vite-node tools/lives.ts -- --years 3.2` |
| `variety-v-0.json` | `npx vite-node tools/variety.ts -- --seed v-0 --years 3` |
| `advice-cases.json`, `advice.txt` | `npx vite-node tools/advice.ts -- --from 0 --to 40 --out advice-cases.json` |
| `plan-<genre>-<seed>.json` | `npx vite-node tools/mastery.ts -- --mode plan --genre <genre> --seed <seed> --years 8` |
| `workload-<profile>-<seed>-<policy>.json` | `npx vite-node tools/workload.ts -- --seed <seed> --profile <profile> --years 1.4 --policy <policy> --out <file>` |
| `freshness.json` | `npx vite-node tools/freshness.ts -- --months 4 --seeds fr-0,fr-1` (it writes `docs/verification/connected-journey/`; the copy's is kept here, and the committed page is the held-out run's) |
| `saves/` | `node tools/scenario-saves.mjs <dir>`: each scenario's log and `exits.txt`; the saves themselves (9.9 MB) aren't kept, and the command writes them again |
| `acceptance/` | `npm run build`, `npx vite preview --port 4182`, then `SLATE_BASE=http://localhost:4182 node tools/acceptance-ui.mjs <out> 1440 <saves>` and the same at 390 |

The four plans first asked for `nordic-noir` and `social-realism` ran with ids the catalog doesn't have (it writes
`nordic_noir`, `social_realism`) and threw before playing; they were run again with the catalog's ids, and those are the
files here.
