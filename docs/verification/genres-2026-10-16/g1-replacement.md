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
