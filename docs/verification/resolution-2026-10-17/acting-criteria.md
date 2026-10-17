# Brief 12, Acting: ST6-R (a), (c), (e) And (g) Replaced, The Criteria Written Before Any Change (2026-10-17)

The owner's brief 12, section 1 (`../briefs-2026-10-16/12-resolve-the-remaining-decisions-and-complete-the-authorized-build.txt`),
approves judging restrained acting by meaningful, explainable gameplay benefits, and asks that ST6-R (a), (c), (e) and (g)
be revised individually around eight requirements. This file was written and committed on `20b6d777` (brief 12's starting
point) before any test, tool or code it governs changed. Nothing here is changed afterward to make a measurement pass: a
criterion found wrong once it's measured is reported with its figures, and any correction is the owner's.

## The Owner's Authorization

> I approve judging restrained acting by meaningful, explainable gameplay benefits rather than requiring a specialist to
> beat a balanced actor a fixed percentage of the time.
>
> Revise ST6-R (a), (c), (e), and (g) individually around these requirements:
>
> - A valid restrained interpretation must have a measurable contribution from its relevant abilities.
> - Improving those relevant abilities must improve otherwise identical applicable work, except where a documented cap or
>   another legitimate limiting factor prevents an increase.
> - Preparation and scene circumstances must matter in the intended direction.
> - Restrained interpretations must have useful opportunities across varied suitable material.
> - Expansive interpretations must retain their own advantages where appropriate.
> - A specialist's strength must not erase unrelated weaknesses.
> - Tests must fail if restraint's intended ability contributions or circumstance effects are removed.
> - Maximum relevant mastery, full preparation, valid interpretation, and suitable conditions must retain the established
>   maximum-quality guarantee.
>
> Use controlled comparisons and representative existing material. Do not pick only convenient examples or add a special
> bonus to obtain a passing score.
>
> Define and justify replacement criteria before tuning or final validation. Compare the existing proposed replacement
> against this authorization; adopt it only where it fully satisfies these requirements.
>
> Keep the original definitions and results as historical evidence. Mark them superseded with this authorization, not
> retroactively passed. Close each replacement clause only when its own evidence supports it.

Below, the eight are R1 to R8 in the owner's order: R1 the abilities' measurable contribution, R2 improvement up to a
documented cap, R3 preparation and circumstances in the intended direction, R4 useful opportunities across varied
suitable material, R5 expansive's own advantages, R6 no erased weakness, R7 tests that fail when restraint's contributions
or circumstance effects are removed, R8 the maximum-quality guarantee.

## Where It Started

**The originals,** from `../decisions-2026-10-16/criteria.md` (ST6-R), with every result they had. They stay in the
record as written. Each is superseded below with this authorization; none is passed.

- **(a) Viable.** "Playing restrained against the grain, the restrained specialist is ahead of the even actor playing the
  better-suited side on at least **25%** of those materials." Brief 10 measured it at 3 of 44; brief 11, on `44cd15c2`,
  at 2 of 44 (earnest-2, orig-runway: `../completion-2026-10-16/acting/measured/st6.json`, `ST6R.verdict.a`). Not met.
- **(c) Success depends on what it should.** Abilities: the even actor ahead of itself restrained against the grain on at
  least 10 points fewer of those materials than (a); preparation: half rehearsed, (a)'s count lower; circumstances: (a)'s
  rate on the slighter half of the gaps 20 points over the larger half; interpretation: every win allowed. Brief 11
  measured abilities 0 of 44 against an allowance of −5.45% (fails), preparation 0 against 2 (met), circumstances 9.1%
  against 0% (fails), interpretation met. Not met.
- **(e) Diverse, independent examples.** The wins in (a) from at least 6 source works and 3 register families, no work
  over a quarter of them; the limits in (d) from at least 4 works. Brief 11 measured the wins from 2 works in 1 family
  (comedy), the limits from 31 works. Not met.
