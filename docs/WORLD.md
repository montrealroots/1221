# The World: Land, Homes, Building, Vehicles, Travel, Stays, Documents

The owner's instruction of 2026-09-29 asks for land, housing, construction,
vehicles, transport, travel, accommodation and identity to be one connected,
researched world simulation, built in verified stages. This file is the
reviewable scope: each stage's acceptance criteria, what is done and with
what evidence, and the coverage record of which places and systems are
verified, modeled on documented assumptions, or not yet built.

"Complete" for a stage means every criterion below has a test or a played
journey as evidence, the gate passes, and the handoff records it. It never
means exhaustive research or no possible bug.

## What stood before this work (2026-09-29)

Housing is deep (`systems/homes.ts`, `household.ts`, `dwelling.ts`): fifty
drawn listings a town, offers, inspection, closing, mortgages, letting,
renovation, upkeep, council tax. Land, vehicles, free travel, airports,
booked accommodation and personal documents did not exist: land, property,
vehicles and travel were removed on 2026-09-22, airports on 2026-09-27, when
SLATE was kept to acting. Player movement between cities was only a career's
relocation to New York, Los Angeles or New Haven, a production's travel, and
one day trip (Metro-North, New Haven to Grand Central).

## Stages, in order of what depends on what

| Stage | What | Depends on | State |
|---|---|---|---|
| 1 | Documents: identity, passport, driver's license, entry rules, as records with issuer, validity, fees, processing, and checks that name what's missing | citizenship, geography | Done 2026-09-29 (1a and 1b); open items below |
| 2 | Journeys: a trip of legs (walk, taxi, rideshare, bus, train, flight), fares, durations on the calendar, time zones, the player's location moving only on arrival; airports; booked accommodation at the far end; the return | 1 | Not begun |
| 3 | Vehicles: a researched catalog by country, dealers and a used market, finance, title, registration, insurance, fuel, servicing, parking and a home's garage, depreciation, resale; driving as a journey's leg | 1, 2 | Done 2026-09-29 (3a to 3c); parking and a home's garage open |
| 4 | Land: identifiable parcels, listings, due diligence, offers, closing, taxes, resale, several parcels, combining and splitting where the rules allow | 2 | Not begun |
| 5 | Construction: what to build on a parcel, design, permits, contractors, stages, payments, delays, change orders, inspection, occupancy; renovation and extension of what stands | 4 | Not begun |
| 6 | A home's contents: furniture, appliances, rooms, with what each makes possible; garages holding vehicles; bedrooms holding people | 3, 5 | Not begun |
| 7 | Vehicle work: customization with fit rules, shops, work orders; boats and aircraft, crew, and the difference between owning one and being qualified to operate it; charter | 3 | Not begun |
| 8 | Rentals on a journey: rental cars, holiday lets, their deposits, terms, extensions and damage | 2, 3 | Not begun |

## Acceptance criteria

### Stage 1: Documents
- A person holds documents as records: kind, issuing country, number, issue and expiry dates, status. A document can expire, be renewed, be lost and be replaced.
- A passport is applied for from its issuing country, at that country's researched fee and processing time, with expedited service where the country sells one; it arrives on the calendar.
- A driver's license is a separate record by jurisdiction and class, earned by the jurisdiction's own steps (permit, test) at their fees, and it is not a passport, not permission to work, not permission to own anything.
- Entry to a country checks the traveller's citizenship, their documents' validity, and the destination's rule for that citizenship (visa-free days, an electronic authorization, a visa), and names exactly what is missing and how to get it. Residence and permission to work are separate from entry.
- Every figure carries its source and date; a rule SLATE lacks is said to be lacking, never assumed.
- Tests: an expired passport refuses travel with the reason; an electronic authorization needed and absent refuses with how to get one; a license from one jurisdiction is read by another only where the researched rule says so; save and reload keep documents.

#### Stage 1a: done, 2026-09-29, and the evidence

