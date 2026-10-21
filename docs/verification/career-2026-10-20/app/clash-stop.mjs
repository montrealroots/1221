/**
 * The stops at two auditions set for the same hour (brief 19, the app part's walk on `a43b4f8f`, 2026-10-21): from
 * `audition.json`, where Hester Vane in Hudson and Ivy in Brooklyn are both at 11 AM on June 5, 2029, the keyboard
 * presses Advance and This Evening, Advance on On The Way, and Go at the first stop, then reads what comes next and the
 * Opportunities tab. It presses Go, which commits, so it runs on a page of its own and writes nothing but its output.
 * Until `a43b4f8f` she was judged at both; since, the one gone to first stands and the other is missed with where she
 * was, and this reads whether the clock stops at the second, as On The Way says it will.
 *
 *   node docs/verification/career-2026-10-20/app/clash-stop.mjs BASE SAVEDIR > OUT.txt
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const [BASE = 'http://localhost:4187', DIR = '.'] = process.argv.slice(2);
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(BASE, { waitUntil: 'networkidle' });
const text = readFileSync(`${DIR}/audition.json`, 'utf8');
await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
const press = async (l) => { await l.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(600); };
await press(page.getByRole('button', { name: /^Continue$/ }).first());
await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 });
await page.waitForTimeout(1200);
await press(page.locator('.topbar-time').getByRole('button', { name: /^Advance/ }).first());
for (let k = 0; k < 12; k += 1) {
  if ((await page.evaluate(() => document.activeElement?.textContent ?? '')).trim().startsWith('This Evening')) break;
  await page.keyboard.press('Tab');
}
await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
const dialog = async () => { const d = page.locator('[role=dialog]:visible').last(); return (await d.count()) ? d : undefined; };
let d = await dialog();
console.log(`ON THE WAY\n${d ? await d.innerText() : '(none)'}\n`);
if (d) { await press(d.getByRole('button', { name: /^Advance$/ }).first()); await page.waitForTimeout(1800); }
d = await dialog();
console.log(`THE FIRST STOP\n${d ? await d.innerText() : '(none)'}\n`);
if (d) { await press(d.getByRole('button', { name: /^Go$/ }).first()); await page.waitForTimeout(6000); }
d = await dialog();
console.log(`AFTER GO\n${d ? await d.innerText() : `(no stop; the page opens: ${(await page.evaluate(() => document.body.innerText)).slice(0, 60).replace(/\n/g, ' ')})`}\n`);
await page.locator('nav.rail').getByRole('button', { name: /^Career/ }).first().click(); await page.waitForTimeout(1200);
await page.getByRole('tab', { name: 'Opportunities' }).first().click(); await page.waitForTimeout(1000);
const main = await page.locator('main').innerText();
console.log(`OPPORTUNITIES AFTER\n${main.slice(main.indexOf('In Progress'), main.indexOf('Sources And Estimates')).replace(/\n{2,}/g, '\n')}\n`);
console.log(`page errors: ${errors.length ? errors.join('; ') : 'none'}`);
await browser.close();
