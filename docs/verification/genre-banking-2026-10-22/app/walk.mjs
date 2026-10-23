/**
 * Brief 21's saves (`make-saves.ts`) opened on the built app at a width, as a player opens one: put in the browser's own
 * store as the game keeps a slot, the page reloaded, and Continue pressed by the keyboard, as
 * `../../audit-2026-10-21/app/older-walk.mjs` opens its saves. Then, through the visible controls only:
 *
 * - Money on the rail (on a phone, the menu first), and each of its tabs pressed in turn, each pictured, with what the
 *   screen says written beside it;
 * - Home pictured;
 * - Advance → Tomorrow Morning pressed, a stop on the way closed with Stand Here, and the clock let run on;
 * - Save & Exit pressed, the menu's Continue pressed, and the clock read again: it must be the clock read before the exit.
 *
 * Held on every screen: no page error and no console error, and no sideways scroll. Held for each save, the words brief
 * 21 changed, read off the screen (EXPECT below). Nothing that commits is pressed beyond the clock and the save.
 *
 *   SLATE_BASE=http://localhost:4187 node docs/verification/genre-banking-2026-10-22/app/walk.mjs OUTDIR WIDTH
 *
 * Writes OUTDIR/WIDTH/<save>-NN.jpg and .txt, and OUTDIR/walk-WIDTH.json. Exits 1 where any save has a finding.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { execSync } from 'node:child_process';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4187';
const [OUT = 'walk', W = '1440'] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const dir = `${OUT}/${WIDTH}`;
mkdirSync(dir, { recursive: true });
const SAVES = 'docs/verification/genre-banking-2026-10-22/app/saves';
const saves = readdirSync(SAVES).filter((f) => f.endsWith('.json.gz')).sort();
/** What each save's screens must say: [the tab it's read on, a pattern]. */
const EXPECT = {
  behind: [
    ['Cards', /payment is due on the 13th of the next month, at least 21 days after each one/],
    ['Cards', /The oldest minimum still short was due October 13, 2026\. Pay it before April 11, 2027, 180 days after it was due/],
    ['Cards', /A minimum payment more than 60 days late raises the rate to 29\.99%, 45 days after the bank’s notice/],
    ['Statements', /The minimum payment is \$[\d,]+\.\d\d, \$[\d,]+\.\d\d of it past due, due December 13, 2026/],
  ],
  capone: [['Accounts', /Pays 3(\.00)?% APY \(2\.96% a year before compounding\)/]],
  london: [['Payments And Cash', /Standing Order|standing order/]],
};
const browser = await chromium.launch(launchOptions());
const view = { width: WIDTH, height: PHONE ? 844 : 900 };
const clean = (s) => String(s ?? '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const git = (cmd) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

async function press(page, locator) { await locator.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500); }
/**
 * A control of the bar's secondary side, the guide or Save & Exit, pressed: in the drawer's foot while the rail is a
 * drawer (from brief 23, 2026-10-23), so there the menu is opened first. Until then it stood in the bar at every width,
 * and on brief 23's commit this walk found it nowhere at 390 (brief 22's final runs played again, 2026-10-23).
 */
