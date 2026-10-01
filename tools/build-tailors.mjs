/**
 * Builds src/engine/content/tailors.ts from
 * docs/research/world/research-clothing-services2.json: each town's named
 * tailors that publish what taking in a waist costs, the lowest of a range
 * ("from"), and their turnaround where they say it.
 *
 *   node tools/build-tailors.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const r = JSON.parse(readFileSync('docs/research/world/research-clothing-services2.json', 'utf8'));
const CITY = {
  new_york: 'us-ny-newyork', los_angeles: 'us-ca-losangeles', new_haven: 'us-ct-newhaven', london: 'uk-eng-london',
  dublin: 'ie-lei-dublin', toronto: 'ca-on-toronto', vancouver: 'ca-bc-vancouver', mexico_city: 'mx-cmx-mexicocity',
};
const first = (v) => { if (v === null || v === undefined) return null; const m = String(typeof v === 'object' ? v.value : v).match(/\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
const days = (s) => { if (!s) return null; const m = String(s).match(/(\d+)\s*(?:-|to)\s*(\d+)?\s*(business )?days?/i) ?? String(s).match(/(\d+)\s*(business )?days?/i); if (m) return Number(m[2] ?? m[1]); const w = String(s).match(/(\d+)\s*(?:-|to)?\s*(\d+)?\s*weeks?/i) ?? (/within a week/i.test(s) ? [0, '1'] : null); if (w) return 7 * Number(w[2] ?? w[1]); const h = String(s).match(/(\d+)\s*hours?/i); return h ? Math.ceil(Number(h[1]) / 24) : null; };
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const out = [];
for (const [key, town] of Object.entries(r.alterations)) {
  const cityId = CITY[key];
  if (!cityId || !Array.isArray(town.shops)) continue;
  for (const s of town.shops) {
    if (/own garments only/i.test(s.name)) continue;
    const takeIn = first(s.prices?.take_in_waist);
    if (takeIn === null) continue;
    out.push({
      id: `${slug(s.name)}-${cityId}`, name: s.name.replace(/\s*\(.*\)\s*$/, ''), cityId, address: s.address ?? null, currency: town.currency,
      takeIn, from: /[+-]|up/.test(String(s.prices.take_in_waist.value ?? '')), turnaroundDays: days(s.turnaround_days),
      source: s.source?.url ?? null, read: s.source?.method === 'page' ? 'page' : 'search-summary',
    });
  }
}

const body = `/**
 * SLATE — tailors by town (Stage 3 of \`docs/BACKLOG.md\`), built by
 * \`tools/build-tailors.mjs\` from \`docs/research/world/research-clothing-services2.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each the town's named tailors that publish what taking in a waist costs:
 * the price, the lowest of a range where it's a range (\`from\`), and the
 * days it takes where the shop says. A shop that alters only its own
 * garments isn't here.
 */

export interface Tailor { id: string; name: string; cityId: string; address: string | null; currency: string; takeIn: number; from: boolean; turnaroundDays: number | null; source: string | null; read: 'page' | 'search-summary' }

export const TAILORS: readonly Tailor[] = JSON.parse(${JSON.stringify(JSON.stringify(out))});
`;
writeFileSync('src/engine/content/tailors.ts', body);
console.log(out.length, 'tailors', out.map((t) => `${t.cityId}:${t.name}:${t.takeIn}:${t.turnaroundDays}`).join(' | '));
