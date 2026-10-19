# The Health Area's Batches

Brief 15, 2026-10-19. The health area's second pass: its 171 sources in 20 files, read again whatever their first status.
Each batch says what it read, what it changed and kept, how each meaning-sensitive change was checked against the code,
the interactions read whole, the tests and matchers it moved, and the checks with their exits.

The evidence scripts are in this folder: `render-looks.ts` prints every variant of the wellbeing looks and the guide's
body entries (`looks-before.txt`, before any change; `looks-after-1.txt`, after batch 1), and `render-care.ts` plays the
care notices and refusals no test asserts word for word (`care-before.txt`, then `care-after-2.txt`). Both are brief 14's
health scripts (`../../language-2026-10-17/health/render.ts`, `render2.ts`), kept and retitled.

## Batch 1: Your Wellbeing, The Body Entries, Stamina And Age

**Sources (27, about 5,250 words):** `src/ui/looks/wellbeing.tsx` (13), `src/engine/content/guide/body.ts` (8),
`src/engine/content/lifespan.ts` (1), `src/engine/content/body.ts` (3), `src/engine/systems/body.ts` (2).

**Rewritten (12):** wellbeing's `DIALS [condition]`, `DIALS [fitness]`, `WHAT`, `top`, `sentenceFor` and `leftAlone`;
the guide's `BODY [body.how]`, `[body.sleep]`, `[body.look-after]`, `[immediate]` and `[scheduled]`; and
`TRAINING_CLASS_NAMES`.

**Retained (15):** the six other ways into the measures (`DIALS` energy, stress, sleep debt, morale, nourishment,
hygiene), `bodyWords`, the guide's `[evaluation]`, `[optional]` and `[history]` connections, `AGING`, the two citation
lines in `content/body.ts`, `bmiWord` and `bodyUnits`. Each reason is in `docs/text/second-pass/health.json`, and a
sample is in `retained.md`.

**What changed, in kind:**
- **Variants that contradicted themselves or the figure.**
  - Energy under 15 said "Under 15, stress starts to climb" when it had already started.
  - A mood of 62 read "Steady" and then "Down like this".
  - A condition exactly at its mark said what happens "above 100".
  - Each variant now says what's true at that figure.
- **Vague or literary lines made concrete:**
  - "Everything is harder than it should be" now names what sleep debt does.
  - "Part of this story" became "isn't in your life any more".
  - "With no 76 under it" now names the groceries' floor.
- **Passives and dangling clauses given a subject:**
  - "Its care is paid each month, at what his plan doesn't cover" now says he pays the part his plan doesn't cover.
  - "Kept up, at what …" now says who pays.
  - "The food can't be paid for" became "there's no money for food".
- **The guide:**
  - The short overview leads with where health lives.
  - The bar colors are given as figures.
  - The Readiness line starts with the action.
  - The long needs sentence is two.
  - "Current account" is now "checking account".
  - Two connections were made true (a commitment missed; an injury that may cost nothing).
- **Labels in sentences:** an injury's name is in sentence case inside the person look's Mending line.

**Meaning-sensitive changes, and how each was checked:**
1. **Energy under 15:** "running on empty, so stress is climbing and readiness is down".
   - `applyElapsedWellbeing` (`systems/life.ts`) climbs stress by `1.6 × stressGain − 0.35 × stressRecovery` an hour
     once energy is under `EMPTY`.
   - That's positive at every disposition the knobs allow (0.8 − 0.525 at the extremes), so it's always climbing there.
   - The branch reads `dial.value`, not the rounded figure, so 14.6 shown as 15 says what the engine does.
2. **Sleep debt of 12 hours or more:** "your energy runs down faster and a night gives back less".
   - The drain is `3 × (1 + debt/24 × 0.5)` an hour (`applyElapsedWellbeing`).
   - A night's energy is multiplied by `1 − min(0.62, debt/30 × 0.62)` (`applySleep`).
   - Both rise with the debt. Readiness isn't claimed, because it's already named by the readiness look.
3. **Morale's line:**
   - `applySleep`'s `settled = remap(morale, 0, 100, 0.75, 1.15)` is exactly 1 at 62.5, so a rounded 63 and over
     clears more stress and 62 and under clears less.
   - The look's own branch (`n >= 63`) was already that line. Only the words changed.
   - "Each night moves it toward 80": a night moves morale a third of the way toward `moraleSettlesAt` for eight hours.
