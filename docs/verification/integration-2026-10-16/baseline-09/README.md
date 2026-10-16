# Brief 09's Baseline: The Stage And The Attributes Measured Again Before Any Change, 2026-10-16

The owner's brief `../../briefs-2026-10-16/09-remaining-integration-gaps-and-completion-evidence.txt`, section 2:
"Reproduce ST3, ST6, H4, and L3 on the current code before changing them. Preserve the original results and criteria."
Measured on `d7127819` (the shared branch with the brief added; the engine as `64b69fc7`, #35's merge, left it), in the
judge area's own clone, before any code of this area changed. The original results and criteria are kept where they
were: `../st3.md`, `../st6.md`, `../h4.md`, `../l3.md`, `../closeout/`, and the criteria in
`../../stage-2026-10-16/criteria.md` and `../../attributes-genres-2026-10-16/acceptance-criteria.md`.

## The Commands And Their Files

Every run is deterministic: the tools judge with no draw (`expected`) except where a seed is named.

| What | Command | File | Exit |
|---|---|---|---|
| ST1 to ST9, F1, F2, I1 to I5 | `npx vite-node tools/interpretation.ts -- --fresh --stage --out stage.json` | `stage.json` | 0 |
| The attributes (A to O, H1 to H7, M1) | `npx vite-node tools/ag-baseline.ts -- --out ag-baseline.json`, then `node tools/ag-criteria.mjs ag-baseline.json` | `ag-baseline.json`, `criteria.txt` | 0, 0 |
| L1 to L3, the specialist | `npx vite-node tools/brief-journeys.ts -- --profile specialist --seed bj-0 --days 120 --write journey-specialist-bj-0.json --trace l3-trace-specialist-bj-0.json` | both | 0 |
| L1 to L3, the beginner | the same with `--profile beginner` | both | 0 |
| S1 to S4, designed and held out | `npx vite-node tools/genre-signature.ts -- --out signature.json` | `signature.json` | 0 |
| S1 to S4, fresh | `npx vite-node tools/genre-signature.ts -- --fresh --out signature-fresh.json` | `signature-fresh.json` | 0 |
| G1 as written, G2 | `npx vite-node tools/genre-identity.ts -- --out genre-identity.json` | `genre-identity.json` | 0 |
| The genre audit's isolation | `npx vite-node tools/genre-audit.ts -- --out genre-audit.md` | `genre-audit.md` | 0 |

Seeds: the journeys' `bj-0`; the attribute baseline keys its draws `ag-a-<k>`, `ag-b-<k>` and `ag-m-<k>` under the seed
`ag-baseline` (`--draws 60`); the stage and the interpretation measures judge under the seed `interpretation` with no
draw.

## What Came Out

**The same as the last pass's close-out, to the byte where the file is the same kind.** `signature.json`,
`signature-fresh.json`, `genre-identity.json` and `genre-audit.md` are identical to `../closeout/`'s; `criteria.txt` is
identical to what `ag-criteria.mjs` makes of `../closeout/ag-baseline.json`; both L3 traces give the same months as
`../closeout/l3-trace-*-bj-0.json`. The engine hadn't changed since the close-out was measured.

| Criterion | As Written | Measured Here |
|---|---|---|
| **ST3** | the voice-and-body specialist better on stage on every case; the even actor's result the same on both | specialist 179 of 179; even actor the same on **165 of 179** (14 a tenth apart): **not met**. The cases are 179, not `../st3.md`'s 171: the four drama scenes of `scenes-public.ts` (`../st6.md`) added eight, each the same on both |
| **ST6** | each specialist ahead playing its own side on 25% of the materials where the other side suits better | expansive 21 of 49 (42.9%); restrained **8 of 38 (21.1%)**: **not met** |
| **H4** | each specialist ahead on 60% of the pieces where its ability reads most, for 10 of 12 | **2 of 12** (emotional depth 85.0%, listening 66.4%): **not met** |
| **L3** | the last month's mean of takes at or over the first's, every non-mastered profile | specialist 65.5 (2 takes) → 64.1 (14): **not met**; beginner 54.0 (1) → 56.6 (16): met |
| ST1, ST2, ST4, ST5, ST7, ST8 | | 49 / 37 of 89; 75 of 75; drama 25 / 4, comedy 13 / 15, tragedy 4 / 16; 2,385 of 2,385; 88 of 90; 75 of 75: met |
| F1, F2 | | nights 16 / 13 of 29, 783 of 783 at 100, 29 of 30, 27 of 27; at 40 49 / 39 and 75 of 75, at 75 51 / 38 and 75 of 75: met |
| I1 to I5 | | I1 8,010, 9,117 and 2,385 at 100; I2 pace 24.2%, scale 20.8%, structure 32.9%; I3 sd 1.28, 1.19, 3.43; I4 54.3% and 47.3%, the even actor 100%; I5 99.3%, 98%, 97.8%: met |
| The attributes | | A1 to A3, T2 (a), T3 (a), techniques past 90, G3, G4, G5, M1, M3, O1, O2, H2, H5, H7 met; H4 and F2 as written not met (`criteria.txt`) |
| M1 | | briefs 4,495 of 4,495, scenes 60 of 60, nights 30 of 30, casting 30 of 30, coursework 13 of 13 at 100; 0 drawn off: met |
| S1 to S4 | | S1, S2 revised, S3 revised and S4 hold on all four samples (S3 revised 88.8%, 82.9%, 87.4%, 82.0%); the original S2 and S3 as before |
| G2, the genre audit | | G2 0; knowing a genre helps its own brief in 149 of 149 and moves another's in 0; 55 to weigh |
| L1, L2 | | the longest run of one recommendation 4 weeks and 3; the same take twice in a row 0 and 0; breaches and unbalanced entries 0 |
