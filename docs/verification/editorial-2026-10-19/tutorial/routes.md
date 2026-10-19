# The Guide, Followed On The Built App

Brief 15, section 5: "Verify instructions by following them in the built game. Finding a label in code is only partial
evidence; identify any route not exercised." Every chapter was read in the guide's own dialog on the built app, checked
word for word against `CHAPTERS` (its lead, every paragraph, The Details opened, and What It Opens), and marked read
with I’ve Read It. Then what it says to do was done, where it says, and the result compared with what it says.

- **`follow.mjs`** (Playwright, run with vite-node so it reads `CHAPTERS` itself): a new life, born in New York, billed
  as an actress, at Yale, from its first morning. Run at 1440 wide (`follow-1440/`) and at 390 (`follow-390/`).
- **`follow-saves.mjs`**: the routes a new life can't reach in its first days, on the scenario saves in
  `scratchpad/b15-saves/` (written by today's game code): `brief.json` (Saturday, September 12, 2026, two weeks into
  the first term), `rehearsal.json` (April 24, 2027, a production in rehearsal), `decision.json` (February 11, 2027,
  a tax return due), and new lives begun until one had a long-term condition (`follow-saves/`).
- **`explore2.mjs`** dumped every screen and tab's text and buttons on a new life and on two saves, to read the labels a
  chapter names before writing its route.

Each check is a line in the run's `log.txt`, `ok` or `FAIL`, with what the screen showed; `results.json` holds them.
The final runs are summed up at the foot.

## The Chapters

