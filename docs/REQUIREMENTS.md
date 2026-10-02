# Requirements: what the owner asked for, and what the code does

The owner's Complete Master Development Plan (2026-10-02) is the authority.
This page records each requested experience against the code as it stands,
audited in the code that day rather than taken from `docs/BACKLOG.md`'s
labels. A status is one of:

- **Complete**: a player can do it through the screens; it validates,
  persists, reaches the systems it touches, and a test covers it.
- **Partial**: part of it exists; the gap says exactly what doesn't.
- **Not implemented.**
- **Blocked**: only with a named external blocker.

When a stage is built its rows change here in the same commit. A row is never
marked complete because code was written; the tests named are the evidence,
for the cases they test.

The numbers are the plan's sections. "Where" names the code to extend, not
replace.

---

## The order of the build

Correctness first, then the connected day the plan asks to be shown working
(§62), then each domain by player impact.

1. **What broke a rule, fixed 2026-10-02.** A hotel or rental deposit that failed
   granted the stay until 2026-10-02 (§48i; now held until paid or the day
   ends). A saved outfit was worn though a piece was out of
   reach, and a piece that couldn't be worn was silently swapped, until
   2026-10-02 (§32g, §27b; now refused, and a swap on the day is told). An
   order's "returned" state was declared and never set until 2026-10-02
   (§30; now set, and an order can be canceled where the law gives it). A fitting was
   paid without the actor there (§53.5), and Look After Yourself's "eat" paid
   money and never touched the kitchen (§33g), until 2026-10-02. All five are
   fixed.
2. **The connected day (§62).** A fuel tank and refuelling at a station
   (§39). Dressing as a timed change into a worn state, with the hamper
   (§32d–e). The shower with a towel, products and duration (§31). Cooking by
   servings, washing up (§33). Purchases carried or in the car until unloaded
   (§40e). Dressing for an acting commitment (§53.11).
3. **Shopping (§20–30).** Cart and checkout with a receipt; the order's whole
   lifecycle; the offer layer and exact variants; Jordans and designer
   resale; departments and subtypes; body measurements and size charts;
   phones as devices with activation; jewelry and watches as pieces; store
   branches.
4. **Vehicles (§36–40).** Delivery and collection; catalog fields and
   individual listings; the leopard interior; factory options; a live trip
   with parking.
5. **Travel (§46–49).** Manual packing; a stay you unpack into; a luggage
   catalog; hotel amenities and policies; companions; check-in; boat and
   pilot credentials as documents; replacing a lost document; ground
   transport; rebooking choices.
6. **Care, people, services (§50–54).** Booking appointments; prescriptions;
   referrals and rehabilitation; contacts with lives of their own; a child's
   day and caregiving time; gas, water and waste; lessons, sports,
   memberships; accessibility.
7. **Property (§41–45).** Feasibility with alternatives; a football field and
   play with friends on courts and fields; renovation by stages; special
   rooms; outdoor additions; the furniture lifecycle; rooms; parcel
   attributes; a custom build brief; verified against simulated listings.
8. **Home life (§34–35, §10).** Television, reading, music and games;
   cleaning consumables, waste, appliance faults; access and visit windows
   for staff; shortcuts' breadth; hosting.

---

