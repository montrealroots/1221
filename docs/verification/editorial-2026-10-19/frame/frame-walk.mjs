/**
 * The frame's own screens on the built app, read as a player reads them (brief 15, 2026-10-19): what the text walk
 * (`tools/text-walk.mjs`) doesn't reach. Brief 14's walk (`../../language-2026-10-17/frame/frame-walk.mjs`), taken
 * further: the startup sequence over three slots set up in the browser's own store (a save from this version, the
 * same save marked as a newer version's, and one marked as an older version's), the slots and Delete Slot 1? (then Keep
 * It), creation step by step from an empty slot to Review (closed there, so nothing is begun), and, once a life is
 * continued, Home, the Advance menu, On The Way for a week, the Sleep dialog and the Calendar screen. Each dialog is
 * closed by its own Cancel, Keep It or Not Yet: nothing that commits is pressed but Continue.
 *
 *   SLATE_BASE=http://localhost:4281 node docs/verification/editorial-2026-10-19/frame/frame-walk.mjs OUT.json WIDTH SAVE.json
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4281';
const [OUT = 'frame-walk.json', W = '1440', SAVE = ''] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
const wait = (ms) => page.waitForTimeout(ms);
const out = [];
const text = () => page.evaluate(() => ({
  text: (document.body.innerText ?? '').replace(/\n{3,}/g, '\n\n').trim(),
  dialogs: [...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText.trim()).filter(Boolean),
  labels: [...new Set([...document.querySelectorAll('[aria-label], [alt], [title]')].map((el) => el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title')).filter(Boolean))],
  buttons: [...new Set([...document.querySelectorAll('button, [role=button], a[href]')].map((el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean))],
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}));
const record = async (screen) => { try { out.push({ screen, ...(await text()) }); } catch (e) { out.push({ screen, failed: String(e).slice(0, 200) }); } };
const shot = (name) => page.screenshot({ path: `${OUT.replace(/\.json$/, '')}-${name}.png`, fullPage: false }).catch(() => {});

const current = readFileSync(SAVE, 'utf8');
const version = Number(/"schemaVersion":(\d+)/.exec(current)?.[1] ?? 0);
const as = (v, slot) => current.replace(/"schemaVersion":\d+/, `"schemaVersion":${v}`).replace(/"slot":\d/, `"slot":${slot}`);
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
}), [['slate.save.1', current], ['slate.save.2', as(version + 1, 2)], ['slate.save.3', as(version - 1, 3)]]);

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
if (await page.getByText('Before You Continue').count()) {
  await record('Startup, Before You Continue');
  await shot('startup-warnings');
  await page.locator('.startup').getByRole('button', { name: /^Continue$/ }).first().click().catch(() => {});
  await wait(1500);
}
await record('Save Slots');
await shot('slots');

// Delete Slot 1?, then Keep It.
await page.getByRole('button', { name: /^Delete$/ }).first().click().catch(() => {}); await wait(500);
await record('Save Slots, Delete Slot 1?');
await shot('delete');
await page.getByRole('button', { name: /^Keep It$/ }).first().click().catch(() => {}); await wait(400);

// Slot 2, saved by a newer version: Continue refuses it, in words.
await page.getByRole('button', { name: /^Continue$/ }).nth(1).click().catch(() => {}); await wait(1500);
await record('Save Slots, a newer version’s save opened');

// Creation, from New Save on an empty slot. Every slot above holds a save, so a second page with the store cleared reads
// it, in a browser context of its own, closed at Review so nothing is begun.
const fresh = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
await fresh.goto(BASE, { waitUntil: 'networkidle' });
await fresh.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('slate'); r.onsuccess = r.onerror = r.onblocked = () => res(undefined); }));
await fresh.evaluate(() => { try { localStorage.clear(); } catch { /* none */ } });
await fresh.reload({ waitUntil: 'networkidle' }); await fresh.waitForTimeout(2500);
const freshRecord = async (screen) => { try { out.push({ screen, ...(await fresh.evaluate(() => ({ text: (document.body.innerText ?? '').replace(/\n{3,}/g, '\n\n').trim(), overflow: document.documentElement.scrollWidth > window.innerWidth + 1 }))) }); } catch (e) { out.push({ screen, failed: String(e).slice(0, 200) }); } };
await fresh.getByRole('button', { name: /^New Save$/ }).first().click().catch(() => {}); await fresh.waitForTimeout(1200);
await fresh.locator('#first').fill('Ada').catch(() => {});
await fresh.locator('#last').fill('Cole').catch(() => {});
// She/Her settles Billed As, and a birthplace is picked if the form has none: Continue waits for both.
await fresh.locator('#pronouns').selectOption('she/her').catch(() => {});
await fresh.locator('#born-search').fill('New York').catch(() => {});
await fresh.waitForTimeout(800);
await fresh.locator('.picker-results [role=option]').first().click().catch(() => {});
await fresh.waitForTimeout(300);
for (const step of ['Identity', 'Dispositions & Traits', 'Genres & Background', 'Starting Point', 'Review']) {
  await freshRecord(`Creation, ${step}`);
  await fresh.screenshot({ path: `${OUT.replace(/\.json$/, '')}-creation-${step.replace(/\W+/g, '-').toLowerCase()}.png` }).catch(() => {});
  if (step === 'Review') break;
  await fresh.getByRole('button', { name: /^Continue$/ }).first().click().catch(() => {}); await fresh.waitForTimeout(1200);
}
await fresh.close();

// Slot 1 continued: Home, the Advance menu, On The Way, Sleep, the Calendar.
await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }).catch(() => {}); await wait(3500);
await record('Home');
const advance = page.getByRole('button', { name: /^Advance/ }).first();
if (await advance.count()) {
  await advance.click().catch(() => {}); await wait(400); await record('Home, the Advance menu open');
  await page.getByRole('menuitem', { name: /^One Week/ }).first().click().catch(() => {}); await wait(800);
  if (await page.getByRole('dialog', { name: 'On The Way' }).count()) {
    await record('Home, On The Way');
    await shot('on-the-way');
    await page.getByRole('dialog', { name: 'On The Way' }).getByRole('button', { name: /^Cancel$/ }).click().catch(() => {}); await wait(400);
  } else {
    await page.keyboard.press('Escape').catch(() => {}); await wait(300);
  }
}
const sleep = page.getByRole('button', { name: /^Sleep$/ }).first();
if (await sleep.count() && await sleep.isEnabled()) {
  await sleep.click().catch(() => {}); await wait(600); await record('Home, the Sleep dialog');
  await shot('sleep');
  await page.getByRole('button', { name: /^Not Yet$/ }).first().click().catch(() => {}); await wait(300);
}
await page.keyboard.press('c'); await wait(1200);
await record('Calendar');
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(`${OUT}: ${out.length} records`);
await browser.close();
