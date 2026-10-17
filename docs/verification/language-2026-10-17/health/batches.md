# The Health Area's Batches

Brief 14, 2026-10-17. The health area's sources are the inventory's subsystems health and world: 167 sources in 20
files (`prompts/health.md`). Each batch below says what was read, what changed and what was kept, where a rewrite could
have changed what's true and how that was checked, the tests and tool matchers updated, the checks and their exits, and
the screens read. The before-and-after pairs are in `examples.json`.

The rendered evidence is `render.ts`, in this folder, run with `npx vite-node`: it opens each scenario save in
`.../scratchpad/l14/saves/` and prints every look of the wellbeing family, then sets a new life to each band a sentence
turns on (energy, stress, sleep debt, morale, condition, fitness, nourishment, hygiene; a day awake and a short night;
readiness with none, one, two and three drags and at its ceiling), gives it every long-term condition each way and an
injury of each limit, makes another person in she/her, he/him and they/them, sets a body to each age band, and prints
the guide's body chapter field by field. `render-before.txt` is the code before this pass; `render-after-1.txt` after
batch 1. Nothing it does is saved.

## Batch 1: Your Wellbeing, The Body Chapter And The Aging Bands

**Sources (22):** `src/ui/looks/wellbeing.tsx`, all 12 and a new one, `#WHAT` (the measure's own explanation, 919
words before); `src/engine/content/guide/body.ts`, all 8 (`body.how`, `body.sleep`, `body.look-after` and the
connection groups, 3,341 words); `src/engine/content/lifespan.ts#AGING` (74 words). All 22 Rewritten And Verified.

**What changed.**
- **Health, stamina, energy and condition are four things, said so.** Each measure's way on your own page now says what
  it is before what it decides ("What’s left in you for today. Sleep brings it back."), and the player's own look of a
  measure has a new paragraph saying what it is (`WHAT`). Energy says only sleep brings it back and that stamina and
  condition are other things; condition says it isn't energy and isn't your health, which (long-term conditions,
  cover and care) is on Papers, under Health Cover; fitness says it's the same figure as Stamina on the Player Profile,
  that working out builds it and rest doesn't. The guide's How You Are overview says the four apart in its first
  paragraph, and gains a Health fact and a mistake ("Resting to build stamina").
- **"Dials" go.** The kind "One Of Eight" is "Your Wellbeing" (or her, his, their); the footnotes say "measures"; the
  guide says "measures" and drops the synonym "dials".
- **Readiness** is "How Ready You Are Today", names what's holding you back most, and its footnote says what judged work
  does with it (under 60 it costs you, read from `EVALUATION.sufficientReadiness`) in place of "the work judged that
  day reads it as its condition".
- **Each band's sentence** names its consequence where the old one gestured ("it shows in everything else" is now
  "it pulls readiness down. Under 15, stress starts to climb"); stress over 75 now says it wears condition down every
  hour; condition's night share says what it's compared with ("at 94").
- **Long-term conditions** are kinded "A Long-Term Condition", kept apart from the Condition measure; "left alone" is
  "left untreated"; the body says where to change it, by the buttons' names (Keep It Up, Let It Go, on Papers, under
  Health Cover).
- **An injury** says what it keeps you from by what it limits: laid up (classes, work and training) or, for a sprain, a
  pulled muscle or a back strain, no workout and the physical side of the work held back.
- **The body chapter** answers the eight questions in order, with a new `next` for each entry (three each), and each
  "Why It Might Not Be Available" line is said in the guide's own words, not a quoted refusal, so the home and money
  areas' rewording of those refusals can't leave it stale. "That’s the owner’s decision, of 2026-10-14." is gone.
