# The Developer Map

Built by `tools/devmap.mjs --write` from the code, and checked by the gate (`--check`). Don’t edit by hand.

Each command the player can run: the engine file that handles it, the screens that run it, the tests that run it, and the guide’s chapter that opens it. A test counts where it names the command; a command a test reaches only through another isn’t counted.

216 commands; 210 named by a test, 6 not.

## aircraft

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `aircraft.buy` | `src/engine/systems/aviation.ts` | `TravelWorkspace.tsx` | `aviation.test.ts` | Getting Around |
| `aircraft.sell` | `src/engine/systems/aviation.ts` | `TravelWorkspace.tsx` | `aviation.test.ts` | Getting Around |

## bank

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `bank.add_standing_order` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `accountlife.test.ts` `payments.test.ts` | Your Bank |
| `bank.arrange_overdraft` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `bank-fees.test.ts` `lending.test.ts` | Your Bank |
| `bank.borrow` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `lending.test.ts` | Your Bank |
| `bank.break_term` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` `arrears.test.ts` | Your Bank |
| `bank.cancel_new` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.cancel_scheduled` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `payments.test.ts` | Your Bank |
| `bank.cancel_standing_order` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `payments.test.ts` | Your Bank |
| `bank.claim_unclaimed` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.close_savings` | `src/engine/systems/banking.ts` | `BankWorkspace.tsx` | `accountlife.test.ts` `banking.test.ts` `lending.test.ts` | Your Bank |
| `bank.debit_overdraft` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `lending.test.ts` | Your Bank |
| `bank.new_number` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `security.test.ts` | Your Bank |
| `bank.open_savings` | `src/engine/systems/banking.ts` | `BankWorkspace.tsx` | `accountlife.test.ts` `banking.test.ts` | Your Bank |
| `bank.open_term` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `accountlife.test.ts` `arrears.test.ts` `lending.test.ts` | Your Bank |
| `bank.pay_collections` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `arrears.test.ts` `lending.test.ts` | Your Bank |
| `bank.reactivate` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.reclaim_debit` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `payments.test.ts` | Your Bank |
| `bank.repay_loan` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `lending.test.ts` | Your Bank |
| `bank.schedule_payment` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `payments.test.ts` | Your Bank |
| `bank.set_alerts` | `src/engine/systems/statements.ts` | `BankStatements.tsx` | `playthrough-fixes.test.ts` `statements.test.ts` | Your Bank |
| `bank.set_payments` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `accountlife.test.ts` `arrears.test.ts` `cardlife.test.ts` `cardoffers.test.ts` `cash.test.ts` `livelihood.test.ts` `payments.test.ts` `pending.test.ts` `security.test.ts` | Your Bank |
| `bank.set_round_ups` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.set_term_end` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.stop_check` | `src/engine/systems/payments.ts` | `BankPayments.tsx` | `payments.test.ts` | Your Bank |
| `bank.switch` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `arrears.test.ts` `cardoffers.test.ts` `cards.test.ts` `lending.test.ts` `payments.test.ts` | Your Bank |
| `bank.take_overrun_loan` | `src/engine/systems/lending.ts` | `BankLending.tsx` | `arrears.test.ts` | Your Bank |
| `bank.take_term_interest` | `src/engine/systems/accountlife.ts` | `BankAccountLife.tsx` | `accountlife.test.ts` | Your Bank |
| `bank.transfer` | `src/engine/systems/banking.ts` | `BankWorkspace.tsx` | `accountlife.test.ts` `banking.test.ts` `cash.test.ts` | Your Bank |

## benefits

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `benefits.assistance` | `src/engine/systems/assistance.ts` | `PapersWorkspace.tsx` | `assistance.test.ts` | Between Jobs |
| `benefits.claim` | `src/engine/systems/unemployment.ts` | `PapersWorkspace.tsx` | `homebenefits.test.ts` `safetynet.test.ts` `universalcredit.test.ts` | Between Jobs |
| `benefits.ei_register` | `src/engine/systems/eiself.ts` | `PapersWorkspace.tsx` | `cabenefits.test.ts` | Between Jobs |
| `benefits.hap` | `src/engine/systems/homebenefits.ts` | `PapersWorkspace.tsx` | `homebenefits.test.ts` | Between Jobs |

