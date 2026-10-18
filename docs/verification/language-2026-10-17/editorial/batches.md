# The Editorial Review: Batches

Brief 14, section 9's editorial review, 2026-10-17 into 2026-10-18. The eight areas read their own words and the
integration's passes what crosses them; this read the finished game as a player meets it, screen after screen, and the
notices a played life is given, against `docs/STYLE.md` ("Talking to the player") and `docs/GLOSSARY.md`, and fixed
what fell short. Worked in the clone `scratchpad/l14-editorial`, on `l14-editorial`, from `c74a02e1`. What was read, and
how, is in `README.md`; each batch below is a part of the game, as the areas' records are. Its before-and-after pairs
are in `examples.json`, in this file's batch order.

## Batch 1: A Refusal For Money That Isn't There, In One Shape (Money, Papers, Health, School)

The item the coordinator's list left open (`../coordinator.md`, Open): a refusal for money that isn't there had three
shapes, four with the school's. Papers said “Your bank can’t cover $…, so nothing was charged.” (or paid, or changed).
Health said “It costs …, more than your bank can cover.”, “The year costs …, more than your bank can cover.” and, for
Fill A Longer Supply, “It costs more than your bank can cover.” with no amount at all. Money said “… only has $… in
it.”, with the cents dropped, of the account the player chose. The school's protective equipment said “It costs $150.00,
and your bank can’t cover it. You haven’t been charged.”, and a medical bill “… holds … of the …: move money into it
first, on your bank’s Move Money.”

**The decision.** One shape: what can't pay, the amount, and, once the player has pressed something, what didn't
happen; then the next step where there's one. Papers' was already it, so its fifteen refusals were kept as they were.
Two variants, each because its context needs it, and said in `docs/STYLE.md` (Errors and unavailable actions) and the
glossary's row:
- **The player chose the account and the amount** (Move Money, an opening deposit, a term deposit, a medical debt
  paid from an account, cash out of a machine): the figure that helps is what the account has, not the amount they
  typed back at them. “Chase Total Checking has only $40.50, so nothing was moved.” With nothing in it, “… has nothing
  in it, so nothing was moved.”, never “has only $0.00”.
- **A reason shown before anything is pressed** (a state plan's down payment, cash out of a machine, the Yale
  account): it names the amount and not what didn't happen, since nothing was tried. “Your bank can’t cover the $500.00
  down payment.” These are the same functions the commands throw, so the words are the same pressed or not, and they
  never claim a charge was stopped.
- **“You can’t afford it.”** (`spendRefusal`, a meal or the day's groceries) was kept: it's shown beside an item whose
  price is in the same line, before it's pressed; adding the price repeats it, and “so nothing was bought” would say
  something was tried. Its constant is compared by identity in the groceries notice, which is unaffected.

**The sources (24, in 11 files):**
- `systems/health.ts`: `health.extra_supply` (now names the whole order's price, “Your bank can’t cover $125.37 for
  every condition’s fill, so nothing was filled or charged.”, from an `asked` total `fillMedicine` keeps as it prices
  each fill, which changes no fill and no charge), `health.prepay`, `health.dental` (the year, and the first month),
  `health.pay_bill` (“… has only $50.00 of the $100.00, so nothing was paid. Move money into it first, on your bank’s
  Move Money.”).
- `systems/school.ts` `school.buy_ppe`; `systems/leave.ts` `bankShortWords` (the Yale account and Affiliate cover:
  “… can cover only $45,217.00 of it now. Pay that or less, or move money into your current account first.”, and “…
  can’t cover any of it.”).
- `systems/banking.ts` `bank.transfer`, `systems/bankmoves.ts` `bank.open_current`, `systems/lending.ts`
  `bank.open_term` and `bank.repay_loan` (which now names the repayment account and the payoff to the cent, “Citi Access
  Checking can’t cover the $3,016.83 it takes to pay it off, so nothing was paid.”, where it said “$3,017” and “the
  repayment account”), `systems/cash.ts` `withdrawalQuote`, the new `shortWords`, and `cash.deposit`.
- `systems/statetax.ts`: “$… down” became “the $… down payment”, in the reason and the command.
- The guide's quotes of them: `guide/money.ts` (four entries), `guide/papers.ts` (two), `guide/school.ts` (three).

**Meaning-sensitive changes, and how each was checked:**
- **The cents.** Money's refusals dropped them (`{ cents: false }`), so an account holding $40.75 refused a $40.80 move
  saying it “only has $41”. Each now shows the ledger's figure to the cent, as `docs/STYLE.md` asks where cents matter.
- **A withdrawal refused for its fees** said only “… only has $101.00 in it.” of $100.00 asked. It now says what the
  cash and its fees come to: “… has only $20.01, and $20.00 in cash with its fees comes to $26.22.” The fees are the
  quote's own (`fee` and the machine owner's charge); the test reads them from the quote that went through.
