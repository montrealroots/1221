# SLATE Coverage Matrix

What the game covers, feature by feature and subfeature by subfeature,
reconciled against the code that carries it. Every row says one of five
things, and nothing is promoted because its landing page works:

- **Implemented** — built, on screen, held by tests.
- **Partial** — built to a stated depth; the gap is named in the row.
- **Blocked (data)** — the code is ready or could be written, but the
  directive asks for verified real-world records that need a licensed feed
  with provenance and an as-of date, and none is wired. SLATE's own data
  stands in and says so on screen.
- **Blocked (dependency)** — waits on something else in this tree, named.
- **Not started** — nothing built; nothing claimed.

Three documents work together. `docs/OVERHAUL-BACKLOG.md` is the directive
broken into rows with a state each; `docs/IMMERSION-COVERAGE.md` is the
record of the immersion batch as it was written; this file is the current
map. The appendix at the end is generated from the code by
`node tools/inventory.mjs --write`, and `node tools/inventory.mjs --check`
fails when the appendix is behind the code or when a command, a scene or a
route has no line in the body of this file. That check is part of the
gate, so a command cannot be added without a place in the matrix.

Counts in this file are the code's own on the day it was written
(stage 12): 155 commands, 65 scheduled kinds, 157 events, 25 event
listeners, 14 scenes, 19 routes, 49 test files, 729 tests passing, 2
recorded as todo, schema 41, 465 dialogue entries.

## Surfaces

### Routes and what they open

| Route | Workspace | Tabs and panels | Owning systems |
| --- | --- | --- | --- |
| `/home` | Home | Where To (every destination), What Needs You (decisions with their actions, unread notifications with Open), What Happens Next, How You Are, Where You Are, Weather, Money, Standing, Home And Household | world, wellbeing, weather, finance |
| `/world` | World | Places by kind where you are, journeys, the Right Here actions of the place you are at | places, driving, geography |
| `/workspace/calendar` | Calendar | Days with every commitment; detail for a plan, appointment (Play It Out, Just Go, Skip It, move, cancel), bill, flight (Play It Out, Just Go, Cancel It), observance, date, showing, inspection, appraisal, closing or moving day with the owning system's actions; Plan Something | scheduler, plans, dating, viewings, purchase, care, holidays |
| `/workspace/wellbeing` | Wellbeing | Energy, stress, sleep, hygiene, readiness; every activity played out or just done; cooking | wellbeing, life |
| `/workspace/relationships` | Relationships | Everyone you know; interactions; Ask Out with activity, place and time; Dates panel with states | relationships, dating |
| `/workspace/history` | History (Why Did This Happen?) | `timeline`, `why` — left as-is except the tab label | audit |
| `/workspace/bank` | Bank | `accounts` (products to open, cover, cards with their statement and minimum, standing orders), `bills`, `statements`, `transactions`, `credit`, `tax` | finance, banking |
| `/workspace/property` | Property | `owned` (Move In, Furnish It, List For Sale), `market`, `offers` (Take The Call, Walk It With The Inspector, Read The Report, Sit At The Table, Sign Remotely), `build`, `interiors` | property, viewings, purchase, construction, interiors |
| `/workspace/vehicles` | Vehicles | `garage` (At Home: the garage, the driveway and the dock with what is in them; then each thing with its own figures, where it is kept, and its own way out: Drive, Ride, A Day On The Water, Fly It, plus Move It and Name It), `market` (by lot, six to a city, with On The Table), `service`, `modify` (parts for the kind you own) | vehicles, dealership, driving, storage |
| `/workspace/casting` | Casting | Locked; no screen registered. The door is listed on Home and Go Anywhere does not offer it. The industry engine behind it is untouched | deferred to the industry milestone |
| `/workspace/shopping` | Shopping | `shop`, `orders`, `owned`, `wardrobe` | commerce |
| `/workspace/insurance` | Insurance | Policies, quotes, claims, renewals; motor, marine and aviation lines each offering only what they cover | insurance |
| `/workspace/company` | Company | Locked in the shell (Under Construction) until the company engine lands | company (task 38) |
| `/workspace/social` | Social | Platforms you are on and not on; account stats; Compose It and Make A Post; Posts with reactions; Brand Deals | media |
| `/workspace/health` | Health | Providers, appointments (Play It Out, Just Go), prescriptions (Collect It), history with outcomes | services, care |
| `/workspace/education` | Education | Courses, enrolment, sessions | education |
| `/workspace/city` | The City | Where you are, what is here, Work Out / Eat Here / Look At The Cars / Go And See It | places, geography |
| `/workspace/travel` | Travel | `flights` (real carriers, SLATE's fares), `hotels` (real brands, SLATE's rates), `private` (real aircraft types), `bookings` (Play It Out, Just Go, Rebook, Move It A Day, Cancel) | travel, journey |
| `/workspace/character` | Character | `attributes`, `skills`, `traits`, `professions`, `positions`, `standing` | people, professions |
| `/workspace/settings` | Settings | Preferences, tutorial, the save | world, persistence |

Above every route sits the scene panel when a scene is open, and Go
Anywhere (`/`) searches all of it.

### Scenes

| Scene | Started from | Commits through | Short version | Tests |
| --- | --- | --- | --- | --- |
| `fitness.gym` | Calendar plan, The City, Wellbeing | `go.to`, `gym.check_in`, `gym.buy_pass`, `gym.hire_trainer`, `gym.train_block`, `gym.take_class`, `gym.finish_workout` | Yes | tests/scene-definitions.test.ts, tests/fitness.test.ts, tests/plans.test.ts |
| `wellbeing.activity` | Wellbeing | `life.do_activity` | Yes | tests/scene-definitions.test.ts |
| `life.meal` | The City, World | `go.to`, `dine.arrive`, `dine.wait`, `dine.leave`, `dine.order`, `dine.settle` | Yes | tests/scene-definitions.test.ts, tests/dining.test.ts |
| `life.shop` | Shopping, The City | `go.to`, `retail.enter`, `retail.handle`, `retail.try_on`, `retail.basket`, `retail.walk_out`, `retail.pay`, `shop.purchase` | Yes (it looks and leaves; it never spends for you) | tests/dining.test.ts |
| `life.dress` | Shopping (Wardrobe), Home | `wear.put_on`, `wear.take_off`, `wear.outfit`, `wear.leave_in_it`, `wear.clean`, `wear.save_look` | Yes | tests/wardrobe.test.ts, tests/scene-definitions.test.ts |
| `life.jeweller` | The City, a jeweller's door | `jewel.look`, `jewel.commission`, `jewel.approve`, `jewel.collect`, `jewel.cancel` | Yes (it collects what is paid for; it never orders for you) | tests/jewellery.test.ts |
| `life.costumier` | The City, a costume house's door | `costume.look`, `costume.commission`, `costume.approve`, `costume.fitting`, `costume.collect`, `costume.cancel`, `costume.alter` | Yes (it stands for a fitting already due and collects what is paid for; it never orders for you) | tests/costume.test.ts |
| `life.run` | Wellbeing | `go.to`, `life.do_activity` | Yes | tests/scene-definitions.test.ts |
| `vehicles.dealer` | Vehicles market, The City | `go.to`, `deal.open`, `deal.inspect`, `deal.test_drive`, `deal.set_terms`, `deal.offer`, `deal.walk_away`, `deal.sign`, `veh.purchase`, `ins.quote`, `ins.purchase` | Yes | tests/dealership.test.ts |
| `rel.date` | Home decision, Calendar, Relationships | `life.shower`, `shop.purchase`, `go.to`, `date.check_in`, `date.beat`, `date.close`, `date.finish` | Yes | tests/dating.test.ts |
| `property.viewing` | Home decision, Calendar, Property market | `viewing.arrive`, `viewing.look`, `viewing.ask`, `prop.make_offer` | Yes (`viewing.summary` is the same seeing without the scene) | tests/viewing.test.ts |
| `property.counter` | Home decision, Property offers | `prop.respond_to_counter` | Yes | tests/purchase.test.ts |
| `property.inspection` | Home decision, Property offers | `prop.inspection_walk`, `prop.inspection_decision` | Yes | tests/purchase.test.ts |
| `property.closing` | Home decision, Calendar, Property offers | `prop.close`, `prop.postpone_closing`, `prop.walk_from_closing`, `prop.move_in` | Yes | tests/purchase.test.ts |
| `property.movein` | Home decision, Calendar, Property owned | `prop.move_in`, `prop.furnish_room` | Yes | tests/purchase.test.ts |
| `health.visit` | Home decision, Calendar, Health | `health.check_in`, `health.consult`, `health.pay`, `health.book` | Yes (`health.attend` is the same visit without the scene) | tests/care.test.ts |
| `travel.flight` | Home decision, Calendar, Travel bookings | `travel.pack`, `travel.to_airport`, `travel.check_in_flight`, `travel.board`, `travel.inflight`, `travel.claim_bags`, `travel.to_hotel` | Yes (`travel.fly` is the same day by its defaults) | tests/journey.test.ts |
| `social.compose` | Social | `social.create_post` | Yes | tests/compose.test.ts |

The runtime (`scene.start`, `scene.choose`, `scene.skip`, `scene.quick`,
`scene.leave`, `scene.resume`) is held by tests/scenes.test.ts: revisions,
idempotent commits, one foreground scene, save and reload mid-scene,
interruption on leaving the city or the place, free text resolved offline.

### What asks on Home

A decision is raised by the engine, carries the actions the owning system
handles (`world.take_decision_action`, `world.dismiss_decision`), and is
resolved by the system, never by the click that opened it. Today the
engine asks about: a plan coming due; a date coming round; a flight three
hours before it leaves, a missed flight to rebook, and a lost bag to claim
for; an appointment coming round, an unpaid medical bill, and results that
want another look; a showing coming round; a seller's counter, an inspection report, closing day and
moving day on a home you are buying; a salesperson calling back about a car; insuring something
you have just bought, or telling your insurer about a part; a car due for
service, not road legal, or failed at inspection; registration overdue; a
bill unpaid, a medical bill unpaid, or taxes owed; a service you cannot
pay for; a property inspection's findings (`prop.inspection_decision`) and
a counter-offer (`prop.respond_to_counter`); a construction change order
(`build.decide_change_order`), a stalled project or one that cannot be
funded; a company that cannot make payroll; a birthday; a brand deal
(`social.respond_to_deal`); and the tutorial (`tutorial.*`). Notifications
(`world.mark_read`) are the record of what happened without you.

## The connected journeys the directive names

