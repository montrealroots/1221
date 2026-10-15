# The Stage And A Way Of Playing: Acceptance Criteria, Written Before Any Change, 2026-10-16

The owner's brief "Finish Genre Acceptance And Correct The Stage-Interpretation Bias". This file was committed before
the stage model or any scene's signals changed. Measurements against it are reported in `README.md` beside it,
original and final, with the counts.

## What Was Measured Before Anything Changed (`baseline.txt`)

The 85 class scenes and plays read by I3's fresh set were played on the class-scene task, with an even actor at 55 and
both scale sides fitting:
- **Expansive came out ahead on 85 of 85.**
- **Without suitability, the scales came out even:** expansive was ahead on 1 of 85, by 0.1. So the bias is in
  suitability, not in what the task weighs.
- **The stage's own affinity.** "A House To Reach" is +0.25 expansive and −0.25 restrained, on every scene. It
  treats being heard and read across a theater as playing large.
- **The voice read as size.** "Its Voice Work" adds to expansive from level 2. Othello 4.3's willow song, sung softly
  between two women undressing for bed, counted +0.75 toward expansive.
- **No signal for restraint.** No stage scene has any signal that favors it: no reader, no close frame, and nothing
  of what a scene hides or how private it is. Drama's register (Played Straight) evened it, at best.

## The Principles (`research.md`)

- **Projection isn't scale.** A house asks the voice and the body to reach it: support, resonance and clear
  intention, not pushing or playing larger (Rodenburg's second circle against the third; Linklater; stage-voice
  practice).
- **A restrained performance can carry across a theater.** The Moscow Art Theatre's Chekhov was intimate, ensemble
  and built on subtext.
- **Scale comes from the scene,** read separately as:
  - what's hidden (concealment);
  - how private the exchange is (intimacy);
  - whether it's spoken to many (address);
  - whether the conflict is out loud (confrontation).
  
  Intensity, pace and the genre's register stay as they were.

## The Criteria

Measured on the class-scene task (`tools/interpretation.ts --stage`) over the same 85 materials. Each scene's signals
are written from its text and committed before the first measurement of them. The even actor is at 55.

- **ST1, no universal best.** For an even actor, each side of the scale is ahead on at least 25% of the materials where
  both fit.
- **ST2, the house moves no scale.** On stage the medium's own scale signal is 0. On every material where the two
  sides' suitability differ by at least the band (0.25), the better side's largest signal for it is the scene's or the
  genre's, never the medium's.
- **ST3, projection is a demand.** The same scene, prepared the same, gives a voice-and-body specialist (85) a
  better result on stage than at a close frame, whichever scale is chosen. An even actor's result is the same on both.
- **ST4, scenes within a genre differ.** Every genre with five or more stage materials (drama, comedy, tragedy) has at
  least one where restrained suits better and at least one where expansive does.
- **ST5, mastery.** A mastered, prepared actor reaches 100 on every fitting combination of sides, on every material.
- **ST6, strength can carry the harder side.** Specialists at 85:
  - in what expansive draws on (presence, then vocal and physical), come out ahead playing expansive on at least 25%
    of the materials where restrained suits better;
  - in what restrained draws on (emotional depth, then composure and focus), come out ahead playing restrained on at
    least 25% of the materials where expansive suits better.
- **ST7, more than one good way.** Two or more interpretations within a point of the even actor's best on at least
  80% of materials.
- **ST8, the even actor follows the scene.** Where the sides are a band apart, the even actor does better on the
  better-suited side in at least 75%.
- **ST9, nothing else lost.**
  - The interpretation criteria I1 to I5 on the briefs hold as before.
  - The genre signature: S1, S2 revised and S4 hold, and S3 revised stays at or above 80% on all four samples.
  - Every camera and microphone brief's suitability, on every side, is the same as before: the stage change can't
    reach the screen.
  - The seven formerly identical pairs stay apart (G2 = 0).

## Fresh Validation, Defined Here Before Any Measurement

The 85 materials are read for ST1 to ST8, so they're not fresh. These are, and none was read by any criterion before:
- **F1, production nights.** The 27 plays judged as a performance (`TASK_PROFILES.performance`, the night's own task),
  not as a class scene: ST1, ST5, ST7 and ST8 on them.
- **F2, other proficiency.** Even actors at 40 and at 75, on the 85 class-scene materials: ST1 and ST8.

ST1 to ST9, F1 and F2 all have to hold. A shortfall is reported with its count and not met by changing a scene's
signals after the measurement. If a scene's signals have to change after it's been measured, the change and its
reason are recorded, and F1 and F2 are measured again.
