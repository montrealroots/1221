/**
 * SLATE — homes for sale: what a home costs where it is, what it's called,
 * what it's built of, and what can be done to it.
 *
 * The typical home's value in a US town is Zillow's (`homevalues-us.ts`,
 * the Home Value Index for August 2026). A US town Zillow doesn't report is
 * priced from its rent, at what a home costs over a year's rent in the towns
 * of its state that Zillow does (`homeValueAt`). Everywhere else a home is
 * priced from the town's rent (`content/rents.ts`) at SLATE's estimate of how
 * dear homes are over rents in that country, measured against the United
 * States': homes cost more years of rent in most of Europe and Asia than in
 * America. Those are marked as estimates wherever they show.
 *
 * The 50 homes in a town are the game's (`systems/homes.ts`), not real
 * listings: a real street name of the country, a number drawn for it, a
 * price drawn around the town's typical value. Nobody's actual house is for
 * sale here.
 *
 * What a renovation costs and returns is SLATE's estimate for a typical US
 * job in 2026 dollars, at the town's cost of living. Remodeling's
 * cost-against-value reports were read for the pattern (exterior replacements
 * return the most of their cost at sale, big additions and upscale remodels
 * the least), and their figures weren't copied: the report's terms forbid
 * putting them in software.
 */

import { CITIES } from './geography';
import { exchange } from './currency';
import { rentAt } from './rents';
import { US_HOME_VALUES, US_HOME_VALUES_MONTH } from './homevalues-us';

// ---------------------------------------------------------------------------
// What a home is worth

export interface HomeValue {
  /** The typical home, in hundredths of the currency asked for, at the figure's date. */
  value: number;
  /** A year's compound growth in value. */
  growth: number;
  kind: 'zillow' | 'calibrated' | 'estimate';
  /** The date the figure is for, as UTC milliseconds. */
  asOf: number;
}

let usValues: Map<string, { value: number; growth?: number }> | undefined;
function usTable(): Map<string, { value: number; growth?: number }> {
  if (usValues) return usValues;
  usValues = new Map();
  for (const entry of US_HOME_VALUES.split(';')) {
    const [id, value, growth] = entry.split(':');
    usValues.set(`us-${id}`, { value: Number(value), ...(growth ? { growth: Number(growth) / 1000 } : {}) });
  }
  return usValues;
}

export const HOME_VALUES_AS_OF = Date.parse(`${US_HOME_VALUES_MONTH}T00:00:00Z`);

/**
 * A year's growth where there's no five-year record: SLATE's estimate, near
 * the long-run pace of house prices in the rich countries, a little over
 * inflation.
 */
export const GROWTH_ESTIMATE = 0.035;

/**
 * How many years of a one-bedroom's rent a typical home costs, over the
 * American figure: SLATE's estimates by country. America's own ratio is
 * measured, from Zillow's values and the towns' rents (`usRatio`).
 */
const DEARER_THAN_US: Readonly<Record<string, number>> = {
  uk: 1.9, ie: 1.5, ca: 1.7, au: 2.1, nz: 2.0, is: 1.6,
  de: 2.6, fr: 2.6, es: 2.1, it: 2.3, nl: 2.3, be: 2.0, at: 2.6, ch: 2.9, pt: 2.3,
  se: 2.5, no: 2.1, dk: 2.2, fi: 2.1, pl: 2.4, cz: 2.8, gr: 2.3,
  jp: 3.2, kr: 4.0, cn: 5.0, hk: 3.8, sg: 3.0, tw: 4.5, in: 3.0,
  mx: 2.0, br: 2.2, ar: 2.0, co: 2.2, cl: 2.3, za: 1.4, ae: 1.6, il: 3.2, tr: 2.2,
};
const DEARER_DEFAULT = 2.0;

/** A US state's measured ratio of a home's value to a year's one-bedroom rent, from its towns Zillow reports. */
const stateRatios = new Map<string, number>();
function usRatio(stateId: string): number {
  const known = stateRatios.get(stateId);
  if (known !== undefined) return known;
  const ratios: number[] = [];
  for (const [id, one] of usTable()) {
    const city = CITIES.get(id);
    if (!city || (stateId !== 'us' && city.parentId !== stateId)) continue;
    const rent = rentAt(id, 'USD').oneBed;
    if (rent > 0) ratios.push((one.value * 100) / (rent * 12));
    if (ratios.length >= 400) break;
  }
  ratios.sort((a, b) => a - b);
  const ratio = ratios.length > 0 ? ratios[Math.floor(ratios.length / 2)]! : stateId === 'us' ? 25 : usRatio('us');
  stateRatios.set(stateId, ratio);
  return ratio;
}