- **Records.** `systems/documents.ts`: passport, travel authorization, visa, driver's license and International Driving Permit, each with issuer, number, issue and expiry dates to the calendar day, and status (being decided, in force, reported lost, canceled). Terms run by the calendar (`addYears`), as issuers date them.
- **Passports.** `content/passports.ts`, fifteen countries' offices: standard fee, days, the expedited service and its extra where one is sold, the young adult's shorter term (Germany under 24, Spain under 30, Latvia under 20). A new passport cancels the old and what was issued on it; a lost one cancels the same. Tests: `tests/documents.test.ts` (a US passport, $165 in 42 days, expedited $225 in 21; a Spaniard's five years; the date to the day).
- **Entry.** `content/entry.ts`, fifteen destinations by fifteen citizenships: free, an authorization first (ESTA, the UK's ETA, eTA, K-ETA, NZeTA, Australia's eVisitor and ETA, Brazil's e-Visa), or a visa; the passport's validity past leaving and Schengen's ten-year issue rule; the stay's length. What's missing is named, with how to get it. A pair SLATE lacks is refused and says so. Tests: the ETA flow and its loss with the passport; Schengen; a Mexican citizen's US visa; Irish free movement; Nigeria, not covered.
- **Licenses.** `content/licenses.ts` (nineteen jurisdictions' authorities, fees, terms, visitor rules and permit issuers) and `content/licensepaths.ts` (each one's steps, in order: office visits, courses, written and road tests, the law's waits between them, retakes and their fees, fees that cover some attempts, passes that lapse, date-changed rules, age rules). `systems/licensing.ts` books each step on a business day in the town, clear of every other commitment, pays it, keeps it on the calendar, and passes a test at the authority's published rate or, where none is published, at the mean of the published rates of that kind, said so on screen. A learner may drive only with somebody beside them. Renewal in the last six months at the authority's fee; the International Driving Permit at home, for its term and no longer than the license.
- **Played evidence.** `tests/licensing.test.ts` walks every jurisdiction a town reaches to a full license through its real waits, retakes and fees: Ontario 791 days (G1, G2 and G), British Columbia 1,185, New South Wales 1,463 (under 25), New Zealand 674; the ledger's documents fees matched the published fees to the cent (Great Britain £181 with one practical retake; Germany €3,811 with four theory attempts; California $46). Also: a missed test forfeits its fee; a short bank refuses and takes nothing; Connecticut's 90 days after the permit; California's three attempts on an application; British Columbia's fee change of 19 October 2026; New Zealand's reform of 25 January 2027; a save and reload mid-booking. 18 mutations of the licensing rules, all killed.
- **Screens.** Papers, tabs Passport And Travel and Driving: every button runs a command or is disabled with the reason in its title.

- **The research.** `docs/research/world/`: entry rules, licenses, passports, the shares holding them, pass rates and course prices, each with its sources, dates and what it couldn’t confirm. `tools/build-entry.mjs`, `tools/build-licenses.mjs` and `tools/build-passports.mjs` build the content from it.

#### Stage 1b: done, 2026-09-29, with what stays open

- **Done, 2026-09-29: the border is checked.** A job across a border is taken only if the actor could go on its travel day and come home after (`borderRefusal` in `systems/career.ts`, read by `acceptRefusal`, so an offer says why it can't be taken). On the travel day it's asked again: papers lost or run out since, and the actor is turned back and the production recasts. A home abroad is lived in, or bought to live in, only with the right to live there (`residenceRefusal`): a citizen, free movement (the EU and EEA's, the Common Travel Area's), or a visa for the country in force. Until then a production in London, Vancouver or Toronto flew an actor out with no passport asked, and an actor on a London shoot could move into a London home they owned. Tests: `tests/border.test.ts`; 10 mutations, all killed.
- **Done, 2026-09-29: permission to work, apart from entry** (`systems/permission.ts`, `content/workrules.ts`, the research in `docs/research/world/research-workpermission.json`). A job is refused where the actor may not work, at the offer and on the travel day. In the United States: an F-1 student doesn't work off campus while studying; OPT after the degree (Form I-765, $470, or $2,250 with premium processing decided in 30 business days), filed from 90 days before the program's end to 60 after, twelve months from the later of the end and the approval, ended by more than 90 days in all without work; then an O-1B the agency petitions for ($1,055, the $600 Asylum Program Fee and SAG-AFTRA's $300 opinion; premium $2,965 in 15 business days), approved on three of the kinds of evidence of 8 CFR 214.2(o)(3)(v)(B) that the career shows, for three years, extended a year at a time, denied on fewer with the fees gone. In the United Kingdom a location shoot for an overseas production is a visitor's. In Canada a C14 work permit, tied to the production: a US citizen's issued at the border for CAD 155, anyone else's applied for ahead with biometrics. An Irish citizen works in the UK under the Common Travel Area. Tests: `tests/permission.test.ts` (11); 17 mutations, all killed. Screens: Papers, the Permission To Work tab.
- **Open, and the largest: a foreign-born life has nowhere to work after OPT without an O-1.** Found by lives played to death on 2026-09-29: a British, an Irish and a Mexican graduate each worked their OPT year, weren't approved for an O-1 on the evidence a first year shows, and were broke from about thirty for the rest of their lives; the British one starved past the survival limit (its run crossed the limit before the limit existed, and ended when it took effect). In life they'd go home and work there. SLATE's acting business is in the United States only, a move home to another country isn't one SLATE offers, and a destitute person isn't fed by a pantry (docs/UNBITTEN.md). What would close it: the business in another country (the UK's first), a move home, and a citizen's own safety net there. **Since 2026-09-29, the second and third are in for Britain:** a citizen can move home to the town they were born in (`homeTownOf`, the flight one way and the border asked), and Universal Credit is the claim for a British or Irish citizen living there (`systems/universalcredit.ts`). The O-1's experts' letters are read from three productions' directors, as immigration firms advise and the Administrative Appeals Office requires, not from reputation. And the first is in too: London's acting business, at Equity's minimums in pounds, with London's agencies and Spotlight (`tests/ukbusiness.test.ts`), so a British graduate who goes home can work. A US return is asked only of someone the US taxes (`owesUsReturn`). Ireland's and Mexico's businesses and safety nets are next in the same way. Until then, a life begun outside the US is a hard one, as it is for many foreign actors, but not the way it is.
- **Done, 2026-09-29: visa applications.** Until then SLATE named the visa a citizenship needed and didn't take the application. Now the ten pairs that need one apply on Papers (`content/visas.ts`, `documents.apply_visa`): the US's B-1/B-2 for Mexicans and Brazilians ($185, the Mexico City interview's five-month wait), Canada's visitor visa (CAD 100 and 85 for biometrics), Australia's subclass 600 (AUD 250), Mexico's electronic visa for Brazilians (US$10, 180 days) and Brazil's e-Visa for Americans, Canadians and Australians (US$80.90); each paid, decided after its wait and good for its term and no longer than the passport. Not kept: Canada's eTA for a Mexican or Brazilian holding a US visa, the US's Visa Integrity Fee (its collection at these posts unconfirmed), and a refusal at interview. Tests: `tests/visas.test.ts`; 3 mutations, all killed.
- Northern Ireland's license path was set down with no town in SLATE's list to reach it until 2026-09-29, when Belfast was added.
- **Done, 2026-09-29: a license exchanged on moving.** New York (a US state's or Canadian province's), Connecticut (those, Germany's and France's, $124), Ontario, British Columbia and New South Wales (their published lists) exchange a full license from elsewhere without the tests, and the old one is surrendered (`LICENSE_EXCHANGES`, `documents.exchange_license`). California's exchange for another state's license wasn't confirmed, and it's refused with that reason. Found by a played life: a British graduate with Connecticut's license took New York's tests again after moving. The same life showed an O-1 read too narrowly: regional and Off-Broadway companies are distinguished organizations, and the experts' letters a petition carries are read from reputation.
- Probation and points after a first license weren't kept until 2026-09-29, SLATE having no driving offenses. Since stage 3c, Great Britain's New Drivers Act (six points in two years revokes) and Ireland's novice limit (seven points) are (`systems/driving.ts`); France's six points and Brazil's year wait for those countries' cars.

### Stage 2: Journeys

#### Stage 2a: a journey by air, and somewhere to stay (done 2026-09-29)
- Airports are real (OurAirports, public domain), and a town flies from the large airport within about two hours of it, or its nearest airport through a hub.
- A journey's legs are the taxi to the airport, the airline's check-in, each flight, the border and the bags at the far end, and the taxi into town, each at its own time in its own place; the fares, bag fees, time to arrive before a flight, delays and cancellations, and taxis are published figures where they're found, and SLATE's where they aren't, said so. The schedule and route are SLATE's model: airlines' schedules aren't open data.
- Booking checks the papers for the far end and the calendar: the whole journey is one commitment, and nothing else on the calendar may overlap it. The bank pays, or it isn't booked. A booking canceled within 24 hours, a week or more before it leaves, is refunded whole (the DOT's rule); otherwise the economy fare isn't.
- On the day the player must be there to leave, and the airline checks the papers again; a flight is late, on time, or canceled and rebooked, at the published rates. The town and the clock change on arrival, not before.
- Somewhere to stay: a hotel at the town's published average rate and its taxes, or one's own home there.
- Tests: a full journey out and back across a border; the bank short; a passport lost before the day; a clash on the calendar; a missed departure; a delay and a cancellation; save and reload mid-journey.

Evidence: `systems/journey.ts`, `systems/airports.ts`, `systems/stays.ts`, `content/air.ts`, `content/airfares.ts` (DOT Q1 2026, built by `tools/build-airfares.mjs`), `content/airports.ts` (3,266 OurAirports airports, built by `tools/build-airports.mjs`), `content/stays.ts`; the research in `docs/research/world/` (air, hubs, hotels, per diem). `tests/journey.test.ts` (12): New York to London on the ETA with a bag and five hotel nights and home again, the town and clock changing on arrival; the DOT's New York–Los Angeles fare to the cent and the $45 bag; no bed, the bank short, a journey or a plan on the calendar in the way; a passport lost before check-in; a player not there; the DOT's 24-hour refund and the hotel's day; BTS's rates of late and canceled flights over 20,000 draws; a night kept on at check-out; a journey saved and opened mid-flight. 18 mutations, all killed. Screens: Travel, from Home's Travel panel, opened by the guide's chapter Getting Around.

#### Stage 2b: the career's own trips, flown (done 2026-09-29)
- A location shoot flies out on the production's ticket, on the latest of the day's departures that lands ten hours before the first call, and home on the first after the job; a job in another city with no production travel is reached on the actor's own fare, a cost of the work, and the fare home too. Each is a journey (`careerFlight`, `startCareerJourney` in `systems/journey.ts`), with the flights' delays and cancellations, and the town changes when it lands. A trip under 400 km isn't flown (SLATE's estimate) and is still instant until rail is kept.

Evidence: `tests/careertrips.test.ts` (3): the plan to London, none already gone and none to New York from New Haven; Toronto on the production's ticket, there when it lands and home again; Los Angeles to New York on the actor's own fare, recorded as a cost of the work. 7 mutations, all killed.

#### Stage 2c: a journey by train (done 2026-09-29)
- Eleven routes among SLATE's towns: Amtrak's Acela and Northeast Regional (New York to Washington, Boston, Philadelphia and New Haven; Boston to Washington), Metro-North's New Haven Line, Eurostar (London to Paris, Brussels and Amsterdam), Avanti (London to Manchester), Irish Rail (Dublin to Cork) and the Pacific Surfliner (Los Angeles to San Diego). Times are the weekday medians of the operators' own 2026 timetables; punctuality is each operator's on its own measure; fares are the MTA's, Avanti's and Irish Rail's published fares, Amtrak's derived from its FY2025 ticket revenue per passenger-mile (it publishes none), Eurostar's from its 2025 revenue over its passengers (its "from" fares are floors). Each canceled ticket comes back by its operator's rule.
- Travel's By offers the trains where any run; a job's trips take the train where one runs, the fastest on the production's ticket and the cheapest on the actor's own.
- SLATE's model, and said so: when in the day trains leave (the weekday count spread from six to nine), the rides to and from the station (thirty minutes by transit, the fare not kept), how late a late train is (a mean of twenty minutes past the operator's line), Philadelphia's, New Haven's and the Surfliner's miles.

Evidence: `content/rail.ts`, `systems/rail.ts`, `docs/research/world/research-rail.json`; `tests/rail.test.ts` (8): Amtrak's fares from its own figures, Metro-North's peak, every route both ways, Eurostar's legs and border before boarding, trains late at the operator's rate, a booked Acela to Washington, Amtrak's refund. 12 mutations, all killed.

#### Stage 2f: jet lag (done 2026-09-29)
- The body keeps the clock it left with and catches up at the CDC's rates, an hour a day east and an hour and a half west (`systems/jetlag.ts`). What it changes is sleep, as the studies of ordinary travelers found (Willoughby 2025's 64,847 trips; Beaumont 2004): a night restores less while the clock is out, SLATE's estimate of how much, 0.015 of a night's quality an hour east and half that west. Travel shows the body clock.

Evidence: `tests/jetlag.test.ts` (4) and the New York to London journey. 5 mutations, all killed.

#### Stage 2e: coaches, the ride to the station, cancellations, three more towns (done 2026-09-29)
- Coaches on thirteen corridors, one operator each (FlixBus and Greyhound, National Express, Bus Éireann, Dublin Express, Caminante, Estrella Roja, Primera Plus), at the operators' fastest times and lowest fares, which most pay more than, said so. Where a coach operator publishes no punctuality, National Express's network-wide 86.9% is SLATE's estimate; Flix and Greyhound refund only in vouchers, which SLATE doesn't keep.
- The rides to and from a station cost each town's single transit fare (`content/transit.ts`, seventeen towns); a town without one rides free, said so.
- A train is canceled at its operator's published share (ORR's for Avanti and LNER, MTA's counts for Metro-North, Irish Rail's), and the traveler takes the next; Amtrak and Eurostar publish none, so none is kept.
- Belfast, Edinburgh and Toluca are SLATE's towns, with the Enterprise, LNER and El Insurgente to them, and Belfast's and Edinburgh's hotels; Northern Ireland's license path can be reached.