- **Fill A Longer Supply's figure** is the sum of what each condition's fill was priced at as the loop met it, paid or
  not. The command still throws, and the rollback leaves nothing filled or charged (tests below). A test holds the
  figure to the fill's own price, `medicineShareOf × fillsCharged`, and a mutation that stops the sum fails it.
- **Paying in cash**: “You have $60.00 in cash.” answered both a typed nothing and more than the wallet holds. Split:
  “Enter how much cash to pay in.” and “You have only $60.00 in cash, so nothing was paid in.” The same requests are
  refused as before.

**Tests updated to the new words, as exactly as before:** `tests/evidence-g12-money.test.ts`,
`evidence-g14-money.test.ts`, `language-money.test.ts`, `home-account-abroad.test.ts`, `home-account-transfers.test.ts`,
`remaining-banking.test.ts`, `evidence-g10-money.test.ts`, `evidence-g11-money.test.ts`, `defects-r3b-1.test.ts`,
`bank-moves.test.ts`, `school-everyday.test.ts`, `evidence-g03-life.test.ts`, `evidence-g25-school.test.ts`,
`evidence-g26-school.test.ts`, `commands-kept.test.ts`, `defects-g8-5.test.ts` (with a new assertion that its $125.37 is
the fill's price). **New:** `tests/editorial-money-refusals.test.ts`, the variants no test reached: England's
prescription prepayment, a monthly dental plan's first month, a medical debt part covered, a withdrawal pushed over by
its fees and with nothing in the account, and the District's down payment from the reason and from the command.
Mutations: dropping the fees clause fails it; stopping the fill's sum fails `defects-g8-5`.

**Tool matchers:** `tools/acceptance-ui.mjs` (the transfer refusal: `has only|has nothing|holds|can’t|more than`);
`tools/playthroughs-ui.mjs` (the banking journey's refusal now names the account's figure to the cent, and the From
list gives whole dollars, so the two are compared within a dollar). The latter's lint errors (a wall-clock read, two
unused names) were there before and are outside the gate's `.ts,.tsx` lint.

**Checks** (`b1` below; each exit read from its file): `npx tsc -b --noEmit` 0; `npx eslint` on the 28 changed files 0;
`title-case` 0, `label-sweep` 0, `plural-check` 0, `voice-check --check` 0, `tics --check` 0, `spelling` 0, `typos` 0,
`text-inventory --check` 0, `doc-refs --check` 0, `deciders --check` 0, `guide-quotes --check` 0 (581 of 581). The
16 test files above and `editorial-money-refusals`: 261 of 261 and 4 of 4; the guide's and the neighbouring files
(`cash`, `guide-examples-money`, `-papers`, `-school`, `guide`, `help-mechanics`, `integration-home-lending`,
`language-crossarea`, `language-dynamic`, `leave`, `lending`, `liens-and-arrangements`, `tutorial`,
`coverage-gaps-life`, `whynot-papers`, `commands-kept`): 205 of 205 once `commands-kept`'s pattern was brought to the new
words.

**Statuses:** the 24 sources Rewritten And Verified, each `--by` its owning area (money 11, health 4, papers 4, school
5), with the test and title that holds its words.

## Batch 2: The School's Words, One Name For Each Thing (Coursework, Notes, Classmates)

Read in the notices journey J01 is given across its degree (`tools/journeys.ts`, played again on `c74a02e1`: 798
notices kept by its two saves, the same words as the dynamic cases' fixtures but for an injury's two new lines), the
scenario saves written again on today's code (3,251 notices), and the Coursework tab of the walk. Five faults ran through
the school's own words:

