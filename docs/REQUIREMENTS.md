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
| 20 | Product, offer, owned item distinct; variant persists | Partial | sneakers have product, offers (seller, condition, price) and an owned pair keeping code, size and condition (2026-10-02); `ClothingProduct` is still product and offer in one | The offer layer for the rest of clothing |
| 21 | Stores with hours and stock; websites with destinations, shipping, tracking | Partial | `storesIn` city list; `purchaseQuote` fee, threshold, days | Branch records (address, hours, services, stock); destinations, shipping tiers, click-and-collect, payment choice, tracking stages |
| 22a | Find, browse, search, filter | Complete | `clothingCatalog`, `arrange`; department and type facets (2026-10-02); tests/catalog, clothing | Size, color and material facets |
| 22b | Product page, variant, compare offers | Partial | `Choose` in ClothesWorkspace | Product page with size chart and source; compare sellers |
| 22c | Cart, collection or delivery, review, pay | Done for clothes, 2026-10-02 | `clothes.basket_add`, `basket_remove`, `checkout`: one payment and one order per retailer, the threshold on the order | Groceries and toiletries in the basket; choosing the card |
| 22d | Receipt and order record | Partial | `ClothesPurchase`, `Order`; `returned` set once all of an order is back (2026-10-02); the checkout's ledger entry names the retailer and count | Receipt lines as a document |
| 22e | An unfulfilled order isn't usable | Complete | `at:{kind:'order'}` unreachable; tests/items | In-store pickup of an online order |
| 22f | Store, use, return, repair, gift, resell | Partial | moves, laundry, return, resale; from 2026-10-02 a return refunded to what paid, the card or the bank, in its shares (`paidFrom`), shown as Paid With; a thing given to a friend here, theirs from then and remembered (`items.give`); tests | Repair |
| 23 | Departments; petite, tall, extended, maternity, adaptive; nothing blocked by gender | Partial | No gender gate | `department`, fit range, browsing preference; adaptive and more maternity |
| 24 | Subcategories (underwear styles, lingerie, hosiery, swimwear, thermals, cultural…) | Partial | 16 kinds, 11 slots | `subtype`; swimwear, shapewear, hosiery, slips, cultural clothing |
| 25 | Fit by real measures and size charts | Partial, 2026-10-02 | measurements given and the charts sized by (`clothes.measures`); 130 retailers' own charts (`content/sizecharts.ts`): a top by chest or bust, a bottom by waist (`chartSize`); a shoe by foot length on 45 brands' charts, one shorter than the foot not worn (`shoeRow`); body mass index otherwise | Ring fit; waist-by-inseam; hips read |
| 26 | Jordans and designer products, retail vs resale | Partial, 2026-10-02 | 30 Air Jordans by style code (`content/sneakers.ts`): retail offers in five markets with tax, GOAT new and used asks with shipping in America, sold on GOAT at its fees; tests/sneakers.test.ts | StockX (refused the reads); GOAT outside America; designer resale (Vestiaire and The RealReal schedules are in the research, not built) |
| 27a | Receive, store | Complete | delivery, `items.move`; tests/items | — |
| 27b | Wear, layer, remove | Partial | one garment per slot; `dressRefusal` validates `dress` and `wear_outfit`; jewelry, watches and accessories chosen and worn with the outfit; sleepwear worn at night at home (2026-10-02) | Layers, undress |
| 27c | Wash, dry, clean | Complete | `doLaundry`, dry cleaning; tests | Wash a chosen garment; air-dry or tumble |
| 27d | Alter, repair | Partial, 2026-10-02 | taken in, a size at most for a bottom, suit or coat; let out once, a bottom three quarters of a size and a suit or coat two fifths, by Proper Cloth's own figures (1.5 and 0.8 inches around of a 2-inch step), at the tailor's waist price (`ALTER_STEPS`, `alteredKg`) | Hem (no garment keeps a length); a shirt's or dress's limits (unpublished); damage and repair |
| 27e | Pack, unpack | Done, 2026-10-02 | luggage.ts; by hand on Belongings, Pack For Me, Unpack (§46) | — |
| 27f | Gift, return, resell, replace | Done, 2026-10-02 | return, resell, replace; give (`items.give`) | — |
| 27g | Outfits from owned, reachable items; worn outfit persists | Done, 2026-10-02 | `outfitRefusal`, `reachable`; `Person.wornNow`, set as the day dresses them or they change; read by the sale refusal and Clothes | — |
| 28 | Phones and electronics as devices, activation, plans, finance, trade-in | Partial, 2026-10-02 | `systems/phones.ts`: 273 phones on the makers' stores in five markets; outright or a maker's 0% plan (prepaid lines kept out where the plan says); trade-in at the published most; activation at the carrier's SIM charge; battery wear by Apple's 1,000-cycle figure and replacement; cover billed monthly; tests/phones.test.ts | Screens breaking (no published rate); theft and loss claims; carrier device plans; credit approval; other electronics |
| 29 | Jewelry and watches as pieces, commissions, servicing, insurance, resale | Partial, 2026-10-02 | about 121 pieces as garments, worn with the outfit; a burglary takes those at home not locked in a safe or worn; safes at named sellers' prices, holding their liters (`valuables.buy_safe`, `valuables.lock_up`, `valuables.take_out`); a standard policy pays up to its published jewelry limit (Lemonade, TD, Aviva, GNP); a piece scheduled is paid in full for a premium each month (`valuables.schedule`, the rate SLATE's arithmetic on Lemonade's averages); sold on as clothes are (`clothes.sell`, `systems/resale.ts`): Vinted's 28% of the new price in Britain and Ireland, a ThredUp bag in America, Kijiji's half in Canada ; pawned for 37.5% of the second-hand worth, the NPA range's middle, at each place's law or a named pawnbroker's rates and days, redeemed or forfeit with the surplus where the law gives it (`pawn.pledge`, `pawn.redeem`; New York, Los Angeles, New Haven, Toronto at the federal ceiling, London at H&T's, Dublin at Carthy's) | Servicing and batteries; pawning in Mexico City (Monte de Piedad's own appraisal) and Vancouver (no rules since 2002); commissions |
| 30 | Orders: states, destination, failed delivery, cancellation, return, refund once | Partial | `Order`, `deliver` once; `returned` set and `clothes.cancel` where the law gives it, GB and IE (2026-10-02); a return refunded to what paid, the card or the bank, in its shares (`paidFrom`, 2026-10-02); a basket returned a purchase at a time, the order marked returned once all of it is back (`returnClothes`) | Shipped and out-for-delivery; failed delivery (`research-failed-delivery.json`: every carrier read leaves a parcel without a signature unless the shipper asks for one, and no retailer of SLATE's publishes which of its orders do, so nobody home changes no order yet) |

## Part 5. Daily life

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 31a | Reach an accessible bathroom | Partial | `lookAfterRefusal` | Rooms; a shared or busy bathroom |
| 31b | Shower or bath | Complete | `wash`/`bathe`; tests/looking-after | — |
| 31c | Supplies and towel | Done, 2026-10-02 | `showerUses` by grams; bath towels as items (`starterTowels`, `useTowel`) | Buying towels |
| 31d | Products, duration, routine | Partial, 2026-10-02 | the product chosen first used before the others of its kind, then an open bottle before a new one, and the chosen one bought again where it's sold (`hygiene.use_first`, `inUseOrder`); conditioner used after the shampoo where bought, Loretz's 13.13 g a use | the shower's minutes (REU2016's 7.8, read in `research-water-washing.json`, against the 20 the action takes with drying and dressing) |
| 31e | Perform; time; hygiene | Complete | life.ts | — |
| 31f | Water and energy | Partial | electricity billed at each town's own tariff on the kWh the home used (`systems/electricity.ts`); a power cut spoils the fridge and freezer (`powerDay`, `spoilWithoutPower`) | Hot water by heater and outage; water billed apart from the atlas's bills |
| 31g | Dry off, change, used towel to laundry | Done, 2026-10-02 | a home shower uses a towel, three uses to the wash (Cleveland Clinic), washed with the clothes; `clothes.change` after | — |
| 31h | Grooming at home | Partial | salon, teeth, deodorant | Shave, hair, makeup at home; preferences |
| 32a | Browse wardrobe, drawers, luggage | Done | `reachable`, WhatToWear; Belongings grouped by where each thing is, Where Things Are | — |
| 32b | Filter by occasion, type, size, color, condition | Partial, 2026-10-02 | Belongings filters by kind, clean or not, condition, color and size, and finds by name (`systems/itemfacets.ts`) | Occasion tags (no source tags garments by occasion) |
| 32c | Pieces and layers | Partial | one per slot | Layering |
| 32d | Change, with time and a worn state | Done, 2026-10-02 | `clothes.change`: `CHANGE_MINUTES` (SLATE's estimate), each piece a wear, `wornNow`; tests/wardrobe.test.ts | — |
| 32e | Removed items stored or to the hamper | Done, 2026-10-02 | the laundry basket, a spot at home: what you have on goes Into The Laundry Basket to be washed with the next load, put back where its kind is kept; left out, it's worn again until its count (`toBasket`) | — |
| 32f | Save an outfit | Complete | tests/clothing, wardrobe | — |
| 32g | Never silently replace a garment | Done, 2026-10-02 | `chosenMissing`; `wearTheDay` tells what stood in and why; tests/wardrobe.test.ts | — |
| 33a | Inspect supplies and equipment | Partial | Kitchen panel | Equipment from installed appliances |
| 33b | Meal and portions | Done, 2026-10-02 | `food.cook` takes servings, one to three times the recipe's, its ingredients scaled (`servingsRange`); tests/kitchen.test.ts | — |
| 33c | Ingredients and time | Complete | `cookRefusal`; tests/kitchen | — |
| 33d | Obtain or substitute missing | Partial | groceries in store; what a recipe is short of bought in one go, cheapest in reach, refused for what no store here sells (`food.buy_short`, `shortfall`) | Substitutes (no published substitution table SLATE reads) |
| 33e | Cook; interruptions | Partial | refused if busy | Clash check; outcome; energy |
| 33f | Serve self or others | Partial | self only | Guests and household |
| 33g | Eat | Done, 2026-10-02 | `food.eat_ready`; `look_after eat` reads `kitchenMeal`: what's ready, else a recipe the stock makes, before money; tests/kitchen.test.ts | — |
| 33h | Leftovers, freshness | Complete | tests/kitchen | Freezing |
| 33i | Wash up | Partial | a dishwasher's tablets used, 184 cycles a year (`dishwasherRuns`), cutting the day's mess; without one the dishes are done by hand in the tidy | Dirty dishes as things; a wash-up step |
| 33j | Restaurants, takeout, delivery, drinks | Complete | `food.dine`, `food.drink`; tests | — |
| 33k | Reservations | Not implemented | — | Book a table ahead |
| 34a | Television | Partial, 2026-10-02 | `systems/homelife.ts`: 146 service tiers in five markets billed monthly; Britain's and Ireland's TV licences as their law asks; unwinding names live TV or a service; tests/homelife.test.ts | A programme; stop and resume |
| 34b | Reading, music, gaming, hobbies | Partial, 2026-10-02 | music services billed; consoles bought; unwinding in a game needs one; a reader unwinds with pleasure only with something to read at home: the town’s library card, free to a resident (8 libraries, each one’s own page), or a paperback or an e-reader at a named seller’s price, cheapest first (`reading.library_card`, `reading.buy`) | Hobbies; games owned; books read through |
| 34c–f | Exercise, relaxation, sleep, time | Complete | life.ts; tests | — |
| 35a | Cleaning | Partial | `tidy` scalar; the chains' cleaning products on sale (`content/cleaning.ts`), a dishwasher's tablets used, 184 cycles a year | Rooms; how fast sprays and sponges go (unpublished) |
| 35b | Laundry | Complete | `doLaundry`, a load's detergent each, refused without; tests/wardrobe, tests/cleaning; towels a garment each shower wears toward its wash (`useTowel`) | Bedding |
| 35c | Organizing | Partial | spots; a bag's, a safe's and IKEA storage's liters, refused when full (`moveRefusal`) | Rooms; a home spot's own capacity |
| 35d | Waste | Partial, 2026-10-02 | `systems/waste.ts`: each research town's household charge in the bills (LA's schedule, Toronto, Vancouver, Dublin; London, Mexico City, New York and New Haven none) | Bin size and plan choice; collection days; bulky items |
| 35e | Replacing supplies | Partial | automatic restock; laundry and dishwasher detergent used up and bought again with a week's use left | Cleaning sprays and sponges, sold but never used up (how fast they go is unpublished) |
| 35f | Appliance repair | Done, 2026-10-02 | `systems/appliancefaults.ts`: washer, dishwasher and fridge faults at Consumer Reports' and Which?'s rates (decider `home.appliance_fault`); the laundromat, washing by hand, a spoiled fridge; the landlord's mended free next morning, one's own booked at each market's price | Dryer and air conditioning faults (no rate with a period published) |
| 35g | Hosting | Done, 2026-10-02 | `social.host` (`systems/hosting.ts`): several friends, dinner or drinks; seats and a table from the furniture; dinner paid at home's meal price; drinks poured from the kitchen's beer and wine; a mess noticed | — |
| 35h | Cleaners and gardeners | Partial | weekly cleaner; gardener; from 2026-10-02 the cleaner comes at ten, SLATE's reading, getting in with a key or with somebody home, a visit missed not cleaned or charged (`cleanerGetsIn`) | Work recorded |
| 10 | Shortcuts follow the same rules | Partial | routines run through commands; tests/routines; from 2026-10-02 Buy Again puts a past purchase back in the basket the same way, size and color, by the same refusals (`againOptions`); from 2026-10-02 a free day's top-up of toiletries and detergents waits for a day its store opens, by its hours and by law: England's large shops shut on Christmas Day and Easter Day, Ontario's retail on its seven holidays (`shutByLaw`, read by every chain's store) | A top-up takes no time from the free day; favorites, scheduled routines |

