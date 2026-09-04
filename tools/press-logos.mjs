/**
 * Real mastheads for the press, from Wikidata's logo property via Wikimedia
 * Commons, normalised to the same frame the studio and network logos use.
 *
 * Every file's licence and author go into the same logos.json manifest beside
 * the images. A logo whose licence Commons does not state is left out, and an
 * outlet with no logo on record shows a monogram instead — nothing is drawn by
 * hand to stand in for a real mark.
 *
 * Usage: NODE_USE_ENV_PROXY=1 node tools/press-logos.mjs
 * Resumes: an outlet already in logos.json for the same Wikidata item, with
 * its file on disk, is not fetched again.
 */
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = new URL('../public/industry/logos/', import.meta.url);
const UA = 'SLATE-build/1.0 (film simulator dataset builder; contact via repository)';
const WIDTH = 320;
const HEIGHT = 160;
const PAUSE = 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * The Wikidata item for each publication. Written out rather than searched,
 * because a search for "Variety" finds a great many things that are not the
 * trade paper, and a wrong logo is worse than none.
 */
const ITEMS = {
  variety: 'Q471728',
  'hollywood-reporter': 'Q61503',
  deadline: 'Q4037100',
  indiewire: 'Q6024460',
  thewrap: 'Q17042582',
  puck: 'Q110924837',
  nexttv: 'Q4972128',
  'screen-international': 'Q7434202',
  c21: null,
  'le-film-francais': 'Q3230175',
  'blickpunkt-film': 'Q885944',
  'kinema-junpo': 'Q1052227',
  'bollywood-hungama': 'Q4939834',
  fotogramas: 'Q1529522',
  'sight-and-sound': 'Q1546271',
  cahiers: 'Q909176',
  'film-comment': 'Q4038736',
  'little-white-lies': 'Q6650066',
  rogerebert: 'Q30588211',
  empire: 'Q1345005',
  'total-film': 'Q2270191',
  vulture: 'Q27881700',
  slashfilm: 'Q7540023',
  collider: 'Q20706938',
  screenrant: 'Q7434206',
  'the-playlist': 'Q140065976',
  'av-club': 'Q3233970',
  'rotten-tomatoes': 'Q105584',
  metacritic: 'Q150248',
  'box-office-mojo': 'Q223142',
  'the-numbers': 'Q17072251',
  letterboxd: 'Q18709181',
  nyt: 'Q9684',
  latimes: 'Q188515',
  guardian: 'Q11148',
  wsj: 'Q164746',
  ft: 'Q183399',
  'washington-post': 'Q166032',
  'le-monde': 'Q12461',
  reuters: 'Q130879',
  ap: 'Q40469',
  afp: 'Q40464',
  bloomberg: 'Q14270642',
};

async function fetchWithBackoff(url, headers, attempt = 0) {
  const res = await fetch(url, { headers });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`HTTP ${res.status}`);
    const wait = 6000 * 2 ** attempt;
    console.log(`  ${res.status} from ${new URL(url).host}, waiting ${wait / 1000}s`);
    await sleep(wait);
    return fetchWithBackoff(url, headers, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function sparql(query) {
  const res = await fetchWithBackoff(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
  );
  return (await res.json()).results.bindings;
}

const manifestPath = new URL('logos.json', OUT);
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {};

const wanted = Object.entries(ITEMS).filter(([, qid]) => qid).map(([id, qid]) => ({ id, qid }));
console.log(`${wanted.length} outlets with an item on record, ${Object.keys(ITEMS).length - wanted.length} without`);

// 1. Which file, per item.
const logoOf = new Map();
for (let i = 0; i < wanted.length; i += 100) {
  const batch = wanted.slice(i, i + 100);
  const rows = await sparql(`SELECT ?x ?logo WHERE { VALUES ?x { ${batch.map((w) => `wd:${w.qid}`).join(' ')} } ?x wdt:P154 ?logo }`);
  for (const r of rows) {
    const q = r.x.value.split('/').pop();
    const file = decodeURIComponent(r.logo.value.split('/Special:FilePath/')[1] ?? r.logo.value.split('/').pop());
    if (!logoOf.has(q)) logoOf.set(q, file);
  }
}
console.log(`outlets with a logo on record: ${logoOf.size} of ${wanted.length}`);

// 2. Licence and author from Commons, once per file.
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
  const out = {
    url: info.thumburl ?? info.url, mime: info.mime,
    licence: strip(meta.LicenseShortName) || strip(meta.License),
    author: strip(meta.Artist), credit: strip(meta.Credit),
    pageUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
  };
  infoCache.set(file, out);
  return out;
}

// 3. Render each into the frame.
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
const persist = () => writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
let written = 0;
let failed = 0;
for (const item of wanted) {
  const file = logoOf.get(item.qid);
  const out = new URL(`${item.id}.png`, OUT).pathname;
  if (!file) {
    delete manifest[item.id];
    if (existsSync(out)) unlinkSync(out);
    console.log(`${item.id.padEnd(20)} no logo on record`);
    continue;
  }
  if (manifest[item.id]?.qid === item.qid && manifest[item.id]?.file === file && existsSync(out)) {
    console.log(`${item.id.padEnd(20)} kept`);
    continue;
  }
  try {
    const info = await fileInfo(file);
    await sleep(PAUSE);
    if (!info || !info.licence) {
      delete manifest[item.id];
      console.log(`${item.id.padEnd(20)} ${file}: no licence stated, skipped`);
      continue;
    }
    const res = await fetchWithBackoff(info.url, { 'User-Agent': UA });
    const bytes = Buffer.from(await res.arrayBuffer());
    await sleep(PAUSE);
    const mime = info.mime.startsWith('image/svg') ? 'image/png' : info.mime;
    const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`;
    await page.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${WIDTH}px;height:${HEIGHT}px;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box"><img src="${dataUrl}" style="max-width:100%;max-height:100%;object-fit:contain"></div></body></html>`);
    await page.waitForTimeout(150);
    await page.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    manifest[item.id] = { kind: 'outlet', qid: item.qid, file, licence: info.licence, author: info.author, credit: info.credit, source: info.pageUrl };
    persist();
    written++;
    console.log(`${item.id.padEnd(20)} ${info.licence.padEnd(24)} ${file}`);
  } catch (error) {
    failed++;
    console.log(`${item.id.padEnd(20)} FAILED ${file}: ${error.message}`);
  }
}
await browser.close();
persist();
console.log(`\noutlet logos written: ${written}; failed: ${failed}; manifest now holds ${Object.keys(manifest).length} marks`);
