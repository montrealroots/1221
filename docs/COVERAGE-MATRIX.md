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
(stage 8): 131 commands, 60 scheduled kinds, 133 events, 20 event
listeners, 13 scenes, 19 routes, 45 test files, 667 tests passing, 2
recorded as todo, schema 36, 382 dialogue entries.

## Surfaces

### Routes and what they open

| Route | Workspace | Tabs and panels | Owning systems |
| --- | --- | --- | --- |
| `/home` | Home | Where To (every destination), What Needs You (decisions with their actions, unread notifications with Open), What Happens Next, How You Are, Where You Are, Weather, Money, Standing, Home And Household | world, wellbeing, weather, finance |
| `/world` | World | Places by kind where you are, journeys, the Right Here actions of the place you are at | places, driving, geography |
| `/workspace/calendar` | Calendar | Days with every commitment; detail for a plan, appointment (Play It Out, Just Go, Skip It, move, cancel), bill, flight, observance, date, showing, inspection, appraisal, closing or moving day with the owning system's actions; Plan Something | scheduler, plans, dating, viewings, purchase, care, holidays |
| `/workspace/wellbeing` | Wellbeing | Energy, stress, sleep, hygiene, readiness; every activity played out or just done; cooking | wellbeing, life |
| `/workspace/relationships` | Relationships | Everyone you know; interactions; Ask Out with activity, place and time; Dates panel with states | relationships, dating |
| `/workspace/history` | History (Why Did This Happen?) | `timeline`, `why` — left as-is except the tab label | audit |
| `/workspace/bank` | Bank | `accounts`, `transactions`, `bills`, `credit`, `tax` | finance |
| `/workspace/property` | Property | `owned` (Move In, Furnish It, List For Sale), `market`, `offers` (Take The Call, Walk It With The Inspector, Read The Report, Sit At The Table, Sign Remotely), `build`, `interiors` | property, viewings, purchase, construction, interiors |
| `/workspace/vehicles` | Vehicles | `garage`, `market` (by lot, with On The Table), `service`, `modify` | vehicles, dealership, driving |
| `/workspace/shopping` | Shopping | `shop`, `orders`, `owned`, `wardrobe` | commerce |
| `/workspace/insurance` | Insurance | Policies, quotes, claims, renewals | insurance |
| `/workspace/company` | Company | Locked in the shell (Under Construction) until the company engine lands | company (task 38) |
| `/workspace/social` | Social | Platforms you are on and not on; account stats; Compose It and Make A Post; Posts with reactions; Brand Deals | media |
| `/workspace/health` | Health | Providers, appointments (Play It Out, Just Go), prescriptions (Collect It), history with outcomes | services, care |
| `/workspace/education` | Education | Courses, enrolment, sessions | education |
| `/workspace/city` | The City | Where you are, what is here, Work Out / Eat Here / Look At The Cars / Go And See It | places, geography |
| `/workspace/travel` | Travel | `flights`, `hotels`, `private`, `bookings` | travel |
| `/workspace/character` | Character | `attributes`, `skills`, `traits`, `professions`, `positions`, `standing` | people, professions |
| `/workspace/settings` | Settings | Preferences, tutorial, the save | world, persistence |

Above every route sits the scene panel when a scene is open, and Go
Anywhere (`/`) searches all of it.

### Scenes