/** The typical home in a town, in a currency: Zillow's, calibrated from the state's, or SLATE's estimate. */
export function homeValueAt(cityId: string, currency: string): HomeValue {
  const city = CITIES.require(cityId);
  const to = (usdCents: number) => exchange(usdCents, 'USD', currency) ?? usdCents;
  const zillow = usTable().get(cityId);
  if (zillow) return { value: to(zillow.value * 100), growth: zillow.growth ?? GROWTH_ESTIMATE, kind: 'zillow', asOf: HOME_VALUES_AS_OF };
  const rentUsd = rentAt(cityId, 'USD').oneBed * 12;
  if (city.countryId === 'us') return { value: to(Math.round(rentUsd * usRatio(city.parentId))), growth: GROWTH_ESTIMATE, kind: 'calibrated', asOf: HOME_VALUES_AS_OF };
  const ratio = usRatio('us') * (DEARER_THAN_US[city.countryId] ?? DEARER_DEFAULT);
  return { value: to(Math.round(rentUsd * ratio)), growth: GROWTH_ESTIMATE, kind: 'estimate', asOf: HOME_VALUES_AS_OF };
}

// ---------------------------------------------------------------------------
// What homes are called, and the streets they're on

export type HomeType = 'studio' | 'condo' | 'townhouse' | 'house' | 'estate';

/** What each type is called where it is: an apartment is a flat in Britain and Ireland, a condo in North America and Australia. */
export function typeLabel(type: HomeType, countryId: string): string {
  const british = countryId === 'uk' || countryId === 'ie';
  const condo = ['us', 'ca', 'au', 'nz'].includes(countryId);
  switch (type) {
    case 'studio': return british ? 'Studio Flat' : 'Studio Apartment';
    case 'condo': return british ? 'Flat' : condo ? 'Condo' : 'Apartment';
    case 'townhouse': return british ? 'Terraced House' : 'Townhouse';
    case 'house': return british ? 'Semi-Detached House' : 'House';
    case 'estate': return british ? 'Detached House' : 'Estate';
  }
}

/** Where a flat's shared costs are named: an HOA in America, a service charge in Britain, strata in Canada and Australia. */
export function sharedCostsLabel(countryId: string): string {
  if (countryId === 'us') return 'HOA Dues';
  if (countryId === 'uk' || countryId === 'ie') return 'Service Charge';
  if (['ca', 'au', 'nz'].includes(countryId)) return 'Strata Fees';
  return 'Building Charges';
}

/**
 * Street names common in each country. America's list opens with the twenty
 * the Census Bureau's count found commonest, Second Street first; the rest
 * are names found in most towns of their country. A home is given one of
 * them and a number: the address is the game's.
 */
