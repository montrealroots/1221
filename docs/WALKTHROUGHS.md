# Walkthroughs

The ten end-to-end scenarios of the owner's Final Master Build Command (items
34 to 43), each step against what the build does as of 2026-10-02. **Works**
means a command or screen does it, with its checks and its effects
downstream; **Part** says what's there and what isn't; **Missing** isn't
built. The commands are in `docs/DEVMAP.md`, with their code and tests, and
the stages that would close what's missing are in `docs/BACKLOG.md`.

Written by hand, so it ages: when a stage lands, its walkthrough is
corrected in the same commit, as the backlog's progress table is.

## 34. Hotel Booking And Stay

| Step | Status | How |
|---|---|---|
| Destination, dates, guests, rooms, budget | Part | `travel.book` takes a destination, a date and a stay; one traveler, one room. |
| Named properties | Works | 28 real hotels in the eight towns, each room at its own booking engine's rates (`systems/hotels.ts`); Marriott's, Hilton's and Hyatt's refused an automated read. |
| Compared by total price | Works | Travel's stay classes are a catalog, cheapest first, total with the town's hotel taxes. |
| Location, room categories, policies | Works | Each named hotel's address, room types, minimum age, check-out hour, deposit and parking (`content/hotels.ts`). |
| Room and bed configuration | Works | Each hotel's own room types and their beds, as its engine lists them. |
| Extras and requests | Part | Parking with a car, at the hotel's own lot, valet or garage, a confirmed extra on the bill. Requests aren't kept: early check-in and late check-out are granted when available, which no hotel publishes. |
| Costs, taxes, deposit, cancellation | Part | The nightly rate and the town's hotel taxes; a cancellation refunds all but the first night, a no-show's (`hotelRefund`). A named hotel's deposit, a stay's or a night's, is held at arrival and returned at check-out. |
| Confirm and pay | Works | Paid from the bank or the card. |
| Reservation on the calendar and the trip | Works | The journey and its hotel are one commitment on the calendar. |
| Travel there | Works | The journey's legs, each at its local time. |
| Check in | Works | Arrival puts them in the room they booked, the hotel's minimum age checked at booking, its deposit held. |
| Luggage to the room | Part | The carry-on goes with them, packed with a week's clothes and the bathroom's things (`systems/luggage.ts`); it isn't put in a room, and checked bags aren't items. |
| Facilities and services | Part | A hotel room has its bath, air conditioning and the building's gym (`HOTEL_FIXTURES`), and no kitchen. |
| Modify or extend | Works | `travel.extend`. |
| Charges and check-out | Works | Check-out at the hotel's own hour, the deposit returned; staying on is a night at its own rate; the Travel screen shows the folio. |
| Belongings and onward | Part | Belongings stay where they are (`systems/items.ts`); nothing is left behind in a room. |

## 35. Clothing Purchase And Use

| Step | Status | How |
|---|---|---|
| A store or online | Works | Clothes screen: 1,198 real products from 74 retailers in five countries (`systems/clothing.ts`). |
| Filters | Part | Kind, department, the retailer’s own type of garment, retailer and where it’s sold, and a search over brand, category, material and color; no size or budget filter. |
| Ascending prices | Works | Cheapest first, tax in. |
| An actual variant | Works | A size and a color the product comes in, checked. |
| Purchase or order | Works | `clothes.buy`, or a basket checked out a retailer at a time, one payment and one delivery, the free threshold on the order (`clothes.basket_add`, `clothes.checkout`); canceled before delivery where British or Irish law gives the right (`clothes.cancel`). |
| Received at the right place | Works | Carried home, or delivered to the home they live in (`systems/orders.ts`). |
| Storage or worn | Works | The wardrobe; Belongings moves it (`items.move`). |
| An outfit | Works | `clothes.save_outfit`, from what’s to hand, jewelry and accessories with it; Change Into These Now changes there and then (`clothes.change`), and what’s on now is kept (`wornNow`). A piece that can’t go on is refused, and one swapped on the day is told. |
| Packed, cleaned, altered | Works | Packed by hand into the suitcase, each garment its folded liters, or Pack For Me (`luggage.pack`); washed at home or the laundromat and dry-cleaned at real shops’ prices; a garment fits the weight it was bought for, and one too big is taken in at one of 11 named tailors (`clothes.alter`). |
| Return, repair, resell | Part | Returns inside the window, unworn (`clothes.return`); sold on Vinted, ThredUp or Kijiji (`clothes.sell`); Air Jordans sold on GOAT at its fees (`sneakers.sell`). Not kept: repair, SLATE keeping no tear to mend. |
| Unavailable sizes, delays, returns, location | Works | Each is refused or said in words; tests in `tests/clothing.test.ts`. |

