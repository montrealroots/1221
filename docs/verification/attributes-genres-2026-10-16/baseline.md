# The Baseline, Measured Before Any Tuning

Phase 1 of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay".
Every number below is a measurement on the code as it stood, against the criteria in `acceptance-criteria.md`, which
were written first. Nothing in the engine was changed.

## The Revision

- **Read and measured at:** `6808cfc761b589f87e6bdd6197b631f2c9c7a55d` (`git rev-parse HEAD` when the work began).
- **During the work:** other agents committed `e6de60dc` and `3b666744` (banking and the ledger) and kept editing
  `src/engine/core/ledger.ts`, `simulation.ts`, `invariants.ts` and `systems/lending.ts`.
- **What they touched:** none of the attribute or genre files. That is every file under `formulas.md`'s references:
  `content/{abilities,tasks,approaches,piece,practice,genres,engagement,material,coursework,demands}.ts`,
  `content/briefs/`, and `systems/{evaluation,attributes,briefs,piece,ensemble,practice,engagement,school,coursework,
  material,production,experience,life}.ts`. `git diff --stat 6808cfc7 HEAD` and `git diff --stat HEAD` over them are
  both empty.
- **What that means for each kind of figure:**
  - The static figures (§1 to §9) depend only on those files, so they hold for `3b666744` too.
  - The played runs (§10, §11) ran the whole engine, the banking edits in progress among it. They report 0 breaches
    and 0 unbalanced entries.
  - One played run was retried: its first attempt met a half-written `ledger.ts` and didn't start.

## Commands

Run one at a time, from the repository root. Each is a read-only harness or an existing played tool, writing only into
this directory.

| § | Command | Output |
|---|---|---|
| 1 to 9 | `npx vite-node tools/ag-baseline.ts -- --out docs/verification/attributes-genres-2026-10-16/baseline.json` (draws keyed `ag-a-<k>`, `ag-b-<k>`, `ag-m-<k>`, 60 a brief; drawn actors from an LCG seeded 12345) | `baseline.json` |
| genres | `npx vite-node tools/ag-genres.ts 6808cfc761b589f87e6bdd6197b631f2c9c7a55d` (reads `baseline.json`) | `genres-matrix.json` |
| 10 | `npx vite-node tools/brief-strategies.ts -- --seeds bs-0,bs-1,bs-2 --write docs/verification/attributes-genres-2026-10-16/played-brief-strategies.json` and the same with `--seeds bs-10,bs-11,bs-12 --write …/played-brief-strategies-held-out.json` | `played-brief-strategies*.json` |
| 11 | `npx vite-node tools/brief-journeys.ts -- --profile beginner --seed bj-0 --days 120 --write …/played-journey-beginner-bj-0.json`, and `--profile specialist` | `played-journey-*-bj-0.json` |

`tools/ag-baseline.ts` and `tools/ag-genres.ts` are new, read-only harnesses. `tools/specialists.ts` and
`tools/brief-balance.ts` measure much the same, but they write into tracked documents, so they weren't run.

**How the harness judges each piece:**

- every piece is fully prepared, at readiness 100, with no draw, unless said otherwise;
- a brief is the mean over its readings, with no way of playing chosen;
- a class scene is pitched as Scene Study is (difficulty −0.3), and is judged in segments only if it has two tones or
  more, as `scenePiece` does;
- a night is a supporting part at the School (difficulty 0.05);
- casting reads stamina and discipline as full (`castingPerformer`);
- coursework is the 13 templates whose task isn't `scene`, with the template's reads and par and no scene material.

## §1 Each Ability's Effect (A1, A2, A3)

The change in the whole when the even actor (all 50) gains +10 on one ability, over 427 pieces. "Moved" means a change
of 0.05 or more. The table gives each kind's mean.

