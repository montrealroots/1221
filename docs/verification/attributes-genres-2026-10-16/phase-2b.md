# Phase 2b: The Genre Known, What A Piece Demands, Stamina By Length, What Speeds A Step

Phase 2b of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay".
Five steps, each against the criteria in `acceptance-criteria.md`, written before any tuning. No threshold there moved.
Every figure below was measured on the working tree of 2026-10-16, branch `claude/remaining-acceptance`, on top of
`41753265` (phase 2a); another agent's banking files were changing beside it and are none of this work.

## How It Was Measured

| What | Command | Output |
|---|---|---|
| Before | `phase-2a-baseline.json`, measured again on the tree before any 2b change: every field the same | `phase-2a-baseline.json` |
| After | `npx vite-node tools/ag-baseline.ts -- --out <scratch>/b2.json` | `phase-2b-baseline.json` |
| Genres after | `tools/ag-genres.ts`, a scratch copy reading `phase-2b-baseline.json` and writing beside it, so the tracked `genres-matrix.json` (phase 1's) wasn't overwritten | `phase-2b-genres-matrix.json` |
| Ways to spend 24 hours | `npx vite-node tools/brief-strategies.ts -- --seeds bs-0,bs-1,bs-2 --write …`, and `bs-10,bs-11,bs-12` | `phase-2b-played-brief-strategies*.json` |
| A term played | `npx vite-node tools/brief-journeys.ts -- --profile beginner --seed bj-0 --days 120 --write …`, and `--profile specialist` | `phase-2b-played-journey-*-bj-0.json` |
| The mastery plans | `npx vite-node tools/mastery.ts -- --mode plan --genre drama --seed m-1 --years 8`, and `--genre musical --seed m-0` | `phase-2b-mastery-*.json` |
| The new tests | `VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx vitest run tests/attributes-phase-2b.test.ts` | 13 of 13 |
| Before and after a step | the step's values put back by hand, the file run alone, restored (§7) | each new test failed before its step |
| A played degree | the attentive policy's graduate (`r3-grad`, `tests/evidence3-home.test.ts`), replayed to May 2029 on `HEAD` and on this tree | §2.6 |
| Mutations | each applied, the test file run alone, the source restored (§7) | 8 of 8 killed |
| The full suite | `npx vitest run` | §8 |

Every brief is judged fully prepared, at readiness 100, with no draw, as `baseline.md` describes, unless a row says
otherwise. The even actor is every ability and technique at 50; a specialist is 85 on one ability, the other eleven
lowered to keep 600.

## 1. The Genre Known (T3/H6, G5, T2(d))

### What changed

**The curve** (`BRIEF.complete.genre`, `systems/briefs.ts`; `EVALUATION.partFloor`, `content/tasks.ts`; the floor read in
`judge`, `systems/evaluation.ts`):

| | Before | After |
|---|---|---|
| Complete at | 0.3 | 0.9, as a technique is mastered at 90 |
| The interpretation's preparation factor, known `k` | `0.35 + 0.65 · min(1, k / 0.3)` | `0.75 + 0.25 · min(1, k / 0.9)` |
| Read over | 30% of the range | 90% of the range |

**The gate, decided by the brief and acting practice.** A mastered actor taping in a genre never met came to 77, under
a developing actor who knew it. A genre's conventions are a matter of tone and register, the "what show is this" a casting
office asks an actor to know before a read. Missing them costs the choices, not the craft that makes them. So a part with
its own floor: three quarters of the interpretation stands with the genre unknown, and the master lands about 92, still
Exceptional (80). SLATE's size of it; the guarantee is unchanged, with "the genre known to 0.9" in place of 0.3.

**Practice credited by preparation** (`practiceShare`, `BRIEF.practiceUnprepared`, `tapeBrief`). A take credits its genres
`0.15 + 0.85 · d`, `d` the mean of the breakdown, the lines and the rehearsal against what completes each. A genre's
conventions are learned in the work on the scene more than by rolling the camera on it cold. Until then a take credited the
same however little was prepared.

`RULESET` moved to `evaluation-4 (2026-10-16)`, so a result kept under three is shown as it was and never replayed under
four (`replay`). No schema change: nothing in the save moved.

### Measured

The take by the genre known, fully prepared (`ag-baseline` §5, and the developing actor's 0.9 from the same harness):

| Known | 0 | 0.1 | 0.2 | 0.3 | 0.6 | 0.9 | 1 |
|---|---|---|---|---|---|---|---|
| Developing actor (50, techniques 40), before | 41.70 | 45.91 | 50.10 | 53.88 | 53.88 | 53.88 | 53.88 |
| Developing actor, after | 49.72 | 50.21 | 50.71 | 51.22 | 52.69 | 53.88 | 53.88 |
| Mastered actor, before | 77.11 | (0.15: 88.55) | | 100 | | | |
| Mastered actor, after | 91.77 | (0.15: 93.16) | | 94.51 | 97.09 | 100, `mastery: true` | |

Relevant against unrelated genre mastery: a brief's own genre known to 90, against another genre known to 90, which the
take reads as its own unknown.

| Actor | Own known 90 | Another known 90 | Before: own, another |
|---|---|---|---|
| Even (50) | 55.10 | 51.24 | 55.26, 42.77 |
| Mastered | 100 | 91.69 | 100, 76.97 |

Genre practice an hour, 24 hours each way (`brief-strategies`, matched seeds; held-out the same):

| Way | Before | After |
|---|---|---|
| Tape only, cold | 2.23 | 0.45 |
| Prepare, then tape | 1.67 | 1.67 |
| Train between | 0.83 | 0.83 |
| Breadth (one Break It Down, then tape) | 5.00 | 1.98 |
| Repeat one (prepared once) | 2.17 | 1.97 |

Studying to 30 is still 5 sessions; to 90, 28.

## 2. What A Piece Demands (A1, A3, H2, H4, H5)

### What changed

**The profiles' own inputs** (`BASE_INPUTS`, `content/tasks.ts`) for a scene, a taped brief (and on its feet) and a night.
The other tasks (voice, song, movement, partnered work, improvisation, clown, the coursework self-tape, the audition)
kept theirs.

| Dimension | Scene, before → after | Taped brief, before → after | Night, before → after |
|---|---|---|---|
| Believability | ED 3, tech 1 → ED 1, imagination 0.5, tech 1 | ED 3, tech 1 → ED 1, imagination 0.5, tech 1 | ED 3, tech 1 → ED 1, imagination 0.5, tech 1 |
| Interpretation | imagination 3, tech 1 → 1, tech 1 | imagination 2, tech 1 → 0.75, tech 1 | imagination 2, tech 1 → 1, tech 1 |
| Connection | listening 2, presence 1 → listening 0.25, presence 1 | listening 1, presence 2 → listening 0.5, presence 1 | presence 2, listening 1 → presence 2.5, listening 0.5 |
| Execution | memory 2, vocal 1, physical 1, tech 2 → memory 1, vocal 0.5, physical 0.5, tech 2 | memory 2, focus 1, tech 2 → memory 0.5, focus 0.5, tech 2 | memory 1, vocal 1, physical 1, tech 2 → memory 4, vocal 1, physical 1, tech 2 |
| Consistency | composure 2, discipline 1, stamina 1 → composure 1, discipline 1, stamina 1 | composure 1, discipline 1 → 0.5, 0.5 | composure 2, stamina 1, discipline 1 → composure 2, stamina 1, discipline 3 |
| Responsiveness | listening 2, adaptability 2 → listening 0.25, adaptability 1 | listening 1, adaptability 1 → 0.5, 0.5 | listening 2, adaptability 1 → listening 0.5, adaptability 1 |

(ED is emotional depth. Stamina in a consistency is read as the drain in every piece judged in segments; phase 2a.)

**What a piece demands** (`DEMAND_EFFECT`, `content/approaches.ts`; `demandsOf`, `systems/material.ts`). Each entry leans the
dimensions it names by `1 + lean · units` and adds its abilities to their inputs at `weight · units`, as a feature's level
does. Normalized, as every lean is: no entry adds weight to the whole, and at full abilities every term is 1.

| Demand | Units | Lean | Adds | What informs it |
|---|---|---|---|---|
| Solo | partner levels under 2 | connection 0.5 | presence 2, connection | Rodenburg ties presence to a voice and a body fully there (research-acting-engine.json, voice pedagogy) |
| Text | medium 1, long 2 | execution 0.7 | memory 5, execution | Noice & Noice (2006): a role learned by elaborating its meaning, a skill that holds more text the better it is |
| Stakes | a brief's 0 to 3 (1 unset) | consistency 0.6 | composure 1.5 consistency, 0.4 believability | Steptoe et al. (1995), 46% of senior drama students with moderate or severe stage fright; Goodman & Kaufman (2014); relaxation as what lets an actor recover a line in an audition (Backstage, a psychology professional on audition anxiety) |
| Beats | segments past three | consistency 0.7 | discipline 2.5, consistency | Stanislavski's units and objectives, a score set in rehearsal and kept |
| Grave | share of beats or tones grave | believability 0.3 | emotional depth 2.5 | Stanislavski's emotion memory and given circumstances |
| Invented | share lyric or grotesque | interpretation 0.3 | imagination 2.5 | Stanislavski's magic if; Chekhov, To the Actor (1953) |
| Comic | share comic | execution 0.3 | focus 3 | tempo-rhythm and concentration of attention: a joke lands on an exact moment |

**The material's own levels** (`FEATURE_EFFECT`, `LANGUAGE_EFFECT`, `TRANSITION_EFFECT`):

| Item | Before | After | Why |
|---|---|---|---|
| Partner, listening a level | 1 | 0.35 | every class scene is at partner 2 or 3, and listening came out best on all 56 |
| Timing, listening a level | 1 | 0.3 | the same |
| Timing, focus a level | 1 | 1.5 | timing's precision is attention held on the beat |
| Physical | 1.8 a level, lean 0.25 | 2.5, discipline 0.5, lean 0.3 | a fight or a dance is a set score, "the same way every time" (the stage-combat rule; the SAFD's fight call) |
| Vocal | 2 a level, lean 0.25 | 2.75, lean 0.3 | their specialists fell behind the even actor on their own material once the profiles' other weights thinned |
| Heightened | interpretation only | and focus 1 in execution | dense argument held whole |
| Verse | imagination 0.8, vocal 0.4 | and memory 3, focus 0.4, execution lean 1.15 | verse is spoken as written, its line and its word exact (Berry, The Actor and the Text, 1987) |
| A turn, adaptability | 0.3 | 0.6 | the change itself is its work (Johnstone, accepting what comes) |

**What informs the simulation and what is a designed formula.** Each demand's direction (which ability a feature of the
piece asks more of) is from the sources named. Every size (each weight, each lean, each unit) is SLATE's, chosen
against criteria written before this phase (A1, A3, H2, H5), and said to be so in the code.

**Two fixes the played degree found** (§2.6), each the integration of this step:

- **A way's evidence** (`tryAdjustment`, `systems/workbook.ts`). The figure after a way was read once its half hour on the
  feet had tired the actor, so a way that changed nothing measured worse by the tiring alone, and a director's note on an
  ability limit, which no way moves, was answered only if the limit left the forecast. From 2026-10-16 it's read on the
  day as the way began.
- **One drain, one problem** (`problemsOf`). A segment held back most by the stamina drain is the stamina problem,
  said once; at a whole evening's load the same drain had come as two, the segment's first, whose ways don't include
  breathing.

### 2.1 Each ability's effect (A1, A2, A3), +10 from the even actor

| Ability | Moved, before → after | cv, before → after | Briefs | Scenes | Nights | Casting | Coursework |
|---|---|---|---|---|---|---|---|
| Emotional Depth | 99% → 99% | 0.24 → **0.44** | 1.39 → 0.83 | 0.92 → 0.62 | 1.00 → 0.63 | 1.03 → 0.65 | 0.49 |
| Presence | 98% → 98% | 0.45 → 0.65 | 0.25 → 0.24 | 0.22 → 0.48 | 0.49 → 0.74 | 0.49 → **0.79** | 0.26 |
| Listening | 98% → 98% | 0.33 → 0.36 | 0.89 → 0.58 | 1.48 → 0.85 | 1.48 → 0.75 | 1.76 → 1.01 | 0.48 |
| Imagination | 99% → 99% | 0.20 → **0.31** | 0.67 → 0.60 | 0.71 → 0.64 | 0.75 → 0.74 | 0.70 → 0.75 | 0.87 |
| Focus | 99% → 99% | 0.49 → 0.48 | 0.49 → 0.61 | 0.26 → 0.47 | 0.33 → 0.45 | 0.31 → 0.45 | 0.68 |
| Memory | 97% → 95% | 0.25 → **0.77** | 0.34 → 0.51 | 0.29 → 0.24 | 0.18 → 0.52 | 0.17 → **0.54** | 0.08 |
| Adaptability | 98% → 98% | 0.36 → 0.35 | 0.52 → 0.60 | 0.46 → 0.68 | 0.45 → 0.76 | 0.45 → 0.82 | 0.20 |
| Composure | 98% → 98% | 0.26 → **0.39** | 0.31 → **0.75** | 0.32 → 0.56 | 0.38 → 0.52 | 0.37 → 0.55 | 0.15 |
| Vocal | 70% → 69% | 0.64 → 0.65 | 0.33 → 0.36 | 0.40 → 0.34 | 0.61 → 0.47 | 0.61 → 0.49 | 0.58 |
| Physical | 70% → 68% | 0.62 → 0.62 | 0.30 → 0.33 | 0.32 → 0.25 | 0.62 → 0.48 | 0.63 → 0.51 | 0.61 |
| Discipline | 92% → 92% | 0.49 → 0.66 | 0.20 → 0.41 | 0.14 → 0.20 | 0.16 → 0.38 | 0 | 0.51 |
| Stamina | 91% → 91% | 0.54 → 0.54 | 0.37 → 0.39 | 0.34 → 0.33 | 0.43 → **0.58** | 0 | 0.42 |

The highest correlation of two abilities' effects: emotional depth and memory 0.556 before; discipline and stamina 0.55
after. No pair near 0.9.

### 2.2 Piece demands, the even actor's +10 on the 298 briefs, grouped

| Ability, by what the brief has | Before | After |
|---|---|---|
| Memory: short / medium / long | 0.35 / 0.34 / 0.33 | 0.08 / 0.77 / 1.21 |
| Composure: stakes 0 / 1 / 2 / 3 | 0.26 / 0.30 / 0.32 / 0.32 | 0.17 / 0.65 / 0.91 / 1.16 |
| Presence: partner 0 / 1 / 2 / 3 | 0.26 / 0.24 / 0.25 / 0.25 | 0.47 / 0.39 / 0.21 / 0.21 |
| Discipline: 3 / 4 / 5 / 6 beats | 0.21 / 0.20 / 0.17 / 0.16 | 0.19 / 0.58 / 0.83 / 0.95 |
| Emotional depth: grave under half / half or more | 1.27 / 1.48 | 0.61 / 1.00 |
| Focus: comic under half / half or more | 0.46 / 0.55 | 0.51 / 0.85 |
| Imagination: lyric or grotesque under half / half or more | 0.66 / 0.74 | 0.58 / 0.79 |
| Listening: partner 0 / 1 / 2 / 3 | 0.52 / 0.67 / 0.88 / 1.04 | 0.28 / 0.38 / 0.58 / 0.69 |

Until 2026-10-16 a long brief asked memory no more than a short one, and the brief with most at stake asked composure
about as much as the one with least: the change in the input moved the sentence, not the outcome.

### 2.3 Specialists against the even actor (H4), where each reads most

| Specialist | Before | After |
|---|---|---|
| Emotional Depth | 211 of 211 (100%) | 207 of 216 (96%) |
| Listening | 219 of 219 (100%) | 173 of 216 (80%) |
| Composure | 1 of 295 (0%) | 152 of 211 (**72%**) |
| Memory | 1 of 329 (0%) | 113 of 202 (56%) |
| Adaptability | 45 of 223 (20%) | 131 of 245 (53%) |
| Focus | 29 of 213 (14%) | 99 of 216 (46%) |
| Imagination | 131 of 222 (59%) | 111 of 255 (44%) |
| Vocal | 70 of 149 (47%) | 70 of 199 (35%) |
| Physical | 61 of 167 (37%) | 56 of 173 (32%) |
| Discipline | 4 of 258 (2%) | 37 of 212 (17%) |
| Presence | 3 of 260 (1%) | 31 of 244 (13%) |
| Stamina | 10 of 210 (5%) | 10 of 207 (5%) |

2 of 12 at 60% or more before; 3 of 12 after. Away from where each reads most, no specialist but emotional depth is ahead
anywhere (6 of 211), where before emotional depth was ahead on 202 and listening on 143 of the rest.

### 2.4 The best of 13 equal-budget actors (H2), and the generalist (H5)

| Kind | Before | After |
|---|---|---|
| Briefs (298) | ED 268, vocal 16, listening 7, physical 6, adaptability 1 | ED 106, composure 58, memory 37, adaptability 22, vocal 21, physical 20, focus 19, imagination 8, discipline 3, listening 2, even 2 |
| Scenes (56) | listening 56 | listening 24, ED 14, adaptability 6, focus 5, imagination 5, vocal 1, even 1 |
| Nights (30) | listening 30 | ED 7, adaptability 7, imagination 6, focus 3, listening 3, physical 2, presence 1, vocal 1 |
| Casting (30) | listening 30 | ED 7, adaptability 7, listening 7, imagination 5, physical 2, focus 1, vocal 1 |

The largest share of any kind of 30 or more pieces is 43% (listening on scenes).

| The even actor | Before | After |
|---|---|---|
| Ahead of half the specialists | 427 of 427 | 427 of 427 |
| Within a point of the best | 8 (1.9%) | **132 (30.9%)**: briefs 63, scenes 31, nights 25, castings 13 |
| Behind the best, mean | 2.79 | 1.54 |

Genres (G3), the best actor on each genre's briefs: ED 139 of 149 before; after ED 56, memory 21, composure 21, focus 15,
physical 11, adaptability 11, vocal 8, imagination 6.

### 2.5 Proficiency, condition and partner

| Every ability and technique at | 30 | 50 | 70 | 100 (techniques 90) |
|---|---|---|---|---|
| Briefs, before → after | 35.85 → 35.73 | 55.26 → 55.10 | 73.84 → 73.67 | 100 → 100 |
| Scenes | 41.72 → 41.71 | 60.32 → 60.33 | 77.19 → 77.21 | 100 → 100 |
| Nights | 26.80 → 26.16 | 46.70 → 45.87 | 67.73 → 67.00 | 100 → 100 |

The level-for-level standing is where it was: what moved is which abilities a piece's result rests on.

| Preparation (developing actor) | 0 | 0.5 | 1 |
|---|---|---|---|
| Briefs, genre known | 18.86 → 18.87 | 42.29 → 42.39 | 53.88 → 53.88 |
| Scenes | 20.71 → 20.65 | 41.93 → 41.85 | 59.17 → 59.04 |
| Nights | 15.85 → 15.62 | 32.18 → 31.69 | 45.27 → 44.59 |

| Condition, a mastered actor on the 298 briefs | Before | After |
|---|---|---|
| Readiness 30 | 82.05 | 81.58 |
| Ill | 92.94 | 92.34 |
| Injured | 93.54 (73.8 at worst) | 92.24 (65.9 at worst) |

| Partner and reader | Before | After |
|---|---|---|
| Own scene, mastered, partner never came, a reader's 7 evenings | 100 on 56 of 56 | 100 on 56 of 56 |
| The scene together, that partner absent / present | 81.89 / 93.53 | 82.69 / 93.82 |
| Own, the partner part at 0, no reader | 68.33 | 70.28 |
| Own on 263 camera briefs by reader (O1), sd | 0 | 0 |
| The take together by reader (O2) | 92.54, 85.09, 100 | 93.15, 86.30, 100 |

Interpretations: a brief's best and worst reading apart, emotional depth specialist 1.57 → 1.32 (over a point on 204 →
204 briefs); listening specialist 0.60 → 0.55; the feeling and listening specialists' best readings differ on 146 → 101.

### 2.6 A degree played

The attentive policy's graduate (`r3-grad`, London, `tests/evidence3-home.test.ts`) was dismissed in her fourth term on
the first draft of this step: her nights in The Cherry Orchard came to 43 to 45 where `HEAD`'s were 56. The cause was
a director's note on presence, an ability limit no rehearsal way moves, never answered because the way's evidence read
the half hour's tiring as the way's (above), so the notes share fell call by call and the night with it. With the solo
demand taken from partner levels under 3 to under 2, the night's presence 3 to 2.5, and the evidence read before the
tiring, her degree went as `HEAD`'s: concern after the second term, good, concern after the fourth, good, graduated
2029-05-21.

## 3. Stamina By Length (the load)

### What changed

`PIECE.load` (`content/piece.ts`) and `briefPiece`: a long brief 0.3 → 0.35, a night 0.4 → 0.6 and 0.1 → 0.12 a level of
the body's and the voice's work. A brief's short 0.1 and medium 0.2, a scene's 0.15 and its 1/6 a level, unchanged. The
drain stays `f = 1 − 0.3 · load · position · (1 − stamina/full)`.

### Measured

| Stamina +10 | Before (mean, least, most) | After |
|---|---|---|
| Briefs | 0.37 (0 to 0.83) | 0.39 (0 to 0.83) |
| Scenes | 0.34 (0.1 to 0.7) | 0.33 (0.1 to 0.7) |
| Nights | 0.43 (0.2 to 0.7) | **0.58** (0.4 to 0.7) |

| Briefs, by length and the body's and voice's levels together | Before | After |
|---|---|---|
| Short, 0 to 2 | 0.21 | 0.21 |
| Short, 3 or more | 0.53 | 0.53 |
| Medium, 0 to 2 | 0.28 | 0.29 |
| Medium, 3 or more | 0.61 | 0.64 |
| Long, 0 to 2 | 0.42 | 0.48 |
| Long, 3 or more | 0.65 | 0.72 |

A light piece still leaves stamina undecided: a short brief built on neither moves a tenth or less (the new test's
brief: 0.1 at most), and the lightest scene 0.1. A night, two or three hours on stage, draws on it most now, where until
then a short brief built on a fight did.

## 4. What Speeds A Step

| Step | Before | After |
|---|---|---|
| An evening with a partner (`rehearsalOutcome`) | the day's focus | and listening as it stands coming in (`stepSpeed`, 0.85 at 0 to 1.15 at full, exactly 1 at 50) |
| An evening with a reader (`readerRehearsal`) | the day's focus | and listening |
| A brief's Rehearse It On Your Feet | read no ability | listening, played off the reader (`rehearseSpeed`); a voice brief at a microphone, none |
| Production Work On The Note, a blocking note | read no ability | adaptability |

Each is the description made true: listening's and adaptability's `affects` said so and nothing read them there. Measured
in the new tests at 80 against 20, the ratio of the two speeds, 1.198: the reader's evening to six places, the brief's
rehearsal to the thousandth it's kept to, the blocking note to the thousandth (the note's own practice in adaptability
lands first, a hair).

