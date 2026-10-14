# Phase 2a: Text And Truth, The Partner Gate, One Growth Path, One Stamina Rule

Phase 2a of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay".
Four steps of the phase 1 plan, each against the criteria in `acceptance-criteria.md`, which were written before any of
it. No threshold there moved. Every figure below was measured on the working tree of 2026-10-16, branch
`claude/remaining-acceptance`, on top of `85c24d6a`; other agents' banking files were changing beside it and are none of
this work.

## How It Was Measured

| What | Command | Output |
|---|---|---|
| The static baseline, before | `npx vite-node tools/ag-baseline.ts -- --out <scratch>/b0.json` on the tree before any change | every figure as `baseline.json` gives it |
| After steps 1 to 3 | the same, step 4 taken out for the run and put back | every figure the same as before; one new measure (§2) |
| After step 4 | the same | `phase-2a-baseline.json` |
| The new tests | `VITEST_MAX_FORKS=1 VITEST_MIN_FORKS=1 npx vitest run tests/attributes-phase-2a.test.ts` | 13 of 13 |
| Mutations | each applied, that file run alone, the file restored (§6) | 14 of 14 killed |
| The mastery plans | `npx vite-node tools/mastery.ts -- --mode plan --genre drama --seed m-1 --years 8`, and `--genre musical --seed m-0` (§5) | `phase-2a-mastery-*.json` |
| The full suite | `npx vitest run` | 4,076 of 4,079; the three failing are the banking work's (§7) |

`tools/ag-baseline.ts` changed in two ways, both said in it: a class scene of one tone is judged as `scenePiece` judges it
from step 4, and §4 gained the partner-never-came measure with a reader (`classSceneMasteredPartnerNeverCameReaderRoute`).

## 1. Text And Truth (A4, T1, F1)

### What changed

**Every description checked against its code path.** Each false or partial claim the matrix flagged was made true, by
making the code do it where the brief's "every attribute meaningful" wanted it, and otherwise by saying what the code does.
Each changed line keeps a dated comment saying what it said before.

| Ability | Was | Now | How |
|---|---|---|---|
| Emotional Depth `affects` | a scene, a song, a self-tape, an audition, a night | every performed task's believability, and connection in partnered physical work | text: the improvisation, the clown turn and partnered work read it |
| Presence `develops` | nights only | nights, a showing for classmates, and what graded exposure and clown practice carry over | text |
| Listening `develops` | omitted nights | every night in front of a house added | text (`systems/school.ts`, `ordinary(..., 'listening', ..., 'night')`) |
| Imagination `develops` | "revision of coursework" | the table work; a revision grows adaptability (`PREP_ABILITY`) | text |
| Imagination `affects` | "how fast a part's interpretation is prepared", read by nothing | the table work and a brief's breakdown go further with it | **code**: `stepSpeed` |
| Focus `affects` | "how far a step of preparation goes", which read the day's focus | getting to know coursework's material goes further with it; and the day's focus said to be another thing | **code**: `stepSpeed` |
| Memory `affects` | "how fast lines are learned", read by nothing | every step that learns lines: a scene's, a brief's, a part's | **code**: `stepSpeed` |
| Adaptability `affects` | "how fully a note is taken", read by nothing | a step of revision goes further, so a note is taken sooner; plus transitions, a slip, covering a partner | **code**: `stepSpeed` on Work On The Note |
| Composure `develops` / `affects`, and the Attributes panel | "grows with every performance", "holds a performance's consistency" | consistency in a scene, a song, a tape, an audition and a night; recovery from a slip; nights and showings, graded exposure, and what two exercises carry over | text |
| Discipline `develops` | "work prepared before it's due", which grew nothing | practice on days running and every call | text |
| Discipline `affects` | "how much practice counts for", "consistency in every task" | what classes, nights, steps and practice grow counts a tenth more or less (step 3 made it true of all of them); consistency in every task that asks it but the audition; execution in written work | text, and step 3 |
| Stamina `affects` | "consistency in movement, fights, songs and every night" | the drain through a piece's later parts; consistency in work shown whole with no scene | text, and step 4 |

`SUFFICIENT` (`systems/briefs.ts`) went, with its `EVALUATION` import: nothing read it.

