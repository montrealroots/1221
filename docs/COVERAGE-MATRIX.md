# SLATE Coverage Matrix

What the game covers, feature by feature, reconciled against the code that
carries it. Every row says one of three things, and nothing is promoted
because its landing page works:

- **Implemented** — built, on screen, held by tests.
- **Partial** — built to a stated depth; the gap is named in the row.
- **Not built** — nothing in the tree.

This build is the scope the owner set on 2026-10-09: the life as it stood on
2026-09-29 (its Home, daily life, creation and guide), with the banking, the
school and the papers as they stood on 2026-10-09, and without the home, the
travel, the cars, the land and the career. What is left is a person, a place,
a calendar, the weather, the day's food and rest, money, the drama school and
the papers, with the engine they need. Nothing below claims otherwise.

## What is in the build

| Feature | State | Where it lives | Held by |
| --- | --- | --- | --- |
| Startup sequence | Implemented — the mark, the storage it picks, the schema it reads, and the slots it hands on | `src/ui/startup/StartupSequence.tsx` | `persistence`, `base44-adapter` |
| Save slots | Implemented — three slots, each its own universe, with migration and validation on the way in, and a backup that says which world date it holds so restoring and deleting are not blind | `src/ui/saves/SaveSlots.tsx` | `integrity`, `persistence` |
| Character creation | Implemented — identity, whether the player is billed as an actor or an actress, a personality of seven dispositions and up to four traits, race or ethnicity, where the player was born and so which country they are a citizen of, where they live, genres (a play of a kind they love is a better day; the interests beside them were removed on 2026-10-10), a background in their own words, and the money they start with | `src/ui/creation/CharacterCreation.tsx` | `creation`, `citizenship`, `portrait`, `world-map` |
| The geography map | Implemented — every country drawn from the projected world map, 170,911 cities behind it, loaded a country at a time, on the creation screen twice | `src/ui/creation/WorldMap.tsx`, `src/ui/creation/LocationPicker.tsx`, `src/engine/content/geography.ts` | `geography`, `world-map` |
| Portrait | Implemented — a headshot cropped to a fixed frame and carried on the person | `src/ui/creation/PortraitPicker.tsx` | `portrait` |
| Performer title | Implemented — actor or actress, settled by the pronouns and picked under they/them, stored on the player and said back on Home, the rail and the save slot. It is a word and decides nothing else | `src/engine/core/performer.ts` | `creation`, `simulation` |
| Personality | Partial — seven dispositions and thirty-five traits, picked on their own step and stored on the player. Three dispositions and every trait's declared knobs move stress, sleep, the energy a night puts back, hygiene, mood, what food costs, what illness takes and the receipts a return deducts, and the sleep the game suggests counts them. Risk tolerance sets the card's autopay; openness, extraversion and agreeableness how a day of school work is taken (`systems/enjoyment.ts`). A night away and a career's early and late calls went on 2026-10-09 | `src/engine/content/personality-traits.ts`, `src/engine/systems/personality.ts` | `personality`, `creation` |
| Home | Implemented — the day, where you are, what needs you, what happens next, how you are, the weather, money, the school and the papers. Its Home, Career, Travel, Cars and Land panels went on 2026-10-09 | `src/ui/screens/Home.tsx` | `interface`, `navigation`, `smoke` |
| Calendar | Implemented — the month, collisions, the observances of the country you are standing in, and plans of your own | `src/ui/workspaces/CalendarWorkspace.tsx`, `src/engine/world/calendar.ts`, `src/engine/world/plans.ts` | `calendar`, `holidays`, `plans` |
| Weather | Implemented — a climate model per city from season, latitude and the kind of place it is, with a week ahead. It sets the weeks the flu comes round and whether a workout is a run | `src/engine/systems/weather.ts` | `weather` |
| Time controls | Implemented — live play, sleeping, and skipping to an event with what it would cross shown first | `src/ui/shell/TimeControls.tsx` | `simulation`, `realclock` |
| Wellbeing and sleep | Partial — the model, the night, the waking hours charged as the clock moves (`life.waking`), and the night nobody chose, slept when the clock is sent through one rather than at every midnight (`life.night_alone` and the rollover). Sleep, eating, ordering in, a shower, a workout and an hour unwinding are how a player spends a day on them (`life.sleep`, `life.look_after`); the day's food is bought each morning (`systems/spending.ts`). Every dial decides something in the body or the workout, and the school reads readiness | `src/engine/systems/life.ts` | `simulation`, `smoke`, `endurance`, `personality`, `looking-after`, `wellbeing-bites` |
| Money | Implemented — a ledger that conserves, kept in the currency of the country a save starts in; food with each day's meals, paid as the character pays the day (the debit card, the credit card or cash), an EBT card's SNAP first; a fee or a bill from the current account; what can't be paid owed, and paid back from the bank as money comes; a card with a statement, a due date, interest and late fees, which is the bank's own (see Banking); and a credit record that prices it. Rent, bills, a notice to pay or quit and an eviction went with the home on 2026-10-09 | `src/engine/core/ledger.ts`, `src/engine/systems/finance.ts`, `src/engine/systems/spending.ts`, `src/engine/systems/credit.ts` | `money`, `arrears`, `endurance` |
| Banking | Implemented — a real bank where the character lives: the thirteen countries researched in depth, with each bank's own account names, fees and fee waivers (wages paid in, a balance kept, age), published savings rates with their floors, caps, announced changes, bonuses and paying months, the tax a country has banks take off interest; every other country's biggest banks by name. Account numbers in each country's format with real check digits. The credit card is the bank's own, run on the bank's screen: 522 banks' cards by name with their terms (the rate, or the range a record is priced within; revolving or paid in full each month; the yearly fee, the minimum, the late fee and the days to the due date), 28 banks that issue none, and 62 countries' caps on the rate or the late fee (`content/cards.ts`); a term not found is SLATE's estimate, and the screen says which. The card stays with the bank that issued it when the character switches. Statements for every account held, open or closed, month by month and in Germany quarter by quarter, where the bank also closes the account's interest and fees each quarter; the card's statement with the minimum payment warning; the year's interest, tax and fees; and alerts (`systems/statements.ts`, `ui/bank/BankStatements.tsx`). How each thing is paid: the day's spending on the debit or credit card or in cash (rent and bills went with the home on 2026-10-09); savings linked to the current account or not; standing orders, payments set for a date, stopping a check for the bank's fee, and taking back a SEPA direct debit within eight weeks (`systems/payments.ts`, `content/payments.ts`, `ui/bank/BankPayments.tsx`). The card's life: applying for the bank's card, closing it, moving its statement day, asking for a higher or lower limit, opting in to going over it (US), and asking for a hardship plan; the bank suspending it after two missed payments and charging it off to collections after six (the FFIEC's 180 days), taking a British holder's missed payment from their other accounts with it, a bounced autopay's fee, the US caps on a late fee and on first-year fees, and Britain's persistent-debt rules (`systems/cardlife.ts`, `systems/credit.ts`). How a card charges interest: the rate set by the record when the card opens and held there, interest built each day on the day's balance and compounded, the grace period kept by a statement paid in full, lost by one that isn't (back to the day the spending went on), and regained with trailing interest, the US penalty rate after a payment sixty days late with 45 days' notice and lifted after six on time (Reg Z §1026.9(g), §1026.55), Britain's default fees free of interest for 28 days, the average daily balance on the statement, and a credit balance sent back on asking and, in the US, after six months. Cash in hand: taken out at the bank's ATM, another bank's, the counter or Britain's Post Office for each of 60 banks' researched fees and daily limits, or as a cash advance for the card's fee and rate with no grace period and within its cash limit; paid in; spent on the day's groceries; payments to the card split to the dearer balance first; and Germany's €2,000 a month from savings (`systems/cash.ts`, `content/cash.ts`, `ui/bank/BankCash.tsx`). Every function of an account and a card, against SLATE, is in `docs/BANKING-FUNCTIONS.md`. Overdrafts the way each bank runs them (arranged, by the item, or against time deposits), personal loans priced by the record and repaid monthly, term deposits locked for their term, and a switch to another bank, through Britain's seven working days or the same day elsewhere; France's €8 an operation, Spain's overdraft commission within the law's cap, the higher rate past a German Dispo, New Zealand's unarranged overdraft fees, Canada's returned-payment fee, card, dormant and quiet-month fees, introductory rates and Iceland's interest-tax refund. The 226 other countries carry researched sheets where found (216 countries, 202 banks with an account name, 182 with a savings rate, and 22 fees charged with the waivers their banks write) and IBANs built to each registry structure with the bank's own code (321 of 348 banks) | `src/engine/systems/banking.ts`, `src/engine/systems/banknumber.ts`, `src/engine/core/banknumbers.ts`, `src/engine/content/banks.ts`, `src/engine/content/banks-thirteen.ts`, `src/engine/content/banks-world.ts`, `src/engine/content/banks-world-sheets.ts`, `src/engine/content/banks-world-iban.ts`, `src/engine/content/banks-world-fees.ts`, `src/engine/systems/lending.ts`, `src/engine/content/banks-lending.ts`, `src/engine/content/cards.ts`, `src/engine/systems/credit.ts`, `src/ui/workspaces/BankWorkspace.tsx`, `src/ui/bank/BankLending.tsx`, `src/ui/bank/BankCard.tsx` | `banking`, `banknumbers`, `lending`, `bank-fees`, `cards` |
| Birthdays and the end of a life | Implemented — a birthday each year at nine in the morning, and each year's chance of the life ending from the US 2024 life table, moved by the country's life expectancy and the body's condition; an ended life stops the clock and opens onto what it came to | `src/engine/systems/birthdays.ts`, `src/engine/systems/mortality.ts`, `src/ui/shell/LifeEnded.tsx` | `mortality` |
| The guide | Implemented — seventeen chapters (it read sixteen until a recount in the acceptance pass of 2026-10-11), read in order, each opening the part of the game it describes: its commands in the engine and its controls, panels and underlined words on screen. A new life starts paused with everything shut but the guide | `src/engine/content/tutorial.ts`, `src/engine/world/tutorial.ts`, `src/ui/guide/Guide.tsx` | `tutorial` |
| The Decision Center | Implemented — answering, dismissing, closing on a date and forgetting are built and tested, and each year's return and a student's ending status raise their own | `src/engine/world/world.ts`, `src/ui/looks/attention.tsx` | `smoke`, `looks` |
| Drill-down | Implemented — every noun on every screen opens onto what it is, and the graph is crawled end to end | `src/ui/looks/` | `looks` |
| Drama school | Implemented — the MFA in Acting at Yale as it stood on 2026-10-09: orientation, classes and the 21 skills, coursework and notes, classmates and their moments, castings, productions and their rehearsal process, the Cabaret and the Summer Cabaret, evaluations, standing, work-study and its pay, the term's account and the plays to read; the degree or a dismissal ends it at the results | `src/engine/systems/school.ts`, `src/engine/systems/coursework.ts`, `src/engine/systems/classmates.ts`, `src/engine/systems/production.ts`, `src/ui/workspaces/SchoolWorkspace.tsx` | `school`, `learning`, `journey-school-year`, `journey-school-production`, `school-everyday` |
| Papers | Partial — health cover and care, the tax return, unemployment and the benefits, the state pensions, the passport and ID, and a student's US status and OPT, as they stood on 2026-10-09. Benefits that paid rent pay nothing toward it, and the O-1, the talent routes to residence and the driving license went with the career and the cars | `src/engine/systems/health.ts`, `src/engine/systems/taxreturn.ts`, `src/engine/systems/unemployment.ts`, `src/engine/systems/documents.ts`, `src/ui/workspaces/PapersWorkspace.tsx` | `safetynet`, `retirement`, `permission`, `documents` |
| Server-checked persistence | Implemented — the guards between a browser and storage, and the client that speaks the platform's protocol | `base44/`, `src/engine/persistence/` | `server-guards`, `base44-adapter`, `base44-contract` |

