/**
 * Builds src/engine/content/rvlineup.ts from each market's wider lineup of
 * motorhomes and campervans, read from the makers' and dealers' pages
 * (docs/research/catalog/rv-*.json, from 2026-10-05), beside the first
 * catalog's (`content/rvcatalog.ts`). Run: node tools/build-rvs.mjs
 *
 * A car license drives every motorhome SLATE sells, so one is taken only
 * where its gross weight as its maker states it is within the place's car
 * license: Britain's and Ireland's category B to 3,500 kg, the American
 * states' class D or C to 26,000 lb, Ontario's G to 11,000 kg. One whose
 * gross weight wasn't read isn't taken. One without its economy read burns
 * what the first catalog's do: U-Haul's 10 mpg for its 26-foot truck for a
 * motorhome, Volkswagen's 9.0 L/100 km for its California for a campervan,
 * SLATE's estimates, and said so.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DIR = 'docs/research/catalog';
const FIRST = new Set([...readFileSync('src/engine/content/rvcatalog.ts', 'utf8').matchAll(/"id": "([a-z0-9-]+)"/g)].map((x) => x[1]));
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** The most a car license drives, kg gross. */
const CAR_LICENSE_KG = { GB: 3500, IE: 3500, US: 26000 * 0.45359237, CA: 11000 };
const UNRATED = {
  motorhome: [23.5, 'U-Haul’s 10 mpg for its 26-foot truck, the nearest vehicle of its size that publishes one: SLATE’s estimate'],
  campervan: [9, 'Volkswagen’s WLTP 9.0 L/100 km for its California campervan, the nearest published: SLATE’s estimate'],
};
function per100(e) {
  if (!e || typeof e.value !== 'number' || !(e.value > 0)) return null;
  const u = String(e.unit ?? '').toLowerCase();
  if (u.includes('l/100')) return e.value;
  if (u.includes('mpg')) return Math.round(((100 * (u.includes('us') ? 3.785411784 : 4.54609)) / (e.value * 1.609344)) * 100) / 100;
  return null;
}

const models = [];
const seen = new Set();
for (const f of existsSync(DIR) ? readdirSync(DIR).filter((x) => /^rv-.*\.json$/.test(x)).sort() : []) {
  for (const m of JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')).models ?? []) {
    if (!['motorhome', 'campervan'].includes(m.kind) || !m.make || !m.model) continue;
    const cap = CAR_LICENSE_KG[m.market];
    if (!cap || !(typeof m.grossKg === 'number' && m.grossKg > 0 && m.grossKg <= cap + 0.5)) continue;
    const p = m.basePrice;
    if (!p || !(p.amount > 0) || !p.currency || !p.url) continue;
    const id = `${m.market.toLowerCase()}-${slug(m.make)}-${slug(m.model)}`;
    if (FIRST.has(id) || seen.has(id)) continue;
    seen.add(id);
    const read = per100(m.economy);
    models.push({
      id, market: m.market, kind: m.kind, make: m.make, model: m.model, trim: '', rank: null,
      price: Math.round(p.amount * 100), currency: p.currency, taxIncluded: p.includesTax === true,
      delivery: 0, deliveryBasis: 'no destination or delivery charge was published with it',
      fuel: m.fuel === 'diesel' ? 'diesel' : 'petrol',
      per100km: read ?? UNRATED[m.kind][0],
      economyBasis: read !== null ? `${m.economy.value} ${m.economy.unit}, ${m.make}’s figure` : `none published by ${m.make}: ${UNRATED[m.kind][1]}`,
      co2: null, kerbKg: null,
      source: p.url, sourceType: p.sourceType === 'primary' ? 'read on the maker’s page' : 'read on a dealer’s page or a guide’s (RVUSA)',
    });
  }
}
models.sort((a, b) => a.market.localeCompare(b.market) || a.make.localeCompare(b.make) || a.price - b.price);
writeFileSync('src/engine/content/rvlineup.ts', `/**
 * SLATE — each market's wider lineup of motorhomes and campervans, built by
 * \`tools/build-rvs.mjs\` from \`docs/research/catalog/rv-*.json\` (from
 * 2026-10-05). Don't edit by hand. Each within the place's car license by its
 * gross weight; its economy its maker's where read, else the first catalog's
 * estimate for its kind.
 */

import type { CarModel } from './vehiclecatalog';

export const RV_LINEUP: readonly CarModel[] = ${JSON.stringify(models, null, 2)};
`);
try { execSync('node tools/voice-check.mjs --fix src/engine/content/rvlineup.ts', { stdio: 'ignore' }); } catch { /* left to the gate */ }
console.log(`${models.length} models from ${new Set(models.map((m) => m.make)).size} makes`);
