# The Attribute And Genre Engine: Its Model, Invariants And Balance

Written 2026-10-10, for ruleset `evaluation-2 (2026-10-10)`; from 2026-10-12 the ruleset was `evaluation-3`, and §9
says what changed. From 2026-10-16 it's `evaluation-11` (it said `evaluation-8` until the integration pass of that day, `evaluation-9`
until brief 09's follow-up later that day, and `evaluation-10` until brief 10's workload), and §10 says where each change since `evaluation-3` is
written. This document wasn't rewritten for them: where its §1 to §9 and §10's accounts disagree, the accounts hold, and
the lines found false are marked in place. Every formula below is the code's, with the file it lives in. Every number is either a research figure (cited in `docs/research/attributes/`) or **SLATE's**, and says
which. The research gives directions and orderings much more often than sizes. Where a size is SLATE's, the balance
section says how much the conclusions depend on it.

This document claims no exact real-world growth rate and no "perfect" model. What it does claim is narrower and
checkable: the invariants hold for every case `tests/engine-properties.test.ts` draws, and the balance targets held
on the seeds listed below.

---

## 1. A Piece Of Work, Judged

`systems/evaluation.ts`, `judge()`. A task (`content/tasks.ts`) has dimensions. Each dimension has weighted inputs
(abilities, and the work's techniques sharing a technique weight), parts of preparation it reads, and the conditions
that reach it.

For each dimension *d*:

| Quantity | Formula | Source of the numbers |
|---|---|---|
| Capacity | `c = Σ wᵢ·nᵢ / Σ wᵢ`, with `nᵢ = level/full` for an ability and `craft/90` for a technique (`MASTERED = 90`) | SLATE's |
| Shaped | `s = c^(1 + difficulty)`, difficulty from −0.5 (a class exercise) to 1 | SLATE's |
| Prepared | `p = min over parts of 0.35 + 0.65·min(1, done/required)` | floor 0.35 SLATE's |
| Condition | product of: fatigue `0.6 + 0.4·min(1, readiness/60)` under 60; ill 0.85; injured 0.6 | SLATE's sizes; direction from the sleep-loss literature |
| Fit | 0.85 where the way it's played goes against the material or the direction, else 1 | SLATE's |
| Spread | `1 + 0.5·(1 − readiness/60)` under readiness 60, else 1, applied to **negative** draws only | Doran et al. 2001 (direction); size SLATE's |
| Variation | `V·(spread if δ<0)·(1 − s)·p·cond·fit·δ`, with `V = 10` and δ ∈ [−1, 1) the seeded draw | SLATE's |
| Quality | `clamp(100·s·p·cond·fit + variation, 0, 100)` | — |

The whole is `0.75·(weighted mean) + 0.25·(weakest dimension)`. The weights are the task's, leaned by the material
and the choice (`leanedWeights`), then **renormalized to the task's own total**.

**Limits.** Each input below full, each part of preparation, each condition and a misfit is a limit. Its cost is the
dimension worked out again with that one thing made whole, less the dimension as it was. The draw stays the same.
When fatigue is the limit removed, its spread goes too.

### Material and choices

`content/material.ts`, `content/approaches.ts`, `systems/material.ts`.

- Each of the 68 materials, and from 2026-10-12 each of the 149 practice briefs, carries five feature levels (timing,
  physical, partner, vocal, improvisation, 0 to 3), its language, tones, turns and medium. The reasons for each level
  are written beside it.
- A feature multiplies the lean of the dimensions it reaches by `1 + per·level`, and adds abilities to their inputs.
  Both were doubled on 2026-10-12 (§8): until then a level-3 feature, the material built on it, made its ability about
  a fifth of one dimension.
- A brief's beats count apart (§8): a change of tones between beats is a transition (adaptability, composure); a beat
  with two tones held at once is a blend (emotional depth, imagination). Each asks more rehearsal before it counts.
- A choice of pace, scale and structure leans the weights (×0.9 to ×1.2 per side) and adds inputs.
- Where a choice's lean is 1.1 or more, the choice must be rehearsed in (prep part `approach`, complete at 0.9; from
  `evaluation-5`, at 0.8 to 1.0 by how well the side suits the scene, §10).
- A change of choice keeps half of what was rehearsed (`PLAYING.keptOnChange`).
- Against the material or the director's direction, a choice is held to `MISFIT = 0.85`. This is said before the
  choice is made.

Written work (`UNPERFORMED`) meets only the material's language.

---

## 2. Growth

`systems/attributes.ts`, `abilityGain()` and `develop()`.

```
ordinary  = 0.42 · weight · focus · max(0, 1 − level/reach)^1.5
deliberate = 0.42 · weight · focus · max(0.25, 1 − level/100) · [level < 100]
gain = max(ordinary, deliberate if deliberate practice) · discipline lift · 0.5^(repeats of this source today)
```