## Part 6. Vehicles and movement

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 36a | Make, model, year, body, trim, powertrain, drivetrain | Partial | `CarModel`; the tank or battery, seats and cargo (read by the pump, errands' passengers and shopping), shown on Cars from 2026-10-02 | Year, body, transmission, drivetrain |
| 36b | Kinds incl. trucks, boats, aircraft | Partial | 9 kinds; one boat, one plane | Pickup kind; boat and aircraft catalogs |
| 36c | Market and seller, verified offerings | Partial | home market only | Seller entity; another market |
| 36d | Condition, mileage, used listings | Partial | age and hidden fault | Individual listings: mileage, condition, history, seller |
| 36e | Factory options vs aftermarket | Done, 2026-10-02 | 643 priced factory options for the 48 new cars (`content/caroptions.ts`): paint, wheels, interior, packages; mods, wraps, tint, stereo after | — |
| 36f | Pricing | Complete | `quote`; tests/vehicles | — |
| 37a–d | Market and seller, filter, compare, specs and history | Partial or not implemented | catalog facets | Listings, comparison, spec and history |
| 37e | Inspection, test drive | Partial | `vehicle.inspect_used` | Test drive |
| 37f | Configure options | Done, 2026-10-02 | options in the quote before the taxes; one paint, wheels and interior; kept with the car; tests/caroptions.test.ts | — |
| 37g | Cost, trade-in, funding | Complete | tests/vehicles, leasing | — |
| 37h | Ownership requirements | Partial | checked when driving | Title and registration step |
| 37i | Not drivable until delivered | Partial, 2026-10-02 | a factory order isn't driven until it comes, its weeks the dealers' or a leasing company's published figures; stock is driven away | A stock car's collection day (no published figure); home delivery fees |
| 37j | Use and maintain | Complete | carcare, repairs; tests | — |
| 37k | Sell or trade | Partial | instant sale | Listing, buyer, time |
| 38a | Wraps and finishes | Partial | two cities | More shops; removal; partial wraps |
| 38b–c | Trim, lighting, body, rims, tires | Not implemented / partial | winter tires; alloys (GB) | Catalogs |
| 38d, g–l | Seats, upholstery, materials, stitching; the leopard interior | Partial, 2026-10-02 | `systems/interiors.ts`: seats, headliner and wheel in leather, vinyl, Alcantara, leopard vinyl or faux fur, colors and stitching chosen; an itemized estimate (suppliers' prices, the trade's hours at $75); a Katzkin kit at its own price; four named shops in New York and Los Angeles; the design kept with the car; tests/interiors.test.ts | Door panels and carpets; other towns (no shop publishes a price); original covers returned; revisions |
| 38e | Audio | Partial | one head unit | Speakers, amplifiers |
| 38f | Storage, mechanical upgrades | Partial | GB only | Racks, boxes; beyond GB |
| 38i | Alternative transport | Complete (repairs) | `vehicle.stand_in`; tests | Wrap and interior work too |
| 39a–b | Tank or charge, range | Done, 2026-10-02 | `systems/fueltank.ts`: 117 makers' capacities (`content/tanks.ts`), level, range, gauge on Vehicles; tests/fueltank.test.ts | 14 models without a published figure take SLATE's estimate, labeled |
| 39c–d | Stops, belongings, passengers | Done, 2026-10-02 | errands; shopping held to the maker's cargo liters; as many passengers as the maker's seats hold beside the driver, any number on foot, none at work (`tripRefusal`) | — |
| 39e | Route and time | Complete | tests/driving, trips, journey | — |
| 39f | Refuel at a station | Done, 2026-10-02 | `vehicle.refuel` at a named station to full at the pump price; `errand.fuel` fills the tank; a leg short of fuel is refused | Choosing an amount short of full |
| 39g | Charging | Done, 2026-10-02 | public to full over 50 kW's time, at home to 80% with a charger; the month charges at a fifth | — |
| 40a | Several destinations | Complete | `runErrands`; tests/trips | More stop kinds |
| 40b | Change the plan mid-trip | Done, 2026-10-02 | a whole trip, or a stop at a time with the next chosen as you go and Go Home | — |
| 40c | Parking | Partial | meter by the minute; from 2026-10-02 a named garage chosen for an errand's stops, by its own units up to its day (`content/garages.ts`: LA, New Haven, Toronto, Vancouver, the City of London, Dublin) | Manhattan's garages (a "from" price only); time limits |
| 40d | Hours, appointments | Partial | closed shops refuse | Appointment slots |
| 40e | Purchases carried or in the car until moved, within its cargo | Done, 2026-10-02 | `stow` and the trip's unload in trips.ts: groceries, toiletries and clothes bought out ride in the car or are carried, then are put away; chilled food out past USDA's two hours is thrown out; refused past the model's cargo liters or a pickup's bed | — |
| 40g | Out of fuel | Partial | an errand's leg burns from the tank (`burn`) and is refused short of the next stop, a fuel stop filling it; a journey by road buys along the way | Running dry on the road: drivers who don't stop (the AA Ireland's 10.5% of call-outs are fuel) |
| 40h | Breakdowns, delays | Done, 2026-10-02 | severe fault refuses; `systems/roadside.ts`: a driven journey's fault on the road, a severe one towed onward; a tow to the garage; the clubs' cover by tier, dues, tow km and calls | How long the truck takes (unpublished); battery, tyre and lockout call-outs |
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
| 43c | Furniture | Partial | 5 pieces; from 2026-10-02 IKEA's seats, tables, wardrobes, frames, chests and bookcases (163 pieces, `systems/furnishings.ts`), seats and table places read by hosting, storage holding its outside measure | Desks, TV benches, coffee tables (no reader yet) |
| 43d–h | Appliances, lighting, storage, security, utilities | Partial | fixtures; security | Fixture choice, lighting, capacity |
| 43i | Special rooms | Partial, 2026-10-02 | home gym, theater, dance studio, library, soundproofed room, one to each spare bedroom; a walk-in closet and a sauna, at the cost guides' prices | What each room is used for beyond being kept |
| 43j–l | Pools, gardens, outdoor kitchen, guesthouse, courts, track | Partial | pool, courts, ADU, pitch; a lawn grown through the town's season and mown by you or a gardener to its height rule (`systems/lawns.ts`); a hot tub, putting green and sprinklers, the first two billed monthly (2026-10-02) | Garden beds, greenhouse, outdoor kitchen use, guests in the ADU, track |
| 43m | Football field, solo and with friends | Partial, 2026-10-02 | three pitch sizes on the lot, turf at the published middle and a drainage base; Come Over To Play for any court or the pitch, at the game's METs, stopped by weather or dark; tests/courts.test.ts | Solo drills (no published MET for them); lights for a pitch; natural grass |
| 44a–b | Space, ownership | Complete | `projectRefusal`, `mostFloor` | — |
| 44c–d | Permission, structure, access | Partial / not implemented | permits | Refusal outcome; structural checks |
| 44e–f | Explain and offer alternatives | Partial | projects hidden by type | Show them refused, with alternatives |
| 45a, c, i | Bed sizes by market, compatibility, use | Complete | content/beds.ts; tests/beds | More markets |
| 45b, d–h, j–k | Materials, bedding, room fit, delivery, assembly, placement, cleaning, repair, resale | Partial or not implemented | — | The furniture lifecycle |

## Part 8. Travel, hotels, documents

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 46 | Manual packing | Partial, 2026-10-02 | 57 bags on sale at their makers' and retailers' prices, each holding its maker's liters, and the one that goes away chosen (`luggage.buy`, `luggage.choose`); volumes (`volumeOf`, `GARMENT_L` SLATE's estimate); items moved into the suitcase by hand and kept as packed on leaving; Pack For Me within the liters; Unpack | A stay to unpack into; checked bags against an airline's limits |
| 47a–c, g, l | Planning, documents, booking, cancellation, charters and ferries | Complete | journey.ts; tests | Destinations limited to towns with stays |
| 47d–f, h–k | Departure transport, connections, delays, changes, local transport, activities | Partial | from 2026-10-02: to and from the airport By Taxi or By Transit at each town's read fare (`systems/airportground.ts`); a canceled flight's fare taken back instead of the next one, the way home with it (`travel.take_refund`) | Missed connections; change the outbound; rideshare; airport parking |
| 47m | Companions | Partial, 2026-10-02 | `travel.companion`: friends or a partner from where you set out, as many as the room sleeps by its listed beds (two where unread), own fares, the room split evenly again with each who joins, the waking hours together; tests/companions.test.ts | A child along |
| 47o | Home while away | Partial | bills run; the fridge's food goes off on its own dates while away, a power cut or a broken fridge spoiling it sooner | House-sitter, mail |
| 48a–b | Search named properties by dates, guests, budget | Partial | 28 hotels in 8 towns; from 2026-10-02 filtered by what their own pages state (a gym, a pool, breakfast included, wheelchair access, pets) and by most for the stay (`hotelHas`) | Guests; several rooms |
| 48c | Compare total stay | Complete | `namedStayQuote`; tests/hotels | — |
| 48d–f | Inspect rooms, extras, terms | Partial | bed, hours, deposit, parking; from 2026-10-02 each hotel's gym, pool, spa, breakfast, Wi-Fi, accessibility and pets shown, and its own cancellation deadline deciding the refund (`content/hotelamenities.ts`); breakfast bought at its own price, free where the room includes it (`hotel.breakfast`) | Extras bought (early check-in, a pet's fee) |
| 48g | Book and pay | Complete | `travel.book`; tests | Hotel-only booking |
| 48h | Check-in requirements | Partial | age at booking; a deposit held at arrival; from 2026-10-02 the room at the hotel's own check-in hour (`roomReadyAt`); photo ID at the desk where the hotel's own page asks it of every stay, 11 of the 28 (`research-hotel-id.json`), no room until one in force is shown, Hotel Catedral taking only a passport or the INE (`deskAccepts`, `travel.show_id`) | A desk's ID where only booking sites say so (La Quinta New Haven, Days Inn Vancouver, both Four Seasons) |
| 48i | A failed deposit isn't a granted stay | Done, 2026-10-02 | journey.ts `holdForDeposit`, `travel.pay_deposit`; rentals.ts `held`, `travel.pay_rental_deposit`; standin.ts refuses; tests/deposits.test.ts | — |
| 48j–n | Room, belongings, facilities, extend, charges, check-out | Partial | the named hotel's own gym and pool used while staying (`stayPlace`, `swimRefusal`); its breakfast; the room given at its own check-in hour, or at once where early check-in is free (`roomReadyAt`) | Incidentals; the room's belongings; early check-in bought (no hotel publishes its price) |
| 49a–b, e–g, i | Identity, driving, entry, residence, work, building approval | Complete | documents.ts, licensing.ts, permission.ts, permits.ts; tests | Appointments and evidence steps |
| 49c–d | Boating, aviation | Partial | instant boating certificate (pass marks published, no pass rates); certificates held listed on Papers (`credentialsOf`); from 2026-10-02 the FAA knowledge test failed at its own 89.56% pass rate and the checkride at the secondary 75.1%, each taken again a month on, a checkride retest at half the fee (decider `pilot.tests`) | Boating exams' failure (no rate published) |
| 49k | Loss and replacement | Partial, 2026-10-02 | passport; a driving license replaced at its authority's fee in all eight places, driven on meanwhile where an interim or the record allows, waited for in California (`documents.replace_license`); tests/replacements.test.ts | ID cards; the police report as its own step |

