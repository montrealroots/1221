/**
 * Builds src/engine/content/programmes.ts from
 * docs/research/world/research-tv-phones.json: each market's programs from
 * its own Netflix Top 10 for 21–27 September 2026 and Nielsen's, Barb's (as
 * Deadline reported it) and TAM Ireland's rankings, with each season's
 * episodes and its median episode's minutes. Netflix's figures are read from
 * the title page Netflix serves in that market; the rest are TVmaze's, a
 * third-party listing, whose broadcast runtimes are often the slot with its
 * adverts, and are kept marked unconfirmed. A season with no runtime is left
 * out. Each program names the ways it is watched: a streaming service's
 * name as SLATE's plans carry it, or 'live' for a broadcaster and its free
 * player. Run: node tools/build-programmes.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const r = JSON.parse(readFileSync('docs/research/world/research-tv-phones.json', 'utf8'));
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** The services SLATE's plans sell (`content/homelife.ts`) that a program's service line names, and whether a broadcaster shows it. */
function ways(service, kind) {
  const out = [];
  const s = String(service);
  if (/Netflix/.test(s)) out.push('Netflix');
  if (/Prime Video/.test(s)) out.push('Amazon Prime Video', 'Amazon Prime');
  if (/HBO Max/.test(s)) out.push('HBO Max');
  if (/Paramount\+/.test(s)) out.push('Paramount+');
  if (/Apple TV/.test(s)) out.push('Apple TV', 'Apple One');
  if (/Disney\+/.test(s)) out.push('Disney+');
  if (/Crave/.test(s)) out.push('Crave');
  if (/ViX/.test(s)) out.push('ViX');
  if (/^broadcast/.test(kind)) out.push('live');
  return out;
}

const programmes = [];
for (const [market, list] of Object.entries(r.television.markets)) {
  for (const t of list) {
    const seasons = (t.seasons ?? []).filter((x) => x.episodes > 0 && typeof x.episodeRuntimeMinutes?.median === 'number').map((x) => [x.episodes, x.episodeRuntimeMinutes.median]);
    const w = ways(t.service, t.kind);
    if (seasons.length === 0 || w.length === 0) continue;
    programmes.push({
      id: slug(`${market}-${t.title}`), market, title: t.title, service: t.service, ways: w, seasons,
      // A broadcaster's player holds its latest series, not the archive.
      broadcast: /^broadcast/.test(t.kind) && !w.some((x) => x !== 'live'),
      confirmed: t.source?.confirmed === true, source: t.source?.url ?? null,
    });
  }
}
const head = readFileSync('src/engine/content/programmes.ts', 'utf8').split('// --- generated below ---')[0];
writeFileSync('src/engine/content/programmes.ts', `${head}// --- generated below ---
export const PROGRAMMES: readonly Programme[] = JSON.parse(${JSON.stringify(JSON.stringify(programmes))});
`);
console.log(`Wrote ${programmes.length} programs.`);
