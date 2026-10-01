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
| 3 Clothing | PARTIAL. Done: 1,198 real products from 74 retailers in America, Britain, Ireland, Canada and Mexico, with their prices, sizes and colors, the source and date on each (`content/clothingcatalog.ts`, built by `tools/build-clothing.mjs`); buying in a store or online at each retailer's fee, threshold and days; returns inside its window, unworn; garments worn and washed one by one, replacing the clean-clothes count; dry cleaning at real shops' prices; outfits from what's to hand; a starter wardrobe; the Clothes screen. Packing (`systems/luggage.ts`): a carry-on packed with a week's clothes and the bathroom's things on leaving home, unpacked on coming back. Not yet: alterations and fit (no body to fit, `docs/UNBITTEN.md`), sizing conversion, repair, resale, choosing what to pack by hand. | e23a218c and (this commit) |
| 4 Food | DONE. 107 real restaurants in the business's eight towns with 451 dishes, eaten at a table, taken away or delivered, at the menu's price with each town's meal tax, the custom's tip and a delivery app's fees (`systems/dining.ts`); drinking at a bar, blood alcohol by Widmark, a hangover over the binge line, NHTSA's crash risk on any drive and each jurisdiction's first offense (`systems/alcohol.ts`); the Food screen. Groceries: 512 products from 9 chains, kept in the fridge, freezer or pantry for FoodKeeper's days and thrown out when they go off; 44 recipes cooked from what's in stock, servings kept as leftovers; the day's meals from what's ready first; a drink at home (`systems/kitchen.ts`, `systems/pantry.ts`). Known gaps: New York and New Haven have one chain each with readable prices, missing milk and onions, so few recipes cook there; blenders and slow cookers aren't kept. | b1bd404b, 8d3ab15d |
| 5 Hygiene And Routines | DONE. Routines (`systems/routines.ts`); toiletries as bathroom supplies, 183 products from 9 chains, used at weighed-use amounts by every shower and day, by hand or not, with what going without does, and restocked on a free day; 37 named barbers and salons with their own prices, tipped (`systems/hygiene.ts`). Known gaps: toilet paper, razors and the rest are kept but not used up; grooming lifts the mood and nothing else reads it yet. | 6e5bc091, ac00442c |
| 6 Hotels, Named | PARTIAL. Done: 28 real hotels with 327 room types, each at its own booking engine's rates for three nights read on 2026-10-01, refundable or not, the town's taxes, its own fee and minimum age, booked with a journey (`systems/hotels.ts`, `content/hotels.ts` built by `tools/build-hotels.mjs`). Marriott's, Hilton's and Hyatt's fourteen refused an automated read. Not yet: extras and requests, check-in steps, luggage to the room. | (this commit) |
| 7 Errands | PARTIAL. Done: a store sells only in its own opening hours, England's Sunday trading included (`systems/errands.ts`, `content/storehours.ts`). Researched and not built: multi-stop trips, fuel stops at named stations' prices, parking meters and fines, congestion (`research-errands.json`). | (this commit) |
| 9 Health Care Encounters | PARTIAL. Done: 35 named practices, clinics, emergency departments and pharmacies in the eight towns; each doctor's visit, urgent visit and emergency had at one by name, their own doctor where chosen, and an uninsured urgent visit at a provider's own published self-pay price (`systems/clinics.ts`). Researched and not built: booking with waits, referrals, pharmacy prices by chain (`research-health-visits.json`). | (this commit) |
| 11 Services And Utilities | PARTIAL. Done: a new home's utility accounts opened at the providers' published charges, and power cuts at each distributor's published rate, spoiling the fridge past four hours and the freezer past forty-eight (`systems/utilities.ts`). Researched and not built: separate accounts and bills by provider, internet and phone plans, tariffs (`research-utilities.json`); hired services and recreation. | (this commit) |
| 13 The Career, Deeper | PARTIAL. Done: a wardrobe fitting before screen work, paid as SAG-AFTRA, ACTRA, Equity UK and Irish Equity pay one, with the job's wages; an actor's own outfits lent to a production at the union's allowance a week, out of reach while lent and back worn (`systems/fittings.ts`); the Primetime Emmys and BAFTA Film, entered by the production or by a guest performer at the Academy's $225, nominated at the published field's odds and lifting recognition (`systems/awards.ts`). Researched and not built: the Oscars, Tonys, Oliviers, Ariels and the rest, whose fields of performances aren't published; negotiation over scale; press and junkets. | 63cf7d3d and (this commit) |
| 15 Walkthroughs And Map | PARTIAL. Done: `docs/DEVMAP.md`, built and gate-checked by `tools/devmap.mjs`; `docs/WALKTHROUGHS.md`, each of the ten scenarios' steps marked as working, partial or missing; the rail's search. Not yet: tutorial chapters per stage (new commands are opened by the existing chapters). | 71e9dbb5, dbfe58bd |
| 8, 10, 12, 14 | MISSING or PARTIAL as above | |
