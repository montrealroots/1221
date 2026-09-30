/**
 * SLATE — a night in a hotel, by town: the published average daily rate
 * (ADR, what a room sold for on average over a year, from CoStar/STR, a
 * national statistics office or the city's own figures), and the taxes and
 * charges a guest pays on top of it. Researched 2026-09-29; kept with its
 * sources in `docs/research/world/research-hotels.json`. A town without a
 * published average takes the US government's lodging per diem for it, a
 * ceiling set from its market's hotel rates, and says so (`PER_DIEM`).
 *
 * The ADR is what the market sold, all classes together, so a night at it is
 * a mid-market room. Taxes: percentages on top of the rate, stacked as the
 * law stacks them; charges per room per night, and per person per night.
 * A tax included in the price (the UK's VAT, Ireland's, Australia's GST) isn't
 * added again.
 */

export interface StayRate {
  adr: number | null;
  currency: string;
  year: string;
  basis: string;
  source: string;
  /** Taxes on top of the rate, as one share. */
  onTop: number;
  perRoomNight: number;
  perPersonNight: number;
  taxNote: string;
}

const s = (adr: number | null, currency: string, year: string, basis: string, source: string, onTop: number, perRoomNight: number, perPersonNight: number, taxNote: string): StayRate =>
  ({ adr, currency, year, basis, source, onTop, perRoomNight, perPersonNight, taxNote });

