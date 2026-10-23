// Brief 24's before-and-after pictures (section 7), the same script on each build: what a window actually shows, at each
// size the brief names, with a whole-page image beside some. Each is named for what it shows.
//
//   SLATE_BASE=http://localhost:4295 node docs/verification/ui-polish-2026-10-23/app/evidence.mjs OUT
//
// - Home for a new student (nothing needs you), an offer waiting (two questions), b20-4 after midnight (things to put
//   right) and a developed student, at 1280, 1440 and 1920 and on a phone on its side at 667, 844 and 932.
// - Home with nothing on the calendar: the new student's save with every plan and commitment not yet come taken off,
//   for the picture alone (a display test, not a life anyone plays: the school puts its week back on the next Monday).
// - Home with every notice read, by Mark Read as a player reads them, and Updates' Unread with nothing in it.
// - On a phone: the weather's details opened where the build has them to open, and the menu open, at its top and at
//   its foot.
// - Calendar and Updates reached from Home's own buttons, and the way back to Home from each.
// - The help beside headings, short and long, on Career, Money, Papers, School and the Profile, at 1440 and 844.
// It writes `evidence.json`: each picture, its size, and what the window held when it was taken.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4295';
const [OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const R = (p) => gunzipSync(readFileSync(p)).toString('utf8');
const B22 = 'docs/verification/career-genre-2026-10-22/app/saves';
const LIVES = {
  'new-student': R(`${B22}/roles.json.gz`),
  'offer-waiting': R('docs/verification/ui-2026-10-23/app/saves/offer.json.gz'),
  'after-midnight': R(`${B22}/released.json.gz`),
  developed: R('tests/fixtures/journey-j01-last-term-8283f80c.json.gz'),
};
{
  const s = JSON.parse(LIVES['new-student']);
  s.scheduled = s.scheduled.filter((i) => i.category === 'system' || i.status !== 'pending' || i.at < s.now);
  LIVES['nothing-planned'] = JSON.stringify(s);
}
const DESK = ['1280x720', '1440x900', '1920x1080'];
const PHONES = ['667x375m', '844x390m', '932x430m'];
const browser = await chromium.launch(launchOptions());
const shots = [];
const problems = [];
const wait = (page, ms) => page.waitForTimeout(ms);

async function open(life, size) {
  const phone = size.endsWith('m');
  const [w, h] = size.replace(/m$/, '').split('x').map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, screen: { width: w, height: h }, deviceScaleFactor: 2, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`${life} ${size}: page error ${String(e).slice(0, 160)}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), LIVES[life]);
  await page.reload({ waitUntil: 'networkidle' }); await wait(page, 1000);
  const c = page.getByRole('button', { name: /^Continue$/ }).first();
  if (phone) await c.tap(); else await c.click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 }); await wait(page, 1200);
  while (await page.locator('[role=dialog]:not([data-rotate-screen])').count()) { await page.keyboard.press('Escape'); await wait(page, 300); }
  // The clock stopped, so the two builds' pictures are of the same minute. The first before set was taken with it
  // running: the offer's Home said "Running" and its afternoon had moved on by the time the window was taken.
  const pause = page.getByRole('group', { name: 'Time Controls' }).first().getByRole('button', { name: /^Pause$/ });
  if (await pause.count() && await pause.isVisible()) { if (phone) await pause.tap(); else await pause.click(); await wait(page, 400); }
  return { ctx, page, phone, life, size };
}
async function press(o, loc) { await loc.scrollIntoViewIfNeeded().catch(() => {}); if (o.phone) await loc.tap({ timeout: 6000 }); else await loc.click({ timeout: 6000 }); await wait(o.page, 700); }
async function drawer(o, open) {
  const t = o.page.locator('.rail-toggle');
  if (!(await t.isVisible().catch(() => false))) return;
  if (((await t.getAttribute('aria-expanded')) === 'true') !== open) await press(o, t);
}
async function rail(o, name) {
  await drawer(o, true);
  const b = o.page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  if (!(await b.count()) || !(await b.isVisible())) { await drawer(o, false); return false; }
  await press(o, b); await drawer(o, false); return true;
}
/** What the window holds: its headings in view, the menu's places, and whether anything runs past its sides. */
const seen = (page) => page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden'; };
  const keep = [document.documentElement.style.overflowX, document.body.style.overflowX];
  document.documentElement.style.overflowX = 'visible'; document.body.style.overflowX = 'visible';
  const wider = Math.max(0, document.documentElement.scrollWidth - innerWidth);
  [document.documentElement.style.overflowX, document.body.style.overflowX] = keep;
  return {
    inView: [...document.querySelectorAll('main h1, main h2, main h3')].filter(vis).map((h) => h.textContent.replace(/\s+/g, ' ').trim()).slice(0, 14),
    menu: [...document.querySelectorAll('nav.rail .rail-item')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
    wider,
  };
});
async function shot(o, name, { full = false } = {}) {
  await wait(o.page, 500);
  const file = `${name}-${o.size}.png`;
  await o.page.screenshot({ path: join(OUT, file) });
  const rec = { file, life: o.life, size: o.size, ...(await seen(o.page)) };
  if (full) { const f = `${name}-${o.size}-full.png`; await o.page.screenshot({ path: join(OUT, f), fullPage: true }); rec.full = f; }
  shots.push(rec);
  console.log(`${file}${rec.wider ? ` WIDER ${rec.wider}` : ''}: ${rec.inView.join(' | ').slice(0, 140)}`);
}
async function scene(life, size, fn) {
  let o;
  try { o = await open(life, size); await fn(o); } catch (e) { problems.push(`${life} ${size}: ${String(e).slice(0, 220)}`); }
  await o?.ctx.close();
}

// Home, each life at each size, the window as it opens.
for (const size of [...DESK, ...PHONES]) {
  for (const life of ['new-student', 'offer-waiting', 'after-midnight', 'developed', 'nothing-planned']) {
    await scene(life, size, async (o) => {
      await shot(o, `home-${life}`, { full: !o.phone && life !== 'nothing-planned' });
      if (life === 'new-student') {
        // Every notice read, as a player reads them, then Updates by Home's own button, and back.
        const mark = o.page.getByRole('button', { name: /^Mark \d+ Read$/ }).first();
        if (await mark.count()) { await press(o, mark); await shot(o, 'home-all-read'); }
        const all = o.page.getByRole('button', { name: /^View All Updates$/ }).first();
        if (await all.count()) {
          await press(o, all); await shot(o, 'updates-from-home');
          const back = o.page.locator('main').getByRole('button', { name: /Home/ }).first();
          if (await back.count()) { await press(o, back); await shot(o, 'home-back-from-updates'); } else problems.push(`${size}: no way back to Home on Updates`);
        }
        const cal = o.page.getByRole('button', { name: /^Open Calendar$/ }).first();
        if (await cal.count() && await cal.isEnabled()) {
          await press(o, cal); await shot(o, 'calendar-from-home');
          const back = o.page.locator('main').getByRole('button', { name: /Home/ }).first();
          if (await back.count()) { await press(o, back); await shot(o, 'home-back-from-calendar'); } else problems.push(`${size}: no way back to Home on Calendar`);
        } else problems.push(`${size}: no Open Calendar on Home`);
      }
      if (o.phone && life === 'new-student') {
        // The weather's details, where this build has them folded away.
        const more = o.page.getByRole('button', { name: /Forecast|Weather And Daylight|More Weather/ }).first();
        if (await more.count() && await more.isVisible()) { await press(o, more); await shot(o, 'home-weather-open'); }
        await drawer(o, true); await shot(o, 'menu-open');
        await o.page.evaluate(() => { const r = document.querySelector('nav.rail'); r?.scrollTo(0, r.scrollHeight); }); await wait(o.page, 300);
        await shot(o, 'menu-open-foot');
        await drawer(o, false);
      }
      if (life === 'nothing-planned') {
        const cal = o.page.getByRole('button', { name: /^Open Calendar$/ }).first();
        if (!(await cal.count())) problems.push(`${size}: nothing planned, and no Open Calendar`);
      }
    });
  }
}
// The help beside headings, short and long.
for (const size of ['1440x900', '844x390m']) {
  await scene('after-midnight', size, async (o) => {
    for (const [dest, tab, name] of [['Career', 'Overview', 'help-career-overview'], ['Career', 'Representation', 'help-career-representation'], ['Money', 'Accounts', 'help-money-accounts'], ['Papers', 'Health Cover', 'help-papers-health'], ['School', 'Standing And Craft', 'help-school-standing'], ['Player Profile', null, 'help-profile']]) {
      if (!(await rail(o, dest))) { problems.push(`${size}: no ${dest} on the menu`); continue; }
      if (tab) { const t = o.page.locator('main.main [role=tablist]').first().getByRole('tab', { name: tab, exact: true }).first(); if (await t.count()) await press(o, t); }
      await o.page.evaluate(() => document.querySelector('#main')?.scrollTo(0, 0));
      await shot(o, name);
    }
  });
}
await browser.close();
writeFileSync(join(OUT, 'evidence.json'), `${JSON.stringify({ base: BASE, shots, problems }, null, 1)}\n`);
console.log(`${shots.length} pictures; ${problems.length} problems${problems.length ? `: ${problems.join(' | ')}` : ''}`);
