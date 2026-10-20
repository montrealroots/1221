// Opens a save on the built app, goes to the Player Profile's Genres, opens a genre's brief (and a brief of it by title),
// and writes the pane's text as a player reads it. Reads only: Open Its Brief and the brief list change no state.
//   SLATE_BASE=http://localhost:4308 node pane.mjs OUT WIDTH SAVE "Genre Label|Brief Title" ...
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const BASE = process.env.SLATE_BASE ?? 'http://localhost:4308';
const [OUT, W, SAVE, ...WANT] = process.argv.slice(2);
const WIDTH = Number(W); const PHONE = WIDTH < 600;
mkdirSync(`${OUT}/${W}`, { recursive: true });
import { launchOptions } from '../../../../../tools/browser.mjs';
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
const wait = (ms) => page.waitForTimeout(ms);
await page.goto(BASE, { waitUntil: 'networkidle' });
const text = readFileSync(SAVE, 'utf8');
await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3000);
if (PHONE) { await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click().catch(() => {}); await wait(400); }
await page.locator('#rail').getByRole('button', { name: /^Player Profile/ }).first().click(); await wait(1200);
const out = [];
for (const want of WANT) {
  const [genre, title] = want.split('|');
  try {
    await page.fill('#genres-find', genre); await wait(500);
    const row = page.locator('tr', { has: page.locator('td', { hasText: new RegExp(`^${genre}$`) }) }).filter({ has: page.getByRole('button', { name: /Open Its Brief/ }) }).first();
    await row.getByRole('button', { name: /Open Its Brief/ }).click(); await wait(900);
    if (title) { const sel = page.getByLabel('Which Brief'); if (await sel.count()) { await sel.selectOption({ label: title }); await wait(700); } }
    const pane = page.locator('[data-brief]').first();
    const id = await pane.getAttribute('data-brief');
    const t = (await pane.innerText()).replace(/\n{3,}/g, '\n\n').trim();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    writeFileSync(`${OUT}/${W}/${id}.txt`, `${t}\n`);
    out.push({ want, id, chars: t.length, pageOverflowsSideways: overflow });
    await page.getByRole('button', { name: /^Close The Brief$/ }).first().click().catch(() => {}); await wait(400);
  } catch (e) { out.push({ want, failed: String(e).slice(0, 200) }); }
}
writeFileSync(`${OUT}/${W}/panes.json`, `${JSON.stringify(out, null, 1)}\n`);
console.log(JSON.stringify(out));
await browser.close();
