// Every page of the game captured whole, in the order a player meets them (2026-10-23, at the owner's word after brief
// 23: "in chronological order full captures of each full page from pc and mobile"). Brief 22's were taken by a scratch
// script, `tools/cap22.mjs`, that was never kept; this one is.
//
//   SLATE_BASE=http://localhost:4292 node docs/verification/ui-2026-10-23/app/pages.mjs OUT SIZE
//     SIZE  1440x900 (a desktop window) or 844x390m (a phone on its side: touch, no hover)
//
// Four moments, in the game's own order:
//   1. A new life, 24 August 2026: the start with no save, the five steps of creation, the guide it opens on, and Home
//      with the chapters still to read.
//   2. A new student, 1 September 2026 (brief 22's `roles` save): the saves, then every destination on the menu, every
//      tab of each, and How This Works.
//   3. The last term, 1 March 2029 (`tests/fixtures/journey-j01-last-term-8283f80c`): Home and every School tab.
//   4. b20-4 after midnight, 2 September 2029 (brief 22's `released` save): every destination and every tab again.
//
// A page is captured whole the way `capture.mjs`'s `shoot` does, at the window's own size, so it is set out for the
// window walked and never for a taller one: the part above what scrolls (the bar) once, then what scrolls (the main
// column, or a dialog's body) a window at a time, then the part below it (a dialog's foot), joined by `pages-compose.py`.
// The images are at twice the pixels of the window. Toasts are hidden while a page is taken, since a toast on every
// slice would repeat down the page. It writes `pages.json`: each page's file, its headings and any problem met.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4292';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../..');
const COMPOSE = join(HERE, 'pages-compose.py');
const [OUT, SIZE] = process.argv.slice(2);
const phone = SIZE.endsWith('m');
const [W, H] = SIZE.replace(/m$/, '').split('x').map(Number);
const DPR = 2;
mkdirSync(OUT, { recursive: true });

const MOMENTS = [
  { key: 'new-life', title: 'A New Life, 24 August 2026', slug: 'august-24-2026-a-new-life' },
  { key: 'roles', title: 'A New Student, 1 September 2026', slug: 'september-1-2026-a-new-student', save: 'docs/verification/career-genre-2026-10-22/app/saves/roles.json.gz', help: true },
  { key: 'last-term', title: 'The Last Term, 1 March 2029', slug: 'march-1-2029-the-last-term', save: 'tests/fixtures/journey-j01-last-term-8283f80c.json.gz', only: ['School'] },
  { key: 'released', title: 'b20-4 After Midnight, 2 September 2029', slug: 'september-2-2029-after-midnight', save: 'docs/verification/career-genre-2026-10-22/app/saves/released.json.gz' },
];
const DESTINATIONS = ['Player Profile', 'Calendar', 'Updates', 'School', 'Career', 'Money', 'Papers'];

