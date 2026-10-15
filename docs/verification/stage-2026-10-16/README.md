# The Stage And A Way Of Playing: What Was Wrong, What Changed, What It Came To, 2026-10-16

The owner's brief "Finish Genre Acceptance And Correct The Stage-Interpretation Bias". The criteria (`criteria.md`)
and the sources (`research.md`) were committed in `c253ba58`, before any change. The scenes' circumstances and the model
were committed in `fe0cca8d`, before any measurement of them. Not merged, not deployed.

## What Was Wrong (`baseline.txt`)

On the 85 class scenes and plays where both scales fit, for an even actor at 55:
- **Expansive came out ahead on 85 of 85.**
- **Without suitability it was ahead on 1.** The task's weights were even, so the bias was all suitability's.
- **The house.** "A House To Reach" gave expansive +0.25 and restrained −0.25 on every stage scene. It treated being
  heard and read across a theater as playing large.
- **The voice.** "Its Voice Work" counted a voice's demand as size: Othello 4.3's willow song, sung at bedtime between
  two women, counted +0.75 for expansive.
- **No signal for restraint.** Not one stage scene had any. A stage has no reader and no close frame, and nothing
  said what a scene hides or how private it is. Drama's register evened the scales at best.

## What Changed

1. **Projection is a demand, not a size** (`STAGE_LEAN`, `content/approaches.ts`). A house weighs the take's execution
   1.2, as a microphone does: the voice and the body reach the back row whichever way it's played. The house pulls no
   scale (`MEDIUM_AFFINITY.stage`). On stage a voice's demand is the house's to reach, not a way of playing.
2. **A scene says what its scale asks** (`MaterialProfile.circumstances`, `CIRCUMSTANCE_AFFINITY`). Each of the 86
   class scenes and plays was read from its own text, each level with its reason, for four things:
   - what a character hides (concealment);
   - how private the exchange is (intimacy);
   - how far it's spoken to many (address);
   - how far the conflict is brought out loud (confrontation).

   The first two argue for restraint and the last two for size, a quarter a level each way, the size of a feature's
   level. A scene built on one counts as much as its genre's whole register. Intensity, pace and the register are read
   apart, as before.
3. **`RULESET` evaluation-8.** A result kept before is shown as it was.
4. **The guide's The Scene** says it, and so do the attributes matrix (the medium row, and a row for a scene's
   circumstances) and The Scene column on the screen, by the signals' own labels.

Nothing else moved:
- the camera's and the microphone's affinities;
- the briefs (all 648 brief-and-reading suitabilities are identical, before and after);
- the genre registers;
- the reader;
- the thresholds.

## Before And After, Each Scene (`after.json`, `bySide`)

For example, the suitability of restrained and expansive:

| Scene | Before (Restrained / Expansive) | After | Why, From The Text |
|---|---|---|---|
| The Seagull, Act Four | −0.06 / 0 | **0.32** / −0.37 | Konstantin's study at night, two people alone |
| Trifles | −0.06 / 0 | **0.69** / −0.75 | they hide the bird from the men upstairs; the agreement is never spoken |
| The Cherry Orchard, Act Four | −0.06 / 0.07 | **0.69** / −0.68 | the proposal everyone arranged is never spoken |
| Othello 4.3, the willow song | −0.5 / 0.88 | **0.13** / −0.12 | two women alone at bedtime; the song is the voice's demand, not size |
| Macbeth 1.7 | −0.5 / 0.5 | **0.38** / −0.37 | murder planned under the king's roof, the feast next door |
| Julius Caesar 2.1, the orchard | −0.5 / 0.5 | **0.25** / −0.25 | husband and wife before dawn; he hides the conspiracy |
| Julius Caesar 4.3, the tent | −0.5 / 0.75 | −0.25 / **0.25** | a quarrel of short, hard exchanges |
| Antigone | −0.5 / 1 | −1 / **1** | a public trial before the palace; she defies the king to his face |
| Pygmalion, Act Four | −0.12 / 0.44 | −0.25 / **0.56** | she has it out with him and throws his slippers |
| The Proposal | −0.12 / 0.5 | −0.37 / **0.5** | it ends in shouting over the meadows |
| Lady Windermere's Fan, Act One | −0.12 / 0.44 | **0.38** / −0.06 | Darlington's compliments carry a warning she doesn't hear |
| Romeo And Juliet 2.2 | −0.5 / 0.75 | 0 / 0, **either** | a vow at night that mustn't be heard, against tragedy's register |

