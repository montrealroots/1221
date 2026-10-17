/**
 * The health area's narrow-screen check (brief 14, 2026-10-17): each save opened on the built app at 390 wide, Home and
 * Papers' Health Cover read for anything wider than the screen (a control or a line pushed past the edge) and the
 * longest paragraph, with a screenshot of each kept in OUT. It opens and reads only; nothing is pressed that commits.
 *
 *   SLATE_BASE=http://localhost:4207 node docs/verification/language-2026-10-17/health/overflow-390.mjs OUT SAVEDIR [save.json ...]
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [OUT = 'overflow', DIR = '', ...ONLY] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const saves = (ONLY.length ? ONLY : readdirSync(DIR).filter((f) => f.endsWith('.json'))).sort();
const browser = await chromium.launch(launchOptions());
const measure = (page) => page.evaluate(() => {
  const W = document.documentElement.clientWidth;
  const wide = [...document.querySelectorAll('main *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > W + 1 || r.left < -1); })
    .filter((el) => !el.closest('[style*="overflow"], table, pre, .scroll, [data-scroll]'))
    .slice(0, 8).map((el) => `${el.tagName.toLowerCase()} ${(el.textContent ?? '').trim().slice(0, 60)}`);
  const paras = [...document.querySelectorAll('main p, main li, main div')].map((el) => (el.childElementCount === 0 ? (el.textContent ?? '').trim() : '')).filter(Boolean);
  const longest = paras.reduce((a, b) => (b.split(/\s+/).length > a.split(/\s+/).length ? b : a), '');
  return { pageWider: document.documentElement.scrollWidth > W + 1, wide, longestWords: longest.split(/\s+/).length, longest: longest.slice(0, 120) };
});
for (const save of saves) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(`${DIR}/${save}`, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await page.waitForTimeout(3500);
  const name = save.replace(/\.json$/, '');
  console.log(`${name} Home`, JSON.stringify(await measure(page)));
  await page.screenshot({ path: `${OUT}/${name}-home-390.png`, fullPage: true });
  // Papers by the rail, as a player reaches it on a phone: the menu, then Papers.
  await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click().catch(() => {}); await page.waitForTimeout(400);
  await page.locator('#rail').getByRole('button', { name: /^Papers/ }).first().click({ timeout: 8000 }); await page.waitForTimeout(2000);
  const tab = page.getByRole('tab', { name: /^Health Cover$/ }).first();
  if (await tab.count()) { await tab.click(); await page.waitForTimeout(1500); }
  console.log(`${name} Papers, Health Cover`, JSON.stringify(await measure(page)));
  await page.screenshot({ path: `${OUT}/${name}-papers-health-390.png`, fullPage: true });
  await page.close();
}
await browser.close();
