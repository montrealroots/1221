/**
 * SLATE — electric cars on sale, what's given toward one, and what charging
 * it costs (docs/WORLD.md, stage 3l), from 2026-09-30, researched in
 * `docs/research/world/research-ev-tint-security.json` and
 * `research-electricity-charging.json`.
 *
 * None of the best sellers in `vehiclecatalog.ts` is electric, so these sit
 * beside them. Each market has Tesla's Model Y Standard, sold in all of them,
 * and the other electric car read there:
 * - America and Canada: Chevrolet's Equinox EV LT.
 * - Britain: Ford's Puma Gen-E, which the Electric Car Grant is paid on. The
 *   Equinox EV isn't sold there.
 * - Mexico and Ireland: none, since no other electric car's price and
 *   consumption were both read.
 * A US or Canadian price is before sales tax; a British, Irish or Mexican one
 * includes it. Consumption is kept as kWh per 100 km, the EPA's, NRCan's or
 * WLTP's; where a market's own wasn't read, the same car's elsewhere is used,
 * and the car says so.
 */

import type { Money } from '../core/money';
import type { CarModel } from './vehiclecatalog';
import type { Jurisdiction } from './vehiclefees';

const MI = 1.609344;

export const EV_MODELS: readonly CarModel[] = [
  {
    id: 'us-tesla-model-y', market: 'US', make: 'Tesla', model: 'Model Y', trim: 'Standard RWD', rank: 0,
    price: 39_990_00, currency: 'USD', taxIncluded: false, delivery: 1_640_00,
    deliveryBasis: 'the $1,390 destination charge and $250 order fee (Edmunds); the $41,630 with both read on Cars.com',
    fuel: 'ev', per100km: null, kwhPer100km: Math.round((24 / MI) * 100) / 100, economyBasis: 'the EPA’s 24 kWh a 100 miles',
    co2: 0, kerbKg: 1_842, source: 'https://www.cars.com/articles/is-the-cheaper-2026-tesla-model-y-worth-your-consideration-516975/; https://www.fueleconomy.gov', sourceType: 'press; the curb weight, 4,061 lb, from a search summary',
  },
  {
    id: 'us-chevrolet-equinox-ev', market: 'US', make: 'Chevrolet', model: 'Equinox EV', trim: 'LT FWD', rank: 0,
    price: 34_995_00, currency: 'USD', taxIncluded: false, delivery: 1_800_00,
    deliveryBasis: 'the $1,800 destination charge, read on Cars.com',
    fuel: 'ev', per100km: null, kwhPer100km: Math.round((31 / MI) * 100) / 100, economyBasis: 'the EPA’s 31 kWh a 100 miles',
    co2: 0, kerbKg: null, source: 'https://www.cars.com; https://www.fueleconomy.gov', sourceType: 'press',
  },
  {
    id: 'ca-tesla-model-y', market: 'CA', make: 'Tesla', model: 'Model Y', trim: 'Standard RWD', rank: 0,
    price: 49_990_00, currency: 'CAD', taxIncluded: false, delivery: 2_500_00,
    deliveryBasis: 'freight and PDI, about $2,500, from a search summary',
    fuel: 'ev', per100km: null, kwhPer100km: 15.4, economyBasis: 'NRCan’s 15.4 kWh a 100 km',
    co2: 0, kerbKg: null, source: 'https://www.tesla.com/en_ca; https://natural-resources.canada.ca (Fuel Consumption Guide)', sourceType: 'maker',
  },
  {
    id: 'ca-chevrolet-equinox-ev', market: 'CA', make: 'Chevrolet', model: 'Equinox EV', trim: 'LT FWD', rank: 0,
    price: 46_199_00, currency: 'CAD', taxIncluded: false, delivery: 2_700_00,
    deliveryBasis: 'freight and PDI, about $2,600, and the $100 air conditioning tax, from GM Canada’s all-in advertising',
    fuel: 'ev', per100km: null, kwhPer100km: 19.3, economyBasis: 'NRCan’s 19.3 kWh a 100 km',
    co2: 0, kerbKg: null, source: 'https://www.chevrolet.ca; https://natural-resources.canada.ca (Fuel Consumption Guide)', sourceType: 'the MSRP from a search summary',
  },
  {
    id: 'mx-tesla-model-y', market: 'MX', make: 'Tesla', model: 'Model Y', trim: 'Standard RWD', rank: 0,
    price: 799_000_00, currency: 'MXN', taxIncluded: true, delivery: 0,
    deliveryBasis: 'no delivery charge stated',
    fuel: 'ev', per100km: null, kwhPer100km: Math.round((24 / MI) * 100) / 100, economyBasis: 'the EPA’s 24 kWh a 100 miles for the same car; no Mexican figure was read',
    co2: 0, kerbKg: null, source: 'https://www.tesla.com/es_mx', sourceType: 'maker',
  },
  {
    id: 'gb-tesla-model-y', market: 'GB', make: 'Tesla', model: 'Model Y', trim: 'Standard RWD', rank: 0,
    price: 41_990_00, currency: 'GBP', taxIncluded: true, delivery: 0,
    deliveryBasis: 'on the road, with VAT, delivery, the first registration fee and the first year’s VED',
    fuel: 'ev', per100km: null, kwhPer100km: 13.1, economyBasis: 'the European WLTP figure, 13.1 kWh a 100 km, from a search summary',
    co2: 0, kerbKg: 1_906, source: 'https://www.tesla.com/en_gb', sourceType: 'maker, from a search summary',
  },
  {
    id: 'gb-ford-puma-gen-e', market: 'GB', make: 'Ford', model: 'Puma Gen-E', trim: '', rank: 0,
    price: 29_995_00, currency: 'GBP', taxIncluded: true, delivery: 0,
    deliveryBasis: 'on the road, before the Electric Car Grant',
    fuel: 'ev', per100km: null, kwhPer100km: Math.round((25.3 / MI) * 100) / 100, economyBasis: 'EV Database’s real-world 253 Wh a mile; Ford’s page gave no WLTP consumption',
    co2: 0, kerbKg: null, source: 'https://www.ford.co.uk/cars/puma-gen-e', sourceType: 'maker',
  },
  {
    id: 'ie-tesla-model-y', market: 'IE', make: 'Tesla', model: 'Model Y', trim: 'Standard RWD', rank: 0,
    price: 42_990_00, currency: 'EUR', taxIncluded: true, delivery: 0,
    deliveryBasis: 'the list price, before the SEAI grant and VRT relief',
    fuel: 'ev', per100km: null, kwhPer100km: 13.1, economyBasis: 'the European WLTP figure, 13.1 kWh a 100 km, from a search summary',
    co2: 0, kerbKg: 1_906, source: 'https://www.tesla.com/en_ie', sourceType: 'maker',
  },
];