| Ability | Moved | Mean | cv | Briefs (298) | Scenes (56) | Nights (30) | Casting (30) | Coursework (13) |
|---|---|---|---|---|---|---|---|---|
| Emotional Depth | 421 | +1.24 | 0.24 | +1.39 | +0.90 | +1.00 | +1.03 | +0.49 (7) |
| Listening | 418 | +1.06 | 0.34 | +0.89 | +1.53 | +1.48 | +1.76 | +0.48 (4) |
| Imagination | 424 | +0.69 | 0.20 | +0.67 | +0.72 | +0.75 | +0.70 | +0.87 (10) |
| Adaptability | 418 | +0.50 | 0.36 | +0.52 | +0.46 | +0.45 | +0.45 | +0.20 (4) |
| Focus | 423 | +0.44 | 0.49 | +0.49 | +0.26 | +0.33 | +0.31 | +0.68 (9) |
| Vocal | 298 | +0.39 | 0.64 | +0.33 (178) | +0.40 | +0.61 | +0.61 | +0.58 (4) |
| Physical | 298 | +0.36 | 0.62 | +0.30 (176) | +0.32 | +0.62 | +0.63 | +0.61 (6) |
| Stamina | 390 | +0.33 | 0.57 | +0.37 | +0.23 | +0.43 | 0 | +0.42 (7) |
| Memory | 416 | +0.30 | 0.25 | +0.34 | +0.29 | +0.18 | +0.17 | +0.08 (2) |
| Composure | 417 | +0.30 | 0.30 | +0.31 | +0.25 | +0.38 | +0.37 | +0.15 (3) |
| Presence | 417 | +0.28 | 0.44 | +0.25 | +0.23 | +0.49 | +0.49 | +0.26 (3) |
| Discipline | 386 | +0.18 | 0.49 | +0.20 | +0.11 (49) | +0.16 | 0 | +0.51 (10) |

- **Correlation.** The highest correlation of two abilities' effects across the 427 pieces is emotional depth and
  memory at r = 0.55, then presence and listening at 0.48. No pair reaches 0.9.
- **Techniques, +10 from 50.**
  - scene moves 416 pieces, +0.45;
  - screen moves 264, +0.37;
  - voiceover 37 (+0.06), comedy 38, combat 32, classical 25, improv 18;
  - singing, dance, clown, character, intimacy and accents move 12 or fewer each;
  - script, speech, audition and cold reading move 1 or 2 each.
- **Past mastery.** A technique at 100 against one at 90 moves 0 of 427 pieces.

## §2 Specialists, The Best Allocation, The Generalist (H2, H4, H5)

Each specialist against the even actor: where its ability reads most (its effect at or above the median of its nonzero
effects), and elsewhere.

| Specialist | Ahead Where It Reads Most | Mean There | Ahead Elsewhere | Mean Elsewhere |
|---|---|---|---|---|
| Emotional Depth | 211 of 211 | +3.03 | 205 of 216 | +0.99 |
| Listening | 219 of 219 | +2.31 | 143 of 208 | +0.19 |
| Imagination | 139 of 225 | +0.23 | 2 of 202 | −0.42 |
| Vocal | 80 of 169 | +0.13 | 0 of 258 | −2.10 |
| Physical | 62 of 168 | −0.04 | 0 of 259 | −2.13 |
| Adaptability | 45 of 222 | −0.29 | 0 of 205 | −1.30 |
| Focus | 29 of 270 | −0.62 | 0 of 157 | −1.65 |
| Stamina | 10 of 245 | −0.96 | 0 of 182 | −2.12 |
| Discipline | 4 of 252 | −1.79 | 0 of 175 | −2.26 |
| Presence | 3 of 263 | −1.42 | 0 of 164 | −1.87 |
| Composure | 1 of 271 | −1.35 | 0 of 156 | −1.81 |
| Memory | 1 of 332 | −1.36 | 0 of 95 | −2.04 |

The best of the 13 equal-budget actors (even and twelve specialists), by kind:

| Kind | Best |
|---|---|
| Briefs (298) | emotional depth 268, vocal 16, listening 7, physical 6, adaptability 1 |
| Scenes (56) | listening 56 |
| Nights (30) | listening 30 |
| Casting (30) | listening 30 |
| Coursework (13) | vocal 3, listening 3, physical 2, focus 2, emotional depth 2, presence 1 |

