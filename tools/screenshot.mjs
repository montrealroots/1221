/**
 * Drives the running app and photographs it.
 *
 * Takes a route through startup, character creation and into the game, so a
 * change to the interface can be looked at rather than argued about.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4173';
const OUT = process.argv[2] ?? 'screenshots';
const WIDTH = Number(process.env.WIDTH ?? 1280);
const HEIGHT = Number(process.env.HEIGHT ?? 900);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 300)));

const shoot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log('  shot', name);
};

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(3800);
await shoot('01-startup');

const start = page.getByRole('button', { name: /new (save|game)|start|empty slot|create/i }).first();
if (await start.count()) { await start.click().catch(() => {}); await page.waitForTimeout(1000); }
await shoot('02-identity');

// Walk the creation steps.
for (const step of ['03-personal', '04-career', '05-starting-point', '06-review']) {
  const next = page.getByRole('button', { name: /^(next|continue)/i }).first();
  if (!(await next.count())) break;
  await next.click().catch(() => {});
  await page.waitForTimeout(900);
  await shoot(step);
}

// Into the game itself.
const begin = page.getByRole('button', { name: /it.s time to be great|begin|start save/i }).first();
if (await begin.count()) {
  await begin.click().catch(() => {});
  await page.waitForTimeout(3000);
  await shoot('07-home');

  for (const [name, pattern] of [
    ['08-world', /^world$/i],
    ['09-calendar', /calendar/i],
    ['10-bank', /^bank$/i],
  ]) {
    const link = page.getByRole('button', { name: pattern }).first();
    if (await link.count()) {
      await link.click().catch(() => {});
      await page.waitForTimeout(1200);
      await shoot(name);
    }
  }
}

await browser.close();
console.log(`done — ${OUT}/`);
