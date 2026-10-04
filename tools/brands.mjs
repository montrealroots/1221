// The brand each everyday product's own name states (from 2026-10-04), for the grocery, toiletry and cleaning
// builders: read in docs/research/world/research-brands-from-names.json and research-cleaning-brands.json, keyed by
// the product's chain, market and name as researched, null where the name states none.
//
// One spelling a brand across every list. Where a listing writes a brand in capitals beside its ordinary spelling
// (CLOROX and Clorox, PANTENE and Pantene), the ordinary one is kept, the most common of those, even where the capitals
// are read more often (Save-On-Foods' IVORY three times to Ivory's two), so the brand filter shows it once and the
// coverage report counts it once.
import { readFileSync } from 'node:fs';

const FILES = ['research-brands-from-names.json', 'research-cleaning-brands.json'];

export function brandIndex() {
  const items = FILES.flatMap((f) => JSON.parse(readFileSync(`docs/research/world/${f}`, 'utf8')).items);
  const spellings = new Map();
  for (const b of items) {
    if (!b.brand) continue;
    const key = b.brand.toLowerCase();
    const seen = spellings.get(key) ?? new Map();
    seen.set(b.brand, (seen.get(b.brand) ?? 0) + 1);
    spellings.set(key, seen);
  }
  const ordinary = (s) => /[a-z]/.test(s);
  const canonical = new Map([...spellings].map(([key, seen]) => [key, [...seen].sort((a, z) => Number(ordinary(z[0])) - Number(ordinary(a[0])) || z[1] - a[1] || a[0].localeCompare(z[0]))[0][0]]));
  return new Map(items.map((b) => [`${b.chain}|${b.market}|${b.name}`, b.brand ? canonical.get(b.brand.toLowerCase()) : null]));
}
