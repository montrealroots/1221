# Data gaps, and how each number is got

Each thing left out of a stage (`docs/BACKLOG.md`) waits on a figure nobody
publishes as a summary. Where an open raw dataset holds the answer, a tool in
`tools/data/` computes it, writes what it found to `docs/research/world/`
with the source and the date read, and writes the engine's copy into
`src/engine/content/`. Rerun a tool to refresh its figure. Where no dataset
exists, this file says so, and the item stays out.

| Gap | Stage | How the number is got | Status |
|---|---|---|---|
| Weather days a building contract counts | 12 | NOAA GHCN-Daily, each town's station, days over 0.10 inch, 1996 to 2025: `tools/data/wetdays.mjs` | Got. A build's outdoor stage is held up by a wetter stretch than usual (`weatherDelay`). |
| A household's energy, abroad and at today's prices | 11 | Each country's household spending survey (Statistics Canada 2019, ONS FYE 2020, CSO HBS 2022-23 at 2020 prices, INEGI ENIGH 2020 by hand) against the EIA's American $1,884, and each place's household energy price index to 2025 (BLS, ONS, Eurostat, Statistics Canada; Mexico's needs INEGI's token): `tools/data/energy.mjs` | Got. A home's energy reads its province's or country's survey at 2025's prices (`energyScale`); until then America's stayed at 2020's and Mexico City's ran four times what its households spend. |
| Electricity, gas and water billed tariff by tariff | 11 | A home's metered kWh and cubic meters, which SLATE doesn't keep; the money a home spends is the surveys' above | Out |
| A visitor's price for care in England | 9 | The Charges to Overseas Visitors Regulations 2015 (A&E and a GP free, a stay at 150% of tariff) and the National Cost Collection's average non-elective stay, £4,852 (2022/23), read by hand from HFMA: NHS England and HFMA turn scripts away | Got. A visitor's stay in England is billed so (`ENGLAND_VISITOR`). |
| A visitor's price for care in Ontario, British Columbia, Ireland and Mexico | 9 | The hospitals' own charges for patients from abroad, read by hand (Michael Garron in Toronto, Providence in Vancouver by a search's summary, St Vincent's in Dublin), and the IMSS's unit costs for non-members from the DOF: `tools/data/imss.mjs` | Got. A visitor's care there is charged so (`VISITOR_CARE`). |
| A visitor's price for care in Scotland, and an Ontario doctor's visit | 9 | NHS Scotland's charging and Ontario's uninsured walk-in prices aren't published as a standard figure | Out |
| A failed building inspection | 12 | Los Angeles's LADBS inspection records since 2023 (data.lacity.org), counted to each kind's share of visits failed: foundation 38%, framing 38%, rough 48%, final 37%: `tools/data/inspections.mjs`. NYC Open Data and Toronto publish requests, not results | Got. A house's inspection fails at those odds, waiting a reinspection's days and paying its fee (`buildInspectionFails`). |
| A GP appointment's wait in Ireland, Canada and Mexico City | 9 | Surveys publish the share seen the same or next day, but the only thing a wait would change is somebody going to urgent care instead, and no source measures how often that happens | Out |
| Pickleball's energy | 12 | Doubles measured by portable calorimetry at 4.1 METs (15 adults, mean age 65); the singles figures read are a summary's | Got. A pickleball court is built and played on (`COURT_MET`). |
| An architect's fee | 12 | No open dataset: fees are private contracts, and the bodies withdrew their scales | Out |
| Bids, change orders, overruns, lateness | 12 | No open dataset for homes; public works' contract data doesn't describe a house | Out |
| A counteroffer over scale, an agent's increment | 13 | No open dataset: deals are private | Out |
| The Oscars', Tonys', Oliviers' and Ariels' fields of performances | 13 | Each academy's list of eligible productions, matched to IMDb's public datasets (title.basics, title.principals) and their credited performers counted: a large download and a title-matching job | To build |
| Hotel requests granted | 6 | No open dataset | Out |
| Used clothes' resale prices | 3 | Resale platforms' sold listings aren't open data | Out |
| Labor rates by shop, upholstery, audio, wheel fitment | 8 | Shops' rate cards where posted; no open dataset | Out |
| Gardeners, instructors, trades | 11 | Prices are researched; the effect needs a yard's growth or a lesson's gain, which no open dataset measures | Out |
| Adoption, surrogacy, custody, caring for parents | 10 | Published, but SLATE's life has no parents and no separation's children to apply them to | Out |
