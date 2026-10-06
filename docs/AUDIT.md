# The Implementation, Playthrough And Reliability Audit

The owner's directive of 2026-10-06: inspect, build, test, repair and verify the game itself, with every result
reproducible. This page is the audit's record: what was checked, how, what was found, what was repaired, and what
remains. It's written as the work goes, and each section says the commit it stands at.

## Where it began

On 2026-10-06 the working branch `claude/slate-cleanup-e4apmx` stood at `beb2b027`, its tree clean but for the
owner's own untracked files; `main` at `86e63dc7`, merged after a clean replay; the stash and the `slate-lives`
worktree kept. Nothing is deployed: deployment is on hold at the owner's word, so no version runs live to verify.
The assistant stays off until the owner sets its key.

## What the audit built to check with

- **The laws of a save** (`src/engine/core/invariants.ts`): money balanced to the cent and every balance the sum of
  its postings; every thing's id its own, its quantity a count, its condition on its scale, its place something that
  exists; tanks and wellbeing on their scales; nothing pending left in the past. Each law is broken by hand in
  `tests/invariants.test.ts` to prove it's reported. Every connected journey ends by asking them, and the replay
  probe asks them monthly.
- **`tools/breaches.mjs`** checks any save or a folder of them against the laws.
- **`tools/traceability.mjs`** writes `docs/TRACEABILITY.md`, the inventory of every command and scheduled kind, read
  from the code and checked by the gate, with a status worked out from the evidence.
- **`tools/unread.mjs`** finds properties declared and never read.
- **`tests/commands-robust.test.ts`** gives every command nothing and nonsense.

## The inventory and its statuses

`docs/TRACEABILITY.md` lists all 375 commands and 166 scheduled kinds: how each is found (its guide chapter), where
it's reached (its screens), what it refuses, what it changes, whether it moves money, what it sets going later, and
its tests and journeys. The statuses are the owner's, worked out from the evidence:

| Status | Commands at `4ff55077` |
|---|---|
| Verified (journey): on a screen and run in a connected journey that saves, loads and checks every law | 35 |
| Implemented But Unverified: on a screen and tested, in no connected journey | 334 |
| Partially Implemented: no screen offers it, or no test runs it | 6 |

No status claims a screen was checked in the running app: SLATE has no tests of its screens. The requirements, in
`docs/REQUIREMENTS.md`, carry their own statuses in the same vocabulary, audited row by row on 2026-10-06.

## The journeys

