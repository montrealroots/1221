# Traceability

Written by `tools/traceability.mjs` from the code, and checked by the gate; don't edit by hand. The owner's audit of
2026-10-06 (§2): every player command and every scheduled kind, how it's found and reached, what it refuses, what it
changes, whether it moves money, what it sets going later, and what proves it.

How it's read. **Chapter** is the guide chapter that opens it, which is how a player finds it; **Screens** are the
screens that run it. **Refuses** are the handler's own refusals, in the words the player sees (`…` where a value is
put in), and the refusal checks it calls. **Changes** are the fields it sets on what it acts on. **Money** says it
moves money through the ledger. **Later** are the scheduled kinds it sets going: its delayed consequences. **Tests**
counts the test files that name it; **Journeys** are the connected journeys that run it, save and load, and check
every law of the world (`core/invariants.ts`) at their end.

The statuses are worked out from that evidence, never typed. **Verified (journey)**: on a screen, and in a connected
journey. **Implemented But Unverified**: on a screen and tested, but in no connected journey. **Partially
Implemented**: no screen offers it, or no test runs it. No status here says a screen was checked in the running app:
SLATE has no tests of its screens, and nothing is deployed.

- Verified (journey): 399
- Implemented But Unverified: 1
- Partially Implemented: 0
- Commands in all: 400

## Commands

