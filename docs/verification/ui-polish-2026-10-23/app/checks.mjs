// Brief 24's checks the walk and the pictures don't make (section 6), on the built app, emulated in Playwright's
// Chromium: not a phone in a hand, and not a person's browser settings.
//
//   SLATE_BASE=http://localhost:4296 node docs/verification/ui-polish-2026-10-23/app/checks.mjs OUT
//
// 1. Larger text: the browser's own text size at 20 and 24 pixels where it's 16 (125% and 150%), as a player sets it,
//    which the game's sizes follow (they're in rem) and its spacing doesn't (px). Home, Calendar, Updates, Money and
//    School at 1280×720 and 844×390: nothing wider than the window, no text cut where it has no way to be read, and
//    help still on its heading's line or on a row of its own under it. A picture of each.
// 2. The drawer on each phone on its side: every place and every control in it brought into view by its own scroll and
//    pressable there (nothing over it), the last at its foot.
// 3. Calendar with nothing planned, reached from Home's Open Calendar, and Updates' Unread with every notice read: the
//    empty states, and Back To Home from each.
// It writes `checks.json`, each check with what it found.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4296';
const [OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const R = (p) => gunzipSync(readFileSync(p)).toString('utf8');
const ROLES = R('docs/verification/career-genre-2026-10-22/app/saves/roles.json.gz');
const RELEASED = R('docs/verification/career-genre-2026-10-22/app/saves/released.json.gz');
// The new student's save with every plan and commitment not yet come taken off, as evidence.mjs makes it: for the
// empty calendar alone.
const EMPTY = (() => { const s = JSON.parse(ROLES); s.scheduled = s.scheduled.filter((i) => i.category === 'system' || i.status !== 'pending' || i.at < s.now); return JSON.stringify(s); })();
const browser = await chromium.launch(launchOptions());
const out = { base: BASE, larger: [], drawer: [], empty: [], problems: [] };
const wait = (page, ms) => page.waitForTimeout(ms);

async function open(save, size, fontPx) {
  const phone = size.endsWith('m');
  const [w, h] = size.replace(/m$/, '').split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, screen: { width: w, height: h }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => out.problems.push(`${size}: page error ${String(e).slice(0, 160)}`));
  if (fontPx) { const cdp = await ctx.newCDPSession(page); await cdp.send('Page.setFontSizes', { fontSizes: { standard: fontPx } }); }
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), save);
  await page.reload({ waitUntil: 'networkidle' }); await wait(page, 1000);
  const c = page.getByRole('button', { name: /^Continue$/ }).first();
  if (phone) await c.tap(); else await c.click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 }); await wait(page, 1000);
  while (await page.locator('[role=dialog]:not([data-rotate-screen])').count()) { await page.keyboard.press('Escape'); await wait(page, 300); }
  const pause = page.getByRole('group', { name: 'Time Controls' }).first().getByRole('button', { name: /^Pause$/ });
  if (await pause.count() && await pause.isVisible()) { if (phone) await pause.tap(); else await pause.click(); await wait(page, 300); }
  return { ctx, page, phone, size };
}
async function press(o, loc) { await loc.scrollIntoViewIfNeeded().catch(() => {}); if (o.phone) await loc.tap({ timeout: 6000 }); else await loc.click({ timeout: 6000 }); await wait(o.page, 600); }
async function drawer(o, want) {
  const t = o.page.locator('.rail-toggle');
  if (!(await t.isVisible().catch(() => false))) return false;
  if (((await t.getAttribute('aria-expanded')) === 'true') !== want) await press(o, t);
  return true;
}
async function go(o, name) {
  await drawer(o, true);
  const b = o.page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  if (await b.count() && await b.isVisible()) { await press(o, b); await drawer(o, false); return true; }
  await drawer(o, false);
  const way = { Calendar: /^Open Calendar$/, Updates: /^View All Updates$/ }[name];
  if (!way) return false;
  await go(o, 'Home');
  const btn = o.page.getByRole('button', { name: way }).first();
  if (!(await btn.count())) return false;
  await press(o, btn); return true;
}
/** What larger text would break: the page wider than the window, words cut with no way to read them, help off its line. */
const read = (page) => page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[hidden], [inert]'); };
  const keep = [document.documentElement.style.overflowX, document.body.style.overflowX];
  document.documentElement.style.overflowX = 'visible'; document.body.style.overflowX = 'visible';
  const wider = Math.max(0, document.documentElement.scrollWidth - innerWidth);
  [document.documentElement.style.overflowX, document.body.style.overflowX] = keep;
  const cut = [];
  for (const el of document.querySelectorAll('main *, header.topbar *')) {
    if (!vis(el) || !el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const s = getComputedStyle(el);
    if (s.textOverflow === 'ellipsis' || /clamp-|truncate/.test(String(el.className)) || el.title) continue;
    if ((/hidden|clip/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 1) || (/hidden|clip/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1)) cut.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} “${el.textContent.trim().slice(0, 40)}”`);
  }
  // A card head's help: on its heading's line (its top inside the heading's box) or on a row of its own under it.
  const helpOff = [];
  for (const b of document.querySelectorAll('.panel-head .how-it-works')) {
    if (!vis(b)) continue;
    const h = b.closest('.panel-head').querySelector('h2, h3'); if (!h) continue;
    const hr = h.getBoundingClientRect(), br = b.getBoundingClientRect();
    // Its box against the card's, not the head's: the box overhangs the head by its own padding, so its words end on the
    // head's edge (a first version of this read the head and called that past the card).
    const card = b.closest('.card');
    if (card && br.right > card.getBoundingClientRect().right + 1) helpOff.push(`${h.textContent.trim().slice(0, 30)}: past the card`);
    if (br.top < hr.bottom && br.bottom > hr.top) continue;
    if (br.top >= hr.bottom - 2) continue;
    helpOff.push(`${h.textContent.trim().slice(0, 30)}: neither beside nor under`);
  }
  // What runs past the window's right, where the page is wider than it.
  const past = wider ? [...document.querySelectorAll('body *')].filter((el) => vis(el) && el.getBoundingClientRect().right > innerWidth + 0.5 && ![...el.children].some((c) => c.getBoundingClientRect().right > innerWidth + 0.5)).slice(0, 6).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} “${(el.textContent || '').trim().slice(0, 30)}” to ${Math.round(el.getBoundingClientRect().right)}`) : [];
  return { wider, past, cut: cut.slice(0, 12), cutCount: cut.length, helpOff, rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize) };
});