- **One part, two names (Wrong).** A piece's card names its parts by the course's work (“The Presentation Prepared”,
  “Written Up”, “Drills”, “Played Through”, “Daily Practice”), and the forecast beside them and the teacher's note named
  the part the task's way (“The revision”, “Rehearsal”, “Making your choices”). So A Play In Its Context said “Still to
  finish: the presentation prepared (Prepare The Presentation)” and, in the line above, “The revision isn’t complete”,
  of a piece not yet shown and so with no revision possible; a voice sequence's note said “Rehearsal wasn’t complete”
  where its card has no part called Rehearsal. `withPartLabels` names each preparation limit by its card's label, in the
  Shown Today line, the teacher's note on a piece that didn't come together, and Work It Through's problems. Only the
  label changes; the evaluation, its figures and its saved records are as they were. “Drills wasn’t complete, which cost
  Execution 20.2 points.” now agrees with the warning's “What held most of them back was “Drills””.
- **A part's name lowercased into a sentence (Mechanics).** “the note on with your partner wasn’t taken yet”, “You took
  the earlier note on drilled with your partner”, “on built on”, “Still to finish: played together (…); built on (…)”.
  Each part is named as its card names it, as “Put With Your Partner first” already did: “the note on With Your Partner
  isn’t taken yet”, “You took the earlier note on Built On”, “Still to finish: Played Together (…)”. A Table Work
  question is said as a sentence names it (`questionWords`): “Priya reads the given circumstances in Julius Caesar another
  way”, where it read “reads given circumstances”; “the note on the choice to play”.
- **A skill lowercased into a sentence (Mechanics).** “Your on camera and scene study carried it.”, “Your speech, and
  accents and dialects carried it.”, “It asked for more clown and mask than you have yet.” `SKILL_WORDS` (content/school.ts)
  gives each skill the glossary's words after “your”: on-camera work, clowning, voice-over work, comic timing, classical
  text work, intimacy work, and the rest as they were. Where one has an “and” in it, each takes its “your”: “Your speech
  and your accents and dialects carried it.”
- **A note taken that read as not taken (Wrong).** A note on a part counts as taken when the part rises enough, crosses
  three quarters, or is worked into the revision (`noteTaken`). By the third, “You showed Heightened Text Scene again
  on October 31, 2028, and took the note on rehearsal. Rehearsal stayed at 0%.” It says what happened now: “… and worked
  the note on Rehearsal into the revision. Rehearsal stayed at 0%.” Chosen by the figures the notice already prints, the
  part no further on; the rule is unchanged.
- **Smaller ones.** “the next step you were given didn’t show yet” → “doesn’t show in it yet”; “wasn’t taken yet” →
  “isn’t taken yet”. A classmate's “Run Lines Together?” read “on October 28, 2028 at 7:00 PM, an hour.” → “for an hour on
  October 28, 2028 at 7:00 PM.” “Caleb: Asks For Help”, the one moment titled as a verb, → “Caleb: A Request For Help”,
  as “A Different Reading” and “A Word After Class” are. “It helped them, and nothing of yours moved.” → “It helped them,
  but it didn’t move your own work.”, and the line under Run Lines Together? likewise. A scene's place mid-sentence read
  “What We Keep, Their late father’s apartment” and “The Bacchae, Before the castle of Pentheus”: `whereWords`, which
  lowered only a leading “The”, lowers the common words a place opens on (The, A, An, Their, Before and the like) and
  leaves an act, a scene, an episode and a name alone.

