# Brief 12, Advice: F2-A10 (f) And (h) As The Owner Resolved Them (2026-10-17)

Written and committed before any test or code it governs changes (`prompts/common.md`, What Closing A Row Means, 1), and
before any fresh validation case exists. Rows: `advice.F2A10-f` and `advice.F2A10-h`
(`../completion-2026-10-16/baseline.json`), both Decision Required at the frozen baseline.

A clause here is written from the owner's words. None is chosen because it passes: every tolerance and floor below is one
F2-A10 already set (`../decisions-2026-10-16/criteria.md`, section 2), an exactness limit of floating point, or the
advice's own floor, and each says what would fail it.

## The Owner's Resolution (Brief 12, Section 2)

> I approve advice that accurately reflects the actual progression model.
>
> A predicted benefit does not have to fall after every training period if discipline, preparation, or another relevant
> factor legitimately increases it. A recommendation may remain the same when its cause remains unresolved.
>
> For F2-A10 (f):
>
> - Separate ability-training benefits from preparation benefits.
> - State what preparation and genre knowledge the forecast assumes.
> - Compare forecasts with actual training results under the same assumptions and budget.
> - Never present an unprepared take as fully prepared without explaining that counterfactual.
> - Show the player whether preparation, ability development, or both deserve attention.
>
> For F2-A10 (h):
>
> - Require the recommendation and its forecast to update correctly after training.
> - Permit an unchanged recommendation when it remains the best justified option.
> - Permit a benefit increase when the engine can attribute it to a legitimate changed input.
> - Require an explanation of that increase.
> - Detect stale recommendations and unexplained forecast changes.
> - Do not rotate to inferior advice merely for variety.
>
> Preserve the original results. Write the clarified criteria before final validation.
>
> Because previous held-out cases have now informed these clarifications, use additional fresh validation cases. Keep the
> earlier set as regression coverage rather than describing it as unseen validation.
>
> Test players who follow advice, ignore it, partially follow it, change their work, and reach mastery.

## What Was Written Before, And What Came Of It (Kept)

Each stays in the record with its results. Brief 12 supersedes the two readings below with the clauses that follow; it
doesn't pass them retroactively.

**(f) as written** (`../decisions-2026-10-16/criteria.md`): "Near mastery, a predicted gain falls as the input's level
rises (diminishing returns), on every case; where a take's preparation, not an ability, held it back, the advice's figures
read the take as prepared."
- Brief 10: the first-named input's ladder fell on 30 of 30 near-mastery held-out cases, by a median 0.0010 points; every
  candidate 277 of 287 (276 on the integrated code). A step of a take's own preparation held a held-out case back in 0
  of 0.
- Brief 11's held-out run (`3de26e0b`, the same on `81eadac9`; `../completion-2026-10-16/advice/held-out-summary.json`):
  the ladder fell on 30 of 30 near mastery; every candidate 276 of 287.

