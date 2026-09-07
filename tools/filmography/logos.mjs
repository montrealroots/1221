/**
 * Real logos for the studios and networks, from Wikidata's logo property via
 * Wikimedia Commons, normalised to one frame so they sit evenly on a card.
 *
 * Every file's license and author are recorded in logos.json beside the
 * images; a logo whose license Commons does not state is left out. Where an
 * item has no logo on record, the game shows a monogram instead: nothing is
 * drawn by hand to stand in for a real mark.
 *
 * Usage: node tools/filmography/logos.mjs
 * Reads resolved.json (studios) and cache/networks.json (networks). Resumes:
 * an item already in logos.json for the same Wikidata item, with its file on
 * disk, is not fetched again.
 */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const HERE = new URL('./', import.meta.url);
const OUT = new URL('../../public/industry/logos/', HERE);
mkdirSync(OUT, { recursive: true });
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const WIDTH = 320;
const HEIGHT = 160;
const PAUSE = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const resolved = JSON.parse(readFileSync(new URL('./resolved.json', HERE), 'utf8'));
const networks = existsSync(new URL('./cache/networks.json', HERE)) ? JSON.parse(readFileSync(new URL('./cache/networks.json', HERE), 'utf8')) : {};
const manifestPath = new URL('logos.json', OUT);
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

/**
 * Where a studio's own mark lives on a different item from its first label
 * (Sony Pictures is not Columbia), or a label's logo is not the studio's mark
 * at all (Alcon is not Village Roadshow), the item to use is named here.
 */
const LOGO_ITEM = { sony: ['Q822314'], alcon: ['Q4713342'] };
/** Files recorded as a logo on Wikidata that are not one: a photograph of a cinema is not Pathé's mark. */
const NOT_A_LOGO = new Set(['Rotterdam Pathe.jpg']);

/** The item whose logo represents each studio: its first (primary) label. */
const wanted = [];
for (const [id, labels] of Object.entries(resolved)) wanted.push({ id, kind: 'studio', qids: LOGO_ITEM[id] ?? labels.film.map((l) => l.qid).concat(labels.tv.map((l) => l.qid)) });
for (const [id, entry] of Object.entries(networks)) if (entry.qid) wanted.push({ id, kind: 'network', qids: [entry.qid] });

async function fetchWithBackoff(url, headers, attempt = 0) {
  const res = await fetch(url, { headers });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`HTTP ${res.status}`);
    const wait = 8000 * 2 ** attempt;
    console.log(`  ${res.status} from ${new URL(url).host}, waiting ${wait / 1000}s`);
    await sleep(wait);
    return fetchWithBackoff(url, headers, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function sparql(query) {
  const res = await fetchWithBackoff(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, { 'User-Agent': UA, Accept: 'application/sparql-results+json' });
  return (await res.json()).results.bindings;
}

// 1. Which file, per item.
const allQids = [...new Set(wanted.flatMap((w) => w.qids))];
const logoOf = new Map();
for (let i = 0; i < allQids.length; i += 200) {
  const batch = allQids.slice(i, i + 200);
  const rows = await sparql(`SELECT ?x ?logo WHERE { VALUES ?x { ${batch.map((q) => `wd:${q}`).join(' ')} } ?x wdt:P154 ?logo }`);
  for (const r of rows) { const q = r.x.value.split('/').pop(); const file = decodeURIComponent(r.logo.value.split('/Special:FilePath/')[1] ?? r.logo.value.split('/').pop()); if (!logoOf.has(q) && !NOT_A_LOGO.has(file)) logoOf.set(q, file); }
}
console.log(`items with a logo on record: ${logoOf.size} of ${allQids.length}`);

// 2. License and author from Commons, once per file.
const infoCache = new Map();
async function fileInfo(file) {
  if (infoCache.has(file)) return infoCache.get(file);
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(`File:${file}`)}&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=${WIDTH * 3}&format=json`;
  const res = await fetchWithBackoff(url, { 'User-Agent': UA });
  const pages = (await res.json()).query?.pages ?? {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) { infoCache.set(file, null); return null; }
  const meta = info.extmetadata ?? {};
  const strip = (v) => (v?.value ?? '').replace(/<[^>]+>/g, '').trim();
  const out = { url: info.thumburl ?? info.url, mime: info.mime, licence: strip(meta.LicenseShortName) || strip(meta.License), author: strip(meta.Artist), credit: strip(meta.Credit), pageUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}` };
  infoCache.set(file, out);
  return out;
}
const bytesCache = new Map();
async function fileBytes(url) {
  if (bytesCache.has(url)) return bytesCache.get(url);
  const res = await fetchWithBackoff(url, { 'User-Agent': UA });
  const bytes = Buffer.from(await res.arrayBuffer());
  bytesCache.set(url, bytes);
  return bytes;
}

// 3. Render each into the frame.
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
const persist = () => writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
let failed = 0;
for (const item of wanted) {
  const qid = item.qids.find((q) => logoOf.has(q));
  if (!qid) { delete manifest[item.id]; const stale = new URL(`${item.id}.png`, OUT).pathname; if (existsSync(stale)) unlinkSync(stale); console.log(`${item.id.padEnd(18)} no logo on record`); continue; }
  const file = logoOf.get(qid);
  const out = new URL(`${item.id}.png`, OUT).pathname;
  if (manifest[item.id]?.qid === qid && manifest[item.id]?.file === file && existsSync(out)) { console.log(`${item.id.padEnd(18)} kept`); continue; }
  try {
    const info = await fileInfo(file);
    await sleep(PAUSE);
    if (!info || !info.licence) { delete manifest[item.id]; console.log(`${item.id.padEnd(18)} ${file}: no license stated, skipped`); continue; }
    const bytes = await fileBytes(info.url);
    await sleep(PAUSE);
    const dataUrl = `data:${info.mime.startsWith('image/svg') ? 'image/png' : info.mime};base64,${bytes.toString('base64')}`;
    await page.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${WIDTH}px;height:${HEIGHT}px;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box"><img src="${dataUrl}" style="max-width:100%;max-height:100%;object-fit:contain"></div></body></html>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    manifest[item.id] = { kind: item.kind, qid, file, licence: info.licence, author: info.author, credit: info.credit, source: info.pageUrl };
    persist();
    console.log(`${item.id.padEnd(18)} ${info.licence.padEnd(22)} ${file}`);
  } catch (error) {
    failed++;
    console.log(`${item.id.padEnd(18)} FAILED ${file}: ${error.message}`);
  }
}
await browser.close();
persist();
console.log(`logos written: ${Object.keys(manifest).length}; failed: ${failed}`);