## boat

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `boat.buy` | `src/engine/systems/boats.ts` | `VehiclesWorkspace.tsx` | `boats.test.ts` | A Car Of Your Own |
| `boat.certify` | `src/engine/systems/boats.ts` | `VehiclesWorkspace.tsx` | `boats.test.ts` | A Car Of Your Own |
| `boat.sell` | `src/engine/systems/boats.ts` | `VehiclesWorkspace.tsx` | `boats.test.ts` | A Car Of Your Own |

## build

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `build.pay` | `src/engine/systems/construction.ts` | `LandWorkspace.tsx` | `construction.test.ts` | Building A House |
| `build.start` | `src/engine/systems/construction.ts` | `LandWorkspace.tsx` | `construction.test.ts` | Building A House |

## calendar

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `calendar.cancel` | `src/engine/world/plans.ts` | `CalendarWorkspace.tsx` | `plans.test.ts` `smoke.test.ts` | Your Own Plans |
| `calendar.schedule` | `src/engine/world/plans.ts` | `CalendarWorkspace.tsx` | `day-bounds.test.ts` `journey.test.ts` `livelihood.test.ts` `looking-after.test.ts` `looks.test.ts` `personality.test.ts` `plans.test.ts` `simulation.test.ts` `smoke.test.ts` | Your Own Plans |
| `calendar.skip` | `src/engine/world/plans.ts` | `TimeControls.tsx` | `plans.test.ts` | What’s Coming |

## caravan

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `caravan.buy` | `src/engine/systems/caravans.ts` | `VehiclesWorkspace.tsx` | `caravans.test.ts` | Rent And A Roof |
| `caravan.sell` | `src/engine/systems/caravans.ts` | `VehiclesWorkspace.tsx` | `caravans.test.ts` | Rent And A Roof |

## card

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `card.apply` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` `cardoffers.test.ts` `cards.test.ts` `several-cards.test.ts` | Your Bank |
| `card.close` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` `cards.test.ts` `several-cards.test.ts` | Your Bank |
| `card.dispute` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `security.test.ts` | Your Bank |
| `card.lock` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `security.test.ts` | Your Bank |
| `card.money_transfer` | `src/engine/systems/cardoffers.ts` | `BankCardOffers.tsx` | `cardoffers.test.ts` | Your Bank |
| `card.plan` | `src/engine/systems/cardoffers.ts` | `BankCardOffers.tsx` | `cardoffers.test.ts` | Your Bank |
| `card.redeem_rewards` | `src/engine/systems/cardoffers.ts` | `BankCardOffers.tsx` | `cardoffers.test.ts` | Your Bank |
| `card.refund_credit` | `src/engine/systems/credit.ts` | `BankCard.tsx` | `interest.test.ts` | Your Bank |
| `card.report` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `security.test.ts` | Your Bank |
| `card.request_hardship` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` | Your Bank |
| `card.request_limit` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` | Your Bank |
| `card.set_auto_raise` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` | Your Bank |
| `card.set_everyday` | `src/engine/systems/credit.ts` | `BankCard.tsx` | `several-cards.test.ts` | Your Bank |
| `card.set_over_limit` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` | Your Bank |
| `card.set_statement_day` | `src/engine/systems/cardlife.ts` | `BankCard.tsx` | `cardlife.test.ts` `several-cards.test.ts` | Your Bank |
| `card.update_billers` | `src/engine/systems/security.ts` | `BankSecurity.tsx` | `security.test.ts` | Your Bank |