**The step speed** (`STEP_SPEED`, `content/abilities.ts`; `stepSpeed`, `systems/attributes.ts`):

- Before: a step's move was `gain · clamp(dayFocus, 0.5, 1.1) · trait · familiarity · (1 − part)`, no ability in it.
- After: the same, times `0.85 + 0.30 · n`, `n = clamp(level / full, 0, 1)` of the ability the step is practice in.
  That is 0.85 at 0, exactly 1 at 50, 1.15 at full. Units: a factor; nothing rounded.
- Which steps read which ability (`STEP_ABILITY` in `systems/coursework.ts`): Read The Scene, focus; Learn Lines,
  memory; the table work's steps, imagination; Work On The Note, adaptability. Break It Down reads imagination and
  Learn The Lines memory (`BRIEF.steps[].trains`). Learn The Part and a note on the lines read memory
  (`systems/production.ts`). Rehearsal reads none: it trains a technique, or the body or the voice.
- No evaluation reads it. An even actor (50) prepares exactly as every actor did before.

**The gain preview** (`practicePreview`, `systems/practice.ts`): before the hour, the practice control says about how
much the hour adds, to what, what carries over, the discipline a first hour grows, and why: the tier's factor, the
focus's, the day's focus, a repeat's share and discipline's lift.

- It's worked out by `previewGrowth`, which is `develop`'s own formula (`gainAfter`): one function both read.
- Today's count is read without counting (`repeatsSoFar`), at the instant the hour would land.
- The test holds the preview to the hour's actual gain to twelve places, a repeat and a carry-over included.

**Past mastery said.** Every piece reads a technique against `MASTERED` (90), so 90 to 100 moves no result: 0 of 427
pieces, measured again after the phase (`techniquePast90`). It's said:

- in the preview before the hour (`pastMastery`);
- in the feedback after it;
- on the technique's look ("the last 10 points move no result", or past it, "what it adds from here moves no result");
- in the guide's Practice entry, under Interpret and Mistakes.

The top of the range wasn't made to matter: T3 reads a technique over 90% of its range, and the criterion asks 80%.

**A course's note on the craft** (`noteCandidates`, `skillHeld`, `systems/coursework.ts`):

- Before: the weakest raw skill of the template's reads, whenever their weighted mean stood under 0.45 on the par's
  scale (`craftScore`).
- After: the same gate decides whether a note on the craft is given. Which skill it names is the one the judged
  result's own limits say cost the whole most, summed over the dimensions it cost: every technique, and every ability kept
  in the craft.
- With no craft limit, or no result to read, no note on the craft is given.

### Measured

- The static baseline didn't move, and couldn't have: no judged formula changed. That is every figure in
  `baseline.json` §1 to §9, compared field by field.
- What moved is the time a step takes. A memory of 85 learns lines 1.105 times as far a step as an even actor; one of 25,
  0.925 times. In the twin test, 75 against 25: the ratio exactly (1.075 / 0.925).

### Tests

- `tests/attributes-phase-2a.test.ts`, block 1:
  - the speed at 0, 50 and full;
  - Learn Lines through `school.prepare` at memory 25 and 75;
  - a brief's breakdown by imagination and its lines by memory, each moved by its own ability and not by the other's;
  - the preview equal to the hour, the third hour's 25% said;
  - past 90 said, before and after;
  - the note naming the costliest skill, not the weakest, under the gate, and none above it.
- Existing tests that read a step's exact move were held where they were, by setting the four abilities at 50, the
  speed of 1 (each with a dated comment). Those were the twin tests in `evidence-g09-life`, `evidence2-b03` and
  `evidence2-b10`, and the guide examples' players in `guide-examples-coursework`, `-craft` and `-productions`.
  The examples' setups now say "focus and memory at 50", "imagination and memory at 50" and "your memory at 50".
- `evidence-g18-school` refigured its 0.275 by hand: `0.55 × 0.5 × stepSpeed(focus)`, still under the 0.3 the table asks.
- `evidence-g24-school`'s note on Character Work: the setup now makes Character Work what holds the scene
  (`characterHolds`). The note was the weakest skill's until then.

## 2. The Partner Gate (M3, O1, O2)

### What changed

