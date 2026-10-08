# SLATE Coverage Matrix

What the game covers, feature by feature, reconciled against the code that
carries it. Every row says one of three things, and nothing is promoted
because its landing page works:

- **Implemented** — built, on screen, held by tests.
- **Partial** — built to a stated depth; the gap is named in the row.
- **Not built** — nothing in the tree.

This build is the start of a revamp, and it is small on purpose. The film
career, the character sheet, the family, the family business and the land they
stood on have all been taken out, and what is left is a person, a place, a
calendar, the weather and money, with the engine they need. Nothing below
claims otherwise.

## What is in the build

| Feature | State | Where it lives | Held by |
| --- | --- | --- | --- |
| Startup sequence | Implemented — the mark, the storage it picks, the schema it reads, and the slots it hands on | `src/ui/startup/StartupSequence.tsx` | `persistence`, `base44-adapter` |
| Save slots | Implemented — three slots, each its own universe, with migration and validation on the way in, and a backup that says which world date it holds so restoring and deleting are not blind | `src/ui/saves/SaveSlots.tsx` | `integrity`, `persistence` |
| Character creation | Implemented — identity, whether the player is billed as an actor or an actress, a personality of seven dispositions and up to four traits, race or ethnicity, where the player was born and so which country they are a citizen of, where they live, interests (the general ones change how much looking after yourself lifts the mood), genres, a background in their own words, and the money they start with | `src/ui/creation/CharacterCreation.tsx` | `creation`, `citizenship`, `portrait`, `world-map` |
| The geography map | Implemented — every country drawn from the projected world map, 170,911 cities behind it, loaded a country at a time, on the creation screen twice | `src/ui/creation/WorldMap.tsx`, `src/ui/creation/LocationPicker.tsx`, `src/engine/content/geography.ts` | `geography`, `world-map` |
| Portrait | Implemented — a headshot cropped to a fixed frame and carried on the person | `src/ui/creation/PortraitPicker.tsx` | `portrait` |
| Performer title | Implemented — actor or actress, settled by the pronouns and picked under they/them, stored on the player and said back on Home, the rail and the save slot. It is a word and decides nothing else | `src/engine/core/performer.ts` | `creation`, `simulation` |
| Personality | Partial — seven dispositions and thirty-five traits, picked on their own step and stored on the player. Three dispositions and every trait's declared knobs move stress, sleep, the energy a night puts back and a night away, hygiene, mood, what food costs, what illness takes, what an early call or a late performance costs and the receipts a return deducts, and the sleep the game suggests counts them. Risk tolerance sets the card's autopay; openness, extraversion and agreeableness how a day of work is taken (`systems/enjoyment.ts`) | `src/engine/content/personality-traits.ts`, `src/engine/systems/personality.ts` | `personality`, `creation` |
| Home | Implemented — the day, where you are, what needs you, what happens next, how you are, the weather and money | `src/ui/screens/Home.tsx` | `interface`, `navigation`, `smoke` |
| Calendar | Implemented — the month, collisions, the observances of the country you are standing in, and plans of your own | `src/ui/workspaces/CalendarWorkspace.tsx`, `src/engine/world/calendar.ts`, `src/engine/world/plans.ts` | `calendar`, `holidays`, `plans` |
| Weather | Implemented — a climate model per city from season, latitude and the kind of place it is, with a week ahead. It decides nothing but what it shows: a thunderstorm called off an outdoor shift until the job engine went | `src/engine/systems/weather.ts` | `weather` |
| Time controls | Implemented — live play, sleeping, and skipping to an event with what it would cross shown first | `src/ui/shell/TimeControls.tsx` | `simulation`, `realclock` |
| Wellbeing and sleep | Partial — the model, the night, the waking hours charged as the clock moves (`life.waking`), and the night nobody chose, slept when the clock is sent through one rather than at every midnight (`life.night_alone` and the rollover). Sleep, eating, a shower, a workout and an hour unwinding are how a player spends a day on them (`life.sleep`, `life.look_after`). Every dial decides something in the body or the workout, and nothing outside them reads it | `src/engine/systems/life.ts` | `simulation`, `smoke`, `endurance`, `personality`, `looking-after`, `wellbeing-bites` |
| Money | Implemented — a ledger that conserves, kept in the currency of the country a save starts in; rent and bills on the first and food with each day's meals, paid from checking, then savings, then the card, then owed; a notice to pay or quit at two months owed and an eviction to a friend's sofa after it; a card with a statement, a due date, interest and late fees, which is the bank's own (see Banking); and a credit record that prices it. Rents are published in nineteen places and estimated elsewhere, and food and bills are estimates. Nothing comes in: the day job went on 2026-09-26 | `src/engine/core/ledger.ts`, `src/engine/systems/finance.ts`, `src/engine/systems/household.ts`, `src/engine/systems/credit.ts` | `money`, `household`, `endurance` |
| Banking | Implemented — a real bank where the character lives: the thirteen countries researched in depth, with each bank's own account names, fees and fee waivers (wages paid in, a balance kept, age), published savings rates with their floors, caps, announced changes, bonuses and paying months, the tax a country has banks take off interest; every other country's biggest banks by name. Account numbers in each country's format with real check digits. The credit card is the bank's own, run on the bank's screen: 522 banks' cards by name with their terms (the rate, or the range a record is priced within; revolving or paid in full each month; the yearly fee, the minimum, the late fee and the days to the due date), 28 banks that issue none, and 62 countries' caps on the rate or the late fee (`content/cards.ts`); a term not found is SLATE's estimate, and the screen says which. The card stays with the bank that issued it when the character switches. Statements for every account held, open or closed, month by month and in Germany quarter by quarter, where the bank also closes the account's interest and fees each quarter; the card's statement with the minimum payment warning; the year's interest, tax and fees; and alerts (`systems/statements.ts`, `ui/bank/BankStatements.tsx`). How each thing is paid: rent and bills from the current account by the country's usual way (13 countries' norms, researched), by check where rent goes by check, on the card for bills, or by hand; the day's spending on the debit or credit card; savings linked to the current account or not; standing orders, payments set for a date, stopping a check for the bank's fee, and taking back a SEPA direct debit within eight weeks (`systems/payments.ts`, `content/payments.ts`, `ui/bank/BankPayments.tsx`). The card's life: applying for the bank's card, closing it, moving its statement day, asking for a higher or lower limit, opting in to going over it (US), and asking for a hardship plan; the bank suspending it after two missed payments and charging it off to collections after six (the FFIEC's 180 days), taking a British holder's missed payment from their other accounts with it, a bounced autopay's fee, the US caps on a late fee and on first-year fees, and Britain's persistent-debt rules (`systems/cardlife.ts`, `systems/credit.ts`). How a card charges interest: the rate set by the record when the card opens and held there, interest built each day on the day's balance and compounded, the grace period kept by a statement paid in full, lost by one that isn't (back to the day the spending went on), and regained with trailing interest, the US penalty rate after a payment sixty days late with 45 days' notice and lifted after six on time (Reg Z §1026.9(g), §1026.55), Britain's default fees free of interest for 28 days, the average daily balance on the statement, and a credit balance sent back on asking and, in the US, after six months. Cash in hand: taken out at the bank's ATM, another bank's, the counter or Britain's Post Office for each of 60 banks' researched fees and daily limits, or as a cash advance for the card's fee and rate with no grace period and within its cash limit; paid in; spent on the day's groceries; payments to the card split to the dearer balance first; and Germany's €2,000 a month from savings (`systems/cash.ts`, `content/cash.ts`, `ui/bank/BankCash.tsx`). Every function of an account and a card, against SLATE, is in `docs/BANKING-FUNCTIONS.md`. Overdrafts the way each bank runs them (arranged, by the item, or against time deposits), personal loans priced by the record and repaid monthly, term deposits locked for their term, and a switch to another bank, through Britain's seven working days or the same day elsewhere; France's €8 an operation, Spain's overdraft commission within the law's cap, the higher rate past a German Dispo, New Zealand's unarranged overdraft fees, Canada's returned-payment fee, card, dormant and quiet-month fees, introductory rates and Iceland's interest-tax refund. The 226 other countries carry researched sheets where found (216 countries, 202 banks with an account name, 182 with a savings rate, and 22 fees charged with the waivers their banks write) and IBANs built to each registry structure with the bank's own code (321 of 348 banks) | `src/engine/systems/banking.ts`, `src/engine/systems/banknumber.ts`, `src/engine/core/banknumbers.ts`, `src/engine/content/banks.ts`, `src/engine/content/banks-thirteen.ts`, `src/engine/content/banks-world.ts`, `src/engine/content/banks-world-sheets.ts`, `src/engine/content/banks-world-iban.ts`, `src/engine/content/banks-world-fees.ts`, `src/engine/systems/lending.ts`, `src/engine/content/banks-lending.ts`, `src/engine/content/cards.ts`, `src/engine/systems/credit.ts`, `src/ui/workspaces/BankWorkspace.tsx`, `src/ui/bank/BankLending.tsx`, `src/ui/bank/BankCard.tsx` | `banking`, `banknumbers`, `lending`, `bank-fees`, `cards` |
| Birthdays and the end of a life | Implemented — a birthday each year at nine in the morning, and each year's chance of the life ending from the US 2024 life table, moved by the country's life expectancy and the body's condition; an ended life stops the clock and opens onto what it came to | `src/engine/systems/birthdays.ts`, `src/engine/systems/mortality.ts`, `src/ui/shell/LifeEnded.tsx` | `mortality` |
| The guide | Implemented — fourteen chapters, read in order, each opening the part of the game it describes: its commands in the engine and its controls, panels and underlined words on screen. A new life starts paused with everything shut but the guide | `src/engine/content/tutorial.ts`, `src/engine/world/tutorial.ts`, `src/ui/guide/Guide.tsx` | `tutorial` |
| The Decision Center | Implemented — answering, dismissing, closing on a date and forgetting are built and tested, and offers of representation, management and work and each year's return raise their own | `src/engine/world/world.ts`, `src/ui/looks/attention.tsx` | `smoke`, `looks` |
| Drill-down | Implemented — every noun on every screen opens onto what it is (49 kinds, from 2026-10-02; Home only until then), and the graph is crawled end to end | `src/ui/looks/` | `looks` |
| Server-checked persistence | Implemented — the guards between a browser and storage, and the client that speaks the platform's protocol | `base44/`, `src/engine/persistence/` | `server-guards`, `base44-adapter`, `base44-contract` |

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
in the ledger.

