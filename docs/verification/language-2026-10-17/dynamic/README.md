# Brief 14's Dynamic Cases: Sections 7 And 8

The one place that holds the brief's section 7 (“Make Dynamic Text Read Correctly”) and section 8 (“Handle Repetition
Through Context”) across the whole game, as tests a later change can't slip past: `tests/language-dynamic.test.ts`, from
the instructions in `../prompts/dynamic.md`, written before the work. The eight areas rewrote the words, each its own,
and each checked its templates' variants as it went; this reads them all again, in the variants, through the game.

## How Each Case Reads What It Printed

Every case runs a generator the game calls (a notice's handler, a refusal, a look, the advice) or draws a screen with
`renderToStaticMarkup` (Home, the Player Profile, School and its tabs, Papers, a bank panel), on a state the game made,
and asks two things:

- **The words are sound.** Each line is read with `tools/text-render-check.mjs`'s own rules, imported (`faultsIn`), not
  copied: no leaked value, no doubled punctuation or space, no space before a stop, no raw id, no lowercase word run
  into a capital, no doubled word, no plural the check knows disagreeing, no sentence starting in lowercase, no empty
  slot in a list, no timestamp, no money written oddly, no unbalanced bracket or quote. Beyond its list, three things
  are allowed here, each with why: a citation's “et al.,”, a source's whole web address (the check allows a domain),
  and Australia's eVisitor, a real name. The case adds three rules of its own: a notice or refusal ends whole (a stop,
  a question, a closing quote or bracket); a date is the game's form (“August 24, 2026”, never an ISO day, a slashed
  date, a year without its comma, or a day before its month); and a count's noun agrees with it, “1 rehearsal” and
  “of 1 class”, for nouns the check's own list doesn't name.
- **The meaning holds.** The number, the name, the date, the sum or the standing the variant carries is there, in the
  form the game shows it: a figure from the state (`formatDate` of the day, the account's balance, the classmate's
  record, the review's standing), not the sentence copied whole where other cross-area work is still changing words.
  Where a sentence is held whole, it's one this pass's areas have settled.

The render check's command line is unchanged: its rules are exported, and the command runs only when node is given the
file (`isMain`). Its output on four walks (`before/walk-1440`, `frame/after-390`, `school/after-1440`,
`money/after-1440`) was compared byte for byte with the version before the export: the same.

TEST SETUP is said where it's done: the day kept rested where only the words are measured, and a state no command
reaches in a test's time put on by hand (a classmate's record, an injury, sleep owed, a term's shown pieces, an
Incomplete's meetings). FIXTURE: journey J01 (`tools/journeys.ts`, attentive, papers kept, seed j13-1) played through the
game's commands alone, to the end of its first year (part 1, 1 June 2027) and to the end (part 4, 4 August 2029, the
degree conferred 21 May 2029), saved and gzipped as `tests/fixtures/journey-j01-year-one-8283f80c.json.gz` and
`journey-j01-degree-8283f80c.json.gz`. No field on those saves was set by hand; section 7's last bullet reads them.