/**
 * What's given toward a new electric car at the sale, by the rules as read:
 * - New York's Drive Clean Rebate: $2,000 for 200 miles' range or more, $500
 *   over a $42,000 MSRP. Both cars here have 200 miles.
 * - Connecticut's CHEAPR: $1,000 to a $50,000 base MSRP. Rebate+ for
 *   income-qualified buyers isn't kept.
 * - California's MyFirstEV, from August 2026: $3,500 to a first-time
 *   electric car buyer, to a $50,000 price. Only Tesla, Hyundai and Lucid were
 *   named at launch, so Chevrolet gets nothing.
 * - Canada's EVAP, from 16 February 2026: $5,000 in 2026, $4,000 in 2027,
 *   $3,000 in 2028 and 2029, and $2,000 in 2030, to a $50,000 price before
 *   freight. The amounts are from secondary sources; the dates and funding
 *   were read on Transport Canada's page.
 * - Britain's Electric Car Grant: £3,750 on the Puma Gen-E. The Model Y is
 *   priced over its £37,000 cap.
 * - Ireland's SEAI grant, €3,500 (secondary), and VRT relief of up to €5,000,
 *   to 31 December 2026 (Revenue).
 * - Mexico: an electric car pays no ISAN, which is already out of its price.
 */
export function evIncentives(model: CarModel, j: Jurisdiction, at: number, firstEv: boolean): { label: string; amount: Money }[] {
  if (model.fuel !== 'ev') return [];
  const day = new Date(at).toISOString().slice(0, 10);
  const units = model.price / 100;
  switch (j) {
    case 'US-NY': return [{ label: 'Drive Clean Rebate', amount: units > 42_000 ? 500_00 : 2_000_00 }];
    case 'US-CT': return units <= 50_000 ? [{ label: 'CHEAPR Rebate', amount: 1_000_00 }] : [];
    case 'US-CA': return day >= '2026-08-03' && firstEv && units <= 50_000 && ['Tesla', 'Hyundai', 'Lucid'].includes(model.make) ? [{ label: 'MyFirstEV, A First Electric Car', amount: 3_500_00 }] : [];
    case 'CA-ON':
    case 'CA-BC': {
      if (day < '2026-02-16' || day > '2031-03-31' || units > 50_000) return [];
      const year = Number(day.slice(0, 4));
      const amount = year <= 2026 ? 5_000_00 : year === 2027 ? 4_000_00 : year <= 2029 ? 3_000_00 : 2_000_00;
      return [{ label: 'EVAP Incentive', amount }];
    }
    case 'GB': return model.id === 'gb-ford-puma-gen-e' ? [{ label: 'Electric Car Grant', amount: 3_750_00 }] : [];
    case 'IE': return day <= '2026-12-31' ? [{ label: 'SEAI Grant', amount: 3_500_00 }, { label: 'VRT Relief', amount: 5_000_00 }] : [{ label: 'SEAI Grant', amount: 3_500_00 }];
    default: return [];
  }
}

