# The Formulas As They Stand, Before Any Tuning

Phase 1 of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay".
Every formula below is read from the code at `6808cfc7` (ruleset `evaluation-3 (2026-10-12)`, `content/tasks.ts:27`),
with its file and line. None of the attribute or genre files differed from `HEAD` when this was read; the working tree's
only changes were other agents' banking files. Nothing here was changed. Sizes are SLATE's unless a line says otherwise.

Units: abilities and techniques are levels from 0 to 100; preparation parts are shares from 0 to 1; readiness runs from
5 to 100; quality, dimensions and the whole are points from 0 to 100, rounded to a tenth (`r1`, `evaluation.ts:219`).

## 1. Personal Work Quality

One evaluation for every judged piece: `judge` (`systems/evaluation.ts:316-399`), wrapped by `judgePiece`
(`systems/piece.ts:252-342`) for anything judged in segments.

### A dimension

For each dimension *d* of the task's profile (`content/tasks.ts:76-214`):

| Term | Formula | Where |
|---|---|---|
| Inputs | the profile's abilities and one technique term, plus what the material, the choice, the reading and the reader add (`specWith`, an ability once at its summed weight) | `evaluation.ts:287-295` |
| An ability's term | `n = clamp(level / full, 0, 1)`; full is 100, and for stamina `ceilingAt(age).fitness` | `evaluation.ts:263`; `attributes.ts:155-158` |
| The technique term | the input's weight shared among the work's techniques by their read weights; `n = clamp(level / 90, 0, 1)` | `evaluation.ts:264-267`; `MASTERED`, `abilities.ts:160` |
| Which techniques | only the seventeen `TECHNIQUES`; reads naming emotion, voice, movement or memorization are dropped | `evaluation.ts:326`; `abilities.ts:148-151` |
| Capacity | `c = Σ wᵢ·nᵢ / Σ wᵢ` (1 with no terms) | `evaluation.ts:275-276` |
| Shaped | `s = c^(1 + difficulty)` | `evaluation.ts:277` |
| Prepared | for each part the dimension reads and the context has: `0.35 + 0.65·min(1, part / required)`; the least of them; 1 with none | `evaluation.ts:339-343`; `prepFloor`, `tasks.ts:234` |
| Condition | product of: fatigue `0.6 + 0.4·clamp(readiness/60, 0, 1)` when readiness < 60 and the dimension names fatigue; flu 0.85 where it names illness; injury 0.6 where it names injury, else a concussion 0.6 on every dimension; a piece's stamina drain; a slip's shake on believability and consistency | `evaluation.ts:344-356`; `tasks.ts:232-238` |
| Fit | `MISFIT = 0.85` on each dimension a misfitting choice leans on (lean ≥ 1, said before the choice), else 1 | `material.ts:127-136`; `approaches.ts:54` |
| Spread | `1 + 0.5·(1 − clamp(readiness/60))` under readiness 60, on negative draws only | `evaluation.ts:358, 282` |
| Draw | `δ ∈ [−1, 1)` from an FNV hash of `seed:key:dimension`; 0 when `expected` | `evaluation.ts:222-226, 337` |
| Variation | `0` if `s ≥ 1`, else `10 · spread(δ<0) · (1 − s) · prepared · condition · fit · δ` | `evaluation.ts:282`; `variation`, `tasks.ts:240` |
| Quality | `clamp(100 · s · prepared · condition · fit + variation, 0, 100)`, rounded to 0.1 | `evaluation.ts:283, 385` |

### The whole

- **Weights.** The task's dimension weights times the lean (material, choice, reading, reader, tones; or with no lean
  the mean of the genre families' leans), renormalized to the task's own total (`leanedWeights`, `evaluation.ts:232-253`).
- **Whole.** `0.75 · (weighted mean of dimensions) + 0.25 · (weakest dimension)` (`wholeOf`, `evaluation.ts:402-408`;
  `meanShare`, `tasks.ts:244`).