## The engine, as it now stands

Forty-two commands and two routes. The appendix below is generated from the
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

Money moves on its own: rent, a check being cashed, a standing order, a payment set for a date, and the card's statement and due date are timeline items like any other. What a player does to it by hand: paying the card now (`finance.pay_card`) and whether autopay clears the whole statement or the minimum (`finance.set_autopay`), on the bank's screen since 2026-09-26; and, on Home, moving into a room or a place of their own, which costs a deposit and the rest of the month (`home.move`). Shifts, paydays and the seven `work.*` commands went with the job engine on 2026-09-26. Owing two months' rent brings a notice, and a notice that runs out brings an eviction to a friend's sofa.
The rest is the Decision Center answering, dismissing and marking read
(`world.take_decision_action`, `world.dismiss_decision`, `world.mark_read`) and
the preferences (`world.set_preferences`). The bank moves money between a person's own accounts (`bank.transfer`), and
opens and closes a savings account (`bank.open_savings`, `bank.close_savings`);
its interest and fees fall on the last day of the month (`bank.month_end`).
It arranges or closes an overdraft (`bank.arrange_overdraft`), puts money in a
term deposit (`bank.open_term`), lends and is paid off (`bank.borrow`,
`bank.repay_loan`, with each payment `bank.loan_due`), and moves a person to
another bank (`bank.switch`, completing as `bank.switch_complete`). An account left overdrawn for sixty days is closed and charged off to collections, paid with `bank.pay_collections`. A US bank pays an everyday debit card purchase into an overdraft only for someone who opted in (`bank.debit_overdraft`).
Reading a chapter of the guide is
`tutorial.read`, and until a chapter is read the guide refuses every other
command it opens (`world/tutorial.ts`), whatever screen sends it.