export const STAYS: Readonly<Record<string, StayRate>> = {
  'us-ny-newyork': s(333.71, 'USD', '2025', 'All hotels, New York City, CoStar', 'https://www.hoteldive.com/news/hotel-occupancy-revpar-decline-2025/810212/', 0.08875 + 0.05875, 3.5, 0, 'Sales tax 8.875%, the Hotel Room Occupancy Tax 5.875%, the city’s $2 unit charge and the state’s $1.50 Javits fee.'),
  'us-ca-losangeles': s(196, 'USD', '12 months to November 2025', 'All hotels, Los Angeles, CoStar as reported', 'research-hotels.json', 0.16, 0, 0, 'The city’s 14% Transient Occupancy Tax and 2% at a hotel of 50 rooms or more.'),
  'us-il-chicago': s(243.1, 'USD', '2025', 'Downtown hotels, STR via Choose Chicago', 'research-hotels.json', 0.1739 + 0.015, 0, 0, 'About 17.39% combined, and 1.5% at a downtown hotel of 100 rooms or more since 1 May 2026.'),
  'us-ga-atlanta': s(null, 'USD', '', '', '', 0.169, 5, 0, 'Sales tax 8.9%, hotel-motel tax 8% and the state’s $5 a night.'),
  'us-la-neworleans': s(null, 'USD', '', '', '', 0.1635, 1, 0, 'About 16.35% combined, as last published in 2019, and $0.50 to $2 a night by the hotel’s size: SLATE’s $1.'),
  'us-dc-washington': s(null, 'USD', '', '', '', 0.1595, 0, 0, 'The District’s 15.95%, extended to September 2027.'),
  'us-ma-boston': s(232, 'USD', '2025', 'Eastern Massachusetts market, CoStar; the city runs higher', 'research-hotels.json', 0.1495, 0, 0, 'State 5.7%, city 6.5% and the convention center’s 2.75%.'),
  'us-ca-sanfrancisco': s(225.82, 'USD', '2025', 'All hotels, San Francisco, CoStar', 'research-hotels.json', 0.14 + 0.02, 0, 0, 'The 14% Transient Occupancy Tax and a tourism district fee of about 2%.'),
  'us-fl-miami': s(222.04, 'USD', '2024', 'Miami-Dade, STR via the Greater Miami Convention & Visitors Bureau', 'research-hotels.json', 0.13, 0, 0, 'The City of Miami’s 13%.'),
  'us-nv-lasvegas': s(199.79, 'USD', '2025', 'Las Vegas, CoStar', 'research-hotels.json', 0.1338, 0, 0, 'The Strip’s 13.38%.'),
  'us-ct-newhaven': s(null, 'USD', '', '', '', 0.15, 0, 0, 'Connecticut’s 15% room occupancy tax.'),
  'uk-eng-london': s(228, 'GBP', '2024', 'Knight Frank’s London panel, leaning upscale; 2025 was reported broadly in line', 'research-hotels.json', 0, 0, 0, 'VAT of 20% is in the price, and London has no visitor levy yet.'),
  'ca-on-toronto': s(260.77, 'CAD', '2025', 'All hotels, Toronto, CoStar', 'research-hotels.json', 1.06 * 1.13 - 1, 0, 0, 'The 6% Municipal Accommodation Tax since 1 August 2026, and 13% HST on the room and the tax.'),
  // Vancouver's 2.5% major-events tax, in force to 31 January 2030, from 2026-10-01; GST falls on the other taxes too, as the Ministry of Finance says (research-stays-rentals.json).
  // Victoria (from 2026-09-30, docs/research/world/research-victoria.json): the Greater Victoria Hotel Development Working Group’s 2025 average, on CoStar’s data; some hotels add a 1% destination fee, not kept.
  'ca-02-victoria': s(224, 'CAD', '2025', 'Greater Victoria’s hotels, the Hotel Development Working Group’s report of April 2026, on CoStar’s data', 'research-victoria.json', (1 + 0.08 + 0.03) * 1.05 - 1, 0, 0, 'GST 5% on the room and the other taxes, PST 8% and the 3% Municipal and Regional District Tax.'),
  'ca-bc-vancouver': s(284.44, 'CAD', '2025', 'All hotels, Vancouver, CoStar', 'research-hotels.json', (1 + 0.08 + 0.03 + 0.025) * 1.05 - 1, 0, 0, 'GST 5% on the room and the other taxes, PST 8%, the 3% Municipal and Regional District Tax and the 2.5% major-events tax to 31 January 2030.'),
  // Belfast and Edinburgh from 2026-09-29 (docs/research/world/research-buses-transit.json): both averages read secondhand.
  'uk-nir-belfast': s(116.18, 'GBP', '2025', 'All of Northern Ireland, the NI Hotels Federation as the Irish News reported it; NISRA publishes no rate', 'research-buses-transit.json', 0, 0, 0, 'VAT of 20% is in the price, and Belfast has no visitor levy.'),
  // Edinburgh's visitor levy is 5% of the price before VAT, so about 4.17% of a price with it; its cap at five nights isn't kept.
  'uk-sct-edinburgh': s(161.08, 'GBP', '2024', 'Edinburgh, CoStar as reported; VisitScotland ended its survey after 2024', 'research-buses-transit.json', 0.05 / 1.2, 0, 0, 'VAT of 20% is in the price; the city’s visitor levy, 5% of the price before VAT, on stays from 24 July 2026.'),
  'ie-lei-dublin': s(178, 'EUR', '2025', 'Dublin, Crowe and JLL', 'research-hotels.json', 0, 0, 0, 'VAT of 13.5% is in the price.'),
  'is-39-reykjavik': s(null, 'ISK', '', '', '', 0, 800, 0, 'ISK 800 a room a night; VAT of 11% is in the price.'),
  'de-be-berlin': s(null, 'EUR', '', '', '', 0.075, 0, 0, 'Berlin’s City Tax of 7.5%; VAT of 7% is in the price.'),
  'fr-idf-paris': s(239, 'EUR', '2025', 'Paris within its limits, In Extenso’s panel', 'research-hotels.json', 0, 0, 8.45, 'The taxe de séjour a guest pays each night at a four-star hotel, €8.45 in 2026, SLATE’s class for the average; VAT of 10% is in the price.'),
  'es-md-madrid': s(169.13, 'EUR', '2025', 'Madrid, the INE’s twelve months averaged', 'research-hotels.json', 0, 0, 0, 'VAT of 10% is in the price, and Madrid has no tourist tax.'),
  'jp-13-tokyo': s(34_800, 'JPY', '2025', 'Tokyo, STR as quoted', 'research-hotels.json', 0, 0, 200, 'Tokyo’s accommodation tax, ¥200 a guest a night on a room of ¥15,000 or more; consumption tax is in the price.'),
  'kr-11-seoul': s(null, 'KRW', '', '', '', 1.1 * 1.1 - 1, 0, 0, 'VAT of 10% and the 10% service charge a hotel adds, each on top: SLATE’s reading of how Seoul’s hotels quote.'),
  // An average from 2026-10-01 (research-stays-rentals.json): Monex's November 2024 figure, the latest published, secondhand.
  'mx-cmx-mexicocity': s(1_600, 'MXN', 'November 2024', 'Mexico City hotels, Monex’s research note; DataTur publishes occupancy, not rates', 'research-stays-rentals.json', 0.16 + 0.035, 0, 0, 'VAT of 16% and the capital’s 3.5% lodging tax, on top.'),
  'au-nsw-sydney': s(334, 'AUD', '2025', 'Sydney, CBRE', 'research-hotels.json', 0, 0, 0, 'GST of 10% is in the price.'),
  'br-27-saopaulo': s(602, 'BRL', '2025', 'Chain hotels, HotelInvest and FOHB', 'research-hotels.json', 0.05 + 0.1, 0, 0, 'The city’s 5% service tax, and the 10% service charge hotels add.'),
  'nz-akl-auckland': s(null, 'NZD', '', '', '', 0, 0, 0, 'GST of 15% is in the price.'),
  'lv-25-riga': s(null, 'EUR', '', '', '', 0, 0, 1, 'Riga’s €1 a guest a night in 2026; VAT of 12% is in the price.'),
};

