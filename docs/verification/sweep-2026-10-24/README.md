# Brief 26: The Complete Game Connectivity, Logic And Functionality Sweep

The owner's brief 26 (`../briefs-2026-10-16/26-complete-game-connectivity-logic-and-functionality-sweep.txt`, kept as
sent, 2026-10-24), given with "We’re going to work on everything here plus starting with fix of whatever and all thats
stale": the account of #62's changes given in the same session, and the records it found behind the code, then the
sweep itself. One agent throughout, as asked. This is the receipt; it grows with the milestones and ends with what brief
26's §13 asks for. `CHECKPOINT.md` is the trail, `REGISTER.md` the inventory with each feature's status.

## The Starting Point

- **`main` at `b46ee301`** (#63), the handoff's account of #62's merge; `src` as #62's head `8d4139de` left it.
- **Worked on `claude/connectivity-sweep`,** from that commit, pushed and never force-pushed.
- **Not built on:** `claude/peaceful-hamilton-59zdbb`, where the other account holds brief 25 (the career expansion),
  eight commits past `main` and unmerged. Brief 26 says not to begin that expansion.
- **The schema stays 94** (`SAVE_SCHEMA_VERSION`, `SUPPORTED_SCHEMA_VERSION`), with no migration.

## The Baseline

`npm run gate` in a clean clone of `b46ee301` (`baseline/gate.txt`, its header the commit, the clean tree and the time;
`baseline/gate-exit.txt`), before any change: **exit 0**. 488 of 488 test files, 5,616 of 5,616 tests, none skipped, in
1,302 seconds, and all 22 checks; the completion matrix read 634 of 658 (96.3%). No failure stood before this work began,
so any failure after it is this work's. The merge message of #62 had claimed a run on its head `8d4139de` with no receipt
in the tree; `src`, `tests`, `tools` and `package.json` are the same at `b46ee301`, so this receipt stands for that claim too.

## What Was Stale After #62, And Fixed (M1)

Each correction says in the past tense what stood and until when; none rewrites what a record measured.

| Record | What it said | What stands |
|---|---|---|
| `../audit-2026-10-21/effects/guide.json`: `ui.calendar`, `ui.open-calendar`, `ui.needs` | the Calendar and Updates "on the menu"; What Needs You listing "every unread notice"; Open Calendar waiting for "Your Own Plans" | both open from Home alone since brief 24, with Back To Home; the notices are Recent Updates' and Updates'; Open Calendar opens with "What's Coming" |
| the same, `world.mark_read`'s consumers | "the rail's count and the You line's N Unread" | Recent Updates' subtitle and count, and Updates' Unread (N) and All (N); the rail counts questions alone since brief 23 |
| `src/engine/content/attributes-matrix.ts`, `docs/ATTRIBUTES-MATRIX.md` | Calendar and Updates reached by "the rail"; "Profile Sections: 7 of 7" | Home's Up Next and Recent Updates alone; eight sections in the page's order, Your Work So Far among them |
| `../ui-2026-10-23/coverage.md`, `CHECKPOINT.md`, `inventory.md`, `README.md` | the menu's "eight places"; a before walk of 2,112 steps; the matrix at 588 with no sequel; the final runs "weren't made here" | six places since brief 24; 2,040 steps, the figure both summaries hold; 634 again since brief 24's replay; the runs made on brief 24's commits |
| `../integration-2026-10-16/COMPLETION-MATRIX.md`, Home's six rows | the review's claim of 2026-10-13 as each row's goal: Your Affairs' Money, School and Papers lines, Where You Are and Weather panels, notices under the questions, a Calendar section | a `claim` as the code stands, set through the pipeline's inputs (`../pipeline/fix-citations-1024.cjs`, applied by `merge-review.cjs`, shown by `tools/completion-matrix.mjs` before the review's) |
| `src/styles/app.css` | `.link.strong { min-height: 32px }` on touch and `.rail-badge-quiet` | gone: no element carried either (the first never matched; the second's badge went with brief 24) |
| `../career-genre-2026-10-22/final-runs/interface-final/` | 21 `fail-*.jpg` from brief 23's stopped browser lanes | gone, said in `runs/README.md` |
| `../briefs-2026-10-16/README.md` | no row for briefs 23 and 24; brief 22 "in progress" | rows for 23, 24 and 26; 22 merged in #54, #56, #58 and #60 |
| `SLATE_CURRENT_MASTER_HANDOFF.md` | (#63 had already corrected "not merged") | a top section for brief 26 |

Held by: `node tools/effects.mjs --check`, `tests/attributes-matrix.test.ts`, `tests/audit-pipeline.test.ts` (the
pipeline run in a copy makes the committed audit byte for byte), `node tools/coverage.mjs --check`,
`node tools/completion-matrix.mjs --check`, `node tools/text-inventory.mjs --check` (the attributes matrix's text read
again), `tests/b23-pages.test.ts` (the stylesheet's scroll boxes), typecheck and lint.

## The Register (M2)

`tools/sweep.mjs` finds every feature in the code: the feature-to-effect matrix's 541 rows and 406 promises (held to the
code by `tools/effects.mjs --check`), and what that matrix has no row for, which brief 26's §2 names: 17 techniques, 149
genres, the Player Profile's 8 sections, the 8 places Home and the menu open, 12 persistence behaviours (a new life, a
save opened, brought forward, validated, the stores, the deployment's guard, the schema pin, Your Saves, the start) and 4
world mechanics (holidays, stops, the running clock, time zones): 1,145 in all. Each has an entry in `register/<area>.json`
with the sweep's status (Verified, Fixed And Verified, Failed, Blocked, Deferred, Not Tested), how it was verified
(inspection, automated, interactive), the commit, the evidence and what was found; `REGISTER.md` is written from them. The
gate's twenty-third check (`--check`) fails a feature with no entry, an entry for a feature that's gone, a status without
what it needs, and a page behind the entries. Every feature began Not Tested; nothing is counted done for having a row.

## The Traces (M3 to M11)

### M3: Creation, The Profile, The Abilities, The Genres And Progression

**Read:** `world/bootstrap.ts` and `populateWorld` whole (every creation field lands where its row says); the
evaluation's guarantee (`systems/evaluation.ts`: an input a task doesn't read changes nothing, and a dimension never
falls as an input it reads rises); the one way anything grows (`systems/attributes.ts`: toward the reach by ordinary
work, past it by deliberate practice, half again the same source the same day, discipline's lift, never past full;
`systems/practice.ts`: four hours a day, an hour sent again with its id refused); the genres' knowledge
(`systems/engagement.ts`: weights summing to 1, a kind beside its broad genre one demand, relatedness one link, nothing
passing 1) and love (`systems/enjoyment.ts`: mood and stress, never the result); the personality knobs and the trait
look that explains them by the same formula; the Profile's eight panels, each reading live state. **Ran:** the area's
37 test files, 449 tests, green; the creation screen's claims for each disposition and trait read against the consumers
one for one.

**Found and fixed (1):** creation's Genres step marked Crime, Horror, Police Procedural, Psychological Horror,
Psychological Thriller and Thriller as "shown on your Player Profile only" (`genresRead` read the School's plays' kinds
alone), while a work day on a career project of the kind had lifted the mood since brief 20, and the project's own test
said so. One list now, for the screen and the engine; the step says a day's work on a project of a loved kind lifts the
day. `tests/b26-creation-genres.test.ts` fails with the projects' genres dropped (2 of 2) and passes restored
(`22bfcd35`). **Found and corrected (3 records):** the effects rows for `create.genres`, `axis.extraversion` and
`axis.agreeableness` still said the career's days read no loved genre and no disposition, a gap brief 20 closed.
**Left to the owner (1):** `create.livesWhereBorn`, written and read by no life a player can make, as brief 20 recorded.

**Register:** 265 Verified, 1 Fixed And Verified, 1 Blocked, by inspection and the tests named on each row.

### M4: The School

**Read:** `systems/school.ts` whole (the term's start and enrolment; the class day, which grows the courses' skills for a
student present, rested and in New Haven and counts an absence; the shift, the payday and the stipend; the call and the
night; the casting and the term's evaluation; the Cabaret and the Summer Cabaret; the labs, the recesses, commencement
and conferral; `setStanding`, which cancels every pending School item, keeps the stipend's share and pays the hours owed;
every command's refusal); `systems/leave.ts` (the leave refused, asked, begun, closed and returned from; the repeat, the
additional term, the aid review, the Yale account and its hold, the affiliate cover; every decision's kind);
`systems/coursework.ts` (the work set, prepared, approached, chosen, shown and noted; the partner's ask, answer, rehearsal
and cancellation; the term's warning); `systems/production.ts` (the part learned, the blocking caught up, the note worked,
the closing's reflection); `systems/classmates.ts`, `courserecord.ts`, `workbook.ts`, `playreading.ts`, `briefs.ts`,
`practice.ts` and `engagement.ts` (their commands and refusals); `systems/proshowcase.ts` (the Actor Showcase begun,
chosen, decided, played and settled); the School's five looks. **Ran:** the School's 86 test files, 1,304 tests, green on
`bd7b9d02`.

**Traced for the brief's three questions.** *Repeated presses:* every School command that spends or books refuses its
second press in its own words (`ppeRefusal`, `cabaretRefusal`, `sickRefusal`, `conversionRefusal`, `leaveRefusal`,
`repeatRefusal`, `aidReviewRefusal`, the showcase's `choiceRefusal`, the partner's `askRefusal`, Learn The Part's cap of
three, Work On The Note's second time), and Take An Elective Shift books another evening, never the same one twice.
*Cancellation:* `setStanding` and `startLeave` cancel the pending School items, `callOff` gives a called-off evening's
hours back, `leaveCabaret` calls a show off, the showcase's `decide` cancels its calls for an Incomplete outstanding and
excuses its pieces, and Cancel A Rehearsal charges trust only when late. *Reloads:* a payday, a conversion, a leave's
rebate, a repeat, an affiliate cover, a showcase day's judging and a note worked each happen once across a save, the
item done before its handler runs or the record keyed, and the tests named on the rows hold each. **Found:** no defect.
Each row carries the file and lines read for it.

**Register:** 294 more rows Verified by inspection and the tests named on each: the School's 145 (69 commands and
scheduled kinds, 17 notices, 5 looks, 11 craft commands, 43 of the School chapter's promises), the craft area's 145
promises (the coursework's, the briefs', the genres', the identity's, the practice's, the Profile's, the workbook's and
the productions') and the career area's 4 Actor Showcase promises. Running total: 559 Verified, 1 Fixed And Verified,
1 Blocked, 584 Not Tested.

### M5: The Career

**Read:** `systems/pro.ts` whole (the record and its bounds; the profile worked out from the record and never stored;
the résumé keyed line by line, so "behind" is a set difference; the reel's sources; each material's refusal and command);
`systems/projobs.ts` whole (each Monday's postings, a part never posted again while its last casting runs or once it's
been booked or credited; the agent's try; the submission, the round set in person or on tape, the clash said with the
way to move it; casting's draw keyed by the opportunity and the round; the offer as a decision with its warning; the
booking, its promised pay and its days; the work day, logged once, permission read whole, a miss, a replacement, a
release, unapproved work reported through the School's own standing, the credit at the first night or the wrap; the
dean's answer); `systems/propay.ts` whole (a payment paid once and never twice, into trust where commission is owed, the
commission's five rules, the withholding, the unions' bills keyed and settled once, SAG-AFTRA's thirtieth day);
`systems/proagent.ts` whole (the seven factors against the game's bar, the draws keyed by person, agent, approach and
step, each stage's refusal, the School's follow-up once a showcase, the meeting, the decision, the agreement's offer,
acceptance, decline, lapse, term and its three ways of ending); `content/careerwork.ts` (the rates by contract year, the
unions, the eleven parts, the agreement's terms). **Ran:** the career's 32 test files, 423 tests, green on `9018cc4e`.

**Traced for the brief's three questions.** *Repeated presses:* every career command refuses its second press in its
own words (a name already set, a résumé with everything on it, a reel of the same pieces, a part submitted already, a
step of preparation halved for each time today and capped, a tape or a move once, an offer accepted or declined once, a
request already with the dean, a notice read, a check passed for this approach, a job that has referred once, an approach
under way, a meeting moved once, an agreement offered, in force or not); a headshot session alone can be had again, and
is charged again, as its header says. *Cancellation:* accepting or declining an offer calls its lapse off and resolves
its decision; work called off takes its days and the dropped weeks' paydays off the clock and keeps only the pay for
days worked; sending what the office asked for cancels the due date; accepting, declining or ending an agreement calls
its lapse or its term's end off; an agent's breakdown is withdrawn once the agreement it came under has ended.
*Reloads:* a payment is keyed and paid only with nothing received and nothing in trust; a work day is logged once; a
round's casting is kept on it; every history event has a stable key; a bill is keyed; the postings, casting and the
agent's answers are draws keyed to the thing decided, so a reload decides the same. The first SAG-AFTRA work day and
the eligibility notice fall at one instant, and the scheduler's priority runs the notice first, so the player is told
(tests/journey-career.test.ts has it at 7:00 AM). **Found:** no defect. **Noted, not changed (2):** an engagement's
`preparing` status is declared and read by permission's `employmentSpan` but set by nothing (the booking goes from
`booked` to `working`); and the career is bounded by its content: each of the eleven parts is posted once a cycle and
never again once booked or credited, so a life that books every part written for it (seven) sees no more postings.
Brief 25, on the other account's branch, is the career's expansion and isn't begun here.

**Register:** 89 more rows Verified by inspection and the tests named on each: 21 commands, 17 scheduled kinds, the
postings' passage, the Equity event, 9 notices and 37 of the Career chapter's promises. Running total: 644 Verified,
1 Fixed And Verified, 1 Blocked, 499 Not Tested.

### M6: Money And Banking

**Read:** `systems/banking.ts` whole (interest by the day at the nominal rate its crediting earns, the fee and its
waivers, the month's end, a savings account opened and closed, every move's refusals); `systems/credit.ts` at the
statement, the due date, the day's interest, the commands and the delinquency, charge-off and persistent-debt paths;
`systems/lending.ts` at the offers, the switch, the day's overdraft, sixty days below zero and every command;
`systems/payments.ts`, `cash.ts`, `finance.ts`, `bankmoves.ts`, `cardlife.ts`, `security.ts` and `statements.ts`
whole or at their handlers; `cardoffers.ts`, `accountlife.ts`, `abroad.ts`, `spending.ts`, `roundups.ts`,
`obligations.ts` and `homeaccount.ts` at their handlers, refusals and notices; the six money looks. **Ran:** the money
area's 69 test files, 843 tests, green on `bf0ef776`; with the fix below, the 23 files the card's close and net worth
touch, and the new test, green.

**Traced for the brief's three questions.** *Repeated presses:* every command refuses its second press in its own
words (a savings account already open or already on notice, a standing order gone, a card on its way, a switch under
way, a term already closing on its notice, a dispute reported, a credit with none to send, a cancellation past its
days). *Cancellation:* closing an account drops the orders into it and the payments to or from it; a bank's own close
ends the orders from it and says so once; a switch moves every instruction to the new accounts; a cancelled switch
cancels its review; a repaid loan cancels its item; an order or a payment cancelled is cancelled once. *Reloads and
jumps:* interest, fees, round-ups, statements, due dates, loan months and the day's draws each run from the item or the
day they belong to, once; a bill's key, a refund's record and a transfer's arrival are each one thing. **Every balance
is the sum of its postings** (`netWorth` and each look add them up again each time).

**Found and fixed (1, two parts):** a card closed while it held a credit balance (more paid than owed, `payCard`, C23)
kept the credit in the closed account, which `cardsOf` and `cardFor` no longer read, so Send The Credit To My Account
refused it ("The card holds no credit to send back.") and the money was gone from every total for good; and while the
card was open, net worth counted that credit as nothing. Measured on a Chase card before the fix: $500.00 paid over,
Close The Card pressed, the card closed with the $500.00 still on it and net worth $500.00 short; a card being closed,
paid $120.00 over before its statement, closed at the statement with the $120.00 on it. From 2026-10-24 every close of a
card goes through `closeCard` (`credit.ts`), which sends a credit back to the current account first, from Close The
Card, the statement and a cancellation in the cooling-off period, and Card Closed says where it went; and `netWorth`
counts a liability account's credit with the cash. `tests/b26-card-credit-on-close.test.ts` fails on the old code (2 of
3) and passes with the fix; the 23 related files pass unchanged, the statement's "paid off and closed" among them. The
notice is a new source of player text, marked in the inventory and claimed by the surfaces matrix; the effects matrix
has its row. **Found nothing else.**

**Register:** 161 more rows (the money area's 160 and the new notice): 156 Verified and 5 Fixed And Verified
(`card.close`, `card.statement`, `bank.cancel_new`, `look.networth`, `notice.systems/credit#closeCard`), by inspection
and the tests named on each. Running total: 800 Verified, 6 Fixed And Verified, 1 Blocked, 339 Not Tested.

### M7: Papers And Benefits

**Read:** `systems/documents.ts` and `permission.ts` whole; `identity.ts`, `taxid.ts`, `residence.ts`,
`citizenship.ts`, `papervisits.ts`, `appointments.ts` and `therapy.ts` at their commands, refusals, scheduled kinds and
notices; `health.ts` at the month, the week, the bill, the appeal, every command and its refusal, and the notices from
onset to the care priced again; `taxreturn.ts` at the season, the due date, the IRS's substitute, its letters and levy,
the refund, the plan's four kinds and three commands, filing, paying, amending and the reconsideration, the federal
lien and the UK years; `statetax.ts` at a state's letters, levy, lien, plan and waiver; `assistance.ts`,
`unemployment.ts`, `universalcredit.ts`, `homebenefits.ts`, `eiself.ts` and the four pension systems at their handlers;
the document, place, region and country looks; the guide's thirteen entries whose promises the two areas hold. **Ran:**
the two areas' 70 test files, 507 tests, green on `388d9a1e`; and a probe written for the brief's section 4 on a New
Haven life (`tests/b26-papers-repeats.test.ts`): Connecticut's card and a passport each applied for twice, charged once,
arriving once across a reload; the card reported lost, its police report and its replacement each once; an appointment
booked, called off with nothing left on the calendar, and booked again. Green.

**Traced for the brief's three questions.** *Repeated presses:* every command refuses its second press in its own words
(a card on its way, a passport being decided, a police report already filed, a card not lost, OPT applied for, a number
on its way, a claim open, a plan with the IRS or in force, a year already paid, an amendment with the IRS, enrolled
already, dropped already, in a course already, an appeal filed; Book An Appointment's second press says there's nothing
to see a doctor about, because the booking took the need, and books nothing). *Cancellation:* an appointment called off
leaves nothing on the calendar and the need owed, so it books again; a program dropped takes its renewal's notice and
decision with it; a plan ended or paid off cancels its payments and its default; a return filed cancels the IRS's
substitute and the state's letters; a payment that clears a year cancels its next letter and starts its lien's release;
OPT ended releases the work booked past it (`PERMISSION_ENDED`, `projobs.ts`). *Reloads and jumps:* each arrival, each
letter, each payment and each decision runs from the item it belongs to, once (`b20-papers-ids`, `b20-papers-health`
and `integration-tax-reload` hold each across a save; the probe holds the card, the passport and the appointment).

**Kept Deferred (20):** what the owner's scope reset of 2026-10-09 explicitly deferred stays so, with the effects row
that records it on each: the four pensions and their payments (Social Security, the State Pension, Ireland's, Mexico's
Bienestar and IMSS), EI for the self-employed, Jobseeker's Allowance, Universal Credit and its closing notice, residence
abroad, settling, renewing Mexico's card, naturalizing and its decision, and England's prescription prepayment
certificate. Each is read at its handler and held by a quick-save test all the same, so a save that holds one keeps it.

**Found no defect.** Three things noted and not changed: EI's sickness benefit posts under `'benefits'` where every
other benefit posts `'benefit'`, which a bank's count of electronic deposits reads (`ELECTRONIC`, `banking.ts:254`);
it is a Canadian's, deferred, and no life reaches it. Ten features the effects matrix calls Implemented, Verification
Incomplete (an amendment and its processing, a state's amended return, Oregon's three-year penalty and its waiver, a
lien disputed as filed in error, a UK tax year settled, Mexico City's claim paid out, a visit booked before the reset, a
prescription running out) are each read at their handler and held by a fixture test, and the register says so on each;
no current life reaches them, which is the matrix's point, not a defect. And a non-citizen already holding
Connecticut's card is told what the DMV asks before "You already hold one in force" (`idCardRefusal`'s order), one
refusal where another would be plainer; Papers draws no Get for a card held, so nobody reads it.

**Register:** 180 more rows: 160 Verified and 20 Deferred, by inspection and the tests named on each. Running total:
960 Verified, 6 Fixed And Verified, 1 Blocked, 20 Deferred, 159 Not Tested.

### M8: Life, The Body, The Day And The World

**Read:** `systems/life.ts` whole (the waking charge, the night chosen and the night nobody chose, the hour of looking
after yourself and its menu, the day's rollover, the sleep suggestion and the full night before a commitment);
`world/plans.ts`, `world/clock.ts`, `world/calendar.ts` and `world/world.ts` whole; `systems/body.ts`, `injury.ts`,
`birthdays.ts`, `mortality.ts`, `weather.ts` and `seasons.ts` whole; the clock's arming and its repair on load
(`engine/index.ts`), the clock's failure notice (`core/simulation.ts`), the running clock (`core/realclock.ts`), the
holidays (`content/holidays.ts`) and the zones (`core/time.ts`); the thirteen life looks and the eight dials' table; the
guide's nine entries whose promises the area holds. **Ran:** the life area's 55 test files, 732 tests, green on
`27369727`; and a probe for the brief's section 4 on a New Haven life (`tests/b26-life-repeats.test.ts`): a plan called
off once and refused the second time, skipped before it starts refused with the way, skipped at its stop once and said
once, a third kept once across a reload; Eat A Meal sent twice with one `actionId`, lived and paid once; a night in the
past, more than a day ahead or without hours refused. Green.

**Traced for the brief's three questions.** *Repeated presses:* a plan's second Call It Off or Skip It is refused as
already over; a retried hour with one `actionId` is lived once (`alreadyApplied`); a meal when full, a shower when
clean, a workout spent, hurt or with the flu, and a night at a commitment are each refused in their words, the night's
refusal putting the clock back; a question in What Needs You is dismissed or answered once. *Cancellation:* a plan
called off is off the calendar; a plan skipped at its stop is missed once and said once, and the jump carries on; a
night slept through a commitment marks it missed and says so once; a commitment under way refuses the hour (`occupiedAt`,
`commitmentWithin`); an injury's compensation ends at the time off's end. *Reloads and jumps:* a plan comes back with its
handler and is done once; the day's rollover and the world tick are armed once on load, never twice; a night nobody
chose is paid once in full once the clock is an hour into it, and forfeit where the player keeps them up; the same
afternoon costs the same dials in one jump or in one-second steps (`b20-life-time`); the weather is a function of the
seed, the town and the day, never stored, so it reads the same before and after a save.

**Found no defect.** Two things noted and not changed: the birthday's "Happy Birthday" notice has no check that the
person is the player, and none is needed, since only the player's birthday is ever armed (`armBirthdays`); and
`calendar.skip` and `calendar.cancel` answer a refusal in their value rather than by failing, which the stop reads
either way (`refusalOf`, `world/clock.ts`), and the probe reads both forms.

**Register:** 84 more rows, all Verified, by inspection and the tests named on each. Running total: 1044 Verified,
6 Fixed And Verified, 1 Blocked, 20 Deferred, 75 Not Tested (the guide's 63 and persistence's 12).

### M9: Notices, Decisions, Scheduled Events, Continuity And Freshness

**Read:** `world/world.ts` whole (the tick, the questions' two commands, the preferences, Mark Read, the two orders);
`requireDecision` and `notify` in `core/simulation.ts`, and the clock's own failure notice; the game provider
(`app/game-context.tsx`: the halt, every way of moving the clock, `run`, the live tick, autosave and the save on
leaving); the time controls whole (Play and Pause, Sleep, Look After Yourself, Advance and On The Way, the stop's
dialog, Skip To Event); Home's What Needs You, Recent Updates and Up Next; Updates whole; the calendar's plan form and
entry; the decision and notice looks; the destinations. And, as one list across every area, the opening guard of each
of the 121 scheduled handlers (117 kinds) and the nine functions that arm clock items when a save opens. **Ran:** the
shell's, the guide's and the decisions' 55 test files, 850 tests, green on `86890e43`; and a probe for the
brief's section 4 on a New Haven life (`tests/b26-needs-repeats.test.ts`): a question raised twice is one row, answered
once and refused the second time as settled; Dismiss taken once and refused the second time, and a dismissed question
not answerable from Home; raised again after a dismissal, a fresh row; Mark Read marking once and nothing the second
time, and every unread at once; a question left to its date closed once by the tick after it and still closed across a
reload; a setting the game doesn't have refused. Green.

**Scheduled events, read as one list.** Every handler either re-reads its subject from the save and returns when it is
gone or already settled (a status, a pending flag, the item's own time or id against the record), or is one of the
world's own clocks (the midnight, the world tick, the tax season, the health month and week, the bank's month end, a
pension's or a claim's next payment), which runs its stretch and books the next once. The nine systems that arm clock
items on load (`armWorldClock`'s `armed`, `armTaxes`, `armCollection`, `armHealth`, `armBirthdays`, `armBanking`,
`armPayments`, `armCardLife`, `armCredit`, `armHomeAccounts`) each look for a pending item first, so a save opened
twice arms nothing twice. An item of a kind no build handles is marked missed and nothing else happens; a handler that
throws marks its item missed and says so once, in the player's words, a refusal kept as the reason. A command raised
while the clock runs that fails is said once the same way.

**Notices and questions.** An identical unread notice is brought up to now, not added; the save keeps the latest 500; a
command's rollback cuts the log back to where it was. A question is raised once per thing it's about while it's open,
and raised again only updates its urgency, words and date; it closes by an answer on Home, by its own screen, by
Dismiss or by the tick after its date, and is pruned 180 days after closing; Home lists the open ones, overdue first,
then by urgency, then by date; Updates lists every notice, a run of one notice as one row.

**Continuity.** Every way of moving the clock from a screen, the live tick among them, goes through one `advanceTo`
that stops at what wants the player; the stop pauses the save and holds what the clock stood at, where it was headed
and where it was sent from, so Go carries the same jump on; a dialog that reads the clock holds it; a fault in the clock
pauses it once and says so; the save is written every 45 seconds when something changed, and on leaving.

**Found no defect in the game.** Found and corrected in the records: M6's change to `credit.ts`, `cardlife.ts`,
`accountlife.ts` and `finance.ts` moved the lines that ten rows of the guide area's wiring list and the money area's
register cite, and `tests/b20-guide-wiring.test.ts`, which holds the wiring list to the line each command is registered
on, caught the first of them here (`bank.claim_unclaimed` at `accountlife.ts:689`, now 690); M6 ran the money area's
tests and the fix's neighbors, not that one. The ten citations and the register's ranges in those four files are at
the code's lines as it stands. One thing noted and not changed: `world.dismiss_decision` takes a question already
answered (it reads only whether it was dismissed), which nothing offers, since Home lists open questions alone and a
closed one's look says there is nothing to press; dismissed after an answer, its closing date stays the answer's.

**Register:** 14 more rows, all Verified, by inspection and the tests named on each. Running total: 1058 Verified,
6 Fixed And Verified, 1 Blocked, 20 Deferred, 61 Not Tested (the guide's 49 and persistence's 12).

### M10: The Guide, The Tutorial, The Help, Navigation And The Journeys

**Read on `691556f0`.** The guide's content whole (`src/engine/content/tutorial.ts`: the twenty chapters and each
one's `opens` list, 234 entries between them), its gate (`src/engine/world/tutorial.ts`: `isOpen`, which opens a
feature with no chapter and everything once the guide is finished; `lockedBecause`, which names the chapter and its
place in the order; `tutorial.read`, which marks a chapter once and names the next; and the command bus's check before
every command while guided), the guide's parts (`src/ui/guide/Guide.tsx`: Gated, which opens the chapter on a locked
press; LockedPanel, which says what the panel will show and offers Read About It; the strip's n Of 20; Guide in the
bar; the dialog with I’ve Read It, Next and Try It), the reference (`Help.tsx`: ? opens it on this screen's entries,
/ finds, an entry's links open as their chapters are read, How This Works beside a feature), the shell
(`GameShell.tsx`: the rail and its current mark, the drawer under 56.25em or 500px, your name at the foot locked until
"You As An Actor", Save & Exit), the router (a screen, Locked, or no such screen), the menu's entries with their groups
and features (Calendar and Updates from Home alone since brief 24), Home's panels and buttons, the time controls'
gates, Why It Went This Way's button, the three heads (Worth, the School's, Papers'), the keyboard (H, C, P), the turn
frame, and the start entries' three pages with their eight promises; ran the area's 32 test files (413 tests, green).

**Walked on the built app** (`walk/README.md`, the images beside it): a new life from The Start through creation and
the guide's first five chapters at 1440×900 and at 844×390 on touch, 27 steps each, every check true (opens paused on
chapter 1 with Play, Sleep, Advance, Where You Are and Weather locked; I’ve Read It opens what the chapter names and
nothing more; Next is the one after; Play runs and Pause stops the clock; Advance's eight lines; Tomorrow Morning
through On The Way to the stop at Registration And Your Account with Go and Stand Here; Sleep unread opens its chapter;
Save & Exit and Continue keep the moment and the chapters); brief 23's capture of every screen of two played lives at
1440×900, 844×390 and upright 390×844 (132 entries: no page or console problem, nothing wider than the window, nothing
clipped, cut without a title, bleeding or squeezed; the turn suite true on both lives); and the cohesion walk's eleven
screens (nothing broke the thread: no errors, no leaks, every handoff landed).

**Found no defect in the game.** Found and corrected in the tools: `tools/cohesion-walk.mjs` hadn't run since the
Windows hygiene commit of 2026-09-24 and predated brief 20's birthplace picker and the guide's locks; as it stood it
never left Identity and reported the four screens it never reached as broken, and with the birthplace typed it pressed
the locked name at the rail's foot and reported that the rail still marked Home. It types the birthplace, reads a
`title` that begins "Locked" as a lock and takes the guide's dialog as the lock's reason now. The creation walk's own
first run misread Play for the same reason (it asked for a button reading exactly "Play" where the button reads "Play"
and "Locked" until "The Clock"); the check was corrected before the run kept. Nothing noted and left.

**Register:** 49 more rows, all Verified; 25 of them by the walks as well as by inspection and the tests, the rest by
inspection and the tests alone (chapters 6 to 20, Show The Reasons, the start entries' promises). Running total: 1107
Verified, 6 Fixed And Verified, 1 Blocked, 20 Deferred, 12 Not Tested (persistence's 12).

### M11: Persistence, Save Compatibility And The Longer Playthroughs

**Read on `3e359d4b`.** `createSave` and `loadSave` (`src/engine/index.ts`: a new life is made under every
once-on-opening rule, so its `opened` list is full; an opened save runs each once-on-opening step once and the rest
change nothing on a save they've visited), `migrate` (on every open, by the save's shape and not its number, which has
read 94 since `ff837dfa` on 2026-10-10: every collection created where absent, the fields nothing reads dropped,
records re-stamped, questions dated, the title, the personality and the citizenship put right, a newer save a
problem), `openSlot` (an empty slot or no backup refused in words; a newer save refused with nothing changed; a save a
step changed written back once after a backup, and not when opened out of the backup), `validateUniverse` and
`loadPlacesFor`, the adapter (`serialise`, `deserialise`, the player's words for a damaged file), the local store
(gzip with its marker, an older plain save still read, IndexedDB with a save still in local storage moved across once,
a backup before every write and the slot's key written last and whole, a delete that keeps a readable save and never
writes a damaged one over a readable backup, restore as a swap), the Base44 adapter and its three functions (the
idempotency key from the save, the moment, the playtime and the schema; the local mirror on every write; the server's
receipt replayed, forward progress required, the previous payload kept as the backup; a slot cleared and released),
the guard (`inspectPayload`, `requireForwardProgress`), the schema pin in its two places, Your Saves, the start's four
stages, Save & Exit's re-read of the slots and the provider's autosave (every 45 seconds when something changed, and on
leaving); ran the area's 19 test files (172 tests, green), which open the seven fixtures under `tests/fixtures` (brief
20's and the acceptance pass's played lives, all at 94) at their moment and play each on a day.

**Probed** (`tests/b26-persistence-repeats.test.ts`, 6 tests): a save carrying a field 2026-10-02 dropped, opened
twice, is written back once after a backup of what was stored, and the second open is current and writes nothing; a
save from a newer build is refused twice in the same words with its bytes unmoved; a write that fails on the slot's own
key leaves the slot readable and as it was, says so in the player's words, and the next write goes through; a slot
deleted twice is empty once with its backup kept, restored it holds the life, restored again it holds the same life;
thirty days reopened through the slot every five, with Save & Exit's own write before each, are the same to the byte as
the life played straight, and `openSlot` never writes a current save back; `loadSave` on the same bytes twice, on a new
life and on one played a fortnight, gives the same bytes. Three mutations each caught: `openSlot` writing back every
open (two tests fail), a delete keeping no backup (one), the slot written before its backup (two).

**Found and fixed:** the guard measured its 24 MiB limit in UTF-8 bytes (since 2026-10-12) and reported the save's size
in the string's length, so the row's `payload_bytes` and the slot card's size on Base44 were a byte short for every
accented character in a save. `inspectPayload` returns the count it measured (`base44/shared/guard.js`);
`tests/server-guards.test.ts`, which asserted the string's length and so agreed with the under-count, asserts the UTF-8
count, with a case of accented names that fails on the old guard (2 of 24). It takes effect on the functions' next
deployment, which waits on the owner and the gate (rule 14). Noted and not changed: on Base44, `openSlot`'s explicit
backup before writing back a save brought forward goes through the entity, where the function's own write keeps the
previous payload as the backup anyway; the two agree, so the step is spent twice and loses nothing.

**Register:** 12 more rows, 11 Verified and 1 Fixed And Verified (`persist.guard`); 9 of them by M10's walks as well,
which made a life, saved and left it and opened it again through its slot. Running total: 1118 Verified, 7 Fixed And
Verified, 1 Blocked, 20 Deferred, 0 Not Tested. Every feature the register lists has a status read from the code.

## Final Runs, Gate And Report (M12)

(Written at the close.)
