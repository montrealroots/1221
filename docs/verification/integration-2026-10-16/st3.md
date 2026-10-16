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

## Brief 09: Every Case Taken Apart (2026-10-16, Later)

The owner's brief 09, section 2: "Separate rounding defects from legitimate differences caused by stage demands,
stamina, or execution weighting. Test identical effective inputs for identical results. Demonstrate why any remaining
stage/camera difference exists." The account above gave the causes in aggregate; this gives them case by case. Nothing
in the judge changed for it.

**The cases are 179, not 171.** The four drama scenes of `content/scenes-public.ts` (`st6.md`) added eight, each the same
on stage and at a close frame. Reproduced first on `d7127819` (`baseline-09/stage.json`): the specialist better on stage
on 179 of 179, the criterion's even actor the same as shown on **165 of 179**, a tenth apart on 14.

**Case by case** (`st3/st3-cases.json`, `npx vite-node tools/interpretation.ts -- --st3 <file>`, added for this): each
case's stage and close-frame results, as shown and exact, and the exact difference taken apart by changing one input at a
time:

| What | Cases | The Largest |
|---|---|---|
| A shown result that isn't its own exact result rounded once (a rounding defect) | **0 of 179** | |
| The same as shown | 165 | exact apart 0.0184 |
| A tenth apart as shown, each a real difference whose two exact results straddle a rounding point (x.x5) | 14 | exact apart 0.0017 to 0.0208 |
| The techniques' part: 50 of 90 (0.556) against the abilities' 55 of 100 | 179 | 0.0026 |
| Stamina's part: 55 drains the later half on every dimension that names fatigue, which the stage and the close frame weigh differently | 179, the larger part on 163 (12 of the 14) | 0.0194 |
| What's left: an actor even in everything the formula reads, undrained | 179 | 3×10⁻¹⁴ (floating point) |

The 14 a tenth apart are `bacchae-451` (both sides), `suppressed-2` expansive, `creditors` (both), `dream-3-2` (both),
`orig-office-hours` (both), Blood Wedding expansive, The Wild Duck and Uncle Vanya restrained, and Salomé (both), with
their exact differences and rounding points in the file. On `suppressed-2` and `orig-office-hours` restrained the
techniques' part is the larger. Whether a case shows a tenth is decided by where its two results fall against a rounding
point, not by how far apart they are: a case 0.018 apart shows the same, and one 0.0017 apart shows a tenth.

**Why the difference exists, from the rule.** Stamina's drain (`PIECE.drain` × load × place × (1 − stamina)) reaches the
dimensions whose conditions name fatigue, every dimension of a scene but interpretation. The stage leans execution 1.2
(`STAGE_LEAN`) and a close frame believability 1.2 (`CAMERA_LEAN`); after normalizing, the two give interpretation a
different share of the whole, so the same drain moves the two wholes by different amounts. With every dimension at the
same value, which an actor even in everything read and undrained has, the weights don't matter: the whole is
100 × n^(1 + difficulty) on both.

**ST3 as written: not met** (165 of 179 as shown). Not counted as passed.

**ST3′, proposed again, measured on the 179 cases** (not counted): (a) the voice-and-body specialist better on stage on
every case: 179 of 179; (b) an actor even in everything the formula reads, undrained, the same on both at full precision
and as shown: 179 of 179, the largest difference 3×10⁻¹⁴; (c) the criterion's even actor under half a rounding step
apart at full precision: 179 of 179, the largest 0.021.

**Proof** (`tests/remaining-judge.test.ts`, the ST3 block): identical effective inputs give identical results, an actor
at a drawn share of full in everything read coming out on stage, at a close frame and replayed from its own record at
100 × n^(1 + difficulty), worked by hand from Scene Study's par; every shown result its exact result rounded once, and
every case a tenth apart a real difference under half a tenth whose sides straddle a rounding point; each difference its
techniques' part and its stamina's part and nothing else. Mutations, each run in a copy of the clone and each killed:
the grain leaking into ST3's comparison (`GRAIN.strength || 0.3`) failed all three; the whole shown by `Math.floor`
rather than rounded once failed two; the drain reaching every dimension, not only those naming fatigue, failed the third.