| Journey | File | What it proves |
|---|---|---|
| A day at home | `tests/journey-day-at-home.test.ts` | a shower of a chosen length uses its soap, a towel and its share of the water; dressed from what's to hand; a walk to the shops and back; cooked from what was bought; the dishes the home's way; unwound; asleep; saved and loaded |
| The connected day | `tests/connected-day.test.ts` | driving on the tank, shopping, refuelling, cooking for two, leftovers eaten, saved and loaded |
| Driving, fuel, shopping, ownership | `tests/journeys.test.ts`, `tests/journeys-edges.test.ts` | a station fill, groceries put away, clothes bought and sold, a hotel stay packed and unpacked, a club, a flat-pack piece, a closed shop, a refusal at the till |
| Acting on location | `tests/journey-acting-travel.test.ts` | a job accepted, the post held, packed, flown on the production's ticket, saved and loaded at the hotel, the calls worked and paid, home, rent charged while away |
| A house built | `tests/journey-housing-construction.test.ts` | a lot bought, a house built through a stopped bill and failed inspections, moved into, a pool refused on a flat |
| Papers | `tests/journey-papers.test.ts` | an ETA refused then granted; a lost passport cancelling what was issued on it; a new one in its 42 days; a stolen licence replaced free with a police report; Medicaid changing a visit's price; cover dropped; a medical debt paid down; benefits paid and taxed; a return filed and paid |
| The bank | `tests/journey-bank.test.ts` | New York and Dublin: savings, transfers, standing orders and scheduled payments run and cancelled, cash, a fraud disputed under Regulation E, a card statement's balance as the sum of its postings, autopay, interest, a loan and a CD broken to the cent, an overdraft, a direct debit reclaimed |
| Belongings | `tests/journey-belongings.test.ts` | a phone protected, cracked, claimed and its battery replaced; a TV and a subscription billed and stopped; Britain's license; a dog fed, walked and walked for; a ring commissioned, engraved, pawned and redeemed at New York's 4%; luggage and packing lists; a flat-pack chair |
| Cars | `tests/journey-cars.test.ts` | a used Camry from forecourt to buyer through a breakdown, a stand-in, fuel to the cent and a sale; a London private sale's transfer and Britain's premium loadings; leases bought out and returned; a repossession redeemed; a caravan towed only by what's rated to |
| The career and the school | `tests/journey-career.test.ts` | headshots, a reel, agencies queried and signed, an offer countered 12.45% higher, a guest part's checks less the agent's and the manager's commissions and tax to the cent, union fees and dues, a play's replacement for a missed call, the school's shifts and Cabaret, a pension and Social Security at 62, Toronto's T1287 withholding |
| Homes | `tests/journey-homes.test.ts` | a renter moved to a one-bedroom, its deposits to the cent, rent paid ahead and taken on the day, internet, insurance and a cleaner billed and stopped, a portable washer taking the wash home, the post held and a sitter; a buyer's earnest, mortgage, escrow and principal to the cent, central air's 72.1% of its cost in the value, works with California's capped deposit, a lodger, a refinance and an equity loan, the home let through a manager and the tenancy ended, and the sale paying both loans off |
| People | `tests/journey-people.test.ts` | a meal out with a friend paid and remembered, a second ask over the same hour refused; Tinder Plus paid, its matches, and stopped; a classmate dated to a couple, moved in, the rent and bills halved; a wedding refused then paid; a child born, raised and given a passport; a divorce's fees once, the rent whole again; a kickball season and parkrun joined, gone to, renewed and left, the dues stopping; a mother's care given, paid and left to the state; a house bought and a friend from New York to stay in its guest room; an adoption |
| Clothes, grooming and routines | `tests/journey-clothes.test.ts` | sizes from measurements; a basket checked out online, delivered and returned by mail less its fee, once; a tee taken in by a tailor and collected; a dry-clean-only sweater worn dirty, cleaned and collected; a wash dried on a rack or in the dryer; outfits worn and deleted, and a routine that dressed them stopping where its outfit went; used sneakers bought and sold at GOAT's fees; London's orders cancelled under its law, collected, returned and left past their hold, each refunded once; a watch serviced; shampoo, razors, hairspray and makeup used by what's set and stopped when cleared; a shower's minutes metered; a salon visit and its tip; plans skipped and cancelled |
| Travel | `tests/journey-travel.test.ts` | a round trip insured, moved a day, a car rented, the room and car held for deposits and paid, made longer with the way home, the car and the check-out following, a late check-out, and the deposits back once; a hotel made a let with a friend along, a baby on a lap; a canceled flight's refund once; a desk asking for ID after a license replaced; London's breakfast once a morning; a delayed bag's claim; a hotel booked in town; a pilot trained, tested and retested, a plane bought, flown to Boston on its fuel and sold |
| Food, the garden and the lights | `tests/journey-food.test.ts` | kitchen gear bought, a recipe's shortfall bought in place, a ready meal eaten, food frozen and unusable until thawed; a cup of coffee; a cart filled, emptied and checked out once; favorites; a lamp and bulbs bought and fitted; a house's raised bed and greenhouse planted in season and picked into the kitchen, and a mower; in Los Angeles a car parked at a garage and a meter, beer and wine at home and a pint out, a meal out, a table reserved, cancelled and missed |
| Air travel | `tests/journey.test.ts` | flights, hotels, refunds, delays, a lost passport at check-in |

## Defects found, their causes, and their repairs