const STREETS: Readonly<Record<string, readonly string[]>> = {
  us: ['Second Street', 'Third Street', 'First Street', 'Fourth Street', 'Park Avenue', 'Fifth Street', 'Main Street', 'Sixth Street', 'Oak Street', 'Seventh Street', 'Pine Street', 'Maple Avenue', 'Cedar Street', 'Eighth Street', 'Elm Street', 'View Drive', 'Washington Street', 'Ninth Street', 'Lake Street', 'Hill Street', 'Walnut Street', 'Spring Street', 'North Street', 'Ridge Road', 'Church Street', 'Willow Street', 'Mill Street', 'Sunset Drive', 'Railroad Avenue', 'Jefferson Street', 'Chestnut Street', 'Lincoln Avenue', 'Highland Avenue', 'Center Street', 'Madison Avenue', 'Franklin Street', 'Meadow Lane', 'River Road', 'Jackson Street', 'Forest Avenue'],
  uk: ['High Street', 'Station Road', 'Main Street', 'Park Road', 'Church Road', 'Church Street', 'London Road', 'Victoria Road', 'Green Lane', 'Manor Road', 'Church Lane', 'Park Avenue', 'The Avenue', 'The Crescent', 'Queens Road', 'New Road', 'Grange Road', 'Kings Road', 'Kingsway', 'Windsor Road', 'Highfield Road', 'Mill Lane', 'Alexander Road', 'York Road', 'St John’s Road', 'Main Road', 'Broadway', 'King Street', 'The Green', 'Springfield Road'],
  ie: ['Main Street', 'Church Street', 'Bridge Street', 'Castle Street', 'Chapel Street', 'Mill Street', 'Church Road', 'Mary Street', 'Patrick Street', 'O’Connell Street', 'Pearse Street', 'Davitt Road', 'Park Avenue', 'Station Road', 'New Street'],
  ca: ['Main Street', 'Second Street', 'First Avenue', 'King Street', 'Queen Street', 'Park Avenue', 'Church Street', 'Maple Avenue', 'Victoria Street', 'Elm Street', 'Lakeshore Road', 'Wellington Street', 'Mill Street', 'Oak Street', 'Pine Street', 'River Road', 'John Street', 'George Street', 'Water Street', 'Center Street'],
  au: ['Park Road', 'Victoria Street', 'Railway Parade', 'George Street', 'Church Street', 'High Street', 'Main Street', 'Queen Street', 'King Street', 'William Street', 'Station Street', 'Albert Street', 'Short Street', 'Hill Street', 'Bridge Road', 'Pacific Highway', 'Beach Road', 'Wattle Street', 'Railway Street', 'John Street'],
  nz: ['Main Road', 'High Street', 'Queen Street', 'Victoria Street', 'Church Street', 'Beach Road', 'Station Road', 'King Street', 'George Street', 'Great North Road', 'Hill Street', 'Park Road'],
  de: ['Hauptstraße', 'Schulstraße', 'Gartenstraße', 'Dorfstraße', 'Bahnhofstraße', 'Bergstraße', 'Birkenweg', 'Lindenstraße', 'Kirchstraße', 'Waldstraße', 'Ringstraße', 'Schillerstraße', 'Goethestraße', 'Wiesenweg', 'Mühlenweg', 'Amselweg', 'Jahnstraße', 'Friedhofstraße', 'Buchenweg', 'Poststraße'],
  at: ['Hauptstraße', 'Bahnhofstraße', 'Schulgasse', 'Kirchengasse', 'Dorfstraße', 'Feldgasse', 'Wiener Straße', 'Gartengasse', 'Lindengasse', 'Mühlgasse'],
  ch: ['Bahnhofstrasse', 'Hauptstrasse', 'Dorfstrasse', 'Schulstrasse', 'Kirchweg', 'Poststrasse', 'Gartenstrasse', 'Rue de la Gare', 'Grand-Rue', 'Via Cantonale'],
  fr: ['Grande Rue', 'Rue de l’Église', 'Place de l’Église', 'Rue du Moulin', 'Rue de la Mairie', 'Rue du Château', 'Rue des Écoles', 'Rue de la Gare', 'Rue Principale', 'Rue du Stade', 'Rue de la Fontaine', 'Rue Pasteur', 'Rue Victor Hugo', 'Rue Jean Jaurès', 'Avenue de la République', 'Rue du Général de Gaulle', 'Rue des Lilas', 'Allée des Tilleuls', 'Rue de la Paix', 'Boulevard Gambetta'],
  be: ['Rue de la Station', 'Kerkstraat', 'Stationsstraat', 'Rue de l’Église', 'Dorpstraat', 'Nieuwstraat', 'Rue Haute', 'Molenstraat', 'Grand-Place', 'Schoolstraat'],
  nl: ['Kerkstraat', 'Schoolstraat', 'Molenstraat', 'Dorpsstraat', 'Molenweg', 'Julianastraat', 'Nieuwstraat', 'Markt', 'Wilhelminastraat', 'Beatrixstraat', 'Emmastraat', 'Industrieweg', 'Stationsstraat', 'Kastanjelaan', 'Parallelweg'],
  es: ['Calle Mayor', 'Calle Real', 'Plaza Mayor', 'Calle de la Iglesia', 'Calle Nueva', 'Calle del Sol', 'Calle de San José', 'Calle del Carmen', 'Avenida de la Constitución', 'Calle Ancha', 'Calle de la Fuente', 'Calle del Castillo', 'Calle de Cervantes', 'Paseo del Prado', 'Calle Alta'],
  pt: ['Rua Direita', 'Rua da Igreja', 'Rua do Comércio', 'Rua Nova', 'Avenida da Liberdade', 'Rua 25 de Abril', 'Rua da Escola', 'Rua do Sol', 'Largo da Igreja', 'Rua Central'],
  it: ['Via Roma', 'Via Garibaldi', 'Via Marconi', 'Via Mazzini', 'Via Dante', 'Via Matteotti', 'Via Verdi', 'Via Cavour', 'Via Vittorio Emanuele', 'Via della Repubblica', 'Via XX Settembre', 'Via Kennedy', 'Via Aldo Moro', 'Via Umberto I', 'Piazza del Popolo', 'Via San Francesco', 'Via Leonardo da Vinci', 'Via Manzoni', 'Via Colombo', 'Via Gramsci'],
  se: ['Storgatan', 'Kyrkogatan', 'Skolgatan', 'Järnvägsgatan', 'Nygatan', 'Drottninggatan', 'Kungsgatan', 'Parkvägen', 'Björkvägen', 'Ringvägen'],
  no: ['Storgata', 'Kirkegata', 'Skolegata', 'Parkveien', 'Kongens gate', 'Jernbanegata', 'Strandgata', 'Torggata', 'Bjørkeveien', 'Solveien'],
  dk: ['Hovedgaden', 'Skolevej', 'Kirkevej', 'Stationsvej', 'Østergade', 'Vestergade', 'Nørregade', 'Søndergade', 'Møllevej', 'Birkevej'],
  fi: ['Kirkkokatu', 'Koulukatu', 'Kauppakatu', 'Rantatie', 'Puistokatu', 'Asemakatu', 'Myllytie', 'Kuusitie', 'Koivutie', 'Mäntytie'],
  is: ['Aðalstræti', 'Laugavegur', 'Hafnarstræti', 'Kirkjuvegur', 'Hraunbær', 'Austurvegur', 'Suðurgata', 'Vesturgata', 'Skólavegur', 'Strandgata'],
  pl: ['ulica Kościuszki', 'ulica Mickiewicza', 'ulica Szkolna', 'ulica Kościelna', 'ulica Polna', 'ulica Ogrodowa', 'ulica Lipowa', 'ulica Leśna', 'ulica Słoneczna', 'ulica Sienkiewicza'],
  mx: ['Calle Hidalgo', 'Calle Morelos', 'Calle Juárez', 'Avenida Reforma', 'Calle Zaragoza', 'Calle Allende', 'Calle Guerrero', 'Avenida Insurgentes', 'Calle Madero', 'Calle 5 de Mayo', 'Calle Independencia', 'Calle Benito Juárez'],
  br: ['Rua São José', 'Rua Sete de Setembro', 'Rua Quinze de Novembro', 'Rua Santo Antônio', 'Rua Tiradentes', 'Avenida Brasil', 'Rua Rui Barbosa', 'Rua São Paulo', 'Rua Duque de Caxias', 'Rua Getúlio Vargas'],
};
const STREETS_DEFAULT = ['Main Street', 'Park Avenue', 'Church Street', 'Station Road', 'Market Street', 'Garden Street', 'River Road', 'Hill Road', 'School Street', 'Lake Road'];