- **A piece in segments** (`piece.ts:252-342`). Each segment is judged by `judge` with:
  - its tones' lean, each tone to the power `1/(tones in the beat)` (`segmentLean`, `piece.ts:199-208`; `TONE_LEAN`,
    `content/piece.ts:34-39`);
  - its own rehearsal `1 − (1 − piece part)·(1 − segment work)` (`piece.ts:229`), against a required raised by a turn
    into it or a blend (brief `+0.15`, `+0.08`, at most 0.85; scene `+0.05`, at most 0.95; `piece.ts:222-226`;
    `content/piece.ts:49-51`);
  - stamina taken out of every input (`withoutStamina`, `noStamina`, `piece.ts:181-190`).

  The whole is the segments' overalls, weighted by length (`piece.ts:321`). A reading's heart beat weighs 1.6
  (`BRIEF.readingHeart`, `briefs.ts:139, 273`).
- **What is a piece:**
  - every brief (`briefPiece`, `briefs.ts:270-277`);
  - every night and casting read (`playPiece`, `school.ts:2243-2247`; `castFit`, `school.ts:2506-2513`);
  - a class scene only if its profile has two tones or more and the task is performed. `scenePiece` returns none
    otherwise (`coursework.ts:698-706`), and such a scene is judged once by `judge`, with stamina as an input.
- **Bands.** Unready under 50, Working 50, Strong 65, Exceptional 80 (`bandOfQuality`, `evaluation.ts:558-561`;
  `tasks.ts:249`).

### What material and choices add (`materialContext`, `systems/material.ts:87-138`)

| Source | Lean (×, normalized) | Inputs added | Where |
|---|---|---|---|
| Feature level L (timing, physical, partner, vocal, improvisation) | `1 + per·L`: timing resp 0.2, exec 0.16; physical exec 0.25; partner conn 0.2, resp 0.1; vocal exec 0.25; improv resp 0.2 | ×L: timing listening→resp 1, focus→exec 1; physical physical→exec 1.8, stamina→cons 0.8; partner listening→conn 1; vocal vocal→exec 2, stamina→cons 0.6; improv adaptability→resp 1.2 | `approaches.ts:80-86` |
| Each transition | believability, consistency `1 + 0.05` | adaptability→bel 0.3, composure→cons 0.2 | `approaches.ts:89` |
| Each blend | believability, interpretation `1 + 0.05` | emotionalDepth→bel 0.3, imagination→interp 0.2 | `approaches.ts:97` |
| Heightened / verse | interp ×1.15 / ×1.25 | imagination 0.5 / 0.8; verse vocal→exec 0.4 | `approaches.ts:100-103` |
| Camera / microphone | believability ×1.2 / execution ×1.2 | — | `approaches.ts:106, 109` |
| A way of playing (each side) | 1.05 to 1.25 on its dimensions; a lean ≥ 1.1 adds prep part `approach`, complete at 0.9 | one or two abilities (focus, adaptability + stamina, emotionalDepth, presence + vocal + physical, discipline + memory, listening) | `approaches.ts:44-51, 57` |
| A brief's reading | each lean squared (`readingLean` 2) | draws ×2 (`readingDraw`) | `briefs.ts:131, 316-324` |
| A brief's reader | pressing resp ×1.15; withholding conn ×1.15; unpredictable resp ×1.1, cons ×1.05 | adaptability 0.5; listening 0.5; adaptability 0.5 + composure 0.3 | `briefs.ts:148-153, 326-334` |
| A brief's techniques | — | the medium's own (camera `screen 2, scene 1`; voice `voiceover 2, scene 1`), each staged technique at `2·level`, the larger kept | `briefs.ts:107-109, 231-235` |
| Difficulty | brief −0.2, a callback +0.3, ±0.05 a stakes step from 1; coursework `(par − 62)/40` in [−0.5, 1]; a night 0 to 0.1 at the School and 0.15 to 0.3 at the Rep; casting 0 | — | `briefs.ts:103-105, 338`; `coursework.ts:827`; `school.ts:2221-2224` |

## 2. Preparation And Readiness

