# Brief 13, Acting: ST6-R2.c And ST6-R2.e Clarified, The Criteria Written Before Any Change (2026-10-17)

The owner's brief 13, sections 1 to 3 (`../briefs-2026-10-16/13-resolve-the-final-acting-clauses-and-validate-through-multiple-playthroughs.txt`),
authorizes a clarification of ST6-R2.c and ST6-R2.e, the two clauses brief 12 left at Decision Required. This file was
written and committed in the acting area's clone, on `09a37a18` (brief 13's starting point), before any test, tool or
code it governs changed and before the final measurement. Only the trace below was made first, by a throwaway probe whose
figures are in `acting/trace.json`; it decides nothing, and the trace is made again by the tool once the tool carries it.
Nothing here is changed afterward to make a measurement pass: a criterion found wrong once it's measured is reported with
its figures, and any correction is the owner's.

## The Owner's Clarification, Quoted

The brief's sections 1, 2 and 3, as the owner wrote them:

> 1. Resolve ST6-R2.c With Defensible Comparisons
>
> I authorize the following clarification:
>
> A tiny circumstance change may legitimately produce no measurable score change because of documented precision, a cap, or another limiting factor. It must not produce an unexplained change in the wrong direction.
>
> * Trace each previously identified ±0.01 case through the actual calculations.
> * Distinguish display rounding from internal quantization and genuine gameplay limits.
> * Test changes immediately below, at, and above relevant boundaries.
> * Require meaningful circumstance changes to affect applicable work where the model says they should.
> * Ensure precision limits do not conceal a disconnected mechanic.
>
> Define “unrelated ability” from the actual dependency path through the engine—not from a cutoff selected because it makes the observed failures disappear.
>
> Separate:
>
> * An ability with no relevant dependency.
> * A small but legitimate contribution.
> * A direct contribution.
> * An indirect contribution through preparation, condition, or progression.
>
> Use controlled single-input comparisons to establish causality. Keep equal-budget specialist comparisons separately, because redistributing a budget changes several abilities at once.
>
> Do not automatically adopt the proposed 1/12 cutoff. Justify any threshold before validation. Explain the previously reported 65 of 6,344 comparisons individually or by demonstrated common cause.
>
> 2. Resolve ST6-R2.e Without An Impossible Ceiling Requirement
>
> I authorize comparing specialist advantages where the comparison actor has room to improve.
>
> An actor already succeeding on all suitable pieces cannot be required to succeed on more pieces than exist. However, excluding ceiling cases must not leave the test without meaningful evidence.
>
> * Keep ceiling cases in the report and explain their limits.
> * Establish appropriate below-ceiling profiles before measuring them.
> * Compare equal-budget actors under equivalent preparation and conditions.
> * Measure relevant differences in quality, preparation burden, endurance, or another established mechanic where appropriate.
> * Require varied existing material and justified specialist advantages.
> * Preserve the fact that specialization does not erase unrelated weaknesses.
> * Do not manufacture harder material or favorable profiles merely to secure a pass.
>
> Use fresh validation profiles beyond those that informed these clarifications.
>
> 3. Preserve Honest Criterion History
>
> Write the clarified criteria before tuning or final measurement.
>
> Retain:
>
> * Original definitions and results.
> * The exact clarification authorized here.
> * Why the previous comparison was unsuitable.
> * New tests and their evidence.
> * Any actual gameplay changes needed.
>
> Do not call a historical failure passed retroactively. Do not alter the scoring engine solely to satisfy a flawed comparison.
>
> Verify that tests detect removal of the relevant ability and circumstance effects. Close each clause only when its own acceptance conditions pass.

## Brief 12's (c) And (e), As Written, With Their Results

**The definitions,** word for word from `../resolution-2026-10-17/acting-criteria.md` (committed in `b8ac2f74`):