export function streetsOf(countryId: string): readonly string[] {
  return STREETS[countryId] ?? STREETS_DEFAULT;
}

/**
 * How an address is written in a country: the number after the street in
 * most of Europe, before it in the English-speaking world, and in Japan and
 * Korea by block rather than street.
 */
export function addressOf(countryId: string, street: string, number: number, unit: string | undefined, block?: [number, number, number]): string {
  if ((countryId === 'jp' || countryId === 'kr') && block) return `${block[0]}-${block[1]}-${block[2]}${unit ? `, No. ${unit}` : ''}`;
  const numberFirst = ['us', 'uk', 'ie', 'ca', 'au', 'nz', 'fr', 'za', 'in', 'sg'].includes(countryId);
  const line = numberFirst ? `${number} ${street}` : `${street} ${number}`;
  if (!unit) return line;
  if (countryId === 'us' || countryId === 'ca') return `${line}, Apt ${unit}`;
  if (countryId === 'uk' || countryId === 'ie' || countryId === 'au' || countryId === 'nz') return `Flat ${unit}, ${line}`;
  return `${line}, ${unit}`;
}

/** Square feet where they're used, square meters everywhere else. */
export const usesFeet = (countryId: string): boolean => countryId === 'us';
export const SQM_PER_SQFT = 0.09290304;