The file runs in about 20 seconds (8 of them the tests themselves): 33 tests in 9 describes. It was run again on the
main tree's branch merged in (`961b3f08`, the journeys area and the injury's words): 33 of 33. Every other test file
that imports a source changed here (110 files, 1,673 tests) was run on the merged code: four failed where they held
the old words (`defects.md` lists them, and one comment's apostrophes from the merge), were updated, and passed, 97
of 97.

## The Cases

### 1. Singular and plural; zero, one and many

`describe('singular and plural: zero, one and many of each thing the game counts')`

| Test | Generators | Variants |
|---|---|---|
| rehearsals with a classmate: none yet, one, several, one more to lift a boundary, and missed by you | the classmate look (`looks/classmate.tsx`); the Coursework tab's Your Partners | asked 0, 1, 4; a boundary 1 and 4 rehearsals from lifting; missed by you 1 and 2 |
| the term’s coursework warning: the pieces still set, none, one or several, and the Unready ones, one or several | `termWarning` on six pieces set by `setWork` | set and unshown 0, 1, 2; Unready shown 1 and 3, with pieces missed and not |
| a course’s meetings and the term’s class days on the first day of classes, and make-up sessions owed, one or several | the Standing tab: attendance, Courses And The Degree | one class day, one meeting; one and three make-up sessions |
| days and hours: an injury’s days to mend, the sleep owed, and how far off something is | `trainingRefusal`; the person look's Sleep Debt; `formatRelative` | 1 and 6 days; 0, 1 and 5 hours; a day and an hour ahead, a day ago |
| notices unread, one, several and more than Home shows, and commitments slept through, one or several | Home's What Needs You; the notice look; `life.sleep`'s notice | 0, 1, 8 and 9 unread; one commitment and two |
| payments missed in a row and a payment plan’s months, one and several; documents held, none, one and several | the card panel (`BankCard`), its offers (`BankCardOffers`); Papers' Passport And ID | 2 and 5 missed; one month and four; no passport, one applied for, a passport and a visa |
| the advice’s counts: a cost of one point and several, and the pieces that call on an ability, one and several | `recommendations` (`systems/experience.ts`), as `adviceFor` calls it, on one judged piece's limits (TEST SETUP) and on a forecast | a preparation, a condition, stamina, a misfit and an ability at 1 and 2.5 points; 1 and 5 of 12 pieces, 1 of 1, 1 and 3 of the pieces |
| nights with the company and the calls and notes of a run, as the run looks back on them: none, one and several | `reflect` (`systems/production.ts`) | calls 0, 1, 5; notes 0, 1, 2; four nights, one slip |

### 2. Different names and pronouns

`describe('different names and pronouns: you, she, he, they, pronouns the game doesn’t know, and long names')`

- *somebody else is spoken of in their own pronouns on their look and their wellbeing, and you as you*: `spokenOf`
  through the person look and the dial look, for the player and for she/her, he/him, they/them and ze/zir (a set the
  game doesn't know, spoken of as they). Each: the look's kind, “Her body.”, “On her papers. Pronouns she/her.”, “where
  she lives”, “How ready she is today”, “Her Wellbeing”, “She’s caught up on sleep.”, “it wears on her mood”; and nobody
  but the player called “you”. TEST SETUP: the other people are copies of the player under their own ids, as an older
  build's family is held.
- *a long name with an apostrophe and a hyphen, the player’s and a partner’s, reaches each sentence whole*: the player
  Mary-Kate O'Sullivan-Featherstonehaugh through creation, on Home's greeting, the Profile and the person look; a
  partner named Anne-Marie D'Arcy-Fitzwilliam style (TEST SETUP: the class renamed before a partner is drawn) in the
  work-set notice, the partner note, `mateBusy`, `askRefusal` before the class has met and after a boundary, and the
  classmate look.
- *a teacher and a cast member are named as the school names them, in the term’s notes and the cast*:
  the year-one save's From Your Teachers lines, each “{teacher}, {course}: {note}” with its simulated-feedback label, and
  the Casting tab's Why This Cast, each student and part as `castRead` holds them.

### 3. Missing optional information

`describe('missing optional information: each part absent, and the sentence still whole')`

- *a partner and a reader*: the set-work notice for a solo piece (Voice I) and a paired one (Acting I); `noteText` on
  the partner part with no partner named, a partner and no reader, and a reader's evenings once and three times; a solo
  piece's note with no role.
- *a date not yet known*: the document look of a passport applied for, with its ready day and (TEST SETUP) without it
  (“soon”), then issued on its day.
- *a bank’s unpublished figure*: Citi's savings, opened beside a current account by `bank.open_current`: “No published
  rate was found for it, so it earns no interest in the game.”, beside Chase's published rate.
- *a document’s missing number*: an F-1 student's Social Security number, which the game never keeps: its status
  “Not yet” in the number's place, the refusal under the button (why and the next step), the same from the command.

### 4. Each academic standing

`describe('each academic standing: good standing, academic concern, academic warning, dismissed, and leave')`

- *the term review’s notice and the screens at good standing, then a concern, a warning and a dismissal*: `evaluate`
  run on three short terms (TEST SETUP: each term's attendance at 50%, under the 90% floor, the next term begun by hand
  where the clock would begin it). At each: the notice's title, the attendance it names, what a next short term would
  do (`shortTermWords`: warning, then dismissal) and what stands after a dismissal; the School screen's head (“Year 1
  of three, academic concern.”, “Left the School.”), the Standing tile, the Term Reviews row; Home's School line and its
  alert.
- *on leave: asked, decided and begun, the screens say until when, and the refusal before it says why*: a medical leave
  refused with nothing to recommend it, then asked (FIXTURE: the flu, as tests/defects-g10-1.test.ts gives it), refused
  again while pending with its decision date, decided and begun: “On leave until Fall Term 2027.”, “On Leave, good
  standing”.

### 5. Success, partial progress, failure and recovery

`describe('success, partial progress, failure and recovery')`

- *a piece shown Unready, Working and better*: Acting I's scene shown by `meetingWeight` (the class day's own
  reckoning) prepared to nothing, half and fully: the notice's band, what was well prepared (said as a list where any
  part was, absent where none was), the teacher's note, and the Coursework tab's card with the same band and words.
