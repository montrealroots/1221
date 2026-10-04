/**
 * Builds `src/engine/content/fuelcharging.ts` from
 * `docs/research/world/research-fuel-charging.json` (read 2026-10-03): each
 * named station's grades and, where published, its own posted price; the
 * areas' mid-grade and premium averages; named public chargers with their
 * network, connectors, power, price and who may use them; each electric
 * model's connectors; and measured charge curves.
 *
 * Run: node tools/build-fuel-charging.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const R = JSON.parse(readFileSync('docs/research/world/research-fuel-charging.json', 'utf8'));
const OUT = 'src/engine/content/fuelcharging.ts';

/** A grade's name as the research read it, to SLATE's five. Propane and AdBlue aren't a car's fuel here. */
function grade(name) {
  const n = name.toLowerCase();
  if (/adblue|propane/.test(n)) return undefined;
  if (/sdv|premium diesel/.test(n)) return 'premium-diesel';
  if (/diesel|b7/.test(n)) return 'diesel';
  if (/mid/.test(n)) return 'mid';
  if (/premium|super|e5/.test(n)) return 'premium';
  if (/regular|unleaded|e10|magna/.test(n)) return 'regular';
  return undefined;
}
/** A posted price in the minor unit a liter: pence, cents, centavos. */
function minor(p) {
  if (/pence/.test(p.unit)) return p.price;
  return Math.round(p.price * 100 * 1000) / 1000;
}
/** A read's date, to the day where it has one, or the month. */
const day = (d) => String(d).match(/\d{4}-\d{2}(-\d{2})?/)?.[0] ?? String(d);
const status = (s) => (/^verified/.test(s) ? 'verified' : 'secondhand');

const stations = R.stations.map((s) => {
  const grades = [...new Set(s.grades.map(grade).filter(Boolean))];
  const prices = {};
  for (const p of s.prices ?? []) {
    const g = grade(p.grade === 'E10' ? 'E10' : p.grade === 'E5' ? 'E5' : p.grade === 'B7' ? 'B7' : p.grade === 'SDV' ? 'SDV' : p.grade);
    if (!g || prices[g]) continue;
    prices[g] = { minor: minor(p), currency: p.currency, date: day(p.date), source: p.source.split(' ')[0], status: status(p.status) };
  }
  return { name: s.station, cityId: s.townId, grades, ...(Object.keys(prices).length ? { prices } : {}), source: (s.gradesSource ?? s.source).split(' ')[0], status: status(s.status) };
});

/** The areas' averages for the grades `FUEL` doesn't keep: the nearest area to SLATE's town, metro before state. */
const AREA_PICK = {
  'US-NY': 'New York City metro', 'US-CT': 'New Haven-Meriden metro', 'US-CA': 'Los Angeles-Long Beach metro',
  GB: 'UK', 'CA-ON': 'Toronto West', 'CA-BC': 'Vancouver', 'MX-CMX': 'Ciudad de México',
};
const areas = {};
for (const p of R.premiumAverages) {
  if (p.value === null || p.value === undefined) continue;
  if (AREA_PICK[p.jurisdiction] !== p.area) continue;
  const g = grade(p.grade);
  if (g !== 'mid' && g !== 'premium' && g !== 'premium-diesel') continue;
  const perMinor = /per litre/.test(p.unit) && !/cent|pence/.test(p.unit) ? Math.round(p.value * 100 * 1000) / 1000 : p.value;
  (areas[p.jurisdiction] ??= {})[g] = { minor: perMinor, currency: p.currency, date: day(p.date), source: p.source.split(' ')[0], status: status(p.status), area: p.area };
}
// Toronto's own monthly premium stands where its west survey kept no premium.
for (const p of R.premiumAverages) if (p.jurisdiction === 'CA-ON' && p.area === 'Toronto' && !areas['CA-ON']?.premium && p.value) (areas['CA-ON'] ??= {}).premium = { minor: p.value, currency: p.currency, date: day(p.date), source: p.source.split(' ')[0], status: status(p.status), area: p.area };

