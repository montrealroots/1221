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

## Batch 2: Care, Cover, Bills, Appointments, Injuries And Therapy

**Sources (74, about 2,830 words):** `src/engine/systems/health.ts` (47), `appointments.ts` (6), `injury.ts` (6),
`therapy.ts` (3), `clinics.ts` (2), `mortality.ts` (3); `src/engine/content/clinics.ts` (2), `carevisits.ts` (4),
`injury.ts` (1).

**Rewritten (14):**
- in `health.ts`: `healthMonth`, `renewProgram`, `applyRenewal`, `noticeOfNoncompliance`, `grantPending`, `applyRefusal`,
  `dueWords`, `careFor`, `repriceCare`, `registerHealth` and `registerHealth <health.pay_bill>`;
- in `appointments.ts`: `registerAppointments` and `<health.cancel_appointment>`;
- in `injury.ts`: `mayHurt`.

**Blocked (1):** `appointments.ts#bookIn`, the booking notice. The papers guide quotes it whole and a test holds the two
equal (defects.md, 4, with the words suggested).

**Retained (59):** every other source. The reasons are in `docs/text/second-pass/health.json`, and a sample is in
`retained.md`.
- Most are refusals that already name their one obstacle, and official notices that already keep their dates and rules.
- The rest are labels: real names (practices, pharmacies, therapists, programs) and calendar or ledger lines.

**What changed, in kind:**
- **The bill sentence, everywhere care is billed:**
  - "You owe $50.00. It’s taken from your checking account on November 25, 2026, and if there isn’t enough then, it
    becomes medical debt.", the working reference's words.
  - It's said in a doctor's visit, a stay, the emergency room and an injury's care, which says "You owe $699.13 for
    its care."
