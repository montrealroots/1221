/**
 * The seven older saves in `tests/fixtures/` opened on the built app at a width, as a player opens one (brief 20, section
 * 5: "an older save" on "the built app on desktop and mobile"). Each is put in the browser's own store as the game keeps a
 * slot, the page reloaded, and Continue pressed by the keyboard, as `../../career-2026-10-20/app/app-walk.mjs` opens its
 * saves. Then, through the visible controls only:
 *
 * - Home pictured, the clock read off the top bar;
 * - every destination on the rail pressed in turn (on a phone, the menu first), each pictured;
 * - Advance → Tomorrow Morning pressed, a stop on the way closed with Stand Here (Escape) and the clock let run on, until
 *   the top bar's clock changes or a minute passes, then pictured;
 * - Save & Exit pressed, the menu's Continue pressed, and the clock read again: it must be the clock read before the exit.
 *
 * Held on every screen: no page error and no console error, and no sideways scroll (the page no wider than the window).
 * Nothing that commits is pressed beyond the clock and the save.
 *
 *   SLATE_BASE=http://localhost:4187 node docs/verification/audit-2026-10-21/app/older-walk.mjs OUTDIR WIDTH
 *
 * Writes OUTDIR/WIDTH/<save>-NN-<screen>.jpg and .txt (what the screen says), and OUTDIR/older-WIDTH.json, every save's
 * steps and findings. Exits 1 where any save has a finding.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { execSync } from 'node:child_process';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4187';
const [OUT = 'older', W = '1440'] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const dir = `${OUT}/${WIDTH}`;
mkdirSync(dir, { recursive: true });
const FIXTURES = 'tests/fixtures';
const saves = readdirSync(FIXTURES).filter((f) => f.endsWith('.json.gz')).sort();
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
async function picture(page, name, steps, n) {
  const file = `${name}-${String(n).padStart(2, '0')}`;
  await page.screenshot({ path: `${dir}/${file}.jpg`, type: 'jpeg', quality: 60 });
  writeFileSync(`${dir}/${file}.txt`, clean(await page.locator('body').innerText().catch(() => '')) + '\n');
  return file;
}
/** The rail's destinations, by name, read off the rail itself. */
async function railNames(page) {
  // On a phone the rail is behind the Menu button: open it to read the names, as a player would to see them.
  if (!(await page.locator('nav.rail .rail-item').first().isVisible().catch(() => false))) {
    const menu = page.getByRole('button', { name: /^Menu$/ }).first();
    if (await menu.count()) await press(page, menu);
  }
  const names = (await page.locator('nav.rail .rail-item').allInnerTexts()).map((t) => clean(t).split('\n')[0].replace(/\s*\d+$/, '').trim()).filter(Boolean);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  return names;
}
async function rail(page, name) {
  const target = page.locator('nav.rail .rail-item').filter({ hasText: name }).first();
  if (!(await target.isVisible().catch(() => false))) {
    const menu = page.getByRole('button', { name: /^Menu$/ }).first();
    if (await menu.count()) await press(page, menu);
  }
  await press(page, page.locator('nav.rail .rail-item').filter({ hasText: name }).first());
  await page.waitForTimeout(600);
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
  let n = 0;
  const started = Date.now();
  try {
    const text = gunzipSync(readFileSync(`${FIXTURES}/${file}`)).toString('utf8');
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    await press(page, page.getByRole('button', { name: /^Continue$/ }).first());
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(1200);
    const opened = await clock(page);
    steps.push({ step: 'opened with Continue', clock: opened, ms: Date.now() - started, picture: await picture(page, name, steps, ++n) });
    await sideways(page, found, 'Home');
    const dests = await railNames(page);
    if (dests.length < 5) found.push(`the rail named ${dests.length} destinations: ${dests.join(', ')}`);
    for (const dest of dests) {
      await rail(page, dest);
      await sideways(page, found, dest);
      const heading = clean(await page.locator('main h1, main h2').first().innerText().catch(() => ''));
      steps.push({ step: `rail: ${dest}`, heading, picture: await picture(page, name, steps, ++n) });
    }
    await rail(page, 'Home');
    // Advance → Tomorrow Morning, a stop on the way closed with Stand Here and the clock let run.
    await press(page, page.getByRole('button', { name: /^Advance/ }).first());
    const item = page.getByRole('menu', { name: 'Advance Time' }).getByRole('menuitem').filter({ hasText: 'Tomorrow Morning' }).first();
    await press(page, item);
    const confirm = page.getByRole('dialog').getByRole('button', { name: /^(Go Anyway|Go|Advance|Continue)$/ }).first();
    if (await confirm.isVisible().catch(() => false)) await press(page, confirm);
    let moved = '';
    let stops = 0;
    for (let i = 0; i < 120; i += 1) {
      await page.waitForTimeout(500);
      const dialog = page.getByRole('dialog').first();
      if (await dialog.isVisible().catch(() => false)) {
        const stand = dialog.getByRole('button', { name: /^(Stand Here|Not Yet|Cancel|Close)$/ }).first();
        if (await stand.count()) await press(page, stand); else await page.keyboard.press('Escape');
        stops += 1;
      }
      moved = await clock(page);
      if (moved !== opened) break;
    }
    if (moved === opened) found.push('Advance → Tomorrow Morning: the clock didn’t move in a minute');
    await sideways(page, found, 'after the advance');
    steps.push({ step: 'Advance → Tomorrow Morning', clock: moved, stops, picture: await picture(page, name, steps, ++n) });
    // Save & Exit, then Continue: the same clock.
    await page.waitForTimeout(800);
    const before = await clock(page);
    await press(page, page.getByRole('button', { name: /^Save & Exit$/ }).first());
    await page.getByRole('button', { name: /^Continue$/ }).first().waitFor({ timeout: 30000 });
    await press(page, page.getByRole('button', { name: /^Continue$/ }).first());
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(1200);
    const after = await clock(page);
    if (after !== before) found.push(`Save & Exit then Continue: the clock read ${before} before and ${after} after`);
    steps.push({ step: 'Save & Exit, then Continue', before, after, picture: await picture(page, name, steps, ++n) });
  } catch (e) {
    found.push(`the walk stopped: ${String(e).split('\n')[0].slice(0, 240)}`);
    await picture(page, name, steps, ++n).catch(() => {});
  }
  for (const e of errors) found.push(e);
  result.saves.push({ save: name, ms: Date.now() - started, steps, found });
  console.log(`${name} @${WIDTH}: ${steps.length} steps, ${found.length ? found.join('; ') : 'nothing found'}`);
  await page.close();
}
await browser.close();
writeFileSync(`${OUT}/older-${WIDTH}.json`, JSON.stringify(result, null, 1) + '\n');
process.exit(result.saves.some((s) => s.found.length) ? 1 : 0);
