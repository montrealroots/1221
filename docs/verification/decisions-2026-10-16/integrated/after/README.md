# Brief 10's Acting Criteria On The Integrated Code, After The Judge Area's Second Phase, 2026-10-16

The same commands as `../before/README.md`, through `../../measure.sh <this folder> <part>`, on `167f996b`, the judge
area's second phase with every change of it committed (`judge-2.md`, The Work, 7). Every exit is 0 (`exits.txt`, 36
commands). Its first line says one file was uncommitted: this folder, with the probes' outputs below in it, and nothing
else. The mutations ran as `--only` parts of the two committed lists, four at a time, and were merged into
`mutations.json` and `test-mutations.json` in the lists' order; each part's command and exit is in `exits.txt`.

## What This Phase Changed, Under `evaluation-11`

`evaluation-11` hadn't left this branch, so each change is part of it, and its row in `docs/ENGINE-MODEL.md` says so
(`judge-2.md`, The Work, 6). Commits `d9ee7586` (the rules and their tests) and `167f996b` (ST6-R (b′) and the mutations).

| Coefficient | Was | Now | The testing that set it |
|---|---|---|---|
| `PIECE.drain` (`content/piece.ts`) | 0.3 | 0.4 | `drain-grid-*.json`: on the 797 pieces H4-R reads, stamina's own work was 1 piece at 0.3, 6 (scenes only) at 0.35, 12 in two kinds at 0.37 (ahead on 11, median 0.63, a brief's mean +10 effect 0.511), 37 in two kinds at 0.4 (ahead on 37, median 0.81, 0.552); H2 and H5 held at each |
| `WORKLOAD.full` (`content/workload.ts`) | 2.686 | 3.581, 4/3 of it | so the anchor's lead still drains 0.3 at its curtain and no night short of the anchor drains more: with 0.4 at 2.686, every night drained a third more and `ur-1-journey.txt`'s student who keeps up was dismissed on two runs' nights at 47.3 to 49.9; at 3.581 she graduates. `drain-grid-0.4-1.333.json` is the pair taken |
| `PART_TEXT` (`content/approaches.ts`, new) | a night read no text of its own | half a unit of `DEMAND_EFFECT.text` for each hour the part is on stage past its first, to 2 at most | `part-text-*.json` (with the drain at 0.4 and `WORKLOAD.full` and the stakes as they were): a unit an hour from the start put memory's specialist best on 22 of 30 nights and 24 of 30 casting reads, past H2; a unit an hour past the first took presence's Major Barbara night, its fifth piece; half a unit past the first kept both |
| `NIGHT_STAKES` (`content/approaches.ts`, new) | a night read a play's stakes, 1 | 1.5 | the direction from performance-anxiety research (Fredrikson & Gunnarsson 1992; Yoshie et al. 2009; Harmat & Theorell 2010; Latané & Harkins 1976 on audience size), cited where the rule is; the size from `night-stakes-*.json`: 1.25 gave composure no second kind, 1.75 and 2 took presence's Major Barbara night, 3 put composure's specialist best on 20 of 30 nights, past H2 |

Each probe's source is kept beside its outputs (`*-probe.ts.txt`; `probe/` is git-ignored). The drain grid's first five
files ran before the part's text and the night's stakes existed, the last two (`-1.333`, `-1.233`) on the code as
committed.

Memory's second kind was authorized; composure's needed a source, and the four above settle that an audience and an
evaluation carry more pressure than private work. They don't size it, and the half step is SLATE's, said where it is.

## The Criteria, Before And After This Phase

| Criterion | Before (`../before/`) | After | |
|---|---|---|---|
| ST3-R (a) | met on 193: 0 apart judged twice, replayed, drawn, after a save and a load; even and undrained 2.8e-14 apart | the same | met |
| ST3-R (b) | the specialist better on stage on 193 (least 0.115); the drain on both media on 193 | the same | met |
| ST3-R (c) | largest apart 0.0184: techniques 0.0026, stamina 0.0170, left 2.8e-14 | 0.0239: techniques 0.0026, stamina 0.0227, left 2.8e-14 | met |
| ST3-R (d) | 0 defects on 772 judgments | the same | met |
| ST3-R (e) | 6 of 6 killed | 6 of 6 killed | met |
| ST3 as written | 182 of 193 | 185 of 193 | not met |
| ST6-R (a) | 3 of 44 (earnest-2, wayoftheworld-4, orig-runway) | **2 of 44** (earnest-2, orig-runway) | not met |
| ST6-R (b) | 96 of 96 | 96 of 96 | met |
| ST6-R (c) | abilities 0 against −0.0318; preparation 0 against 3; circumstances 13.6% against 0% | abilities 0 against −0.0545; preparation 0 against 2; circumstances 9.1% against 0% | not met |
| ST6-R (d) | 39 of 44, the expansive specialist ahead on 32 | 41 of 44, on 32 | met |
| ST6-R (e) | 3 works, 1 family | 2 works, 1 family | not met |
| ST6-R (f) | 24 of 50 | 24 of 50 | met |
| ST6-R (g) | `st6-no-draws` survives | survives: (b) stays 96 of 96 | not met |
| ST6-R (b′), proposed, not counted | — | 96 of 96, the draws' part 0.329 at least; killed by restraint's draws removed (`st6-no-draws-proposed`) | met, proposed |
| ST6 as written | 10 of 44, 24 of 50 | 11 of 44, 24 of 50: the floor, 25%, to the case | met, superseded |
| H4-R budgets | 600 | 600 | met |
| H4-R (a) | 9 of 12: memory 119 and composure 92 briefs only; stamina 1 | **12 of 12**: memory 115 (briefs 111, nights 3, casting 1), composure 95 (briefs 92, nights 1, casting 2), stamina 37 (briefs 24, scenes 13); presence 5 in 3 kinds | met |
| H4-R (b) | 11 of 12: stamina 0 of 1, median −0.063 | **12 of 12**: stamina 37 of 37, median 0.807; memory 114 of 115, 1.68; composure 95 of 95, 1.632; presence 4 of 5, 0.912 | met |
| H4-R (c) | 0 of 6,423; H2 on the set holds | 0 of 6,378; H2 on the set: brief emotional depth 181 of 657, scene listening 17 of 67, night discipline 7 of 30, casting composure 7 of 30 | met |
| H4-R (d) | 13 of 13; stamina 94.275 energy left at 20, 96.15 at 80 | 13 of 13, the same figures (`h4-indirect.json`) | met |
| H4-R (e) | 2 of 2 killed | 5 of 5 killed (`h4-tenth`, `h4-budget`, `h4-drain-back`, `h4-no-part-text`, `h4-no-night-stakes`) | met |
| H4-R H5 | 797 of 797; 169 within a point | 797 of 797; 183 | met |
| H4 as written | 1 of 12 (stamina 5.8%) | 1 of 12 (stamina 38.6%) | not met |
| A1 | fails for stamina: brief 0.39, scene 0.40, night 0.32 | met: stamina brief 0.53, scene 0.54, night 0.33 | met |
| L3-R (a), (b), (d), (e) | met; 363,432 checks, no fall | met; 363,432 checks, no fall | met |
| L3-R (c) | least growth 1.433, 32 falls, every one stamina's | least 1.253, 68 falls, every one stamina's, none unexplained | met |
| L3 as written | fails 3 of 8 | fails 2 of 8 (generalist bj-0 62.2 → 61.8, specialist bj-0 65.2 → 64.5) | not met |
| M1 | every case 100: briefs 4,560, scenes 67, nights 30, casting 30, coursework 13; H4-R's set 3,188 | the same | met |