- **(g) It catches what it should.** In a copy, ST6-R fails with restraint's draws removed (b), with restrained
  suitability forced to its least (a or c), and with the grain removed (c or d). Brief 11 measured (b) as written
  surviving the first, 96 of 96, and (b′) killing it under its clarification A1 (`../completion-2026-10-16/clarifications.md`);
  the second moved (a) to 22 of 96 and (c) and (e) to met, caught by (f) alone (0 of 0); the third moved (a) and (e) to
  met with (c) failing as before and (d) holding, so no clause that held failed
  (`../completion-2026-10-16/acting/mutations-st6.json`). Its gate tests caught all three in copies
  (`../completion-2026-10-16/acting/test-mutations.json`). Not met as written.

Brief 11's sorting found no missing gameplay: restraint's own abilities are read and decide the restrained take; (a)'s
25% at the equal budget was reachable only by what the approved design rules out (a budget 5.2% over, the weakest
dimension's term removed, or a restraint bonus) (`../completion-2026-10-16/acting-result.json`, ST6-R.a).

**Checked on the code as it stands** (`20b6d777`), one file at a time: `tests/decisions-judge.test.ts`, 29 of 29, exit 0;
`tests/stage-interpretation.test.ts`, 12 of 12, exit 0. The verified clauses cited below are those files' tests.

## Brief 11's Proposed Replacement Against The Authorization

"The existing proposed replacement" is brief 11's option 2 (`../completion-2026-10-16/acting-result.json`, ST6-R.a,
`decision.options[1]`): (a) restated in the restrained choice's own frame, against the grain restraint the restrained
specialist's better choice (its restrained take ahead of its own expansive take by more than 0.05), with (b′), its twin
and the even actor as controls; (c) and (e) asked in that frame; (d) and (f) unchanged. It measured 10 of 44 (one short
of 25%), the twin 2, the even actor 0; in that frame (c) met in all four parts and (e) met (9 works, 4 families).

