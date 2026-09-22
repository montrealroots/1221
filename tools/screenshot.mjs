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

// Walk the creation steps, and say so when one of them does not open. A walk
// that shoots the same page under five names is worse than one that stops:
// the shots look like a full set and the fault is in every one of them.
const stepName = () => page.locator('.creation-step[data-state="active"]').first().innerText();
for (const step of ['03-personal', '04-starting-point', '05-review']) {
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
  await shoot('06-home');

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