4. **Condition below its mark:**
   - The share is `0.8 + 0.2 × condition/mendsTo` (`applySleep`'s `worn`), the same figure as before, said as "only N%
     of the energy it normally would".
   - It's dropped where it rounds to 100, which would have read "only 100%".
   - "Each midnight brings it a little closer" is `settleTheBody`'s 2% of the way.
5. **Condition at or above its mark:**
   - The midnight pull back is `settleTheBody`, which moves a body above `mendsTo` down 2% of the gap.
   - At the mark there's no gap, so the sentence is said only above it (defects.md, 1).
6. **The condition way:** "where your morale settles, when a sick day is excused".
   - `moraleSettlesAt(person, condition)` is the settling point.
   - `SCHOOL_ESTIMATE.sickBelow` (55) is the excused sick day.
   - Nothing new is claimed. The old list said "your morale, sick days".
7. **The bar colors in the guide:** `Meter` in `src/ui/components/primitives.tsx`.
   - With a `line`, the bar is red past it and amber within 15 before it.
   - Home passes `EMPTY` (15) for Energy and `OVERWROUGHT` (75) for Stress, inverted.
   - So it's amber under 30 and red under 15, and amber over 60 and red over 75.
   - The figures are written from the constants (`EMPTY + 15`, `OVERWROUGHT - 15`), not copied.
8. **The injury connection:** "needs care, and you may owe a share of its cost".
   - `mayHurt` (`systems/injury.ts`) bills a share, or says "costs you nothing" where cover or workers' compensation pays.
   - Care is a doctor, urgent care or the emergency room (`CARE_WORDS`).
9. **The training class:** "in the spring term". `TRAINING_CLASSES` holds `'spring'`, the term a course runs in. The
   string's only readers are the two guide entries (`guide/body.ts`, and `guide/craft.ts` through `andList`).
10. **An injury's mending time:** "depends on the injury and on how resilient the body is". `systems/injury.ts` multiplies
    the drawn days by `personalityOf(person, 'illnessToll')`, the knob a resilient disposition lowers
    (`KNOB_READS.illnessToll`: "how long an injury takes to mend").

**Interactions read whole:**
- **How You Are:** its How This Works entry (`body.how`), then Home's three bars, then each measure's look and its way on
  the person page, then the person page's own lines (body, mending, papers), then Readiness and a trait's look, then a
  long-term condition's look and its way back to Papers.
- **Stamina against fitness against energy against condition against health:** each is said once, in the glossary's
  words, in `WHAT`, the guide's short overview and the ways. The condition body now says "something else again" for
  health, where it had said "a separate thing again".
- **Sleep:** the entry `body.sleep`, then the Sleep Debt look's four variants, then the next morning's measures (the
  sleep example).
- **Looking After Yourself:** the entry, then the nourishment and hygiene looks' morning floors (76, 40, 82).

**Tests updated** (each to the new words, as exactly as before; no title changed, none loosened):
- `tests/evidence-g06-life.test.ts`: energy at 7, condition at 47, fitness at 20 and 80, nourishment at 14, morale at 20
  and 90.
- `tests/evidence-g07-life.test.ts`: the two Mending lines.
- `tests/evidence-g33-ui.test.ts`:
  - the person page's Condition, Fitness, Readiness and Depression ways;
  - the broken bone's Mending line, twice.
- `tests/evidence2-b12.test.ts`: the broken bone's Mending line, and the gone look.
- `tests/scope-people.test.ts`:
  - her Condition, Fitness and Readiness ways, as regexes as narrow as before;
  - his Asthma way and summary;
  - her Mending line;
  - his Fitness way;
  - her condition summary's regex.

**Test added:** `tests/evidence-g06-life.test.ts`, "the Condition look says the midnight pulls it back only for a body
above what rest can mend it to, not one at it" (defects.md, 1). With the old guard (`n >= mends`) it fails on the
words "Above 91, it settles back toward 91 each midnight." With the new guard it passes. Both were run.

**Tool matchers:** none held these words (`grep -rnF` over `tools/` for each old phrase).

**Checks** (from the clone, each exit read from a file):
- `npx tsc -b --noEmit`: 0.
- `npx eslint` over the three source files and five test files: 0.
- `npx vitest run` over the nineteen files that hold these words (`tests/scope-people`, `evidence-g06-life`,
  `evidence-g33-ui`, `evidence2-b12`, `evidence3-person`, `looks`, `language-dynamic`, `wellbeing-bites`,
  `evidence-g32-ui`, `evidence-g07-life`, `guide-examples-start-day-body`, `language-injury`, `evidence-g28-ui`,
  `evidence-g30-ui`, `need-paths`, `guide`, `help-mechanics`, `decisions-stamina`, `guide-examples-craft`):
  - The first run had 17 failures, all on the old words or the provenance's length (`tests/looks.test.ts`, 234
    characters against 220). The provenance was shortened.
  - After the updates, the failing six files gave 146 of 146 passing, and the guide and dynamic files 101 of 101.
- `title-case --check` 0, `label-sweep` 0, `plural-check` 0, `voice-check --check` 0, `spelling` 0, `typos` 0.
- `tics --check`: 1, then 0. A guide sentence opened on "Nothing", whose budget is 0, and was rewritten.
- `text-inventory --check` 0, `doc-refs --check` 0, `deciders --check` 0.
- `guide-quotes --check` 0: no quote of these words in another entry.

**Screens:**
- The looks aren't on the walk's screens (it doesn't open a look), so the words were read in `looks-after-1.txt`.
- That file holds every scenario save's player looks, eleven wellbeing bands, the conditions each way, an injury, three
  pronouns and eight ages.
- The built app is walked at the end of the area.