A class scene's connection and responsiveness read the preparation part `partner`, which only a rehearsal the partner
came to moved. A partner who declined, stood the player up or never trusted them held a mastered player's own scene at
68.17 (baseline §4). The brief's line: a weak partner must not secretly lower the player's recorded personal execution,
and the ensemble result stays honest.

**The decision: a route the player controls, not moving the part out of the personal result.** Your side of a partnered
scene, what you take in and answer, is your own preparation. Taking it out of your result would make the partner part
decorative there, and leave the Work With Your Partner note nothing to say.

Acting practice has a route for it: rehearsing with a reader in the partner's place. Sources:

- The Casting Directors' Guild's co-operative self-tape guidance: a reader "does not need to be an actor", and can be
  "virtual, via a pre-recorded app" (`docs/research/attributes/research-self-tape-briefs.json`).
- Stand-ins run lines when an actor isn't there (standincentral.com, "Predicting When You Might Need To Read Lines",
  2018).
- Actors hire a scene reader to rehearse with (Backstage, "The New Online Tool For Last-Minute Audition Rehearsals").

**The reader** (`READER`, `readerRehearsal`, `partnerPart`):

- **The step.** Run It With A Reader is a step of any paired piece: 60 minutes, once a day, asking what the partner step
  asks but the partner (a fight's choreography learned, an intimacy scene's boundaries agreed).
- **What it moves.** A new figure, `Assignment.reader`, by `0.3 · clamp(dayFocus, 0.5, 1.1)` of what's left of it. The
  partner's evening moves 0.4 to 0.45, so a reader is slower.
- **Your own partner part** is `1 − (1 − partner) · (1 − reader)`: the rehearsals together and the reader's, compounded.
  The showing, a step's `requires`, and "nothing more to gain" read it.
- **The partner's preparation**, which the scene together reads, is unchanged: `1 − (1 − own) · (1 − 0.8 · partner)`. It
  reads the rehearsals they came to and never the reader.
- **What else it does.** It rehearses in the way of playing and grows listening a step's weight. It moves no trust, no
  bond, and none of the partner's work.
- **Older saves.** One from before has no `reader`, so its partner part is what it was. No schema change, and no recorded
  result changes.
- **Where it's said.** The note on the partner part says how many evenings with a reader there were, or that the step
  exists. The guide's Rehearsing With A Partner entry and the Drama School tutorial chapter say it.

**The qualifying conditions, made explicit and executable** (`tests/attributes-phase-2a.test.ts`, block 2). A mastered,
prepared, rested player:

- whose partner declines every ask (trust under wary);
- takes Run It With A Reader through `school.prepare` once a day until the partner part is complete;
- comes to 100 on their own scene, `mastery: true`.

In the same test:

- the partner part with the partner stays 0;
- the partner's preparation is the same figure before and after the readers;
- the scene together with that absent partner is more than 5 points under one with a partner who came to everything.

### Measured (baseline §4, `classSceneMasteredPartnerNeverCameReaderRoute`)

| Measure | Before | After |
|---|---|---|
| Own result, mastered, partner part at 0, no route | 68.17 (65.7 to 71) | 68.33 (65.7 to 71): still so; step 4 moved it |
| Evenings with a reader to complete the part, day's focus 1 | no route | 7 (the part at 0.918) |
| Own result, partner never came, the reader's 7 evenings | not reachable | **100 on 56 of 56** |
| The scene together, that partner absent from every rehearsal | — | 81.89 (79.3 to 88.2) |
| The scene together, a partner who came to all of them | — | 93.53 (92.6 to 95.8) |
| Own result, 263 camera briefs, three readers (O1) | sd 0 | sd 0 |
| The take together by reader (O2) | 92.54, 85.09, 100 | 92.54, 85.09, 100 |

M3 now meets: a substitute route the player controls takes the own result to 100, and the ensemble result still moves
11.6 points with the partner.

## 3. One Growth Path (T2, the discipline lift)

### What changed

Three ways grew a level. `develop` halved a repeat the same day and read discipline. `grow` did neither: it grew a
class, a night, a call, a lab, a solo showing and coursework's training. `nudge` did neither either: it grew a house's
composure and presence. Now one function does every growth of the player's (`grown`, `systems/attributes.ts`):