- *a note worked and the piece shown again*: the note's part worked (TEST SETUP) or left, and the piece shown again:
  “Note Taken: Scene Study … took the note on {part}. {Part} went from N% to M%. Shown again: {band}.”, and “Note Not
  Taken Yet … wasn’t taken yet. {Part} stayed at N%. … It stays open under Your Notes.”, with the Work Shown line.
- *an application refused for want of money, nothing charged, then made again*: a passport refused (TEST SETUP: every
  account's money spent), the balance unchanged, then made once the money is there for exactly the fee refused, and
  refused again while it's being decided.

### 6. Deadlines upcoming, due and missed

`describe('deadlines upcoming, due and missed: coursework, a document’s renewal, a tax return and a payment')`

- *coursework*: Due Soonest's line with its date and forecast; the piece's day passed without you: “Not Shown: Acting
  I”, what the review counts and the course's count, and the Work Shown line.
- *a passport’s renewal*: a London student's passport (TEST SETUP: its last day brought near, as journey F1's was) in
  force until its day, then run out: the look, the Passport tile, the row's Run Out and what replaces it.
- *a tax return*: the 1040-NR's question on 3 February (“That’s in 2 months.”), on its last morning, and after it
  closed; the return's Due line; “Your 2026 Return Is Late” with where to file.
- *a card payment*: the day's spending on the card (`bank.set_payments`), the next payment's date, the warning the day
  before that the account is short (TEST SETUP: the money spent), Home's “Card Payment Due”, and “A Late Card Payment”.

### 7. Positive, zero and negative balances

`describe('positive, zero and negative balances: an account, a card, a payment plan, and what’s owed')`

- *an account*: $1,234.56, nothing, and $41.10 overdrawn, on its look and on Home's Money line, and a worth below
  nothing.
- *a card*: owing nothing, owing $250.00, and holding $50.00 after `finance.pay_card` paid $300.00 on $250.00 owed.
- *a payment plan … and what’s owed*: a plan with $600 left and paid off; the Owed look with one debt, two (a second card
  by `card.apply`), and none (its gone words).
- *a tax return’s balance*: the London student's refund on the question and the return, the withholding with a minus
  sign, and (TEST SETUP) a year with nothing either way.

### 8. A new player, an advanced one and a finished school journey

`describe('a new player, an advanced one and a finished school journey: the Profile, the advice, Home and School')`

- *each screen at each stage says where the life stands, and every word of it is sound*: J01 at creation, after its
  first year and after its degree: Home's School line (“Arriving”, “Year 1, good standing … Next: Classes, August 30,
  2027”, “Graduated”), the Profile's School stat, the advice's empty words before any work, the School screen's head and
  tiles (This Term against Last Term), the year's two reviews and the teachers' notes, the degree conferred and no work
  set. Every line of all twelve screens read sound and dated.
- *the advice*: `adviceFor` at each stage: none at creation; after, every recommendation's words sound, whole, their
  counts agreeing, “N of your last M pieces” never more than the work, and the Profile showing the first.

