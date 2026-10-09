# The Developer Map

Built by `tools/devmap.mjs --write` from the code, and checked by the gate (`--check`). Don’t edit by hand.

Each command the player can run: the engine file that handles it, the screens that run it, the tests that run it, and the guide’s chapter that opens it. A test counts where it names the command; a command a test reaches only through another isn’t counted.

111 commands; 111 named by a test, 0 not.

## bank

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `bank.add_standing_order` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `accountlife.test.ts` `journey-money.test.ts` `payments.test.ts` | Your Bank |
| `bank.arrange_overdraft` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `bank-fees.test.ts` `journey-money.test.ts` `lending.test.ts` | Your Bank |
| `bank.borrow` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `journey-money.test.ts` `lending.test.ts` | Your Bank |
| `bank.break_term` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` `arrears.test.ts` `journey-money.test.ts` | Your Bank |
| `bank.cancel_new` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.cancel_scheduled` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `journey-money.test.ts` `payments.test.ts` | Your Bank |
| `bank.cancel_standing_order` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `journey-money.test.ts` `payments.test.ts` | Your Bank |
| `bank.claim_unclaimed` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.close_savings` | `src/engine/systems/banking.ts` | `BankWorkspace.tsx` | `accountlife.test.ts` `banking.test.ts` `lending.test.ts` | Your Bank |
| `bank.debit_overdraft` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `lending.test.ts` | Your Bank |
| `bank.new_number` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `security.test.ts` | Your Bank |
| `bank.open_savings` | `src/engine/systems/banking.ts` | `BankWorkspace.tsx` | `accountlife.test.ts` `banking.test.ts` | Your Bank |
| `bank.open_term` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `accountlife.test.ts` `arrears.test.ts` `journey-money.test.ts` `lending.test.ts` | Your Bank |
| `bank.pay_collections` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `arrears.test.ts` | Your Bank |
| `bank.reactivate` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.repay_loan` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `journey-money.test.ts` `lending.test.ts` | Your Bank |
| `bank.schedule_payment` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `journey-money.test.ts` `payments.test.ts` | Your Bank |
| `bank.set_alerts` | `src/engine/systems/statements.ts` | `BankStatements.tsx` | `journey-money.test.ts` `playthrough-fixes.test.ts` `statements.test.ts` | Your Bank |
| `bank.set_payments` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `accountlife.test.ts` `arrears.test.ts` `cardlife.test.ts` `cardoffers.test.ts` `cash.test.ts` `journey-money.test.ts` `payments.test.ts` `pending.test.ts` | Your Bank |
| `bank.set_round_ups` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` `journey-money.test.ts` | Your Bank |
| `bank.set_term_end` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.switch` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `arrears.test.ts` `cardoffers.test.ts` `cards.test.ts` `lending.test.ts` `payments.test.ts` | Your Bank |
| `bank.take_overrun_loan` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `commands-kept.test.ts` | Your Bank |
| `bank.take_term_interest` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.transfer` | `src/engine/systems/banking.ts` | `BankWorkspace.tsx` | `accountlife.test.ts` `banking.test.ts` `cash.test.ts` `journey-money.test.ts` | Your Bank |

## benefits

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `benefits.assistance` | `src/engine/systems/assistance.ts` | `PapersWorkspace.tsx` | `assistance.test.ts` | Cover, Benefits And Returns |
| `benefits.claim` | `src/engine/systems/unemployment.ts` | `PapersWorkspace.tsx` | `homebenefits.test.ts` `safetynet.test.ts` | Cover, Benefits And Returns |
| `benefits.ei_register` | `src/engine/systems/eiself.ts` | `PapersWorkspace.tsx` | `cabenefits.test.ts` | Cover, Benefits And Returns |

## calendar

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `calendar.cancel` | `src/engine/world/plans.ts` | `CalendarWorkspace.tsx` | `journey-life.test.ts` `plans.test.ts` `smoke.test.ts` | Your Own Plans |
| `calendar.schedule` | `src/engine/world/plans.ts` | `CalendarWorkspace.tsx` | `day-bounds.test.ts` `journey-life.test.ts` `looking-after.test.ts` `looks.test.ts` `personality.test.ts` `plans.test.ts` `simulation.test.ts` `smoke.test.ts` | Your Own Plans |
| `calendar.skip` | `src/engine/world/plans.ts` | `TimeControls.tsx` | `plans.test.ts` | What’s Coming |

## card

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `card.apply` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` `cardoffers.test.ts` `cards.test.ts` `several-cards.test.ts` | Your Bank |
| `card.close` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` `cards.test.ts` `several-cards.test.ts` | Your Bank |
| `card.dispute` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `security.test.ts` | Your Bank |
| `card.lock` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `journey-money.test.ts` `security.test.ts` | Your Bank |
| `card.money_transfer` | `src/engine/systems/cardoffers.ts` | `BankCardOffers.tsx` | `cardoffers.test.ts` | Your Bank |
| `card.plan` | `src/engine/systems/cardoffers.ts` | `BankCardOffers.tsx` | `cardoffers.test.ts` | Your Bank |
| `card.redeem_rewards` | `src/engine/systems/cardoffers.ts` | `BankCardOffers.tsx` | `cardoffers.test.ts` `journey-money.test.ts` | Your Bank |
| `card.refund_credit` | `src/engine/systems/credit.ts` | `BankCard.tsx` | `interest.test.ts` | Your Bank |
| `card.report` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `security.test.ts` | Your Bank |
| `card.request_hardship` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` | Your Bank |
| `card.request_limit` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` | Your Bank |
| `card.set_auto_raise` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` | Your Bank |
| `card.set_everyday` | `src/engine/systems/credit.ts` | `BankCard.tsx` | `journey-money.test.ts` `several-cards.test.ts` | Your Bank |
| `card.set_over_limit` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` | Your Bank |
| `card.set_statement_day` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` `journey-money.test.ts` `several-cards.test.ts` | Your Bank |