/**
 * A kWh charged, in the place's money, cents: at home on the overnight rate
 * where one is published, else the residential price all in; and at the main
 * public fast chargers.
 * - New York: Con Edison's 33.83¢ average for 2025, with its taxes. Its
 *   overnight rate excludes surcharges, so it isn't used.
 * - Connecticut: Eversource's delivery and standard supply, 23.61¢.
 * - Los Angeles: LADWP's 2025 first tier, 22.3¢ to 24.6¢, at the middle.
 *   2026's total couldn't be built.
 * - Toronto: the Ultra-Low Overnight rate with delivery, HST and the Ontario
 *   Electricity Rebate, 6.1¢.
 * - Vancouver: BC Hydro's first step less its 5¢ overnight discount, with
 *   GST, 7.21¢.
 * - Mexico City: CFE's top domestic block, 4.028 pesos, with IVA, since a car's
 *   charging lifts a home into it. No public price was read, so the same.
 * - London: Intelligent Octopus Go's 8p overnight.
 * - Dublin: Electric Ireland's 19.62c night rate.
 * The public prices are DCFC Tracker's August 2026 state averages at Tesla's
 * Superchargers in America, BC Hydro's network with GST, Ivy's 2023 price in
 * Ontario (the only one read), Zapmap's rapid average in Britain, and ESB
 * ecars' in Ireland. The derived figures add the published parts.
 */
export const CHARGING: Readonly<Record<Jurisdiction, { home: number; public: number; currency: string }>> = {
  'US-NY': { home: 33.83, public: 57.8, currency: 'USD' },
  'US-CT': { home: 23.61, public: 63.1, currency: 'USD' },
  'US-CA': { home: 23.45, public: 68.9, currency: 'USD' },
  'CA-ON': { home: 6.1, public: 62, currency: 'CAD' },
  'CA-BC': { home: 7.21, public: 41.67, currency: 'CAD' },
  'MX-CMX': { home: 467.2, public: 467.2, currency: 'MXN' },
  GB: { home: 8, public: 77, currency: 'GBP' },
  IE: { home: 19.62, public: 72, currency: 'EUR' },
};

/** The share of charging done at home by someone who has a charger there: the IEA's three-quarters, worldwide, of private charging's share (2026). */
export const HOME_CHARGING_SHARE = 0.75;

/**
 * A home charger fitted, by place:
 * - America: Tesla's Wall Connector, $585, and Qmerit's average Level 2
 *   installation, $1,700. The federal 30C credit ended with June 2026. LADWP
 *   rebates up to $1,000 in Los Angeles. Connecticut's rebate is for
 *   income-qualified households only, and Con Edison has none.
 * - Canada: ChargePoint's Home Flex, $499 (a search summary), and Toronto's
 *   middle labor price, $1,500 (secondary), in Vancouver too. BC's CleanBC
 *   rebate is half, to $350; Ontario has none.
 * - Britain: Ohme's Home Pro, £999 installed. Its OZEV grant is for renters
 *   and flat owners, not a house's owner.
 * - Ireland: a smart charger supplied and fitted, the middle of €800 to
 *   €1,600 (secondary). The SEAI grant is €300.
 * - Mexico City: Tesla's Wall Connector at MXN 14,351.03 on Amazon, and a
 *   basic installation package, MXN 13,800.
 * Hardware is taxed where the price leaves it off; installation isn't.
 */
export const CHARGERS: Readonly<Record<Jurisdiction, { hardware: number; install: number; currency: string; taxIncluded: boolean; grant: number; grantShare?: number; cityOnly?: string; label: string }>> = {
  'US-NY': { hardware: 585, install: 1_700, currency: 'USD', taxIncluded: false, grant: 0, label: 'Tesla Wall Connector' },
  'US-CT': { hardware: 585, install: 1_700, currency: 'USD', taxIncluded: false, grant: 0, label: 'Tesla Wall Connector' },
  'US-CA': { hardware: 585, install: 1_700, currency: 'USD', taxIncluded: false, grant: 1_000, cityOnly: 'us-ca-losangeles', label: 'Tesla Wall Connector' },
  'CA-ON': { hardware: 499, install: 1_500, currency: 'CAD', taxIncluded: false, grant: 0, label: 'ChargePoint Home Flex' },
  'CA-BC': { hardware: 499, install: 1_500, currency: 'CAD', taxIncluded: false, grant: 350, grantShare: 0.5, label: 'ChargePoint Home Flex' },
  GB: { hardware: 999, install: 0, currency: 'GBP', taxIncluded: true, grant: 0, label: 'Ohme Home Pro, Installed' },
  IE: { hardware: 1_200, install: 0, currency: 'EUR', taxIncluded: true, grant: 300, label: 'A Smart Charger, Supplied And Fitted' },
  'MX-CMX': { hardware: 14_351.03, install: 13_800, currency: 'MXN', taxIncluded: true, grant: 0, label: 'Tesla Wall Connector' },
};
