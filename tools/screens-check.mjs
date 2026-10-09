/**
 * Every screen opened in the running app, and every tab on it, on a played
 * life (the owner's audit of 2026-10-06: until then no screen was checked in
 * a browser at all, only the commands the screens send).
 *
 * A save is put in slot 1's place in the browser's store, as
 * `tools/screenshot.mjs` does, and continued. The guide is read through, as a
 * player reads it, where the life is a guided one. Then each destination in
 * `src/ui/shell/destinations.ts` is opened from Home, and each tab on it
 * pressed. A screen fails on an uncaught error in the page, an error written
 * to the console, the app's own "Something went wrong.", or no heading. The
 * exit is the count of failures, so a pipe can't hide one.
 *
 *   npx vite build && npx vite preview --port 4173 &
 *   node tools/screens-check.mjs <save.json> [<save.json> ...]
 */

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { launchOptions } from './browser.mjs';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4173';
const saves = process.argv.slice(2);
if (saves.length === 0) { console.error('Name at least one save.'); process.exit(2); }

// The destinations, read from the source the shell reads, so a new screen is checked without editing this.
const DEST = [...readFileSync('src/ui/shell/destinations.ts', 'utf8').matchAll(/route: '([^']+)', label: '([^']+)'/g)].map((m) => ({ route: m[1], label: m[2] }));

/** The Home panel a destination opens from where its button doesn't carry its name (the school's, the bank's). */
const PANEL = { '/workspace/career': 'Career', '/workspace/school': 'School', '/workspace/bank': 'Money' };

const browser = await chromium.launch(launchOptions());
let failures = 0;
let screens = 0;
let tabs = 0;

for (const file of saves) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page error: ${String(e).slice(0, 240)}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 240)}`); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
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
  }), readFileSync(file, 'utf8'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /^continue$/i }).first().click({ timeout: 8000 }).catch((e) => errors.push(`continue: ${String(e).slice(0, 160)}`));
  await page.waitForTimeout(4000);

  const check = async (where) => {
    const broken = await page.getByText('Something went wrong.').count();
    const heading = await page.locator('h1').count();
    const found = [...errors.splice(0), ...(broken ? ['the app showed "Something went wrong."'] : []), ...(heading ? [] : ['no heading'])];
    if (found.length) {
      failures += 1;
      console.log(`FAIL ${where}`);
      for (const f of found) console.log(`  ${f}`);
      // What was on the screen, to look at rather than guess.
      if (process.env.SCREENS_SHOTS) await page.screenshot({ path: `${process.env.SCREENS_SHOTS}/fail-${failures}.png` }).catch(() => {});
    }
    else console.log(`ok   ${where}`);
  };

  await check(`${file} /home`);
  screens += 1;

  // The guide read through first, as a player reads it, where the life is guided: a screen opens once its chapter is
  // read. A life that isn't guided has every screen open, and the dialog is closed.
  await page.getByRole('button', { name: /^guide/i }).first().click({ timeout: 3000 }).catch((e) => errors.push(`guide: ${String(e).slice(0, 160)}`));
  await page.waitForTimeout(600);
  let chapters = 0;
  for (let n = 0; n < 200; n += 1) {
    const read = page.getByRole('button', { name: /^I.ve Read It$/ }).first();
    const next = page.getByRole('button', { name: /^Next: / }).first();
    const done = page.getByRole('button', { name: /^Start Playing$/ }).first();
    if (await read.count()) { await read.click({ timeout: 3000 }); chapters += 1; }
    else if (await next.count()) await next.click({ timeout: 3000 });
    else {
      if (await done.count()) await done.click({ timeout: 3000 });
      else await page.getByRole('dialog').getByRole('button', { name: /^(Close|Later)$/ }).first().click({ timeout: 2000 }).catch(() => page.keyboard.press('Escape'));
      break;
    }
    await page.waitForTimeout(250);
  }
  console.log(`     the guide: ${chapters} chapters read`);
  await check(`${file} the guide`);

  for (const d of DEST) {
    // Each destination opens from Home, as it did when the rail listed none (until 2026-10-08), so Home first.
    await page.locator('nav.rail').getByRole('button', { name: /^Home/ }).first().click({ timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(800);
    const named = page.getByRole('button', { name: new RegExp('^' + d.label + '$', 'i') }).first();
    const panel = PANEL[d.route];
    const button = (await named.count()) || !panel
      ? named
      : page.locator(`xpath=//*[self::h2 or self::h3][normalize-space()='${panel}']/ancestor::*[.//button][1]`).getByRole('button').first();
    if (!(await button.count())) { console.log(`skip ${d.route}: no button (the life can't reach it)`); continue; }
    // How long it took to open, its heading drawn: a screen past five seconds is named, not failed.
    const t0 = performance.now();
    await button.click({ timeout: 20000 }).catch((e) => errors.push(`open: ${String(e).slice(0, 160)}`));
    await page.locator('h1').first().waitFor({ timeout: 20000 }).catch(() => {});
    const took = performance.now() - t0;
    if (took > 5000) console.log(`slow ${d.route}: ${(took / 1000).toFixed(1)} s to open`);
    await page.waitForTimeout(1200);
    await check(`${file} ${d.route} (${(took / 1000).toFixed(1)} s)`);
    screens += 1;
    const tablist = page.getByRole('tab');
    const n = await tablist.count();
    for (let i = 0; i < n; i += 1) {
      const tab = tablist.nth(i);
      const name = ((await tab.textContent().catch(() => '')) ?? '').trim();
      await tab.click({ timeout: 20000 }).catch((e) => errors.push(`tab: ${String(e).slice(0, 160)}`));
      await page.waitForTimeout(700);
      await check(`${file} ${d.route} › ${name}`);
      tabs += 1;
    }
  }
  await page.close();
}

await browser.close();
console.log(`${screens} screens and ${tabs} tabs opened on ${saves.length} saves; ${failures} failed.`);
process.exit(failures);