// ---------------------------------------------------------------------------
// What a home is made of, and how long each part lasts

export type Part = 'kitchen' | 'bath' | 'floors' | 'paint' | 'roof' | 'windows' | 'siding' | 'door' | 'garageDoor' | 'hvac' | 'deck' | 'solar' | 'pool';

/**
 * How long each part lasts before it's worn out, in years: SLATE's
 * estimates, near what the building trades give for them (an asphalt roof
 * twenty-odd years, a furnace or a heat pump fifteen to twenty, fitted
 * kitchens and baths twenty to thirty).
 */
export const LIFESPAN: Readonly<Record<Part, number>> = {
  kitchen: 25, bath: 25, floors: 25, paint: 10, roof: 25, windows: 30, siding: 30,
  door: 30, garageDoor: 25, hvac: 18, deck: 20, solar: 25, pool: 25,
};
/** A metal roof lasts twice an asphalt one. */
export const METAL_ROOF_LIFESPAN = 50;

export const PART_LABEL: Readonly<Record<Part, string>> = {
  kitchen: 'Kitchen', bath: 'Bathrooms', floors: 'Floors', paint: 'Paint', roof: 'Roof', windows: 'Windows', siding: 'Siding',
  door: 'Front Door', garageDoor: 'Garage Door', hvac: 'Heating And Cooling', deck: 'Deck', solar: 'Solar Panels', pool: 'Pool',
};

/** A part's state from its age over its life. */
export function conditionWord(age: number, life: number): 'New' | 'Good' | 'Dated' | 'Worn Out' {
  const t = age / life;
  return t < 0.3 ? 'New' : t < 0.7 ? 'Good' : t < 1 ? 'Dated' : 'Worn Out';
}

export type Feature = 'garage' | 'yard' | 'basement' | 'finishedBasement' | 'attic' | 'furnace' | 'heatPump' | 'metalRoof'
  | 'deck' | 'patio' | 'pool' | 'solar' | 'generator' | 'adu' | 'stone';

export const FEATURE_LABEL: Readonly<Record<Feature, string>> = {
  garage: 'Garage', yard: 'Yard', basement: 'Unfinished Basement', finishedBasement: 'Finished Basement', attic: 'Attic',
  furnace: 'Gas Furnace', heatPump: 'Heat Pump', metalRoof: 'Metal Roof', deck: 'Deck', patio: 'Patio', pool: 'Pool',
  solar: 'Solar Panels', generator: 'Backup Generator', adu: 'Backyard Cottage', stone: 'Stone Front',
};

// ---------------------------------------------------------------------------
// What can be done to a home

export interface Project {
  id: string;
  label: string;
  /** A typical US job, in dollars, at an American cost of living a hundred. */
  usd: number;
  /** Scaled by the home's size over this many square feet, for work done by the foot. */
  perSize?: number;
  /** Of the cost, what a buyer would pay for it on a worn-out part, or for a thing the home lacked. */
  recoup: number;
  days: number;
  /** The part it renews, whose age sets what it's worth: a new roof on a two-year-old roof adds little. */
  renews?: Part;
  /** The home types it can be done to. */
  on: readonly HomeType[];
  /** Features the home must have, and must not. */
  needs?: readonly Feature[];
  lacks?: readonly Feature[];
  /** A lot at least this big, in square feet. */
  lot?: number;
  /** What it adds or changes. */
  adds?: { gains?: readonly Feature[]; drops?: readonly Feature[]; beds?: number; baths?: number; size?: number };
  /** A cap: a bath added only while there are fewer baths than beds and one more, a bedroom only to this many. */
  bathsUpTo?: 'bedsPlusOne';
  bedsUpTo?: number;
}