## Part 4. Shopping, clothing and possessions

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 20 | Product, offer, owned item distinct; variant persists | Partial | `ClothingProduct` is product and offer in one; `Item.spec` keeps size and color | An offer layer (seller, condition, price) and a variant id |
| 21 | Stores with hours and stock; websites with destinations, shipping, tracking | Partial | `storesIn` city list; `purchaseQuote` fee, threshold, days | Branch records (address, hours, services, stock); destinations, shipping tiers, click-and-collect, payment choice, tracking stages |
| 22a | Find, browse, search, filter | Complete | `clothingCatalog`, `arrange`; tests/catalog, clothing | Facets for size, color, material, price band |
| 22b | Product page, variant, compare offers | Partial | `Choose` in ClothesWorkspace | Product page with size chart and source; compare sellers |
| 22c | Cart, collection or delivery, review, pay | Not implemented | `clothes.buy` is one line | Cart, checkout, basket-level delivery threshold, payment choice |
| 22d | Receipt and order record | Partial | `ClothesPurchase`, `Order` | Receipt lines; `Order` "returned" never set |
| 22e | An unfulfilled order isn't usable | Complete | `at:{kind:'order'}` unreachable; tests/items | In-store pickup of an online order |
| 22f | Store, use, return, repair, gift, resell | Partial | moves, laundry, return, resale; tests | Repair, gift, refund to the original payment |
| 23 | Departments; petite, tall, extended, maternity, adaptive; nothing blocked by gender | Partial | No gender gate | `department`, fit range, browsing preference; adaptive and more maternity |
| 24 | Subcategories (underwear styles, lingerie, hosiery, swimwear, thermals, cultural…) | Partial | 16 kinds, 11 slots | `subtype`; swimwear, shapewear, hosiery, slips, cultural clothing |
| 25 | Fit by real measures and size charts | Partial | Size from BMI share (`sizeFor`) | Body measurements; charts per retailer; shoe and ring fit; waist-by-inseam |
| 26 | Jordans and designer products, retail vs resale | Not implemented (Jordans), partial (designer) | 8 luxury retailers | Sneaker catalog with style codes and colorways; resale sellers and condition |
| 27a | Receive, store | Complete | delivery, `items.move`; tests/items | — |
| 27b | Wear, layer, remove | Partial | one garment per slot; `dressRefusal` validates `dress` and `wear_outfit` (2026-10-02) | Layers, undress, sleepwear, accessories worn |
| 27c | Wash, dry, clean | Complete | `doLaundry`, dry cleaning; tests | Wash a chosen garment; air-dry or tumble |
| 27d | Alter, repair | Partial | take in only | Hem, let out; damage and repair |
| 27e | Pack, unpack | Partial (automatic) | luggage.ts | Manual packing (§46) |
| 27f | Gift, return, resell, replace | Partial | return, resell, replace | Gift |
| 27g | Outfits from owned, reachable items; worn outfit persists | Partial | `outfitRefusal`, `reachable` | The worn outfit itself (`wearing`, deleted 2026-10-02, to come back as a real worn state) |
| 28 | Phones and electronics as devices, activation, plans, finance, trade-in | Not implemented (device), partial (plan) | `MOBILE` plan billed | Device catalog and item, activation, plan choice, finance, trade-in, repair; messages and contacts |
| 29 | Jewelry and watches as pieces, commissions, servicing, insurance, resale | Partial (catalog only) | about 121 pieces as garments | A `jewel` record, worn, a safe, servicing, insurance rider, fair resale, commissions |
| 30 | Orders: states, destination, failed delivery, cancellation, return, refund once | Partial | `Order`, `deliver` once; `returned` set and `clothes.cancel` where the law gives it, GB and IE (2026-10-02) | Shipped and out-for-delivery, failed delivery, partial returns, refund to the payment |