## Player-facing acceptance (2026-10-11)

The journeys a player takes, played and checked, with where each is held.

- "Played" means through the game's own commands, or, for the built app, through its visible controls.
- Where a journey opens a save written by a scenario, the row says so.

| Journey | State | Held by |
| --- | --- | --- |
| Creation to Home: Continue held until a step validates, the birthplace asked for | Implemented, played in the built app | `tools/acceptance-ui.mjs` (1440, 390) |
| The guide: every control locked until its chapter is read, open after | Implemented, played in the built app | `tools/acceptance-ui.mjs` |
| Advance through each commitment on the way; Look After Yourself | Implemented, played in the built app | `tools/acceptance-ui.mjs` |
| Coursework: a greyed step says why, a partner's request answered, a step done, a playing chosen, table work | Implemented, played in the built app | `tools/acceptance-ui.mjs` |
| Practice: an hour, its tier and focus, and its explanation (gain, tier, repeats, a tired day, a long run) | Implemented, played | `tools/acceptance-ui.mjs`, `tests/variety.test.ts` |
| A director's note worked is answered; one not worked comes back as still | Implemented, played | `tests/journey-school-production.test.ts` |
| A second-year leave and the return into the later class, through to the degree | Implemented, played | `tests/journey-second-year-return.test.ts`, `tools/scenarios.ts` (`leave-year2`) |
| Banking: a transfer refused in the engine's words, then made | Implemented, played in the built app | `tools/acceptance-ui.mjs` |
| Federal and state tax: paid, planned, refunded and collected apart; the budget's reservation equals the screens' total | Implemented, played | `tests/state-tax.test.ts`; `tools/scenarios.ts` (`tax-plan`, `state-plan`); `tools/acceptance-ui.mjs` (from a save) |
| Save & Exit and Continue to the same moment; older saves opened and migrated once | Implemented, played | `tools/acceptance-ui.mjs`, `tests/save-migration.test.ts` (saves written at ff837dfa) |
| A preferred genre is enjoyed, not expertise; perfect work doesn't guarantee a part | Implemented | `tests/acceptance-contract.test.ts` |