## career

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `career.accept` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `arrears.test.ts` `border.test.ts` `cabenefits.test.ts` `cabusiness.test.ts` `capensions.test.ts` `career.test.ts` `careertrips.test.ts` `carried.test.ts` `fittings.test.ts` `marriage.test.ts` `mxbusiness.test.ts` `permission.test.ts` `playthrough-fixes.test.ts` `rivals.test.ts` `safetynet.test.ts` `school.test.ts` `skills.test.ts` `worklife.test.ts` | The Business |
| `career.buy_kit` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `costs.test.ts` | The Business |
| `career.class` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `costs.test.ts` | The Business |
| `career.coach` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `costs.test.ts` | The Business |
| `career.commercial_leave` | `src/engine/systems/commercial.ts` | `CareerWorkspace.tsx` | `commercial.test.ts` | The Business |
| `career.commercial_meet` | `src/engine/systems/commercial.ts` | `CareerWorkspace.tsx` | `commercial.test.ts` | The Business |
| `career.enter_award` | `src/engine/systems/awards.ts` | `CareerWorkspace.tsx` | `awards.test.ts` | The Business |
| `career.furnish_wardrobe` | `src/engine/systems/fittings.ts` | `CareerWorkspace.tsx` | `fittings.test.ts` | The Business |
| `career.headshots` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `costs.test.ts` | The Business |
| `career.improv` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `attributes.test.ts` | The Business |
| `career.leave` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `career.test.ts` | The Business |
| `career.leave_manager` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `safetynet.test.ts` | The Business |
| `career.pass` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `playthrough-fixes.test.ts` | The Business |
| `career.publicist` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `attributes.test.ts` | The Business |
| `career.query_agencies` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `mxbusiness.test.ts` | The Business |
| `career.reel` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `costs.test.ts` | The Business |
| `career.relocate` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `career.test.ts` `school.test.ts` `universalcredit.test.ts` | The Business |
| `career.renew` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `career.test.ts` | The Business |
| `career.self_submit` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `career.test.ts` `costs.test.ts` `school.test.ts` | The Business |
| `career.sign` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `career.test.ts` `skills.test.ts` | The Business |
| `career.sign_manager` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `safetynet.test.ts` | The Business |
| `career.subscribe` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `costs.test.ts` | The Business |
| `career.t1287` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `carried.test.ts` | — |
| `career.workshop` | `src/engine/systems/career.ts` | `CareerWorkspace.tsx` | `attributes.test.ts` | The Business |

## cash

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `cash.deposit` | `src/engine/systems/cash.ts` | `BankCash.tsx` | `cash.test.ts` | Your Bank |
| `cash.withdraw` | `src/engine/systems/cash.ts` | `BankCash.tsx` | `cardoffers.test.ts` `cash.test.ts` `security.test.ts` `several-cards.test.ts` | Your Bank |

## clothes

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `clothes.alter` | `src/engine/systems/tailoring.ts` | `ClothesWorkspace.tsx` | `tailoring.test.ts` | Rent And A Roof |
| `clothes.buy` | `src/engine/systems/clothing.ts` | `ClothesWorkspace.tsx` | `clothing.test.ts` | Rent And A Roof |
| `clothes.collect` | `src/engine/systems/clothing.ts` | `ClothesWorkspace.tsx` `RoutinesWorkspace.tsx` | `clothing.test.ts` `tailoring.test.ts` `trips.test.ts` | Rent And A Roof |
| `clothes.delete_outfit` | `src/engine/systems/clothing.ts` | `ClothesWorkspace.tsx` | `clothing.test.ts` | Rent And A Roof |
| `clothes.dress` | `src/engine/systems/clothing.ts` | `ClothesWorkspace.tsx` | `clothing.test.ts` | Rent And A Roof |
| `clothes.dry_clean` | `src/engine/systems/clothing.ts` | `ClothesWorkspace.tsx` `RoutinesWorkspace.tsx` | `clothing.test.ts` | Rent And A Roof |
| `clothes.return` | `src/engine/systems/clothing.ts` | `ClothesWorkspace.tsx` | `clothing.test.ts` | Rent And A Roof |
| `clothes.save_outfit` | `src/engine/systems/clothing.ts` | `ClothesWorkspace.tsx` | `clothing.test.ts` `fittings.test.ts` | Rent And A Roof |
| `clothes.wear_outfit` | `src/engine/systems/clothing.ts` | `ClothesWorkspace.tsx` `RoutinesWorkspace.tsx` | `clothing.test.ts` | Rent And A Roof |