**The generalist** (the even actor):

- it is never the best;
- it is ahead of at least six of the twelve specialists on 427 of 427 pieces;
- it trails the best by 2.81 on average (0.8 to 8.6), and is within a point of the best on 8 of 427.

## §3 Genres (G1 to G4)

| Measure | Value |
|---|---|
| Genres; briefs; readings | 149; 298 (2 a genre, none listed under a second); 648 (2.17 a brief, 4 to 6 a genre) |
| Beats a brief | 3.6 (2 to 6) |
| The reader plays | steady 168, pressing 34, unpredictable 32, withholding 29, none (microphone) 35 |
| Stakes | 0: 19, 1: 174, 2: 55, 3: 50 |
| Distance between genres (L1, 6 dimension shares ×10 and 12 ability effects) | 11,026 pairs: 5th percentile 1.66, median 3.45, 95th 6.75 |
| Distance between a genre's own two briefs | mean 3.25 (0.76 to 7.27) |
| Nearest other genre | mean 1.17 (0.72 to 2.29) |
| Genres with a neighbour nearer than their own second brief | **143 of 149** |
| Cross-genre brief pairs identical in every engine-read number, readings aside | **7**: biker = coming_of_age, childrens = science_fantasy, christmas = holiday, dystopian = medical_drama, espionage = neorealism, family = steampunk, nordic_noir = social_realism |
| Best equal-budget actor on a genre's briefs | emotional depth 139, physical 3, vocal 3, listening 3, adaptability 1 |
| A brief's best and worst reading apart | even 0.18 (over a point on 1 of 298); emotional depth specialist 1.57 (204); listening specialist 0.60 (63); physical specialist 0.49 (54) |
| Best reading differs, feeling against listening specialist | 146 of 298 briefs |

## §4 Mastery And Outcomes Apart (M1, M3, O1, O2)

| Measure | Value |
|---|---|
| Mastered actor, every brief × reading × fitting way | 4,495 of 4,495 at 100, all `mastery: true` |
| Scenes, nights, castings, coursework at mastery | 56/56, 30/30, 30/30, 13/13 at 100 |
| Drawn takes at mastery (60 briefs × 3 keys) | 0 of 180 off 100 |
| Own result, mastered, 263 camera briefs, by reader | recording 100 (sd 0); unprepared and distracted 100 (sd 0); prepared and attentive 100 (sd 0) |
| The take together, same readers | 92.54 (88.1 to 97.3); 85.09 (76.1 to 94.5); 100 |
| Mastered actor's own class scene, the partner part at 0 | **68.17** (65.7 to 71), n = 56 |
| The same, the partner part at 0.45 | **84.09** (82.9 to 85.5) |

## §5 Preparation And Genre Known (G5, T3)

The developing actor (abilities 50, techniques 40) on the 298 briefs, genre known in full, by preparation:

| Preparation | 0 | 0.25 | 0.5 | 0.75 | 1 |
|---|---|---|---|---|---|
| Mean take | 18.86 | 30.58 | 42.29 | 52.17 | 53.88 |

By genre known, everything else complete:

| Genre known | 0 | 0.1 | 0.2 | 0.3 | 0.6 | 1 |
|---|---|---|---|---|---|---|
| Developing actor | 41.70 | 45.91 | 50.10 | 53.88 | 53.88 | 53.88 |
| Mastered actor | 77.11 | — | (0.15: 88.55) | 100 | — | — |

Other work, the developing actor, at preparation 0, 0.5 and 1:

- scenes 21.07, 42.68, 60.21;
- nights 15.85, 32.18, 45.27;
- coursework 21.05, 42.00, 58.75.

## §6 Growth (T2, T3)

Deliberate practice, one hour, matched tier, steady focus, day's focus 1, discipline 50:

| Level | 10 | 30 | 50 | 70 | 80 | 90 | 95 | 99 |
|---|---|---|---|---|---|---|---|---|
| Gain | 0.378 | 0.294 | 0.210 | 0.126 | 0.105 | 0.105 | 0.105 | 0.105 |

Hours by band:

