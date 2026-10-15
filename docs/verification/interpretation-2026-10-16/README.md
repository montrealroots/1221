# A Way Of Playing, Read Against The Scene, 2026-10-16

The owner's brief "Finish Genre Interpretation, Improve Training Advice, And Prove Long-Term Integration", part 1, on
`claude/zen-mccarthy-i88ujw` after the genre differentiation of the same day. The criteria were written before the model
was tuned (`criteria.md`); `tools/interpretation.ts` measures them, `tools/interpretation-examples.ts` writes
`examples.md`. Not merged, not deployed.

## What Was Wrong

A way of playing (pace, scale, structure: `content/approaches.ts`) leaned the same dimensions and drew the same abilities
in every scene. Restrained against expansive moved a take by the actor's own abilities alone: for an even actor the two
came within a tenth of a point in every brief (criterion I3 below: a standard deviation of 0.03 across 148 briefs). A
genre's conventions, the scene's text, its tones, its reader and its medium had nothing to say about how it was played.

## The Model

**Suitability** (`systems/interpretation.ts`, `content/interpretation.ts`). Each side of each axis has a suitability
from -1 (against the grain of the scene) to 1 (with it): the sum of the scene's signals, halved and held. Each signal has
an affinity for the sides it bears on, and what it rests on:

| Signal | Carries | Works Against | Why |
|---|---|---|---|
| The genre's register, at half weight | e.g. Feeling Held In: restrained, measured; Comic Rhythm: driven, set; Caught Live: open | e.g. expansive; measured; set | each concern's principle, cited in `content/concerns.ts` |
| The reader | pressing: driven, open, expansive; withholding: measured, restrained; unpredictable: open | measured; driven; set | met, waited out, taken live |
| The medium | a close frame: restrained; a house: expansive | expansive; restrained | the scale the medium takes |
| Its tones, by share | comic: driven, expansive; grave and lyric: measured; grotesque: expansive | comic: measured | a joke wants pace, grief wants time |
| Its turns, up to three | measured | | a turn earned, not skipped |
| Its features, by level | timing: driven, set; improvisation: open; a physical score: set; a partner at 3: open; voice work: expansive | improvisation: set | what each asks of the playing |
| Its language | heightened: expansive; verse: set, measured | | sized to; placed and given time |
| No one but the lens | expansive | | presence carries it |
| The reading taken | the side that leans the way the reading leans | the side that leans away | a reading that puts weight on consistency coheres with playing it set |

**What suitability does, and doesn't** (`GRAIN`):
- **It moves difficulty.** On each dimension a side leans on, suitability moves a share of the work's difficulty: up to
  0.3 easier with the grain and 0.3 harder against it, scaled by what rides on the scene (0.15 more for each level of
  stakes past 1).
- **It moves the rehearsal mark.** The choice's rehearsal is complete at 80% with the grain and up to 100% against it,
  around the 90% it always was.
- **It isn't a cap.** At full capacity difficulty asks nothing, so every side that fits reaches 100 for a mastered,
  prepared actor. A side against the grain isn't a misfit: misfit stays what the text forbids or the director asks
  against, said before the choice.
- **It isn't skill.** The actor's abilities still decide what a side draws on. A side played to an actor's strength can
  beat the side that suits the scene, and the result says which part was which.

**What the player sees:**
- **The Scene.** A column beside each side, with its band (Suits The Scene, Either Way, Against The Grain) and the two
  or three signals it rests on, for it or against it.
- **The rehearsal mark.** How far the chosen side has to be rehearsed in.
- **The take's account.** The forecast and the last take say what the side's suitability gave or cost the take, apart
  from what the abilities cost, in the form "Played that way it suited the scene (Restrained, Suits The Scene), which
  gave it N points; your abilities and techniques cost it M." In the built app at 1440 (`tools/acceptance-ui.mjs`, Melodrama's brief played expansive, on `88182cc4`), it read:
  "Played that way it suited the scene (Expansive, Suits The Scene), which gave it 0.3 points; your abilities and
  techniques cost it 21." It was the same after Save & Exit and Continue.