| Part of option 2 | Against the authorization | Adopted? |
|---|---|---|
| (a) as a floor of 25% of the materials against the grain | The owner moved the judgment off "a fixed percentage of the time". It reads only the materials against the grain, where R4 asks for opportunities across suitable material. At 25% it measured short (10 of 44); the floor it was offered beside, 10 points over the even actor, was seen after the run. | No |
| Its frame: a restrained take judged against the same actor's expansive take | It's the player's own decision, whether to play this scene restrained, and a benefit a player can see on the chooser (each side's fully prepared result). It satisfies R4's "useful" exactly. | Yes, as the definition of an opportunity (ST6-R2.e) |
| (b′), the twin and the even actor as controls | (b′) and the twin show restraint's draws and its abilities are read, which R1 asks. They're one step each (the specialist's levels against 50), so they say nothing of R2's every improvement, nor of the cap. | (b′) and the twin cited as they stand; R2 measured on its own (ST6-R2.a) |
| (c) in the choice frame: half rehearsed 0 against 10, the slighter half 45.5% against 0% | The direction is right, but it's a count of choices crossing a threshold, for one actor, against the grain only. R3 asks that preparation and the scene's circumstances matter in their intended direction, which a controlled change of each input shows directly. | No; measured as controlled comparisons (ST6-R2.c) |
| (e) in the choice frame: 9 works, 4 families | The diversity floors are the owner's from brief 10, and they satisfy "varied". The population (against the grain, the restrained specialist only, the stage only) isn't R4's "suitable material", nor every kind of player, nor every kind of work. | The floors, yes; the population, no (ST6-R2.e) |
| (d) and (f) unchanged | Both verified, both carry R5. | Yes, cited as they stand |
| (g): the draws by (b′), the suitability by (f), the grain by the frame's circumstances clause | Partial. R7 also names the abilities not read and the circumstance effects removed, and the house's practice is gate tests, not measured clauses alone. | Extended (ST6-R2.g) |
| R6 and R8 | Not part of option 2. | Carried by ST6-R2.c and ST6-R2.a |

So option 2 isn't adopted as it stands. Its frame and (e)'s floors are, where named.

## What Every Replacement Shares

**Material: every existing piece a player can play restrained, and nothing chosen by how it comes out.**

- **Class scenes and plays as class scenes:** all 97 (`SCENE_MATERIAL`, `PLAY_MATERIAL`), on stage, Scene Study's task and
  difficulty, every part complete, as `tools/interpretation.ts --stage` judges them (ST6-R's own population, which was 96
  where both sides fit; Riders To The Sea takes only restrained).
- **Nights:** all 30 plays as a supporting part at the School, the performance task, its workload and its part's text, as
  `tools/pieces.ts` builds a night, with the way of playing read as `nightEvaluation` reads it (the choice's lean, draws,
  rehearsal and grain).
- **Practice briefs:** all 298, in every reading (657; 262 at a close frame, 36 at a microphone), as `preview` judges a
  reading played a way (`systems/briefs.ts`).

The restrained side fits every one of them: no material's `allows` rules it out. A director's request (a brief's
callback asking for the other side) is the only way it misfits, and ST6-R2.c (c3) reads that.

"Stage" below is the class scenes, the plays and the nights together; "tape" is the briefs. The gate carries every class
scene, play and night, and every brief in its first reading, for the clauses that judge many variants of each case
((a1) to (a3), (c1), (c2), (c4)); every reading for the rest. `tools/acting-criteria.ts` (`measureST6R2`, run by
`tools/interpretation.ts -- --st6r2 <file>`) measures every clause on every reading. A clause closes only where both hold.

**Actors**, named here before anything was measured, every one TEST SETUP (levels set directly):

| Actor | Abilities | Techniques | Why it's here |
|---|---|---|---|
| Beginner | all 35 | 30 | L3-R (d)'s beginner: where a difficulty asks most |
| Even | all 50 | 50 | ST6-R's even actor, the balanced player |
| Restrained specialist | emotional depth 85, composure 75, focus 75, the nine others (600 − 235) / 9 | 50 | ST6-R's, at the even actor's budget |
| Expansive specialist | presence 85, vocal 75, physical 75, the nine others (600 − 235) / 9 | 50 | ST6-R's, the other side's specialist, weak in restraint's three |
| Near-master | all 92 | 85 | L3-R (d)'s near-master: where improvement nears the cap |

Each is fully prepared (every part complete, the choice rehearsed in at 1, knowing the genre), on a sufficient day
(readiness 100), with no draw, unless a clause says otherwise.

**Restraint's relevant abilities** are the three its way of playing draws on (`APPROACH_EFFECT.restrained.inputs`):
emotional depth and composure on believability, focus on consistency. The chooser names them, "What It Draws On".

**Thresholds,** each the house's, none set from a run:

- **1e-9 at full precision** for a property with no draw ("rises", "never falls", "the same"): brief 10's rule, five
  orders above the floating-point noise measured on these judgments (3e-14) and far below the display's half-step.
- **More than 0.05 at full precision** for "measurable", "ahead", "behind" and "costs": half a shown tenth, the house's
  measure of a difference that counts since phase 2b (H4 and ST6), so a player can see it on the result.
- **A step of 10** in an ability: H4-R's probe, an effect read as the result's change for +10 from where the actor is.
- **Shares** only where the owner had a figure: (e)'s diversity floors (6 works, 3 register families, no work over a
  quarter) and H4-R (c)'s 1%. No clause has a floor on how often restraint must win.