## Part 5. Daily life

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 31a | Reach an accessible bathroom | Partial | `lookAfterRefusal` | Rooms; a shared or busy bathroom |
| 31b | Shower or bath | Complete | `wash`/`bathe`; tests/looking-after | — |
| 31c | Supplies and towel | Partial | `showerUses` by grams | Towels as items; a prepare step |
| 31d | Products, duration, routine | Not implemented | `take()` picks the first | Choose product, minutes, conditioner |
| 31e | Perform; time; hygiene | Complete | life.ts | — |
| 31f | Water and energy | Not implemented | `powerDay` spoils food only | Hot water by heater and outage; water and energy billed |
| 31g | Dry off, change, used towel to laundry | Not implemented | — | Towel wear, a change after |
| 31h | Grooming at home | Partial | salon, teeth, deodorant | Shave, hair, makeup at home; preferences |
| 32a | Browse wardrobe, drawers, luggage | Partial | `reachable`, WhatToWear | Browse by location |
| 32b | Filter by occasion, type, size, color, condition | Not implemented | `spec`, `condition` exist | Filters; occasion tags |
| 32c | Pieces and layers | Partial | one per slot | Layering |
| 32d | Change, with time and a worn state | Not implemented | `clothes.dress` sets a preference | Worn state; a timed change |
| 32e | Removed items stored or to the hamper | Not implemented | — | Hamper spot; take-off choice |
| 32f | Save an outfit | Complete | tests/clothing, wardrobe | — |
| 32g | Never silently replace a garment | Done, 2026-10-02 | `chosenMissing`; `wearTheDay` tells what stood in and why; tests/wardrobe.test.ts | — |
| 33a | Inspect supplies and equipment | Partial | Kitchen panel | Equipment from installed appliances |
| 33b | Meal and portions | Partial | always full servings | Servings scale |
| 33c | Ingredients and time | Complete | `cookRefusal`; tests/kitchen | — |
| 33d | Obtain or substitute missing | Partial | groceries in store | Buy what's short; substitutes |
| 33e | Cook; interruptions | Partial | refused if busy | Clash check; outcome; energy |
| 33f | Serve self or others | Partial | self only | Guests and household |
| 33g | Eat | Done, 2026-10-02 | `food.eat_ready`; `look_after eat` reads `kitchenMeal`: what's ready, else a recipe the stock makes, before money; tests/kitchen.test.ts | — |
| 33h | Leftovers, freshness | Complete | tests/kitchen | Freezing |
| 33i | Wash up | Not implemented | — | Dirty dishes, washing, dishwasher |
| 33j | Restaurants, takeout, delivery, drinks | Complete | `food.dine`, `food.drink`; tests | — |
| 33k | Reservations | Not implemented | — | Book a table ahead |
| 34a | Television | Not implemented | TV is furniture | Watch: a service, a programme, stop and resume |
| 34b | Reading, music, gaming, hobbies | Not implemented | all are "unwind" | Actions per activity |
| 34c–f | Exercise, relaxation, sleep, time | Complete | life.ts; tests | — |
| 35a | Cleaning | Partial | `tidy` scalar | Rooms, cleaning supplies |
| 35b | Laundry | Complete | `doLaundry`; tests/wardrobe | Detergent; towels and bedding |
| 35c | Organizing | Partial | spots | Rooms; capacity |
| 35d | Waste | Not implemented | — | Bins, collection, recycling |
| 35e | Replacing supplies | Partial | automatic restock | Household consumables |
| 35f | Appliance repair | Not implemented | appliances age out | Faults, repair visits |
| 35g | Hosting | Partial | `social.invite` visit | Reads food, drink, tidiness, seats |
| 35h | Cleaners and gardeners | Partial | weekly cleaner; gardener | Access, visit windows, work recorded |
| 10 | Shortcuts follow the same rules | Partial | routines run through commands; tests/routines | Background top-ups bypass time and hours; favorites, repeat orders, scheduled routines |

## Part 6. Vehicles and movement

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 36a | Make, model, year, body, trim, powertrain, drivetrain | Partial | `CarModel` | Year, body, transmission, drivetrain, tank or battery, seats, cargo |
| 36b | Kinds incl. trucks, boats, aircraft | Partial | 9 kinds; one boat, one plane | Pickup kind; boat and aircraft catalogs |
| 36c | Market and seller, verified offerings | Partial | home market only | Seller entity; another market |
| 36d | Condition, mileage, used listings | Partial | age and hidden fault | Individual listings: mileage, condition, history, seller |
| 36e | Factory options vs aftermarket | Not implemented (factory) | mods, wraps, tint, stereo | Option packs, paint, wheels |
| 36f | Pricing | Complete | `quote`; tests/vehicles | — |
| 37a–d | Market and seller, filter, compare, specs and history | Partial or not implemented | catalog facets | Listings, comparison, spec and history |
| 37e | Inspection, test drive | Partial | `vehicle.inspect_used` | Test drive |
| 37f | Configure options | Not implemented | — | Options in the quote |
| 37g | Cost, trade-in, funding | Complete | tests/vehicles, leasing | — |
| 37h | Ownership requirements | Partial | checked when driving | Title and registration step |
| 37i | Not drivable until delivered | Not implemented | bought cars drive at once | Delivery and collection |
| 37j | Use and maintain | Complete | carcare, repairs; tests | — |
| 37k | Sell or trade | Partial | instant sale | Listing, buyer, time |
| 38a | Wraps and finishes | Partial | two cities | More shops; removal; partial wraps |
| 38b–c | Trim, lighting, body, rims, tires | Not implemented / partial | winter tires; alloys (GB) | Catalogs |
| 38d, g–l | Seats, upholstery, materials, stitching; the leopard interior | Not implemented | — | Interior configuration, compatibility, upholsterers, itemized estimate, booking, collection, revision, removed parts |
| 38e | Audio | Partial | one head unit | Speakers, amplifiers |
| 38f | Storage, mechanical upgrades | Partial | GB only | Racks, boxes; beyond GB |
| 38i | Alternative transport | Complete (repairs) | `vehicle.stand_in`; tests | Wrap and interior work too |
| 39a–b | Tank or charge, range | Partial | consumption only | Tank and charge level; range |
| 39c–d | Stops, belongings, passengers | Partial | errands; one passenger | Cargo and seats checked |
| 39e | Route and time | Complete | tests/driving, trips, journey | — |
| 39f | Refuel at a station | Partial, substitutes an expense | `errand.fuel` pays accrued cost | A real refuel against the tank |
| 39g | Charging | Partial | home and public price | Charge level, sessions |
| 40a | Several destinations | Complete | `runErrands`; tests/trips | More stop kinds |
| 40b | Change the plan mid-trip | Partial | one-click run | Step-by-step trip |
| 40c | Parking | Partial | meter by the minute | Lots and garages; limits |
| 40d | Hours, appointments | Partial | closed shops refuse | Appointment slots |
| 40e | Purchases carried or in the car until moved | Not implemented | groceries go home at once | Carried and in-car places; unload |
| 40g | Out of fuel | Not implemented | — | With the tank |
| 40h | Breakdowns, delays | Partial | severe fault refuses | Mid-trip breakdown; tow |
| 40i | Where it's parked | Partial | town only | Spot level |

