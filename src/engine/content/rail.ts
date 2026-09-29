/**
 * SLATE — intercity trains (docs/WORLD.md, stage 2c), from 2026-09-29,
 * researched from the operators' own timetables and fare tables and kept in
 * `docs/research/world/research-rail.json`.
 *
 * Times are the weekday median from each operator's timetable (Amtrak's
 * PDFs of 27 September 2026, the MTA's and the NTA's official GTFS feeds,
 * Avanti's May to December 2026 book), or the operator's own figure where no
 * timetable could be read. When a train leaves is SLATE's model: the day's
 * departures spread evenly over the day at the operator's weekday count.
 * Punctuality is each operator's, on its own measure of late.
 *
 * Fares, route by route: the MTA's, Irish Rail's and Avanti's published
 * fares as they are; Amtrak's, which it doesn't publish (its pricing is
 * dynamic), derived from its own FY2025 route results, gross ticket revenue
 * over passenger-miles, times the route's miles; Eurostar's, whose "from"
 * prices are floors most pay more than, Eurostar Group's 2025 revenue over
 * its passengers. Each fare says which it is.
 *
 * Not in SLATE's cities yet, so not kept: Belfast (the Enterprise from
 * Dublin), Edinburgh (LNER from London), Toluca (El Insurgente).
 */

import type { Money } from '../core/money';

export interface RailFare {
  /** Cents in `currency`. */
  amount: Money;
  currency: string;
  basis: string;
  /** A dearer fare on a weekday at these hours of departure, local time, where the operator has one. */
  peak?: { amount: Money; fromHour: number; toHour: number; basis: string };
}

export interface RailRoute {
  id: string;
  operator: string;
  service: string;
  /** City ids, and the stations, one way; the route runs both ways. */
  from: string;
  to: string;
  fromStation: string;
  toStation: string;
  /** Weekday median minutes, station to station. */
  minutes: number;
  /** Weekday trains each way. */
  perDay: number;
  /** A route's miles for a fare by the mile; Amtrak's only. */
  miles?: number;
  fare: RailFare;
  /** How long before a train the operator asks you to be there. */
  arriveBeforeMinutes: number;
  arriveBasis: string;
  /** The share of trains on time, and how late is late on the operator's measure. */
  onTime: { share: number; withinMinutes: number; basis: string };
  /** What a ticket canceled brings back: the share kept, the free window after buying, the last hour before the train, and a fee. */
  refund: { keepShare: number; freeWithinHours?: number; untilHoursBefore?: number; fee?: Money; feeCurrency?: string; basis: string };
  /** Passport control before boarding, as Eurostar's juxtaposed controls in London are. */
  borderBeforeBoarding?: boolean;
  source: string;
}

/**
 * Amtrak's FY2025 route results, YTD September (its Monthly Performance
 * Report, table 8): Acela's gross ticket revenue $569.7 million over 639.1
 * million passenger-miles, the Northeast Regional's $970.2 million over
 * 2,062.0 million. A fare by the mile, the average across every fare family
 * Amtrak sells.
 */
export const AMTRAK_PER_MILE = {
  acela: 569.7 / 639.1,
  regional: 970.2 / 2_062.0,
  source: 'https://www.amtrak.com/content/dam/projects/dotcom/english/public/documents/corporate/monthlyperformancereports/2025/Amtrak-Monthly-Performance-Report-September-2025.pdf',
} as const;

/**
 * The Northeast Corridor's miles: the FRA's New York to Washington, 226,
 * and New York to Boston by the Shore Line, 231, read secondhand. Philadelphia
 * and New Haven are SLATE's estimate: the straight line there, stretched as
 * much as the corridor's two long segments stretch theirs (`necMiles` in
 * `systems/rail.ts`).
 */
export const NEC_MILES = { newYorkWashington: 226, newYorkBoston: 231, source: 'FRA Northeast Corridor facts, as quoted' } as const;

/** Late, how much later than the operator's line: SLATE's estimate, the operators publishing no spread. */
export const RAIL_LATE_MEAN_MINUTES = 20;
/** A station in town: SLATE's estimate of the ride to it, by taxi. */
export const STATION_KM = 5;