| Band | 20–30 | 30–40 | 40–50 | 50–60 | 60–70 | 70–80 | 80–90 | 90–95 | 95–100 |
|---|---|---|---|---|---|---|---|---|---|
| Hours | 32 | 37 | 44 | 54 | 69 | 91 | 96 | 48 | 48 |

**Ordinary work** (classes and steps) toward a reach of 76: 154 hours from 30 to 50, 669 from 50 to 70, and 1,866 from
70 to 75.

**The same exercise four times in a day** is worth 1.875 sessions; four different exercises are worth 4.

**Genre known to 30:** 5 study sessions (7.5 hours) or 4 takes. To 60: 11 sessions; to 90: 28.

## §7 Randomness Against Skill (H7)

100 briefs (every third), 60 independent draws per actor and brief.

| Pair | sd Of One Actor's Takes | Range | Expected Gap | Better Actor's Takes Below The Worse |
|---|---|---|---|---|
| 30 against 40 | 0.77 | 3.55 | 9.85 | 0% |
| 50 against 60 | 0.53 | 2.42 | 9.34 | 0% |
| 70 against 80 | 0.31 | 1.37 | 9.09 | 0% |

## §8 Feedback From Evidence (F2, H1)

**The cases:** 6 drawn actors (abilities 30 to 75, techniques 25 to 75), each on one brief in four, at preparation 0.6
with the genre known. That is 447 cases. Every first limit was an ability.

| Measure | Value |
|---|---|
| +20 on the first-named input | +2.43 (1.3 to 4.1) |
| +20 on a read ability, the mean over them | +1.12 (0.83 to 1.61) |
| +20 on an unread ability | 0 (n = 284) |
| The named input was the largest gain of +20 | 364 of 447 (81.4%) |

## §9 Condition

A mastered actor on the 298 briefs:

| Condition | Mean Take | Range |
|---|---|---|
| Sufficient | 100 | — |
| Readiness 30 | 82.05 | — |
| Ill | 92.94 | — |
| Injured | 93.54 | 73.8 to 100: only the 83 on-feet briefs are reached |

## §10 Ways To Spend 24 Hours On Briefs (H3, T2d)

A first-year student, three hours a day for eight days, n = 3 a cell. Each figure is matched seeds / held-out seeds.

| Way | Mean Take | Best Take | 20 Held-Out Briefs | Abilities Gained | Genre Practice | Per Hour |
|---|---|---|---|---|---|---|
| Tape only | 20.81 / 20.78 | 21.20 / 21.10 | 58.62 / 58.19 | −1.44 / −1.44 | 53.59 / 53.59 | 2.23 |
| Prepare | 43.91 / 43.52 | 45.10 / 44.93 | 58.64 / 58.23 | −0.84 / −0.83 | 40.00 / 40.00 | 1.67 |
| Train between | 42.80 / 42.58 | 43.73 / 43.80 | 58.96 / 58.55 | +1.61 / +1.66 | 20.00 / 20.00 | 0.83 |
| Breadth | 20.38 / 20.25 | 21.13 / 21.00 | 58.65 / 58.24 | −1.02 / −1.00 | 120 / 120 | 5.00 |
| Repeat one | 54.16 / 53.99 | 56.30 / 55.93 | 58.62 / 58.19 | −1.36 / −1.35 | 51.96 / 52.37 | 2.17 |

"Abilities gained" is negative because stamina detrains in a week with no workout.

## §11 A Term Played (L1 to L3)

120 days by the attentive policy, briefs and training in free hours, seed `bj-0`.

| Profile | Takes | Briefs | Genres | Purposes | Same Take Again In A Row | Monthly Mean (n) | Reading Spread | Recommendation Weeks, Distinct, Longest Run |
|---|---|---|---|---|---|---|---|---|
| Beginner | 21 | 14 | 13 | first 14, another reading 7 | 0 | 52.2 (3), 53.8 (3), 54.0 (15) | 0.61 | 17, 5, **6** (vocal at 52 to 54) |
| Specialist (feeling at 90) | 18 | 11 | 11 | first 11, callback 3, another reading 4 | 0 | 64.1 (2), 62.0 (2), 60.8 (14) | 1.73 | 17, 5, **5** (stamina at 35) |