**(f) as clarified in brief 11** (`../completion-2026-10-16/clarifications.md`): preparation apart from training; like
for like on twenty sessions; diminishing returns asserted below three quarters of full and the model's constant rate held
past it. On the held-out set: preparation apart 120 of 120; the forecast fell with the level below three quarters on 110
of 111 (adv-h-1's vocal, at 32, read 0.828, 0.899 and 0.764): **not met**, and put to the owner.

**(h) as written:** "After the player follows it (20 sessions of the advised exercise, through the commands), the advice
is read again: the trained input's predicted gain falls on every case, and the first-named changes wherever another
input's gain now leads."
- Brief 10: fell on 141 of 150 held-out cases (111 of 120 fresh, 113 of 120 on the integrated code), the nine that
  didn't all near mastery and within a thousandth; changed where another led 62 of 62 (51 of 51 integrated).
- Brief 11's held-out run: fell 113 of 120; changed where another led 51 of 51.

**(h) as clarified in brief 11:** the trained input's forecast at the discipline it had when advised falls on every case;
a rise is no more than discipline's lift and is said. On the held-out set: 116 of 120 (adv-h-1, adv-h-22, adv-h-102,
adv-h-111 didn't): **not met**. Fell, or rose within discipline's lift and said: 120 of 120, a reading seen only after the
run and so put to the owner, not adopted.

## Words Used Below

- **A read of the advice:** `adviceFor(sim, person)` on a save, the list the Player Profile's What To Work On Next and a
  brief's What To Work On draw.
- **The forecast:** `trainingForecast`, each input's twenty sessions of its own exercise grown through the engine
  (`trained`, `develop`) and the recent pieces worked out again by the judge (`replayAs`), weighted to the latest. Its
  figure, at full precision, is `Forecast.exact`, the input's own share (`own`) and the days' discipline (`days`).
- **The floor:** a tenth of a point, the least a result shows: what a training recommendation's own share must reach
  (`ADVICE_FLOOR`, `systems/experience.ts`).
- **As taped:** a piece read with its preparation as its record keeps it. **As prepared:** each part of its own
  preparation (the breakdown, the lines, the rehearsal, the way of playing rehearsed in) complete. **Its genre as known
  today:** its genre part read from what the player knows of its genres now (`genreNow`).
- **A note:** what the advice keeps of a recommendation as it was given (`Experience.advised`): when it was first given
  (`first`) and at the latest note after new work (`last`), each with the input's level, its forecast and discipline.

## The Clarified (f)

### F1. Training's benefit apart from preparation's

*Owner:* "Separate ability-training benefits from preparation benefits."

- Every input's forecast is its own share and the days' discipline, and nothing else (`exact` = `own` + `days`, within
  1e-12), on the same twenty sessions for every input (`hours` = 20).
- Preparation's figure (`Forecast.preparation`) is what completing their own preparation would bring the pieces read as
  prepared, as the player is now: it equals the judge's replay of each such piece as prepared less as taped, weighted to
  the latest, worked independently by the measure, within 1e-9. It's the same for every input and never in training's.
- **Fails:** preparation's gain added into training's figure; a budget other than twenty sessions for any input; a
  preparation figure the judge's replay doesn't give.
- **Fresh set:** 120 of 120 cases, on each case as built and on its cold take (F4).

### F2. What the forecast assumes, said

*Owner:* "State what preparation and genre knowledge the forecast assumes."

- The first training recommendation says, once, what every input's forecast assumes of the pieces it read:
  - of their own preparation: how many were taped with it complete, how many short and read as taped, and, by name,
    which are read as prepared;
  - of knowing their genres: that each is read as known today, how many are short of complete as known today, and how
    many are known better today than when they were taped.
- Each count and name equals the records counted independently by the measure: each piece's own parts against what
  completes them (`inputs.prep` against `inputs.required`), what held it back most (`limits[0]`), and its genre known now
  (`genreKnown`) against at the take (`inputs.prep.genre`).
- **Fails:** no statement; a count or a name the records don't give.
- **Fresh set:** 120 of 120, as built and with the cold take.

### F3. The forecast against what training brought, like for like

*Owner:* "Compare forecasts with actual training results under the same assumptions and budget."

- For the first-named input, a copy of the save plays its twenty sessions, one a day, through `practice.exercise`; a
  baseline copy lives the same days without them (the same budget). What training brought is read **under the forecast's
  own assumptions**: the same recent pieces, the same weights, each piece's preparation and genre as the forecast read
  them, worked out by the judge for the trained copy's abilities less the baseline copy's.
- The forecast is within F2-A10 (e)'s tolerance of it, 0.3 points or a quarter of what was brought, on at least
  **80%** of the fresh F2-A10 cases ((e)'s floor) and at least **70% of each band and of each stage** ((b)'s floor for a
  stratum, so no kind of player is misled).
- (e) as written, read on each brief as its record now stands (`worthOf`), is reported beside it, not in its place.
- **Fails:** a forecast whose growth or judging isn't the engine's; a comparison on other pieces, other preparation or
  another budget than the forecast's.

### F4. No unprepared take shown as prepared without its counterfactual

*Owner:* "Never present an unprepared take as fully prepared without explaining that counterfactual."

- Where the forecast reads a piece as prepared (a part of its own preparation held it back most), the advice:
  - names the piece;
  - says it was taped with its own preparation short, each part short and how far of complete;
  - says the forecast reads it as if that preparation were complete;
  - says what the first-named's figure would be with the piece read as taped (the counterfactual's own effect), within
    1e-9 of the forecast the measure works with that piece read as taped;
  - says what completing that preparation would bring (F1's figure).
- No other piece is read better prepared than its record: every input's forecast equals, within 1e-9, the forecast of
  exactly that reading as the measure builds it (every piece as taped, its genre as known today, and only the pieces named
  as prepared). A genre read better known than at the take is said (F2).
- **Fails:** a piece read as prepared and not named, or named without its parts, the as-taped figure or preparation's
  figure; a piece short of its own preparation read as complete without being named.
- **Measured** on each case as built and on its **cold take**: a copy in which one more brief, drawn from the case's seed
  among the camera briefs it hasn't taped, is chosen and taped with no preparation through `brief.choose` and
  `practice.self_tape`. The cold take is what makes the clause bite on every band: brief 10 and brief 11 found 0 held-out
  cases a take's own preparation held back, so the case as built alone would test it on almost nothing.
- **Fresh set:** 120 of 120, as built and with the cold take; the cases with a piece read as prepared are counted.

### F5. Whether preparation, ability development, or both deserve attention

*Owner:* "Show the player whether preparation, ability development, or both deserve attention."

- The advice says which deserves attention now, from two figures in the same units, points a piece on the recent work as
  the player is now, weighted to the latest:
  - **preparation's:** every recent piece with its own preparation complete, then its genre known in full, against each
    as taped with its genre as known today; its own preparation's part and knowing the genres' part said apart;
  - **training's:** the first-named input's forecast.
- Each deserves attention at the floor, a tenth of a point, or more; **both** where both do, the larger said first;
  **neither** where neither does.
- Said with the first recommendation, on the Player Profile and in a brief's pane.
- The measure works both figures independently with the judge's replay, and the verdict it gives them is the advice's.
- **Fails:** no verdict; a verdict its figures don't give; a figure the judge's replay doesn't give.
- **Fresh set:** 120 of 120, as built and with the cold take.

### F6. Diminishing returns as the progression model gives them

*Owner:* "advice that accurately reflects the actual progression model."

(f) as written asked that near mastery a predicted gain fall as the level rises, and brief 11 asked it below three
quarters of full. Neither is what the model makes. From three quarters of full deliberate practice grows at a constant
rate (`DEVELOPMENT.floor`, `abilityGain` in `systems/attributes.ts`), so near mastery the forecast fell by a median
thousandth, the judge's reading of the same growth. And what a point of ability is worth on the work is the judge's
curve, not monotone in the level everywhere (brief 11's adv-h-1, below three quarters). So diminishing returns are read in
the growth the model gives, and the forecast's points are held to play by F3.

- On the first-named input's ladder (its level, a third and two thirds of the way to full, everything else as it is), the
  growth twenty sessions bring in the forecast (`trained`) never rises as the level rises (within 1e-12), and falls where
  the lower rung is below three quarters of full, where the model's rate falls.
- Played on tuning seeds (brief 11's test, kept): below three quarters of full, twenty sessions through
  `practice.exercise` bring less at each rung, as the forecast's growth does; past it, where the model's rate is
  constant, they grow each rung by the forecast's growth times one ratio, the played day's focus over the forecast's
  ordinary one, the same at every rung within 1e-9.
- **Fails:** a forecast growth that rises with the level, or one that doesn't fall where the model's rate falls; a growth
  rule that isn't the engine's (past three quarters, the played ratio moving from rung to rung).
- **Fresh set:** 120 of 120; the ladder in points (as written) reported beside it.

## The Clarified (h)

### What Stale And Unexplained Mean

**A stale read.** A read of the advice is stale where any of these holds against a fresh forecast of the same save opened
anew (`loadSave(deserialise(serialise(…)))`):
- **S1:** its first training recommendation isn't the largest forecast, at full precision, of the inputs whose own share
  passes the floor (by more than 1e-12);
- **S2:** a training recommendation's figure differs from the fresh forecast's by more than 1e-12, or it names an input
  the fresh forecast leaves out (at full, under the floor, or with no exercise);
- **S3:** its standing gives the first-named's level or forecast now as anything but the current one at the precision it
  says.

A recommendation kept after its cause resolved (the input at full, or its forecast under the floor) is S2. Detected by the
measure (`staleOf`, `tools/advice-harness.ts`) on every read it makes.

**A forecast change, and its attribution.** An input's forecast at a read, against the forecast its note kept (when it was
first given, and at the latest note after new work). The engine works the change out in parts, changing one input of the
forecast at a time from the noted state to the present, in this order:
1. the work read (the pieces done since);
2. knowing their genres;
3. the other abilities and techniques (stamina's full, which age sets, with them);
4. the input's own level;
5. discipline (the last, so its part is brief 11's: the forecast now less the forecast now at the discipline it had).

So that it can, a note keeps the state it was made in: each ability and technique, stamina's full, how well each genre is
known, and the latest piece. The parts sum to the change but for the **residual**: the forecast the note kept, less the
forecast worked again now from the state it kept. A part whose input didn't change is exactly 0.

**An unexplained change.** A change whose residual is 1e-9 or more; a rise whose parts can't be worked out (a note with
no state, or the work read then no longer kept); or a rise (more than 1e-12) whose standing doesn't say its parts. The
measure counts them on every read. The player is told where a residual shows at four places: "… the advice can't trace
to anything it reads".

### H1. It updates correctly after training

*Owner:* "Require the recommendation and its forecast to update correctly after training."

- After twenty sessions of the advised exercise through `practice.exercise`, the advice read again:
  - isn't stale (S1 to S3);
  - has moved the trained input's forecast (by more than 1e-12), unless the input is at full and drops out;
  - attributes the move (residual under 1e-9) to what the sessions changed: the input's own level and discipline, and the
    other inputs only where the sessions or the days moved them (an exercise's carry to another input, fitness from an
    hour on the feet, stamina's full with age); the work's and the genres' parts exactly 0, since no work was done.
- Across a save and a load the advice is the same.
- **Fails:** a forecast or a recommendation carried over from before the sessions; a move the parts don't account for.
- **Fresh set:** 120 of 120.

### H2. Unchanged where it's still the best

*Owner:* "Permit an unchanged recommendation when it remains the best justified option."

- Where the first-named is the same input after the sessions, it's the largest forecast of what passes the floor (S1).
  Where another input's forecast now leads, another is named first (the original (h)'s second half, kept).
- **Fails:** the same input named first behind another's larger forecast; another's lead not followed.
- **Fresh set:** every case where it stayed first is the largest; changed wherever another led, every case.

### H3. A rise, permitted where the engine attributes it

*Owner:* "Permit a benefit increase when the engine can attribute it to a legitimate changed input." And: "A predicted
benefit does not have to fall after every training period if discipline, preparation, or another relevant factor
legitimately increases it."

- The trained input's forecast may rise after the sessions. Where it does, the residual is under 1e-9, and every part that
  isn't 0 is an input the player's state changed: the five parts above, each read from the save.
- **Fails:** a rise with a residual; a rise in a part whose input didn't change.
- **Fresh set:** every rise attributed, every case.

### H4. A rise explained

*Owner:* "Require an explanation of that increase."

- Where the forecast rose since a note, the standing says what moved it: each part that shows at four places, by name
  and figure; discipline's part with discipline then and now and each hour's lift, as brief 11 said it; and a residual,
  where one shows, as untraced.
- Every change since a note that keeps its state, a fall as much as a rise, is said the same way.
- **Fails:** a rise said with no parts, or with parts that aren't the attribution's.
- **Fresh set:** every rise explained, every case.

### H5. Stale and unexplained, detected

*Owner:* "Detect stale recommendations and unexplained forecast changes."

- On every read the measure makes, on the fresh set: stale reads 0, unexplained changes 0. The reads are each case as
  built, the case after its cold take, and after twenty days:
  - the player who **followed** it (twenty sessions of the first-named's exercise);
  - the player who **ignored** it (the baseline copy, who lived the same days without them);
  - each player who **trained another input** instead (each other candidate's twenty sessions).
- The detectors catch both when made to happen, held by gate tests:
  - a read made before the sessions, shown after them, is stale;
  - a note's forecast moved by hand (TEST SETUP) leaves a residual the advice says and the measure counts.
- **Fails:** a stale read or an unexplained change on the fresh set; a detector that doesn't fire when made to.

### H6. No rotation to inferior advice

*Owner:* "Do not rotate to inferior advice merely for variety."

- In every read, the first-named is the largest forecast of what passes the floor (S1), so the advice never moves to an
  input that brings less.
- The player who ignores it keeps the same first-named for as long as it brings the most, and what they're told changes
  with their state (L1 as clarified in brief 11, kept).
- **Fails:** a first-named input with a smaller forecast than another's that passes the floor.
- **Fresh set:** no stale read (S1), every read.

**Kept, reported beside, not judged:** (h) as written (the trained input's forecast fell), brief 11's own part
(`ownFell`) and its lift (`withinLift`), on every case.

## The Players The Owner Names

Each is played in the gate on tuning seeds, through `sim.execute({ kind, payload })`, across a save and a load
(`loadSave(deserialise(serialise(…)))`), with what the recommendation and its forecast do and what the player is told
asserted, and the screen drawn where the words are the point:
- **Follows it:** twenty sessions of the advised exercise. Near mastery (adv-t-19) the forecast rose: H1, H3 and H4,
  its parts the input's own level and discipline. Below it (adv-0), another now leads and is named first: H2.
- **Ignores it:** five weeks of taping and no practice (adv-t-5, brief 11's journey). The same first-named while it brings
  most (H6); each week not stale. The work's and the genres' parts are said where the forecast moved since it was first
  given. Brief 11 left that move said with nothing to explain it (adv-t-5 as built, on `20b6d777`): composure still at
  42, its forecast from 1.00 to 1.28.
- **Partially follows it:**
  - some of the sessions, seven of the twenty: the level moves less, its parts the input's own level and discipline;
  - another input's exercise for the twenty: the first-named's own part 0 where the exercise carries nothing to it, its
    change the other inputs' and discipline's, said.
- **Changes their work:** briefs of another kind (the microphone's, voice) taped in genres not met before. The work's and
  the genres' parts are said; not stale; the first-named follows the forecast.
- **Reaches mastery:** the first-named brought to full through `practice.exercise` (its level set near full first, TEST
  SETUP). It drops out, the next input by forecast is named, and the standing says the earlier one has nothing left to
  forecast. With everything training reaches at full, the advice says so, and the verdict (F5) doesn't ask for training.

## Fresh Validation Cases

- **The set:** `adv-v-0` to `adv-v-119`, a prefix never run before (checked on `20b6d777`: no tool, test or run named it;
  only this brief's instructions, as the prefix to use). It's stratified as the held-out set is: case n is in band
  `BAND_ORDER[floor(n / 30)]` and stage `STAGE_ORDER[floor((n mod 30) / 10)]`, four bands by three stages by ten seeds,
  each built by `buildCase` exactly as a held-out case is.
- **Refused** by the measure without `--fresh`; a gate test holds the refusal and the split from the tuning and held-out
  seeds. No test or probe builds a fresh case. The coordinator runs the set once, on the tested commit, and the run
  records its commit and whether the tree was clean.
- **Brief 11's held-out set** (F2-A's `adv-10` to `adv-39`, F2-A10's `adv-h-0` to `adv-h-119`) informed these
  clarifications, so from this brief it's **regression coverage**, not unseen validation:
  - it still runs only with `--held-out`;
  - the summary reports it as `regression`;
  - its earlier figures stay as they were reported.
- **The summary** reports every clause above for the fresh set as a whole and for each band and each stage.

## What Closes Each Row

- **`advice.F2A10-f`:**
  - F1 to F6 held in the gate on tuning seeds, through the commands and the drawn screens;
  - the fresh run on the tested commit showing F1, F2, F4, F5 and F6 on 120 of 120;
  - F3 within its tolerance on at least 96 of 120, and on at least 21 of 30 in each band and 28 of 40 in each stage.
- **`advice.F2A10-h`:**
  - H1 to H6 held in the gate on tuning seeds, and the detectors shown to fire;
  - the fresh run showing H1 on 120 of 120;
  - H2: every case where the first-named stayed is the largest, and it changed wherever another led;
  - H3 and H4: every rise attributed and explained;
  - H5 and H6: stale reads 0 and unexplained changes 0, over every read.
- A row whose fresh figures fall short of these stays open, with the figure. (f) and (h) as written and as brief 11
  clarified them aren't passed by this: they're superseded with the owner's authorization, their results kept above.
