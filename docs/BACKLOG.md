# SLATE Backlog — the Final Master Build Command

The owner's "Final Master Build Command" of 2026-10-01, and its addendum on
"unlimited", turned into stages with acceptance criteria and dependencies.
Each requirement's number is the command's. Status was audited against the
code on 2026-10-01 by three read-only passes, and it is corrected here as the
work lands. **The tree outranks this page** (CLAUDE.md, rule 12).

The addendum: "unlimited" means the breadth of OPTIONS within every feature,
not literally infinite content. Customization is built as **specifications**,
dimensions combined from expandable researched catalogs (material, color,
pattern, finish, fitment and so on), with compatibility rules deciding which
combinations are valid. A real product and a generated custom design are told
apart on every entry.

Status words: **DONE** (built, tested, gated), **PARTIAL**, **MISSING**,
**BLOCKED** (with the blocker named).

## What the audit found, in one paragraph

SLATE is deep on money, law and paperwork. It has accounts, cards, taxes and
benefits. It buys, finances, lets and forecloses homes and land, and builds a
house in seven NAHB stages. It covers documents and licenses, travel booking
across air, rail, coach, ferry, car, rental, chauffeur and one's own plane,
and the acting career: representation, auditions, union pay, filming,
residuals and school. It is thin or missing on the hands-on life the command
centres on:
- No generic item, inventory or container model exists. Each possession is a
  bespoke record, and the bed and sofa are timestamps.
- Clothing is a laundry counter, and food is money plus a nourishment number.
- No named hotels or room categories.
- No errands or multi-stop drives.
- No provider encounters in health care; care is billed automatically.
- No relationships, partners or children.
- No AI.
- Not one catalog has a sort, search or filter.

## Stages, in dependency order

Each stage is done only when its acceptance criteria pass the gate. Each one
ends with the WORLD.md entry and the handoff updated, and a commit that says
what was decided and why.

### Stage 1 — Possessions: items, places and containers (foundation)
Requirements 6, 15, and the base of 12, 14, 19, 21 and 24.
- **Records:** one possession model on `Person` (`systems/items.ts`):
  - every item has a catalog id or a custom specification, a quantity, a
    condition, and a place;
  - a place is a home's room or container, a vehicle, a piece of luggage,
    worn on the person, a storage unit, a cleaner's or a tailor's, or in
    transit on an order;
  - containers have capacities.
- **Actions:** move, pack and unpack, transfer between places, and deliver
  (an order is not a delivered item).
- **Moves:** moving home carries what the move carries; what's left stays.
- **Acceptance:**
  - an item is used only where it is;
  - an order arrives once, never twice;
  - ownership and access are distinct;
  - save and load round-trip it;
  - the existing furniture migrates into items.

### Stage 2 — Catalogs: cheapest first, search, filters, comparison
Requirements 11 and 44.
- **The component:** one shared catalog list. Its default is ascending
  comparable price, with the comparison basis labeled: total stay against a
  night, full price against an installment, one-time against recurring, a
  deposit apart. Quote-only and unknown prices are never treated as zero.
- **Controls:** search, filters, alternate sorts, and context kept on return.
- **Applied to every existing buy and book list:** vehicles, homes, land,
  furniture, appliances, renovations, mods, stays, rentals and flights.
- **Acceptance:** each list's default order is proven by a test.

### Stage 3 — Clothing
Requirements 12 and 35.
- **Catalog:** researched real brands and products by market, with price,
  sizes and variants, and the source and date on each. Categories: everyday,
  formal, outer, active, under, sleep, footwear, bags, accessories, jewelry
  and watches.
- **Size:** sizing by market, with conversion.
- **Lifecycle:** buy in store or order online; delivery; returns within the
  retailer's published window; alterations at a tailor (time and price);
  repair; resale.
- **Wearing:** wear and change; outfits built only from accessible items.
- **Laundry:** per item, replacing the clean-clothes counter, with dry
  cleaning; packing into luggage.
- **Acceptance:** walkthrough 35's checks.

### Stage 4 — Food, drink and cooking
Requirements 14 and the food in 38.
- **Supplies:** groceries as items in a fridge, freezer or pantry, with
  shelf life.