- **The aging bands' words** say what each band's figures do. Three said what nothing does ("A week off costs a month
  back"; "What you don’t use, you lose faster than you gain it", where `FITNESS.perDay` is the same at every age).

**Kept.** Every figure, read from the same constants; the guide's ids, covers, goals, routes, connections' targets and
related entries; each example's numbers and the tests that read them back; the trait descriptions and `KNOB_READS`
(the profile area's); `wellbeingSummary` (the home area's, defects.md 6).

**Meaning-sensitive changes, and how each was checked.**
- "Only sleep brings it back: a meal doesn’t." Checked: the one write that raises `energy` is `applySleep`
  (`life.ts:901`); `applyLookingAfter` gives a meal nourishment and mood. (Core's glossary says "Sleep and food bring
  it back": reported to the coordinator, glossary.md.)
- "Fitness ... the same figure as Stamina on your Player Profile." `attributes.ts:150` returns `wellbeing.fitness` for
  stamina, and `:323` writes it back.
- "An injury doesn’t lower it [condition]." No injury code writes `condition`; `mayHurt` and the daily weight move
  stress and morale (`INJURY.weighs`).
- "Under 60, it also costs you in work that’s judged." `evaluation.ts:426`, `EVALUATION.sufficientReadiness` 60.
- "Laid up, kept from classes, work and training." `offSick` excuses classes (`school.ts:1481`), `laidUp` refuses
  rehearsals and evenings (`coursework.ts:1545`), `trainingRefusal` refuses a workout.
- Type 2 diabetes no longer told type 1's emergency risk (`illnessWeek` multiplies emergencies for `typeOne` only):
  a defect, defects.md 3.
- Readiness at 100 no longer says a measure holds it back (`readiness` clamps): defects.md 4.
- The aging lines: checked against `AGING`'s figures (the 70s take 1.80 fitness and 1.25 condition a year, more than
  the 20s' 1.2 and 0.5 a decade).

**Tests updated (assertions kept as exact as before):** `tests/scope-people.test.ts`, `tests/evidence-g33-ui.test.ts`
(its stress `band()` gained the over-75 sentence, as the code did), `tests/evidence-g06-life.test.ts`,
`tests/evidence3-person.test.ts`, `tests/looks.test.ts`, `tests/evidence-g32-ui.test.ts`,
`tests/guide-examples-start-day-body.test.ts` (each example's reader regex, as narrow as before),
`tests/evidence2-b12.test.ts`, `tests/evidence-g07-life.test.ts` (and its `bodyWords` helper),
`tests/evidence-g28-ui.test.ts`, `tests/evidence-g30-ui.test.ts`, `tests/need-paths.test.ts`. No test title changed. No
tool matcher held these words (`tools/acceptance-ui.mjs`, `tools/playthroughs-ui.mjs`: none).

**Checks.** `npx tsc -b --noEmit` 0; `npx eslint` on the changed files 0; `title-case` 0, `label-sweep` 0,
`plural-check` 0, `voice-check --check` 0 (two "how ready you are" forms in the guide rewritten, where the tool's own
fix would have read "how ready you’re"), `tics --check` 0 (three "Nothing" openings and three ", which is" clauses of
the first draft rewritten), `spelling` 0, `typos` 0, `doc-refs --check` 0, `deciders --check` 0;
`text-inventory --check` 0 once `#WHAT` was marked. Engine-speak: 758 at the start, 738 after this batch, and none
left in these three files (`--speak`). `npx vitest run` on the 32 files that hold these words: 563 of 564, then 1 failure fixed (a straight apostrophe in a
comment, which `tests/looks.test.ts` holds to the house's), `tests/looks.test.ts` again 23 of 23, exit 0.

**Screens read.** Every look of the family, in every scenario save and every band (`render-after-1.txt`); the labels
the body chapter names, against `src/ui/shell/TimeControls.tsx` (Sleep, Hours, You’d wake at, Not Yet, Needed Now,
Most Worth It), `src/ui/screens/Home.tsx` (How You Are, Energy, Stress, Readiness) and the text walk's Papers screens
(Health Cover, Your Doctor, Care And Its Bills, Pay It Off).