A1 reads a night as `tools/ag-baseline.ts` does, a supporting part, and that wasn't changed (`judge-2.md`, The Work, 2).
Both figures, stamina's mean +10 effect over the 30 nights (`a1-nights.json`, `a1-nights-before.json`): a lead 0.482
before and 0.487 after, a supporting part 0.333 and 0.334, a featured part 0.138 and 0.138. A night drains as it did, by
the anchor's design, so A1 is met by briefs and scenes, not nights; read at a lead it would be 0.487, short of 0.5.

## Section 5's Others

ST1 50 / 44 of 96, ST2 82 of 82, ST5 2,574 of 2,574, ST7 97 of 97, ST8 82 of 82: the same. F1 (the plays as a night, a
supporting part's text and stakes from this phase): 16 / 13 of 29, 783 of 783, 30 of 30, 27 of 27, the same. F2 at 40
50 / 45 and 82 of 82, at 75 52 / 42 and 82 of 82. I1 to I5 hold: I1 every case at 100 (8,010, 9,378 and 2,574), I2 the
better side differing in 26.8%, 23.5% and 35.6% of genres (20% asked), I3's standard deviation 1.26, 1.14 and 3.38 (1.0
asked), I4's specialist 54.3% and 44.3% (25% asked) and the even actor 100%, I5 99.3%, 98% and 100% (80% asked). A2 0.444, A3, T2 (a), T3 (a),
techniques past 90 (0 of 438), G3, G4, G5, M3, O1, O2, H2 (brief emotional depth 93 of 298, scene listening 17 of 67,
night discipline 7 of 30, casting emotional depth 6 of 30), H5 (131 within a point, 29.9%) and H7 meet (`criteria.txt`).
F2 as written fails as before, 68.9% where 80% is asked. S1 to S4 on all four samples and G2 hold as before, every
verdict the same; their figures moved in the third place (S3 revised 0.814 to 0.813, G2's ratio 0.892 to 0.889), and the
genre audit's isolation is the same line for line (`genre-audit.md`). W1 to W10 (`tests/decisions-stamina.test.ts`,
21 tests), AR1 to AR8 (`tests/decisions-arion.test.ts`) and F2-A10 (`tests/decisions-advice.test.ts`) pass.

## What Moved The Wrong Way, And Why

- **ST6-R (a), 3 of 44 to 2**: The Way of the World's fourth scene. The restrained specialist's nine other abilities are
  40.56, its stamina among them, and the deeper drain costs it more than the even actor at 50. (a) was failing and
  remains the owner's decision (`../../remaining-10/judge-result.json`).
- **ST6-R (e), 3 works to 2**: the same scene.
- **L3-R (c)'s falls, 32 to 68**: every one stamina's, which the journeys never train, so every one explained; the least
  growth fell from 1.433 to 1.253, still growth.
- **H4′ (proposed, not counted)**: presence 4 of 5 where it was 5 of 5. Presence's own work stays 5 pieces in 3 kinds,
  and H4-R (b) counts it 4 ahead of 5, 80%.
- **A played journey's path**: `ur-1-journey.txt`. At 39380191 the student had concerns at terms 1 and 4; with this
  phase's code, at terms 1 and 3 and a warning at term 4, and she graduates. Its runs differ because every judged piece
  feeds what follows.

## The Tests

Every test file, one at a time in four lanes (`VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1`): 372 files, 4,471 tests, every
exit 0. `tests/decisions-judge.test.ts` holds 23 tests, four of them this phase's, and each of 15 mutations in a copy fails
it (`test-mutations.json`).
