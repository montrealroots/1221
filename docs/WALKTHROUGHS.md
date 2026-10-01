# Walkthroughs

The ten end-to-end scenarios of the owner's Final Master Build Command (items
34 to 43), each step against what the build does as of 2026-10-01. **Works**
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
| Location, room categories, policies | Missing | Stage 6. |
| Room and bed configuration | Works | Each hotel's own room types and their beds, as its engine lists them. |
| Extras and requests | Missing | Stage 6. |
| Costs, taxes, deposit, cancellation | Part | The nightly rate and the town's hotel taxes; a cancellation refunds all but the first night, a no-show's (`hotelRefund`). No deposit or hold. |
| Confirm and pay | Works | Paid from the bank or the card. |
| Reservation on the calendar and the trip | Works | The journey and its hotel are one commitment on the calendar. |
| Travel there | Works | The journey's legs, each at its local time. |
| Check in | Part | Arrival puts them in the hotel; no check-in requirement is modeled. |
| Luggage to the room | Part | The carry-on goes with them, packed with a week's clothes and the bathroom's things (`systems/luggage.ts`); it isn't put in a room, and checked bags aren't items. |
| Facilities and services | Part | A hotel room has its bath, air conditioning and the building's gym (`HOTEL_FIXTURES`), and no kitchen. |
| Modify or extend | Works | `travel.extend`. |
| Charges and check-out | Part | Check-out is scheduled; there are no extra charges to review. |
| Belongings and onward | Part | Belongings stay where they are (`systems/items.ts`); nothing is left behind in a room. |

## 35. Clothing Purchase And Use

| Step | Status | How |
|---|---|---|
| A store or online | Works | Clothes screen: 1,198 real products from 74 retailers in five countries (`systems/clothing.ts`). |
| Filters | Part | Kind, retailer and where it's sold, and a search over brand, category, material and color; no size or budget filter. |
| Ascending prices | Works | Cheapest first, tax in. |
| An actual variant | Works | A size and a color the product comes in, checked. |
| Purchase or order | Works | `clothes.buy`, in a store here or online at the retailer's fee and working days. |
| Received at the right place | Works | Carried home, or delivered to the home they live in (`systems/orders.ts`). |
| Storage or worn | Works | The wardrobe; Belongings moves it (`items.move`). |
| An outfit | Works | `clothes.save_outfit`, from what's to hand. |
| Packed, cleaned, altered | Part | Packed for going away, washed at home or the laundromat and dry-cleaned at real shops' prices; alterations are missing (no body to fit, `docs/UNBITTEN.md`). |
| Return, repair, resell | Part | Returns inside the window, unworn (`clothes.return`); repair and resale are missing. |
| Unavailable sizes, delays, returns, location | Works | Each is refused or said in words; tests in `tests/clothing.test.ts`. |

## 36. Vehicle Purchase, Modification And Use

| Step | Status | How |
|---|---|---|
| Real models and listings | Works | Cars: each market's best-sellers at the makers' prices, new or used (`systems/vehicles.ts`). |
| Compare | Works | A catalog, cheapest first, taxed and registered. |
| Inspect or test | Missing | Stage 8. |
| Payment or financing | Works | Cash, a loan, or a lease (`vehicle.lease`). |
| Registration and insurance | Works | Each jurisdiction's fees and insurance. |
| Collect | Works | It's theirs where they bought it. |
| Compatible modifications | Part | `vehicle.modify`, `vehicle.tint`, `vehicle.winter_tires`: a list of mods at fitted prices; compatibility by model, paint, wraps and upholstery are Stage 8. |
| Itemized quote | Part | Each mod's price; no named shop's quote. |
| Book work, transport meanwhile | Part | A repair is booked at a named garage in its hours, and the car is in until closing or three days (`vehicle.repair`); loaners and rentals aren't kept. |
| Collect the work | Part | A mod is fitted at once. |
| Drive, park, fuel, maintain | Part | Driven every day at published mileage and fuel prices, parking permits, inspections; faults at RepairPal's rates, mended at a garage (`systems/repairs.ts`). Fuel stops and scheduled servicing aren't built. |
| Change mods or sell | Works | `vehicle.sell`; mods stay on the car. |

## 37. Land Purchase And Backyard Construction