| Scene | Started from | Commits through | Short version | Tests |
| --- | --- | --- | --- | --- |
| `fitness.gym` | Calendar plan, The City, Wellbeing | `go.to`, `gym.check_in`, `gym.buy_pass`, `gym.hire_trainer`, `gym.train_block`, `gym.take_class`, `gym.finish_workout` | Yes | tests/scene-definitions.test.ts, tests/fitness.test.ts, tests/plans.test.ts |
| `wellbeing.activity` | Wellbeing | `life.do_activity` | Yes | tests/scene-definitions.test.ts |
| `life.meal` | The City, World | `go.to`, `place.order` | Yes | tests/scene-definitions.test.ts |
| `life.run` | Wellbeing | `go.to`, `life.do_activity` | Yes | tests/scene-definitions.test.ts |
| `vehicles.dealer` | Vehicles market, The City | `go.to`, `deal.open`, `deal.inspect`, `deal.test_drive`, `deal.set_terms`, `deal.offer`, `deal.walk_away`, `deal.sign`, `veh.purchase`, `ins.quote`, `ins.purchase` | Yes | tests/dealership.test.ts |
| `rel.date` | Home decision, Calendar, Relationships | `life.shower`, `shop.purchase`, `go.to`, `date.check_in`, `date.beat`, `date.close`, `date.finish` | Yes | tests/dating.test.ts |
| `property.viewing` | Home decision, Calendar, Property market | `viewing.arrive`, `viewing.look`, `viewing.ask`, `prop.make_offer` | Yes (`viewing.summary` is the same seeing without the scene) | tests/viewing.test.ts |
| `property.counter` | Home decision, Property offers | `prop.respond_to_counter` | Yes | tests/purchase.test.ts |
| `property.inspection` | Home decision, Property offers | `prop.inspection_walk`, `prop.inspection_decision` | Yes | tests/purchase.test.ts |
| `property.closing` | Home decision, Calendar, Property offers | `prop.close`, `prop.postpone_closing`, `prop.walk_from_closing`, `prop.move_in` | Yes | tests/purchase.test.ts |
| `property.movein` | Home decision, Calendar, Property owned | `prop.move_in`, `prop.furnish_room` | Yes | tests/purchase.test.ts |
| `health.visit` | Home decision, Calendar, Health | `health.check_in`, `health.consult`, `health.pay`, `health.book` | Yes (`health.attend` is the same visit without the scene) | tests/care.test.ts |
| `social.compose` | Social | `social.create_post` | Yes | tests/compose.test.ts |

The runtime (`scene.start`, `scene.choose`, `scene.skip`, `scene.quick`,
`scene.leave`, `scene.resume`) is held by tests/scenes.test.ts: revisions,
idempotent commits, one foreground scene, save and reload mid-scene,
interruption on leaving the city or the place, free text resolved offline.

### What asks on Home

A decision is raised by the engine, carries the actions the owning system
handles (`world.take_decision_action`, `world.dismiss_decision`), and is
resolved by the system, never by the click that opened it. Today the
engine asks about: a plan coming due; a date coming round; an
appointment coming round, an unpaid medical bill, and results that want
another look; a showing coming round; a seller's counter, an inspection report, closing day and
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
| Meals out | Implemented | `life.meal`, `place.order` | The City | tests/scene-definitions.test.ts | Reservations and company at the table are not built |

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
| Cards, statements, pending vs posted, scheduled payments, fees, limits, premium products | Not started | — | — | — | — |
| International and offshore accounts with FX | Not started | — | — | — | — |

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
| Three lots per city as places; inventory refreshed | Implemented | `src/engine/content/places.ts` (dealership), `veh.refresh_inventory` | `market` tab by lot, The City | tests/dealership.test.ts | — |
| Salesperson who remembers you; inspection, test drive, rounds against a hidden floor, final price | Implemented | `deal.open`, `deal.inspect`, `deal.test_drive`, `deal.offer`, `deal.set_terms`, `deal.walk_away`, `deal.sign`, `deal.callback`, `deal.expire` | `vehicles.dealer`, On The Table | tests/dealership.test.ts | — |
| Cash, finance, lease through the loan book; the lender's refusal shown | Implemented | `veh.purchase`, `financeRefusal` | Terms step | tests/dealership.test.ts | — |
| Trade-in that comes off what you owe | Implemented | `tradeInAllowance` | Trade-in step | tests/dealership.test.ts | — |
| Delivery as a calendar item; not in hand until it arrives; agreed repairs | Implemented | `deal.delivery`, `applyDealerRepairs` | Delivery chip | tests/dealership.test.ts | — |
| Registration fees, depreciation, insurance from the same chair | Implemented | `veh.registration_due`, `veh.depreciate`, `ins.quote`, `ins.purchase` | Garage | tests/dealership.test.ts, tests/systems.test.ts | — |
| Use, fuel, service, modification, resale | Implemented | `veh.drive`, `place.refuel`, `veh.book_service`, `veh.service_appointment`, `veh.book_modification`, `veh.install_parts`, `veh.remove_modification`, `veh.sell` | `garage`, `service`, `modify` | tests/driving.test.ts, tests/systems.test.ts | — |
| 100 distinct real vehicles per market with provenance | Blocked (data) | SLATE's models, labelled | Listings | — | Needs a licensed dealer inventory feed |

