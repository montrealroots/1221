/**
 * Brief 15, money-data: a source line that ends on a bare day after a web address or a document's name ("…/pagare.html,
 * September 26, 2026") says "read" before it, as the glossary's Source line does ("read October 10, 2026"), so the day
 * isn't taken for the page's own date. `readDaysFor(file, { EXPORT: [keys left out] })` returns the edits, in
 * `apply-gen.mjs`'s shape, for every `source` of those exports that ends on such a day and doesn't already say "read"
 * just before it.
 */
import { readFileSync } from 'node:fs';

const DAY = /, ((?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4})$/;

export function readDaysFor(file, exports) {
  const src = readFileSync(file, 'utf8');
  const out = {};
  for (const m of src.matchAll(/export const (\w+)\b[^=]*= JSON\.parse\(("(?:[^"\\]|\\.)*")\);/g)) {
    if (!(m[1] in exports)) continue;
    const data = JSON.parse(JSON.parse(m[2]));
    for (const [key, entry] of Object.entries(data)) {
      if (exports[m[1]].includes(key) || typeof entry?.source !== 'string') continue;
      const day = entry.source.match(DAY);
      if (!day || /\bread$/.test(entry.source.slice(0, day.index).trim())) continue;
      (out[m[1]] ??= {})[key] = { source: `${entry.source.slice(0, day.index)}, read ${day[1]}` };
    }
  }
  return out;
}