const amtrakFare = (perMile: number, miles: number, service: string): RailFare => ({
  amount: Math.round(perMile * miles * 100),
  currency: 'USD',
  basis: `SLATE’s derivation: Amtrak’s FY2025 ${service} ticket revenue per passenger-mile, $${perMile.toFixed(3)}, times ${Math.round(miles)} miles; Amtrak publishes no fares.`,
});
const AMTRAK_ARRIVE = { arriveBeforeMinutes: 30, arriveBasis: 'Amtrak asks 30 minutes early.' };
const AMTRAK_REFUND = { keepShare: 0.3, freeWithinHours: 24, basis: 'Amtrak’s Value fare: 30% kept when canceled, all of it back within 24 hours of buying.' };
const ACELA_ON_TIME = { share: 0.753, withinMinutes: 10, basis: 'Amtrak, Acela, the 12 months to August 2026' };
const NER_ON_TIME = { share: 0.767, withinMinutes: 15, basis: 'Amtrak, Northeast Regional, the 12 months to August 2026' };
const AMTRAK_SRC = 'Amtrak Acela and Northeast Regional timetables, 27 September 2026';

const EUROSTAR_FARE: RailFare = {
  amount: 100_00, currency: 'EUR',
  basis: 'SLATE’s estimate: Eurostar Group’s 2025 revenue, over €2 billion, over its passengers, over 20 million, both read secondhand and across its continental routes too. Its “from” fares, £39 Standard, are floors.',
};
const EUROSTAR_COMMON = {
  arriveBeforeMinutes: 75,
  arriveBasis: 'Eurostar recommends 75 minutes at St Pancras; its gates close 30 minutes before.',
  onTime: { share: 0.833, withinMinutes: 15, basis: 'Eurostar, April 2025 to March 2026' },
  refund: { keepShare: 0, untilHoursBefore: 7 * 24, fee: 25_00, feeCurrency: 'GBP', basis: 'Eurostar Standard: refunded 7 days or more before, less £25 a leg.' },
  borderBeforeBoarding: true,
};