- `develop` is `grown` with the practice curve;
- `nudge` is `grown` with a share of what's left;
- `grewFrom` (`systems/school.ts`) takes the weights a night (`nightWeights`), a rehearsal (`REHEARSAL_WEIGHTS`), a lab
  or a step grows, sums them per skill, and grows each skill once through `ordinary`;
- a class meeting's skills go through `ordinary` too.

`grow` is left for classmates only, who keep no development ledger. Their growth is exactly as before.

| Path | Before (points a session) | After |
|---|---|---|
| A class, a night, a call, a lab, coursework training (`grow`) | `0.42 · w · f · max(0, 1 − L/ceiling)^1.5` | the same `× lift × 0.5^n` |
| A house's composure and presence (`nudge`) | `amount · (100 − L)` | `amount · (full − L) × lift × 0.5^n` |
| Practice, steps, notes (`develop`) | `… × lift × 0.5^n` | unchanged |
| Workouts (stamina) | its own (`life.ts`) | unchanged: not in this step's scope |

Terms:

- `lift = 1 + 0.1 · (discipline − 50) / 50`, 1 for discipline itself;
- `n` is today's earlier sessions of the same source on the same target;
- full is still set exactly on arrival.

**No double counting:**

- A night that asks the scene twice (its own 2 and the play's reads) grows it once, by both weights summed. Until then
  it was two `grow` calls. Routed through `develop` one by one, the second would have been halved.
- Sources stay what they were (`class:<code>`, `night:<production>`, `rehearsal:<production>`, `lab`, `lab:showing`,
  `coursework:<step>`, `nerves:performance`). So two classes in two courses on one day don't halve each other. The same
  class, night or house twice the same day does.

### Measured

- The static baseline doesn't grow anything, so it doesn't move. That was confirmed field by field.
- From the new tests:
  - the same class twice in a day: the second keeps 0.45 to 0.5 of the first (a hair under half, from the level the
    first left), and the next day's is over 0.9 of the first;
  - discipline 100 against 0: a class grows 1.1 / 0.9 as much, to nine places;
  - a second house the same day: composure grows 0.49 to 0.5 of the first.
- In play the lift is small. A new life's discipline is `30 + 0.5 · conscientiousness`, 55 at the middle (a lift of
  1.01), and the practice days raise it.

### Tests

- `tests/attributes-phase-2a.test.ts`, block 3.
- Refigured by hand with dated comments:
  - `evidence-g22-school`: a lab's and the solo showing's rise, times the lift;
  - `evidence-g24-school`: the twins' discipline set alike, as their Scene Study already was;
  - `evidence-g21-school`: the held twin's growth on the Standing table, 0.0 until then, rounds to 0.1 now. The last
    afternoon's rehearsal reads discipline and came to 0.05 of the mean craft;
  - `evidence-g20-school`: the spring casting reads the researched twin at least as high, and her script half a point
    higher. The fall's classes now close the gap under the tenth the fit is shown to (54.52 against 53.96);
  - `evidence2-b12`: the played fall ends with a classmate's lines run booked that evening. Played on by the same
    policy past it, nothing is booked over the winter;
  - `school-fixes`: `grewFrom` takes weights.

## 4. One Stamina Rule (the inconsistent reading)

### What changed

A scene of two tones or more was judged in segments, stamina read only as the drain. A scene of one tone was judged
whole, stamina an input of its consistency, as the task's and the material's inputs listed it.

- **The scene** (`scenePiece`). From 2026-10-16 every performed piece with a scene is judged in segments: its tones, or
  with one tone, two halves (`toneSegments(tones, 2)`), as a play is. That was 31 of the 56 scenes. Work with no scene,
  a voice sequence, a song, a movement score or a fight, is still judged whole, stamina an input of its consistency as
  its profile says.
- **The material** (`FEATURE_EFFECT`). The stamina inputs of physical (0.8 a level, consistency) and vocal (0.6) went:
  every piece took them out of its inputs. After the change above, every performed piece with material is a piece, so
  nothing read them. The same two levels set the drain's load (`loadOf`), so stamina is read once.
- **The drain**, unchanged: `f = 1 − 0.3 · load · position · (1 − stamina/full)` on each segment's condition. A scene's
  load is `0.15 + (physical + vocal)/6`.

### Measured (baseline, after steps 1 to 3 against after step 4)