## The Criteria, Measured (`after.json`, `tools/interpretation.ts -- --fresh --stage`)

| Criterion | Before | After | Holds |
|---|---|---|---|
| ST1: each scale side ahead in ≥ 25% (even actor) | restrained 0, expansive 85 of 85 | **restrained 50, expansive 33 of 85** (2 level) | yes |
| ST2: the house moves no scale; the better side rests on the scene | the house +0.25 on all 85 | no house signal; 72 of 72 band-apart rest on the scene | yes |
| ST3: projection a demand. A voice-and-body specialist better on stage than at a close frame | — | 171 of 171 | yes |
| ST3: … and the even actor's result the same | — | **159 of 171**: fails as written | no |
| ST4: each genre with ≥ 5 stage scenes suits both sides somewhere | comedy 0 / 28, tragedy 0 / 22, drama 0 / 25 restrained | comedy 13 / 15, tragedy 4 / 16, **drama 25 / 0** | no |
| ST5: mastery, every fitting combination | 2,277 of 2,277 | 2,277 of 2,277 | yes |
| ST6: an expansive specialist wins expansive against the grain (≥ 25%) | — | 21 of 49 | yes |
| ST6: a restrained specialist wins restrained against the grain (≥ 25%) | — | **7 of 34 (20.6%)** | no |
| ST7: two interpretations within a point (≥ 80%) | — | 84 of 86 | yes |
| ST8: the even actor follows the scene (≥ 75%) | — | 72 of 72 | yes |

**What the three shortfalls are.**
- **ST3, the even actor.** Even a performer equal in everything (abilities and techniques at 55) differs between stage
  and close frame on 25 of 171 cases. The largest difference is 0.10, one step of a result kept to a tenth. The clause
  asked for less than a rounding step. That's the clause's defect, reported, not redefined.
- **ST4, drama.** Every one of the catalog's 25 drama scenes and plays is a private, naturalist two-hander: Ibsen,
  Chekhov, Strindberg, Glaspell and the original scenes. Each is read in what it hides. Drama's register, Played
  Straight, already leans to restraint. The catalog has no drama scene of a public speech or a brawl to argue for size.
  Within the genre the scenes still differ in how far they suit restraint, from Miss Julie at 0.07 to Hedda Gabler's second
  act at 0.82, but none tips. Comedy and tragedy show both ways (13 / 15 and 4 / 16). No drama scene's signals were changed
  after the measurement to pass.
- **ST6, the restrained specialist.** A restrained specialist wins against the grain where expansive suits only narrowly
  (a gap of 0.3 or less). It loses where it suits strongly. The stage's expansive scenes are its public trials,
  oratory and brawls (Antigone, Oedipus, Julius Caesar, The Bear), whose gaps run 0.6 to 2.0. Expansive also draws
  twice what restrained does: presence 1, vocal 0.5 and physical 0.5, against emotional depth 1. That's
  `APPROACH_EFFECT` as it was before this brief, and it wasn't changed here. Seven scenes show strength carrying the
  harder side; the bar was a quarter.

## Fresh Validation, Defined Before Any Measurement

| | Result | Holds |
|---|---|---|
| **F1**, production nights (29 plays, the performance task): ST1 | restrained 16, expansive 13 of 29 | yes |
| F1: ST5 mastery | 783 of 783 | yes |
| F1: ST7 | 29 of 30 | yes |
| F1: ST8 | 27 of 27 | yes |
| **F2**, even actor at 40: ST1, ST8 | restrained 49, expansive 33 of 85; 72 of 72 | yes |
| F2, even actor at 75: ST1, ST8 | restrained 50, expansive 34 of 85; 72 of 72 | yes |

## What Was Kept (ST9)

- **Every camera and microphone brief's suitability** is identical: 648 of 648 brief-and-reading rows, compared with
  `c253ba58`.
- **The interpretation criteria on the briefs**, as before:
  - I1 at 100 on all 8,010 and 9,117 checks;
  - I2 at 24.2%, 20.8% and 32.9%;
  - I3 spread 1.29 and 1.19, expansive ahead 27.0%;
  - I4 100%;
  - I5 ≥ 98.7%.