> ## ST6-R2.c, Success Depends On Preparation, The Scene And A Valid Choice, Not On An Unrelated Strength (Replaces (c))
>
> **Carries R3 and R6.**
>
> - **(c1) Preparation, in its direction (R3).** On every case, the restrained take with the choice rehearsed in at 0, 0.25,
>   0.5, 0.75 and 1 never falls from one step to the next (within 1e-9); at 0.5 it's behind its take at 1 by more than 0.05,
>   and the take names the choice's rehearsal among its limits. Against the grain it asks more: where the mark that completes
>   the choice (`required`) is over coursework's 0.9, the take rehearsed only to 0.9 is behind its fully rehearsed one by
>   more than 1e-9, and where the mark is 0.9 or under, the same within 1e-9; the mark is over 0.9 only where restraint's
>   suitability is under 0, and under 0.9 only where it's over 0.
> - **(c2) The scene's circumstances, in their direction (R3).** A controlled change, one input at a time, for every actor:
>   - On stage (every class scene, play and night), each of the four circumstances one level up where it's under 3 and one
>     down where it's over 0, everything else held. What's kept hidden and a private exchange argue for restraint: one
>     level up, restrained suitability rises, the restrained take doesn't fall (within 1e-9) and the expansive take doesn't
>     rise; spoken to many and a conflict out loud argue for size, the reverse; one level down, the reverse of up. Wherever
>     the side's suitability moved and the grain's floor didn't hold it, the move is strict (more than 1e-9).
>   - On every kind, the scene read or not: the restrained take with the grain at its strength, against the grain at
>     nothing, is higher where restraint's suitability is over 0, lower where it's under 0, and the same within 1e-9 at 0;
>     strictly (more than 1e-9) unless the grain's floor holds it.
> - **(c3) A valid interpretation (R3, R8).** On every brief, under a callback asking for it expansive, the restrained take
>   doesn't fit: the reason is said before the choice (`misfitOf`), and the take is behind the same take under a callback
>   asking for it restrained (everything else the same, the callback's difficulty in both) by more than 0.05, for every
>   actor, the misfit named among its limits; a mastered performer's isn't 100 there, since the guarantee asks a valid
>   interpretation. Such a take is never counted in ST6-R2.e.
> - **(c4) No erased weakness (R6).**
>   - H4-R (c)'s rule, read on restrained takes, which H4-R's pieces (played with no way chosen) never were: for each of the
>     twelve abilities, its specialist (85, the other eleven (600 − 85) / 11, techniques 50) against the even actor, both
>     restrained. Where the ability carries under a tenth of the twelve's summed +10 effects on the take, the specialist is
>     ahead by more than 0.05 on at most 1% of such pairs, H4-R (c)'s figure.
>   - The restrained specialist's weaknesses still cost it where its strength is drawn on: its nine others raised from
>     40.56 to the even actor's 50, everything else held, raise its restrained take by more than 0.05 on every case.
>
> **Why these thresholds.** R3's "matter" is a visible difference (0.05) for the half-rehearsed probe brief 10's (c) used
> and for a misfit; "in the intended direction" is a sign, read at 1e-9 on every controlled change, since each change has
> no draw. The circumstances' directions are the content's own (`CIRCUMSTANCE_AFFINITY`), and their reasons are the scenes'
> texts (`content/material.ts`, `why`). R6's figure is the owner's for H4-R (c), carried to the restrained take unchanged.
>
> ## ST6-R2.e, Useful Opportunities Across Varied Material, And Expansive Keeps Its Own (Replaces (e))
>
> **Carries R4 and R5.**
>
> - **(e1) Opportunities (R4).** A case is suitable for restraint where restrained fits and its suitability is over
>   expansive's. An opportunity, for an actor, is a suitable case where its restrained take is ahead of its own expansive
>   take by more than 0.05: restraint its better choice, the frame brief 11's option 2 proposed. For the beginner, the even
>   actor, the restrained specialist and the near-master, on stage and on tape each, the opportunities come from at least 6
>   source works and at least 3 register families, no one work giving more than a quarter of them.
> - **(e2) Restraint's abilities widen them.** On stage and on tape each, the restrained specialist has more opportunities
>   than the even actor at the same budget. Beside it, not a floor: the cases against the grain where restraint is the
>   specialist's better choice and not the even actor's (option 2's count, kept as the record).
> - **(e3) Expansive keeps its own (R5).** The mirror: a case is suitable for expansive where expansive fits and its
>   suitability is over restrained's, and an expansive opportunity is one where the actor's expansive take is ahead of its
>   own restrained one by more than 0.05. For the beginner, the even actor, the expansive specialist and the near-master,
>   on stage and on tape each, from at least 6 works and 3 families, no work over a quarter; and the expansive specialist
>   has more than the even actor.

The actors, the material ("every existing piece a player can play restrained": 97 class scenes and plays, 30 nights, 657
brief readings, 784 in all), the thresholds (1e-9, more than 0.05, a step of 10) and the documented caps are brief 12's,
in the same file, and unchanged here.

**The results,** word for word from `../resolution-2026-10-17/acting-result.json` (measured on `86d9c8a5`,
`../resolution-2026-10-17/acting/st6r2.json`):

> **ST6-R2.c, Decision Required.** Two parts don’t hold as written, each from a limit the criteria didn’t name, not from a defect. (c2), the scene read or not: 10 of 784 pieces (50 of 3920 actor cases), every one a brief reading with restraint at exactly −0.01 or 0.01 (brief-grindhouse/terror, brief-isekai/nobody, brief-rockumentary/relief, brief-science_fantasy/wonder, brief-dance-2/two, brief-melodrama-2/pride, brief-musical-2/love, brief-mystery-2/cornered, brief-psychological_horror-2/together, brief-psychological_horror-2/loop), have a grain of 0.003 of difficulty, which `grainOf` keeps to a hundredth and so comes to nothing; none of 784 moves the wrong way. (c4), H4-R (c)’s rule on restrained takes: specialists ahead on 65 of 6344 pairs on every reading (0.0102; 60 of 3,433, 0.0175, on the gate’s first readings) against its 1%, all 65 against the grain, the ability carrying 0.0876 to 0.0995 of the take’s +10 effects, between the equal budget’s break-even (1/12) and a tenth, the most ahead 0.5527; under 1/12, 0 of 5101. 34 of the gate’s 60 are ahead with no way chosen too, and 27 played expansive: it isn’t restraint’s. Neither part is asserted by the gate.
>
> **ST6-R2.e, Decision Required.** (e2) and (e3)’s “more than the even actor” fail on stage alone, at a ceiling: the even actor’s opportunities there are already every suitable piece (66 of 66 for restraint, 57 of 57 for size), so neither specialist can have more. Beside it, option 2’s frame: against the grain restraint is the restrained specialist’s better choice on 13 of 57 stage pieces and 214 of 280 brief readings, the even actor’s on 0 and 40. And (e2) didn’t catch g1, restraint’s draws removed, though the criteria named it there: on tape the specialist’s opportunities stay over the even actor’s without them. The stage half isn’t asserted by the gate.

Held as brief 12 measured them: (c1) and (c3) met on every case; (c2)'s circumstances met on all 3,465 changes; (c4)'s
second part met (the nine raised lift the restrained specialist's take by 3.8369 at least); (e1) met; (e2) and (e3) met on
tape (369 against 363; 279 against 217). Those results stand, and none of the failures above is passed retroactively.

**Checked on the code as it stands** (`09a37a18`), one file at a time: `tests/decisions-judge.test.ts`, 39 of 39, exit 0;
`tests/stage-interpretation.test.ts`, 12 of 12, exit 0.

## The Trace, Made Before Any Threshold

Every figure here is in `acting/trace.json`. The five actors are brief 12's, every take fully prepared, on a sufficient
day, with no draw.

### The Ten Readings At ±0.01

**The calculation, step by step** (`systems/interpretation.ts`):
1. `suitabilityOf` keeps each of a side's signals to a hundredth (`push`, `r2`), and drops one under half a hundredth;
2. it sums them, halves the sum, holds it to −1..1 and keeps that to a hundredth too: the side's suitability `s`;
3. `grainOf` turns `s` into a share of difficulty on each dimension the side leans on,
   −`GRAIN.strength` × `s` × `stakesScale(stakes)` × (lean − 1) / (the side's largest lean − 1), and keeps each share to a
   hundredth (`r2`); restraint leans believability 1.25 (its whole share) and consistency 1.05 (a fifth of it);
4. it moves the rehearsal mark from 0.9 by `GRAIN.prep` × `s`, kept to a hundredth;
5. the judge (`judgeExact`, `systems/evaluation.ts`) adds the share to the dimension's difficulty, held at `GRAIN.floor` − 1
   or more, so `capacity^(1 + difficulty)` reads it; the result is shown to a tenth (`rounded`), and the measure reads the
   exact value.

**What it comes to on the ten.** Each has `s` = ±0.01 (three of them a halved sum of exactly 0.005, which keeps to 0.01, and
three a halved sum of −0.015, which keeps to −0.01). At stakes 0 to 3 (`stakesScale` 0.85 to 1.3), the share at full
precision is 0.0026 to 0.0039 on believability and 0.0005 to 0.0008 on consistency: under half a hundredth on both, so
`grainOf` keeps each as nothing, and the mark stays 0.9 (0.899 or 0.901, kept to a hundredth). The grain read and not read
hand the judge the same inputs, and the exact takes are the same to the last digit for all five actors, 50 of 50.

| | Display rounding | Internal quantization | A genuine gameplay limit |
|---|---|---|---|
| What it is | The result shown to a tenth (`rounded`) | `grainOf`'s share and mark kept to a hundredth; before it, `suitabilityOf`'s signals and `s` | The grain's floor (`GRAIN.floor`), the suitability's hold at ±1, an ability's cap at its full |
| On the ten | Not the cause: the exact takes are equal, not merely their shown tenths | The cause: every share is under half a hundredth | None applies: no floor, hold or cap is reached |

**The mechanic isn't disconnected.** Carried at full precision (the same context with the share unrounded, made in the probe,
not in the engine), every one of the 50 moves the right way: lower against the grain, higher with it, by 0.0629 at most
(the beginner), 0.0462 for the even actor, 0.0501 for the expansive specialist, 0.0258 for the restrained specialist and
0.0093 for the near-master. Rounded to a tenth, 14 of the 50 shown results would differ by a tenth. That is what the
precision hides: under a shown tenth, always in the right direction.

**The boundary on the real readings,** every reading with |`s`| of 0.05 or under, for the five actors:

| `s` | Cases | The same | Strictly the right way | The wrong way | Least strict move |
|---|---|---|---|---|---|
| 0 | 100 | 100 | 0 | 0 | |
| ±0.01 | 50 | 50 | 0 | 0 | |
| ±0.02 | 20 | 0 | 20 | 0 | 0.0061 |
| ±0.03 | 55 | 0 | 55 | 0 | 0.0068 |
| ±0.04 | 65 | 0 | 65 | 0 | 0.0080 |
| ±0.05 | 80 | 0 | 80 | 0 | 0.0145 |

From ±0.02 the share is 0.0051 or more at every stakes the catalog holds, which keeps to a hundredth, and every take moves
the right way. Brief 12's measure found none of the 3,920 actor cases moving the wrong way.

**Not documented, until this brief.** The hundredth is `grainOf`'s since it was written (2026-10-16), and shows in a take's
words ("Played that way it came to nothing either way against the scene", `takeGrainWords`), but no comment or document
says the share is rounded. Its documentation goes in with this work, in `grainOf`'s comment, and changes nothing judged.

### The 65 Of 6,344 Pairs

Brief 12's (c4) pairs: for each piece and each ability carrying under a tenth of the twelve's summed +10 effects on the
even actor's restrained take, that ability's specialist (85, the eleven at 515/11 = 46.82, techniques 50) against the even
actor (all 50), both restrained. 65 are ahead by more than 0.05: 39 class scenes and plays, 10 nights, 16 brief readings,
from 34 works; vocal 13, imagination 11, focus 9, composure 7, physical 7, listening 5, discipline 5, stamina 3, memory 3,
adaptability 2. Each is listed in `acting/trace.json` (`sixtyFive`) with its decomposition and its path. **One common
cause, in three parts, explains every one:**

1. **Every one has a dependency path into the take** (the map below): 61 direct (16 of them restraint's own draws, focus 9
   and composure 7), 1 a small but legitimate supporting read (listening in Major Barbara's scene, 0.95 of connection and
   0.85 of responsiveness, under presence's and adaptability's 1), 3 indirect (stamina, through the drain), and none
   without one.
2. **Each is ahead by the equal budget's arithmetic.** Its lead (0.0509 to 0.5527) is its strength's own gain, the ability
   alone at 85 with the eleven at 50 (2.3656 to 3.2484), plus its eleven's own cost, the eleven alone at 46.82 (−2.2772 to
   −2.6816), plus their interaction (−0.1654 to +0.0165). The strength's gain is 0.504 to 0.550 of the two together: on
   these pieces the ability is worth more at +35 than the other eleven are at −3.18 each. Every one of the 65 carries more
   than 1/12 of the +10 effects (0.0876 at least), where +35 against 11 × 3.18 balances.
3. **They're all against the grain, and all under a tenth, because of where the take's weakest dimension is.** The whole is
   `meanShare` of the dimensions' weighted mean and the rest their least (`wholeOf`). For an actor even in everything,
   connection, consistency and responsiveness, which read no technique, sit at the same capacity (0.5, against
   believability's, interpretation's and execution's 0.5 and a little more from techniques at 50/90) and tie at the bottom.
   A +10 in one input lifts its dimension off the tie and leaves the least where it was, while the specialist's −3.18 on
   eleven lowers all of them: so the +10 shares understate what the eleven cost. Against the grain on a restrained take the
   grain adds difficulty to believability, the dimension restraint leans on most, and pulls it alone to the bottom; then a
   +10 and a −3.18 move the least alike, and the shares are linear. In the window between 1/12 and a tenth:

   | The grain | Pairs | Ahead | Believability alone at the bottom of every segment (ahead / not) | The eleven's cost against what the shares predict, median (ahead / not) |
   |---|---|---|---|---|
   | Against | 579 | 65 | 65 / 171 | 1.028 / 1.344 |
   | With | 647 | 0 | 0 / 0 | – / 1.365 |
   | Level | 17 | 0 | 0 / 0 | – / 1.379 |

   With the grain or level, the first specialist ahead carries a tenth or more; against it, about 1/12 plus what it takes to
   be 0.05 ahead (0.0876). H4-R's tenth came from pieces with no way chosen, where the bottom is that tie, and held there.

**Not restraint's.** 38 of the 65 are ahead by more than 0.05 with no way chosen too, 30 played expansive, and 33 with the
grain at nothing: the lead is the work's arithmetic, not a restrained take's. Under 1/12 (5,101 pairs) no specialist's
take is above the even actor's at all.

### The Dependency Map

What reads each ability in a restrained take, from the context the judge reads (`materialContext`, `briefContext`,
`TASK_PROFILES`, `APPROACH_EFFECT.restrained`, `judgePieceExact`): the kind of work's own profile, everything the piece adds
(its features, turns, blends, language and demands), a brief's reading, reader and register, restraint's draws, and the
drain. Four classes, from the path alone:

- **Direct:** restraint draws on it (emotional depth, composure, focus), or a dimension reads it at least as much as the
  kind of work's own profile reads that dimension's leading ability (the most it gives any one ability there).
- **Small but legitimate:** a dimension reads it, but only under that leading weight everywhere: the profile's "a little"
  (`BASE_INPUTS`: "each reads a little of every ability its dimensions concern"), with what the piece adds.
- **Indirect:** no dimension of the take reads it, but a condition of the take does: stamina, taken out of every input of a
  piece judged in parts (`withoutStamina`) and read as the drain on every dimension tiring reaches, where the piece has a
  later segment and a load over nothing.
- **None:** nothing in the take reads it.

On the 784 pieces (`acting/trace.json`, `map`):

| Ability | Class scenes and plays (97) | Nights (30) | Brief readings (657) |
|---|---|---|---|
| Emotional depth, composure, focus | direct (restraint draws on each) | direct | direct |
| Presence, imagination, memory, adaptability, discipline | direct (each a dimension's leading input) | direct | direct |
| Listening | direct 73, small 24 | direct 18, small 12 | direct 657 |
| Vocal | direct 70, small 27 | direct 15, small 15 | direct 444, small 12, **none 201** |
| Physical | direct 62, small 35 | direct 14, small 16 | direct 516, **none 141** |
| Stamina | indirect (the drain) | indirect | indirect |

Checked against the engine on the even actor, one input at a time: each ability raised alone by 10 moved the restrained
take wherever the map gives a path and moved nothing where it gives none, 9,408 of 9,408.

**Outside the take,** each held fixed by a controlled take (fully prepared, a sufficient day, no draw), and so not part of
"relevant" here:
- **preparation:** focus speeds getting to know a class scene, memory its lines, imagination its choices, adaptability a
  revision (`STEP_ABILITY`, `systems/coursework.ts`), listening its partner's evenings and a reader's; a brief's breakdown by
  imagination, its lines by memory, its rehearsal by listening where there's a reader (`systems/briefs.ts`); a night's
  lines by memory and its blocking by adaptability (`systems/production.ts`). The choice's own rehearsal reads no ability:
  its gain is the day's focus, from readiness (`focusOf`, `systems/school.ts`);
- **condition:** composure and adaptability recover a segment from a slip, which only a draw makes (`judgePieceExact`);
  composure lessens nerves' stress before a performance (`nerves`, `systems/attributes.ts`); stamina sets a night's energy
  after (`eveningCost`);
- **progression:** discipline lifts every ability's growth (`DEVELOPMENT.disciplineLift`); each ability grows by its own
  work.

**"Unrelated," from the path:** an ability is unrelated to a restrained take where the map gives it no path into the take:
the class **none**. On the 784 pieces that's vocal on 201 brief readings and physical on 141, each a brief with no voice or
body work in it and nothing in its reading, reader or register that draws on them. No cutoff on a share decides it.

## Why The Previous Comparisons Were Unsuitable

- **(c2)'s scene read or not** asked a strict move wherever the suitability isn't 0, excusing only the grain's floor. It
  named one limit and not the other the engine has: `grainOf`'s hundredth. At ±0.01 the share is under it on every
  dimension, and the take can't move. The criterion asked the engine for a precision it doesn't keep.
- **(c4)'s first part** read "unrelated" as a share of a measured effect, under a tenth of the twelve's +10 effects at the
  even actor. A share isn't a dependency: every one of the 65 is read by the take, 61 directly. And the share at +10 is
  measured at a tie at the bottom of the take, where it understates what a budget's −3.18 on eleven costs by about a
  third; where the grain breaks the tie, the break-even falls to the equal budget's 1/12. A tenth then counts a related
  ability's legitimate equal-budget lead as a strength erasing a weakness. Moving the cutoff to 1/12, which brief 12
  proposed, would empty the failures by the same kind of reading, a share chosen after the run.
- **(e2) and (e3)** asked a count to rise past its ceiling: on stage the even actor's opportunities are already every
  suitable piece (66 of 66, 57 of 57), so no actor can have more. A count with no room says nothing of an advantage.

## The Clarified Criteria

The material, the five actors and the thresholds are brief 12's; the fresh profiles are named below, before any of them is
measured. "Every case" is every piece of every kind (784); the gate carries the briefs at their first reading for the parts
that judge many variants of each piece (425 pieces), as brief 12's did, and the measurement every reading.

### ST6-R2.c, Clarified

**(c1) and (c3)** stand as brief 12 wrote them, and are asserted as they were.

**(c2′) The scene's circumstances, in their direction, down to the engine's precision.**
- **(c2.1) A circumstance, a level at a time** (stage): brief 12's (c2) first part, as written, for the five actors and the
  fresh comparison actors below (the measurement); the five in the gate.
- **(c2.2) The scene read or not** (every kind), the restrained take with the grain at its strength against at nothing:
  - **never the wrong way:** not lower (within 1e-9) where restraint's suitability is over 0, not higher where it's under 0;
  - **strictly the right way (more than 1e-9) wherever the model says the grain reaches the take:** the share `grainOf`
    keeps on some dimension restraint leans on isn't nothing, and the floor doesn't hold it;
  - **the same (within 1e-9) wherever the share it keeps is nothing on every dimension:** its documented hundredth. Each such
    case is counted and named, and must be one whose share at full precision, worked by the rule from `s`, the stakes and
    restraint's leans, rounds to nothing, so the excuse is predicted from the rule, not read off the take. At the stakes
    the catalog holds (0 to 3) the rule excuses exactly the pieces at `s` = ±0.01, and the excused must be exactly those;
  - **the precision hides nothing disconnected:** on each case so excused, the same take with the share carried at full
    precision (TEST SETUP: its context with the share unrounded) moves the right way, more than 1e-9. Its size is reported
    beside it, and how many shown results it would move by a tenth.
- **(c2.3) Boundaries, below, at and above:**
  - **the hundredth:** on the real readings, the take the same with the grain read or not at `s` = 0 and ±0.01, and
    strictly the right way at ±0.02, the first hundredth whose share is kept, for every actor; and on one piece, with the
    judge handed a share of −0.01, 0 and +0.01 on believability (TEST SETUP), the take strictly higher at −0.01 and lower
    at +0.01 than at 0: the judge reads every hundredth it's handed;
  - **the floor** (`GRAIN.floor` − 1 = −0.75 on the difficulty a share leaves): on one piece (TEST SETUP), the difficulty
    and the share coming to −0.76, −0.75 and −0.74: the take the same at −0.76 and −0.75, where the floor holds, and
    strictly lower at −0.74;
  - **the hold at ±1** (`suitabilityOf`): on stage, a circumstance's level changed where the side's sum stays inside −1..1
    moves the suitability and the take strictly; where it reaches ±1 from inside, strictly; where the sum is past ±1 before
    and after, neither moves (within 1e-9). Each of the three is counted, and each must hold on at least one real change.
- **(c2.4) Meaningful changes reach the work:** (c2.1)'s strict moves and (c2.2)'s, wherever the model says the change
  reaches the take; briefs carry no levelled circumstances (`briefMaterial`), so on tape the scene's grain is the
  circumstance read.

**(c4′) No erased weakness, by the dependency path.**
- **(c4.1) The map is the engine's.** On every case, for each actor (the five; and the fresh comparison actors below, none
  of whose abilities is at 100, in the measurement), each ability raised alone by 10 (to 100 at most) moves the restrained take by more than 1e-9 where the map gives it a path
  (direct, small or indirect), and by 1e-9 or less where it gives none.
- **(c4.2) No strength where it's unrelated.** On every case, for every ability the map gives no path, its specialist is
  behind its comparison actor by more than 1e-9, at each budget below: its strength reads nothing, and each weakness the
  take reads costs it. The informing budget is brief 12's; the fresh three are new. This one equal-budget comparison is
  asserted, since an unrelated strength moves nothing and the comparison comes to its eleven lowered alone.
- **(c4.3) A weakness still costs, one input at a time.** On every case, for each of the twelve specialists at 85 (the
  eleven at 46.82, techniques 50): each of its eleven that the map gives a path, raised alone to the even actor's 50, raises
  its restrained take by more than 1e-9, and each with none moves nothing (within 1e-9); its eleven raised together to 50
  raise it by more than 1e-9. The fresh budgets' specialists the same, in the measurement. Brief 12's second part (the
  restrained specialist's nine raised to 50, more than 0.05) stands and is asserted as it was.
- **(c4.4) The equal-budget specialists, kept apart.** Where the ability is related, the specialist's lead or deficit is
  reported, not asserted: by class, and for each pair ahead by more than 0.05, its strength's own gain, its eleven's own
  cost, and their interaction. H4-R (c)'s tenth on restrained takes stays as brief 12 measured it (65 of 6,344, not met as
  written), and 1/12 isn't adopted as a cutoff for anything.

**The specialists for (c4.2) and (c4.3):**

| Budget | The specialist | Its comparison | Why |
|---|---|---|---|
| 600 (brief 12's, informing) | the ability 85, the eleven 515/11, techniques 50 | the even actor (all 50, techniques 50) | brief 12's pairs |
| 420 (fresh) | the ability 70, the eleven 350/11, techniques 30 | the beginner (all 35, techniques 30) | the beginner's budget |
| 600 (fresh) | the ability 95, the eleven 505/11, techniques 50 | the even actor | a stronger strength on the same budget |
| 1,104 (fresh) | the ability 100, the eleven 1004/11, techniques 85 | the near-master (all 92, techniques 85) | where improvement nears the cap |

### ST6-R2.e, Clarified

**(e1)** stands as brief 12 wrote it, and is asserted as it was.

**The comparison where there's room.** A comparison actor `C` and its specialist counterpart at the same budget:
- **S(C)**, restraint's: `C` with emotional depth +35, composure +25 and focus +25, and each of the nine others −85/9. It's
  the restrained specialist's own shift from the even actor, so S(even actor) is the restrained specialist;
- **S′(C)**, size's: `C` with presence +35, vocal +25 and physical +25, and each of the nine others −85/9, the expansive
  specialist's own shift.

Every pair is fully prepared, on a sufficient day, with no draw: the same preparation and conditions. **Room:** `C` has room
on a medium where its opportunities (as (e1) defines them) are fewer than the suitable pieces there. Where they're all of
them, `C` is a ceiling case on that medium.

**Why quality, and not preparation or endurance.** The mechanic restraint's abilities act through is the take's quality:
they're inputs of believability and consistency, restraint's own dimensions. The choice's rehearsal reads no ability (its
gain is the day's focus, `focusOf`), and endurance is stamina's drain, which restraint doesn't draw on; neither is where a
restrained specialist differs from its comparison actor, so neither is asked.

**(e2′) Restraint's abilities widen them, where there's room.** For each comparison actor `C` in the restraint set below,
on stage and on tape each:
- **(e2.1) Ceiling cases, kept:** `C`'s opportunities against the suitable pieces are reported; where they're equal it's a
  ceiling case, named, with its limit, and (e2.2) isn't asked of it.
- **(e2.2) More where there's room:** where `C` has room, S(C) has more restraint opportunities than `C`. At least one fresh
  comparison actor has room on each medium; if none does there, the medium has no count evidence and (e2) isn't closed.
- **(e2.3) Quality, with or without a ceiling:** on every piece suitable for restraint, S(C)'s restraint margin (its
  restrained take less its own expansive take) is ahead of `C`'s by more than 0.05.
- **(e2.4) Justified by restraint's own abilities:** on every piece suitable for restraint, that extra margin is larger with
  restraint's draws than with them taken out (`APPROACH_EFFECT.restrained.inputs` empty for the length of the judgment), by
  more than 1e-9.
- **(e2.5) Varied existing material:** (e2.3) and (e2.4) on every suitable piece of every kind, nothing chosen or added; S(C)'s
  opportunities meet (e1)'s floors (6 works, 3 families, no work over a quarter) on each medium; and the pieces S(C) gains
  over `C`, taken together across the fresh comparison actors with room, meet them on each medium.

**(e3′) Size keeps its own, the mirror.** The same, for each comparison actor `C′` in the size set below, with S′(C′), the
pieces suitable for size, expansive opportunities and margins, and expansive's draws (`APPROACH_EFFECT.expansive.inputs`).

**(e4) Specialization doesn't erase unrelated weaknesses.** For each `C` in the restraint set, on every piece suitable for
size, S(C)'s expansive margin (its expansive take less its restrained one) is behind `C`'s by more than 1e-9, and S(C)'s
expansive opportunities are no more than `C`'s on each medium; the mirror for each `C′` and S′(C′) on the pieces suitable
for restraint. (c4′) holds the rest of R6.

**The comparison actors,** named before any of them is measured:

| Set | Actor | Abilities | Techniques | Budget | Why |
|---|---|---|---|---|---|
| Both (informing) | the even actor | all 50 | 50 | 600 | brief 12's: a ceiling case on stage |
| Both (informing) | the beginner | all 35 | 30 | 420 | brief 12's: a ceiling case on stage for restraint |
| Restraint (fresh) | V1 | presence, vocal, physical 60; emotional depth, composure, focus 40; the six others 50 | 50 | 600 | leans toward size by 10 |
| Restraint (fresh) | V2 | 70; 30; 50 | 50 | 600 | leans toward size by 20 |
| Restraint (fresh) | V3 | 75; 55; 65 | 60 | 780 | a developing actor leaning toward size by 10 |
| Restraint (fresh) | V4 | 45; 25; 35 | 30 | 420 | a beginner leaning toward size by 10 |
| Size (fresh) | V1′ | emotional depth, composure, focus 60; presence, vocal, physical 40; the six others 50 | 50 | 600 | leans toward restraint by 10 |
| Size (fresh) | V2′ | 70; 30; 50 | 50 | 600 | leans toward restraint by 20 |
| Size (fresh) | V3′ | 75; 55; 65 | 60 | 780 | a developing actor leaning toward restraint by 10 |
| Size (fresh) | V4′ | 45; 25; 35 | 30 | 420 | a beginner leaning toward restraint by 10 |
| Both (fresh) | V5 | all 65 | 60 | 780 | an even developing actor |

**Why these, and not favorable ones.** For an actor even in what each side draws on, the scene's grain alone decides which
side is its better choice, which is why the even actor and the beginner have every suitable stage piece. Room exists only
for an actor whose own abilities pull against the scene: on pieces suiting restraint, an actor leaning toward size. So each
set's fresh actors lean away from the side being tested, by 10 and 20 at the even budget and by 10 at a developing and a
beginner's budget; the leanings are the hard case for the side under test, not a help to it. The counterpart's shift is the
specialists' own, the same for every actor, and every one stays within 0 to 100 (S(V5)'s emotional depth comes to 100).
Brief 12's near-master isn't a comparison actor: its counterpart would pass the cap (92 + 35), which breaks the budget.

**Fresh, and run once.** V1 to V5 and V1′ to V4′, their counterparts, and the fresh budgets of (c4.2) and (c4.3) were never
measured before this file. The measure's code is checked on the informing actors alone; the fresh ones are run once, by
the measurement on the tested commit, and the gate then repeats that same judgment, which has no draw.

### What Breaks It

Each mutation is made in a copy of the clone (`tools/judge-mutations.mjs`, its work folder outside the clone), never in
its tree, and the copy runs the clarified block of `tests/decisions-judge.test.ts`. An unmutated copy is the control. A
mutation is caught where a test that passes in the control fails in the copy.

| Id | The mutation | What it removes | Must fail |
|---|---|---|---|
| h0 | none (the control) | | nothing |
| h1 | the grain removed (`GRAIN.strength` 0) | the circumstance effect on tape and stage | (c2.2) strict |
| h2 | the grain read backwards | the circumstance effect, its direction | (c2.2) never the wrong way |
| h3 | `grainOf` keeps the share to a tenth | the mechanic, below a coarser precision | (c2.2) strict, its excuses not the rule's |
| h4 | `grainOf` keeps the share at full precision | the documented hundredth | (c2.2) the same where it rounds to nothing |
| h5 | the grain's floor removed | a documented limit | (c2.3) the floor |
| h6 | the suitability's hold at ±1 removed | a documented limit | (c2.3) the hold |
| h7 | the scene's circumstances not read (`CIRCUMSTANCE_AFFINITY` skipped) | the circumstance effect on stage | (c2.1) |
| h8 | every ability read at the performer's strongest (a strength covering every weakness) | R6 | (c4.2), (c4.3) |
| h9 | vocal read on every taped brief's believability, outside the context the map reads | a hidden dependency | (c4.1) |
| h10 | listening not read by the judge | an ability's contribution | (c4.1), (c4.3) |
| h11 | restraint's draws removed | restraint's ability contributions | (e2.3), (e2.4) |
| h12 | expansive's draws removed | size's ability contributions | (e3′) |
| h13 | emotional depth, composure and focus read at 50 whatever their level | restraint's abilities not read | (e2.3) |
| h14 | restrained suitability forced to its least | the scene's grain for restraint | (e1), (c2.2) |

**Why every one and not a share:** each removes something the owner's section 3 says a test must detect, or a limit the
clarification excuses by, so one surviving is a test missing.

### Thresholds

- **1e-9 at full precision** for a property with no draw ("never the wrong way", "strictly", "the same", "moves", "costs"):
  brief 10's rule, five orders over the floating-point noise measured on these judgments (3e-14). R6's "must not erase" is
  read as a weakness costing anything at all, so (c4.3) and (e4) ask 1e-9, not a visible size.
- **More than 0.05** for a difference a player can see on the result ((e1)'s opportunities, (e2.3)'s margin): half a shown
  tenth, the house's measure since phase 2b.
- **The hundredth** in (c2.2) and (c2.3) is the engine's own (`grainOf`), not a figure set here.
- **No share of an effect decides anything.** "Unrelated" is the map's none. H4-R's tenth and 1/12 appear only in the trace
  and the record.
- **(e1)'s floors** are the owner's from brief 10. **Room** is definitional: fewer opportunities than suitable pieces.

### What Closes Each Clause

**ST6-R2.c** closes (Implemented And Verified) where (c1), (c2′), (c3) and (c4′) all hold on the gate's tests by title on the
tested commit and on the measurement (every reading, the fresh profiles run once), and h1 to h10 and h14 are each caught.
**ST6-R2.e** closes where (e1), (e2′), (e3′) and (e4) all hold the same way and h11 to h14 are each caught. Otherwise a clause
stays Decision Required with its figures, or takes a gap, and nothing here is moved to make it pass.

## What Isn't Changed

No change to what the game judges is expected. The trace found no wrong direction and no disconnected mechanic: the ten are
the engine's precision and the 65 the equal budget's arithmetic. The one change to `src` is a comment: `grainOf`'s
hundredth documented. If the work finds a real defect, it's fixed as a defect, with its test, and `RULESET` and
`docs/ENGINE-MODEL.md` move for it; never a bonus, a material set or a criterion moved after a run. Brief 12's tests stay as
they are, their comments that said a part was the owner's moved to the past tense. ST6-R (a), (c), (e) and (g) stay
superseded. Decision 4's rows are untouched.