### Section 8. Repetition

`describe('repetition: a note said before says so, a warning repeated says what changed and what’s open, a refusal met twice still says why')`

- *a teacher’s note on an unchanged weakness says it was said before, how often, and when; never as a new discovery*:
  a first fall left unprepared (to 10 October): every note the ledger calls recurring opens on when it was said before
  (“You had the same note in … on {day}”, “This is the {n}th time …”, “You’d put this right on …”), on that piece's day
  or one before it, with a correct ordinal; every new one doesn't. “Still There” no more than once a week a subject,
  with its count; the open piece's “A Note That Keeps Coming Back: {subject}, given {n} times.” as `persistentFor`
  counts it; `feedbackWords` better-not-there, slipped back, and the eleventh time.
- *a warning repeated says what changed and what’s still open*: an Incomplete's notice (three sessions), then a week
  before its deadline, after one session made up and after two: “2 make-up sessions still to do” and “One make-up
  session still to do”, the deadline the same.
- *a refusal met twice says the same why and the same next step, and changes nothing*: the Social Security number asked
  twice an hour apart before registration, and a medical leave asked twice two days apart: the same words each time,
  the obstacle and the step, no number, no leave and no charge.

## What Was Found

Fifteen variants read wrong and were fixed in their templates: `defects.md`, with each source, variant, what it read
and what it reads now. Thirteen were found in the first seven bullets and two in the advice's counts. Five more conditions are recorded there and left: the research data's own dates in fine print
(306 strings), a space before a semicolon in a card's source, “Left the school” against “Left the School.”, a duration
in prose as a clock writes it, and the advice naming its label twice.

## Mutations

Each mutation broke one variant in its source, ran the test that holds it (`-t` its title), and put the source back as
it read it: `mutate.py`, beside this file, which says how to run it. 28 were tried; each failed its test. M06 survived
the first run: the warning's “the one you showed” was reached by no case, the one Unready piece shown being short on
every part, so the warning named no part at all. The case now prepares that piece but for one part, and M06 fails it.
M16 was dropped before the run: the course-to-course line (“Up from Unready …”) it would have broken is reached by no
case here, a first piece having no last one, and the school area's tests hold it.