Both runs: 0 breaches and 0 unbalanced entries.

In both runs' last six takes, the chief limit was "Knowing the genre wasn't complete, which cost the interpretation 26
to 27 points" on 2 to 3 of them.

## Verdicts

| Id | Verdict | The Number That Decides It |
|---|---|---|
| A1 | **Fails** | Presence (best kind +0.49), memory (+0.34), composure (+0.38) and stamina (+0.43) have no kind of work at 0.5 |
| A2 | Meets | The highest correlation is 0.55 |
| A3 | **Fails** | Emotional depth moves 99% at cv 0.24, imagination 99% at cv 0.20, memory 97% at cv 0.25. Composure's 0.30 is at the line |
| A4 | **Fails** | 9 false or partial claims: focus, imagination, memory and adaptability `affects`; discipline `develops` and `affects`; imagination and listening `develops`; stamina `affects`; and the AttributesPanel's composure line (`attributes-matrix.json`) |
| A5 | Meets | 12 of 12: 10 exercises, a workout, a practice day |
| T1 | **Fails** | No expected gain before an hour; nothing said past 90. After the hour, it meets |
| T2 | **Fails** | (a) 0.47, (b) and (c) meet; (d) taping unprepared credits 2.23 an hour against preparing's 1.67 |
| T3 / H6 | **Fails** | (a) 36%, meets; (b) genre known is read by its own briefs over 30% of its range; techniques over 90% |
| G1 | **Fails** | The median between genres is 1.06× the mean within a genre; 143 genres have a nearer neighbour |
| G2 | **Fails** | 7 identical cross-genre pairs |
| G3 | **Fails** | Emotional depth best on 139 of 149 |
| G4 | Meets | 2 briefs and 4 to 6 readings for every genre; 4 reader behaviours |
| G5 | **Fails** | 30 to 100 known changes nothing on a genre's own briefs |
| M1 | Meets | 4,495 + 129 cases at 100; 0 drawn off |
| M2 | Not re-measured | Prior evidence: `docs/verification/briefs/mastery-*.json`, from the earlier pass. To re-run on phase 2's code |
| M3 | **Fails** | Own result 68.17 with the partner absent, 84.09 half present |
| O1 | Meets | Own sd 0 across readers |
| O2 | Meets | Together 100, 92.5 and 85.1 by reader |
| O3 | Meets | By code (formulas.md §6) |
| F1 | **Fails** | A coursework skill note names the weakest raw craft skill under 0.45, not the evaluation's limit (`coursework.ts:775-777`) |
| F2 / H1 | Meets | 2.43 against 1.12 (2.2×); unread 0; 81.4% largest |
| F3 | Meets | Preparation, condition and fit have their own recommendation words |
| H2 | **Fails** | Emotional depth best on 90% of briefs; listening on 100% of scenes, nights and castings |
| H3 | Meets, with a caveat | No way wins every measure; held-out briefs within 0.34 (matched) and 0.36 (held out); orders agree. Repeat-one gives the best takes on its brief, and training between moves held-out briefs by +0.3 |
| H4 | **Fails** | 3 of 12 specialists ahead on 60% where it reads most (emotional depth, listening, imagination) |
| H5 | **Fails** | Ahead of half the specialists on 100%, but within a point of the best on 1.9% (needs 10%) |
| H7 | Meets | The better actor loses 0% of draws; the developing actor's range is 2.42 |
| L1 | **Fails** | Runs of 6 and 5 weeks with the input up under 5 points |
| L2 | Meets | 0 |
| L3 | **Fails** | Specialist 64.1 → 60.8. The beginner meets, 52.2 → 54.0. Small n in the early months |

**Meets:** A2, A5, G4, M1, O1, O2, O3, F2/H1, F3, H3, H7, L2.

**Fails:** A1, A3, A4, T1, T2, T3/H6, G1, G2, G3, G5, M3, F1, H2, H4, H5, L1, L3.

**Not re-measured:** M2.
