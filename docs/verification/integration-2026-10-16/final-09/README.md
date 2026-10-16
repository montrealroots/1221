# Brief 09's Close-Out For The Stage And The Attributes: Everything Measured Again, 2026-10-16

judge.md, The Order, 6: "Everything measured again after your changes." Measured at `e48f0b68`, the judge area's last
commit of engine code. The commits after it change none: the coverage record regenerated from its tables, the types of
a test, this file and the result. The commands are `baseline-09/README.md`'s, with the
stage tool's `--st3` and `--st6` added, run one after another by one script; every exit is in `exits.txt` (all 0). Seeds
as there: the journeys' `bj-0`, the attribute baseline's draws under `ag-baseline`, the stage's judgments under
`interpretation` with no draw.

**What changed in the judge's content between the two:** the four scenes played out to a house (`content/scenes-house.ts`,
four profiles in `content/material.ts`), appended. No rule, weight or constant of the judge changed, so `RULESET` stays
`evaluation-9` (`docs/ENGINE-MODEL.md` §10). The tools gained the ST3 and ST6 traces, the H4 account and H4′, and the
journeys' monthly levels; none changes a figure they reported before.

## Every Criterion, Before And After

| Criterion | Before (`baseline-09/`) | After (here) | |
|---|---|---|---|
| **ST3** | specialist 179 of 179; even actor the same 165 of 179 | 187 of 187; **173 of 187** (the eight new cases the same); 0 rounding defects | not met as written; ST3′ proposed (`../st3.md`) |
| ST1 | 49 / 37 of 89 | 49 / 41 of 93 | holds |
| ST2 | 75 of 75 | 79 of 79 | holds |
| ST4 | drama 25 / 4, comedy 13 / 15, tragedy 4 / 16 | drama 25 / 5, comedy 13 / 16, tragedy 4 / 18 | holds |
| ST5 | 2,385 of 2,385 at 100 | 2,493 of 2,493 | holds |
| **ST6** | expansive 21 of 49; restrained **8 of 38** | 21 of 49; **8 of 42** (four new expansive-suited scenes, none a restrained win) | not met as written; ST6′ proposed (`../st6.md`) |
| ST7 | 88 of 90 | 91 of 94 (96.8%) | holds |
| ST8 | 75 of 75 | 79 of 79 | holds |
| ST9 | I1 to I5, S1 to S4, the camera briefs, G2 | the same, below | holds |
| F1 | nights 16 / 13 of 29; 783 of 783; 29 of 30; 27 of 27 | the same (no new play) | holds |
| F2 | at 40 49 / 39, at 75 51 / 38; ST8 75 of 75 each | at 40 49 / 43, at 75 51 / 42; 79 of 79 each | holds |
| I1 | 8,010, 9,117, 2,385 at 100 | 8,010, 9,117, 2,493 | holds |
| I2 | pace 24.2%, scale 20.8%, structure 32.9% | the same | holds |
| I3 | sd 1.28, 1.19, 3.43 | 1.28, 1.19, 3.46 | holds |
| I4 | 54.3%, 47.3%; the even actor 100% | the same | holds |
| I5 | 99.3%, 98%, 97.8% | 99.3%, 98%, 96.8% | holds |
| A1 to A3, T2 (a), T3 (a), past 90, G3, G4, G5, M3, O1, O2, H7 | met | met (`criteria.txt`) | hold |
| **M1** | briefs 4,495, scenes 60, nights 30, casting 30, coursework 13 at 100; 0 drawn off | scenes 64 of 64, the rest the same | holds |
| **H2** | scene: listening 20 of 60 | scene: listening 20 of 64 | holds |
| **H4** | **2 of 12** | **2 of 12** (presence 9.5% → 10.5%, vocal 49.7% → 56.2%) | not met as written; H4′ proposed (`../h4.md`) |
| H4′ (proposed, not counted) | 10 of 12 on own work; stamina 29 of 30 last segments | 11 of 12; 29 of 30 | not met: stamina's one own piece |
| **H5** | 431 of 431; within a point 26.9% | 435 of 435; 27.6% | holds |
| F2 as written | 67.6%: not met | 67.6%: not met | as before; superseded for advice by F2-A, not this area's |
| **L3** | specialist 65.5 → 64.1; beginner 54.0 → 56.6 | the same | not met as written for the specialist; L3′ proposed (`../l3.md`) |
| L3′ (proposed, not counted) | | every take at each month's levels: 61.56 → 65.14 and 54.42 → 57.44; 0 falls | |
| L1, L2 | 4 and 3 weeks; 0 and 0 | the same | hold |
| S1 to S4, all four samples | `baseline-09/signature*.json` | byte-identical | hold |
| G2 | 0 | 0 (`genre-identity.json` byte-identical) | holds |
| The audit's isolation | 149 of 149 helps its own, 0 another's | the same; only its stage-scene counts changed, by the new scenes | holds |
| Breaches and unbalanced entries, both journeys | 0, 0 | 0, 0 | hold |

No criterion that held before fails after.

## The Suite's Judge Tests

Run one file at a time (`VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx vitest run <file>`): before, the 51 files that import
the judge, 1,036 tests, every file exit 0. After, those 51 and the six more that read the scene catalog or are this
area's (`tests/remaining-judge.test.ts`, `tests/scenes.test.ts`, `tests/learning.test.ts`, `tests/feedback.test.ts`,
`tests/defects-g8-9.test.ts`, `tests/playreading.test.ts`): 57 files. 56 exited 0 at once. `tests/genre-coverage.test.ts`
failed one test, "the coverage record > is what the tables say, and accounts for every genre once": the record
(`docs/GENRE-COVERAGE.md`) is generated from the tables and counts each genre's coursework scenes, and the four new scenes
added one to Comedy, Fairy Tale, Historical Drama and Political Drama. Regenerated (`npx vite-node tools/genre-coverage.ts`),
it passed, 6 of 6. In all 1,074 tests passed and none failed. `tests/remaining-judge.test.ts`'s types were then corrected
for the typecheck (the ways of playing written as literals, not a mapped record) and it passed again, 7 of 7.

## The Checks

`npx tsc -b --noEmit` 0 (after that correction; it was 2 before it), `npm run lint` 0, and every check the gate runs after
the suite, each 0: title-case, label-sweep, plural-check, voice-check, tics, doc-refs, wired, deciders, spelling, typos,
geo-check, inventory, devmap, traceability, capabilities, coverage, student-matrix. The suite as a whole wasn't run, by
the pass's rule (one file at a time).