Evidence: `tests/rail.test.ts` (coaches, transit and cancellations). 5 mutations, all killed.

#### Stage 2d: business or first (done 2026-09-29)
- A flight can be booked business or first, at IATA's premium fares, about five times economy's worldwide (26 July 2024), with two checked bags that come with it (SLATE's reading of the carriers' "complimentary"). No one publishes the multiple by route or for the US alone. The DOT's average fare, which SLATE carries as economy, counts first-class fares too, by a share it doesn't publish; each fare now says so.

Evidence: `AIR.premiumMultiple` in `content/air.ts`, `planJourney`'s cabin; `tests/journey.test.ts` (a cabin other than economy). 3 mutations, all killed. The research is `docs/research/world/research-cabins-car.json`.

Open in Stage 2, and why: a car of one's own as a leg waits for Stage 3, as SLATE has no vehicles to drive (AAA's 2026 costs, the IRS rate, fuel, parking and tolls are researched).
### Stage 3: Vehicles

#### Stage 3a and 3b: a car bought, kept and run (done 2026-09-29)
- **The catalog** (`content/vehiclecatalog.ts`, built by `tools/build-vehicles.mjs`): each market's eight best-selling new cars of 2025 (the US, Canada, Mexico, Britain, Ireland) at the 2026 price on the maker's own site where it could be read, with the fuel, official economy, CO2 and weight; what a price leaves out that the maker states (a US destination charge, Canadian freight, Irish delivery) is added.
- **Buying** where one lives, in eight jurisdictions (`content/vehiclefees.ts`): New York's, Connecticut's and California's sales tax, title and registration (New York by weight, Connecticut's 7.75% over $50,000, Los Angeles's rise on 1 October 2026); Britain's on-the-road price; Ireland's price with VAT and VRT and the motor tax by CO2; Ontario's HST; British Columbia's GST and PST; Mexico City's plates. Outright, or on a loan at the published rate: Experian's US rates by credit tier, the Bank of Canada's, Banxico's, the Central Bank of Ireland's, the Bank of England's £10,000 personal loan rate.
- **Keeping it**: a month's insurance at the place's average paid (the NAIC's for the US states, full cover or liability only; the ABI's; the Central Bank's; FSRA's; ICBC's; Mexico City's only a comparison site's quote, said so), the loan's payment, the registration renewing on its term, and a month's everyday driving at the place's published mileage (the FHWA's, the DfT's, the CSO's, Statistics Canada's; Mexico's none, SLATE's mean), fuel at the week's pump prices by the car's official economy, and AAA's upkeep a mile.
- **Its value** falls on iSeeCars' published points, straight lines between (SLATE's); a used car is the catalog at an age on the same curve; Sell It sells at that value, the loan paid off first, and a loan bigger than the car paid from the bank.
- Not kept, and said so on the screen: a dealer's lower trade-in price, repossession, a car counted in net worth, parking.

