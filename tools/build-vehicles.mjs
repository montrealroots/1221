/**
 * Builds src/engine/content/vehiclecatalog.ts from
 * docs/research/world/research-vehicles.json: each market's best-selling
 * new cars of 2025 with their 2026 base price, fuel, official economy, CO2
 * and weight, as the research read them from the makers' own sites. Run:
 * node tools/build-vehicles.mjs
 *
 * What isn't in a base price and the maker states (a US destination charge,
 * Canadian freight and PDI, Irish delivery) is added as `delivery`, from the
 * research's own notes; where the maker doesn't state it, nothing is added,
 * and the car says so.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const r = JSON.parse(readFileSync('docs/research/world/research-vehicles.json', 'utf8'));

// The charges on top of a base price, as the research's notes state them, by market and model.
const DELIVERY = {
  'US|Ford F-Series': [2_795, 'the $2,795 destination charge, read secondhand (ford.com refused)'],
  'US|Chevrolet Silverado': [2_795, 'the $2,795 destination charge, from GM Authority'],
  'US|GMC Sierra': [2_795, 'the $2,795 destination and freight charge, from GMC’s release'],
  'US|Honda CR-V': [1_550, 'the $1,550 destination charge, from Honda'],
  'CA|Ford F-Series': [2_795, 'freight and PDI, $2,695, and the $100 air conditioning tax, from a dealer’s page'],
  'CA|Honda CR-V': [2_000, 'freight and PDI, $2,000, from a dealer’s configurator'],
  'CA|Chevrolet Silverado': [2_700, 'freight, $2,700, from GM Authority'],
  'CA|Ram Pickup (1500 + Heavy Duty)': [2_795, 'freight and PDI, $2,795, from a dealer’s page'],
  'CA|Nissan Rogue': [2_080, 'freight and PDI, $2,080, from Nissan Canada'],
  'IE|Toyota Yaris Cross': [1_000, 'delivery, €1,000, from Toyota Ireland’s finance example'],
  'IE|Toyota RAV4': [1_000, 'delivery, €1,000, from Toyota Ireland'],
  'IE|Toyota Corolla': [1_000, 'delivery, €1,000, from Toyota Ireland’s finance example'],
  'IE|Volkswagen Tiguan': [2_080, 'delivery and service, €2,080, from Volkswagen Ireland'],
};

/** Liters per 100 km from what was published. */
function per100(econ) {
  if (!econ || econ.value == null) return null;
  const u = String(econ.unit ?? '').toLowerCase();
  if (u.includes('l/100')) return econ.value;
  if (u.includes('km/l')) return Math.round((100 / econ.value) * 100) / 100;
  if (u.includes('mpg')) {
    // US gallons for the EPA's, imperial for the UK's.
    const litres = u.includes('epa') ? 3.785411784 : 4.54609;
    return Math.round(((100 * litres) / (econ.value * 1.609344)) * 100) / 100;
  }
  return null;
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cars = [];
for (const market of ['US', 'CA', 'MX', 'GB', 'IE']) {
  for (const m of r.catalog[market]) {
    const d = DELIVERY[`${market}|${m.make} ${m.model}`];
    const fuel = String(m.fuel ?? '').toLowerCase();
    cars.push({
      id: `${market.toLowerCase()}-${slug(m.make)}-${slug(m.model)}`,
      market, make: m.make, model: m.model, trim: m.basePrice.trim ?? '',
      rank: m.rank,
      price: Math.round(m.basePrice.amount * 100),
      currency: m.basePrice.currency,
      taxIncluded: m.basePrice.includesTax === true,
      delivery: d ? d[0] * 100 : 0,
      deliveryBasis: d ? d[1] : (m.basePrice.includesTax ? 'what the price includes, as the maker states it' : 'no destination or freight charge the maker states; SLATE adds none'),
      // A diesel mild hybrid burns diesel: it's filed as a diesel, at the diesel pump.
      fuel: fuel.includes('phev') || fuel.includes('plug') ? 'phev' : fuel.includes('diesel') ? 'diesel' : fuel.includes('hybrid') ? 'hybrid' : fuel.includes('electric') || fuel === 'ev' ? 'ev' : 'petrol',
      per100km: per100(m.economy),
      economyBasis: m.economy?.value != null ? `${m.economy.value} ${m.economy.unit}` : 'not yet rated',
      co2: m.co2gkm?.value ?? null,
      kerbKg: m.kerbWeightKg?.value ?? null,
      source: m.basePrice.url,
      sourceType: m.basePrice.sourceType ?? 'secondary',
    });
  }
}

const out = `/**
 * SLATE — the cars on sale (docs/WORLD.md, stage 3), built by
 * \`tools/build-vehicles.mjs\` from \`docs/research/world/research-vehicles.json\`.
 * Don't edit by hand.
 *
 * Each market's eight best-selling new cars of 2025 (SMMT for the UK, SIMI
 * for Ireland, the makers and the trade press for the US, Canada and
 * Mexico), at the 2026 base price the maker's own site gave on 2026-09-29
 * where it could be read, with the fuel, official economy (the EPA's,
 * NRCan's, WLTP's, the Mexican spec sheets'), CO2 and weight. Economy is
 * kept as liters per 100 km whatever was published. A US or Canadian price
 * is before sales tax; a British, Irish or Mexican one includes it.
 */

/** What a vehicle is, where it isn't a car (from 2026-09-30): what licenses, taxes and insures it. */
export type VehicleKind = 'car' | 'motorcycle' | 'scooter';

export interface CarModel {
  id: string;
  /** A car where not given. */
  kind?: VehicleKind;
  /** A motorcycle's or scooter's engine, cc: what taxes and insures it by size. */
  cc?: number;
  market: 'US' | 'CA' | 'MX' | 'GB' | 'IE';
  make: string;
  model: string;
  trim: string;
  rank: number;
  /** The base price in cents of \`currency\`, and what's on top that the maker states. */
  price: number;
  currency: string;
  taxIncluded: boolean;
  delivery: number;
  deliveryBasis: string;
  fuel: 'petrol' | 'diesel' | 'hybrid' | 'phev' | 'ev';
  /** Liters per 100 km, or null where not yet rated. */
  per100km: number | null;
  economyBasis: string;
  co2: number | null;
  kerbKg: number | null;
  source: string;
  sourceType: string;
}

export const CAR_MODELS: readonly CarModel[] = ${JSON.stringify(cars, null, 2)};
`;
writeFileSync('src/engine/content/vehiclecatalog.ts', out);
try { execSync('node tools/voice-check.mjs --fix src/engine/content/vehiclecatalog.ts', { stdio: 'ignore' }); } catch { /* left to the gate */ }
console.log(`${cars.length} cars`);