| Measure | Before | After |
|---|---|---|
| Stamina +10, scenes | +0.23 (cv 0.55) | +0.34 (cv 0.50) |
| Composure +10, scenes | +0.25 (cv 0.40) | +0.32 (cv 0.19) |
| Discipline +10, scenes moved | 49 of 56, +0.11 | 56 of 56, +0.14 |
| Listening +10, scenes | +1.53 | +1.48 |
| Composure, all pieces | 417 moved, +0.30, cv 0.30 | 417 moved, +0.31, cv **0.26** |
| Developing actor's scene at preparation 1 / 0.5 / 0 | 60.21 / 42.68 / 21.07 | 59.17 / 41.93 / 20.71 |
| Listening specialist over the even actor, scenes | +3.07 | +2.88 |
| Stamina specialist against the even actor, scenes | −1.67 | −1.28 |
| Best equal-budget actor, scenes | listening 56 of 56 | listening 56 of 56 |
| Generalist behind the best | 2.81 | 2.79 |
| Mastered: scenes, nights, castings, coursework, briefs | 56, 30, 30, 13; 4,495 | 56, 30, 30, 13; 4,495 |

The highest correlation of two abilities' effects moved 0.549 to 0.556, emotional depth and memory still. No pair is
near 0.9.

### Tests

- `tests/attributes-phase-2a.test.ts`, block 4: a scene of one tone and one of three, each judged in segments, the last
  segment drained and the first not, no stamina limit as an input. The body's and the voice's material asks stamina of
  no dimension.
- `evidence-g01-life`'s workouts-to-a-scene journey was refigured. It held the scene's consistency higher by stamina's
  share of its inputs, and that scene was of one tone. Now:
  - the first half is the same in both twins;
  - the second half's drain matches the rule, to three places, higher for the trained twin;
  - the whole is no lower;
  - on a scene this light on the body (load under 0.2), sixteen mornings show at a hundredth of a point.
- `docs/ATTRIBUTES-MATRIX.md` was rewritten (`tools/attributes-matrix.ts`): the physical and vocal rows draw no stamina.

## 5. The Mastery Guarantee, Re-Run (M1, M2)

- **M1, static.** 4,495 brief cases at 100 and `mastery: true`, and 56, 30, 30 and 13 other pieces at 100. 0 drawn takes
  off 100 at mastery.
- **M2, played.** The plans named by `docs/verification/ATTRIBUTES-GENRES-PASS-2026-10-12.md`
  (`docs/verification/briefs/mastery-*.json`), re-run through the commands on this phase's code:

| Plan | Before (2026-10-12) | First re-run | Second, stamina a target | Third, each beat's rehearsal |
|---|---|---|---|---|
| Drama, seed `m-1` | ready 2030-01-20; three tapes at 100, `mastery: true` | ready 2030-01-11; tapes at **97.9**, held by "Stamina, By Beat 2" | ready 2029-12-20; tapes at **99.6**, held by "Rehearsal on your feet" | ready 2029-12-22; **three tapes at 100, `mastery: true`**; the healthy twin 100, no limits; the flu twin 94.6 |
| Musical, seed `m-0` | ready 2030-11-03; tapes at 100; the healthy twin 100 with "Stamina (−0.1)" and `mastery: false` | ready 2030-11-19; tapes at **91.1**, held by stamina's drain | ready 2030-10-29; tapes at **99.7**, held by rehearsal | ready 2030-10-20; **three tapes at 100, `mastery: true`**; the healthy twin 100, `mastery: true`, no limits; the flu twin 92.3 |

Each run: 0 breaches and 0 unbalanced entries, graduated 2029-05-21, every gain through the commands
(`phase-2a-mastery-drama.json`, `phase-2a-mastery-musical.json`).

**What the re-runs found: the plan, not the guarantee, twice.** Neither was the engine's.

- **Stamina.** `tools/mastery.ts` trains what a brief reads: the task's inputs and the material's.
  - Stamina was among them only where the body's or the voice's material listed it as an input. That was the
    musical's, not the drama's.
  - Step 4 took those inputs out, so neither plan trained stamina. Every taped brief reads it all the same, as the
    drain through its beats, and both came short by stamina alone.
  - The qualifying conditions say every ability the task reads at full, stamina at its age's ceiling. The plan now
    names stamina as a target for every brief. That is also why the musical's healthy twin, at 99.9 consistency in
    2026-10-12's run, is at 100 now.