const CONNECTOR = (c) => (/nacs|j3400/i.test(c) ? 'nacs' : /ccs1/i.test(c) ? 'ccs1' : /ccs2/i.test(c) ? 'ccs2' : /chademo/i.test(c) ? 'chademo' : /j1772/i.test(c) ? 'j1772' : undefined);
const NETWORK_AVG = {
  'Electrify America': (town) => R.chargingNetworks['ElectrifyAmerica-US'].perKwhAverages[{ 'us-ny-newyork': 'NY', 'us-ca-losangeles': 'CA', 'us-ct-newhaven': 'CT' }[town]],
  EVgo: (town) => R.chargingNetworks['EVgo-US'].perKwhAverages[{ 'us-ny-newyork': 'NY', 'us-ca-losangeles': 'CA', 'us-ct-newhaven': 'CT' }[town]],
  'Tesla Supercharger': (town) => R.chargingNetworks['Tesla-US'].perKwhAverages[{ 'us-ny-newyork': 'NY', 'us-ca-losangeles': 'CA', 'us-ct-newhaven': 'CT' }[town]],
};
function chargerPrice(c, town) {
  const p = c.price;
  if (p && typeof p.perKwh === 'number') return { perKwh: p.perKwh, currency: p.currency, basis: 'site' };
  if (p && p.perKwh && typeof p.perKwh === 'object') {
    const v = Object.values(p.perKwh).filter((x) => typeof x === 'number');
    // A time-of-day rate: its highest, as a session at any hour could pay it; pay-as-you-go before a member's.
    const payg = p.perKwh.payg;
    return { perKwh: typeof payg === 'number' ? payg : Math.max(...v), currency: p.currency, basis: typeof payg === 'number' ? 'site' : 'site-peak' };
  }
  if (p && typeof p.perKwh === 'string') {
    const [lo, hi] = p.perKwh.match(/[\d.]+/g).map(Number);
    return { perKwh: Math.round(((lo + (hi ?? lo)) / 2) * 1000) / 1000, currency: p.currency, basis: 'network-range' };
  }
  if (p && p.perHour) {
    const tier = Object.entries(p.perHour).find(([k]) => Number(k.replace(/\D/g, '')) >= c.maxPowerKw) ?? Object.entries(p.perHour).at(-1);
    return { perHour: tier[1], currency: p.currency, basis: 'site' };
  }
  const avg = NETWORK_AVG[c.network]?.(town);
  if (typeof avg === 'number') return { perKwh: avg, currency: 'USD', basis: 'network-average' };
  return undefined;
}
const chargers = [];
for (const [town, list] of Object.entries(R.chargers)) {
  for (const [i, c] of list.entries()) {
    const connectors = [...new Set((c.connectors ?? []).map(CONNECTOR).filter((x) => x && x !== 'j1772'))];
    const price = chargerPrice(c, town);
    chargers.push({
      id: `${town}-${i}`, cityId: town, network: c.network, name: c.siteName, address: c.address ?? '', connectors, kw: c.maxPowerKw,
      ...(price ? { price } : {}),
      open: c.nonTeslaAccess === true ? 'all' : c.nonTeslaAccess === false ? 'tesla' : 'unknown',
      ...(c.price?.idleFee ? { idle: String(c.price.idleFee) } : {}),
      source: String(c.source).split(' ')[0], date: day(c.date), status: status(c.status),
    });
  }
}

const evs = {};
for (const [id, v] of Object.entries(R.evConnectors)) {
  const raw = v.connectors ?? v.byModelYear?.['2026']?.connectors ?? [];
  const connectors = [...new Set(raw.map(CONNECTOR).filter((x) => x && x !== 'j1772'))];
  const dc = typeof v.maxDcKw === 'number' ? v.maxDcKw : v.maxDcKw ? Math.min(...Object.values(v.maxDcKw)) : undefined;
  evs[id] = { connectors, ...(dc ? { maxDcKw: dc } : {}), status: status(v.connectorStatus ?? v.byModelYear?.['2026']?.status ?? 'secondhand') };
}
// The Equinox EV's 2026 model year read 150 kW in Canada; America's the same car.
if (evs['us-chevrolet-equinox-ev'] && !evs['us-chevrolet-equinox-ev'].maxDcKw && evs['ca-chevrolet-equinox-ev']?.maxDcKw) evs['us-chevrolet-equinox-ev'].maxDcKw = evs['ca-chevrolet-equinox-ev'].maxDcKw;

