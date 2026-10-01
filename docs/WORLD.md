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
| 2 | Journeys: a trip of legs (walk, taxi, rideshare, bus, train, flight), fares, durations on the calendar, time zones, the player's location moving only on arrival; airports; booked accommodation at the far end; the return | 1 | Done 2026-09-29 (2a to 2f); this row said "Not begun" until 2026-09-29, after it was |
| 3 | Vehicles: a researched catalog by country, dealers and a used market, finance, title, registration, insurance, fuel, servicing, parking and a home's garage, depreciation, resale; driving as a journey's leg | 1, 2 | Done 2026-09-29 (3a to 3d) |
| 4 | Land: identifiable parcels, listings, due diligence, offers, closing, taxes, resale, several parcels, combining and splitting where the rules allow | 2 | Done 2026-09-29 (4a and 4b); open items below |
| 5 | Construction: what to build on a parcel, design, permits, contractors, stages, payments, delays, change orders, inspection, occupancy; renovation and extension of what stands | 4 | Done 2026-09-29 (5a to 5c); open items below |
| 6 | A home's contents: furniture, appliances, rooms, with what each makes possible; garages holding vehicles; bedrooms holding people | 3, 5 | 6a to 6c done 2026-09-29, 6d (lodgers) 2026-09-30; open items below |
| 7 | Vehicle work: customization with fit rules, shops, work orders; boats and aircraft, crew, and the difference between owning one and being qualified to operate it; charter | 3 | 7a to 7c done 2026-09-29, 7d to 7f (boats, crew and charter) 2026-09-30; open items below |
| 8 | Rentals on a journey: rental cars, holiday lets, their deposits, terms, extensions and damage | 2, 3 | Done 2026-09-29 (8a and 8b), 8c (extensions) 2026-09-30; open items below |

## The owner's second instruction (2026-10-01)

Asked what of the instruction hadn't been built, the owner said: "Add it all and don't stop until its done." What's missing was set down on 2026-10-01, section by section, and each is built below as its research comes in, with its evidence in the stage it belongs to.

- **Ownership limits (done 2026-10-01).** A person owned one boat and one plane, a second refused with "You own a boat." and "You own a plane.", a limit no law, lender or marina sets. Now each is a list (`boatsOf`, `planesOf`): each boat and plane its own record, months, loan and repossession, sold on its own, carried along on a move, counted in net worth. A save's single one is moved into the list on opening, and its months, scheduled before they named one, still charge it. The limits left are the bank, the lender's record and, for a lodger, New York City's two boarders. Tests: `tests/boats.test.ts` (a third boat bought, one sold, the months of each; two carried; a save from before), `tests/aviation.test.ts` (a second plane).

- **Kinds of stay and their terms (done 2026-10-01, `content/staytypes.ts`, `systems/stays.ts`, researched in `docs/research/world/research-stays-rentals.json`).**
  - **Kinds:** besides a town's average hotel, what was read there. A hostel's bed is sold by the person: New York, Los Angeles, London, Toronto, Vancouver and Mexico City, on Hostelworld. A motel in New Haven and Los Angeles. A budget chain's cheapest night in London and Dublin, said to be its "from" price. An extended-stay suite or serviced apartment in New York, Edinburgh and Dublin. The town's taxes apply to each. A kind a town hasn't is refused with the reason, not swapped for another. Mexico City's hotels have an average, Monex's MXN 1,600, and Vancouver's 2.5% major-events tax to 2030 is charged, GST on it all.
  - **Rates:** a stay is booked on a flexible rate or prepaid at 11.5% off, the middle of the 8% to 15% hotels commonly give, not refunded.
  - **Refunds:** a flexible rate is refunded whole until a day before arrival. After that, a late cancellation or a no-show keeps the first night and the rest is released, as hotels do. Until then a late cancellation or a missed journey forfeited every night.
  - **Parking:** a car driven to a New York hotel pays its valet parking at $85 a night, the middle of what its hotels list. No other town's was read.
  - **Round trips by car:** the way home of a round trip by one's own car is planned from where the car will be, the town it was driven to. Until then a round trip by car was refused with "The car is in" the town it left from.
  - **Tests:** `tests/staytypes.test.ts` (7).
  - **Not kept:** early check-in and late check-out fees, incidental holds, and resort and rural rates, which weren't published or read. Room types beyond one room or one bed, with occupancy limits being fire codes and not a published rule.

- **A rental's class and its borders (done 2026-10-01, `RENTAL_CLASSES` and `RENTAL_CROSSINGS` in `content/rentals.ts`).**
  - **Classes:** a midsize, a full-size, an SUV, a pickup, a van, a convertible and a luxury car beside the small one, at Kayak's average a day for each at the airport (read 2026-09-30, in the money Kayak shows; Toronto's, Vancouver's and Mexico City's show in dollars). A class with no average at an airport isn't offered there. The company's terms (age, deposit, taxes) apply to each, and mileage is unlimited, as Enterprise's US terms have it.
  - **Borders:** a US rental may be driven into Canada, as Enterprise's and Budget's terms allow, but not into Mexico, which Enterprise forbids and Budget allows only on a corporate account.
  - **Not kept:** one-way drop fees, since SLATE's rentals go back where they were picked up; an additional driver, since nobody else drives; and a fuel policy's refueling charge, since SLATE refuels as it drives.
  - **Tests:** `tests/rentals.test.ts` (2 more).

- **Assistance where a person lives (done 2026-10-01, `systems/assistance.ts`, researched in `docs/research/world/research-welfare.json` and `research-documents-safetynet.json`).** Found by a Toronto life that starved at 35, claiming nothing.
  - **Ontario Works:** CAD 343 and the actual rent to CAD 390 a month. Liquid assets to CAD 10,000. Earnings come off whole for three months, then CAD 200 and half the rest are kept. Decided in four working days.
  - **BC Income Assistance:** CAD 560 and the rent to CAD 500. Assets to CAD 5,000. CAD 600 of earnings kept after the first month. A three-week work search first.
  - **SNAP in New York, California and Connecticut:** the USDA's maximum ($298, then $306 from 2026-10-01) less 30% of net income. It goes onto an EBT card that pays for groceries first and nothing else. An adult of 18 to 64 without 80 hours of work a month is paid three months in three years. Until later on 2026-09-30 the shelter deduction wasn't kept, and the gross and net limits never bound. Now (`snapShelter`, `research-sweep5.json`) rent, plus the state's heating and cooling utility allowance where the bills are paid, is taken off above half of net income, up to $744 ($769 from fiscal 2027, read from an excerpt). The allowances are New York City's $1,062, the rest of New York's $877, California's $663 and Connecticut's $976. New York's gross limit, 150% of the poverty line, now binds; California's and Connecticut's 200% still don't for a single adult. Writing the tests caught net income going below zero, which would have paid more than the maximum. 10 mutations, all killed in the end; two needed tests.
  - **Not kept:** Canada's regular Employment Insurance, because a performer is self-employed under the Status of the Artist Act; and a non-citizen's eligibility, which turns on status SLATE doesn't keep.
  - **EI's special benefits for the self-employed** (`systems/eiself.ts`, `benefits.ei_register`, later on 2026-09-30, researched in `research-canada-benefits2.json`):
    - Registering, a Canadian pays 1.63% of each check, to $1,123.07 a year.
    - After twelve months registered, with $9,254 earned the year before, a week too sick to work (in hospital, or laid up by an injury) pays 55% of last year's weekly earnings, to $729. The first week is unpaid, and a claim runs 26 weeks at most.
    - Maternity, parental and caregiving benefits aren't kept: SLATE's lives have no children or partners.
  - **Tests:** `tests/assistance.test.ts` (5).
- **Canada's public health insurance (done 2026-09-30, `canadianShareOf` in `systems/health.ts`).** Found by the same Toronto life, replayed once Canada was an acting market. It lived to 87 with 578 credits, and died owing $1,083,058 for medical care, billed at American prices, uninsured.
  - A Canadian citizen living in Ontario or British Columbia pays nothing for a doctor, the emergency department, urgent care or a stay in hospital. OHIP has had no waiting period since 2020.
  - Prescriptions are private for an adult, but free under 25 in Ontario (OHIP+). A dentist and an optician are private.
  - **The provincial drug plans** (`canadianDrugShare`, later on 2026-09-30):
    - Ontario's Drug Benefit from 65: $100 a program year, then up to $6.11 a prescription, or up to $2 with no deductible on $25,480 or less.
    - Trillium under 65: a quarter of 4% of last year's income each quarter, then up to $2.
    - BC's Fair PharmaCare: the deductible by income from its 40-band table, then 30% of each prescription, to the family maximum.
  - **Not kept:** a permanent resident's or work-permit holder's cover, since SLATE keeps only citizenship.
  - Replayed on the fix, the same life dies at 87 worth −$16,007, with a place of its own from 42. It still went hungry at times after 60 (604 days), because Canada's public pensions weren't built.
- **Canada's public pensions (done 2026-09-30, `systems/capensions.ts`, researched in `research-canada-pensions.json` from canada.ca, the CRA and ESDC).**
  - **The CPP, paid in:** a self-employed Canadian pays both halves from each check while living in Canada. That is 11.9% between the $3,500 exemption and the YMPE ($74,600), and 8% on to the YAMPE ($85,000).
  - **The CPP, paid out,** claimed from 60 to 70 (`pension.cpp`):
    - Base CPP replaces 25% of average earnings. The enhancement takes that to a third, phased in over 2019 to 2025 as its contribution was, and the second additional replaces 8% of earnings above the YMPE from 2024.
    - The general dropout leaves out the lowest 17% of years, eight at most.
    - It is 0.6% less a month early and 0.7% more late, to 2026's $1,507.65.
  - **Old Age Security** from 65 (`pension.ca_oas`): $762.50 a month, or $838.75 from 75, in fortieths of forty years in Canada after 18. It asks ten years at least, and twenty to be paid abroad. SLATE counts a year where there was income while living in Canada, its reading.
  - **The GIS:** $1,138.90 a month, less half of last year's other income after the earnings exemption. It is paid only while living in Canada.
  - **Ontario's GAINS:** $92 a month, gone at $4,416 of income.
  - **Since, later on 2026-09-30:** OAS deferred past 65 pays 0.6% more a month, to 36% at 70. The recovery tax takes 15% of last year's net income over $95,323 back from it, a month's share at a time.
  - **The GIS top-up's** own 25 cents a dollar over $2,048, to $10,352 (its threshold from a 2022 report, its end confirmed for 2026). **BC's Senior's Supplement** comes from its 100-row table, $99.30 a month at most, with the GIS in British Columbia.
  - **Not kept:** taxing the pensions.
  - **Replayed with them,** the Toronto life dies at 87 worth +$54,242, not −$16,007. Its hungry days fell from 604 to 86, all at 61 to 64, before the life-player claims at 65.
  - **Tests:** `tests/capensions.test.ts` (6). 12 mutations, all killed once four tests were added.
  - **Tests:** `tests/homebenefits.test.ts`, the Canadian case. 5 mutations, all killed.

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
- **Done, 2026-09-30: Canada as an acting market** (`content/career.ts`, researched in `docs/research/world/research-canada-acting.json`). Until then Toronto and Vancouver weren't career cities, and a Canadian actor worked through New York.
  - **Rates, the agreements' own:** in Toronto the IPA's principal day (35.25, then 72.75 and ,006.75), its lesser actor category and a principal's week on a feature; the page read didn't say on which day in 2026 and 2027 the rises start, and SLATE starts them on 1 January. In Vancouver the BCMPA's, each from its own published day (54.40 from 29 March 2026). On stage in both, the Canadian Theatre Agreement's Category A week (,332 from 22 June 2026); which companies are Category A the booklet doesn't say.
  - **Agencies:** ten, from StageMilk's Toronto list, the Vancouver Actors Guide and Lucas Talent's own site, at the 15% ACTRA calls standard. Their tiers, bars and auditions are SLATE's estimates.
  - **ACTRA:** a first engagement makes an apprentice (5, and 5 each year); a third credit makes a full member, for the ,600 initiation fee less the apprentice fee. A full member pays 95 a year in basic dues and 2.25% of each check in working dues, the two capped at ,000 a year. UBCP/ACTRA's own fees weren't read, so ACTRA National's are charged in British Columbia.
  - **Casting Workbook PRO,** 2.99 a month, a year at a time, casting in Canada.
  - **Fixed with it:** work in the country an actor lives in is no longer withheld as a visitor's (a Londoner's British work was). And a job under any union but SAG-AFTRA no longer joins American Actors' Equity; London's, Dublin's and Mexico City's did.
  - **Since, later on 2026-09-30** (researched in `research-actra2.json`, the IPA 2025–2027, the BCMPA and the NCA):
    - **Prepaid use:** an ACTRA screen part is paid its fees with the producer's prepaid use: the all-uses option, 110% on television and 135% on a feature. Which option a producer takes isn't published, so this is SLATE's reading.
    - **Permits:** short of full membership, the IPA's work permit, $260 a week on a principal part and $210 on an actor's. One who isn't Canadian pays $260 the first week and $175 after.
    - **Commercials** under the NCA: $939.50 on camera or $685 by voice, with a year of national television use at the chart's least.
    - **Animation voice** under the IPA: $681.75 a day.
  - **Not kept:** the 3.6% of a distributor's gross after the prepaid years, which ACTRA PRS shares and no figure lets SLATE price; the NCA's permits. EI's special benefits were built the same day (`systems/eiself.ts`).
  - Tests: `tests/cabusiness.test.ts` (6); 9 mutations, all killed.
- **Done, 2026-09-29: a foreign-born life has somewhere to work after OPT without an O-1.** Until then it was the largest open item. Found by lives played to death on 2026-09-29: a British, an Irish and a Mexican graduate each worked their OPT year, weren't approved for an O-1 on the evidence a first year shows, and were broke from about thirty for the rest of their lives; the British one starved past the survival limit (its run crossed the limit before the limit existed, and ended when it took effect). In life they'd go home and work there. SLATE's acting business is in the United States only, a move home to another country isn't one SLATE offers, and a destitute person isn't fed by a pantry (docs/UNBITTEN.md). What would close it: the business in another country (the UK's first), a move home, and a citizen's own safety net there. **Since 2026-09-29, the second and third are in for Britain:** a citizen can move home to the town they were born in (`homeTownOf`, the flight one way and the border asked), and Universal Credit is the claim for a British or Irish citizen living there (`systems/universalcredit.ts`). The O-1's experts' letters are read from three productions' directors, as immigration firms advise and the Administrative Appeals Office requires, not from reputation. And the first is in too: London's acting business, at Equity's minimums in pounds, with London's agencies and Spotlight (`tests/ukbusiness.test.ts`), so a British graduate who goes home can work. A US return is asked only of someone the US taxes (`owesUsReturn`). Ireland's and Mexico's businesses and safety nets followed the same day: Dublin's and Mexico City's acting work, Jobseeker's Allowance and the Seguro de Desempleo, their public care and their pensions; played lives of each passed. A life begun outside the US stays a hard one, as it is for many foreign actors, but no longer for want of a place to work.
- **Done, 2026-10-01: a graduate's US status, and its end** (`usStatusEnds` and `US_STATUS_KIND` in `systems/permission.ts`). Found by a Mexico City life played to death on the final code of 2026-10-01. A Mexican graduate's OPT ran out, they stayed on in New York, every job was refused, nothing was said, and they starved at 31. The scripted player never went home: `homeTownOf` leaves out the business's own cities, and Mexico City became one on 2026-09-29, so a Mexican born there had no home to go to. Now:
  - A student's F-1 status holds while they study and for 60 days after the program ends (8 CFR 214.2(f)(5)(iv)). OPT's holds for 60 days after it runs out, but not after it ends for too long without work, a violation that leaves no grace. An O-1's holds for 10 days past its term (8 CFR 214.1(l)(1)). An application pending holds it open.
  - When permission ends, a decision names the day status ends and offers OPT, where it can still be had, and the move home. The move home is to their own country's acting city, or the town they were born in (`homeAbroadOf` in `systems/career.ts`). Papers shows the day.
  - Staying past it, they're out of status. No work can be had while they stay, and an O-1 waits for a consulate at home. The F-1 visa is void (INA 222(g)). The Visa Waiver Program is closed to them for good (INA 217(a)(7)), so a British or Irish citizen's ESTA is refused, and one already held no longer counts.
  - Unlawful presence, and the three- and ten-year bars it brings, isn't counted: a student admitted for the duration of status accrues none until the government finds the violation (Guilford College v. Wolf, 2020), which SLATE doesn't draw.
  - Tests: `tests/permission.test.ts` (4 more); 17 mutations, all killed after two redundant checks were removed.