- **It survives a reload.** The take keeps the account (`Take.grain`).
- **Kept results stay as they were.** `RULESET` moved to `evaluation-5`, so a result kept under evaluation-4 is shown as
  it was and not worked out again by the new judge.

**Tuning, in the order it happened, against the criteria written first:**
1. The camera's affinity was halved, from 0.5 to 0.25. At 0.5 it made restrained the better side on 74% of briefs, every
   brief but the voice ones being on camera: a rule for the medium, not a reading of the scene.
2. The register was weighted at half. At full weight a genre's two scenes disagreed on scale in only 10% of genres (I2
   asks 20%): the register outweighed everything the scene said, a genre rule by another name.
3. Three signals that favor size were added, each with its reason: a pressing reader met with size, a solo take to the
   lens, and comic beats.

## The Criteria (`criteria.md`)

Measured by `tools/interpretation.ts`, on the briefs written first for their genre (designed) and the further ones (held
out). `--off` is the way of playing as it was.

| | Designed | Held Out | As It Was (`--off`) |
|---|---|---|---|
| I1: mastery on every fitting side, every reading | 8,010 of 8,010 at 100 | 9,117 of 9,117 | the same |
| I2: a genre's scenes favor different sides (scale, pace, structure; each ≥ 20%) | catalog: 21.5%, 29.5%, 39.6% | | |
| I3: restrained less expansive, its spread (≥ 1.0) | 1.11 | 0.92, **fails** | 0.03 |
| I3: each sign in ≥ 25% of briefs | restrained 73.0%, expansive 23.0%, **fails** | 60.8% and 31.8% | 2.7% and 5.4% |
| I4: the specialist wins against the grain (≥ 25%) | 54.3% | 54.8% | 100% (no grain to go against) |
| I4: the even actor follows suitability (≥ 75%) | 100% | 100% | 37.3% |
| I5: two or more interpretations within a point (≥ 80%) | 100% | 100% | 100% |

**Where it falls short, and why:**
- **I3's sign clause fails on the designed briefs.** Expansive comes out ahead in 23.0% of briefs against 25%. Its
  suitability is the better side's in 41.9%. The gap is the camera's own weighting: a close frame weighs believability
  1.2× (`CAMERA_LEAN`), and restrained leans on believability, so the same suitability is worth more to restrained. In
  19 briefs expansive suits a little better (by 0.03 to 0.16, inside the Either Way band) and restrained still comes
  out level or ahead. That's a real effect of the medium. The threshold wasn't moved, and nothing was bent to pass it.
- **I3's spread fails on the held-out briefs.** It's 0.92 against 1.0. It was 2.03 before the camera was halved and the
  register weighted at half. Those two changes traded spread for the genre-scene balance I2 asks; I2 holds and I3's
  spread falls just short on the briefs not looked at.

## Proof

- **The tests.** `tests/interpretation.test.ts` (8) checks mastery against the grain; one genre's two scenes favoring
  opposite scales; the register and the scene; the reading; skill against suitability; the account in the result; the
  rehearsal mark; and replay. `tests/interpretation-journey.test.ts` plays it through the commands: with the grain and
  against it, kept through a reload, and the advice moving once trained.
- **Mutations.** Seven on the model, each killed (`mutations.json`, I1 to I7): the grain not applied, its sign flipped,
  the register or the reading left out, one rehearsal mark for every side, the take keeping no account, the brief
  passing no scene.
- **Before and after.** `examples.md`: the same actor, scene, reading and preparation, each side, before and after. For
  example, in Nordic noir the even actor was 59.4 either way and is now 61.6 restrained and 58.1 expansive. The
  presence, voice and body specialist there preferred expansive before (52.4 against 51.5) and restrained after (53.9
  against 52.2). In melodrama, where expansive suits, the specialist still prefers it (58.3 against 56.8).

## Limits

- Suitability is read on practice briefs from everything above. A class scene and a production's night read it from
  their material alone (tones, turns, features, language, medium): they have no genre register, reader or reading of
  their own in the engine.
- A segment played its own way in the workbook (Play This Part Another Way) isn't read against the scene: only the
  piece's own sides are.
- The affinities are SLATE's, each from its signal's principle; no source puts a number on them.
