/**
 * The cross-area pass's narrow-screen check (brief 14, 2026-10-17), after the health area's overflow-390.mjs: each save
 * opened on the built app at 390 wide, Papers' Health Cover read for anything wider than the screen and for the longest
 * block of text a player sees without opening anything (a closed drill-down's words don't count, which the health
 * area's measure counted), with The Marketplace's own longest block apart and a screenshot of the tab. It opens and
 * reads only; nothing is pressed that commits.
 *
 *   SLATE_BASE=http://localhost:4211 node docs/verification/language-2026-10-17/crossarea/marketplace-390.mjs OUT SAVEDIR [save.json ...]
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [OUT = 'marketplace-390', DIR = '', ...ONLY] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const saves = (ONLY.length ? ONLY : readdirSync(DIR).filter((f) => f.endsWith('.json'))).sort();
const browser = await chromium.launch(launchOptions());
const measure = (page) => page.evaluate(() => {
  const W = document.documentElement.clientWidth;
  // Shown: laid out, and not inside a closed drill-down (Chromium lays out a closed <details>'s content, hidden).
  const seen = (el) => el.getClientRects().length > 0 && !(el.closest('details:not([open])') && !el.closest('summary'));
  const wide = [...document.querySelectorAll('main *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > W + 1 || r.left < -1); })
    .filter((el) => !el.closest('[style*="overflow"], table, pre, .scroll, [data-scroll], [role=tablist]'))
    .slice(0, 8).map((el) => `${el.tagName.toLowerCase()} ${(el.textContent ?? '').trim().slice(0, 60)}`);
  const blocks = (root) => [...root.querySelectorAll('p, li, div')].filter((el) => seen(el) && el.childElementCount === 0).map((el) => (el.textContent ?? '').trim()).filter(Boolean);
  const longest = (list) => list.reduce((a, b) => (b.split(/\s+/).length > a.split(/\s+/).length ? b : a), '');
  const main = document.querySelector('main');
  const card = [...document.querySelectorAll('section.card')].find((s) => s.querySelector('h2, h3')?.textContent?.trim() === 'The Marketplace');
  const all = longest(blocks(main));
  const market = card ? longest(blocks(card)) : '';
  const words = card ? blocks(card).join(' ').split(/\s+/).filter(Boolean).length : 0;
  return { pageWider: document.documentElement.scrollWidth > W + 1, wide, longestWords: all.split(/\s+/).length, longest: all.slice(0, 100), marketplaceLongestWords: market.split(/\s+/).length, marketplaceLongest: market.slice(0, 100), marketplaceShownWords: words };
});
for (const save of saves) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(`${DIR}/${save}`, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await page.waitForTimeout(3500);
  const name = save.replace(/\.json$/, '');
  await page.getByRole('button', { name: /^Menu$/ }).first().click().catch(() => {}); await page.waitForTimeout(400);
  await page.locator('#rail').getByRole('button', { name: /^Papers/ }).first().click({ timeout: 8000 }); await page.waitForTimeout(2000);
  const tab = page.getByRole('tab', { name: /^Health Cover$/ }).first();
  if (await tab.count()) { await tab.click(); await page.waitForTimeout(1500); }
  console.log(`${name} Papers, Health Cover`, JSON.stringify(await measure(page)));
  // The screen scrolls inside main, so the card is shot on its own: The Marketplace as a player first sees it.
  const card = page.locator('section.card', { has: page.getByRole('heading', { name: 'The Marketplace', exact: true }) }).first();
  if (await card.count()) { await card.scrollIntoViewIfNeeded(); await card.screenshot({ path: `${OUT}/${name}-marketplace-390.png` }); }
  await page.close();
}
await browser.close();
