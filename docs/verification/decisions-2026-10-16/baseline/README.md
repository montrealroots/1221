# Brief 10's Acting Criteria Measured Before Any Change To The Judge, 2026-10-16

The owner's brief `../../briefs-2026-10-16/10-approved-acting-advice-banking-and-stamina-decisions.txt`, section 1, and
its criteria `../criteria.md` (ST3-R, ST6-R, H4-R, L3-R, M1), committed in `2e8e4db3` before any of this was run. Measured
in the judge area's own clone on the engine as `44dcd973` (#36's merge) left it: the only change to the engine before
this measurement was `judgePieceExact`, split out of `judgePiece` in `94548b55`, and the stage tool's three outputs were
byte for byte the same before and after it. The tools that measure each clause were committed
first (`94548b55`, `c2a4b694`, `b3df7fdb`). The originals' results (`../../integration-2026-10-16/st3.md`, `st6.md`,
`h4.md`, `l3.md`, `integrated-09/`) are kept as they were; the stage and attribute figures below reproduce
`integrated-09/` exactly where they measure the same thing (`stage.json` byte for byte before the budget fix below,
`criteria.txt` line for line).

## The Commands

`../measure.sh <this folder> <part>`, one part at a time; every exit is in `exits.txt` (all 0). Seeds: the journeys
`bj-0` and `bj-1`; the stage and the acting criteria judge under `interpretation` with no draw (ST3-R (a)'s drawn replay
keys `st3r:<material>:<side>:drawn`); the attribute baseline under `ag-baseline` (draws `ag-a-<k>`, `ag-b-<k>`,
`ag-m-<k>`, `--draws 60`; H4-R's mastery keys `h4r-m-0` to `h4r-m-2`); the monotonicity sweep's drawn actors `mono-0` to
`mono-3`; the save for ST3-R (a)'s save and load `st3r`; the twin lives of H4-R (d) `h4d-<claim>`.

| Part | Command | Files |
|---|---|---|
| stage | `npx vite-node tools/interpretation.ts -- --fresh --stage --out stage.json --st3 st3.json --st6 st6.json` | `stage.json`, `st3.json` (ST3-R), `st6.json` (ST6-R, and on the old budget) |
| ag | `npx vite-node tools/ag-baseline.ts -- --out ag-baseline.json`; `node tools/ag-criteria.mjs ag-baseline.json` | `ag-baseline.json`, `criteria.txt` (H4-R (a) to (c), H2, H5, M1) |
| indirect | `npx vite-node tools/h4-indirect.ts -- --out h4-indirect.json` | H4-R (d) |
| journeys | `npx vite-node tools/brief-journeys.ts -- --profile <p> --seed <s> --days 120 --write journey-<p>-<s>.json --trace l3-trace-<p>-<s>.json`, four profiles on two seeds | L3-R (a) to (c), (e) |
| mono | `npx vite-node tools/monotonicity.ts -- --part <k> --of 4`, then `--merge` | `monotonicity.json`, L3-R (d) |
| l3r | `node tools/l3r.mjs <this folder>` | `l3r.json` |
| mutations | `node tools/judge-mutations.mjs --list ../mutations.json` | `mutations.json`: each mutation in a copy of the tree |

## What Was Found In The Profiles First: Unequal Budgets

`tools/interpretation.ts` built both ST6 specialists as `actor({ three abilities }, fill(235))` with
`fill = (n) => (600 − n) / 8`, and `actor` reads every ability not named at `fill`: nine are left, not eight, so each
specialist's twelve abilities totalled 235 + 9 × 45.625 = **645.6** against the even actor's 600. Every ST6 figure until
now compared those budgets; ST6′'s 26 of 42 (brief 09) among them. Corrected to `(600 − n) / 9` (40.56 each), and every
ST6-R output prints its budgets. ST3's voice-and-body specialist ((600 − 170) / 10 over ten) and ag-baseline's twelve
specialists ((600 − 85) / 11 over eleven) were already at 600.

What it changed (`st6.json`, `ST6R` against `ST6RAtTheBudgetBefore`):

| | At 645.6 (as built until now) | At 600 (the criteria's budget) |
|---|---|---|
| ST6 as written, restrained / expansive | 9 of 42 / 22 of 50 | 10 of 42 / 24 of 50 |
| ST6′ (brief 09's proposal) | 24 of 42 | **5 of 42** |
| ST6-R (a), the restrained specialist ahead of the even actor's better side | 24 of 42, met | **3 of 42, not met** |

## The Criteria Before Any Change

| Criterion | Before | |
|---|---|---|
| ST3 as written (superseded) | 178 of 189 the same as shown | not met |
| ST3-R (a) identical inputs | judged twice, replayed, replayed with its draw, and after a save and a load: 0 apart on 189; even and undrained on stage and close 2.8e-14 apart, the same as shown on 189 | met |
| ST3-R (b) legitimate demands | the specialist better on stage on 189 of 189 (by 0.115 at least); the drain on both media on 189 (0.599 at least), and its part of the difference above 1e-9 on 189 (4.7e-6 at least) | met |
| ST3-R (c) every difference attributed | techniques ≤ 0.0026, stamina ≤ 0.0170, what's left ≤ 2.8e-14 | met |
| ST3-R (d) rounded once | 0 defects on 756 judgments (every whole, dimension, segment, limit and grain point; each whole worked by hand) | met |
| ST3-R (e) | the whole by floor, from rounded dimensions, from rounded segments; both leans 1; the drain 0; the grain leaking: each killed | met |
| ST6 as written (superseded) | restrained 10 of 42, expansive 24 of 50 | not met |
| ST6-R (a) viable | 3 of 42 (7.1%): earnest-2, wayoftheworld-4, orig-runway | **not met** |
| ST6-R (b) restraint's craft pays | 94 of 94 | met |
| ST6-R (c) success depends | abilities: the even actor 0 of 42, but (a) − 10 points is below 0; preparation 0 half-rehearsed against 3; circumstances 14.3% against 0% (20 points asked); every win allowed | **not met** |
| ST6-R (d) limits kept | 37 of 42 behind (88%); the expansive specialist ahead on 30 of the 37 | met |
| ST6-R (e) diverse | 3 works, 1 family (comedy) | **not met** |
| ST6-R (f) the other half | 24 of 50 (48%; 24 as shown) | met |
| ST6-R (g) | restraint's draws removed: **survived** ((b) still 94 of 94, and 92 of 94 with its lean removed too); suitability forced to its least: (a) and (c) fail, as they do unmutated; the grain 0: (c) fails, as it does unmutated | **not met** |
| H4 as written (superseded) | 1 of 12 | not met |
| H4-R budgets | even 600, every specialist 600 | met |
| H4-R (a) opportunities | 8 of 12: presence 3 own pieces; memory 119 and composure 92, all briefs; stamina 1 | **not met** |
| H4-R (b) advantage | 11 of 12: stamina 0 of 1 (median −0.063); the rest 2/3 to 214/214, medians 0.755 to 1.972 | **not met** |
| H4-R (c) no erased weakness | 0 of 6,418 pairs under a tenth ahead; H2 on the set holds (the most: emotional depth 183 of 657 briefs) | met |
| H4-R (d) direct and indirect apart | 12 of 13 claimed benefits shown by twin lives; stamina's (a night leaves the same 89.9 energy at 20 and 80) not | **not met** |
| H4-R (e) | listening cut to a tenth fails its (a)/(b); a specialist over twelve fails the budgets | met |
| H5 | 436 of 436, 28.9% within a point; on H4-R's set 795 of 795, 170 within a point | met |
| L3 as written (superseded) | fails on 3 of 8 journeys (specialist bj-0 65.5 → 64.3, bj-1 63.4 → 62.3; generalist bj-0 62.4 → 62.3) | not met |
| L3-R (a) to (e) | 24 fixed pieces; 8 journeys; growth 1.353 (generalist bj-1) to 3.193; 35 falls, every one stamina's and explained; 362,520 monotonicity checks, no fall; the mix and L3 beside it | met |
| M1 | briefs 4,560, scenes 65, nights 30, casting 30, coursework 13 at 100, 0 drawn off; H4-R's set 3,180 of 3,180; ST5 2,520 of 2,520; F1's 783 of 783 | met |

Every other criterion of `criteria.txt` and `stage.json` is as `integrated-09/` had it (ST1 50 / 42 of 94, ST2 80 of 80,
ST4 drama 25 / 5, comedy 14 / 16, tragedy 4 / 18, ST5, ST7 95 of 95, ST8 80 of 80, F1, F2; I1 to I5; A1 to A3, T2, T3,
G3 to G5, M1, M3, O1, O2, H2, H5, H7), F2 as written failing as before (67.6%).
