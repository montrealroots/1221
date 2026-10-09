/**
 * Drives the running app and photographs it.
 *
 * Takes a route through startup, character creation and into the game, so a
 * change to the interface can be looked at rather than argued about.
 */

import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { launchOptions } from './browser.mjs';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4173';
const OUT = process.argv[2] ?? 'screenshots';
const WIDTH = Number(process.env.WIDTH ?? 1280);
const HEIGHT = Number(process.env.HEIGHT ?? 900);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 300)));

/**
 * The whole page, top to bottom. `fullPage` alone sized the image to the page
 * and painted only the first viewport of it: on a creation step everything
 * below the first 900 pixels came out blank. So the viewport is grown to the
 * tallest thing that scrolls, page or panel, the shot is taken at that size,
 * and the viewport is put back.
 */
const shoot = async (name) => {
  const tallest = await page.evaluate(() => Math.max(
    document.documentElement.scrollHeight,
    ...[...document.querySelectorAll('*')].map((el) => el.scrollHeight),
  ));
  await page.setViewportSize({ width: WIDTH, height: Math.max(HEIGHT, tallest) });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  console.log('  shot', name);
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(3800);
await shoot('01-startup');

// The walk's steps (SHOT_STEPS, below), taken on a new life or a played one.
async function runSteps() {
  for (const step of (process.env.SHOT_STEPS ?? '').split(';').map((s) => s.trim()).filter(Boolean)) {
    const [verb, ...rest] = step.split(':');
    const arg = rest.join(':');
    // Guided-mode cards only: a "Close" pressed here once shut the On The Way
    // confirmation and quietly undid every advance after the first.
    const dismiss = async () => {
      const b = page.getByRole('button', { name: /^got it$/i }).first();
      if (await b.count()) { await b.click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(300); }
    };
    // Through what the clock meets on the way, as a player who turns up would:
    // Advance past the commitments it names, and Go to each one that comes due.
    const through = async () => {
      for (let n = 0; n < 60; n += 1) {
        const onward = page.getByRole('dialog').getByRole('button', { name: /^(advance|go)$/i }).first();
        if (!(await onward.count())) return;
        await onward.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(Number(process.env.SHOT_ADVANCE_MS ?? 4000));
      }
    };
    if (verb === 'press') {
      const b = page.getByRole('button', { name: new RegExp('^' + arg + '$', 'i') }).first();
      if (await b.count()) await b.click({ timeout: 3000 }).catch((e) => console.log('  press failed:', arg, String(e).slice(0, 120)));
      else console.log('  (no button', arg, ')');
    } else if (verb === 'row') {
      const [text, name] = arg.split('>');
      const b = page.locator('tr', { hasText: text }).getByRole('button', { name: new RegExp('^' + name + '$', 'i') }).first();
      if (await b.count()) await b.click({ timeout: 3000 }).catch(() => {});
      else console.log('  (no row', text, 'with', name, ')');
    } else if (verb === 'fill') {
      const [selector, value] = arg.split('=');
      await page.locator(selector).first().fill(value ?? '').catch((e) => console.log('  fill failed:', selector, String(e).slice(0, 120)));
    } else if (verb === 'select') {
      // `select:#id=value` chooses an option of a dropdown by its value.
      const [selector, value] = arg.split('=');
      await page.locator(selector).first().selectOption(value ?? '').catch((e) => console.log('  select failed:', selector, String(e).slice(0, 120)));
    } else if (verb === 'advance') {
      const [choice, times] = arg.split('*');
      for (let i = 0; i < Number(times ?? 1); i += 1) {
        await dismiss();
        await page.getByRole('button', { name: /^advance/i }).first().click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(300);
        await page.getByRole('menuitem', { name: new RegExp('^' + choice, 'i') }).first().click({ timeout: 3000 }).catch(() => {});
        // The clock runs to the moment rather than jumping; a press while it runs is lost.
        await page.waitForTimeout(Number(process.env.SHOT_ADVANCE_MS ?? 4000));
        await through();
      }
      await dismiss();
    } else if (verb === 'tab') {
      // A workspace's tab, which is a tab and not a button (from 2026-10-01).
      const t = page.getByRole('tab', { name: new RegExp('^' + arg + '$', 'i') }).first();
      if (await t.count()) await t.click({ timeout: 3000 }).catch(() => {});
      else console.log('  (no tab', arg, ')');
    } else if (verb === 'shot') await shoot(arg);
    else console.log('  (unknown step', step, ')');
    await page.waitForTimeout(800);
  }
}

// A save opened instead of a new life (SHOT_SAVE, a played life's snapshot):
// put in slot 1's place in the browser's store, continued, and the screens
// asked for (SHOT_ROUTES) shot. A screen only an older life reaches, a home
// owned, a house built, is looked at this way.
if (process.env.SHOT_SAVE) {
  const raw = readFileSync(process.env.SHOT_SAVE, 'utf8');
  await page.evaluate((text) => new Promise((resolve, reject) => {
    const req = indexedDB.open('slate', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('saves'); };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const tx = req.result.transaction('saves', 'readwrite');
      tx.objectStore('saves').put(text, 'slate.save.1');
      tx.oncomplete = () => resolve(undefined);
      tx.onerror = () => reject(tx.error);
    };
  }), raw);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.getByRole('button', { name: /^continue$/i }).first().click({ timeout: 5000 }).catch((e) => console.log('  continue failed:', String(e).slice(0, 120)));
  await page.waitForTimeout(5000);
  await shoot('save-home');
  for (const route of (process.env.SHOT_ROUTES ?? '').split(',').map((r) => r.trim()).filter(Boolean)) {
    const word = route.split('/').filter(Boolean).pop() ?? '';
    const button = page.getByRole('button', { name: new RegExp('^' + word + '$', 'i') }).first();
    if (await button.count()) await button.click({ timeout: 2000 }).catch(() => {});
    else console.log('  (no button for', route, ')');
    await page.waitForTimeout(1500);
    await shoot('save-' + route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''));
  }
  await runSteps();
  await browser.close();
  console.log(`done — ${OUT}/`);
  process.exit(0);
}