## The limitations pass (2026-10-11)

What the acceptance pass left as limitations, closed or enlarged, with where each is held. The detail is in
`docs/verification/LIMITATIONS-PASS-2026-10-11.md`.

| Limitation it was | State now | Held by |
| --- | --- | --- |
| A class the student wasn't in had no Rep company or Cabaret show | Implemented, played: the third-year fall's best in the Rep's company, a Cabaret show a term for every class | `tests/journey-class-left-behind.test.ts`; `tools/scenarios.ts` (`withdraw`, `leave`) |
| Classes stopped when the student left the School | Implemented, played: followed to the degree, a term left partway not replayed | `tests/journey-class-left-behind.test.ts`; `tools/scenarios.ts` (`withdraw`); `tools/acceptance-ui.mjs` (from a save) |
| State collection researched for three states | Implemented: every state a life can owe, fifteen; three with tax tables and no city stay unresearched | `tests/state-tax-states.test.ts` |
| A state never assessed a non-filer | Implemented, played: each state's letters, assessment, collection, replacement | `tests/state-tax-states.test.ts`; `tools/scenarios.ts` (`nonfiler`); `tools/acceptance-ui.mjs` (from a save) |
| No refund offsets between states | Implemented: New York's, California's and Connecticut's partners | `tests/state-tax-states.test.ts` |
| 42 scenes, 26 plays | Enlarged, still finite: 67 scenes, 30 plays, 27 exercises. It said 56 scenes until brief 09's follow-up corrected it: on 2026-10-16 the integration pass added four drama scenes (`content/scenes-public.ts`), brief 09 four played out to a house (`content/scenes-house.ts`) and its follow-up Scapin's sack scene (`content/scenes-scored.ts`); it said 65 until brief 10 added two public meetings (`content/scenes-meeting.ts`) | `tests/scenes.test.ts`; `tools/variety.ts` |
| Older credits' years | Implemented: dated once by their casting notices; the résumé shows the year | `tests/credits-dated.test.ts` |

## The remaining-gaps pass (2026-10-11)

What the limitations pass named as not modeled, and the states it found untaxed. The detail, with sources, effective
dates and assumptions, is in `docs/verification/REMAINING-GAPS-PASS-2026-10-11.md`.

| Gap it was | State now | Held by |
| --- | --- | --- |
| Indiana, the District and Oklahoma had a city each and no rule | Implemented: each taxed by its own rule, its effective dates, and its collection rules | `tests/tax-places.test.ts`, `tests/tax-coverage.test.ts`, `tests/state-tax-states.test.ts` |
| Local taxes missing: four New York City boroughs, Marion County, Philadelphia, Columbus, Portland, Denver | Implemented: computed, withheld, filed and collected by their own collectors; 32 cities confirmed to have none | `tests/tax-places.test.ts`, `tests/tax-coverage.test.ts` |
| A taxable place with no rule went unnoticed | Implemented: every US city's state and local tax is a rule or a confirmed none, and play can't reach the 231 countries without one | `tests/tax-coverage.test.ts` |
| Liens | Implemented, played: notice of intent, filing and its fee, payment, release on its own or on request, a release fee, a lien a plan asks, a lien filed in error withdrawn with its fee refunded; the IRS's notice of federal tax lien at $10,000 at the LT11, released, withdrawn | `tests/liens-and-arrangements.test.ts`, `tests/liens-step-skip.test.ts`, `tests/tax-places.test.ts`; `tools/scenarios.ts` (`lien`); `tools/acceptance-ui.mjs` (from a save, 1440 and 390) |
| Pennsylvania's extended plan, New Mexico's longer plans, Louisiana's down payment and formal agreement | Implemented: asked, decided on the statement from the player's own records, declined where it doesn't fit, replacing a plan in force, with its lien | `tests/liens-and-arrangements.test.ts` |
| Oregon's 100% for three years unfiled | Implemented: charged against each year's tax net of penalties already charged, waived by its schedule once the player's own return is filed | `tests/liens-and-arrangements.test.ts` |
| Massachusetts's discretionary doubling | Not applied, said so in its letter: it's the commissioner's discretion | `tests/liens-and-arrangements.test.ts` |
| A missed plan payment recovered through the screens | Implemented, played: the IRS plan in default, caught up, in force after a reload. Connecticut's own plan ends on a missed payment, by its researched rule | `tools/scenarios.ts` (`missed-plan`); `tools/acceptance-ui.mjs` (from a save) |
| Saves from before liens | Implemented: opened with nothing charged or filed after the fact, opened again the same | `tests/save-migration.test.ts` (saves written at 086d00ca) |