## Part 7. Property, building and space

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 41a, h, i, k | Many properties; buy, finance, let, manage, sell | Complete | homes.ts, land.ts; tests | — |
| 41b | Ownership rights and tenure | Partial | freehold only | Tenure, co-owners, easements |
| 41c | Usable space | Partial | beds, baths, size | Rooms |
| 41d–e | Terrain, access, utilities | Not implemented / partial | services on bare land | Parcel attributes read by the build |
| 41f | Restrictions | Partial | zoning | HOA, conservation, setbacks |
| 41g | Inspection | Partial | home inspection | Survey, title, environment |
| 41j | Development | Partial | renovation; one house on land | Outbuildings; subdivision for sale |
| 41l | Verified vs simulated | Partial | fine print says simulated | A `source` field |
| 42 | Construction walkthrough | Partial | builds by stages (complete); home projects paid up front | Bid choice, stages and payments for projects, change orders, cancellation, acceptance |
| 43a–b | Rooms, finishes | Not implemented / partial | parts with ages | Rooms; finish grade kept |
| 43c | Furniture | Partial | 5 pieces | Wider catalog, each with a use |
| 43d–h | Appliances, lighting, storage, security, utilities | Partial | fixtures; security | Fixture choice, lighting, capacity |
| 43i | Special rooms | Partial | home gym | Theater, studio, library, workshop, dressing room, game room |
| 43j–l | Pools, gardens, outdoor kitchen, guesthouse, courts, track | Partial | pool, courts, ADU | Gardens, greenhouse, outdoor kitchen use, guests in the ADU, track |
| 43m | Football field, solo and with friends | Not implemented | — | Field project; drills; play with friends |
| 44a–b | Space, ownership | Complete | `projectRefusal`, `mostFloor` | — |
| 44c–d | Permission, structure, access | Partial / not implemented | permits | Refusal outcome; structural checks |
| 44e–f | Explain and offer alternatives | Partial | projects hidden by type | Show them refused, with alternatives |
| 45a, c, i | Bed sizes by market, compatibility, use | Complete | content/beds.ts; tests/beds | More markets |
| 45b, d–h, j–k | Materials, bedding, room fit, delivery, assembly, placement, cleaning, repair, resale | Partial or not implemented | — | The furniture lifecycle |