const ALL: readonly HomeType[] = ['studio', 'condo', 'townhouse', 'house', 'estate'];
const HOUSES: readonly HomeType[] = ['townhouse', 'house', 'estate'];
const DETACHED: readonly HomeType[] = ['house', 'estate'];

/** Every job SLATE's contractors take, SLATE's estimates of each (see the header). */
export const PROJECTS: readonly Project[] = [
  // Inside, any home.
  { id: 'paint', label: 'Repaint Inside', usd: 5_000, perSize: 1_500, recoup: 0.5, days: 5, renews: 'paint', on: ALL },
  { id: 'floors', label: 'New Hardwood Floors', usd: 14_000, perSize: 1_500, recoup: 0.75, days: 10, renews: 'floors', on: ALL },
  { id: 'kitchen-minor', label: 'Minor Kitchen Remodel', usd: 27_000, recoup: 0.95, days: 21, renews: 'kitchen', on: ALL },
  { id: 'kitchen-major', label: 'Major Kitchen Remodel', usd: 80_000, recoup: 0.5, days: 60, renews: 'kitchen', on: ALL },
  { id: 'kitchen-upscale', label: 'Upscale Kitchen Remodel', usd: 160_000, recoup: 0.35, days: 90, renews: 'kitchen', on: ['condo', ...HOUSES] },
  { id: 'bath-midrange', label: 'Bathroom Remodel', usd: 25_000, recoup: 0.75, days: 21, renews: 'bath', on: ALL },
  { id: 'bath-upscale', label: 'Upscale Bathroom Remodel', usd: 80_000, recoup: 0.42, days: 45, renews: 'bath', on: ALL },
  { id: 'bath-accessible', label: 'Accessible Bathroom Remodel', usd: 41_000, recoup: 0.62, days: 30, renews: 'bath', on: ALL },
  // The shell, a house's own.
  { id: 'roof-asphalt', label: 'New Asphalt Roof', usd: 30_000, perSize: 2_000, recoup: 0.62, days: 5, renews: 'roof', on: HOUSES, adds: { drops: ['metalRoof'] } },
  { id: 'roof-metal', label: 'New Metal Roof', usd: 50_000, perSize: 2_000, recoup: 0.52, days: 8, renews: 'roof', on: HOUSES, adds: { gains: ['metalRoof'] } },
  { id: 'windows-vinyl', label: 'Replace The Windows In Vinyl', usd: 21_500, perSize: 1_800, recoup: 0.72, days: 4, renews: 'windows', on: HOUSES },
  { id: 'windows-wood', label: 'Replace The Windows In Wood', usd: 26_500, perSize: 1_800, recoup: 0.66, days: 5, renews: 'windows', on: HOUSES },
  { id: 'siding-vinyl', label: 'New Vinyl Siding', usd: 17_500, perSize: 2_000, recoup: 0.9, days: 7, renews: 'siding', on: DETACHED },
  { id: 'siding-fiber-cement', label: 'New Fiber-Cement Siding', usd: 21_000, perSize: 2_000, recoup: 1.05, days: 10, renews: 'siding', on: DETACHED },
  { id: 'door-steel', label: 'New Steel Front Door', usd: 2_400, recoup: 1.5, days: 1, renews: 'door', on: HOUSES },
  { id: 'door-grand', label: 'Fiberglass Grand Entrance', usd: 11_500, recoup: 0.8, days: 3, renews: 'door', on: DETACHED },
  { id: 'garage-door', label: 'New Garage Door', usd: 4_600, recoup: 1.8, days: 1, renews: 'garageDoor', on: HOUSES, needs: ['garage'] },
  { id: 'stone-veneer', label: 'Stone Veneer On The Front', usd: 11_500, recoup: 1.4, days: 7, on: DETACHED, lacks: ['stone'], adds: { gains: ['stone'] } },
  // Heating and power.
  { id: 'heat-pump', label: 'Swap The Furnace For A Heat Pump', usd: 19_000, recoup: 0.62, days: 5, renews: 'hvac', on: HOUSES, needs: ['furnace'], adds: { gains: ['heatPump'], drops: ['furnace'] } },
  { id: 'hvac', label: 'Replace The Heating And Cooling', usd: 12_000, recoup: 0.55, days: 3, renews: 'hvac', on: ALL, lacks: ['furnace'] },
  { id: 'furnace', label: 'Replace The Furnace', usd: 7_500, recoup: 0.55, days: 2, renews: 'hvac', on: HOUSES, needs: ['furnace'] },
  { id: 'generator', label: 'Backup Generator', usd: 13_500, recoup: 0.9, days: 2, on: DETACHED, lacks: ['generator'], adds: { gains: ['generator'] } },
  { id: 'solar', label: 'Solar Panels And Batteries', usd: 55_000, recoup: 0.3, days: 4, on: DETACHED, lacks: ['solar'], adds: { gains: ['solar'] } },
  { id: 'solar-renew', label: 'Replace The Solar Panels', usd: 30_000, recoup: 0.3, days: 3, renews: 'solar', on: DETACHED, needs: ['solar'] },
  // Outside.
  { id: 'deck-wood', label: 'Build A Wood Deck', usd: 18_000, recoup: 0.9, days: 10, on: HOUSES, needs: ['yard'], lacks: ['deck'], adds: { gains: ['deck'] } },
  { id: 'deck-composite', label: 'Build A Composite Deck', usd: 25_000, recoup: 0.85, days: 12, on: HOUSES, needs: ['yard'], lacks: ['deck'], adds: { gains: ['deck'] } },
  { id: 'deck-renew', label: 'Rebuild The Deck', usd: 18_000, recoup: 0.8, days: 10, renews: 'deck', on: HOUSES, needs: ['deck'] },
  { id: 'patio', label: 'Stone Patio And Outdoor Kitchen', usd: 51_000, recoup: 0.45, days: 21, on: DETACHED, needs: ['yard'], lacks: ['patio'], adds: { gains: ['patio'] } },
  { id: 'pool', label: 'Put In A Pool', usd: 65_000, recoup: 0.45, days: 60, on: DETACHED, needs: ['yard'], lacks: ['pool'], lot: 6_000, adds: { gains: ['pool'] } },
  { id: 'pool-renew', label: 'Resurface And Re-Equip The Pool', usd: 20_000, recoup: 0.5, days: 14, renews: 'pool', on: DETACHED, needs: ['pool'] },
  // Room.
  { id: 'basement', label: 'Finish The Basement', usd: 52_000, recoup: 0.72, days: 45, on: HOUSES, needs: ['basement'], adds: { gains: ['finishedBasement'], drops: ['basement'], size: 600 } },
  { id: 'attic', label: 'Turn The Attic Into A Bedroom', usd: 70_000, recoup: 0.55, days: 45, on: DETACHED, needs: ['attic'], adds: { drops: ['attic'], beds: 1, size: 300 }, bedsUpTo: 7 },
  { id: 'garage-room', label: 'Turn The Garage Into A Room', usd: 28_000, recoup: 0.5, days: 30, on: DETACHED, needs: ['garage'], adds: { drops: ['garage'], size: 250 } },
  { id: 'bath-add', label: 'Add A Bathroom', usd: 60_000, recoup: 0.52, days: 45, on: HOUSES, adds: { baths: 1, size: 48 }, bathsUpTo: 'bedsPlusOne' },
  { id: 'bath-add-upscale', label: 'Add A Primary Bathroom', usd: 110_000, recoup: 0.36, days: 60, on: DETACHED, adds: { baths: 1, size: 100 }, bathsUpTo: 'bedsPlusOne' },
  { id: 'suite', label: 'Add A Primary Suite', usd: 168_000, recoup: 0.34, days: 90, on: DETACHED, lot: 5_000, adds: { beds: 1, baths: 1, size: 384 }, bedsUpTo: 7 },
  { id: 'suite-upscale', label: 'Add An Upscale Primary Suite', usd: 345_000, recoup: 0.2, days: 120, on: DETACHED, lot: 7_000, adds: { beds: 1, baths: 1, size: 640 }, bedsUpTo: 8 },
  { id: 'adu', label: 'Build A Backyard Cottage', usd: 162_000, recoup: 0.44, days: 150, on: DETACHED, needs: ['yard'], lacks: ['adu'], lot: 6_000, adds: { gains: ['adu'] } },
];

