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

// They/Them settles nothing, so Identity asks which word the business lists
// you under and will not advance until it is answered. Without this the walk
// never left the first step and quietly shot it five times over.
const billed = page.getByRole('button', { name: /^(actor|actress)$/i }).first();
if (await billed.count()) { await billed.click().catch(() => {}); await page.waitForTimeout(300); }

// Walk the creation steps, and say so when one of them does not open. A walk
// that shoots the same page under five names is worse than one that stops:
// the shots look like a full set and the fault is in every one of them.
const stepName = () => page.locator('.creation-step[data-state="active"]').first().innerText();
for (const step of ['03-personal', '04-career', '05-your-people', '06-starting-point', '07-review']) {
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
const begin = page.getByRole('button', { name: /it.s time to be great|begin|start save/i }).first();
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

  for (const [name, pattern] of [
    ['08-world', /^world$/i],
    ['09-calendar', /calendar/i],
    ['10-wellbeing', /wellbeing/i],
    ['11-relationships', /relationships/i],
    ['12-history', /^history$/i],
    ['13-bank', /^bank$/i],
    ['14-property', /^property$/i],
    ['15-vehicles', /^vehicles$/i],
    ['16-shopping', /^shopping$/i],
    ['17-insurance', /insurance/i],
    ['18-work', /^work$/i],
    ['19-social', /^social$/i],
    ['20-health', /^health$/i],
    ['21-education', /education/i],
    ['22-city', /^the city$/i],
    ['23-travel', /^travel$/i],
    ['24-character', /character/i],
    ['25-settings', /settings/i],
  ]) {
    await openRail();
    const link = page.getByRole('button', { name: pattern }).first();
    if (!(await link.count())) { console.log('  (no rail entry for', name, ')'); continue; }
    await link.click().catch(() => {});
    await page.waitForTimeout(1300);
    // Guided-mode cards cover the screen they are explaining.
    const gotIt = page.getByRole('button', { name: /^got it$/i }).first();
    if (await gotIt.count()) { await gotIt.click().catch(() => {}); await page.waitForTimeout(400); }
    await shoot(name);
  }

  // Go Anywhere, which is how most of the game is actually reached.
  await page.keyboard.press('/').catch(() => {});
  await page.waitForTimeout(700);
  await shoot('26-go-anywhere');
  await page.keyboard.press('Escape').catch(() => {});
}

await browser.close();
console.log(`done — ${OUT}/`);
