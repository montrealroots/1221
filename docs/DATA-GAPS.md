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
| Electricity, gas and water by tariff | 11 | A home's use: EIA's average residential kWh by state, Ofgem's typical consumption values, and the utilities' own averages, against the researched tariffs | To build |
| A visitor's price for care in England | 9 | The Charges to Overseas Visitors Regulations 2015 (A&E and a GP free, a stay at 150% of tariff) and the National Cost Collection's average non-elective stay, £4,852 (2022/23), read by hand from HFMA: NHS England and HFMA turn scripts away | Got. A visitor's stay in England is billed so (`ENGLAND_VISITOR`). |
| A visitor's price for care in Ireland, Canada, Mexico and Scotland | 9 | The HSE's and the provinces' published non-resident charges | To research |
| A failed building inspection | 12 | Inspection results in NYC Open Data and Toronto's open data, counted to a first-time failure rate | To build |
| A GP appointment's wait in Ireland, Canada and Mexico City | 9 | National surveys' published shares (Commonwealth Fund, CIHI, ENSANUT), where their microdata or tables give one | To research |
| Pickleball's energy | 12 | Measured METs in published studies of pickleball play | To research |
| An architect's fee | 12 | No open dataset: fees are private contracts, and the bodies withdrew their scales | Out |
| Bids, change orders, overruns, lateness | 12 | No open dataset for homes; public works' contract data doesn't describe a house | Out |
| A counteroffer over scale, an agent's increment | 13 | No open dataset: deals are private | Out |
| The Oscars', Tonys', Oliviers' and Ariels' fields of performances | 13 | The academies' eligibility lists, counted to performances | To research |
| Hotel requests granted | 6 | No open dataset | Out |
| Used clothes' resale prices | 3 | Resale platforms' sold listings aren't open data | Out |
| Labor rates by shop, upholstery, audio, wheel fitment | 8 | Shops' rate cards where posted; no open dataset | Out |
| Gardeners, instructors, trades | 11 | Prices are researched; the effect needs a yard's growth or a lesson's gain, which no open dataset measures | Out |
| Adoption, surrogacy, custody, caring for parents | 10 | Published, but SLATE's life has no parents and no separation's children to apply them to | Out |