- **Each beat's rehearsal.** The plan counted the brief prepared at its plain figure, 0.5, where a beat a turn leads
  into, or held two ways, asks more (up to 0.85).
  - On 2026-10-12 the plan happened to rehearse past what every beat asked (0.769) before its targets were full.
  - Readier sooner on this phase's code, it taped at 0.71 against a beat's 0.73.
  - The qualifying conditions say "every segment's own", so the plan now reads each beat's (`segmentRequired`), and
    rehearses toward the most asking one. It came to 0.823 and 0.822.

Both are tool fixes, each with a dated comment in `tools/mastery.ts`. No engine figure moved for them.

## 6. Mutations

Each applied, `tests/attributes-phase-2a.test.ts` run alone, the file restored (`git diff` clean of it after).

| Mutation | What it puts back or breaks | Killed by |
|---|---|---|
| Own partner part reads the partner's rehearsals only | step 2 undone | the reader test |
| The partner's preparation reads the reader | the ensemble made dishonest | the reader test (partner's preparation unchanged) |
| The reader moves the partner part itself | the two figures merged | the reader test |
| No same-day halving in `gainAfter` | step 3's halving | the class and the house tests |
| No discipline lift in `gainAfter` | step 3's lift | the lift test |
| `nudge` sets the level directly again | the old nerves path | the house test |
| A night's weights grown one by one | a doubled skill halved against itself | the night test |
| The preview counts no repeat | preview drifts from the hour | the preview test |
| The preview at a day's focus of 1 | preview drifts from the hour | the preview test |
| Past mastery unsaid | T1's "past 90 said" | the past-mastery test |
| No step speed | step 1's speeds | three speed tests |
| The note names the cheapest skill | F1 undone | the note test |
| A scene of one tone judged whole again | step 4 undone | the tones test |
| Stamina back among physical's inputs | step 4's inputs | the material test |

14 of 14 killed.

## 7. The Checks

- `tsc -b --noEmit`: clean on every file of this phase. At the last run the banking work, mid-edit beside it, had five errors of its own (`abroad.ts`, `banking.ts`, `bankmoves.ts`).
- `eslint` on every touched file: clean.
- `title-case`, `label-sweep`, `typos`, `plural-check`, `doc-refs`, `wired`: clean.
- `spelling`, `tics`, `voice-check` fail on the banking work's files only (`bankmoves.ts`, `banks-world-sheets.ts`,
  `security.ts` and others). The three phrasings of this phase they flagged were rewritten. None of this phase's files is
  listed now, but three lines that were there before it.
- `coverage`: the audit row for the refigured workouts journey (`docs/verification/audit/life.json`) names its new title and says what changed; `docs/GAMEPLAY-COVERAGE.md` rewritten from it, that row alone different. `student-matrix`, `capabilities`, `deciders`: clean. `traceability`, `inventory` and `devmap` are behind the banking work only; rewriting them would have written its rows, so they weren't.
- Each touched test file run alone: 17 files, every test passing.
- The full suite: 4,076 of 4,079. The three failing were failing before this work began, all the banking work's:
  - two stale-claims tests on `src/engine/content/home-accounts.json`;
  - `world-map` on `CharacterCreation.tsx`.

## 8. The Criteria After 2a

| Id | Before | After | The number |
|---|---|---|---|
| A4 | Fails, 9 claims | Meets, by this review | every flagged claim made true; see §1 |
| T1 | Fails | Meets | the gain shown before, from the hour's formula; the gain, tier, repeat and past 90 said after |
| F1 | Fails | Meets for which skill is named | the gate on whether a note on the craft is given is still the raw craft against the par |
| M3 | Fails | Meets, by the substitute route | own 100 on 56 of 56 with the partner absent; together 81.89 against 93.53 |
| M2 | Not re-measured | Meets | both plans, re-run through the commands, tape 100 with `mastery: true` three days running (§5) |
| A3 | Fails | Still fails, and **composure now fails it too**: 97.7% moved at cv 0.26, where it stood at the line, 0.30 | step 4: scene consistency no longer shares its inputs with stamina |
| Everything else | as `baseline.md` | unmoved, or moved as §4 says | — |