// 1. Larger text.
for (const size of ['1280x720', '844x390m']) {
  for (const px of [20, 24]) {
    let o;
    try {
      o = await open(RELEASED, size, px);
      for (const dest of ['Home', 'Calendar', 'Updates', 'Money', 'School']) {
        if (!(await go(o, dest))) { out.problems.push(`${size} ${px}px: no way to ${dest}`); continue; }
        await o.page.evaluate(() => document.querySelector('#main')?.scrollTo(0, 0)); await wait(o.page, 400);
        const file = `larger-${px}-${dest.toLowerCase()}-${size}.png`;
        await o.page.screenshot({ path: join(OUT, file) });
        const m = await read(o.page);
        out.larger.push({ size, px, dest, file, ...m });
        console.log(`larger ${px}px ${dest} ${size}: root ${m.rootPx}px, wider ${m.wider}, cut ${m.cutCount}, help off ${m.helpOff.length}`);
      }
    } catch (e) { out.problems.push(`${size} ${px}px: ${String(e).slice(0, 200)}`); }
    await o?.ctx.close();
  }
}

// 2. The drawer, each place and control in it reached by its own scroll.
for (const size of ['667x375m', '844x390m', '932x430m']) {
  let o;
  try {
    o = await open(RELEASED, size);
    await drawer(o, true); await wait(o.page, 300);
    const items = o.page.locator('nav.rail button, nav.rail a[href]');
    const n = await items.count();
    const seen = [];
    for (let i = 0; i < n; i += 1) {
      const it = items.nth(i);
      if (!(await it.isVisible())) continue;
      await it.evaluate((el) => el.scrollIntoView({ block: 'nearest' })); await wait(o.page, 120);
      seen.push(await it.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { name: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), inView: r.top >= 0 && r.bottom <= innerHeight + 0.5, onTop: Boolean(top && (top === el || el.contains(top))) };
      }));
    }
    await o.page.screenshot({ path: join(OUT, `drawer-foot-${size}.png`) });
    const bad = seen.filter((s) => !s.inView || !s.onTop || s.h < 43.5);
    out.drawer.push({ size, controls: seen.length, bad, last: seen.at(-1)?.name, names: seen.map((s) => s.name) });
    console.log(`drawer ${size}: ${seen.length} controls, ${bad.length} not reachable whole or under 44, the last ${seen.at(-1)?.name}`);
  } catch (e) { out.problems.push(`drawer ${size}: ${String(e).slice(0, 200)}`); }
  await o?.ctx.close();
}