Time also does two things on its own as it passes, rather than at an instant.
`life.night_alone` puts somebody to bed when the clock is sent more than an
hour on through the rest of a night the player kept them up in, or stopped in
the middle of, for a plan or the morning a skip was sent to; it also pays a
night that a stop in its first hour left unpaid. `life.waking` charges each
person for the hours they are awake, wherever the clock stops, so Home's dials
move during a day of play and midnight no longer charges the day ahead.

The routes are `/workspace/calendar`, `/workspace/bank`, `/workspace/school`, `/workspace/career`, `/workspace/papers`, `/workspace/homes`, `/workspace/travel`, `/workspace/vehicles`, `/workspace/land`, `/workspace/belongings`, `/workspace/clothes`, `/workspace/food`, `/workspace/routines` and `/workspace/people` (from 2026-10-01); Home is served by the shell itself. `/workspace/work` went with the job engine.

## The guide, chapter by chapter

The order a guided life reads them in, and what each opens. `tests/tutorial.test.ts`
fails the build if a command, a kind of look or a gated control belongs to no
chapter or to two, or if a chapter opens nothing.

| # | Chapter | Opens |
| --- | --- | --- |
| 1 | Your Life, Hour By Hour | `ui.where` `look.day` `look.place` `look.region` `look.country` `look.currency` `look.season` `look.daylight` |
| 2 | What’s Coming | `ui.calendar` `ui.go` `calendar.skip` `look.entry` |
| 3 | The Clock | `ui.play` `world.set_preferences` |
| 4 | Moving Time On | `ui.advance` `ui.skip` |
| 5 | What Needs You | `ui.needs` `world.mark_read` `world.take_decision_action` `world.dismiss_decision` `look.notification` `look.decision` |
| 6 | How You Are | `ui.how` `look.dial` `look.readiness` |
| 7 | Sleep | `ui.sleep` `life.sleep` |
| 8 | Looking After Yourself | `ui.look-after` `life.look_after` `gym.join` `gym.leave` `gym.trainer` `look.gym` `look.trainer` |
| 9 | Your Own Plans | `ui.open-calendar` `calendar.schedule` `calendar.cancel` `look.plans` `look.stretch` |
| 10 | Weather | `ui.weather` `look.weather` `look.forecastday` `look.hours` `look.skyhour` `look.skyweek` |
| 11 | Drama School | `ui.school` `school.call_in_sick` `school.take_shift` `school.cabaret` `school.summer_cabaret` `school.orientation` `school.prepare` `school.choose` `school.read_feedback` `school.ask_partner` `school.answer_partner` `school.respond` `school.make_amends` `school.buy_ppe` `school.approach` `school.cancel_rehearsal` `school.learn_part` `school.review_blocking` `school.work_note` `look.school` `look.course` `look.skill` |
| 12 | The Business | `ui.career` `career.sign` `career.query_agencies` `career.self_submit` `career.submit_for` `career.accept` `career.counter` `career.pass` `career.leave` `career.renew` `career.sign_manager` `career.leave_manager` `career.relocate` `career.subscribe` `career.headshots` `career.reel` `career.buy_kit` `career.class` `career.coach` `career.t1287` `career.furnish_wardrobe` `career.enter_award` `career.attend_ceremony` `career.improv` `career.workshop` `career.publicist` `pension.start` `pension.state` `pension.ie_state` `pension.cpp` `pension.ca_oas` `pension.bienestar` `pension.imss` `pension.social_security` `career.commercial_meet` `career.commercial_leave` `look.part` `look.job` `look.agency` `look.manager` `look.award` |
| 13 | Between Jobs | `ui.papers` `health.therapy` `documents.police_report` `health.appeal` `health.extra_supply` `health.mobility` `health.parking_permit` `health.enroll` `health.drop` `health.elect_cobra` `health.pay_bill` `health.apply_aid` `health.treat` `health.dental` `health.choose_clinic` `health.book` `health.cancel_appointment` `health.prepay` `benefits.claim` `benefits.ei_register` `benefits.hap` `benefits.assistance` `tax.file` `tax.pay` `health.choose_pharmacy` |
| 14 | Getting Around | `ui.travel` `travel.take_refund` `hotel.breakfast` `travel.book` `travel.cancel` `travel.insure` `travel.companion` `travel.child` `travel.rent_car` `travel.stay_let` `travel.stay_here` `travel.check_out` `travel.extend` `travel.change` `travel.late_checkout` `travel.pay_deposit` `travel.show_id` `travel.pay_rental_deposit` `pilot.train` `aircraft.buy` `aircraft.sell` `look.journey` `look.hotel` |
| 15 | A Car Of Your Own | `ui.vehicles` `roadside.join` `roadside.leave` `vehicle.buy` `vehicle.audio` `vehicle.replace_tires` `vehicle.test_drive` `vehicle.transfer` `vehicle.roof_rack` `vehicle.roof_box` `vehicle.roof_box_fit` `vehicle.list` `vehicle.unlist` `vehicle.sell` `vehicle.redeem` `vehicle.refuel` `vehicle.set_filling` `vehicle.interior` `vehicle.lease` `vehicle.lease_return` `vehicle.lease_buyout` `vehicle.winter_tires` `vehicle.tint` `vehicle.modify` `vehicle.stereo` `vehicle.inspect_used` `vehicle.repair` `vehicle.wrap` `vehicle.unwrap` `vehicle.keep_in` `vehicle.coverage` `vehicle.service` `vehicle.stand_in` `boat.buy` `boat.sell` `boat.certify` `look.vehicle` |
| 16 | Land | `ui.land` `land.offer` `land.withdraw` `land.sell` `land.split` `land.combine` `land.lease_out` `land.end_lease` `look.parcel` |
| 17 | Building A House | `build.start` `build.pay` |
| 18 | Passports And Licenses | `documents.apply_passport` `documents.replace_idcard` `documents.apply_authorization` `documents.apply_visa` `documents.report_lost` `documents.replace_license` `documents.license_step` `documents.renew_license` `documents.apply_idp` `documents.apply_idcard` `documents.real_id` `documents.apply_opt` `documents.petition_o1` `documents.residence` `documents.settle` `documents.renew_residence` `documents.naturalize` `documents.apply_work_permit` `documents.exchange_license` `look.document` |
| 19 | Rent And A Roof | `ui.home` `home.sell_back` `home.cancel_works` `watch.service` `jewelry.commission` `jewelry.engrave` `catalog.favorite` `tv.watch` `pets.adopt` `tv.buy` `travel.bag_claim` `speaker.buy` `pets.groom` `cart.add` `cart.remove` `cart.checkout` `luggage.save_list` `luggage.pack_list` `luggage.delete_list` `pets.chip` `pets.certificate` `pets.tapeworm` `pets.import_form` `items.discard` `food.buy_gear` `items.assemble` `home.hold_mail` `home.end_hold` `home.sitter` `home.end_sitter` `clothes.collect_order` `orders.collect` `routine.set_time` `watch.battery` `pawn.pledge` `pawn.redeem` `hygiene.use_first` `hygiene.shave_every` `hygiene.shower_minutes` `hygiene.makeup_every` `hygiene.style_every` `valuables.buy_safe` `valuables.lock_up` `valuables.take_out` `valuables.schedule` `reading.library_card` `reading.buy` `plays.read` `plays.research` `home.cleaner_key` `luggage.buy` `luggage.choose` `items.give` `clothes.to_basket` `clothes.dry_by` `clothes.measures` `home.repair_machine` `home.buy_piece` `home.internet` `home.pay_landlord` `home.move` `home.cleaner` `home.renters_insurance` `home.alarm` `home.security` `home.charger` `home.move_by` `ui.belongings` `sport.buy` `items.move` `luggage.pack` `luggage.unpack` `phone.buy` `phone.activate` `phone.battery` `phone.protect` `phone.claim` `home.subscribe` `home.unsubscribe` `home.tv_licence` `home.console` `home.buy_game` `ui.clothes` `clothes.buy` `clothes.basket_add` `clothes.basket_remove` `clothes.checkout` `clothes.return` `clothes.cancel` `clothes.dry_clean` `clothes.collect` `clothes.sell` `clothes.dress` `clothes.change` `clothes.save_outfit` `clothes.wear_outfit` `clothes.delete_outfit` `clothes.alter` `sneakers.buy` `sneakers.sell` `ui.food` `food.dine` `food.reserve` `food.cancel_table` `food.drink` `food.buy_groceries` `food.buy_short` `food.cook` `food.resume_cooking` `food.eat_ready` `food.drink_home` `food.freeze` `food.thaw` `ui.routines` `routine.save` `routine.delete` `look.routine` `errand.go` `items.put_away` `pets.buy` `pets.feed` `pets.walk` `pets.walker` `pets.vet` `home.room_use` `garden.plant` `garden.harvest` `luggage.take` `luggage.repack` `items.recover` `life.set_automation` `errand.park` `errand.fuel` `hygiene.buy` `hygiene.groom` `hygiene.buy_clippers` `hygiene.cut_hair` `hygiene.trim_nails` `home.buy_bedding` `caravan.buy` `caravan.sell` `vehicle.hitch` `ui.homes` `home.offer` `home.cancel` `home.pay_mortgage` `home.refinance` `home.borrow` `home.renovate` `home.gardener` `home.water_lawn` `home.fit` `home.buy_units` `home.buy_portable` `home.take_lodger` `home.end_lodger` `home.replace_mattress` `home.furnish` `home.let` `home.manager` `home.end_tenancy` `home.move_in` `home.sell` `look.home` `look.listing` `look.item` `look.garment` `look.receipt` `look.restaurant` `lighting.buy_bulbs` `lighting.buy_lamp` `lighting.fit` `garden.buy_mower` `computer.buy` `home.buy_paint` `children.passport` |
| 20 | Money | `ui.money` `look.account` `look.networth` `look.debt` |
| 21 | Your Bank | `ui.bank` `finance.pay_card` `finance.set_autopay` `card.apply` `card.money_transfer` `card.plan` `card.redeem_rewards` `card.lock` `card.report` `card.update_billers` `card.dispute` `bank.new_number` `card.close` `card.refund_credit` `card.set_statement_day` `card.request_limit` `card.set_auto_raise` `card.set_over_limit` `card.set_everyday` `card.request_hardship` `bank.set_alerts` `cash.withdraw` `cash.deposit` `bank.set_term_end` `bank.break_term` `bank.take_term_interest` `bank.set_round_ups` `bank.reactivate` `bank.cancel_new` `bank.claim_unclaimed` `bank.set_payments` `bank.add_standing_order` `bank.cancel_standing_order` `bank.schedule_payment` `bank.cancel_scheduled` `bank.stop_check` `bank.reclaim_debit` `bank.transfer` `bank.open_savings` `bank.close_savings` `bank.arrange_overdraft` `bank.open_term` `bank.borrow` `bank.repay_loan` `bank.debit_overdraft` `bank.pay_collections` `bank.take_overrun_loan` `bank.switch` `look.bank` `look.transaction` |
| 22 | A Whole Life | `look.person` |
| 23 | People | `ui.people` `club.join` `club.leave` `club.set` `club.rsvp` `club.go` `club.check_in` `club.renew` `class.take` `social.host` `social.invite` `social.answer` `social.cancel` `social.reschedule` `social.ask_to_stay` `social.cancel_stay` `social.ask_out` `social.move_in` `social.break_up` `social.split` `social.marry` `social.divorce` `social.try_for_child` `social.adopt` `family.care` `dating.app` `look.contact` `look.child` `look.parent` |
| 24 | The Assistant | `ui.assistant` |

