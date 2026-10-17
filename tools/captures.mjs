/**
 * SLATE — full-height, double-density captures of the built app's screens the sweep of 2026-10-16 changed
 * (docs/verification/sweep-2026-10-16/): the term's warning on Home; Coursework with Due Soonest and Shown Today; a stage
 * scene's circumstances with their reasons and The Scene beside each side; the guide's How You'll Play A Scene; and a
 * brief whose way of playing is rehearsed in to its scene's own mark. A long screen is taken in consecutive sections.
 *
 *   npm run build && npx vite preview --port 4173
 *   node tools/scenario-saves.mjs SAVES
 *   npx vite-node tools/rehearsal-mark-saves.ts -- MARKS
 *   node tools/captures.mjs OUT WIDTH SAVES MARKS
 *
 * SLATE_BASE names the build to capture (http://localhost:4173 by default). SLATE_BASE_BEFORE, where it's set, names a
 * second, earlier build, and the mid-rehearsal brief is captured in it too, as the "before" of the fix: a build of
 * `0d66ce60`, served on its own port, shows Rehearse It On Your Feet refused at 93% of a 97% mark.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { launchOptions } from './browser.mjs';

const [OUT, W, SAVES, MARKS] = process.argv.slice(2);
if (!OUT || !W || !SAVES || !MARKS) { console.error('Usage: node tools/captures.mjs OUT WIDTH SAVES MARKS'); process.exit(2); }
const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const BEFORE = process.env.SLATE_BASE_BEFORE;
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const H = PHONE ? 844 : 900;
mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch(launchOptions());
const ctx = await browser.newContext({ viewport: { width: WIDTH, height: H }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const log = (...a) => console.log(`[${WIDTH}]`, ...a);
let missing = 0;

async function openSave(base, file) {
  await page.goto(base, { waitUntil: 'networkidle' });
  const text = readFileSync(file, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(2000);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
}
async function rail(name) {
  if (PHONE) { await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click(); await wait(400); }
  await page.locator('#rail').getByRole('button', { name: new RegExp(`^${name}`) }).first().click(); await wait(1000);
}
async function tab(name) { await page.getByRole('tab', { name: new RegExp(`^${name}$`) }).first().click(); await wait(800); }
const card = (inner) => inner.locator('xpath=ancestor::section[contains(concat(" ", normalize-space(@class), " "), " card ")][1]');
// The app scrolls inside its own panel, not the page. A screen shorter than PART is one image, the window made as tall
// as its content; a longer one is taken in consecutive sections, the panel scrolled a section at a time, each
// overlapping the last by a little so nothing falls between them.
const PART = 3600;
async function full(name) {
  const m = await page.evaluate(() => { let best = null, h = 0; for (const el of document.querySelectorAll('*')) { const s = getComputedStyle(el); if ((s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight && el.scrollHeight > h) { h = el.scrollHeight; best = el; } } if (best) best.setAttribute('data-capture-scroller', ''); return { h, top: best ? Math.ceil(best.getBoundingClientRect().top) : 0 }; });
  if (m.h + m.top <= PART) {
    await page.setViewportSize({ width: WIDTH, height: Math.max(m.h + m.top + 40, H) }); await wait(800);
    await page.screenshot({ path: `${OUT}/${name}.png` }); log('wrote', name, 'height', m.h + m.top);
  } else {
    await page.setViewportSize({ width: WIDTH, height: PART }); await wait(800);
    const scroller = page.locator('[data-capture-scroller]').first();
    const view = await scroller.evaluate((el) => el.clientHeight);
    let k = 1;
    for (let y = 0; ; y += view - 120, k += 1) {
      await scroller.evaluate((el, top) => { el.scrollTop = top; }, y); await wait(500);
      await page.screenshot({ path: `${OUT}/${name}-part${k}.png` });
      if (y + view >= m.h) break;
    }
    log('wrote', name, 'in', k, 'parts, height', m.h);
    await scroller.evaluate((el) => { el.scrollTop = 0; });
  }
  await page.setViewportSize({ width: WIDTH, height: H }); await wait(400);
}
async function shot(loc, name) {
  if (!(await loc.count())) { log('MISSING', name); missing += 1; return; }
  const el = loc.first();
  // A part of the screen taller than the window renders blank past it, inside the app's scrolling panel: the window is
  // made taller than the part first.
  const tall = await el.evaluate((e) => e.getBoundingClientRect().height);
  if (tall > H - 120) { await page.setViewportSize({ width: WIDTH, height: Math.min(Math.ceil(tall) + 400, 16000) }); await wait(800); }
  await el.scrollIntoViewIfNeeded(); await wait(500);
  await el.screenshot({ path: `${OUT}/${name}.png` }); log('wrote', name, 'height', Math.round(tall));
  await page.setViewportSize({ width: WIDTH, height: H }); await wait(400);
}

// 1. The term's warning, on Home (the workload scenario's save: a student who left the scenes' partner part, stopped
// the day the warning came).
await openSave(BASE, join(SAVES, 'workload.json'));
await rail('Home');
await full('1-home');
await shot(page.locator('.list-item').filter({ hasText: /^A Word On Your Coursework/ }), '1-home-the-warning');

// 2. Coursework: Due Soonest, Shown Today with each short part's remedy, the table work's among them.
await rail('School'); await tab('Coursework');
await full('2-coursework-full');
await shot(card(page.locator('[data-due-soonest]')), '2-due-soonest');
let line = page.locator('[data-shown-today]').filter({ hasText: /Table Work/ });
log('Shown Today lines naming the Table Work:', await line.count());
if (!(await line.count())) line = page.locator('[data-shown-today]');
await shot(line, '2-shown-today-line');

// 3. A stage scene: What It Asks with each circumstance and its reason; How You'll Play It resting on them.
const CIRC = /What’s Kept Hidden|A Private Exchange|Spoken To Many|A Conflict Out Loud/;
const circ = page.locator('[data-circumstance]').first();
await shot(card(circ), '3-stage-scene-what-it-asks-and-how-youll-play-it');
const asks = circ.locator('xpath=ancestor::div[contains(@class, "col")][1]');
await shot(asks, '3-what-it-asks-circumstances');
const chooser = page.locator('table').filter({ has: page.locator('td[data-suit]') }).filter({ hasText: CIRC }).first();
await shot(chooser, '3-the-scene-column');

// 4. The guide, opened beside How You'll Play It: The Scene and Rehearsed In, at the scene's own mark.
const how = card(circ).locator('button[aria-label^="How This Works: How You"]').first();
if (await how.count()) {
  await how.click(); await wait(800);
  const dialog = page.getByRole('dialog', { name: /How This Works/ }).last();
  for (const d of await dialog.locator('details').all()) await d.evaluate((el) => { el.open = true; });
  await wait(400);
  // Tall enough to hold the whole entry, then the dialog itself.
  const tall = await dialog.evaluate((el) => { let m = el.scrollHeight; for (const x of el.querySelectorAll('*')) m = Math.max(m, x.scrollHeight); return m; });
  await page.setViewportSize({ width: WIDTH, height: Math.min(Math.ceil(tall / 0.8) + 400, 16000) }); await wait(600);
  await dialog.screenshot({ path: `${OUT}/4-guide-how-youll-play-it.png` }); log('wrote 4-guide-how-youll-play-it');
  await page.setViewportSize({ width: WIDTH, height: H });
  await page.keyboard.press('Escape'); await wait(400);
} else { log('MISSING guide button'); missing += 1; }

// 5. A choice against the grain, rehearsed in past 90% with rehearsal's part full: the same save before the sweep
// (SLATE_BASE_BEFORE, where it's set) and after it (SLATE_BASE). Then the same actor prepared twenty days, after.
async function brief(base, file, name) {
  await openSave(base, file);
  await rail('Player Profile');
  await page.locator('#genres-find').fill('Rockumentary'); await wait(500);
  const row = page.locator('tr', { has: page.getByRole('button', { name: /^Open Its Brief$/ }) }).filter({ hasText: /^Rockumentary/ }).first();
  await row.getByRole('button', { name: /^Open Its Brief$/ }).click(); await wait(800);
  const pane = page.locator('[data-brief]').first();
  const which = pane.locator('select[aria-label="Which Brief"]');
  if (await which.count()) { await which.selectOption({ index: 1 }); await wait(800); }
  const rehearse = pane.getByRole('button', { name: /^Rehearse/ }).first();
  log(name, 'rehearse button:', (await rehearse.count()) ? `${(await rehearse.isDisabled()) ? 'grayed' : 'open'}; ${await rehearse.getAttribute('title')}` : 'none');
  log(name, 'says:', ((await pane.innerText()).replace(/\s+/g, ' ').match(/rehearsed your current choice to \d+% so far \(it’s complete at \d+%\)[^.]*\./) ?? ['(no rehearsed-in line)'])[0]);
  await shot(pane, name);
}
if (BEFORE) await brief(BEFORE, join(MARKS, 'rock-mid.json'), '5a-brief-before-the-sweep-rehearse-refused');
await brief(BASE, join(MARKS, 'rock-mid.json'), '5b-brief-after-the-sweep-rehearse-open');
await brief(BASE, join(MARKS, 'rock.json'), '5c-brief-after-twenty-days-complete');

await browser.close();
if (missing) { console.error(`${missing} capture(s) missing.`); process.exit(1); }
