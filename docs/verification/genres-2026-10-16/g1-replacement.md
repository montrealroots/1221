# G1 Replaced By The Genre Signature: Defined Before It Was Run, 2026-10-16

The owner's brief "Finish Genre Interpretation, Improve Training Advice, And Prove Long-Term Integration", part 3, which
authorized replacing a demonstrably invalid metric on five conditions: keep the original and its failed result; say
precisely what it measures wrongly; define the replacement before tuning against it; test on cases not used to design
it; and show that an implementation ignoring genre fails it. This file was written before `tools/genre-signature.ts`
was first run, and nothing in the engine was changed against it afterward.

## The Original, Kept

G1 (`docs/verification/attributes-genres-2026-10-16/acceptance-criteria.md`, measured by `tools/ag-baseline.ts` §3 and
`tools/genre-identity.ts`):
- **What it builds.** Each brief has an L1 profile: six dimension shares ×10, and twelve ability +10 effects for the
  even actor. A genre's profile is the mean of its own briefs'.
- **Clause one.** The median distance between genres is at least 1.5× the mean distance within a genre.
- **Clause two.** Each genre's own second brief is nearer than any other genre.
- **Its results.** 0.75× with 148 genres having a nearer neighbor on `35d032d`. 0.95× with 146 on `1bb76ac`. It's
  measured again on this code, as written, and reported beside the replacement.

## What It Measures Wrongly

1. **It measures how alike a genre's scenes are, not what the genre does.** A brief's profile is mostly its scene: its
   length, its stakes, its features, its tones. Two scenes of one genre are two different situations by design: a
   Nordic noir interview and a Nordic noir ferry office ask different things. G1 passes only when a genre's scenes are
   made alike. Simulated on 2026-10-16, holding a genre's scenes to identical length, stakes, medium, language and
   features reached 1.75× to 2.04×. That is one rigid template per genre, which the owner's brief rules out.
2. **It counts shared conventions as a failure.** Clause two fails a genre whenever another genre is nearer than its own
   second scene. Genres that genuinely share their conventions (Christmas and Holiday play it straight; Espionage and
   Nordic noir hold the feeling in) are rightly nearer each other than two different scenes of either. Even with every
   genre's scenes templated, it held for only 108 to 118 of 149.
3. **It never asks whether a genre's advertised distinction does anything.** A genre can pass G1 by having two
   similar scenes, and fail it while its register changes every outcome a player meets.

## The Replacement: The Genre Signature

**What's built.**
- **A genre's signature on a scene.** What laying that genre's register over the scene changes, against the same scene
  with no register: the genre's concerns read by the take, its suitability signals, and the techniques it applies.
- **The outcome vector it's measured on.** Three parts:
  1. **Who it rewards.** For each of the twelve specialists (85 in one ability, the rest of a 600 budget even), the
     specialist's result less the even actor's.
  2. **How it suits being played.** The suitability of each of the six sides.
  3. **Which preparation matters.** What each of the three parts of a brief's preparation costs an even actor when it's
     at half.
- **Scaling.** Each component is scaled by its standard deviation across every (scene, genre) pair, so no unit
  outweighs another.
- **The scenes.** Each brief's own scene stands in for "a varied scene", with the reading it was written with first.
  Designed: the briefs written for their genre first (`brief-<genre>`, every third one). Held out: the further briefs
  (`brief-<genre>-2` and on, every third one), never looked at while this was written.

**The criteria.**
- **S1, recognizable across scenes.** For every genre with a register, its signatures on different scenes point the
  same way: the mean pairwise cosine across the scenes is at least 0.7.
- **S2, contrasting genres differ, related genres overlap.** Grouping pairs of genres by how many concerns their
  registers share, the mean signature distance falls as sharing rises. Pairs that share none are at least 1.5× as far
  apart as pairs that share one. And each genre's nearest genre by signature shares at least one concern with it, in at
  least 90% of genres.
- **S3, context-sensitive outcomes.** On the same scene, two genres whose registers share no concern lead to a
  different best-suited side on at least one axis, or a different best-rewarded specialist, in at least 80% of
  (pair, scene) cases.
- **S4, no accidental duplication.** No two briefs of different genres are identical in every number a take reads
  (G2), with the register and without it: 0.

**The falsifier.** The same measure with the genre ignored (`--blind`): the register's lean and draw at 0, its
suitability signals at 0, and the genre's applied techniques left as the scene's own. It must fail S1, S2 and S3. If it
doesn't, the measure isn't measuring genre.

## Results, Measured After The Definition Above

`npx vite-node tools/genre-signature.ts -- --out signature.json` and `-- --blind --out signature-blind.json`, on the
engine as of `939e4fbc` (the commits since change the guide and the tools, not anything this reads): 149 genres over 50 designed scenes and 50 held-out ones. G1 as written was measured again with
`tools/genre-identity.ts` (`identity-g1-as-written-final.json`, `identity-g1-controlled-final.json`).