Evidence: `tests/vehicles.test.ts` (9); 11 mutations, all killed (one found the Irish diesel mild hybrid filed as a petrol hybrid). Screen: Cars, from Home's Cars panel, opened by the guide's chapter A Car Of Your Own.

#### Stage 3c: driving (done 2026-09-29)
- **A drive as a journey** (`planDrive`, Travel's By): one's own car, where it is, with a license that lets one drive there; the road the straight line stretched by the US network's circuity (1.20, Ballou et al. 2002, read everywhere), at England's motorway and major A-road average (56.6 mph, DfT 2025, read everywhere), with the Highway Code's break every two hours; its fuel and upkeep, and the New York to Washington corridor's tolls. The car is where it's driven to. Towns joined by road: one country, North America's three, the island of Ireland.
- **What the road brings**, every day's driving and a journey's: a crash's injury at NHTSA's 74 people injured a hundred million vehicle miles, scaled by the driver's age as AAA's injury crash involvement runs, through the injury system; a speeding ticket at New York's or England's published tickets a driver a year, spread over the place's miles, with the place's own fine and points; a license suspended or revoked where the points reach its law's line (New York's 11 in 24 months, Connecticut's, California's 4 in 12, Britain's 12 in three years and its novices' 6 in two, Ireland's 12 and its novices' 7, Ontario's 15). A car whose owner may not drive sits idle. Road deaths are in the all-cause life table, so none is drawn here.
- SLATE's estimates, and said so: the band of a speeding ticket, the injury mix of a crash, a ticket's frequency where a place publishes none.

Evidence: `tests/driving.test.ts` (7); 11 mutations, all killed. Open in stage 3: parking and a home's garage.

### Stages 4-8 (to be detailed in turn)

## Coverage record

Legend: **Verified**, sourced from an authority and dated. **Modeled**, a documented assumption. **None**, not built.

| System | Place | State | Source and date |
|---|---|---|---|
| Housing purchase, lending, letting | US (NY, CT, CA), UK nations, 16 lending countries | Verified with modeled parts | `systems/homes.ts` header, 2026-09-28 |
| Passports | US, GB, CA, IE, IS, DE, FR, ES, JP, KR, MX, AU, BR, NZ, LV | Verified; France's processing days modeled | each office's pages, 2026-09-29 (`content/passports.ts`) |
| Passports | other citizenships | None | refused with the reason |
| Entry rules | those 15 destinations × those 15 citizenships | Verified; ETIAS not yet live | each destination's authority, 2026-09-29 (`content/entry.ts`) |
| Entry rules | any other pair | None | refused with the reason |
| Driver's licenses | NY, CT, CA, GB, NI, ON, BC, IE, IS, DE, FR, ES, JP, KR, Mexico City, NSW, BR, NZ, LV | Verified fees and steps; course prices are published ranges' midpoints; booking lead times modeled | each authority, 2026-09-29 (`content/licenses.ts`, `content/licensepaths.ts`) |
| Driving test pass rates | GB, NI, NZ, DE, FR, IE, JP, NY, CA, ON, BC, NSW, ES, LV | Verified, some reported secondhand (said so) | DVSA, DfI, NZTA, TÜV-Verband, Sécurité routière, CSO, NPA and others, 2026-09-29 |
| Driving test pass rates | CT, IS, BR, Mexico City, KR, and most written tests | Modeled: the mean of the published rates of the same kind | `passRate` in `content/licensepaths.ts` |
| Driver's licenses | anywhere else | None | refused with the reason |
| Permission to work as an actor | US (F-1, OPT, O-1B), UK location shoots, Canada (C14), the CTA | Verified fees and rules; standard processing times and the O-1 evidence's reading modeled | USCIS G-1055 09/09/26, gov.uk, IRCC, 2026-09-29 (`content/workrules.ts`) |
| Permission to work | anywhere else | None | refused with the reason |
| Holding a passport or license at the start | US citizens | Verified | State's FY2025 passports in circulation; FHWA DL-20 (2024) |
| Holding a license at the start | other citizenships | None | nobody is given one |
| Journeys | New Haven to New York by rail | Verified | CT Mirror, 2026-01-12 |
| Rail routes, times, punctuality | 11 routes in the US, UK, Ireland, France, Belgium, the Netherlands | Verified; departure times modeled | operators' timetables and reports, 2026-09-29 (`content/rail.ts`) |
| Rail fares | Metro-North, Avanti, Irish Rail | Verified | the operators' fare tables, 2026 |
| Rail fares | Amtrak, Eurostar | Derived from the operators' own revenue figures | Amtrak FY2025 route results; Eurostar 2025, read secondhand |
| Airports | the world's 3,266 with scheduled flights | Verified (public domain) | OurAirports, downloaded 2026-09-29 |
| Air routes and schedules | everywhere | Modeled: direct between large airports within reach, else through the ACI's busiest hubs; three departures a day | ACI World 2025 rankings |
| Airfares | 66 pairs among twelve US markets | Verified | DOT Consumer Airfare Report Q1 2026 |
| Airfares | other US flights | Derived: DOT's per-mile fare by distance | DOT Q1 2026 |
| Airfares | international | Modeled: DOT's longest band's per-mile fare | no official source publishes them |
| Flight delays and cancellations | everywhere | Verified for US domestic 2025, applied everywhere | BTS, 2025 |
| Hotels | 16 cities' average rates, 10 cities' per diems, every city's taxes | Verified; per diems are ceilings, said so | CoStar/STR, national statistics, GSA, State Department, 2026-09-29 |
| Hotels | anywhere else | None | refused with the reason unless one has a home there |
| Vehicles | all | None | |
| Land | all | None | |
| Construction (new build) | all | None | |
| Accommodation you book | all | None | |
