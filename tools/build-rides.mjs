/**
 * Builds src/engine/content/ridelineup.ts from each market's wider lineup of
 * bicycles, e-bikes and ATVs, read from the makers' pages and their
 * retailers' (docs/research/catalog/rides-*.json, from 2026-10-05), beside
 * the first catalog's 26 (`content/ridecatalog.ts`). Run:
 * node tools/build-rides.mjs
 *
 * A model already in the first catalog keeps its first reading, and one
 * without a price read isn't sold. An e-bike is taken only where it's one
 * the place lets be ridden without a license, by its motor as published:
 * Britain's and Ireland's 250 W to 25 km/h, Canada's 500 W to 32 km/h,
 * America's 750 W; Mexico's as sold. One whose motor wasn't read is taken
 * as its seller offers it, a legal one. An ATV without its engine size read
 * isn't taken: what insures it is by kind, but nothing is guessed.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const DIR = 'docs/research/catalog';
const FIRST = new Set([...readFileSync('src/engine/content/ridecatalog.ts', 'utf8').matchAll(/"id": "([a-z0-9-]+)"/g)].map((x) => x[1]));
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
/** The most an e-bike's motor may be, watts, and its assistance, km/h, to be ridden without a license. */
const EBIKE = { US: [750, 32], CA: [500, 32], GB: [250, 25], IE: [250, 25] };

const VAT_READ = new Set(['Honda', 'Polaris', 'Can-Am', 'Segway Powersports', 'Suzuki']);
const models = [];
const seen = new Set();
for (const f of existsSync(DIR) ? readdirSync(DIR).filter((x) => /^rides-.*\.json$/.test(x)).sort() : []) {
  const r = JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8'));
  for (const m of r.models ?? []) {
    if (!['US', 'CA', 'MX', 'GB', 'IE'].includes(m.market) || !['bicycle', 'ebike', 'atv'].includes(m.kind) || !m.make || !m.model) continue;
    const p = m.basePrice;
    if (!p || typeof p.amount !== 'number' || !(p.amount > 0) || !p.currency || !p.url) continue;
    const cap = EBIKE[m.market];
    if (m.kind === 'ebike' && cap && ((typeof m.motorW === 'number' && m.motorW > cap[0]) || (typeof m.assistKmh === 'number' && m.assistKmh > cap[1] + 0.5))) continue;
    if (m.kind === 'atv' && !(typeof m.cc === 'number' && m.cc > 0)) continue;
    // A British or Irish ATV only where the page said whether VAT is in its price: Honda's and Polaris's say it isn't,
    // Can-Am's, Segway's, Suzuki's and Quadzilla's QZ300's that it is. The rest were filed by the trade's convention,
    // which is a guess, so they aren't sold (2026-10-05).
    if (m.kind === 'atv' && (m.market === 'GB' || m.market === 'IE') && !(m.market === 'GB' && (VAT_READ.has(m.make) || (m.make === 'Quadzilla' && /QZ ?300/i.test(m.model))))) continue;
    const id = `${m.market.toLowerCase()}-${slug(m.make)}-${slug(m.model)}`;
    if (FIRST.has(id) || seen.has(id)) continue;
    seen.add(id);
    models.push({
      id, market: m.market, kind: m.kind, make: m.make, model: m.model, trim: '',
      rank: null,
      price: Math.round(p.amount * 100),
      currency: p.currency,
      taxIncluded: p.includesTax === true,
      delivery: 0,
      deliveryBasis: 'no destination or delivery charge was published with it',
      fuel: m.kind === 'ebike' ? 'ev' : 'petrol',
      per100km: m.kind === 'atv' ? null : 0,
      economyBasis: m.kind === 'bicycle' ? `${m.make}’s is pedaled: nothing burned` : m.kind === 'ebike' ? `${m.make}’s is charged at home, for pennies SLATE doesn’t count` : `${m.make} publishes no fuel figure: an outing’s isn’t charged`,
      co2: null,
      kerbKg: typeof m.kerbKg === 'number' && m.kerbKg > 0 ? m.kerbKg : null,
      ...(m.kind === 'atv' ? { cc: Math.round(m.cc) } : {}),
      source: p.url,
      sourceType: p.sourceType === 'primary' ? 'read on the maker’s page' : 'read on a retailer’s page',
    });
  }
}
models.sort((a, b) => a.market.localeCompare(b.market) || a.kind.localeCompare(b.kind) || a.price - b.price);

const out = `/**
 * SLATE — each market's wider lineup of bicycles, e-bikes and ATVs, built by
 * \`tools/build-rides.mjs\` from \`docs/research/catalog/rides-*.json\` (from
 * 2026-10-05). Don't edit by hand.
 *
 * The makers' current list prices as read on their own pages or a
 * retailer's. A US or Canadian price is before sales tax; a British, Irish
 * or Mexican one includes it. An e-bike here is one ridden without a license
 * where it's sold. What each does is the outing (\`systems/outings.ts\`).
 */

import type { CarModel } from './vehiclecatalog';

export const RIDE_LINEUP: readonly CarModel[] = ${JSON.stringify(models, null, 2)};
`;
writeFileSync('src/engine/content/ridelineup.ts', out);
try { execSync('node tools/voice-check.mjs --fix src/engine/content/ridelineup.ts', { stdio: 'ignore' }); } catch { /* left to the gate */ }
console.log(`${models.length} models from ${new Set(models.map((m) => m.make)).size} makes`);