## Part 8. Travel, hotels, documents

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 46 | Manual packing | Not implemented (automatic) | luggage.ts `pack`/`unpack` | Volumes; a packing screen; presets through `moveRefusal`; a stay to unpack into; repack; a luggage catalog |
| 47a–c, g, l | Planning, documents, booking, cancellation, charters and ferries | Complete | journey.ts; tests | Destinations limited to towns with stays |
| 47d–f, h–k | Departure transport, connections, delays, changes, local transport, activities | Partial | — | Choices of ground transport; missed connections; rebooking choice; change the outbound; taxi and rideshare |
| 47m | Companions | Not implemented | — | Travellers on a journey |
| 47o | Home while away | Partial | bills run | House-sitter, mail, spoilage checked |
| 48a–b | Search named properties by dates, guests, budget | Partial | 28 hotels in 8 towns | Guests, rooms, filters |
| 48c | Compare total stay | Complete | `namedStayQuote`; tests/hotels | — |
| 48d–f | Inspect rooms, extras, terms | Partial | bed, hours, deposit, parking | Amenities, accessibility, policies; extras |
| 48g | Book and pay | Complete | `travel.book`; tests | Hotel-only booking |
| 48h | Check-in requirements | Partial | age at booking | Check-in step |
| 48i | A failed deposit isn't a granted stay | Done, 2026-10-02 | journey.ts `holdForDeposit`, `travel.pay_deposit`; rentals.ts `held`, `travel.pay_rental_deposit`; standin.ts refuses; tests/deposits.test.ts | — |
| 48j–n | Room, belongings, facilities, extend, charges, check-out | Partial or not implemented | — | A stay place; fixtures from the property; incidentals |
| 49a–b, e–g, i | Identity, driving, entry, residence, work, building approval | Complete | documents.ts, licensing.ts, permission.ts, permits.ts; tests | Appointments and evidence steps |
| 49c–d | Boating, aviation | Partial | instant certificate; checkride always passes | Course, exam, failure, a document |
| 49k | Loss and replacement | Partial | passport only | Licence and ID replacement |

## Part 9. Healthcare, people, career, services

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 50.1–2 | Find a provider; access and coverage | Partial | 35 providers in 8 towns | Dentists, opticians, therapists, specialists; a quote before care |
| 50.3–7 | Book, prepare, attend, outcome, referral | Not implemented | care is drawn | Appointments, attendance, outcomes, referrals |
| 50.8 | Payment and coverage | Complete | bills, aid; tests | — |
| 50.9–11 | Prescriptions, recovery, commitments | Partial | — | §51; follow-ups |
| 51.1 | Prescriptions | Partial | paid at the counter | A prescription, supply, refills, collection |
| 51.2 | Insurance | Partial | deep cover engine | Claims and denials; private cover abroad |
| 51.3 | Travel insurance | Complete | tests/travelinsurance | — |
| 51.4 | Accessibility | Not implemented | — | A needs model and venue attributes |
| 52.1–4 | Friends, dating, partners, marriage | Complete | people, dating, marriage; tests | More activities |
| 52.5–6 | Parenting, caregiving | Partial | costs and benefits | A child's day; care given as time |
| 52.7–9 | Lives of their own; shared activities; household | Partial | `declines()` | Availability, interests, memory read; activities; chores |
| 53.1–2, 4, 6–9 | Representation, auditions, contracts, work, travel, press, awards | Complete | career.ts; tests | Breakdowns; attending a ceremony |
| 53.3, 10–11 | Preparation, professional contacts, dressing for the room | Partial | coaching | Prep time; casting contacts; a dress check |
| 53.5 | Fittings | Done, 2026-10-02 | paid only when `present`, missed otherwise; tests/fittings.test.ts | — |
| 53.12 | Products never confer ability | Complete | `bookingChance` | Self-tape kit documented as recording quality |
| 54.1–5 | Staff, lessons, sports, memberships, community | Partial or not implemented | cleaner, gardener, trainer, gym | Lessons, clubs, leagues, community |
| 54.7, 10 | Electricity, internet and phone | Complete | electricity.ts, telecom.ts; tests | Supplier choice; internet outages |
| 54.8–9, 11–12 | Gas, water, waste, outages | Partial or not implemented | atlas estimate | Accounts and tariffs; outages |
| 54.13 | No unrelated jobs | Complete | — | — |

## Part 10. The assistant and the way through

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 55 | An assistant that proposes validated actions | Complete in code, not activated | systems/assistant.ts, askAssistant, ui/assistant; tests/assistant | Customization builder and development roles; the owner's key |
| 56 | Supported connection, costs, credentials, works without it | Complete in code | docs/AI-INTEGRATION.md | Activation by the owner |
| 57 | New mechanics reviewed, never run against saves | Partial | proposals only | A development-proposal role |
| 58 | Navigation keeps context | Partial | breadcrumbs, pins, `/` search | From a missing ingredient to the shop and back to the meal |
| 59 | Activity states, recovery, no duplicates | Partial | orders, journeys, works | A common state model across activities |
| 62 | The connected day, shown working | Not yet shown | — | After order step 2 |
