/**
 * Photographs every screen in the game, in the order a player meets them.
 *
 * Startup, the save slots, all five creation steps, then every workspace in
 * the navigation, plus Go Anywhere and the help panel.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4173';
const OUT = process.argv[2] ?? 'walkthrough';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 200)));

let n = 0;
const shoot = async (name) => {
  n += 1;
  const file = `${OUT}/${String(n).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: file });
  console.log('  ', file);
};

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// 1 — the boot sequence, caught mid-run.
await page.waitForTimeout(900);
await shoot('startup');
await page.waitForTimeout(3200);

// 2 — save slots.
await shoot('save-slots');

// 3-7 — character creation.
const start = page.getByRole('button', { name: /new (save|game)|start|empty slot|create/i }).first();
if (await start.count()) { await start.click().catch(() => {}); await page.waitForTimeout(1100); }
await shoot('creation-identity');

for (const name of ['creation-personal', 'creation-career', 'creation-starting-point', 'creation-review']) {
  const next = page.getByRole('button', { name: /^(next|continue)/i }).first();
  if (!(await next.count())) break;
  await next.click().catch(() => {});
  await page.waitForTimeout(900);
  await shoot(name);
}

// Into the game.
const begin = page.getByRole('button', { name: /it.s time to be great|begin|start save/i }).first();
if (await begin.count()) { await begin.click().catch(() => {}); await page.waitForTimeout(3600); }

// Clear the coach mark so it does not sit over every screen.
const gotIt = page.getByRole('button', { name: /got it/i }).first();
if (await gotIt.count()) { await gotIt.click().catch(() => {}); await page.waitForTimeout(500); }
const guidedOff = page.getByRole('button', { name: /turn guided mode off/i }).first();
if (await guidedOff.count()) { await guidedOff.click().catch(() => {}); await page.waitForTimeout(500); }

const SCREENS = [
  ['home', /^Home$/], ['world', /^World$/], ['calendar', /^Calendar$/],
  ['wellbeing', /^Wellbeing$/], ['relationships', /^Relationships$/], ['history', /^History$/],
  ['bank', /^Bank$/], ['property', /^Property$/], ['vehicles', /^Vehicles$/],
  ['shopping', /^Shopping$/], ['insurance', /^Insurance$/],
  ['work', /^Work$/], ['casting', /^Casting$/], ['projects', /^Projects$/],
  ['company', /^Company$/], ['awards', /^Awards$/], ['social', /^Social$/],
  ['health', /^Health$/], ['education', /^Education$/], ['travel', /^Travel$/],
  ['character', /^Character$/], ['settings', /^Settings$/],
];

for (const [name, pattern] of SCREENS) {
  const link = page.getByRole('button', { name: pattern }).first();
  if (!(await link.count())) { console.log('   (no nav entry for', name, ')'); continue; }
  await link.click().catch(() => {});
  await page.waitForTimeout(1200);
  const dismiss = page.getByRole('button', { name: /got it/i }).first();
  if (await dismiss.count()) { await dismiss.click().catch(() => {}); await page.waitForTimeout(300); }
  await shoot(name);
}

// Go Anywhere, with a query typed in so the results show.
const search = page.getByRole('button', { name: /go anywhere/i }).first();
if (await search.count()) {
  await search.click().catch(() => {});
  await page.waitForTimeout(700);
  await page.keyboard.type('doctor');
  await page.waitForTimeout(800);
  await shoot('go-anywhere');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

// The help panel.
const help = page.getByRole('button', { name: /help/i }).first();
if (await help.count()) {
  await help.click().catch(() => {});
  await page.waitForTimeout(900);
  await shoot('help');
}

await browser.close();
console.log(`\n${n} screens captured in ${OUT}/`);
