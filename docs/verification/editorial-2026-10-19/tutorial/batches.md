# The Tutorial Area's Batches

Brief 15, "Complete Natural-Language Editorial Pass, Including All Retained Text", the tutorial area: the guide's
seventeen chapters (`src/engine/content/tutorial.ts`), the guide's dialog and How This Works (`src/ui/guide/`), the
refusals in `src/engine/world/tutorial.ts`, and the contents' groups (`src/engine/content/guide/index.ts`). Worked in the
clone `scratchpad/e15-tutorial`, on `ed15-tutorial`, from the pass's baseline `6d111b49`. 47 sources, 10,929 words, all
Pending in the second pass at the start.

The before-and-after pairs are in `examples.json`, a sample of what was kept in `retained.md`, the defects in
`defects.md`, the renamed labels in `renames.json`, the words in `glossary.md`, and each chapter's route on the built app
in `routes.md`, from `follow.mjs` (its log and screens in `follow-1440/` and `follow-390/`).

Every check below was run from the clone, its exit read from a file. `checks.sh` in the scratchpad runs them in order:
`tsc -b --noEmit`, `eslint` on the batch's files, then title-case, label-sweep, plural-check, voice-check, tics,
spelling, typos, text-inventory, doc-refs, deciders and guide-quotes.

## Batch 1: The Guide's Dialog, How This Works, The Refusals And The Contents

**Sources (29):** `src/ui/guide/Guide.tsx`, 5 (`Gated`, `LockedPanel`, `GuideStrip`, `GuideButton`, `GuideDialog`);
`src/ui/guide/Help.tsx`, 11; `src/ui/guide/HowItWorks.tsx`, 1; `src/engine/world/tutorial.ts`, 2;
`src/engine/content/guide/index.ts`, 10 (`GOALS` and `SEARCH_EXAMPLES`).

**Rewritten (10):**
- `world/tutorial.ts#registerTutorial`: the working reference's example 8, “You started without the guide, so
  everything is already open.” The other three refusals there were already plain and stay.
- `Guide.tsx#GuideDialog`: what the dialog says once a chapter is read names the button beside it (“Press Try It to go
  and use it”) and where the guide opens next time; the last chapter's line leads with what to do (“To read any chapter
  again, press Guide at the top of the screen.”); What Reading It Opens is What It Opens.
- `Help.tsx#Contents`: “Everything is open on this life. The chapters are there to read in any order.” is “Everything
  is already open. You can read the chapters in any order.”, without the brief's “this life”.
- `Help.tsx#Entry`: the not-open callout is an instruction (“Read “…” in the guide to open it.”) beside its Read About
  It button; Fold It Up is Show Less, and the toggle lost its pressed state (`defects.md`, 1).
- `guide/index.ts#GOALS`: five groups' leads. Coursework And Partners had “the work your classes set” and “feedback”
  for the teacher's notes and left out Your Class; Productions And Casting left out How You’ll Play A Part; Your Craft
  said “a piece of work explained”; Money And The Bank ran out of its entries' order and left out savings and the
  account at home; Papers left out Residence Abroad.

**Kept (19), with reasons in their statuses and a sample in `retained.md`:** Locked; the locked panel's line, which
names the chapter and what the panel will hold; the strip (Guide · 2 Of 17, Read); Guide (N Left); the help's frame
(“The clock waits while you read.”, Back, Close, Search How This Works, its placeholder); How It Connects' six
headings; Contents and Search; Back To Help and Back To the screen left; the empty search's hint and the no-match line;
How This Works; four groups' leads that already named their entries in order; the two searches the hint suggests; and
the refusal for a part not yet open, which names the chapter, the one to read first and where Guide is.

**Meaning-sensitive:** none changes what a control does. The toggle's pressed state was removed: it's an accessibility
fix (`defects.md`, 1), and Show Everything still opens every section and Show Less folds them, which the new test
presses. The GOALS leads were each checked against the group's entries in their order (`entriesOf`, listed with
vite-node).