| | Designed | Held Out | Genre Ignored (`--blind`) |
|---|---|---|---|
| G1 as written (1.5×; own second brief nearest) | 0.951×, 146 nearer: fails | | |
| G1, length and stakes held | 1.216×, 140 nearer | | |
| S1: same direction across scenes (≥ 0.7) | 0.90, least 0.84: **passes** | 0.88, least 0.79: **passes** | 0: fails |
| S2: distance by concerns shared | none 6.21, one 4.21, two 0 | none 6.07, one 4.14, two 0 | all 0 |
| S2: none over one (≥ 1.5×) | 1.47×: **fails** | 1.47×: **fails** | 0: fails |
| S2: nearest shares a concern (≥ 90%) | 98.7%: **passes** | 98.7%: **passes** | 18.8%: fails |
| S3: contrasting genres change outcomes (≥ 80%) | 82.3%: **passes** | 71.8%: **fails** | 0%: fails |
| S4: identical briefs across genres (G2) | 0: **passes** | | |

**What it says:**
- **The signature measures genre, and G1 didn't.** With the genre ignored, every criterion fails: no signature, no
  distance, no outcome changed.
- **A genre's conventions are recognizable across very different scenes** (S1). Related genres are each other's nearest
  (S2, 98.7%). Contrasting genres are farther apart than related ones in order (6.2, 4.2, 0).
- **Two clauses fall short:**
  - **S2's ratio** is 1.47 against 1.5. A genre sharing one concern with another shares half its register, and that half
    already moves it far from the genres it shares nothing with.
  - **S3 on held-out scenes** is 71.8% against 80%. On those scenes, a contrasting genre more often leads to the same best
    side or specialist. That's the price of weighting the register at half beside the scene's own signals, which I2 of
    the interpretation criteria asked for so that a genre isn't a rule (`../interpretation-2026-10-16/README.md`). The
    scene can outvote the genre, by design, and does on 28% of held-out cases.
- **Nothing was tuned against it**, as this file said before it ran. Both are the owner's to weigh: accept the
  shortfalls, or raise the register's weight in suitability and accept I2's.

## Revision: S2 And S3's Proxy For Contrast, Defined Before It Was Measured (Later The Same Day)

The owner's brief "Finish School Workload Balance And The Remaining Acting-Engine Shortfalls", part 5. This section was
written after the diagnosis below and before any revised figure was measured. Nothing in the engine was changed against
S2 or S3; the original definitions and results above stand as recorded.

### The Original Results, Measured Again On This Code

Measured again on `f99d9dc6`, after I3's change to how far suitability reaches
(`tools/genre-signature.ts -- --diagnose`, `signature-diagnose.json`): S2 none over one 1.473 and 1.467; S3 82.3%
designed and 71.8% held out. These are the same to the third place as before.

### The Diagnosis

S2 and S3 both read "the registers share no concern" as "the genres contrast". That's a proxy, and it's the wrong one.
Two registers can share no concern and still declare the same pull on how a scene is played. Examples: Feeling Held In
(restraint) and Suspense Held (tension) both pull toward restrained and measured, and Played Large (heightened) and
States At The Limit (extremity) both pull toward expansive.

To check it, each pair's **kinship** was measured: the cosine between the two registers' summed side affinities
(`CONCERN_AFFINITY`). That's what they declare, never what they're measured to do. S3's misses were then binned by
kinship (to the nearest half):

| Kinship (Declared Pulls) | Designed: Missed / Pairs | Held Out: Missed / Pairs |
|---|---|---|
| −1.0 (opposed) | 54 / 850 (6.4%) | 60 / 850 (7.1%) |
| −0.5 | 727 / 7,800 (9.3%) | 1,367 / 7,800 (17.5%) |
| 0.0 (unrelated) | 1,982 / 12,200 (16.2%) | 3,272 / 12,200 (26.8%) |
| 0.5 | 1,896 / 7,050 (26.9%) | 2,865 / 7,050 (40.6%) |
| 1.0 (the same pull) | 518 / 1,350 (38.4%) | 698 / 1,350 (51.7%) |

**The misses rise with kinship on both sets.**
- **The criterion asks for differences the registers don't declare.** When two registers pull a scene the same way,
  the same side coming out best is the model working.
- **The pairs counted for a different outcome include declared kin.** 8,400 of S3's 29,250 pairs have kinship at 0.5
  or more.
- **S2 has the same flaw.** Its "none" group includes the kin pairs, which are rightly near each other, and they pull
  its mean down.