| What was wrong | Found by | Cause | Repair and its test |
|---|---|---|---|
| The day's bulb restock threw and failed a whole New Day where every socket held the same bulb | the played life to 89 | a dark socket kept the id of the bulb that died in it, and the fit check refused the same kind back | `takes()` in `systems/lighting.ts`; `tests/lighting.test.ts` |
| The replay called that life clean | reading its notices | the probe counted only throws, never a failed scheduled event | the probe counts them (it's local, untracked) |
| One towel notice was 354 of the last 500 | the played life to 89 | a notice said again word for word stacked | an unread one is brought up to now; `tests/notice-freshness.test.ts` |
| The location-shoot test passed with no call worked | the acting journey | its actor had no craft, and a call is never worked without it | the test gives craft and asserts the calls |
| A calendar plan the world declined was checked as done by the assistant, and taken | the command sweep | the calendar answers `{ ok: false }` rather than throwing | `refusedIn` read in `executeAll` and `checkSequence`; `tests/assistant.test.ts` |
| Deleting an outfit or routine that wasn't there, and an errand to nowhere, were done | the command sweep | no check | refused; `tests/commands-robust.test.ts` |
| Cancelling a subscription and taking it up again before its month came billed twice a month | the belongings journey | unsubscribing left its month on the calendar, and the month found the new subscription by its plan | the month cancelled with it; the journey's case |
| A car sold kept what was in or on it, a roof box stranded in a car no longer theirs | the cars journey | `sellVehicle` moved nothing out | emptied home to storage first; the journey's case |
| A British private sale was driven every day before its transfer, though refused for an errand | the cars journey | `drivenThen` didn't ask `laidUp` | the one rule for both; the journey's case |
| A fill nobody could pay for went through into arrears, and its refusal never came | the cars journey | `vehicle.refuel` paid with `spend(..., true)` | paid or refused; the journey's case. Every other purchase run into arrears was read: each pays for something already used (fuel burned, a class taken, a meal eaten) |
| A sick day called in kept no student home: they were counted in class, grew and tired | the career journey | the class day read the sick day only after finding them absent | read first; the journey's case |
| A home held one bed at most, so a guest room's bed had to be the host's own, and the host slept on the floor | the people journey | `home.furnish` refused any second bed | a bed for each bedroom of theirs, and a guest room's bed not counted as theirs to sleep in (`bedsAtHome`, `ownBed` in `systems/furniture.ts`); the journey's case and `tests/furniture.test.ts` |
| A tailor took in a garment still on its way, paid, and the order came without it; one at a home they weren't at was taken too | the clothes journey | `alterRefusal` never asked whether it was to hand | refused as not come yet, or not to hand (`systems/tailoring.ts`); the journey's case, with a hotel stay in town |
| A room held for a deposit forgot its hotel and its hour: paid, its breakfast, gym and pool were the town's | the travel journey | `holdForDeposit` replaced the stay | the stay kept, set out until paid (`systems/journey.ts`); the journey's case |
| A hotel made a let left a friend's share at half the hotel, and the player paid the rest | the travel journey | `travel.stay_let` and `travel.extend` never settled the share again | `settleRoomShare`, whenever the room's price changes; the journey's case |
| A stay made longer ran past its insurance, the way home uncovered | the travel journey | `extendQuote` never read the policy | the cover carried to the new homecoming at what each market's pricing adds, America's share of the longer stay, Canada's weeks, a single trip's price elsewhere (`coverLonger` in `systems/travelinsurance.ts`); the journey's case |
| A table was never missed for being somewhere else in town: the meal charged as eaten under a plan that held them | the food journey | `occupiedAt`, asked from the table's own handler, found the table itself, marked done before it runs | it leaves out the item asking (`systems/life.ts`, `systems/reservations.ts`); the journey's case. A club meeting asks the same and was read: it isn't a thing that holds them, so never finds itself; `tests/clubs-going.test.ts` holds that |
| A drink at home was poured from a can still in the car at the shops; a coffee the same | the food journey | `drinkAtHome` never asked where it was | refused unless at the home they're in (`systems/kitchen.ts`); the journey's case |
| A 29th-of-February birthday was kept on the 28th while the age turned on the 1st of March | the leap-year test | two rules for one day | one rule, `birthdayIn`, by where they live: the 1st of March in the UK, the 28th elsewhere (`docs/research/world/research-leap-day-birthday.json`); `tests/calendar-year.test.ts` |

## The long runs

The two played lives at `8eb0da03` (`probe/play-to-death.ts`, seeds `death-1` in New York and `death-ldn` in London,
modest means), replayed after the probe came to count failed scheduled events:

| | New York, to 89 (2091-11-06) | London, to 50 (2052-09-08) |
|---|---|---|
| Errors and anomalies | 0 and 0 | 0 and 0 |
| Laws of a save, at each snapshot | all held | all held |
| Save size at the end | 18.6 MB (about 0.2 MB a year) | 6.2 MB |
| Transactions | 68,364 | 21,866 |
| Scheduled items, at 25, 40, 60, 80 and the end | 1,254 to 1,571, not growing | 1,147 to 1,255 |
| Notices kept | the last 500 | the last 500 |
| The same notice twice among the last 500 | never, at any age | never |

Reproduce: check out the commit in the `slate-lives` worktree, copy `probe/play-to-death.ts` and `probe/chunk.sh`
into it, and run `bash probe/chunk.sh <out> <snaps> "death-1:us-ny-newyork:modest:" "death-ldn:uk-eng-london:modest:"`
until it prints `ALL DONE`; then `npx vite-node tools/breaches.mjs <snaps>`.

## The command sweep

`tests/commands-robust.test.ts` gives every one of the 375 commands an empty payload and a payload of nonsense (ids
naming nothing, negative amounts, words where numbers go), each from a new life: 750 calls. None crashed; no refused
call changed the save. 79 calls were done; each was read, and all but the three above were right to be: a toggle, a
setting cleared when it isn't given, or a purchase with only one thing to buy.

## The calendar

`tests/calendar-year.test.ts` lives New York through 2028 into 2029, across February's 29th, both clock changes,
every month's end and the year's: the rent once a month, every law held at each month's end, and a leapling's
birthday on the day the law counts it, in New York and in London.

## Validation runs

| When | Commit | Command | Scenario | Result |
|---|---|---|---|---|
| 2026-10-06 | `bfd4dd7b` | `npm run gate` with `VITEST_MAX_FORKS=2` | the full suite and every check | 3,228 tests passed; the voice check failed on five law names, fixed, and every check after it run and passed |
| 2026-10-06 | `8eb0da03` | the replay above | two lives | clean |
| 2026-10-06 | `49c5d3b3` | `npx vitest run` in five foreground batches of about 72 files, two workers each; then `tsc -b`, lint, and each of the fifteen checks alone | the full suite and every check | 359 files and 3,275 tests passed; typecheck, lint and every check exited 0 |
| 2026-10-06 | `abda6d4e` | the same, five batches | the full suite and every check, with friends asking first and the tailor's fix | 361 files and 3,290 tests passed; typecheck, lint and every check exited 0 |
| 2026-10-06 | `8b4f3328` | the same, five batches | the full suite and every check, with the three travel fixes | 362 files and 3,301 tests passed; typecheck, lint and every check exited 0 |
| 2026-10-06 | the food journey's commit | the same, five batches | the full suite and every check, with the two food fixes | 363 files and 3,310 tests passed; typecheck, lint and every check exited 0 |

Two gate runs and one replay were stopped by Claude Code for low memory before finishing; each is counted as
incomplete, never as passed, and was rerun with fewer workers.

## What remains

- The domain journeys continue: health and benefits, residence papers, and land and the home's extras are next; the
  bank, papers, belongings, cars, the career, homes, people, clothes, travel and food are done. 318 of 381 commands
  are now in a connected journey.
- The six commands with no test or screen are named in `docs/TRACEABILITY.md`.
- `docs/REQUIREMENTS.md` keeps the rows still partial, each with what's missing.
- No screen is machine-tested, and nothing is deployed: no requirement is marked verified in the running app.