### Shopping

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Purchase, delivery, returns, wardrobe, outfits, selling assets, pantry | Implemented | `shop.purchase`, `shop.deliver`, `shop.return`, `shop.save_outfit`, `shop.sell_asset`, `shop.pantry_expiry` | `/workspace/shopping` | tests/systems.test.ts, tests/full-life.test.ts | Basket and checkout as a scene not built |
| 100 real branded products per category | Blocked (data) | SLATE's catalogue | `shop` tab | — | Needs licensed product data; variants are not counted as products |

### Insurance

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Quote, purchase, claim, decision, payout, renewal, lapse | Implemented | `ins.quote`, `ins.purchase`, `ins.file_claim`, `ins.renewal` | `/workspace/insurance` | tests/systems.test.ts | — |
| Real providers and products | Blocked (data) | Simulated lines, labelled | — | — | No carrier data imported |

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
| Plan, book and cancel flights, hotels, private charter; drive between cities; arrival; time zones | Implemented | `travel.plan_trip`, `travel.book_flight`, `travel.cancel_flight`, `travel.book_hotel`, `travel.charter_private`, `travel.drive`, `travel.depart`, `travel.arrive`, `travel.check_in`, `travel.check_out`, `travel.drive_arrive` | `/workspace/travel` | tests/navigation.test.ts, tests/driving.test.ts | — |
| Documents, seating, baggage, check-in, connections, delays, local transport, changed plans | Not started | — | — | — | Journey stages are not built |

### Character, professions, work

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| Attributes, skills, traits, professions, positions, standing; the prodigy at 100 | Implemented | `profession.unlock`, `profession.pick_trait` | `/workspace/character` | tests/prodigy.test.ts, tests/professions.test.ts, tests/personality.test.ts, tests/citizenship.test.ts | — |
| Reading a script for a project | Partial | `work.project` | — | tests/professions.test.ts (one todo: nothing earns industry experience since the job system went) | A calculator, not a pipeline |
| Production company, strike, business instrument | Blocked (dependency) | `co.*` foundations | Company locked | tests/shingle.test.ts | Tasks 38, 39, 40 |

### History, settings, tutorial

| Subfeature | State | Code | On screen | Tests | Gap |
| --- | --- | --- | --- | --- | --- |
| History left as-is | Untouched | `sim.remember`, `sim.audit` | `/workspace/history` | tests/authorship.test.ts | Only the tab label was re-cased |
| Preferences, three save slots, one world clock, persistence guard | Implemented | `world.set_preferences`, `src/engine/index.ts`, `base44/shared/guard.js` | `/workspace/settings`, save slots | tests/persistence.test.ts, tests/server-guards.test.ts, tests/base44-adapter.test.ts | Live Base44 writes are not exercised here |
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
| 100,001 distinct entries | Blocked (content production) | 382 today: property 122, dating 112, vehicles 59, health 52, social 37. The gym, meal, run and wellbeing scenes still carry lines in code. See `docs/DIALOGUE.md`. |

## Game-wide AI integration

There is no language model and no network call anywhere in the game. What
the directive calls the interaction service is deterministic and offline,
and this is what each part of it covers today:

| Part | What it is here | Covers | Does not cover |
| --- | --- | --- | --- |
| Director | The scene runtime: nodes, choices, commits, interruption, resume, skip | All eight scenes | A loop that plans a day or improvises a scene |
| Dialogue | The library: eligibility by what is true, seeded choice, exposure | Dating, property, vehicles, health, social | Gym, meal, run, wellbeing, and every workspace's prose |
| Memory | Structured facts on people | Trainers, salespeople, dates, agents, inspectors, closers, doctors | Everyone else |
| Interpreter | Free text resolved to a choice, leave, skip, help, or refused | Every scene | Sentences that are not one of the choices |
| Simulation | Commands, schedules, events, audit | Everything above | — |
| Provider adapter (validation, revision checks, timeouts, budgets, caching) | Not started | — | Backlog row G4 |