## cash

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `cash.deposit` | `src/engine/systems/cash.ts` | `BankCash.tsx` | `cash.test.ts` `journey-money.test.ts` | Your Bank |
| `cash.withdraw` | `src/engine/systems/cash.ts` | `BankCash.tsx` | `cardoffers.test.ts` `cash.test.ts` `journey-money.test.ts` `security.test.ts` `several-cards.test.ts` | Your Bank |

## documents

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `documents.apply_authorization` | `src/engine/systems/documents.ts` | `Documents.tsx` | `documents.test.ts` | Passports And ID |
| `documents.apply_idcard` | `src/engine/systems/identity.ts` | `Documents.tsx` | `commands-kept.test.ts` | Passports And ID |
| `documents.apply_opt` | `src/engine/systems/permission.ts` | `Documents.tsx` | `permission.test.ts` | Passports And ID |
| `documents.apply_passport` | `src/engine/systems/documents.ts` | `Documents.tsx` | `documents.test.ts` `journey-life.test.ts` | Passports And ID |
| `documents.apply_visa` | `src/engine/systems/documents.ts` | `Documents.tsx` | `paper-visits.test.ts` `visas.test.ts` | Passports And ID |
| `documents.naturalize` | `src/engine/systems/citizenship.ts` | `Documents.tsx` | `commands-kept.test.ts` | Passports And ID |
| `documents.police_report` | `src/engine/systems/documents.ts` | `Documents.tsx` | `commands-kept.test.ts` `journey-life.test.ts` | Cover, Benefits And Returns |
| `documents.real_id` | `src/engine/systems/identity.ts` | `Documents.tsx` | `commands-kept.test.ts` | Passports And ID |
| `documents.renew_residence` | `src/engine/systems/residence.ts` | `Documents.tsx` | `commands-kept.test.ts` `residence.test.ts` | Passports And ID |
| `documents.replace_idcard` | `src/engine/systems/identity.ts` | `Documents.tsx` | `idreplace.test.ts` | Passports And ID |
| `documents.report_lost` | `src/engine/systems/documents.ts` | `Documents.tsx` | `commands-kept.test.ts` `documents.test.ts` `idreplace.test.ts` `journey-life.test.ts` | Passports And ID |
| `documents.residence` | `src/engine/systems/residence.ts` | `Documents.tsx` | `commands-kept.test.ts` `naturalize.test.ts` `residence.test.ts` | Passports And ID |
| `documents.settle` | `src/engine/systems/residence.ts` | `Documents.tsx` | `commands-kept.test.ts` | Passports And ID |