<!-- inventory:begin -->
Generated by `node tools/inventory.mjs --markdown`. 408 commands, 174 scheduled kinds, 3 passage reactors, 3 events emitted, 1 event listener, 0 scenes, 14 routes.

### Commands

| System | Kinds | Owner |
| --- | --- | --- |
| aircraft | `aircraft.buy` `aircraft.sell` | `src/engine/systems/aviation.ts` |
| bank | `bank.add_standing_order` `bank.arrange_overdraft` `bank.borrow` `bank.break_term` `bank.cancel_new` `bank.cancel_scheduled` `bank.cancel_standing_order` `bank.claim_unclaimed` `bank.close_savings` `bank.debit_overdraft` `bank.new_number` `bank.open_savings` `bank.open_term` `bank.pay_collections` `bank.reactivate` `bank.reclaim_debit` `bank.repay_loan` `bank.schedule_payment` `bank.set_alerts` `bank.set_payments` `bank.set_round_ups` `bank.set_term_end` `bank.stop_check` `bank.switch` `bank.take_overrun_loan` `bank.take_term_interest` `bank.transfer` | `src/engine/systems/accountlife.ts`, `src/engine/systems/banking.ts`, `src/engine/systems/lending.ts`, `src/engine/systems/payments.ts`, `src/engine/systems/security.ts`, `src/engine/systems/statements.ts` |
| benefits | `benefits.assistance` `benefits.claim` `benefits.ei_register` `benefits.hap` | `src/engine/systems/assistance.ts`, `src/engine/systems/eiself.ts`, `src/engine/systems/homebenefits.ts`, `src/engine/systems/unemployment.ts` |
| boat | `boat.buy` `boat.certify` `boat.sell` | `src/engine/systems/boats.ts` |
| build | `build.pay` `build.start` | `src/engine/systems/construction.ts` |
| calendar | `calendar.cancel` `calendar.schedule` `calendar.skip` | `src/engine/world/plans.ts` |
| caravan | `caravan.buy` `caravan.sell` | `src/engine/systems/caravans.ts` |
| card | `card.apply` `card.close` `card.dispute` `card.lock` `card.money_transfer` `card.plan` `card.redeem_rewards` `card.refund_credit` `card.report` `card.request_hardship` `card.request_limit` `card.set_auto_raise` `card.set_everyday` `card.set_over_limit` `card.set_statement_day` `card.update_billers` | `src/engine/systems/cardlife.ts`, `src/engine/systems/cardoffers.ts`, `src/engine/systems/credit.ts`, `src/engine/systems/security.ts` |
| career | `career.accept` `career.attend_ceremony` `career.buy_kit` `career.class` `career.coach` `career.commercial_leave` `career.commercial_meet` `career.counter` `career.enter_award` `career.furnish_wardrobe` `career.headshots` `career.improv` `career.leave_manager` `career.leave` `career.pass` `career.publicist` `career.query_agencies` `career.reel` `career.relocate` `career.renew` `career.self_submit` `career.sign_manager` `career.sign` `career.submit_for` `career.subscribe` `career.t1287` `career.workshop` | `src/engine/systems/awards.ts`, `src/engine/systems/career.ts`, `src/engine/systems/commercial.ts`, `src/engine/systems/fittings.ts` |
| cart | `cart.add` `cart.checkout` `cart.remove` | `src/engine/systems/shoppingcart.ts` |
| cash | `cash.deposit` `cash.withdraw` | `src/engine/systems/cash.ts` |
| catalog | `catalog.favorite` | `src/engine/systems/catalog.ts` |
| children | `children.passport` | `src/engine/systems/childpassports.ts` |
| class | `class.take` | `src/engine/systems/life.ts` |
| clothes | `clothes.alter` `clothes.basket_add` `clothes.basket_remove` `clothes.buy` `clothes.cancel` `clothes.change` `clothes.checkout` `clothes.collect_order` `clothes.collect` `clothes.delete_outfit` `clothes.dress` `clothes.dry_by` `clothes.dry_clean` `clothes.measures` `clothes.return` `clothes.save_outfit` `clothes.sell` `clothes.to_basket` `clothes.wear_outfit` | `src/engine/systems/clothing.ts`, `src/engine/systems/resale.ts`, `src/engine/systems/tailoring.ts` |
| club | `club.check_in` `club.go` `club.join` `club.leave` `club.renew` `club.rsvp` `club.set` | `src/engine/systems/clubs.ts` |
| computer | `computer.buy` | `src/engine/systems/computers.ts` |
| dating | `dating.app` | `src/engine/systems/dating.ts` |
| documents | `documents.apply_authorization` `documents.apply_idcard` `documents.apply_idp` `documents.apply_opt` `documents.apply_passport` `documents.apply_visa` `documents.apply_work_permit` `documents.exchange_license` `documents.license_step` `documents.naturalize` `documents.petition_o1` `documents.police_report` `documents.real_id` `documents.renew_license` `documents.renew_residence` `documents.replace_idcard` `documents.replace_license` `documents.report_lost` `documents.residence` `documents.settle` | `src/engine/systems/citizenship.ts`, `src/engine/systems/documents.ts`, `src/engine/systems/identity.ts`, `src/engine/systems/licensing.ts`, `src/engine/systems/permission.ts`, `src/engine/systems/residence.ts` |
| errand | `errand.fuel` `errand.go` `errand.park` | `src/engine/systems/trips.ts` |
| family | `family.care` | `src/engine/systems/parents.ts` |
| finance | `finance.pay_card` `finance.set_autopay` | `src/engine/systems/credit.ts` |
| food | `food.buy_gear` `food.buy_groceries` `food.buy_short` `food.cancel_table` `food.cook` `food.dine` `food.drink_home` `food.drink` `food.eat_ready` `food.freeze` `food.reserve` `food.resume_cooking` `food.thaw` | `src/engine/systems/alcohol.ts`, `src/engine/systems/kitchen.ts`, `src/engine/systems/life.ts`, `src/engine/systems/reservations.ts` |
| garden | `garden.buy_mower` `garden.harvest` `garden.plant` | `src/engine/systems/garden.ts`, `src/engine/systems/mowers.ts` |
| gym | `gym.join` `gym.leave` `gym.trainer` | `src/engine/systems/gyms.ts`, `src/engine/systems/trainers.ts` |
| health | `health.appeal` `health.apply_aid` `health.book` `health.cancel_appointment` `health.choose_clinic` `health.choose_pharmacy` `health.dental` `health.drop` `health.elect_cobra` `health.enroll` `health.extra_supply` `health.mobility` `health.parking_permit` `health.pay_bill` `health.prepay` `health.therapy` `health.treat` | `src/engine/systems/access.ts`, `src/engine/systems/appointments.ts`, `src/engine/systems/health.ts`, `src/engine/systems/therapy.ts` |
| home | `home.alarm` `home.borrow` `home.buy_bedding` `home.buy_game` `home.buy_paint` `home.buy_piece` `home.buy_portable` `home.buy_units` `home.cancel_works` `home.cancel` `home.charger` `home.cleaner_key` `home.cleaner` `home.console` `home.end_hold` `home.end_lodger` `home.end_sitter` `home.end_tenancy` `home.fit` `home.furnish` `home.gardener` `home.hold_mail` `home.internet` `home.let` `home.manager` `home.move_by` `home.move_in` `home.move` `home.offer` `home.pay_landlord` `home.pay_mortgage` `home.refinance` `home.renovate` `home.renters_insurance` `home.repair_machine` `home.replace_mattress` `home.room_use` `home.security` `home.sell_back` `home.sell` `home.sitter` `home.subscribe` `home.take_lodger` `home.tv_licence` `home.unsubscribe` `home.water_lawn` | `src/engine/systems/alarm.ts`, `src/engine/systems/appliancefaults.ts`, `src/engine/systems/appliances.ts`, `src/engine/systems/away.ts`, `src/engine/systems/bedding.ts`, `src/engine/systems/charging.ts`, `src/engine/systems/dwelling.ts`, `src/engine/systems/furnishings.ts`, `src/engine/systems/furniture.ts`, `src/engine/systems/homelife.ts`, `src/engine/systems/homes.ts`, `src/engine/systems/homesecurity.ts`, `src/engine/systems/household.ts`, `src/engine/systems/lawns.ts`, `src/engine/systems/lodgers.ts`, `src/engine/systems/paint.ts`, `src/engine/systems/propertymanagers.ts`, `src/engine/systems/rooms.ts`, `src/engine/systems/telecom.ts` |
| hotel | `hotel.breakfast` | `src/engine/systems/hotelbreakfast.ts` |
| hygiene | `hygiene.buy_clippers` `hygiene.buy` `hygiene.cut_hair` `hygiene.groom` `hygiene.makeup_every` `hygiene.shave_every` `hygiene.shower_minutes` `hygiene.style_every` `hygiene.trim_nails` `hygiene.use_first` | `src/engine/systems/homegrooming.ts`, `src/engine/systems/hygiene.ts`, `src/engine/systems/life.ts` |
| items | `items.assemble` `items.discard` `items.give` `items.move` `items.put_away` `items.recover` | `src/engine/systems/bulky.ts`, `src/engine/systems/furnishings.ts`, `src/engine/systems/gifts.ts`, `src/engine/systems/items.ts`, `src/engine/systems/luggage.ts`, `src/engine/systems/trips.ts` |
| jewelry | `jewelry.commission` `jewelry.engrave` | `src/engine/systems/commissions.ts` |
| land | `land.combine` `land.end_lease` `land.lease_out` `land.offer` `land.sell` `land.split` `land.withdraw` | `src/engine/systems/land.ts`, `src/engine/systems/landlease.ts` |
| life | `life.look_after` `life.set_automation` `life.sleep` | `src/engine/systems/automation.ts`, `src/engine/systems/life.ts` |
| lighting | `lighting.buy_bulbs` `lighting.buy_lamp` `lighting.fit` | `src/engine/systems/lighting.ts` |
| luggage | `luggage.buy` `luggage.choose` `luggage.delete_list` `luggage.pack_list` `luggage.pack` `luggage.repack` `luggage.save_list` `luggage.take` `luggage.unpack` | `src/engine/systems/luggage.ts` |
| orders | `orders.collect` | `src/engine/systems/orders.ts` |
| pawn | `pawn.pledge` `pawn.redeem` | `src/engine/systems/pawn.ts` |
| pension | `pension.bienestar` `pension.ca_oas` `pension.cpp` `pension.ie_state` `pension.imss` `pension.social_security` `pension.start` `pension.state` | `src/engine/systems/capensions.ts`, `src/engine/systems/homepensions.ts`, `src/engine/systems/imss.ts`, `src/engine/systems/pension.ts`, `src/engine/systems/socialsecurity.ts`, `src/engine/systems/statepension.ts` |
| pets | `pets.adopt` `pets.buy` `pets.certificate` `pets.chip` `pets.feed` `pets.groom` `pets.import_form` `pets.tapeworm` `pets.vet` `pets.walk` `pets.walker` | `src/engine/systems/pets.ts` |
| phone | `phone.activate` `phone.battery` `phone.buy` `phone.claim` `phone.protect` | `src/engine/systems/phones.ts` |
| pilot | `pilot.train` | `src/engine/systems/aviation.ts` |
| plays | `plays.read` `plays.research` | `src/engine/systems/playreading.ts` |
| reading | `reading.buy` `reading.library_card` | `src/engine/systems/reading.ts` |
| roadside | `roadside.join` `roadside.leave` | `src/engine/systems/roadside.ts` |
| routine | `routine.delete` `routine.save` `routine.set_time` | `src/engine/systems/routines.ts` |
| school | `school.answer_partner` `school.approach` `school.ask_partner` `school.buy_ppe` `school.cabaret` `school.call_in_sick` `school.cancel_rehearsal` `school.choose` `school.learn_part` `school.make_amends` `school.orientation` `school.prepare` `school.read_feedback` `school.respond` `school.review_blocking` `school.summer_cabaret` `school.take_shift` `school.work_note` | `src/engine/systems/classmates.ts`, `src/engine/systems/coursework.ts`, `src/engine/systems/production.ts`, `src/engine/systems/school.ts` |
| sneakers | `sneakers.buy` `sneakers.sell` | `src/engine/systems/sneakers.ts` |
| social | `social.adopt` `social.answer` `social.ask_out` `social.ask_to_stay` `social.break_up` `social.cancel_stay` `social.cancel` `social.divorce` `social.host` `social.invite` `social.marry` `social.move_in` `social.reschedule` `social.split` `social.try_for_child` | `src/engine/systems/adoption.ts`, `src/engine/systems/children.ts`, `src/engine/systems/hosting.ts`, `src/engine/systems/houseguests.ts`, `src/engine/systems/marriage.ts`, `src/engine/systems/people.ts`, `src/engine/systems/reachingout.ts` |
| speaker | `speaker.buy` | `src/engine/systems/speakers.ts` |
| sport | `sport.buy` | `src/engine/systems/sportsgear.ts` |
| tax | `tax.file` `tax.pay` | `src/engine/systems/taxreturn.ts` |
| travel | `travel.bag_claim` `travel.book` `travel.cancel` `travel.change` `travel.check_out` `travel.child` `travel.companion` `travel.extend` `travel.insure` `travel.late_checkout` `travel.pay_deposit` `travel.pay_rental_deposit` `travel.rent_car` `travel.show_id` `travel.stay_here` `travel.stay_let` `travel.take_refund` | `src/engine/systems/baggage.ts`, `src/engine/systems/companions.ts`, `src/engine/systems/journey.ts`, `src/engine/systems/latecheckout.ts`, `src/engine/systems/localstay.ts`, `src/engine/systems/rentals.ts`, `src/engine/systems/travelinsurance.ts` |
| tutorial | `tutorial.read` | `src/engine/world/tutorial.ts` |
| tv | `tv.buy` `tv.watch` | `src/engine/systems/programmes.ts`, `src/engine/systems/televisions.ts` |
| valuables | `valuables.buy_safe` `valuables.lock_up` `valuables.schedule` `valuables.take_out` | `src/engine/systems/valuables.ts` |
| vehicle | `vehicle.audio` `vehicle.buy` `vehicle.coverage` `vehicle.hitch` `vehicle.inspect_used` `vehicle.interior` `vehicle.keep_in` `vehicle.lease_buyout` `vehicle.lease_return` `vehicle.lease` `vehicle.list` `vehicle.modify` `vehicle.redeem` `vehicle.refuel` `vehicle.repair` `vehicle.replace_tires` `vehicle.roof_box_fit` `vehicle.roof_box` `vehicle.roof_rack` `vehicle.sell` `vehicle.service` `vehicle.set_filling` `vehicle.stand_in` `vehicle.stereo` `vehicle.test_drive` `vehicle.tint` `vehicle.transfer` `vehicle.unlist` `vehicle.unwrap` `vehicle.winter_tires` `vehicle.wrap` | `src/engine/systems/caraudio.ts`, `src/engine/systems/caravans.ts`, `src/engine/systems/carcare.ts`, `src/engine/systems/carsale.ts`, `src/engine/systems/fueltank.ts`, `src/engine/systems/interiors.ts`, `src/engine/systems/leasing.ts`, `src/engine/systems/mods.ts`, `src/engine/systems/repairs.ts`, `src/engine/systems/repossession.ts`, `src/engine/systems/roofbox.ts`, `src/engine/systems/standin.ts`, `src/engine/systems/tint.ts`, `src/engine/systems/tires.ts`, `src/engine/systems/usedcars.ts`, `src/engine/systems/vehicles.ts`, `src/engine/systems/wraps.ts` |
| watch | `watch.battery` `watch.service` | `src/engine/systems/watches.ts` |
| world | `world.dismiss_decision` `world.mark_read` `world.set_preferences` `world.take_decision_action` | `src/engine/world/world.ts` |