## 36. Vehicle Purchase, Modification And Use

| Step | Status | How |
|---|---|---|
| Real models and listings | Works | Cars: each market's best-sellers at the makers' prices, new or used (`systems/vehicles.ts`). |
| Compare | Works | A catalog, cheapest first, taxed and registered. |
| Inspect or test | Part | A used car is inspected before buying at the place’s named pre-purchase inspection (`vehicle.inspect_used`); no test drive. |
| Payment or financing | Works | Cash, a loan, or a lease (`vehicle.lease`). |
| Registration and insurance | Works | Each jurisdiction's fees and insurance. |
| Collect | Works | From stock it’s theirs at once; a factory order, with options that cost extra, isn’t driven until it comes after its dealers’ published weeks (`systems/caroptions.ts`). |
| Compatible modifications | Part | Factory options when new (`content/caroptions.ts`); `vehicle.modify`, `vehicle.tint`, `vehicle.winter_tires`, a CarPlay stereo (`vehicle.stereo`), a wrap at three named shops (`vehicle.wrap`), and the interior to your own design, leopard print included, at four named upholsterers in New York and Los Angeles or as a Katzkin kit (`vehicle.interior`). Wheel fitment isn’t kept, alloys being sold fitted to their car. |
| Itemized quote | Works | The interior’s estimate line by line: each material at its supplier’s price, each part’s hours at the trade’s rate. |
| Book work, transport meanwhile | Works | A repair or a service is booked at a named garage in its hours, and the car is in until it's done (`vehicle.repair`, `vehicle.service`); meanwhile the dealer's loaner where one is published, or a rental (`vehicle.stand_in`). |
| Collect the work | Part | A wrap, a repair or a service keeps the car at the shop its days, a loaner or a rental standing in (`vehicle.stand_in`); a mod is fitted at once, no tuner publishing its time. |
| Drive, park, fuel, maintain | Works | Driven every day at published mileage, on what’s in its tank at its maker’s capacity (`systems/fueltank.ts`), filled at a named station or charged; parking permits, inspections; faults mended at a garage, free under warranty; servicing by the maker’s interval; collisions claimed on full cover. |
| Change mods or sell | Works | `vehicle.sell`; mods stay on the car. |

## 37. Land Purchase And Backyard Construction

| Step | Status | How |
|---|---|---|
| Find and compare parcels | Works | Land: listings by market, cheapest first (`systems/land.ts`). |
| Access, utilities, constraints | Part | Each market's kind and acreage; easements are missing (WORLD.md). |
| Purchase | Works | `land.offer`. |
| A project such as a field or a pool | Works | A house built on land (`build.start`), and on a home a pool, deck, patio, garage, suite or ADU, a tennis court in seven surfaces, a half basketball court, a pickleball court, a football pitch in three sizes, and lights for the courts (`home.renovate`). |
| Feasibility and alternatives | Part | Whether the place allows a house; England doesn't. |
| Dimensions, materials, equipment | Part | A court's surface and its lot, Fixr's singles area for tennis and half an NBA court for basketball; a spare bedroom made a home gym. New hardwood floors or a refinish, recouped on a worn floor as NAR finds; counters and cabinets go in with a kitchen remodel. |
| Quotes and approvals | Part | The permit and the place's fees, paid at the start; one cost, not bids, no source publishing how far a home's bids spread. |
| Schedule and payments | Works | Staged payments on a build (`build.pay`). |
| Follow construction | Works | Stages, inspections, a failed one possible. |
| Inspection and acceptance | Works | |
| Use it | Works | A pool to swim in, a court to play on in daylight or under its lights, and friends over to play on any court or the pitch (`social.invite`, play). |
| Maintain, repair, remove | Works | Parts wear and are renewed (`pool-renew`, `deck-renew`); a pool, a deck or a garage taken out, the pool's upkeep with it (`pool-removal`, `deck-removal`, `garage-demolition`). |