| Step | Status | How |
|---|---|---|
| Find and compare parcels | Works | Land: listings by market, cheapest first (`systems/land.ts`). |
| Access, utilities, constraints | Part | Each market's kind and acreage; easements are missing (WORLD.md). |
| Purchase | Works | `land.offer`. |
| A project such as a field or a pool | Part | A house built on land (`build.start`), and on a home a pool, deck, patio, garage, suite or ADU, a tennis court in seven surfaces, a half basketball court, and lights for either (`home.renovate`); fields are Stage 12. |
| Feasibility and alternatives | Part | Whether the place allows a house; England doesn't. |
| Dimensions, materials, equipment | Part | A court's surface and its lot, Fixr's singles area for tennis and half an NBA court for basketball; rooms and finishes are Stage 12. |
| Quotes and approvals | Part | The permit and the place's fees, paid at the start; one cost, not bids. |
| Schedule and payments | Works | Staged payments on a build (`build.pay`). |
| Follow construction | Works | Stages, inspections, a failed one possible. |
| Inspection and acceptance | Works | |
| Use it | Part | A pool or a home's rooms add to its value; a pool to swim in (`life.look_after` swim), a court to play on in daylight or under its lights (`life.look_after` court). |
| Maintain, repair, remove | Part | Parts wear and are renewed (`pool-renew`, `deck-renew`); removal is missing. |

## 38. A Day At Home

| Step | Status | How |
|---|---|---|
| Wake at the right time and place | Works | `life.sleep`, the night where they are. |
| Bathroom facilities | Works | A shower, a bath where the home has one (`life.look_after`), using the bathroom's soap and shampoo; without them it leaves you less clean (`systems/hygiene.ts`). |
| Accessible clothes | Works | The day's outfit from what's to hand and clean (`systems/wardrobe.ts`). |
| Food from supplies and equipment | Works | Groceries in the fridge, freezer and pantry, a recipe cooked in a kitchen that has what it needs (`food.cook`). |
| Leftovers and cleanup | Part | Leftovers kept and eaten first; washing up isn't separate from the recipe's minutes. |
| Household activities or relaxing | Works | Laundry, tidying, unwinding, a cleaner. |
| Invite someone, or leave for an appointment | Part | The calendar's commitments; inviting someone waits on Stage 10. |
| The same home state on return | Works | Everything persists in the save. |
| Evening routine and sleep | Works | A saved routine (`systems/routines.ts`), then sleep. |
| Depleted supplies, no clean clothes, interrupted cooking | Part | Each is refused with its reason; cooking isn't interrupted mid-way. |

## 39. Driving And Errands

| Step | Status | How |
|---|---|---|
| A vehicle they may drive | Works | A license checked per class (`mayDrive`). |
| Load belongings | Works | Into a car (`items.move`). |
| Several destinations | Missing | Stage 7. |
| Time and resources | Part | A journey's car leg costs its time and fuel. |
| Fuel or charging stops | Missing | Stage 7. |
| Pay and update | Part | Fuel bought monthly with the everyday driving. |
| Park and complete errands | Part | A store sells only in its own opening hours (`systems/errands.ts`); parking isn't built. |
| Load purchases | Part | Clothes and groceries go home; not into the car. |
| Put things away | Works | Belongings. |

## 40. International Travel

| Step | Status | How |
|---|---|---|
| Destination and dates | Works | `travel.book`. |
| Documents and permissions | Works | Passports, visas for the pairs that need one, ETAs and permission to work (`systems/permission.ts`). |
| Transport and accommodation | Works | Flights, trains, coaches or a car, and a hotel. |
| Seats, baggage, extras | Part | Cabin class and bags at the carriers' fees; seats are missing. |
| Pack items | Part | A week's clothes and the toiletries packed on leaving home, the cleanest first; not chosen by hand. |
| Home and vehicle responsibilities | Part | Rent and bills run while away; a car stays where it is. |
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
| Book and prepare | Missing | Stage 9. |
| Travel and check in | Missing | Stage 9. |
| Consultation | Part | `health.treat` treats an illness or injury at its cost. |
| Next steps, tests, referrals | Missing | Stage 9. |
| Payment or coverage | Works | The bill, the plan's share, `health.pay_bill`. |
| Prescriptions | Missing | Stage 9. |
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
| Follow-up | Part | Residuals, and the Emmys or BAFTA Film where the work goes up for them (`systems/awards.ts`); press and junkets aren't built. |
| Back to ordinary life | Works | Everything persists. |