| Part | Moves by | Complete at | Where |
|---|---|---|---|
| Coursework step | `+gain · clamp(dayFocus, 0.5, 1.1) · trait(prepLean) · max(genreSpeed, featureSpeed) · (1 − part)`; gains 0.28 to 0.55 by activity | 0.9 | `coursework.ts:579-611`; `tasks.ts:255` |
| The partner part | only a rehearsal kept with the partner: `+0.4 · clamp(dayFocus, 0.5, 1.1) · (1 − part)`. The partner comes if a draw falls under their reliability, and declines when busy or below trust "wary"; the step alone is refused | 0.9 | `coursework.ts:1205-1290, 480` |
| Brief step | `+gain · clamp(dayFocus, 0.5, 1.1) · 0.5^(repeats today) · trait · featureSpeed · (1 − part)`; gains: Break It Down 0.6 (30 min), Lines 0.6 (30, 50 or 70 min), Rehearse 0.5 (45 min, needs lines ≥ 0.3) | interpretation 0.8, lines 0.8, rehearsal 0.5 a beat, +0.15 a turn, +0.08 a blend, at most 0.85 | `briefs.ts:80-94, 414-437` |
| A way of playing | rehearsed by on-feet work at `0.9 · gain`; a change keeps half | 0.9 | `material.ts:142-155`; `approaches.ts:57` |
| A night's lines, blocking, notes | the part's own process | what every call makes (`completeFor`), never under `NIGHT_LEAST` | `school.ts:2250-2255`; `production.ts` |
| Day's focus | `clamp((readiness/80) · hourFit, 0.3, 1.2)`. The day's state, not the Focus ability | — | `school.ts:910-929` |
| Readiness | `clamp(100 · Π(dial factors) / 1.35, 5, 100)`: energy, stress, sleep debt, nourishment, morale, hygiene and condition dials, × the hour's fit at a piece | sufficient at 60 | `life.ts:283-300`; `conditionAt`, `school.ts:936-944` |

What preparation does to quality: below complete a part multiplies a dimension's quality by as little as 0.35. It also
scales the draw by the same factor. Past complete it adds nothing (`tests/engine-properties.test.ts:140`).

No ability changes how fast any part moves. The steps read the day's focus, a personality trait, and genre and feature
familiarity (`coursework.ts:592-593`, `briefs.ts:423-424`, `production.ts:527`).

## 3. Genre Proficiency Growth