**Kept, and why:** a classmate is “they” throughout: the game keeps no pronouns for classmates (`Classmate` has a name and
a performer's title), so “they” is the only true word. A role named “Bottom, As Pyramus” is a character's name in the
play's data, read in tables in Title Case; it stays (Left, `defects.md`).

**Meaning-sensitive changes, and how each was checked:** the part labels change only names, which `withPartLabels` takes
from the template the card reads (`tests/editorial-school-words.test.ts` holds that an ability's limit and a part the
card doesn't have keep theirs). The revision wording is chosen from the figures the notice prints (`to <= from`), which
are what `noteTaken`'s third way leaves; the first two ways raise the part, so they still say “took the note”. Played
through J01's four parts on this code, every changed sentence is in `b2-rendered.txt` (88), and the journey's ten checks
passed in each part as on `c74a02e1`.

**Tests updated:** `tests/language-dynamic.test.ts` (the note taken and not taken, exact), `tests/feedback.test.ts`
(“You took the earlier note on Lines”), `tests/evidence-g18-school.test.ts` and `tests/evidence-g24-school.test.ts` (a
choice note, by `questionWords`; g18 gained an import line, and `tools/coverage.mjs --check` still holds every cited
line), `tests/student-experience.test.ts`. **New:** `tests/editorial-school-words.test.ts`.

**Checks:** `tsc` 0, `eslint` on the changed files 0, the eleven language checks 0 and `guide-quotes` 0 (581 of 581);
35 school test files, 476 of 476; `editorial-school-words` 4 of 4; `traceability`, `devmap --check` and `coverage
--check` 0. **Statuses:** 7 sources Rewritten And Verified `--by school` (`SKILL_WORDS` new).

## Batch 3: Productions, Looking Back And The Parts The School Casts By Size

**Looking Back** (`production.ts` `reflect`), the notice each run's closing sends and the line its panel keeps, was a
ledger in semicolons: “Major Barbara: 12 calls answered of 12; 4 of 5 notes taken, 3 answered in the work, 1 worked and
learned from without moving it; the dress solid. With the company the nights came to 55 on average. What’s still open
goes with you into class. (Simulated: the game’s reading of the process.)” A run with no notes said “0 of 0 notes
taken”, and “the dress solid” and “the dress off” were fragments. Now sentences, each count in its own variant:
“Major Barbara: you answered all 12 calls. The director gave you 5 notes. You took 4, 3 of them answered in the work,
and worked on 1 that didn’t move. The dress rehearsal was solid. With the company, your nights averaged 55 out of 100.
What’s still open goes with you into class. (Simulated: the game’s summary, not the director’s words.)” Calls: all, some,
none, one; notes: none (“The director gave you no notes.”), one (taken, not taken, worked without moving), several;
the dress: an off night, solid, strong, remarkable; slips by others: one, several, covered all or some. The panel's
label reads the same (`RehearsalProcess.tsx`).

**Meaning-sensitive:** the counts are the same counts (`calls`, `of`, notes given with `taken` set, `taken`, craft notes
taken as “answered in the work”, notes `learned`). Read in the code before writing: a learned note is never a taken one
(`notesShare` counts a note taken whole or learned in part), so “worked on 1 that didn’t move” is one of the notes given
and not taken, as “4 of 5 … 1 worked and learned from” meant. “out of 100” is the scale every night's result is on.

**Parts cast by size.** The School casts a student into a part by its size where there's no named role: “A Leading Part
In A New Play”, “An Understudy In The Company”, “A Part In A Cabaret Show”. In a sentence they read as names: “From the
class with you: Chloe Tanaka as A Leading Part In A New Play; …”, and the director's note “You covered An Understudy In
The Company on call through the run and didn’t go on.” `partWords` says such a part in lower case (the Cabaret keeping its
capital), and the Casting tab now reads “Chloe Tanaka, a leading part in a new play”; the director's note “You were on
call to cover the company through the run, and didn’t go on.”

**Left, with why:** the casting notice itself still says “has cast you as A Leading Part In A New Play in the Carlotta
Festival Of New Plays”. `redateCredits` (school.ts) dates an old save's credits by finding each credit's part in its
casting notice word for word, so the notice's part is a key the code reads back; `defects.md` names it for the owner.

**Tests updated:** `tests/language-dynamic.test.ts` (three Looking Backs, exact), `tests/evidence-g19-school.test.ts`
(the festival's, built from the run's counts as before; one line became two, and `coverage --check` still holds every
cited line). **New:** `partWords` in `tests/editorial-school-words.test.ts`. Played: J01's four parts on this code, every
Looking Back and Director's Note in `b3-rendered.txt`, the ten checks passing.

**Checks:** `tsc` 0, `eslint` 0, the eleven language checks 0, `guide-quotes` 0, `traceability` 0, `devmap --check` 0;
six test files (language-dynamic, evidence-g19, -g21, remaining-school, credits-dated, casting) 130 of 130, and
`editorial-school-words` 5 of 5. **Statuses:** 4 sources Rewritten And Verified `--by school`.

## Batch 4: Home, The Player Profile, Standing And Terms

Read on the walk's Home, Player Profile and School screens, fourteen saves at 1440 and 390:

- **Home's Money line said the wrong thing (Wrong).** “Worth $4,851, $149 of it owed.” Worth is what you have less
  what you owe (`netWorth`: cash, held and pensions, less liabilities), so the $149 isn't part of the $4,851: it's
  already been taken off. Now “Worth $4,851, after $149 owed.” The money guide's worked example quotes it, and says so.
- **Home and the School's look disagreed (Wrong).** Home's School line read “Year 1, good standing, 1 of 16 in the
  class.”, which reads as one of the sixteen; the School's look says “1st of 16 in the class overall”, the place by mean
  craft (`rankIn`). Home now says “1st of 16 in the class.” `ordinal` joins `plural` and `spokenList` in `core/text.ts`.
- **“Year 1 of three”** on the School screen's header and the Profile's School Journey, a figure and a word in one
  phrase: “Year 1 of 3”. The look's “your first year of three”, all words, stays.
- **Standing.** “Attendance counts 0 of 0 class days, 0 of 0 calls and 0 of 0 assigned shifts.” before a term's first
  class says “There’s been no class day, call or shift to count toward attendance this term yet.” (and last term's, in
  the past). A course's line “Acting I: at 5 of 5 classes.” reads “Acting I: 5 of 5 classes attended.” The leave form's
  “Granted, it would run from … to …: no aid, classes, calls or shifts while on leave; …; notice of return eight weeks
  before, or dismissal.”, one sentence of colons and semicolons, is five: “If it’s granted, it runs from … to …. While
  you’re on leave there’s no aid, and no classes, calls or shifts. … Give notice of your return eight weeks before, or
  the leave ends in dismissal.”, the last in the words the leave's own notice uses.
- **Aid (engine-speak).** The Terms tab's “goes by need, and the need assessment reads the family’s means. Yours found
  none, …” and the term's notice “Yale’s aid for living costs goes by need, and none was found, so …” say it as the
  guide's chapter does: “… goes by need, and your family’s means rule it out, so …”; on the tab, “judged from your
  family’s means. Yours rule it out, …” (“Yours show need, …” where they do).
- **The Profile.** Playing With Others read “of 1 slips by the others, you covered 1”: now “of the 1 slip by the others,
  you covered it” (“all of them”, “none”). Development History named the reader's evenings by their key, “Coursework:
  reader”: now “Coursework: running it with a reader”.
- **Orientation.** “First-year courses are taught by …, Michael Rossmy, Paul Walsh.” joins its list with `spokenList`:
  “…, Michael Rossmy and Paul Walsh.”

**Meaning-sensitive:** the worth line (checked against `netWorth` and the three tests that build it from balances); the
place (the same `rankIn`, said as the look says it). The rest change no figure.

**Tests updated:** the place in `tests/language-dynamic.test.ts` (six patterns, now `\d+(?:st|nd|rd|th) of 16`),
`evidence2-b12.test.ts` (and “6th”, “7th”), `evidence3-home.test.ts` (the suffix worked out inline, so no line moved),
`evidence-g33-ui.test.ts` (`ordinal` added to its `core/text` import line); “Year 1 of 3” in `language-dynamic`,
`evidence2-b11`, `evidence-g32-ui`; the course's line in `language-dynamic`; the leave in `evidence-g25-school`; the aid
in `evidence3-person`, `need-paths`, `evidence2-b10`; the slips in `evidence2-b11` (built from the record, as before); the
worth in `scope-money`, `evidence2-b12`, `evidence-g33-ui` (its `not.toMatch` as narrow, for the new words).

**Checks:** `tsc` 0, `eslint` 0, the eleven language checks 0 (`tics` failed once, on “Nothing counts toward
attendance …”, a sentence opening on Nothing over a budget of none; turned round as above, then 0), `guide-quotes` 0;
`traceability`, `devmap`, `coverage` 0; 30 test files, 540 of 540 after four assertions were brought to the new words,
then 79 of 79 and 142 of 142. **Statuses:** 9 sources Rewritten And Verified (school 4, profile 2, frame 1, money 1, and
`registerSchool`); `StandingPane` and `sourceWords` are verified on the final walk (batch 6).

## Batch 5: The Bank's, The Authorities' And The Doctor's Notices (Money, Papers, Health)

Read in the scenario saves written again on today's code (`tools/scenario-saves.mjs`, all fifteen, every exit 0: 3,251
notices, 817 distinct sentences J01 doesn't meet) and in J01's own:

- **A card statement said nothing of when (Unclear).** “Statement Ready: Chase Freedom Unlimited”, body “$270.00 to pay,
  at least $40.00.” It names the due date now, which the card's due item is already set to (`dueAt`, the same call
  `scheduleDue` makes): “The statement comes to $270.00, due October 11, 2026. At least $40.00 has to be paid by then.”
  “At least” is what the due date judges, the card's minimum or a hardship plan's payment, as before.
- **A card limit raised named no card and no reason a player could check.** “It’s $78,260.00 now, because your record
  has been clean.” → “The Chase Freedom Unlimited’s limit is $78,260.00 now, because your credit score is 700 or more and
  you haven’t paid late in the past year.”, the review's own two conditions (`RAISE_FROM`, a late payment in 365 days), as
  the guide's card entry already states them.
- **A bank closing an account led with the reason.** “It had been below zero for 60 days, so the bank took what it was
  owed from your other money there. It closed AktivKonto. Flexgeld stays open.” → “Deutsche Bank closed AktivKonto. It had
  been below zero for 60 days, …”: what happened, then why, then what's left. The variant that closes nothing keeps its
  order, with nothing to lead with.
- **A renewal renewed until its renewal.** “HUSKY D is renewed until its next renewal, on January 1, 2028.” → “HUSKY D
  is renewed. Its next renewal is on January 1, 2028.”
- **One word for one thing: a lien.** The glossary's Papers row says a lien is filed for what's owed, and lists “It
  secured” as the word replaced; the refusal and the guide still said it. “It secured tax you owed when it was filed, so
  it wasn’t filed in error.” → “It was filed for tax you owed, so it wasn’t filed in error.”; “once the balance it secures
  is paid in full” → “once what it was filed for is paid in full”; and the tax guide's five lines likewise.
- **Mexico's papers.** “Moving abroad isn’t part of the game, so it grants none of Mexico’s papers.”, where “it” read as
  Mexico → “…, so you can’t get Mexico’s papers here.”
- **A doctor's appointment.** “A doctor’s visit: booked at Yale Health Center, Student Health for September 1, 2026, the
  wait where you live.” said the date is the wait; it's the usual wait where you live that sets it (`waitDays`, the
  place's published wait). → “…, the usual wait where you live.” The health area had left this for the papers guide's
  example, which quotes it and whose test holds the two equal; both changed together, and the test passes.

**Left, with why:** a state's added penalty is named in its assessment notice by its Title Case label, “and The Penalty For
A Return DRS Made, 10% Or $50, The Greater”: the labels are `label:` fields `tools/label-sweep.mjs` holds to Title Case,
and the notice is their only reader. A prose field beside each is a change of the data's shape, for the papers area or the
owner (`defects.md`).

**Tests updated:** the renewal in six files, Mexico in five, the appointment in seven, the lien in three, the statement in
five (each with its due date: September 20 → October 11, October 20 → November 10, November 20 → December 11, Chase's
21 days; a pattern that had no date gained the one the test's dates give), the limit in one, the closing in two.
`tests/liens-and-arrangements.test.ts`'s two patterns for the lien (`/secured tax you owed when it was filed/`) failed on
the first run and were brought to the new words, as narrow.

**Checks:** `tsc` 0, `eslint` 0, the eleven language checks 0, `guide-quotes` 0 (580 of 580: one quote fewer, the release
refusal's now four words shorter than the five a quote needs), `traceability`, `devmap`, `coverage` 0; 28 test files, 419
of 419 once the lien's two patterns were brought to the new words. **Statuses:** 10 sources Rewritten And Verified (papers 6,
health 2, money 2).

## Batch 6: The Top Bar's Menus, Home's Place Line, And The Final Walk

- **Two controls named with their arrow (Unclear).** The top bar's Advance and Look After Yourself buttons drew their
  menu's arrow as text, so the button's accessible name was “Advance ▾” and “Look After Yourself ▾”: a screen reader says
  the character's name with it. The arrow is drawn in a span with `aria-hidden`, and the browser's own accessible name
  (`getByRole`, `names.mjs` on the built app, `names.json`) is now “Advance” and “Look After Yourself” exactly, with
  none named with the arrow. Sighted, the button reads as before. `tests/editorial-frame-names.test.ts` holds the
  markup, and saying Advance's arrow again fails it. The walk records a button's text, not its name, so its `buttons`
  lists still show “Advance ▾”; that's the walk's, not the player's.
- **“Home.” on Home (Unclear).** Where You Are said “New Haven, Connecticut · United States” and under it “Home. 130K
  people.”: “Home.” standing alone reads as the screen's own name, where it means this city is the player's home. Now
  “Your home. 130K people.” The comment above it said what was no longer true and was brought up to date in the past
  tense, as was `tests/evidence2-b11.test.ts`'s header.
- **Evidence the earlier batches promised.** Run Lines Together?'s line where you share no open scene (batch 2) is on no
  walk save, so its first status cited a walk that doesn't show it. `tests/editorial-class-moments.test.ts` plays a
  student until such a request is open and renders the panel: “You share no open scene with …, so you’d run their lines.
  That helps them, but it doesn’t move your own work.” and “… asks if you’d run lines together for an hour on … at 7:00
  PM.” Removing “for an hour” fails it. The status now cites the test, and says the walk doesn't show it. Standing's
  lines and the Profile's “running it with a reader” (batch 4) were left for this walk, and it shows each: the leave's
  sentences on `rehearsal.json` and `tax.json`, attendance with nothing yet to count on `roundups.json`, “5 of 5 classes
  attended.” and “Year 1 of 3” on every student save, “Coursework: running it with a reader” on `decision.json` and
  `missed-plan.json`, and the Casting tab's “Chloe Tanaka, a leading part in a new play” on `decision.json`,
  `direction.json`, `leave.json` and `lien.json`. `names.mjs` reads the same lines in the browser, on the saves that
  show them.

**The final walk** (`after-1440/`, `after-390/`): the fourteen scenario saves on the build of this batch's code, 25
screens each at both widths, every walk's exit 0. `tools/text-render-check.mjs` on both (`render-after.txt`): 128,638
strings, exit 1 on one distinct fault, “You and Hannah had rehearsed together 1 times.” on `workload.json`'s Coursework.
It's the save's own stored feedback, written on 2026-10-17 before the school area's first batch gave `timesWords` its
“once”, and it was in the walk this review read (`walk-1440/`) and in the school, json, money and profile areas' walks;
the save is a fixed file, not this code's words. Written again by `tools/scenario-saves.mjs` on this code and walked at
both widths (`render-now-workload.txt`): 10,336 strings, 0 faults, exit 0, and the line reads “You and Hannah had
rehearsed together once.”

**Tests updated:** `tests/evidence2-b11.test.ts` and `tests/evidence-g32-ui.test.ts` (Where You Are, exact, in New Haven
and London); `tests/defects-g7-1.test.ts` (it reads `TimeControls.tsx` for Look After Yourself's markup, and failed on the
first run until brought to the span, as exactly). **New:** `tests/editorial-class-moments.test.ts`,
`tests/editorial-frame-names.test.ts`. The 39 test files that name `TimeControls.tsx` or `Home.tsx`, with the new one:
722 of 723, the one `defects-g7-1`'s, then 27 of 27 with `help-mechanics` and `language-frame-ui` once it was brought to
the new markup.

**The completion matrix.** `tools/completion-matrix.mjs --check` failed here: its `completion-matrix.json` quotes each
command's refusals from `docs/TRACEABILITY.md`, which batch 1 wrote again with the new refusals, and the matrix wasn't
written with it. Written now: sixteen lines, the refusals' words only (eight rows' preconditions and validation), with
two counts of refusals one higher, Move Money's (“has only” and “has nothing” are two now) and cash's (a typed nothing
and too much); the page and its completion line are unchanged, 527 of 636 (82.8%), and the check passes.

**Checks:** listed in `README.md` with the last commit's. **Statuses:** `Home#Home`, `AdvanceMenu` and `LookAfterMenu`
`--by frame`; `StandingPane` `--by school` and `sourceWords` `--by profile` on this walk; `ClassMoments` `--by school`
again, on the new test.