## dating

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `dating.app` | `src/engine/systems/dating.ts` | `PeopleWorkspace.tsx` | `dating.test.ts` | People |

## documents

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `documents.apply_authorization` | `src/engine/systems/documents.ts` | `Documents.tsx` | `border.test.ts` `documents.test.ts` | Passports And Licenses |
| `documents.apply_idcard` | `src/engine/systems/identity.ts` | `Documents.tsx` | `boardingid.test.ts` `identity.test.ts` | Passports And Licenses |
| `documents.apply_idp` | `src/engine/systems/licensing.ts` | `Documents.tsx` | `licensing.test.ts` | Passports And Licenses |
| `documents.apply_opt` | `src/engine/systems/permission.ts` | `Documents.tsx` | `permission.test.ts` | Passports And Licenses |
| `documents.apply_passport` | `src/engine/systems/documents.ts` | `Documents.tsx` | `documents.test.ts` | Passports And Licenses |
| `documents.apply_visa` | `src/engine/systems/documents.ts` | `Documents.tsx` | `visas.test.ts` | Passports And Licenses |
| `documents.apply_work_permit` | `src/engine/systems/permission.ts` | `Documents.tsx` | `permission.test.ts` | Passports And Licenses |
| `documents.exchange_license` | `src/engine/systems/licensing.ts` | `Documents.tsx` | `identity.test.ts` `licensing.test.ts` | Passports And Licenses |
| `documents.license_step` | `src/engine/systems/licensing.ts` | `Documents.tsx` | `licensing.test.ts` `motorcycles.test.ts` | Passports And Licenses |
| `documents.naturalize` | `src/engine/systems/citizenship.ts` | `Documents.tsx` | `naturalize.test.ts` | Passports And Licenses |
| `documents.petition_o1` | `src/engine/systems/permission.ts` | `Documents.tsx` | `permission.test.ts` | — |
| `documents.real_id` | `src/engine/systems/identity.ts` | `Documents.tsx` | `identity.test.ts` | Passports And Licenses |
| `documents.renew_license` | `src/engine/systems/licensing.ts` | `Documents.tsx` | `identity.test.ts` `licensing.test.ts` `motorcycles.test.ts` | Passports And Licenses |
| `documents.renew_residence` | `src/engine/systems/residence.ts` | `Documents.tsx` | `residence.test.ts` | Passports And Licenses |
| `documents.report_lost` | `src/engine/systems/documents.ts` | `Documents.tsx` | `border.test.ts` `documents.test.ts` `journey.test.ts` | Passports And Licenses |
| `documents.residence` | `src/engine/systems/residence.ts` | `Documents.tsx` | `naturalize.test.ts` `residence.test.ts` | Passports And Licenses |
| `documents.settle` | `src/engine/systems/residence.ts` | `Documents.tsx` | `naturalize.test.ts` `residence.test.ts` | Passports And Licenses |

## errand

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `errand.fuel` | `src/engine/systems/trips.ts` | `RoutinesWorkspace.tsx` | **none** | Rent And A Roof |
| `errand.go` | `src/engine/systems/trips.ts` | `RoutinesWorkspace.tsx` | `trips.test.ts` | Rent And A Roof |
| `errand.park` | `src/engine/systems/trips.ts` | `RoutinesWorkspace.tsx` | **none** | Rent And A Roof |

## finance

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `finance.pay_card` | `src/engine/systems/credit.ts` | `BankCard.tsx` | `cardlife.test.ts` `cards.test.ts` `household.test.ts` `interest.test.ts` | Your Bank |
| `finance.set_autopay` | `src/engine/systems/credit.ts` | `BankCard.tsx` | `cards.test.ts` `household.test.ts` `several-cards.test.ts` | Your Bank |

