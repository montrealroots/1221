/**
 * Brief 22's saves (`make-saves.ts`) opened on the built app at a width, as a player opens one: put in the browser's own
 * store as the game keeps a slot, the page reloaded, and Continue pressed by the keyboard, as brief 21's walk opens its
 * saves (`../../genre-banking-2026-10-22/app/walk.mjs`). Then, through the visible controls only:
 *
 * - Papers on the rail (on a phone, the menu first), its Permission To Work tab;
 * - Career, its Work tab, then its Opportunities tab;
 * - How This Works (the ? key), its Genres entry and its Permission To Work entry, each shown whole (Show Everything);
 * - each pictured, with what the screen says written beside it.
 *
 * Held on every screen: no page error and no console error, and no sideways scroll. Held for each save, the words brief
 * 22 changed, read off the screen (EXPECT below). Nothing that commits is pressed.
 *
 *   SLATE_BASE=http://localhost:4223 node docs/verification/career-genre-2026-10-22/app/walk.mjs OUTDIR WIDTH
 *
 * Writes OUTDIR/WIDTH/<save>-NN.jpg and .txt, and OUTDIR/walk-WIDTH.json. Exits 1 where any save has a finding.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { execSync } from 'node:child_process';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4223';
const [OUT = 'walk', W = '1440'] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const dir = `${OUT}/${WIDTH}`;
mkdirSync(dir, { recursive: true });
const SAVES = 'docs/verification/career-genre-2026-10-22/app/saves';
const saves = readdirSync(SAVES).filter((f) => f.endsWith('.json.gz')).sort();
/** What each save's screens must say, [where, a pattern, true where it must not]: brief 22's words. */
const EXPECT = {
  before: [
    ['Papers, Permission To Work', /Every day from the first day of a job to its last counts as a day with work, and every other day as one without, the days before a job you’ve booked begins among them/],
    ['Papers, Permission To Work', /Your US Status\s*Ends September 1, 2029/i],
    ['Career, Work', /Hester Vane/],
  ],
  released: [
    ['Papers, Permission To Work', /Your US Status\s*Out Of Status/i],
    ['Career, Work', /released you as Hester Vane on September 2, 2029: your OPT ended on September 1, 2029, after more than 90 days without work/],
    ['Guide, Permission To Work', /On OPT, each day is counted once it’s over: a day with work from a job’s first day to its last/],
  ],
  roles: [
    ['Career, Opportunities', /What It Asks\s*(Psychological Horror|Coming Of Age|Farce|Domestic Drama|Police Procedural|Psychological Thriller|Romantic Comedy)\. /],
    ['Career, Opportunities', /What It Asks\s*[^.]*, (Horror|Drama|Comedy|Crime|Thriller)\./, true],
    ['Guide, Genres', /Each play, part, class scene and professional role says how much of each genre it asks/],
    ['Guide, Genres', /counts at 65%: Psychological Horror known counts toward Horror/],
    ['Guide, Genres', /counts at 40%: Comedy known counts toward Farce/],
    ['Guide, Genres', /One step only: Nordic Noir doesn’t count toward Drama, two steps away/],
  ],
};
const browser = await chromium.launch(launchOptions());
const view = { width: WIDTH, height: PHONE ? 844 : 900 };
const clean = (s) => String(s ?? '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const git = (cmd) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

async function press(page, locator) { await locator.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
const clock = async (page) => String(await page.locator('.topbar-clock').first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
async function sideways(page, found, where) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 1) found.push(`${where}: the page scrolls ${over}px sideways`);
}
async function picture(page, name, n, scope) {
  const file = `${name}-${String(n).padStart(2, '0')}`;
  await page.screenshot({ path: `${dir}/${file}.jpg`, type: 'jpeg', quality: 60, fullPage: true });
  const text = clean(await page.locator(scope ?? 'body').first().innerText().catch(() => ''));
  writeFileSync(`${dir}/${file}.txt`, text + '\n');
  return { file, text };
}
async function rail(page, name) {
  const target = page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  if (!(await target.isVisible().catch(() => false))) {
    const menu = page.getByRole('button', { name: /^Menu$/ }).first();
    if (await menu.count()) await press(page, menu);
  }
  await press(page, page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first());
  await page.waitForTimeout(700);
}
async function tab(page, list, label, found) {
  const t = page.getByRole('tablist', { name: list }).getByRole('tab', { name: label, exact: true }).first();
  if (!(await t.count())) { found.push(`${list}: no ${label} tab`); return false; }
  await press(page, t);
  await page.waitForTimeout(600);
  return true;
}
async function guide(page, entry, found) {
  await page.keyboard.press('?'); await page.waitForTimeout(800);
  const help = page.locator('[role=dialog][aria-label="How This Works"]');
  const b = help.getByRole('button', { name: entry, exact: true }).first();
  if (!(await b.count())) { found.push(`How This Works: no ${entry} entry`); await page.keyboard.press('Escape'); return undefined; }
  await press(page, b);
  const all = help.getByRole('button', { name: 'Show Everything' });
  // Show Everything opens every section; pressing a summary after it would close that one again.
  if (await all.count()) await press(page, all);
  await page.waitForTimeout(400);
  return help;
}

const result = { width: WIDTH, base: BASE, commit: git('rev-parse --short=8 HEAD'), at: new Date().toISOString(), saves: [] };
for (const file of saves) {
  const name = file.replace(/\.json\.gz$/, '');
  const page = await browser.newPage({ viewport: view });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page error: ${String(e).slice(0, 240)}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console error: ${m.text().slice(0, 240)}`); });
  const found = [];
  const steps = [];
  const read = {};
  let n = 0;
  try {
    const text = gunzipSync(readFileSync(`${SAVES}/${file}`)).toString('utf8');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    await press(page, page.getByRole('button', { name: /^Continue$/ }).first());
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(1200);
    const opened = await clock(page);
    steps.push({ step: 'opened with Continue: Home', clock: opened, picture: (await picture(page, name, ++n)).file });
    await sideways(page, found, 'Home');

    await rail(page, 'Papers');
    if (await tab(page, 'Papers', 'Permission To Work', found)) {
      await sideways(page, found, 'Papers, Permission To Work');
      const shot = await picture(page, name, ++n);
      read['Papers, Permission To Work'] = shot.text;
      steps.push({ step: 'Papers, Permission To Work', picture: shot.file });
    }
    await rail(page, 'Career');
    for (const t of ['Work', 'Opportunities']) {
      if (!(await tab(page, 'Career', t, found))) continue;
      // A booked or released engagement's history, as a player opens it.
      for (const s of await page.locator('summary').all()) { if (/History|What Happened/.test(await s.innerText().catch(() => ''))) { await s.focus(); await page.keyboard.press('Enter'); } }
      await page.waitForTimeout(400);
      await sideways(page, found, `Career, ${t}`);
      const shot = await picture(page, name, ++n);
      read[`Career, ${t}`] = shot.text;
      steps.push({ step: `Career, ${t}`, picture: shot.file });
    }
    for (const entry of ['Genres', 'Permission To Work']) {
      const help = await guide(page, entry, found);
      if (!help) continue;
      await sideways(page, found, `How This Works, ${entry}`);
      const shot = await picture(page, name, ++n, '[role=dialog][aria-label="How This Works"]');
      read[`Guide, ${entry}`] = shot.text;
      steps.push({ step: `How This Works, ${entry}`, picture: shot.file });
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    }
    for (const [where, pattern, absent] of EXPECT[name] ?? []) {
      const said = pattern.test(read[where] ?? '');
      steps.push({ step: `${absent ? 'doesn’t read' : 'reads'} ${pattern}`, on: where, held: absent ? !said : said });
      if (said === Boolean(absent)) found.push(`${where}: ${absent ? 'says' : 'doesn’t say'} ${pattern}`);
    }
    const now = await clock(page);
    if (now !== opened) found.push(`the clock moved from ${opened} to ${now} with nothing pressed that moves it`);
  } catch (e) {
    found.push(`the walk stopped: ${String(e).split('\n')[0].slice(0, 240)}`);
    await picture(page, name, ++n).catch(() => {});
  }
  for (const e of errors) found.push(e);
  result.saves.push({ save: name, steps, found });
  console.log(`${name} @${WIDTH}: ${steps.length} steps, ${found.length ? found.join('; ') : 'nothing found'}`);
  await page.close();
}
await browser.close();
writeFileSync(`${OUT}/walk-${WIDTH}.json`, JSON.stringify(result, null, 1) + '\n');
process.exit(result.saves.some((s) => s.found.length) ? 1 : 0);