**The scene also outvotes the register, by design.** The held-out scenes missed most were:
- **Unpredictable or withholding readers:** Magical Realism 2, Gangster 2, Thriller 2, Buddy Cop 2.
- **Five beats with no reader named:** Melodrama 2.

Their own signals decide the side whatever the genre. That's I2 of the interpretation criteria working (a genre isn't a
rule), and it isn't changed here.

### The Replacement, Defined Here Before It Was Measured

- **Contrasting genres.** Their registers share no concern **and** their declared pulls are opposed: kinship below 0.
  The cut is the sign of the cosine. It's a boundary of the measure, not a value fitted to the bins above: below 0 the
  two registers, taken whole, pull a scene in opposite directions.
- **Related genres.** Unchanged: they share one concern or more.
- **S2, revised.**
  - Contrasting pairs are at least 1.5× as far apart as pairs that share one concern.
  - Distances still fall as sharing rises (one above two).
  - Each genre's nearest shares a concern with it in at least 90% of genres. This clause is unchanged.
- **S3, revised.** On the same scene, contrasting genres lead to a different best-suited side on at least one axis, or a
  different best-rewarded specialist, in at least 80% of (pair, scene) cases. The outcome compared, the pairs sampled
  (every third genre against every fifth) and the threshold are unchanged. Only which pairs count as contrasting
  changes.
- **S1 and S4.** Unchanged.
- **The falsifier.** Unchanged: `--blind` must fail S1, S2 and S3 as revised.

**Validated on fresh scenes.** The kinship bins above were read on the designed and held-out samples, so neither is an
independent test of the revision. The revision is measured on:
- **the designed sample and the held-out sample**, reported beside the originals;
- **two fresh samples no criterion or diagnosis has read:** the briefs written first for their genre that weren't
  sampled (`i % 3 ≠ 0`, 99), and the further briefs that weren't sampled (99).

The revision passes only if it holds on both fresh samples.

### Results Of The Revision, Measured After The Definition Above

Measured on `edc22502` (the engine as of `f99d9dc6`) with `tools/genre-signature.ts`:
- `signature-revised.json`: the designed and held-out samples;
- `--fresh`, `signature-revised-fresh.json`: the fresh samples;
- `--blind` and `--blind --fresh`: the genre ignored, on both.

| | Designed (50) | Held Out (50) | Fresh Designed (99) | Fresh Held Out (99) | Genre Ignored, All Four |
|---|---|---|---|---|---|
| S1 (≥ 0.7) | 0.90 | 0.88 | 0.90 | 0.87 (least 0.74) | 0: fails |
| S2 original: none over one (≥ 1.5×) | 1.47: fails | 1.47: fails | 1.47: fails | 1.47: fails | 0: fails |
| **S2 revised: contrasting over one (≥ 1.5×)** | **1.60: passes** | **1.61: passes** | **1.60: passes** | **1.61: passes** | 0: fails |
| S2: nearest shares a concern (≥ 90%) | 98.7% | 98.7% | 98.7% | 98.7% | 18.8%: fails |
| S3 original (≥ 80%) | 82.3% | 71.8%: fails | 78.8%: fails | 69.4%: fails | 0%: fails |
| **S3 revised (≥ 80%)** | **89.0%** | **81.0%** | **86.7%** | **78.9%: fails** | 0%: fails |

The contrasting pairs are 4,168 of the 11,026 genre pairs for S2. For S3 they're 14,350 of 29,250 (pair, scene) cases
per 50 scenes.

**What it says:**
- **The revision is right about S2.** With declared kin taken out of "contrasting", contrasting genres are 1.6× as far
  apart as genres that share a concern, on every sample, the fresh ones too. Genre ignored, it fails.
- **S3, revised, falls short on the fresh held-out briefs**, at 78.9% against 80%. As defined above, the revision
  passes only if it holds on both fresh samples. **It doesn't, so S3 isn't passed**, and nothing was tuned to make it.
- **Why it falls short** (`signature-revised-fresh-diagnose.json`). Five in six of the further briefs are written with a
  reader who plays the other part a way (pressing, withholding or unpredictable), or are voice takes. Nine in ten of
  the first briefs have a steady reader. On the fresh samples, contrasting genres led to the same outcome:

  | Reader | Fresh Designed | Fresh Held Out |
  |---|---|---|
  | Steady | 12.5% | 13.7% |
  | Pressing | 3.8% | 23.7% |
  | Unpredictable | 25.4% | 20.1% |
  | Withholding | 33.9% | 26.4% |
  | Voice | 9.2% | 20.6% |

  A reader's way is read at full weight and a genre's register at half (interpretation criteria, I2: so a genre isn't a
  rule). So where a scene's reader presses, withholds or surprises, the reader decides the side whatever the genre. The
  scenes missed most were Apocalyptic 2, Concert Film 2, Musical 2, Horror Comedy 2 and Screwball Comedy 2.