## food

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `food.buy_groceries` | `src/engine/systems/kitchen.ts` | `FoodWorkspace.tsx` `RoutinesWorkspace.tsx` | `kitchen.test.ts` `trips.test.ts` `utilities.test.ts` | Rent And A Roof |
| `food.cook` | `src/engine/systems/kitchen.ts` | `FoodWorkspace.tsx` `RoutinesWorkspace.tsx` | `kitchen.test.ts` | Rent And A Roof |
| `food.dine` | `src/engine/systems/life.ts` | `FoodWorkspace.tsx` | `dining.test.ts` | Rent And A Roof |
| `food.drink` | `src/engine/systems/alcohol.ts` | `FoodWorkspace.tsx` | `alcohol.test.ts` | Rent And A Roof |
| `food.drink_home` | `src/engine/systems/kitchen.ts` | `FoodWorkspace.tsx` | `kitchen.test.ts` | Rent And A Roof |
| `food.eat_ready` | `src/engine/systems/kitchen.ts` | `FoodWorkspace.tsx` `RoutinesWorkspace.tsx` | `kitchen.test.ts` | Rent And A Roof |

## gym

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `gym.join` | `src/engine/systems/gyms.ts` | `RoutinesWorkspace.tsx` | `gyms.test.ts` | Looking After Yourself |
| `gym.leave` | `src/engine/systems/gyms.ts` | `RoutinesWorkspace.tsx` | `gyms.test.ts` | Looking After Yourself |

## health

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `health.apply_aid` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `safetynet.test.ts` | Between Jobs |
| `health.choose_clinic` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `clinics.test.ts` | Between Jobs |
| `health.dental` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `costs.test.ts` | Between Jobs |
| `health.drop` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | **none** | Between Jobs |
| `health.elect_cobra` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `worklife.test.ts` | Between Jobs |
| `health.enroll` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `medicaluis.test.ts` `safetynet.test.ts` `worklife.test.ts` | Between Jobs |
| `health.pay_bill` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `worklife.test.ts` | Between Jobs |
| `health.treat` | `src/engine/systems/health.ts` | `PapersWorkspace.tsx` | `carried.test.ts` | Between Jobs |

## home

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `home.alarm` | `src/engine/systems/alarm.ts` | `Home.tsx` | `alarm.test.ts` | Rent And A Roof |
| `home.borrow` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `homes.test.ts` | Rent And A Roof |
| `home.buy_portable` | `src/engine/systems/appliances.ts` | `Home.tsx` | `appliances.test.ts` | Rent And A Roof |
| `home.buy_units` | `src/engine/systems/appliances.ts` | `Home.tsx` | `appliances.test.ts` | Rent And A Roof |
| `home.cancel` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `homes.test.ts` | Rent And A Roof |
| `home.charger` | `src/engine/systems/charging.ts` | `Home.tsx` | `evs.test.ts` | Rent And A Roof |
| `home.cleaner` | `src/engine/systems/dwelling.ts` | `Home.tsx` | `dwelling.test.ts` | Rent And A Roof |
| `home.end_lodger` | `src/engine/systems/lodgers.ts` | `HomesWorkspace.tsx` | `lodgers.test.ts` | Rent And A Roof |
| `home.end_tenancy` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | **none** | Rent And A Roof |
| `home.fit` | `src/engine/systems/appliances.ts` | `HomesWorkspace.tsx` | `appliances.test.ts` | Rent And A Roof |
| `home.furnish` | `src/engine/systems/furniture.ts` | `HomesWorkspace.tsx` | `beds.test.ts` `furniture.test.ts` `gear.test.ts` | Rent And A Roof |
| `home.let` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `homes.test.ts` | Rent And A Roof |
| `home.move` | `src/engine/systems/household.ts` | `Home.tsx` | `furniture.test.ts` `homes-cohesion.test.ts` `items.test.ts` `livelihood.test.ts` | Rent And A Roof |
| `home.move_by` | `src/engine/systems/furniture.ts` | `HomesWorkspace.tsx` | `motorhomes.test.ts` | Rent And A Roof |
| `home.move_in` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `construction.test.ts` | Rent And A Roof |
| `home.offer` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `homes-open.test.ts` `homes.test.ts` | Rent And A Roof |
| `home.pay_landlord` | `src/engine/systems/household.ts` | `Home.tsx` | `homes-cohesion.test.ts` `payments.test.ts` | Rent And A Roof |
| `home.pay_mortgage` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `homes.test.ts` | Rent And A Roof |
| `home.refinance` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `homes-open.test.ts` | Rent And A Roof |
| `home.renovate` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `homes.test.ts` `permits.test.ts` | Rent And A Roof |
| `home.renters_insurance` | `src/engine/systems/dwelling.ts` | `Home.tsx` | `homes-open.test.ts` | Rent And A Roof |
| `home.replace_mattress` | `src/engine/systems/furniture.ts` | `HomesWorkspace.tsx` | `beds.test.ts` `furniture.test.ts` | Rent And A Roof |
| `home.security` | `src/engine/systems/homesecurity.ts` | `Home.tsx` | `homesecurity.test.ts` | Rent And A Roof |
| `home.sell` | `src/engine/systems/homes.ts` | `HomesWorkspace.tsx` | `construction.test.ts` `homes.test.ts` `routines.test.ts` | Rent And A Roof |
| `home.take_lodger` | `src/engine/systems/lodgers.ts` | `HomesWorkspace.tsx` | `lodgers.test.ts` | Rent And A Roof |