**Interactions read whole:** a locked panel on Home, its Read About It, the guide opened at that chapter, I’ve Read
It, the Opened page and Try It; a locked control's tooltip and the command's refusal (`lockedBecause`); How This Works
from a panel, ? for the contents, / for the search, a search that finds nothing, an entry not yet open with its
callout and Read About It, Show Everything and Show Less, Show Me Where and Back To Help.

**Tests updated, as exactly as before:** `tests/evidence-g02-life.test.ts` (the no-guide refusal; the contents' line on
a finished guide; What It Opens, present and absent), `tests/evidence-g29-ui.test.ts` (the no-guide refusal),
`tests/help-mechanics.test.ts` (Show Less; the not-open callout; It’s open now after each chapter; the last chapter's
line). **New:** `tests/help-mechanics.test.ts`, 'Show Everything and Show Less name what a press does, with no pressed
state'. No tool matcher named these words (`grep -rnF` over `tools/`).

**Checks:** `tsc` 0, `eslint` 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos
0, doc-refs 0, deciders 0, guide-quotes 0; text-inventory 1 until the batch's sources were marked, then only for the
next batch's Pending chapters. `vitest run` on `help-mechanics` (12 tests), then on `evidence-g02-life`, `evidence-g29-ui`,
`guide` and `tutorial` (81 tests): exit 0 each.

**Screens verified (built app, 1440 wide):** the guide's Opened page after each of the seventeen chapters and the last
chapter's line; the help's contents with every group's lead (`follow-1440/help-contents.txt`, screenshot
`02-help-contents.png`); the empty search's hint and the no-match line (`follow-1440/log.txt`, chapter welcome).

## Batch 2: The Guide's First Ten Chapters, Your Day

**Sources (11):** `src/engine/content/tutorial.ts`, `hoursOf` and the chapters Your Life, Hour By Hour; What’s
Coming; The Clock; Moving Time On; What Needs You; How You Are; Sleep; Looking After Yourself; Your Own Plans; and
Weather (`CHAPTERS [welcome]` to `[weather]`), about 2,300 words.

**Rewritten (10):** every chapter. The pattern, chapter by chapter: the first sentence is the first action and its
control (“Press Play, in the top bar, to start the clock”; “To jump ahead instead of waiting, press Advance”; “Press
Open Calendar … to see the whole month”); the engine as a subject went (“the world tells you things”, “a word stays
plain text until the chapter that opens it has been read”); each closing line says which chapter to read next and
why, as an instruction (“Read “Sleep” next, about how your energy comes back.”); and fragments became sentences (“the
top bar says until when”, “its climate, its season and that day’s luck”). Two leads changed: Sleep's “The night, and
what it gives back.” and Weather's “The sky over your town, …”. How You Are's age ceiling and traits moved behind The
Details: they're the figures, not the task.

**Kept (1):** `hoursOf`, which says “half an hour” for the Sleep dialog's shortest sleep and a plural count otherwise.

**Meaning-sensitive, and how each was checked:**
- **What’s Coming, Skip It.** The brief's example said school events have no Skip option. The code (`calendar.skip`
  takes only `PLAN_KIND`; `DueNow` shows Skip It only for `mine`) shows a doctor's appointment, therapy and an office
  visit have none either, so the chapter says only a plan of your own has Skip It, and you can't skip a class “or any
  other commitment”. Played: the clock stopped at Registration And Your Account with Go and Stand Here and no Skip It.
- **What’s Coming, what a commitment is.** It now names an appointment among them: `appointments.ts` schedules one
  with `requiresPlayer`, so the clock stops at it.
- **How You Are, condition.** The old sentence said condition came “after illness, injury and rest”. An injury moves
  stress and morale, not condition (`mayHurt`), so the sentence was wrong (`defects.md`, 2). It now names what wears
  condition down (illness, going hungry, heavy stress, short nights: `life.ts`, `health.ts`) and what mends it (a night
  of real rest, `applySleep`), as the glossary's row does. `tests/guide-chapter-facts.test.ts` measures an injury and
  fails a condition sentence that names injury while it changes nothing.