## Part 9. Healthcare, people, career, services

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 50.1–2 | Find a provider; access and coverage | Partial | 35 providers in 8 towns | Dentists, opticians, therapists, specialists; a quote before care |
| 50.3–7 | Book, prepare, attend, outcome, referral | Partial, 2026-10-02 | `systems/appointments.ts`: a doctor's visit booked for the place's published wait (England's distribution, AMN's days, IMSS's 29, Canada's next-day share), on the calendar, kept and billed or missed and owed, booked again or called off; tests/appointments.test.ts; from 2026-10-02 a kept visit ends in a referral at the place's share (NAMCS 9.1%, England 8.1%, England's for Canada), the specialist booked after its published wait (`mayRefer`, decider `health.referral`) | What the specialist finds (no SLATE condition names one); Ireland and Mexico (no wait published) |
| 50.8 | Payment and coverage | Complete | bills, aid; tests | — |
| 50.9–11 | Prescriptions, recovery, commitments | Partial | — | §51; follow-ups |
| 51.1 | Prescriptions | Partial | paid at the counter; England's prepayment certificate, three months or a year (`health.prepay`, 2026-10-02) | A prescription, supply, refills, collection |
| 51.2 | Insurance | Partial | deep cover engine | Claims and denials; private cover abroad |
| 51.3 | Travel insurance | Complete | tests/travelinsurance | — |
| 51.4 | Accessibility | Partial, 2026-10-02 | `systems/access.ts`: a wheelchair said on Papers; a hotel its own pages say can’t take one refused; a disability permit at each place’s fee, meters free where the town allows | Stations without step-free access, paratransit, accessible taxis, accessible homes |
| 52.1–4 | Friends, dating, partners, marriage | Complete | people, dating, marriage; tests | More activities |
| 52.5–6 | Parenting, caregiving | Partial | costs and benefits; care given to a parent, as stress a month by the carer's hours (`family.care`) | A child's day; care given as time |
| 52.7–9 | Lives of their own; shared activities; household | Partial | `declines()`; from 2026-10-02 a job of their own at the country's employment rate for their age, at work nine to five on the days ATUS says the employed work (`systems/availability.ts`, decider `social.availability`) | Interests, memory read; activities; chores |
| 53.1–2, 4, 6–9 | Representation, auditions, contracts, work, travel, press, awards | Complete | career.ts; tests | Breakdowns; attending a ceremony |
| 53.3, 10–11 | Preparation, professional contacts, dressing for the room | Partial | coaching | Prep time; casting contacts; a dress check |
| 53.5 | Fittings | Done, 2026-10-02 | paid only when `present`, missed otherwise; tests/fittings.test.ts | — |
| 53.12 | Products never confer ability | Complete | `bookingChance` | Self-tape kit documented as recording quality |
| 54.1–5 | Staff, lessons, sports, memberships, community | Partial or not implemented | cleaner, gardener, trainer, gym; acting and improv classes (`career.class`), flight training (`pilot.train`) | Sports and hobby lessons, clubs, leagues, community |
| 54.7, 10 | Electricity, internet and phone | Complete | electricity.ts, telecom.ts; tests | Supplier choice; internet outages |
| 54.8–9, 11–12 | Gas, water, waste, outages | Partial | atlas estimate; utility accounts opened on moving in with published set-up charges (`settleIn`); each town's waste charge (`wasteFeeOf`); power cuts (`powerDay`) | Gas and water tariffs; water and gas outages |
| 54.13 | No unrelated jobs | Complete | — | — |