## Data honesty

**Real, stated from the public record and labelled as such:** geography,
time zones and currencies; public holidays; award shows, festivals and fan
events; award bodies and their rules; networks, studios and their logos
with licences recorded; industry people and their filmographies; landmarks;
25 gyms in 13 cities.

**SLATE's own, labelled as such on screen:** every home on the market,
every car on a lot, every product in a shop, every insurer, every provider
and every medication (simulated care, not medical advice), the four social
platforms, every agent, salesperson, trainer and date, the weather (a
climate model, not a forecast), and every line of dialogue.

**Blocked on a feed that is not wired, with what it would take:**

| Item | Needs |
| --- | --- |
| 100 real homes per market | A licensed listings feed with provenance and as-of dates |
| 100 real vehicles per market | A licensed dealer inventory feed |
| 100 real products per category | Licensed product catalogues; variants not counted |
| Real insurers and products | Blocked (data) | Simulated lines, labelled; health, dental and vision policies name a carrier a practice may or may not take | Health desk | tests/care.test.ts | No carrier data imported |
| Every relevant real gym worldwide | A licensed venue catalogue |
| YouTube / Instagram / X / Twitch parity | A platform-by-platform checklist and the product decision to name them |

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
- **Base44 live persistence** of a save at schema 34 is not exercised here;
  the adapter's codec and the guard are tested, the deployment is not.
  Reported as unavailable, not as passing.
- **Two live tabs** are refused at the server by clock and playtime and are
  not exercised in a browser here.

## Appendix: the inventory, from the code

<!-- inventory:begin -->
Generated by `node tools/inventory.mjs --markdown`. 131 commands, 60 scheduled kinds, 133 events emitted, 20 event listeners, 13 scenes, 19 routes.

### Commands