/**
 * Improving past the street: what a buyer pays for work beyond half again
 * what the home cost is half what it would be. A buyer prices a home by its
 * neighbors, and the dearest house on a street sells at a discount to its
 * cost. SLATE's estimate of where it bites.
 */
export const OVERBUILT_AT = 0.5;
export const OVERBUILT_RECOUP = 0.5;

// ---------------------------------------------------------------------------
// Letting

/**
 * A home's market rent from the town's one-bedroom, by its bedrooms: near
 * the ratios HUD sets its Fair Market Rents by, from an efficiency at 0.87
 * of a one-bedroom to a four-bedroom at 1.77, carried on at SLATE's estimate
 * past four. A backyard cottage lets as a studio.
 */
export const BEDROOM_RENT: readonly number[] = [0.87, 1, 1.23, 1.56, 1.77, 1.95, 2.1, 2.25];

// ---------------------------------------------------------------------------
// England's council tax

/**
 * England's council tax, as the Local Government Finance Act 1992 has it:
 * a home's band by what it would have sold for on 1 April 1991, each band a
 * set share of Band D, 25% off for somebody who lives alone, and a year's
 * bill in ten monthly instalments from April. Band D is the average England's
 * councils set for 2025–26, £2,280, held. A home's 1991 value is SLATE's
 * estimate: today's over how far English prices have risen since, near
 * five times.
 */