## hygiene

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `hygiene.buy` | `src/engine/systems/hygiene.ts` | `ClothesWorkspace.tsx` `RoutinesWorkspace.tsx` | `hygiene.test.ts` | Rent And A Roof |
| `hygiene.groom` | `src/engine/systems/life.ts` | `ClothesWorkspace.tsx` `RoutinesWorkspace.tsx` | `hygiene.test.ts` `trips.test.ts` | Rent And A Roof |

## items

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `items.move` | `src/engine/systems/items.ts` | `BelongingsWorkspace.tsx` | `items.test.ts` | Rent And A Roof |

## land

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `land.combine` | `src/engine/systems/land.ts` | `LandWorkspace.tsx` | `land.test.ts` `landlease.test.ts` | Land |
| `land.end_lease` | `src/engine/systems/landlease.ts` | `LandWorkspace.tsx` | `landlease.test.ts` | Land |
| `land.lease_out` | `src/engine/systems/landlease.ts` | `LandWorkspace.tsx` | `landlease.test.ts` | Land |
| `land.offer` | `src/engine/systems/land.ts` | `LandWorkspace.tsx` | `land.test.ts` `landloan.test.ts` | Land |
| `land.sell` | `src/engine/systems/land.ts` | `LandWorkspace.tsx` | `construction.test.ts` `land.test.ts` `landloan.test.ts` | Land |
| `land.split` | `src/engine/systems/land.ts` | `LandWorkspace.tsx` | `land.test.ts` `landlease.test.ts` | Land |
| `land.withdraw` | `src/engine/systems/land.ts` | `LandWorkspace.tsx` | `land.test.ts` | Land |

## life

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `life.look_after` | `src/engine/systems/life.ts` | `RoutinesWorkspace.tsx` `TimeControls.tsx` | `boats.test.ts` `carried.test.ts` `courts.test.ts` `dwelling.test.ts` `household.test.ts` `hygiene.test.ts` `looking-after.test.ts` `outings.test.ts` `routines.test.ts` `wellbeing-bites.test.ts` | Looking After Yourself |
| `life.sleep` | `src/engine/systems/life.ts` | `TimeControls.tsx` | `aviation.test.ts` `carried.test.ts` `extend.test.ts` `integrity.test.ts` `journey.test.ts` `lets.test.ts` `licensing.test.ts` `looking-after.test.ts` `looks.test.ts` `personality.test.ts` `rentals.test.ts` `simulation.test.ts` `tutorial.test.ts` `wellbeing-bites.test.ts` | Sleep |