| Journey | State | The path | Interruptions, failures, subsequent visits |
| --- | --- | --- | --- |
| Gym: plan → venue → pass → workout with choices → wellbeing → follow-up | Implemented | `plan.create` → decision → `fitness.gym` → soreness, recovery scheduled (`fitness.recovery`), the plan marked attended by the scene finishing | Too tired, no pass, closed, displaced by travel, walked out mid-workout, missed past its window (`plan.lapse`), a second visit where the trainer remembers your goal |
| Car: inspect, buy, insure, collect, use | Implemented | `vehicles.dealer` → `deal.sign` → `deal.delivery` → the car in hand → `veh.drive`, `place.refuel`, `veh.book_service`, `veh.book_modification`, `veh.sell` | Closed lot, lowball refused, a final price, under water on a trade-in, no funds, walked away and called back (`deal.callback`), cooling-off, expiry (`deal.expire`), a second visit that is a second visit, the lender's refusal shown on the finance line |
| Date: arrange and attend | Implemented | `rel.ask_out` with activity, place and time → `rel.date` due → decision → `rel.date` scene → `date.finish` is the only thing that changes the relationship → `date.follow_up` three days on | Late, not coming, stood up (`date.lapse`), cancelled on the day with or without notice (`date.cancel`), moved (`date.reschedule`), skipped (`date.skip`), left early, a promise at the door kept or broken |
| Home: view, offer, counter, inspect, appraise, close, move in, furnish | Implemented | `prop.book_showing` → `prop.showing` → `property.viewing` → `prop.make_offer` → `prop.offer_response` → `property.counter` (`prop.respond_to_counter`, `prop.counter_lapse`) → `prop.inspection` → `property.inspection` (`prop.inspection_decision`, `prop.inspection_lapse`) → `prop.appraisal` → `prop.closing` → `property.closing` (`prop.close`, `prop.postpone_closing`, `prop.walk_from_closing`, `prop.closing_lapse`) → `prop.moving_day` → `property.movein` (`prop.move_in`, `prop.furnish_room`) | Lapsed, skipped, away in another city, no money for any offer, thanked and left, a second visit greeted as one, a missed one held against you; a counter left unanswered (withdrawn, deposit back), the seller's two rounds, a lender's refusal on a number, an inspection walked or read from another city, walked away from, waived by silence; an appraisal you can carry (the gap on the table) and one you cannot (the purchase ends, deposit back); a closing you are short at, delayed once, walked from (deposit forfeited), never came to (deposit forfeited), or declined by the lender at the table; moving day left for later; a room you cannot afford. **Gap:** selling a home you own is a command without a scene. |
| Social: create content with reactions | Implemented (scene and reactions) / Partial (consequences) | `social.compose` → `social.create_post` → `social.publish` → `social.reactions` a day on → the post row and a notification | Not enough energy for the long version, a format the platform refuses, start again from the review, a flop. **Gap:** consequences beyond followers, momentum and brand deals (`social.respond_to_deal`, `social.deal_deadline`) are not modelled. |
| Health: book, attend, be seen, pay, collect, follow up | Implemented (beyond the six named) | `health.book` → `health.appointment` → `health.visit` (`health.check_in`, `health.consult`, `health.pay`) or `health.attend` → `health.results` → `health.fill_prescription` → `health.dose` → follow up booked | Late by an hour (no-show, fee, the doctor remembers), skipped (`health.skip`), away in another city, a card the practice does not take, no card, short at the desk (the bill asks), the wrong door for the complaint, tests that want another look, a prescription left uncollected (`health.rx_lapse`) |
| Travel: book, pack, get there, check in, the gate, the air, the carousel, the hotel | Implemented (beyond the six named) | `travel.book_flight` → `travel.depart` → `travel.flight` (`travel.pack`, `travel.to_airport`, `travel.check_in_flight`, `travel.board`, `travel.inflight`, `travel.claim_bags`, `travel.to_hotel`) or `travel.fly` → `travel.arrive` → `travel.check_in` | Never went (`travel.gate_closes`, the fare's rules), stayed home (`travel.no_show`), away in another city, late to the airport, an airline cancellation rebooked at no cost, a delay that moves the arrival, a bag lost and returned (`travel.bag_returned`) with a claim under travel cover, a room not ready, a flight moved for the fee (`travel.change_flight`), rebooked after a miss (`travel.rebook`) |
| Film/TV: prepare for and carry out an obligation | Blocked (dependency) | — | There is no production or shoot-day pipeline in this tree to put the player on a call sheet; `work.project` is a script-read calculator. The company engine (task 38) is the dependency. No scene is claimed. |

## Feature areas and subfeatures

### World

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Places of 23 kinds in every city, with hours, prices, journeys | Implemented | `src/engine/content/places.ts`, `place.visit`, `go.to` | `/world`, `/workspace/city` | tests/places.test.ts, tests/navigation.test.ts | — |
| Enter and act: order, refuel, book a room, photograph, run into people | Implemented | `place.order`, `place.refuel`, `place.book_room`, `place.hygiene_tick` | Right Here actions | tests/places.test.ts | — |
| Talk to the person there as a scene | Partial | `vehicles.dealer`, `property.viewing`, `property.inspection`, `property.closing` | Look At The Cars, View It Now, the inspector at the kerb, the escrow table | tests/dealership.test.ts, tests/viewing.test.ts, tests/purchase.test.ts | Restaurants, shops, salons, hotels and the rest have no conversation scene |
| Return with consequences | Partial | Salesperson, agent, inspector and closer facts in `src/engine/systems/memory.ts`; trainer facts | Second visits | tests/memory.test.ts, tests/purchase.test.ts | Other places do not remember you |
| Real places | Partial, labelled | `REAL_PLACES` (landmarks) and `REAL_GYMS` in 13 cities, each stating public record only | The City, help panel reads the count from the data | tests/places.test.ts, tests/fitness.test.ts | Everything else is SLATE's own and says so |
| Geography: 252 countries, 3,865 regions, 170,911 cities; time zones; one world clock | Implemented | `src/engine/content/geography.ts`, `src/engine/core/time.ts`, `world.tick`, `world.day_rollover` | Everywhere | tests/geography.test.ts, tests/world-map.test.ts, tests/time.test.ts, tests/realclock.test.ts | — |
| Weather | Implemented, labelled as a climate model | `src/engine/systems/weather.ts` | Home | tests/weather.test.ts | Not a forecast service, and says so |

### Calendar

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Entity-specific detail with owning-system actions | Implemented | `plan.*`, `date.*`, `health.reschedule`, `finance.pay_bill`, `viewing.*` | `/workspace/calendar` | tests/calendar.test.ts, tests/plans.test.ts, tests/dating.test.ts, tests/viewing.test.ts | — |
| Personal plans: create, move, cancel, skip, attend, reminders, lapse | Implemented | `plan.create`, `plan.reschedule`, `plan.cancel`, `plan.skip`, `plan.attend`, `plan.personal`, `plan.reminder`, `plan.lapse` | Plan Something | tests/plans.test.ts | — |
| Distinct states: planned, attended, skipped, missed, cancelled | Implemented | plans, dates (`DATE_STATUS_LABEL`), showings | Calendar, Dates panel | tests/plans.test.ts, tests/dating.test.ts | — |
| Public holidays for every country; award shows, festivals, fan events | Implemented | `src/engine/content/holidays.ts`, events data | Calendar observances | tests/holidays.test.ts | — |
| Invitations and RSVPs between people beyond a date | Not started | — | — | — | — |
| Travel preparation prompts | Not started | — | — | — | — |
| Routines (a recurring plan) | Not started | — | — | — | — |

### Wellbeing and life

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Energy, stress, sleep, hygiene, readiness including soreness | Implemented | `life.sleep`, `life.shower`, `life.eat`, `life.cook`, `life.day_rollover` | `/workspace/wellbeing`, Home | tests/systems.test.ts, tests/full-life.test.ts | — |
| Every activity playable with choices, resources, time, results | Implemented | `wellbeing.activity`, `life.run`, `life.do_activity` | Play It Out on each | tests/scene-definitions.test.ts | Cooking keeps its recipe flow, no scene of its own |
| Meals out, played as a room | Implemented | `life.meal`, `dine.arrive`, `dine.wait`, `dine.order`, `dine.settle`, `staffOf`, `standingAt` | The City, the scene panel | tests/dining.test.ts, tests/scene-definitions.test.ts | Booking a table ahead is not built; company at the table goes through the quick order rather than the scene |
| The door: a host who knows your face, a quoted wait, a table by your standing, and a walkout they remember | Implemented | `waitFor`, `tableFor`, `standingAt`, `dine.leave`, `MAX_WAIT_MINUTES` | The Door, A Wait | tests/dining.test.ts | The queue ahead of you is a quoted number, not named parties |
| The order and the bill: a server with a recommendation, service added at a table, the tip yours to set, and both remembered | Implemented | `dine.order`, `dine.settle`, `billFor`, `SERVICE_SHARE`, `TIP_SHARES`, `tallyFact` | The Menu, The Bill | tests/dining.test.ts | A counter pays with the order and has no tip line |
| A counter that takes the money with the order, and a table that does not | Implemented | `serviceOf`, `dine.order` | The Counter | tests/dining.test.ts | — |

### Gyms and fitness

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Search, facilities, hours, tiers, prices | Implemented | `src/engine/content/fitness.ts` | The City | tests/fitness.test.ts | — |
| Passes, memberships, renewal, lapse, cancellation | Implemented | `gym.buy_pass`, `gym.cancel_membership`, `gym.membership_end`, bills | Front desk in the scene | tests/fitness.test.ts | Freezes, guest passes, multi-site chains not modelled |
| Check-in, classes, trainers, blocks, cooldown, recovery | Implemented | `gym.check_in`, `gym.take_class`, `gym.hire_trainer`, `gym.train_block`, `gym.finish_workout`, `fitness.recovery` | `fitness.gym` | tests/fitness.test.ts, tests/scene-definitions.test.ts | Equipment choice within an exercise not modelled |
| Every relevant real gym worldwide | Blocked (data) | 25 real gyms in 13 cities, public record only | Help panel states the count | tests/fitness.test.ts | A worldwide venue catalogue needs a licensed feed |

### Health and education

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Providers, appointments, booking, moving, cancelling with conflict checks | Implemented | `health.book`, `health.reschedule`, `health.cancel`, `health.appointment` | `/workspace/health`, Calendar | tests/calendar.test.ts | — |
| The visit: the desk and the card, the wait, what brought you in, the exam, the bill, the follow up | Implemented | `health.appointment_due`, `health.lapse`, `health.check_in`, `health.consult`, `health.pay`, `health.attend`, `health.skip`, `health.visit` | `/workspace/health`, Calendar, Home | tests/care.test.ts | — |
| Tests and results; prescriptions collected, taken, finished or lapsed | Implemented | `health.results`, `health.fill_prescription`, `health.dose`, `health.rx_lapse` | Health, Home | tests/care.test.ts | — |
| The provider as a person who remembers you | Implemented | `doctorOf`, facts in `src/engine/systems/memory.ts` | Second visits | tests/care.test.ts | — |
| Courses, enrolment, sessions, completion | Implemented | `edu.enroll`, `edu.drop`, `edu.session` | `/workspace/education` | tests/systems.test.ts | — |

### Relationships and dating

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Persistent relationships with seven dimensions; meet, interact, define, gift, propose, wedding, family, end | Implemented | `rel.meet`, `rel.interact`, `rel.define`, `rel.give_gift`, `rel.propose`, `rel.plan_wedding`, `rel.have_child`, `rel.intimacy`, `rel.end`, `rel.drift`, `rel.birthday`, `rel.anniversary`, `rel.wedding` | `/workspace/relationships` | tests/systems.test.ts, tests/full-life.test.ts | — |
| Asking out with activity, place and time; the date as a record with states | Implemented | `rel.ask_out`, `rel.date`, `date.*` | Ask Out dialog, Dates panel | tests/dating.test.ts | — |
| The date played, in their own voice | Implemented | `rel.date` scene, dating dialogue section | Home, Calendar, Relationships | tests/dating.test.ts, tests/dialogue.test.ts | — |
| NPC memory: facts, weighted, expiring, bounded | Implemented | `src/engine/systems/memory.ts` | Second visits | tests/memory.test.ts | Only trainers, salespeople, dates, agents, inspectors, closers and doctors write facts |
| The in-game Raya: onboarding, profiles, discovery, matches, conversations, privacy, membership | Not started | — | — | — | A separate implementation; nothing claims parity with the real app |

### Banking and money

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Accounts, transfers, bills, loans, debt, credit, tax, month close | Implemented | `finance.open_account`, `finance.transfer`, `finance.create_bill`, `finance.pay_bill`, `finance.take_loan`, `finance.pay_debt`, `finance.bill_due`, `finance.month_close`, `finance.tax_year` | `/workspace/bank` | tests/money.test.ts, tests/integrity.test.ts | — |
| Ledger conservation and idempotent money | Implemented | `sim.execute` idempotency keys, `src/engine/core/ledger.ts` | — | tests/integrity.test.ts, tests/endurance.test.ts | — |
| Company draw, rate, overhead, brief | Partial | `co.found`, `co.set_draw`, `co.set_rate`, `co.change_shape`, `co.read_brief`, `co.draw`, `co.overhead` | Locked workspace | tests/shingle.test.ts | The company engine is task 38 |
| Cards, statements, scheduled payments, fees, limits, premium products | Implemented | See Banking below: `bank.open`, `closeCardCycle`, the real cards in `content/wealth.ts` | Bank | tests/banking.test.ts, tests/wealth.test.ts | Pending versus posted is not modelled |
| International and offshore accounts | Implemented (home currency) | `bank.apply_private`, `bank.private_open`, `PRIVATE_BANKS` | Bank, Private Banking | tests/wealth.test.ts | The account is booked abroad and reported; it is held in the home currency, and nothing converts |

### Property

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Listings refreshed every ten days; market drift | Implemented | `prop.refresh_listings`, `prop.market_tick` | `market` tab | tests/calibration.test.ts, tests/endurance.test.ts | — |
| Showings booked, asked about, played, looked around, skipped, lapsed, missed | Implemented | `prop.book_showing`, `prop.showing`, `viewing.arrive`, `viewing.look`, `viewing.ask`, `viewing.summary`, `viewing.skip`, `viewing.lapse` | Property market, Calendar, Home | tests/viewing.test.ts | — |
| Offers, the seller's answer, the counter as a call, two rounds, a lapse | Implemented | `prop.make_offer`, `prop.offer_response`, `prop.respond_to_counter`, `prop.counter_lapse`, `property.counter` | `offers` tab, Home decisions | tests/purchase.test.ts | The counter is one round of numbers per call, not a haggle |
| Inspection: findings by severity, walked or read, money off, walking away, silence as a yes | Implemented | `prop.inspection`, `prop.inspection_walk`, `prop.inspection_decision`, `prop.inspection_lapse`, `property.inspection` | `offers` tab, Home decisions | tests/purchase.test.ts | — |
| Appraisal a week before closing; the gap carried or the purchase ended | Implemented | `prop.appraisal` | `offers` tab, Calendar | tests/purchase.test.ts | — |
| Closing day: the table, the numbers, sign, one delay, walk and forfeit, no-show and forfeit, remote signing | Implemented | `prop.closing`, `prop.close`, `prop.postpone_closing`, `prop.walk_from_closing`, `prop.closing_lapse`, `property.closing` | `offers` tab, Calendar, Home decisions | tests/purchase.test.ts | — |
| Moving in: the old lease ended, moving day asks, the rooms | Implemented | `prop.move_in`, `prop.moving_day`, `property.movein` | `owned` tab, Calendar, Home decisions | tests/purchase.test.ts | — |
| Renting, listing for sale | Implemented | `prop.rent`, `prop.list_for_sale` | `owned`, `market` | tests/full-life.test.ts | — |
| Building from land; change orders | Implemented | `build.start`, `build.phase_tick`, `build.decide_change_order` | `build` tab | tests/systems.test.ts | — |
| Rooms, zones, furnishing; every market home has the rooms its listing described | Implemented | `prop.add_room`, `prop.add_zone`, `prop.buy_furnishing`, `prop.finish_room`, `prop.furnish_room` (one priced commit per room), `ensureInterior` | `interiors` tab, `property.movein` | tests/purchase.test.ts, tests/systems.test.ts | — |
| 100 distinct real homes per market with provenance | Blocked (data) | Procedural homes labelled SLATE's | Market rows | — | Needs a licensed listings feed with as-of dates |

### Vehicles

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Six lots per city as places (three car lots, the motorcycle dealer, the boat yard, the aircraft broker); each stocked with its own kind every fortnight | Implemented | `src/engine/content/places.ts` (dealership, `sells`), `veh.refresh_inventory`, `dealerPlaceFor` | `market` tab by lot, The City (Look At The Cars, Bikes, Boats, Aircraft) | tests/dealership.test.ts, tests/fleet.test.ts | — |
| Marinas and storage yards as places: eight real harbours named from the public record where a city has one, SLATE's own elsewhere and only where there is water; a storage yard in every city | Implemented | `src/engine/content/places.ts` (`marina`, `storage`, `isWaterfront`, `maxSlipFeet`) | The City, Errands | tests/keeping.test.ts | The harbor and its name are public record; slip counts, sizes and every rate are SLATE's |
| Real motorcycles, boats and private aircraft as owned assets: public-record makes and models, SLATE's own prices and figures, each kind with its own craft figures (top speed, length, berths, seats, range, runway) | Implemented (names) / Blocked (data) | `KIND_PROFILE`, `CraftSpec`, `kindOf`, `craftOf` in `src/engine/content/vehicles.ts`; 24 motorcycles, 20 boats, 14 aircraft | Garage cards and listing rows by kind, with the calibration note | tests/fleet.test.ts | Real per-market inventory with provenance needs a licensed feed, as for cars |
| Looked over, taken out and talked about as what it is: kind-specific findings and repairs, a ride, a sea trial or a demonstration flight, a trade-in of the same kind only, delivery to a berth or a ferry flight, no lease on a boat | Implemented | `findingsFor`, `impressionOf`, `tradeInCandidates(kind)`, `kindFact`; `WORDS` in `src/engine/scenes/dealer.ts`; kind lines in `src/engine/dialogue/chunks/vehicles.ts` | `vehicles.dealer` | tests/fleet.test.ts | — |
| Hours rather than miles on a boat or an aircraft; a berth or a hangar and crew billed monthly until sold; service intervals, wear and value by kind; a day on the water with fuel, weather and wellbeing | Implemented | `ensureUpkeep`, `addMileage`, `revalue`, `serviceEstimate`, `veh.cruise`, `vehicle.cruised` | Garage (Berth, Hangar And Crew, A Day On The Water), Bank bills | tests/fleet.test.ts | A boat trip is a command with effects, not a played scene |
| The wheel wants a license: no valid license, no car to drive across town or between cities, and the scenes that pick a way to get somewhere call a cab instead; nobody quotes motor cover without one | Implemented | `licenseCheck`, `licenseValid`; `travel.drive`, `go.to`, `driveableVehicle` | The City, Travel, the license reason at the wheel | tests/papers.test.ts | A foreign license drives anywhere; the exchange is offered, not enforced |
| Your own aircraft through private travel: flown at what it costs to run, checked against range and runway, waits for a late passenger, lands where you do and stays there | Implemented | `travel.charter_private` with `vehicleId`, `ownedAircraftOptions`, `CREW_HOLD_HOURS`; `arriveFlight` moves the aircraft and logs the hours | Travel `private` tab (Your Own Aircraft), Garage (Fly It), Home (Go To The Aircraft) | tests/fleet.test.ts | The private flight is the short day (`travel.fly`), not the played airline scene |
| Parts made for each kind, with fitment by kind, body style and prerequisites: 20 for motorcycles, 20 for boats, 15 for aircraft, none of them a car's | Implemented | `PartFitment.kinds`, `checkFitment`, `partsFor`; range and top-speed effects through `craftOf` | `modify` tab | tests/fleet.test.ts, tests/systems.test.ts | — |
| Where each thing is kept: a home garage with the spaces its kind, features and built structures give it (a motorcycle takes half, a trailered boat takes two), the driveway, the street, a paid unit; a marina berth by the foot where the marina has a slip that long, a dry stack, a trailer at home, a private dock; a private or shared hangar, a tie-down, or a foreign ramp | Implemented | `src/engine/systems/storage.ts`: `KeepingKind`, `keepingOptions`, `defaultKeeping`, `placeVehicle`, `applyKeeping`, `homeSpaces`, `garageSpacesOf`, `dockFeetOf`, `slipsAt`, `stor.keep` | Vehicles At Home panel, Kept At on every card, Move It, Property garage and dock | tests/keeping.test.ts | — |
| The queue for a slip when a marina is full at your length: your name down for a deposit, a place in the line, slips that come free month by month at a rate the band turns over at, a call that holds the slip a week, and the back of the queue if you let it go or say nothing | Implemented | `BerthWaitlist`, `stor.join_waitlist`, `stor.leave_waitlist`, `stor.take_slip`, `stor.pass_slip`, `stor.offer_lapse`, `advanceWaitlists`, `waitMonths` | Waiting For A Slip panel, Put Your Name Down and Take The Slip in the move sheet, the call on Home | tests/keeping.test.ts | Other owners' boats are still a seeded share, so the queue ahead of you is a number rather than named people |
| What keeping costs and does: a monthly bill that ends when it moves or sells, condition lost standing outside, a premium that falls in a garage and rises on the street, a ramp fee and the time to launch a trailered boat, nightly ramp fees away from home while the hangar is still paid | Implemented | `applyKeeping` bills, `monthlyExposure`, `INSURANCE_FACTOR`, `settleTransient`, `RAMP_FEE` in `veh.cruise` | Bank bills, the quote, the garage card | tests/keeping.test.ts | — |
| Placement that happens on its own: bought things are put away, moving home moves the cars and says when one loses its cover, a landing aircraft goes to its hangar at home or a ramp away | Implemented | `storage.place`, `storage.rehome`, `storage.landed` listeners on `vehicle.purchased`, `prop.moved_in`, `vehicle.relocated` | Notifications | tests/keeping.test.ts | — |
| A crew retainer separate from where the thing sleeps: a crewed yacht or any aircraft pays people whether or not it moves | Implemented | `crewFor`, `ensureCrew`, `CraftSpec.crewMonthly` | Crew on the garage card, Bank bills | tests/fleet.test.ts, tests/keeping.test.ts | — |
| A name on a tail or a transom, the way an owner names a jet | Implemented | `veh.name`, `Vehicle.nickname` | Name It on the garage card, the card's title, the Travel row, the flight's own name | tests/keeping.test.ts | — |
| Salesperson who remembers you; inspection, test drive, rounds against a hidden floor, final price | Implemented | `deal.open`, `deal.inspect`, `deal.test_drive`, `deal.offer`, `deal.set_terms`, `deal.walk_away`, `deal.sign`, `deal.callback`, `deal.expire` | `vehicles.dealer`, On The Table | tests/dealership.test.ts | — |
| Cash, finance, lease through the loan book; the lender's refusal shown | Implemented | `veh.purchase`, `financeRefusal` | Terms step | tests/dealership.test.ts | — |
| Trade-in that comes off what you owe | Implemented | `tradeInAllowance` | Trade-in step | tests/dealership.test.ts | — |
| Delivery as a calendar item; not in hand until it arrives; agreed repairs | Implemented | `deal.delivery`, `applyDealerRepairs` | Delivery chip | tests/dealership.test.ts | — |
| Registration fees, depreciation, insurance from the same chair | Implemented | `veh.registration_due`, `veh.depreciate`, `ins.quote`, `ins.purchase` | Garage | tests/dealership.test.ts, tests/systems.test.ts | — |
| Use, fuel, service, modification, resale | Implemented | `veh.drive`, `place.refuel`, `veh.book_service`, `veh.service_appointment`, `veh.book_modification`, `veh.install_parts`, `veh.remove_modification`, `veh.sell` | `garage`, `service`, `modify` | tests/driving.test.ts, tests/systems.test.ts | — |
| 100 distinct real vehicles per market with provenance | Blocked (data) | Real makes and models across four kinds, with SLATE's own figures, labelled | Listings | — | Needs a licensed dealer inventory feed |

### Shopping

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Purchase, delivery, returns, wardrobe, outfits, selling assets, pantry | Implemented | `shop.purchase`, `shop.deliver`, `shop.return`, `shop.save_outfit`, `shop.sell_asset`, `shop.pantry_expiry` | `/workspace/shopping` | tests/systems.test.ts, tests/full-life.test.ts | — |
| A shop you walk into: a storefront per chain in every city it operates in, keyed to the chain so no id moves | Implemented | `placesIn` storefronts, `Place.retailerId`, `retailerAt` | Shops You Can Walk Into, The City | tests/dining.test.ts | Online only chains have no door, which is the point |
| The floor: somebody on it who knows your face, a rail that changes with the fortnight, and a price before tax | Implemented | `assistantAt`, `stockAt`, `retail.enter`, `retail.handle`, `standingAt` | The Floor | tests/dining.test.ts | Stock is a seeded sample of the chain's catalogue, not a modelled inventory with counts |
| The fitting room: a verdict on the fit, once per thing, and a size they may not have | Implemented | `retail.try_on`, `fitOf`, `FITTABLE`, `VERDICT_LABEL` | The Fitting Room | tests/dining.test.ts | No alterations, no ordering your size in from another branch |
| The counter: the basket priced before you say yes, then charged through the one purchase engine, in store, once | Implemented | `retail.quote`, `retail.pay` wrapping `shop.purchase` with an idempotency key | The Counter | tests/dining.test.ts | The quote is before tax; the till adds what the jurisdiction wants |
| Walking out with nothing, and a floor that remembers a browser from a buyer | Implemented | `retail.walk_out`, `standingFlags`, `tallyFact` | Leave With Nothing | tests/dining.test.ts | — |
| 100 real branded products per category | Implemented | `src/engine/content/goods.ts` (1,562 real products, at least 100 in each of fourteen aisles), `src/engine/content/brands.ts` (99 real chains) | `shop` tab, Shops You Can Walk Into, the shop scene | tests/catalogue.test.ts | Brand and product are public record; price, quality, wear and nourishment are SLATE's calibration and say so. Live per-branch stock and today's price need a licensed retail feed and are not claimed. Variants are still not counted as products |
| Real chains in the markets they really trade in | Implemented | `REAL_RETAILERS`, `tradesIn`, storefront generation in `placesIn` | The City Shops tab, Shopping | tests/catalogue.test.ts, tests/dining.test.ts | Which countries a chain trades in is public record; whether a branch stands in a particular SLATE city is a calibration from that market and the city's size |
| Nothing invented left on a shop floor, nothing old broken | Implemented | `legacy` flag on twelve retailers and eighty-five items, `shoppableRetailers`, `shoppableItems`, `isLegacyItem` | — | tests/catalogue.test.ts | Old saves still resolve every id they own |

### Wardrobe and getting dressed

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Getting dressed slot by slot, from what you actually own | Implemented | `life.dress`, `wear.put_on`, `wear.take_off`, `SLOTS`, `wardrobeView`, `inSlot` | Wardrobe tab, the dressing scene | tests/wardrobe.test.ts | Layering within one slot is one garment at a time; no half tucked, sleeves rolled or unbuttoned |
| Colour and material that can clash, and a mirror that tells you before you leave | Implemented | `appraise`, `COLOURS`, `MATERIALS`, `colourNotes`, `guessMaterial`, `verdictLabel` | The Mirror, the dressing scene | tests/wardrobe.test.ts | The rules are the conventional ones: brown shoes under black tailoring, belt and shoes disagreeing, mixed metals, too many loud colours. Fashion that breaks a rule on purpose still reads as a mistake |
| A dress code per occasion, checked against what you have on | Implemented | `DRESS_CODES`, `OCCASION_CODE`, `codeFor`, `appraise` verdict and `code` | The dressing scene, Where Are You Going | tests/wardrobe.test.ts | Thirteen codes, from Around The House to White Tie. A venue's own stated code is not read yet; the occasion sets it |
| Warmth against the weather, and the wrong coat noticed | Implemented | `warmthOf`, `MATERIALS` warmth, `hatesRain`, `appraise` weather notes | The Mirror | tests/wardrobe.test.ts | Weather is the city's band for the day, not an hourly forecast |
| Clothes that wear, soil, and go to the cleaner | Implemented | `WEAR_PER_OUTING`, `SOIL_PER_OUTING`, `NEEDS_WASHING`, `wear.clean`, `awayUntil`, `dryCleanOnly` | Wardrobe tab, the dressing scene | tests/wardrobe.test.ts | A home wash is free and same day; a dry cleaner costs and keeps the thing for days. No repairs, no tailoring, no lost tickets |
| A world that remembers what you wore, and notices you wearing it again | Implemented | `WornRecord`, `wear.leave_in_it`, `recentRepeat`, `REPEAT_WINDOW_DAYS` | The Mirror | tests/wardrobe.test.ts | The repeat only bites when the earlier outing was photographed |
| Saved looks, put back on in one go | Implemented | `wear.save_look`, `wear.outfit`, `Outfit.timesWorn` | Saved Looks | tests/wardrobe.test.ts | A saved look does not warn you that a piece of it is at the cleaner until you try to wear it |
| A men's side and a women's side to the whole wardrobe | Implemented | `audience` on every wardrobe row, `content/audience.ts`, `preferenceOf`, `shows`, `wear.set_preference` | Shopping (the Showing row), the shop floor | tests/audience.test.ts | It decides what a shop leads with and nothing else: everything stays buyable, everything stays wearable, and Everything is one button. The split follows how the houses themselves merchandise a piece; anything not split by cut is offered to everybody |
| A hundred real products for each headline brand | Implemented (seventy six brands so far) | `content/sneakers.ts` (Nike 128, Jordan 105, Adidas 118, New Balance 111), `content/sportswear.ts` (Under Armour 107, Puma 111, Reebok 107, Asics 110, Converse 108, Vans 109), `content/labels.ts` (Louis Vuitton 106, Gucci 113), `content/houses.ts` (Prada 113, Dior 127, Chanel 113, Hermès 121, Balenciaga 108, Saint Laurent 109, Bottega Veneta 105), `content/maisons.ts` (Versace 114, Fendi 103, Celine 111, Loewe 103, Burberry 107, Ralph Lauren 108, Givenchy 103, Valentino 109), `content/kit.ts` (ARRI 115, RED 104, Sony 107, Canon 101, Blackmagic Design 111, Aputure 101, MAC Cosmetics 106), `content/ice.ts` (Icebox 131, King Ice 120), `content/horology.ts` (Rolex 117, Patek Philippe 103, Audemars Piguet 101, Omega 105, Cartier 118, Tiffany & Co. 108, Bulgari 104, Van Cleef & Arpels 104), `content/outfitters.ts` (Moncler 105, Stone Island 104, The North Face 104, Canada Goose 102, Levi’s 109, Carhartt 103, Patagonia 109, Uniqlo 107), `content/highstreet.ts` (Zara 121, H&M 118, COS 113, Mango 107, Gap 108, Massimo Dutti 111, Muji 106, Marks & Spencer 108), `content/shoemakers.ts` (Christian Louboutin 108, Jimmy Choo 103, Manolo Blahnik 101, Dr. Martens 104, Birkenstock 103, Clarks 102, Timberland 105, UGG 107), `content/quiet.ts` (Tom Ford 103, Zegna 100, Loro Piana 102, Brunello Cucinelli 102, The Row 101, Acne Studios 102, Church’s 105, Crockett & Jones 108); `tools/brand-depth.mjs` in the gate | Shopping, the shop floor | tests/maisons.test.ts, tests/audience.test.ts | Seventy six of the big names are at a hundred or more and the gate fails if one drops below. The other 1,375 of the 1,451 brands are not there yet and the checker prints that count rather than the docs claiming otherwise. Colorways are listed only where the release is its own product, never to inflate a count |
| A hundred real things in each of the four aisles that were missing | Implemented | `content/intimates.ts` (438 products: men's and women's underwear and socks), `content/adornment.ts` (421 products: men's and women's earrings, necklaces and chains) | Shopping, the shop floor, the wardrobe | tests/audience.test.ts | Brand and product line are public record; price, quality and wear are SLATE's calibration. Which colourways and sizes a branch actually holds still needs a licensed feed |
| Earrings, a chain, a ring and a bracelet worn at the same time | Implemented | `SLOTS` split into `earrings`, `necklace`, `ring`, `bracelet`, `jewellerySlotFor`, schema 44 migration | The dressing scene, Wardrobe | tests/audience.test.ts, tests/wardrobe.test.ts | One piece per peg. Stacked rings and a second bracelet on the same wrist are not modelled. Pieces that are none of the four, like cufflinks, keep the general jewellery peg |
| Colourways on the shop floor, so what you buy has a colour | Implemented | `colourwaysFor`, `COLOURWAYS`, `retail.basket` colour, `shop.purchase` colours | The Floor, The Counter | tests/wardrobe.test.ts, tests/dining.test.ts | Four colourways a fortnight per garment, seeded from the chain and the item. Which colours a real product actually shipped in is not public data at this scale and is not claimed |

### Jewellers, and having a piece made

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| A jeweller you can walk into, in every city | Implemented | 51 real jewellery houses and chains in `content/brands.ts`, plus one independent bench per city (`PlaceKind` `jeweller`), `isJeweller`, `jewellerAt`, `standingAt` | The City, the jeweller scene | tests/jewellery.test.ts | The named houses and chains are real and trade where they really trade. The independent bench is SLATE's own, the way its restaurants are: there is no national chain of bench jewellers to name |
| Having something made: piece, metal, stone, grade, setting | Implemented | `life.jeweller` scene, `jewel.commission`, `Spec`, `PIECE_KINDS`, `METALS`, `STONES`, `CUTS`, `SETTINGS` | The jeweller scene | tests/jewellery.test.ts | Seventeen pieces, twelve metals, eighteen stones, twelve cuts, eleven settings. No sketching, no wax approval stage, and no choosing an individual stone from a parcel |
| Having a costume cut: garment, cloth, finish, label | Implemented | `life.costumier` scene, `costume.commission`, `Spec`, `GARMENT_KINDS`, `CLOTHS`, `FINISHES`, `content/costume.ts` | The costume house | tests/costume.test.ts | Twenty-four garment kinds, twenty-two cloths, nine finishes. No sketching stage, no separate toile approval, and no choosing an individual bolt off the shelf |
| Fittings, and what skipping them costs | Implemented | `costume.fitting`, `houseQuality`, `MISSED_FITTING_PENALTY`, scheduled `costume.fitting_due` | The costume house | tests/costume.test.ts | Up to three fittings per garment; every one missed takes nine points off the finished fit, and the record says so |
| Making a costume yourself | Implemented | `costume.make`, `readinessFor`, `selfQuality`, `selfHours`, `consumeCloth` | Shopping, at your own table | tests/costume.test.ts | Needs a machine you own and cloth you own, by the yard. Quality comes off your `costume_design` skill against the garment's difficulty. No pattern drafting, no grading, and no sizes other than your own |
| A tailor altering something you own | Implemented | `costume.alter`, `ALTERATIONS`, `wardrobe.fit` | The costume house | tests/costume.test.ts | Eight alterations a real tailor would do. Letting out is bounded by the allowance the maker left, and the garment carries a provenance line for every one |
| The second rank of houses, each a house rather than a rail | Implemented | `content/maisons.ts` (839 rows across Versace, Fendi, Celine, Loewe, Burberry, Ralph Lauren, Givenchy and Valentino); retailers `versace`, `fendi`, `givenchy`, `valentino` added to `content/brands.ts` beside the four that already existed | Shopping: the clothing, footwear and accessory rails, both racks | tests/maisons.test.ts | Each of the eight carries leather goods, shoes, ready to wear for men and for women, eyewear, belts and small leather goods, and the fragrances the house really sells. **Fendi carries no fragrance here**, because SLATE cannot vouch for a current Fendi scent and will not invent a bottle to fill a column; it sells more bags instead. Loewe's home candles and Ralph Lauren's Purple Label and RRL lines are named because they are the house's own. Every price, quality figure and wear rate is SLATE's calibration and says so on the row |
| The watchmakers and the jewelers at catalog depth | Implemented | `content/horology.ts` (736 rows across Rolex, Patek Philippe, Audemars Piguet, Omega, Cartier, Tiffany & Co., Bulgari and Van Cleef & Arpels); sold through the authorised dealers and boutiques already in `content/brands.ts` (Watches Of Switzerland, Bucherer, Wempe, Cartier, Tiffany, Bulgari, Van Cleef) | Shopping: the Watches and Jewelry rails | tests/maisons.test.ts | A watchmaker is held to a real spread of references (diver, chronograph, GMT, dress, complication) rather than one watch per family, and a jeweler to all four jewelry pegs plus the watches it really makes. The references that hold or gain value carry a negative depreciation and show as appreciating on the row, and the steel sports watches that trade above list carry a `grail` or `waitlist` tag. **A steel sports Rolex has a list price nobody can buy it at**; the number here is SLATE's calibration of what it costs to own one, and says so |
| The outfitters people actually own | Implemented | `content/outfitters.ts` (814 rows across Moncler, Stone Island, The North Face, Canada Goose, Levi’s, Carhartt, Patagonia and Uniqlo); sold through the shopfronts already in `content/brands.ts` (`moncler`, `stone_island`, `north_face`, `canada_goose`, `levis`, `carhartt`, `patagonia`, `uniqlo`) | Shopping: the clothing, footwear and accessory rails, both racks | tests/maisons.test.ts | These are not houses and are not measured like houses: nobody buys a fragrance from Carhartt. Each is held to what it is for. A coat maker carries at least twenty coats cut for winter, each name fills at least eight wardrobe pegs, and each sells accessories beside the clothes. **Patagonia and Uniqlo sell no shoes here**, because neither company runs a shoe line SLATE can point at, and an invented one would be a lie in a column. Levi’s is one company with one apostrophe: the test fails if a straight-quoted second Levi’s appears and sells the same 501s twice. Every price, quality figure and wear rate is SLATE’s calibration and says so on the row |
| The high street, deep enough to be a shop | Implemented | `content/highstreet.ts` (854 rows across Zara, H&M, COS, Mango, Gap, Massimo Dutti, Muji and Marks & Spencer); the shopfronts already in `content/brands.ts` | Shopping: the clothing, footwear, accessory, home and grocery rails; walking into any of the eight | tests/maisons.test.ts | These companies do not name their clothes the way a house does, so the pieces are named the way the shop names them, and only the lines that are real lines are named as lines: ZW Collection and Origins and Athleticz, Divided and Studio and Move, 1969 denim and GapFit and GapBody, Limited Edition, Autograph and Per Una and Goodmove and Jaeger. Each of the eight is held to a floor rather than a rail: both racks, at least seven wardrobe pegs, and the plain things nobody photographs, which is the underwear drawer and the sock drawer. **Muji is a homeware company that sells clothes and Marks & Spencer is half a food hall**, so Muji carries storage, bedding, kitchen and stationery, and Marks & Spencer carries Percy Pig and the Dine In counter. A man's linen shirt and a woman's linen shirt really are the same name in the same shop; the catalog cannot hold two, so each says which rack it hangs on |
| The shoemakers, measured by the shoes | Implemented | `content/shoemakers.ts` (823 rows across Christian Louboutin, Jimmy Choo, Manolo Blahnik, Dr. Martens, Birkenstock, Clarks, Timberland and UGG); new shopfronts `clarks_store`, `timberland_store` and `ugg_store` in `content/brands.ts` beside the five that already existed | Shopping: the Footwear rail and the shop floor of each | tests/maisons.test.ts | These houses name their shoes, so the name is the product: So Kate and Hangisi and Romy, the 1460 and the 2976, the Arizona and the Boston, the Wallabee and the Desert Boot, the Six Inch Premium, the Classic Ultra Mini. Each is held to at least twenty eight pairs across at least three kinds of shoe, every pair on the shoe peg. Beside the shoes each sells what the company really sells: Louboutin's Loubiworld scents and Rouge Louboutin counter, Jimmy Choo's fragrances, Timberland's clothes, UGG's blankets and sheepskin, and the polish, the laces and the protector spray every one of them keeps by the till. **Louboutin Beaute prints Colour on its own tubes**, so those three names are allowlisted rather than Americanized |
| The quiet floor, sold on cloth and last | Implemented | `content/quiet.ts` (800 rows across Tom Ford, Zegna, Loro Piana, Brunello Cucinelli, The Row, Acne Studios, Church’s and Crockett & Jones); the shopfronts already in `content/brands.ts` | Shopping: the clothing, footwear, accessory and home rails; the boutique floor of each | tests/maisons.test.ts | This is the half of luxury that puts no logo on anything, so it is measured on what it does sell: the cloth and the last. Baby cashmere and vicuña, Oasi and Storm System, Su Misura and 15milmil15, Solomeo's monili, and the Northampton lasts by name — Consul, Diplomat, Burwood, Audley, Pembroke, Islay, Chelsea 5. **Church’s and Crockett & Jones stay shoemakers**: a test fails if either grows a clothing rail or a fragrance, because neither sells one. Tom Ford's fragrance wardrobe and beauty counter are here because they are most of that company. Church’s nearly became two companies over an apostrophe, the way Levi’s did; the shopfront and the two older rows were normalized and a test now guards it |
| Who actually stocks what | Implemented | `stocks`, `stockistsFor`, `brandStanding`, `standingOf`, `houseBrandOf`, `isConsignment` in `content/catalog.ts`; `shoppingCatalogue` and the `shop.purchase` command in `systems/commerce.ts`; `assortmentAt` in `systems/retail.ts`; `tools/stockist-check.mjs` in the gate | Shopping: every buy control; the shop scene, walking a floor | tests/stocking.test.ts, tests/catalogue.test.ts | Before this, a shop that sold clothing sold every garment in the world: a discount chain listed a house's coat and a boutique with a brand over the door offered another company's socks. Two rules decide it now. A boutique or jeweler named for a brand sells that brand alone, across everything it makes, with Nike's own Jordan the single exception a real company earns. Everybody else carries their own standing and the one below it, standing being read off a brand's own median price, so the supermarket has the everyday names and the luxury floor has the houses. Resale and the saleroom carry what they really consign. The rule is enforced at the till as well as on the screen, so a basket built anywhere is refused if the shop would not have sold it. Groceries and furniture are untouched, and an original kept for an old save is never refused. **A brand's standing is SLATE's arithmetic on its own prices, not a published stock list.** In Los Angeles a piece is offered by about twelve shops rather than every shop in town; in a thinner market some pieces are simply not sold locally, and the checker prints how many |
| Real production kit: cameras, glass, stock, lighting, grip, sound, monitoring | Implemented | `content/kit.ts` (945 rows), categories `kit`, `makeup`, `haberdashery` | Shopping, the Production Kit, Makeup and Fabric And Notions racks | tests/costume.test.ts, tools/brand-depth.mjs | ARRI 115, RED 104, Sony 107, Canon 101, Blackmagic Design 111, Aputure 101, MAC Cosmetics 106. Panavision is rental only and carries a day rate rather than a purchase price, because the house does not sell. No rental house yet: kit is bought, not hired |
| Real airlines for every country in the geography | Implemented | `content/airlines.ts` (237 carriers, `SERVED_BY`, `NO_SERVICE`, `coverageOf`, `airlinesFor`), `tools/airline-coverage.mjs` in the gate | Travel, the Commercial tab | tests/airlines.test.ts, tests/journey.test.ts | All 252 countries accounted for: 147 home to a carrier, 96 served by named neighbors' carriers that really fly in, 9 with no scheduled service and the reason said in plain words. A domestic hop is flown by home carriers only; a carrier serving both ends flies nonstop; the world connectors join only long, unshared routes. Fixed on the way: the geography keys Britain as `uk` and the old list said `gb`, so British Airways was never a home carrier. Airlines that have stopped flying are left out. No real timetable, no real fares, no codeshares, no alliances |
| Real hotel brands for every country in the geography | Implemented | `content/hotels.ts` (182 brands, `CHAINS_BY_COUNTRY`, `INDEPENDENT_ONLY`, `NOWHERE_TO_STAY`, `hotelBrandsFor`, `stayCoverageOf`), `tools/hotel-coverage.mjs` in the gate | Travel, Where You Are Staying and the Hotels tab | tests/stays.test.ts | All 252 countries accounted for: 214 with chains that really operate there, 29 independents only with the reason said, 9 with nowhere to stay and the reason said. A booking wears a brand that has a hotel in that country at the nearest real tier, or one of SLATE's own hotels named as such. Pyongyang gets the Yanggakdo and the Koryo, not a Hilton. The property, the rate and the room are SLATE's own. No real rates, no loyalty programs, no specific properties |
| Airbnb when you travel | Implemented | `travel.book_stay`, `stayOptions`, `AIRBNB_UNAVAILABLE`, `HotelBooking.kind/listing/hostId/cleaningFee/serviceFee` | Travel, Where You Are Staying | tests/stays.test.ts | Entire place or private room, nightly plus cleaning once plus the platform's fee plus tax, the way the platform itemizes it, with a real host in the save who remembers you. Honestly absent where it is: Russia and Belarus since 2022, Iran, Syria and North Korea under sanctions, uninhabited places, with the reason on screen. The listing, the host and the rate are SLATE's own. No reviews you write, no messaging the host, no cancellation policy tiers |
| The trip as one booking | Implemented | `travel.book_trip` | Travel, Book The Trip | tests/stays.test.ts | Flight there, the stay, and the flight back under one funds check and one idempotency key. Priced from the same list the screen showed, keyed by check-in day, so what you saw is what you pay. A failed leg refunds the charged ones and cancels the trip; a retry or a double click cannot book or pay twice. Not in the bundle yet: a hire car at the far end, travel cover, packing outfits |
| The iced-out houses | Implemented | `content/ice.ts` (351 rows), retailers `icebox`, `johnny_dang`, `jacob_and_co`, `eliantte`, `if_and_co`, `avianne`, `rafaello`, `greg_yuna`, `pristine_jewelers`, `king_ice`, `gld`, `frost_nyc`, `traxnyc`, `popular_jewelry` in `content/brands.ts` | Shopping and the jeweler scene, in the cities they really trade in | tests/airlines.test.ts, tools/brand-depth.mjs | Icebox 131 and King Ice 120, both on the gate's hundred list. Cuban links by karat and gauge, tennis chains by the millimeter, pendants, grillz on their own peg, bust-down watches named by the base watch. Gold is priced daily and a custom house prices on the phone, so every figure is a labeled calibration. King Ice's licensed lines are named only where the license is public. No custom-pendant design conversation yet beyond the bench's four new pieces |
| The bench makes grillz, a tennis chain, a nameplate and a Miami Cuban | Implemented | `PIECE_KINDS` in `content/jewellery.ts` | The jeweler scene | tests/airlines.test.ts, tests/jewellery.test.ts | Four more pieces on the same commission engine. Grillz say out loud that they come in for the impression first. No mold-taking step is played out |
| The four Cs, as the GIA publishes them | Implemented | `COLOUR_GRADES` (D to Z), `CLARITIES` (FL to I1), `CUTS`, carat weight in `quoteFor` | The Colour and Clarity steps | tests/jewellery.test.ts | The scales and the named cuts are published standards, used as published. Every price is SLATE's calibration and says so; there is no live diamond market feed |
| A quote that adds up, and is fixed when it is given | Implemented | `quoteFor` (metal by weight, stone by carat and grade, labour by the hour and the setting), `Commission.quotedPrice` | What It Would Cost | tests/jewellery.test.ts | The bench cannot revise a quote it has given. There is no haggling |
| The awkward things said before you pay, never after | Implemented | `cautionsFor` | The quote step | tests/jewellery.test.ts | Ten checks: unsizable metals, eternity bands, tension settings, soft stones in rings, oiled emeralds, pearls in rings, exposed settings, big SI stones, silver under a large stone, over-long engraving. None of them refuses the order |
| A deposit that is taken once, and a piece that is made once | Implemented | `jewel.approve` (no-op when already ordered), `jewel.collect` (returns the existing asset), `jewel.cancel` (idempotent) | The jeweller scene | tests/jewellery.test.ts | Held by tests that retry every one of them |
| Weeks of waiting, then it is ready and you are told | Implemented | `jewel.ready` scheduled kind, `Commission.readyAt`, notification | Notifications, the counter | tests/jewellery.test.ts | The wait is weeks scaled by the piece, the setting and how dear the room is. Nothing can hurry it |
| A one-off you own, that knows what it is | Implemented | `OwnedAsset.bespoke` carrying the whole specification, provenance, `BESPOKE_RESALE` | What You Own, the wardrobe | tests/jewellery.test.ts | It is worth less than you paid the day you collect it, which is what bespoke does |
| Engraving in your own words | Implemented | `Commission.engraving`, `jewel.engrave` for something already owned | The Anything Inside step | tests/jewellery.test.ts | Sixty characters, and permanent |
| Sizing, repairs, cleaning and a valuation for your insurer | Implemented | `jewel.resize`, `jewel.repair` + `jewel.repaired`, `jewel.clean`, `jewel.appraise` | The counter, Shopping | tests/jewellery.test.ts | A resize is refused on a metal the jeweller already told you could not take one. An emerald or a pearl gets hand cleaning and a plain explanation rather than an ultrasonic. A valuation is a replacement figure and says it is not a resale price |

### Banking

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Accounts opened on a product with a minimum, a monthly fee a balance waives and a rate; closed when nothing points at them, with the money moved out | Implemented | `BANK_PRODUCTS` (two institutions, eleven products), `bank.open`, `bank.close`, `openingRefusal`, `monthlyFeeFor` | Bank accounts, Open An Account | tests/banking.test.ts | Every rate, fee and limit is SLATE's own; no real bank is named |
| Cover: off until switched on, spends like money up to the limit, charges each time the balance goes below zero, and cannot be switched off while you are in it | Implemented | `bank.set_overdraft`, `chargeCover`, `availableFunds` | Switch Cover On, the account line | tests/banking.test.ts | Charged once an episode rather than once an item |
| Savings that counts withdrawals and charges past its allowance; certificates that lock the money for a term and take back a share of the interest when broken | Implemented | `countWithdrawal`, `breakingCost`, `matureCertificate`, `bank.close` | Break It, the account line | tests/banking.test.ts | — |
| A card cycle: the statement closes, a minimum is due three weeks later, clearing it costs nothing, carrying costs interest on what is carried, late costs a fee and a mark | Implemented | `closeCardCycle`, `minimumFor`, `bank.pay_card`, `CARD_GRACE_DAYS` | Cards panel, the statement decision on Home | tests/banking.test.ts | — |
| Standing orders between your own accounts on a day of the month, stopped by you or by three they cannot pay | Implemented | `bank.create_standing_order`, `bank.cancel_standing_order`, `runStandingOrders`, `STANDING_ORDER_STRIKES` | Standing Orders panel | tests/banking.test.ts | — |
| Monthly statements that chain: one opens where the last closed, with credits, debits, charges and interest | Implemented | `closeMonth`, `writeStatement`, `statements` | Statements tab | tests/banking.test.ts | Two years kept per account, then pruned |
| The real cards on the shelf beside SLATE's own: the Platinum, the Sapphire Reserve, the Venture X, the Strata Elite, the British Platinum, each with the fee its issuer publishes, billed monthly here, and issued only where it is issued | Implemented | `REAL_CARDS`, `cardProduct`, `realCardsFor` in `src/engine/content/wealth.ts`; `openingRefusal` (`NOT_ISSUED_HERE`) | Open An Account, Cards | tests/wealth.test.ts | Issuer, network and published fee are public record; the starting limit and the score wanted are SLATE's calibration |
| The black card, and the others nobody applies for: the Centurion (both sides of the Atlantic), the J.P. Morgan Reserve, the Coutts Silk, the Dubai First Royale. Invited when the reported rule is met — a year on the Platinum at a quarter of a million, or a private-bank relationship — with the invitation as a decision, an initiation fee taken once, and no second card of the same kind | Implemented | `invitationStanding`, `trailingSpend`, `considerInvitations`, `Person.invitations`, `INVITATION_ONLY`; `bank.invited` | Private Banking (Cards That Are Not Applied For), Decision Center | tests/wealth.test.ts | How an issuer really decides is not published by anyone; the rule is SLATE's reading of what is widely reported and says so on screen |
| Private and offshore banks: 58 real banks in their real jurisdictions, from Zürich and Geneva to Singapore, Jersey, George Town and New York, each with a minimum labelled published or reported. An application wants a valid passport and the minimum, takes the bank's weeks, moves the deposit exactly once when the account opens or declines with the reason; a retried application is one application. Offshore is relative to where you live, and an offshore account is reported under the Common Reporting Standard, with the FBAR named for an American over ten thousand | Implemented | `PRIVATE_BANKS`, `bank.apply_private`, `bank.private_open`, `privateBankOf`, `isOffshore`, `PrivateApplication`, `REPORTING_NOTE`, `FBAR_NOTE` | Bank, Private Banking | tests/wealth.test.ts | Held in the home currency; nothing converts. The reporting is a notice and a memory, not a line on the tax return yet |
| Multi-currency with FX | Not started | — | — | — | The world carries currencies; no account holds one but the home currency, and nothing converts |
| Pending versus posted | Not modelled | — | — | — | Every posting in the ledger is immediate; there is no float to show |

### Insurance

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Quote, purchase, claim, decision, payout, renewal, lapse | Implemented | `ins.quote`, `ins.purchase`, `ins.file_claim`, `ins.renewal` | `/workspace/insurance` | tests/systems.test.ts | — |
| Motor, marine and aviation lines: a boat is refused on a motor policy and a jet on a marine one; undisclosed work aboard denies a claim on any of them; a motorcycle and an older hull or airframe are priced harder | Implemented | `vehicleLineFor`, `buildQuote`, `INSURANCE_PRODUCTS` (marine, aviation) | Insurance quotes, the dealer's broker | tests/fleet.test.ts | Carriers are SLATE's own, as before |
| Real insurers, everywhere: 2,296 companies that really sell insurance, listed country by country for all 252 countries (194 named, 22 through their metropole, 32 local-only with a reason, 4 with no market and a reason), held by `tools/insurer-coverage.mjs` in the gate. A quote is written by a company that writes that line where the holder lives, or refused with the reason; the holder can pick any that does, and the same company is always the same amount dearer or cheaper. Specialists come through a broker only where nobody local writes the line: Athos and Front Row for kit, Jewelers Mutual for the jewelry, Pantaenius for the hull, Global Aerospace for the airframe. Sixty-four state health schemes named under the private cover | Implemented | `INSURERS_BY_COUNTRY`, `insurersFor`, `insurerCoverageOf`, `GLOBAL_SPECIALISTS`, `STATE_HEALTH`, `carrierFactor` in `src/engine/content/insurers.ts`; `carriersFor`, `buildQuote`, `nobodyWrites`, `healthCarriersIn` in `src/engine/systems/services.ts`; `ins.quote` with `carrier` | Insurance, Get A Quote (Who Writes It) | tests/insurers.test.ts | Which lines a company writes is SLATE's reading of its public business; every premium, deductible and limit is SLATE's calibration. A practice takes real carriers now, and an old save's policies were moved to a real company at schema 47 without losing a number, a premium or a claim |
| Hand in hand: the house asks to be insured the day it closes, a piece worth fifteen thousand asks for a valuables rider as you collect it, kit worth twenty-five hundred in one order asks for equipment cover, and motor cover is refused to somebody without a license | Implemented | `prop.close`, `jewel.collect` (`VALUABLES_FLOOR`), `shop.purchase` (`EQUIPMENT_FLOOR`), `ins.quote` (`licenseCheck`) | Decision Center | tests/purchase.test.ts, tests/papers.test.ts | Travel cover is not yet offered inside the trip |

### Social platforms

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Four in-game platforms with different mechanics; accounts; posts; momentum; audience segments; decay; payouts | Implemented | `social.create_account`, `social.create_post`, `social.publish`, `social.decay_tick`, `social.payout` | `/workspace/social` | tests/systems.test.ts, tests/compose.test.ts | — |
| Composing as a scene with craft; reactions a day on | Implemented | `social.compose`, `social.reactions` | Compose It, Posts | tests/compose.test.ts | Consequences on relationships and career not modelled |
| Brand deals: offer, respond, deadline, breach, completion | Implemented | `social.respond_to_deal`, `social.deal_deadline` | Brand Deals | tests/systems.test.ts | — |
| YouTube / Instagram / X / Twitch as distinct platforms with parity checklists | Not started | — | — | — | The four platforms are fictional stand-ins; no parity is claimed |

### Travel

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Plan, book and cancel flights, hotels, private charter or your own aircraft; drive between cities; arrival; time zones | Implemented | `travel.plan_trip`, `travel.book_flight`, `travel.cancel_flight`, `travel.book_hotel`, `travel.charter_private`, `travel.drive`, `travel.depart`, `travel.arrive`, `travel.check_in`, `travel.check_out`, `travel.drive_arrive` | `/workspace/travel` | tests/navigation.test.ts, tests/driving.test.ts, tests/fleet.test.ts | — |
| A private flight has no desk and no gate: the aircraft waits at the terminal, the crew hold three hours past the booked time, the arrival moves with a late passenger, and a charter from before is read by its airport code | Implemented | `CREW_HOLD_HOURS`, `closesAt`, the private branch of `travel.fly` and of `journey.due`; `cityOfAirport` | Home (Go To The Aircraft, Stay Home) | tests/fleet.test.ts | — |
| Documents, packing, the run to the airport, seating, baggage, the gate, delays and cancellations, the air, the carousel, local transport, the hotel desk | Implemented | `travel.departure_due`, `travel.gate_closes`, `travel.pack`, `travel.to_airport`, `travel.check_in_flight`, `travel.board`, `travel.inflight`, `travel.claim_bags`, `travel.bag_returned`, `travel.to_hotel`, `travel.fly`, `travel.no_show`, `travel.flight` | Travel bookings, Calendar, Home | tests/journey.test.ts | Connections are a stop count on the fare, not a played change of plane |
| Changed plans: move a flight, rebook after a miss, cancel | Implemented | `travel.change_flight`, `travel.rebook`, `travel.cancel_flight` | Travel bookings, Home | tests/journey.test.ts | — |
| A border wants a passport: an international booking refuses, before any money moves, for every passenger whose passport is missing, expired, lost or still at the office; under six months left warns and never refuses; an emergency document from a consulate gets you home and nowhere else; the desk refuses check-in on the same rule; the trip refuses as one thing | Implemented | `passportCheck`, `passportStatus` in `src/engine/systems/documents.ts`; `travel.book_flight`, `documentsFor`, `checkIn` | Travel, Book The Trip (the passport line), the flight day | tests/papers.test.ts | Visa rules are not carried, and the six-month rule warns for every border rather than knowing which enforce it |
| Real airlines, hotel brands and aircraft types | Implemented (names) / Blocked (data) | `AIRLINES`, `airlinesFor`, `HOTEL_BRANDS`, `PRIVATE_AIRCRAFT` in `src/engine/systems/travel.ts` | Travel, with the note beside each | tests/journey.test.ts | Names are public record; routes, schedules, fares, properties and rates are SLATE's own. Visa rules are not carried. |

### Character, professions, work

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Attributes, skills, traits, professions, positions, standing; the prodigy at 100 | Implemented | `profession.unlock`, `profession.pick_trait` | `/workspace/character` | tests/prodigy.test.ts, tests/professions.test.ts, tests/personality.test.ts, tests/citizenship.test.ts | — |
| Reading a script for a project | Partial | `work.project` | — | tests/professions.test.ts (one todo: nothing earns industry experience since the job system went) | A calculator, not a pipeline |
| Production company, strike, business instrument | Blocked (dependency) | `co.*` foundations | Company locked | tests/shingle.test.ts | Tasks 38, 39, 40 |
| The papers in your wallet: a passport for each citizenship from the real authority (199 countries issue their own, 52 carry a metropole's, one issues none and says why) and a driver's license from the real state, provincial or national office (72 offices named), issued at a plausible date on a new life or an old save; renewal in the last year for a fee and a wait, expedited where the office offers it; lost at home is a replacement, lost abroad is a consulate; a first license is a knowledge test today and a road test in weeks whose pass depends on how you drive, retaken until it is a pass; a license swaps without a test where the country swaps and says so where it does not; every one runs out on a date, is asked about ninety days before, and is marked expired the month it goes | Implemented | `PASSPORT_AUTHORITIES`, `LICENSE_AUTHORITIES`, `REGIONAL_LICENSE_OFFICES`, `LICENSE_EXCHANGE` in `src/engine/content/documents.ts`; `ensurePapers`, `doc.apply_passport`, `doc.report_lost`, `doc.apply_license`, `doc.renew_license`, `doc.exchange_license`, `doc.passport_ready`, `doc.road_test`, `doc.license_ready`, `doc.month` in `src/engine/systems/documents.ts`; `tools/document-coverage.mjs` in the gate | Character, Papers | tests/papers.test.ts | The authority, the validity and the tests are public record; the fee and the wait are SLATE's calibration and say so. A visa is not a document SLATE carries |

### History, settings, tutorial

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| History left as-is | Untouched | `sim.remember`, `sim.audit` | `/workspace/history` | tests/authorship.test.ts | Only the tab label was re-cased |
| Preferences, three save slots, one world clock, persistence guard | Implemented | `world.set_preferences`, `src/engine/index.ts`, `base44/shared/guard.js` | `/workspace/settings`, save slots | tests/persistence.test.ts, tests/server-guards.test.ts, tests/base44-adapter.test.ts | — |
| The Base44 server functions, executed | Implemented | `base44/functions/*/entry.js` run for real against `tests/fakes/base44-sdk.ts` | — | tests/base44-contract.test.ts (22) | Proves every guard, ordering rule and error path except the network hop and Base44's own row-level security |
| Live Base44 persistence on a deployment | Blocked (account) | `tools/base44-smoke.mjs`, `npm run base44:deploy`, `docs/BASE44.md` | — | Runs on demand; exits 78 and says nothing was tested when credentials are absent | Needs a Base44 project. Reported as unverified until the smoke test runs green, never as passed |
| Tutorial | Implemented | `tutorial.set_mode`, `tutorial.complete`, `tutorial.dismiss`, `tutorial.reset` | Got It cards | tests/smoke.test.ts (one todo: nothing raises a decision on a fresh save yet) | — |

## Interface and editorial

| Requirement | State | Held by |
| --- | --- | --- |
| No emoji in tabs, navigation, tooltips or accessible names; the clapper as a brand mark only | Implemented | tests/interface.test.ts (`EMOJI` guard on every accessible name) |
| Title Case for every label, every word | Implemented | `node tools/label-sweep.mjs`, tests/text.test.ts, tests/text-caps.test.ts |
| No text bleeding at 390px or 1280px | Implemented, swept per stage | `node tools/text-caps.mjs` against a fresh build served on a strict port |
| Style convention documented | Implemented | `docs/STYLE.md` |
| Scene text describes committed facts; views never mutate | Implemented | `preview()` for views, `speak()` only in commands; tests/dialogue.test.ts |

## Dialogue library

| Requirement | State | Detail |
| --- | --- | --- |
| Versioned library with stable ids, eligibility, tone, cooldown, follow-ups | Implemented | `src/engine/dialogue/schema.ts`, `library.ts` |
| Seeded selection; per-save exposure; chunked loading | Implemented | `speak()`, `dialogue.seen` bounded to 2,000 ids, `loadAllSections()` |
| Validation: unique ids, reachability by declared expectation (including facts), normalised duplicates, near-twins | Implemented | tests/dialogue.test.ts, `node tools/dialogue-check.mjs` |
| 100,001 distinct entries | Blocked (content production) | 465 today: property 122, dating 112, vehicles 87, travel 55, health 52, social 37. The gym, meal, run and wellbeing scenes still carry lines in code. See `docs/DIALOGUE.md`. |

## Game-wide AI integration

There is no language model and no network call anywhere in the game. What
the directive calls the interaction service is deterministic and offline,
and this is what each part of it covers today:

| Part | What it is here | Covers | Does not cover |
| --- | --- | --- | --- |
| Director | The scene runtime: nodes, choices, commits, interruption, resume, skip | All eight scenes | A loop that plans a day or improvises a scene |
| Dialogue | The library: eligibility by what is true, seeded choice, exposure | Dating, property, vehicles, health, travel, social | Gym, meal, run, wellbeing, and every workspace's prose |
| Memory | Structured facts on people | Trainers, salespeople, dates, agents, inspectors, closers, doctors | Everyone else |
| Interpreter | Free text resolved to a choice, leave, skip, help, or refused | Every scene | Sentences that are not one of the choices |
| Simulation | Commands, schedules, events, audit | Everything above | — |
| Provider adapter (validation, revision checks, timeouts, budgets, caching) | Not started | — | Backlog row G4 |

## Data honesty

**Real, stated from the public record and labelled as such:** geography,
time zones, currencies and airports; public holidays; award shows, festivals
and fan events; award bodies and their rules; networks, studios and their
logos with licences recorded; industry people and their filmographies;
landmarks; 25 gyms in 13 cities; eight marinas named where a city has one
on the record; airline, hotel-brand and aircraft-type names (with every
route, fare, property and rate SLATE's own); the insurers that sell in
each country (with the lines they write SLATE's reading and every premium
SLATE's own); the passport and license authorities and their validity and
tests (with the fees and waits SLATE's own); the real cards, their issuers,
networks and published fees (with invitation rules labelled as reported);
the private banks and their jurisdictions (with minimums labelled
published or reported); the makes and models of every
car, motorcycle, boat and private aircraft on a lot (with every
specification, price, option and running cost SLATE's own calibration,
said so on the screen). Slip counts and sizes, hangar and berth rates,
garage capacities and ramp fees are SLATE's own everywhere, including at a
real marina or a real airport.

**SLATE's own, labelled as such on screen:** every home on the market,
every car on a lot, every product in a shop, every provider
and every medication (simulated care, not medical advice), the four social
platforms, every agent, salesperson, trainer and date, the weather (a
climate model, not a forecast), and every line of dialogue.

**Blocked on a feed that is not wired, with what it would take:**

| Item | Needs |
| --- | --- |
| 100 real homes per market | A licensed listings feed with provenance and as-of dates |
| 100 real vehicles per market | A licensed dealer inventory feed |
| 100 real products per category | Licensed product catalogues; variants not counted |
| Real insurance rate books | Every company is real; the premium it quotes is SLATE's calibration, and a licensed rating feed would be needed for the real one |
| An issuer's real invitation rule | Nobody outside the issuer has it; SLATE uses what is widely reported and labels it so |
| Every relevant real gym worldwide | A licensed venue catalogue |
| YouTube / Instagram / X / Twitch parity | A platform-by-platform checklist and the product decision to name them |
| Visa rules by passport and destination | A maintained rules feed; the flight day says it does not check |

No private app data is scraped. No real post or message is ever sent as a
side effect of play.

## Verification, and what is not verified

- The gate: `npm run typecheck`, `npx eslint src tests --max-warnings=0`,
  `npx vitest run`, `node tools/cohesion.mjs`, `node tools/label-sweep.mjs`,
  `node tools/dialogue-check.mjs`, `node tools/inventory.mjs --check`, and
  `node tools/text-caps.mjs` against a fresh build on a strict port.
- Two tests are recorded as todo, not passed: nothing earns industry
  experience from work since the job system went, and nothing raises a
  decision on a fresh save yet.
- **Base44 live persistence** of a save at schema 41 is not exercised here;
  the adapter's codec and the guard are tested, the deployment is not.
  Reported as unavailable, not as passing.
- **Two live tabs** are refused at the server by clock and playtime and are
  not exercised in a browser here.

## Appendix: the inventory, from the code

<!-- inventory:begin -->
Generated by `node tools/inventory.mjs --markdown`. 200 commands, 74 scheduled kinds, 176 events emitted, 25 event listeners, 18 scenes, 19 routes.

### Commands

| System | Kinds | Owner |
| --- | --- | --- |
| bank | `bank.apply_private` `bank.cancel_standing_order` `bank.close` `bank.create_standing_order` `bank.open` `bank.pay_card` `bank.set_overdraft` | `src/engine/systems/banking.ts` |
| build | `build.decide_change_order` `build.start` | `src/engine/systems/property.ts` |
| co | `co.change_shape` `co.found` `co.read_brief` `co.set_draw` `co.set_rate` | `src/engine/systems/shingle.ts` |
| costume | `costume.alter` `costume.approve` `costume.cancel` `costume.collect` `costume.commission` `costume.fitting` `costume.look` `costume.make` | `src/engine/systems/costume.ts` |
| date | `date.attend` `date.beat` `date.cancel` `date.check_in` `date.close` `date.finish` `date.reschedule` `date.skip` | `src/engine/systems/dating.ts` |
| deal | `deal.inspect` `deal.offer` `deal.open` `deal.set_terms` `deal.sign` `deal.test_drive` `deal.walk_away` | `src/engine/systems/dealership.ts` |
| dine | `dine.arrive` `dine.leave` `dine.order` `dine.settle` `dine.wait` | `src/engine/systems/dining.ts` |
| doc | `doc.apply_license` `doc.apply_passport` `doc.exchange_license` `doc.renew_license` `doc.report_lost` | `src/engine/systems/documents.ts` |
| edu | `edu.drop` `edu.enroll` | `src/engine/systems/services.ts` |
| finance | `finance.create_bill` `finance.open_account` `finance.pay_bill` `finance.pay_debt` `finance.take_loan` `finance.transfer` | `src/engine/systems/finance.ts` |
| go | `go.to` | `src/engine/systems/places.ts` |
| gym | `gym.buy_pass` `gym.cancel_membership` `gym.check_in` `gym.finish_workout` `gym.hire_trainer` `gym.take_class` `gym.train_block` | `src/engine/systems/fitness.ts` |
| health | `health.attend` `health.book` `health.cancel` `health.check_in` `health.consult` `health.fill_prescription` `health.pay` `health.reschedule` `health.skip` | `src/engine/systems/care.ts`, `src/engine/systems/services.ts` |
| ins | `ins.file_claim` `ins.purchase` `ins.quote` | `src/engine/systems/services.ts` |
| jewel | `jewel.appraise` `jewel.approve` `jewel.cancel` `jewel.clean` `jewel.collect` `jewel.commission` `jewel.engrave` `jewel.look` `jewel.repair` `jewel.resize` | `src/engine/systems/jewellery.ts` |
| life | `life.cook` `life.do_activity` `life.eat` `life.shower` `life.sleep` | `src/engine/systems/life.ts`, `src/engine/systems/places.ts` |
| place | `place.book_room` `place.order` `place.refuel` `place.visit` | `src/engine/systems/places.ts` |
| plan | `plan.attend` `plan.cancel` `plan.create` `plan.reschedule` `plan.skip` | `src/engine/systems/plans.ts` |
| profession | `profession.pick_trait` `profession.unlock` | `src/engine/systems/professions.ts` |
| prop | `prop.add_room` `prop.add_zone` `prop.book_showing` `prop.buy_furnishing` `prop.close` `prop.finish_room` `prop.furnish_room` `prop.inspection_decision` `prop.inspection_walk` `prop.list_for_sale` `prop.make_offer` `prop.move_in` `prop.postpone_closing` `prop.rent` `prop.respond_to_counter` `prop.walk_from_closing` | `src/engine/systems/property.ts`, `src/engine/systems/purchase.ts` |
| rel | `rel.ask_out` `rel.define` `rel.end` `rel.give_gift` `rel.have_child` `rel.interact` `rel.intimacy` `rel.meet` `rel.plan_wedding` `rel.propose` | `src/engine/systems/places.ts`, `src/engine/systems/relationships.ts` |
| retail | `retail.basket` `retail.enter` `retail.handle` `retail.pay` `retail.quote` `retail.try_on` `retail.walk_out` | `src/engine/systems/retail.ts` |
| scene | `scene.choose` `scene.leave` `scene.quick` `scene.resume` `scene.skip` `scene.start` | `src/engine/systems/scenes.ts` |
| shop | `shop.purchase` `shop.return` `shop.save_outfit` `shop.sell_asset` | `src/engine/systems/commerce.ts` |
| social | `social.create_account` `social.create_post` `social.respond_to_deal` | `src/engine/systems/media.ts` |
| stor | `stor.join_waitlist` `stor.keep` `stor.leave_waitlist` `stor.pass_slip` `stor.take_slip` | `src/engine/systems/storage.ts` |
| travel | `travel.board` `travel.book_flight` `travel.book_hotel` `travel.book_stay` `travel.book_trip` `travel.cancel_flight` `travel.change_flight` `travel.charter_private` `travel.check_in_flight` `travel.claim_bags` `travel.drive` `travel.fly` `travel.inflight` `travel.no_show` `travel.pack` `travel.plan_trip` `travel.rebook` `travel.to_airport` `travel.to_hotel` | `src/engine/systems/driving.ts`, `src/engine/systems/journey.ts`, `src/engine/systems/travel.ts` |
| tutorial | `tutorial.complete` `tutorial.dismiss` `tutorial.reset` `tutorial.set_mode` | `src/engine/world/world.ts` |
| veh | `veh.book_modification` `veh.book_service` `veh.cruise` `veh.drive` `veh.name` `veh.purchase` `veh.remove_modification` `veh.sell` | `src/engine/systems/vehicles.ts` |
| viewing | `viewing.arrive` `viewing.ask` `viewing.look` `viewing.skip` `viewing.summary` | `src/engine/systems/viewings.ts` |
| wear | `wear.clean` `wear.leave_in_it` `wear.outfit` `wear.put_on` `wear.save_look` `wear.set_preference` `wear.take_off` | `src/engine/systems/wardrobe.ts` |
| work | `work.project` | `src/engine/systems/authorship.ts` |
| world | `world.dismiss_decision` `world.mark_read` `world.set_preferences` `world.take_decision_action` | `src/engine/world/world.ts` |

### Scheduled kinds

| System | Kinds | Owner |
| --- | --- | --- |
| bank | `bank.day` `bank.month` `bank.private_open` | `src/engine/systems/banking.ts` |
| build | `build.phase_tick` | `src/engine/systems/property.ts` |
| co | `co.draw` `co.overhead` | `src/engine/systems/shingle.ts` |
| costume | `costume.fitting_due` `costume.ready` | `src/engine/systems/costume.ts` |
| date | `date.follow_up` `date.lapse` | `src/engine/systems/dating.ts` |
| deal | `deal.callback` `deal.delivery` `deal.expire` | `src/engine/systems/dealership.ts` |
| doc | `doc.license_ready` `doc.month` `doc.passport_ready` `doc.road_test` | `src/engine/systems/documents.ts` |
| edu | `edu.session` | `src/engine/systems/services.ts` |
| finance | `finance.bill_due` `finance.month_close` `finance.tax_year` | `src/engine/systems/finance.ts` |
| fitness | `fitness.recovery` | `src/engine/systems/fitness.ts` |
| gym | `gym.membership_end` | `src/engine/systems/fitness.ts` |
| health | `health.appointment` `health.dose` `health.lapse` `health.results` `health.rx_lapse` | `src/engine/systems/care.ts`, `src/engine/systems/services.ts` |
| ins | `ins.renewal` | `src/engine/systems/services.ts` |
| jewel | `jewel.ready` `jewel.repaired` | `src/engine/systems/jewellery.ts` |
| life | `life.day_rollover` | `src/engine/systems/life.ts` |
| place | `place.hygiene_tick` | `src/engine/systems/places.ts` |
| plan | `plan.lapse` `plan.personal` `plan.reminder` | `src/engine/systems/plans.ts` |
| prop | `prop.appraisal` `prop.closing_lapse` `prop.closing` `prop.counter_lapse` `prop.inspection_lapse` `prop.inspection` `prop.market_tick` `prop.moving_day` `prop.offer_response` `prop.refresh_listings` `prop.showing` | `src/engine/systems/property.ts`, `src/engine/systems/purchase.ts` |
| rel | `rel.anniversary` `rel.birthday` `rel.date` `rel.drift` `rel.wedding` | `src/engine/systems/dating.ts`, `src/engine/systems/relationships.ts` |
| shop | `shop.deliver` `shop.pantry_expiry` | `src/engine/systems/commerce.ts` |
| social | `social.deal_deadline` `social.decay_tick` `social.payout` `social.publish` `social.reactions` | `src/engine/systems/media.ts` |
| stor | `stor.offer_lapse` | `src/engine/systems/storage.ts` |
| travel | `travel.arrive` `travel.bag_returned` `travel.check_in` `travel.check_out` `travel.depart` `travel.drive_arrive` `travel.gate_closes` | `src/engine/systems/driving.ts`, `src/engine/systems/journey.ts`, `src/engine/systems/travel.ts` |
| veh | `veh.depreciate` `veh.install_parts` `veh.refresh_inventory` `veh.registration_due` `veh.service_appointment` | `src/engine/systems/vehicles.ts` |
| viewing | `viewing.lapse` | `src/engine/systems/viewings.ts` |
| world | `world.tick` | `src/engine/world/world.ts` |

### Events emitted

| System | Kinds | Owner |
| --- | --- | --- |
| bank | `bank.card_late` `bank.card_paid` `bank.closed` `bank.invited` `bank.matured` `bank.opened` `bank.overdraft_set` `bank.overdrawn` `bank.private_applied` `bank.private_declined` `bank.private_opened` `bank.standing_order_created` `bank.standing_order_ran` `bank.standing_order_stopped` | `src/engine/systems/banking.ts` |
| berth | `berth.left` `berth.passed` `berth.queued` `berth.taken` | `src/engine/systems/storage.ts` |
| build | `build.change_order_decided` `build.change_order_raised` `build.completed` `build.phase_complete` `build.started` | `src/engine/systems/property.ts` |
| co | `co.founded` `co.overhead_missed` `co.rate_set` `co.reshaped` | `src/engine/systems/shingle.ts` |
| date | `date.beat` `date.cancelled` `date.closed` `date.started` `date.stood_up` `date.they_cancelled` | `src/engine/systems/dating.ts` |
| deal | `deal.agreed` `deal.opened` `deal.signed` `deal.walked` | `src/engine/systems/dealership.ts` |
| dine | `dine.arrived` `dine.left` `dine.ordered` `dine.seated` `dine.settled` | `src/engine/systems/dining.ts` |
| doc | `doc.applied` `doc.issued` `doc.lost` `doc.test_failed` | `src/engine/systems/documents.ts` |
| edu | `edu.completed` `edu.enrolled` | `src/engine/systems/services.ts` |
| finance | `finance.account_opened` `finance.bill_missed` `finance.bill_paid` `finance.loan_taken` `finance.tax_reconciled` | `src/engine/systems/finance.ts` |
| fitness | `fitness.workout_completed` | `src/engine/systems/fitness.ts` |
| go | `go.arrived` | `src/engine/systems/places.ts` |
| gym | `gym.checked_in` `gym.pass_bought` | `src/engine/systems/fitness.ts` |
| health | `health.appointment_booked` `health.appointment_completed` `health.appointment_due` `health.appointment_missed` `health.consulted` `health.prescription_filled` `health.prescription_finished` `health.prescription_lapsed` `health.results` | `src/engine/systems/care.ts`, `src/engine/systems/services.ts` |
| ins | `ins.claim_denied` `ins.claim_settled` `ins.policy_purchased` `ins.renewed` | `src/engine/systems/services.ts` |
| life | `life.activity_completed` `life.ate` `life.cooked` `life.showered` `life.sleep_started` `life.woke` | `src/engine/systems/life.ts`, `src/engine/systems/places.ts` |
| place | `place.ordered` `place.photographed` `place.ran_into` `place.recognised` `place.refuelled` `place.visited` | `src/engine/systems/places.ts` |
| plan | `plan.created` `plan.settled` | `src/engine/systems/plans.ts` |
| profession | `profession.levelled` `profession.unlocked` | `src/engine/systems/professions.ts` |
| prop | `prop.appraised` `prop.closing_due` `prop.closing_failed` `prop.closing_postponed` `prop.counter_answered` `prop.counter_lapsed` `prop.furnishing_added` `prop.inspection_complete` `prop.inspection_decided` `prop.inspection_waived` `prop.listed` `prop.listings_refreshed` `prop.moved_in` `prop.moving_day_due` `prop.offer_accepted` `prop.offer_countered` `prop.offer_rejected` `prop.offer_submitted` `prop.rented` `prop.room_finished` `prop.room_furnished` `prop.showing_attended` `prop.showing_due` `prop.showing_missed` | `src/engine/systems/property.ts`, `src/engine/systems/purchase.ts`, `src/engine/systems/viewings.ts` |
| property | `property.purchased` | `src/engine/systems/property.ts` |
| rel | `rel.ask_out_declined` `rel.became_partners` `rel.birthday` `rel.child_added` `rel.created` `rel.date_resolved` `rel.date_scheduled` `rel.ended` `rel.engaged` `rel.gift_given` `rel.interaction` `rel.intimacy` `rel.married` `rel.proposal_declined` `rel.wedding_planned` | `src/engine/systems/dating.ts`, `src/engine/systems/places.ts`, `src/engine/systems/relationships.ts` |
| retail | `retail.entered` `retail.left` `retail.tried` | `src/engine/systems/retail.ts` |
| scene | `scene.started` | `src/engine/systems/scenes.ts` |
| shop | `shop.asset_acquired` `shop.asset_sold` `shop.order_delivered` `shop.order_placed` `shop.pantry_expired` `shop.returned` | `src/engine/systems/commerce.ts` |
| social | `social.account_created` `social.deal_accepted` `social.deal_breached` `social.deal_completed` `social.deal_offered` `social.earnings_paid` `social.post_published` `social.reactions` | `src/engine/systems/media.ts` |
| travel | `travel.arrived` `travel.bag_lost` `travel.bag_returned` `travel.charter_booked` `travel.checked_in` `travel.checked_out` `travel.departed` `travel.departure_due` `travel.drive_started` `travel.flight_booked` `travel.flight_cancelled` `travel.flight_missed` `travel.flight_rebooked` `travel.hotel_booked` `travel.trip_booked` `travel.trip_planned` | `src/engine/systems/driving.ts`, `src/engine/systems/journey.ts`, `src/engine/systems/places.ts`, `src/engine/systems/travel.ts` |
| veh | `veh.inventory_refreshed` | `src/engine/systems/vehicles.ts` |
| vehicle | `vehicle.cruised` `vehicle.delivered` `vehicle.kept` `vehicle.modification_booked` `vehicle.modification_removed` `vehicle.modified` `vehicle.named` `vehicle.purchased` `vehicle.relocated` `vehicle.revalued` `vehicle.serviced` `vehicle.sold` | `src/engine/systems/dealership.ts`, `src/engine/systems/storage.ts`, `src/engine/systems/travel.ts`, `src/engine/systems/vehicles.ts` |
| wear | `wear.cleaned` `wear.dressed` | `src/engine/systems/wardrobe.ts` |
| world | `world.day_rollover` | `src/engine/systems/life.ts` |

### Event listeners

| System | Kinds | Owner |
| --- | --- | --- |
| edu | `edu.completed` | `src/engine/systems/professions.ts` |
| finance | `finance.bill_missed` `finance.bill_paid` | `src/engine/systems/finance.ts` |
| go | `go.arrived` | `src/engine/systems/places.ts` |
| health | `health.appointment_due` | `src/engine/systems/care.ts` |
| prop | `prop.closing_due` `prop.counter_answered` `prop.inspection_complete` `prop.inspection_decided` `prop.moved_in` `prop.offer_accepted` `prop.offer_countered` `prop.showing_due` | `src/engine/systems/purchase.ts`, `src/engine/systems/viewings.ts` |
| property | `property.purchased` | `src/engine/systems/property.ts` |
| rel | `rel.date_scheduled` | `src/engine/systems/dating.ts` |
| scene | `scene.abandoned` `scene.completed` | `src/engine/systems/dating.ts`, `src/engine/systems/plans.ts` |
| social | `social.deal_completed` `social.post_published` | `src/engine/systems/professions.ts` |
| travel | `travel.departure_due` | `src/engine/systems/journey.ts` |
| vehicle | `vehicle.purchased` `vehicle.relocated` `vehicle.revalued` `vehicle.sold` | `src/engine/systems/storage.ts` |
| work | `work.shift_worked` | `src/engine/systems/professions.ts` |

### Scenes

| Scene | Owner |
| --- | --- |
| `fitness.gym` | `src/engine/scenes/gym.ts` |
| `health.visit` | `src/engine/scenes/visit.ts` |
| `life.costumier` | `src/engine/scenes/costumier.ts` |
| `life.dress` | `src/engine/scenes/dress.ts` |
| `life.jeweller` | `src/engine/scenes/jeweller.ts` |
| `life.meal` | `src/engine/scenes/meal.ts` |
| `life.run` | `src/engine/scenes/run.ts` |
| `life.shop` | `src/engine/scenes/shop.ts` |
| `property.closing` | `src/engine/scenes/closing.ts` |
| `property.counter` | `src/engine/scenes/counter.ts` |
| `property.inspection` | `src/engine/scenes/inspection.ts` |
| `property.movein` | `src/engine/scenes/movein.ts` |
| `property.viewing` | `src/engine/scenes/viewing.ts` |
| `rel.date` | `src/engine/scenes/date.ts` |
| `social.compose` | `src/engine/scenes/compose.ts` |
| `travel.flight` | `src/engine/scenes/flight.ts` |
| `vehicles.dealer` | `src/engine/scenes/dealer.ts` |
| `wellbeing.activity` | `src/engine/scenes/activity.ts` |

### Routes

`/home` · `/workspace/bank` · `/workspace/calendar` · `/workspace/casting` · `/workspace/character` · `/workspace/city` · `/workspace/education` · `/workspace/health` · `/workspace/history` · `/workspace/insurance` · `/workspace/property` · `/workspace/relationships` · `/workspace/settings` · `/workspace/shopping` · `/workspace/social` · `/workspace/travel` · `/workspace/vehicles` · `/workspace/wellbeing` · `/world`
<!-- inventory:end -->