- **The genre signature**, as before the change:
  - S1 holds, 0.90 / 0.88;
  - S2 revised holds, 1.60 / 1.61;
  - S3 revised: 12,757 of 14,350, 11,887 of 14,350, 24,832 of 28,413 and 23,300 of 28,413;
  - the fresh validation: 1,015,539 of 1,156,538.
- **G2 = 0:** the seven formerly identical pairs stay apart (`tests/genre-identity.test.ts`).
- **The audit** (`genre-audit.md`): knowing a genre helps its own brief in 149 of 149 and moves another genre's in none.

## Proof

- **`tests/stage-interpretation.test.ts` (11).** Each expectation comes from the scene's text:
  - the house pulls no scale;
  - projection is weighed on the voice and the body;
  - the willow song suits restraint;
  - Julius Caesar's orchard against its tent;
  - Macbeth 1.7 against Antigone;
  - Lady Windermere against The Proposal;
  - no universal best;
  - strength carrying the harder side;
  - mastery on both sides;
  - an older result kept as it was;
  - a class scene chosen through `school.choose_playing`, its forecast following the scene, kept through a reload.
- **Mutations (`mutations.json`), 9, each killed:**
  - the house back as a pull;
  - the circumstances ignored;
  - a stage voice read as size;
  - the house not read as projection (it survived the first run, and the test was made to compare it);
  - restraint favored everywhere;
  - genre influence removed;
  - the reader ignored;
  - mastery broken against the grain;
  - an old result judged again.

## The Student's Experience, Played Again On The Final Engine (`runs/`, on `2eb0a294`)

The commits since change only the acceptance tool and these documents.
- **24 lives through graduation** (`runs/lives.jsonl`):
  - 20 graduated and the 4 autopilot controls were dismissed, each term's standing as before this change;
  - breaches, unbalanced entries and errors were 0 on every life;
  - every concern outside the controls was a production night, named by its review: Ghosts, Woyzeck, Major Barbara,
    the Carlotta Festival.
- **The workload** (`runs/wl-*.json`, 1.4 years):
  - London's four seeds and New York's are good, with 9 to 15 of 46 Unready in the third term, as before;
  - the neglect control is dismissed and warned in each of its terms.
- **The mastery plans** (`runs/plan-*.json`): all six reach 100 on every payoff tape and graduate on the same day.
  Everything comes full 0 to 2 days later than before.
- **Advice** (`runs/advice-played-cases.json`): the 40 played cases are identical to before, case for case: 40 of 40
  within a tenth, the exact best in 38.
- **Repetition and stale advice** (`runs/variety-v-0.json`, three years). Graduated, breaches 0.
  - Advice: 10 distinct top recommendations over 157 weeks. None given for an input at full, none stuck, and the
    longest unresolved stretch 2 weeks (it was 3).
  - Practice: every one of 2,093 hours had distinct feedback.
  - Notes: none said again after it was taken.
- **No dominant way of playing.** On stage, an even actor's better scale is restrained on 50 and expansive on 33 of
  85, and two or more interpretations are within a point on 84 of 86.

## Verification

  - **The gate:** `npm run gate` exited 0 on `8c9a8292`, read from a file: 348 files and 4,184 tests, typecheck, lint
    and all seventeen checks, the tree unchanged.
    - The first run, on `10a0914f`, failed four tests. Each read the stage's new projection: the microphone test
      compared with a stage that no longer leans nothing, and three casting journeys had pinned parts that casting
      now reads otherwise. Each was corrected to what it holds (`fe5ccc61`).
    - The second run, on `fe5ccc61`, failed the typecheck in one of those tests. It was fixed in `8c9a8292`.
  - **The build:** exit 0.
  - **The built app at 1440 and 390,** from all 14 scenario saves written again on the new engine (0 breaches and 0
    unbalanced each): 70 passed, 0 failed, 2 skipped (the two since 2026-10-12), 0 errors, 0 overflows. That includes
    the new stage step: a drama scene's Restrained, citing What's Kept Hidden and A Private Exchange, chosen and kept
    through a reload.
    - Its first two runs timed out on the step's own locators. Both were fixed in the tool (`c5a23c09`, `1ccf2867`), and the
      commits since `8c9a8292` change only that tool and these documents.
  - In a cloud container (Linux), not the owner's PowerShell machine.