## pension

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `pension.bienestar` | `src/engine/systems/homepensions.ts` | `CareerWorkspace.tsx` | `homepensions.test.ts` | The Business |
| `pension.ca_oas` | `src/engine/systems/capensions.ts` | `CareerWorkspace.tsx` | `capensions.test.ts` | The Business |
| `pension.cpp` | `src/engine/systems/capensions.ts` | `CareerWorkspace.tsx` | `capensions.test.ts` | The Business |
| `pension.ie_state` | `src/engine/systems/homepensions.ts` | `CareerWorkspace.tsx` | `homepensions.test.ts` | The Business |
| `pension.imss` | `src/engine/systems/imss.ts` | `CareerWorkspace.tsx` | `imss.test.ts` | The Business |
| `pension.social_security` | `src/engine/systems/socialsecurity.ts` | `CareerWorkspace.tsx` | `socialsecurity.test.ts` | The Business |
| `pension.start` | `src/engine/systems/pension.ts` | `CareerWorkspace.tsx` | `pension.test.ts` | The Business |
| `pension.state` | `src/engine/systems/statepension.ts` | `CareerWorkspace.tsx` | `statepension.test.ts` | The Business |

## pilot

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `pilot.train` | `src/engine/systems/aviation.ts` | `TravelWorkspace.tsx` | `aviation.test.ts` | Getting Around |

## routine

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `routine.delete` | `src/engine/systems/routines.ts` | `RoutinesWorkspace.tsx` | `routines.test.ts` | Rent And A Roof |
| `routine.save` | `src/engine/systems/routines.ts` | `RoutinesWorkspace.tsx` | `routines.test.ts` | Rent And A Roof |

