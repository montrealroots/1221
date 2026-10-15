# I3 Reviewed: The Shortfalls, Their Cause, And A Fresh Held-Out Set, 2026-10-16 (Later)

The owner's brief "Finish School Workload Balance And The Remaining Acting-Engine Shortfalls", part 4. The criteria are
`criteria.md`, unchanged: no threshold was moved, and no criterion was replaced. `tools/interpretation.ts` measures them;
`--fresh` adds the class scenes and the plays, which no criterion or tuning had read until this review.

## The Shortfalls, As Recorded

On `5b27379` (`criteria-after.json`):
- **I3's sign clause**: expansive was ahead in 23.0% of the designed briefs, against 25%.
- **I3's spread**: 0.92 on the held-out briefs, against 1.0.

## What Caused Them

- **Not weak differentiation in the scenes.** The held-out briefs differ more in suitability than the designed ones
  (the standard deviation of restrained's suitability less expansive's is 0.47 against 0.43). Their scores differ less
  (0.92 against 1.11).
- **The suitability reached too little of the take.** A side's share of difficulty went only on the dimensions it leans
  1.1 or more, a cutoff taken from where a choice's rehearsal is read. Expansive leans connection 1.25 and execution
  1.05, so its suitability never reached execution: the voice and the body sized to the house.
- **Medium compounded it.** At a microphone execution weighs most (`VOICE_LEAN`), and there are 30 voice briefs among
  the held-out ones against 5 among the designed. Their spread was 0.69.
- **The designed sign clause came from the same cause.** Restrained's suitability landed on believability, which a close
  frame weighs 1.2; expansive's landed only on connection.

## What Changed In The Model

1. **A side's suitability reaches every dimension it leans on**, by how far it leans there against its most (lean −
   1 over most − 1): fully where it leans most, about a fifth where it leans 1.05 (`grainOf`,
   `systems/interpretation.ts`). Principled, and decided before re-measuring: what a scene asks of a way of playing
   reaches everything that way of playing changes.
2. **A class scene and a play are read in their genre's register**, as a brief is (`sceneOfMaterial`): the genre a class
   scene names, the first a play is listed under. Their suitability only; the register's lean and draw on class work
   are as they were. Found by the fresh set, below.
3. **The stage leans a quarter each way** (`MEDIUM_AFFINITY.stage`, expansive 0.5 and restrained −0.25 until then), as
   the camera was set earlier the same day. Found by the fresh set, below. It leaned so until evaluation-8, later the
   same day, when it came to lean no way, the house read as projection on the execution (`../stage-2026-10-16/`).

A fourth change was tried and taken back: grave beats carrying restraint at a quarter, the mirror of comic beats
carrying size. It pushed the designed briefs to 20.9% expansive and was a weaker argument than the others.

## Results (`final.json`, `final-off.json`)

| | Designed Briefs | Held-Out Briefs | Fresh: Class Scenes And Plays (Stage) |
|---|---|---|---|
| I1: mastery on every fitting side | 8,010 of 8,010 | 9,117 of 9,117 | 2,277 of 2,277 |
| I2: a genre's scenes favor different sides (catalog) | scale 21.5%, pace 29.5%, structure 39.6% | | |
| I3: spread (≥ 1.0) | **1.30** (was 1.11) | **1.22** (was 0.92) | 1.52 |
| I3: restrained / expansive ahead (each ≥ 25%) | 68.9% / **27.0%** (was 23.0%) | 52.7% / 43.2% | **0% / 100%: fails** |
| I4: specialist wins against the grain (≥ 25%) | 53.2% | 43.8% | |
| I4: even actor follows suitability (≥ 75%) | 100% | 100% | 100% |
| I5: two interpretations within a point (≥ 80%) | 98.7% | 98.7% | 100% |
| As it was (`--off`): I3 spread | 0.03 | 0.02 | 0.02 |

## The Fresh Set, Honestly

- **What it showed first.** The class scenes and plays had never been read by any criterion, and they were measured to
  validate the change. They showed expansive ahead on all 85, with a spread of 0.36: the stage's own affinity was the
  only scale signal a class scene had.
- **What was changed in response.** Changes 2 and 3 above. After them the spread is 1.52, but expansive is still ahead on
  every one. Since the set informed those changes, it's no longer an independent test.
- **Why it still failed then.** This said the registers of the theater genres a class scene can name (drama: Played
  Straight; comedy: Comic Rhythm; tragedy: Played Large, States At The Limit; tragicomedy: Comic Rhythm) carried
  nothing that favors restraint. Drama's did: Played Straight carries restrained a quarter, an eighth at the register's
  half weight, and never outweighed the house's quarter and a voice's demand counted as size. A class scene had no
  reader, and no signal of its own for restraint. So on stage, for an even actor, expansive was the better scale on
  every class scene, which broke "no universal best interpretation" on that axis on stage. Other axes (pace,
  structure) still gave two or more interpretations within a point on every one (I5, 100%).
- **What would fix it.** This said it needed content, not a coefficient (each class scene's own register, from what its
  text asks), and that it was a research task, the owner's to authorize. The owner's next brief, the same day, asked
  for it: the house was read as projection and not as size, and each scene's circumstances were read from its text
  (`../stage-2026-10-16/`). Restrained came out ahead on 50 of the 85 and expansive on 33.
