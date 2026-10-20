/**
 * The health area's walk of the wellbeing looks on the built app (brief 15, 2026-10-19). `tools/text-walk.mjs` reads
 * every screen but opens no look, so this opens the player's own page from Home's How You Are, then each way in it that
 * health writes (the eight measures, Readiness, a long-term condition, an injury), and records each look's text as the
 * page shows it, with a screenshot of the page at the narrow width. It only looks: nothing it presses commits.
 *
 *   SLATE_BASE=http://localhost:4288 node docs/verification/editorial-2026-10-19/health/looks-walk.mjs OUT WIDTH save.json [...]
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [OUT, W, ...SAVES] = process.argv.slice(2);
const WIDTH = Number(W);
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(launchOptions());
const WAYS = ['Energy', 'Stress', 'Sleep Debt', 'Morale', 'Condition', 'Fitness', 'Nourishment', 'Hygiene', 'Readiness', 'An Injury', 'Depression', 'Asthma', 'High Blood Pressure', 'Diabetes', 'Arthritis'];
for (const file of SAVES) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: WIDTH < 600 ? 844 : 900 } });
  const wait = (ms) => page.waitForTimeout(ms);
  const seen = [];
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(file, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3500);
  const own = page.locator('main').getByRole('button', { name: /^How You Are$/ }).first();
  if (!(await own.count())) { seen.push({ look: 'person', failed: 'How You Are opens nothing in this save' }); }
  else {
    await own.click(); await wait(700);
    const top = page.locator('.look').first();
    seen.push({ look: 'person', text: (await top.innerText()).trim() });
    if (WIDTH < 600) await page.screenshot({ path: `${OUT}/${basename(file, '.json')}-person-${WIDTH}.png`, fullPage: false });
    for (const name of WAYS) {
      const way = top.locator('.look-way button, .look-cell button, button.link').filter({ hasText: new RegExp(`^${name}$`) }).first();
      if (!(await way.count())) continue;
      await way.click(); await wait(500);
      const inner = top.locator('.look').first();
      seen.push({ look: name, text: (await inner.count()) ? (await inner.innerText()).trim() : '(nothing opened)' });
      if (WIDTH < 600 && ['Condition', 'Readiness', 'An Injury'].includes(name)) await page.screenshot({ path: `${OUT}/${basename(file, '.json')}-${name.replace(/\s+/g, '-').toLowerCase()}-${WIDTH}.png`, fullPage: false });
      await way.click(); await wait(300);
    }
  }
  writeFileSync(`${OUT}/${basename(file)}`, JSON.stringify(seen, null, 1));
  console.log(`${basename(file)}: ${seen.length} looks`);
  await page.close();
}
await browser.close();