const browser = await chromium.launch(launchOptions());
const pages = [];
let n = 0;
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const wait = (page, ms) => page.waitForTimeout(ms);

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, screen: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 200)}`); });
  return { ctx, page, problems };
}
async function press(page, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  if (phone) await locator.tap({ timeout: 8000 }); else await locator.click({ timeout: 8000 });
  await wait(page, 700);
}

/** What scrolls: a dialog's body, else the main column, else the document. Marked for the slices that follow. */
function findScroller() {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const dialog = [...document.querySelectorAll('[role=dialog]:not([data-rotate-screen])')].filter(vis).pop();
  let sc = dialog ? dialog.querySelector('.modal-body') : (document.querySelector('#main') ?? document.querySelector('.main'));
  // The guide's body holds two panes that scroll, the chapters and the chapter shown: the larger is taken (on the first
  // run, 2026-10-23, the body was, which doesn't scroll, and the chapter was cut at the window's foot).
  if (dialog && !(sc && sc.scrollHeight > sc.clientHeight + 2)) {
    const inner = [...dialog.querySelectorAll('*')].filter((el) => /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 2 && vis(el));
    inner.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
    sc = inner[0] ?? sc;
  }
  if (sc && sc.scrollHeight <= sc.clientHeight + 2 && !dialog) sc = null;
  if (!sc && document.scrollingElement.scrollHeight > innerHeight + 2) sc = document.scrollingElement;
  // Else the largest box that scrolls, if it starts in the window and fills half of it: creation's Starting Point holds a
  // short list that scrolls below the fold, and, taken first, it left the slices no height (the first run, 2026-10-23).
  if (!sc) {
    const all = [...document.querySelectorAll('body *')].filter((el) => {
      const r = el.getBoundingClientRect();
      return /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 2 && vis(el) && r.top >= 0 && r.top < innerHeight / 2 && el.clientHeight > innerHeight / 2;
    });
    all.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
    sc = all[0] ?? null;
  }
  document.querySelectorAll('[data-cap]').forEach((el) => el.removeAttribute('data-cap'));
  if (!sc) return null;
  const doc = sc === document.scrollingElement;
  if (!doc) sc.setAttribute('data-cap', '');
  const r = doc ? { top: 0, left: 0, width: innerWidth } : sc.getBoundingClientRect();
  const top = Math.max(0, Math.round(r.top));
  const height = doc ? innerHeight : Math.round(Math.min(sc.clientHeight, innerHeight - top));
  return { doc, top, left: Math.max(0, Math.round(r.left)), width: Math.round(Math.min(r.width, innerWidth)), height, scroll: sc.scrollHeight, vw: innerWidth, vh: innerHeight };
}
const scrollTo = (page, doc, y) => page.evaluate(([d, v]) => { const el = d ? document.scrollingElement : document.querySelector('[data-cap]'); el?.scrollTo(0, v); }, [doc, y]);

/** The page whole: the part above what scrolls, each window of it, the part below; `pages-compose.py` joins them. */
async function whole(page, file) {
  await page.addStyleTag({ content: '.toasts { visibility: hidden !important; }' });
  const box = await page.evaluate(findScroller);
  if (!box || box.scroll <= box.height + 2) { await page.screenshot({ path: file, type: 'jpeg', quality: 70 }); return 1; }
  await scrollTo(page, box.doc, 0); await wait(page, 300);
  const parts = [];
  const above = `${file}.above.png`, below = `${file}.below.png`;
  if (box.top > 0) await page.screenshot({ path: above, clip: { x: 0, y: 0, width: box.vw, height: box.top } });
  let y = 0, overlap = 0;
  for (let k = 0; y < box.scroll && k < 80; k += 1) {
    const at = Math.min(y, box.scroll - box.height);
    overlap = y - at;
    await scrollTo(page, box.doc, at); await wait(page, 260);
    const f = `${file}.${k}.png`;
    // The first slice the window's width (the menu beside it, which doesn't scroll); the rest what scrolls alone.
    await page.screenshot({ path: f, clip: k === 0 ? { x: 0, y: box.top, width: box.vw, height: box.height } : { x: box.left, y: box.top, width: box.width, height: box.height } });
    parts.push(f); y += box.height;
  }
  const foot = box.vh - (box.top + box.height);
  if (foot > 0) await page.screenshot({ path: below, clip: { x: 0, y: box.top + box.height, width: box.vw, height: foot } });
  const made = execFileSync('python3', [COMPOSE, file, String(DPR), box.top > 0 ? above : '-', foot > 0 ? below : '-', String(overlap), String(box.left), ...parts]).toString().trim();
  for (const f of [above, below, ...parts]) rmSync(f, { force: true });
  await scrollTo(page, box.doc, 0); await wait(page, 200);
  return Number(made);
}

async function take(ctx, moment, name) {
  const { page, problems } = ctx;
  n += 1;
  await wait(page, 600);
  const base = `${String(n).padStart(2, '0')}-${moment.slug}-${slug(name)}`;
  const parts = await whole(page, join(OUT, `${base}.jpg`));
  const files = parts > 1 ? Array.from({ length: parts }, (_, i) => `${base}-part${i + 1}of${parts}.jpg`) : [`${base}.jpg`];
  const said = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[inert], .sr-only'); };
    const scope = [...document.querySelectorAll('[role=dialog]:not([data-rotate-screen])')].filter(vis).pop() ?? document.querySelector('#main') ?? document.body;
    return {
      here: document.querySelector('.topbar-clock')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
      headings: [...scope.querySelectorAll('h1, h2, h3')].filter(vis).map((h) => h.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 40),
      tab: scope.querySelector('[role=tab][aria-selected=true]')?.textContent?.trim() ?? null,
      rotate: !!document.querySelector('[data-rotate-screen]'),
      pageWider: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    };
  });
  pages.push({ n, moment: moment.title, page: name, files, problems: problems.splice(0), ...said });
  console.log(`${base}: ${files.length} file(s)${said.rotate ? ', ROTATE SCREEN' : ''}${said.pageWider ? `, wider by ${said.pageWider}` : ''}`);
}

async function drawer(page, open) {
  const toggle = page.locator('.rail-toggle');
  if (!(await toggle.isVisible().catch(() => false))) return;
  if (((await toggle.getAttribute('aria-expanded')) === 'true') !== open) await press(page, toggle);
}
async function go(ctx, name) {
  const { page } = ctx;
  await drawer(page, true);
  const b = page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  if (!(await b.count())) { ctx.problems.push(`no ${name} on the menu`); await drawer(page, false); return false; }
  await press(page, b);
  await drawer(page, false);
  return true;
}
const tabList = (page) => page.locator('main.main [role=tablist]').first();
async function tabNames(page) {
  const tl = tabList(page);
  if (!(await tl.count())) return [];
  return (await tl.getByRole('tab').allInnerTexts()).map((t) => t.split('\n')[0].trim());
}
async function tab(ctx, label) {
  let t = tabList(ctx.page).getByRole('tab', { name: label, exact: true }).first();
  if (!(await t.count())) t = tabList(ctx.page).getByRole('tab', { name: label }).first();
  if (!(await t.count())) { ctx.problems.push(`no ${label} tab`); return false; }
  await press(ctx.page, t);
  return true;
}
async function paused(page) {
  const play = page.getByRole('group', { name: 'Time Controls' }).getByRole('button').first();
  if ((await play.innerText().catch(() => '')).trim() === 'Pause') await press(page, play);
}

/** 1. A new life: the start with no save, creation's five steps, the guide, Home. */
async function newLife(moment) {
  const ctx = await newPage();
  const { page } = ctx;
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' }); await wait(page, 1500);
    await take(ctx, moment, 'The Start');
    await press(page, page.getByRole('button', { name: /^New Save$/ }).first()); await wait(page, 800);
    const billed = page.getByRole('group', { name: 'Billed As' });
    if (await billed.count()) await press(page, billed.getByRole('button', { name: 'Actress' }));
    await page.locator('#born-search').fill('New York'); await wait(page, 900);
    await press(page, page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first());
    for (const step of ['Identity', 'Dispositions & Traits', 'Genres & Background', 'Starting Point']) {
      await page.evaluate(() => document.querySelector('.main')?.scrollTo(0, 0));
      await take(ctx, moment, `Creation, ${step}`);
      await press(page, page.getByRole('button', { name: /^Continue$/ }));
    }
    await take(ctx, moment, 'Creation, Review');
    await press(page, page.getByRole('button', { name: /^Begin$/ }));
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 60000 }); await wait(page, 2500);
    await paused(page);
    if (await page.locator('[role=dialog]').count()) {
      await take(ctx, moment, 'The Guide, Its First Chapter');
      const later = page.locator('[role=dialog]').last().getByRole('button', { name: /^Later$/ }).first();
      if (await later.count()) await press(page, later); else { await page.keyboard.press('Escape'); await wait(page, 500); }
    } else ctx.problems.push('no guide on a new life');
    await take(ctx, moment, 'Home, The Chapters Still To Read');
  } catch (e) { ctx.problems.push(`stopped: ${String(e).slice(0, 240)}`); }
  if (ctx.problems.length) pages.push({ moment: moment.title, problems: ctx.problems });
  await ctx.ctx.close();
}

/** 2 to 4. A save opened as a player opens one (Continue), then its pages. */
async function fromSave(moment) {
  const ctx = await newPage();
  const { page } = ctx;
  try {
    const text = gunzipSync(readFileSync(join(ROOT, moment.save))).toString('utf8');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
    await page.reload({ waitUntil: 'networkidle' }); await wait(page, 1500);
    if (moment.key === 'roles') await take(ctx, moment, 'Your Saves');
    await press(page, page.getByRole('button', { name: /^Continue$/ }).first());
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 }); await wait(page, 1500);
    await paused(page);
    while (await page.locator('[role=dialog]:not([data-rotate-screen])').count()) { await page.keyboard.press('Escape'); await wait(page, 400); }
    await take(ctx, moment, 'Home');
    for (const dest of moment.only ?? DESTINATIONS) {
      if (!(await go(ctx, dest))) continue;
      const names = await tabNames(page);
      if (!names.length) { await take(ctx, moment, dest); continue; }
      for (const label of names) if (await tab(ctx, label)) await take(ctx, moment, `${dest}, ${label}`);
    }
    if (moment.help) {
      await go(ctx, 'Home');
      await page.keyboard.press('?'); await wait(page, 900);
      if (await page.locator('[role=dialog]').count()) { await take(ctx, moment, 'How This Works'); await page.keyboard.press('Escape'); }
      else ctx.problems.push('no How This Works on ?');
    }
  } catch (e) { ctx.problems.push(`stopped: ${String(e).slice(0, 240)}`); }
  if (ctx.problems.length) pages.push({ moment: moment.title, problems: ctx.problems });
  await ctx.ctx.close();
}

for (const m of MOMENTS) await (m.save ? fromSave(m) : newLife(m));
await browser.close();
writeFileSync(join(OUT, 'pages.json'), `${JSON.stringify({ size: SIZE, dpr: DPR, base: BASE, pages }, null, 1)}\n`);
const trouble = pages.flatMap((p) => p.problems ?? []);
console.log(`${pages.filter((p) => p.files).length} pages, ${pages.reduce((k, p) => k + (p.files?.length ?? 0), 0)} files, ${trouble.length} problems${trouble.length ? `: ${trouble.join(' | ')}` : ''}`);