| System | Kinds | Owner |
| --- | --- | --- |
| build | `build.decide_change_order` `build.start` | `src/engine/systems/property.ts` |
| co | `co.change_shape` `co.found` `co.read_brief` `co.set_draw` `co.set_rate` | `src/engine/systems/shingle.ts` |
| date | `date.attend` `date.beat` `date.cancel` `date.check_in` `date.close` `date.finish` `date.reschedule` `date.skip` | `src/engine/systems/dating.ts` |
| deal | `deal.inspect` `deal.offer` `deal.open` `deal.set_terms` `deal.sign` `deal.test_drive` `deal.walk_away` | `src/engine/systems/dealership.ts` |
| edu | `edu.drop` `edu.enroll` | `src/engine/systems/services.ts` |
| finance | `finance.create_bill` `finance.open_account` `finance.pay_bill` `finance.pay_debt` `finance.take_loan` `finance.transfer` | `src/engine/systems/finance.ts` |
| go | `go.to` | `src/engine/systems/places.ts` |
| gym | `gym.buy_pass` `gym.cancel_membership` `gym.check_in` `gym.finish_workout` `gym.hire_trainer` `gym.take_class` `gym.train_block` | `src/engine/systems/fitness.ts` |
| health | `health.attend` `health.book` `health.cancel` `health.check_in` `health.consult` `health.fill_prescription` `health.pay` `health.reschedule` `health.skip` | `src/engine/systems/care.ts`, `src/engine/systems/services.ts` |
| ins | `ins.file_claim` `ins.purchase` `ins.quote` | `src/engine/systems/services.ts` |
| life | `life.cook` `life.do_activity` `life.eat` `life.shower` `life.sleep` | `src/engine/systems/life.ts`, `src/engine/systems/places.ts` |
| place | `place.book_room` `place.order` `place.refuel` `place.visit` | `src/engine/systems/places.ts` |
| plan | `plan.attend` `plan.cancel` `plan.create` `plan.reschedule` `plan.skip` | `src/engine/systems/plans.ts` |
| profession | `profession.pick_trait` `profession.unlock` | `src/engine/systems/professions.ts` |
| prop | `prop.add_room` `prop.add_zone` `prop.book_showing` `prop.buy_furnishing` `prop.close` `prop.finish_room` `prop.furnish_room` `prop.inspection_decision` `prop.inspection_walk` `prop.list_for_sale` `prop.make_offer` `prop.move_in` `prop.postpone_closing` `prop.rent` `prop.respond_to_counter` `prop.walk_from_closing` | `src/engine/systems/property.ts`, `src/engine/systems/purchase.ts` |
| rel | `rel.ask_out` `rel.define` `rel.end` `rel.give_gift` `rel.have_child` `rel.interact` `rel.intimacy` `rel.meet` `rel.plan_wedding` `rel.propose` | `src/engine/systems/places.ts`, `src/engine/systems/relationships.ts` |
| scene | `scene.choose` `scene.leave` `scene.quick` `scene.resume` `scene.skip` `scene.start` | `src/engine/systems/scenes.ts` |
| shop | `shop.purchase` `shop.return` `shop.save_outfit` `shop.sell_asset` | `src/engine/systems/commerce.ts` |
| social | `social.create_account` `social.create_post` `social.respond_to_deal` | `src/engine/systems/media.ts` |
| travel | `travel.book_flight` `travel.book_hotel` `travel.cancel_flight` `travel.charter_private` `travel.drive` `travel.plan_trip` | `src/engine/systems/driving.ts`, `src/engine/systems/travel.ts` |
| tutorial | `tutorial.complete` `tutorial.dismiss` `tutorial.reset` `tutorial.set_mode` | `src/engine/world/world.ts` |
| veh | `veh.book_modification` `veh.book_service` `veh.drive` `veh.purchase` `veh.remove_modification` `veh.sell` | `src/engine/systems/vehicles.ts` |
| viewing | `viewing.arrive` `viewing.ask` `viewing.look` `viewing.skip` `viewing.summary` | `src/engine/systems/viewings.ts` |
| work | `work.project` | `src/engine/systems/authorship.ts` |
| world | `world.dismiss_decision` `world.mark_read` `world.set_preferences` `world.take_decision_action` | `src/engine/world/world.ts` |

### Scheduled kinds

| System | Kinds | Owner |
| --- | --- | --- |
| build | `build.phase_tick` | `src/engine/systems/property.ts` |
| co | `co.draw` `co.overhead` | `src/engine/systems/shingle.ts` |
| date | `date.follow_up` `date.lapse` | `src/engine/systems/dating.ts` |
| deal | `deal.callback` `deal.delivery` `deal.expire` | `src/engine/systems/dealership.ts` |
| edu | `edu.session` | `src/engine/systems/services.ts` |
| finance | `finance.bill_due` `finance.month_close` `finance.tax_year` | `src/engine/systems/finance.ts` |
| fitness | `fitness.recovery` | `src/engine/systems/fitness.ts` |
| gym | `gym.membership_end` | `src/engine/systems/fitness.ts` |
| health | `health.appointment` `health.dose` `health.lapse` `health.results` `health.rx_lapse` | `src/engine/systems/care.ts`, `src/engine/systems/services.ts` |
| ins | `ins.renewal` | `src/engine/systems/services.ts` |
| life | `life.day_rollover` | `src/engine/systems/life.ts` |
| place | `place.hygiene_tick` | `src/engine/systems/places.ts` |
| plan | `plan.lapse` `plan.personal` `plan.reminder` | `src/engine/systems/plans.ts` |
| prop | `prop.appraisal` `prop.closing_lapse` `prop.closing` `prop.counter_lapse` `prop.inspection_lapse` `prop.inspection` `prop.market_tick` `prop.moving_day` `prop.offer_response` `prop.refresh_listings` `prop.showing` | `src/engine/systems/property.ts`, `src/engine/systems/purchase.ts` |
| rel | `rel.anniversary` `rel.birthday` `rel.date` `rel.drift` `rel.wedding` | `src/engine/systems/dating.ts`, `src/engine/systems/relationships.ts` |
| shop | `shop.deliver` `shop.pantry_expiry` | `src/engine/systems/commerce.ts` |
| social | `social.deal_deadline` `social.decay_tick` `social.payout` `social.publish` `social.reactions` | `src/engine/systems/media.ts` |
| travel | `travel.arrive` `travel.check_in` `travel.check_out` `travel.depart` `travel.drive_arrive` | `src/engine/systems/driving.ts`, `src/engine/systems/travel.ts` |
| veh | `veh.depreciate` `veh.install_parts` `veh.refresh_inventory` `veh.registration_due` `veh.service_appointment` | `src/engine/systems/vehicles.ts` |
| viewing | `viewing.lapse` | `src/engine/systems/viewings.ts` |
| world | `world.tick` | `src/engine/world/world.ts` |