const curves = {};
for (const [k, v] of Object.entries(R.dcTaper.curves)) {
  if (!v || typeof v !== 'object' || !Array.isArray(v.points)) continue;
  curves[k] = v.points.map(([soc, kw]) => [soc, kw]);
}

const head = `/**
 * SLATE — where a car is filled and a battery charged, from
 * \`docs/research/world/research-fuel-charging.json\` (read 2026-10-03),
 * built by \`tools/build-fuel-charging.mjs\`.
 *
 * - **Stations**: each named station's grades, and its own posted price
 *   where one is published: London's two Esso sites from Motor Fuel Group's
 *   statutory feed, Mexico City's three from the CNE's open data (no diesel
 *   price listed), Shell Old Brompton Road secondhand from the Fuel Finder
 *   scheme. Elsewhere grades only, read secondhand, and the area's average
 *   applies. A posted price is the day it was read, not a live price.
 * - **Areas**: mid-grade and premium averages beside \`FUEL\`'s regular and
 *   diesel: AAA's metro averages, Ontario's Toronto West survey, Statistics
 *   Canada's Vancouver, Britain's super unleaded and Mexico City's premium
 *   secondhand. Ireland publishes no premium average.
 * - **Chargers**: 40 named sites. A site's own published rate where one was
 *   read; a network's state average (DCFC Tracker) where not; the area's
 *   public average otherwise. Who may use it: open to every car, Teslas
 *   only, or not known.
 * - **Electric models**: each one's connectors in its market and its
 *   maximum DC rate. A Tesla in North America takes NACS; Tesla sells a CCS1
 *   adapter, and Chevrolet a NACS one for the Equinox EV, neither priced here.
 * - **Curves**: kW by state of charge for the catalog's own cars, from
 *   EVKX.net's published tests, secondhand.
 */
`;
const body = `
export type Grade = 'regular' | 'mid' | 'premium' | 'diesel' | 'premium-diesel';
export type Connector = 'nacs' | 'ccs1' | 'ccs2' | 'chademo';
export type Status = 'verified' | 'secondhand';
export interface Posted { minor: number; currency: string; date: string; source: string; status: Status }
export interface Station { name: string; cityId: string; grades: Grade[]; prices?: Partial<Record<Grade, Posted>>; source: string; status: Status }
export interface AreaPrice extends Posted { area: string }
export interface ChargerPrice { perKwh?: number; perHour?: number; currency: string; basis: 'site' | 'site-peak' | 'network-range' | 'network-average' }
export interface Charger { id: string; cityId: string; network: string; name: string; address: string; connectors: Connector[]; kw: number; price?: ChargerPrice; open: 'all' | 'tesla' | 'unknown'; idle?: string; source: string; date: string; status: Status }
export interface EvPorts { connectors: Connector[]; maxDcKw?: number; status: Status }

export const STATION_GRADES: readonly Station[] = ${JSON.stringify(stations)};
export const AREA_GRADES: Readonly<Record<string, Partial<Record<Grade, AreaPrice>>>> = ${JSON.stringify(areas)};
export const CHARGERS: readonly Charger[] = ${JSON.stringify(chargers)};
export const EV_PORTS: Readonly<Record<string, EvPorts>> = ${JSON.stringify(evs)};
/** kW by state of charge, percent: [soc, kW], for each model's curve. */
export const CHARGE_CURVES: Readonly<Record<string, readonly (readonly [number, number])[]>> = ${JSON.stringify(curves)};
`;
writeFileSync(OUT, head + body);
console.log(`Wrote ${OUT}: ${stations.length} stations, ${Object.keys(areas).length} areas, ${chargers.length} chargers, ${Object.keys(evs).length} models, ${Object.keys(curves).length} curves.`);