## The attributes-and-genres pass (2026-10-12)

What the owner's brief "Bring SLATE’s Attributes, Genres, And Their Integration To The Highest Demonstrable Standard"
asked, and where each is held. The detail is in `docs/verification/ATTRIBUTES-GENRES-PASS-2026-10-12.md`.

| Asked | State now | Held by |
|---|---|---|
| Every attribute, technique, genre, material demand, training action and evaluation consumer audited | Implemented: the itemized matrix gains the material demands and the training and preparation actions; the genre coverage gives each genre its kind of demand and its brief | `docs/ATTRIBUTES-MATRIX.md`, `docs/GENRE-COVERAGE.md`, held by `tests/attributes-matrix.test.ts`, `tests/genre-coverage.test.ts` |
| Every genre has playable material with different interpretations | Implemented: 149 original briefs, one written for each genre, 302 readings; 98 genres had none | `tests/briefs-content.test.ts`; played through the commands in `tests/genre-coverage.test.ts` |
| Choices reach preparation, evaluation, feedback and history, without one preferred interpretation | Implemented: a reading leans the work and draws on abilities, never misfits; only the material or a note said before misfits | `tests/briefs.test.ts` |
| Mixed genres and tonal transitions | Implemented: a change of tone and a tone held at once ask different abilities and more rehearsal; tags reordered or repeated change nothing | `tests/briefs.test.ts`; `tools/brief-balance.ts` |
| Progression: weaknesses addressable, neither specialist nor generalist always ahead, the 100/100 contract | Implemented: a weakness trained raises the work, an unread input doesn't; each specialist ahead somewhere and behind elsewhere across the School's work; exactly 100 at full in every brief, played to it in two genres | `tests/briefs.test.ts`; `docs/verification/BRIEF-BALANCE.md`; `docs/verification/briefs/mastery-*.json` |
| Balance across the catalog, played, with held-out seeds | Implemented: all 149 briefs by expected result; five ways of spending 24 hours on matched and held-out seeds | `docs/verification/BRIEF-BALANCE.md`, `docs/verification/briefs/strategies-*.json` |
| Long-term variety and continuity | Implemented: a take's purpose, one callback a round, the same again worth half; 120-day journeys for four profiles on two seeds | `docs/verification/briefs/journey-*.json` |
| The player's journey through the controls, desktop and phone | Implemented, played in the built app: choose a genre, inspect, prepare, choose, tape, read, train, tape again, save and reload | `tools/acceptance-ui.mjs` (1440 and 390), `docs/verification/acceptance-ui/briefs-2026-10-12/` |

## What was taken out

The revamp removed, with their screens, their content, their tests and their
tools:

- **The character sheet.** The 813 acting attributes, the prodigy, taste and
  genre mastery, and the premise record that carried the performer's title.
  The title and the personality came back: see the rows above.
- **The film career and the family business.** Casting and the audition room,
  the company and its incorporation, the lot, making a picture, selling it, the
  reimbursement, VAT, the inventory ledger, the crew, the trouble a shoot can
  run into, maturity and periods, the sugar quota, and the film rebates in the
  tax tables.
- **The family and the land.** The parents and the twin, who they are to the
  player and where the player stands with them, the household, the land, the
  house on it and the security around it.
- **The second citizenship, and the question of the first.** A player is a
  citizen of the country they were born in, and the place of birth decides it.