- **The unpaid bill:**
  - It now leads with what happened ("Your bank couldn’t cover a $699.13 medical bill when it came due, so it’s now
    medical debt.").
  - What the bill was for comes in a sentence of its own, so a bill's name with commas can't run into the verb.
  - The action follows, with the button.
  - An injury's bill is named "A sprained ankle’s care", where "a sprained ankle: its care" couldn't sit in a sentence.
- **Instructions now lead with the action and the button:** "To appeal, press Appeal It …", "To book again, press Book
  An Appointment …", "To clear it, press Pay It Off …".
- **Wrong subjects corrected:**
  - "December 2026 met its work rules" is now "you met its work rules in December 2026".
  - "December 2026 didn’t show …" is now "HUSKY D still couldn’t find … in December 2026", in the same words as the
    notice of noncompliance it answers, with "still" for the repeat.
- **Repricing:** "care you had from … is billed again as that cover pays" is now three sentences: the care was priced
  again, what you owe more or less, and where a credit goes.
- **One title said the opposite of its notice:** "Appeal Upheld" is now "Appeal Lost" (defects.md, 3; renames.json).
- **Checking account,** in the two health sentences that said current account.
- **Two refusals made useful:** "Say how much." became "Enter an amount to pay.", and "No such appointment." became
  "That appointment isn’t booked any more."

**Meaning-sensitive changes, and how each was checked:**
1. **"It’s taken from your checking account on …, and if there isn’t enough then, it becomes medical debt."**
   - `BILL_KIND`, on the bill's `dueAt`, calls `payFromCurrent`: the checking account, with its overdraft and linked
     savings. If that fails, it posts the bill to Owed For Medical Care.
   - "Isn't enough" covers all three sources, as "your bank couldn't cover" does in the unpaid notice.
   - The date is `dueAt` in the zone Papers shows, as before.
2. **"So you owe the full $183.98 unless an appeal overturns it."**
   - `full` is the larger of the share and the uninsured price (`careFor`), billed as such.
   - An appeal won brings it back to the share (`APPEAL_KIND`).
3. **Care Credited's "It comes off anything still unpaid or owed as debt, and the rest goes back to your bank":**
   `repriceCare` takes a credit off the open bill first, then off the medical debt, then refunds the rest to
   `payeeAccount`. The order is kept.
4. **"Your marketplace plan ends when HUSKY D begins."** `grantPending` sets the plan's `until` to the later of its own
   start and HUSKY D's `from` (45 CFR 155.430(d)(2)(v)).
5. **"At your renewal you’re neither":** the branch is `!admitted`, `medicaidStatus` false at the renewal's hour, for a
   member who is neither a citizen nor five years a green card holder.
6. **"You don’t need to send anything about your pay, income, time at the School, age or SNAP: those come from the
   records."**
   - No command sends any of them.
   - `WORK_DECIDED_KIND` reads the months again "as the records stand" (`engagement`).
   - The one thing a player can add is the hospital hardship (`health.request_hardship`).
7. **"Appeal Lost":** the branch is `upheld`, the plan keeping its denial. Papers' row says Denial Upheld for the same
   outcome. Nothing else reads the title (`grep -rn "Appeal Upheld" src tools` found only this line).
8. **"To book again at Fair Haven Community Health Care, press Book An Appointment …":** the practice named is
   `clinicFor(person, 'visit', item.at)`, the one `book` uses next. The words only moved.
9. **The injury bill's name:**
   - Only displays and ledger memos carry it. No code compares a bill's `what`: `grep -rn "\.what ===" src` finds an
     appointment's check for a specialist and other records' fields (an evaluation's limits, the work record), none of a
     bill's.
   - The tests that matched it by name now match the new one.

**Interactions read whole:**
- **An injury:** the injury notice, then Call In Sick on School (the line it names), then the care, then the bill on
  Papers, then the due date, then paid or the unpaid notice, then Pay It Off and its refusals.
  - Every step now says checking account, the bill's date and its button.
  - The person look's Mending line and the injury look (batch 1) say the same days and limits.
- **A doctor's appointment:** booked (the booking notice, Blocked), then missed ("To book again, press …"), then not
  seen at a members-only practice, then visited (A Doctor’s Visit, with the bill sentence), then Call It Off on an
  appointment that's gone.
- **A prescription filled:** the monthly fill (`fillMedicine`'s ledger line), then the extra supply's refusals, then the
  prescription that ran out and its renewal visit.
  - Each already says what blocks it and the way out, so they're kept.
- **Health cover chosen:** Enroll's reasons (`mayEnroll`, `marketplaceOpen`), then Apply For HUSKY D and its refusal,
  then the notice of noncompliance, then Request A Hardship Exception's refusals, then the decision (approved, denied,
  renewed, changed or ended), then Your Health Cover Ended.
  - The decision now uses the notice's own words, with "still".
  - "You met its work rules in …" reads the same in the renewal and the approval.

**Tests updated** (to the new words, as exactly as before; no title changed, none loosened; 61 lines, then 21 for the
unpaid notice and the bill's name):
- `tests/evidence-g01-life.test.ts`, `evidence-g02-life`, `evidence-g03-life`, `evidence-g05-life`, `evidence-g07-life`;
- `evidence2-b02`, `evidence2-b03`, `evidence3-lifepapers`, `evidence3-home`;
- `need-paths`, `defects4`, `defects-g8-4`;
- `remaining-09-hardship`, `remaining-09-journeys`, `remaining-health-billing`, `remaining-health-eligibility`;
- `scope-cover`, `scope-health`, `commands-kept`.

How they were changed:
- The script `b2tests.py` (in the session's notes, not kept) applied one exact pattern per sentence, literal or escaped
  as each assertion was written, and skipped test titles.
- Each changed line was read in the diff.
- `tests/evidence-g01-life.test.ts`'s negative assertion `not.toContain('Your share of its care')` became
  `not.toContain('You owe')`: the new opening of the same clause.

**Tool matchers:** none held these words (`grep` over `tools/` for each old phrase).

**Checks:**
- `npx vitest run` over the 26 files that hold these words:
  - The first run had 52 failures, all on the old words.
  - After the updates: 211 of 211, then 130 of 130, then 85 of 85 with `tests/claims`, `evidence-g04-life` and
    `leave`.
- `npx tsc -b --noEmit` 0.
- `npx eslint` over the four source files and 22 test files: 0.
- `title-case` 0, `label-sweep` 0, `plural-check` 0, `voice-check` 0, `tics` 0, `spelling` 0, `typos` 0.
- `text-inventory --check` 0, `doc-refs --check` 0, `deciders --check` 0.
- `guide-quotes --check` 1, on one quote alone, expected: `src/engine/content/guide/papers.ts:345` quotes "Your
  application waits on its notice: answer it by …", the old refusal of a second HUSKY D application. That's the papers
  area's file, so it's listed for the coordinator.

**Screens and renders:**
- `care-after-2.txt` (render-care.ts) shows the renewal's age and SNAP variants, Call It Off on an appointment that's
  gone, and Pay It Off with no checking account and with nothing entered.
- The notices in the scenario saves keep the words of the day they were written. So the new notice words were read in
  the tests that play each case, which assert them whole, and in that render.

## Batch 3: The World's Reference Data And The Engine's Own Messages

**Sources (70, about 30,380 words):** `src/engine/content/world-data.ts` (4), `geography.ts` (61);
`src/engine/core/invariants.ts` (1), `deciders.ts` (2), `rng.ts` (1), `performer.ts` (1). It's over the fifteen
thousand words a batch takes, but nearly all of it is one source: `COUNTRY_TABLE`, `REGION_TABLE` and `CITY_TABLE`,
each a GeoNames table kept as a single tab-separated string. A source can't be split, so it was read here, by the fields
a screen shows.

**Rewritten (3):** `geography.ts#city`, `#deriveCity` and `#loadCountryCities`.

**Retained (67):**
- **The gazetteer tables and the town counts,** read by the fields a screen shows:
  - `place.tsx` shows a country's name, capital (by its town's own name), continent, population and area.
  - It shows the currency name, title-cased (`titleCaseLabel`), and the calling code ("+44", or Not On File).
  - It shows the languages through `languageNames`.
  - The picker lists the towns and says "N towns and cities on record" (`LocationPicker.tsx`, `cityCount`).
  - Every currency name the table holds was listed. All are GeoNames' and kept, but Cambodia's "Riels" (defects.md, 5).
- **The 56 cities:** each named as the gazetteer spells it, with its time zone id, never shown, and its tags, which
  make Home's place line.
- **The continent names and the country aliases** a search matches.
- **The developer-facing messages:**
  - the ledger invariants, which only tests call (`grep -rn "breaches(" src` finds no caller outside it);
  - the deciders' startup errors and the random pick's empty-list errors, both thrown to a developer.
- **Actor and Actress,** the performer nouns a player chooses.

**What changed:**
- **The town list that can't be loaded** now says "you can only pick from the towns already listed" where it said "only
  the towns already listed can be picked". It's still the creation picker's error, with the same way out.
- **A city's note** had "administrative parentage" and "SLATE calibrations": jargon, and the word the glossary
  replaces with "estimated".
  - It now says "Its location, time zone, region and country are public reference data. Its costs are estimated."
  - For a derived city: "… estimated from its country and its population, not looked up."
  - No screen shows a city's note today (`grep -rn "\.note\b" src/ui` finds no city's), but the city carries it as the
    record of where its figures come from. It was cheap and safe to bring into the glossary's words.

**Meaning-sensitive changes:** none. The derived note's basis, country and population, is `deriveCity`'s own (it reads
both).

**Interactions read whole:**
- **Creation's location picker:** the country list (the gazetteer's names), then a country's town count, then its towns
  loading, then the error if they don't.
- **A place's look:** its sentence, then its tags, then its facts tiles. The look is the frame area's.
  - The tags read badly after "What it’s known for", where adjectives meet a noun frame.
  - The sentence is the frame area's to change, and the suggestion is in defects.md, 6.

**Tests and matchers updated:** none held these words (`grep` over `tests/` and `tools/`).

**Examples:** three pairs, one for each rewrite. Every other source in the batch was kept for the reason recorded, so
there are no more pairs that are true to make.

**Checks:**
- `npx eslint src/engine/content/geography.ts` and the render script: 0.
- `text-inventory --check` 0, `tics --check` 0, `voice-check --check` 0, `label-sweep` 0, `title-case --check` 0,
  `spelling` 0, `typos` 0, `doc-refs --check` 0, `deciders --check` 0, `npx vite-node tools/geo-check.mjs` 0.
- `guide-quotes --check` 1, on the one papers quote from batch 2 alone.
- The whole suite, the build and the text walk are below, under The Area's End.

**Renders:** `care-after-2.txt` (render-care.ts) shows the town list's error, played with a failing fetch, and Los
Angeles's and a derived city's notes.