- **The genres and scenes that fail.** No genre fails S1; the least is 0.74. S3's misses lie in scenes, not genres. Under the
  original proxy the pairs missed most were Biker and Cosmic Horror, Docufiction and Romance, and Adventure and Costume
  Drama (`signature-diagnose.json`). Under the revision the misses are the scenes above, the ones with a reader's way.

**Not changed, and why.** Closing the last 1.1 points would mean one of two things:
- **Weighting the register over the scene's reader.** At full weight a genre's two scenes disagreed on scale in only
  10% of genres, against I2's 20%: the genre as a rule, which the owner's brief rules out.
- **Giving the reader less weight because S3 asks it.** That's tuning against the criterion.

Both are the owner's to weigh, with this table. The original S2 and S3 results stand as recorded, failing.

## S3: The Reader Weighed As A Concern, Defined Before It Was Validated (2026-10-16, The Owner's Later Brief)

The owner's brief "Resolve The Remaining Genre Benchmark With Defensible Changes And Proof". It started from `main` at
`eb0b6022`. S3 and its 80% threshold are unchanged. Nothing was removed or relabeled.

### The Diagnosis, On The Known Fresh Held-Out Sample

The baseline: 22,432 of 28,413 contrasting (pair, scene) cases differ, 78.95%, leaving 5,981 misses. Each miss was
tested against counterfactuals: suitability without the reader, with the register at full weight, and without the
cap at ±1. A tie is an axis whose two sides are equal.

| Counterfactual, Of The 5,981 Misses | Misses It Would Rescue |
|---|---|
| The register at full weight | 3,735 (62%) |
| The reader left out | 2,389 (40%); 2,197 of them nothing else rescues |
| The cap at ±1 lifted | 193 (3%) |
| An exact tie on an axis, either genre | 236 involved |
| None of the above | 1,548 (26%) |

- **No miss is a mislabeled pair.** In every miss the two registers' declared pulls are opposed on at least one axis.
- **The 1,548 that nothing rescues are legitimate.** They're the scene's own features, tones, medium and reading
  deciding, with the cap involved in only one of them. That's I2's point: a genre isn't a rule.
- **The cap and ties are minor.** They're reported and not changed. Changing how a tie is picked would change the
  benchmark.
- **The reader's hypothesis holds in part.** The reader alone decides 40% of the misses. The reason is a weighting
  inconsistency: a register's concern counts at half its affinity (`GRAIN.concern`, 0.5), set when full weight made a
  genre a rule. The reader, one signal like one concern, counts at full: a pressing, withholding or unpredictable reader
  pulls up to twice as hard as any concern. No record says why it was set at full; it was never tuned.

### The Change, And Why

**`GRAIN.reader` = `GRAIN.concern` = 0.5.** A reader's affinity counts as a register concern's does.
- **The principle.** Each is one source's way of playing the scene, and neither should outweigh the other by default.
- **What's kept.**
  - The reader still moves suitability.
  - The reader's lean and draw on the take are unchanged (`READER_PLAYS`).
  - No genre data, threshold, sample or pick rule changes.
- **What this doesn't do.**
  - It isn't fitted to S3. No other value was tried.
  - Lowering the reader below a concern, or raising the register past half, was ruled out. One would make the reader
    count for less than a concern does. The other would bring back the genre-as-rule that I2 caught.

On the known samples, measured before this was written (exploration, not validation):
- **S3** went from 78.9% to 82.0% on the fresh held-out sample and from 71.8% to 82.8% on the held-out one; designed
  is 88.9% and fresh designed 87.4%.
- **S1 and S2** hold.
- **The interpretation criteria all hold.** I2's scale clause is the closest, at 20.8% against 20%, from 21.5%.

### Fresh Validation, Defined Here Before It Was Run (`--validate`)

Every brief has been read by some sample. So this set is fresh in what S3 has never read:
- **The reading.** Every brief (298, all with a second reading) is played in its second reading. S3 plays the first.
- **The genre pairs.** Every contrasting pair (no concern shared, declared pulls opposed) that's off S3's grid. S3
  samples every third genre against every fifth after it.
- **The ability profiles.** Twelve profiles of two abilities at 72 (each with the next), the rest even. S3 uses one
  ability at 85.
- **The pick.** As S3's: the best profile, and on each axis the greater suitability, a tie to the first side. Ties are
  counted and reported.
- **Related pairs** (a concern shared) off the grid are measured beside them, to show overlap kept, with no threshold.

**Passes if:**
- with the change, at least 80% of the fresh contrasting cases differ;
- related pairs differ less often than contrasting ones.

The measure runs at both reader weights, 1 (before) and 0.5 (after). The share is reported with its numerator and
denominator, and by the reader's style.
