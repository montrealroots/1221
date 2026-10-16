# Brief 10's Acting Criteria Measured After The Judge Area's Changes, Before The Stamina Model, 2026-10-16

The same commands as `../baseline/README.md`, through `../measure.sh <this folder> <part>`, on `3abea596`, the judge
area's clone with every change of this area committed (`exits.txt`: every exit 0). The stamina area's workload model
isn't in this clone yet: H4-R's stamina lines, ST3-R and L3-R are measured finally once it is, and M1 on the integrated
code (`../criteria.md`, section 1; the area's instructions, The Order, 5). The genre parts (`signature*.json`,
`genre-identity.json`, `genre-audit.md`) were measured here too, for section 5.

## What Changed In The Judge Area, And What It Moved

| Change | Commit | What it moved |
|---|---|---|
| ST6's specialists on the even actor's budget (`tools/interpretation.ts`), and ST6-R measured as written | `94548b55` | a tool's defect: every ST6 figure until then compared 645.6 with 600 (`../baseline/README.md`) |
| `judgePieceExact`, split out of `judgePiece` so every shown figure can be checked against its own exact value | `94548b55` | no figure: the stage tool's three outputs byte for byte the same before and after |
| Two public meetings for scene study, An Enemy of the People's and Strife's (`content/scenes-meeting.ts`), read from their texts and committed before measuring | `6db8f797` | presence's own work 3 pieces to 5; the stage sets 189 cases to 193, ST6's against-grain set 42 to 44, drama's 30 to 32 |
| Two record-keeping tests told the meetings came after them | `1ba7e30c` | no figure |

No rule of the judge changed, so `RULESET` stays `evaluation-10 (2026-10-16)`: new material is judged by the rules as
they were, as the house scenes of brief 09 were.

## The Criteria After

| Criterion | Baseline | After | |
|---|---|---|---|
| ST3-R (a) to (d) | met on 189 | met on 193: 0 apart judged twice, replayed, drawn and after a save and a load; even and undrained 2.8e-14 apart and the same as shown; the specialist better on stage on 193; the drain on both media on 193; what's left ≤ 2.8e-14; 0 rounding defects on 772 judgments | met, pending the stamina model |
| ST3-R (e) | 6 of 6 killed | 6 of 6 killed (`mutations.json`) | met |
| ST3 as written (superseded) | 178 of 189 | 182 of 193 | not met |
| ST6-R (a) | 3 of 42 | **3 of 44** (earnest-2, wayoftheworld-4, orig-runway) | not met |
| ST6-R (b) | 94 of 94 | 96 of 96 | met |
| ST6-R (c) | not met | not met: abilities 0 against (a) − 10 points below 0; preparation 0 half-rehearsed against 3; circumstances 13.6% against 0% | not met |
| ST6-R (d) | 37 of 42, the expansive specialist ahead on 30 | 39 of 44, ahead on 32 | met |
| ST6-R (e) | 3 works, 1 family | 3 works, 1 family; limits from 30 works | not met |
| ST6-R (f) | 24 of 50 | 24 of 50 | met |
| ST6-R (g) | restraint's draws removed survives | the same: (b) stays 96 of 96 | not met, the criterion's (b) found unable to catch it |
| ST6 as written (superseded) | 10 of 42, 24 of 50 | 10 of 44, 24 of 50 | not met |
| H4-R budgets | 600 | 600 | met |
| H4-R (a) | 8 of 12 | **9 of 12**: presence 5 in 3 kinds; memory 119 and composure 92, briefs only; stamina 1 | not met |
| H4-R (b) | 11 of 12 | 11 of 12: presence 4 of 5, median 0.972; stamina 0 of 1 | not met (stamina) |
| H4-R (c) | 0 of 6,418 | 0 of 6,435; H2 on the set holds | met |
| H4-R (d) | 12 of 13 | 12 of 13 (`h4-indirect.json`); stamina's after-the-work benefit not shown | not met (stamina) |
| H4-R (e) | 2 of 2 killed | 2 of 2 killed | met |
| H4 as written (superseded), H5 | 1 of 12; H5 met | 1 of 12; H5 438 of 438, 29.2% within a point | |
| L3-R (a) to (e) | met | met, the same to the digit: the journeys play briefs, which nothing here changed; 363,432 monotonicity checks on 797 pieces, no fall | met, pending the stamina model |
| L3 as written (superseded) | fails 3 of 8 | fails 3 of 8 | not met |
| M1 | met | briefs 4,560, scenes 67, nights 30, casting 30, coursework 13; H4-R's set 3,188; ST5 2,574; F1 783: every case 100, 0 drawn off | met, pending the integrated code |

## Section 5's Others

Every criterion that held at the baseline holds: ST1 50 / 44 of 96, ST2 82 of 82, ST4 drama 25 / 7, comedy 14 / 16,
tragedy 4 / 18, ST5, ST7 97 of 97, ST8 82 of 82; F1 16 / 13 of 29, 783, 30 of 30, 27 of 27; F2 at 40 50 / 44 and 82 of
82, at 75 51 / 43 and 82 of 82; I1 to I5 on the designed and held-out briefs to the digit, and on the fresh set 2,574 of
2,574 at 100, I3 sd 3.42, I4 100%, I5 100%; A1 to A3, T2 (a), T3 (a), techniques past 90 (0 of 438), G3, G4, G5, M1, M3
(67 scenes), O1, O2, H2, H5, H7 (`criteria.txt`). S1 to S4 on all four samples and G2 (`signature.json`,
`signature-fresh.json`, `signature-validate.json`, `genre-identity.json`) are byte for byte `integrated-09/`'s; the
genre audit differs from it in one cell, drama's class scenes by the side they suit, 25 restrained and 7 expansive where
it was 5, the two meetings, and its isolation is as it was. F2 as written fails as before (67.6%).

The test file `tests/decisions-judge.test.ts`: 19 tests, exit 0, and each of nine mutations in a copy fails it
(`test-mutations.json`).