- **Cooking:** needs the installed appliances; a hotel room can't cook.
- **Recipes:** researched recipes with ingredients, time and portions;
  leftovers and reheating; dishes and cleanup.
- **Eating out:** named restaurants and takeout by city, with prices.
- **Drinks:** including alcohol, with researched effects, such as BAC by
  Widmark and its effect on driving.
- **Fallbacks:** the day's food keeps working when the player doesn't cook.
- **Acceptance:** walkthrough 38's food checks.

### Stage 5 — Hygiene, grooming and routines
Requirements 13 and 38.
- **Facilities and supplies:** shower and bath need the facilities and the
  supplies, such as toiletries as items.
- **Grooming:** at home, or at a barber or salon by name and price.
- **Routines:** saved routines run the same commands, and stop at a real
  obstacle.
- **Acceptance:** walkthrough 38.

### Stage 6 — Hotels, named
Requirements 24 and 34.
- **Properties:** researched named properties per career city, with room
  categories, guaranteed bed configurations, amenities and policies. Total
  stay price includes taxes and fees.
- **Extras:** confirmed extras kept apart from requests, which can be
  declined.
- **The stay:** check-in with its requirements, a room assigned, luggage
  moved in, services charged, extension, check-out and folio.
- **Acceptance:** walkthrough 34's checks.

### Stage 7 — Errands and everyday driving
Requirements 22 and 39.
- **The trip:** a multi-stop plan within a town, with time, fuel and charge
  used; fuel stops at real stations' prices; parking (paid, permit,
  tickets); cargo loaded and unloaded as items; passengers.
- **Shops:** shops open by their hours.
- **Acceptance:** walkthrough 39.

### Stage 8 — Vehicles, deeper
Requirements 20, 21 and 36.
- **Customization:** a specification for paint (color and finish), wraps,
  wheels and tires (fitment), upholstery (material, color, pattern,
  stitching), trim and audio, plus suspension, brakes and engine mods.
  Compatibility is by model.
- **Shops:** quotes from named shops, appointments, time in the shop, removed
  parts kept, and a loaner or alternative transport.
- **Ownership:** condition, wear and service history; maintenance and repair
  bookings; insurance changed after purchase; claims.
- **Acceptance:** walkthrough 36.

### Stage 9 — Health care encounters
Requirements 26, 27 and 41.
- **Providers:** named providers by city and kind.
- **The visit:** eligibility, coverage and referral rules by place; booking,
  check-in, consultation, modeled tests and results, referral, payment; a
  pharmacy fill, pickup or delivery, and refills; follow-up.
- **Hospital:** admission, visitors and discharge.
- **Conflicts:** a visit moves career commitments.
- **Insurance:** claims filed by the player; travel insurance.
- **Acceptance:** walkthrough 41.

### Stage 10 — Relationships and households
Requirement 28.
- **People:** non-player characters with availability, preferences,
  boundaries and memory, who can decline.
- **Social life:** friendship, dating, partnership, marriage, households,
  children and caregiving; invitations, visits, shared meals and trips.
- **Sharing:** household expenses and permissions over shared belongings.
- **Note:** this reverses "SLATE's lives have no children or partners"
  (WORLD.md), on the owner's command of 2026-10-01.
- **Acceptance:** an invitation that is accepted or declined for a stated
  reason, and a household's shared bill split.

### Stage 11 — Hired services, recreation and utilities
Requirements 29 and 30.
- **Services:** cleaners, gardeners, drivers, property managers and
  instructors, with quotes, schedules, duties and completion.
- **Recreation:** hobbies, sports, memberships and events, with facilities
  and equipment.
- **Utilities:** separate electricity, water, internet and phone accounts by
  provider, set up on moving in, with outages and change of address.

### Stage 12 — Construction and facilities, deeper
Requirements 17, 18, 19 and 37.
- **The project:** an architect or designer; contractor bids; change orders;
  delays; failed inspections and re-inspection; demolition; staged payments
  on renovation too.
- **Rooms:** rooms as entities, with finishes and fixtures as
  specifications.
- **Special rooms:** theater, gym, studio, library, dressing room.
- **Outdoors:** courts and fields by dimension, surface, drainage, lighting
  and maintenance, each unlocking its use; a guesthouse.