- Discipline lift: `1 + 0.1·(discipline − 50)/50`, which is ±10%.
- Arriving at full sets the level exactly to full.
- A practice day stops counting after four hours (Ericsson et al. 1993: the daily limit's direction).

### Practice

`systems/practice.ts`, `content/practice.ts`. An hour's weight is the tier factor times the focus factor. Every number
in this table is SLATE's; the research gives only the direction.

| | Factor | Basis |
|---|---|---|
| Tier matched (bands 45, 75) | 1 | Challenge point (Guadagnoli & Lee 2004): the best difficulty rises with skill |
| One tier below / above | 0.75 / 0.8, and above costs 3 more energy | same, no numbers given |
| Two tiers away | 0.5 | same |
| Steady | 1 | — |
| Precision | 1.15 rested (focus ≥ 0.85), 0.85 tired | slow, exact practice pays when fresh |
| Spaced | 1.1 within 1–7 days of the last session; **0.9 outside** | Cepeda et al. 2006 and 2008 (a ridge: too short and too long both lose); Donovan & Radosevich 1999 (d ≈ 0.46, smaller for complex tasks) |
| Variation | 0.85 on the target; 0.3 to the exercise's kin | contextual interference (Brady 2004): better transfer, uncertain size |
| Live | 0.85 on the target; 0.15 each to listening and adaptability | partner work |

Two rules stop the focus from being a way round the repeat rule:
- The repeat source is the exercise's alone, so changing focus doesn't dodge the same-day halving.
- A transfer is its own source (`transfer:<exercise>`), halved on its own repeats.

### Experience

`systems/experience.ts`.

- **Familiarity.** For each of a material's features: `min(1, (met + practised)/6)`, then the mean over its features.
- **Preparation speed.** `max(genre speed, feature speed)`, each `1 + (1/6)·familiarity`. Taking the larger, never
  the sum, is what stops double-counting. A brief's steps (§8) take feature speed alone: knowing its genre is a part
  of the take's own preparation, so it doesn't also speed it.
- **No effect on quality.** Experience reaches no evaluation input. It only makes preparation faster.
- **Recommendations.** These weigh recent limits toward the latest result, drop any input already at full, and scale
  by the room left since.

---

## 3. Invariants

Each one is a test. Most are properties over 1,500 drawn cases (every task, every material, random choices, random
levels, preparation, readiness, illness and injury); the others are named beside them.

1. **Bounds.** Every dimension and the whole stay in [0, 100]. Every limit's cost is positive and no more than what
   the dimension lost.
2. **Monotonicity.** Raising any one input never lowers a dimension or the whole. Until 2026-10-16's integration pass
   it allowed 0.05 for rounding; a result is rounded once since (evaluation-9), from an exact value that never falls.
   The inputs are an ability, a technique, a part of preparation, readiness, or removing a misfit.
   - This includes the corner where every factor is at its floor (about 0.09) and the draw is above 0.95.
   - That corner has its own test, because random cases miss it. The draw is scaled by the factors so that it can
     never outrun them there.
3. **Mastery contract.** Every input full, preparation complete, readiness at or above 60 and a fitting choice give
   exactly 100, `mastery: true`, and no limits, for every task × material × choice drawn. Also tested over every
   material × fitting choice in `tests/material.test.ts`.
4. **Preparation past complete is complete.** It adds nothing more.
5. **Determinism.** The same case and key give the same result, and a different key gives a different night (more
   than 200 of 300 differ). Kept results replay to the same result (`tests/attributes-complete.test.ts`).
6. **Normalization.** A material's and a choice's lean never changes the total weight.
7. **A bounded draw.** At most `V` upward, and at most `V·1.5` downward on the most tired day.
8. **Growth.**
   - Gain is never negative and never more than a session's most.
   - Gain is 0 at 100.
   - Gain never rises as the level rises.
   - Full is reached exactly.
9. **No free focus.** Each focus other than steady has a condition where it gives less than steady. The matched
   tier is never beaten by another tier at any level.
10. **Breadth focuses are even.** Live's and variation's totals per hour are equal (0.85 + 2·0.15 = 0.85 + 0.3).
11. **Experience is capped.** Experience speeds preparation by at most a sixth, only for material with features, and
    never touches quality.

### Mutation record (2026-10-10)

Eighteen mutations, each applied alone against the relevant tests:

- **Killed: 17.**
- **Survived: 1, and it is equivalent.** In "preparation past what completes it counts", `prepared` is a `min` that
  starts at 1, so the inner `min(1, …)` is a redundant guard. That clamp already settles it.
- **Survivors killed by tests added that day: 4.**
  - The draw not scaled by the factors. The floor-corner test.
  - Preparation past complete. Shown to be equivalent, and documented as such.
  - One hospital stay triggering a mandatory-leave assessment.
  - An appeal decided with any amount of the term left.

---

## 4. Balance

### Targets

1. **No dominant fixed choice.**
   - No focus is better than steady on its own target in every condition.
   - Neither breadth focus beats the other on both the target and the total.
2. **The matched tier is best.** Pitching above or below costs on every seed.
3. **Reading the day pays, modestly.** Choosing the focus by the day's state (adaptive) beats the best fixed habit
   by no more than about 20% on the target. Choices matter, but they don't trivialize training.
4. **The conclusions hold on held-out seeds,** and survive ±20% on any one size.

### Method

`tools/strategies.ts` runs one student per seed for 60 days. Each student gets two practice hours a day, rotating
`given-circumstances`, `adjustments` and `voice-work`. The only thing that varies between runs is how each hour is
spent.

- **Inputs.** Practice goes through `practice.exercise` only. Classes, calls, sleep and meals are played by
  `tools/policy.ts`.
- **Measure.** Gains come from each command's own return value. The development history keeps only its last 400
  entries, which an earlier version of the tool summed and so undercounted.
- **Seeds.**
  - Matched: `st-0`, `st-1`, `st-2` (looked at while the sizes were set).
  - Held out: `st-10`, `st-11`, `st-12`.
- **Runs.** 65 to 66 practice hours per run.

### Results

Each cell is the mean gain in level points over three seeds. "vs steady" is the paired difference on each seed.

| Strategy | Matched: target | Matched: total | Held-out: target | Held-out: total | Held-out vs steady, per seed |
|---|---|---|---|---|---|
| Steady | 14.42 | 14.42 | 14.63 | 14.63 | 0, 0, 0 |
| Precision | 16.41 | 16.41 | 16.65 | 16.65 | +2.16, +1.97, +1.95 |
| Spaced | 15.68 | 15.68 | 15.90 | 15.90 | +1.36, +1.24, +1.23 |
| Variation | 12.35 | 16.76 | 12.53 | 17.17 | +2.51, +2.34, +2.78 (total) |
| Live | 12.28 | 16.01 | 12.46 | 16.24 | +1.76, +1.50, +1.57 (total) |
| A tier above | 11.64 | 11.64 | 11.69 | 11.69 | −3.20, −2.75, −2.87 |
| A tier below | 10.95 | 10.95 | 11.11 | 11.11 | −3.75, −3.42, −3.37 |
| Adaptive | 16.43 | 16.43 | 16.67 | 16.67 | +2.19, +1.99, +1.96 |

**Practicing late (`--from 21`, matched seeds).** This scenario is small: only about 5 practice hours fell after
21:00 in 60 days.

| Strategy | Target gain | vs steady |
|---|---|---|
| Steady | 0.80 | — |
| Precision | 0.68 | −0.13, −0.09, −0.14 |
| Spaced | 0.75 | −0.06, −0.03, −0.06 |
| Adaptive | 0.81 | +0.01, +0.02, +0.02 |

### What the runs changed

1. **Spaced weakly dominated steady.** Outside its window, spaced was 1, never worse than steady, so steady was never
   the better choice. It is now 0.9 outside the window (the research's ridge).
2. **Live dominated variation.** At 0.9 on the target and 0.25 to each of two, live beat variation on both the target
   (12.92 against 12.35) and the total (19.05 against 16.76) on every matched seed. It is now 0.85 and 0.15, which
   carries the same per hour as variation.
   - On this plan variation still leads live by about 5% in total. That is because live carries to adaptability,
     which `adjustments` also trains, so a carried point there grows a target that is nearer full.
   - Per hour, the two are equal by construction.
3. **Recommendations suggested spaced every time.** They now suggest steady, and say when spaced pays.

### Sensitivity (matched seeds, one size ×0.8 or ×1.2)

| Changed | Result | Conclusion |
|---|---|---|
| Tier above ×1.2 (0.96) | still −0.34 to −0.74 vs steady | holds |
| Tier below ×1.2 (0.90) | still −1.32 to −1.48 | holds |
| Variation transfer ×0.8 | total +1.34 to +1.67 vs steady; target unchanged | holds: breadth still trades target for total |
| Spaced within ×0.8 (0.88) | −1.57 to −1.77 vs steady | **flips**: spacing pays only while its factor is above 1 |

The same holds for precision's rested factor: it pays only above 1. The research supports the direction of both
(spacing and fresh, exact practice help), but not their size. A future change that took either to 1 or below would
leave the focus with no use, and test 9 would fail.

### Target status

| Target | Status |
|---|---|
| 1 | Met: each focus has a losing condition; breadth focuses are even per hour |
| 2 | Met on all six seeds and under ±20% |
| 3 | Met: adaptive vs steady is +14.0% on the matched seeds and +14.0% on the held-out ones; adaptive vs precision is under 0.2% |

**A finding on target 3.** Adaptive ≈ precision here because the policy's students practice rested. The late
scenario shows the reverse, but its sample is small (about 5 hours).

### The wider grid (integration pass, 2026-10-11)

The first comparison was mostly rested students. The integration pass widened it with `tools/strategies.ts`, run by
`tools/balance-batch.mjs`. The full tables are in `docs/verification/BALANCE-GRID.md` and the raw lines in
`docs/verification/balance/results.jsonl`.

**Sample.** There are 13 scenarios, each on the matched seeds (`st-0` to `st-2`) and the held-out ones (`st-10` to
`st-12`), plus 20 sweeps on the matched seeds.

- Each cell is n = 3 runs of 30 days, inside the School's own week.
- Every strategy on a seed meets the same days.
- Each cell reports its mean, standard deviation and range, and the paired difference from steady.

**Scenarios.**

- Beginner, developing, specialist, uneven and mastered starting levels. The levels are TEST SETUP.
- Rested and tired days. A tired day is TEST SETUP of the night before: mean focus about 0.62, over about 60
  practice hours a run.
- One, three or six exercises, three techniques, or what a scene reads.
- Every day or one day in three; two or four hours a practice day.

**Measures.**

- The levels gained.
- Work: the change in two scenes' expected whole (The Importance of Being Earnest, Richard III).

**Validity.** The grid ran first on `src` `c73d2b43`, then again on the final `src` `9ee4b8d9`. All 336
strategy-scenario cells came out identical: this pass's engine changes didn't touch practice gains.

**What it showed.**

- **Tired days, now a real sample:**
  - Precision loses about 15% to steady on every seed.
  - Spaced gains about 9% on every seed.
  - The late-practice sample of the first comparison (about 5 hours) is replaced by about 60 hours a run.
- **The matched tier is best** in every profile with room above it. A specialist already in the top band has no
  tier above, so tier-above equals steady.
- **A mastered student gains nothing** whatever the strategy. Practice stops mattering at full; the hour's
  feedback says the work is in new material.
- **Breadth focuses trade:**
  - Variation and live lose about 15% on the plan's targets.
  - They often gain on the scenes' work, because they carry over to what the scenes read.
  - With a plan that trains what a scene reads directly, precision beats both on work on every seed. So live's lead
    on work came from plans that trained something else, not from a shortcut.
- **One day in three.** Under the School's load, one exercise comes round every 9 to 15 days. That is past
  spacing's 7-day window, so spaced practice falls slightly behind steady (−0.06 to −0.08). This is the long-gap side
  of the spacing ridge appearing under a real constraint, not a bug.
- **No exploit:**
  - The same exercise again the same day keeps half (the repeat source is the exercise's).
  - Carry-over is its own source per exercise and halves on its own repeats.
  - Four hours of variation carry at most 4 × 0.3 to kin targets, against 1.875 from the same four hours spent
    directly.

**Defensible ranges, and the reversal explained.** The research gives each focus's direction and says the effects
are small. A defensible range keeps the direction (a bonus above 1, a cost below 1) within sizes such effects are
reported at. The first comparison's ×0.8 sweep took spaced practice's bonus to 0.88: below 1, contradicting the
direction of the research. A reversal there is the sweep testing a different claim, not a balance fault.

Swept at each end of its range on the matched seeds, every conclusion held:

- Precision wins on a rested day and loses on a tired one.
- Spaced stays ahead of steady across its whole range, and loses only where gaps run past its window.
- The matched tier stays best.
- Variation and live always cost on the targets.

| Number | Range | Where it bites | Both ends |
|---|---|---|---|
| precision.rested | 1.05–1.25 | rested | ahead of steady at both |
| precision.tired | 0.70–0.95 | tired | behind steady at both |
| spaced.within | 1.03–1.25 | rested | ahead of steady at both |
| spaced.outside | 0.85–0.97 | one day in three | behind steady at 0.85; level at 0.97 |
| variation.primary / live.primary | 0.75–0.95 | rested | behind steady on targets at both |
| variation.transfer / live.transfer | 0.20–0.40 / 0.10–0.20 | one exercise | ahead on work at both |
| tier.above / tier.below | 0.65–0.95 / 0.60–0.90 | rested | the matched tier best at both |

No number needed changing this pass.

---

## 5. Mastery Kept Interesting

Full is reachable and kept: `tools/mastery.ts`, the `mastery` suite. At full, the hour's feedback says the work now
is in new material. Three things change what is interesting at full:

- **Material features.** A play's demands change which abilities a dimension reads.
- **Choices.** These change the weights, can misfit, and must be rehearsed in.
- **Direction.** A director asks half the time and gives notes on choices that go against it.

A fully mastered actor still loses points to a misfit choice or an unrehearsed one. The tests are in
`tests/material.test.ts`: "a choice the material forbids … holds the dimensions it leans on under 100 even at
mastery", and "an unprepared choice is a visible part of preparation".

---

## 6. What Feedback And Notes Read (integration pass, 2026-10-11)

`tools/variety.ts` played three students through two School years each and counted situations, not text. A
paraphrase isn't a new situation. The results are in `docs/verification/VARIETY-2026-10-10.json`.

Two places read the moment alone and ignored the history behind it.

- **An hour's feedback** (`practiceFeedback`). One student was told "Developing: … Pitched where you are." 175 hours
  in a row while imagination rose from 53 to 70. The exercise's record now keeps its run of sessions and its last
  gains, and the feedback says:
  - what the hour moved, and where the level now stands against the next tier;
  - that the student has moved up a tier since last time, when they have;
  - from the sixth session in a row, how long the run is;
  - when gains are falling (the last three under 80% of the first three), what a variation hour would carry to
    instead.
- **A director's skill note** (`noteFor`, `noteText`) went to the weakest skill the play reads every time, whether or
  not the last note had been taken. Now:
  - a taken note moves the next one to the next thinnest place;
  - the same note again says "Still:" when it wasn't taken;
  - the same note again is acknowledged when it was taken.

**After the fixes, on the final source, across all three seeds:**

- Feedback was never the same twice in a row.
- No note was repeated on something just taken without a word.
- No scene was set twice in a row, and every scene met again asked something new (8 of 8).
- All 15 classmates were partnered, never the same one twice in a row in a course.
- A recommendation was ignored at most one week (top while two hours or more went to other practice), never stuck,
  and never made for a target at full.

## 7. The Content's Limits

The pool is finite, and nothing here claims otherwise. Variety comes from the record, not from more text.

- **Material:** 67 scenes and 30 plays (65 until brief 10 added two public meetings, `content/scenes-meeting.ts`), each with its structured profile (42 and 26 until the limitations pass of 2026-10-11,
  56 scenes until 2026-10-16, when the integration pass added four drama scenes, brief 09 four played out to a house and
  its follow-up Scapin's sack scene),
  and from 2026-10-12 149 practice briefs, one written for each genre, with 302 readings among them (§8).
- **Practice:** 27 exercises, each with three tiers and five focuses.
- **Choices:** three axes of choice and two sides each. A director asks for a side half the time.
- **Coverage in two years:** a student meets about 38 of the scenes. After that, a scene comes back asking
  something new of it (`revisitOf`):
  - a different part;
  - a different partner;
  - a different reading.
- **Weeks with no work decision:** 47 of 105, the School's breaks and written-work weeks. Practice's exercise, tier
  and focus remain a choice every day.

## 8. Practice Briefs (2026-10-12)

`content/briefs/`, `systems/briefs.ts`, `ui/components/BriefPane.tsx`. Until this pass a self-tape in a genre had no
material: the camera's task, the genre's applied demands and its familiarity. 98 of the 149 genres reached the player
only that way. Every self-tape is now of a brief, an original scene written for SLATE: one for each genre when this
section was written, two from the connected-journey pass (§9).

### What a brief is

- **Its setup:** circumstances, relationship, who you play and who the reader plays off camera, objective, obstacle,
  and two to four beats (up to six for a long brief, from §9). This is the breakdown the acting texts set out: Stanislavski's given circumstances and tasks,
  and Hagen's questions (`docs/research/attributes/research-self-tape-briefs.json`). Every number is SLATE's.
- **Its material profile:** the five features, language, medium (`camera`, or `voice` at a microphone for the five
  voice genres), beats, and the techniques its scene stages. A genre adds no demand of its own: a brief listed under a
  genre with applied demands stages them (`tests/briefs-content.test.ts`).
- **Its readings:** two or three, each supported by the brief. Each leans the dimensions (0.85 to 1.25) and draws on
  abilities (0.3 to 1). None misfits; only the material's `allows` and a callback's note can hold a choice back.
- **Staged for a tape:** nothing touches the reader. A fight is marked solo against called cues, and an embrace is
  played to the eyeline beside the lens.

### How a take is judged

- **The task** is `tape`: the camera's four dimensions, plus connection (listening, presence) and responsiveness
  (listening, adaptability), which a reader off camera brings.
- **A reading's** leans are squared and its abilities' weights doubled (`BRIEF.readingLean`, `readingDraw`). Then
  everything is normalized together.
- **Preparation** has four parts:
  - the breakdown, complete at 0.8;
  - the lines, complete at 0.8;
  - rehearsal, complete at `0.5 + 0.08·transitions + 0.04·blends`, at most 0.85, until §9 judged a brief beat by beat:
    each beat now asks 0.5, and 0.15 more where a change of tone leads into it, 0.08 where it holds two, up to 0.85;
  - knowing the genre, the better of familiarity and practice, complete at 0.3 (at 0.9 from `evaluation-4`, §10).

  A way of playing it adds its own rehearsal, complete at 0.9 (at 0.8 to 1.0 from `evaluation-5`, §10).
- **The steps:** Break It Down takes 30 minutes, Learn The Lines 30, 50 or 70 (a long brief, from §9), Rehearse It On
  Your Feet 45. Each moves
  its part by `gain · focus · trait · featureSpeed · (1 − part)`, at gains of 0.6, 0.6 and 0.5, halved again the same
  day.
- **Pitch:** a brief is pitched at a student (−0.2); a callback adds 0.3.
- **A take's purpose:**
  - first;
  - a callback;
  - another reading;
  - another way of playing it;
  - improved: its expected result a point or more over the last take's;
  - the same again, which counts and is worth half as practice (`againWorth`) on any day.
- **Callbacks:** a Strong take earns one callback, a harder pitch with a note on one side of one axis the brief
  allows, said before the take. Answering it earns none; a fresh take can.

### Invariants added

Each is a test in `tests/briefs.test.ts` unless named.

1. **The guarantee.** Over 900 cases, every brief × reading × fitting way of playing it, fully prepared, mastered and
   on a sufficient day, comes to exactly 100 with `mastery: true` and no limits. A callback answered as its note asks
   is 100 too.
2. **No reading misfits,** and no lean adds weight.
3. **What it doesn't read changes nothing.** An ability or technique a brief doesn't read leaves the take where it was;
   one it reads raises it. This holds for every brief and every ability.
4. **Readings matter to someone.** For every brief, at least one of three actors of different strengths comes out
   differently by the reading.
5. **Tone held and tone changed.** A change of tone between beats and a beat held two ways each ask more rehearsal. The
   change asks adaptability and the held beat depth, so different actors meet each differently.
6. **Tags.** A brief's genres reordered or repeated change nothing, 0 of 149 moved (`tools/brief-balance.ts`), and they
   share one session's practice.
7. **Played through the commands:**
   - each step's time;
   - the refusals, each with its reason;
   - an action sent twice lived once;
   - the purposes;
   - one callback a round;
   - the record and the draw across a save and a reload.

### What the measurements showed, and what they changed

**Catalog-wide,** every brief, by the evaluation's expected result (`docs/verification/BRIEF-BALANCE.md`).

- **Specialist and generalist, the same budget.** Across every kind of work the School sets, each specialist is ahead
  somewhere and behind elsewhere.
  - The feeling specialist leads on taped briefs, songs and auditions, and trails on all 56 scenes shown and all 30
    nights.
  - The body specialist leads on voice, movement and clown work, and trails on every taped brief. Its deficit there
    falls as the brief is built more on the body and the voice:

    | Physical plus vocal level | Body specialist against the generalist |
    |---|---|
    | 0–1 | −9.0 |
    | 2–3 | −6.2 |
    | 4 or more | −3.2 |
- **Readings.**
  - A specialist's best and worst reading of a brief are 0.7 to 1.4 points apart on average, up to 3.6.
  - Two specialists' best readings differ on 42 to 133 of the 149 briefs.
  - For an even actor they tie, as they must.
- **Preparation.** For the developing actor: 20 unprepared, 44 half prepared, 56 complete.
- **A weakness trained.**
  - +20 on the input that costs a brief most adds 2.0 (1.2 to 4.2), n = 149.
  - +20 on an input the brief doesn't read adds exactly 0, for all 149.
- **Transfer.** +10 on emotional depth moves all 149 briefs, by 1.4 on average. Vocal moves 76 of them and physical 85.

**Played** (`tools/brief-strategies.ts`, results in `docs/verification/briefs/`): 24 hours each, n = 3 a cell, on
matched and held-out seeds.

| Way | Mean Take | Genre Practice Per Take | Abilities Gained |
|---|---|---|---|
| Prepared | 46.6 | 10 | −0.9 |
| Trained between | 47.2 | 10 | +1.6 |
| Tape only | 21.1 | 2.2 | −1.4 |
| Breadth | 21.1 | 10 | −1.0 |
| Repeat one | 58.3 | 2.8 | −1.4 |

Repeat one has the best takes because its own takes build that genre's knowledge. It's ahead on that one brief and
level everywhere else: on the 20 held-out briefs every way is within 0.3.

**Long runs** (`tools/brief-journeys.ts`): 120 days of term, four profiles, two seeds.

- No take was the same again in any run.
- The purposes were first takes, other readings and callbacks.
- Quality rose over the term for the beginner, 52.7 to 56.1, and for the developing student, 53.9 to 57.3.
- 0 breaches and 0 unbalanced entries.

**What the runs changed**, each explained where it lives:

1. **The pitch went from 0.125 to −0.2.** A first-year's well-prepared take came out at 30, with nothing to do but
   wait.
2. **Feature effects were doubled.** One kind of actor led the even one on 139 of 149 briefs, whatever each was built
   on.
3. **Readings were strengthened.** A specialist's choice of reading moved the result by under a point on most briefs.
4. **Knowing the genre changed.** It became the better of familiarity and practice, complete at 0.3, and no longer
   speeds preparation. A student had spent 21 hours of a month studying one genre and taped nothing.
5. **The steps were lightened.** A first brief in a new genre took about 14 hours to have ready; it takes about 4 now.
6. **One callback a round.** A mastered student taped one brief 84 times, a new note each time. The same runs found
   that a way of playing chosen after rehearsal was complete could never be rehearsed in. Coursework had the same bug.
7. **The same again is worth half.** Unprepared repetition had credited a genre with more practice than preparing did.

### Mutation record (2026-10-12)

Twenty mutations of the new rules, each run alone against the brief, content, genre-coverage and engagement tests.
All twenty were killed.

Four first survived:
- two were tests comparing against the constant they mutated (rehearsal per transition, the microphone's lean);
- two were rules with no test (a step's same-day halving, a held beat's own demand).

Each has a test now.

### Limits

- **The content is finite:** 149 briefs, one written for each genre, with 302 readings, when this section was written.
  From §9, 298 briefs, two for each genre, with 648 readings.
- **On camera, a taped brief favors feeling.** The body and voice specialists are rewarded by the School's movement,
  voice and clown work, not by taping.
- **Sizes are SLATE's design.** That covers the pitch, the steps, the completes, the reading strength and the callback's
  lift. The research supports the shape of a breakdown and that a scene has more than one valid reading (Hagen). It
  also supports that an adjustment given before a take is expected to be taken (Merlin). It supports no size.

---

## 9. The Connected Journey (2026-10-12)

Ruleset `evaluation-3 (2026-10-12)`. A replay of a piece judged under an older ruleset says so and doesn't re-derive it
(`replay`, `systems/evaluation.ts`). The owner's brief of 2026-10-12 asked for the whole piece to be judged, a partner
kept apart from the player's own work, rehearsal with memory, direction that can be answered, an identity read from
history, and the specialist question settled against a stated measure. Each is below with the file it lives in. Every
size is **SLATE's**, and the shapes are the rehearsal room's: a scene worked in units, a run that tires, an
adjustment tried and kept or thrown out. None of it is a measured rate.

### A piece judged in its segments

`content/piece.ts`, `systems/piece.ts`, `judgePiece()`. A piece is cut into segments:

- a brief's beats;
- a scene for class, its tones in order;
- a night, the play's tones in order, two at least. A new play with no profile (a festival's, a cabaret's) is its two
  halves with no tones said: nothing is assumed of a text the game doesn't have.

Each segment goes through the one evaluation every piece of work goes through (§1), with four things of its own:

| Quantity | Formula | Source |
|---|---|---|
| Tones | each tone multiplies its dimensions' lean (`TONE_LEAN`: comic ×1.15 responsiveness and ×1.1 execution, grave ×1.15 belief and ×1.05 consistency, lyric, grotesque), normalized | SLATE's |
| Its rehearsal | `1 − (1 − piece)·(1 − workₛ)`, where `workₛ` is the focused work on that segment | SLATE's |
| What it asks | the piece's complete, plus `perTurn` where a change of tone leads into it and `perBlend` where it holds two at once: a brief 0.15 and 0.08, up to 0.85; a scene 0.05 and 0, up to 0.95 | SLATE's |
| Stamina | `f = 1 − 0.3·load·position·(1 − stamina/full)`, position 0 at the first segment and 1 at the last, applied to what tiring reaches; stamina is removed from every segment's inputs | SLATE's |
| A slip | a segment 3 points or more under what it was expected to come to carries into the next a factor `1 − 0.5·(slip/100)·(1 − recover)`, `recover` the mean of composure and adaptability, each of full | SLATE's |

**Load**, how hard the piece is on stamina, 0 to 1 (`loadOf`): a brief 0.1 short, 0.2 medium, 0.3 long; a scene 0.15;
each plus a sixth for each level of the body's and the voice's work it stages. A night is 0.4 plus a tenth a level.

**The whole** is the segments' overalls, weighted by their length. **Continuity** is `100 − (max − min)` across the
segments of the mean of belief and interpretation. It's shown and never added: it's what the segments already are.

**Nothing is counted twice.** Stamina is read once, as the drain; until this ruleset it was a share of consistency.
Recovery reads composure and adaptability, which also sit in the dimensions, but only where a slip has happened, and
there's no slip at mastery: no draw, so nothing under expected. A tone leans weights and adds none
(`tests/connected-properties.test.ts`).

### A partner, and the scene together

`systems/ensemble.ts`, `sharedOf()`. Until this ruleset a scene's partner part was six tenths the rehearsals together
and four tenths what the partner prepared alone, read as the player's own preparation. A partner's own preparation
tops out at 0.85, so a student with everything mastered came out at 94 to 98 on a paired scene, never 100, with a note
nothing they could do would answer. Now there are two results.

- **Your own** is your work, judged as every piece is. Its partner part is your rehearsals together. At mastery it's
  100, whoever the partner is.
- **The scene together** blends each dimension a partner shares: `(1 − s)·own + s·100·contribution`, with
  `s = share·level/3` (connection 0.5, responsiveness 0.5, belief 0.15, consistency 0.1, by the material's partner
  level). A partner's contribution is `(0.4 + 0.6·prep)·timing·agree`:
  - prep is their own preparation and what you've rehearsed together;
  - timing, 0.5 to 1, is their listening and focus;
  - agree is 0.9 while a table-work reading is held apart and not yet tried both ways, else 1.
- **A partner's slip** is drawn from their reliability: it happens when the draw falls under `(1 − reliability)·0.6`,
  in one segment of the scene, and takes from what they bring 60% of it over the number of segments, less the share the
  player's listening and adaptability cover.

A coursework band and a night's band read your own result, since a teacher and a director judge the actor. The bond
with a partner moves with the scene together. A brief taped with a classmate reading (`brief.reader`) reads the same
way; a recording reads at 0.6, answering on cue and never slipping, but never listening. A callback is earned by the
take with its reader, and answered only when played the way it asked.

### A problem worked through

`content/workbook.ts`, `systems/workbook.ts`, the commands `work.identify`, `work.try` and `work.settle` on a brief, a
scene for class or a part. A problem is found in the work's own forecast, the expected result with no draw:

- the weakest segment;
- a turn not yet worked;
- stamina failing late;
- an ability holding a segment back;
- what you want, not yet named;
- a part of the preparation;
- a partner short of the take on your own.

Each kind admits its own adjustments, and each adjustment is a different change:

| Adjustment | What it changes | Size |
|---|---|---|
| Work It Slowly | that segment's own rehearsal | 0.5 of what's left |
| Run Into It From The One Before | both segments' own work | 0.25 before, 0.4 after |
| Play This Part Another Way | that segment's way of playing, rehearsed in | 0.6 of what's left |
| Find Places To Breathe | the piece's load on stamina | ×0.7 |
| Name What You Want In Each Part | the part the reading stands on | 0.3 of what's left |
| Run It With Your Partner | their preparation | 0.4 of what's left |

Trying one spends its time and shows the evidence: the problem's own figure in the forecast before and after. A change
of how something is played is kept or put back, and one put back isn't offered for that problem again. Work done is
kept. A kept change is a discovery, which every later forecast, rehearsal and performance of the piece reads, and
every later rehearsal on the feet rehearses a kept way in further, as it does the whole piece's way of playing
(`rehearseWays`, `systems/piece.ts`). Until late in the pass a kept way was rehearsed in only by trying it again, so
a mastered actor who kept one came to every later call short of 100: 91.9, 4.3 points of it a way 60% rehearsed in.
There is no random setback anywhere in it: the forecast has no draw.

### Direction that can be answered

`systems/production.ts`. Past the lines and the blocking, a director's note names the worst problem the part's own
forecast shows that has a way to work it: what you want, listening, pacing, behavior, transitions or the relationship,
with its place in the play and its figure. Each offers the workbook's ways at it (`solutionsOf`). Worked one way, the
note keeps the way and its own evidence. At the next call it's taken only where the work answered it: worked a way
that didn't make it worse and wasn't put back, or its problem gone from the forecast. A note left alone is said again
as still there, and a later note on the same thing answers what came of the last.

### The actor the work so far shows

`systems/artistry.ts`, `identityOf()`. Read, never stored, from what's kept already: the last 40 pieces for strengths
(a dimension 4 points or more over the actor's own mean, across at least 6 pieces); the journey's tallies for life for
recurring weaknesses, direction and collaboration; the experience record for familiar and unfamiliar material; and
habits, a side chosen 70% of the time across at least 5 choices. Each line names its evidence. It adds nothing to any
result. It informs the brief suggestions (an unfamiliar material, a way not usually played, a weakness that recurs for
life) and the Player Profile.

### The specialist question

`tools/specialists.ts`, `docs/verification/connected-journey/SPECIALISTS.md`. Every specialist was compared with an
even actor of the same budget (abilities summing 600, techniques seventeen at 50), fully prepared, on a sufficient day,
with no draw, a brief in its best reading. The difference was split between the whole's two terms.

**The stated criterion:** on material built on a demand at level 3, the ability it names should carry at least as much
of the work as the most-read ability of the task's own profile, emotional depth, about a sixth of a take. A technique a
scene stages should carry at least as much as the medium's own.

**Measured before:**

- physical carried 13.8% of a brief built on physical work, and vocal 12% of one built on the voice, against emotional
  depth's 17%;
- a staged technique weighed one of the medium's own.

**Corrected:**

- physical's effect went from 1.2 to 1.8 an ability a level, and its lean from 0.2 to 0.25 (`FEATURE_EFFECT`,
  `content/approaches.ts`);
- vocal's went from 1.2 to 2, and its lean from 0.16 to 0.25;
- the camera's connection reads presence at 2 (`tape`, `tapeOnFeet`, `content/tasks.ts`);
- a staged technique weighs twice the medium's own (`BRIEF.staged`).

No genre bonus was added, and no specialist was made to win.

**What stands, and why.** The feeling specialist leads on most work because every scene is built on feeling: that's
the material. Stamina is read once, as the drain, so its specialist is behind wherever a piece is short. Casting is
blind to stamina by the fairness rule (`castingPerformer`).

### What the measurements showed, on the final rules

Every figure below was measured on the rules as they stood at the end of the pass, with 298 briefs, two for each
genre. Each tool's own header says how it measures.

**The specialist question** (`tools/specialists.ts`). Each specialist has 85 on one ability, and the other eleven are
lowered to keep the budget. The figures are against the even actor, each piece in its best reading.

| Specialty | Briefs Built On It | Scenes Built On It | Nights Built On It | Casting, Plays Built On It |
|---|---|---|---|---|
| Physical | ahead on 58 of 83, +0.63 | 3 of 8, −0.05 | 6 of 14, +0.24 | 13 of 14, +0.5 |
| Vocal | 62 of 73, +1.08 | 12 of 14, +0.24 | 10 of 10, +0.5 | 10 of 10, +0.77 |
| Partner | 93 of 106, +1.43 | 46 of 46, +3.58 | 17 of 17, +2.19 | 17 of 17, +3.35 |
| Feeling | 274 of 274, +3.37 | 43 of 43, +1.44 | 23 of 23, +1.01 | 23 of 23, +1.28 |
| Stamina | 3 of 42, −0.28 | 0 of 4, −2.5 | 0 of 8, −0.84 | 0 of 8, −2.84 |
| Presence | 0 of 263, −1.63 | 0 of 56, −1.91 | 0 of 30, −1.09 | 0 of 30, −0.92 |

How each result splits between the whole's two terms says why:

- A specialist gains in the weighted mean on its own material: +1.29 for physical on briefs, +0.75 on scenes.
- It loses about 0.8 in the weakest-dimension term on every piece, because the eleven abilities it lowered are its
  weakest.
- On a scene built on physical work the two come out even. That is a trade-off the budget makes, not an under-reward:
  concentrating costs elsewhere, and the 0.25 weight on the weakest term is how SLATE says an actor is held back by
  what they can't do. No bonus was added to change it.
- Stamina is read once, as the drain, and only late in a piece, so its specialist is behind wherever a piece is short.
  Casting reads stamina as full by the fairness rule.
- Presence is one input of connection among several, and on camera it carries twice what a scene gives it. Even so,
  85 on presence doesn't repay the eleven abilities lowered for it.

**Readings** (`tools/brief-balance.ts`, `docs/verification/BRIEF-BALANCE.md`).

- An even actor's best and worst readings are 0.14 to 0.17 points apart on average, at most 1.2. An even actor has no
  strength for a reading to play to. Readings move weight between dimensions, and add none.
- A specialist's are 0.94 to 1.56 apart on average, over a point apart on 124 to 189 of the 298 briefs.
- Two specialists' best readings differ on 108 to 251 of the 298 briefs.
- A real student's abilities are drawn, never even, so a reading is a real choice for them.

**Two briefs a genre** (`tests/briefs-situations.test.ts`). Four actors meet a genre's two briefs differently: the
difference between the two briefs' results spreads across the four by 0.5 to 14.4 points, median 4.2. In 65 of the 149
genres the actors disagree about which of the two suits them better.

**A weakness trained** (the developing actor, +20 on one input, n = 298):

- the input that costs a brief most adds 2.63 (1.7 to 4.5);
- a read input chosen at random adds 1.17;
- an input the brief doesn't read adds exactly 0 on all 298.

Until this pass's last run the tool counted stamina unread on some briefs, and +20 on it moved one of them by 0.3: every
piece now reads stamina, as its drain.

**Tags.** A brief's genres reordered and repeated: 0 of 298 takes moved.

**Freshness, played** (`tools/freshness.ts`, `docs/verification/connected-journey/FRESHNESS.md`). Two held-out seeds,
nine months of school, four students each:

- **The beginner, the developing student and the body specialist** taped 72 to 83 briefs, each one new, and were set
  18 scenes, none twice. A coursework note came back only after its part slipped. No director's note came back after
  it was answered. 214 to 225 briefs were left never offered. The best reading leaned the same way on 29% to 42% of
  the briefs taped.
- **The mastered student** made 66 to 76 takes on 30 to 35 briefs. The repeats are the one callback each brief earns
  (29 to 34), never two in a row.

**Properties** (`tests/connected-properties.test.ts`, `tests/piece.test.ts`, `tests/ensemble.test.ts`):

- a piece is bounded, and never falls as its work, its rehearsal or stamina rises, or as its load falls;
- a tone leans and adds no weight;
- stamina is read once;
- there's no draw at mastery, and a segment's draw stays inside the evaluation's variation below it;
- the scene together is bounded, and never falls as a partner's preparation rises.

**The mastery contract** holds on briefs, with a recording or a classmate reading (`tests/briefs.test.ts`,
`tests/ensemble.test.ts`); on scenes for class with any partner (`tests/ensemble.test.ts`); on nights
(`tests/connected-properties.test.ts`); with a workbook discovery kept (`tests/workbook.test.ts`); and on a part
with every director's note worked and its change kept (`tests/direction-mastery.test.ts`).

**Counted for life.** Until round three of this pass's defect work, a piece held back by one input in several
dimensions counted once per dimension (`countWork`). A verifier measured n = 15 against 12 pieces on a played save.
Each piece counts once now (`limitsOnce`), and the backfill a save gets on opening counts the same way
(`tests/journey-limits.test.ts`).

### Limits

- **The content is finite:** 298 briefs, two for each genre, with 648 readings; 67 scenes for class (56 until 2026-10-16, 65 until brief 10's two public meetings);
  30 plays with profiles.
- **Every size in this section is SLATE's estimate.** That covers the drain, the slip and its recovery, the tones' leans,
  a partner's shares and slip, the workbook's gains, the direction note's rule for addressed, and the identity's
  thresholds. The shapes are from the rehearsal room and the acting texts the research files cite. No size is measured
  from the world.
- **A specialist in one ability is behind wherever its material doesn't call for it,** and about even on scenes built
  on it, by the weakest-dimension term. That's said here and in each piece's limits, never hidden by a bonus.

---

## 10. Since `evaluation-3`: Where Each Change Is Written

Each ruleset is kept on every result, and a result kept under an older one is shown as it was (`replay`). The history is
in `RULESET`'s comments (`content/tasks.ts`); each change has its account, with its criteria, tests and mutations:

| Ruleset | What changed | Account |
|---|---|---|
| `evaluation-4` | Knowing the genre read over its whole range, complete at 0.9 with a floor of three quarters (`partFloor`); the task profiles' weights moved to what a piece demands (`DEMAND_EFFECT`); stamina's load set by a piece's length. | `docs/verification/attributes-genres-2026-10-16/phase-2b.md` |
| `evaluation-5` | A way of playing read against the scene: each side's suitability moves a share of difficulty on the dimensions it leans on, and the choice's rehearsal mark from 0.8 to 1.0 (`GRAIN`, `grainOf`). | `docs/verification/interpretation-2026-10-16/` |
| `evaluation-6` | Suitability reaches every dimension a side leans on, in proportion; a class scene and a play are read in their genre's register (`sceneOfMaterial`); the stage leant a quarter each way. | `docs/verification/interpretation-2026-10-16/i3-review.md` |
| `evaluation-7` | The reader counts toward suitability at half weight, as a register's concern does (`GRAIN.reader`). | `docs/verification/genres-2026-10-16/g1-replacement.md` |
| `evaluation-8` | A stage's house is read on the take's execution (`STAGE_LEAN`) and pulls no scale; a stage voice's demand no longer counts as size; a scene's circumstances say what its scale asks (`CIRCUMSTANCE_AFFINITY`). | `docs/verification/stage-2026-10-16/` |
| `evaluation-9` | A result is rounded once, from parts kept at full precision (`judgeExact`, `rounded`); until then a dimension and a piece's segment were rounded before a whole was worked out from them. Restrained draws on composure and focus as well as emotional depth (`APPROACH_EFFECT`). | `docs/verification/integration-2026-10-16/st3.md`, `st6.md` |
| `evaluation-10` | A class scene and a play are judged in their units, each tone section cut again at each of its turns, as Stanislavski divides a role by its shifts of action (`unitSegments`); what a piece demands counts those units, so one of more than three reads discipline as a brief's beats do (`demandsOf`). A segment's place in the piece is read by the running of the segments before it (`SegmentSpec.length`; a brief's heart weighs more and takes no longer), and the whole and each dimension are the segments' weighted mean divided once. Work a save kept on a piece's segments moves to its units on its first opening (`cutIntoUnits`). | `docs/verification/integration-2026-10-16/h4.md` |
| `evaluation-11` | A night's drain reads its workload (brief 10, decision 5): the production's running time, from a cited production or SLATE's estimate (`content/workload.ts`), the part's share of it by its size, the body's and the voice's intensity, its breaks, which give back a share of the drain for what follows, and the day at the curtain; each segment reads the drain's mean over its own stretch of the running, so a night judged in its units comes to the same drain as the whole (`systems/workload.ts`). The evening costs energy by its workload, half at full stamina; a call holds its running time and the curtain call. Until then a night's load was 0.6 and 0.12 a level of the body's and the voice's work, clamped at 1, whatever its length or the part. Calls a save had booked are timed once on its first opening (`timeTheCalls`). Later that day, before it left its branch and so part of it rather than a twelfth (brief 10, the judge area's second phase): the full drain 0.4 where it was 0.3 (`PIECE.drain`), so stamina's specialist leads on work of its own; a night's part's text read by its time on stage, half a unit of a long brief's two for each hour past the first (`PART_TEXT`), so memory's reaches the nights; and a night before a house at stakes 1.5 where a play read 1 (`NIGHT_STAKES`), the direction from performance-anxiety research and the size SLATE's, so composure's does. | `docs/verification/remaining-10/stamina-result.json`, `docs/verification/decisions-2026-10-16/stamina/`, `docs/verification/remaining-10/judge-result.json`, `docs/verification/decisions-2026-10-16/integrated/after/` |

Material added under a ruleset doesn't move it: no rule changes, so no kept result reads differently. Under `evaluation-9`
the integration pass added four drama scenes (`content/scenes-public.ts`) and brief 09, later on 2026-10-16, four
played out to a house (`content/scenes-house.ts`; `docs/verification/integration-2026-10-16/h4.md`). Brief 09 changed no
rule of the judge: ST3, ST6 and L3 were traced and measured (`st3.md`, `st6.md`, `l3.md`), and none needed one. Its
follow-up, later the same day, did: `evaluation-10`, above, under which it added Scapin's sack scene
(`content/scenes-scored.ts`).

