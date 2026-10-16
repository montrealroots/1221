# ST3: The Even Actor On Stage And At A Close Frame, 2026-10-16

The owner's brief of this pass, section 3: "For ST3, distinguish a real scoring inconsistency from display rounding.
Preserve appropriate precision and round at the proper boundary. If a criterion is mathematically contradictory,
explain the contradiction and propose a corrected criterion without counting the original as passed."

ST3 (`../stage-2026-10-16/criteria.md`): "The same scene, prepared the same, gives a voice-and-body specialist (85) a
better result on stage than at a close frame, whichever scale is chosen. An even actor's result is the same on both."
Measured over the 85 class scenes and plays as class scenes, on each scale side that fits: 171 cases. The tool holds
suitability at nothing (`GRAIN.strength` 0) so the medium's own lean is what's compared, and counts the even actor (every
ability at 55, every technique at 50) the same where the two results are under 0.05 apart.

## What Was Measured

| | As Shown, Before (evaluation-8) | Full Precision | As Shown, After (evaluation-9) |
|---|---|---|---|
| The voice-and-body specialist better on stage | 171 of 171 | 171 of 171 | 171 of 171 |
| The criterion's even actor the same | **159 of 171**; 12 a tenth apart | all 171 under 0.05 apart; the largest 0.021, the mean 0.004 | **157 of 171**; 14 a tenth apart |
| An actor even in everything the formula reads (abilities 55 of 100, techniques 49.5 of 90), stamina at 55 | 159 of 171 | the largest 0.019 | — |
| The same, its stamina not draining (100) | — | **0 apart on every case** (the largest 3×10⁻¹⁴) | 171 of 171 |

"Full precision" was measured with the rounding switched off for the measurement and switched back (not committed), and is
now read from the result itself (`Evaluation.exact`). Before: `ef784ccd`, `baseline/stage.json`. After:
`st3/stage-rounded-once.json`.

## What It Came To

**Two causes, apart.**

1. **Rounding at the wrong boundary: a real defect, fixed.** `judge` rounded each dimension to a tenth and worked the
   whole out from the rounded dimensions; a piece judged in segments worked its whole out from its segments' rounded
   wholes. A result was rounded two or three times, and every one of the 12 cases a tenth apart was the rounding's: at
   full precision none differed by half a tenth. From evaluation-9 a result is rounded once, where `judge` and
   `judgePiece` hand it out (`rounded`); every part (a dimension, a segment, a limit, the scene together, a way of
   playing's points) is worked out at full precision, and each shown part is rounded once from its own exact value.
2. **A real difference, and a legitimate one.** The even actor's stamina at 55 drains the later segments of a piece on
   every dimension that names fatigue. The stage weighs execution (`STAGE_LEAN`, 1.2: projection is a demand on the voice
   and the body) and a close frame weighs believability (`CAMERA_LEAN`), so the same drain falls on different weights:
   up to 0.019 of a point. The criterion's techniques at 50 of 90 read 0.556 against the abilities' 0.55, which adds up
   to 0.0025. An actor even in everything read, whose stamina doesn't drain, is the same on both to the last digit.
   That a tired body's projection costs a little more on stage is what "projection is a demand" means; it isn't an
   inconsistency.

**Why ST3's second clause can't be met as written.** It asks two results that differ (by 0.004 on average) to show the
same tenth. Rounding once is the right boundary, and it makes the shown results as faithful as a tenth allows; it can't
make two different numbers round alike. Wherever the two straddle a rounding point (x.x5), they show a tenth apart, and
the chance of that is about the difference over a tenth, so a handful of 171 always will: 14 after, 12 before by the
luck of the old rounding. Removing the difference would mean the stage not weighing execution more than a close frame,
which is ST3's own first clause, or stamina not draining, which every piece's continuity reads. So the clause is
contradicted by the criterion's own definition of projection and by its even actor not being even in what the formula
reads.

**ST3 as written: not met** (157 of 171 as shown). It isn't counted as passed.

## The Corrected Criterion, Proposed

ST3′, for the owner to accept or not. Each part is measured and held by a test:

- **(a)** The voice-and-body specialist does better on stage than at a close frame on every case. **171 of 171.**
- **(b)** An actor even in everything the formula reads (abilities and techniques at the same share of full), whose
  stamina doesn't drain, gets the same result on stage and at a close frame, to full precision and as shown, on every
  case. **171 of 171, the largest difference 3×10⁻¹⁴.**
- **(c)** The criterion's even actor comes out less than half a rounding step apart at full precision on every case,
  and less with its stamina undrained. **171 of 171, the largest 0.021.**

## What Else Moved

- **The stage criteria** on evaluation-9: ST1 restrained ahead on 49 of 85 (one case that was 0.1 ahead is now level)
  and expansive on 33; ST2, ST5, ST7, ST8, F1 and F2 as before; ST4 and ST6 as before (their own work follows).
- **The full suite** on the change: 3 of 4,192 tests failed, each read and settled:
  - `tests/stage-interpretation.test.ts` pinned `RULESET`: now evaluation-9, and a result kept under evaluation-8 is the
    one not judged again.
  - `tests/decisions-2026-10-14.test.ts`: where the Summer Cabaret reads an actress against her classmates, sixth,
    sixth and seventh became sixth, eighth and seventh. Classmates read within a tenth of her fell either side; she is
    below the four leads in each, which is what the test holds.
  - `tests/guide-examples-productions.test.ts`: its TEST SETUP set a dimension's rounded value and not its exact one,
    which the night together now reads first; it sets both. The guide's figures (33% of the connection, 74.0) were
    right throughout.
- **The monotonicity invariant** (`tests/engine-properties.test.ts`) holds with no allowance: a shown result never
  falls as an input rises. It allowed 0.05 before.

## Proof

- `tests/rounding-once.test.ts`:
  - a scene judged whole, 600 drawn performers: each dimension shows its exact value to a tenth, and the whole is the
    whole worked by hand from the task profile's own weights, rounded once; the cases are drawn so the old order and
    this one part somewhere;
  - a scene judged in three segments, 300 drawn performers and loads: the piece's whole is its segments' exact wholes by
    their weights, each segment drained by `PIECE.drain` × load × its place × (1 − stamina), rounded once;
  - ST3′ (b) and (c), on every stage material and fitting side.
- **Mutations, each killed:** the dimensions rounded before the whole (`wholeOf` reading `r1(…)`), and the segments
  rounded before the piece's whole (`judgePiece` reading `r1(r.overall)`), each failed two of the four tests.