- **Beds:** bed types and sizes by market, with mattress and frame
  compatibility.

### Stage 13 — The acting career, deeper
Requirements 2 and 43.
- **The work:** negotiation over the scale offer, through representation;
  contract terms; fittings using clothing; press, junkets and interviews.
- **Awards:** awards seasons with their real bodies and rules.
- **Daily life:** every commitment reaches the same calendar, wardrobe,
  documents and travel.

### Stage 14 — The built-in assistant
Requirements 31, 32 and 33.
- **Design:** off by default. A Base44 function holds the API key
  server-side. The assistant proposes structured actions that the engine
  validates as any command; it never writes state itself. Ordinary play
  works without it. See `docs/AI-INTEGRATION.md`.
- **Blocker:** activation needs the owner's API key and their acceptance of
  per-token billing.

### Stage 15 — Navigation, tutorials, walkthroughs and the developer map
Requirements 44, 46, 47 and 48.
- **Navigation:** the rail, search, favorites and history surfaced (they're
  kept in state today but never shown).
- **Tutorials:** chapters for each stage.
- **Walkthroughs:** a walkthroughs page (`docs/WALKTHROUGHS.md`), one per required scenario, each
  saying what actually works and what's missing.
- **Developer map:** a developer map (`docs/DEVMAP.md`), from each action to its code and tests.

### Throughout
- **Worldwide** (requirements 8, 9 and 10): each stage researches the seven
  career cities first, and records coverage per place, separating
  geographic presence from functional coverage.
- **Every price:** its kind (advertised, estimate, quote), its source, and
  its date.
- **Saves** (requirement 3): new records are optional fields, filled lazily,
  so the schema stays 89 and a Base44 deployment keeps accepting saves.
- **Verification** (requirement 45): every stage's tests include success,
  refusal, cancellation, duplicates and a save/load round trip.

## Progress