const start = page.getByRole('button', { name: /new (save|game)|start|empty slot|create/i }).first();
if (await start.count()) { await start.click().catch(() => {}); await page.waitForTimeout(1000); }

// They/them is the default and settles no title: Identity asks which word to
// bill you under and will not advance until it is answered. Without this the
// walk never leaves the first step.
const billed = page.getByRole('button', { name: /^(actor|actress)$/i }).first();
if (await billed.count()) { await billed.click().catch(() => {}); await page.waitForTimeout(300); }
// Identity asks where you were born, from a town picker: New York, the first match.
const town = page.getByPlaceholder(/start typing a town name/i).first();
if (await town.count()) {
  await town.fill('New York').catch(() => {});
  const match = page.locator('.picker-results [role="option"]').first();
  await match.waitFor({ timeout: 5000 }).catch(() => {});
  await match.scrollIntoViewIfNeeded().catch(() => {});
  await match.click({ timeout: 3000 }).catch((e) => console.log('  birthplace click:', String(e).slice(0, 160)));
  await page.waitForTimeout(400);
}
await shoot('02-identity');

// Walk the creation steps, and say so when one of them does not open. A walk
// that shoots the same page under five names is worse than one that stops:
// the shots look like a full set and the fault is in every one of them.
const stepName = () => page.locator('.creation-step[data-state="active"]').first().innerText();
for (const step of ['03-dispositions-and-traits', '04-genres-and-background', '05-starting-point', '06-review']) {
  const before = await stepName().catch(() => '');
  const next = page.getByRole('button', { name: /^(next|continue)/i }).first();
  if (!(await next.count())) break;
  await next.click().catch(() => {});
  await page.waitForTimeout(900);
  const after = await stepName().catch(() => '');
  if (after === before) {
    const blocking = await page.locator('.callout-warning').allInnerTexts();
    console.log(`  STUCK on ${before || 'the first step'}:`, blocking.join(' ') || 'Continue would not press');
    break;
  }
  await shoot(step);
}