## Part 10. The assistant and the way through

| § | Requirement | Status | Where | Gap |
|---|---|---|---|---|
| 55 | An assistant that proposes validated actions | Complete in code, not activated | systems/assistant.ts, askAssistant, ui/assistant; tests/assistant | Customization builder and development roles; the owner's key |
| 56 | Supported connection, costs, credentials, works without it | Complete in code | docs/AI-INTEGRATION.md | Activation by the owner |
| 57 | New mechanics reviewed, never run against saves | Partial | proposals only | A development-proposal role |
| 58 | Navigation keeps context | Partial | breadcrumbs, pins, `/` search; a recipe short of something buys it in place and cooks (`food.buy_short`, 2026-10-02) | Others beyond detergent (from 2026-10-02 laundry short of detergent offers Buy Laundry Detergent, the cheapest open here, `shortfallBuy`) |
| 59 | Activity states, recovery, no duplicates | Partial, 2026-10-02 | `underWay`: orders, a car on order or at a shop, appointments, journeys, a held rental, documents being issued and works, in one list on Home | Resuming an interrupted activity |
| 62 | The connected day, shown working | Shown, 2026-10-02 | tests/connected-day.test.ts: shower, change, a car errand on the tank with a fuel stop, cooking by servings, save and load, leftovers eaten before money, bed and the next day's outfit | No wash-up step (§33i): the dishwasher's tablets and the tidy stand for it |