async function saveGroup(page, locator) {
  if (!(await locator.isVisible().catch(() => false))) {
    const menu = page.getByRole('button', { name: /^Menu$/ }).first();
    if (await menu.count()) await press(page, menu);
  }
  await press(page, locator);
}
const clock = async (page) => String(await page.locator('.topbar-clock').first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
async function sideways(page, found, where) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 1) found.push(`${where}: the page scrolls ${over}px sideways`);
}
async function picture(page, name, n) {
  const file = `${name}-${String(n).padStart(2, '0')}`;
  await page.screenshot({ path: `${dir}/${file}.jpg`, type: 'jpeg', quality: 60, fullPage: true });
  const text = clean(await page.locator('body').innerText().catch(() => ''));
  writeFileSync(`${dir}/${file}.txt`, text + '\n');
  return { file, text };
}
async function rail(page, name) {
  const target = page.locator('nav.rail .rail-item').filter({ hasText: name }).first();
  if (!(await target.isVisible().catch(() => false))) {
    const menu = page.getByRole('button', { name: /^Menu$/ }).first();
    if (await menu.count()) await press(page, menu);
  }
  await press(page, page.locator('nav.rail .rail-item').filter({ hasText: name }).first());
  await page.waitForTimeout(700);
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
    const home = await picture(page, name, ++n);
    steps.push({ step: 'opened with Continue: Home', clock: opened, picture: home.file });
    await sideways(page, found, 'Home');
    await rail(page, 'Money');
    for (const tab of ['Accounts', 'Cards', 'Payments And Cash', 'Borrowing', 'Statements']) {
      const control = page.getByRole('tab', { name: new RegExp(`^${tab}$`) }).first();
      const button = (await control.count()) ? control : page.getByRole('button', { name: new RegExp(`^${tab}$`) }).first();
      if (!(await button.count())) { found.push(`Money: no ${tab} tab`); continue; }
      await press(page, button);
      await page.waitForTimeout(600);
      // As a player reads them: The Card's Terms opened on Cards, and the card chosen on Statements where there is one.
      if (tab === 'Cards') for (const summary of await page.locator('summary').filter({ hasText: 'The Card’s Terms' }).all()) { await summary.click(); await page.waitForTimeout(300); }
      if (tab === 'Statements') {
        const account = page.getByLabel('Account').first();
        const card = (await account.locator('option').allInnerTexts().catch(() => [])).find((o) => /Freedom|Card|Platinum/.test(o));
        if (card) { await account.selectOption({ label: card }); await page.waitForTimeout(600); }
        // The last statement cut, not the one still running.
        const period = page.getByLabel('Period').first();
        const cut = (await period.locator('option').allInnerTexts().catch(() => [])).find((o) => !/So Far/.test(o));
        if (cut) { await period.selectOption({ label: cut }); await page.waitForTimeout(600); }
      }
      await sideways(page, found, `Money, ${tab}`);
      const shot = await picture(page, name, ++n);
      read[tab] = shot.text;
      steps.push({ step: `Money, ${tab}`, picture: shot.file });
    }
    for (const [tab, pattern] of EXPECT[name] ?? []) {
      const where = read[tab] ?? '';
      steps.push({ step: `reads ${pattern}`, on: tab, held: pattern.test(where) });
      if (!pattern.test(where)) found.push(`Money, ${tab}: doesn't say ${pattern}`);
    }
    await rail(page, 'Home');
    await press(page, page.getByRole('button', { name: /^Advance/ }).first());
    const item = page.getByRole('menu', { name: 'Advance Time' }).getByRole('menuitem').filter({ hasText: 'Tomorrow Morning' }).first();
    await press(page, item);
    const confirm = page.getByRole('dialog').getByRole('button', { name: /^(Go Anyway|Go|Advance|Continue)$/ }).first();
    if (await confirm.isVisible().catch(() => false)) await press(page, confirm);
    let moved = '';
    for (let i = 0; i < 120; i += 1) {
      await page.waitForTimeout(500);
      const dialog = page.getByRole('dialog').first();
      if (await dialog.isVisible().catch(() => false)) {
        const stand = dialog.getByRole('button', { name: /^(Stand Here|Not Yet|Cancel|Close)$/ }).first();
        if (await stand.count()) await press(page, stand); else await page.keyboard.press('Escape');
      }
      moved = await clock(page);
      if (moved !== opened) break;
    }
    if (moved === opened) found.push('Advance → Tomorrow Morning: the clock didn’t move in a minute');
    steps.push({ step: 'Advance → Tomorrow Morning', clock: moved, picture: (await picture(page, name, ++n)).file });
    await page.waitForTimeout(800);
    const before = await clock(page);
    await saveGroup(page, page.getByRole('button', { name: /^Save & Exit$/ }).first());
    await page.getByRole('button', { name: /^Continue$/ }).first().waitFor({ timeout: 30000 });
    await press(page, page.getByRole('button', { name: /^Continue$/ }).first());
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(1200);
    const after = await clock(page);
    if (after !== before) found.push(`Save & Exit then Continue: the clock read ${before} before and ${after} after`);
    steps.push({ step: 'Save & Exit, then Continue', before, after, picture: (await picture(page, name, ++n)).file });
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