### Scheduled kinds

| System | Kinds | Owner |
| --- | --- | --- |
| aircraft | `aircraft.month` `aircraft.repo_sale` | `src/engine/systems/aviation.ts` |
| alcohol | `alcohol.arrest` | `src/engine/systems/alcohol.ts` |
| awards | `awards.ceremony` | `src/engine/systems/awards.ts` |
| bank | `bank.check_clears` `bank.fraud_refund` `bank.loan_due` `bank.month_end` `bank.savings_notice` `bank.scheduled_payment` `bank.standing_order` `bank.switch_complete` | `src/engine/systems/banking.ts`, `src/engine/systems/lending.ts`, `src/engine/systems/payments.ts`, `src/engine/systems/security.ts` |
| benefits | `benefits.assistance_month` `benefits.desempleo_month` `benefits.ja_week` `benefits.uc_period` `benefits.week` | `src/engine/systems/assistance.ts`, `src/engine/systems/homebenefits.ts`, `src/engine/systems/unemployment.ts`, `src/engine/systems/universalcredit.ts` |
| boat | `boat.month` `boat.repo_sale` | `src/engine/systems/boats.ts` |
| build | `build.loan_month` `build.reinspect` `build.retention` `build.stage` | `src/engine/systems/construction.ts` |
| caravan | `caravan.month` | `src/engine/systems/caravans.ts` |
| card | `card.arrives` `card.due` `card.replaced` `card.statement` | `src/engine/systems/cardlife.ts`, `src/engine/systems/credit.ts`, `src/engine/systems/security.ts` |
| career | `career.agency_term` `career.airs` `career.audition` `career.dues` `career.festival` `career.fitting` `career.improv` `career.lapse` `career.offer` `career.pay` `career.press` `career.query_answer` `career.renewal` `career.residual` `career.showcase` `career.travel` `career.wardrobe_back` `career.week` `career.work` `career.workshop` | `src/engine/systems/career.ts`, `src/engine/systems/fittings.ts` |
| child | `child.birth` `child.month` | `src/engine/systems/children.ts` |
| citizenship | `citizenship.decided` | `src/engine/systems/citizenship.ts` |
| clothes | `clothes.cleaning_ready` `clothes.collect_due` | `src/engine/systems/clothing.ts` |
| club | `club.close` `club.due` `club.meet` | `src/engine/systems/clubs.ts` |
| dating | `dating.month` | `src/engine/systems/dating.ts` |
| documents | `documents.decided` `documents.idcard_arrives` `documents.license_card` `documents.license_step` `documents.opt_week` `documents.permission` `documents.us_status` `documents.visit` | `src/engine/systems/documents.ts`, `src/engine/systems/identity.ts`, `src/engine/systems/licensing.ts`, `src/engine/systems/papervisits.ts`, `src/engine/systems/permission.ts` |
| family | `family.care_visit` `family.school_run` | `src/engine/systems/parents.ts`, `src/engine/systems/schoolrun.ts` |
| food | `food.table` | `src/engine/systems/reservations.ts` |
| garden | `garden.frost` `garden.ripe` | `src/engine/systems/garden.ts` |
| gym | `gym.month` | `src/engine/systems/gyms.ts` |
| health | `health.appeal_decided` `health.appointment` `health.bill` `health.month` `health.therapy_session` `health.week` | `src/engine/systems/appointments.ts`, `src/engine/systems/health.ts`, `src/engine/systems/therapy.ts` |
| home | `home.appliance_out` `home.closing` `home.inspection` `home.lodger_month` `home.planning_refused` `home.portable_out` `home.rent` `home.sale_closes` `home.subscription_month` `home.units_out` `home.works_done` | `src/engine/systems/appliances.ts`, `src/engine/systems/homelife.ts`, `src/engine/systems/homes.ts`, `src/engine/systems/household.ts`, `src/engine/systems/lodgers.ts` |
| injury | `injury.comp` | `src/engine/systems/injury.ts` |
| items | `items.bulky_collected` `items.held_ends` `items.order_arrives` `items.order_held_due` `items.out_for_delivery` | `src/engine/systems/bulky.ts`, `src/engine/systems/luggage.ts`, `src/engine/systems/orders.ts` |
| jewelry | `jewelry.ready` | `src/engine/systems/commissions.ts` |
| land | `land.closing` `land.exchange` `land.lease_year` `land.loan_month` `land.sale_closes` `land.tax_year` | `src/engine/systems/land.ts`, `src/engine/systems/landlease.ts` |
| life | `life.birthday` `life.commitment` `life.day_rollover` `life.end` | `src/engine/systems/birthdays.ts`, `src/engine/systems/life.ts`, `src/engine/systems/mortality.ts`, `src/engine/world/plans.ts` |
| pawn | `pawn.due` | `src/engine/systems/pawn.ts` |
| pension | `pension.bienestar_payment` `pension.ca_month` `pension.ie_week` `pension.imss_month` `pension.month` `pension.ss_month` `pension.state_payment` | `src/engine/systems/capensions.ts`, `src/engine/systems/homepensions.ts`, `src/engine/systems/imss.ts`, `src/engine/systems/pension.ts`, `src/engine/systems/socialsecurity.ts`, `src/engine/systems/statepension.ts` |
| pets | `pets.month` | `src/engine/systems/pets.ts` |
| phone | `phone.month` | `src/engine/systems/phones.ts` |
| pilot | `pilot.medical` `pilot.month` | `src/engine/systems/aviation.ts` |
| rental | `rental.pickup` `rental.return` | `src/engine/systems/rentals.ts` |
| roadside | `roadside.renew` | `src/engine/systems/roadside.ts` |
| routine | `routine.due` | `src/engine/systems/routines.ts` |
| school | `school.cabaret` `school.call` `school.classes` `school.commencement` `school.company` `school.evaluation` `school.lab` `school.moment` `school.orientation` `school.partner_ask` `school.partner_rehearsal` `school.payday` `school.recess` `school.shift` `school.stipend` `school.study_session` `school.summer` `school.term` `school.week` | `src/engine/systems/classmates.ts`, `src/engine/systems/coursework.ts`, `src/engine/systems/school.ts` |
| social | `social.anniversary` `social.divorce_final` `social.host` `social.meet` `social.stay_day` `social.stay` `social.wedding` | `src/engine/systems/career.ts`, `src/engine/systems/hosting.ts`, `src/engine/systems/houseguests.ts`, `src/engine/systems/marriage.ts`, `src/engine/systems/people.ts` |
| tax | `tax.due` `tax.notice` `tax.refund` `tax.season` `tax.substitute` | `src/engine/systems/taxreturn.ts` |
| travel | `travel.arrive` `travel.bag_back` `travel.bag_lost` `travel.checkout` `travel.companion_home` `travel.compensation` `travel.deposit_due` `travel.leave` `travel.local_stay_end` `travel.rental_deposit_due` `travel.room_ready` | `src/engine/systems/baggage.ts`, `src/engine/systems/children.ts`, `src/engine/systems/companions.ts`, `src/engine/systems/compensation.ts`, `src/engine/systems/journey.ts`, `src/engine/systems/localstay.ts`, `src/engine/systems/rentals.ts` |
| vehicle | `vehicle.day` `vehicle.interior_fit` `vehicle.lease_end` `vehicle.lease_month` `vehicle.month` `vehicle.private_sale` `vehicle.renewal` `vehicle.repair_due` `vehicle.repo_sale` | `src/engine/systems/carsale.ts`, `src/engine/systems/interiors.ts`, `src/engine/systems/leasing.ts`, `src/engine/systems/repairs.ts`, `src/engine/systems/vehicles.ts` |
| watch | `watch.back` | `src/engine/systems/watches.ts` |
| world | `world.tick` | `src/engine/world/world.ts` |

### Passage reactors

| System | Kinds | Owner |
| --- | --- | --- |
| life | `life.night_alone` `life.waking` | `src/engine/systems/life.ts` |
| utilities | `utilities.power_cut` | `src/engine/systems/utilities.ts` |

### Events emitted

| System | Kinds | Owner |
| --- | --- | --- |
| life | `life.sleep_started` `life.woke` | `src/engine/systems/life.ts` |
| world | `world.day_rollover` | `src/engine/systems/life.ts` |

### Event listeners

| System | Kinds | Owner |
| --- | --- | --- |
| world | `world.day_rollover` | `src/engine/systems/accountlife.ts` |

### Scenes

| Scene | Owner |
| --- | --- |

### Routes

`/workspace/bank` · `/workspace/belongings` · `/workspace/calendar` · `/workspace/career` · `/workspace/clothes` · `/workspace/food` · `/workspace/homes` · `/workspace/land` · `/workspace/papers` · `/workspace/people` · `/workspace/routines` · `/workspace/school` · `/workspace/travel` · `/workspace/vehicles`
<!-- inventory:end -->