## finance

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `finance.pay_card` | `src/engine/systems/credit.ts` | `BankCard.tsx` | `cardlife.test.ts` `cards.test.ts` `interest.test.ts` | Your Bank |
| `finance.set_autopay` | `src/engine/systems/credit.ts` | `BankCard.tsx` | `cards.test.ts` `journey-money.test.ts` `several-cards.test.ts` | Your Bank |

## health

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `health.appeal` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `claims.test.ts` | Cover, Benefits And Returns |
| `health.apply_aid` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `safetynet.test.ts` | Cover, Benefits And Returns |
| `health.book` | `src/engine/systems/appointments.ts` | `PapersWorkspace.tsx` | `journey-life.test.ts` `referrals.test.ts` | Cover, Benefits And Returns |
| `health.cancel_appointment` | `src/engine/systems/appointments.ts` | `PapersWorkspace.tsx` | `journey-life.test.ts` `referrals.test.ts` | Cover, Benefits And Returns |
| `health.choose_clinic` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `clinics.test.ts` | Cover, Benefits And Returns |
| `health.choose_pharmacy` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `carevisits.test.ts` `journey-life.test.ts` | Cover, Benefits And Returns |
| `health.dental` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `costs.test.ts` `journey-life.test.ts` | Cover, Benefits And Returns |
| `health.drop` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `commands-kept.test.ts` | Cover, Benefits And Returns |
| `health.enroll` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `medicaluis.test.ts` `safetynet.test.ts` | Cover, Benefits And Returns |
| `health.extra_supply` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `commands-kept.test.ts` | Cover, Benefits And Returns |
| `health.pay_bill` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `commands-kept.test.ts` | Cover, Benefits And Returns |
| `health.prepay` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `commands-kept.test.ts` | Cover, Benefits And Returns |
| `health.therapy` | `src/engine/systems/therapy.ts` | `PapersWorkspace.tsx` | `therapy.test.ts` | Cover, Benefits And Returns |
| `health.treat` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `carried.test.ts` | Cover, Benefits And Returns |

## life

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `life.look_after` | `src/engine/systems/life.ts` | `TimeControls.tsx` | `journey-life.test.ts` `look-after.test.ts` `looking-after.test.ts` `traits-connected.test.ts` `wellbeing-bites.test.ts` | Looking After Yourself |
| `life.sleep` | `src/engine/systems/life.ts` | `TimeControls.tsx` | `integrity.test.ts` `journey-life.test.ts` `looking-after.test.ts` `looks.test.ts` `personality.test.ts` `simulation.test.ts` `tutorial.test.ts` `wellbeing-bites.test.ts` | Sleep |

## pension

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `pension.bienestar` | `src/engine/systems/homepensions.ts` | `PapersWorkspace.tsx` | `commands-kept.test.ts` | Cover, Benefits And Returns |
| `pension.ie_state` | `src/engine/systems/homepensions.ts` | `PapersWorkspace.tsx` | `homepensions.test.ts` | Cover, Benefits And Returns |
| `pension.imss` | `src/engine/systems/imss.ts` | `PapersWorkspace.tsx` | `imss.test.ts` | Cover, Benefits And Returns |
| `pension.social_security` | `src/engine/systems/socialsecurity.ts` | `PapersWorkspace.tsx` | `socialsecurity.test.ts` | Cover, Benefits And Returns |
| `pension.state` | `src/engine/systems/statepension.ts` | `PapersWorkspace.tsx` | `statepension.test.ts` | Cover, Benefits And Returns |

## plays

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `plays.read` | `src/engine/systems/playreading.ts` | `SchoolWorkspace.tsx` | `journey-life.test.ts` `playreading.test.ts` | Drama School |
| `plays.research` | `src/engine/systems/playreading.ts` | `SchoolWorkspace.tsx` | `playreading.test.ts` | Drama School |