- **Moving Time On, the times.** “(ten)”, “(seven)” are “(10 p.m.)”, “(7 a.m.)”: the menu's own 10:00 PM and 7:00 AM.
- **What Needs You, Mark Read.** “Clears them from the panel”: the panel draws only unread notices, and Mark N Read
  marks them all (`Home.tsx`). Played: Mark 3 Read left All Clear.
- **Sleep, while at a commitment.** “The top bar says when you’ll be free”: `topbar-why` says “You’re at … until
  1:00 PM.” Played, at Meeting Your Class.

**Interactions read whole:** a new life's first screen, the guide opening by itself, a locked panel and its Read About
It, the links on Home's greeting line and in Where You Are; the Calendar panel, an entry's look, the stop's dialog and
its three buttons, On The Way, Choose An Event's Skip To Event; What Needs You and Mark Read; How You Are, Readiness and
its measures; the Sleep dialog and the grayed Sleep with its reason in the bar; the Look After Yourself menu and its
toast; the Calendar screen, a day, the plan form, Put It On, the plan's dialog and Call It Off; the Weather panel and its
look. Each against the chapter's words and the How This Works entry the frame area owns for it.

**Tests updated:** none held these chapters' old words. **New:** `tests/guide-chapter-facts.test.ts` (two tests).
**Tool matchers:** none named them (`grep -rnF` over `tools/` for each changed sentence's opening words).

**Checks:** `tsc` 0, `eslint` 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 1 then 0 (a new
sentence opened on “Nothing”, the tic's budget being 0 over; it now says “before you press it”), spelling 1 then 0
(“behaviour” in the new test's comment), typos 0, doc-refs 0, deciders 0, guide-quotes 0, text-inventory 0 for these
sources once marked. `vitest run` on `help-mechanics`, `guide-chapter-facts`, `defects-g1-1`, `tutorial`,
`guide-examples-start-day-body`, `evidence-g34-ui`, `evidence-g33-ui`, `evidence-g32-ui`, `language-data-dates` and
`guide`: 10 files, 167 tests, exit 0.

**Screens verified (built app, 1440 wide, `follow-1440/`):** each chapter read word for word in the guide dialog, its
details opened (`chapter-01-welcome.txt` to `chapter-10-weather.txt`), then followed: 208 checks, 0 failed, no page
errors (`log.txt`, `results.json`). Screens kept: `03-on-the-way.png`, `04-a-commitment-stops-the-clock.png`,
`05-sleep-dialog.png`, `06-sleep-grayed-at-a-commitment.png`, `07-look-after-menu.png`, `08-plan-call-it-off.png`.

## Batch 3: Drama School And You As An Actor

**Sources (2):** `CHAPTERS [school]` (18 paragraphs and 10 details, about 2,400 words) and `CHAPTERS [profile]` (14
and 5, about 1,600 words), the two longest chapters a student reads.

**Rewritten (2):**
- **Drama School.** The lead names what's there (“Classes, coursework, casting and your degree at Yale.”), since it
  shows on the locked School line and on the strip. Each paragraph starts with what to press or what happens; work-study
  comes before casting, as a first term meets them; the tuition paragraph went behind The Details. Call In Sick says
  what counts as unwell. Rehearsing With is named with its rule (a day and a time at least two hours ahead). Shown Today
  is “where it stands now … It’s a forecast, not a result”, not “its readiness”, the glossary's word for a wellbeing
  measure. “A grave breach” is “a serious breach”, “withheld” is “the faculty don’t recommend the degree”, and “its
  floors and its steps” is “the marks it asks for and its one-step drops”.
- **You As An Actor.** Each control by its label (Tier, Focus, Practice An Hour, Open Its Brief); the genre knowledge
  sentence names Familiarity and Work In It; the brief's paragraph tells a reading from a way of playing it; “finished
  work … as the work asks” and “each thing your work depends on” lost “the work”; “your own tape is yours” says what it
  means.

**Kept:** nothing in these two whole; individual sentences that already read well stayed word for word inside them
(“Four different things make you better …” lost only “and they aren’t the same”; “The note is the game’s, written as
your course’s teachers would say it.”, which `tests/remaining-school.test.ts` holds).

**Meaning-sensitive, and how each was checked:**
- **Call In Sick.** “You count as unwell with the flu, an injury that limits your work, or condition under 55” is
  `sickRefusal` (the 55 read from `ESTIMATE.sickBelow`). Played on the brief save: at nine on Monday, September 14,
  2026, the clock stopped at Classes, and Call In Sick was grayed with “Not now: You’re well enough to go. Staying away
  would count as an unexcused absence.”
- **Asking a partner.** The old “pick an evening they’re free” promised a check the picker doesn't make. The card's own
  rule is “an evening at least 2 hours ahead”, and the picker offers a Day and a Time. Played: Ask Jordan, “Jordan said
  yes.”
- **Casting.** The old sentence said every part was cast on “a voice and speech that carry and the body, and the
  classics and a fight where the play asks for them”. Each play has its own `reads` (`content/plays.ts`); the new one
  gives Shakespeare's and Macbeth's and Julius Caesar's. The weights paragraph was checked against `castScore`: the fit,
  a fifth of it scaled by the last run's delivery, and two points either way for the last part's size, which the
  chapter now calls “a little”.
- **The term review's estimate.** The new sentence keeps the estimate apart from the Bulletin, as the old one did;
  `tests/remaining-school.test.ts` asserts it exactly.
- **The degree.** “Before the degree is withheld” is “after that, the faculty don’t recommend the degree”: the
  `withheld` standing's label is Degree Not Recommended (`STANDING_LABEL`), and the glossary keeps “withheld” off screen.
- **The reader.** “Your own result is yours alone, whoever reads with you”: `systems/briefs.ts` keeps your take apart
  from the take with your reader.

**Interactions read whole:** the locked School line; the School line once open and its Yale button; the School screen's
six tabs, its links (the school, a course, a technique); Classes and Call In Sick, grayed with its reason; a piece on
Coursework, its parts, Shown Today, a step, Table Work, How You’ll Play It, Rehearsing With and Ask, Run It With A
Reader, Work It Through and a problem's ways; Plays To Read, Read It, Research It; Shifts And Pay and Take An Elective
Shift; Casting in a production's rehearsals (Why This Cast, Learn The Part, Catch Up The Blocking, Work On The Note, A
Night Now, The Evening’s Workload, Join The Summer Company); the Player Profile, an ability's look, the Practice column
and its exercise, Study It, Open Its Brief and the brief's pane.

**Tests updated:** `tests/remaining-school.test.ts` (the review's estimate, exactly), `tests/evidence-g33-ui.test.ts`
(the locked School line with the new lead). **Tool matchers:** none named these words.

**Checks:** `tsc` 0, `eslint` 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0 (one “it is now” in the
first draft, which `--fix` would have made “it’s now”; the sentence was turned round), tics 0 (one “, which is” tacked
on in the casting paragraph, turned into “meaning”), spelling 0, typos 0, doc-refs 0, deciders 0, guide-quotes 0 (580
quoted sentences, all said), text-inventory 0 once marked. `vitest run` on `evidence-g33-ui`, `help-mechanics`,
`tutorial`, `evidence-g34-ui`, `evidence-g31-ui`, `guide-examples-craft`, `defects-r8-1`, `defects-g3-1`,
`defects-g2-1`, `evidence2-b13` and `guide`: 11 files, 150 tests, exit 0; `remaining-school`: 33 tests, exit 0.

**Screens verified:** `follow-1440/` (a new life, 228 checks, 0 failed: both chapters word for word, then the School
line, the Yale button, the tabs, the links, Take An Elective Shift, the Player Profile and its practice, Study It, Open
Its Brief; `10-a-practice-brief.png`) and `follow-saves/` (29 checks, 0 failed: `brief.json` for Call In Sick, a step,
Ask Jordan, Work It Through, Plays To Read, What To Work On Next and a brief in progress; `rehearsal.json` for Casting;
screenshots `asked-a-partner`, `work-it-through`, `call-in-sick`, `a-brief-in-progress`, `casting-a-production`).

## Batch 4: Papers, Passports, Money, The Bank And A Whole Life

**Sources (5, and one again):** `CHAPTERS [papers]`, `[documents]`, `[money]`, `[bank]` and `[life]`, about 5,500
words, 3,900 of them behind The Details. And `CHAPTERS [calendar]` again, from batch 2, at the coordinator's word.

**Rewritten (5):** every one. The figures and conditions stayed behind The Details; each paragraph there lost its
semicolon chains and dangling possessives (“A UK tax year’s is settled on its own”), and said its estimates as
estimates. In the bodies:
- **Cover, Benefits And Returns.** The doctor's paragraph says the game books the visit, and Book An Appointment books
  one missed again (`defects.md`, 3). A bill is taken from the checking account on its due date, and only what can't be
  becomes medical debt. Enrolling “isn’t the same as being covered”. Unemployment says a Connecticut student's claim
  waits until school ends, and names SNAP, which the chapter opens. Your Conditions is Your Long-Term Conditions, the
  papers area's rename, at its word. The names under What It Opens were a list of 25 labels in no order, two of them
  fragments (“Apply For”, “Pay”); they're 13 lines in the chapter's order.
- **Passports And ID.** Apply Faster is “Apply Faster or Renew It Faster”, as a passport holder sees it; applying “only
  starts it”; “in SLATE” is “in the game”; Going Abroad's fragments are a sentence; the names are in order.
- **Money.** “Current account” is “primary checking account”; the credit paragraph says credit score for what a bank
  approves and prices by, as the glossary does, and credit record for what a late payment goes on.
- **Your Bank.** Every “current account” in prose is a checking account (the label Savings Covers The Current Account
  stays: it's the money area's, being renamed). Move Money names its button, Move It. Alerts names Short For A Payment,
  the alert that's on from the start, which the chapter had left out. The cooling-off rules are said the right way
  round (“in Canada anything but a card”).
- **A Whole Life.** The chance of a year being the last says what it's a chance of; the closing line is the guide
  dialog's.
- **What’s Coming, again.** The frame area merged its stop dialog as “You can only skip a plan of your own, so there’s
  no Skip It button here.”; the chapter now says the same: “You can only skip a plan of your own, so there’s no Skip It
  button for a class or an appointment. Press Go, or Stand Here to wait.”

**Meaning-sensitive, and how each was checked:**
- **The doctor.** `health.book` refuses with no visit owed; Health Cover draws Book An Appointment only for
  `owedVisit`; `systems/health.ts` books a visit for an illness week or a review. `tests/guide-chapter-facts.test.ts`
  holds the chapter to it. Played: a new life's Health Cover has Your Doctor and no Book An Appointment.
- **A bill's due date.** `payFromCurrent`, as the glossary's due on row says.
- **Unemployment.** The tab's own words, “Connecticut treats a full-time student as not available for work (CGS
  31-235(b)), so a claim pays only once you’ve left school”, and File A Claim is drawn only when not `studying`.
- **Alerts.** `AlertsView`: Any Current Account Under, A Payment Over, Statement Ready, Short For A Payment (on unless
  turned off, for a payment due in the next few days).
- **Credit score and record.** No rule changed: the glossary row's split, applied.
- **The bank's details.** “The card’s rate is set by your record” became “your credit score sets the rate”, the same
  figure; “in Canada no card” is “anything but a card”, the same rule.

**Interactions read whole:** the locked Papers and Money lines, the lines once open, their buttons; Papers' five tabs;
Health Cover's Your Cover, Your Doctor, The Marketplace, Your Conditions and Care And Its Bills, and what How This Works'
doctor entry says; Unemployment's SNAP and claim; Passport And ID's passport, ID, Report Lost, Going Abroad; Permission To
Work's OPT and Residence Abroad; the net worth look; the bank's five tabs, Move Money, Cards, How You Pay, Statements,
The Year and Alerts; your own page from Home and from How You Are.

**Tests updated:** `tests/language-data-dates.test.ts` (the UK tax year's sentence, exactly). **New:**
`tests/guide-chapter-facts.test.ts`, 'Cover, Benefits And Returns on Book An Appointment' (two tests). The chapter's
tests on Statements, Move Money, help with payments (`defects-g22-1`), Report Lost and a lost license
(`defects-g27-1`) and the Money line (`defects-g12-1`) pass on the new words unchanged. **Tool matchers:** none named
these words.

**Checks:** `tsc` 0, `eslint` 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0, spelling 0, typos
0, doc-refs 0, deciders 0, guide-quotes 0; text-inventory 1 at first for engine-speak (“draws on” rose to 4 of 3: “Autopay
also draws on easy-access savings”, now “takes from”, the old word), then 0 once marked. `vitest run` on
`defects-g22-1`, `defects-g27-1`, `defects-g12-1`, `guide-examples-papers`, `language-data-dates`,
`guide-chapter-facts`, `help-mechanics`, `tutorial`, `evidence-g34-ui`, `evidence-g31-ui`, `evidence-g02-life`,
`evidence-g29-ui`, `trace-commands`, `guide-examples-start-day-body`, `defects-g1-1` and `guide`: 16 files, 192 tests,
exit 0.

**Screens verified:** `follow-1440/` and `follow-390/` (a new life, 252 checks each, 0 failed, no page errors): all
seventeen chapters word for word, then chapters 13 to 17's routes, Papers' tabs and Health Cover, Unemployment, Passport
And ID, the net worth look, the bank's tabs, Move Money, Statements, your own page (`11-health-cover.png`,
`12-passport-and-id.png`, `14-bank-statements.png`, `15-your-own-page.png`); `follow-saves/` (33 checks, 0 failed: a
life with asthma, Let It Go and Keep It Up, `your-conditions.png`). At 390 the chapters read without clipping, in a
small window (`defects.md`, Not Mine), and the new life's top bar breaks Locked letter by letter
(`phone/first-screen-390.png`).

## After Batch 4: Three Sentences Read Again, And The Area's Final Checks

**Read again (2 sources, re-marked):** proofreading the last chapters as a player read them, three sentences still
read like a form. In Cover, Benefits And Returns, “SNAP … is food assistance on an EBT card for groceries, and Apply
applies for it.” is “SNAP, on the same tab, puts food assistance on an EBT card for groceries; press its Apply button to
ask for it.”, and “Reporting a document lost opens with the next chapter.” is “Report Lost itself opens with the next
chapter.” In Money, “with what you owe when there’s anything” is “and, if you owe anything, how much.”
`tests/defects-g12-1.test.ts` still holds the Money line's sentence to naming neither the card nor the record.

**The second pass:** every one of the area's 47 sources has a second-pass status: 26 Rewritten, 21 Retained, 0 Pending,
0 Blocked (`node tools/text-inventory.mjs`). The area's engine-speak is 0, as it was at the start.

**The built app, once more, on the last commit's build** (`routes.md`, The Final Runs): `follow.mjs` at 1440 (251
checks) and 390 (252), `follow-saves.mjs` (31), none failed, no page errors; the text walk of five saves at both widths
and `text-render-check.mjs`, 45,122 strings, 0 faults; `tutorial-routes.mjs`, 4 labels nowhere on this build, one of
them this area's at the papers area's word.

**Checks on the last commit:** `tsc` 0, `eslint` 0, title-case 0, label-sweep 0, plural-check 0, voice-check 0, tics 0,
spelling 0, typos 0, text-inventory 0, doc-refs 0, deciders 0, guide-quotes 0. `vitest run` on `defects-g12-1`,
`help-mechanics`, `guide-chapter-facts`, `language-data-dates` and `defects-g27-1`: 35 tests, exit 0. The whole suite:
below.
