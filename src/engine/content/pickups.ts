/**
 * SLATE — pickups (the master plan's §36b, from 2026-10-03), read in
 * `docs/research/world/research-vehicles-utilities-gaps.json`.
 *
 * A pickup is driven on a car license, inspected and insured as a car (no
 * regulator publishes a different premium for one), so it keeps the car's
 * kind; what differs is its body. Four of America's and Canada's
 * best-selling cars of 2025 were pickups all along (`content/vehiclecatalog.ts`)
 * and Mexico's NP300 is one; they are marked so here, with the curb weights
 * Ford and Chevrolet publish where the catalog had none. Added: Toyota's
 * Tacoma in America, and the Hilux and Ford's Ranger in Britain and
 * Ireland, at their makers' prices.
 *
 * What the body does: California's weight fee on a commercial vehicle,
 * pickups named, by unladen weight (VC §9400, the DMV's Appendix 1F, curb
 * weight taken for unladen); Britain's commercial vehicle tax, £360 a year,
 * as Toyota states for the Hilux, and VAT added to a price Britain's makers
 * print without it; and a bed that carries a bed and a sofa on a move, as a
 * van does (`ownVanFor`).
 */

import type { CarModel } from './vehiclecatalog';

/** The catalog's pickups, and the curb weight their makers publish where it had none, kg. */
export const PICKUP_BODIES: Readonly<Record<string, { kerbKg?: number; basis?: string }>> = {
  'us-ford-f-series': { kerbKg: 4_391 / 2.20462, basis: 'Ford’s “Min Vehicle Base Curb Weight - 4x2 4,391 lbs.”' },
  'us-chevrolet-silverado': { kerbKg: 4_410 / 2.20462, basis: 'Chevrolet’s 4,410 to 5,710 lb unloaded, the least for the Work Truck' },
  'us-ram-pickup-1500-heavy-duty': {},
  'us-gmc-sierra': {},
  'ca-ford-f-series': { kerbKg: 1_914.2, basis: 'Ford Canada’s base curb weight, 4x2, 1,914.2 kg' },
  'ca-gmc-sierra': {},
  'ca-chevrolet-silverado': {},
  'ca-ram-pickup-1500-heavy-duty': {},
  'mx-nissan-np300': {},
};

/** California's weight fee on a two-axle commercial vehicle by unladen weight, lb to and its dollars (Appendix 1F). */
export const CA_WEIGHT_FEE: readonly (readonly [number, number])[] = [[1_999, 8], [2_999, 8], [4_000, 24], [5_000, 80], [6_000, 154], [7_000, 204], [8_000, 257], [9_000, 308], [10_000, 360]];

/** Britain's VAT, added to a pickup's price its maker prints without it. */
export const GB_VAT = 0.2;
/** Britain's vehicle tax on a pickup, a commercial vehicle: £360 a year (Toyota's Hilux page). */
export const GB_PICKUP_TAX = 360;

const LITERS_PER_100KM_AT = (mpg: number) => 235.214583 / mpg;

export const PICKUP_MODELS: readonly CarModel[] = [
  {
    id: 'us-toyota-tacoma', market: 'US', make: 'Toyota', model: 'Tacoma', trim: 'SR 2WD', rank: 99, body: 'pickup',
    price: 3_254_500, currency: 'USD', taxIncluded: false, delivery: 0, deliveryBasis: 'Toyota’s delivery charge wasn’t read; SLATE adds none',
    fuel: 'petrol', per100km: Math.round(LITERS_PER_100KM_AT(23) * 100) / 100, economyBasis: '23 mpg (EPA combined, fueleconomy.gov 50081)', co2: null, kerbKg: null,
    source: 'https://www.toyota.com/tacoma/', sourceType: 'primary',
  },
  {
    id: 'gb-toyota-hilux', market: 'GB', make: 'Toyota', model: 'Hilux', trim: 'Diesel, base grade', rank: 99, body: 'pickup',
    price: Math.round(34_670 * (1 + GB_VAT) * 100), currency: 'GBP', taxIncluded: true, delivery: 0, deliveryBasis: 'Toyota’s recommended on-the-road price, £34,670 before VAT, with Britain’s 20% added for a private buyer',
    fuel: 'diesel', per100km: 9.75, economyBasis: '9.7 to 9.8 l/100 km (WLTP), the middle', co2: 256, kerbKg: null,
    source: 'https://www.toyota.co.uk/new-cars/hilux', sourceType: 'primary',
  },
  {
    id: 'gb-ford-ranger', market: 'GB', make: 'Ford', model: 'Ranger', trim: 'XL Single Chassis Cab', rank: 99, body: 'pickup',
    price: Math.round(36_250 * (1 + GB_VAT) * 100), currency: 'GBP', taxIncluded: true, delivery: 0, deliveryBasis: 'Ford’s recommended retail price, £36,250 before VAT, with Britain’s 20% added for a private buyer',
    fuel: 'diesel', per100km: null, economyBasis: 'no WLTP figure on Ford’s British page', co2: null, kerbKg: null,
    source: 'https://www.ford.co.uk/vans-and-pickups/ranger', sourceType: 'primary',
  },
  {
    id: 'ie-toyota-hilux', market: 'IE', make: 'Toyota', model: 'Hilux', trim: 'Diesel', rank: 99, body: 'pickup',
    price: 5_295_000, currency: 'EUR', taxIncluded: true, delivery: 0, deliveryBasis: 'Toyota Ireland’s “from” price',
    fuel: 'diesel', per100km: 9.75, economyBasis: 'Toyota’s British figure for the same diesel, 9.7 to 9.8 l/100 km (WLTP), the Irish page giving none', co2: 256, kerbKg: null,
    source: 'https://www.toyota.ie/new-cars/hilux', sourceType: 'primary',
  },
  {
    id: 'ie-ford-ranger', market: 'IE', make: 'Ford', model: 'Ranger', trim: 'Double Cab XLT 3.0 V6 4WD', rank: 99, body: 'pickup',
    price: 5_930_850, currency: 'EUR', taxIncluded: true, delivery: 0, deliveryBasis: 'Ford Ireland’s price list of 5 August 2026, the retail price with VRT',
    fuel: 'diesel', per100km: 10.3, economyBasis: '10.3 l/100 km (WLTP overall)', co2: 272, kerbKg: 2_252,
    source: 'https://www.ford.ie/content/dam/guxeu/ie/Documents/Pricelists/Cars/PL-ford_all_new_ranger.pdf', sourceType: 'primary',
  },
];