## school

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `school.answer_partner` | `src/engine/systems/coursework.ts` | `CourseworkPane.tsx` | `journey-school-year.test.ts` `journey-three-students.test.ts` `partners.test.ts` | Drama School |
| `school.approach` | `src/engine/systems/coursework.ts` | `CourseworkPane.tsx` | `approaches.test.ts` `journey-three-students.test.ts` | Drama School |
| `school.ask_partner` | `src/engine/systems/coursework.ts` | `CourseworkPane.tsx` | `commands-kept.test.ts` `partners.test.ts` | Drama School |
| `school.buy_ppe` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` | `school-everyday.test.ts` | Drama School |
| `school.cabaret` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` `day.tsx` | `school.test.ts` | Drama School |
| `school.call_in_sick` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` | `journey-life.test.ts` `school.test.ts` | Drama School |
| `school.cancel_rehearsal` | `src/engine/systems/coursework.ts` | `CourseworkPane.tsx` | `commands-kept.test.ts` | Drama School |
| `school.choose` | `src/engine/systems/coursework.ts` | `CourseworkPane.tsx` | `journey-school-year.test.ts` `journey-three-students.test.ts` | Drama School |
| `school.learn_part` | `src/engine/systems/production.ts` | `RehearsalProcess.tsx` | `journey-school-production.test.ts` | Drama School |
| `school.make_amends` | `src/engine/systems/classmates.ts` | `CourseworkPane.tsx` | `commands-kept.test.ts` | Drama School |
| `school.orientation` | `src/engine/systems/coursework.ts` | `CourseworkPane.tsx` | `commands-kept.test.ts` `journey-life.test.ts` | Drama School |
| `school.prepare` | `src/engine/systems/coursework.ts` | `CourseworkPane.tsx` | `approaches.test.ts` `journey-school-year.test.ts` `journey-three-students.test.ts` `partners.test.ts` `traits-connected.test.ts` | Drama School |
| `school.read_feedback` | `src/engine/systems/coursework.ts` | `CourseworkPane.tsx` | `journey-school-year.test.ts` `journey-three-students.test.ts` | Drama School |
| `school.respond` | `src/engine/systems/classmates.ts` | `ClassMoments.tsx` | `journey-school-year.test.ts` `journey-three-students.test.ts` | Drama School |
| `school.review_blocking` | `src/engine/systems/production.ts` | `RehearsalProcess.tsx` | `journey-school-production.test.ts` | Drama School |
| `school.summer_cabaret` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` | `school.test.ts` | Drama School |
| `school.take_shift` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` | `school.test.ts` | Drama School |
| `school.work_note` | `src/engine/systems/production.ts` | `RehearsalProcess.tsx` | `journey-school-production.test.ts` | Drama School |

## tax

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `tax.file` | `src/engine/systems/taxreturn.ts` | `PapersWorkspace.tsx` | `journey-money.test.ts` `retirement.test.ts` `safetynet.test.ts` | Cover, Benefits And Returns |
| `tax.pay` | `src/engine/systems/taxreturn.ts` | `PapersWorkspace.tsx` | `journey-money.test.ts` `safetynet.test.ts` | Cover, Benefits And Returns |

## tutorial

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `tutorial.read` | `src/engine/world/tutorial.ts` | `Guide.tsx` | `tutorial.test.ts` | — |

## world

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `world.dismiss_decision` | `src/engine/world/world.ts` | `Home.tsx` | `smoke.test.ts` | What Needs You |
| `world.mark_read` | `src/engine/world/world.ts` | `Home.tsx` | `commands-kept.test.ts` `journey-life.test.ts` | What Needs You |
| `world.set_preferences` | `src/engine/world/world.ts` | `TimeControls.tsx` `game-context.tsx` | `plans.test.ts` `tutorial.test.ts` | The Clock |
| `world.take_decision_action` | `src/engine/world/world.ts` | `Home.tsx` | `smoke.test.ts` | What Needs You |