| Command | Status | Chapter | Screens | Handled In | Refuses | Changes | Money | Later | Tests | Journeys |
|---|---|---|---|---|---|---|---|---|---|---|
| `aircraft.buy` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/aviation.ts` | Your bank couldn’t pay. (also buyAircraftRefusal) | planes | Yes | — | 2 | journey-travel.test.ts |
| `aircraft.sell` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/aviation.ts` | The lender has the plane. | — | Yes | aircraft.repo_sale | 2 | journey-travel.test.ts |
| `bank.add_standing_order` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | A standing order of your own goes into one of your savings accounts.; Say how much each month.; Pick a day of the month, 1 to 31. | standingOrders (added to) | — | bank.standing_order | 4 | journey-bank.test.ts; journey-holdings.test.ts |
| `bank.arrange_overdraft` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | There’s no current account to arrange one on.; Pay the overdraft back before closing it.; The bank arranges between …)} and …)}.; You’re overdrawn by more than that already. | — | — | — | 3 | journey-bank.test.ts |
| `bank.borrow` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | — | — | — | loan | 2 | journey-bank.test.ts |
| `bank.break_term` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; You need a current account for the money.; It closes on …, on the notice given. | — | — | — | 3 | journey-bank.test.ts |
| `bank.cancel_new` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your accounts.; Its cooling-off period has passed, or there isn’t one here for it.; You don’t have a card.; Your current account is closed by switching banks. | — | Yes | — | 2 | journey-bank.test.ts |
| `bank.cancel_scheduled` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | There’s no payment waiting by that name. | — | — | — | 2 | journey-bank.test.ts |
| `bank.cancel_standing_order` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | There’s no standing order by that name. | — | — | — | 2 | journey-bank.test.ts |
| `bank.claim_unclaimed` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | No money of yours is held as unclaimed. | unclaimed | Yes | — | 2 | journey-bank.test.ts |
| `bank.close_savings` | Verified (journey) | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | Only a savings account of yours can be closed here.; There’s no current account to move the money into.; Notice is given: … closes on …. | — | — | bank.savings_notice | 4 | journey-bank.test.ts |
| `bank.debit_overdraft` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | Your bank doesn’t ask you this.; … never pays a debit card purchase into an overdraft. | — | — | — | 2 | journey-bank.test.ts |
| `bank.new_number` | Verified (journey) | Your Bank | BankSecurity.tsx | `systems/security.ts` | You have no current account.; … doesn’t say it moves an account to a new number; closing it and opening another does. | — | — | — | 2 | journey-bank.test.ts |
| `bank.open_savings` | Verified (journey) | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | You already have a savings account.; Your current account isn’t with a bank that can open one. | — | — | — | 3 | journey-bank.test.ts |
| `bank.open_term` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | … publishes no term deposit rate SLATE has.; Say how much to put in.; It takes …)} or more.; … holds …)}. | — | — | savings | 4 | journey-bank.test.ts |
| `bank.pay_collections` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | You don’t owe anything in collections.; You have no account to pay from.; There’s nothing in the account to pay it with. | — | — | — | 3 | journey-bank.test.ts |
| `bank.reactivate` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That account isn’t dormant. | — | — | — | 2 | journey-bank.test.ts |
| `bank.reclaim_debit` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | A direct debit here comes back only if it was taken in error.; Only a bills direct debit taken from your current account can be taken back.; That was …; a direct debit comes back within eight weeks.; That one has been taken back already. | — | Yes | — | 2 | journey-bank.test.ts |
| `bank.repay_loan` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | You don’t have a loan to pay off.; Paying it off takes …)}, and the bank can’t cover it all. | — | Yes | — | 2 | journey-bank.test.ts |
| `bank.schedule_payment` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | A scheduled payment goes between two of your own accounts.; Say how much.; Pick a day ahead. | — | — | bank.scheduled_payment | 2 | journey-bank.test.ts |
| `bank.set_alerts` | Verified (journey) | Your Bank | BankStatements.tsx | `systems/statements.ts` | Set the … as an amount, or turn it off. | alerts | — | — | 3 | journey-bank.test.ts |
| `bank.set_payments` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | Rent goes from the bank on its day, by check, or by hand.; Rent isn’t paid by check here.; Bills go from the bank on their day, on the card, or by hand.; Everyday spending goes in cash, on the debit card or on the credit card.; and 1 more | — | Yes | — | 11 | journey-bank.test.ts; journey-holdings.test.ts |
| `bank.set_round_ups` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | … doesn’t round purchases up into savings. | roundUps | — | — | 2 | journey-holdings.test.ts |
| `bank.set_term_end` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; … doesn’t let a term deposit end that way.; … needs … days’ notice before the end to change it. | — | — | — | 2 | journey-bank.test.ts |
| `bank.stop_check` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | That check has been cashed, or was never written. | — | Yes | — | 2 | journey-bank.test.ts |
| `bank.switch` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t a bank where you live.; You already bank with ….; … won’t open an account for somebody who owes it a charged-off debt.; … turned you away on the ChexSystems report … made, which stands until ….; and 2 more | — | — | bank.switch_complete | 6 | journey-holdings.test.ts |
| `bank.take_overrun_loan` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | Your bank has offered no loan for an overrun.; You already have a loan with the bank. | — | — | loan | 2 | journey-holdings.test.ts |
| `bank.take_term_interest` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; … pays a term deposit’s interest at its end.; It hasn’t earned anything to take yet. | — | Yes | — | 2 | journey-bank.test.ts |
| `bank.transfer` | Verified (journey) | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | Money moves here between your own current and savings accounts.; That’s the same account.; Say how much to move.; … holds …)}.; and 3 more | — | Yes | — | 5 | journey-bank.test.ts |
| `benefits.assistance` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/assistance.ts` | — (also assistanceRefusal) | assistance | Yes | escrow | 2 | journey-health.test.ts |
| `benefits.claim` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/unemployment.ts` | SLATE pays unemployment in New York, California and Connecticut, where you’d have to have ; You have a claim open.; You’re on a job: a claim is for the weeks between them.; … Your base period’s quarters paid …. | — | Yes | benefits.week | 4 | journey-papers.test.ts |
| `benefits.ei_register` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/eiself.ts` | — (also eiRefusal) | ei | — | — | 2 | journey-health.test.ts |
| `benefits.hap` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/homebenefits.ts` | — (also hapRefusal) | hap | — | benefits.ja_week; benefits.desempleo_month | 2 | journey-health.test.ts |
| `boat.buy` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/boats.ts` | The bank couldn’t pay. (also buyBoatRefusal) | boats | Yes | — | 2 | journey-cars.test.ts |
| `boat.certify` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/boats.ts` | The bank couldn’t pay. (also certifyRefusal) | boatCertificates | Yes | boat.repo_sale | 2 | journey-cars.test.ts |
| `boat.sell` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/boats.ts` | The lender has that boat. | — | Yes | — | 2 | journey-cars.test.ts |
| `build.pay` | Verified (journey) | Building A House | LandWorkspace.tsx | `systems/construction.ts` | The contractor is owed no bill.; …)} is more than the bank can pay. | log (added to) | Yes | build.loan_month | 2 | journey-housing-construction.test.ts |
| `build.start` | Verified (journey) | Building A House | LandWorkspace.tsx | `systems/construction.ts` | The bank couldn’t pay the permit and fees.; The bank couldn’t pay the loan’s fees. (also buildRefusal) | building | Yes | loan; build.loan_month; build.stage | 2 | journey-housing-construction.test.ts |
| `calendar.cancel` | Verified (journey) | Your Own Plans | CalendarWorkspace.tsx | `world/plans.ts` | — | — | — | — | 3 | journey-clothes.test.ts |
| `calendar.schedule` | Verified (journey) | Your Own Plans | CalendarWorkspace.tsx | `world/plans.ts` | — | — | — | life.commitment | 13 | journey-clothes.test.ts; journey-food.test.ts; journey.test.ts |
| `calendar.skip` | Verified (journey) | What’s Coming | TimeControls.tsx | `world/plans.ts` | — | status; resolvedAt | — | — | 2 | journey-clothes.test.ts |
| `caravan.buy` | Verified (journey) | Rent And A Roof | VehiclesWorkspace.tsx | `systems/caravans.ts` | The bank couldn’t pay. (also buyCaravanRefusal) | caravans | Yes | — | 2 | journey-cars.test.ts |
| `caravan.sell` | Verified (journey) | Rent And A Roof | VehiclesWorkspace.tsx | `systems/caravans.ts` | That isn’t a caravan you own. | — | — | — | 2 | journey-cars.test.ts |
| `card.apply` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You have no credit record to apply with.; A card is already on its way.; You need a bank to apply to.; SLATE doesn’t know that bank.; and 3 more (also transferRefusal) | — | — | card.arrives | 6 | journey-bank.test.ts |
| `card.close` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; It’s already being closed. | — | — | — | 4 | journey-bank.test.ts |
| `card.dispute` | Verified (journey) | Your Bank | BankSecurity.tsx | `systems/security.ts` | — (also disputeRefusal) | — | — | bank.fraud_refund | 2 | journey-bank.test.ts |
| `card.lock` | Verified (journey) | Your Bank | BankSecurity.tsx | `systems/security.ts` | … locks a card only by phone.; That card is stopped; a new one is on its way. | — | — | — | 2 | journey-bank.test.ts |
| `card.money_transfer` | Verified (journey) | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | You don’t have a card.; The … doesn’t offer money transfers.; You need a current account for the money.; Say how much.; and 1 more | — | Yes | money | 2 | journey-holdings.test.ts |
| `card.plan` | Verified (journey) | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | You don’t have a card.; The … has no plan SLATE has terms for.; A plan runs … months.; Purchases owe … that can go into a plan.; and 1 more | — | — | — | 2 | journey-holdings.test.ts |
| `card.redeem_rewards` | Verified (journey) | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | The card has no rewards to redeem. | — | Yes | — | 2 | journey-bank.test.ts |
| `card.refund_credit` | Verified (journey) | Your Bank | BankCard.tsx | `systems/credit.ts` | The card holds no credit to send back. | — | — | — | 2 | journey-bank.test.ts |
| `card.report` | Verified (journey) | Your Bank | BankSecurity.tsx | `systems/security.ts` | Lost, stolen or damaged.; That card is stopped already; a new one is on its way.; … has no rush replacement SLATE knows of. | — | Yes | — | 2 | journey-bank.test.ts |
| `card.request_hardship` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; You’re on a plan already.; The card owes nothing. | — | — | — | 2 | journey-holdings.test.ts |
| `card.request_limit` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Say the limit you want. | — | — | — | 2 | journey-bank.test.ts |
| `card.set_auto_raise` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card. | — | — | — | 2 | journey-bank.test.ts |
| `card.set_everyday` | Verified (journey) | Your Bank | BankCard.tsx | `systems/credit.ts` | You don’t hold that card. | — | — | — | 2 | journey-bank.test.ts |
| `card.set_over_limit` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Opting in to going over the limit is a US card’s choice. | — | — | — | 2 | journey-bank.test.ts |
| `card.set_statement_day` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Pick a day from the 1st to the 28th. | — | — | — | 3 | journey-bank.test.ts |
| `card.update_billers` | Verified (journey) | Your Bank | BankSecurity.tsx | `systems/security.ts` | Your bills already have your card’s number. | — | — | — | 2 | journey-bank.test.ts |
| `career.accept` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | That offer isn’t open.; Another series holds an option on you until it’s decided.; It clashes with …. (also acceptRefusal, crossingRefusal, workRefusal) | stay; travelOwed; perDiemOwed; status; lastBookedAt; and 1 more | Yes | own; sublet; sofa; hotel; and 3 more | 22 | journey-acting-travel.test.ts; journey-career.test.ts; journey-residence.test.ts; and 1 more |
| `career.attend_ceremony` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/awards.ts` | — | — | — | — | 2 | journey-everyday-more.test.ts |
| `career.buy_kit` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | You have a kit.; A kit is … with the sales tax, which the bank can’t cover. | kit | — | — | 2 | journey-career.test.ts |
| `career.class` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | School is your class for now.; You aren’t in a class.; You’re in a class.; A month is …, which the bank can’t cover. | scene | — | — | 2 | journey-career.test.ts |
| `career.coach` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | That audition isn’t ahead.; You’ve worked on it already.; You’re at … until ….; An hour is …, which the bank can’t cover. | — | — | — | 2 | journey-career.test.ts |
| `career.commercial_leave` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/commercial.ts` | — | — | — | — | 2 | journey-career.test.ts |
| `career.commercial_meet` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/commercial.ts` | — (also commercialRefusal) | commercialMet; commercial | — | — | 2 | journey-career.test.ts |
| `career.counter` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | That isn’t an offer open to you. | — | — | — | 2 | journey-career.test.ts |
| `career.enter_award` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/awards.ts` | — | — | — | — | 2 | journey-career.test.ts |
| `career.furnish_wardrobe` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/fittings.ts` | — | — | — | — | 2 | journey-career.test.ts |
| `career.headshots` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | A session and prints come to …, which the bank can’t cover. | — | — | — | 2 | journey-career.test.ts |
| `career.improv` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | School is your class for now; a course waits for the summer or the degree.; You’re in a course.; The course is …, which the bank can’t cover. | improv; status | — | career.improv | 2 | journey-career.test.ts |
| `career.leave` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | — | — | — | — | 2 | journey-career.test.ts |
| `career.leave_manager` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | You have no manager.; The contract runs a year from …. | renewal | — | — | 2 | journey-career.test.ts |
| `career.pass` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | That offer isn’t open. | status | — | — | 2 | journey-career.test.ts |
| `career.publicist` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | You have no publicist.; You have a publicist.; A month is …, which the bank can’t cover. (also publicistRefusal) | publicist; status | — | — | 2 | journey-career.test.ts |
| `career.query_agencies` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | — (also queryRefusal) | queriedAt | — | career.query_answer | 2 | journey-career.test.ts |
| `career.reel` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | A reel is cut from footage, and you have no screen credit yet.; An edit is …, which the bank can’t cover. | reelAt | — | — | 2 | journey-career.test.ts |
| `career.relocate` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | New York, Los Angeles, London, Dublin, Mexico City or New Haven${home ? ; You live there already.; Classes are in New Haven while the term is on; a move away waits for the summer or the deg; You’re away on a job: move when you’re home.; and 2 more (also crossingRefusal, residenceRefusal) | returnedHomeAt | Yes | — | 5 | journey-career.test.ts; journey-residence.test.ts |
| `career.renew` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | No renewal is on offer. | renewal | — | — | 2 | journey-career.test.ts |
| `career.self_submit` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | While classes are in session, the school’s work comes first; submissions start in the summ; You’ve made this week’s … submissions. | submitted | — | — | 5 | journey-career.test.ts; journey-everyday-more.test.ts |
| `career.sign` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | That agency hasn’t an offer standing.; You’re with …. | — | — | — | 3 | journey-career.test.ts |
| `career.sign_manager` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | … manages you.; That firm hasn’t an offer standing. | managerId; managerSince; managerOffers | — | — | 2 | journey-career.test.ts |
| `career.submit_for` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | — (also submitForRefusal) | chosen; submitted | — | — | 2 | journey-everyday-more.test.ts |
| `career.subscribe` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | No such site.; You aren’t on ….; A year is …, which the bank can’t cover. | sites | — | — | 2 | journey-career.test.ts |
| `career.t1287` | Verified (journey) | — | CareerWorkspace.tsx | `systems/career.ts` | There’s no such job. | t1287Rate | — | — | 2 | journey-career.test.ts |
| `career.workshop` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/career.ts` | While classes are in session, the school’s work comes first.; You have one booked.; A workshop is …, which the bank can’t cover. | status | — | career.workshop | 2 | journey-career.test.ts |
| `cart.add` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx FoodWorkspace.tsx | `systems/shoppingcart.ts` | — | cartOf (added to) | — | — | 2 | journey-food.test.ts |
| `cart.checkout` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/shoppingcart.ts` | — | — | — | — | 2 | journey-food.test.ts |
| `cart.remove` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/shoppingcart.ts` | That isn’t in the basket. | cart | — | — | 2 | journey-food.test.ts |
| `cash.deposit` | Verified (journey) | Your Bank | BankCash.tsx | `systems/cash.ts` | You have … in cash.; Cash goes into your current account or savings.; …’s customers can’t pay cash in at the Post Office. | — | Yes | — | 3 | journey-bank.test.ts |
| `cash.withdraw` | Verified (journey) | Your Bank | BankCash.tsx | `systems/cash.ts` | Say how much.; From your bank’s ATM, another bank’s, the counter, the Post Office or the card. | — | Yes | — | 6 | journey-bank.test.ts |
| `catalog.favorite` | Verified (journey) | Rent And A Roof | Catalog.tsx | `systems/catalog.ts` | Choose something in a list. | favorites | — | — | 2 | journey-food.test.ts |
| `children.passport` | Verified (journey) | Rent And A Roof | PeopleWorkspace.tsx | `systems/childpassports.ts` | — | — | — | — | 2 | journey-people.test.ts |
| `class.take` | Verified (journey) | People | HomesWorkspace.tsx PeopleWorkspace.tsx | `systems/life.ts` | There’s no such class.; … is in ….; You’re at … until ….; The payment didn’t go through. | — | Yes | — | 2 | journey-people.test.ts |
| `clothes.alter` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/tailoring.ts` | The payment didn’t go through. (also alterRefusal) | at | Yes | service | 2 | journey-clothes.test.ts |
| `clothes.basket_add` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — (also buyRefusal) | basketOf (added to) | — | — | 4 | journey-clothes.test.ts |
| `clothes.basket_remove` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | That isn’t in the basket. | basket | — | — | 2 | journey-clothes.test.ts |
| `clothes.buy` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | What to buy? | — | — | — | 12 | journey-bank.test.ts; journey-belongings.test.ts; journey-clothes.test.ts; and 3 more |
| `clothes.cancel` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — | — | — | — | 2 | journey-clothes.test.ts |
| `clothes.change` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | Choose what to put on.; You’re at … until …. (also dressRefusal) | dressed | — | — | 6 | connected-day.test.ts; journey-clothes.test.ts; journey-day-at-home.test.ts; and 1 more |
| `clothes.checkout` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — | basket | — | — | 4 | journey-clothes.test.ts |
| `clothes.collect` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — | — | — | — | 4 | journey-clothes.test.ts |
| `clothes.collect_order` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — (also collectRefusal) | — | — | home; person | 2 | journey-clothes.test.ts |
| `clothes.delete_outfit` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | There’s no outfit of yours by that name. | outfits | — | — | 3 | journey-clothes.test.ts |
| `clothes.dress` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — (also dressRefusal) | dressed | — | — | 3 | journey-clothes.test.ts |
| `clothes.dry_by` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | On the rack or in the dryer. | laundryDry | — | — | 2 | journey-clothes.test.ts |
| `clothes.dry_clean` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — | — | — | — | 2 | journey-clothes.test.ts |
| `clothes.measures` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — (also measuresRefusal) | measures | — | — | 2 | journey-clothes.test.ts |
| `clothes.return` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — | — | — | — | 2 | journey-clothes.test.ts |
| `clothes.save_outfit` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | — | — | — | — | 5 | journey-career.test.ts; journey-clothes.test.ts |
| `clothes.sell` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/resale.ts` | — | — | — | — | 2 | journeys.test.ts |
| `clothes.to_basket` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/clothing.ts` | Choose what goes in. (also toBasketRefusal) | — | — | — | 2 | journey-clothes.test.ts |
| `clothes.wear_outfit` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx RoutinesWorkspace.tsx | `systems/clothing.ts` | No such outfit.; None of it is yours any more. (also dressRefusal) | dressed | — | — | 3 | journey-clothes.test.ts |
| `club.check_in` | Verified (journey) | People | RoutinesWorkspace.tsx | `systems/clubs.ts` | You aren’t in it.; You check in when you’re there.; … meets in ….; It isn’t meeting now.; and 3 more | — | — | — | 2 | journey-people.test.ts |
| `club.go` | Verified (journey) | People | ClubsPanel.tsx | `systems/clubs.ts` | — (also goRefusal) | — | — | club.check_in | 3 | journey-people.test.ts; journeys.test.ts |
| `club.join` | Verified (journey) | People | ClubsPanel.tsx HomesWorkspace.tsx | `systems/clubs.ts` | The bank can’t pay the season’s fee. (also joinClubRefusal, tripRefusal) | membershipsOf (added to) | Yes | — | 4 | journey-people.test.ts; journeys.test.ts |
| `club.leave` | Verified (journey) | People | ClubsPanel.tsx | `systems/clubs.ts` | You aren’t in it. | — | — | club.close | 1 | journey-people.test.ts |
| `club.renew` | Verified (journey) | People | ClubsPanel.tsx | `systems/clubs.ts` | You aren’t in it.; It doesn’t run by the season.; The bank can’t pay the season’s fee. | — | Yes | — | 2 | journey-people.test.ts |
| `club.rsvp` | Verified (journey) | People | ClubsPanel.tsx | `systems/clubs.ts` | You aren’t in it.; That isn’t one of its next meetings. | — | — | — | 3 | journey-people.test.ts; journeys.test.ts |
| `club.set` | Verified (journey) | People | ClubsPanel.tsx | `systems/clubs.ts` | You aren’t in it. (also tripRefusal) | — | — | — | 2 | journey-people.test.ts |
| `computer.buy` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/computers.ts` | — | — | — | — | 3 | journey-holdings.test.ts |
| `dating.app` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/dating.ts` | … isn’t sold where you live, as far as SLATE has read.; The bank couldn’t pay. | datingApp | Yes | dating.month | 2 | journey-people.test.ts |
| `documents.apply_authorization` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/documents.ts` | … is more than the bank can cover. (also authorizationRefusal) | documentsOf (added to) | Yes | authorization; documents.decided | 4 | journey-papers.test.ts; journey-travel.test.ts |
| `documents.apply_idcard` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/identity.ts` | … is more than the bank can cover. (also idCardRefusal) | documentsOf (added to) | Yes | idcard | 3 | journey-residence.test.ts |
| `documents.apply_idp` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/licensing.ts` | … is more than the bank can cover. (also idpRefusal) | documentsOf (added to) | Yes | idp | 2 | journey-papers.test.ts |
| `documents.apply_opt` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/permission.ts` | — (also optRefusal) | documentsOf (added to) | — | permit; documents.permission | 2 | journey-residence.test.ts |
| `documents.apply_passport` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/documents.ts` | … is more than the bank can cover. (also passportRefusal) | documentsOf (added to) | Yes | passport; documents.decided | 3 | journey-papers.test.ts |
| `documents.apply_visa` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/documents.ts` | … is more than the bank can cover. (also visaRefusal) | documentsOf (added to) | Yes | visa; documents.decided | 3 | journey-residence.test.ts |
| `documents.apply_work_permit` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/permission.ts` | — (also caPermitRefusal, optRefusal) | usOutOfStatus; documentsOf (added to) | — | permit; documents.permission; documents.opt_week; shared | 2 | journey-residence.test.ts |
| `documents.exchange_license` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/licensing.ts` | … is more than the bank can cover. (also exchangeRefusal) | — | Yes | — | 3 | journey-residence.test.ts |
| `documents.license_step` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/licensing.ts` | … is more than the bank can cover. (also stepRefusal) | status | Yes | documents.license_step | 3 | journey-residence.test.ts |
| `documents.naturalize` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/citizenship.ts` | … is more than the bank can cover. (also naturalizeRefusal) | naturalizing; naturalized | Yes | citizenship.decided | 2 | journey-residence.test.ts |
| `documents.petition_o1` | Verified (journey) | — | Documents.tsx | `systems/permission.ts` | — (also o1Refusal) | documentsOf (added to) | — | permit; documents.permission | 2 | journey-residence.test.ts |
| `documents.police_report` | Verified (journey) | Between Jobs | Documents.tsx | `systems/documents.ts` | — (also policeReportRefusal) | — | — | — | 2 | journey-papers.test.ts |
| `documents.real_id` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/identity.ts` | … is more than the bank can cover. (also realIdRefusal) | — | Yes | — | 2 | journey-residence.test.ts |
| `documents.renew_license` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/licensing.ts` | … is more than the bank can cover. (also renewRefusal) | documentsOf (added to) | Yes | — | 4 | journey-residence.test.ts |
| `documents.renew_residence` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/residence.ts` | Only Mexican temporary residence is renewed, a year at a time.; It’s renewed within its last 30 days.; … is more than the bank can cover. | — | Yes | — | 2 | journey-residence.test.ts |
| `documents.replace_idcard` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/identity.ts` | … is more than the bank can cover. (also idReplaceRefusal) | documentsOf (added to) | Yes | documents.idcard_arrives | 3 | journey-residence.test.ts |
| `documents.replace_license` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/licensing.ts` | … is more than the bank can cover. (also replaceRefusal) | documentsOf (added to) | Yes | documents.license_card | 6 | journey-cars.test.ts; journey-papers.test.ts; journey-travel.test.ts |
| `documents.report_lost` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/documents.ts` | That isn’t a document you hold. | — | — | — | 11 | journey-cars.test.ts; journey-papers.test.ts; journey-residence.test.ts; and 2 more |
| `documents.residence` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/residence.ts` | … is more than the bank can cover. (also routeRefusal) | documentsOf (added to) | Yes | permit; documents.decided | 4 | journey-residence.test.ts |
| `documents.settle` | Verified (journey) | Passports And Licenses | Documents.tsx | `systems/residence.ts` | … is more than the bank can cover. (also settleRefusal) | — | Yes | — | 3 | journey-residence.test.ts |
| `errand.fuel` | Verified (journey) | Rent And A Roof | RoutinesWorkspace.tsx | `systems/trips.ts` | You aren’t out in the car. | — | — | vehicle.refuel | 3 | connected-day.test.ts; journeys.test.ts |
| `errand.go` | Verified (journey) | Rent And A Roof | RoutinesWorkspace.tsx | `systems/trips.ts` | You’re home already.; Say where you’re going: the shops or an errand.; The fare can’t be paid.; There isn’t enough in the tank to get there: … km left, and the leg is …. Stop for fuel fi (also tripRefusal) | trip; errandKm; km | Yes | — | 10 | journey-cars.test.ts; journey-food.test.ts; journeys.test.ts |
| `errand.park` | Verified (journey) | Rent And A Roof | RoutinesWorkspace.tsx | `systems/trips.ts` | You aren’t out in the car.; There’s no such garage in this town.; The garage didn’t take the payment.; The meter didn’t take the payment. (also meterRefusal) | — | Yes | — | 2 | journey-food.test.ts |
| `family.care` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/parents.ts` | — (also careRefusal) | — | — | — | 2 | journey-people.test.ts |
| `finance.pay_card` | Verified (journey) | Your Bank | BankCard.tsx | `systems/credit.ts` | You don’t have a card.; You don’t owe anything on it.; Pay something, or nothing.; There’s nothing in the bank to pay it with. | — | — | — | 5 | journey-bank.test.ts |
| `finance.set_autopay` | Verified (journey) | Your Bank | BankCard.tsx | `systems/credit.ts` | Autopay pays the minimum or the whole statement.; You don’t have a card.; … takes the whole statement from your account each month; the … can’t carry a balance. | — | — | — | 4 | journey-bank.test.ts |
| `food.buy_gear` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/kitchen.ts` | That model isn’t sold where you live.; The bank couldn’t pay for it. (also gearRefusal) | — | Yes | home | 2 | journey-food.test.ts |
| `food.buy_groceries` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/kitchen.ts` | — | — | — | — | 15 | connected-day.test.ts; journey-day-at-home.test.ts; journey-everyday-more.test.ts; and 3 more |
| `food.buy_short` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/kitchen.ts` | No such recipe.; No store here sells ….; You have all of it. | — | — | — | 2 | journey-food.test.ts |
| `food.cancel_table` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/reservations.ts` | No such booking. | reservations | Yes | — | 2 | journey-food.test.ts |
| `food.cook` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx RoutinesWorkspace.tsx | `systems/kitchen.ts` | — | — | — | — | 10 | connected-day.test.ts; journey-day-at-home.test.ts; journey-everyday-more.test.ts; and 1 more |
| `food.dine` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/life.ts` | You’re at … until ….; The payment didn’t go through. (also diningRefusal) | — | Yes | — | 3 | journey-food.test.ts |
| `food.drink` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/alcohol.ts` | You’re at … until ….; The payment didn’t go through. (also drinkRefusal) | — | Yes | — | 2 | journey-food.test.ts |
| `food.drink_home` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/kitchen.ts` | — | — | — | — | 3 | journey-food.test.ts |
| `food.eat_ready` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx RoutinesWorkspace.tsx | `systems/kitchen.ts` | You aren’t hungry.; There’s no meal ready to eat here. | — | — | — | 3 | journey-food.test.ts |
| `food.freeze` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/kitchen.ts` | — (also freezeRefusal) | — | — | home | 2 | journey-food.test.ts |
| `food.reserve` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/reservations.ts` | … is more than the bank can cover. (also reserveRefusal) | reservationsOf (added to) | Yes | food.table | 2 | journey-food.test.ts |
| `food.resume_cooking` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/kitchen.ts` | — | — | — | — | 2 | journey-everyday-more.test.ts |
| `food.thaw` | Verified (journey) | Rent And A Roof | FoodWorkspace.tsx | `systems/kitchen.ts` | — (also thawRefusal) | — | — | home | 2 | journey-food.test.ts |
| `garden.buy_mower` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/mowers.ts` | — | — | — | — | 3 | journey-food.test.ts |
| `garden.harvest` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/garden.ts` | — (also harvestRefusal) | garden | — | home; garden.frost | 2 | journey-food.test.ts |
| `garden.plant` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/garden.ts` | — (also plantRefusal) | garden | — | garden.ripe | 2 | journey-food.test.ts |
| `gym.join` | Verified (journey) | Looking After Yourself | HomesWorkspace.tsx RoutinesWorkspace.tsx | `systems/gyms.ts` | The bank couldn’t pay. (also joinRefusal) | gym | Yes | gym.month | 2 | journey-health.test.ts |
| `gym.leave` | Verified (journey) | Looking After Yourself | RoutinesWorkspace.tsx | `systems/gyms.ts` | You aren’t a member of a gym. | — | Yes | gym.month | 2 | journey-health.test.ts |
| `gym.trainer` | Verified (journey) | Looking After Yourself | RoutinesWorkspace.tsx | `systems/trainers.ts` | That trainer isn’t in the town you’re in. | training | — | — | 2 | journey-health.test.ts |
| `health.appeal` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | — (also appealRefusal) | — | Yes | health.appeal_decided | 2 | journey-health.test.ts |
| `health.apply_aid` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | There’s no such bill. (also aidRefusal) | — | — | — | 2 | journey-health.test.ts |
| `health.book` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/appointments.ts` | There’s nothing to see a doctor about.; You have an appointment already.; No wait is published where you live; you’re seen when it comes up. | — | — | — | 3 | journey-papers.test.ts |
| `health.cancel_appointment` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/appointments.ts` | No such appointment. | — | — | — | 3 | journey-papers.test.ts |
| `health.choose_clinic` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | — (also clinicRefusal) | — | — | — | 2 | journey-papers.test.ts |
| `health.choose_pharmacy` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | There’s no such pharmacy.; A pharmacy’s own cash price is kept only in America. | — | — | — | 2 | journey-health.test.ts |
| `health.dental` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | You have no dental plan.; Yale’s dental plan can’t be canceled once paid.; You have a dental plan.; The year is …, which the bank can’t cover.; and 1 more | — | — | — | 2 | journey-health.test.ts |
| `health.drop` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | You have no plan of your own to drop. | — | — | — | 2 | journey-health.test.ts; journey-papers.test.ts |
| `health.elect_cobra` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | You have no COBRA to elect.; COBRA’s first … … come to …, which the bank can’t cover. | — | — | — | 2 | journey-health.test.ts |
| `health.enroll` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | — | — | — | — | 5 | journey-health.test.ts; journey-papers.test.ts |
| `health.extra_supply` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | — (also extraSupplyRefusal) | — | — | — | 3 | journey-health.test.ts |
| `health.mobility` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/access.ts` | — | mobility | — | — | 2 | journey-health.test.ts |
| `health.parking_permit` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/access.ts` | The payment didn’t go through. (also permitRefusal) | parkingPermit | Yes | — | 2 | journey-health.test.ts |
| `health.pay_bill` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | You owe nothing for care.; Say how much.; Your current account can’t cover it. | — | Yes | — | 2 | journey-papers.test.ts |
| `health.prepay` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | It comes to …, more than you can pay. (also prepayRefusal) | — | — | — | 2 | journey-health.test.ts |
| `health.therapy` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/therapy.ts` | — (also therapyRefusal) | therapy; status | Yes | — | 2 | journey-health.test.ts |
| `health.treat` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/health.ts` | You don’t have that. | — | — | — | 2 | journey-health.test.ts |
| `home.alarm` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/alarm.ts` | Your home has none.; … is more than the bank can cover. (also alarmRefusal) | alarm; living | Yes | — | 2 | journey-holdings.test.ts |
| `home.borrow` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | You don’t own that home. (also borrowRefusal) | equity | Yes | mortgage | 2 | journey-homes.test.ts |
| `home.buy_bedding` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/bedding.ts` | The payment didn’t go through. (also beddingRefusal) | — | Yes | home | 2 | journey-everyday-more.test.ts |
| `home.buy_game` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/homelife.ts` | That isn’t sold where you live.; It plays on a … console, and you have none.; A game is kept in a home of your own.; It comes to …, more than you can pay. | subscriptions | Yes | home | 2 | journey-belongings.test.ts |
| `home.buy_paint` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/paint.ts` | — | — | — | — | 2 | journey-homes.test.ts |
| `home.buy_piece` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/furnishings.ts` | The bank couldn’t pay for it. (also pieceRefusal) | ikeaCredit | Yes | home | 6 | journey-belongings.test.ts; journey-holdings.test.ts; journeys.test.ts |
| `home.buy_portable` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/appliances.ts` | No such machine.; The bank couldn’t pay for it. (also portableRefusal) | portables | Yes | home.portable_out | 3 | journey-holdings.test.ts; journey-homes.test.ts |
| `home.buy_units` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/appliances.ts` | The bank couldn’t pay for them. (also unitsRefusal, portableRefusal) | acUnits | Yes | home.units_out | 2 | journey-homes.test.ts |
| `home.cancel` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | It isn’t listed.; There’s no purchase under way to call off. | — | — | — | 2 | journey-homes.test.ts |
| `home.cancel_works` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | There’s no such work under way.; No cooling-off law was read where the home is, and the contract stands.; The cooling-off period ended …, and the contract stands. | works | Yes | — | 2 | journey-homes.test.ts |
| `home.charger` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/charging.ts` | … is more than the bank can cover. | — | Yes | — | 2 | journey-holdings.test.ts |
| `home.cleaner` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/dwelling.ts` | It isn’t your place to have cleaned. | — | — | — | 3 | journey-homes.test.ts |
| `home.cleaner_key` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/dwelling.ts` | You have no cleaner. | — | — | — | 2 | journey-homes.test.ts |
| `home.console` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/homelife.ts` | That isn’t sold where you live.; A console goes in a home of your own.; It comes to …, more than you can pay. | — | Yes | home | 2 | journey-belongings.test.ts |
| `home.end_hold` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/away.ts` | The post isn’t held. | — | — | — | 2 | journey-homes.test.ts |
| `home.end_lodger` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/lodgers.ts` | No lodger lives there. | lodgers | — | — | 2 | journey-homes.test.ts |
| `home.end_sitter` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/away.ts` | No sitter’s staying. | — | — | — | 2 | journey-homes.test.ts |
| `home.end_tenancy` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | It isn’t let or offered. | tenancies | — | — | 1 | journey-homes.test.ts |
| `home.fit` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/appliances.ts` | You don’t own that home.; No such appliance.; It isn’t offered in that color.; It costs …)}, fitted.; and 1 more (also fitRefusal, unitsRefusal) | applianceModels; laundryBefore; appliances; improvements; improvements (added to) | Yes | home.appliance_out | 3 | journey-homes.test.ts |
| `home.furnish` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/furniture.ts` | No such piece.; The bank couldn’t pay for it. (also furnishRefusal, fitRefusal, mattressRefusal) | — | Yes | home | 9 | journey-everyday-more.test.ts; journey-holdings.test.ts; journey-homes.test.ts; and 1 more |
| `home.gardener` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/lawns.ts` | You don’t own that home.; It has no lawn of yours to keep. | — | — | — | 1 | journey-homes.test.ts |
| `home.hold_mail` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/away.ts` | … is more than the bank can cover. (also holdRefusal) | mailHold | Yes | — | 3 | journey-acting-travel.test.ts; journey-homes.test.ts |
| `home.internet` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/telecom.ts` | … is more than the bank can cover. (also switchRefusal) | — | — | — | 2 | journey-homes.test.ts |
| `home.let` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | You don’t own that home. (also letRefusal) | tenancies (added to) | — | — | 2 | journey-homes.test.ts |
| `home.manager` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/propertymanagers.ts` | You don’t own that home.; No agent manages it.; No agent there publishes its fees.; … manages it already. | manager | — | — | 2 | journey-homes.test.ts |
| `home.move` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/household.ts` | A room in a shared flat, or a place of your own.; You’re away: a home is found back in …. | — | — | — | 8 | journey-holdings.test.ts; journey-homes.test.ts; journey-people.test.ts |
| `home.move_by` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/furniture.ts` | — | moveBy | — | — | 2 | journey-holdings.test.ts |
| `home.move_in` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | You don’t own that home. (also moveInRefusal) | — | — | — | 3 | journey-homes.test.ts; journey-housing-construction.test.ts |
| `home.offer` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | — (also offerRefusal) | offersMade; counter | — | — | 5 | journey-food.test.ts; journey-homes.test.ts; journey-people.test.ts |
| `home.pay_landlord` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/household.ts` | You have no landlord to pay.; Say how much.; … holds ….; You owe …; there's no rent to pay ahead. | payments | Yes | — | 3 | journey-homes.test.ts |
| `home.pay_mortgage` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | There’s no loan on it to pay.; Say how much.; The bank can’t cover it. | — | Yes | — | 2 | journey-homes.test.ts |
| `home.refinance` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | You don’t own that home. (also refinanceRefusal) | mortgage | Yes | mortgage | 2 | journey-homes.test.ts |
| `home.renovate` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | You don’t own that home.; No such work. (also projectRefusal) | works (added to) | Yes | home.planning_refused; WORKS_KIND | 7 | journey-food.test.ts; journey-homes.test.ts; journey-housing-construction.test.ts |
| `home.renters_insurance` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/dwelling.ts` | Renters insurance is for somebody renting. | — | — | — | 4 | journey-belongings.test.ts; journey-homes.test.ts |
| `home.repair_machine` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/appliancefaults.ts` | No such machine. (also repairRefusal) | — | Yes | — | 2 | journey-holdings.test.ts |
| `home.replace_mattress` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/furniture.ts` | You have no bed of your own.; SLATE keeps no mattress price where you live yet.; The bank couldn’t pay for it. (also mattressRefusal) | mattressAt | Yes | — | 3 | journey-holdings.test.ts |
| `home.room_use` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/rooms.ts` | A room’s use is chosen in a home you own and live in.; That isn’t a spare bedroom.; A guest is staying in it, or coming to.; What’s stored wouldn’t fit the closets without it: move some of it out first. | roomUses | — | — | 3 | journey-people.test.ts |
| `home.security` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/homesecurity.ts` | No such device.; … is more than the bank can cover. (also securityRefusal) | security | Yes | — | 2 | journey-holdings.test.ts |
| `home.sell` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/homes.ts` | You don’t own that home.; A room in a shared flat, or a place of your own, after. (also sellRefusal) | selling; tenancies | — | SALE_KIND | 4 | journey-homes.test.ts |
| `home.sell_back` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/furnishings.ts` | — (also buybackRefusal) | items; ikeaCredit | — | — | 2 | journey-holdings.test.ts |
| `home.sitter` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/away.ts` | … is more than the bank can cover. (also sitterRefusal) | sitter | Yes | — | 4 | journey-homes.test.ts; journeys.test.ts |
| `home.subscribe` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/homelife.ts` | That isn’t offered where you live.; You subscribe to it already.; It comes to …, more than you can pay. | subscriptionsOf (added to) | Yes | — | 6 | journey-belongings.test.ts |
| `home.take_lodger` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/lodgers.ts` | You don’t own that home. (also lodgerRefusal) | lodgersIn (added to) | — | — | 2 | journey-homes.test.ts |
| `home.tv_licence` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/homelife.ts` | No TV license is needed where you live.; Yours runs more than another month.; It comes to …, more than you can pay. | tvLicence | Yes | — | 3 | journey-belongings.test.ts |
| `home.unsubscribe` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/homelife.ts` | You don’t subscribe to it. | subscriptions | — | — | 2 | journey-belongings.test.ts |
| `home.water_lawn` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/lawns.ts` | — (also waterRefusal) | — | — | — | 2 | journey-everyday-more.test.ts |
| `hotel.breakfast` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/hotelbreakfast.ts` | The payment didn’t go through. (also breakfastRefusal) | — | Yes | — | 2 | journey-travel.test.ts |
| `hygiene.buy` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx TimeControls.tsx | `systems/hygiene.ts` | — | — | — | — | 5 | journey-clothes.test.ts |
| `hygiene.buy_clippers` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/homegrooming.ts` | The payment didn’t go through. (also clipperRefusal) | — | Yes | home; person | 2 | journey-everyday-more.test.ts |
| `hygiene.cut_hair` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/homegrooming.ts` | You’re at … until …. (also homeCutRefusal) | groomedAt | — | — | 2 | journey-everyday-more.test.ts |
| `hygiene.groom` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/life.ts` | You’re at … until ….; The payment didn’t go through. (also groomingRefusal) | groomedAt | Yes | — | 3 | journey-clothes.test.ts |
| `hygiene.makeup_every` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/hygiene.ts` | Choose how often.; Choose what you wear. | makeup | — | — | 2 | journey-clothes.test.ts |
| `hygiene.shave_every` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/hygiene.ts` | Choose how often. (also toiletryRefusal, groomingRefusal) | shaves; items | — | — | 2 | journey-clothes.test.ts |
| `hygiene.shower_minutes` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/hygiene.ts` | — (also showerMinutesRefusal) | showerMinutes | — | — | 2 | journey-clothes.test.ts |
| `hygiene.style_every` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/hygiene.ts` | Choose how often. | styles | — | — | 2 | journey-clothes.test.ts |
| `hygiene.trim_nails` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/homegrooming.ts` | Nails are trimmed at home.; Fingers or toes. | nailsAt | — | — | 2 | journey-everyday-more.test.ts |
| `hygiene.use_first` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/hygiene.ts` | There’s no such product. | usesFirst | — | — | 2 | journey-clothes.test.ts |
| `items.assemble` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/furnishings.ts` | You’re at … until …. (also assembleRefusal) | — | — | — | 4 | journey-belongings.test.ts; journey-holdings.test.ts; journeys.test.ts |
| `items.discard` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/bulky.ts` | … is more than the bank can cover. (also bulkyRefusal) | bulkyYear; items | Yes | items.bulky_collected | 2 | journey-belongings.test.ts |
| `items.give` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/gifts.ts` | — (also giveRefusal) | items | — | — | 2 | journey-belongings.test.ts |
| `items.move` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/items.ts` | That isn’t something you own.; Where to? (also moveRefusal) | at | — | home | 8 | journey-belongings.test.ts; journey-people.test.ts; journeys.test.ts |
| `items.put_away` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/trips.ts` | There’s no shopping waiting to be put away. | — | — | — | 7 | connected-day.test.ts; journey-day-at-home.test.ts; journey-food.test.ts; and 2 more |
| `items.recover` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | It’s collected in ….; No one here is holding anything of yours. | items | — | person | 2 | journeys.test.ts |
| `jewelry.commission` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/commissions.ts` | The bank can’t pay for it. (also commissionRefusal) | commissions; commissionsOf (added to) | Yes | jewelry.ready; home; person; accessory | 2 | journey-belongings.test.ts |
| `jewelry.engrave` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/commissions.ts` | Only jewelry or a watch is engraved.; The … isn’t to hand.; Write the words to engrave.; SLATE keeps no engraver’s price where you are.; and 1 more | engraved | Yes | — | 2 | journey-belongings.test.ts |
| `land.combine` | Verified (journey) | Land | LandWorkspace.tsx | `systems/land.ts` | Two parcels you own, neither for sale.; A house is being built on it.; Let land isn’t joined: end the lease first.; Each is on its own loan: pay one off to join them.; and 1 more | — | Yes | land.loan_month; land.tax_year | 3 | journey-holdings.test.ts |
| `land.end_lease` | Verified (journey) | Land | LandWorkspace.tsx | `systems/landlease.ts` | It isn’t let.; It ends at the year’s end already. | — | — | land.lease_year | 2 | journey-holdings.test.ts |
| `land.lease_out` | Verified (journey) | Land | LandWorkspace.tsx | `systems/landlease.ts` | — (also leaseRefusal) | — | — | land.lease_year | 2 | journey-holdings.test.ts |
| `land.offer` | Verified (journey) | Land | LandWorkspace.tsx | `systems/land.ts` | The bank can’t pay the deposit. (also offerRefusal) | — | Yes | land.exchange; land.closing | 4 | journey-holdings.test.ts; journey-housing-construction.test.ts |
| `land.sell` | Verified (journey) | Land | LandWorkspace.tsx | `systems/land.ts` | That isn’t land you own.; It’s for sale already.; A house is being built on it. | — | — | land.sale_closes | 4 | journey-holdings.test.ts |
| `land.split` | Verified (journey) | Land | LandWorkspace.tsx | `systems/land.ts` | That isn’t land you own.; It’s let to a farmer: end the lease first.; The bank couldn’t pay the fee to split it. (also splitRefusal) | parcelsOf (added to) | Yes | land.tax_year | 3 | journey-holdings.test.ts |
| `land.withdraw` | Verified (journey) | Land | LandWorkspace.tsx | `systems/land.ts` | You have no offer accepted. | parcelsOf (added to) | Yes | land.loan_month; land.tax_year | 2 | journey-holdings.test.ts |
| `life.look_after` | Verified (journey) | Looking After Yourself | BelongingsWorkspace.tsx ClothesWorkspace.tsx RoutinesWorkspace.tsx TimeControls.tsx | `systems/life.ts` | That isn’t something you can do for yourself here.; Your clothes are all clean.; That’s at home.; The payment didn’t go through.; and 1 more (also lookAfterRefusal, showerMinutesRefusal, dryRefusal, watchRefusal) | — | Yes | — | 43 | connected-day.test.ts; journey-belongings.test.ts; journey-career.test.ts; and 5 more |
| `life.set_automation` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx RoutinesWorkspace.tsx | `systems/automation.ts` | There’s no such shortcut. | automation | — | — | 7 | journey-belongings.test.ts |
| `life.sleep` | Verified (journey) | Sleep | TimeControls.tsx | `systems/life.ts` | You can’t go to sleep in the past.; You’re at … until …. | lastSleptAt; awakeSince; wokeWithDebt | — | — | 17 | connected-day.test.ts; journey-day-at-home.test.ts; journey-residence.test.ts; and 1 more |
| `lighting.buy_bulbs` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/lighting.ts` | — | — | — | — | 2 | journey-food.test.ts |
| `lighting.buy_lamp` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/lighting.ts` | — | — | — | — | 2 | journey-food.test.ts |
| `lighting.fit` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/lighting.ts` | — | — | — | — | 2 | journey-food.test.ts |
| `luggage.buy` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | It isn’t offered in that color.; The bank couldn’t pay for it. (also buyLuggageRefusal) | — | Yes | home | 6 | journey-belongings.test.ts; journey-travel.test.ts |
| `luggage.choose` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | That isn’t a bag of yours.; Unpack the one you have first. | luggageId | — | — | 5 | journey-belongings.test.ts; journey-travel.test.ts |
| `luggage.delete_list` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | There’s no such list. | packingLists | — | — | 2 | journey-belongings.test.ts |
| `luggage.pack` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | It’s full, or what’s left at home isn’t clean. (also luggageRefusal) | — | — | — | 8 | journey-acting-travel.test.ts; journey-belongings.test.ts; journey-travel.test.ts; and 1 more |
| `luggage.pack_list` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | There’s no such list.; That isn’t a bag of yours. (also luggageRefusal) | — | — | — | 2 | journey-belongings.test.ts |
| `luggage.repack` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | You repack where you’re staying.; The room is packed away already.; The bags are full. | — | — | — | 3 | journey-acting-travel.test.ts; journeys.test.ts |
| `luggage.save_list` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | Give the list a name.; That isn’t a bag of yours.; The bag is empty: pack it first, then keep what’s in it. | packingLists | — | — | 2 | journey-belongings.test.ts |
| `luggage.take` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | That isn’t a bag of yours.; Which bags go is chosen at home.; At least one bag goes. | goingBags; luggageId | — | — | 3 | journey-belongings.test.ts; journey-travel.test.ts |
| `luggage.unpack` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/luggage.ts` | That isn’t a bag of yours.; The suitcase isn’t to hand.; The suitcase is empty. (also luggageRefusal) | — | — | — | 6 | journey-acting-travel.test.ts; journey-belongings.test.ts; journeys.test.ts |
| `orders.collect` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/orders.ts` | — | — | — | — | 2 | journey-everyday-more.test.ts |
| `pawn.pledge` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pawn.ts` | It wouldn’t bring a loan. (also pledgeRefusal) | pawnsOf (added to) | Yes | loan; service; pawn.due | 2 | journey-belongings.test.ts |
| `pawn.redeem` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pawn.ts` | There’s no such pledge.; A pledge is redeemed where it was made.; The bank can’t pay what’s owed. | at; pawns | Yes | home; person | 2 | journey-belongings.test.ts |
| `pension.bienestar` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/homepensions.ts` | — (also bienestarRefusal) | bienestarFrom | Yes | pension.bienestar_payment | 2 | journey-health.test.ts |
| `pension.ca_oas` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/capensions.ts` | — (also oasRefusal) | — | — | — | 2 | journey-health.test.ts |
| `pension.cpp` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/capensions.ts` | — (also cppRefusal) | — | — | — | 2 | journey-health.test.ts |
| `pension.ie_state` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/homepensions.ts` | — (also irishPensionRefusal) | irishPension | Yes | pension.ie_week | 2 | journey-health.test.ts |
| `pension.imss` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/imss.ts` | — (also imssRefusal) | — | Yes | pension.imss_month | 2 | journey-health.test.ts |
| `pension.social_security` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/socialsecurity.ts` | — (also socialSecurityRefusal) | socialSecurity | Yes | pension.ss_month | 2 | journey-career.test.ts |
| `pension.start` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/pension.ts` | — (also earlyRefusal) | pensionStart | Yes | pension.month | 2 | journey-career.test.ts |
| `pension.state` | Verified (journey) | The Business | CareerWorkspace.tsx | `systems/statepension.ts` | — (also statePensionRefusal) | statePensionFrom | Yes | pension.state_payment | 2 | journey-health.test.ts |
| `pets.adopt` | Verified (journey) | Rent And A Roof | Home.tsx | `systems/pets.ts` | It comes to …, more than you can pay. (also adoptRefusal) | petsOf (added to) | Yes | pets.month | 8 | journey-belongings.test.ts; journeys.test.ts |
| `pets.buy` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | That isn’t sold where you live.; It’s delivered to a home of yours.; The bank couldn’t pay for it. | — | Yes | home | 2 | journey-belongings.test.ts |
| `pets.certificate` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | SLATE keeps no rules for taking a pet there.; The payment didn’t go through. | — | Yes | — | 3 | journey-belongings.test.ts |
| `pets.chip` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | That isn’t a pet of yours.; … is chipped already.; The payment didn’t go through. | — | Yes | — | 2 | journey-belongings.test.ts |
| `pets.feed` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | You have no pets.; They’re fed at home. | — | — | — | 2 | journey-belongings.test.ts |
| `pets.groom` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | That isn’t a dog of yours.; The payment didn’t go through. | — | Yes | — | 2 | journey-belongings.test.ts |
| `pets.import_form` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | The CDC’s form is for a dog. | — | — | — | 2 | journey-belongings.test.ts |
| `pets.tapeworm` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | That isn’t a dog of yours.; The payment didn’t go through. | — | Yes | — | 3 | journey-belongings.test.ts |
| `pets.vet` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | That isn’t a pet of yours.; Its vet is where you live.; The payment didn’t go through. | — | Yes | — | 2 | journey-belongings.test.ts |
| `pets.walk` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | That isn’t a dog of yours.; It’s walked at home.; …’s been walked today. | — | — | — | 2 | journey-belongings.test.ts |
| `pets.walker` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/pets.ts` | That isn’t a dog of yours. | — | — | — | 2 | journey-belongings.test.ts |
| `phone.activate` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/phones.ts` | It’s on your line already.; SLATE keeps no line where you live.; It comes to …, more than you can pay. | — | Yes | — | 3 | journey-belongings.test.ts |
| `phone.battery` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/phones.ts` | The battery is as good as new.; Its maker publishes no battery price for it.; It comes to …, more than you can pay. | — | Yes | — | 2 | journey-belongings.test.ts |
| `phone.buy` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/phones.ts` | — | — | — | — | 4 | journey-belongings.test.ts; journey-everyday-more.test.ts |
| `phone.claim` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/phones.ts` | That isn’t a phone you own.; It isn’t to hand.; It comes to …, more than you can pay. | — | Yes | — | 2 | journey-belongings.test.ts |
| `phone.protect` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/phones.ts` | That cover isn’t offered for it. | — | Yes | — | 3 | journey-belongings.test.ts |
| `pilot.train` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/aviation.ts` | Your bank couldn’t pay. (also trainRefusal, buyAircraftRefusal) | pilotTraining; pilotLicences; pilot; planes | Yes | pilot.month; pilot.medical; aircraft.month | 3 | journey-travel.test.ts |
| `reading.buy` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/reading.ts` | That isn’t on sale.; It’s bought where you live, and kept at home.; It’s sold in another country.; The bank couldn’t pay for it. | — | Yes | home | 2 | journey-belongings.test.ts |
| `reading.library_card` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx HomesWorkspace.tsx | `systems/reading.ts` | — (also cardRefusal) | libraryCard | — | — | 2 | journey-belongings.test.ts |
| `roadside.join` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/roadside.ts` | The payment didn’t go through. (also joinRefusal) | roadside | Yes | roadside.renew | 2 | journey-cars.test.ts |
| `roadside.leave` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/roadside.ts` | You aren’t a member of a club. | — | Yes | roadside.renew | 2 | journey-cars.test.ts |
| `routine.delete` | Verified (journey) | Rent And A Roof | RoutinesWorkspace.tsx | `systems/routines.ts` | There’s no routine of yours by that name. | routines | — | — | 4 | journey-clothes.test.ts |
| `routine.save` | Verified (journey) | Rent And A Roof | RoutinesWorkspace.tsx | `systems/routines.ts` | — (also routineRefusal) | routinesOf (added to) | — | — | 6 | journey-clothes.test.ts; journey-school-week.test.ts |
| `routine.set_time` | Verified (journey) | Rent And A Roof | RoutinesWorkspace.tsx | `systems/routines.ts` | No such routine. (also routineTimeRefusal) | — | — | — | 2 | journey-clothes.test.ts |
| `school.answer_partner` | Implemented But Unverified | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also answerRefusal) | — | — | — | 1 | — |
| `school.ask_partner` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also askRefusal) | — | — | — | 4 | journey-school-week.test.ts |
| `school.cabaret` | Verified (journey) | Drama School | SchoolWorkspace.tsx day.tsx | `systems/school.ts` | — (also cabaretRefusal) | status | — | school.cabaret; cabaret | 2 | journey-career.test.ts |
| `school.call_in_sick` | Verified (journey) | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | You’re not at school.; There are no classes today.; Today’s classes have been and gone; calling in sick now excuses nothing.; You’re well enough to go: staying away would be an unexcused absence. | — | — | — | 3 | journey-career.test.ts |
| `school.cancel_rehearsal` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | There’s no such rehearsal booked. | — | — | — | 2 | journey-school-week.test.ts |
| `school.choose` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | That isn’t a question this work asks.; That isn’t one of the answers.; Read it first: table work is done on a text you know.; That’s your answer already.; and 1 more | — | — | — | 2 | journey-school-week.test.ts |
| `school.learn_part` | Verified (journey) | Drama School | RehearsalProcess.tsx RoutinesWorkspace.tsx | `systems/production.ts` | — (also ownWorkRefusal) | — | — | — | 2 | journey-school-production.test.ts |
| `school.orientation` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also orientationRefusal) | — | — | — | 2 | journey-school-week.test.ts |
| `school.prepare` | Verified (journey) | Drama School | CourseworkPane.tsx RoutinesWorkspace.tsx | `systems/coursework.ts` | — (also prepareRefusal) | — | — | — | 3 | journey-school-week.test.ts |
| `school.read_feedback` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | There’s no feedback on that.; Read already. | — | — | — | 2 | journey-school-week.test.ts |
| `school.review_blocking` | Verified (journey) | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also ownWorkRefusal) | — | — | — | 2 | journey-school-production.test.ts |
| `school.summer_cabaret` | Verified (journey) | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | — (also summerRefusal) | status | Yes | school.summer; school.stipend; summer | 2 | journey-career.test.ts |
| `school.take_shift` | Verified (journey) | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | No free evening in the next two weeks. (also shiftRefusal) | — | — | school.shift | 2 | journey-career.test.ts |
| `school.work_note` | Verified (journey) | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also ownWorkRefusal) | — | — | — | 2 | journey-school-production.test.ts |
| `sneakers.buy` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/sneakers.ts` | — | — | — | — | 2 | journey-clothes.test.ts |
| `sneakers.sell` | Verified (journey) | Rent And A Roof | ClothesWorkspace.tsx | `systems/sneakers.ts` | — | items; dressed | Yes | — | 2 | journey-clothes.test.ts |
| `social.adopt` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/adoption.ts` | … is more than the bank can cover. (also adoptRefusal) | familyPath | Yes | adoption; child.adopted; child.surrogate_birth | 2 | journey-people.test.ts |
| `social.answer` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/reachingout.ts` | — (also answerRefusal) | — | — | — | 2 | journey-holdings.test.ts |
| `social.ask_out` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/people.ts` | You don’t know them. (also askingRefusal, asksOutRefusal) | — | — | — | 2 | journey-people.test.ts |
| `social.ask_to_stay` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/houseguests.ts` | — (also stayRefusal) | — | — | social.stay | 2 | journey-people.test.ts |
| `social.break_up` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/people.ts` | You aren’t seeing them.; You’re married: only a divorce ends it. | — | — | — | 3 | journey-people.test.ts |
| `social.cancel_stay` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/houseguests.ts` | Nobody’s coming to stay.; … is here already. | — | Yes | social.stay_day | 2 | journey-people.test.ts |
| `social.divorce` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/marriage.ts` | You aren’t married.; Your divorce is under way already. | — | Yes | — | 2 | journey-people.test.ts |
| `social.host` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/hosting.ts` | No such recipe.; … cooks for … at the most. (also hostRefusal, cookRefusal) | items | Yes | social.host | 3 | journey-people.test.ts |
| `social.invite` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/people.ts` | — (also inviteRefusal, courtRefusal, fineWeatherRefusal, askingRefusal, asksOutRefusal, moveInRefusal) | — | Yes | — | 6 | journey-people.test.ts |
| `social.marry` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/marriage.ts` | The bank couldn’t pay for it. (also marryRefusal) | marriage | Yes | social.wedding; social.anniversary | 2 | journey-people.test.ts |
| `social.move_in` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/people.ts` | You don’t know them. (also moveInRefusal) | — | — | — | 2 | journey-people.test.ts |
| `social.split` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/marriage.ts` | — | billSplit | — | — | 2 | journey-people.test.ts |
| `social.try_for_child` | Verified (journey) | People | PeopleWorkspace.tsx | `systems/children.ts` | — (also tryRefusal) | trying; childrenOf (added to) | Yes | child.month; travel.leave | 2 | journey-people.test.ts |
| `speaker.buy` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/speakers.ts` | — | — | — | — | 2 | journey-holdings.test.ts |
| `sport.buy` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/sportsgear.ts` | It’s bought where you live, for your home.; That isn’t sold where you live.; The bank couldn’t pay for it. | — | Yes | home | 2 | journey-belongings.test.ts |
| `tax.file` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/taxreturn.ts` | There’s no return for that year.; You’ve filed it. | — | Yes | tax.refund | 3 | journey-papers.test.ts |
| `tax.pay` | Verified (journey) | Between Jobs | PapersWorkspace.tsx | `systems/taxreturn.ts` | That year is paid.; … is more than the bank can cover. | — | Yes | — | 2 | journey-papers.test.ts |
| `travel.bag_claim` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/baggage.ts` | There’s no such claim. (also claimRefusal) | — | Yes | — | 2 | journey-travel.test.ts |
| `travel.book` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/journey.ts` | Paratransit is for a rider who uses a wheelchair.; A caravan is towed behind a car of your own.; The way home leaves before the way out arrives.; The way home: …; and 6 more (also cabinBagRefusal, stepFreeRefusal, byCarRefusal, bookRefusal, streetRefusal, namedStayRefusal, petCareRefusal, entryRefusal) | journeysOf (added to) | Yes | travel.leave | 38 | journey-everyday-more.test.ts; journey-travel.test.ts; journey.test.ts; and 2 more |
| `travel.cancel` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/journey.ts` | That isn’t a journey you have booked. | — | Yes | — | 7 | journey.test.ts |
| `travel.change` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/journey.ts` | … is more than the bank can cover. | — | Yes | travel.leave | 2 | journey-travel.test.ts |
| `travel.check_out` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/localstay.ts` | You aren’t in a hotel booked here. | — | — | — | 3 | journey-clothes.test.ts; journey-travel.test.ts |
| `travel.child` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/companions.ts` | … is more than the bank can cover. (also childRefusal) | — | Yes | — | 2 | journey-travel.test.ts |
| `travel.companion` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/companions.ts` | — (also companionRefusal) | — | — | travel.companion_home | 2 | journey-travel.test.ts |
| `travel.extend` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/journey.ts` | … is more than the bank can cover. | — | Yes | travel.checkout; rental.return; travel.leave | 2 | journey-travel.test.ts |
| `travel.insure` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/travelinsurance.ts` | That isn’t a journey you have booked.; … is more than the bank can cover. | — | Yes | — | 2 | journey-travel.test.ts |
| `travel.late_checkout` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/latecheckout.ts` | — | — | — | — | 2 | journey-travel.test.ts |
| `travel.pay_deposit` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/journey.ts` | Your bank declined the payment. (also depositRefusal) | stay | Yes | sofa; own; let; travel.checkout; and 1 more | 3 | journey-travel.test.ts |
| `travel.pay_rental_deposit` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/rentals.ts` | No car is held for a deposit.; The hold has run out.; The deposit is …, more than the bank holds. | — | Yes | — | 2 | journey-travel.test.ts |
| `travel.rent_car` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/rentals.ts` | That isn’t a journey you have booked.; A rental is booked with the way home, which says when it goes back.; A car is rented on it already.; … is more than the bank can cover. | rentalsOf (added to) | Yes | rental.pickup; rental.return; travel.rental_deposit_due | 6 | journey-travel.test.ts |
| `travel.show_id` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/journey.ts` | — (also showIdRefusal) | — | — | — | 2 | journey-travel.test.ts |
| `travel.stay_here` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/localstay.ts` | It comes to …, more than you can pay. | stay | Yes | hotel; travel.local_stay_end | 4 | journey-clothes.test.ts; journey-travel.test.ts |
| `travel.stay_let` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/journey.ts` | That isn’t a journey you have booked.; A let takes the place of the journey’s hotel.; Too close to arrival to cancel the hotel free.; The hotel was paid ahead on a rate that isn’t refunded.; and 1 more | — | Yes | — | 4 | journey-travel.test.ts |
| `travel.take_refund` | Verified (journey) | Getting Around | TravelWorkspace.tsx | `systems/journey.ts` | — (also refundRefusal, crossingRefusal, entryRefusal, embargoRefusal, boardingIdRefusal) | — | Yes | — | 2 | journey-travel.test.ts |
| `tutorial.read` | Verified (journey) | — | Guide.tsx | `world/tutorial.ts` | This life has no guide to read through; everything is open.; There’s no such chapter.; You’ve already read “…”.; Read “…” first; the chapters go in order. | read (added to) | — | — | 2 | journey-holdings.test.ts |
| `tv.buy` | Verified (journey) | Rent And A Roof | HomesWorkspace.tsx | `systems/televisions.ts` | — | — | — | — | 3 | journey-belongings.test.ts |
| `tv.watch` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/programmes.ts` | That isn’t shown where you live. (also lookAfterRefusal, programmeRefusal) | — | — | — | 4 | journey-belongings.test.ts |
| `valuables.buy_safe` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/valuables.ts` | That isn’t on sale.; A safe is bought where you live, and bolted down there.; It’s sold in another country.; The bank couldn’t pay for it. | — | Yes | home | 2 | journey-belongings.test.ts |
| `valuables.lock_up` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/valuables.ts` | Only jewelry and watches go in the safe.; There’s no safe where you live. (also moveRefusal) | at | — | inside | 2 | journey-belongings.test.ts |
| `valuables.schedule` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/valuables.ts` | — (also scheduleRefusal) | — | — | — | 2 | journey-belongings.test.ts |
| `valuables.take_out` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/valuables.ts` | It isn’t in a safe. (also moveRefusal) | at | — | home | 2 | journey-belongings.test.ts |
| `vehicle.audio` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/caraudio.ts` | That isn’t a car you have.; … is more than the bank can cover. | audio | Yes | — | 4 | journey-cars.test.ts |
| `vehicle.buy` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/vehicles.ts` | That isn’t a car you own.; The lender has that car.; A leased car is the lessor’s: it’s returned or bought out at the lease’s end, not traded.; … is more than the bank can cover. (also buyRefusal) | modelYear; build; odometerAtPurchase; transferBy; options; and 4 more | Yes | vehicle.month; vehicle.renewal | 53 | connected-day.test.ts; journey-cars.test.ts; journey-food.test.ts; and 3 more |
| `vehicle.coverage` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/wraps.ts` | The payment didn’t go through. (also coverRefusal) | — | Yes | — | 3 | journey-cars.test.ts |
| `vehicle.hitch` | Verified (journey) | Rent And A Roof | VehiclesWorkspace.tsx | `systems/caravans.ts` | That isn’t a car you own.; The bank couldn’t pay. (also hitchRefusal) | hitch | Yes | — | 2 | journey-cars.test.ts |
| `vehicle.inspect_used` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/usedcars.ts` | A new car isn’t inspected before it’s bought.; No such car.; SLATE sells no car where you live.; … is more than the bank can cover. | inspectedUsed | Yes | — | 2 | journey-cars.test.ts |
| `vehicle.interior` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/interiors.ts` | That isn’t a car you own.; There’s no such shop.; The car isn’t in the shop’s town.; You’re not in the shop’s town.; and 4 more | interiorOrdered; interior; inShop | Yes | vehicle.interior_fit | 3 | journey-cars.test.ts |
| `vehicle.keep_in` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/vehicles.ts` | That isn’t a car you have.; In the garage or on the street.; Your home has no garage. | keptIn; errandUsed; dayKm; dry; errandKm; and 4 more | Yes | vehicle.day; vehicle.month; vehicle.renewal | 2 | journey-cars.test.ts |
| `vehicle.lease` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/leasing.ts` | … is more than the bank can cover.; That isn’t a car you lease. (also leaseRefusal) | registrationDue; vehiclesOf (added to) | Yes | vehicle.month; vehicle.lease_month; vehicle.renewal; vehicle.lease_end | 4 | journey-cars.test.ts |
| `vehicle.lease_buyout` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/leasing.ts` | … is more than the bank can cover. | — | Yes | — | 2 | journey-cars.test.ts |
| `vehicle.lease_return` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/leasing.ts` | — | — | — | — | 3 | journey-cars.test.ts |
| `vehicle.list` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/carsale.ts` | … is more than the bank can cover. (also listRefusal) | listed | Yes | vehicle.private_sale | 2 | journey-cars.test.ts |
| `vehicle.modify` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/mods.ts` | … is more than the bank can cover. (also modRefusal) | — | Yes | — | 4 | journey-cars.test.ts; journeys.test.ts |
| `vehicle.redeem` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/repossession.ts` | That car isn’t repossessed.; … is more than the bank can pay. | — | Yes | — | 2 | journey-cars.test.ts |
| `vehicle.refuel` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/fueltank.ts` | It comes to …, more than you can pay. (also fillRefusal) | fuelLevel; fills | Yes | — | 5 | journey-cars.test.ts; journeys.test.ts |
| `vehicle.repair` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/repairs.ts` | That isn’t a car you own. (also repairRefusal) | booked | — | vehicle.repair_due | 4 | journey-cars.test.ts |
| `vehicle.replace_tires` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/tires.ts` | That isn’t a car you own.; No set’s price is kept for it.; … is more than the bank can cover. (also tireOfferRefusal) | tires; tiresAtKm | Yes | — | 4 | journey-cars.test.ts |
| `vehicle.roof_box` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/roofbox.ts` | … is more than the bank can cover. (also boxRefusal) | — | Yes | vehicle | 2 | journey-cars.test.ts |
| `vehicle.roof_box_fit` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/roofbox.ts` | That isn’t a car you own.; A box goes on a roof rack.; It has a box on.; There’s no box of yours at home to put on.; and 3 more | roofBoxL | — | vehicle; home | 2 | journey-cars.test.ts |
| `vehicle.roof_rack` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/roofbox.ts` | … is more than the bank can cover. (also rackRefusal) | — | Yes | — | 2 | journey-cars.test.ts |
| `vehicle.sell` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/carsale.ts` | — (also saleRefusal) | — | — | — | 6 | journey-cars.test.ts |
| `vehicle.service` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/carcare.ts` | That isn’t a car you own.; The payment didn’t go through. (also serviceRefusal) | services; inShop | Yes | — | 2 | journey-cars.test.ts |
| `vehicle.set_filling` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/fueltank.ts` | That isn’t a vehicle you own.; SLATE keeps no tank for it. | fillUp | — | — | 2 | journey-cars.test.ts |
| `vehicle.stand_in` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/standin.ts` | That isn’t a car you own.; With its deposit it’s …, more than the bank holds.; … is more than the bank can cover. | rentalsOf (added to) | Yes | rental.return | 2 | journey-cars.test.ts |
| `vehicle.stereo` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/caraudio.ts` | That isn’t a car you have.; … is more than the bank can cover. | stereo | Yes | — | 3 | journey-cars.test.ts |
| `vehicle.test_drive` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/usedcars.ts` | No such car here.; It’s driven at the dealer where you live.; No car of that age is on offer this month. | testDriven | — | — | 2 | journey-cars.test.ts |
| `vehicle.tint` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/tint.ts` | … is more than the bank can cover. (also tintRefusal) | — | Yes | — | 3 | journey-cars.test.ts |
| `vehicle.transfer` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/usedcars.ts` | It’s in your name.; … is more than the bank can cover.; The fee, …, is more than the bank can cover. | — | Yes | — | 2 | journey-cars.test.ts |
| `vehicle.unlist` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/carsale.ts` | It isn’t listed. | — | — | vehicle.private_sale | 2 | journey-cars.test.ts |
| `vehicle.unwrap` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/wraps.ts` | The payment didn’t go through. (also unwrapRefusal) | — | Yes | — | 2 | journey-cars.test.ts |
| `vehicle.winter_tires` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/tires.ts` | … is more than the bank can cover. (also tiresRefusal, tireOfferRefusal) | — | Yes | — | 3 | journey-holdings.test.ts |
| `vehicle.wrap` | Verified (journey) | A Car Of Your Own | VehiclesWorkspace.tsx | `systems/wraps.ts` | The payment didn’t go through. (also wrapRefusal) | — | Yes | — | 4 | journey-cars.test.ts |
| `watch.battery` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/watches.ts` | The bank can’t pay for it. (also batteryRefusal) | at; batteryAt | Yes | service; watch.back | 2 | journey-belongings.test.ts |
| `watch.service` | Verified (journey) | Rent And A Roof | BelongingsWorkspace.tsx | `systems/watches.ts` | Only a mechanical watch whose maker’s service SLATE keeps is serviced here.; The … isn’t to hand.; … prices no service where you are.; The bank can’t pay for it. | at; servicedAt | Yes | service; watch.back; home; person | 2 | journey-clothes.test.ts |
| `world.dismiss_decision` | Verified (journey) | What Needs You | Home.tsx | `world/world.ts` | No such decision.; It’s dismissed already. | — | — | — | 2 | journey-holdings.test.ts |
| `world.mark_read` | Verified (journey) | What Needs You | Home.tsx | `world/world.ts` | — | — | — | — | 1 | journey-homes.test.ts |
| `world.set_preferences` | Verified (journey) | The Clock | TimeControls.tsx game-context.tsx | `world/world.ts` | … isn’t a preference.; The clock runs paused, live, fast or faster. | — | — | — | 3 | journey-holdings.test.ts |
| `world.take_decision_action` | Verified (journey) | What Needs You | Home.tsx | `world/world.ts` | No such decision.; That action isn’t available on this item. | — | — | — | 3 | journey-homes.test.ts |

## Scheduled kinds

What time sets off: each kind, the file that handles it, the files that schedule it, what it changes, whether it moves
money, what it sets going next, and how many test files name it or its constant.

| Kind | Handled In | Scheduled By | Changes | Money | Later | Tests |
|---|---|---|---|---|---|---|
| `ARREST_KIND` | `systems/alcohol.ts` | — | — | Yes | — | 0 |
| `CLOSING_KIND` | `systems/homes.ts` | — | — | — | — | 0 |
| `INSPECTION_KIND` | `systems/homes.ts` | — | — | — | — | 0 |
| `READY_KIND` | `systems/clothing.ts` | — | — | — | home; person | 0 |
| `SALE_KIND` | `systems/homes.ts` | — | — | — | — | 0 |
| `WORKS_KIND` | `systems/homes.ts` | — | offersMade; counter; works; selling; tenancies; and 4 more | Yes | home.planning_refused; WORKS_KIND; SALE_KIND; and 1 more | 0 |
| `aircraft.month` | `systems/aviation.ts` | systems/aviation.ts | — | Yes | aircraft.repo_sale | 2 |
| `aircraft.repo_sale` | `systems/aviation.ts` | systems/aviation.ts | — | Yes | — | 0 |
| `awards.ceremony` | `systems/awards.ts` | systems/awards.ts | — | — | — | 4 |
| `bank.check_clears` | `systems/payments.ts` | systems/payments.ts | — | — | — | 1 |
| `bank.fraud_refund` | `systems/security.ts` | systems/security.ts | expiresAt | Yes | bank.fraud_refund | 1 |
| `bank.loan_due` | `systems/lending.ts` | systems/lending.ts | — | Yes | — | 3 |
| `bank.month_end` | `systems/banking.ts` | systems/banking.ts | — | Yes | bank.savings_notice | 0 |
| `bank.savings_notice` | `systems/banking.ts` | systems/banking.ts; systems/lending.ts | — | — | — | 0 |
| `bank.scheduled_payment` | `systems/payments.ts` | systems/payments.ts | standingOrders (added to) | Yes | bank.standing_order; bank.scheduled_payment | 1 |
| `bank.standing_order` | `systems/payments.ts` | systems/payments.ts | — | Yes | bank.standing_order | 1 |
| `bank.switch_complete` | `systems/lending.ts` | systems/lending.ts | — | Yes | loan; savings; bank.switch_complete | 2 |
| `benefits.assistance_month` | `systems/assistance.ts` | systems/assistance.ts | — | Yes | escrow | 0 |
| `benefits.desempleo_month` | `systems/homebenefits.ts` | systems/homebenefits.ts | — | — | benefits.desempleo_month | 1 |
| `benefits.ja_week` | `systems/homebenefits.ts` | systems/homebenefits.ts | — | — | benefits.ja_week | 0 |
| `benefits.uc_period` | `systems/universalcredit.ts` | systems/universalcredit.ts | — | Yes | — | 0 |
| `benefits.week` | `systems/unemployment.ts` | systems/unemployment.ts | — | Yes | benefits.week | 1 |
| `boat.month` | `systems/boats.ts` | systems/boats.ts | — | Yes | boat.repo_sale | 1 |
| `boat.repo_sale` | `systems/boats.ts` | systems/boats.ts | — | Yes | — | 0 |
| `build.loan_month` | `systems/construction.ts` | systems/construction.ts | — | Yes | build.loan_month | 0 |
| `build.reinspect` | `systems/construction.ts` | systems/construction.ts | — | — | — | 0 |
| `build.retention` | `systems/construction.ts` | systems/construction.ts | building; log (added to) | Yes | loan; build.loan_month; build.stage | 0 |
| `build.stage` | `systems/construction.ts` | systems/construction.ts | log (added to) | Yes | — | 0 |
| `caravan.month` | `systems/caravans.ts` | systems/caravans.ts | — | Yes | — | 0 |
| `card.arrives` | `systems/cardlife.ts` | systems/cardlife.ts | — | — | credit_card; card.arrives | 0 |
| `card.due` | `systems/credit.ts` | systems/credit.ts | — | Yes | — | 21 |
| `card.replaced` | `systems/security.ts` | systems/security.ts | last4; issued; expiresAt; billersStale | — | — | 0 |
| `card.statement` | `systems/credit.ts` | systems/credit.ts | — | Yes | — | 16 |
| `career.agency_term` | `systems/career.ts` | systems/career.ts | renewal | — | — | 3 |
| `career.airs` | `systems/career.ts` | systems/career.ts | — | — | — | 2 |
| `career.audition` | `systems/career.ts` | systems/career.ts; systems/commercial.ts | status; missed | Yes | career.offer | 7 |
| `career.dues` | `systems/career.ts` | systems/career.ts | — | — | — | 2 |
| `career.festival` | `systems/career.ts` | systems/career.ts | status; t1287Rate; returnedHomeAt | Yes | — | 4 |
| `career.fitting` | `systems/career.ts` | systems/career.ts | status; fittingOwed | — | — | 2 |
| `career.improv` | `systems/career.ts` | systems/career.ts | status | — | career.workshop | 4 |
| `career.lapse` | `systems/career.ts` | systems/career.ts | status | — | — | 0 |
| `career.offer` | `systems/career.ts` | systems/career.ts | rate; bookings (added to) | — | career.lapse | 6 |
| `career.pay` | `systems/career.ts` | systems/career.ts | travelOwed; fittingOwed; owed; perDiemOwed; wardrobeOwed; and 1 more | Yes | career.query_answer | 4 |
| `career.press` | `systems/career.ts` | systems/career.ts | — | — | — | 2 |
| `career.query_answer` | `systems/career.ts` | systems/career.ts | managerId; managerSince; managerOffers | — | — | 0 |
| `career.renewal` | `systems/career.ts` | systems/career.ts | status; lastBookedAt; submitted; chosen; sites; and 5 more | — | career.work; career.travel; social.stay; and 1 more | 3 |
| `career.residual` | `systems/career.ts` | systems/career.ts | — | — | — | 4 |
| `career.showcase` | `systems/career.ts` | systems/career.ts | showcases (added to) | — | — | 6 |
| `career.travel` | `systems/career.ts` | systems/career.ts | travelOwed; stay; perDiemOwed | — | hotel | 4 |
| `career.wardrobe_back` | `systems/fittings.ts` | systems/fittings.ts | — | — | — | 1 |
| `career.week` | `systems/career.ts` | systems/career.ts | submitted; offers; managerOffers; auditions; auditions (added to) | — | career.audition | 10 |
| `career.work` | `systems/career.ts` | systems/career.ts | status; missedNights; worked; owed; overtimeDays; and 2 more | — | — | 9 |
| `career.workshop` | `systems/career.ts` | systems/career.ts | status; publicist | — | — | 2 |
| `child.birth` | `systems/children.ts` | systems/children.ts | childrenOf (added to) | Yes | travel.leave | 0 |
| `child.month` | `systems/children.ts` | systems/adoption.ts; systems/children.ts | — | Yes | child.month | 1 |
| `citizenship.decided` | `systems/citizenship.ts` | systems/citizenship.ts | naturalized | — | — | 0 |
| `clothes.collect_due` | `systems/clothing.ts` | systems/clothing.ts | basket; dressed; outfits; basketOf (added to) | — | — | 0 |
| `club.close` | `systems/clubs.ts` | systems/clubs.ts | — | — | — | 2 |
| `club.due` | `systems/clubs.ts` | systems/clubs.ts | — | — | — | 4 |
| `club.meet` | `systems/clubs.ts` | systems/clubs.ts | — | — | club.close | 0 |
| `dating.month` | `systems/dating.ts` | systems/dating.ts | — | Yes | dating.month | 0 |
| `documents.decided` | `systems/documents.ts` | systems/documents.ts; systems/residence.ts | documentsOf (added to) | Yes | passport; documents.decided | 0 |
| `documents.idcard_arrives` | `systems/identity.ts` | systems/identity.ts | documentsOf (added to) | Yes | idcard | 0 |
| `documents.license_card` | `systems/licensing.ts` | systems/licensing.ts | documentsOf (added to) | Yes | idp | 0 |
| `documents.license_step` | `systems/licensing.ts` | systems/licensing.ts | status; documentsOf (added to) | Yes | documents.license_step; documents.license_card | 4 |
| `documents.opt_week` | `systems/permission.ts` | systems/permission.ts | — | — | documents.opt_week | 0 |
| `documents.permission` | `systems/permission.ts` | systems/permission.ts | — | — | documents.opt_week | 0 |
| `documents.us_status` | `systems/permission.ts` | systems/permission.ts | usOutOfStatus | — | shared | 0 |
| `documents.visit` | `systems/papervisits.ts` | systems/papervisits.ts | keptAt; missed; at | — | — | 4 |
| `family.care_visit` | `systems/parents.ts` | systems/parents.ts | status | — | — | 4 |
| `family.school_run` | `systems/schoolrun.ts` | systems/schoolrun.ts | status | — | — | 2 |
| `food.table` | `systems/reservations.ts` | systems/reservations.ts | reservations | Yes | — | 0 |
| `garden.frost` | `systems/garden.ts` | systems/garden.ts | garden | — | — | 0 |
| `garden.ripe` | `systems/garden.ts` | systems/garden.ts | — | — | garden.frost | 0 |
| `gym.month` | `systems/gyms.ts` | systems/gyms.ts | — | Yes | gym.month | 0 |
| `health.appeal_decided` | `systems/health.ts` | systems/health.ts | — | Yes | — | 0 |
| `health.appointment` | `systems/appointments.ts` | systems/appointments.ts | status | — | — | 4 |
| `health.bill` | `systems/health.ts` | systems/health.ts | — | Yes | loan; health.appeal_decided | 0 |
| `health.month` | `systems/health.ts` | systems/health.ts | — | — | health.month | 0 |
| `health.therapy_session` | `systems/therapy.ts` | systems/therapy.ts | status | Yes | — | 0 |
| `health.week` | `systems/health.ts` | systems/health.ts | — | — | health.week | 3 |
| `home.appliance_out` | `systems/appliances.ts` | systems/appliances.ts | improvements; acUnits | Yes | home.units_out | 0 |
| `home.lodger_month` | `systems/lodgers.ts` | systems/lodgers.ts | lodgers | — | — | 0 |
| `home.planning_refused` | `systems/homes.ts` | systems/homes.ts | works | Yes | — | 0 |
| `home.portable_out` | `systems/appliances.ts` | systems/appliances.ts | — | — | — | 0 |
| `home.rent` | `systems/household.ts` | systems/household.ts | payments | Yes | — | 7 |
| `home.subscription_month` | `systems/homelife.ts` | systems/homelife.ts | subscriptions | Yes | — | 0 |
| `home.units_out` | `systems/appliances.ts` | systems/appliances.ts | portables | Yes | home.portable_out | 0 |
| `injury.comp` | `systems/injury.ts` | systems/injury.ts | — | — | injury.comp | 0 |
| `items.bulky_collected` | `systems/bulky.ts` | systems/bulky.ts | items | — | — | 0 |
| `items.held_ends` | `systems/luggage.ts` | systems/luggage.ts | items; luggageId; packingLists | Yes | home | 0 |
| `items.order_arrives` | `systems/orders.ts` | systems/orders.ts | — | — | — | 0 |
| `items.order_held_due` | `systems/orders.ts` | systems/orders.ts | — | — | — | 0 |
| `items.out_for_delivery` | `systems/orders.ts` | systems/orders.ts | — | — | — | 0 |
| `jewelry.ready` | `systems/commissions.ts` | systems/commissions.ts | commissions; engraved | Yes | home; person; accessory | 0 |
| `kind` | `systems/adoption.ts` | — | — | — | — | 5 |
| `land.closing` | `systems/land.ts` | systems/land.ts | parcelsOf (added to) | Yes | land.loan_month; land.tax_year; land.sale_closes | 1 |
| `land.exchange` | `systems/land.ts` | systems/land.ts | — | — | — | 1 |
| `land.lease_year` | `systems/landlease.ts` | systems/landlease.ts | — | — | land.lease_year | 0 |
| `land.loan_month` | `systems/land.ts` | systems/land.ts; systems/landloan.ts | — | Yes | land.exchange; land.closing | 0 |
| `land.sale_closes` | `systems/land.ts` | systems/land.ts | — | Yes | — | 0 |
| `land.tax_year` | `systems/land.ts` | systems/land.ts | — | Yes | land.tax_year | 0 |
| `life.birthday` | `systems/birthdays.ts` | systems/birthdays.ts | — | — | — | 3 |
| `life.commitment` | `world/plans.ts` | world/plans.ts | status; resolvedAt | — | life.commitment | 6 |
| `life.day_rollover` | `systems/life.ts` | index.ts; systems/life.ts | lastSleptAt; awakeSince; wokeWithDebt; groomedAt | Yes | life.day_rollover | 2 |
| `life.end` | `systems/mortality.ts` | systems/driving.ts; systems/mortality.ts | — | — | — | 4 |
| `pawn.due` | `systems/pawn.ts` | systems/pawn.ts | — | — | — | 0 |
| `pension.bienestar_payment` | `systems/homepensions.ts` | systems/homepensions.ts | — | Yes | pension.bienestar_payment | 0 |
| `pension.ca_month` | `systems/capensions.ts` | systems/capensions.ts | — | — | — | 0 |
| `pension.ie_week` | `systems/homepensions.ts` | systems/homepensions.ts | bienestarFrom | Yes | pension.ie_week; pension.bienestar_payment | 0 |
| `pension.imss_month` | `systems/imss.ts` | systems/imss.ts | — | Yes | pension.imss_month | 0 |
| `pension.month` | `systems/pension.ts` | systems/pension.ts | pensionStart | Yes | pension.month | 2 |
| `pension.ss_month` | `systems/socialsecurity.ts` | systems/socialsecurity.ts | — | Yes | pension.ss_month | 0 |
| `pension.state_payment` | `systems/statepension.ts` | systems/statepension.ts | — | Yes | pension.state_payment | 0 |
| `pets.month` | `systems/pets.ts` | systems/pets.ts | — | — | pets.month | 0 |
| `phone.month` | `systems/phones.ts` | systems/phones.ts | — | Yes | — | 0 |
| `pilot.medical` | `systems/aviation.ts` | systems/aviation.ts | — | Yes | pilot.medical | 2 |
| `pilot.month` | `systems/aviation.ts` | systems/aviation.ts | pilotLicences; pilot; planes | Yes | pilot.medical; aircraft.month | 2 |
| `rental.pickup` | `systems/rentals.ts` | systems/rentals.ts | — | Yes | rental.pickup; travel.rental_deposit_due | 0 |
| `rental.return` | `systems/rentals.ts` | systems/journey.ts; systems/rentals.ts; systems/standin.ts | — | — | — | 3 |
| `roadside.renew` | `systems/roadside.ts` | systems/roadside.ts | — | Yes | roadside.renew | 1 |
| `routine.due` | `systems/routines.ts` | systems/routines.ts | routines | — | — | 6 |
| `school.cabaret` | `systems/school.ts` | systems/school.ts | status | — | cabaret; school.summer; school.stipend | 4 |
| `school.call` | `systems/school.ts` | systems/school.ts | status | — | school.call | 9 |
| `school.classes` | `systems/school.ts` | systems/school.ts | status | — | — | 2 |
| `school.commencement` | `systems/school.ts` | systems/school.ts | — | — | school.cabaret | 2 |
| `school.company` | `systems/school.ts` | systems/school.ts | — | — | — | 2 |
| `school.evaluation` | `systems/school.ts` | systems/school.ts | — | — | — | 0 |
| `school.lab` | `systems/school.ts` | systems/school.ts | status | — | — | 2 |
| `school.orientation` | `systems/coursework.ts` | systems/coursework.ts | status | — | — | 3 |
| `school.partner_ask` | `systems/coursework.ts` | systems/coursework.ts | — | — | — | 2 |
| `school.partner_rehearsal` | `systems/coursework.ts` | systems/coursework.ts | — | — | — | 6 |
| `school.payday` | `systems/school.ts` | systems/school.ts | — | Yes | — | 1 |
| `school.recess` | `systems/school.ts` | systems/school.ts | — | — | — | 0 |
| `school.shift` | `systems/school.ts` | systems/school.ts | status | — | — | 2 |
| `school.stipend` | `systems/school.ts` | systems/school.ts | — | Yes | school.shift | 2 |
| `school.summer` | `systems/school.ts` | systems/school.ts | status | — | summer | 3 |
| `school.term` | `systems/school.ts` | systems/school.ts | — | Yes | school.recess; school.evaluation; school.term | 2 |
| `school.week` | `systems/school.ts` | systems/school.ts | — | — | — | 4 |
| `social.anniversary` | `systems/marriage.ts` | systems/marriage.ts | — | — | social.anniversary | 1 |
| `social.divorce_final` | `systems/marriage.ts` | systems/marriage.ts | — | Yes | — | 0 |
| `social.host` | `systems/hosting.ts` | systems/hosting.ts | items | Yes | — | 5 |
| `social.meet` | `systems/people.ts` | systems/people.ts | — | Yes | — | 4 |
| `social.stay` | `systems/houseguests.ts` | systems/career.ts; systems/houseguests.ts | — | — | social.stay_day | 1 |
| `social.stay_day` | `systems/houseguests.ts` | systems/houseguests.ts | — | Yes | social.stay_day | 2 |
| `social.wedding` | `systems/marriage.ts` | systems/marriage.ts | marriage | — | social.anniversary | 1 |
| `tax.due` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.substitute | 2 |
| `tax.notice` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | Yes | — | 3 |
| `tax.refund` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | Yes | tax.refund | 0 |
| `tax.season` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.season; tax.due | 2 |
| `tax.substitute` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.substitute | 0 |
| `travel.arrive` | `systems/journey.ts` | systems/journey.ts | stay | Yes | own; let; travel.checkout; and 1 more | 0 |
| `travel.bag_back` | `systems/baggage.ts` | systems/baggage.ts | — | — | stay; person; home | 0 |
| `travel.bag_lost` | `systems/baggage.ts` | systems/baggage.ts | items; goingBags | Yes | — | 0 |
| `travel.checkout` | `systems/journey.ts` | systems/journey.ts; systems/latecheckout.ts | — | — | — | 3 |
| `travel.companion_home` | `systems/companions.ts` | systems/companions.ts | — | — | — | 0 |
| `travel.compensation` | `systems/compensation.ts` | systems/compensation.ts | — | Yes | — | 2 |
| `travel.deposit_due` | `systems/journey.ts` | systems/journey.ts | stay | Yes | sofa | 1 |
| `travel.leave` | `systems/journey.ts` | systems/children.ts; systems/journey.ts | — | Yes | — | 5 |
| `travel.local_stay_end` | `systems/localstay.ts` | systems/localstay.ts | — | — | — | 2 |
| `travel.rental_deposit_due` | `systems/rentals.ts` | systems/rentals.ts | — | Yes | — | 1 |
| `travel.room_ready` | `systems/journey.ts` | systems/journey.ts | — | — | — | 0 |
| `vehicle.day` | `systems/vehicles.ts` | systems/vehicles.ts | errandUsed; dayKm; dry | — | vehicle.day | 0 |
| `vehicle.interior_fit` | `systems/interiors.ts` | systems/interiors.ts | inShop; interior | — | — | 0 |
| `vehicle.lease_end` | `systems/leasing.ts` | systems/leasing.ts | — | Yes | — | 0 |
| `vehicle.lease_month` | `systems/leasing.ts` | systems/leasing.ts | — | Yes | vehicle.lease_month; vehicle.lease_end | 0 |
| `vehicle.month` | `systems/vehicles.ts` | systems/leasing.ts; systems/vehicles.ts | errandKm; dayKm; errandUsed; fuelLevel; monthsCharged; and 1 more | Yes | vehicle.month | 1 |
| `vehicle.private_sale` | `systems/carsale.ts` | systems/carsale.ts | — | — | vehicle.private_sale | 2 |
| `vehicle.renewal` | `systems/vehicles.ts` | systems/leasing.ts; systems/vehicles.ts | registrationDue | Yes | vehicle.renewal | 2 |
| `vehicle.repair_due` | `systems/repairs.ts` | systems/repairs.ts | — | — | — | 2 |
| `vehicle.repo_sale` | `systems/vehicles.ts` | systems/repossession.ts | — | — | — | 1 |
| `watch.back` | `systems/watches.ts` | systems/watches.ts | at | — | home; person | 0 |
| `world.tick` | `world/world.ts` | index.ts; world/world.ts | — | — | world.tick | 0 |