// Into the game itself.
const begin = page.getByRole('button', { name: /^begin$|start save/i }).first();
if (await begin.count()) {
  await begin.click().catch(() => {});
  await page.waitForTimeout(3000);
  await shoot('07-home');

  // Every workspace the game still has, in the order the rail lists them.
  const openRail = async () => {
    const toggle = page.getByRole('button', { name: /toggle navigation/i }).first();
    if (!(await toggle.count())) return;
    if ((await page.locator('nav.rail[data-open="true"]').count()) === 0) {
      await toggle.click().catch(() => {});
      await page.waitForTimeout(400);
    }
  };

  // Whatever the rail actually lists, in the order it lists it. A hard-coded
  // list here went stale the moment a workspace was deleted, and quietly said
  // "no rail entry" for pages that were sitting right there.
  await openRail();
  const railed = (await page.locator('nav.rail .rail-item').allInnerTexts())
    .map((text) => text.split('\n')[0].trim())
    .filter((label) => label.length > 0 && label !== 'Home');
  if (railed.length === 0) console.log('  (the rail lists nothing but Home)');
  let n = 7;
  for (const label of railed) {
    n += 1;
    const name = `${String(n).padStart(2, '0')}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    await openRail();
    const link = page.locator('nav.rail .rail-item', { hasText: label }).first();
    if (!(await link.count())) { console.log('  (rail entry vanished:', label, ')'); continue; }
    await link.click().catch(() => {});
    await page.waitForTimeout(1300);
    // Guided-mode cards cover the screen they are explaining.
    const gotIt = page.getByRole('button', { name: /^got it$/i }).first();
    if (await gotIt.count()) { await gotIt.click().catch(() => {}); await page.waitForTimeout(400); }
    await shoot(name);
  }

  // Every chapter of the guide read first (SHOT_READ_GUIDE=1), so what it gates is open.
  if (process.env.SHOT_READ_GUIDE) {
    for (let i = 0; i < 80; i += 1) {
      const read = page.getByRole('button', { name: /^i’ve read it$/i }).first();
      if (await read.count()) { await read.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(300); continue; }
      const onward = page.getByRole('button', { name: /^next: /i }).first();
      if (await onward.count()) { await onward.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(300); continue; }
      const open = page.getByRole('button', { name: /^read$/i }).first();
      if (!(await open.count())) break;
      await open.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
  }

  // Screens asked for by name (SHOT_ROUTES, comma separated, e.g. workspace/travel):
  // the app routes from its own state, not the address bar, so the button named
  // for the route's last part is pressed, as a player would press it.
  for (const route of (process.env.SHOT_ROUTES ?? '').split(',').map((r) => r.trim()).filter(Boolean)) {
    const word = route.split('/').filter(Boolean).pop() ?? '';
    const button = page.getByRole('button', { name: new RegExp('^' + word + '$', 'i') }).first();
    if (await button.count()) await button.click({ timeout: 2000 }).catch(() => {});
    else console.log('  (no button for', route, ')');
    await page.waitForTimeout(1300);
    const gotIt = page.getByRole('button', { name: /^got it$/i }).first();
    if (await gotIt.count()) { await gotIt.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(400); }
    await shoot('route-' + route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, ''));
  }

  // A walk through the game as a player would take it (SHOT_STEPS, `;` between
  // steps), for a screen that shows only once something has happened:
  // `press:Name` presses the button so named; `row:Text>Name` presses it in the
  // table row holding the text; `fill:#id=value` types into a field;
  // `advance:One Week*7` takes the Advance menu's choice that many times;
  // `shot:name` photographs the page.
  await runSteps();

  // There used to be a Go Anywhere palette on `/` and this walk shot it every
  // run. It was deleted with the rest of the unkept interface and nothing
  // replaced the keybinding, so the shot was the page behind it, filed under
  // the name of a screen that no longer exists — which is the same fault as
  // shooting one creation step under five names, and this file already warns
  // about that one. So it presses the key and says whether anything opened,
  // rather than photographing whatever was underneath.
  await page.keyboard.press('/').catch(() => {});
  await page.waitForTimeout(700);
  const palette = await page.locator('[role="dialog"], .palette, .command-palette').count();
  if (palette > 0) { await shoot('26-go-anywhere'); await page.keyboard.press('Escape').catch(() => {}); }
  else console.log('  (nothing opens on / — there is no Go Anywhere in this build)');
}

await browser.close();
console.log(`done — ${OUT}/`);