export const RAIL_ROUTES: readonly RailRoute[] = [
  { id: 'nec-nyp-was-acela', operator: 'Amtrak', service: 'Acela', from: 'us-ny-newyork', to: 'us-dc-washington', fromStation: 'New York Penn Station', toStation: 'Washington Union Station', minutes: 180, perDay: 19, miles: NEC_MILES.newYorkWashington, fare: amtrakFare(AMTRAK_PER_MILE.acela, NEC_MILES.newYorkWashington, 'Acela'), ...AMTRAK_ARRIVE, onTime: ACELA_ON_TIME, refund: AMTRAK_REFUND, source: AMTRAK_SRC },
  { id: 'nec-nyp-was-ner', operator: 'Amtrak', service: 'Northeast Regional', from: 'us-ny-newyork', to: 'us-dc-washington', fromStation: 'New York Penn Station', toStation: 'Washington Union Station', minutes: 215, perDay: 37, miles: NEC_MILES.newYorkWashington, fare: amtrakFare(AMTRAK_PER_MILE.regional, NEC_MILES.newYorkWashington, 'Northeast Regional'), ...AMTRAK_ARRIVE, onTime: NER_ON_TIME, refund: AMTRAK_REFUND, source: AMTRAK_SRC },
  { id: 'nec-nyp-bos-acela', operator: 'Amtrak', service: 'Acela', from: 'us-ny-newyork', to: 'us-ma-boston', fromStation: 'New York Penn Station', toStation: 'Boston South Station', minutes: 238, perDay: 10, miles: NEC_MILES.newYorkBoston, fare: amtrakFare(AMTRAK_PER_MILE.acela, NEC_MILES.newYorkBoston, 'Acela'), ...AMTRAK_ARRIVE, onTime: ACELA_ON_TIME, refund: AMTRAK_REFUND, source: AMTRAK_SRC },
  { id: 'nec-nyp-bos-ner', operator: 'Amtrak', service: 'Northeast Regional', from: 'us-ny-newyork', to: 'us-ma-boston', fromStation: 'New York Penn Station', toStation: 'Boston South Station', minutes: 268, perDay: 19, miles: NEC_MILES.newYorkBoston, fare: amtrakFare(AMTRAK_PER_MILE.regional, NEC_MILES.newYorkBoston, 'Northeast Regional'), ...AMTRAK_ARRIVE, onTime: NER_ON_TIME, refund: AMTRAK_REFUND, source: AMTRAK_SRC },
  { id: 'nec-bos-was-acela', operator: 'Amtrak', service: 'Acela', from: 'us-ma-boston', to: 'us-dc-washington', fromStation: 'Boston South Station', toStation: 'Washington Union Station', minutes: 422, perDay: 9, miles: NEC_MILES.newYorkBoston + NEC_MILES.newYorkWashington, fare: amtrakFare(AMTRAK_PER_MILE.acela, NEC_MILES.newYorkBoston + NEC_MILES.newYorkWashington, 'Acela'), ...AMTRAK_ARRIVE, onTime: ACELA_ON_TIME, refund: AMTRAK_REFUND, source: AMTRAK_SRC },
  { id: 'nec-bos-was-ner', operator: 'Amtrak', service: 'Northeast Regional', from: 'us-ma-boston', to: 'us-dc-washington', fromStation: 'Boston South Station', toStation: 'Washington Union Station', minutes: 503, perDay: 15, miles: NEC_MILES.newYorkBoston + NEC_MILES.newYorkWashington, fare: amtrakFare(AMTRAK_PER_MILE.regional, NEC_MILES.newYorkBoston + NEC_MILES.newYorkWashington, 'Northeast Regional'), ...AMTRAK_ARRIVE, onTime: NER_ON_TIME, refund: AMTRAK_REFUND, source: AMTRAK_SRC },
  // Philadelphia's and New Haven's miles and fares are filled by `systems/rail.ts` from the corridor's stretch.
  { id: 'nec-nyp-phl-ner', operator: 'Amtrak', service: 'Northeast Regional', from: 'us-ny-newyork', to: 'us-pa-philadelphia', fromStation: 'New York Penn Station', toStation: 'Philadelphia 30th Street Station', minutes: 90, perDay: 41, fare: { amount: 0, currency: 'USD', basis: '' }, ...AMTRAK_ARRIVE, onTime: NER_ON_TIME, refund: AMTRAK_REFUND, source: AMTRAK_SRC },
  { id: 'nec-nyp-nhv-ner', operator: 'Amtrak', service: 'Northeast Regional', from: 'us-ny-newyork', to: 'us-ct-newhaven', fromStation: 'New York Penn Station', toStation: 'New Haven Union Station', minutes: 109, perDay: 23, fare: { amount: 0, currency: 'USD', basis: '' }, ...AMTRAK_ARRIVE, onTime: NER_ON_TIME, refund: AMTRAK_REFUND, source: AMTRAK_SRC },
  {
    id: 'mnr-nhv-gct', operator: 'Metro-North Railroad', service: 'New Haven Line', from: 'us-ct-newhaven', to: 'us-ny-newyork', fromStation: 'New Haven Union Station', toStation: 'Grand Central Terminal', minutes: 122, perDay: 45,
    fare: { amount: 20_25, currency: 'USD', basis: 'The MTA’s off-peak one-way fare, New Haven to Grand Central, from 1 July 2026.', peak: { amount: 27_25, fromHour: 5, toHour: 9, basis: 'The MTA’s peak one-way fare, a weekday morning train toward New York (SLATE reads the peak as 5 to 9 in the morning).' } },
    arriveBeforeMinutes: 10, arriveBasis: 'No time asked: SLATE’s 10 minutes to buy and board.',
    onTime: { share: 0.978, withinMinutes: 5, basis: 'Metro-North, 2025, system-wide, read secondhand' },
    refund: { keepShare: 1, basis: 'SLATE doesn’t keep the MTA’s refunds: a ticket unused is lost.' },
    source: 'MTA Metro-North GTFS, 2026-09-29; MTA fare table, 1 July 2026',
  },
  { id: 'eurostar-lon-par', operator: 'Eurostar', service: 'Eurostar', from: 'uk-eng-london', to: 'fr-idf-paris', fromStation: 'London St Pancras International', toStation: 'Paris Gare du Nord', minutes: 136, perDay: 16, fare: EUROSTAR_FARE, ...EUROSTAR_COMMON, source: 'Eurostar, 2026-09-29; its fastest time; the departures a day are SLATE’s estimate, Eurostar publishing no count' },
  { id: 'eurostar-lon-bru', operator: 'Eurostar', service: 'Eurostar', from: 'uk-eng-london', to: 'be-bru-brussels', fromStation: 'London St Pancras International', toStation: 'Brussels-Midi', minutes: 118, perDay: 9, fare: EUROSTAR_FARE, ...EUROSTAR_COMMON, source: 'Eurostar, 2026-09-29; its fastest time; the departures a day are SLATE’s estimate, Eurostar publishing no count' },
  { id: 'eurostar-lon-ams', operator: 'Eurostar', service: 'Eurostar', from: 'uk-eng-london', to: 'nl-07-amsterdam', fromStation: 'London St Pancras International', toStation: 'Amsterdam Centraal', minutes: 244, perDay: 5, fare: EUROSTAR_FARE, ...EUROSTAR_COMMON, source: 'Eurostar release, 10 July 2025: five direct trains a day from 15 December 2025' },
  {
    id: 'ie-dub-crk', operator: 'Irish Rail', service: 'Intercity', from: 'ie-lei-dublin', to: 'ie-m-cork', fromStation: 'Dublin Heuston', toStation: 'Cork Kent', minutes: 155, perDay: 14,
    fare: { amount: 47_35, currency: 'EUR', basis: 'Irish Rail’s adult single, bought at the station, Dublin Heuston to Cork Kent.' },
    arriveBeforeMinutes: 10, arriveBasis: 'No time asked: SLATE’s 10 minutes to buy and board.',
    onTime: { share: 0.907, withinMinutes: 10, basis: 'Irish Rail, Dublin to Cork, the four weeks to 6 September 2026' },
    refund: { keepShare: 1, basis: 'SLATE doesn’t keep Irish Rail’s refunds: a ticket unused is lost.' },
    source: 'NTA Irish Rail GTFS, valid 2026-09-28 to 2027-09-28; Irish Rail fare grid',
  },
  {
    id: 'avanti-eus-man', operator: 'Avanti West Coast', service: 'Intercity', from: 'uk-eng-london', to: 'uk-eng-manchester', fromStation: 'London Euston', toStation: 'Manchester Piccadilly', minutes: 131, perDay: 47,
    fare: { amount: 79_80, currency: 'GBP', basis: 'The Off-Peak single, Euston to Manchester.', peak: { amount: 193_00, fromHour: 5, toHour: 10, basis: 'The Anytime single, a weekday train before ten (SLATE reads the peak as before ten; the Off-Peak’s own times vary).' } },
    arriveBeforeMinutes: 10, arriveBasis: 'No time asked: SLATE’s 10 minutes to buy and board.',
    onTime: { share: 0.873, withinMinutes: 15, basis: 'ORR, Avanti West Coast, April 2025 to March 2026' },
    refund: { keepShare: 0, untilHoursBefore: 0, fee: 5_00, basis: 'Off-Peak and Anytime, refunded until midnight before the day, less up to £5 (from 1 April 2026).' },
    source: 'Avanti West Coast timetable, 17 May to 12 December 2026; National Rail fares',
  },
  // The Surfliner's miles, SLATE's estimate like Philadelphia's, and a fare by the Northeast Regional's mile: Amtrak's Surfliner figures couldn't be read.
  { id: 'surfliner-lax-san', operator: 'Amtrak', service: 'Pacific Surfliner', from: 'us-ca-losangeles', to: 'us-ca-sandiego', fromStation: 'Los Angeles Union Station', toStation: 'San Diego Santa Fe Depot', minutes: 177, perDay: 13, fare: { amount: 0, currency: 'USD', basis: '' }, ...AMTRAK_ARRIVE, onTime: { share: 0.813, withinMinutes: 15, basis: 'Amtrak, Pacific Surfliner, the 12 months to August 2026' }, refund: AMTRAK_REFUND, source: 'Amtrak Pacific Surfliner timetable, 27 September 2026' },
];
