# The Attribute And Genre Engine: Its Model, Invariants And Balance

Written 2026-10-10, for ruleset `evaluation-2 (2026-10-10)`. Every formula below is the code's, with the file it
lives in. Every number is either a research figure (cited in `docs/research/attributes/`) or **SLATE's**, and says
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

- Each of the 68 materials carries five feature levels (timing, physical, partner, vocal, improvisation, 0 to 3),
  its language, tones, turns and medium. The reasons for each level are written beside it.
- A feature multiplies the lean of the dimensions it reaches by `1 + per·level`, and adds abilities to their inputs.
- A choice of pace, scale and structure leans the weights (×0.9 to ×1.2 per side) and adds inputs.
- Where a choice's lean is 1.1 or more, the choice must be rehearsed in (prep part `approach`, complete at 0.9).
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
  the sum, is what stops double-counting.
- **No effect on quality.** Experience reaches no evaluation input. It only makes preparation faster.
- **Recommendations.** These weigh recent limits toward the latest result, drop any input already at full, and scale
  by the room left since.

---

## 3. Invariants

Each one is a test. Most are properties over 1,500 drawn cases (every task, every material, random choices, random
levels, preparation, readiness, illness and injury); the others are named beside them.

1. **Bounds.** Every dimension and the whole stay in [0, 100]. Every limit's cost is positive and no more than what
   the dimension lost.
2. **Monotonicity.** Raising any one input never lowers a dimension or the whole, beyond a 0.05 rounding allowance.
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

- **Material:** 56 scenes and 30 plays, each with its structured profile (42 and 26 until the limitations pass of 2026-10-11).
- **Practice:** 27 exercises, each with three tiers and five focuses.
- **Choices:** three axes of choice and two sides each. A director asks for a side half the time.
- **Coverage in two years:** a student meets about 38 of the scenes. After that, a scene comes back asking
  something new of it (`revisitOf`):
  - a different part;
  - a different partner;
  - a different reading.
- **Weeks with no work decision:** 47 of 105, the School's breaks and written-work weeks. Practice's exercise, tier
  and focus remain a choice every day.
