/**
 * Brief 17, section 9, the tutorial area (2026-10-20): every How This Works entry read on the built app, word for word,
 * as follow.mjs reads every chapter. On a scenario save with everything open, each of the 70 entries is found by its
 * title, opened, and Show Everything pressed; then each thing the entry says (its summary's paragraphs, Where To Find It,
 * When You Can Use It, each step, need, figure, change, reading, refusal, mistake, next step, each connection's reason
 * and its worked example) is looked for in the dialog's text. Each entry's text is kept, one file an entry, in OUT.
 *
 *   SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/continuity-2026-10-20/tutorial/entries-read.mjs -- OUT SAVEDIR [WIDTH]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GUIDE } from '../../../../src/engine/content/guide/index.ts';

const { chromium } = await import('playwright');
const argv = process.argv.slice(2).filter((a) => a !== '--');
const OUT = argv[0] ?? 'entries-read-out';
const SAVES = argv[1];
const W = Number(argv[2] ?? 1440);
const BASE = process.env.SLATE_BASE ?? 'http://localhost:4301';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: W, height: W < 600 ? 844 : 900 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
const wait = (ms) => page.waitForTimeout(ms);
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').replace(/[‘’]/g, '’').trim();
const lines = [];
const results = [];
const log = (m) => { lines.push(m); console.log(m); };

await page.goto(BASE, { waitUntil: 'networkidle' });
const save = readFileSync(join(SAVES, 'brief.json'), 'utf8');
await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), save);
await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3500);
for (let i = 0; i < 4 && await page.locator('[role=dialog]').count(); i++) { await page.keyboard.press('Escape'); await wait(300); }
const pause = page.locator('.topbar-time').getByRole('button', { name: /^Pause$/ }).first();
if (await pause.count()) { await pause.click(); await wait(300); }
const dialog = () => page.locator('[role=dialog]').last();

/** What an entry says, piece by piece, as the help draws it. */
const said = (e) => [
  ...e.short.split(/\n\n+/), `${e.where.label}.`, e.available,
  ...e.steps, ...e.needs, ...e.costs.map((f) => f.value), ...e.now, ...e.later, ...e.interpret,
  ...e.connections.map((c) => c.why), ...e.next, ...e.unavailable, ...e.mistakes, ...e.reads.map((f) => f.value),
  e.example.setup, ...e.example.steps, e.example.result,
];
let read = 0;
for (const e of GUIDE) {
  for (let i = 0; i < 4 && await page.locator('[role=dialog]').count(); i++) { await page.keyboard.press('Escape'); await wait(300); }
  await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
  await page.keyboard.press('/'); await wait(300);
  await page.locator('#help-q').fill(e.title); await page.keyboard.press('Enter'); await wait(300);
  const link = dialog().locator('.help-results button.help-link').filter({ hasText: new RegExp(`^${e.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first();
  if (!(await link.count())) { results.push({ id: e.id, ok: false, missing: ['not found by its title'] }); log(`FAIL ${e.id}: not found by its title`); continue; }
  await link.click(); await wait(300);
  await dialog().getByRole('button', { name: 'Show Everything', exact: true }).first().click().catch(() => {}); await wait(300);
  const text = norm(await dialog().locator('.help-entry').first().innerText().catch(() => ''));
  writeFileSync(join(OUT, `${e.id}.txt`), `${text}\n`);
  const missing = said(e).map(norm).filter((x) => x && !text.includes(x));
  results.push({ id: e.id, ok: missing.length === 0, pieces: said(e).length, missing: missing.map((m) => m.slice(0, 160)) });
  if (missing.length) log(`FAIL ${e.id}: ${missing.length} of ${said(e).length} not on the page: ${missing.map((m) => m.slice(0, 80)).join(' | ')}`);
  else { read += 1; log(`ok   ${e.id}: all ${said(e).length} pieces on the page, word for word`); }
}
log(`${read} of ${GUIDE.length} entries read on the built app word for word; page errors: ${problems.length}`);
writeFileSync(join(OUT, 'log.txt'), `${lines.join('\n')}\n`);
writeFileSync(join(OUT, 'results.json'), `${JSON.stringify({ base: BASE, width: W, problems, results }, null, 1)}\n`);
await browser.close();
process.exit(read === GUIDE.length && !problems.length ? 0 : 1);
