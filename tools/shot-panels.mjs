/**
 * Photographs single panels of a played save, each at full size, for an
 * interface change to be looked at panel by panel rather than in one tall
 * page (from 2026-10-02; `tools/screenshot.mjs` shoots whole pages).
 *
 *   SLATE_URL=http://localhost:4173 SHOT_SAVE=<a save's JSON> \\
 *   PANELS='[["Routines",["Your Routines"]]]' [TAB='Health Cover'] node tools/shot-panels.mjs <out dir>
 *
 * Each pair is a Home button to open and the panel titles to shoot there;
 * TAB, where given, opens that tab first. A panel's top 900 pixels are shot.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import { launchOptions } from './browser.mjs';
const BASE = process.env.SLATE_URL; const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 300)));
await page.goto(BASE, { waitUntil: 'networkidle' }); await page.waitForTimeout(3000);
const raw = readFileSync(process.env.SHOT_SAVE, 'utf8');
await page.evaluate((text) => new Promise((resolve, reject) => { const req = indexedDB.open('slate', 1); req.onupgradeneeded = () => { req.result.createObjectStore('saves'); }; req.onerror = () => reject(req.error); req.onsuccess = () => { const tx = req.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(text, 'slate.save.1'); tx.oncomplete = () => resolve(undefined); }; }), raw);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(3000);
await page.getByRole('button', { name: /^continue$/i }).first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(5000);
for (const [nav, titles] of JSON.parse(process.env.PANELS)) {
  const home = page.getByRole('button', { name: /^home$/i }).first(); if (await home.count()) { await home.click().catch(() => {}); await page.waitForTimeout(1500); }
  const b = page.getByRole('button', { name: new RegExp('^' + nav + '$', 'i') }).first();
  if (await b.count()) await b.click().catch(() => {}); else { const t = page.getByText(nav, { exact: true }).first(); if (await t.count()) await t.click().catch(() => {}); else console.log('no nav', nav); }
  await page.waitForTimeout(2000);
  if (process.env.TAB) { const tb = page.getByRole('tab', { name: new RegExp(process.env.TAB, 'i') }).first(); if (await tb.count()) await tb.click().catch(() => {}); else { const tt = page.getByText(process.env.TAB, { exact: true }).first(); if (await tt.count()) await tt.click().catch(() => {}); } await page.waitForTimeout(1500); }
  for (const title of titles) {
    const h = page.getByText(title, { exact: true }).first();
    if (!(await h.count())) { console.log('no panel', title); continue; }
    const panel = h.locator('xpath=ancestor::section[contains(@class,"card")][1]');
    const el = (await panel.count()) ? panel : h;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await page.setViewportSize({ width: 1280, height: 4000 }); await el.scrollIntoViewIfNeeded(); const box = await el.boundingBox(); await page.screenshot({ path: `${OUT}/${title.replace(/[^a-z0-9]+/gi, '-')}.png`, clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 900) } }).then(() => page.setViewportSize({ width: 1280, height: 900 })).catch((e) => console.log('shot fail', title, String(e).slice(0, 100)));
    console.log('shot', title);
  }
}
await browser.close();
