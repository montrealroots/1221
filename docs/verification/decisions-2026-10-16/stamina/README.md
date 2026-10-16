# A Performance's Workload: What Was Measured, Before And After (2026-10-16, Brief 10)

The stamina area of the owner's brief 10, decision 5 (`../criteria.md`, section 4, W1 to W10, and M1), worked in its
own clone on branch `stamina` from `f17ae369`. Every file here was written by the command beside it; `before-*` on
`f17ae369`, before any code of the area changed, and `after-*` on the area's last code commit (named in
`../../remaining-10/stamina-result.json`). A first look for the judge area, which measures H4-R, ST3-R and L3-R
finally once the model is integrated.

| File | Command | Exit |
|---|---|---|
| `before-ag-baseline.json`, `after-ag-baseline.json` | `npx vite-node tools/ag-baseline.ts -- --out <file>` | 0, 0 |
| `before-ag-criteria.txt`, `after-ag-criteria.txt` | `node tools/ag-criteria.mjs <ag-baseline.json>` | 0, 0 |
| `before-st3-cases.json`, `after-st3-cases.json`; `before-interpretation.json`, `after-interpretation.json` | `npx vite-node tools/interpretation.ts -- --st3 <cases> --stage --out <file>` | 0, 0 |
| `before-journey-<profile>-bj-0.json` and `after-…` (`beginner`, `specialist`) | `npx vite-node tools/brief-journeys.ts -- --profile <p> --seed bj-0 --days 120 --write <file>` | 0, 0 |
| `workload-table.tsv` | the catalog's running times and workloads, printed by the engine's own functions from a probe (`probe/` is git-ignored; the table is what it printed) | 0 |
| `after-stamina-specialist.txt` | the stamina specialist against the even actor on each play's night as a lead and as a supporting part (a probe, its output kept) | 0 |
| `mutations.json` | each of 17 mutations applied in a copy of the tree, `tests/decisions-stamina.test.ts` run against it, the file put back byte for byte | 1 each (every one killed) |
| `test-files.txt` | every test file, one at a time (`VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx vitest run <file>`), on the area's code | 0 each: 369 files, 4,422 tests, none skipped |

The seeds: `ag-baseline` (the baseline's own key), `bj-0` (the journeys), and the played tests' own
(`tests/decisions-stamina.test.ts`: `stamina-w1`, `stamina-w2`, `stamina-w4`, `stamina-w5`, `stamina-w6`,
`stamina-w6-reload`, `stamina-w6-older`, `stamina-w8`, `stamina-w9`, `stamina-w10`, `stamina-run`).

What moved, measured (`../../remaining-10/stamina-result.json`, items `stamina.measure` and `stamina.A1`):

| | Before (`f17ae369`) | After (`2c190fe7`) |
|---|---|---|
| M1 | met: briefs 4,560, scenes 65, nights 30, casting 30, coursework 13 at 100 | met, the same |
| ST3 (as written) | 178 of 189 the same as shown, 0 rounding defects | the same: class scenes keep their load |
| L3 (as written), `bj-0` | specialist 65.5 → 64.3, beginner 54.0 → 56.8 | the same: 120 days from the fall hold no performance |
| H4 | 1 of 12 (stamina 5.4%) | 1 of 12 (stamina 5.9%) |
| H4′ (proposed) | presence 2/3; stamina ahead on the last segment of 29 of 30 nights | presence 3/3; 2 of 30 |
| A1 | met (stamina's nights 0.63) | **not met**: stamina's nights 0.32, judged as a supporting part; 0.50 as a lead |
| A2, H2, H5 | met (A2 0.532; H5 28.9% within a point) | met (A2 0.478; H5 28.2%) |

The baseline judges every night as a supporting part at the School. Under the workload a supporting part is on stage
half the evening and drains by its share, where every part was a whole evening's lead before; A1's regression is that,
and is for the owner (`stamina.A1`).