## 38. A Day At Home

| Step | Status | How |
|---|---|---|
| Wake at the right time and place | Works | `life.sleep`, the night where they are. |
| Bathroom facilities | Works | A shower, a bath where the home has one (`life.look_after`), using the bathroom’s soap and shampoo, and dried on one of the home’s towels, three uses to its wash. |
| Accessible clothes | Works | The day’s outfit from what’s to hand and clean, what’s on now kept, and a change by hand (`clothes.change`); pajamas at night. |
| Food from supplies and equipment | Works | Groceries in the fridge, freezer and pantry, a recipe cooked for the servings chosen (`food.cook`); what’s short bought in place (`food.buy_short`); eating at home takes what’s ready first, then cooks, before spending. |
| Leftovers and cleanup | Part | Leftovers kept and eaten first; washing up isn't separate from the recipe's minutes. |
| Household activities or relaxing | Works | Laundry, tidying, a cleaner, and unwinding in front of live TV, a service you pay for or a game, with Britain’s and Ireland’s TV licences as their laws ask (`systems/homelife.ts`). |
| Invite someone, or leave for an appointment | Works | The calendar's commitments; a friend invited to a meal or home, answered for a stated reason (`social.invite`). |
| The same home state on return | Works | Everything persists in the save. |
| Evening routine and sleep | Works | A saved routine (`systems/routines.ts`), then sleep. |
| Depleted supplies, no clean clothes, interrupted cooking | Part | Each is refused with its reason; cooking isn't interrupted mid-way. |

## 39. Driving And Errands

| Step | Status | How |
|---|---|---|
| A vehicle they may drive | Works | A license checked per class (`mayDrive`). |
| Load belongings | Works | Into a car (`items.move`), and shopping bought on a trip rides in it within the maker’s cargo liters. |
| Several destinations | Works | Run Errands: up to eight stops in the town, each the screen's own command (`runErrands` in `systems/trips.ts`). |
| Time and resources | Works | Each leg the published average trip at the town’s TomTom traffic or at a walk, burning its fuel from the tank; a leg the tank can’t make is refused. |
| Fuel or charging stops | Works | A stop at a named station fills the tank at the pump price (`errand.fuel`); Fill Up and Charge It on Vehicles (`vehicle.refuel`), a public charge over a 50 kW charger’s time. |
| Pay and update | Works | Fuel is paid when it goes in; the month’s driving fills up at a quarter of a tank. |
| Park and complete errands | Works | The meter for each stop's minutes at the town's rate (`errand.park`); a shop shut on arrival ends the trip home. Tickets aren't drawn: how often meters are checked isn't published. |
| Load purchases | Works | Purchases ride in the car, or are carried on foot, until the trip is home, then put away; chilled food out past USDA’s two hours goes in the bin. |
| Put things away | Works | Belongings. |

## 40. International Travel

