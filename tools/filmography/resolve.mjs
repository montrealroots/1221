/**
 * Resolves every label in entities.mjs to a Wikidata item and writes the
 * candidates to entities.json for review. Nothing is chosen silently: the
 * first candidate whose description reads like a film or television company
 * is proposed, and every other candidate is kept beside it.
 */
import { writeFileSync } from 'node:fs';
import { STUDIOS } from './entities.mjs';

const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const COMPANY = /film|studio|production|distribut|animation|entertainment|media|television|tv|record label|company|corporation|conglomerate|label|enterprise|publisher/i;

async function search(name) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=8&format=json`;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.ok) return (await res.json()).search ?? [];
    } catch { /* retried below */ }
    await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt + Math.random() * 500));
  }
  throw new Error(`search failed: ${name}`);
}

import { existsSync, readFileSync } from 'node:fs';
const cachePath = new URL('./entities.json', import.meta.url);
const out = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : [];
const done = new Set(out.map((e) => `${e.studio}|${e.name}`));
for (const studio of STUDIOS) {
  const names = [...new Set([...studio.labels, ...studio.tv])];
  for (const name of names) {
    if (done.has(`${studio.id}|${name}`)) continue;
    const hits = await search(name);
    await new Promise((r) => setTimeout(r, 250));
    const proposed = hits.find((h) => COMPANY.test(h.description ?? '')) ?? hits[0];
    writeFileSync(cachePath, JSON.stringify(out, null, 1));
    out.push({ studio: studio.id, name, proposed: proposed ? { id: proposed.id, label: proposed.label, description: proposed.description ?? '' } : null, candidates: hits.map((h) => ({ id: h.id, label: h.label, description: h.description ?? '' })) });
    process.stdout.write(`${studio.id.padEnd(14)} ${name.padEnd(36)} -> ${proposed ? `${proposed.id.padEnd(10)} ${proposed.label} — ${proposed.description ?? ''}` : 'NO MATCH'}\n`);
  }
}
writeFileSync(new URL('./entities.json', import.meta.url), JSON.stringify(out, null, 1));
