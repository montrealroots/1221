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

- Verified (journey): 46
- Implemented But Unverified: 96
- Partially Implemented: 4
- Commands in all: 146

## Commands

| Command | Status | Chapter | Screens | Handled In | Refuses | Changes | Money | Later | Tests | Journeys |
|---|---|---|---|---|---|---|---|---|---|---|
| `bank.add_standing_order` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | A standing order of your own goes into one of your savings accounts.; Say how much each month.; Pick a day of the month, 1 to 31. | standingOrders (added to) | — | bank.standing_order | 5 | journey-money.test.ts |
| `bank.arrange_overdraft` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t an open current account of yours.; There’s no current account to arrange one on.; Pay the overdraft back before closing it.; The bank arranges between …)} and …)}.; and 1 more | — | — | — | 4 | journey-money.test.ts |
| `bank.borrow` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t a bank you keep an account at.; The loan is paid into, and repaid from, an open current account of yours. | — | — | loan | 3 | journey-money.test.ts |
| `bank.break_term` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; You need a current account for the money.; It closes on …, on the notice given. | — | — | — | 3 | journey-money.test.ts |
| `bank.cancel_new` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your accounts.; Its cooling-off period has passed, or there isn’t one here for it.; You don’t have a card.; Your primary current account can’t be canceled. Make another primary first.; and 1 more | — | Yes | — | 2 | — |
| `bank.cancel_scheduled` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | There’s no payment waiting by that name. | — | — | — | 2 | journey-money.test.ts |
| `bank.cancel_standing_order` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | There’s no standing order by that name. | — | — | — | 3 | journey-money.test.ts |
| `bank.cancel_switch` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | No switch is under way.; This country’s switching service publishes no right to call a switch off: it runs to its d; It could be called off until …, seven working days before its date; it’s under way now. It; Calling it off leaves your accounts and payments where they are. Confirm to go ahead. | — | — | — | 2 | — |
| `bank.claim_unclaimed` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | No money of yours is held as unclaimed. | unclaimed | Yes | — | 1 | — |
| `bank.close_current` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | Only a current account of yours can be closed here.; … closes … already.; Say which account of yours … goes to. (also closeRefusal) | — | — | bank.current_closes | 5 | — |
| `bank.close_savings` | Implemented But Unverified | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | Only a savings account of yours can be closed here.; There’s no current account to move the money into.; Notice is given: … closes on …. | — | — | bank.savings_notice | 7 | — |
| `bank.debit_overdraft` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | Your bank doesn’t ask you this.; … never pays a debit card purchase into an overdraft. | — | — | — | 1 | — |
| `bank.new_number` | Implemented But Unverified | Your Bank | BankSecurity.tsx | `systems/security.ts` | You have no current account.; … doesn’t say it moves an account to a new number; closing it and opening another does. | — | — | — | 2 | — |
| `bank.open_current` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | Fund it from one of your own current or savings accounts.; That account is at … already.; … asks for an opening deposit of …)}, sent from another of your accounts.; Say how much to put in.; and 1 more (also openRefusal) | status | Yes | bank.application; card.arrives | 8 | — |
| `bank.open_savings` | Implemented But Unverified | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | Savings opens beside a current account of yours at that bank.; You already have a savings account at …. | — | — | — | 6 | — |
| `bank.open_term` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | … publishes no term deposit rate SLATE has.; A term deposit at … is funded from your current account there: open one first.; Say how much to put in.; It takes …)} or more.; and 1 more | — | — | savings | 4 | journey-money.test.ts |
| `bank.pay_collections` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | You don’t owe anything in collections.; You have no account to pay from.; There’s nothing in the account to pay it with. | — | — | — | 1 | — |
| `bank.reactivate` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That account isn’t dormant. | — | — | — | 1 | — |
| `bank.redirect_deposits` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | Wages are paid into an open current or savings account of yours.; … is closing. | — | — | — | 2 | — |
| `bank.repay_loan` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | You don’t have a loan to pay off.; Paying it off takes …)}, and the bank can’t cover it all. | — | Yes | — | 2 | journey-money.test.ts |
| `bank.schedule_payment` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | A scheduled payment goes between two of your own accounts.; Say how much.; Pick a day ahead. | — | — | bank.scheduled_payment | 2 | journey-money.test.ts |
| `bank.set_alerts` | Verified (journey) | Your Bank | BankStatements.tsx | `systems/statements.ts` | Set the … as an amount, or turn it off. | alerts | — | — | 4 | journey-money.test.ts |
| `bank.set_loan_repayment` | Partially Implemented | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t an open loan of yours.; A loan is repaid from an open current account of yours.; … is closing. | — | — | — | 0 | — |
| `bank.set_order_source` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | No such standing order.; A standing order pays from an open current account of yours.; … is closing.; It pays into that account. | fromId | — | — | 1 | — |
| `bank.set_payments` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | Everyday spending goes in cash, on the debit card or on the credit card.; There’s no savings account to cover the current account. | — | — | — | 8 | journey-money.test.ts |
| `bank.set_primary` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | Only an open current account of yours can be primary.; … is primary already.; … is closing. | primaryAccountId | — | — | 5 | — |
| `bank.set_round_ups` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | … doesn’t round purchases up into savings. | roundUps | — | — | 2 | journey-money.test.ts |
| `bank.set_term_end` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; … doesn’t let a term deposit end that way.; … needs … days’ notice before the end to change it. | — | — | — | 1 | — |
| `bank.stop_balance_transfer` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | No switch is under way.; This country’s switching service publishes no such step.; Its balance transfer is stopped already.; The transfer could be stopped until close of business ….; and 1 more | payload | — | — | 1 | — |
| `bank.switch` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t a bank where you live.; You already bank with ….; You keep an account at … already: make it primary, move what pays from the old one, and cl; … won’t open an account for somebody who owes it a charged-off debt.; and 8 more (also switchApplicationRefusal) | — | — | bank.switch_complete; bank.switch_review | 8 | — |
| `bank.take_overrun_loan` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | Your bank has offered no loan for an overrun.; You already have a loan with the bank. | — | — | loan | 1 | — |
| `bank.take_term_interest` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; … pays a term deposit’s interest at its end.; It hasn’t earned anything to take yet. | — | Yes | — | 1 | — |
| `bank.transfer` | Verified (journey) | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | Money moves here between your own current and savings accounts.; That’s the same account.; Say how much to move.; … is blocked to everything but paying off what it owes, since the switch.; and 5 more | — | Yes | — | 7 | journey-money.test.ts |
| `benefits.assistance` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/assistance.ts` | — (also assistanceRefusal, snapStudentRefusal) | assistance | Yes | escrow | 1 | — |
| `benefits.claim` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/unemployment.ts` | SLATE pays unemployment in New York, California and Connecticut, where you’d have to have ; You have a claim open.; Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3; … Your base period’s quarters paid …. | — | Yes | benefits.week | 4 | — |
| `benefits.ei_register` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/eiself.ts` | — (also eiRefusal) | ei | — | — | 1 | — |
| `calendar.cancel` | Verified (journey) | Your Own Plans | CalendarWorkspace.tsx | `world/plans.ts` | — | — | — | — | 3 | journey-life.test.ts |
| `calendar.schedule` | Verified (journey) | Your Own Plans | CalendarWorkspace.tsx | `world/plans.ts` | — | — | — | life.commitment | 9 | journey-life.test.ts |
| `calendar.skip` | Implemented But Unverified | What’s Coming | TimeControls.tsx | `world/plans.ts` | — | status; resolvedAt | — | — | 2 | — |
| `card.apply` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You have no credit record to apply with.; A card is already on its way.; You need a bank to apply to.; SLATE doesn’t know that bank.; and 3 more (also transferRefusal) | — | — | card.arrives | 4 | — |
| `card.close` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; It’s already being closed. | — | — | — | 3 | — |
| `card.dispute` | Implemented But Unverified | Your Bank | BankSecurity.tsx | `systems/security.ts` | — (also disputeRefusal) | — | — | bank.fraud_refund | 2 | — |
| `card.lock` | Verified (journey) | Your Bank | BankSecurity.tsx | `systems/security.ts` | … locks a card only by phone.; That card is stopped; a new one is on its way. | — | — | — | 3 | journey-money.test.ts |
| `card.money_transfer` | Implemented But Unverified | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | You don’t have a card.; The … doesn’t offer money transfers.; You need a current account for the money.; Say how much.; and 1 more | — | Yes | money | 1 | — |
| `card.plan` | Implemented But Unverified | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | You don’t have a card.; The … has no plan SLATE has terms for.; A plan runs … months.; Purchases owe … that can go into a plan.; and 1 more | — | — | — | 1 | — |
| `card.redeem_rewards` | Verified (journey) | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | The card has no rewards to redeem. | — | Yes | — | 2 | journey-money.test.ts |
| `card.refund_credit` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/credit.ts` | The card holds no credit to send back. | — | — | — | 1 | — |
| `card.report` | Implemented But Unverified | Your Bank | BankSecurity.tsx | `systems/security.ts` | Lost, stolen or damaged.; That card is stopped already; a new one is on its way.; … has no rush replacement SLATE knows of. | — | Yes | — | 1 | — |
| `card.request_hardship` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; You’re on a plan already.; The card owes nothing.; You could pay it off today: a hardship plan is for when you can’t. | — | — | — | 2 | — |
| `card.request_limit` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Say the limit you want. | — | — | — | 1 | — |
| `card.set_auto_raise` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card. | — | — | — | 1 | — |
| `card.set_autopay_from` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | That isn’t one of your cards.; Autopay pays from an open current account of yours.; … is closing. | — | — | — | 5 | — |
| `card.set_everyday` | Verified (journey) | Your Bank | BankCard.tsx | `systems/credit.ts` | You don’t hold that card. | — | — | — | 2 | journey-money.test.ts |
| `card.set_over_limit` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Opting in to going over the limit is a US card’s choice. | — | — | — | 1 | — |
| `card.set_statement_day` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Pick a day from the 1st to the 28th. | — | — | — | 5 | journey-money.test.ts |
| `cash.deposit` | Verified (journey) | Your Bank | BankCash.tsx | `systems/cash.ts` | You have … in cash.; Cash goes into your current account or savings.; …’s customers can’t pay cash in at the Post Office. | — | Yes | — | 2 | journey-money.test.ts |
| `cash.withdraw` | Verified (journey) | Your Bank | BankCash.tsx | `systems/cash.ts` | Say how much.; From your bank’s ATM, another bank’s, the counter, the Post Office or the card. | — | Yes | — | 5 | journey-money.test.ts |
| `documents.apply_idcard` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/identity.ts` | … is more than the bank can cover. (also idCardRefusal) | documentsOf (added to) | Yes | idcard; documents.idcard_arrives | 2 | — |
| `documents.apply_opt` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/permission.ts` | — (also optRefusal) | usOutOfStatus; documentsOf (added to) | — | permit; documents.permission; documents.opt_week | 1 | — |
| `documents.apply_passport` | Verified (journey) | Passports And ID | Documents.tsx | `systems/documents.ts` | … is more than the bank can cover. (also passportRefusal) | documentsOf (added to) | Yes | passport; documents.decided | 3 | journey-life.test.ts |
| `documents.apply_ssn` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/taxid.ts` | — (also ssnRefusal) | ssn | — | documents.ssn_arrives | 2 | — |
| `documents.naturalize` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/citizenship.ts` | … is more than the bank can cover. (also naturalizeRefusal) | naturalizing; naturalized | Yes | citizenship.decided | 1 | — |
| `documents.police_report` | Verified (journey) | Cover, Benefits And Returns | Documents.tsx | `systems/documents.ts` | — (also policeReportRefusal) | — | — | — | 3 | journey-life.test.ts |
| `documents.renew_residence` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/residence.ts` | Only Mexican temporary residence is renewed, a year at a time.; It’s renewed within its last 30 days.; … is more than the bank can cover. | — | Yes | — | 2 | — |
| `documents.replace_idcard` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/identity.ts` | … is more than the bank can cover. (also idReplaceRefusal) | documentsOf (added to) | Yes | documents.idcard_arrives | 1 | — |
| `documents.replace_license` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/identity.ts` | … is more than the bank can cover. (also licenseReplaceRefusal) | documentsOf (added to) | Yes | documents.idcard_arrives | 2 | — |
| `documents.report_lost` | Verified (journey) | Passports And ID | Documents.tsx | `systems/documents.ts` | That isn’t a document you hold.; A status isn’t lost with its paper: it holds. | — | — | — | 7 | journey-life.test.ts |
| `documents.residence` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/residence.ts` | … is more than the bank can cover. (also routeRefusal) | — | Yes | — | 3 | — |
| `documents.settle` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/residence.ts` | … is more than the bank can cover. (also settleRefusal) | — | Yes | — | 1 | — |
| `finance.pay_card` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/credit.ts` | You don’t have a card.; You don’t owe anything on it.; Pay something, or nothing.; There’s nothing in the bank to pay it with. | — | — | — | 3 | — |
| `finance.set_autopay` | Verified (journey) | Your Bank | BankCard.tsx | `systems/credit.ts` | Autopay pays the minimum or the whole statement.; You don’t have a card.; … takes the whole statement from your account each month; the … can’t carry a balance. | — | — | — | 3 | journey-money.test.ts |
| `genre.study` | Implemented But Unverified | You As An Actor | ProfileWorkspace.tsx | `systems/engagement.ts` | — (also studyRefusal) | — | — | — | 3 | — |
| `health.appeal` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — (also appealRefusal) | — | Yes | school.leave_appeal | 2 | — |
| `health.apply_aid` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | There’s no such bill. (also aidRefusal) | — | — | — | 1 | — |
| `health.book` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/appointments.ts` | There’s nothing to see a doctor about.; You have an appointment already.; No wait is published where you live; you’re seen when it comes up. | — | — | — | 2 | journey-life.test.ts |
| `health.cancel_appointment` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/appointments.ts` | No such appointment. | — | — | — | 2 | journey-life.test.ts |
| `health.choose_clinic` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — (also clinicRefusal) | — | — | — | 1 | — |
| `health.choose_pharmacy` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | There’s no such pharmacy.; A pharmacy’s own cash price is kept only in America. | — | — | — | 2 | journey-life.test.ts |
| `health.dental` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | You have no dental plan.; Yale’s dental plan can’t be canceled once paid.; You have a dental plan.; The year is …, which the bank can’t cover.; and 1 more | — | — | — | 2 | journey-life.test.ts |
| `health.drop` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | You have no plan of your own to drop. | — | — | — | 1 | — |
| `health.enroll` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — | — | — | — | 2 | — |
| `health.extra_supply` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — (also extraSupplyRefusal) | — | — | — | 1 | — |
| `health.pay_bill` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | You owe nothing for care.; Say how much.; … can’t cover it. | — | Yes | — | 3 | — |
| `health.prepay` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | It comes to …, more than you can pay. (also prepayRefusal) | — | — | — | 2 | — |
| `health.therapy` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/therapy.ts` | — (also therapyRefusal) | therapy; status | Yes | — | 2 | — |
| `health.treat` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | You don’t have that. | — | — | — | 2 | — |
| `life.look_after` | Verified (journey) | Looking After Yourself | TimeControls.tsx | `systems/life.ts` | That isn’t something you can do for yourself here.; The payment didn’t go through. (also lookAfterRefusal) | — | Yes | — | 7 | journey-life.test.ts |
| `life.sleep` | Verified (journey) | Sleep | TimeControls.tsx | `systems/life.ts` | Say how long to sleep.; Say when to sleep.; You can’t go to sleep in the past.; A night can be planned a day ahead at most.; and 1 more | lastSleptAt; awakeSince; wokeWithDebt | — | — | 10 | journey-life.test.ts; journey-school-year.test.ts |
| `pension.bienestar` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/homepensions.ts` | — (also bienestarRefusal) | bienestarFrom | Yes | pension.bienestar_payment | 1 | — |
| `pension.ie_state` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/homepensions.ts` | — (also irishPensionRefusal) | irishPension | Yes | pension.ie_week | 1 | — |
| `pension.imss` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/imss.ts` | — (also imssRefusal) | — | Yes | pension.imss_month | 1 | — |
| `pension.social_security` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/socialsecurity.ts` | — (also socialSecurityRefusal) | socialSecurity | Yes | pension.ss_month | 1 | — |
| `pension.state` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/statepension.ts` | — (also statePensionRefusal) | statePensionFrom | Yes | pension.state_payment | 1 | — |
| `plays.read` | Verified (journey) | Drama School | SchoolWorkspace.tsx | `systems/playreading.ts` | — (also readRefusal) | — | — | — | 2 | journey-life.test.ts |
| `plays.research` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/playreading.ts` | — (also researchRefusal) | — | — | — | 1 | — |
| `practice.exercise` | Implemented But Unverified | You As An Actor | ProfileWorkspace.tsx | `systems/practice.ts` | There’s no such tier. (also practiceRefusal, focusRefusal) | — | — | — | 4 | — |
| `practice.self_tape` | Implemented But Unverified | You As An Actor | ProfileWorkspace.tsx | `systems/engagement.ts` | — (also selfTapeRefusal) | — | — | — | 4 | — |
| `school.answer_partner` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also answerRefusal) | — | — | — | 4 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.appeal_leave` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | Only a leave the dean imposed can be appealed.; You appealed on ….; The appeal had to be in by …. | — | — | school.leave_appeal | 1 | — |
| `school.approach` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | That isn’t a way to work on it. (also approachRefusal) | — | — | — | 2 | journey-three-students.test.ts |
| `school.ask_partner` | Implemented But Unverified | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also askRefusal) | — | — | — | 3 | — |
| `school.buy_affiliate` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | Affiliate cover is for a student on leave.; It could be bought until ….; Affiliate cover for the leave’s two terms is …${credit ? ; Your bank can’t cover it. | — | Yes | — | 1 | — |
| `school.buy_ppe` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | It’s …, which the bank can’t cover. (also ppeRefusal) | status | — | — | 1 | — |
| `school.cabaret` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx day.tsx | `systems/school.ts` | — (also cabaretRefusal) | status | — | school.cabaret; cabaret | 3 | — |
| `school.call_in_sick` | Verified (journey) | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | — (also sickRefusal) | — | — | — | 4 | journey-life.test.ts |
| `school.cancel_leave` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | Calling it off keeps you at the School as you are. Confirm to go ahead. | — | — | — | 1 | — |
| `school.cancel_rehearsal` | Implemented But Unverified | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | There’s no such rehearsal booked. | — | — | — | 1 | — |
| `school.cancel_repeat` | Partially Implemented | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | No repeat is asked for. | — | — | school.term | 0 | — |
| `school.choose` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | That isn’t a question this work asks.; That isn’t one of the answers.; Read it first: table work is done on a text you know.; That’s your answer already. (also startRefusal) | — | — | — | 2 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.choose_part_playing` | Partially Implemented | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also partPlayingRefusal) | — | — | — | 0 | — |
| `school.choose_playing` | Partially Implemented | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also playingRefusal) | — | — | — | 0 | — |
| `school.extend_incomplete` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/courserecord.ts` | — (also extendRefusal) | — | — | — | 1 | — |
| `school.learn_part` | Verified (journey) | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also ownWorkRefusal) | — | — | — | 1 | journey-school-production.test.ts |
| `school.make_amends` | Implemented But Unverified | Drama School | CourseworkPane.tsx | `systems/classmates.ts` | — (also amendsRefusal) | status | — | — | 1 | — |
| `school.make_up` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/courserecord.ts` | — (also makeUpRefusal) | — | — | — | 1 | — |
| `school.orientation` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also orientationRefusal) | — | — | — | 3 | journey-life.test.ts |
| `school.pay_balance` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | — | — | — | — | 2 | — |
| `school.prepare` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also prepareRefusal) | — | — | — | 7 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.read_feedback` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | There’s no feedback on that.; Read already. | — | — | — | 3 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.request_aid_review` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | You’re not at school.; It’s with the aid office, decided by ….; The aid office has reviewed your support.; Support past six terms is reviewed once a seventh is coming: you’re within the six. | — | — | school.aid_decide | 1 | — |
| `school.request_conversion` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/school.ts` | — (also conversionRefusal) | status; history (added to) | Yes | school.convert; run; school.call | 1 | — |
| `school.request_extra_term` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | — (also extraRefusal) | — | — | school.extra_decide; school.term | 1 | — |
| `school.request_leave` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | Give a reason. | — | — | school.welfare_decide; medical | 3 | — |
| `school.request_repeat` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | — | — | — | — | 2 | — |
| `school.reregister` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | You’re not at school.; You’re registered.; A financial hold stops registration: … is owed on your Yale account. | — | — | — | 3 | — |
| `school.respond` | Verified (journey) | Drama School | ClassMoments.tsx | `systems/classmates.ts` | That isn’t a scene you share with …. (also respondRefusal) | — | — | school.study_session | 5 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.return_notice` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | You’re not on leave.; You gave notice on ….; Its deadline has passed. | — | — | — | 3 | — |
| `school.review_blocking` | Verified (journey) | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also ownWorkRefusal) | — | — | — | 1 | journey-school-production.test.ts |
| `school.summer_cabaret` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | — (also summerRefusal) | status | Yes | school.summer; school.stipend; summer | 1 | — |
| `school.take_shift` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | — (also shiftRefusal) | — | — | school.shift | 3 | — |
| `school.withdraw` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | You’re not at school.; Withdrawing gives up your place at the School. Confirm to go ahead. | — | Yes | — | 3 | — |
| `school.work_note` | Verified (journey) | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also ownWorkRefusal) | — | — | — | 1 | journey-school-production.test.ts |
| `tax.amend` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | Your return as filed matches what’s on record: there’s nothing to amend. (also amendRefusal) | — | Yes | tax.amended | 3 | — |
| `tax.apply_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | The least a month is …, what’s owed over … months. (also planRefusal) | taxPlan; status; why; nextDue; defaultBy | Yes | short; tax.plan_decide; tax.plan_payment; tax.plan_default | 2 | — |
| `tax.apply_state_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/statetax.ts` | — (also statePlanRefusal) | nextDue | Yes | tax.state_plan_payment | 1 | — |
| `tax.catch_up_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | Your plan isn’t behind.; … is more than the bank can cover. | status; nextDue | Yes | tax.plan_payment | 1 | — |
| `tax.catch_up_state_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/statetax.ts` | That plan isn’t behind.; … is more than the bank can cover. | — | Yes | tax.state_plan_payment | 1 | — |
| `tax.file` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | There’s no return for that year.; You’ve filed it. A change is an amended return. | — | Yes | tax.refund | 6 | journey-money.test.ts |
| `tax.pay` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | That year is paid.; Pay something.; … is owed; pay that or less.; … is more than the bank can cover. | — | Yes | — | 3 | journey-money.test.ts |
| `tax.pay_state` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/statetax.ts` | You owe … nothing on that year.; Pay something.; … is owed to …; pay that or less.; … is more than the bank can cover. | — | Yes | — | 1 | — |
| `tax.revise_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | Only a monthly plan in force is revised.; The least a month is ….; More than …)} is owed now: a revision needs a financial statement SLATE doesn't model.; The … fee is more than the bank can cover. | — | Yes | tax.plan_payment | 1 | — |
| `tutorial.read` | Implemented But Unverified | — | Guide.tsx | `world/tutorial.ts` | This life has no guide to read through; everything is open.; There’s no such chapter.; You’ve already read “…”.; Read “…” first; the chapters go in order. | read (added to) | — | — | 1 | — |
| `world.dismiss_decision` | Implemented But Unverified | What Needs You | Home.tsx | `world/world.ts` | No such decision.; It’s dismissed already. | — | — | — | 1 | — |
| `world.mark_read` | Verified (journey) | What Needs You | Home.tsx | `world/world.ts` | — | — | — | — | 2 | journey-life.test.ts |
| `world.set_preferences` | Implemented But Unverified | The Clock | TimeControls.tsx game-context.tsx | `world/world.ts` | … isn’t a preference.; The clock runs paused, live, fast or faster. | — | — | — | 2 | — |
| `world.take_decision_action` | Implemented But Unverified | What Needs You | Home.tsx | `world/world.ts` | No such decision.; That’s been done already.; It’s dismissed.; That action isn’t available on this item. | — | — | — | 3 | — |

## Scheduled kinds

What time sets off: each kind, the file that handles it, the files that schedule it, what it changes, whether it moves
money, what it sets going next, and how many test files name it or its constant.

| Kind | Handled In | Scheduled By | Changes | Money | Later | Tests |
|---|---|---|---|---|---|---|
| `bank.application` | `systems/bankmoves.ts` | systems/bankmoves.ts | status | — | — | 0 |
| `bank.current_closes` | `systems/bankmoves.ts` | systems/bankmoves.ts; systems/lending.ts | — | — | — | 0 |
| `bank.fraud_refund` | `systems/security.ts` | systems/security.ts | expiresAt | Yes | bank.fraud_refund | 1 |
| `bank.loan_due` | `systems/lending.ts` | systems/lending.ts | — | Yes | — | 2 |
| `bank.month_end` | `systems/banking.ts` | systems/banking.ts | — | Yes | bank.savings_notice | 0 |
| `bank.savings_notice` | `systems/banking.ts` | systems/banking.ts; systems/lending.ts | — | — | — | 0 |
| `bank.scheduled_payment` | `systems/payments.ts` | systems/payments.ts | standingOrders (added to) | Yes | bank.standing_order; bank.scheduled_payment | 2 |
| `bank.standing_order` | `systems/payments.ts` | systems/payments.ts | — | Yes | bank.standing_order | 2 |
| `bank.switch_complete` | `systems/lending.ts` | systems/lending.ts | — | — | — | 8 |
| `bank.switch_debt` | `systems/lending.ts` | systems/lending.ts | payload | Yes | bank.switch_debt; bank.current_closes; loan; and 3 more | 0 |
| `bank.switch_review` | `systems/lending.ts` | systems/lending.ts | — | — | — | 0 |
| `benefits.assistance_month` | `systems/assistance.ts` | systems/assistance.ts | — | Yes | escrow | 0 |
| `benefits.desempleo_month` | `systems/homebenefits.ts` | systems/homebenefits.ts | — | — | benefits.desempleo_month | 3 |
| `benefits.ja_week` | `systems/homebenefits.ts` | systems/homebenefits.ts | — | — | benefits.ja_week | 0 |
| `benefits.uc_period` | `systems/universalcredit.ts` | systems/universalcredit.ts | — | Yes | — | 0 |
| `benefits.week` | `systems/unemployment.ts` | systems/unemployment.ts | — | Yes | benefits.week | 0 |
| `card.arrives` | `systems/cardlife.ts` | systems/bankmoves.ts; systems/cardlife.ts | — | — | credit_card; card.arrives | 0 |
| `card.due` | `systems/credit.ts` | systems/credit.ts | — | Yes | — | 15 |
| `card.replaced` | `systems/security.ts` | systems/bankmoves.ts; systems/security.ts | last4; issued; expiresAt | — | — | 0 |
| `card.statement` | `systems/credit.ts` | systems/credit.ts | — | Yes | — | 16 |
| `citizenship.decided` | `systems/citizenship.ts` | systems/citizenship.ts | naturalized | — | — | 2 |
| `documents.decided` | `systems/documents.ts` | systems/documents.ts | documentsOf (added to) | Yes | passport; documents.decided | 2 |
| `documents.idcard_arrives` | `systems/identity.ts` | systems/identity.ts | documentsOf (added to) | Yes | idcard; documents.idcard_arrives | 0 |
| `documents.opt_week` | `systems/permission.ts` | systems/permission.ts | — | — | documents.opt_week | 0 |
| `documents.permission` | `systems/permission.ts` | systems/permission.ts | — | — | documents.opt_week | 0 |
| `documents.ssn_arrives` | `systems/taxid.ts` | systems/taxid.ts | ssn | — | — | 0 |
| `documents.us_status` | `systems/permission.ts` | systems/permission.ts | usOutOfStatus | — | — | 2 |
| `documents.visit` | `systems/papervisits.ts` | systems/papervisits.ts | keptAt; missed; at | — | — | 4 |
| `health.appointment` | `systems/appointments.ts` | systems/appointments.ts | status | — | — | 0 |
| `health.bill` | `systems/health.ts` | systems/health.ts | — | Yes | loan; school.leave_appeal | 1 |
| `health.month` | `systems/health.ts` | systems/health.ts | — | — | health.month | 0 |
| `health.therapy_session` | `systems/therapy.ts` | systems/therapy.ts | status | Yes | — | 0 |
| `health.week` | `systems/health.ts` | systems/health.ts | — | — | health.week | 3 |
| `injury.comp` | `systems/injury.ts` | systems/injury.ts | — | — | injury.comp | 2 |
| `life.birthday` | `systems/birthdays.ts` | systems/birthdays.ts | — | — | — | 2 |
| `life.commitment` | `world/plans.ts` | world/plans.ts | status; resolvedAt | — | life.commitment | 5 |
| `life.day_rollover` | `systems/life.ts` | index.ts; systems/life.ts | lastSleptAt; awakeSince; wokeWithDebt | Yes | life.day_rollover | 1 |
| `life.end` | `systems/mortality.ts` | systems/mortality.ts | — | — | — | 3 |
| `pension.bienestar_payment` | `systems/homepensions.ts` | systems/homepensions.ts | — | Yes | pension.bienestar_payment | 0 |
| `pension.ie_week` | `systems/homepensions.ts` | systems/homepensions.ts | bienestarFrom | Yes | pension.ie_week; pension.bienestar_payment | 0 |
| `pension.imss_month` | `systems/imss.ts` | systems/imss.ts | — | Yes | pension.imss_month | 0 |
| `pension.ss_month` | `systems/socialsecurity.ts` | systems/socialsecurity.ts | — | Yes | pension.ss_month | 2 |
| `pension.state_payment` | `systems/statepension.ts` | systems/statepension.ts | — | Yes | pension.state_payment | 0 |
| `school.account_due` | `systems/leave.ts` | systems/leave.ts | — | — | — | 0 |
| `school.aid_decide` | `systems/leave.ts` | systems/leave.ts | — | — | — | 0 |
| `school.cabaret` | `systems/school.ts` | systems/school.ts | status | — | cabaret; school.summer; school.stipend | 6 |
| `school.call` | `systems/school.ts` | systems/school.ts | status | — | school.call | 9 |
| `school.classes` | `systems/school.ts` | systems/school.ts | status | — | — | 6 |
| `school.commencement` | `systems/school.ts` | systems/school.ts | — | — | — | 7 |
| `school.company` | `systems/school.ts` | systems/school.ts | — | — | — | 2 |
| `school.conferral` | `systems/school.ts` | systems/school.ts | — | — | school.cabaret | 2 |
| `school.convert` | `systems/school.ts` | systems/school.ts | — | Yes | — | 2 |
| `school.evaluation` | `systems/school.ts` | systems/leave.ts; systems/school.ts | history (added to) | — | — | 2 |
| `school.extra_decide` | `systems/leave.ts` | systems/leave.ts | — | — | school.term; school.aid_decide | 0 |
| `school.former_class` | `systems/leave.ts` | systems/leave.ts | — | — | — | 0 |
| `school.incomplete_due` | `systems/courserecord.ts` | systems/courserecord.ts | — | — | — | 0 |
| `school.lab` | `systems/school.ts` | systems/school.ts | status | — | — | 4 |
| `school.leave_appeal` | `systems/leave.ts` | systems/health.ts; systems/leave.ts | — | — | school.extra_decide | 2 |
| `school.leave_decide` | `systems/leave.ts` | systems/leave.ts | — | — | — | 2 |
| `school.leave_notice` | `systems/leave.ts` | systems/leave.ts | — | Yes | — | 0 |
| `school.moment` | `systems/classmates.ts` | systems/classmates.ts | — | — | — | 4 |
| `school.orientation` | `systems/coursework.ts` | systems/coursework.ts | status | — | — | 3 |
| `school.partner_ask` | `systems/coursework.ts` | systems/coursework.ts | — | — | — | 2 |
| `school.partner_rehearsal` | `systems/coursework.ts` | systems/coursework.ts | — | — | — | 2 |
| `school.payday` | `systems/school.ts` | systems/leave.ts; systems/school.ts | — | Yes | run | 2 |
| `school.recess` | `systems/school.ts` | systems/school.ts | — | — | — | 2 |
| `school.repeat_decide` | `systems/leave.ts` | systems/leave.ts | — | — | school.term | 0 |
| `school.repeat_due` | `systems/leave.ts` | systems/leave.ts | — | — | — | 0 |
| `school.shift` | `systems/school.ts` | systems/school.ts | status | — | school.convert | 8 |
| `school.stipend` | `systems/school.ts` | systems/school.ts | — | Yes | school.shift | 3 |
| `school.study_session` | `systems/classmates.ts` | systems/classmates.ts | status | — | — | 4 |
| `school.summer` | `systems/school.ts` | systems/school.ts | status | — | summer | 3 |
| `school.term` | `systems/school.ts` | systems/leave.ts; systems/school.ts | — | Yes | school.evaluation; school.recess; school.term | 5 |
| `school.week` | `systems/school.ts` | systems/school.ts | — | — | — | 0 |
| `school.welfare` | `systems/leave.ts` | systems/leave.ts | — | — | school.welfare_decide | 2 |
| `school.welfare_decide` | `systems/leave.ts` | systems/leave.ts | — | — | medical; school.leave_appeal | 0 |
| `tax.amended` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | Yes | — | 0 |
| `tax.due` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.substitute | 0 |
| `tax.notice` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | Yes | — | 6 |
| `tax.plan_decide` | `systems/taxreturn.ts` | systems/taxreturn.ts | status; why | — | — | 0 |
| `tax.plan_default` | `systems/taxreturn.ts` | systems/taxreturn.ts | status; nextDue | Yes | tax.plan_payment; tax.refund; tax.amended | 0 |
| `tax.plan_payment` | `systems/taxreturn.ts` | systems/taxreturn.ts | nextDue; status; defaultBy | Yes | tax.plan_payment; tax.plan_default | 2 |
| `tax.refund` | `systems/taxreturn.ts` | systems/statetax.ts; systems/taxreturn.ts | taxPlan | Yes | short; tax.plan_decide | 3 |
| `tax.season` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.season; tax.due | 2 |
| `tax.state_notice` | `systems/statetax.ts` | systems/statetax.ts | — | Yes | tax.state_plan_payment | 4 |
| `tax.state_plan_end` | `systems/statetax.ts` | systems/statetax.ts | — | Yes | tax.state_plan_payment | 0 |
| `tax.state_plan_payment` | `systems/statetax.ts` | systems/statetax.ts | nextDue | Yes | tax.state_plan_payment | 0 |
| `tax.substitute` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.substitute | 2 |
| `world.tick` | `world/world.ts` | index.ts; world/world.ts | — | — | world.tick | 0 |
