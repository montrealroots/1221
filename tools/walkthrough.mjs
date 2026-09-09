/**
 * Photographs every screen in the game, in the order a player meets them.
 *
 * Startup, the save slots, every creation step, Home, and the calendar.
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

const SCREENS = [
  ['home', /^Home$/], ['calendar', /^Calendar$/],
];

for (const [name, pattern] of SCREENS) {
  const link = page.getByRole('button', { name: pattern }).first();
  if (!(await link.count())) { console.log('   (no nav entry for', name, ')'); continue; }
  await link.click().catch(() => {});
  await page.waitForTimeout(1200);
  await shoot(name);
}

await browser.close();
console.log(`\n${n} screens captured in ${OUT}/`);