## school

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `school.cabaret` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` `day.tsx` | `school.test.ts` | Drama School |
| `school.call_in_sick` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` | `school.test.ts` | Drama School |
| `school.summer_cabaret` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` | `school.test.ts` | Drama School |
| `school.take_shift` | `src/engine/systems/school.ts` | `SchoolWorkspace.tsx` | `school.test.ts` | Drama School |

## social

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `social.ask_out` | `src/engine/systems/people.ts` | `PeopleWorkspace.tsx` | `people.test.ts` | People |
| `social.break_up` | `src/engine/systems/people.ts` | `PeopleWorkspace.tsx` | `marriage.test.ts` `people.test.ts` | People |
| `social.divorce` | `src/engine/systems/marriage.ts` | `PeopleWorkspace.tsx` | `marriage.test.ts` | People |
| `social.invite` | `src/engine/systems/people.ts` | `PeopleWorkspace.tsx` | `people.test.ts` | People |
| `social.marry` | `src/engine/systems/marriage.ts` | `PeopleWorkspace.tsx` | `marriage.test.ts` | People |
| `social.move_in` | `src/engine/systems/people.ts` | `PeopleWorkspace.tsx` | `people.test.ts` | People |
| `social.split` | `src/engine/systems/marriage.ts` | `PeopleWorkspace.tsx` | `marriage.test.ts` | People |
| `social.try_for_child` | `src/engine/systems/children.ts` | `PeopleWorkspace.tsx` | `children.test.ts` | People |

## tax

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `tax.file` | `src/engine/systems/taxreturn.ts` | `PapersWorkspace.tsx` | `retirement.test.ts` `safetynet.test.ts` | Between Jobs |
| `tax.pay` | `src/engine/systems/taxreturn.ts` | `PapersWorkspace.tsx` | `safetynet.test.ts` | Between Jobs |

## travel

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `travel.book` | `src/engine/systems/journey.ts` | `TravelWorkspace.tsx` | `aviation.test.ts` `boardingid.test.ts` `caravans.test.ts` `compensation.test.ts` `driving.test.ts` `extend.test.ts` `ferries.test.ts` `hotels.test.ts` `identity.test.ts` `journey.test.ts` `lets.test.ts` `motorhomes.test.ts` `rail.test.ts` `rentals.test.ts` `staytypes.test.ts` | Getting Around |
| `travel.cancel` | `src/engine/systems/journey.ts` | `TravelWorkspace.tsx` | `caravans.test.ts` `journey.test.ts` `rail.test.ts` `rentals.test.ts` | Getting Around |
| `travel.extend` | `src/engine/systems/journey.ts` | `TravelWorkspace.tsx` | `extend.test.ts` | Getting Around |
| `travel.rent_car` | `src/engine/systems/rentals.ts` | `TravelWorkspace.tsx` | `extend.test.ts` `rentals.test.ts` | Getting Around |
| `travel.stay_let` | `src/engine/systems/journey.ts` | `TravelWorkspace.tsx` | `extend.test.ts` `lets.test.ts` `staytypes.test.ts` | Getting Around |

## tutorial

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `tutorial.read` | `src/engine/world/tutorial.ts` | — | **none** | — |

## vehicle

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `vehicle.buy` | `src/engine/systems/vehicles.ts` | `VehiclesWorkspace.tsx` | `caravans.test.ts` `driving.test.ts` `evs.test.ts` `ferries.test.ts` `inspections.test.ts` `landlease.test.ts` `leasing.test.ts` `mods.test.ts` `motorcycles.test.ts` `motorhomes.test.ts` `networth-holdings.test.ts` `outings.test.ts` `repairs.test.ts` `repossession.test.ts` `staytypes.test.ts` `theft.test.ts` `tint-road.test.ts` `tint.test.ts` `tires-drive.test.ts` `tires.test.ts` `tradein.test.ts` `trips.test.ts` `vehicles.test.ts` | A Car Of Your Own |
| `vehicle.hitch` | `src/engine/systems/caravans.ts` | `VehiclesWorkspace.tsx` | `caravans.test.ts` | Rent And A Roof |
| `vehicle.lease` | `src/engine/systems/leasing.ts` | `VehiclesWorkspace.tsx` | `leasesabroad.test.ts` `leasing.test.ts` `mods.test.ts` | A Car Of Your Own |
| `vehicle.lease_buyout` | `src/engine/systems/leasing.ts` | `VehiclesWorkspace.tsx` | `leasing.test.ts` | A Car Of Your Own |
| `vehicle.lease_return` | `src/engine/systems/leasing.ts` | `VehiclesWorkspace.tsx` | `leasesabroad.test.ts` `leasing.test.ts` | A Car Of Your Own |
| `vehicle.modify` | `src/engine/systems/mods.ts` | `VehiclesWorkspace.tsx` | `mods.test.ts` | A Car Of Your Own |
| `vehicle.redeem` | `src/engine/systems/repossession.ts` | `VehiclesWorkspace.tsx` | `repossession.test.ts` | A Car Of Your Own |
| `vehicle.repair` | `src/engine/systems/repairs.ts` | `VehiclesWorkspace.tsx` | `repairs.test.ts` | A Car Of Your Own |
| `vehicle.sell` | `src/engine/systems/vehicles.ts` | `VehiclesWorkspace.tsx` | `leasing.test.ts` `repossession.test.ts` `theft.test.ts` `vehicles.test.ts` | A Car Of Your Own |
| `vehicle.tint` | `src/engine/systems/tint.ts` | `VehiclesWorkspace.tsx` | `mods.test.ts` `tint.test.ts` | A Car Of Your Own |
| `vehicle.winter_tires` | `src/engine/systems/tires.ts` | `VehiclesWorkspace.tsx` | `tires.test.ts` | A Car Of Your Own |

## world

| Command | Handled In | Screens | Tests | Guide Chapter |
|---|---|---|---|---|
| `world.dismiss_decision` | `src/engine/world/world.ts` | `Home.tsx` | `smoke.test.ts` | What Needs You |
| `world.mark_read` | `src/engine/world/world.ts` | `Home.tsx` | **none** | What Needs You |
| `world.set_preferences` | `src/engine/world/world.ts` | `TimeControls.tsx` `game-context.tsx` | `plans.test.ts` `tutorial.test.ts` | The Clock |
| `world.take_decision_action` | `src/engine/world/world.ts` | `Home.tsx` | `smoke.test.ts` | What Needs You |
