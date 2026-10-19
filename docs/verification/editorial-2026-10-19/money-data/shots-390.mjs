/**
 * Money's tabs at 390 wide on one scenario save, photographed whole, with anything that runs past the screen's edge
 * listed (money-data, brief 15, end of area). The text walk records words, not where they land, so this is the look
 * common.md asks for: a text wall, wrapping, clipping, a button pushed past the edge.
 *
 *   SLATE_BASE=http://localhost:4286 node shots-390.mjs <save.json> <out dir>
 *
 * It opens the save, goes to Money from the menu, and shoots the screen and each tab. It presses nothing that commits.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [SAVE, OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const wait = (ms) => page.waitForTimeout(ms);
await page.goto(BASE, { waitUntil: 'networkidle' });
const text = readFileSync(SAVE, 'utf8');
await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3500);
await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click().catch(() => {}); await wait(400);
await page.locator('#rail').getByRole('button', { name: /^Money/ }).first().click(); await wait(1200);

/** What sticks out past 390 pixels, or scrolls sideways inside itself, with its first words. */
const overflow = () => page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('main *')) {
    const r = el.getBoundingClientRect();
    if (!r.width || getComputedStyle(el).visibility === 'hidden') continue;
    const words = (el.innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (r.right > window.innerWidth + 1) out.push({ tag: el.tagName, right: Math.round(r.right), words });
    else if (el.scrollWidth > el.clientWidth + 1 && ['visible', 'hidden', 'clip'].includes(getComputedStyle(el).overflowX) && el.children.length === 0) out.push({ tag: el.tagName, clipped: el.scrollWidth - el.clientWidth, words });
  }
  return { pageScrollsSideways: document.documentElement.scrollWidth > window.innerWidth, items: out.slice(0, 20) };
});

const found = [];
const shoot = async (tab) => {
  const name = `${basename(SAVE, '.json')}-money-${(tab || 'accounts').toLowerCase().replace(/\W+/g, '-')}.png`;
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: true });
  found.push({ tab: tab || '(first)', shot: name, ...(await overflow()) });
};
await shoot('');
const tabs = (await page.getByRole('tab').allInnerTexts()).map((x) => x.split('\n')[0].trim()).filter(Boolean);
for (const t of tabs) {
  const tb = page.getByRole('tab', { name: new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first();
  if (await tb.getAttribute('aria-selected') === 'true') continue;
  await tb.click(); await wait(700);
  await shoot(t);
}
writeFileSync(`${OUT}/${basename(SAVE, '.json')}-overflow.json`, `${JSON.stringify(found, null, 1)}\n`);
console.log(JSON.stringify(found.map((f) => ({ tab: f.tab, sideways: f.pageScrollsSideways, n: f.items.length }))));
await browser.close();