## 5. The Spring Casting In tests/evidence-g20-school.test.ts

Phase 2a held the researched twin's spring casting fit "at least as high" as the reader-only twin's, the gap closed to
54.52 against 53.96 of script, under the tenth the fit is shown to. Measured on this phase's code: **58.6 against 58.5**.
The claim holds again, strictly, and the strict assertion was restored, with the figures in a dated comment. It stands
at one tenth.

## 6. The Mastery Guarantee (M1, M2)

- **M1, static.** 4,495 brief cases at 100 and `mastery: true`; 56 scenes, 30 nights, 30 castings and 13 coursework
  templates at 100; 0 of 180 drawn takes off 100.
- **M2, played** (`phase-2b-mastery-*.json`):

| Plan | Phase 2a | First re-run | Second, stamina kept up through the tapes |
|---|---|---|---|
| Drama, `m-1` | ready 2029-12-22; three tapes 100, `mastery: true` | ready 2029-12-17; three tapes **100, `mastery: false`**; healthy twin 100, false, no limits | ready 2029-12-17; **three tapes 100, `mastery: true`**; healthy twin 100, true; flu 93.9 |
| Musical, `m-0` | ready 2030-10-20; three tapes 100, true | ready 2030-10-29; two of three true; healthy twin 99.9, "Stamina, By Beat 3 (−0.1)" | ready 2030-10-29; **three tapes 100, `mastery: true`**; healthy twin 100, true; flu 90.4 |