- **The job engine** (2026-09-26), when the owner kept SLATE to acting. The
  day job at 1,622 real employers, 694 of them with their own published pay, the
  rota and its shifts, paydays and tips, the payslip worked by each country's
  own rules and the local taxes, the labor law where the character worked
  (premiums, overtime, leave, sick pay, notice, layoffs and severance, and the
  cities' own sick-leave ordinances), unemployment benefit, the year-end tax
  return, France's prime d'activité, the right to work, Before Acting on the
  creation screen, and Your Work. The body a character starts with, which
  Before Acting set, is everybody's fifty now.

- **The scope reset** (2026-10-09), set by the owner: the game went back to
  the setup of 2026-09-29 with the banking, the school and the papers of
  2026-10-09, and the home and its rent and bills, the rented room, the
  journeys, the cars, the land and the career went, with what the line of
  2026-10-09 had built on them: the shops and catalogs, belongings, clothes,
  the kitchen, routines, the people and the family, the industry and its
  database, and the rail. The baseline is the tag
  `pre-scope-reset-2026-10-09`.

Earlier cut-downs took out the shops, the schools, the phone, travel,
relationships and the rest; those are listed in the history of this file.

A save written by an older build still opens — `migrate` sheds the fields this
build no longer reads and leaves the collections it has no screen for in place
as inert records — but none of those screens is coming back in this build. The
title and the personality are the fields that came back. For the title, a save
from before 80 keeps the one it was made with, and one written under 80 takes the player's back from the
premise record 80 left in place, or from their pronouns where there is none.
From 82 an older save's second citizenship is dropped, and its citizenship
becomes the country of the birthplace. From 83 a save from before 80 keeps the
personality it was made with, and one written since is given the one creation
starts everybody on, with no traits. 87 changed nothing in a save from this
line. The line this one replaced as main had used 83 for a different build and
gone on to 86, so this line skipped to 87. A save from that line is migrated
like any other older one, and also sheds `reputationDriftedAt`, which only that
line wrote. Opening a slot now runs the migration whatever number the save
carries, so a number two lines share cannot skip it. 88 gave every person the
moment their waking day began, which the clock charges waking time from; a
save from before it comes in charged up to the next midnight, which its last
rollover had already paid for. From 2026-09-26 a save from before loses its
day job, its pay record, what they did before acting, and the shifts,
paydays, tips and benefit payments still on its calendar; what was paid stays
in the ledger. 90 (2026-10-09) sheds what the home, the journeys, the cars, the
land, the career and what went with them kept, the calendar's and the
decisions' leftovers nothing handles, and a classmate's career; a home's
deposit and rent paid ahead come back to the bank, and a save whose ledger
doesn't reconcile is refused unchanged. 94 (2026-10-10) drops each person's
interests and what they'd done of them, at the owner's word; their genres, and
the tickets paid on the ledger, stay.

## The engine, as it now stands

A hundred and seventeen commands and four routes. The appendix below is generated from the
code, so it is the count to trust.

Three are a person deciding something rather than answering something.
`calendar.schedule` puts a thing on the calendar, `calendar.cancel` takes one
off again while it has not started, and `calendar.skip` is standing at it and
not going. A plan is an ordinary timeline item, which is why the clock stops at
one, why two at once are flagged, and why being somewhere else when it comes
round is noticed.

Sleeping is the other thing a player does that moves the world (`life.sleep`),
with eating, showering, working out and unwinding (`life.look_after`), each of
which takes its own time off the clock and is refused rather than run over
anything that needs the player.

Money moves on its own: a check being cashed, a standing order, a payment set for a date, and the card's statement and due date are timeline items like any other. What a player does to it by hand: paying the card now (`finance.pay_card`) and whether autopay clears the whole statement or the minimum (`finance.set_autopay`), on the bank's screen since 2026-09-26. Rent, moving and eviction went with the home on 2026-10-09, and shifts, paydays and the seven `work.*` commands with the job engine on 2026-09-26.
The rest is the Decision Center answering, dismissing and marking read
(`world.take_decision_action`, `world.dismiss_decision`, `world.mark_read`) and
the preferences (`world.set_preferences`). The bank moves money between a person's own accounts (`bank.transfer`), and
opens and closes a savings account (`bank.open_savings`, `bank.close_savings`);
its interest and fees fall on the last day of the month (`bank.month_end`).
It arranges or closes an overdraft (`bank.arrange_overdraft`), puts money in a
term deposit (`bank.open_term`), lends and is paid off (`bank.borrow`,
`bank.repay_loan`, with each payment `bank.loan_due`), and, where a country has a
switching service, moves a person to another bank (`bank.switch`, completing as
`bank.switch_complete`). Elsewhere, from 2026-10-10, the steps are the player's
(`systems/bankmoves.ts`): an account opened at another bank (`bank.open_current`,
decided as `bank.application` where the bank reviews), money sent between banks
(`bank.transfer`, arriving as `bank.transfer_arrives`), the primary account
(`bank.set_primary`), where wages are paid (`bank.redirect_deposits`), each
standing order's and each card's autopay account (`bank.set_order_source`,
`card.set_autopay_from`), and a current account closed (`bank.close_current`,
or later as `bank.current_closes` where the bank waits on pending items). An account left overdrawn for sixty days is closed and charged off to collections, paid with `bank.pay_collections`. A US bank pays an everyday debit card purchase into an overdraft only for someone who opted in (`bank.debit_overdraft`).
Reading a chapter of the guide is
`tutorial.read`, and until a chapter is read the guide refuses every other
command it opens (`world/tutorial.ts`), whatever screen sends it.

Time also does three things on its own as it passes, rather than at an instant.
`life.night_alone` puts somebody to bed when the clock is sent more than an
hour on through the rest of a night the player kept them up in, or stopped in
the middle of, for a plan or the morning a skip was sent to; it also pays a
night that a stop in its first hour left unpaid. `life.waking` charges each
person for the hours they are awake, wherever the clock stops, so Home's dials
move during a day of play and midnight no longer charges the day ahead. From
2026-10-21 (brief 19) `pro.postings` posts each Monday's fictional roles at
nine as the clock passes it, closes a role whose week of submissions is over,
and has the agent submit for a role his breakdown brought once it suits and
the materials pass (`systems/projobs.ts`).

The routes are `/workspace/calendar`, `/workspace/bank`, `/workspace/school`, `/workspace/papers`, from 2026-10-09 `/workspace/profile`, from 2026-10-20 (brief 19) `/workspace/career`, the professional record's, and from 2026-10-23 (brief 23) `/workspace/updates`, every notice read and unread, each kept in the address's hash so the browser's Back and Forward move between them; Home is served by the shell itself. The career's, the homes', travel's, the cars', the land's and the line of 2026-10-09's other screens went on 2026-10-09, and `/workspace/work` with the job engine.

## The guide, chapter by chapter

The order a guided life reads them in, and what each opens. `tests/tutorial.test.ts`
fails the build if a command, a kind of look or a gated control belongs to no
chapter or to two, or if a chapter opens nothing.

| # | Chapter | Opens |
| --- | --- | --- |
| 1 | Your Life, Hour By Hour | `ui.where` `look.day` `look.place` `look.region` `look.country` `look.currency` `look.season` `look.daylight` |
| 2 | What’s Coming | `ui.calendar` `ui.open-calendar` `ui.go` `calendar.skip` `look.entry` |
| 3 | The Clock | `ui.play` `world.set_preferences` |
| 4 | Moving Time On | `ui.advance` `ui.skip` |
| 5 | What Needs You | `ui.needs` `world.mark_read` `world.take_decision_action` `world.dismiss_decision` `look.notification` `look.decision` |
| 6 | How You Are | `ui.how` `look.dial` `look.readiness` `look.trait` `look.condition` |
| 7 | Sleep | `ui.sleep` `life.sleep` |
| 8 | Looking After Yourself | `ui.look-after` `life.look_after` |
| 9 | Your Own Plans | `calendar.schedule` `calendar.cancel` `look.plans` `look.stretch` |
| 10 | Weather | `ui.weather` `look.weather` `look.forecastday` `look.hours` `look.skyhour` `look.skyweek` |
| 11 | Drama School | `ui.school` `school.call_in_sick` `school.withdraw` `school.request_leave` `school.cancel_leave` `school.return_notice` `school.buy_affiliate` `school.reregister` `school.request_repeat` `school.cancel_repeat` `school.appeal_leave` `school.request_extra_term` `school.request_aid_review` `school.pay_balance` `school.request_conversion` `school.make_up` `school.extend_incomplete` `school.take_shift` `school.cabaret` `school.summer_cabaret` `school.orientation` `school.prepare` `school.choose` `school.read_feedback` `school.ask_partner` `school.answer_partner` `school.respond` `school.make_amends` `school.buy_ppe` `school.approach` `school.choose_playing` `school.choose_part_playing` `school.cancel_rehearsal` `school.learn_part` `school.review_blocking` `school.work_note` `work.identify` `work.try` `work.settle` `plays.read` `plays.research` `school.choose_showcase` `look.school` `look.course` `look.skill` `look.assignment` `look.classmate` |
| 12 | You As An Actor | `ui.profile` `practice.exercise` `genre.study` `brief.prepare` `brief.choose` `brief.reader` `practice.self_tape` `look.ability` `look.genre` `look.work` |
| 13 | Your Career | `ui.career` `ui.career-reference` `pro.set_name` `pro.headshots` `pro.update_resume` `pro.cut_reel` `pro.mix_demo` `pro.join_sag` |
| 14 | Representation | `pro.agent_notice` `pro.agent_check` `pro.ask_referral` `pro.send_materials` `pro.supply_material` `pro.ask_to_move` `ui.career-reasons` `pro.accept_agreement` `pro.decline_agreement` `pro.end_agreement` |
| 15 | Finding Work | `pro.submit` `pro.prepare` `pro.tape_audition` `pro.move_audition` `pro.accept_offer` `pro.decline_offer` `pro.ask_more` `pro.ask_hold` `pro.ask_option_release` `pro.request_outside_work` `pro.apply_work_visa` `pro.ask_pay` `pro.work_choice` `pro.award_enter` `pro.actor_submit` `pro.ceremony_rsvp` `pro.ceremony_prepare` `pro.ceremony_accept` `pro.watch_ceremony` |
| 16 | Cover, Benefits And Returns | `ui.papers` `health.therapy` `documents.police_report` `health.appeal` `health.extra_supply` `health.enroll` `health.drop` `health.pay_bill` `health.apply_aid` `health.treat` `health.dental` `health.choose_clinic` `health.book` `health.cancel_appointment` `health.prepay` `health.apply` `health.request_hardship` `benefits.claim` `benefits.ei_register` `benefits.assistance` `pension.social_security` `pension.state` `pension.ie_state` `pension.imss` `pension.bienestar` `tax.file` `tax.pay` `tax.amend` `tax.apply_plan` `tax.catch_up_plan` `tax.revise_plan` `tax.pay_state` `tax.apply_state_plan` `tax.catch_up_state_plan` `tax.lien_release` `tax.lien_dispute` `tax.federal_lien_withdraw` `tax.request_waiver` `health.choose_pharmacy` |
| 17 | Passports And ID | `documents.apply_passport` `documents.replace_idcard` `documents.report_lost` `documents.apply_idcard` `documents.replace_license` `documents.apply_opt` `documents.apply_ssn` `documents.residence` `documents.settle` `documents.renew_residence` `documents.naturalize` `look.document` |
| 18 | Money | `ui.money` `look.account` `look.networth` `look.debt` |
| 19 | Your Bank | `ui.bank` `finance.pay_card` `finance.set_autopay` `card.apply` `card.money_transfer` `card.plan` `card.redeem_rewards` `card.lock` `card.report` `card.dispute` `bank.new_number` `card.close` `card.refund_credit` `card.set_statement_day` `card.request_limit` `card.set_auto_raise` `card.set_over_limit` `card.set_everyday` `card.request_hardship` `bank.set_alerts` `cash.withdraw` `cash.deposit` `bank.set_term_end` `bank.break_term` `bank.take_term_interest` `bank.set_round_ups` `bank.reactivate` `bank.cancel_new` `bank.claim_unclaimed` `bank.set_payments` `bank.add_standing_order` `bank.cancel_standing_order` `bank.schedule_payment` `bank.cancel_scheduled` `bank.transfer` `bank.open_savings` `bank.close_savings` `bank.arrange_overdraft` `bank.open_term` `bank.borrow` `bank.repay_loan` `bank.debit_overdraft` `bank.pay_collections` `bank.take_overrun_loan` `bank.switch` `bank.open_current` `bank.set_primary` `bank.redirect_deposits` `bank.set_order_source` `card.set_autopay_from` `bank.close_current` `bank.cancel_switch` `bank.stop_balance_transfer` `bank.set_loan_repayment` `look.bank` `look.transaction` |
| 20 | A Whole Life | `look.person` |

<!-- inventory:begin -->
Generated by `node tools/inventory.mjs --markdown`. 193 commands, 132 scheduled kinds, 8 passage reactors, 3 events emitted, 3 event listeners, 0 scenes, 7 routes.

### Commands

| System | Kinds | Owner |
| --- | --- | --- |
| bank | `bank.add_standing_order` `bank.arrange_overdraft` `bank.borrow` `bank.break_term` `bank.cancel_new` `bank.cancel_scheduled` `bank.cancel_standing_order` `bank.cancel_switch` `bank.claim_unclaimed` `bank.close_current` `bank.close_savings` `bank.debit_overdraft` `bank.new_number` `bank.open_current` `bank.open_savings` `bank.open_term` `bank.pay_collections` `bank.reactivate` `bank.redirect_deposits` `bank.repay_loan` `bank.schedule_payment` `bank.set_alerts` `bank.set_loan_repayment` `bank.set_order_source` `bank.set_payments` `bank.set_primary` `bank.set_round_ups` `bank.set_term_end` `bank.stop_balance_transfer` `bank.switch` `bank.take_overrun_loan` `bank.take_term_interest` `bank.transfer` | `src/engine/systems/accountlife.ts`, `src/engine/systems/banking.ts`, `src/engine/systems/bankmoves.ts`, `src/engine/systems/lending.ts`, `src/engine/systems/payments.ts`, `src/engine/systems/security.ts`, `src/engine/systems/statements.ts` |
| benefits | `benefits.assistance` `benefits.claim` `benefits.ei_register` | `src/engine/systems/assistance.ts`, `src/engine/systems/eiself.ts`, `src/engine/systems/unemployment.ts` |
| brief | `brief.choose` `brief.prepare` `brief.reader` | `src/engine/systems/briefs.ts` |
| calendar | `calendar.cancel` `calendar.schedule` `calendar.skip` | `src/engine/world/plans.ts` |
| card | `card.apply` `card.close` `card.dispute` `card.lock` `card.money_transfer` `card.plan` `card.redeem_rewards` `card.refund_credit` `card.report` `card.request_hardship` `card.request_limit` `card.set_auto_raise` `card.set_autopay_from` `card.set_everyday` `card.set_over_limit` `card.set_statement_day` | `src/engine/systems/bankmoves.ts`, `src/engine/systems/cardlife.ts`, `src/engine/systems/cardoffers.ts`, `src/engine/systems/credit.ts`, `src/engine/systems/security.ts` |
| cash | `cash.deposit` `cash.withdraw` | `src/engine/systems/cash.ts` |
| documents | `documents.apply_idcard` `documents.apply_opt` `documents.apply_passport` `documents.apply_ssn` `documents.naturalize` `documents.police_report` `documents.renew_residence` `documents.replace_idcard` `documents.replace_license` `documents.report_lost` `documents.residence` `documents.settle` | `src/engine/systems/citizenship.ts`, `src/engine/systems/documents.ts`, `src/engine/systems/identity.ts`, `src/engine/systems/permission.ts`, `src/engine/systems/residence.ts`, `src/engine/systems/taxid.ts` |
| finance | `finance.pay_card` `finance.set_autopay` | `src/engine/systems/credit.ts` |
| genre | `genre.study` | `src/engine/systems/engagement.ts` |
| health | `health.appeal` `health.apply_aid` `health.apply` `health.book` `health.cancel_appointment` `health.choose_clinic` `health.choose_pharmacy` `health.dental` `health.drop` `health.enroll` `health.extra_supply` `health.pay_bill` `health.prepay` `health.request_hardship` `health.therapy` `health.treat` | `src/engine/systems/appointments.ts`, `src/engine/systems/health.ts`, `src/engine/systems/therapy.ts` |
| life | `life.look_after` `life.sleep` | `src/engine/systems/life.ts` |
| pension | `pension.bienestar` `pension.ie_state` `pension.imss` `pension.social_security` `pension.state` | `src/engine/systems/homepensions.ts`, `src/engine/systems/imss.ts`, `src/engine/systems/socialsecurity.ts`, `src/engine/systems/statepension.ts` |
| plays | `plays.read` `plays.research` | `src/engine/systems/playreading.ts` |
| practice | `practice.exercise` `practice.self_tape` | `src/engine/systems/briefs.ts`, `src/engine/systems/practice.ts` |
| pro | `pro.accept_agreement` `pro.accept_offer` `pro.actor_submit` `pro.agent_check` `pro.agent_notice` `pro.apply_work_visa` `pro.ask_hold` `pro.ask_more` `pro.ask_option_release` `pro.ask_pay` `pro.ask_referral` `pro.ask_to_move` `pro.award_enter` `pro.ceremony_accept` `pro.ceremony_prepare` `pro.ceremony_rsvp` `pro.cut_reel` `pro.decline_agreement` `pro.decline_offer` `pro.end_agreement` `pro.headshots` `pro.join_sag` `pro.mix_demo` `pro.move_audition` `pro.prepare` `pro.request_outside_work` `pro.send_materials` `pro.set_name` `pro.submit` `pro.supply_material` `pro.tape_audition` `pro.update_resume` `pro.watch_ceremony` `pro.work_choice` | `src/engine/systems/actorawards.ts`, `src/engine/systems/awards.ts`, `src/engine/systems/ceremony.ts`, `src/engine/systems/continuity.ts`, `src/engine/systems/contracts.ts`, `src/engine/systems/pro.ts`, `src/engine/systems/proagent.ts`, `src/engine/systems/projobs.ts`, `src/engine/systems/propay.ts`, `src/engine/systems/workflow.ts`, `src/engine/systems/worktrip.ts` |
| school | `school.answer_partner` `school.appeal_leave` `school.approach` `school.ask_partner` `school.buy_affiliate` `school.buy_ppe` `school.cabaret` `school.call_in_sick` `school.cancel_leave` `school.cancel_rehearsal` `school.cancel_repeat` `school.choose_part_playing` `school.choose_playing` `school.choose_showcase` `school.choose` `school.extend_incomplete` `school.learn_part` `school.make_amends` `school.make_up` `school.orientation` `school.pay_balance` `school.prepare` `school.read_feedback` `school.request_aid_review` `school.request_conversion` `school.request_extra_term` `school.request_leave` `school.request_repeat` `school.reregister` `school.respond` `school.return_notice` `school.review_blocking` `school.summer_cabaret` `school.take_shift` `school.withdraw` `school.work_note` | `src/engine/systems/classmates.ts`, `src/engine/systems/courserecord.ts`, `src/engine/systems/coursework.ts`, `src/engine/systems/leave.ts`, `src/engine/systems/production.ts`, `src/engine/systems/proshowcase.ts`, `src/engine/systems/school.ts` |
| tax | `tax.amend` `tax.apply_plan` `tax.apply_state_plan` `tax.catch_up_plan` `tax.catch_up_state_plan` `tax.federal_lien_withdraw` `tax.file` `tax.lien_dispute` `tax.lien_release` `tax.pay_state` `tax.pay` `tax.request_waiver` `tax.revise_plan` | `src/engine/systems/statetax.ts`, `src/engine/systems/taxreturn.ts` |
| tutorial | `tutorial.read` | `src/engine/world/tutorial.ts` |
| work | `work.identify` `work.settle` `work.try` | `src/engine/systems/workbook.ts` |
| world | `world.dismiss_decision` `world.mark_read` `world.set_preferences` `world.take_decision_action` | `src/engine/world/world.ts` |

### Scheduled kinds

| System | Kinds | Owner |
| --- | --- | --- |
| bank | `bank.application` `bank.current_closes` `bank.fraud_refund` `bank.home_closes` `bank.loan_due` `bank.month_end` `bank.savings_notice` `bank.scheduled_payment` `bank.standing_order` `bank.switch_complete` `bank.switch_debt` `bank.switch_review` `bank.term_notice` `bank.transfer_arrives` | `src/engine/systems/abroad.ts`, `src/engine/systems/accountlife.ts`, `src/engine/systems/banking.ts`, `src/engine/systems/bankmoves.ts`, `src/engine/systems/lending.ts`, `src/engine/systems/payments.ts`, `src/engine/systems/security.ts` |
| benefits | `benefits.assistance_month` `benefits.desempleo_month` `benefits.ja_week` `benefits.uc_period` `benefits.week` | `src/engine/systems/assistance.ts`, `src/engine/systems/homebenefits.ts`, `src/engine/systems/unemployment.ts`, `src/engine/systems/universalcredit.ts` |
| card | `card.arrives` `card.due` `card.replaced` `card.statement` | `src/engine/systems/cardlife.ts`, `src/engine/systems/credit.ts`, `src/engine/systems/security.ts` |
| citizenship | `citizenship.decided` | `src/engine/systems/citizenship.ts` |
| documents | `documents.decided` `documents.idcard_arrives` `documents.opt_week` `documents.permission` `documents.ssn_arrives` `documents.us_status` `documents.visit` | `src/engine/systems/documents.ts`, `src/engine/systems/identity.ts`, `src/engine/systems/papervisits.ts`, `src/engine/systems/permission.ts`, `src/engine/systems/taxid.ts` |
| health | `health.appeal_decided` `health.appointment` `health.bill` `health.month` `health.therapy_session` `health.week` `health.work_decided` | `src/engine/systems/appointments.ts`, `src/engine/systems/health.ts`, `src/engine/systems/therapy.ts` |
| injury | `injury.comp` | `src/engine/systems/injury.ts` |
| life | `life.birthday` `life.commitment` `life.day_rollover` `life.end` | `src/engine/systems/birthdays.ts`, `src/engine/systems/life.ts`, `src/engine/systems/mortality.ts`, `src/engine/world/plans.ts` |
| pension | `pension.bienestar_payment` `pension.ie_week` `pension.imss_month` `pension.ss_month` `pension.state_payment` | `src/engine/systems/homepensions.ts`, `src/engine/systems/imss.ts`, `src/engine/systems/socialsecurity.ts`, `src/engine/systems/statepension.ts` |
| pro | `pro.agent_ask_lapse` `pro.agent_decision` `pro.agent_follow_up` `pro.agent_meeting` `pro.agent_offer_lapse` `pro.agent_reply` `pro.agent_request_due` `pro.agent_silence` `pro.agent_term_end` `pro.audition` `pro.casting_decision` `pro.ceremony_speech` `pro.ceremony` `pro.hold_answer` `pro.invite` `pro.loop` `pro.negotiate_answer` `pro.offer_lapse` `pro.option_release_answer` `pro.pilot_word` `pro.promo` `pro.recurring_invite` `pro.release` `pro.reply` `pro.reshoot` `pro.revival` `pro.school_answer` `pro.tape_due` `pro.trip_arrive` `pro.trip_depart` `pro.visa_decision` `pro.work_day` | `src/engine/systems/ceremony.ts`, `src/engine/systems/continuity.ts`, `src/engine/systems/proagent.ts`, `src/engine/systems/projobs.ts`, `src/engine/systems/series.ts`, `src/engine/systems/workflow.ts`, `src/engine/systems/worktrip.ts` |
| school | `school.account_due` `school.aid_decide` `school.cabaret` `school.call` `school.classes` `school.commencement` `school.company` `school.conferral` `school.convert` `school.evaluation` `school.extra_decide` `school.former_class` `school.incomplete_due` `school.lab` `school.leave_appeal` `school.leave_decide` `school.leave_notice` `school.moment` `school.orientation` `school.partner_ask` `school.partner_rehearsal` `school.payday` `school.recess` `school.repeat_decide` `school.repeat_due` `school.shift` `school.showcase_check` `school.showcase` `school.stipend` `school.study_session` `school.summer` `school.term` `school.week` `school.welfare_decide` `school.welfare` | `src/engine/systems/classmates.ts`, `src/engine/systems/courserecord.ts`, `src/engine/systems/coursework.ts`, `src/engine/systems/leave.ts`, `src/engine/systems/proshowcase.ts`, `src/engine/systems/school.ts` |
| tax | `tax.amended` `tax.due` `tax.federal_lien` `tax.notice` `tax.plan_decide` `tax.plan_default` `tax.plan_payment` `tax.refund` `tax.season` `tax.state_lien` `tax.state_nonfiler` `tax.state_notice` `tax.state_plan_end` `tax.state_plan_payment` `tax.substitute` `tax.three_year` | `src/engine/systems/statetax.ts`, `src/engine/systems/taxreturn.ts` |
| world | `world.tick` | `src/engine/world/world.ts` |

### Passage reactors

| System | Kinds | Owner |
| --- | --- | --- |
| life | `life.night_alone` `life.waking` | `src/engine/systems/life.ts` |
| pro | `pro.actor_awards` `pro.awards` `pro.pages` `pro.postings` `pro.series` `pro.weather` | `src/engine/systems/actorawards.ts`, `src/engine/systems/awards.ts`, `src/engine/systems/projobs.ts`, `src/engine/systems/series.ts`, `src/engine/systems/workflow.ts` |

### Events emitted

| System | Kinds | Owner |
| --- | --- | --- |
| documents | `documents.work_permission_ended` | `src/engine/systems/permission.ts` |
| pro | `pro.equity_joined` | `src/engine/systems/projobs.ts` |
| world | `world.day_rollover` | `src/engine/systems/life.ts` |

### Event listeners

| System | Kinds | Owner |
| --- | --- | --- |
| documents | `documents.work_permission_ended` | `src/engine/systems/projobs.ts` |
| pro | `pro.equity_joined` | `src/engine/systems/propay.ts` |
| world | `world.day_rollover` | `src/engine/systems/accountlife.ts` |

### Scenes

| Scene | Owner |
| --- | --- |

### Routes

`/workspace/bank` · `/workspace/calendar` · `/workspace/career` · `/workspace/papers` · `/workspace/profile` · `/workspace/school` · `/workspace/updates`
<!-- inventory:end -->
