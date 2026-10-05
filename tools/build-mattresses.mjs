// Builds src/engine/content/mattresscatalog.ts (from 2026-10-05): makers' own mattresses beside IKEA's, a part each of
// a size SLATE's frames take, in each market's own sizes, from every docs/research/catalog/mattress-*.json tranche. A
// size no frame takes (twin XL, California king, a small double, a super king) isn't sold, nor a size without a price.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const OUT = 'src/engine/content/mattresscatalog.ts';
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
// The sizes SLATE's frames come in, by market (`content/beds.ts`).
const SIZES = { us: ['twin', 'full', 'queen', 'king'], ca: ['twin', 'full', 'queen', 'king'], uk: ['single', 'double', 'king'], ie: ['single', 'double', 'king'], mx: ['individual', 'matrimonial', 'queen'] };
const num = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);

const dir = 'docs/research/catalog';
const tranches = existsSync(dir) ? readdirSync(dir).filter((f) => /^mattress-.*\.json$/.test(f)).sort() : [];
const out = { us: [], ca: [], uk: [], ie: [], mx: [] };
const seen = new Set();
for (const f of tranches) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  for (const x of j.products ?? []) {
    const market = String(x.market ?? '').toLowerCase();
    if (!SIZES[market] || !x.brand || !x.model) continue;
    for (const s of x.sizes ?? []) {
      const size = String(s.size ?? '').toLowerCase();
      if (!SIZES[market].includes(size) || !(num(s.price) > 0)) continue;
      const id = `${market}-${slug(x.brand)}-${slug(x.model)}-${size}`.slice(0, 100);
      if (seen.has(id)) continue;
      seen.add(id);
      out[market].push({
        id, name: `${String(x.brand).trim()} ${String(x.model).trim()}`, size, price: s.price, brand: String(x.brand).trim(), seller: x.seller ?? x.brand,
        delivery: num(x.deliveryFee), kind: x.type ?? null, trialNights: num(x.trialNights), warrantyYears: num(x.warrantyYears), url: x.url ?? null, confirmed: x.status === 'verified',
      });
    }
  }
}
const body = `/**
 * SLATE — makers' own mattresses beside IKEA's (from 2026-10-05), built by
 * \`tools/build-mattresses.mjs\` from \`docs/research/catalog/mattress-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each model in each size SLATE's frames take, in its market's own sizes, at
 * its maker's or a retailer's regular price (America's and Canada's before
 * tax, the others' with it), with its maker's delivery fee where stated, its
 * trial nights and warranty.
 */

import type { BedPart } from './beds';

export interface BrandedMattress extends BedPart {
  brand: string; seller: string;
  /** The maker's own delivery fee, its money; 0 free; null not stated. */
  delivery: number | null;
  kind: string | null; trialNights: number | null; warrantyYears: number | null; url: string | null; confirmed: boolean;
}

export const BRANDED_MATTRESSES: Readonly<Record<string, readonly BrandedMattress[]>> = ${JSON.stringify(out, null, 0)};
`;
writeFileSync(OUT, body);
console.log(`mattresses ${Object.values(out).reduce((n, l) => n + l.length, 0)} parts (${Object.entries(out).map(([k, l]) => `${k} ${l.length}`).join(', ')}), brands ${new Set(Object.values(out).flat().map((m) => m.brand)).size}, tranches ${tranches.length}`);