| Step | Status | How |
|---|---|---|
| Destination and dates | Works | `travel.book`. |
| Documents and permissions | Works | Passports, visas for the pairs that need one, ETAs and permission to work (`systems/permission.ts`). |
| Transport and accommodation | Works | Flights, trains, coaches or a car, and a hotel. |
| Seats, baggage, extras | Part | Cabin class and bags at the carriers' fees; seats are missing. |
| Pack items | Works | By hand into the suitcase within its 45 liters, or a week packed for you; leaving home takes it as packed. |
| Home and vehicle responsibilities | Part | Rent and bills run while away; a car stays where it is. |
| Travel insurance | Works | Bought with the trip at the home market's price; a trip lost to illness or injury paid back, care away the insurer's (`travel.insure`). |
| Departure, terminal, connections | Works | Check-in, the flights, delays and cancellations at BTS's rates, compensation where due. |
| Entry procedures | Works | The border, refused without the papers. |
| Belongings and local transport | Part | A taxi into town; belongings stay at home. |
| Check in | Part | As in 34. |
| Live at the destination | Works | Days there, jet lag, work there. |
| Return and unpack | Works | The way home is booked the same way, and the suitcase unpacked at home. |

## 41. Doctor Visit And Follow-Up

| Step | Status | How |
|---|---|---|
| A provider | Part | Each visit is at a named practice, urgent care centre or emergency department in the town, their own doctor where chosen (`health.choose_clinic`); it isn't searched or booked. |
| Eligibility, coverage, payment | Works | Plans, Medicaid, the NHS, COBRA, aid (`health.enroll`, `health.apply_aid`, `health.elect_cobra`). |
| Book and prepare | Missing | Not kept: an appointment's wait is published for a GP in England and a new patient in America, not in Ireland, Canada or Mexico City, and a condition's care begins at its diagnosis. |
| Travel and check in | Part | An emergency keeps you the department's median hours, missing what they held (`edMinutes`); a visit isn't travelled to. |
| Consultation | Part | `health.treat` treats an illness or injury at its cost. |
| Next steps, tests, referrals | Missing | Not kept: none of SLATE's conditions goes to a specialist without inventing which, though the waits are published for England, Canada and IMSS. |
| Payment or coverage | Works | The bill, the plan's share, `health.pay_bill`. |
| Prescriptions | Part | Filled at the counter at the plan's share or the chain's own cash price for a generic in America (`health.choose_pharmacy`); not picked up or delivered. |
| Recovery and follow-up | Part | Recovery runs its course; no follow-up visits. |
| Conflicts with work | Part | An injury recasts a part it can't be done in. |

## 42. Qualification Or License

| Step | Status | How |
|---|---|---|
| An activity and its requirement | Works | Driving by class, a boat, a pilot's license (`documents.license_step`, `boat.certify`, `pilot.train`). |
| Eligibility and prerequisites | Works | Age, residence, a learner's stage first. |
| Apply, instruction, assessment | Works | The steps in order, the test passed or failed. |
| Fees | Works | Each place's. |
| Processing | Works | Waits where the place makes them wait. |
| Issued, or a reason why not | Works | |
| Used within scope | Works | A class drives what it covers. |
| Renew or replace | Works | `documents.renew_license`, `documents.report_lost`. |
| Starting doesn't unlock | Works | A learner can't drive alone; `tests/licensing.test.ts`. |

## 43. Acting Commitment With Daily-Life Preparation

| Step | Status | How |
|---|---|---|
| An opportunity | Works | Auditions, self-tapes and offers (`systems/career.ts`). |
| Location, timing, terms | Works | The role, the production's town, the dates, the scale pay. |
| Schedule conflicts | Works | One commitment at a time; a clash is flagged on the calendar. |
| Preparation | Works | Classes, coaching, workshops, the kit. |
| Clothing, grooming, documents, transport, accommodation | Part | Documents and travel are checked and booked; the production's hotel; a barber or a salon by name (`hygiene.groom`), which a production doesn't yet ask for; a wardrobe fitting the day before screen work, paid as the union pays one, and the actor's own outfits lent at the union's allowance (`career.furnish_wardrobe`). |
| Travel and attend | Works | The career's trips as journeys. |
| The professional activity | Works | The shoot or the run. |
| Career and money | Works | Credits, pay, residuals, reputation. |
| Follow-up | Part | Residuals, and the Emmys or BAFTA Film where the work goes up for them (`systems/awards.ts`); a press day the week before a studio film opens or a series airs; junkets aren't kept, no agreement setting their terms. |
| Back to ordinary life | Works | Everything persists. |
