/**
 * The frame's own screens on the built app, read as a player reads them (brief 14, 2026-10-17): what the text walk
 * (`tools/text-walk.mjs`) doesn't reach. It opens the app with three slots set up in the browser's own store, one a
 * save from this version, one the same save marked as an older version's, and one that isn't a save at all, and
 * records every text the startup sequence shows on its way to the slots, the slots themselves, and, once a life is
 * continued, the top bar, the rail with its descriptions, a breadcrumb, the Calendar screen and the Advance menu. It
 * presses nothing that commits but Continue.
 *
 *   SLATE_BASE=http://localhost:4201 node docs/verification/language-2026-10-17/frame/frame-walk.mjs OUT.json WIDTH SAVE.json
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4201';
const [OUT = 'frame-walk.json', W = '1440', SAVE = ''] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
const wait = (ms) => page.waitForTimeout(ms);
const out = [];
const text = () => page.evaluate(() => ({
  text: (document.body.innerText ?? '').replace(/\n{3,}/g, '\n\n').trim(),
  labels: [...new Set([...document.querySelectorAll('[aria-label], [alt], [title]')].map((el) => el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title')).filter(Boolean))],
  buttons: [...new Set([...document.querySelectorAll('button, [role=button], a[href]')].map((el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean))],
}));
const record = async (screen) => { try { out.push({ screen, ...(await text()) }); } catch (e) { out.push({ screen, failed: String(e).slice(0, 200) }); } };

const current = readFileSync(SAVE, 'utf8');
const older = current.replace(/"schemaVersion":(\d+)/, (_, v) => `"schemaVersion":${Number(v) - 1}`);
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate((slots) => new Promise((res, rej) => {
  const r = indexedDB.open('slate', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('saves');
  r.onerror = () => rej(r.error);
  r.onsuccess = () => {
    const tx = r.result.transaction('saves', 'readwrite');
    for (const [key, value] of slots) tx.objectStore('saves').put(value, key);
    tx.oncomplete = () => res(undefined);
  };
}), [['slate.save.1', current], ['slate.save.2', older], ['slate.save.3', 'this is not a save']]);

// The startup sequence, every distinct text it shows on its way to the slots.
await page.reload({ waitUntil: 'commit' });
const seen = new Set();
for (let i = 0; i < 60; i++) {
  const t = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
  const clean = t.replace(/\s+/g, ' ').trim();
  if (clean && !seen.has(clean)) { seen.add(clean); out.push({ screen: 'Startup', text: t.trim() }); }
  if (/Before You Continue|Startup Stopped|Slot 1/.test(t) && i > 5) break;
  await wait(100);
}
await wait(1000);
// A slot that needs a word stops the sequence at Before You Continue, with its own Continue.
if (await page.getByText('Before You Continue').count()) {
  await record('Startup, Before You Continue');
  await page.locator('.startup').getByRole('button', { name: /^Continue$/ }).first().click().catch(() => {});
  await wait(1500);
}
await record('Save Slots');
// A damaged save's own words, behind its disclosure.
const disclosure = page.getByText(/What’s Wrong With It/).first();
if (await disclosure.count()) { await disclosure.click().catch(() => {}); await wait(300); await record('Save Slots, What’s Wrong With It opened'); }

await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3500);
await record('Home');
if (PHONE) { await page.getByRole('button', { name: /^Menu$/ }).first().click().catch(() => {}); await wait(400); await record('Home, the menu open'); await page.keyboard.press('Escape').catch(() => {}); await wait(300); }
const advance = page.getByRole('button', { name: /^Advance/ }).first();
if (await advance.count()) { await advance.click().catch(() => {}); await wait(400); await record('Home, the Advance menu open'); await page.keyboard.press('Escape').catch(() => {}); await wait(300); }
await page.keyboard.press('c'); await wait(1200);
await record('Calendar');
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(`${OUT}: ${out.length} records`);
await browser.close();
