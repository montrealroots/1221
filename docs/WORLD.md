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
| 1 | Documents: identity, passport, driver's license, entry rules, as records with issuer, validity, fees, processing, and checks that name what's missing | citizenship, geography | 1a done 2026-09-29; 1b open |
| 2 | Journeys: a trip of legs (walk, taxi, rideshare, bus, train, flight), fares, durations on the calendar, time zones, the player's location moving only on arrival; airports; booked accommodation at the far end; the return | 1 | Not begun |
| 3 | Vehicles: a researched catalog by country, dealers and a used market, finance, title, registration, insurance, fuel, servicing, parking and a home's garage, depreciation, resale; driving as a journey's leg | 1, 2 | Not begun |
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

#### Stage 1b: in progress

- **Done, 2026-09-29: the border is checked.** A job across a border is taken only if the actor could go on its travel day and come home after (`borderRefusal` in `systems/career.ts`, read by `acceptRefusal`, so an offer says why it can't be taken). On the travel day it's asked again: papers lost or run out since, and the actor is turned back and the production recasts. A home abroad is lived in, or bought to live in, only with the right to live there (`residenceRefusal`): a citizen, free movement (the EU and EEA's, the Common Travel Area's), or a visa for the country in force. Until then a production in London, Vancouver or Toronto flew an actor out with no passport asked, and an actor on a London shoot could move into a London home they owned. Tests: `tests/border.test.ts`; 10 mutations, all killed.
- **Done, 2026-09-29: permission to work, apart from entry** (`systems/permission.ts`, `content/workrules.ts`, the research in `docs/research/world/research-workpermission.json`). A job is refused where the actor may not work, at the offer and on the travel day. In the United States: an F-1 student doesn't work off campus while studying; OPT after the degree (Form I-765, $470, or $2,250 with premium processing decided in 30 business days), filed from 90 days before the program's end to 60 after, twelve months from the later of the end and the approval, ended by more than 90 days in all without work; then an O-1B the agency petitions for ($1,055, the $600 Asylum Program Fee and SAG-AFTRA's $300 opinion; premium $2,965 in 15 business days), approved on three of the kinds of evidence of 8 CFR 214.2(o)(3)(v)(B) that the career shows, for three years, extended a year at a time, denied on fewer with the fees gone. In the United Kingdom a location shoot for an overseas production is a visitor's. In Canada a C14 work permit, tied to the production: a US citizen's issued at the border for CAD 155, anyone else's applied for ahead with biometrics. An Irish citizen works in the UK under the Common Travel Area. Tests: `tests/permission.test.ts` (11); 17 mutations, all killed. Screens: Papers, the Permission To Work tab.
- **Open, and the largest: a foreign-born life has nowhere to work after OPT without an O-1.** Found by lives played to death on 2026-09-29: a British, an Irish and a Mexican graduate each worked their OPT year, weren't approved for an O-1 on the evidence a first year shows, and were broke from about thirty for the rest of their lives; the British one starved past the survival limit (its run crossed the limit before the limit existed, and ended when it took effect). In life they'd go home and work there. SLATE's acting business is in the United States only, a move home to another country isn't one SLATE offers, and a destitute person isn't fed by a pantry (docs/UNBITTEN.md). What would close it: the business in another country (the UK's first), a move home, and a citizen's own safety net there. Until then, a life begun outside the US is a hard one, as it is for many foreign actors, but not the way it is.
- Visa applications: SLATE names the visa a citizenship needs and doesn't take the application.
- Northern Ireland's license path is set down but no town in SLATE's list is in Northern Ireland, so it can't be reached.
- **Done, 2026-09-29: a license exchanged on moving.** New York (a US state's or Canadian province's), Connecticut (those, Germany's and France's, $124), Ontario, British Columbia and New South Wales (their published lists) exchange a full license from elsewhere without the tests, and the old one is surrendered (`LICENSE_EXCHANGES`, `documents.exchange_license`). California's exchange for another state's license wasn't confirmed, and it's refused with that reason. Found by a played life: a British graduate with Connecticut's license took New York's tests again after moving. The same life showed an O-1 read too narrowly: regional and Off-Broadway companies are distinguished organizations, and the experts' letters a petition carries are read from reputation.
- Probation and points after a first license (Great Britain's New Drivers Act, France's six points, Ireland's novice limit, Brazil's year) aren't kept: SLATE has no driving offenses yet.

### Stage 2: Journeys (to be detailed next)
### Stages 3-8 (to be detailed in turn)

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
| Journeys | everywhere else | None | |
| Vehicles | all | None | |
| Land | all | None | |
| Construction (new build) | all | None | |
| Accommodation you book | all | None | |
