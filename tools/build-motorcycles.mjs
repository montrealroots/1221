/**
 * Builds src/engine/content/motocatalog.ts from each market's motorcycle and
 * scooter lineup, read from the makers' own pages and their dealers'
 * (docs/research/catalog/moto-*.json, from 2026-10-05), beside the first
 * catalog's 36 (`content/bikecatalog.ts`). Run: node tools/build-motorcycles.mjs
 *
 * A model already in the first catalog keeps its first reading. One without a
 * price read isn't sold. An electric one isn't taken yet: Britain and Ireland
 * license and tax an electric motorcycle by its power, not an engine's size,
 * and SLATE's two-wheel licenses, taxes and insurance read the engine's cc.
 * Each tank a maker states goes to `MOTO_TANKS`; one not stated is the median
 * of its kind's (`capacityOf` in `systems/fueltank.ts`). A model whose engine
 * size wasn't read isn't taken either, until a later read finds it
 * (`moto-cc.json`).
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DIR = 'docs/research/catalog';
const FIRST = new Set([...readFileSync('src/engine/content/bikecatalog.ts', 'utf8').matchAll(/"id": "([a-z0-9-]+)"/g)].map((x) => x[1]));
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Liters per 100 km from what was published, or null. */
function per100(e) {
  if (!e || typeof e.value !== 'number' || !(e.value > 0)) return null;
  const u = String(e.unit ?? '').toLowerCase();
  if (u.includes('l/100')) return e.value;
  if (u.includes('km/l')) return Math.round((100 / e.value) * 100) / 100;
  if (u.includes('mpg')) {
    const litres = u.includes('us') ? 3.785411784 : 4.54609;
    return Math.round(((100 * litres) / (e.value * 1.609344)) * 100) / 100;
  }
  return null;
}

/**
 * What's sold for off the road and can't be registered on it, so isn't a
 * motorcycle SLATE sells to ride: motocross and trail models everywhere, a
 * GasGas EC in America (sold for closed courses there; Britain registers its
 * own), a Husqvarna TE or FE in Mexico (sold for competition). Read by hand,
 * 2026-10-05. And a size read from a model's name, not its engine.
 */
const OFF_ROAD = /^(?:.*\|GasGas\|MC .*|.*\|Husqvarna\|(?:TC|FC) .*|.*\|Honda\|CRF\d+F|US\|GasGas\|EC .*|MX\|Husqvarna\|(?:TE|FE) .*)$/;
const MISREAD = new Set(['IE|Vespa|946 Snake']);

const MARKETS = ['US', 'CA', 'MX', 'GB', 'IE'];
const KINDS = ['motorcycle', 'scooter'];
const models = [];
const tanks = {};
const seen = new Set();
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => /^moto-.*\.json$/.test(f)).sort() : [];
// Engine sizes and tanks read afterwards for models first read without them (`moto-cc.json`), by market, make and model.
const read = (f) => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
const SPECS = new Map(files.flatMap((f) => read(f).specs ?? []).map((x) => [`${x.market}|${x.make}|${x.model}`, x]));
for (const f of files) {
  const r = read(f);
  for (const m of r.models ?? []) {
    if (!MARKETS.includes(m.market) || !KINDS.includes(m.kind) || !m.make || !m.model) continue;
    const key = `${m.market}|${m.make}|${m.model}`;
    if (OFF_ROAD.test(key)) continue;
    if (MISREAD.has(key)) m.cc = null;
    const spec = SPECS.get(key);
    if (spec?.electric === true) continue;
    if (m.cc == null && typeof spec?.cc === 'number') m.cc = spec.cc;
    if (m.tankL == null && typeof spec?.tankL === 'number') m.tankL = spec.tankL;
    if (m.fuel !== 'petrol') continue;
    // Nor one whose engine size wasn't read: its tax, insurance and license are by cc, and none is guessed.
    if (!(typeof m.cc === 'number' && m.cc > 0)) continue;
    const p = m.basePrice;
    if (!p || typeof p.amount !== 'number' || !(p.amount > 0) || !p.currency || !p.url) continue;
    const id = `${m.market.toLowerCase()}-${slug(m.make)}-${slug(m.model)}`;
    if (FIRST.has(id) || seen.has(id)) continue;
    seen.add(id);
    const economy = per100(m.economy);
    const delivery = m.delivery && typeof m.delivery.amount === 'number' && m.delivery.amount > 0 ? m.delivery : undefined;
    models.push({
      id, market: m.market, kind: m.kind, make: m.make, model: m.model, trim: p.trim ?? '',
      rank: null,
      price: Math.round(p.amount * 100),
      currency: p.currency,
      taxIncluded: p.includesTax === true,
      delivery: delivery ? Math.round(delivery.amount * 100) : 0,
      deliveryBasis: delivery ? String(delivery.basis ?? 'the charge its maker states') : 'no destination or delivery charge was published with it',
      fuel: 'petrol',
      per100km: economy,
      economyBasis: economy !== null ? `${m.economy.value} ${m.economy.unit}, ${m.make}’s figure` : 'not published by its maker',
      co2: null,
      kerbKg: typeof m.kerbKg === 'number' && m.kerbKg > 0 ? m.kerbKg : null,
      ...(typeof m.cc === 'number' && m.cc > 0 ? { cc: Math.round(m.cc) } : {}),
      source: p.url,
      sourceType: p.sourceType === 'primary' ? 'read on the maker’s page' : 'read on a dealer’s or the trade press’s page',
    });
    if (typeof m.tankL === 'number' && m.tankL > 0) tanks[id] = { tankL: Math.round(m.tankL * 10) / 10 };
  }
}
models.sort((a, b) => a.market.localeCompare(b.market) || a.make.localeCompare(b.make) || a.price - b.price);

const out = `/**
 * SLATE — each market's wider lineup of motorcycles and scooters, built by
 * \`tools/build-motorcycles.mjs\` from \`docs/research/catalog/moto-*.json\`
 * (from 2026-10-05). Don't edit by hand.
 *
 * The makers' current list prices as read on their own pages or a dealer's,
 * with the engine's size, the maker's economy and tank where published. A
 * US or Canadian price is before sales tax; a British, Irish or Mexican one
 * includes it. A motorcycle with no economy published burns the mean of
 * those rated (\`BIKE_UNRATED_PER100\` in \`systems/vehicles.ts\`).
 */

import type { CarModel } from './vehiclecatalog';
import type { Capacity } from './tanks';

export const MOTO_MODELS: readonly CarModel[] = ${JSON.stringify(models, null, 2)};

/** The tanks the makers state, liters. */
export const MOTO_TANKS: Readonly<Record<string, Capacity>> = ${JSON.stringify(tanks, null, 2)};
`;
writeFileSync('src/engine/content/motocatalog.ts', out);
try { execSync('node tools/voice-check.mjs --fix src/engine/content/motocatalog.ts', { stdio: 'ignore' }); } catch { /* left to the gate */ }
const makes = new Set(models.map((m) => m.make));
console.log(`${models.length} models from ${makes.size} makes; ${Object.keys(tanks).length} tanks`);
