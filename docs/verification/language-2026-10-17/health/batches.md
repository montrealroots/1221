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

## Batch 2: Care, Cover, Bills, Appointments, Therapy And Injuries

**Sources (64):** `src/engine/systems/health.ts`, all 45 and two new ones (`#fluMeans`, `#dueWords`; `#BY_WORDS` is
`#byWords` now, its old status pruned from `baseline.json`); `src/engine/systems/appointments.ts` (6),
`therapy.ts` (3), `injury.ts` (5), `systems/clinics.ts` (2); `src/engine/content/geography.ts#loadCountryCities`.
34 Rewritten And Verified, 30 Reviewed And Retained (labels, ledger memos, calendar labels, care and program names,
real practices' names, and the refusals below that stay as they were), each with its evidence or reason in
`docs/text/statuses/health.json`. The rendered evidence for what no test asserts word for word is `render2.ts`, in this
folder, which plays throwaway lives (London, New York, Los Angeles, New Haven, Vancouver, Dublin) through the commands
and the clock; its output is `render-after-2.txt`. Nothing it does is saved.

**What changed.**
- **Every notice of care says what happened, what it means, and what to do.** A bill gives its due date (the bill's
  `dueAt`, in the zone Papers shows it in, so the notice and Papers' Due column agree) and what follows: "due on October
  28, 2026, when it's taken from your current account. If it can't be paid then, it becomes medical debt." A stay or an
  emergency says the classes it keeps you from are excused (only while enrolled). The flu, seen or not, says until when,
  that it has cost condition and energy, that Work Out waits, and, while enrolled, that Call In Sick excuses a day. A
  claim denied names the appeal's window and its button; an appeal won says you owe only your share; one upheld says
  the full bill stands; a bill gone unpaid says why it's debt now and that Pay It Off clears it.
- **Cover.** "You're uncovered" is "You have no health cover from …", and the notice ends on the next step, "Enroll on
  Papers, under Health Cover", where there is one. Out of status, no step is offered, because none exists. The
  notices of public cover (renewed, changed, ending, approved, denied, the notice of noncompliance) are sentences: the
  cause, then the consequence, then the way on, every date, amount, window and condition as before. "SLATE has public
  cover …" and "SLATE sells a dental plan …" are the player's obstacle now ("You can enroll … only while you live in
  …"). Open enrollment's dates are written as every other date the game writes ("October 23 to January 15").
- **How a month met the work rules** reads `PUBLIC_COVER.workEarnings` in the save's money ("with $580.00 or more of
  income"), where the figure had been typed into the words, and each way is said as a reason.
- **Injuries** say what they keep you from: "It takes 10 days to mend, and you can't work out until then." for a
  sprain, a pulled muscle or a back strain (`trainingRefusal`, limits body); "…, and you're laid up until then, kept
  from classes, work and training." for a broken bone or a concussion (`offWork`); nothing more for a cut or a knock,
  which limit nothing. The care is "your share", with the same date and consequence as every bill.
- **Therapy.** A course stopped by the end of Yale Health's cover says so, and that another therapist starts a new
  course; a lifted depression says its care and its toll on morale go; a course done says where to start another.
- **Appointments.** A missed visit, and one a members-only practice wouldn't see, name Book An Appointment. With no
  published wait, the refusal says there's nothing to book and that care comes when it's needed.
- **The city list** that fails to load says what it stops (only the towns already listed can be picked) and how to load
  it again; "This country's" because the picker shows it beside the country, which avoids "for United Kingdom".
- **Refusals** gained a subject and a next step where they were fragments ("Only a Connecticut hospital's bill." is
  "Only a Connecticut hospital's bill can be put in for its financial assistance.").

**Kept, and why.** Refusals whose words were already plain and which the papers guide quotes word for word stay as
they were (therapy's four, Pay It Off's, "It's been appealed.", "You have an appointment already.", the members-only
practice's, "Your application waits on its notice: …"), and so do "No such practice." and "No such appointment.", which
only a stale id can reach. **The booking notice** ("A doctor's
visit: booked at … for …, the wait where you live.") stays too: the papers guide quotes it whole in its example and
`tests/guide-examples-papers.test.ts` holds the two equal, and the guide is the papers area's. The rewrite it should have,
"…, the usual wait where you live. Be there then, or Call It Off on Papers, under Health Cover.", is with the
coordinator, to land with the quote. The first session had applied it; this one put it back (and the tests that had
been moved to it) when the guide's test held it.

**Meaning-sensitive changes, and how each was checked.**
- "when it's taken from your current account. If it can't be paid then, it becomes medical debt." `BILL_KIND`'s handler
  pays with `payFromCurrent` (the current account, its overdraft and any linked savings, all or none) and otherwise posts
  the bill to Owed For Medical Care. "If it can't be paid" leaves the overdraft and linked savings inside "paid", as the
  code does. Played both ways in tests/evidence-g05-life.test.ts (health.bill, paid and drained twins).
- The due date in `sim.zone`, as `PapersWorkspace` formats `dueAt`; London's visit reads February 25, 2026 in both
  (tests/evidence-g03-life.test.ts).
- "Classes you miss while you're there are excused." `inHospital` (a stay's three days, an emergency's median minutes)
  makes `offSick` true, which `school.ts` counts excused. Said only while `schoolEnded` is false: a withdrawn student's
  stay says nothing of classes (tests/remaining-09-hardship.test.ts, Home).
- The flu: "has cost you some condition and energy" (the toll is taken once, in `careFor`), "Work Out waits until it
  passes" (`lookAfterRefusal`: "Not with the flu"), "Call In Sick … excuses a day of classes" (`sickRefusal` takes the
  flu as reason enough; offered while enrolled, as the School screen's `enrolled`).
- "kept from classes, work and training": `offSick` includes `laidUp`; `laidUp` refuses rehearsals and evenings;
  `trainingRefusal` refuses a workout. "you can't work out until then": `trainingRefusal` for limits other than none.
- "A therapist outside Yale can start a new course with you": `health.therapy` begins a course of `THERAPY.sessions`;
  the sessions had stay had.
- "It no longer needs care, and it no longer takes from your morale": the lifted condition is deleted, so `keepUp` bills
  nothing for it and the week's `CHRONIC.untreated.moraleAWeek` stops.
- "A visit to renew it is booked." now depends on `book`'s result, where the old words said a doctor renews it either
  way. The other ending can't be reached today (only British Columbia's prescriptions run out, and Canada always gives
  a wait); it's kept as the fallback and said so in the source's status.
- "Each month without cover in California adds to California's Penalty For No Cover on your tax return": the months
  `uncoveredInCalifornia` counts become that line of the return (`taxreturn.ts`, `mandate`; Papers, Tax Returns).
- "the one hardship the game counts": the law's exceptions are more than a stay in hospital; the game models that one.
- "You owe only your share" (an appeal won): the bill becomes the denied share (`denied.share`), the player's, not the
  plan's.
- "You're out of status, so neither the marketplace nor Covered Connecticut will take you": no way back is named,
  because `mayEnroll` refuses both.

**Tests updated (assertions kept as exact as before, titles unchanged):** 36 files, 193 lines changed for 193, every
file's count of each matcher the same as before (checked by script), every regex as narrow (the Appeal Won regex's stop
escaped, as the old one's colon was literal): tests/carried, claims, clinics, commands-kept, costs, coverage-gaps-life,
defects-g8-13, defects-g8-4, defects-g8-5, defects-g8-6, defects3-50-70, defects4, evidence-g01-life (its negative
assertion moved to the new phrase, "Your share of its care", so it still says no cost is named), evidence-g02-life,
evidence-g03-life, evidence-g04-life, evidence-g05-life, evidence-g07-life, evidence-g09-life, evidence-g16-papers
(the papers area's), evidence-g30-ui, evidence2-b01, evidence2-b02, evidence2-b03, evidence2-b06, evidence3-lifepapers,
guide-examples-papers (the papers area's), need-paths, remaining-09-hardship, remaining-09-journeys,
remaining-health-billing, remaining-health-eligibility, safetynet, scope-cover, scope-health, whynot-papers. The first
session's mapping had also rewritten six historical comments in these files, which quote what the game said on their
day; they were put back. No tool matcher held these words (`tools/acceptance-ui.mjs`, `tools/playthroughs-ui.mjs`: none).

**The papers guide's quotes.** `src/engine/content/guide/papers.ts` is the papers area's. Line 375 was changed to the
new HUSKY D line (its test requires the quote to equal `mayEnroll`), as the coordinator kept it. These other quotes there
are now out of date against the health area's words and are left for the papers area and the coordinator: 315 (“You’re
uncovered from …”, “You can enroll in the marketplace until …”, and its paraphrase of the dropped-plan way back), 331
(“You’re enrolled.”, “You’re enrolled from …”), 333 (“…; you can enroll from …”), 334 (“Outside open enrollment, …”),
339 (the HUSKY D line), 340 (“Last month meets its work rules: Enroll gives it.”), 341 (“No notice of noncompliance waits
on an answer.”, “The thirty days to answer ended on …”, “No month it assessed, …, the hardship SLATE keeps.”), 342
(“It’s dropped: it ends on …”), 344 (“An appeal is filed within … days of the denial.”), 345 (the four financial
assistance refusals), 348 (“The year is …, which the bank can’t cover.”), 349 (“It’s England’s, for its prescription
charge.”), 426 and 457 (“It comes to more than the bank can cover.”), 453 (“No wait is published where you live; you’re
seen when it comes up.”), 454 (“Your doctor is in the town you live in.”), 456 (“A pharmacy’s own cash price is kept
only in America.”). Found by `quotes.py` in the session's scratchpad, which looks for each quoted phrase in the area's
code at the batch-1 commit and now.

**Checks.** `npx tsc -b --noEmit` 0; `npx eslint` on the 44 changed files and `render2.ts` 0; `title-case --check` 0,
`label-sweep` 0, `plural-check` 0, `voice-check --check` 0, `tics --check` 0, `spelling` 0, `typos` 0, `doc-refs
--check` 0, `deciders --check` 0; `text-inventory --check` 0 once the batch was marked and `--prune` removed
`#BY_WORDS`. Engine-speak: none in these files (`--speak`); 738 in all, as after batch 1. Tests: the 37 files that first
failed, 59 of 539 failing at the start of this session (the first session's rerun); then the 53 files that hold these
words, 16 of 821 failing, all of them dates and wordings this session set (the dates read from the run) or the
members-only line put back while the run was going; those 10 files again, 175 of 175, exit 0;
tests/remaining-health-billing.test.ts after the rebilling notice went back to one sentence, 7 of 7, exit 0.

**Screens read.** Papers, Health Cover (Your Doctor, Your Cover, The Marketplace, Your Conditions, Care And Its
Bills) and Home's notices, in the built app (The Built App, below). The labels the notices name (Book An Appointment,
Call It Off, Pay It Off, Appeal It, Let It Go, Keep It Up, Request A Hardship Exception, Enroll, Apply For Assistance,
Begin A Course Of 8, Drop The Plan) were found on `PapersWorkspace.tsx`, and Call In Sick on `SchoolWorkspace.tsx`.

## The Built App

`npm run build` exit 0 (the bundle's size warning only), served with `npx vite preview --port 4207 --strictPort` and
stopped by its process ids when done.

- **The text walk**, `tools/text-walk.mjs` at 1440 and 390 wide, on four scenario saves (brief, dir1, leave,
  withdraw): `after-1440/` and `after-390/`, 25 screens each, exit 0. The scenario saves hold their notices in the words
  of their day, so three more saves were played on today's code with `notice-saves.ts` (Los Angeles with a plan dropped,
  New Haven out of status on Covered Connecticut, Vancouver with a prescription run out) and walked the same way:
  `after-notices-1440/` and `after-notices-390/`, 20 screens each, exit 0. Home shows the new notices whole at both
  widths ("Your Health Cover Ended", "Your Public Cover Has Ended", "A Prescription Ran Out", "A Doctor's Visit" with
  its due date, "A Bad Knock"), and Papers, Health Cover shows the live refusals ("Yale Health covers you while you're
  at the School.", "You can enroll in public cover or the marketplace only while you live in …").
- **`tools/text-render-check.mjs`** on `after-1440` and `after-390`: 36,310 strings, 0 faults, exit 0. On the notice
  walks: 15,312 strings, 6 distinct faults, none in the health area's words: "Worth -$227" (Home's money line, the
  money area's), "eSavings" (RBC's product name, as RBC spells it) and "1 days" (Papers, Passport And ID, Canada's
  faster passport, the papers area's), each for the coordinator.
- **At 390 wide**, `overflow-390.mjs` (in this folder) opened Home and Papers, Health Cover on the three notice saves:
  no page wider than the screen, the notices wrap within their cards (`shot-390-home-notices.png`), and the tab strip
  scrolls sideways by design (Passport And ID and Permission To Work past the edge until scrolled). One wall of text,
  not the health area's to change: The Marketplace's paragraph runs 246 to 309 words at 390, because Papers sets
  `mayEnroll`'s sentence in front of its long explanation of the programs in one paragraph
  (`shot-390-papers-marketplace.png`). For the papers area and the coordinator: break the explanation off behind How
  This Works, or into its own paragraphs.

## Batch 3: The Gazetteer And The Internal Words (No Change)

**Sources (84):** `src/engine/content/world-data.ts` (4), `geography.ts` (60, all but `loadCountryCities`),
`core/invariants.ts`, `core/deciders.ts` (2), `core/rng.ts`, `core/performer.ts`, `content/carevisits.ts` (4),
`content/clinics.ts` (2), `content/injury.ts`, `content/body.ts` (3), `systems/body.ts` (2), `systems/mortality.ts` (3).
All Reviewed And Retained, each with its own reason in `docs/text/statuses/health.json`.

- **The gazetteer** keeps the world's names as their sources spell them (data rows, country aliases a player may type,
  timezone and currency tables). A screen shows one field at a time; nothing there is the game describing itself. Three
  stray spaces in the country table are a data fault, `defects.md` 7.
- **`core/invariants.ts`** can't reach a player: no file in `src` imports it (only tools and tests do).
  **`core/deciders.ts`** throws only at load for a malformed decider, which every test load and the gate's deciders check
  run first. **`core/rng.ts`** throws only for a pick from an empty list, which the code never asks; its one engine-speak
  hit, "weighted", is the function's own name.
- **The real providers** (pharmacy chains, practices, self-pay items) keep their own names; **the injuries' and the
  body's** names and units were already plain; **mortality's** system labels are filtered from the calendar, and its last
  notice ("A Life, Ended") is plain and invents nothing.
