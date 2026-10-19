// Material-A's walk of the practice briefs on the built app: tools/text-walk.mjs never presses Open Its Brief, so the
// brief pane isn't in its record. This opens a save, goes to the Player Profile, opens each named genre's brief and
// records the pane's text as a player reads it, with a screenshot of the pane. It presses nothing that commits.
//
//   SLATE_BASE=http://localhost:4289 node brief-walk.mjs OUT WIDTH SAVE.json Label[,Label...]
import { chromium } from '/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-material-a/node_modules/playwright/index.mjs';
import { launchOptions } from '/tmp/claude-0/-home-user-1221/ae4b55a6-159b-5760-be37-d57f1bd5bd30/scratchpad/e15-material-a/tools/browser.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4289';
const [OUT, W, SAVE, LABELS] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
const wait = (ms) => page.waitForTimeout(ms);
const out = [];
await page.goto(BASE, { waitUntil: 'networkidle' });
const text = readFileSync(SAVE, 'utf8');
await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3500);
if (PHONE) { await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click().catch(() => {}); await wait(400); }
await page.locator('#rail').getByRole('button', { name: /^Player Profile/ }).first().click(); await wait(1500);
for (const label of LABELS.split(',')) {
  try {
    await page.locator('#genres-show').selectOption('All');
    await page.locator('#genres-find').fill(label); await wait(400);
    const row = page.locator('tr').filter({ has: page.locator('td').first().filter({ hasText: new RegExp(`^${label}(, Loved)?$`) }) }).first();
    await row.getByRole('button', { name: 'Open Its Brief' }).click(); await wait(900);
    const pane = page.locator('[data-brief]').first();
    const id = await pane.getAttribute('data-brief');
    const body = (await pane.innerText()).replace(/\n{3,}/g, '\n\n').trim();
    const file = `${OUT}/${id}-${WIDTH}.png`;
    await pane.screenshot({ path: file }).catch(() => {});
    // Wider than the screen at this width: a pushed or clipped control.
    const overflow = await pane.evaluate((el) => [...el.querySelectorAll('*')].filter((x) => !x.closest('.table-scroll') && x.getBoundingClientRect().right > window.innerWidth + 1).map((x) => `${x.tagName.toLowerCase()}${x.className ? `.${String(x.className).split(' ')[0]}` : ''}: ${(x.textContent ?? '').trim().slice(0, 60)}`).slice(0, 12));
    out.push({ label, id, width: WIDTH, text: body, overflow, screenshot: file });
    await page.getByRole('button', { name: 'Close The Brief' }).click(); await wait(400);
  } catch (e) {
    out.push({ label, width: WIDTH, failed: String(e).slice(0, 300) });
  }
}
writeFileSync(`${OUT}/briefs-${WIDTH}.json`, `${JSON.stringify(out, null, 1)}\n`);
console.log(out.map((x) => `${x.label}: ${x.failed ? `FAILED ${x.failed}` : `${x.id}, ${x.text.length} chars, ${x.overflow.length} overflowing`}`).join('\n'));
await browser.close();