- **Done, 2026-10-01: writing to the agencies** (`career.query_agencies`, `QUERY` in `systems/career.ts`). An unrepresented actor who has started working can Submit To Agencies once they have headshots. The submission, a headshot, a résumé and the reel, goes to the agencies where they live. Each agency reads it as it reads a showcase, against its bar and its own interest, and those interested answer about four weeks on with an offer. A submission can be sent again six months on. The four weeks and six months are SLATE's estimates. Until then an agency came only from a showcase, a job it noticed, or a manager's meetings. The Mexico City life that went home had no agency for 27 months, and starved, in the city where the country's television is made. Tests: `tests/mxbusiness.test.ts` (2 more); 10 mutations, all killed after one unreachable refusal was removed. Still wrong on the Career screen, and older than this: a Mexico City actor is offered the American casting sites and Spotlight, since no Mexican casting site was researched, and the showcase table lists the American agencies.
- **Done, 2026-09-29: visa applications.** Until then SLATE named the visa a citizenship needed and didn't take the application. Now the ten pairs that need one apply on Papers (`content/visas.ts`, `documents.apply_visa`): the US's B-1/B-2 for Mexicans and Brazilians ($185, the Mexico City interview's five-month wait), Canada's visitor visa (CAD 100 and 85 for biometrics), Australia's subclass 600 (AUD 250), Mexico's electronic visa for Brazilians (US$10, 180 days) and Brazil's e-Visa for Americans, Canadians and Australians (US$80.90); each paid, decided after its wait and good for its term and no longer than the passport. Not kept: Canada's eTA for a Mexican or Brazilian holding a US visa, the US's Visa Integrity Fee (its collection at these posts unconfirmed), and a refusal at interview. Tests: `tests/visas.test.ts`; 3 mutations, all killed.
- Northern Ireland's license path was set down with no town in SLATE's list to reach it until 2026-09-29, when Belfast was added.
- **Done, 2026-09-29: a license exchanged on moving.** New York (a US state's or Canadian province's), Connecticut (those, Germany's and France's, $124), Ontario, British Columbia and New South Wales (their published lists) exchange a full license from elsewhere without the tests, and the old one is surrendered (`LICENSE_EXCHANGES`, `documents.exchange_license`). California's exchange for another state's license wasn't confirmed, and it's refused with that reason. Found by a played life: a British graduate with Connecticut's license took New York's tests again after moving. The same life showed an O-1 read too narrowly: regional and Off-Broadway companies are distinguished organizations, and the experts' letters a petition carries are read from reputation.
- Probation and points after a first license weren't kept until 2026-09-29, SLATE having no driving offenses. Since stage 3c, Great Britain's New Drivers Act (six points in two years revokes) and Ireland's novice limit (seven points) are (`systems/driving.ts`); France's six points and Brazil's year wait for those countries' cars.

#### Stage 1c: proving who one is at an American airport, and the state ID card (done 2026-09-30)
Researched in `docs/research/world/research-documents-safetynet.json` and `research-home-effects.json` (`systems/identity.ts`, `content/identity.ts`).
- **REAL ID:** since 7 May 2025 the TSA's checkpoint takes a REAL ID license or ID card, or a passport from anywhere. A domestic airline flight with neither costs TSA ConfirmID's $45, good for ten days of travel. Only airline flights pass the checkpoint: one's own plane, a charter or a rented one don't.
- A license or ID card issued, exchanged or renewed by an American state from now is REAL ID, at the same fee in New York, Connecticut and California. Connecticut upgrades one early for its $30 duplicate fee; New York's and California's early upgrade price wasn't read, so theirs come at the renewal.
- A starting license is REAL ID at its state's published share of holders:
  - California's 58% (May 2025) and Connecticut's about 73%.
  - New York's "more than half", taken at half, its floor.
  - Another state's, the mean of the three.
  - The TSA's 94% of travelers counts passports, and isn't used.
- **A state ID card** (`documents.apply_idcard`) for someone the state hasn't licensed: New York's $14 for eight years, Connecticut's $28, California's $40. Each is REAL ID.
- **Since, later on 2026-09-30:** an airline's ID outside America (`boardingIdRefusal`, researched in `research-travel4.json`):
  - Canada: a government photo ID, which a passport, a license or a provincial photo card is.
  - Mexico: a passport, a driver's license or the INE.
  - Britain: a passport or a photo driving license.
  - Ireland to Britain or back: a passport or an Irish passport card, Aer Lingus's rule since 25 February 2026.
  Without one, the traveler isn't boarded and the fare is gone.
- **The cards:**
  - Ontario's Photo Card and BC's BCID, CA$35 each (the BCID's from search summaries).
  - Mexico's INE, free to a Mexican of 18.
  - Ireland's passport card, €35, for five years or to the passport book's expiry, to a holder of an Irish passport.
  - The Ontario, BC and INE cards' terms weren't read, and they don't expire in SLATE. Tests: `tests/boardingid.test.ts` (4); 9 mutations, all killed.
- Residence documents abroad were built later the same day (stages 1d and 1e). Ireland's IRP card stays unbuilt, since no route reaches it.

Evidence: `tests/identity.test.ts` (6). 12 mutations, all killed in the end. Two first survived and needed tests: Connecticut's upgrade refused a second time, and a license granted by exchange being REAL ID. The airline leg's mode was first misread as `fly`, which is one's own plane; a test booking a real flight caught it.

#### Stage 1d: the right to live in another country (done 2026-09-30)

Researched in `docs/research/world/research-residence.json` from the governments' own pages. Until then `residenceRefusal` ended "SLATE doesn't grant it yet".

- **Britain's Global Talent visa** (`systems/residence.ts`, `documents.residence`):
  - It costs £561 for Arts Council England's endorsement, £205 for the visa, and the Immigration Health Surcharge of £1,035 a year for its five years.
  - It lets its holder live and work in Britain, and the surcharge makes the NHS theirs.
  - Arts Council England's criteria weren't read. SLATE endorses on the record the O-1 is approved on, three of its kinds of evidence.
  - Settlement, indefinite leave to remain (`documents.settle`), costs £3,226 after five years with pay earned in Britain. "Exceptional talent" settles in three, which SLATE doesn't tell apart from "exceptional promise".
- **Mexico's temporary residence**, by economic solvency:
  - Savings of 11,460 UMA or an income of 680 UMA a month over six months: MXN 1,344,373 or MXN 79,771 at 2026's UMA.
  - It costs MXN 11,140.74 a year, and the consulate's visa US$56. It lets its holder live there, not work.
  - It is renewed a year at a time in its last 30 days (`documents.renew_residence`).
  - Permanent residence costs MXN 13,578.96 after four years.
- **No route**, with the reason given:
  - Canada: the Self-Employed Persons Program is paused until further notice, and Express Entry has no arts category.
  - Ireland: an employment permit needs an employer's offer.
  - A US green card, until later the same day (stage 1e).
- **Not kept:** Ireland's IRP, which no route reaches; and a residence card's processing time. Naturalization came later the same day (stage 1e).
- Screen: Papers, Permission To Work, Residence Abroad.

Evidence: `tests/residence.test.ts` (3). 9 mutations, all killed.

#### Stage 1e: a green card, and a second citizenship (done 2026-09-30)

Researched in `docs/research/world/research-citizenship.json`.

- **A green card by extraordinary ability, EB-1A** (`documents.residence` for the US, `systems/residence.ts`):
  - The fees: the I-140 ($715), its $300 Asylum Program Fee for a self-petitioner, and the I-485 ($1,440). Premium processing is $2,965 more.
  - It is applied for from inside the US, on the O-1's record: three of its kinds of evidence, SLATE's reading of the ten criteria's three.
  - The I-140 takes 31 months, or 15 business days with premium processing (USCIS figures, reported). The I-485 takes 8.6 months, FY2023's median on USCIS's own fact sheet.
  - October 2026's Visa Bulletin has EB-1 current, except for those born in China (from 2023-07-01) or India (2023-02-01). They also wait the years their line is behind.
  - It lets its holder live and work anywhere in the US without an O-1.
- **Federal Medicaid from 1 October 2026** (`medicaidStatus` in `systems/health.ts`): a citizen's, or a green card holder's after five years (Pub. L. 119-21 §71109). An O-1's holder isn't among the groups named. New York's Essential Plan band still reaches them, as SLATE had it; whether it should, and California's state-funded Medi-Cal, weren't researched.
- **A second citizenship** (`systems/citizenship.ts`, `documents.naturalize`, `citizenshipsOf`):
  - Britain: twelve months after settlement, £1,839 with the ceremony, and £50 for the Life in the UK test. It is decided within six months.
  - Mexico: five years' residence, or two for outstanding artistic work (Ley de Nacionalidad art. 20), read on the O-1's record. It costs MXN 9,502.01 and is decided in 40 business days.
  - The United States: five years with a green card, $760. The processing time wasn't confirmed; SLATE's is eight months.
  - The citizenship of birth is kept. The US, Canada, Britain and Ireland allow it, and none of them counts the renunciation Mexico asks. Travel stays on the passport of birth.
  - A second citizenship gives the right to live and work there, public care, benefits and pensions there, and relief from foreign-buyer rules. Britain's settlement also opens Universal Credit, as indefinite leave lifts no recourse to public funds.
  - The language and knowledge tests are taken as passed, since SLATE doesn't keep which languages a person speaks. Canada and Ireland aren't reached, since no route to residence there is open to an actor.
- **Mexico's foreign buyer permit** (`foreignBuyerFee` in `systems/foreignbuyers.ts`): the SRE's convenio de renuncia, MXN 5,252.02, added to a foreigner's closing on a home in Mexico City, which lies outside the restricted zone.
- **Easements aren't built.** Their recording fees were read (ACRIS, Connecticut, Los Angeles County, Ontario, BC, HM Land Registry, Tailte Éireann), but nothing makes a parcel need one: no share of parcels without legal access, and no price effect of one, is published.
- A character is still created with one citizenship, from the birthplace (`70f3df7`). A second is only ever earned.

Evidence: `tests/naturalize.test.ts` (6), `tests/foreignbuyers.test.ts`. 11 mutations: 10 killed once two tests were added, and one redundant guard removed (Britain's five years, which settlement already asks).

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

Open in Stage 2 until 2026-09-29: a car of one's own as a leg, which waited for Stage 3; stage 3c made it one.
#### Stage 2e: what an airline owes for a flight three hours late (done 2026-09-30)
Researched in `docs/research/world/research-travel-2.json` and `research-travel-3.json` (`systems/compensation.ts`).
- A flight three hours or more late at arrival, a cancellation's five-hour rebooking among them, is owed for under the flight's law:
  - EU261 from Ireland: €250, €400 or €600 by distance, halved past 3,500 km under four hours (Your Europe).
  - UK261 from Britain: £220, £350 or £520, and £260 past 3,500 km under four hours (the CAA).
  - Canada's APPR to or from Canada, a large carrier: C$400, C$700 or C$1,000 by the hours (the CTA; the 2024 amendments haven't taken effect).
  - Mexico's Ley de Aviación Civil past four hours: 25% of the fare (Profeco).
  - America's DOT owes nothing for a delay; its refund is for a flight declined.
- Owed only when the delay is the airline's: EUROCONTROL's airline causes, 41% of the delay not carried from an earlier flight (August 2026), in Europe; BTS's air carrier delay over the delay that isn't a late aircraft, 49.8% (August 2025 to July 2026), in North America, taken for Canada and Mexico, the CTA publishing none (decider `travel.compensation`).
- Paid a month after the arrival, the thirty days the APPR gives an airline to answer, taken for every law.
- Not kept: an EU carrier's flight into the EU from outside it, SLATE keeping no carriers; a small carrier's lower APPR amounts; meals and hotels while waiting, the right to care.

Evidence: `tests/compensation.test.ts` (5). 7 mutations, all killed in the end. Two first survived and needed tests: the airline's fault, which the first test stopped before it could see, and the journey's claim, now tested end to end with every flight canceled.

#### Stage 2f: a ferry between towns (done 2026-09-30)
Researched in `docs/research/world/research-travel-2.json`, `research-travel-3.json` and `research-victoria.json`.
- BC Ferries, Tsawwassen to Swartz Bay, joins Vancouver and Victoria both ways, booked and taken as a train is (`vehicle: 'ferry'` in `content/rail.ts`):
  - 13 sailings each way a weekday, 1h35 across.
  - The adult fare, C$21 with its 5% fuel surcharge (fare index 26-05).
  - 83% of sailings leave within ten minutes, and 1.5% are canceled (fiscal 2026).
  - Its terminals are far out, so the route runs town to town: TransLink's three zones (C$6.70) and bus 620 to Tsawwassen, and BC Transit's 70 (C$3.00) from Swartz Bay. The Canada Line's own minutes weren't read and aren't counted.
- Victoria joined SLATE's towns for it, with its hotels: the Greater Victoria Hotel Development Working Group's 2025 average, C$224, on CoStar's data, taxed at GST, PST and the 3% MRDT, and Ocean Island Inn's dormitory bed.
- Not kept yet:
  - A car on the ferry, until later on 2026-09-30. Before that, a drive to Victoria crossed the strait free, as if by road. Now a car, or a car and driver, pays BC Ferries' C$89 for the car and C$21 for its driver with the 5% surcharge, and the 95 minutes across (`CAR_FERRY`, `crossesByCarFerry`). A longer motorhome's and a motorcycle's fares weren't read, and they pay a car's. Tests: `tests/ferries.test.ts`; 5 mutations, all killed.
  - Horseshoe Bay to Nanaimo, for want of Nanaimo as a town.
  - Dublin to London by SailRail, until later on 2026-09-30, when it was built from `research-sailrail.json`:
    - The Single costs €58 and is refunded for £5 unused. It takes 502 minutes, 08:15 to Euston at 16:37, with four weekday connections on Seat 61's normal timetable, which it warns 2026 runs short of.
    - Check-in closes 40 minutes before the sailing. Avanti's 57.4% within three minutes and 5.6% canceled are the ORR's for 2025–26.
    - From 28 September 2026 every passenger on the Irish Sea ferries shows a passport or a passport card, which the check at departure asks.
    - Tests: `tests/ferries.test.ts`; 3 mutations, all killed.
  - The city ferries (Staten Island, NYC Ferry, Toronto Island), since SLATE's journeys run between towns.

Evidence: `tests/ferries.test.ts` (2). 2 mutations, both killed.

### Stage 3: Vehicles

#### Stage 3a and 3b: a car bought, kept and run (done 2026-09-29)
- **The catalog** (`content/vehiclecatalog.ts`, built by `tools/build-vehicles.mjs`): each market's eight best-selling new cars of 2025 (the US, Canada, Mexico, Britain, Ireland) at the 2026 price on the maker's own site where it could be read, with the fuel, official economy, CO2 and weight; what a price leaves out that the maker states (a US destination charge, Canadian freight, Irish delivery) is added.
- **Buying** where one lives, in eight jurisdictions (`content/vehiclefees.ts`): New York's, Connecticut's and California's sales tax, title and registration (New York by weight, Connecticut's 7.75% over $50,000, Los Angeles's rise on 1 October 2026); Britain's on-the-road price; Ireland's price with VAT and VRT and the motor tax by CO2; Ontario's HST; British Columbia's GST and PST; Mexico City's plates. Outright, or on a loan at the published rate: Experian's US rates by credit tier, the Bank of Canada's, Banxico's, the Central Bank of Ireland's, the Bank of England's £10,000 personal loan rate.
- **Keeping it**: a month's insurance at the place's average paid (the NAIC's for the US states, full cover or liability only; the ABI's; the Central Bank's; FSRA's; ICBC's; Mexico City's only a comparison site's quote, said so), the loan's payment, the registration renewing on its term, and a month's everyday driving at the place's published mileage (the FHWA's, the DfT's, the CSO's, Statistics Canada's; Mexico's none, SLATE's mean), fuel at the week's pump prices by the car's official economy, and AAA's upkeep a mile.
- **Its value** falls on iSeeCars' published points, straight lines between (SLATE's); a used car is the catalog at an age on the same curve; Sell It sells at that value, the loan paid off first, and a loan bigger than the car paid from the bank.
- A trade-in wasn't kept until 2026-09-29, and is now (`tradeInFor` in `systems/vehicles.ts`, researched in `docs/research/world/research-repossession.json`). The old car goes to the dealer at its value, in Britain about 4% less, the part-exchange gap Auto Express published (secondary; America publishes none). Its loan is paid off from that value, and the rest comes off what's due. New York and Connecticut tax only the price less the trade-in's value; California taxes the whole (CDTFA). Evidence: `tests/tradein.test.ts` (2); 4 mutations, all killed.
- Repossession wasn't kept until 2026-09-29 (stage 3e, below). A car counted in net worth, and its loan among the debts, weren't until 2026-09-29 (`systems/finance.ts`).

Evidence: `tests/vehicles.test.ts` (9); 11 mutations, all killed (one found the Irish diesel mild hybrid filed as a petrol hybrid). Screen: Cars, from Home's Cars panel, opened by the guide's chapter A Car Of Your Own.

#### Stage 3f: at the dealer, and leasing (done 2026-09-30)
Researched in `docs/research/world/research-car-buying.json`.
- **Below the sticker:** until 2026-09-30 a new American car sold at its sticker. It now sells 3.4% below, what Kelley Blue Book found buyers paid in August 2026 ($50,089 against an average MSRP of $51,852), and is taxed on that (`US_NEW_BELOW_STICKER`). No average is published for Canada, Mexico, Britain or Ireland, where discounts come as finance rates and vouchers, so the sticker is paid there. The discount is not a choice to haggle. A haggle anyone would always take changes nothing a player decides, so every buyer pays the average.
  - One consequence: a GMC Sierra's $51,295 sticker is over Connecticut's $50,000 line, but the $49,551 paid isn't, so it's taxed at 6.35%.
- **The dealer's documentation fee** (`DEALER_DOC_FEE`):
  - New York's $175, the cap in 15 NYCRR 78.19.
  - California's $85 for a DMV private industry partner (Vehicle Code 4456.5; SB 791's rise was vetoed, and the veto was sustained on 2026-03-02).
  - Connecticut's, which has no cap: $405 new and $131 used, the averages its legislature's research office found in 2016.
  - Ontario's and British Columbia's advertised prices must already include every dealer fee (OMVIC, VSA), and Britain's on-the-road prices include theirs. None is published for Ireland's dealers or Mexico's.
- **A lease, in America** (`systems/leasing.ts`, Cars' Paid: A Lease, 24, 36 or 48 Months): Toyota Financial Services' published September 2026 terms.
  - The fees: a $750 acquisition fee, 10,000 miles a year, $0.15 a mile over, and $350 disposition at the return.
  - The payment: the depreciation over the term plus the rent charge, (capitalized cost + residual) × the money factor.
  - The capitalized cost is the price paid below the sticker. The residual is SLATE's depreciation curve at the term: 75% at three years, where Toyota's offers set 76% to 77%. The money factor, 0.00299, isn't published. It's worked back from the offers' own figures, and all three regions' give it.
  - New York taxes every payment at signing (Tax Law 1111(i)). Connecticut and California tax each payment as it's made.
  - A leased car is the lessor's: it isn't in a net worth, and it can't be sold or traded in.
  - At the end of the term there's a month to buy it out, at the residual plus the state's sales tax. If it isn't bought out, it goes back for the disposition fee and the miles over.
  - A longer lease isn't cheaper a month: the fourth year loses more value than a longer term spreads, so 48 months cost more a month than 36.
- Not kept:
  - Ending a lease early, and buying one out before its end, until later on 2026-09-30 (`earlyEnd`, `leaseBalance` in `systems/leasing.ts`, researched in `research-sweep3.json`). Toyota publishes no formula, only that the charge "may be substantial", but the Federal Reserve's "Keys to Vehicle Leasing" gives the method:
    - The charge for ending early is the remaining balance less the car's realized value, its wholesale price. SLATE takes the trade-in value as the wholesale.
    - The balance is kept by the constant yield method, the most common. SLATE solves the lease's own rate from its capitalized cost, payments and residual. Right after each payment the balance stands where the Fed's worked example keeps it: at signing, the capitalized cost less the first payment.
    - Bought out early, the price is the balance, the purchase option fee and the tax.
    - No lessor's own early termination fee was found, so none is added; the disposition fee is charged, as at any return.
    - Miles over are counted against the whole term's allowance, as no proration was read.
    - A lease signed before then keeps no capitalized cost and ends at its term.
    - Evidence: `tests/leasing.test.ts`, `tests/leasesabroad.test.ts`. 13 mutations, all killed in the end. Three survivors were redundant guards that were removed; three needed tests.
  - The lessor taking back a car whose payments are missed, until later on 2026-09-30 (`takeLeasedCar`). Now, three missed running where the law lets a car be seized, the lessor takes its car back. It goes on the record as a repossession, and what's missed stays owed. The early-termination charge, with no published formula, isn't charged. 3 mutations, all killed.
  - Leases outside America, until later on 2026-09-30. Now (`CA_LEASE` and `PCP` in `content/vehiclefees.ts`, `tests/leasesabroad.test.ts`, 14 mutations, all killed in the end):
    - **Canada:** Honda Canada's lease at 2.99% APR. Its residual is worked back from the published $797.47 on $51,993 over 24 months, 68.2%, and scaled along SLATE's curve for 36 and 48 months. It allows 20,000 km a year at 15 cents a kilometer over, and each payment and a buyout are taxed as the province taxes a sale. It doesn't end early, as Honda publishes no charge for that.
    - **Britain, a PCP:** Nissan's Qashqai offer reproduced exactly: 30% down, 36 payments of £219 at 0%, and £13,550 to own it. Any other car pays the FCA's 5% average APR. It allows 6,000 miles a year at 8p a mile over, and can go back early under the Consumer Credit Act's half rule once half the total is paid.
    - **Ireland, a PCP:** Toyota's €63.49 documentation and purchase fees, at the Central Bank's car loan rate, with Britain's deposit, future value and mileage standing in for Ireland's, which aren't published. The half rule holds.
    - **Not sold:** Britain's PCH, whose only published offer is on a Corolla, which SLATE doesn't sell there; and Mexico's arrendamiento puro, which publishes no residual or allowance.
  - A pre-purchase inspection and a history report (Lemon Squad's $219.99, the AA's £99 to £110, CARFAX Canada's CAD 58.95). They're researched, but SLATE's used cars have no hidden condition for them to find, so buying one would change nothing.

Evidence: `tests/leasing.test.ts` (5), and `tests/vehicles.test.ts` updated for the discount and the fees. 23 mutations, all killed in the end. Four first survived:
- Two were redundant guards, now removed: a trade-in filter on a lease quote that never has a trade-in, and cancelling a return the lease's own guard already passes.
- Two needed tests: the miles over, and Connecticut's used-car fee.

#### Stage 3g: motorcycles and scooters (done 2026-09-30)
Researched in `docs/research/world/research-vehicle-kinds.json`, `research-vehicle-insurance.json` and `research-kind-effects.json`.
- **The catalog** (`content/bikecatalog.ts`): 36 models across the five markets, from a 50cc scooter to a touring motorcycle, at the makers' and dealers' published 2026 prices. Cars: Buy One's Kind is Scooter, Motorcycle or Car.
- Electric kick scooters aren't sold. Britain bars a private one from the road, and elsewhere their rules differ from a motorcycle's in ways SLATE doesn't keep.
- **What one costs where one lives** (`BIKE_FEES`, `bikeLines` in `systems/vehicles.ts`):
  - New York: $17.50 a year (VTL 410(5)) and the $50 title.
  - Connecticut: $63 a year, the plate, title, Clean Air Act and parks fees.
  - California: the car's fees and value fee, and the $2 motorcycle safety fee.
  - Britain: vehicle tax by engine size, £27 to £125.
  - Ireland: motor tax by engine size, €49 to €88.
  - Ontario: HST, the permit and the plate.
  - British Columbia: GST and PST, and $33 a year.
  - Mexico City: the alta (MXN 709), the refrendo (MXN 472) and the tenencia, 3% of the value before IVA. The 2026 decree subsidizes it whole to MXN 250,000, so only the Harley-Davidson pays it.
  - America's sales tax and dealer fee apply as a car's; the discount below the sticker is a car's only (KBB's figure is for new cars).
- **Insurance** (`BIKE_INSURANCE`), each figure saying what it is:
  - ValuePenguin's 2026 quotes for one rider on a Honda Rebel 500 in each US state.
  - Confused.com's median premiums in Britain: a motorcycle's, a scooter's, and a moped's to 50cc.
  - ICBC's Basic tariff by engine class in British Columbia.
  - One New York City scooter quote, liability or full.
  - Ireland, Ontario and Mexico City publish only ranges, so their middles are taken, as SLATE's estimates.
  - Liability-only cover is offered only where it's published.
- **The motorcycle license** (`content/motorcyclepaths.ts`, a second track in `systems/licensing.ts`): each place's own path, run by the car's machinery with its own record. A car license doesn't ride a motorcycle, and the class is on the same card: renewing the car license carries it.
  - New York: the permit test, then the road test or the MSF Basic RiderCourse ($321 at Mohawk Valley Community College; the DMV sets no price).
  - Connecticut: the knowledge test, the permit, the novice course and the endorsement.
  - California at 21 and over: the application, the knowledge test, then the skills test or a CMSP course ($425 at Motorcycle Rider Education Corp), whose DL 389 waives it.
  - Britain, direct access to A at twenty-four: CBT, theory, and modules 1 and 2. A British car licence stands in for the provisional licence.
  - Ireland: theory, the permit, IBT and the test.
  - Ontario: M1, M2 and M, with their waits.
  - British Columbia: Class 6 added to a Class 5 or 7. A new rider without one takes Class 8 (ICBC's MV2023, revision 03/2026). That's the knowledge test; the skills test after 30 days, which lifts the supervisor and the 60 km/h limit; the Class 8 road test after twelve months ($35, and $75 for the novice license); and the Class 6 road test after 24 months as a novice.
  - Mexico City: the CONOCER certificate and the A1 license.
- **Riding** (`crashChance` in `systems/driving.ts`): a month's riding and a journey's are injury-drawn at NHTSA's 391 injured per 100 million miles against a car occupant's 86 (Traffic Safety Facts, 2024 data), 4.5 times. Fuel is the maker's economy where published (Honda's, Kawasaki's, Royal Enfield's, Vespa's), and the mean of those for a model whose maker publishes none. A motorcycle whose owner holds no motorcycle class isn't ridden. Britain's MOT is kept for a motorcycle at its £29.65; elsewhere a motorcycle's test isn't researched and none is kept.
- **A moped on a car license** (`MOPED_ON_CAR` in `systems/documents.ts`): in British Columbia a full-privilege Class 5 or 7 of its own rides a scooter of 50cc or under, such as the Honda Giorno; ICBC's 70 km/h and 95 kg limits aren't kept, as SLATE holds neither figure. Nowhere else, each for a reason: New York's Class D covers only a moped held to 30 mph, a speed SLATE doesn't hold. California's and Ontario's car licenses cover none. Britain's and Ireland's cover one only if issued before February 2001 and October 2006, and no life beginning at twenty-four holds one.
- **Britain's and Ireland's progressive routes** to category A (A2 from 19 and 18, then A after two years) are for riders under twenty-four. A life begins at twenty-four, where direct access is open and shorter, so the routes are never the one taken. That is the law applied, not a gap.
- Not kept:
  - A motorcycle's own depreciation, which no source publishes; the car curve is used.
  - A rider's deaths above the life table's, until later on 2026-09-30 (`riderDeath`, `research-vehicles5.json`). Now a month's riding adds the motorcyclist's death rate above a car occupant's, a kilometer. America's NHTSA, 2024: 28.00 per 100 million vehicle miles against 1.05. Britain's DfT: 66.3 per billion passenger kilometers against 1.0. Canada and Mexico take America's, and Ireland Britain's. Decider `driving.rider_death`; 5 mutations, all killed.

The courses, Class 8 and the moped were built later on 2026-09-30. Evidence: `tests/motorcycles.test.ts` (21, four for these). Of 15 mutations, 11 were killed and 4 survived. Three of the survivors were guards a later check already settled: a learner's car license, which the car check refuses anyway; holding a motorcycle license as well; and the road test's named need, which is the step before it anyway. Those three guards were removed. The fourth survivor, the moped's own-province rule, got a test. Before them, `tests/motorcycles.test.ts` (17). 23 mutations, all killed in the end. Six first survived, and each needed a test:
- The mean an unrated bike burns, which the first test read back from the code.
- A bike's trade-in lowering New York's tax.
- The motorcycle record surviving its scheduled test.
- A motorcycle permit leaving the car license standing.
- Britain's MOT for a motorcycle.
- No London permit for a motorcycle.

#### Stage 3h: motorhomes, campervans and cargo vans (done 2026-09-30)
Researched in `docs/research/world/research-vehicle-kinds.json`, `research-vehicle-insurance.json` and `research-kind-effects.json`.
- **The catalog** (`content/rvcatalog.ts`): 21 models at the makers' and dealers' published prices, on Cars' Kind.
  - Class C motorhomes: Thor, Winnebago, Elddis, Swift.
  - Class B campervans: Winnebago and Auto-Trail.
  - Cargo vans: Ram, Ford, Mercedes-Benz, Nissan, Toyota.
  - Britain's vans are at the makers' own price with VAT, and Ireland's with VAT and VRT.
  - Not sold: Mexico's RVs weren't found, and a Canadian Greyhawk read only from a search summary, with no source, was left out.
- **What each costs and insures:**
  - A van sells below the American sticker, as KBB's light vehicles do; an RV doesn't.
  - Ireland taxes a van as a goods vehicle (€333) and a motorhome as a motor caravan (€102, read from the table, not confirmed).
  - Britain's rates, from later on 2026-09-30 (DVLA's V149 for 1 April 2026, `research-sweep5.json`); until then a car's standard rate was charged:
    - A van pays the light goods rate, £360, or £140 if registered between March 2003 and 2010 to Euro 4 or 5.
    - A motorhome or campervan pays the private light goods rate, £375 over 1,549cc. Each one sold is on a 2.2-liter Fiat or Peugeot chassis, as commonly published; that wasn't read in this research.
  - Insurance: Progressive's countrywide motorhome average ($1,052) in the American states and Quotezone's index average (£598) in Britain, full cover only. Elsewhere, and for a van, a car's, and the screen says so.
  - Everything SLATE sells is driven on a car license: New York's class D to 26,000 lb, Britain's B to 3,500 kg, Ontario's G to 11,000 kg. Everything is driven at a car's risk.
- **Economy**, gasoline or diesel as the base engine burns. No Class C motorhome or cargo van publishes a figure where one was read, so the nearest published is used, and said so:
  - A motorhome: U-Haul's 10 mpg for its 26-foot truck.
  - A campervan: Volkswagen's 9.0 L/100 km for its California.
  - A van: AAA's cost a mile, as an unrated car.
- **A campground** (`CAMPGROUNDS`, `campgroundPrice` in `systems/stays.ts`): a journey made in one's own motorhome or campervan can stay at the region's park instead of a hotel, with no hotel parking. It's refused for a trip in a car.
  - New York State Parks' $17 site and $7 electric, and $5 more for someone from out of state.
  - California's Lake Perris, $45.
  - The middle of Ontario Parks' four fee levels.
  - British Columbia's Rathtrevor Beach, $51 at peak and $20 more for a non-resident.
  - Ireland's Carrowkeel, €31 with one adult and electricity.
  - About MXN 300 near Mexico City, from travelers' reports, not confirmed.
  - None in Britain, whose clubs publish no site's price, or in Connecticut, which wasn't read.
- **A night on the street** (`STREET_NIGHTS` and `streetRefusal`, from later on 2026-09-30, `research-vehicles5.json`): a journey in one's own motorhome can sleep on the street, free, where the city lets it stand overnight.
  - New York City has no rule against an RV overnight (NYC311). A vehicle may stay in one spot up to seven days, so up to seven nights; SLATE doesn't move the motorhome during a stay. The 24-hour "mobile home" limit quoted from 34 RCNY 4-08 wasn't read, as its page refused.
  - Refused, with the reason given where it's asked:
    - Toronto: a three-hour limit on any road (Municipal Code 950-400D(5)).
    - Vancouver: a large vehicle is kept off residential streets from 10 p.m. to 6 a.m., read from search excerpts.
    - Los Angeles: the oversize ban from 2 to 6 a.m. where posted, and LAMC 85.02's ban on living in a vehicle, whose current status couldn't be read.
    - London: each borough sets its own rules, and none was read.
  - Everywhere else it isn't researched, and it says so.
- **A move in one's own van** (`ownVanFor` in `systems/furniture.ts`): a van where the move starts, a road to the new home and a license to drive it carry the bed and sofa for its fuel and upkeep. Until then the movers were paid whatever one owned.
- **A move in a rented truck** (`truckFor` in `systems/furniture.ts`, `home.move_by`, from later on 2026-09-30): for a player who chooses it on the Homes screen. U-Haul's 15-foot truck in town costs $29.95 a day and $1.19 a mile (U-Haul's December 2025 comparison). It is driven there and back, since an in-town truck goes back where it was hired, and burns 10 mpg at the state's fuel price. That holds within America, within the movers' 100-mile local band, and on a license they may drive on. Anything else gets the movers: a one-way rental is priced only after a search, which wasn't read, and Britain's and Canada's van hire wasn't found published. A van of one's own still carries the pieces first. Before this, the movers were always paid.
- **A caravan, and towing it** (`content/caravans.ts`, `systems/caravans.ts`, from later on 2026-09-30, researched in `research-vehicles5.json` and `research-towing2.json`; until then towing wasn't kept):
  - Sold where a price and a weight were both read:
    - America: Jayco's Jay Flight SLX 178DBS, $17,318 before sales tax, GVWR 4,800 lb.
    - Britain: Bailey's Discovery D4-2, £21,499 with VAT, MTPLM 998 kg.
  - Not sold elsewhere:
    - Canada's only price read, CA$31,956 at a dealer, came without its model's weight.
    - No Irish price in euros was found.
    - Mexico's prices were only used-or-new listings.
  - Kept on the drive of a house of one's own. Storing one elsewhere wasn't researched, so it can't be bought without one, and a move to a home without one sells it at its worth. Its worth follows the car curve.
  - Registered as each place asks:
    - New York: $5.39 a 500 lb of GVWR, so $53.90.
    - Connecticut: a camp trailer's $22.50 (the top of its range), the $5 plate, the $24 Passport to the Parks fee, and the $25 title at purchase.
    - California: $76, the CHP's $34, and 0.65% of its worth.
    - Britain: nothing; no registration or road tax is asked.
  - Insured by the month at Progressive's 2024 average travel-trailer policy: New York's $351.44 (also used for Connecticut, which Progressive doesn't publish) and California's $405.14. Britain's is InsureMy's £162.45.
  - Towed only behind a car with a towbar fitted and a maker's braked rating at least the caravan's most (`TOW_RATINGS`). A towbar costs Towbar Express's £760 in Britain, and in America the middle of U-Haul's $100 to $600 (2023). Of the ratings:
    - Confirmed on the maker's page: the RAV4's 1,750 lb, the CR-V's 1,500 lb and the XC40's 1,600 kg. The rest are from dealers' and the press's pages.
    - The Camry and anything unlisted, electric cars among them, tow nothing.
    - So in America only a pickup or a van tows the Jay Flight. In Britain every car SLATE sells tows the Bailey.
    - Britain's clubs advise 85% of the car's curb weight. That's advice, not law, and too few curb weights are held to apply it.
  - On a journey (`tow` on `travel.book`):
    - Fuel rises by fueleconomy.gov's 1% a 100 lb, at the caravan's most. That's 48% for the Jay Flight; Oak Ridge measured 30% to 50% for a 3,500 lb trailer.
    - The drive is slower where the law sets a lower limit for towing: Britain's 60 mph against 70, and California's 55 against its freeways' 65. The ratio is applied to the whole drive, since SLATE keeps no split of road types.
    - Its nights can be at the region's campground, as a motorhome's are.
    - It stays in its own country; no border crossing with one was read.
- Not kept:
  - A park's shoulder and winter rates.

Evidence for the caravan: `tests/caravans.test.ts` (7). Of 22 mutations, 15 were killed. Two survivors were redundant guards that were removed: a leg's drive-only check, since `planDrive` returns only drive legs, and the same-town early return, which the loop already settles. Five needed tests: the bank checks, the hitch's place, the second renewal, a caravan left in another town, and the towed way home.

Evidence: `tests/motorhomes.test.ts` (13: two for the street, whose 7 mutations were all killed, and two for the truck). Of the truck's 10 mutations, 9 were killed. The survivor was the road check, which `byRoad` already settles for any two American towns, so it was removed; the from-country check got a test. 16 mutations before it, all killed in the end. Three first survived, and each needed a test:
- That a car doesn't carry the furniture.
- That a van with nothing to carry isn't driven for it.
- That a campground in New York City charges no hotel parking.

#### Stage 3i: bicycles, e-bikes and ATVs (done 2026-09-30)
Researched in `docs/research/world/research-vehicle-kinds.json`, `research-vehicle-insurance.json` and `research-kind-effects.json`.
- **The catalog** (`content/ridecatalog.ts`): 26 models at the retailers' and makers' published prices, on Cars' Kind.
  - Trek, MEC, Benotto, Carrera and Decathlon bicycles.
  - Legal e-bikes where they're sold, 250 W to 500 W: no license, registration or insurance.
  - Honda, Can-Am, Polaris and Italika ATVs. Britain's are at the dealers' price with VAT added. Ireland's Honda is at Honda Ireland's price, which doesn't say whether VAT is in it.
  - Not sold: Mexico City's e-bikes, since its hologram and plate rules begin on 20 November 2026 and the only e-bike read there is over their line.
- **What each costs** (`outingLines` in `systems/vehicles.ts`, `ATV_FEES`, `ATV_INSURANCE` in `content/rides.ts`):
  - A sale's tax, and no dealer's documentation fee. British Columbia charges its PST on an ATV but not on a bicycle or an e-bike (PST Bulletin 110).
  - An ATV's registration: New York's $12.50 a year and its plate, Connecticut's $30 with its plate and Clean Air Act fee, and California's $54 green sticker every two years, each renewing. Ontario's $38 and British Columbia's $48 are paid once.
  - An ATV's insurance: ValuePenguin's $88 liability or $327 full in the American states, from one Wisconsin rider's average. Elsewhere none was found and none is charged.
  - A bicycle never registers and insures nothing.
- **Where it goes:** neither kind is driven every day or taken between towns. Each moves with the household to a new home anywhere.
- **What it's for** (`systems/outings.ts`, Look After Yourself):
  - **Go For A Ride**, on one's own bicycle or e-bike where one is, in fine weather.
    - The Compendium's 7.0 METs for a bicycle (01014) and 6.0 for an e-bike with light assistance (01084).
    - It builds fitness as a run does, SLATE's estimate for the same hour outdoors.
    - A crash's injury is drawn at DfT's 4,367 reported cyclist casualties per billion miles over an hour at 10 mph. An e-bike's risk is the Oslo study's 5.14 against 7.26.
  - **Ride The ATV**, two hours on acreage one owns in the state or province where one is (a city lot isn't ridden), with one's ATV kept there.
    - The Compendium's 4.0 METs (15470), and an hour outside's mood.
    - No injury is drawn and no fuel is charged. The CPSC counts about 100,400 emergency-room injuries in 2023, but publishes no rate a rider or an hour, and no maker publishes an ATV's fuel.
- Not kept:
  - A bicycle stolen, until later on 2026-09-30. Now in Britain, at the Crime Survey for England and Wales's 17.6 thefts a year per 1,000 owning households, found again at Toronto Police's 1%, the only share published. No other place publishes a rate. 3 mutations, all killed.
  - An ATV ridden on the road where a place allows it.
  - The trailer that takes an ATV to its land.
  - Cycling to work, as SLATE has no commute.

Evidence: `tests/outings.test.ts` (8). 22 mutations, all killed in the end. Three first survived:
- The ride's crash draw, one chance in about 23,000 an hour, too rare for a test to see. It's now `rideOut`, taking its chance, and is tested at certainty.
- The effort of a ride and of the trail, now measured against the body's sedentary 1.4.
- The trail's mood, now tested against an hour outside and an hour unwinding.

#### Stage 3j: a vehicle stolen (done 2026-09-30)
Researched in `docs/research/world/research-custom-effects.json` (`systems/theft.ts`, decider `vehicle.theft`).
- Each month a road vehicle may be stolen at the place's published thefts over its vehicles:
  - New York City's 620 in 100,000 (NYPD 2025 over the DMV's count).
  - The rest of New York State's 116.
  - Los Angeles's 502 and the rest of California's 379 (NICB and the DMV).
  - Ontario's 220 (Équité over Statistics Canada's count).
  - Connecticut's, British Columbia's, London's, Ireland's and Mexico City's counts come without a count of vehicles, so none is drawn there.
- Recovered at Ontario's 51%, or Canada's 59% for an American car, the US publishing no share (SLATE's estimate). It comes back a month on, as no time to recovery is published.
- Not recovered: full cover pays its value, the loan first, as an insurer pays the lender. Liability cover pays nothing. A loan the payout doesn't clear runs on month by month, and the car stays in net worth at nothing and its loan among the debts.
- While it's gone, it isn't insured, driven, inspected, renewed, sold or driven on a journey.
- This is the first thing that makes full cover and liability cover differ in what they pay, rather than only in what they cost.
- Not kept: bicycles, e-bikes and ATVs stolen, which aren't in these counts; a tracker's or an immobilizer's effect, whose only published measure (the EU immobilizer's 40%) is already in today's rates.

Evidence: `tests/theft.test.ts` (5). 11 mutations, all killed in the end. Three first survived and needed tests: a loan bigger than the car running on under full cover, a stolen car leaving the books once its loan is paid, and a stolen car not being driven.

#### Stage 3k: winter tires (done 2026-09-30)
Researched in `docs/research/world/research-customization.json` and `research-custom-effects.json` (`systems/tires.ts`, `vehicle.winter_tires`).
- A set of four for a car, van or campervan kept in America or Canada: the middle of Discount Tire's $200 to $400 a medium winter tire, $1,200. Canada's own price wasn't read, so it's that in dollars converted, SLATE's estimate.
- From 15 December to 15 March, Quebec's mandated season, a car on them is injured in a crash 5% less often: Quebec's transport ministry measured 5% fewer victims once winter tires were required. Most of Quebec's cars had them already, so 5% is the published floor for one car.
- In Ontario, the insurer's discount the province requires be offered, 3.5% (the middle of brokers' 2% to 5%; no regulator sets it), and Formula Tire's C$50 to swap them in November and April.
- Worn out after 40,000 miles of winter driving, Michelin's X-Ice Snow warranty.
- British Columbia's signed-route rule accepts an M+S all-season, which SLATE's cars have, so it asks nothing more.

Evidence: `tests/tires.test.ts` (4) and `tests/tires-drive.test.ts` (1). 9 mutations, all killed in the end. Three first survived and needed tests: the season's kilometers, the factor in the crash chance, and the car's month handing the factor to the road's draw, watched through a mocked `drive` because the draw is too rare to see.

#### Stage 3l: electric cars and charging at home (done 2026-09-30)

Researched in `docs/research/world/research-ev-tint-security.json` and `research-electricity-charging.json`.

- **The cars** (`content/evcatalog.ts`): no best seller was electric, so SLATE now stocks Tesla's Model Y Standard in every market. It adds Chevrolet's Equinox EV in America and Canada, and Ford's Puma Gen-E in Britain. Consumption is kept in kWh a 100 km, the EPA's, NRCan's or WLTP's. Mexico's Model Y takes the EPA figure, since none was read there.
- **What's given toward one at the sale, new only:**
  - New York's Drive Clean Rebate: $2,000, or $500 over a $42,000 MSRP.
  - Connecticut's CHEAPR: $1,000.
  - California's MyFirstEV: $3,500 to a first-time buyer, from Tesla, Hyundai or Lucid.
  - Canada's EVAP: $5,000 in 2026, falling to $2,000 by 2030, to a $50,000 price.
  - Britain's Electric Car Grant: £3,750 on the Puma.
  - Ireland's SEAI grant, €3,500, and VRT relief of up to €5,000, to the end of 2026.
  - The federal 30D credit ended in September 2025.
- **Charging** (`systems/charging.ts`):
  - Each kilometer is bought as kWh at the public fast chargers' price.
  - With a charger at home, three-quarters of it is bought at the home's overnight or residential price. That is the IEA's share of charging done privately.
  - Home prices: Con Edison 33.83¢, Eversource 23.61¢, LADWP 23.45¢, Toronto's Ultra-Low Overnight 6.1¢ all in, BC Hydro's overnight 7.21¢, CFE's top block with IVA MXN 4.67, Intelligent Octopus Go 8p, and Electric Ireland's night rate 19.62c.
  - On a journey, all of it is bought at public chargers.
- **A home charger** (`home.charger`), on a house one owns:
  - America: Tesla's Wall Connector and Qmerit's average installation, less LADWP's $1,000 rebate in Los Angeles.
  - Canada: ChargePoint's Home Flex and Toronto's labor, less BC's rebate of half the cost, to $350.
  - Britain: Ohme's Home Pro, installed.
  - Ireland: a smart charger fitted, less SEAI's €300.
  - Mexico City: a Wall Connector and a basic installation package.
- **Mexico City's green plates:** an electric car is exempt from the verificación, so none is charged.
- **The utilities' rewards** (`chargingRewards` in `systems/charging.ts`, later on 2026-09-30), paid in the car's month:
  - Connecticut, Eversource's Managed Charging: $100 on enrolling and $10 a month of its $120 a year. A household at or under 300% of the poverty line takes the $1,500 charger rebate instead.
  - New York, Con Edison's SmartCharge: 10 cents a kWh charged at home overnight, $35 a month from June to September, and $25 at three months.
- **Not kept:** charging from an ordinary socket; Connecticut's Rebate+ on the car, whose income test was the charger's; range on a long journey.

Evidence: `tests/evs.test.ts` (6). 15 mutations, 14 killed after three tests were added. The survivor is equivalent: BC's half-the-cost rule never binds under its $350 cap at these prices.

#### Stage 3m: window tint (done 2026-09-30)

Researched in `research-ev-tint-security.json`, `research-electricity-charging.json` and `research-tint-effects.json`.

- **Sold** (`systems/tint.ts`, `vehicle.tint`): at a named shop's price where the car is registered. It is sold all round, or on the back alone where that's what the law allows and a shop prices it.
- **The law decides whether it's legal:**
  - Illegal: New York's 70% rule, even on rear side windows; California's front sides; Ontario's; Mexico City's 20% limit; Britain's and Ireland's front sides, all round.
  - Legal: Connecticut's 35%; the back alone in British Columbia, Britain and Ireland.
- **Illegal tint is caught:**
  - New York's yearly inspection and Ireland's NCT fail it. The tint comes off and the retest is paid.
  - On the road, a month driven draws a ticket: the place's fine, and the tint taken off where a removal was priced.
  - No share of cars tinted darker than the law is published anywhere. So the ticket's rate is New York's tint tickets per registered passenger car, 119,808 over 9,277,782: the lowest the figures allow.
- **Every tint keeps the cabin cooler.** NREL measured aftermarket film at 1.8 °C cooler. Scaled by its solar glass study's 26% off air conditioning, and air conditioning's 6.1% of fuel, that is about 0.4% off the fuel or charge. This is SLATE's reading of the three.
- **Not drawn:** theft or crash effects, which no study measured. Older drivers' poorer contrast behind 35% film, which was measured but never as crashes.

Evidence: `tests/tint.test.ts` (5) and `tests/tint-road.test.ts` (1). 9 mutations, all killed once three tests were added.

#### Stage 3n: modifications and the insurer (done 2026-09-30)

Researched in `research-custom-effects.json` and `research-customization.json`.

- **Britain's loadings** (`systems/mods.ts`): a declared modification raises the premium by what a July 2025 quote study across ten British cities measured, each alone. Tinted windows add 12.1% and a non-standard respray 4.52%. Two together multiply, which is SLATE's reading. Owners declare what they fit, as the Consumer Insurance Act asks.
- **A respray** (`vehicle.respray`), in Britain: a full car in a solid color, £3,000, the middle of a body shop guide's £2,000 to £4,000.
- **Sold since, later on 2026-09-30** (`vehicle.modify`, researched in `research-mods-smog.json`), each at a named British shop's price and its loading:
  - an engine remap, VUDU Performance's £449, 15.93%;
  - lowering springs fitted, QT Performance's £779.15, 15.93%;
  - a Cobra Sport exhaust fitted, the middle of QT Performance's £1,038.46 to £1,426.34, 15.93%;
  - four alloy wheels, LK Performance's £332 a set, fitted free, 0.79%.
  The tuners' prices are for one model each, taken for any car. A leased car isn't modified.
- **California's smog check** (`systems/inspections.ts`):
  - Every two years from the eighth model year, at BAR's August 2026 average of $69.16 and the $8.25 certificate.
  - 7.60% of cars fail it, and the repair is CarMD's, as in New York.
  - An electric car is exempt.
  - Below that age, the smog abatement fee comes with the registration: $20 a year to the sixth model year and $25 in the seventh and eighth.
- **Not sold:**
  - A body kit, since only its fitting and paint were priced.
  - An American ECU tune. No tune price was read for a car SLATE sells, so the smog check's "Modified Software" failure has no tune to find.
  - New York's SLEEP Act fine for a loud exhaust. No count of its tickets is published: the city's noise cameras (1,691 tickets in 2025) enforce the city's own code.
- Evidence since: `tests/mods.test.ts` and `tests/inspections.test.ts`. 6 mutations, all killed once three tests were added.

Evidence: `tests/mods.test.ts` (2). 4 mutations, all killed.

#### Stage 3c: driving (done 2026-09-29)
- **A drive as a journey** (`planDrive`, Travel's By): one's own car, where it is, with a license that lets one drive there; the road the straight line stretched by the US network's circuity (1.20, Ballou et al. 2002, read everywhere), at England's motorway and major A-road average (56.6 mph, DfT 2025, read everywhere), with the Highway Code's break every two hours; its fuel and upkeep, and the New York to Washington corridor's tolls. The car is where it's driven to. Towns joined by road: one country, North America's three, the island of Ireland.
- **What the road brings**, every day's driving and a journey's: a crash's injury at NHTSA's 74 people injured a hundred million vehicle miles, scaled by the driver's age as AAA's injury crash involvement runs, through the injury system; a speeding ticket at New York's or England's published tickets a driver a year, spread over the place's miles, with the place's own fine and points; a license suspended or revoked where the points reach its law's line (New York's 11 in 24 months, Connecticut's, California's 4 in 12, Britain's 12 in three years and its novices' 6 in two, Ireland's 12 and its novices' 7, Ontario's 15). A car whose owner may not drive sits idle. Road deaths are in the all-cause life table, so none is drawn here.
- SLATE's estimates, and said so: the band of a speeding ticket, the injury mix of a crash, a ticket's frequency where a place publishes none.

Evidence: `tests/driving.test.ts` (7); 11 mutations, all killed.

#### Stage 3d: parking (done 2026-09-29)
- A car kept on the street at home pays a resident's permit a year, on the quote and then with the registration: London's Westminster's by the car's CO2 (£40 to £353.10, from 2 March 2026), SLATE's borough for the city; Dublin City's €50. A home owned with a garage needs none. New York publishes no garage average and parks on the street for nothing; elsewhere no permit is kept, said so. Evidence: `tests/vehicles.test.ts` (parking); 3 mutations, all killed.

#### Stage 3e: a car loan in default (done 2026-09-29)
- Three payments missed running (SLATE's, a contract and not a law setting it), and where the loan is secured and the place's law lets the lender seize, the car is taken (`systems/repossession.ts`, `content/repossession.ts`, researched in `docs/research/world/research-repossession.json`). It sits, uninsured and undriven, while its notice runs.
- Redeem It pays what the law says redeems it, with the tow and storage so far. Unredeemed, it's sold at its value less those; the loan is paid from the sale, a surplus comes back, and the shortfall is owed as the law has it.
  - New York (UCC 9-609 to 9-623): redeemed by the whole balance, SLATE's ten days' notice for the statute's "reasonable," the shortfall owed.
  - Connecticut (36a-785): redeemed within 15 days by what's missed, the shortfall owed only past the car's value.
  - California (Civ. Code 2983.2 and 2983.3): reinstated by what's missed within 15 days, the shortfall owed.
  - Ontario (PPSA): 15 days, redeemed by the balance, the shortfall owed.
  - British Columbia (PPSA): not seized once two-thirds is paid; 20 days; reinstated by what's missed; seizing ends the debt, "seize or sue."
- Britain's and Ireland's car loans are priced at personal-loan rates, which are unsecured, so no car is taken there and the arrears run. Mexico's are enforced before a notary or a court, with no day counts found: none kept. The tow's $300 and $47.50 a day in storage are the middles of consumer sites' ranges, secondary.
- The record (from 2026-09-29): a second payment missed running means the first is thirty days late, and it's reported, each one after it too, at the 70 points SLATE's mortgage takes. The car taken is reported, and myFICO publishes no figure for it, so SLATE takes the consumer sites' "about 100 points" (secondary), the same as its charge-off (`LOAN_LATE_ON_RECORD` and `REPOSSESSED_ON_RECORD` in `content/repossession.ts`). Until then neither touched the record, which was open here.
- The mark falling off (from 2026-09-30, researched in `docs/research/world/research-credit-damage-movers.json`): every mark SLATE puts on a record (a late payment, a charge-off, an eviction, a medical debt, a foreclosure, a repossession) is kept with its country, and leaves after America's seven years (FCRA), Britain's six (Experian UK's default and judgment) or Ireland's five (the Central Credit Register's, taken from the mark), checked at each month's end whether a card reports or not. What its going gives back is the one measured figure, the CFPB's 25 points on average when the last medical collection came off (2023), taken for every kind (`markRecord`, `marksFallOff`, `MARK_GONE_GIVES` in `systems/credit.ts`). Its weight fading before then is carried by the months paid on time, as myFICO describes. Until then no mark left. Elsewhere no period was researched and a mark stays.
- Canada's period (from 2026-10-01): a mark reported in Canada leaves the record after six years, how long Equifax Canada and TransUnion keep a late payment or a collection (`MARK_YEARS` in `systems/credit.ts`, `docs/research/world/research-aviation-boats-credit-mot.json`). Until then a Canadian mark stayed. A trade-in was open, and is built (above).
- Not kept, by design: a mark's fading measured by kind. FICO's one published study (2011) gives how long a score takes to recover from a mortgage 30 or 90 days late, a foreclosure or a bankruptcy, at three starting scores, holding everything else still; SLATE's record already climbs back with each month paid on time, so a second recovery drawn from the study would count the same months twice.
- Mexico's period (from 2026-10-01, researched in `docs/research/world/research-open-final.json`): a mark goes by the debt's size in UDIs, 72 months under article 23 of the law on credit bureaus, and Banxico's Circular 27/2008 for the smaller ones: a year to 25 UDIs, two to 500, four to 1,000. A UDI is the DOF's 8.834094 pesos of 30 September 2026. A charged-off card's or account's debt is known and sized; a mark whose debt SLATE doesn't know stays the law's six years. Until then a Mexican mark stayed for good.

Evidence: `tests/repossession.test.ts` (7); 8 mutations, all killed. One first survived, the count of payments missed running, which no test reached until one paid between two misses reset it. The record's mark: 5 more, all killed. Its falling off: `tests/marks.test.ts` (5), 6 mutations, all killed.

### Stage 4: Land

#### Stage 4a: a parcel bought, held, split, combined and sold (done 2026-09-29)
- **What's for sale** where one lives (`content/land.ts`, researched in `docs/research/world/research-land.json`): New York City lots in Brooklyn, Queens and Staten Island, New Haven's and Los Angeles's, at the FHFA's 2022 value an acre under single-family homes by county (the FHFA has no Manhattan or Bronx figure), each the zoning's smallest buildable lot (R2's 2,850 sq ft, RS-2's 4,000 and a quarter acre, R1's 5,000); London plots with planning permission in Hackney, Croydon and Havering at the government's April 2019 values, its latest edition, on SLATE's 200 m²; farmland at USDA's 1 January 2026 value (New York, Connecticut, California), Knight Frank's English index (Q2 2026, read secondhand), SCSI and Teagasc's Leinster (2025, read secondhand), FCC's Central East Ontario and South Coast (2025). A lot's value moves with the town's home market from its figure's year, the FHFA's land values being read from home prices; farmland takes its source's latest yearly change for the year until the next edition, then moves with the town's home market (SLATE's estimate, no long-run farmland figure being published). Until 2026-09-29 a value took one year's change for ever and a lot none: a played London life found ten acres of English farmland at £9,300 in 2077, Knight Frank's 4.1% fall having run fifty years. Mexico City's land values are published only as scanned images, so none is sold there, said so.
- **The taxes of a transfer**, each on the side that customarily pays it: New York State's 0.4% and the city's 1.425% or 2.625% on the whole; Connecticut's conveyance tax and New Haven's; Los Angeles County's and the City's, Measure ULA's bands included; England's SDLT at the non-residential rates land takes; Ireland's 7.5% stamp duty; Ontario's land transfer tax; British Columbia's property transfer tax. The buyer's are on the quote; the seller's are taken from the sale.
- **Holding it**: a year's property tax where it follows from published rates, New York City's Class 1 rate on its 6% ratio, New Haven's mills on 70% of value, and Los Angeles's Proposition 13, 1% on the price paid grown at the 2% cap (`taxedValue`); none on farmland or in England, said so. What the bank can't pay goes into arrears.
- **Selling** after 125 days, a broker's figure for its 2025 US land sales, read secondhand and taken everywhere, at the value then less the seller's taxes. **Splitting** where each half keeps the zoning's minimum, or an acre of farmland (SLATE's); a London plot's permission isn't split. **Combining** two parcels of one place.
- Until 4b, a parcel was bought at once at its value; that's no longer so.

Evidence: `tests/land.test.ts` (9); 17 mutations, all killed. Two first survived. One was a redundant guard: a sold parcel's tax was already canceled by the sale, so the guard was removed. The other was a combine refusal that failed only by crashing, and it is now asserted by its words. Screen: Land, from Home's Land panel, opened by the guide's chapter Land.

#### Stage 4b: listings, an offer, the deposit, due diligence and the closing (done 2026-09-29)
- **Listings**: each market where one lives lists three a month (decider `land.listings`), a size it offers at an asking price from 5% under its value to 15% over (SLATE's spread), listed up to 250 days before the month began. None is a real listing, and the screen says so.
- **An offer** at a price: the seller accepts, counters at halfway for two days, or turns it down (decider `land.market`), against a floor of 90% of the asking price falling 16% a year it has sat, 8% at most: SLATE's estimates, a home's seller's shape. The seller asks to see the whole cost in the bank; a land loan isn't kept.
- **The deposit as each place takes it**: England's Standard Conditions of Sale and Ireland's Law Society conditions, 10% on exchange, subject to contract till then; America's earnest money, 1% on acceptance (SLATE's figure for a home); Canada's 5% on acceptance (SLATE's reading of custom). Until the thirtieth day the buyer can Walk Away, a deposit paid coming back; after it, walking away or not paying at the closing on the forty-fifth loses it (both days SLATE's estimates).
- **Due diligence with published fees**, paid on acceptance: HM Land Registry's official copies and search (£13); upstate, Schenectady County's $100 percolation test application, one county's fee. **The closing** pays the rest, the buyer's taxes and, in England, the Land Registry's Scale 1 fee.
- Fixed with it: New York State's transfer tax on land in the city from $2 million, 0.65%, not 0.4%.
- A buyer's closing costs past the taxes (from 2026-09-30, researched in `docs/research/world/research-land-construction.json`): an owner's title policy at TIRSA's promulgated zone 2 rates in New York (Brooklyn, Queens, Staten Island and Columbia County), CATIC's 2016 formula in Connecticut, in its whole dollars, and Old Republic's Los Angeles premiums in California, between and past their three published points at their own rate; a lawyer's flat fee in New York (the middle of $2,500 to $5,000 in the city and $2,000 to $3,000 elsewhere, secondary); England's conveyancing index, £1,509 with disbursements and VAT; Ireland's solicitor, the middle of €1,500 to €2,500 with 23% VAT (`closingLines` in `content/land.ts`). Until then none was paid.
- A split's fee (from 2026-10-01): each authority's own schedule for the town SLATE's land lies in, paid from the bank when the parcel's split (`SPLIT_FEES` in `content/land.ts`). New York City's $73 for the new tax lot, the Town of Greenport's $250 a lot upstate, Litchfield's $250 a lot with Connecticut's $60, Los Angeles's parcel map ($13,666 and $8,240), Kern County's tentative map ($4,908 and $75 a lot), Peterborough County's consent with its stamping and the township's review (C$2,100), and the Sunshine Coast's C$5,500. Ireland charges none to split. New Haven's and England's fee weren't read, and none is charged there. Until then a split was free everywhere, and was open here because no town SLATE's land lies in was thought to publish one.
- The rest of closing (from 2026-10-01, `closingLines` in `content/land.ts`): a boundary survey at the middle of a surveyor's own published range in New York ($2,350) and Connecticut ($3,000), and a topographical survey in England (£1,200 with VAT); California's escrow, the buyer's half of $250 and $2 a thousand, $795 at least; Ontario's lawyer (Law Booth's $895 with HST); and British Columbia's notary (C$1,550 with its disbursements). Until then a survey was open because the aggregators' averages disagreed fourfold; the firms' own ranges were read instead. Ireland's split pays for the map Tailte Éireann registers (€190).
- Not kept, by design: a Phase I environmental assessment, which is ordered for commercial land and rarely for a house's lot, and SLATE's land is bought to live on or farm.
- Ontario's title insurance (from 2026-10-01, `docs/research/world/research-open-final.json`): TitlePLUS's rate card of March 2025, C$385.74 to $500,000 and C$0.90 a thousand past it, with Ontario's 8% sales tax on insurance.
- Open, and why: a survey in California, Ireland and Canada, whose surveyors print no price (the one found, a Toronto firm's "$1,800 and up" of 2015, isn't a price); title insurance in British Columbia, sold from calculators with no published table; land wasn't counted in net worth until 2026-09-29, and is now at its value, a house going up on it at what its stages have cost (`systems/finance.ts`); nothing is built on it until Stage 5.

Evidence: `tests/land.test.ts` (14); 20 mutations, all killed. Two first survived. One was the seller's "yes at the asking price", which the odds already give, so it was removed. The other was the counter spent on acceptance, which is now asserted.

#### Stage 4c: farmland let to a farmer (done 2026-09-30)
Researched in `docs/research/world/research-land-2.json` (`systems/landlease.ts`).
- Acreage one owns, with nothing built or being built on it and not for sale, is let a year at a time at the place's published cash rent, paid at the start of each year:
  - New York's $83.50 an acre (NASS 2025, as Farm Progress reported it).
  - Connecticut's about $85 (2024, secondary).
  - California's $346 (NASS 2025).
  - England's £230 a hectare (Defra's farm business tenancies, 2024/25).
  - Leinster's €299 an acre (SCSI and Teagasc, 2025).
  - Ontario's 2.35% of the land's value (Farm Credit Canada, 2025). British Columbia takes the national ratio as SLATE's estimate, as FCC published none there.
- Taxed as rental income: on the American return, and as it's paid elsewhere, Britain's after HMRC's £1,000 property allowance.
- Let, the land is the farmer's: it isn't ridden on an ATV, split or joined, and a sale ends the lease. Ended on notice, the lease runs to the year's end.
- Not kept yet: commercial land, waterfront premiums and islands, and easements, all researched; utility connection was built later (`SERVICES`, below), and an easement waits on a published need. Foreign buyers' rules and a land loan were built next (Stages 4d and 4e).

Evidence: `tests/landlease.test.ts` (4). 13 mutations, all killed in the end. One first survived as a redundant guard: a town lot's place has no farm rent, so `yearRent`'s acreage check was removed. Three needed tests: combining let land, and letting land for sale or being built on.

#### Stage 4d: a home bought in a country one isn't a citizen of (done 2026-09-30)
Researched in `docs/research/world/research-land-2.json` (`systems/foreignbuyers.ts`).
- **Canada:** the Prohibition on the Purchase of Residential Property by Non-Canadians Act bars a non-Canadian from a home in a metropolitan area or agglomeration until 1 January 2027 (CMHC).
  - SLATE keeps no permanent residents, and takes a Canadian town of 10,000 or more, an agglomeration's threshold, as one.
  - It bites on a home bought to let: one to live in already needs permission to live there.
- **Its taxes,** added to closing:
  - Ontario's Non-Resident Speculation Tax, 25%, and Toronto's 10% more from 2025, on a foreign national's purchase. They bite from 2027, once the ban has lapsed.
  - British Columbia's 20% additional property transfer tax on a foreign national (not re-read on 2026-09-30).
- **England:** a buyer not resident in the UK pays 2% more Stamp Duty Land Tax (HMRC, not re-read). SLATE takes a buyer whose home isn't in Britain as not resident; the test is 183 days in the year before.
- **Mexico City** is outside the restricted zone, so a foreigner may own directly under a Calvo clause with the SRE. Its fee wasn't read, and none is charged. Ireland and America don't restrict a foreign buyer.
- British Columbia's speculation and vacancy tax (`bcSvtRate`, later on 2026-09-30): each July, on the assessed value of a foreign owner's home that last year was lived in under half the year and not let. It is 2% through 2025, 3% for 2026 and 4% from 2027, now read on gov.bc.ca (`research-sweep5.json`). Since later on 2026-09-30 a Canadian citizen's empty home pays 0.5% for 2025 and 1% from 2026; until then a Canadian paid none. BC's untaxed worldwide earner, who pays the foreign rate, isn't kept, as SLATE doesn't hold where a household's income is taxed.
- Not kept: America's FIRPTA withholding on a foreign seller, which needs a nonresident's US return that SLATE doesn't file.

Evidence: `tests/foreignbuyers.test.ts` (3). 7 mutations, all killed in the end. Two needed tests: the ban lapsing on its date, and a small town outside it.

#### Stage 4e: a loan on land (done 2026-09-30)
Researched in `docs/research/world/research-land-2.json` (`systems/landloan.ts`).
- **The terms:** America's farmland, bought on the Farm Credit System's terms: about 6.3%, 35% down (common on bare land) and up to 30 years (Farm Credit East, from loan guides, secondary). The Land screen's Paid offers it; the lender puts up 65% at the closing.
- **Showing funds:** a financed offer asks the buyer to show only what the loan doesn't lend and the closing's costs. The first draft asked for the whole price, which a test caught.
- **Keeping it:** paid monthly, a payment missed owed; counted among the debts in net worth; paid off from a sale first.
- **Not kept:** Britain's AMC, Ireland's banks and Farm Credit Canada publish how much they lend on land (60%, 70%, about 75%) but not at what rate. Mexico's Infonavit lends only to someone formally employed, which an actor isn't. A town lot isn't farmland. Until later on 2026-09-30 a lender didn't take land back for missed payments; they went into arrears without end. Now it does (`landLoanMonth`, `foreclose` in `systems/land.ts`), on the home's timings, since no land lender's were read: foreclosure begins when the oldest payment is 120 days late, a payment made stops it, and at 210 the land is sold at the home's 85% forced-sale share. The loan is paid first, any surplus is theirs and any shortfall is owed, and it goes on the record as a home's foreclosure does. Regulation X's 120 days binds a loan on a home lived in, not land. Evidence: `tests/landloan.test.ts` (5); 9 mutations, all killed in the end, two after their tests were added.

Evidence: `tests/landloan.test.ts` (2). 6 mutations, all killed in the end. Two needed tests: a sale's payoff, and the payment repeating each month.


#### Stage 4f: services for a house on bare land (done 2026-09-30)

- **What's charged when a house is built** (`SERVICES` in `content/construction.ts`, researched in `research-land-2.json`):
  - Rural New York, Connecticut and California: a drilled well ($9,000, the middle of a typical $3,000 to $15,000), a septic system ($8,021 on average) and the percolation test it's designed from ($1,300 on average). All three are 2026 cost guides, secondary, since no government series is published.
  - Leinster: ESB Networks' standard connection, €3,602 with VAT. It is one flat charge however far away.
  - A town lot has its services, and Ontario's Hydro One connects a house free within 30 m.
- **Not kept:**
  - BC Hydro's fee past its $2,798 contribution, and Irish and Canadian wells and septic systems, none of which were priced.
  - NYSEG's per-foot extension, since SLATE's land keeps no distance to a line.
  - A failed percolation test, whose rate isn't published.
  - Waterfront, islands and commercial land. The waterfront premiums are one-off studies. The islands are asking prices, and Mexico's are federal land. Commercial land's averages are paywalled.

Evidence: `tests/construction.test.ts`, the farmland and Leinster cases. 2 mutations, both killed.

### Stage 5: Construction

#### Stage 5a: a house built on a town lot (done 2026-09-29)
- **Where**: a lot one owns in New York City, New Haven, Los Angeles or London (`systems/construction.ts`, `content/construction.ts`, researched in `docs/research/world/research-construction.json`). Farmland waits for a planning permission SLATE doesn't take yet, said so.
- **What**: the sizes the authorities publish. In America, the Census's 2025 median owner-built house, and the median and average houses a contractor built on the owner's land, for the Northeast and the West; in London, the nationally described space standard's two-story houses. Bedrooms and bathrooms for the American sizes are SLATE's. A house fits where the zoning's bulk allows: R2's floor area of 0.75 of the lot; the Baseline Mansionization Ordinance's 45% of a flat R1 lot; RS-2's 30% coverage, read secondhand, on two stories.
- **What it costs**: the Census's 2025 median contract price a square foot by region ($179.30 in the Northeast, $176.87 in the West), the region's standing in for the town, said so. London's is SLATE's estimate: the compilers' £2,200 a square meter for an English self-build, read from BCIS's subscription data, and 20% more.
- **The fees, each place's own**:
  - New York: DOB's $0.06 a square foot, $100 at least.
  - New Haven: its permit by the $1,000 and the state's education fee, both read secondhand.
  - Los Angeles: the Table 1-A permit on LADBS's valuation, plan check at 90%, the state's strong-motion and building standards fees, the Affordable Housing Linkage Fee (SLATE takes the medium market), the school developer fee at 2026's cap (secondhand), and the $150 Certificate Of Occupancy.
  - London: the building control charge with VAT (Hackney's, secondhand, for all three boroughs), and the borough's and the Mayor's Community Infrastructure Levy. Building to live in claims the self-build exemption, and the levy is owed if the house is sold or let within three years.
- **Stages and time**: NAHB's 2024 seven stages, with the permit, impact and water fees taken out of site work, each billed as it's done. A bill the bank can't pay stops the work until Pay The Contractor. The permit's wait is the Census's latest by region; the building time is the rest of NAHB's 2025 permit-to-completion months by division. London's nine months on site is SLATE's, the middle of the compilers' six to twelve. Each place names its inspections at a stage's end, and the house is finished with its Certificate Of Occupancy, or London's completion certificate.
- **Finished**: the house is a home owned (`ownBuilt` in `homes.ts`), worth what the land and the building cost and moving with the town's market from then; its fees are its closing costs, and the Homes screen moves one in.
- Insured and warranted (from 2026-10-01, `BUILDERS_RISK_A_MONTH` and `ENGLISH_WARRANTY` in `content/construction.ts`): an American build carries builder's risk at the $105 a month Insureon's own customers paid on average, for each month of the build begun ($1,155 for the Middle Atlantic's 10.4 months), and a London house a structural warranty at Homebuilding & Renovating's £2,000 average for self-build cover (2020), which a lender asks of a new house. Both are secondary figures. The rates a thousand of value, 1% to 4% and 0.1% to 0.55%, disagreed tenfold and weren't used. America's 2-10 warranty is the builder's, under half a percent of the price and inside the contract, so nothing is added for it. Until then neither was kept.
- Open, and why: building on farmland was the next module, and 5b built it; renovation and extension's permits were the one after, and 5c built them; no authority publishes a rate of delays, overruns or change orders for a house, or a failed inspection's, so none is drawn (Houzz's 2026 study has 37% of renovations over budget but no amount over, NaCSBA's 2022 self-builders 85% on or slightly over, and the Census the months a build takes, not how late it runs; no city publishes a first-time pass rate); HomeBond's warranty in Ireland, whose price isn't published; builder's risk in Canada, none being read.
- A construction loan (from 2026-09-30, researched in `docs/research/world/research-land-construction.json`): in America Space Coast Credit Union's construction-to-permanent loan, a Florida lender's, the one rate sheet read in full, no New York, Connecticut or California lender publishing one: 10% down, its 30-year 7.25%, $1,100 and a quarter of a percent to originate and $1,400 for the inspections and draws; in England Ecology Building Society's self-build mortgage at 80%, 5.89%, £999 and £625. The lender pays its share of each stage, interest only on what's advanced is paid monthly, and when the house is finished the loan becomes its mortgage over 30 years (`BUILD_LOANS` in `content/construction.ts`). For a record a home lender would take. Until then a house was built from the bank alone; no Irish or Canadian lender's rate was read.

Evidence: `tests/construction.test.ts` (11); 18 mutations, all killed. Three first survived, each a rule no test reached: New York's $100 least, the refusal of a start the bank can't cover, and the levy's three years running out. A test now reaches each.

#### Stage 5b: a house on farmland (done 2026-09-29)
- **America**: upstate New York, rural Connecticut and California take the region's sizes, prices and times as the towns do. The state's fees are charged: Connecticut's education fee, and California's strong-motion and building standards fees on the work's value. A town's or county's permit is published town by town, none was researched, and it isn't kept, said so.
- **Leinster**: SCSI's three-bedroom house of 114 m², the only size an Irish body publishes, at its Greater Dublin hard cost of €1,998 a square meter (2023), a scheme house's, standing in. Charges: planning at €65, Kildare's development contribution of €62 a square meter (read from its draft scheme and taken for the province), and the €30 commencement notice. Work starts after the council's eight weeks, the four in which an appeal may be made, and the notice's fourteen days.
- **Ontario and British Columbia**: no Canadian house size is published, so the Census's regions' sizes stand in, at Altus's 2025 lowest custom-house rate around Toronto (C$520) and Vancouver (C$495).
  - Ontario: Cavan Monaghan's permit at C$1.25 a square foot and its rural development charge of C$8,105. The Building Code gives ten business days to issue a house's permit.
  - British Columbia: the Sunshine Coast's permit by value (bylaw 779, 2025). A lot on a private well pays no water charge. A house on the Agricultural Land Reserve is capped at 500 m² without applying to the Commission.
- **England**: no isolated house in the countryside unless a rural worker must live there (NPPF, December 2024, paragraph 84). SLATE's actors aren't rural workers, and the Build panel says so.
- SLATE's estimates, and said so: twelve months to build in Ireland and Canada; two months for a British Columbia permit.
- Finished, the house is a home on the farmland, the whole parcel gone into it, in its market’s town (`content/land.ts`): Hudson, Litchfield and Bakersfield (SLATE’s choice of farm towns), Naas, Millbrook and Sechelt (the towns whose fees it paid). Farmland’s value moves with that town’s market. Until 2026-09-29 the house stood in the city the land was bought from: a played New York life moved into its upstate farmhouse and so lived in Manhattan.

Evidence: `tests/construction.test.ts` (15); 8 mutations, all killed.

#### Stage 5c: the permit an extension asks (done 2026-09-29)
Renovation and extension stood before this work (`homes.ts`: thirty-nine jobs, from paint to a primary suite and a backyard cottage). What they lacked was the permit. The eight jobs that change the building now ask for it (`systems/permits.ts`): finishing a basement, converting an attic or a garage, adding a bathroom or a suite, building a cottage. The fees are paid when the work starts, and the work waits for a decision a law gives time to.
- **New York**: the Department of Buildings' alteration permit, $130 for the first $5,000 and $2.60 a $1,000 more.
- **Los Angeles**: Table 1-A on the work's value, plan check at 90%, and the state's fees.
- **New Haven**: the city's permit and the state's education fee, read secondhand.
- **London**: a loft or a room inside is permitted development. A primary suite takes the larger home extension's prior approval (£249, 42 days for the neighbors). A bigger suite or a cottage takes a householder application (£548, eight weeks). Where a suite falls in the permitted depths turns on the house's plan, so this is SLATE's reading.
- **Dublin**: a rear extension to 40 m² is exempt. A bigger one or a cottage takes the €34 application, eight weeks and four for an appeal.
- From 2026-09-30 (`docs/research/world/research-land-construction.json`): a London suite pays building control's charge, Camden's 2026 schedule for a single-story extension of 10 to 60 m² with VAT, £1,875.55, taken for London's as each borough sets its own (read from an excerpt); a Dublin extension that needs planning pays the commencement notice's €30.
- A conversion in London (from 2026-10-01, `londonControl` in `systems/permits.ts`): permitted development asks no planning, only building control, at Havering's 2026-27 schedule, read in full and with VAT, as Camden's showed no garage row: £859 for the attic's 27.9 m² loft, £673 for a garage made a room, and a basement, which has no row of its own, at the extension band the suites pay (£1,875.55). A garage built new, 18 m², detached and not lived in, is exempt from the building regulations. Until then a conversion paid nothing in London.
- Toronto, Vancouver and Mexico City (from 2026-10-01, `docs/research/world/research-open-final.json`, `systems/permits.ts`): Toronto's service index on the floor area, C$18.56 a m² for an addition and C$6.20 for a basement finished, C$214.79 at least and for a garage, after the Building Code's ten business days; Vancouver's on the work's value, C$217 for the first C$5,000, C$13.90 a C$1,000 to C$50,000 and C$7.04 past it; Mexico City's manifestación tipo A, MX$447 and MX$23 a m² added (Código Fiscal, article 185). Until then no permit was kept in those cities.
- Open, and why: a loft or a garage made a room in Toronto, an interior alteration whose index wasn't read; a backyard cottage there, whose size SLATE doesn't keep; elsewhere the permit isn't kept.

Evidence: `tests/permits.test.ts` (6); 7 mutations, all killed.

#### Stage 5c: retention, and the certificate of occupancy (done 2026-09-30)
Researched in `docs/research/world/research-construction-choices.json` (`RETENTION`, `OCCUPANCY_WAIT_DAYS` in `content/construction.ts`).
- **Retention:** each stage's bill has the law's or the contract's share held back, paid after completion. The sources are law firms' summaries of the statutes; the statutes weren't read.
  - New York: 5% at most, within 30 days of final approval (GBL 756-a).
  - California: 5% from 2026 (Civil Code 8811), within 45 days (8812, not read).
  - Ontario: the Construction Act's 10% holdback, after the 60-day lien period.
  - British Columbia: the Builders Lien Act's 10%, held 55 days.
  - London: the JCT Minor Works form's 5%, half at practical completion and half three months on.
  - Held from the owner's part of a financed stage, and set aside even when a stage's bill goes unpaid, so paying it later doesn't hand it over early.
  - None held in Connecticut (its 7.5% cap unverified) or Ireland, whose Construction Contracts Act exempts a house its owner will live in.
- **The certificate of occupancy:** a finished house can't be lived in before its certificate: three weeks in Los Angeles (two to four, secondary), two in Toronto (its ten business days). Elsewhere it's issued with the final inspection.
- **Not kept:**
  - Delays and change orders, whose only figures are for large projects.
  - A spec tier's effect on value, as no free source splits a new home's cost by spec.
  - An architect's fee, which the AIA doesn't publish.

Evidence: `tests/construction.test.ts`, 3 new tests and 4 updated for the retention. 8 mutations, all killed in the end; one needed a test, the retention set aside on an unpaid stage.

### Stage 6: A home's contents

What stood before: every home's fixtures, drawn from each country's survey of what households have (`content/homes.ts`), decide real things. A dishwasher keeps the place tidier; laundry at home spares the laundromat; air conditioning cools hot nights and runs up the summer's bills; a bath, somewhere outside, a gym each open what can be done. None could be changed.

#### Stage 6a: appliances fitted (done 2026-09-29)
- A home owned can be fitted with a dishwasher, a washing machine, a dryer beside it, air conditioning units, or central air in a house (`systems/appliances.ts`, `content/appliances.ts`, researched in `docs/research/world/research-contents.json`). Each changes the fixture it is, so what it does is what the fixture already does.
- Prices with their fitting, SLATE taking the middle where a body gives a range, said so: Consumer Reports' and the cost guides' in America; Which?'s in Britain. In Ireland, Canada and Mexico, a retailer's price as a search read it, the retailers refusing automated reads. What nobody prices isn't sold: central air in Britain, Ireland and Mexico, a dryer or a window unit in Mexico. Elsewhere none is sold yet, said so.
- Each lasts its published life (NAHB's 2007 study: dishwasher 9 years, washer 10, dryer 13; the Department of Energy's room unit 9 and central air 18, the low end of its 18 to 25), then gives out, the home as it was without it. A washer's end leaves a flat its building's machines.
- A tenant's own air conditioning (from 2026-09-29): Buy Air Conditioning Units, on Home, where the price kept is a window unit (America, Canada) or a portable one (Britain). They're the tenant's, cool any home they live in without air conditioning of its own, and give out after the same nine years (`unitsRefusal` and `home.buy_units` in `systems/appliances.ts`). Ireland's and Mexico's kept price is a split system on the walls, which a tenant fits only with the landlord's consent, so none is sold there. Until then a tenant couldn't cool a hot flat, which was open here as appliances in a rented home.
- A tenant's own machines (from 2026-09-30, researched in `docs/research/world/research-lodgers.json`): a lease bars plumbing one in without consent, but a countertop dishwasher and a faucet-filled portable washer change nothing in the building, and a compact dryer plugs into an ordinary outlet. Where a retailer prints a price (America's Comfee dishwasher at $289.99, BLACK+DECKER washer at $305.99 and Magic Chef dryer at $369; Britain's Russell Hobbs table-top dishwasher at £239.99; Canada's Danby at C$369.99; Mexico's Avera at MX$6,939) they're the tenant's, move with them, and do the fixture's job wherever it's missing, for the fixture's published life (`portableRefusal` and `home.buy_portable` in `systems/appliances.ts`). California's landlords must supply a working stove and refrigerator from 2026 (Civil Code 1941.1, AB 628), which SLATE's fixtures don't track.
- What one adds (checked 2026-09-30, `docs/research/world/research-land-construction.json`): to its value nothing, which is what SLATE's home value already gave, the price grown with the market and the works done (`homeValue`), as Fannie Mae's appraisers take a freestanding appliance for personal property; to a let's rent the fixture's premium, as StreetEasy found about 12% more for a New York flat with its own washer and dryer (`marketRent`, `FIXTURE_PREMIUM`).
- Portables abroad and central air's worth (from 2026-10-01, `PORTABLES` and `CENTRAL_AIR_RECOVERED` in `systems/appliances.ts`, researched in `docs/research/world/research-home-lodgers-movers-2.json`): a portable washer and a compact dryer in Britain (Argos's £140 twin tub, Currys' £195 3 kg dryer), Ireland (MicksGarage's €149.99 twin tub, BuyItDirect.ie's €209.97 table-top dishwasher, Currys.ie's €239.99 dryer) and Canada (Danby's C$649.99 washer, BLACK+DECKER's C$679 dryer), and a twin tub in Mexico (Coppel's MX$4,199); several read from a search engine's copy, the stores refusing to be read. Mexico's "compact dryer" is a heatless spin extractor, and none is sold. Central air fitted to an American house adds 72.1% of its cost to the value, Cost vs. Value 2025's recovery for a new system, until it gives out. Until then none of these was kept.
- Open, and why: what a built-in dishwasher adds to a home's value, which no one publishes; central air's worth outside America, none being read; furniture was open, and 6c built it; a garage built was open, and 6b built it. Bedrooms holding people waited for a household, which SLATE hasn't kept since the family went with the revamp; 6d (below) fills them with lodgers instead.

Evidence: `tests/appliances.test.ts` (5); 10 mutations, all killed. One first survived as a redundant guard: an appliance can't be refitted before its end, so the check that the one ending was the one fitted was removed. Another survived because its test never reached the dryer's end: a £400,000 home's thirteen years of bills left the life short of it. The test now advances to that end and checks it came. A tenant's own units (3 tests, 8 mutations, the same guard surviving and removed the same way): `tests/appliances.test.ts` (8 in all).

#### Stage 6b: a garage built (done 2026-09-29)
- A detached house with a yard, on a lot of 5,000 sq ft or more, can Build A Garage. It's one car's (Manual for Streets' 6 m by 3 m), at Angi's $26,400 average for a detached garage (a cost guide's), at the town's cost of living as every job is. Its return and its month are SLATE's.
- It asks New York's, Los Angeles's and New Haven's permits. It's exempt in London, within England's Class E outbuilding limits, and in Dublin, within Ireland's Class 3 25 m².
- A car kept at a home owned with a garage pays no resident parking permit, which stage 3d had kept for a garage the house came with. The garage door is new the year it's built.

Evidence: `tests/permits.test.ts` (the garage, end to end: built in London and the Puma's Westminster permit gone); 2 mutations, both killed.

#### Stage 6c: furniture of one's own (done 2026-09-29)
- No body publishes what furnishing a home costs, but a shop publishes each piece's price. SLATE sells what furniture changes, at IKEA's own prices in America, Britain, Ireland, Canada and Mexico, read from its pages on 2026-09-29 (`content/furniture.ts`, researched in `docs/research/world/research-furniture.json`).
  - A bed: a MALM high frame and a VALEVÅG mattress in the country's usual double size.
  - A sofa: a KIVIK three-seat.
  - The regular price, not a sale's; delivered at the cheapest large-item rate; with the town's sales tax on top in America and Canada, and VAT or IVA inside elsewhere.
- A home bought or built from 2026-09-29 comes empty, as a real one does (`bare`). A rented room or flat comes furnished, SLATE's reading of a let; a home owned before then is taken as furnished, so no save wakes to an empty house. The pieces are the person's and move with them.
- In an empty home a night without a bed is slept on the floor, costing a sofa night's 0.08. An hour unwinding without a sofa takes half the stress off. Both are SLATE's estimates, no study measuring either.
- From 2026-09-30 (`docs/research/world/research-upkeep.json`):
  - A bed in California or Connecticut carries the state's mattress recycling fee, collected at the sale: California's $18 from 1 April 2026, Connecticut's $19.50 from 1 October 2026, $16 each before (the Mattress Recycling Council's notices).
  - Moving home with a bed or a sofa of one's own pays movers, a one-bedroom's move at the middle of its range: America's $475 within 100 miles and $1,850 past them (Angi); Britain's £466, with Konnect You's distance on top; Canada's C$600 local and C$4,400 across the country (HomeStars, read from search extracts); Mexico City's MX$3,515 (`MOVERS` in `content/furniture.ts`). A removal was open here until then.
- Movers in Ireland and abroad (from 2026-09-30, researched in `docs/research/world/research-credit-damage-movers.json`): a Dublin firm's €300 to €600 for a one-bedroom, the middle; between countries, the movers' and brokers' estimates for a one-bedroom's goods, London and Dublin £1,200, America and Britain $2,516.50 port to port, America and Ireland $3,600, America and Toronto $3,795, America and Mexico $6,250 (`MOVERS_ABROAD`). The goods of someone changing residence come in free of duty in all five countries (Britain's Transfer of Residence relief, Ireland's, 19 CFR 148.52, Canada's settlers' effects, Mexico's menaje de casa), so none is charged. Until then neither was charged.
- A mattress wearing out (from 2026-09-30): VALEVÅG, a pocket-spring mattress, is worn at the middle of the Sleep Foundation's 5.5 to 6.5 years for an innerspring; a night at home on a worn one sleeps worse by half the floor's cost, SLATE's estimate (`WORN_NIGHT`), as the one study finds old beds worse without a measure SLATE can use. Replace The Mattress buys IKEA's mattress alone, delivered and taxed, with a state's recycling fee and the removal a retailer prints (IKEA's from $30 in America, Dreams' £60 in Britain and €69 in Ireland); a new bed brings its own. Until then a mattress never wore.
- Every pair of countries (from 2026-10-01, `MOVERS_ABROAD` in `content/furniture.ts`): Britain and Canada and Britain and Mexico at MoveHub's middles by sea (£4,149.50, £4,562.50), Ireland and Canada at AMC Removals' €3,250, Ireland and Mexico at MoveHub's £4,902, and Canada and Mexico at MoveHub's £3,356.50, as Three Movers' range names no money. They're estimates, not quotes. Until then a move between them cost nothing.
- Open, and why: a mattress's wear measured on SLATE's own terms, since the one study (Jacobson, 2009) has no control group, was paid for by the industry's council and measures on no scale SLATE's sleep has.
- Not kept, by design: the rest of a home's furniture, which changes nothing SLATE keeps.

Evidence: `tests/furniture.test.ts` (8); 8 mutations, all killed, and 7 for the fee and the movers, one first surviving, Britain's distance, which no town SLATE loads reaches, now tested on the table itself. A home bought through Homes is marked empty by the same flag as a built one, which is tested. The purchase path itself isn't mutation-tested, as it takes a whole offer to closing.

#### Stage 6d: a lodger in a spare bedroom (done 2026-09-30)
- A home one owns and lives in lets a spare bedroom to a lodger, as owners do (`systems/lodgers.ts`, researched in `docs/research/world/research-lodgers.json`): at most two, the number of boarders New York City's Housing Maintenance Code allows an owner, taken everywhere, and no more than its bedrooms past the owner's.
- At the average a room rents for in the town, paid on moving in and monthly: SpareRoom's £915 for Greater London (Q2 2026, bills included), $1,515 for New York and $1,338 for Los Angeles (July 2026); Daft.ie's €914 for a double room in a Dublin house (Q1 2026); Rentals.ca's C$1,127 for Toronto and C$1,115 for Vancouver (May 2026, read from a search's summary). New Haven and Mexico City publish none, and no lodger is taken there.
- Taxed as each country taxes it: America's as rent on the return; Britain frees £7,500 a year under the Rent a Room Scheme and taxes the rest as income; Ireland's Rent-a-Room Relief frees €14,000 and is lost whole once the year passes it; Canada's is taxed. Outside America it's taxed as it's paid, as SLATE taxes other income there.
- A lodger goes when let go, and leaves when the owner no longer lives there.
- A room's share on the American return (from 2026-10-01, `lodgerShare` in `systems/homes.ts`): IRS Publication 527 divides a home by floor area, its own example a 180 sq ft room in an 1,800 sq ft house, and SLATE, keeping no room's size, takes each lodger's room at that 180 sq ft. That share of the interest, property tax, insurance, repairs and the building's depreciation is set against the rent, and only the rest is a homeowner's deduction. Until then the rent was taxed whole.
- Not kept, by design: England's Right to Rent check, which is free and which SLATE's owner always makes, so it changes nothing; the penalties for not making it (£5,000 a lodger for a first breach since 13 February 2024) never fall.
- Open, and why: a lodger's use of the bills, which Britain's room rents include: DESNZ's 2024 medians put a second adult at 2,063 kWh of gas and 864 of electricity a year more, but bigger households live in bigger homes, so the figure overstates what a lodger adds and isn't taken; how long a room sits empty, which SpareRoom and everyone else leave unpublished.

Evidence: `tests/lodgers.test.ts` (5); 10 mutations, all killed in the end. One first survived for want of a year past Britain's £7,500; one was a redundant check that the home wasn't let, which living in it already settles, and was removed.

#### Stage 6f: an alarm, Britain's burglaries, and a home's screen, console and speaker (done 2026-09-30)
Researched in `docs/research/world/research-home-contents.json` and `research-home-effects.json`.
- **A burglar alarm** (`systems/alarm.ts`, `home.alarm`): Ring's kit and its Pro monitoring, $199.99 and $19.99 a month in America, £139.99 and £15.99 in Britain, the two places both were read.
  - It takes the insurers' discount off the premium, a renter's or an owner's: the Triple-I's 5% in America, and Aviva's 12.5% in Britain, read from a search's summary.
  - It doesn't lower the risk. Tseloni et al. found, in the Crime Survey for England and Wales, that an alarm alone protects no better than no security. So an alarm is realistically poor value.
  - An owner's is fitted in the home and stays with it; a renter's goes where they go. Monitoring unpaid switches it off.
- **Britain's burglaries:** 1.1% of households a year (CSEW, to March 2026), in place of America's NCVS 8.2 in 1,000, which elsewhere is still SLATE's estimate.
- **A TV, a console and a soundbar** (`GEAR_FOR` in `systems/enjoyment.ts`, furniture pieces):
  - An hour unwinding at home is loved by a film or television lover only with a TV there, a gamer with a console, and a music lover with a speaker. Away from home, a hotel's or a sublet's TV does.
  - The gear: Samsung's 55-inch QN70H, a PlayStation 5 with a disc drive, and Sonos's Beam, at the regular price. Canada's console and the soundbars outside America are read from searches' summaries. No console is sold in Mexico, where no price was read.
  - They're carried in a move with the bed and sofa.
- Until 2026-09-30 the security that measurably cuts burglaries wasn't kept; it is now (below).

Evidence: `tests/alarm.test.ts` (5) and `tests/gear.test.ts` (4). 13 mutations, all killed in the end. Two first survived and needed tests: the day's burglary draw at Britain's rate, now checked at a scale a test can see, and an unknown piece refused.
#### Stage 6g: locks, a light and timers (done 2026-09-30)

- **What they do** (`systems/homesecurity.ts`, `home.security`, the day's burglary in `systems/dwelling.ts`): Tseloni et al.'s protection factors, the odds of a burglary with entry against a home with none, from the Crime Survey for England and Wales (Security Journal, 2017, Table 3). Door deadlocks alone are 2.8; window locks with them 12.54; outside lights too, 34.41; indoor lights on a timer as well, the WIDE combination, 49.12.
  - SLATE takes a home as found to have locks on its doors, and the place's published rate as that home's. So window locks leave 2.8/12.54 of the risk, about a fifth, and the WIDE combination 2.8/49.12, about a eighteenth.
  - A set the study didn't measure counts as the best one it did that the home holds. Outside lights without window locks add nothing.
  - The alarm still counts for nothing. The study's window and door locks with an alarm came to 8.92, below the locks alone, but not significantly, so SLATE doesn't draw it.
- **What they cost:** a named retailer's shelf in each country. The Home Depot in America and Canadian Tire in Canada, both read from search summaries and before sales tax, which is added. Screwfix in Britain, Woodie's in Ireland and The Home Depot México, all with VAT in.
  - A lock on each window: a bedroom's, and three in the rooms lived in, in a house; four in a rented flat. Both counts are SLATE's estimates. Two timers, and one motion light, on a house only.
  - They're screwed or plugged in, and no fitter is paid.
- **Where they stay:** in a home one owns they stay with it. In a rented one, they're left behind on moving out. A shared home's windows and doors are the landlord's.

Evidence: `tests/homesecurity.test.ts` (4). 9 mutations, 8 killed. The survivor was equivalent: it read a renter's devices in a home one owns, where a renter's never are.
### Stage 8: Rentals on a journey

#### Stage 8a: a car rented at the far end (done 2026-09-29)
- On a journey booked with its way home, Rent A Car There rents a small car at the airport for the days between, counted in 24 hours with the 29 minutes' grace the companies publish (`systems/rentals.ts`, `content/rentals.ts`, researched in `docs/research/world/research-rentals.json`). It's prepaid, and refunded in full if the journey never arrives, no company publishing a no-show's charge.
- A day's rent is Kayak's small-car average at the airport, a compiler's figure, the only kind any company allows. Everything else is one company's own terms for the town: Avis at JFK; Enterprise at New Haven, LAX, Toronto and Vancouver; Hertz at Heathrow, Edinburgh, Belfast, Dublin and Mexico City.
  - The minimum age, and the young driver's surcharge with its cap.
  - How long a license must have been held.
  - The deposit held on the card at pickup and released at return, waived by Enterprise in Canada for a renter with a ticket home.
  - A damage waiver where the deposit assumes one, and the excess on damage where one is published.
- Taxes by statute:
  - New York's sales tax with its 6% and 6% special taxes on car rentals.
  - Connecticut's 9.35% and $1 a day.
  - Los Angeles's rate rising on 1 October 2026, and LAX's charges, read secondhand.
  - Ontario's HST.
  - British Columbia's GST, 7% PST and $1.50 a day.
  - Mexico's IVA.
  - VAT is in the British and Irish rates.
- Refused to someone under the company's age, with a license held too short a time, or who may not drive there.
- The car is driven by road from where it is (Travel's By), fuel at AAA's average a mile, with the crash and ticket risk of any drive. A crash that hurts charges the company's excess where one is published.
- Checked on 2026-09-30 (`docs/research/world/research-travel-aviation-boats.json`): LAX's 11.11% concession recovery and its $12 a day facility charge were already on its quote; no company prints JFK's or Tweed's concession percentage, and Dublin's 19% airport surcharge is Enterprise's, not the Hertz SLATE rents from there. A one-way fee is printed only by Hertz Ireland (€20 to €120), and SLATE's rental always goes back to its airport.
- JFK's charges and the damage waiver (from 2026-10-01, `content/rentals.ts`, researched in `docs/research/world/research-rentals-lets-charters-2.json`): JFK's 11.11% concession recovery, a 10% concession passed on, and its $4.50 a day facility charge, read from renters' receipts. The damage waiver is offered, taken or declined, where its price is known: at JFK New York's cap for a car under a $20,000 sticker, $9 a day (§396-z), Avis's own "as low as"; at LAX California's $25 cap (§1939.09, its CPI rise since 2023 unpublished). Declined, a crash that hurts leaves the repair owed, the $882 a rental-excess insurer's customers averaged for a major collision (secondary), with Enterprise's $100 administrative fee at LAX, which §1939.03 allows, and none at JFK, which §396-z bars. Until then JFK's charges weren't kept and a crash in America cost the renter nothing.
- Not kept, by design: a one-way drop fee, which no rental SLATE keeps incurs, as each goes back where it was picked up.
- Toronto Pearson's damage waiver (from later on 2026-10-01, `docs/research/world/research-open-final.json`): Enterprise's own C$31.99 to C$36.99 a day, the middle, with HST; declined, the same $882 repair in dollars, no Canadian figure being published.
- Open, and why: Tweed's concession charge, which no company prints; damage in Connecticut and Vancouver, where no waiver's price is published (Enterprise's $8.99 to $74.99 at Tweed was only a search excerpt), and a renter's own insurance or card usually covers it; holiday lets were the next module, and 8b built them.

Evidence: `tests/rentals.test.ts` (7); 12 mutations, all killed. The excess on a crash isn't mutation-tested: a crash is a draw, and the test can't make one without stubbing the injury system.

#### Stage 8b: a holiday let instead of a hotel (done 2026-09-29)
- Stay In A Holiday Let swaps a booked journey's hotel for a let, while the hotel can still be canceled free (`content/lets.ts`, `letQuote` in `systems/journey.ts`).
- A night is AirDNA's average for the town, a compiler's figure read from a search, the only one published, in dollars. On it: Airbnb's guest service fee at the low end of its published 14.1% to 16.5%, and the town's taxes on a short stay.
  - New York City's occupancy tax, sales tax and unit fee.
  - Connecticut's 15%.
  - Los Angeles's 14%, read secondhand.
  - Toronto's 6%.
  - British Columbia's PST and Vancouver's MRDT.
  - Mexico City's 5% and IVA.
  - None in London or Dublin.
- The law binds the booking: New York City's Local Law 18 bars a whole home for fewer than 30 nights, and London a home for more than 90 a year.
- Canceled, Airbnb's Moderate policy: all of it back until five days before, then half the nights after the first, the fee kept.
- Lived in, a let is a home of the town's kind, its fixtures drawn as the town's rentals are, and its kitchen cooked in, where a hotel's guest eats out. On its last morning, still there, a hotel takes over.
- Edinburgh's and Belfast's lets were open for want of a nightly rate until 2026-09-29: now AirDNA's $269 and $160, Edinburgh's 5% visitor levy on the first five nights.
- A damage claim against a guest (from 2026-09-30, researched in `docs/research/world/research-credit-damage-movers.json`): about 0.02% of Airbnb's reservations end in a damage reimbursement of $1,000 or more (Airbnb, 2023), the one platform-wide figure published, so leaving a let draws that (decider `travel.let_damage`) and the claim is the band's least, $1,000, charged to the guest as the platform charges the payment method after the host's 14 days and the guest's 24 hours. Until then no guest did any damage.
- Open, and why: a claim's size past $1,000, and smaller claims, which no platform publishes (one manager's 0.71% of Airbnb bookings has no amounts; searched again on 2026-09-30, Airbnb, Vrbo, Proper and Steadily publish no average guest-damage payout, Proper's $18,000 average being a sewer backup's).

Evidence: `tests/lets.test.ts` (5); 8 mutations, all killed.

#### Stage 8c: staying longer (done 2026-09-30)
- Once there, Stay Longer on Travel's journeys moves the booked way home some days on at the hour it was booked for (`travel.extend`, `extendQuote` and `slotOf` in `systems/journey.ts`), and carries the stay and any rental car to it:
  - By air within the United States, the fare's difference and no fee: United, Delta and American ended change fees on domestic economy tickets in August 2020. A cheaper fare leaves a credit with the airline, which SLATE doesn't keep. An airline's way home abroad isn't moved, no carrier's change fee there being researched.
  - By train, the old ticket refunded on its own terms (`trainRefund`) and a new one bought. Driven, flown oneself or chartered, the old way home refunded and the new one paid.
  - The hotel's nights at the town's rate, or the let's at its price for the longer stay, within its town's cap; the rental car's days at its company's terms, returned the new day.
  - The old departure, check-out and car return are taken off the calendar, so nothing leaves or charges on the old day.
- Found on the way, and fixed: Travel's journeys read "By Train" for every journey not by airline, a drive, a rental car and a flight of one's own among them; each now says how it goes. And a destination chosen before arriving in it stayed chosen: the list showed another town while the plan said both flew from the same airport. A town one is in is no longer taken as where one goes. And every trip home was charged a hotel night too many: the check-out on the morning of going home found the traveler still in town, or already on the way, and billed another night. A guest leaving that day now checks out and goes, as a hotel's does; a night is charged only to someone still there with no way out that day.
- A change abroad (from 2026-09-30, researched in `docs/research/world/research-travel-aviation-boats.json`): SLATE's flights name no airline, so a flight's fee is its published carrier's: to or from Ireland Aer Lingus's online €40 short-haul and €100 across the Atlantic; within Canada Air Canada's Standard fare, the middle of C$100 to C$120; each with the fare's difference where dearer (`changeFee` in `systems/journey.ts`).
- A change within Britain and to Mexico (from 2026-10-01, `changeFee` in `systems/journey.ts`): British Airways' £60 on a Euro Traveller fare within Britain, and Aeroméxico's Classic fare between America and Mexico, whose first change is free. Both were read from the airlines' own text as a search engine holds it, ba.com showing a queue page and Aeroméxico's site being down. Until then neither was moved.
- Not kept, by design: a basic economy ticket, which SLATE doesn't sell.
- A change within Mexico (from later on 2026-10-01, `docs/research/world/research-open-final.json`): Volaris's own fee table of 22 September 2026, MX$850 more than 15 days before the flight and MX$1,100 within them.
- Open, and why: a change across the Atlantic from Britain, where only secondary ranges ($0 to $275) were found, ba.com refusing to be read.

Evidence: `tests/extend.test.ts` (3); 18 mutations, all killed in the end. Four first survived: a cheaper fare's credit, the old check-out and the old departure (which charged another night and set the way home off early), and a check that a stay was arrived at, which the town's check already settles, and was removed.

### Stage 7: Vehicle work, boats and aircraft

Researched (`docs/research/world/research-vehiclework.json`): each place's window tint and exhaust rules and their fines, California's lift limits, the periodic inspections, boater education and boat registration, marina berths, the private pilot certificate's hours and fees, aircraft rental, ownership and hangar rates, and charter and crew.

#### Stage 7a: a car's periodic inspection (done 2026-09-29)
- Where the law asks one, on its own cycle, at its published fee, paid as the car's month comes round, or owed where the bank can't (`systems/inspections.ts`).
  - New York: every 12 months from the sale, $37 in the metropolitan area and $21 outside it.
  - Connecticut: an emissions test every two years from the fourth, $20.
  - England, Scotland and Wales: the MOT from the third anniversary, then yearly, £54.85.
  - Ireland: the NCT at four years, every two to ten, then yearly, €60, the 2025 fee.
  - Mexico City: the verificación every six months, MX$765.45, read secondhand and the arithmetic checked.
- Ontario and British Columbia inspect a car only on its sale; California's smog check is priced by each station. None is kept there, said so. The Cars screen shows the next one due.
- A test failed (from 2026-09-30; decider `vehicle.inspection`, researched in `docs/research/world/research-upkeep.json`). Until then none was, this page saying no pass rate was published, which was wrong: each authority publishes one.
  - New York: 6.0% in the New York metropolitan area and 6.41% upstate, the emissions and safety failures of DEC's 2024 I/M report together; the repair at CarMD's $554.01 for a check-engine light, the nearest figure (secondary); the retest at the same station, not charged.
  - Connecticut: 7.4% of cars (the 2024 I/M report); CarMD's repair; the one free retest.
  - Great Britain: 27.51% first time (DVSA, 2025 to 2026, cars and vans together as published); BookMyGarage's £332 at three to five years and £425 from six, less the fee they include (secondary); the partial retest free.
  - Ireland: 49.43%, NCTS's 2024 pass rate of 50.57% (read from a search's extract, the report refusing automated reads); the €40 retest; Britain's repair in euros, SLATE's estimate, Ireland publishing none.
  - Mexico City publishes no rejection rate, and none is drawn.
- The MOT failed by the car's age (from 2026-10-01, `MOT_FAIL_BY_AGE` in `systems/inspections.ts`): motdata.uk's reading of DVSA's anonymized 2024 tests of cars, 10.7% at three years old, 22.8% at ten and 30.5% at fifteen, held there past it, its later ages being read only from an excerpt (secondary). DVSA's own table by age is of lorries and buses only. Until then every MOT failed at 27.51%, DVSA's rate for cars and vans together, at any age.
- Until later on 2026-09-30, tint, exhaust and lift work weren't kept, by design. Tint (`systems/tint.ts`) and an exhaust (`vehicle.modify`) were built then, once the owner's rule had them given downstream effects; a lift still isn't. The reasoning at the time: their fit rules were researched on 2026-09-30 (`docs/research/world/research-mods.json`: each place's tint limits, New York's tint meter at inspection since 2017, the SLEEP Act's $1,000 on selling or fitting a loud exhaust, California's 95 dB(A) and frame heights, Britain's duty to tell the insurer), but a legal tint, exhaust or lift changes nothing SLATE keeps, and an illegal one would only fine and fail a car for nothing it gives, so none was sold. Being qualified to fly was the next module, and 7b built it; boats and owning an aircraft were open, and 7c and 7d built them.
- Customization, read again on 2026-09-30 for the owner's "Add it all" (`docs/research/world/research-customization.json`). The research covers paint, wraps and film, wheels and tires, tint, interiors, lighting, audio, accessibility conversions, performance parts, towing, a boat's bottom, an aircraft's annual and shop labor rates. It confirmed the reason above.
  - No authority or insurer publishes a rate of police stops for tint or noise, a premium loading for a modification, or a resale effect. Britain's and Ireland's insurance acts set only a duty to answer the insurer honestly.
  - Superseded on 2026-09-30, at the owner's word: "If it doesn't have any downstream effects, give it some and that goes for everything that doesn't." The reason above, and "not kept, by design: tint, exhaust and lift work", no longer stand. Customization is being built with engines that give each part its effect (Stage 3j), from further research.
- Built from it: **a boat's bottom** (`BOTTOM_PAINT` in `content/boats.ts`, from 2026-09-30). A boat kept in the water is painted with antifouling each April, before its launch. New York's and Connecticut's price is Nichols Yacht Yard's $27.50 a foot, paint in it. California's is Monterey Bay Boatworks' $10 a foot and $1.50 environmental fee; its paint isn't published and isn't charged. A boat kept on its trailer at home isn't painted. Britain's, Ireland's and Ontario's yards weren't read. The aircraft's annual inspection was already charged (Stage 7d). Evidence: `tests/boats.test.ts` (its bottom); 3 mutations. The one that survived, a guard against painting twice in an April, was redundant, as the boat's month comes every thirty days, and was removed.

Evidence: `tests/inspections.test.ts` (8); 7 mutations, all killed. One first survived, the car's month calling the inspection, which no test reached until a used car's MOT was paid end to end. The failed test: 7 more, all killed; one first survived, New York's upstate rate against the city's, too near to tell apart by sampling, and the rates are now checked themselves.

#### Stage 7b: qualified to fly, and flying oneself (done 2026-09-29)
- Owning and operating part here: a plane is rented, and flying it asks a certificate one earns (`systems/aviation.ts`).
- Learn To Fly trains an American over six months (SLATE's estimate, none published) for the FAA's private pilot certificate, from 17. The cost, paid month by month:
  - 60 hours in a Cessna 172, AOPA's middle of the 50 to 70 most students take (the rule's least is 40), at the median school's $176 an hour with fuel, a compiler's of 1,586 schools' rates.
  - 20 hours with an instructor at $75, the middle of the $50 to $100 reported.
  - Then PSI's $175 knowledge test and a typical $1,000 checkride.
- A month the bank can't pay stops it, and Take It Up Again goes on from there, straight to the tests if that's where it stopped.
- Qualified, By offers Fly Yourself between American towns: from the airport nearest each, at Textron's published 124 knots, a fifth of an hour for the ground and the climb (SLATE's), within the Skyhawk's 640 nautical miles less the half hour a day flight must keep in its tanks (14 CFR 91.151), paid by the hour. It's its own kind of leg, so no airline's delays or round-trip fares touch it.
- Training and flying abroad (from 2026-09-30, researched in `docs/research/world/research-travel-aviation-boats.json`): living in Britain, Ireland or Canada, Learn To Fly trains for that country's own license over the same six months at a school's published whole cost (the PPL Club's middle of £14,000 to £16,500; Hotel Bravo Flying Club's €175 and €160 an hour for 30 and 25 hours with its fees; the Calgary Flying Club's middle of the C$18,000 to C$25,000 its students spend), and Fly Yourself then rents a four-seater within that country at its school's hourly rate (£265, €160, C$220), on the same weather rule (`PILOT_SCHOOLS`, `licensedIn`). An American certificate rents in America, a country's license in that country. The license's medical abroad isn't priced, none being read.
- A medical abroad and training in Mexico (from 2026-10-01, `MEDICAL_ABROAD` and `PILOT_SCHOOLS` in `systems/aviation.ts`, researched in `docs/research/world/research-aviation-boats-credit-mot.json`): each license abroad asks its own medical, paid with the first month and renewed when it runs out, and a lapsed one grounds its pilot there. Britain's Class 2 at an examiner's £180 and the CAA's £11.67, Ireland's at €200 and the IAA's €22, Canada's Category 3 at C$240 and Transport Canada's C$67.75, Mexico's at AFAC's MX$4,267. It runs 60 months under 40; then 24 in America and Canada, and in Britain and Ireland 24 to 50 and 12 after (MED.A.045), Mexico's taken as ICAO's Annex 1 has it. Mexico's license is trained for at Voláre's MX$212,350 in Guadalajara, the one school that prints a whole course, over article 50's 40 hours, and a 172 rented after at Aviafly's MX$4,500 an hour, as no solo rental rate is published.
- Open, and why: owning an aircraft (built in 7c, below), a medical's renewal and the weather a visual flight needs were open until 2026-09-30: a third-class medical is now paid with the first month's training at the middle of the $125 and $160 two examiners publish (a fee isn't regulated), and renewed when it runs out, every 60 months under 40 and 24 from 40 (14 CFR 61.23), a lapsed one keeping a pilot from flying themselves; and a flight of one's own is refused on a day of fog, under 14 CFR 91.155's three miles, or a thunderstorm, which the FAA's handbook says to keep 20 miles off, at either end (`MEDICAL`, `NOT_VISUAL`, researched in `docs/research/world/research-travel-aviation-boats.json`); the drive to and from the airports was open until 2026-09-30, and a flight of one's own or a charter now has the taxi to its airport and from the far one, at the town's rate card or SLATE's estimate, as an airline journey does; boats were open here, and 7d built them.

Evidence: `tests/aviation.test.ts` (5); 8 mutations, all killed. One first survived: a check that kept airline delays off a self-flown leg, which luck let pass, since most flights are on time. The leg became its own kind, which the delays never read, and the check went.

#### Stage 7c: a plane of one's own (done 2026-09-29)
- Buy A Plane buys a used Cessna 172 at the median asked for one listed, a secondary figure; Vref's and the Bluebook's values are sold, not published, and none depreciates it, so SLATE holds it at its price (`OWN_172` in `systems/aviation.ts`, researched in `docs/research/world/research-aircraft-owning.json`). Owning asks no certificate; flying it oneself does. Until 2026-09-30 an owner who wasn't a pilot kept it on the ground and paid its keeping. Now they hire a pilot: a private pilot may not be paid (14 CFR 61.113(a)) and a commercial one may (61.133(a)(1)), at the one piston rate published, an instructor's at Mike Goulian Aviation, $450 a half day (SLATE's four hours), $900 a full one and half as much again past eight (`HIRED_PILOT_USD`, researched in `docs/research/world/research-charter.json`). The pilot's travel and lodging, the customer's, aren't kept.
- Kept, as its month comes round:
  - A paved tiedown: the Connecticut Airport Authority's $100 for New York and Connecticut, Hayward's city-run $65 for California.
  - Insurance: the middle of a broker's $1,200 to $2,500 (secondary).
  - The annual inspection 14 CFR 91.409 asks: one shop's $1,800 (secondary).
  - The FAA's $5 registration every seven years.
  - The engine overhauled at Lycoming's 2,000 hours or twelve years (SI 1009, revision BF): the middle of a field overhaul's range and its removal (secondary).
- A pilot flies it for its fuel, 10.2 gallons an hour at 75% power (Cessna's 172S information manual), at the region's 100LL from AirNav's 3,480 FBOs, where it was left. The hours go on its engine.
- A loan on a plane (from 2026-09-30, researched in `docs/research/world/research-charter-abroad.json`): AOPA Finance's single-engine terms, the middle of its 6.99% to 9.99%, 15% down on one built from 1960, over 20 years, which it offers on a loan of $75,000 or more, to the record of 700 most aircraft lenders ask (`PLANE_LOAN`). What the bank can't pay is owed; a sale pays it off first.
- A plane taken back (from 2026-10-01, `PLANE_REPO` in `systems/aviation.ts`): three payments missed running, as a car's and a boat's, and the lender retakes it without a court (UCC 9-609), filing the FAA's Form 8050-4, and sells it after the ten days' notice 9-612 makes safe. The shortfall is owed in every one of SLATE's states: California's Unruh Act leaves out an FAA-registered aircraft (Civ. Code 1801.4), and a 172's loan is past the $75,000 Connecticut's consumer act reaches. The retaking costs the middle of the $1,500 to $15,000 a repossession specialist's job is put at (secondary), added as 9-615 allows; a surplus comes back. It goes on the record as a repossession, and its months end with it. Until then a missed payment only ran into arrears.
- Open, and why: a repossession's ferry flight and storage, which nobody publishes; hiring a pilot and a loan were open until 2026-09-30, and are built (above).

Evidence: `tests/aviation.test.ts` (7); 5 mutations, all killed.

#### Stage 7d: a boat of one's own (done 2026-09-30)
- Researched in `docs/research/world/research-boats.json`, with the certificates and registrations in `research-vehiclework.json`; `content/boats.ts`, `systems/boats.ts`, the Cars screen's A Boat.
- The boat: Bayliner's Trophy T18 Bay, 18 feet with a 115 hp Mercury, at $33,543 with its trailer, the maker's nationally advertised price, the one boat whose maker prints both its price and its engine maker's test. Sold where one lives in New York, Connecticut or California. Connecticut's sales tax on a vessel is 2.99% (DRS IP 2021(10)); New York's and California's are the ordinary rate. Held at its price, no depreciation series being researched.
- Registration: New York's $45 for three years; Connecticut's $45 at 18 to 19 feet, taken as yearly; California's $37 in an even year or $65 in an odd one, then $36 every two years.
- Kept, each month: a twelfth of Progressive's $662.51 average policy in its high-cost states. A slip unless the boat stands on its trailer at a house of one's own in its town: New York City Parks' $1,325 a season (read from a search's extract), Greenwich's slip and permit with tax in Connecticut, each season paid in April, and Marina del Rey's 25-foot slip at $17.69 a foot a month (a 2021 survey, secondary).
- Operating it asks the state's certificate, all ages since 2025 in New York (Brianna's Law) and California: New York's by BoatUS's free course and $15 card, Connecticut's $50, California's $10 Boater Card. Owning asks none.
- Take The Boat Out (Look After Yourself): three hours in its town in fine weather, at Mercury's 3.7 gallons an hour, the road's gas and the $1.05 to $1.30 over it New England's fuel docks asked (secondary). It does for the mood what sitting out does, SLATE's estimate, and an interest in nature or sport lifts it more.
- From later on 2026-09-30:
  - Bayliner's own loan, through Brunswick's dealers: $1,500 down, 6.5% over 144 months, the taxes and registration paid at the sale, the $321.05 a month Bayliner prints. It's for "well-qualified" buyers, which Bayliner doesn't define; SLATE takes a record of 740, the start of FICO's "very good" (`BOAT_LOAN`), its estimate. What the bank can't pay is owed, and a sale pays it off first.
  - Moving home, the boat comes on its trailer where a road reaches and the new home is in one of the three states, registered there when the state changes. Anywhere else it stays where it was kept.
- A boat in London and Toronto (from later on 2026-09-30, researched in `docs/research/world/research-boats-abroad.json`): a boat of the T18's size at a dealer's price, each in its own money. London's is Jeanneau's Cap Camarat 5.5 CC with a Honda 100, £39,995 with its VAT, on Honda's own BF100 test's 14.1 liters an hour, taken out with no license or registration, as none is asked at sea; kept on its trailer at Hamble Point Marina on the Solent at £386.55 a meter a year (the drive there isn't kept), fueled at Port Hamble's £2.30 a liter, insured at 1.25% of its value (a Lloyd's broker's 1% to 1.5%, read secondhand). Toronto's is Princecraft's Sport 175 MAX, C$68,235 and 13% HST, on its Mercury 115's burn from the T18's test; the Pleasure Craft Operator Card (BOATsmart's C$49.95) to take it out and Transport Canada's C$24.41 license for five years; Bluffer's Park Marina's season on its trailer from May, C$50 a foot on a 20-foot least, and its winter package from November, C$7 a square foot on a 150-foot least, each with HST, laid up November to April as its marinas' season runs; Cobourg Marina's C$2.45 a liter; insured at Erie Mutual's 1.5% rule (`BOAT_RULES` in `content/boats.ts`). Bayliner's loan is American only, and a boat doesn't follow its owner across a border.
- A boat in Dublin and across the border between America and Canada (from 2026-10-01, researched in `docs/research/world/research-boats-ireland-border.json`). Dublin's is the same Cap Camarat as London's, at the €56,100 with VAT a Dublin dealer asked, read from a listing's excerpt. Ireland asks no license and no registration for a private boat. It's kept ashore at POD Marine in Dún Laoghaire, €360 a season, summer and winter, and insured at the middle of Yachtsman Euromarine's €400 to €900. No marina posts its petrol, so it's fueled at the AA's forecourt average, €1.8686 a liter. Moving home, a boat now crosses between America and Canada. Into Canada it's a settler's effects, free of duty and GST/HST (CBSA's D2-2-1), and Ontario charges no retail sales tax on it. Into America it's free of duty under USMCA; New York charges no use tax on a boat bought while its owner lived elsewhere; Connecticut's 2.99% is charged, its new-resident exemption being written for vehicles; California's rate is charged within 12 months of the purchase, when it presumes one taxable. A financed boat defaulting in Ontario is taken under the Personal Property Security Act's 15 days. A boat winterized on its trailer at home in Ontario was open until 2026-10-01 too, and is now Shrink Wrap Muskoka's C$185 with HST, a service that comes to the boat.
- Open, and why: a boat carried between Britain and Ireland by the Northern Irish road, neither country's relief being read for one; whether California credits Ontario's HST as tax paid elsewhere.
- The Northeast's winter and a boat loan in default (from 2026-09-30, researched in `docs/research/world/research-travel-aviation-boats.json`): New York's and Connecticut's insurers lay a boat up from 1 November to 1 April and it isn't taken out then; each November it's hauled and stored (Burr's Marina in New London at $72 a foot, Moriches on Long Island at $75), or winterized on its trailer at home (Long Lake Marine's $599 for a 61 to 200 hp outboard, the one dealer's price read, in Maine). California's runs the year round. Three payments missed running, the lender takes the boat back and the record takes a repossession's mark: New York's and California's under the UCC's Article 9 (the Unruh Act reaching a boat only to $25,000 and the Rees-Levering Act none), sold after SLATE's ten days and the shortfall owed; Connecticut's under 36a-785, which covers a boat on credit to $75,000, from 15 days and a shortfall only past its fair market value, SLATE's held price (`BOAT_WINTER`, `BOAT_REPO` in `content/boats.ts`). Until then the boat went out all winter and a default only ran arrears.

Evidence: `tests/boats.test.ts` (9); 13 mutations, all killed in the end. Three first survived for want of a test (a second renewal, California's odd year, the outing's mood against sitting out's); one was a redundant guard, since a boat's months are canceled on its sale, and it was removed. The loan and the move: 4 more tests (13 in all), 12 mutations, all killed in the end; three first survived for want of a test (a move within the state, a road into Ontario, a real move home).

#### Stage 7e: crew and charter (done 2026-09-30)
- Researched in `docs/research/world/research-charter.json`.
- A hired pilot: an owner who isn't a pilot has their own plane flown by a commercial pilot (Stage 7c, above), at the one published piston rate.
- Charter A Boat (Look After Yourself): out on the water with a captain, no boat and no certificate of one's own; a vessel for hire is run by a captain with the Coast Guard's six-pack license (46 CFR 15.605). New York City: Go Sailing NYC's $1,050 for three hours and the 18% to 22% gratuity it suggests, the middle. Connecticut, on the Sound: Island Mike's $600 for four hours from Norwalk, which asks none. It does what an outing in one's own boat does.
- From later on 2026-09-30 (`docs/research/world/research-charter-abroad.json`): Charter A Boat from Marina del Rey (OnBoat's $875 for three hours, and the middle of the 10% to 15% it suggests), on the Thames (Thames RIB Experience's £799 for seventy minutes, no tip, as none is customary in Britain) and from Toronto's harbourfront (the Nautical Centre's Niagara 35 for two hours and its skipper, the sum SLATE's, and Canada's customary 15% to 20%).
- Vancouver and Dublin (from 2026-10-01): SeaSky Cruises' captained pontoon from False Creek, C$249 an hour on a weekday, two at least, captain and fuel in, with 5% GST and Canada's customary 15% to 20%; and Ireland's Eye Ferries' private boat from Howth, €500 for three hours with its harbor walk, for up to eleven, no tip customary. Until then no charter was kept there, only marketplaces or a 2012 page having been read.
- Open, and why: a jet chartered was open here until 7f (below).
- A car and driver (from 2026-10-01): Travel's By offers A Car And Driver between towns by road, at the hourly rate a company in the city it leaves from prints for a sedan, for the hours on the road and at least its minimum, with its taxes: Gotham Ride's $117 in New York (two hours, its gratuity and tolls in), iChauffeur's £60 in London (three, with VAT), All City Chauffeurs' €70 in Dublin (four; its page last dated 2022), Rosedale Limousine's C$78 in Toronto (two, with HST), the middle of the Passenger Transportation Board's C$75 to C$150 in Vancouver (with GST), and Safe&Confidence's MX$5,400 ten-hour day in Mexico City (with IVA) (`CHAUFFEURS`, `planChauffeur` in `systems/journey.ts`). The car's way back, priced by quote, isn't kept; no Los Angeles or New Haven company's rate was read firsthand. A company's fixed fare for a pair of towns (Blackberry Cars' £120 from London to Oxford, Rideline's from JFK to the Hamptons, Chauffeuropolis's C$200 to Niagara Falls) isn't used, since none joins two of SLATE's towns. Until then a chauffeur was researched and nothing used one.

Evidence: `tests/boats.test.ts` (16 in all) and `tests/aviation.test.ts` (7, the plane's own test now hiring a pilot); 10 mutations, all killed.

#### Stage 7f: a light jet chartered (done 2026-09-30)
- Travel's By offers A Chartered Light Jet between two American airports (`planCharterJet` in `systems/aviation.ts`, researched in `docs/research/world/research-charter.json`): Textron's Citation CJ3 Gen2 at its published 416 knots and 2,040 nautical miles, less the 45 minutes an instrument flight holds in reserve (14 CFR 91.167). Past that it stops once for fuel, as a light jet crossing the country does; farther, such as Honolulu, it's refused. The half hour taxiing and climbing each time, and 45 minutes on the ground refueling, are SLATE's.
- Billed at the middle of Paramount Business Jets' $3,750 to $4,200 an hour for a light jet, for the flight there and the jet's flight back, as a one-way charter is billed: evoJets' $45,100 to $55,100 for Teterboro to Van Nuys is about twice one way's hours. At least Paramount's two hours. On top, the 7.5% federal excise tax and the 2026 segment fee of $5.30 (26 USC 4261, Rev. Proc. 2025-32). Canceled ahead, SLATE refunds it whole; no operator's terms were read.
- Found on the way, and fixed: a flight of one's own offered the airline's 8 AM, 1 PM and 7 PM on Travel but booked 7, 8 and 9 AM. It now offers the hours its plan books, 7 AM to 5 PM. And a domestic flight of one's own asked for a passport: the border check read the first leg's airport code as a town in another country (`bookRefusal` in `systems/journey.ts`, since 7b). It now takes the journey's towns. Its legs read Chartered Jet, Your Plane, or Your Plane, A Hired Pilot, where they read Flown Yourself.
- A light jet chartered within Britain or Canada (from 2026-09-30, researched in `docs/research/world/research-charter-abroad.json`): the same CJ3 and the same billing, at ACC Aviation's £2,600 an hour for a light jet with 20% VAT (only aircraft built for ten passengers or more are zero-rated; no Air Passenger Duty below 5.7 tonnes), and at the middle of Novajet's C$3,000 to C$5,000 an hour with GST, or Ontario's 13% HST, where it leaves from (CRA's GI-170) (`JET_ABROAD`).
- Ireland, Mexico and two borders (from 2026-10-01, `JET_ABROAD` in `systems/aviation.ts`): Ireland at LunaJets' €5,950 an hour, the middle of a Geneva broker's own table for a light jet, with no VAT on passenger transport; Mexico at Aerolíneas Ejecutivas' US$3,000 an hour, as El Financiero printed it in 2013, the latest operator's rate found, with IVA. Between Britain and Ireland and between America and Mexico a jet is chartered at the rate of the country it leaves: Britain zero-rates and Ireland exempts a flight abroad, and Air Passenger Duty spares a light jet until April 2027; Mexico taxes 4% of an international fare (a quarter at 16%); America charges its $23.40 international facilities tax in place of the 7.5% excise. Until then a jet was chartered within America, Britain and Canada only.
- Not kept, by design: an empty leg's cheaper seat. EBAA's 2017 study found 41% of Europe's business flights flying empty, which says how many fly, not whether one is offered on a given route and day; VistaJet and Paramount put the seat at 25% to 75% off, but no operator publishes how often one's offered, so SLATE can't say when one's there.
- America and Canada (from later on 2026-10-01, `docs/research/world/research-open-final.json`): a jet between them at the rate of the country it leaves. To a Canadian airport within 225 miles of the United States it's taxed as a domestic flight (IRC 4262), the 7.5% and its segment fee and no facilities tax; past 225 miles, the facilities tax. SLATE measures to the nearest American airport, never nearer than the border, so a town just inside the zone can count as outside. From Canada, a Canadian operator's fare paid outside America pays the facilities tax in place of the 7.5% (4261(e)(2)), and CRA's 5% GST, not HST, as the continental United States is in its taxation area (GI-170). The flight-by-flight answers are the statute's reading; the IRS prints no Canadian example.

Evidence: `tests/aviation.test.ts` (10); 8 mutations, all killed in the end. One first survived, the range past which no stop suffices, which no test reached until a flight to Honolulu.

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