Each: graduated 2029-05-21, 0 breaches, 0 unbalanced entries, the brief's genre known past 0.9 (familiarity 90.3). The genre now
takes 28 studies to know, and the plan, which studies until `requiredOf`'s figure, took them.

**What the first re-run found: the plan, not the guarantee.** Stamina holds three days after a workout and falls after.
The tapes after mastery had no workout in them, and the drama's came three days after the last, stamina 98.1 of its 99:
each tape 100 to the tenth, and `mastery: false` for a drain under the rounding. The qualifying conditions ask stamina at
its age's ceiling at the take, so the plan now keeps it there through the tapes and the twins (`keepUp`,
`tools/mastery.ts`, with a dated comment). No engine figure moved for it.

## 7. Tests And Mutations

`tests/attributes-phase-2b.test.ts`, 13 tests in four blocks. Run before its step (the step's values put back by hand,
then restored), each failed: block 1, 4 of 5 (the fifth is `practiceShare`'s arithmetic, new with the step). Blocks 2
to 4 assert what the code before didn't do, and the before figures in §2.2, §2.4, §3 and §4 fail each of them; the
mutations below put the old values back one at a time, and each failed.

| Mutation | What it puts back | Killed by |
|---|---|---|
| The genre's floor 0.75 → 0.35 | the old gate | the master's gate test, and the floor's figure |
| The genre complete 0.9 → 0.3 | the cliff | the whole-range test, and the complete figure |
| Text's memory 5 → 0 | a long brief asking no more memory | the memory, composure and presence test |
| Stakes' composure 1.5 and 0.4 → 0 | the stakes asking composure through the lean alone | the same test; it **survived** the first version, and the test now holds composure's rise over discipline's (1.1 against 0, against 0.6 and 0.2 mutated) |
| The cold take's credit 0.15 → 1 | a cold take credited in full | the played cold-against-prepared test |
| A night's load 0.6 and 0.12 → 0.4 and 0.1 | the old load | the load test and the night's stamina test |
| The brief's rehearsal reads no ability | step 4 for a brief | the rehearse test |
| The blocking note reads no ability | step 4 for a production | the note test |

8 of 8 killed, one after the test was strengthened.

**Existing tests refigured by hand**, each with a dated comment saying what it said before, and never weakened:

- `briefs.test.ts`: the callback's genre known at the full 90, where 70 was past 0.3.
- `evidence-g20-school.test.ts`: the take's practice 10 kept by preparing the brief first (a cold take credits 1.5);
  the spring casting strict again (§5).
- `evidence-g31-ui.test.ts`: the cold take's practice 1.5 where it was 10, title renamed and recorded in
  `docs/verification/pipeline/inputs/renames.json`; Today names Imagination's believability (renamed and recorded); the
  second fall's part in Major Barbara, Lady Britomart.
- `evidence2-b11.test.ts`: the milestones as the new gate plays them (a strong take before the breakdown is finished, a
  distinction-level one prepared with the genre unknown, mastery once the genre is studied to 90, 28 studies at the
  soonest); Today's twelve rows.
- `evidence-g01-life.test.ts`: the first half is stamina's to leave alone, held by replaying the trained twin's scene
  with the idle twin's stamina, which is exact, where the twins' first halves were equal to the tenth until their
  hundredths rounded apart.
- `evidence-g22-school.test.ts`: listening set at 50, where an evening goes exactly as far as its step.
- `attributes.test.ts`: presence moving the night's band, at a craft of 54, where the nights sit at the solid line.
- `defects-r8-1.test.ts`: the recurring weakness on the festival's notes found from the notes rather than assumed.
- `evidence-g19-school.test.ts`: one note worked a way and put back, so a note worked comes to stand not taken.
- `trace-commands.test.ts`: the showing reads the way chosen through its lean and its rehearsal, below the tenth the
  whole rounds to.
- `feedback.test.ts`: the abilities kept beside the craft at 70 too.
- `evidence-g27-ui.test.ts`, `evidence2-b03.test.ts`, `evidence2-b08.test.ts`, `evidence-g21-school.test.ts`,
  `evidence-g32-ui.test.ts`: the parts casting now gives, each still written for the title cast and still by
  `partsFor`'s rule; one title renamed and recorded.

## 8. The Checks

- `tsc -b --noEmit`: clean. `eslint` on every touched file: clean.
- `title-case`, `label-sweep`, `plural-check`, `spelling`, `typos`, `doc-refs`, `wired`: clean. `voice-check`: 40, at
  its budget (two of this phase's sentences were rewritten to get there). `tics`: passes.
- `docs/ATTRIBUTES-MATRIX.md` rewritten by `tools/attributes-matrix.ts`.
- Each touched test file run alone: every test passing.
- The full suite: 4,117 of 4,119. The two failing were failing before this work began, both the banking work's:
  `evidence2-b13`'s sentences on the interests, and `world-map` on `CharacterCreation.tsx`.

## 9. The Criteria After 2b

| Id | After 2a | After 2b | The number |
|---|---|---|---|
| A1 | Fails | **Meets** | presence 0.79 (casting), memory 0.54 (casting), composure 0.75 (briefs), stamina 0.58 (nights) |
| A2 | Meets | Meets | highest correlation 0.55 |
| A3 | Fails (ED, imagination, memory, composure) | **Meets** | ED cv 0.44, imagination 0.31, composure 0.39, memory moves 95% at cv 0.77 |
| A4 | Meets | Meets, by review | the descriptions of the ten abilities this phase touched say what the code does |
| A5, T1 | Meet | Meet | unchanged |
| T2 | Fails (d) | **Meets** | (d) taping cold credits 0.45 an hour against preparing's 1.67 |
| T3 / H6 | Fails (b) | **Meets** | (a) 36%; (b) the genre known read over 90% of its range, techniques 90% |
| G1 | Fails | Fails, further | median between genres 4.92 against 6.59 within a genre (0.75×); 148 of 149 with a nearer neighbor |
| G2 | Fails | Fails | 7 identical cross-genre pairs |
| G3 | Fails | **Meets** | emotional depth best on 56 of 149; six actors best on 10 or more |
| G4 | Meets | Meets | unchanged |
| G5 | Fails | **Meets** | 30 to 90 known raises a developing actor's take 51.22 → 53.88, a master's 94.51 → 100 |
| M1, M2, M3 | Meet | Meet | §6; the reader route 100 on 56 of 56 |
| O1, O2, O3 | Meet | Meet | sd 0; together 93.15, 86.30, 100 |
| F1, F3 | Meet | Meet | unchanged |
| F2 / H1 | Meets | **Fails on its third clause** | named +2.41 against the mean read +1.17 (2.06×), unread 0; but named the largest gain in 311 of 447 (69.6%), under 80% |
| H2 | Fails | **Meets** | the most any actor takes of a kind is 43% (listening, scenes) |
| H3 | Meets | Meets | no way best on every measure; held-out briefs within 0.24 on both seed sets; the orders agree |
| H4 | Fails, 2 of 12 | Fails, 3 of 12 | ED 96%, listening 80%, composure 72%; memory 56%, adaptability 53% next |
| H5 | Fails | **Meets** | within a point of the best on 30.9% |
| H7 | Meets | Meets | better loses 0%; a developing actor's range 2.59 |
| L1 | Fails | **Meets** | longest run 4 weeks (beginner), 3 (specialist) |
| L2 | Meets | Meets | 0 |
| L3 | Fails | Fails | specialist 65.6 → 62.4 (n 2, then 13); beginner 55.0 → 56.2 meets |

**Why F2's third clause failed here.** The evaluation names first the input whose making whole costs most, and F2 asks
whether that's also the input +20 helps most. Before this phase every piece rested on the same few abilities, so the two
rankings agreed on 81%; with each piece resting on what it demands, an ability at 30 on a moderate share and one at 60
on a large share disagree more often. The first-named still pays twice the mean. The criterion's own note (formulas.md
§5: "a limit's cost is what making that input whole would give, not what a realistic step gives") names the fix: rank
the limits by a realistic step. It touches every chief limit, note and recommendation, so it's left for the next phase.

**Why H4 stays short, and what was tried.** A specialist is 85 on one ability and 46.8 on eleven, and the whole is a
quarter the weakest dimension: the eleven lowered cost every dimension the one doesn't reach. A specialist comes out ahead
only where its ability holds about an eighth of the whole. A probe at twice this phase's demand sizes reached 6 of 12,
and pushed vocal, physical, focus and adaptability below their present figures as the demands crowded each other. It
wasn't kept: past this phase's sizes, a piece reads as a single demand, and the generalist (H5) and the distinct genres
(G1) both get worse. Stamina's specialist can't lead anywhere a drain is all it reads.

## 10. For Phase 2c

- **Genre identity got further apart within a genre, not between them.** Each brief now rests on its own demands, so a
  genre's two briefs are 6.59 apart on the mean (3.25 before) and genres 4.92 (3.45): G1's ratio fell from 1.06 to 0.75,
  and 148 of 149 genres have a neighbor nearer than their own second brief (143 before). A genre's signature has to come
  from what its briefs share: their sizes, stakes, partner levels, beats and tones are the levers now, since those are
  what the engine reads (`DEMAND_EFFECT`).
- **The 7 identical cross-genre pairs** (biker and coming of age, children's and science fantasy, Christmas and holiday,
  dystopian and medical drama, espionage and neorealism, family and steampunk, Nordic noir and social realism) are still
  identical: no number the engine reads tells them apart.
- **Each genre's consistent demand signature**: G3 now meets (six actors each best on 10 or more genres), so the
  catalog already rewards different builds; a signature that holds across a genre's two briefs is what's missing.
- **Recommendations (L1, L3).** L1 meets on bj-0 (4 and 3 weeks). L3 still fails for the specialist, 65.6 → 62.4, on
  two takes in the first month. Long journeys weren't re-run past 120 days.
- **F2's ranking** (above) is the next evaluation change; it reaches the notes and What To Work On.
- **UI journeys**: the guide's Genres, Preparing A Brief, Taping A Brief and The Nights entries, and the tutorial's
  You As An Actor chapter, say the new rules; no screen layout changed, and no UI journey was played in this phase.
- `phase-2b-genres-matrix.json` is the genre matrix on this phase's code, beside phase 1's `genres-matrix.json`.