export const COUNCIL_TAX = {
  /** Upper edges of bands A to G, in pounds of 1991; H is above G. */
  bands: [40_000, 52_000, 68_000, 88_000, 120_000, 160_000, 320_000] as const,
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const,
  /** Each band's ninths of Band D. */
  ninths: [6, 7, 8, 9, 11, 13, 15, 18] as const,
  bandD: 2_280_00,
  bandDYear: '2025–26',
  since1991: 5.1,
  livingAlone: 0.25,
  instalments: 10,
  /** A rented flat's band and a room's: SLATE's estimates, a one-bedroom in B, a shared flat in C split four ways. */
  rentedBand: { own: 1, shared: 2 } as const,
  sharedBy: 4,
};

// ---------------------------------------------------------------------------
// A home on an American return

/**
 * What the federal return does with a home, as the law stands after the
 * 2025 act: mortgage interest on up to $750,000 of what was borrowed to buy
 * it; state and local taxes to a cap of $40,000 for 2025, a percent more
 * each year to 2029 and $10,000 from 2030, cut by 30% of income over
 * $500,000 (a percent more each year too) to no less than $10,000, and only
 * an American home's property tax; mortgage insurance as interest from 2026;
 * a home's gain free to $250,000 for somebody who owned it and lived in it
 * two of the five years before the sale; long-term gains taxed at 0%, 15%
 * and 20% on 2025's single brackets, held; 3.8% on investment income past
 * $200,000; rent less its costs and a residential building's depreciation
 * over 27.5 years, and a loss let against other income to $25,000, less half
 * of income over $100,000, the rest carried forward. The building is 80% of
 * what a home cost, SLATE's estimate of the land's share.
 */
export const HOME_TAX = {
  acquisitionCap: 750_000_00,
  saltCap: { 2025: 40_000_00, 2026: 40_400_00, 2027: 40_804_00, 2028: 41_212_00, 2029: 41_624_00 } as Readonly<Record<number, number>>,
  saltFloor: 10_000_00,
  saltPhaseFrom: { 2025: 500_000_00, 2026: 505_000_00, 2027: 510_050_00, 2028: 515_151_00, 2029: 520_302_00 } as Readonly<Record<number, number>>,
  saltPhaseRate: 0.3,
  pmiFrom: 2026,
  exclusion: 250_000_00,
  exclusionDays: 730,
  exclusionWindowYears: 5,
  ltcg: [[48_350_00, 0], [533_400_00, 0.15], [Number.POSITIVE_INFINITY, 0.2]] as const,
  niitRate: 0.038,
  niitFrom: 200_000_00,
  depreciationYears: 27.5,
  buildingShare: 0.8,
  passiveAllowance: 25_000_00,
  passivePhaseFrom: 100_000_00,
  passivePhaseRate: 0.5,
};