| # | Chapter | Followed | What came of it |
|---|---|---|---|
| 1 | Your Life, Hour By Hour | The line under the greeting; the town's name in Where You Are, and inside it its region, country and money; the date, the season and the daylight; a locked panel's Read About It; How This Works on a panel; the ? and / keys; a search that finds nothing; the menu down the left (Menu at 390); Save & Exit, then Continue. | As the chapter says: each link opened just below; Read About It opened “What’s Coming”; the help said the clock waits; Continue came back at 7:30 AM, where it left. |
| 2 | What’s Coming | The Calendar panel (the next commitment, how soon, five more); an entry's name pressed. | The entry opened: when, how long, where, and that missing it means it's missed. The stop's dialog is followed in chapter 4, where the clock first moves. |
| 3 | The Clock | Play, a minute of real time, Pause. | Play became Pause; the clock went from 7:30 to 7:31 AM; Pause became Play. |
| 4 | Moving Time On | The Advance menu and its times; Choose An Event; One Hour; Tonight past a commitment; the stop; Stand Here; Go through the rest. | On The Way said “passes one commitment”; the clock stopped at Registration And Your Account with Go and Stand Here and no Skip It (the school's commitment, as chapter 2 says); Stand Here kept it paused there. |
| 5 | What Needs You | The notices; a notice's title; Go There; Mark N Read; the panel with nothing waiting. A question and Dismiss on `decision.json`. | The notice opened in full; Mark 3 Read left All Clear; on the save, Dismiss took the tax return's question off the list, and the return was still on Tax Returns with File It, as the chapter says. |
| 6 | How You Are | Energy, Stress, Readiness; Readiness pressed; one of its measures pressed. | Readiness named three measures, and the measure opened inside it. |
| 7 | Sleep | The Sleep dialog's range, suggestion and wake time; Not Yet; Sleep grayed at a commitment; Sleep 8 Hours at night. | Half an hour to 14 hours; at Meeting Your Class the bar said “You’re at Meeting Your Class until 1:00 PM.”; a night took energy from 31 to 100. |
| 8 | Looking After Yourself | The menu, its first line's mark, and the first thing on it pressed. | Eat A Meal, marked Most Worth It, and “Eat A Meal: done at 6:40 AM.” |
| 9 | Your Own Plans | Open Calendar; a day; Put Something On It; the form; Put It On; the plan pressed; Call It Off. | Half An Hour to All Day; Lunch With Sam put on and called off. |
| 10 | Weather | The Weather panel; today's weather pressed. | The week, each day and each hour opened. |
| 11 | Drama School | New life: the School line; the Yale button; the six tabs; the school's, a course's and a technique's links; Classes; Take An Elective Shift; Casting; Plays To Read. `brief.json`: Call In Sick at the nine o'clock stop; a step (Read The Scene); Ask a partner; Work It Through; Read It and Research It; Shifts And Pay. `rehearsal.json`: Casting in a production. | The shift booked (“Front of house, August 31, 2026 at 7:00 PM.”); Call In Sick grayed for someone well, “Not now: You’re well enough to go. …”; Knows The Scene 0% → 54%; “Jordan said yes.”; a problem's ways with the figure; “Proof, by David Auburn, read through.” then Research It; Why This Cast, Learn The Part (“An hour on the part: lines at 76%.”), A Night Now and The Evening’s Workload, Join The Summer Company. |
| 12 | You As An Actor | The twelve abilities; an ability's look; Comic Timing's Tier, Focus and Practice An Hour; Study It; Open Its Brief; your name at the foot of the menu. `brief.json`: What To Work On Next, a brief in progress. | “Comic Timing: +0.25.”; “Absurdist: an hour and a half with a film of its kind. Familiarity 8.0 of 100.”; the brief's pane with every button the chapter names. |
| 13 | Cover, Benefits And Returns | The Papers line; the Papers button; the tabs; Your Cover; Your Doctor; that no Book An Appointment shows with no visit owed; The Marketplace; Care And Its Bills; Unemployment's SNAP and its claim; Tax Returns. A new life with asthma: Let It Go, then Keep It Up. | Yale Health Center, A Visit $0.00, The Next Weekday; no Book An Appointment (the chapter now says the game books the visit: `defects.md`, 3); SNAP with Apply, and “a claim pays only once you’ve left school”; “Asthma: Left Alone” with Keep It Up, then Let It Go back. |
| 14 | Passports And ID | Your Passport and its buttons; Report Lost and Report Stolen; Your ID's Get; a document's look; Going Abroad with a country picked; Permission To Work and Residence Abroad. | As the chapter says, on a life with a passport (Renew It, Renew It Faster) and on one without (Apply For One; Going Abroad: “You need a passport in force, and you don’t have one.”). |
| 15 | Money | The Money line; Your Affairs, the panel's title. | “Chase Total Checking: $… Worth $….”; the net worth look with each account. |
| 16 | Your Bank | The bank's button; the five tabs; Move Money from savings to checking; Cards; Payments And Cash; Statements, The Year, Alerts; Borrowing. | $10 moved at once at the same bank (“Moved $10.”); Pay Card In Full, Autopay, Lock It, Report It; How You Pay; The Year, Alerts, Statement Ready, Short For A Payment. |
| 17 | A Whole Life | Your name on Home; the line at the top of How You Are. | Your own page, with your wellbeing, readiness and traits. |

## Not Exercised, And Why

- **A commitment that comes while you're asleep or in hospital** (chapters 2 and 9: "you miss it"). The first is
  checked in passing: Sleep 8 Hours ran through nothing. Neither was staged; `world/plans.ts` and `presentForCare` say it,
  and How This Works' calendar entry is the frame area's.
- **Skip It on a plan of your own** at its stop (chapters 2 and 9). The plan was called off before it started instead;
  `calendar.skip` takes only a plan of your own, and the stop showed no Skip It for a school commitment.
- **A jump through the night going to bed by itself** (chapter 4's details). Not staged; `creditNightAlone`, read.
- **Dismiss on a question, and its answers** were pressed on `decision.json`; a question's own answer buttons were seen,
  not pressed.
- **Call In Sick for someone unwell**: every life followed was well at nine, so the button was grayed with its reason.
  Its toast is in the follower for a life that's unwell.
- **A partner who says no, Run It With A Reader pressed, a piece shown and its note, a coursework warning, a term
  review, a performance**: the save is before the first showing. School's own areas follow these (`school` and
  `material` prompts); the chapter's words for them were read against `coursework.ts` and `school.ts`.
- **Join A Cabaret Show** (not open in a first fall), **the Summer Cabaret** pressed (seen on Casting in April), **the
  degree, repeating a year, an Incomplete**: they need terms the saves don't reach.
- **Brief preparation pressed** (Break It Down and the rest), **Read It This Way**, **Read With** and **Tape It**: seen
  on the pane, not pressed; the profile and material areas follow a tape.
- **Enroll, Drop The Plan, Apply For HUSKY D, Apply For Assistance, Appeal It, Buy Dental, File A Claim, a pension,
  File It and Pay**: each needs a life past Yale Health, out of work, past 62 or with a bill, which the papers and health
  areas' journeys cover. Book An Appointment was checked absent with no visit owed; how it books again is the papers
  entry's test (`tests/guide-examples-papers.test.ts`).
- **Begin A Course Of 8 Sessions**: seen on a new life with depression (`explore2.mjs`), not pressed; the lives the
  follower drew had asthma or nothing.
- **Applying for a passport or an ID card, Report Lost, Replace It, File A Police Report, Apply For OPT**: seen on Papers;
  pressing them changes papers the documents journeys own (`tests/defects-g27-1.test.ts` holds the chapter to Report
  Lost and a lost license's replacement).
- **The bank's cards past the first, Make It The Everyday Card, help with payments, an overdraft, a loan, a term deposit,
  round-ups, another bank, an account at home**: a new life has one card and money; the money areas' journeys and
  `tests/defects-g22-1.test.ts` hold the chapter's claims about Statements, Move Money and help with payments.
- **A birthday, and the end of a life** (chapter 17): years away.

## Labels The Chapters Rely On

Each of these is named in a chapter and was found on the built app or, where the walk didn't reach it, in the code. A
rename in another area changes the chapter that names it: the coordinator carries it at the merge.

- **Top bar:** Play, Pause, Sleep, Look After Yourself, Advance (One Hour, This Evening, Tonight, Tomorrow Morning,
  Next Event, Next Monday, One Week, Choose An Event…), Guide, Save & Exit, Menu.
- **Dialogs:** Go, Stand Here, Skip It, On The Way, Skip To Event, Sleep N Hours, Not Yet, Put Something On It, Put It On,
  Call It Off, I’ve Read It, Try It, Read About It.
- **Home:** Where You Are, Calendar, Open Calendar, What Needs You, Go There, Mark N Read, Dismiss, How You Are,
  Readiness, Weather, Your Affairs, the Money, School and Papers lines and their buttons (the bank's name, Yale,
  Papers), How This Works, Locked; Look After Yourself's Eat A Meal, Order In, Shower, Work Out, Unwind, Needed Now, Most
  Worth It.
- **School:** Standing And Craft, Classes, Coursework, Casting, Shifts And Pay, Terms And Award; Call In Sick; Table Work,
  Shown Today, Rehearsing With, Ask <name>, Run It With A Reader, Work It Through, Coursework This Term, A Word On Your
  Coursework, Why This Cast, Learn The Part, Catch Up The Blocking, Work On The Note, A Night Now, The Evening’s
  Workload, Take An Elective Shift, Join A Cabaret Show, Join The Summer Company, Plays To Read, Read It, Research It,
  Unready, Solid, Strong, Remarkable.
- **Player Profile:** Player Profile, the twelve abilities' names, Practice, Tier, Focus, Practice An Hour, Comic Timing,
  Mastered, Genres, Study It, Familiarity, Work In It, Open Its Brief, Break It Down, Learn The Lines, Rehearse It On Your
  Feet, Read It This Way, Read With, Tape It, The Genre Asks, What To Work On, Your Work So Far, Movement Invention.
- **Papers:** Tax Returns, Health Cover, Unemployment, Passport And ID, Permission To Work; Your Cover, Your Doctor, Book
  An Appointment, The Marketplace, Enroll, Drop The Plan, Care And Its Bills, Pay It Off, Apply For Assistance, Your
  Long-Term Conditions (the papers area's new name for Your Conditions), Let It Go, Keep It Up, Therapist, Begin A Course
  Of 8 Sessions, File A Claim, SNAP, Apply, File It, Pay, File A Police Report, Your Passport, Apply For One, Renew It,
  Apply Faster, Renew It Faster, Your ID, Get, Report Lost, Report Stolen, Replace It, Going Abroad, Apply For OPT,
  Residence Abroad, and in the details Apply For HUSKY D, Request A Hardship Exception, Appeal It, Buy Dental, Drop
  Dental, Claim Social Security, Claim It, Prepay Three Months, Prepay A Year, Your Pharmacy, Fill A Longer Supply.
- **Bank:** Accounts, Cards, Payments And Cash, Borrowing, Statements; Move Money, Move It, Money In Transit, Pay Card In
  Full, Autopay, Make It The Everyday Card, The Year, Alerts, How You Pay, Cash, and in the details Savings Covers The
  Current Account (which the money area is renaming), Send The Credit To My Account, Move My Account To A New Number,
  Break It Early, Reactivate, Pay It, In Collections, Take The Loan, Close It.
