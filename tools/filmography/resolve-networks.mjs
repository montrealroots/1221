/** Resolves each network in networks.mjs to its Wikidata item; writes cache/networks.json for review. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { NETWORKS } from './networks.mjs';
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const TV = /television|tv|channel|network|streaming|broadcast|video on demand|media|broadcaster|service|company|corporation|pay television|subscription/i;
const out = new URL('./cache/networks.json', import.meta.url);
const cache = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {};
async function search(name) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=8&format=json`, { headers: { 'User-Agent': UA } });
      if (res.ok) return (await res.json()).search ?? [];
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 1500 * 2 ** attempt));
  }
  return [];
}
for (const n of NETWORKS) {
  if (cache[n.id]?.qid) continue;
  let hits = await search(n.name);
  let pick = hits.find((h) => TV.test(h.description ?? ''));
  for (const alias of n.aliases) { if (pick) break; hits = await search(alias); pick = hits.find((h) => TV.test(h.description ?? '')); }
  cache[n.id] = { name: n.name, qid: pick?.id ?? null, label: pick?.label ?? null, description: pick?.description ?? null, candidates: hits.map((h) => ({ id: h.id, label: h.label, description: h.description ?? '' })) };
  writeFileSync(out, JSON.stringify(cache, null, 1));
  console.log(`${n.id.padEnd(18)} -> ${pick ? `${pick.id.padEnd(11)} ${pick.label} — ${(pick.description ?? '').slice(0, 60)}` : 'NO MATCH'}`);
  await new Promise((r) => setTimeout(r, 250));
}