/**
 * The US government's lodging per diem, for the towns without a published
 * average: GSA's for fiscal 2026 in the United States, the State
 * Department's abroad. A ceiling for a government traveler, set from the
 * market's hotel rates: a mid-range business hotel, not a resident's rent.
 */
export const PER_DIEM: Readonly<Record<string, { usd: number; effective: string; source: string }>> = {
  'us-ga-atlanta': { usd: 185.75, effective: 'FY2026, $197 January to March and $182 the rest, averaged', source: 'https://www.gsa.gov/travel/plan-book/per-diem-rates' },
  'us-la-neworleans': { usd: 158.33, effective: 'FY2026, $133 to $179 by season, averaged', source: 'https://www.gsa.gov/travel/plan-book/per-diem-rates' },
  'us-dc-washington': { usd: 233.67, effective: 'FY2026, $183 to $276 by season, averaged', source: 'https://www.gsa.gov/travel/plan-book/per-diem-rates' },
  'us-ct-newhaven': { usd: 130, effective: 'FY2026', source: 'https://www.gsa.gov/travel/plan-book/per-diem-rates' },
  'is-39-reykjavik': { usd: 422.67, effective: '$592 June to September and $338 the rest, averaged', source: 'https://allowances.state.gov (State Department foreign per diem, 09/01/2026 edition)' },
  'de-be-berlin': { usd: 271, effective: 'from August 2025', source: 'https://allowances.state.gov (State Department foreign per diem, 09/01/2026 edition)' },
  'kr-11-seoul': { usd: 245, effective: 'from September 2026', source: 'https://allowances.state.gov (State Department foreign per diem, 09/01/2026 edition)' },
  'mx-cmx-mexicocity': { usd: 250, effective: 'from March 2026', source: 'https://allowances.state.gov (State Department foreign per diem, 09/01/2026 edition)' },
  'nz-akl-auckland': { usd: 230, effective: 'from May 2026', source: 'https://allowances.state.gov (State Department foreign per diem, 09/01/2026 edition)' },
  'lv-25-riga': { usd: 217, effective: 'from August 2025', source: 'https://allowances.state.gov (State Department foreign per diem, 09/01/2026 edition)' },
};