### Events emitted

| System | Kinds | Owner |
| --- | --- | --- |
| build | `build.change_order_decided` `build.change_order_raised` `build.completed` `build.phase_complete` `build.started` | `src/engine/systems/property.ts` |
| co | `co.founded` `co.overhead_missed` `co.rate_set` `co.reshaped` | `src/engine/systems/shingle.ts` |
| date | `date.beat` `date.cancelled` `date.closed` `date.started` `date.stood_up` `date.they_cancelled` | `src/engine/systems/dating.ts` |
| deal | `deal.agreed` `deal.opened` `deal.signed` `deal.walked` | `src/engine/systems/dealership.ts` |
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
| scene | `scene.started` | `src/engine/systems/scenes.ts` |
| shop | `shop.asset_acquired` `shop.asset_sold` `shop.order_delivered` `shop.order_placed` `shop.pantry_expired` `shop.returned` | `src/engine/systems/commerce.ts` |
| social | `social.account_created` `social.deal_accepted` `social.deal_breached` `social.deal_completed` `social.deal_offered` `social.earnings_paid` `social.post_published` `social.reactions` | `src/engine/systems/media.ts` |
| travel | `travel.arrived` `travel.charter_booked` `travel.checked_in` `travel.checked_out` `travel.departed` `travel.drive_started` `travel.flight_booked` `travel.flight_cancelled` `travel.hotel_booked` `travel.trip_planned` | `src/engine/systems/driving.ts`, `src/engine/systems/places.ts`, `src/engine/systems/travel.ts` |
| veh | `veh.inventory_refreshed` | `src/engine/systems/vehicles.ts` |
| vehicle | `vehicle.delivered` `vehicle.modification_booked` `vehicle.modification_removed` `vehicle.modified` `vehicle.purchased` `vehicle.serviced` `vehicle.sold` | `src/engine/systems/dealership.ts`, `src/engine/systems/vehicles.ts` |
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
| work | `work.shift_worked` | `src/engine/systems/professions.ts` |

### Scenes

| Scene | Owner |
| --- | --- |
| `fitness.gym` | `src/engine/scenes/gym.ts` |
| `health.visit` | `src/engine/scenes/visit.ts` |
| `life.meal` | `src/engine/scenes/meal.ts` |
| `life.run` | `src/engine/scenes/run.ts` |
| `property.closing` | `src/engine/scenes/closing.ts` |
| `property.counter` | `src/engine/scenes/counter.ts` |
| `property.inspection` | `src/engine/scenes/inspection.ts` |
| `property.movein` | `src/engine/scenes/movein.ts` |
| `property.viewing` | `src/engine/scenes/viewing.ts` |
| `rel.date` | `src/engine/scenes/date.ts` |
| `social.compose` | `src/engine/scenes/compose.ts` |
| `vehicles.dealer` | `src/engine/scenes/dealer.ts` |
| `wellbeing.activity` | `src/engine/scenes/activity.ts` |

### Routes

`/home` · `/workspace/bank` · `/workspace/calendar` · `/workspace/character` · `/workspace/city` · `/workspace/company` · `/workspace/education` · `/workspace/health` · `/workspace/history` · `/workspace/insurance` · `/workspace/property` · `/workspace/relationships` · `/workspace/settings` · `/workspace/shopping` · `/workspace/social` · `/workspace/travel` · `/workspace/vehicles` · `/workspace/wellbeing` · `/world`
<!-- inventory:end -->