| Stage | Status | Commit |
|---|---|---|
| 1 Possessions | DONE: items, places, spots, containers, orders, moves, migration, Belongings screen | 0c9a3415 |
| 2 Catalogs | DONE for every existing list: cars and every vehicle kind, homes, land, furniture, appliances, renovations, mods, stays, rentals. Departures stay by hour, each a single fare. Lists added later use the same machinery. | bd44d3cb |
| 3 Clothing | DONE, but for three things below. Done: 1,198 real products from 74 retailers in America, Britain, Ireland, Canada and Mexico, with their prices, sizes and colors, the source and date on each (`content/clothingcatalog.ts`, built by `tools/build-clothing.mjs`); buying in a store or online at each retailer's fee, threshold and days; returns inside its window, unworn; garments worn and washed one by one, replacing the clean-clothes count; dry cleaning at real shops' prices; outfits from what's to hand; a starter wardrobe; the Clothes screen. Packing (`systems/luggage.ts`): a carry-on packed with a week's clothes and the bathroom's things on leaving home, unpacked on coming back. Fit, from 2026-10-01: a garment fits within a size's step of the weight it was bought for, isn't worn past it, one grown out of is bought again, and one too big is taken in at one of 11 named tailors at its price and days (`systems/tailoring.ts`, `content/tailors.ts`). Not kept: the size label and its conversion between markets, no body measurements being kept to read it by (`docs/UNBITTEN.md`); repair, shoes not wearing out in SLATE and a tear not being kept; resale, no platform publishing what used clothes fetch. | e23a218c and (this commit) |
| 4 Food | DONE. 107 real restaurants in the business's eight towns with 451 dishes, eaten at a table, taken away or delivered, at the menu's price with each town's meal tax, the custom's tip and a delivery app's fees (`systems/dining.ts`); drinking at a bar, blood alcohol by Widmark, a hangover over the binge line, NHTSA's crash risk on any drive and each jurisdiction's first offense (`systems/alcohol.ts`); the Food screen. Groceries: 512 products from 9 chains, kept in the fridge, freezer or pantry for FoodKeeper's days and thrown out when they go off; 44 recipes cooked from what's in stock, servings kept as leftovers; the day's meals from what's ready first; a drink at home (`systems/kitchen.ts`, `systems/pantry.ts`). Known gaps: New York and New Haven have one chain each with readable prices, missing milk and onions, so few recipes cook there; blenders and slow cookers aren't kept. | b1bd404b, 8d3ab15d |
| 5 Hygiene And Routines | DONE. Routines (`systems/routines.ts`); toiletries as bathroom supplies, 183 products from 9 chains, used at weighed-use amounts by every shower and day, by hand or not, with what going without does, and restocked on a free day; 37 named barbers and salons with their own prices, tipped (`systems/hygiene.ts`). Known gaps: toilet paper, razors and the rest are kept but not used up; grooming lifts the mood and nothing else reads it yet. | 6e5bc091, ac00442c |
| 6 Hotels, Named | DONE, but for requests. Done: 28 real hotels with 327 room types, each at its own booking engine's rates for three nights read on 2026-10-01, refundable or not, the town's taxes, its own fee and minimum age, booked with a journey (`systems/hotels.ts`, `content/hotels.ts` built by `tools/build-hotels.mjs`). Marriott's, Hilton's and Hyatt's fourteen refused an automated read. The stay, from later that day: check-out at the hotel's own hour, its deposit held from arrival to check-out, its own parking for a car, a night more at its own rate, and the folio on the Travel screen. Not kept: requests, early check-in and late check-out being granted when available, which no hotel publishes. | (this commit) |
| 7 Errands | DONE. A store sells only in its own opening hours, England's Sunday trading included (`systems/errands.ts`, `content/storehours.ts`). A trip of up to eight stops, on foot or by car with somebody along: each leg the NHTS's or England's NTS's average trip at the town's TomTom traffic, its fuel paid at a named station and its road risks drawn, the meter paid for each stop's minutes, errand kilometers taken off the month's driving, a passenger's hours counted together (`systems/trips.ts`, `content/errandtrips.ts`, Run Errands on Routines). Not kept, by design: meter tickets, enforcement not being published; purchases held in the car between stops, which nothing would read. | 6d03e264 and (this commit) |
| 8 Vehicles, Deeper | DONE, but for what's researched and not built below. Done: a car driven needs unscheduled repairs at RepairPal's 2026 rate for its model or make, severe at its share, an ordinary one at CarMD's average and a severe one at three times the annual cost; a severe fault stops the car, a lit light fails New York's, Connecticut's and California's computer-read inspection, and either lowers its value; AAA's upkeep less the repairs now drawn; 28 named garages in the eight towns, a dealer only for its make, booked in their own hours, the car in until closing or three days (`systems/repairs.ts`, `content/carshops.ts`). A wrap in ten colors and three finishes at three named shops' prices and days, loading British cover as a respray; cover changed after buying, Britain's insurers charging Direct Line's £53.25 (`systems/wraps.ts`). From later on 2026-10-01: servicing by each maker's interval at each market's posted chain price, a few hours in the shop, and its history; a service a month or 1,000 km overdue is missed for good, voiding the maker's warranty and, in Britain, taking 10% off the car's worth; a fault repaired free at a dealer of the make within the warranty's years and distance; collisions at America's 4.16 claims a year in 100 cars, at each place's average claim, full cover paying over the $500 deductible and writing off a car the damage exceeds (`systems/carcare.ts`, `content/carcare.ts`). While the car is in, a dealer's loaner where its dealer publishes one (Toyota of Manhattan's, Toronto Honda's and Jemca Toyota's free, A-1 Toyota's $34.95 a day), otherwise a rental on the town's airport desk's terms, back the hour the car is ready, driving errands and Travel's By Rental (`systems/standin.ts`). Researched and not built: a shop's own labor rates, upholstery, audio and wheel fitment (`research-vehicle-shops.json`). | 2e223352, 5db02ce1 and (this commit) |
| 9 Health Care Encounters | DONE, but for what's researched and not built below. Done: 35 named practices, clinics, emergency departments and pharmacies in the eight towns; each doctor's visit, urgent visit and emergency had at one by name, their own doctor where chosen, and an uninsured urgent visit at a provider's own published self-pay price (`systems/clinics.ts`). An emergency department keeping you its median hours by state or country; a US pharmacy chosen, its generics at the chain's own cash price (`content/carevisits.ts`). Travel insurance, from later on 2026-10-01: bought with a trip at the home market's price (Squaremouth's 6% of the trip in America, GoCompare's single trip by age in Britain, Aviva's in Ireland, TuGo's a week in Canada, AXA's in Mexico); a trip missed or called off in hospital or laid up hurt paid back to the policy's limit less its excess; care had in another country the insurer's, to its medical limit; uninsured, a visitor in America paying America's price, an Ontarian less OHIP's out-of-country day rates (`systems/travelinsurance.ts`). Researched and not built: booking with waits, and referrals to a specialist, the waits being published for England, Canada and IMSS but not for a GP in Ireland, Canada or Mexico City; a visitor's price in Scotland and an Ontario doctor's visit (from 2026-10-02 England's is kept: A&E and a GP free, a stay at 150% of the NHS tariff, `ENGLAND_VISITOR`; and Ontario's, British Columbia's and Ireland's hospitals' own charges and the IMSS's in Mexico, `VISITOR_CARE`; `docs/DATA-GAPS.md`) (`research-health-visits.json`, `research-travel-insurance-referrals.json`). | 0a9c82bd and (this commit) |
| 10 Relationships And Households | DONE, but for three things below. The people a life knows, from the class, each job and dating apps; invitations answered for a stated reason; Hall's hours making friends; living alone in the life table (`systems/people.ts`). A partner asked out, a couple from the ninth date, moving in with the bills split evenly or by income; their own job and pay from their country's published earnings; marriage at each place's license, ceremony and wait, or a wedding; a married person's tax in each country; divorce asked for by either, final after the law's wait, the property divided as the place divides it (`systems/marriage.ts`). Children: PRESTO's chance by the carrier's age, the birth's cost where it happens, a self-employed parent's leave pay, the cost of raising shared as the bills are, each country's child benefit and America's Child Tax Credit (`systems/children.ts`). Tinder and Hinge at their read prices, matches each month (`systems/dating.ts`). From 2026-10-02, adoption by each place's main route at its cost and wait, a child from care at the age it's placed, and America's adoption credit on the return; a surrogacy where the law lets it (`systems/adoption.ts`). After a separation, the children stay in the home they had and the other parent pays child support by the place's formula: New York's CSSA, California's guideline, Connecticut's 2026 schedule (`tools/data/ctsupport.mjs`), England's CMS rates, the federal tables in Ontario and British Columbia, lawyers' practice in Mexico City; Ireland publishes none (`systems/support.ts`). A life's own parents, born their country's mean age before you, dying by the life table, needing care from 65 at the ACL's odds and years, paid for where they live, given yourself in their town, or left to the state (`systems/parents.ts`). | 3be73e11, 5a686a49, 171ef3cc and (this commit) |
| 11 Services And Utilities | DONE, but for what's researched and not built below. Done: a new home's utility accounts opened at the providers' published charges, and power cuts at each distributor's published rate, spoiling the fridge past four hours and the freezer past forty-eight (`systems/utilities.ts`). Recreation: 22 named gyms in the eight towns, joined in person on a tier the age allows, while open, at their own fees with each place's tax, billed monthly and yearly, a minimum term's months paid on leaving early; a member's gym trains as a gym does, and its pool can be swum in (`systems/gyms.ts`, `content/gyms.ts`, the Routines screen). The internet and the phone by provider, from later on 2026-10-01, in the eight towns: the cheapest of two named offers opened on moving in, at its price for its months and its published standard price after (Virgin Media’s £23.99 then £62, eir’s €34.99 then €75.99), a room’s half, switched as a new customer for a contract’s months left; the country’s cheapest phone plan, Mint’s a year ahead; their estimate taken out of the bills (`systems/telecom.ts`, `content/telecom.ts`). A driver hired to drive your own car on errands, in New York and Los Angeles (Dryver), London, Toronto (Keys to Us) and Vancouver (SoberDrivers), at its hourly or per-kilometer price with its minimum and tax: driven, your license and blood alcohol don't come into it and the road's risks aren't yours (`content/drivers.ts`, `driverCost` in `systems/trips.ts`). A letting agent for a home let, in Los Angeles, New Haven, London, Dublin, Toronto and Vancouver, at its published letting, monthly and renewal fees; let yourself, a tenant found moves in only while you’re in the home’s town, an agent’s while you’re away (`systems/propertymanagers.ts`). From 2026-10-02, a home's energy at its province's or country's own household survey and at 2025's prices, America's included (`tools/data/energy.mjs`, `energyScale`). Researched and not built: electricity, gas and water billed tariff by tariff, which need a home's metered kilowatt-hours and cubic meters that SLATE doesn't keep (`research-utilities.json`); gardeners, chauffeurs in their own cars, instructors and trades, which need a yard that grows or lessons SLATE doesn't keep to change anything (`research-hired-services.json`). | 333369e4, 6e76bd18 and (this commit) |
| 12 Construction And Facilities | DONE, but for what's researched and not built below. Done: a tennis court in seven surfaces and a half basketball court, at the middle of Fixr's installed ranges and on the lot each needs, with lights; played on at the Compendium's METs in the fine weather, and after dark only where lit; a tennis court's $1,800 a year of upkeep in the bills (`content/homes.ts`, `courtAt` in `systems/dwelling.ts`). Beds by market: IKEA's frames and mattresses in each country's own sizes, a mattress fitting only a frame of its size and market, a single sleeping one (`content/beds.ts`). From later on 2026-10-01: a spare bedroom made a home gym at the middle of Fixr’s range, which trains as a gym does and lets for a gym’s premium; a pool, a deck or a detached garage taken out at Angi’s and Fixr’s prices, the pool’s upkeep gone from the bills and a removed part no longer wearing (`PROJECTS` in `content/homes.ts`). From 2026-10-02, the weather: an outdoor stage of a house being built is held up by a wetter stretch than its months usually bring, NOAA’s days over 0.10 inch at the town’s station (`tools/data/wetdays.mjs`, `weatherDelay`). From later on 2026-10-02, a failed inspection: each visit at the share Los Angeles's own records find failing for its kind (`tools/data/inspections.mjs`), the work waiting for corrections and another visit at New York's measured days, with New York City's and Toronto's reinspection fees (`buildInspectionFails`). A pickleball court, at Angi's $34,000 average on USA Pickleball's 30 by 60 foot play area, played by day at doubles' measured 4.1 METs (from 2026-10-02). Hardwood floors at Fixr's installed price, and a refinish, each recouped as NAR's 2022 Remodeling Impact Report finds, 118% and 147% of their cost on worn floors. Researched and not built: a soccer field, a match needing a team SLATE's life doesn't have; counters and cabinets, which the kitchen remodels already price; an architect’s fee (no body publishes a scale, only a rule of thumb); contractor bids, change orders, overruns and lateness (only the share of projects that ran over is published, never by how much) (`research-facilities.json`, `research-construction-process.json`). | 6ce34e56 and (this commit) |
| 13 The Career, Deeper | DONE, but for what's researched and not built below. Done: a wardrobe fitting before screen work, paid as SAG-AFTRA, ACTRA, Equity UK and Irish Equity pay one, with the job's wages; an actor's own outfits lent to a production at the union's allowance a week, out of reach while lent and back worn (`systems/fittings.ts`); the Primetime Emmys and BAFTA Film, entered by the production or by a guest performer at the Academy's $225, nominated at the published field's odds and lifting recognition (`systems/awards.ts`). A press day the week before a studio film opens or a series airs, for its weekly performers only, four unpaid hours as ACTRA's minimum, in the trades when kept (`PRESS` in `systems/career.ts`). Researched and not built: the Oscars, Tonys, Oliviers, Ariels and the rest, whose fields of performances aren't published; a counteroffer over scale, no source publishing how often a production meets one or walks away, or an agent's increment (SAG-AFTRA's scale plus ten and the overscale a known name is quoted were built before); junkets, no agreement setting their terms. | 63cf7d3d and (this commit) |
| 15 Walkthroughs And Map | DONE. Done: `docs/DEVMAP.md`, built and gate-checked by `tools/devmap.mjs`; `docs/WALKTHROUGHS.md`, each of the ten scenarios' steps marked as working, partial or missing, and from 2026-10-01 each one not working saying what's built or why it isn't; the rail's search. The guide's chapters say what each stage's commands do, in the chapter that opens them. | 71e9dbb5, dbfe58bd |
| 14 | MISSING, the owner's API key | |
