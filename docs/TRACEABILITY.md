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

- Verified (journey): 61
- Implemented But Unverified: 125
- Partially Implemented: 0
- Commands in all: 186

## Commands

| Command | Status | Chapter | Screens | Handled In | Refuses | Changes | Money | Later | Tests | Journeys |
|---|---|---|---|---|---|---|---|---|---|---|
| `bank.add_standing_order` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | A standing order can only go into one of your savings accounts.; … is a term deposit, locked until its end. A standing order goes into easy-access savings.; Enter how much to pay each month.; Pick a day of the month, 1 to 31. | standingOrders (added to) | — | bank.standing_order | 17 | journey-money.test.ts |
| `bank.arrange_overdraft` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t one of your open checking accounts.; You don’t have a checking account to arrange an overdraft on.; No overdraft is arranged on it.; Pay the overdraft back before closing it.; and 2 more | — | — | — | 9 | journey-money.test.ts |
| `bank.borrow` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t a bank you keep an account at.; The loan has to be paid into, and repaid from, one of your open checking accounts. | — | — | loan | 16 | journey-money.test.ts |
| `bank.break_term` | Verified (journey) | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; It already closes on …, on the notice you gave. | — | — | bank.term_notice | 11 | journey-money.test.ts |
| `bank.cancel_new` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your accounts.; Its cooling-off period has passed, or there isn’t one here for it.; You don’t have a card.; You can’t cancel your primary account. Make another account primary first. (also cancelRefusal) | — | Yes | — | 7 | — |
| `bank.cancel_scheduled` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | That payment is no longer scheduled. | — | — | — | 6 | journey-money.test.ts |
| `bank.cancel_standing_order` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | That standing order no longer exists. | — | — | — | 4 | journey-money.test.ts |
| `bank.cancel_switch` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | No switch is under way.; This country’s switching service doesn’t let you call a switch off. It goes ahead on its d; You could call it off until …, seven working days before its date, and it’s under way now.; Calling it off leaves your accounts and payments where they are. Confirm to go ahead. | — | — | — | 4 | — |
| `bank.claim_unclaimed` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | No money of yours is held as unclaimed. | unclaimed | Yes | — | 4 | — |
| `bank.close_current` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | Only one of your own checking accounts can be closed here.; … is already closing on ….; Choose which of your accounts the … goes to. (also closeRefusal) | — | — | bank.current_closes | 21 | — |
| `bank.close_savings` | Implemented But Unverified | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | Only a savings account of yours can be closed here.; You don’t have a checking account to move the money into.; You’ve already given notice: … closes on …. | — | — | bank.savings_notice | 24 | — |
| `bank.debit_overdraft` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | Your bank doesn’t offer this choice.; … never pays a debit card purchase into an overdraft. (also abroadRefusal) | — | — | — | 6 | — |
| `bank.new_number` | Implemented But Unverified | Your Bank | BankSecurity.tsx | `systems/security.ts` | You don’t have a checking account.; … doesn’t offer to move an account to a new number. Closing it and opening another account | — | — | — | 4 | — |
| `bank.open_current` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | Pay the opening deposit from one of your own checking or savings accounts.; That account is already at …. Pay the deposit from an account at another bank.; … asks for an opening deposit of …)}, sent from another of your accounts.; Enter the amount of the opening deposit.; and 1 more (also openRefusal) | status | Yes | bank.application; card.arrives | 49 | — |
| `bank.open_savings` | Implemented But Unverified | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | You can only open savings at a bank where you have a checking account.; You already have a savings account at …. (also abroadRefusal) | — | — | — | 24 | — |
| `bank.open_term` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | No term deposit rate was found for ….; A term deposit at … is paid for from your checking account there. Open a checking account ; Enter how much to put away.; A term deposit there needs at least …)}.; and 1 more (also abroadRefusal) | — | — | savings | 23 | journey-money.test.ts |
| `bank.pay_collections` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | You don’t owe anything in collections.; You don’t have a checking account to pay it from.; … has nothing available to pay it with, so nothing was paid. | — | — | — | 4 | — |
| `bank.reactivate` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That account isn’t dormant. | — | — | — | 5 | — |
| `bank.redirect_deposits` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | Choose one of your open checking or savings accounts for your wages.; … is closing, so wages can’t be paid into it.; Yale only pays wages into an account in America. | — | — | — | 12 | — |
| `bank.repay_loan` | Verified (journey) | Your Bank | BankLending.tsx | `systems/lending.ts` | You don’t have a loan to pay off.; … can’t cover the … it takes to pay it off, so nothing was paid. | — | Yes | — | 5 | journey-money.test.ts |
| `bank.schedule_payment` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | A payment set for a date goes between two of your own accounts.; … is a term deposit, locked until its end. A payment set for a date goes between your chec; Enter an amount.; Choose a date in the future. | — | — | bank.scheduled_payment | 11 | journey-money.test.ts |
| `bank.set_alerts` | Verified (journey) | Your Bank | BankStatements.tsx | `systems/statements.ts` | Enter the … alert as an amount, or leave it blank to turn it off. | alerts | — | — | 11 | journey-money.test.ts |
| `bank.set_loan_repayment` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t an open loan of yours.; A loan has to be repaid from one of your open checking accounts.; … is closing, so the loan can’t be repaid from it. | — | — | — | 2 | — |
| `bank.set_order_source` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | That standing order no longer exists.; A standing order has to pay from one of your open checking accounts.; … is closing, so a standing order can’t pay from it. | fromId | — | — | 5 | — |
| `bank.set_payments` | Verified (journey) | Your Bank | BankPayments.tsx | `systems/payments.ts` | Everyday spending goes in cash, on the debit card or on the credit card.; There’s no savings account at … to cover …. | — | — | — | 39 | journey-money.test.ts |
| `bank.set_primary` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | Only one of your open checking accounts can be your primary account.; … is already your primary account.; … is closing, so it can’t be your primary account. (also cardAbroadRefusal) | primaryAccountId | — | — | 22 | — |
| `bank.set_round_ups` | Verified (journey) | Your Bank | RoundUps.tsx | `systems/accountlife.ts` | — | — | — | — | 9 | journey-money.test.ts |
| `bank.set_term_end` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; … doesn’t let a term deposit end that way.; … needs … days’ notice before the end to change it. | — | — | — | 3 | — |
| `bank.stop_balance_transfer` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | No switch is under way.; This country’s switching service has no such step.; Its balance transfer is already stopped.; The transfer could be stopped until close of business ….; and 1 more | payload | — | — | 4 | — |
| `bank.switch` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | You can only switch to a bank in the country you live in.; You already bank with ….; You already have an account at …. Make it your primary account, move the payments from the; … won’t open an account for you while you owe it a debt it has charged off.; and 8 more (also switchApplicationRefusal) | — | — | bank.switch_complete; bank.switch_review | 12 | — |
| `bank.take_overrun_loan` | Implemented But Unverified | Your Bank | BankLending.tsx | `systems/lending.ts` | That isn’t one of your open checking accounts.; Your bank has offered no loan for an overrun.; You already have a loan with the bank. (also abroadRefusal) | — | — | loan | 5 | — |
| `bank.take_term_interest` | Implemented But Unverified | Your Bank | BankAccountLife.tsx | `systems/accountlife.ts` | That isn’t one of your term deposits.; … pays a term deposit’s interest at its end.; It hasn’t earned anything to take yet. | — | Yes | — | 5 | — |
| `bank.transfer` | Verified (journey) | Your Bank | BankWorkspace.tsx | `systems/banking.ts` | Move Money only moves money between your own checking and savings accounts.; From and To are the same account. Choose another account to move it to.; Enter how much to move.; … holds …, so nothing was moved. Enter the amount in ….; and 7 more | — | Yes | — | 58 | journey-money.test.ts |
| `benefits.assistance` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/assistance.ts` | — (also assistanceRefusal, snapStudentRefusal) | assistance | Yes | escrow | 9 | — |
| `benefits.claim` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/unemployment.ts` | Unemployment is paid in the game only in New York, California and Connecticut, and you’d n; You already have a claim open.; Unemployment pays a noncitizen only with permission to work in the US, such as OPT (FUTA 3; … Your base period’s quarters paid …. | — | Yes | benefits.week | 15 | — |
| `benefits.ei_register` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/eiself.ts` | — (also eiRefusal) | ei | — | — | 2 | — |
| `brief.choose` | Verified (journey) | You As An Actor | BriefPane.tsx | `systems/briefs.ts` | — (also chooseRefusal) | — | — | — | 47 | journey-agent.test.ts |
| `brief.prepare` | Verified (journey) | You As An Actor | BriefPane.tsx | `systems/briefs.ts` | — (also prepareRefusal) | — | — | — | 34 | journey-agent.test.ts |
| `brief.reader` | Implemented But Unverified | You As An Actor | BriefPane.tsx | `systems/briefs.ts` | — (also readerRefusal) | — | — | — | 7 | — |
| `calendar.cancel` | Verified (journey) | Your Own Plans | CalendarWorkspace.tsx | `world/plans.ts` | — | — | — | — | 11 | journey-life.test.ts |
| `calendar.schedule` | Verified (journey) | Your Own Plans | CalendarWorkspace.tsx | `world/plans.ts` | — | — | — | life.commitment | 35 | journey-life.test.ts |
| `calendar.skip` | Implemented But Unverified | What’s Coming | TimeControls.tsx | `world/plans.ts` | — | status; resolvedAt | — | — | 5 | — |
| `card.apply` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You have no credit record to apply with.; A card is already on its way.; You need a bank to apply to.; That bank isn’t in the game.; and 3 more (also abroadRefusal, transferRefusal) | — | — | card.arrives | 19 | — |
| `card.close` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; It’s already being closed. | — | — | — | 9 | — |
| `card.dispute` | Implemented But Unverified | Your Bank | BankSecurity.tsx | `systems/security.ts` | — (also disputeRefusal) | — | — | bank.fraud_refund | 6 | — |
| `card.lock` | Verified (journey) | Your Bank | BankSecurity.tsx | `systems/security.ts` | That card is stopped, and a new one is on its way. | — | — | — | 19 | journey-money.test.ts |
| `card.money_transfer` | Implemented But Unverified | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | You don’t have a card.; The … doesn’t offer money transfers.; You need a checking account for the money to go into.; Enter an amount.; and 1 more | — | Yes | money | 4 | — |
| `card.plan` | Implemented But Unverified | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | You don’t have a card.; No payment plan terms were found for the ….; A plan runs for ${lengths.length < 2 ? lengths.join('') : ; Only … of purchases can go into a plan.; and 1 more | — | — | — | 4 | — |
| `card.redeem_rewards` | Verified (journey) | Your Bank | BankCardOffers.tsx | `systems/cardoffers.ts` | The card has no rewards to redeem. | — | Yes | — | 2 | journey-money.test.ts |
| `card.refund_credit` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/credit.ts` | The card holds no credit to send back. | — | — | — | 3 | — |
| `card.report` | Implemented But Unverified | Your Bank | BankSecurity.tsx | `systems/security.ts` | Choose why: lost, stolen or damaged.; That card is already stopped, and a new one is on its way.; … doesn’t publish what it charges to rush a card, so the game can’t send a rushed one.; No rushed replacement was found for …. | — | Yes | — | 8 | — |
| `card.request_hardship` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; You’re already on a payment plan.; You don’t owe anything on the card.; You could pay it off today. A hardship plan is for when you can’t. | — | — | — | 8 | — |
| `card.request_limit` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Enter the limit you want. (also askRefusal) | — | — | — | 4 | — |
| `card.set_auto_raise` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card. | — | — | — | 3 | — |
| `card.set_autopay_from` | Implemented But Unverified | Your Bank | BankMoves.tsx | `systems/bankmoves.ts` | That isn’t one of your cards.; Autopay has to pay from one of your open checking accounts.; … is closing, so autopay can’t pay from it. | — | — | — | 15 | — |
| `card.set_everyday` | Verified (journey) | Your Bank | BankCard.tsx | `systems/credit.ts` | You don’t hold that card.; That card is being closed, so nothing new can go on it. | — | — | — | 4 | journey-money.test.ts |
| `card.set_over_limit` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Only a US card lets you opt in to going over the limit. | — | — | — | 2 | — |
| `card.set_statement_day` | Verified (journey) | Your Bank | BankCard.tsx | `systems/cardlife.ts` | You don’t have a card.; Pick a day from the 1st to the 28th. (also statementDayRefusal) | — | — | — | 8 | journey-money.test.ts |
| `cash.deposit` | Verified (journey) | Your Bank | BankCash.tsx | `systems/cash.ts` | Enter how much cash to pay in.; You have only … in cash, so nothing was paid in.; Cash goes into your checking account or savings.; …’s customers can’t pay cash in at the Post Office.; and 2 more | — | Yes | — | 7 | journey-money.test.ts |
| `cash.withdraw` | Verified (journey) | Your Bank | BankCash.tsx | `systems/cash.ts` | Enter an amount.; Choose where to take it from: your bank’s ATM, another bank’s, the counter, the Post Offic | — | Yes | — | 19 | journey-money.test.ts |
| `documents.apply_idcard` | Implemented But Unverified | Passports And ID | Documents.tsx papers.tsx | `systems/identity.ts` | Your bank can’t cover …, so nothing was charged. (also idCardRefusal) | documentsOf (added to) | Yes | idcard; documents.idcard_arrives | 16 | — |
| `documents.apply_opt` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/permission.ts` | — (also optRefusal) | usOutOfStatus; documentsOf (added to) | — | permit; documents.permission | 14 | — |
| `documents.apply_passport` | Verified (journey) | Passports And ID | Documents.tsx | `systems/documents.ts` | Your bank can’t cover …, so nothing was charged. (also passportRefusal) | documentsOf (added to) | Yes | passport; documents.decided | 14 | journey-life.test.ts |
| `documents.apply_ssn` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/taxid.ts` | — (also ssnRefusal) | ssn | — | documents.ssn_arrives | 16 | — |
| `documents.naturalize` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/citizenship.ts` | Your bank can’t cover …, so nothing was charged. (also naturalizeRefusal) | naturalizing; naturalized | Yes | citizenship.decided | 3 | — |
| `documents.police_report` | Verified (journey) | Cover, Benefits And Returns | Documents.tsx | `systems/documents.ts` | — (also policeReportRefusal) | — | — | — | 6 | journey-life.test.ts |
| `documents.renew_residence` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/residence.ts` | — | — | — | — | 2 | — |
| `documents.replace_idcard` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/identity.ts` | Your bank can’t cover …, so nothing was charged. (also idReplaceRefusal) | documentsOf (added to) | Yes | documents.idcard_arrives | 5 | — |
| `documents.replace_license` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/identity.ts` | Your bank can’t cover …, so nothing was charged. (also licenseReplaceRefusal) | documentsOf (added to) | Yes | documents.idcard_arrives | 6 | — |
| `documents.report_lost` | Verified (journey) | Passports And ID | Documents.tsx | `systems/documents.ts` | That isn’t a document you hold in force.; You can’t report a status lost. It stays in force whatever happens to the paper. | — | — | — | 18 | journey-life.test.ts |
| `documents.residence` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/residence.ts` | — (also routeRefusal) | — | — | — | 5 | — |
| `documents.settle` | Implemented But Unverified | Passports And ID | Documents.tsx | `systems/residence.ts` | Your bank can’t cover …, so nothing was charged. (also settleRefusal) | — | Yes | — | 3 | — |
| `finance.pay_card` | Implemented But Unverified | Your Bank | BankCard.tsx | `systems/credit.ts` | You don’t have a card.; You don’t owe anything on it.; Enter an amount to pay.; Your bank accounts have nothing available to pay it with, so nothing was paid. | — | — | — | 20 | — |
| `finance.set_autopay` | Verified (journey) | Your Bank | BankCard.tsx | `systems/credit.ts` | Autopay pays the minimum or the whole statement.; You don’t have a card.; … takes the whole statement from your account each month. The … can’t carry a balance. | — | — | — | 15 | journey-money.test.ts |
| `genre.study` | Implemented But Unverified | You As An Actor | BriefPane.tsx ProfileWorkspace.tsx | `systems/engagement.ts` | — (also studyRefusal) | — | — | — | 17 | — |
| `health.appeal` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — (also appealRefusal) | — | Yes | school.leave_appeal | 9 | — |
| `health.apply` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — (also applyRefusal) | — | — | application | 2 | — |
| `health.apply_aid` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | There’s no such bill. (also aidRefusal) | — | — | — | 3 | — |
| `health.book` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/appointments.ts` | There’s nothing to see a doctor about.; You have an appointment already.; No waiting time is published where you live, so there’s nothing to book: you’re seen when  | — | — | — | 14 | journey-life.test.ts |
| `health.cancel_appointment` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/appointments.ts` | That appointment isn’t booked any more. | — | — | — | 15 | journey-life.test.ts |
| `health.choose_clinic` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — (also clinicRefusal) | — | — | — | 12 | — |
| `health.choose_pharmacy` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | There’s no such pharmacy.; You can choose a pharmacy only in the United States. | — | — | — | 7 | journey-life.test.ts |
| `health.dental` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | You have no dental plan.; Yale’s dental plan can’t be canceled once paid.; You already have a dental plan.; Your bank can’t cover … for the year, so nothing was charged.; and 1 more | — | — | — | 6 | journey-life.test.ts |
| `health.drop` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | You have no plan of your own to drop.; It’s already dropped, and it ends on …. | — | — | — | 3 | — |
| `health.enroll` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — | — | — | marketplace | 20 | — |
| `health.extra_supply` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | Your bank can’t cover … for every condition’s fill, so nothing was filled or charged. (also extraSupplyRefusal) | — | — | — | 3 | — |
| `health.pay_bill` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | You owe nothing for care.; Enter an amount to pay.; … can’t pay a medical debt.; You have no checking account to pay it from. | — | Yes | — | 9 | — |
| `health.prepay` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | Your bank can’t cover …, so nothing was charged. (also prepayRefusal) | — | — | — | 4 | — |
| `health.request_hardship` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | — (also hardshipRefusal) | — | — | — | 3 | — |
| `health.therapy` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/therapy.ts` | — (also therapyRefusal) | therapy; status | Yes | — | 8 | — |
| `health.treat` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/health.ts` | You don’t have that condition. | — | — | — | 6 | — |
| `life.look_after` | Verified (journey) | Looking After Yourself | Home.tsx TimeControls.tsx | `systems/life.ts` | That isn’t something you can do for yourself here.; The payment didn’t go through. (also lookAfterRefusal) | — | Yes | — | 49 | journey-life.test.ts |
| `life.sleep` | Verified (journey) | Sleep | TimeControls.tsx | `systems/life.ts` | Say how long to sleep.; Say when to sleep.; You can’t go to sleep in the past.; A night can be planned a day ahead at most.; and 1 more | lastSleptAt; awakeSince; wokeWithDebt | — | — | 62 | journey-agent.test.ts; journey-life.test.ts; journey-school-year.test.ts |
| `pension.bienestar` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/homepensions.ts` | — (also bienestarRefusal) | bienestarFrom | Yes | pension.bienestar_payment | 1 | — |
| `pension.ie_state` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/homepensions.ts` | — (also irishPensionRefusal) | irishPension | Yes | pension.ie_week | 1 | — |
| `pension.imss` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/imss.ts` | — (also imssRefusal) | — | Yes | pension.imss_month | 1 | — |
| `pension.social_security` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/socialsecurity.ts` | — (also socialSecurityRefusal) | socialSecurity | Yes | pension.ss_month | 3 | — |
| `pension.state` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/statepension.ts` | — (also statePensionRefusal) | statePensionFrom | Yes | pension.state_payment | 1 | — |
| `plays.read` | Verified (journey) | Drama School | SchoolWorkspace.tsx | `systems/playreading.ts` | — (also readRefusal) | — | — | — | 14 | journey-life.test.ts |
| `plays.research` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/playreading.ts` | — (also researchRefusal) | — | — | — | 4 | — |
| `practice.exercise` | Implemented But Unverified | You As An Actor | ProfileWorkspace.tsx | `systems/practice.ts` | There’s no such tier. (also practiceRefusal, focusRefusal) | — | — | — | 32 | — |
| `practice.self_tape` | Verified (journey) | You As An Actor | BriefPane.tsx | `systems/briefs.ts` | — (also tapeRefusal) | — | — | — | 46 | journey-agent.test.ts |
| `pro.accept_agreement` | Verified (journey) | Representation | RepresentationPane.tsx | `systems/proagent.ts` | — (also signRefusal) | — | — | pro.agent_term_end | 6 | journey-agent.test.ts |
| `pro.accept_offer` | Implemented But Unverified | Finding Work | OpportunitiesPane.tsx | `systems/projobs.ts` | — (also acceptRefusal) | engagements (added to) | — | booked | 21 | — |
| `pro.agent_check` | Verified (journey) | Representation | RepresentationPane.tsx | `systems/proagent.ts` | — (also checkRefusal) | — | — | — | 10 | journey-agent.test.ts |
| `pro.agent_notice` | Verified (journey) | Representation | RepresentationPane.tsx | `systems/proagent.ts` | — (also noticeRefusal) | — | — | — | 8 | journey-agent.test.ts |
| `pro.apply_work_visa` | Implemented But Unverified | Finding Work | WorkPane.tsx | `systems/worktrip.ts` | — (also visaRefusal) | — | — | — | 2 | — |
| `pro.ask_pay` | Implemented But Unverified | Finding Work | WorkPane.tsx | `systems/contracts.ts` | — (also askRefusal) | — | — | pro.pay.payday; problem | 1 | — |
| `pro.ask_referral` | Verified (journey) | Representation | RepresentationPane.tsx | `systems/proagent.ts` | — (also referralRefusal) | — | — | — | 7 | journey-agent.test.ts |
| `pro.ask_to_move` | Verified (journey) | Representation | RepresentationPane.tsx TimeControls.tsx | `systems/proagent.ts` | — (also moveRefusal) | — | — | — | 3 | journey-agent.test.ts |
| `pro.award_enter` | Implemented But Unverified | Finding Work | IndustryPane.tsx | `systems/awards.ts` | — | — | — | — | 2 | — |
| `pro.cut_reel` | Verified (journey) | Your Career | CareerWorkspace.tsx | `systems/pro.ts` | Your bank can’t cover …, so nothing was charged. (also reelRefusal) | — | Yes | reel | 5 | journey-agent.test.ts |
| `pro.decline_agreement` | Verified (journey) | Representation | RepresentationPane.tsx | `systems/proagent.ts` | — (also answerRefusal) | — | — | — | 4 | journey-agent.test.ts |
| `pro.decline_offer` | Implemented But Unverified | Finding Work | OpportunitiesPane.tsx | `systems/projobs.ts` | There’s no offer to decline. | — | — | declined | 4 | — |
| `pro.end_agreement` | Verified (journey) | Representation | RepresentationPane.tsx | `systems/proagent.ts` | — (also endRefusal) | — | — | pro.agent_decision | 3 | journey-agent.test.ts |
| `pro.headshots` | Verified (journey) | Your Career | CareerWorkspace.tsx | `systems/pro.ts` | Your bank can’t cover …, so nothing was charged. (also headshotRefusal) | — | Yes | headshot | 13 | journey-agent.test.ts |
| `pro.join_sag` | Implemented But Unverified | Your Career | WorkPane.tsx | `systems/propay.ts` | Your bank can’t cover …, so nothing was charged. (also joinSagRefusal) | — | Yes | — | 4 | — |
| `pro.mix_demo` | Implemented But Unverified | Your Career | CareerWorkspace.tsx | `systems/pro.ts` | Your bank can’t cover …, so nothing was charged. (also demoRefusal) | — | Yes | demo | 1 | — |
| `pro.move_audition` | Implemented But Unverified | Finding Work | OpportunitiesPane.tsx | `systems/projobs.ts` | — (also moveRefusal) | — | — | — | 1 | — |
| `pro.prepare` | Implemented But Unverified | Finding Work | OpportunitiesPane.tsx | `systems/projobs.ts` | — (also prepareRefusal) | — | — | — | 6 | — |
| `pro.request_outside_work` | Implemented But Unverified | Finding Work | OpportunitiesPane.tsx | `systems/projobs.ts` | — (also requestRefusal) | — | — | pro.school_answer; requested | 1 | — |
| `pro.send_materials` | Verified (journey) | Representation | RepresentationPane.tsx | `systems/proagent.ts` | — (also sendRefusal) | — | — | pro.reply | 12 | journey-agent.test.ts |
| `pro.set_name` | Implemented But Unverified | Your Career | CareerWorkspace.tsx | `systems/pro.ts` | — (also nameRefusal) | — | — | — | 2 | — |
| `pro.submit` | Implemented But Unverified | Finding Work | OpportunitiesPane.tsx | `systems/projobs.ts` | — (also submitRefusal) | — | — | — | 6 | — |
| `pro.supply_material` | Verified (journey) | Representation | RepresentationPane.tsx | `systems/proagent.ts` | — (also supplyRefusal) | — | — | pro.reply | 2 | journey-agent.test.ts |
| `pro.tape_audition` | Implemented But Unverified | Finding Work | OpportunitiesPane.tsx | `systems/projobs.ts` | — (also tapeRefusal) | — | — | — | 2 | — |
| `pro.update_resume` | Verified (journey) | Your Career | CareerWorkspace.tsx | `systems/pro.ts` | — (also resumeRefusal) | — | — | resume | 16 | journey-agent.test.ts |
| `pro.watch_ceremony` | Implemented But Unverified | Finding Work | IndustryPane.tsx | `systems/awards.ts` | — (also watchRefusal) | — | — | — | 2 | — |
| `pro.work_choice` | Implemented But Unverified | Finding Work | WorkPane.tsx | `systems/workflow.ts` | — (also choiceRefusal) | — | — | — | 2 | — |
| `school.answer_partner` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also answerRefusal) | — | — | — | 8 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.appeal_leave` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | Only a leave the dean imposed can be appealed.; You appealed on ….; The appeal had to be in by …. | — | — | school.leave_appeal | 4 | — |
| `school.approach` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | That isn’t a way to work on it. (also approachRefusal) | — | — | — | 8 | journey-three-students.test.ts |
| `school.ask_partner` | Implemented But Unverified | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also askRefusal) | — | — | — | 18 | — |
| `school.buy_affiliate` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | Affiliate cover is for a student on leave.; It could only be bought until ….; Affiliate cover for the leave’s … is …${credit ?  | — | Yes | — | 8 | — |
| `school.buy_ppe` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | Your bank can’t cover …, so nothing was charged. (also ppeRefusal) | status | — | — | 2 | — |
| `school.cabaret` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx day.tsx | `systems/school.ts` | — (also cabaretRefusal) | status | — | school.cabaret; cabaret | 17 | — |
| `school.call_in_sick` | Verified (journey) | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | — (also sickRefusal) | — | — | — | 24 | journey-life.test.ts |
| `school.cancel_leave` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | The dean imposed this leave, so it isn’t yours to call off${!l.mandatory.appeal && s.now <; Calling it off keeps you at the School as you are. Confirm to go ahead. | — | — | — | 3 | — |
| `school.cancel_rehearsal` | Implemented But Unverified | Drama School | CourseworkPane.tsx TimeControls.tsx | `systems/coursework.ts` | There’s no such rehearsal booked. | — | — | — | 5 | — |
| `school.cancel_repeat` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | You haven’t asked to repeat the year.; … Confirm to go ahead. | — | — | school.term | 2 | — |
| `school.choose` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | That isn’t a question this piece asks.; That isn’t one of the answers.; That’s your answer already. (also tableWorkRefusal, startRefusal) | — | — | — | 12 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.choose_part_playing` | Implemented But Unverified | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also partPlayingRefusal) | — | — | — | 7 | — |
| `school.choose_playing` | Implemented But Unverified | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also playingRefusal) | — | — | — | 8 | — |
| `school.choose_showcase` | Implemented But Unverified | Drama School | SchoolShowcase.tsx | `systems/proshowcase.ts` | — (also choiceRefusal) | — | — | — | 3 | — |
| `school.extend_incomplete` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/courserecord.ts` | — (also extendRefusal) | — | — | — | 5 | — |
| `school.learn_part` | Verified (journey) | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also ownWorkRefusal) | — | — | — | 13 | journey-school-production.test.ts |
| `school.make_amends` | Implemented But Unverified | Drama School | CourseworkPane.tsx | `systems/classmates.ts` | — (also amendsRefusal) | status | — | — | 7 | — |
| `school.make_up` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/courserecord.ts` | — (also makeUpRefusal) | — | — | — | 10 | — |
| `school.orientation` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also orientationRefusal) | — | — | — | 11 | journey-life.test.ts |
| `school.pay_balance` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | — | — | — | — | 15 | — |
| `school.prepare` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | — (also prepareRefusal) | — | — | — | 35 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.read_feedback` | Verified (journey) | Drama School | CourseworkPane.tsx | `systems/coursework.ts` | There’s no feedback on that.; You’ve already read it. | — | — | — | 8 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.request_aid_review` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | — (also aidReviewRefusal) | — | — | school.aid_decide | 3 | — |
| `school.request_conversion` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/school.ts` | — (also conversionRefusal) | status; history (added to) | Yes | school.convert; run; school.call | 10 | — |
| `school.request_extra_term` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | — (also extraRefusal) | — | — | school.extra_decide; school.term | 8 | — |
| `school.request_leave` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | Choose a reason for the leave. | — | — | school.welfare_decide; medical | 31 | — |
| `school.request_repeat` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | — | — | — | — | 10 | — |
| `school.reregister` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | You’re not at school.; You’re on leave: you register for the term you come back to, when it begins.; You’re already registered.; A financial hold stops registration: … is owed on your Yale account. Pay it on the Terms A | — | — | — | 14 | — |
| `school.respond` | Verified (journey) | Drama School | ClassMoments.tsx | `systems/classmates.ts` | That isn’t a scene you share with …. (also respondRefusal) | — | — | school.study_session | 20 | journey-school-year.test.ts; journey-three-students.test.ts |
| `school.return_notice` | Implemented But Unverified | Drama School | StudyPlanPanels.tsx | `systems/leave.ts` | You’re not on leave.; You already gave notice on ….; Its deadline has passed. | — | — | — | 18 | — |
| `school.review_blocking` | Verified (journey) | Drama School | RehearsalProcess.tsx | `systems/production.ts` | — (also ownWorkRefusal) | — | — | — | 10 | journey-school-production.test.ts |
| `school.summer_cabaret` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | — (also summerRefusal) | status | Yes | school.summer; school.stipend; summer | 22 | — |
| `school.take_shift` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | — (also shiftRefusal) | — | — | school.shift | 17 | — |
| `school.withdraw` | Implemented But Unverified | Drama School | SchoolWorkspace.tsx | `systems/school.ts` | You’re not at school.; Withdrawing gives up your place at the School. Confirm to go ahead. | — | Yes | — | 47 | — |
| `school.work_note` | Verified (journey) | Drama School | RehearsalProcess.tsx | `systems/production.ts` | Keep or put back the change you tried first. (also ownWorkRefusal, wayRefusal) | — | — | — | 12 | journey-school-production.test.ts |
| `tax.amend` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | Your return as filed matches what’s on record, so there’s nothing to amend. (also amendRefusal) | — | Yes | tax.amended | 8 | — |
| `tax.apply_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | The lowest monthly payment is …: what you owe, spread over … months.; Your bank can’t cover the … setup fee, so you haven’t applied and nothing was charged. (also planRefusal) | taxPlan; nextDue; status; defaultBy | Yes | short; tax.plan_decide; tax.plan_payment; tax.plan_default | 11 | — |
| `tax.apply_state_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/statetax.ts` | Your bank can’t cover the … down payment, so nothing was paid. (also statePlanRefusal) | — | Yes | tax.state_plan_payment | 7 | — |
| `tax.catch_up_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | Your plan isn’t behind, so there’s nothing to catch up.; Your bank can’t cover …, so nothing was paid. | status; nextDue | Yes | tax.plan_payment | 2 | — |
| `tax.catch_up_state_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/statetax.ts` | That plan isn’t behind, so there’s nothing to catch up.; Your bank can’t cover …, so nothing was paid. | — | Yes | tax.state_plan_payment | 4 | — |
| `tax.federal_lien_withdraw` | Implemented But Unverified | Cover, Benefits And Returns | LienPanels.tsx | `systems/taxreturn.ts` | — (also federalLienWithdrawRefusal, planRefusal) | status; startedAt; nextDue; payBy; why; and 3 more | Yes | tax.federal_lien; tax.notice; short; tax.plan_payment; and 5 more | 4 | — |
| `tax.file` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | There’s no return for that year.; You’ve already filed it. To change it, file an amended return. | — | Yes | tax.refund | 36 | journey-money.test.ts |
| `tax.lien_dispute` | Implemented But Unverified | Cover, Benefits And Returns | LienPanels.tsx | `systems/statetax.ts` | — (also lienDisputeRefusal) | status; why; nextDue | Yes | tax.state_lien; tax.state_plan_payment | 4 | — |
| `tax.lien_release` | Implemented But Unverified | Cover, Benefits And Returns | LienPanels.tsx | `systems/statetax.ts` | Your bank can’t cover its … release fee, so nothing was paid. (also lienReleaseRefusal) | — | Yes | — | 4 | — |
| `tax.pay` | Verified (journey) | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | That year is already paid.; Enter an amount above zero.; You owe …. Pay that amount or less.; Your bank can’t cover …, so nothing was paid. | — | Yes | — | 10 | journey-money.test.ts |
| `tax.pay_state` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/statetax.ts` | You owe … nothing on that year.; Enter an amount above zero.; You owe … …. Pay that amount or less.; Your bank can’t cover …, so nothing was paid. | — | Yes | — | 8 | — |
| `tax.request_waiver` | Implemented But Unverified | Cover, Benefits And Returns | LienPanels.tsx | `systems/statetax.ts` | — (also waiverRefusal) | — | Yes | — | 3 | — |
| `tax.revise_plan` | Implemented But Unverified | Cover, Benefits And Returns | PapersWorkspace.tsx | `systems/taxreturn.ts` | You can revise only a monthly plan that’s in force.; The lowest monthly payment is ….; You owe more than …)} now. A revision would need a financial statement, which the game doe; Your bank can’t cover the … revision fee, so nothing was changed. | — | Yes | tax.plan_payment | 5 | — |
| `tutorial.read` | Implemented But Unverified | — | Guide.tsx | `world/tutorial.ts` | You started without the guide, so everything is already open.; There’s no such chapter.; You’ve already read “…”.; Read “…” first. The chapters open in order. | read (added to) | — | — | 25 | — |
| `work.identify` | Implemented But Unverified | Drama School | WorkThrough.tsx | `systems/workbook.ts` | — (also identifyRefusal) | — | — | — | 9 | — |
| `work.settle` | Implemented But Unverified | Drama School | WorkThrough.tsx | `systems/workbook.ts` | — (also settleRefusal) | — | — | — | 11 | — |
| `work.try` | Implemented But Unverified | Drama School | WorkThrough.tsx | `systems/workbook.ts` | — (also tryRefusal) | — | — | — | 8 | — |
| `world.dismiss_decision` | Implemented But Unverified | What Needs You | Home.tsx | `world/world.ts` | You’ve already dismissed that question. | — | — | — | 9 | — |
| `world.mark_read` | Verified (journey) | What Needs You | Home.tsx Updates.tsx attention.tsx | `world/world.ts` | — | — | — | — | 13 | journey-life.test.ts |
| `world.set_preferences` | Implemented But Unverified | The Clock | TimeControls.tsx game-context.tsx | `world/world.ts` | That isn’t a setting the game has.; The clock can only be set to Play or Pause. | — | — | — | 14 | — |
| `world.take_decision_action` | Implemented But Unverified | What Needs You | Home.tsx | `world/world.ts` | That question is already settled: it was answered, or its date passed.; You dismissed that question, so it can’t be answered from What Needs You.; That isn’t one of this question’s answers. | — | — | — | 17 | — |

## Scheduled kinds

What time sets off: each kind, the file that handles it, the files that schedule it, what it changes, whether it moves
money, what it sets going next, and how many test files name it or its constant.

| Kind | Handled In | Scheduled By | Changes | Money | Later | Tests |
|---|---|---|---|---|---|---|
| `bank.application` | `systems/bankmoves.ts` | systems/bankmoves.ts | status | — | — | 0 |
| `bank.current_closes` | `systems/bankmoves.ts` | systems/bankmoves.ts; systems/lending.ts | — | — | — | 2 |
| `bank.fraud_refund` | `systems/security.ts` | systems/security.ts | expiresAt | Yes | bank.fraud_refund | 3 |
| `bank.home_closes` | `systems/abroad.ts` | systems/abroad.ts | — | — | — | 4 |
| `bank.loan_due` | `systems/lending.ts` | systems/lending.ts | — | Yes | — | 13 |
| `bank.month_end` | `systems/banking.ts` | systems/banking.ts | — | Yes | bank.savings_notice | 0 |
| `bank.savings_notice` | `systems/banking.ts` | systems/banking.ts; systems/lending.ts | — | — | — | 3 |
| `bank.scheduled_payment` | `systems/payments.ts` | systems/payments.ts | standingOrders (added to) | Yes | bank.standing_order; bank.scheduled_payment | 5 |
| `bank.standing_order` | `systems/payments.ts` | systems/payments.ts | — | Yes | bank.standing_order | 8 |
| `bank.switch_complete` | `systems/lending.ts` | systems/lending.ts | — | — | — | 11 |
| `bank.switch_debt` | `systems/lending.ts` | systems/lending.ts | payload | Yes | bank.switch_debt; bank.current_closes; loan; and 3 more | 0 |
| `bank.switch_review` | `systems/lending.ts` | systems/lending.ts | — | — | — | 2 |
| `bank.term_notice` | `systems/accountlife.ts` | index.ts; systems/accountlife.ts | unclaimed | Yes | — | 2 |
| `benefits.assistance_month` | `systems/assistance.ts` | systems/assistance.ts | — | Yes | escrow | 2 |
| `benefits.desempleo_month` | `systems/homebenefits.ts` | systems/homebenefits.ts | — | — | benefits.desempleo_month | 3 |
| `benefits.ja_week` | `systems/homebenefits.ts` | systems/homebenefits.ts | — | — | benefits.ja_week | 0 |
| `benefits.uc_period` | `systems/universalcredit.ts` | systems/universalcredit.ts | — | Yes | — | 0 |
| `benefits.week` | `systems/unemployment.ts` | systems/unemployment.ts | — | Yes | benefits.week | 4 |
| `card.arrives` | `systems/cardlife.ts` | systems/abroad.ts; systems/bankmoves.ts; systems/cardlife.ts | — | — | credit_card; card.arrives | 1 |
| `card.due` | `systems/credit.ts` | systems/credit.ts | — | Yes | — | 46 |
| `card.replaced` | `systems/security.ts` | systems/bankmoves.ts; systems/security.ts | last4; issued; expiresAt | — | — | 8 |
| `card.statement` | `systems/credit.ts` | systems/credit.ts | — | Yes | — | 31 |
| `citizenship.decided` | `systems/citizenship.ts` | systems/citizenship.ts | naturalized | — | — | 4 |
| `documents.decided` | `systems/documents.ts` | systems/documents.ts | documentsOf (added to) | Yes | passport; documents.decided | 5 |
| `documents.idcard_arrives` | `systems/identity.ts` | systems/identity.ts | documentsOf (added to) | Yes | idcard; documents.idcard_arrives | 3 |
| `documents.opt_week` | `systems/permission.ts` | — | — | — | — | 2 |
| `documents.permission` | `systems/permission.ts` | systems/permission.ts | — | — | — | 4 |
| `documents.ssn_arrives` | `systems/taxid.ts` | systems/taxid.ts | ssn | — | — | 2 |
| `documents.us_status` | `systems/permission.ts` | systems/permission.ts | usOutOfStatus | — | — | 13 |
| `documents.visit` | `systems/papervisits.ts` | systems/papervisits.ts | keptAt; missed; at | — | — | 8 |
| `health.appointment` | `systems/appointments.ts` | systems/appointments.ts | status | — | — | 17 |
| `health.bill` | `systems/health.ts` | systems/health.ts | — | Yes | loan; school.leave_appeal | 3 |
| `health.month` | `systems/health.ts` | systems/health.ts | — | — | health.month | 6 |
| `health.therapy_session` | `systems/therapy.ts` | systems/therapy.ts | status | Yes | — | 7 |
| `health.week` | `systems/health.ts` | systems/health.ts | — | — | health.week | 29 |
| `health.work_decided` | `systems/health.ts` | systems/health.ts | — | Yes | — | 6 |
| `injury.comp` | `systems/injury.ts` | systems/injury.ts | — | — | injury.comp | 7 |
| `life.birthday` | `systems/birthdays.ts` | systems/birthdays.ts | — | — | — | 12 |
| `life.commitment` | `world/plans.ts` | world/plans.ts | status; resolvedAt | — | life.commitment | 26 |
| `life.day_rollover` | `systems/life.ts` | index.ts; systems/life.ts | lastSleptAt; awakeSince; wokeWithDebt | Yes | life.day_rollover | 2 |
| `life.end` | `systems/mortality.ts` | systems/mortality.ts | — | — | — | 20 |
| `pension.bienestar_payment` | `systems/homepensions.ts` | systems/homepensions.ts | — | Yes | pension.bienestar_payment | 0 |
| `pension.ie_week` | `systems/homepensions.ts` | systems/homepensions.ts | bienestarFrom | Yes | pension.ie_week; pension.bienestar_payment | 0 |
| `pension.imss_month` | `systems/imss.ts` | systems/imss.ts | — | Yes | pension.imss_month | 0 |
| `pension.ss_month` | `systems/socialsecurity.ts` | systems/socialsecurity.ts | — | Yes | pension.ss_month | 2 |
| `pension.state_payment` | `systems/statepension.ts` | systems/statepension.ts | — | Yes | pension.state_payment | 0 |
| `pro.agent_ask_lapse` | `systems/proagent.ts` | systems/proagent.ts | — | — | — | 2 |
| `pro.agent_decision` | `systems/proagent.ts` | systems/proagent.ts | — | — | — | 2 |
| `pro.agent_follow_up` | `systems/proagent.ts` | systems/proagent.ts | — | — | — | 8 |
| `pro.agent_meeting` | `systems/proagent.ts` | systems/proagent.ts | — | — | pro.agent_decision | 16 |
| `pro.agent_offer_lapse` | `systems/proagent.ts` | systems/proagent.ts | — | — | — | 0 |
| `pro.agent_request_due` | `systems/proagent.ts` | systems/proagent.ts | — | — | — | 0 |
| `pro.agent_silence` | `systems/proagent.ts` | systems/proagent.ts | — | — | — | 0 |
| `pro.agent_term_end` | `systems/proagent.ts` | systems/proagent.ts | — | — | — | 0 |
| `pro.audition` | `systems/projobs.ts` | systems/projobs.ts | — | — | — | 10 |
| `pro.casting_decision` | `systems/projobs.ts` | systems/projobs.ts | — | — | — | 5 |
| `pro.invite` | `systems/workflow.ts` | systems/workflow.ts | — | — | — | 2 |
| `pro.loop` | `systems/workflow.ts` | systems/workflow.ts | — | — | — | 2 |
| `pro.offer_lapse` | `systems/projobs.ts` | systems/projobs.ts | — | — | lapsed | 0 |
| `pro.pay.dues` | `systems/propay.ts` | systems/propay.ts | — | — | — | 4 |
| `pro.pay.payday` | `systems/propay.ts` | systems/contracts.ts; systems/propay.ts | — | — | — | 8 |
| `pro.pay.release` | `systems/propay.ts` | systems/projobs.ts; systems/propay.ts | — | — | — | 4 |
| `pro.pay.sag_eligible` | `systems/propay.ts` | systems/propay.ts | — | Yes | pro.pay.sag_eligible; success | 4 |
| `pro.reply` | `systems/projobs.ts` | systems/proagent.ts; systems/projobs.ts | — | — | — | 6 |
| `pro.residual.air` | `systems/contracts.ts` | systems/contracts.ts | — | — | — | 0 |
| `pro.residual.pay` | `systems/contracts.ts` | systems/contracts.ts | — | — | pro.pay.payday; problem | 2 |
| `pro.school_answer` | `systems/projobs.ts` | systems/projobs.ts | engagements (added to) | — | booked; declined; pro.school_answer; and 1 more | 0 |
| `pro.series.episode` | `systems/series.ts` | systems/series.ts | — | — | booked; problem | 2 |
| `pro.series.option` | `systems/series.ts` | systems/series.ts | — | — | problem; booked | 2 |
| `pro.tape_due` | `systems/projobs.ts` | systems/projobs.ts | — | — | — | 2 |
| `pro.trip_arrive` | `systems/worktrip.ts` | systems/worktrip.ts | — | — | arrived; home | 0 |
| `pro.trip_depart` | `systems/worktrip.ts` | systems/worktrip.ts | — | — | departed | 0 |
| `pro.visa_decision` | `systems/worktrip.ts` | systems/worktrip.ts | — | — | — | 0 |
| `pro.work_day` | `systems/projobs.ts` | systems/projobs.ts | — | — | stage; worked | 10 |
| `school.account_due` | `systems/leave.ts` | systems/leave.ts | — | — | — | 14 |
| `school.aid_decide` | `systems/leave.ts` | systems/leave.ts | — | — | — | 0 |
| `school.cabaret` | `systems/school.ts` | systems/school.ts | status | — | cabaret; school.summer; school.stipend | 30 |
| `school.call` | `systems/school.ts` | systems/school.ts | status | — | school.call | 74 |
| `school.classes` | `systems/school.ts` | systems/school.ts | status | — | — | 40 |
| `school.commencement` | `systems/school.ts` | systems/school.ts | — | — | — | 26 |
| `school.company` | `systems/school.ts` | systems/school.ts | — | — | — | 8 |
| `school.conferral` | `systems/school.ts` | systems/school.ts | — | — | school.cabaret | 7 |
| `school.convert` | `systems/school.ts` | systems/school.ts | — | Yes | — | 13 |
| `school.evaluation` | `systems/school.ts` | systems/leave.ts; systems/school.ts | history (added to) | — | — | 26 |
| `school.extra_decide` | `systems/leave.ts` | systems/leave.ts | — | — | school.term; school.aid_decide | 4 |
| `school.former_class` | `systems/leave.ts` | systems/leave.ts | — | — | — | 4 |
| `school.incomplete_due` | `systems/courserecord.ts` | systems/courserecord.ts | — | — | — | 8 |
| `school.lab` | `systems/school.ts` | systems/school.ts | status | — | — | 22 |
| `school.leave_appeal` | `systems/leave.ts` | systems/health.ts; systems/leave.ts | — | — | school.extra_decide | 14 |
| `school.leave_decide` | `systems/leave.ts` | systems/leave.ts | — | — | — | 4 |
| `school.leave_notice` | `systems/leave.ts` | systems/leave.ts | — | Yes | — | 2 |
| `school.moment` | `systems/classmates.ts` | systems/classmates.ts | — | — | — | 10 |
| `school.orientation` | `systems/coursework.ts` | systems/coursework.ts | status | — | — | 16 |
| `school.partner_ask` | `systems/coursework.ts` | systems/coursework.ts | — | — | — | 2 |
| `school.partner_rehearsal` | `systems/coursework.ts` | systems/coursework.ts | — | — | — | 15 |
| `school.payday` | `systems/school.ts` | systems/leave.ts; systems/school.ts | — | Yes | run | 6 |
| `school.recess` | `systems/school.ts` | systems/school.ts | — | — | — | 2 |
| `school.repeat_decide` | `systems/leave.ts` | systems/leave.ts | — | — | school.term | 6 |
| `school.repeat_due` | `systems/leave.ts` | systems/leave.ts | — | — | — | 4 |
| `school.shift` | `systems/school.ts` | systems/school.ts | status | — | school.convert | 47 |
| `school.showcase` | `systems/proshowcase.ts` | systems/proshowcase.ts | status | — | — | 4 |
| `school.showcase_check` | `systems/proshowcase.ts` | systems/proshowcase.ts | — | — | — | 2 |
| `school.stipend` | `systems/school.ts` | systems/school.ts | — | Yes | school.shift | 11 |
| `school.study_session` | `systems/classmates.ts` | systems/classmates.ts | status | — | — | 12 |
| `school.summer` | `systems/school.ts` | systems/school.ts | status | — | summer | 21 |
| `school.term` | `systems/school.ts` | systems/leave.ts; systems/school.ts | — | Yes | school.evaluation; school.recess; school.term | 28 |
| `school.week` | `systems/school.ts` | systems/school.ts | — | — | — | 16 |
| `school.welfare` | `systems/leave.ts` | systems/leave.ts | — | — | school.welfare_decide | 2 |
| `school.welfare_decide` | `systems/leave.ts` | systems/leave.ts | — | — | medical; school.leave_appeal | 0 |
| `tax.amended` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | Yes | — | 0 |
| `tax.due` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.substitute; tax.three_year | 6 |
| `tax.federal_lien` | `systems/taxreturn.ts` | systems/taxreturn.ts | status; startedAt; nextDue; payBy; why; and 3 more | Yes | tax.federal_lien; tax.notice; short; and 4 more | 2 |
| `tax.notice` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | Yes | — | 23 |
| `tax.plan_decide` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | Yes | — | 0 |
| `tax.plan_default` | `systems/taxreturn.ts` | systems/taxreturn.ts | status; nextDue | Yes | tax.plan_payment; tax.refund; tax.amended | 2 |
| `tax.plan_payment` | `systems/taxreturn.ts` | systems/taxreturn.ts | nextDue; status; defaultBy | Yes | tax.plan_payment; tax.plan_default | 4 |
| `tax.refund` | `systems/taxreturn.ts` | systems/statetax.ts; systems/taxreturn.ts | taxPlan | Yes | short; tax.plan_decide | 5 |
| `tax.season` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.season; tax.due | 5 |
| `tax.state_lien` | `systems/statetax.ts` | systems/statetax.ts | — | Yes | tax.state_lien | 6 |
| `tax.state_nonfiler` | `systems/taxreturn.ts` | systems/statetax.ts | — | — | — | 6 |
| `tax.state_notice` | `systems/statetax.ts` | systems/statetax.ts | — | Yes | tax.state_plan_payment | 13 |
| `tax.state_plan_end` | `systems/statetax.ts` | systems/statetax.ts | — | Yes | tax.state_plan_payment | 0 |
| `tax.state_plan_payment` | `systems/statetax.ts` | systems/statetax.ts | status; why; nextDue | Yes | tax.state_plan_payment | 1 |
| `tax.substitute` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | tax.substitute | 15 |
| `tax.three_year` | `systems/taxreturn.ts` | systems/taxreturn.ts | — | — | — | 4 |
| `world.tick` | `world/world.ts` | index.ts; world/world.ts | — | — | world.tick | 2 |