| Mutation | File | What it breaks | Test | What the test said |
|---|---|---|---|---|
| M01 | `src/ui/looks/classmate.tsx` | the classmate look counts one rehearsal in the plural again | failed | expected 'Came to 1 of 1 rehearsals with you; t…' to match /^Came to 1 of 1 rehearsal with you;/ |
| M02 | `src/ui/looks/classmate.tsx` | a boundary lifts after "1 more rehearsals" | failed | expected 'Marcus Rivera\nA Classmate\nCame to 3…' to contain 'Wants a day’s notice: that lifts afte…' |
| M03 | `src/ui/workspaces/SchoolWorkspace.tsx` | the Standing tab counts one class day in the plural | failed | expected 'School\nDavid Geffen School of Drama …' to match /Attendance counts 1 of 1 class day\b/ |
| M04 | `src/ui/workspaces/SchoolWorkspace.tsx` | one make-up session owed in the plural | failed | expected 'Acting I, Incomplete: 1 of 1 make-up …' to be 'Acting I, Incomplete: 1 of 1 make-up …' |
| M05 | `src/engine/systems/coursework.ts` | the warning says "1 pieces are set" | failed | expected 'So far this term, 3 of the 6 pieces d…' to contain 'One piece is set and still to be show…' |
| M06 | `src/engine/systems/coursework.ts` | the one Unready piece shown said as "N of the 1 you showed" | failed | expected 'So far this term, 3 of the 6 pieces d…' to match / What held most of them back was “[^”…/ |
| M07 | `src/engine/systems/life.ts` | one commitment slept through in the plural | failed | expected 'You Slept Through 1 Commitments' to be 'You Slept Through 1 Commitment' |
| M08 | `src/engine/systems/production.ts` | one call answered in the plural | failed | expected 'The Seagull: 1 calls answered of 1; 1…' to be 'The Seagull: 1 call answered of 1; 1 …' |
| M09 | `src/ui/looks/wellbeing.tsx` | a she/her person spoken of as they | failed | person_she: expected 'Maya Okafor\nSomebody\nRested, steady…' to contain 'Her body.' |
| M10 | `src/ui/looks/wellbeing.tsx` | the player spoken of in the third person | failed | person_000001: expected 'Ada Cole\nYourself\nRested, steady an…' to contain 'Your body.' |
| M11 | `src/engine/systems/coursework.ts` | no reader: the way to work without the partner left unsaid | failed | expected 'The two of you weren’t playing the sa…' to contain 'You and Noah hadn’t rehearsed togethe…' |
| M12 | `src/ui/looks/papers.tsx` | an application with no ready day says a date anyway | failed | expected 'You’ve applied, and it’s being decide…' to be 'You’ve applied, and it’s being decide…' |
| M13 | `src/ui/papers/Documents.tsx` | the entry rules day back to its ISO form | failed | expected 'Your Passport\nU.S. Department of Sta…' to contain '. Researched September 29, 2026. Perm…' |
| M14 | `src/engine/systems/school.ts` | a concern says the next short term would withhold the degree | failed | expected 'The chair of Acting has raised a conc…' to contain 'If your next term review finds you sh…' |
| M15 | `src/ui/workspaces/SchoolWorkspace.tsx` | the page head on a leave without its return | failed | expected 'MFA in Acting, class of 2030. On leav…' to be 'MFA in Acting, class of 2030. On leav…' |
| M17 | `src/engine/systems/coursework.ts` | a note not taken said as taken | failed | expected 'You showed Scene Study again on Septe…' to be 'You showed Scene Study again on Septe…' |
| M18 | `src/ui/workspaces/PapersWorkspace.tsx` | a return with nothing either way says Your Refund $0.00 | failed | expected 'Your Affairs\nPapers\nYour tax return…' to contain 'Nothing Owed Or Due Back\n$0.00' |
| M19 | `src/ui/looks/money.tsx` | a card holding your money says only that it owes nothing | failed | expected 'You owe nothing on it at Chase, and t…' to be 'You owe nothing on it at Chase, and i…' |
| M20 | `src/ui/screens/Home.tsx` | Home writes an overdrawn balance with a hyphen | failed | expected 'Money Chase Total Checking: -$41.10. …' to match /^Money Chase Total Checking: −\$41\.1…/ |
| M21 | `src/engine/systems/coursework.ts` | the third time said as "3th" | failed | expected 'th' to be 'rd' |
| M22 | `src/engine/systems/coursework.ts` | a note given again said as a new discovery | failed | The drills weren’t done enough: the new sounds slipped back under pressure. (Drills: 0% prepared.): expected null not to be null |
| M23 | `src/engine/systems/courserecord.ts` | the week-left reminder says what was owed, not what is left | failed | expected '3 make-up sessions still to do, by Oc…' to be '2 make-up sessions still to do, by Oc…' |
| M24 | `src/engine/systems/experience.ts` | the advice counts its pieces in the singular | failed | expected 'piece' to be 'pieces' |
| M25 | `src/ui/workspaces/SchoolWorkspace.tsx` | a graduate read as having left | failed | expected 'MFA in Acting, class of 2029. Left th…' to be 'MFA in Acting, class of 2029. Graduat…' |
| M26 | `src/engine/systems/leave.ts` | a pending leave refused without its date | failed | expected 'Your request is with the chair and th…' to be 'Your request is with the chair and th…' |
| M27 | `src/engine/systems/credit.ts` | a doubled stop in the late payment notice | failed | expected 'The minimum payment was $40.00, and o…' to match /^The minimum payment was \$\d+\.\d{2}…/ |
| M28 | `src/engine/systems/experience.ts` | a cost of exactly one point said as "1 points" | failed | expected 'Coming to your work short on lines co…' to contain 'Coming to your work short on lines co…' |
| M29 | `src/engine/systems/experience.ts` | "1 of your last 12 pieces call on it" | failed | expected '20 hours of its exercise, a session a…' to contain '(1 of your last 12 pieces calls on it)' |
