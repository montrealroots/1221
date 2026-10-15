# What To Improve Next: The Measurement, Written Before It Was Run, 2026-10-16

The owner's brief "Finish Genre Interpretation, Improve Training Advice, And Prove Long-Term Integration", part 2. The
target is F2's, unchanged: the first-named weakness is the largest gain in at least **80%** of cases
(docs/verification/attributes-genres-2026-10-16/acceptance-criteria.md). This file was written before `tools/advice.ts`
was first run, and `ADVICE` (`systems/advice.ts`) wasn't tuned against it afterward.

## F2 As Written, Kept

`tools/ag-baseline.ts` §8: six drawn actors, one brief in four, prep 0.6. The first ability or technique limit of a take
(`chiefLimit`, what held that take back most) with +20 on it, against +20 on each read ability. It was 364 of 447 at the
first baseline, 311 after phase 2b, and 303 (67.8%) on `1bb76ac`, measured again on 2026-10-16. It's still run and
reported as it was.

## What It Measures Wrongly, For Advice

1. **It reads the wrong output.** The player's advice is What To Improve Next (`recommendations`), not the take's chief
   limit. The two answer different questions: what held this take back most, and what to train for the most gain. The
   owner's brief asks that they be told apart.
2. **Its comparator isn't equal cost.** +20 on an ability at 75 takes more hours than +20 on one at 40, so the "largest
   gain" it compares against is not the largest gain the player can reach with the same time.
3. **It counts a tie as a miss.** A take is rounded to a tenth, and the 0.05 tolerance fails two options a tenth apart,
   which no player could tell apart (20 of the 144 misses on `1bb76ac`).

## F2-A, The Replacement Measure (For Advice)

- **Cases.** A student created through `createSave`, abilities and techniques drawn from the seed (TEST SETUP, 30 to 75
  and 25 to 75), tapes three briefs drawn from the seed through the game's commands (choose, prepare two rounds of each
  step, study the genre once, tape). Seeds `adv-0` to `adv-9` are looked at while building; `adv-10` to `adv-39` are held
  out.
- **The advice.** The first ability or technique in What To Improve Next (`adviceFor`), and any it says is about as
  useful.
- **What actually happens.** For each ability and technique the recent work read that has an exercise, a copy of the save
  plays twenty sessions of its exercise through `practice.exercise`, one a day at the matched tier, steady, rested; a
  baseline copy lives the same twenty days without them. The realized gain is each copy's `forecast` of the three taped
  briefs, as their records stand, less the baseline's, weighted to the latest as the advice weights. `forecast` builds
  the take's context from the save, not from the advice's replay, and the growth is the engine's own (tiers, focus,
  transfers, the discipline lift), not the advice's curve.
- **A pass.** The advised input's realized gain is the largest, or within a tenth of it (one rounding step), or the input
  that realized the largest gain is among those the advice called about as useful.
- **The target.** At least 80% of cases, on the held-out seeds and on the designed ones, reported apart.
- **Also reported.** How often the advice's first equals the take's chief limit (they should differ where they should);
  the advice's predicted gain against the realized one; and how often a tie was declared.