**Documented caps and limits** (R2's exceptions), each in the code: an ability is read as its level over its full, at
most 1 (`termsOf`, `systems/evaluation.ts`); a dimension's quality is held to 0..100 (`dimensionQuality`); a side's
suitability is held to −1..1 (`suitabilityOf`, `systems/interpretation.ts`); the grain's exponent is held at
`GRAIN.floor` or more (`judgeExact`). A case a clause excuses by one of them is counted and named in the measurement.

## ST6-R2.a, Restraint's Own Abilities Pay, Up To The Guarantee (Replaces (a))

**Carries R1, R2 and R8.** On every case (every actor, every material of every kind, played restrained):

- **(a1) A measurable contribution (R1).** Raising emotional depth, composure and focus together by 10 (to 100 at most)
  raises the restrained take by more than 0.05.
- **(a2) Restraint's own part (R1).** That rise is larger with restraint's draws than with them taken out (its lean, its
  grain and its rehearsal kept), by more than 1e-9; and each of the three's own +10 rise is larger with every draw than
  with its own draw alone taken out, by more than 1e-9. This is what makes the contribution restraint's: an ability the
  task reads anyway would rise without it.
- **(a3) More is better, up to the cap (R2).** Each of the three set in turn to 0, 20, 40, 60, 80 and 100, everything else
  held: the restrained take rises at every step by more than 1e-9. Set past its full (110 against 100), it's the same as at
  100 within 1e-9: the documented cap, and the only one.
- **(a4) The guarantee kept (R8).** A mastered performer (every ability 100, every technique at `MASTERED`), fully
  prepared with the choice rehearsed in, played restrained where it fits, on a sufficient day: 100 on every case, with no
  draw and with a draw.

**Why these thresholds.** R1 says "measurable", and a contribution under half a shown tenth isn't one a player can see:
0.05 at H4-R's step of 10. R2 says "must improve", any improvement, which a property with no draw shows at 1e-9; its
exception is a documented cap, so the step past full is where the cap must be the only thing that stops it. (a2) asks
only that restraint's draws be part of the rise, not how large, since the owner asked that their contribution exist and be
caught when removed (R7), not that it reach a size. R8 is the guarantee as M1 and ST5 state it.

**Already verified, cited as they stand:** (b′), "restraint's own craft pays: the restrained specialist's lift over the
even actor is larger playing restrained than expansive wherever both fit, and restraint's draws are part of it on every
one"; the twin, "restraint's own abilities decide it: …"; M1, "every judged piece and reading comes to 100 for a mastered
actor, …" (all `tests/decisions-judge.test.ts`); ST5, "mastery: a mastered, prepared actor reaches 100 either way on a
scene that suits one, the other side fitting" (`tests/stage-interpretation.test.ts`). None of them reads a brief or a
night played restrained, nor R2's every step, so ST6-R2.a measures its own.

**What breaks it:** restraint's draws removed (a2); any one draw removed (a2); restraint's three read at 50 whatever their
level (a1, a3); a cap on a take against the grain (a4).

## ST6-R2.c, Success Depends On Preparation, The Scene And A Valid Choice, Not On An Unrelated Strength (Replaces (c))

**Carries R3 and R6.**

- **(c1) Preparation, in its direction (R3).** On every case, the restrained take with the choice rehearsed in at 0, 0.25,
  0.5, 0.75 and 1 never falls from one step to the next (within 1e-9); at 0.5 it's behind its take at 1 by more than 0.05,
  and the take names the choice's rehearsal among its limits. Against the grain it asks more: where the mark that completes
  the choice (`required`) is over coursework's 0.9, the take rehearsed only to 0.9 is behind its fully rehearsed one by
  more than 1e-9, and where the mark is 0.9 or under, the same within 1e-9; the mark is over 0.9 only where restraint's
  suitability is under 0, and under 0.9 only where it's over 0.
- **(c2) The scene's circumstances, in their direction (R3).** A controlled change, one input at a time, for every actor:
  - On stage (every class scene, play and night), each of the four circumstances one level up where it's under 3 and one
    down where it's over 0, everything else held. What's kept hidden and a private exchange argue for restraint: one
    level up, restrained suitability rises, the restrained take doesn't fall (within 1e-9) and the expansive take doesn't
    rise; spoken to many and a conflict out loud argue for size, the reverse; one level down, the reverse of up. Wherever
    the side's suitability moved and the grain's floor didn't hold it, the move is strict (more than 1e-9).
  - On every kind, the scene read or not: the restrained take with the grain at its strength, against the grain at
    nothing, is higher where restraint's suitability is over 0, lower where it's under 0, and the same within 1e-9 at 0;
    strictly (more than 1e-9) unless the grain's floor holds it.
- **(c3) A valid interpretation (R3, R8).** On every brief, under a callback asking for it expansive, the restrained take
  doesn't fit: the reason is said before the choice (`misfitOf`), and the take is behind the same take under a callback
  asking for it restrained (everything else the same, the callback's difficulty in both) by more than 0.05, for every
  actor, the misfit named among its limits; a mastered performer's isn't 100 there, since the guarantee asks a valid
  interpretation. Such a take is never counted in ST6-R2.e.
- **(c4) No erased weakness (R6).**
  - H4-R (c)'s rule, read on restrained takes, which H4-R's pieces (played with no way chosen) never were: for each of the
    twelve abilities, its specialist (85, the other eleven (600 − 85) / 11, techniques 50) against the even actor, both
    restrained. Where the ability carries under a tenth of the twelve's summed +10 effects on the take, the specialist is
    ahead by more than 0.05 on at most 1% of such pairs, H4-R (c)'s figure.
  - The restrained specialist's weaknesses still cost it where its strength is drawn on: its nine others raised from
    40.56 to the even actor's 50, everything else held, raise its restrained take by more than 0.05 on every case.

**Why these thresholds.** R3's "matter" is a visible difference (0.05) for the half-rehearsed probe brief 10's (c) used
and for a misfit; "in the intended direction" is a sign, read at 1e-9 on every controlled change, since each change has
no draw. The circumstances' directions are the content's own (`CIRCUMSTANCE_AFFINITY`), and their reasons are the scenes'
texts (`content/material.ts`, `why`). R6's figure is the owner's for H4-R (c), carried to the restrained take unchanged.

**Already verified, cited as they stand:** "circumstances decide where it works: the scene's grain only takes from a
restrained take against it, …" and "no strength erases an unrelated weakness: …" (`tests/decisions-judge.test.ts`); "what
a scene asks shows each circumstance with its level and its reason from the text, …" and "PLAYER JOURNEY: a class scene
chosen restrained and expansive, its forecast following the scene's circumstances, …" (`tests/stage-interpretation.test.ts`).

**What breaks it:** the choice's rehearsal not read (c1); the grain removed, read backwards, or restrained suitability
forced to its least (c1, c2); the scene's circumstances not read (c2); a strength read in place of a weaker ability (c4).

## ST6-R2.e, Useful Opportunities Across Varied Material, And Expansive Keeps Its Own (Replaces (e))

**Carries R4 and R5.**

- **(e1) Opportunities (R4).** A case is suitable for restraint where restrained fits and its suitability is over
  expansive's. An opportunity, for an actor, is a suitable case where its restrained take is ahead of its own expansive
  take by more than 0.05: restraint its better choice, the frame brief 11's option 2 proposed. For the beginner, the even
  actor, the restrained specialist and the near-master, on stage and on tape each, the opportunities come from at least 6
  source works and at least 3 register families, no one work giving more than a quarter of them.
- **(e2) Restraint's abilities widen them.** On stage and on tape each, the restrained specialist has more opportunities
  than the even actor at the same budget. Beside it, not a floor: the cases against the grain where restraint is the
  specialist's better choice and not the even actor's (option 2's count, kept as the record).
- **(e3) Expansive keeps its own (R5).** The mirror: a case is suitable for expansive where expansive fits and its
  suitability is over restrained's, and an expansive opportunity is one where the actor's expansive take is ahead of its
  own restrained one by more than 0.05. For the beginner, the even actor, the expansive specialist and the near-master,
  on stage and on tape each, from at least 6 works and 3 families, no work over a quarter; and the expansive specialist
  has more than the even actor.

**Why these.** R4 asks for opportunities, useful, across varied suitable material: useful is the player's own choice
paying (more than 0.05, visible on the chooser), suitable is where the scene favors restraint, and varied is (e)'s floors,
the owner's from brief 10, on each medium. It asks no share of anything, as the authorization moved away from one. The
specialist in the other side is left out of each half's floor, and reported: for it the other side keeping its own
advantages is R5, and requiring the first side's opportunities of it would pull against R5 and R6.

**Already verified, cited as they stand:** (d), "where size is what the scene is built on, restraint has its limits: …";
(f), "the other half is kept: the expansive specialist playing expansive is ahead of its own restrained take on at least a
quarter of the materials restraint suits better"; and the even actor's restrained take never ahead of its own expansive
one against the grain, in "success depends on the scene: …" (`tests/decisions-judge.test.ts`).

**What breaks it:** restrained suitability forced to its least (e1, e2); restraint's draws removed (e2).

## ST6-R2.g, It Catches What It Should (Replaces (g))

**Carries R7.** Each mutation is made in a copy of the clone, never in its tree, and the copy runs the ST6-R2 gate tests
(`tests/decisions-judge.test.ts`, the "ST6-R2" block). A mutation is caught where a test that passes on an unmutated copy
fails on the mutated one; the unmutated copy is run as its own control. The clause is met where every mutation R7 names is
caught, each by the test its clause says:

| Id | The mutation | R7's words | Must fail |
|---|---|---|---|
| g1 | restraint's draws removed (`APPROACH_EFFECT.restrained.inputs` empty) | its ability contributions removed | (a2), (e2) |
| g2 | restraint's draw on emotional depth removed | the same, one at a time | (a2) |
| g3 | restraint's draw on composure removed | the same | (a2) |
| g4 | restraint's draw on focus removed | the same | (a2) |
| g5 | emotional depth, composure and focus read at 50 whatever their level | its relevant abilities not read | (a1), (a3) |
| g6 | the grain removed (`GRAIN.strength` 0) | its circumstance effects removed | (c2) |
| g7 | the scene's circumstances not read (`CIRCUMSTANCE_AFFINITY` skipped) | the same | (c2) |
| g8 | the grain read backwards (a side against the scene made easier) | the same, reversed | (c1), (c2) |
| g9 | restrained suitability forced to its least on every material | the same | (c2), (e1) |
| g10 | the choice's rehearsal not read | its preparation not read (`prompts/acting.md`) | (c1) |

And for the clauses R7 doesn't name, each recorded with what caught it:

| Id | The mutation | Must fail |
|---|---|---|
| g11 | every ability read at the performer's emotional depth where that's greater (a strength covering every weakness) | (c4) |
| g12 | a take against the grain held under 100 at mastery | (a4) |

**Why every one and not a share:** each mutation removes something R7 says a test must catch, so one surviving is a test
missing.

## How The Eight Are Carried

| | ST6-R2.a | ST6-R2.c | ST6-R2.e | ST6-R2.g | Verified clauses that also carry it |
|---|---|---|---|---|---|
| R1 | (a1), (a2) | | | | (b′), the twin |
| R2 | (a3) | | | | L3-R (d) for any one ability, no way chosen |
| R3 | | (c1), (c2), (c3) | | | the grain's strength; the circumstances shown and played |
| R4 | | | (e1), (e2) | | |
| R5 | | | (e3) | | (d), (f) |
| R6 | | (c4) | | | H4-R (c) |
| R7 | | | | g1 to g10 | brief 11's test mutations |
| R8 | (a4) | (c3) | | g12 | M1, ST5 |

## The Originals, Superseded

ST6-R (a), (c), (e) and (g) are Explicitly Deferred, superseded by the owner's brief 12, section 1, "Mark them
superseded with this authorization, not retroactively passed", each with its figures above kept. ST6-R (b), (b′), (d)
and (f) are untouched and stay verified. Each replacement closes on its own evidence: its gate tests by title on the
tested commit, and its measurement's command, output and figures.

## What Isn't Done

No engine change is expected. If a clause fails because of a real gameplay defect, the defect is fixed within the
approved design, said in the result, with RULESET moved for a judging change; never with a bonus, a convenient material
set, or a criterion moved after a run. Brief 11's ST6-R tests stay as they are. Decision 4's rows are untouched.