// 3. The empty states, from Home and back.
for (const size of ['1440x900', '844x390m']) {
  let o;
  try {
    o = await open(EMPTY, size);
    const rec = { size };
    await press(o, o.page.getByRole('button', { name: /^Open Calendar$/ }).first());
    await o.page.screenshot({ path: join(OUT, `calendar-nothing-planned-${size}.png`) });
    rec.calendar = await o.page.evaluate(() => ({ head: document.querySelector('main h1')?.textContent ?? null, empty: [...document.querySelectorAll('main .empty h3, main .empty-compact h3, main [aria-label="No Plans Ahead"], main h3')].map((e) => e.textContent.trim()).filter((t) => /No Plans/.test(t)) }));
    await press(o, o.page.locator('main').getByRole('button', { name: /^Back To Home$/ }).first());
    rec.backFromCalendar = await o.page.evaluate(() => document.querySelector('main h1')?.textContent ?? null);
    const mark = o.page.getByRole('button', { name: /^Mark \d+ Read$/ }).first();
    if (await mark.count()) await press(o, mark);
    await press(o, o.page.getByRole('button', { name: /^View All Updates$/ }).first());
    // Updates opens on All when nothing is unread; its empty state is Unread's, a press away.
    await o.page.evaluate(() => document.querySelector('#main')?.scrollTo(0, 0)); await wait(o.page, 300);
    await o.page.screenshot({ path: join(OUT, `updates-all-read-${size}.png`) });
    await press(o, o.page.getByRole('group', { name: 'Show' }).getByRole('button', { name: /^Unread/ }).first());
    await o.page.evaluate(() => document.querySelector('#main')?.scrollTo(0, 0)); await wait(o.page, 300);
    await o.page.screenshot({ path: join(OUT, `updates-unread-empty-${size}.png`) });
    rec.updates = await o.page.evaluate(() => ({ head: document.querySelector('main h1')?.textContent ?? null, empty: [...document.querySelectorAll('main .empty h3')].map((e) => e.textContent.trim()) }));
    await press(o, o.page.locator('main').getByRole('button', { name: /^Back To Home$/ }).first());
    rec.backFromUpdates = await o.page.evaluate(() => document.querySelector('main h1')?.textContent ?? null);
    out.empty.push(rec);
    console.log(`empty ${size}: ${JSON.stringify(rec)}`);
  } catch (e) { out.problems.push(`empty ${size}: ${String(e).slice(0, 200)}`); }
  await o?.ctx.close();
}

await browser.close();
writeFileSync(join(OUT, 'checks.json'), `${JSON.stringify(out, null, 1)}\n`);
console.log(`${out.larger.length} larger-text pages, ${out.drawer.length} drawers, ${out.empty.length} empty walks; ${out.problems.length} problems${out.problems.length ? `: ${out.problems.join(' | ')}` : ''}`);