| Quantity | Formula | Where |
|---|---|---|
| Familiarity, `genre.study` (90 minutes, 2 energy) | `+100 · 0.08 · 0.5^(repeats today) · (1 − fam/100)` | `engagement.ts:69-78`; `content/engagement.ts:20-24` |
| Practice, work in it | `+100 · 0.1 · (amount / genres of the work) · (1 − practice/100)`; a take's amount is `worth · 0.5^(same brief today)`, worth 0.5 for a take that's the same again; a night's amount 1 | `engagement.ts:81-93`; `briefs.ts:553-558`; `school.ts:3269` |
| Known (a taped brief) | `max over the brief's genres of max(fam, practice)/100`, a prep part of interpretation, complete at **0.3** | `briefs.ts:287, 335`; `BRIEF.complete.genre`, `briefs.ts:94`; `tasks.ts:169` |
| Speed (class scene, a part's lines) | `1 + (1/6) · max over the work's genres of max(fam, practice)/100`, the larger of it and feature speed | `engagement.ts:101-105`; `coursework.ts:592`; `production.ts:527` |
| Families | read only for a night or a casting read of a play with no material profile (`familyLean`, `tasks.ts:261-284`) | `school.ts:2265, 2512`; `piece.ts:192-196, 261` |
| Applied demands | read by no evaluation; they act only because the briefs listed under a genre stage those techniques (`tests/briefs-content.test.ts`) | `content/demands.ts:15-36` |

**Measured** (baseline §5, §6):

- Studying alone reaches 30 in 5 sessions (7.5 hours), and taping alone in 4 takes.
- Past 0.3 a genre known adds nothing to a take.
- Past 30 its only reader is the speed of class scenes and parts, at most a sixth faster at 100.

## 4. Attribute Growth

| Path | Formula (points a session) | Who uses it | Where |
|---|---|---|---|
| `develop`, ordinary | `0.42 · w · f · max(0, 1 − L/reach)^1.5 · lift · 0.5^n` | coursework, brief and part steps, calls, kin abilities in class, nights (listening), notes, the workbook, plays read | `attributes.ts:201-207, 275-292`; `ordinary`, `school.ts:972-974` |
| `develop`, deliberate | `max(ordinary, 0.42 · w · f · max(0.25, 1 − L/100))`, 0 at 100 | `practice.exercise`, its transfers (variation 0.3, live 0.15), discipline's day | `attributes.ts:205`; `practice.ts:117-155` |
| `grow` | `0.42 · w · f · max(0, 1 − L/ceiling)^1.5`, **no** halving, **no** discipline lift | class skills, nights (`playNight`: scene 2, emotion 1, voice 1, the play's reads 4 shared), rehearsal calls (scene 1.5, character 1.5, script 1, memorization 1), coursework training (3 an assignment, 0.25) | `school.ts:905-907, 991-994, 2154-2168`; `coursework.ts:602-605` |
| `nudge` | `+amount · (100 − L)` | composure +0.005 and presence +0.0015 before each house; presence +0.02 on a remarkable night | `attributes.ts:166-172, 305-312`; `school.ts:582, 3287` |
| Workout | `0.6 · remap(readiness, 0..100, 0.4..1.2) · (1.1 a run in fine weather) · 0.5^n` | stamina | `life.ts:649, 685` |

Terms:

- `w` is the weight: the tier factor (1 matched; 0.75 below; 0.8 above, which costs 3 more energy; 0.5 two away) times
  the focus factor (precision 1.15 rested at a day's focus ≥ 0.85, else 0.85; spaced 1.1 within 1 to 7 days, else
  0.9; variation 0.85; live 0.85).
- `f` is the day's focus.
- `lift = 1 + 0.1·(discipline − 50)/50`, except for discipline itself.
- `n` is today's earlier sessions of the same source on the same target.
- `reach` is the craft ceiling (admission plus 26, at most 100), the kin's mean, or 100.

Sources: `content/practice.ts:134-187`, `practice.ts:74-98`, `attributes.ts:280-281`, `school.ts:876-907, 950-960`.

**Caps:**

- 4 practice hours a day, refused after (`practice.ts:61`);
- 3 coursework training steps an assignment;
- 3 trained hours of a part's lines;
- full is set exactly on arrival (`attributes.ts:284`).

**Decay:** stamina only. It holds 3 days after a workout, then falls 0.18 a day to 35 (`life.ts:84, 103, 974-990`).

**Measured** (baseline §6), deliberate practice, matched tier, steady focus, day's focus 1, discipline 50:

- an hour gives 0.29 at level 30, 0.21 at 50, 0.13 at 70, and 0.105 from 75 to 99, the floor;
- 50 → 100 takes 406 hours;
- ordinary work toward a reach of 76 takes 154 hours from 30 to 50, 669 from 50 to 70, and 1,866 from 70 to 75.

## 5. The Evaluation's Feedback

| What | How it's made | Where |
|---|---|---|
| A limit | each input below full, each part short, each condition, a misfit, difficulty > 0: the dimension again with that one made whole, less the dimension (`by`); and the whole again with that dimension raised by `by`, less the whole (`whole`) | `evaluation.ts:361-393` |
| Ranked | by `whole`, then `by`; a piece's limits merged across segments, weighted by length | `evaluation.ts:392, 396`; `piece.ts:302-313` |
| Kept | the top three on the work record; counted for life once per input (`limitsOnce`) | `evaluation.ts:481-517, 545` |
| Chief limit | the first limit, in words | `chiefLimit`, `evaluation.ts:564-573` |
| What to work on | each ability and technique limit over the latest 12 pieces, weighted to the latest, scaled by the room left now, at least 0.5 points; the exercise, matched tier, spaced if 1 to 7 days since, else steady; preparation, condition and fit said apart; a recurring weakness put first when within 0.5 | `recommendations`, `experience.ts:149-210` |
| Brief suggestions | a callback; the untaped brief leaning most on the weakness (share ≥ 1%); untried material; a habit; the least-known genre; an untried reading | `suggestions`, `briefs.ts:644-696` |
| A coursework note | the template's weakest raw craft skill when it's under 0.45, else a part or a choice. Not the evaluation's limit | `coursework.ts:775-777, 978-989` |

A limit's cost is what making that input whole would give. It is not what a realistic step gives. Measured (baseline
§8): +20 on the input named first gave 2.43 on average, and the mean read ability gave 1.12. In 364 of 447 cases
(81%) the named input was also the one that gained most from +20.

## 6. Ensemble Against Personal

| What | Formula | Where |
|---|---|---|
| Your own result | the evaluation above. A partner reaches it only through the preparation part `partner` (class scenes) or a brief's `readerPlays` lean, which is the text's, not the reader's quality | `coursework.ts:1205-1290`; `briefs.ts:326-334` |
| The partner's contribution | `(0.4 + 0.6·prep) · timing · agree`. Timing is `0.5 + 0.5·(listening + focus)/200` for a classmate and 0.6 for a recording. Agree is 0.9 while a table-work reading is held apart | `ensemble.ts:82-84`; `briefs.ts:478-486`; `ENSEMBLE`, `ensemble.ts:31-44` |
| A slip | when `u < (1 − reliability)·0.6`, the contribution falls by `0.6·base/segments·(1 − cover)`; cover is `(listening + adaptability)/2` | `ensemble.ts:87-95` |
| The scene together | per dimension `(1 − s)·own + s·100·contribution`, `s = share·level/3`; shares connection 0.5, responsiveness 0.5, believability 0.15, consistency 0.1; then `wholeOf` | `ensemble.ts:96-102` |
| What reads which | coursework bands and a night's band read your own result; a callback is earned by the take with its reader; the bond moves with the scene together | `briefs.ts:583-584`; `coursework.ts:846-855` |

## 7. The Mastery Guarantee As Currently Defined

**The qualifying conditions** (`evaluation.ts:46-54`, `tests/evaluation.test.ts:44`):

- every ability the task reads at full (stamina at its age ceiling);
- every technique it reads at 90;
- every part of preparation it reads at or past its complete, and every segment's own;
- readiness at or over 60, with no flu, injury or concussion reaching a dimension it reads;
- a choice that fits the material and the direction;
- on a brief, the genre known to 0.3, and a callback played the way its note asked.

**What follows:** capacity 1, shaped 1, prepared 1, condition 1, fit 1 and variation 0, so every dimension and the
whole are exactly 100, `mastery: true`, with no limits.

**Where it's tested:**

- `tests/evaluation.test.ts:45, 59`;
- `tests/engine-properties.test.ts:105` (1,500 drawn cases);
- `tests/material.test.ts:67`;
- `tests/briefs.test.ts:52, 64` (every brief × reading × fitting way);
- `tests/mastery-contract.test.ts`, `tests/mastery-integration.test.ts`;
- `tests/ensemble.test.ts` (a class scene with any partner);
- `tests/connected-properties.test.ts` (nights);
- `tests/workbook.test.ts`, `tests/direction-mastery.test.ts`;
- `tests/attributes-complete.test.ts:202`.

**Measured** (baseline §4):

- 4,495 of 4,495 brief cases come to 100;
- 56 of 56 scenes, 30 of 30 nights, 30 of 30 castings and 13 of 13 coursework templates come to 100;
- 0 of 180 drawn takes at mastery differ from 100.

### Can a partner lower personal execution today?

**Execution, no.** No partner value reaches the execution dimension's inputs or preparation.

**Personal work quality, yes, through preparation.** A class scene's connection and responsiveness read the
preparation part `partner` (`tasks.ts:82, 85`). Only a rehearsal kept with the partner moves it:

- the partner attends when a draw falls under their reliability;
- they decline when busy, wary or behind a boundary (`coursework.ts:1205-1290`);
- the step alone is refused (`coursework.ts:480`).

So an unreliable or estranged partner holds a mastered actor's own result under 100. Measured with the partner part at
0, it is 68.2 (65.7 to 71) across the 56 scenes, and 84.1 at 0.45 (baseline §4).

For taped briefs the reader's preparation and timing reach only the take together: own 100, together 85.1 with an
unprepared reader and 92.5 with the recording.

The guarantee's tests set the partner part directly, so none plays an absent partner.
