// SLATE — every visible paragraph on every page of the built app, measured (from 2026-10-20, the owner's brief 16,
// sections 7 and 10: "Before editing, record a reproducible baseline of … dense recommendation blocks … tutorial
// instructions that are difficult to follow"). The walk is the one brief 15's captures took: a new game from startup
// through creation and the guide's chapters to its first Home, How This Works from a panel, the calendar and the slots;
// then a save a year in, Home, and every tab of the Player Profile, School, Money and Papers, and the calendar. On each
// page it reads each paragraph, list item and definition a player can see (a closed disclosure's inside isn't seen) and
// counts its sentences and words; `--summarize` says, page by page, the paragraphs of four sentences or more.
//   SLATE_BASE=http://localhost:4261 node tools/screen-text.mjs OUT.json SAVE.json
//   node tools/screen-text.mjs --summarize BEFORE.json AFTER.json
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from './browser.mjs';

/** Sentences as voices.ts counts them: a stop, then a capital or an opening quote or bracket. */
const sentences = (t) => t.split(/(?<=[.!?”])\s+(?=[A-Z“"(])/).filter((x) => /[a-z]/i.test(x)).length;
const words = (t) => (t.match(/\S+/g) ?? []).length;

if (process.argv[2] === '--summarize') {
  const [before, after] = process.argv.slice(3).map((f) => JSON.parse(readFileSync(f, 'utf8')));
  const dense = (run) => run.pages.flatMap((p) => p.blocks.filter((b) => b.sentences >= 4).map((b) => ({ page: p.label, ...b })));
  const line = (run) => { const d = dense(run); return { pages: run.pages.length, blocks: run.pages.reduce((a, p) => a + p.blocks.length, 0), fourOrMore: d.length, fiveOrMore: d.filter((b) => b.sentences >= 5).length, longest: Math.max(0, ...d.map((b) => b.words)) }; };
  const out = { before: line(before), ...(after ? { after: line(after) } : {}), byPage: {} };
  for (const run of [['before', before], ['after', after]].filter(([, r]) => r)) for (const b of dense(run[1])) {
    (out.byPage[b.page] ??= { before: [], after: [] })[run[0]].push({ sentences: b.sentences, words: b.words, text: b.text.slice(0, 160) });
  }
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4261';
const [OUT, SAVE] = process.argv.slice(2);
const W = 1440, H = 900;
const browser = await chromium.launch(launchOptions());
const problems = [];
const pages = [];

function watch(page) {
  page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
}
async function read(page, label) {
  const blocks = await page.evaluate(() => {
    const seen = (el) => { if (el.closest('details:not([open])') && !el.closest('summary')) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    // The innermost: a paragraph inside a list item is read once, as the paragraph.
    return [...document.querySelectorAll('p, li, dd, .callout')].filter((el) => !el.querySelector('p, li, dd') && seen(el)).map((el) => ({ tag: el.tagName.toLowerCase(), text: el.innerText.replace(/\s+/g, ' ').trim() })).filter((b) => b.text);
  });
  pages.push({ label, blocks: blocks.map((b) => ({ ...b, sentences: sentences(b.text), words: words(b.text) })) });
  console.log(`${String(pages.length).padStart(2, '0')} ${label}: ${blocks.length} blocks`);
}
const click = async (page, re) => {
  const b = page.getByRole('button', { name: re }).first();
  if (!(await b.count())) { problems.push(`nothing matched ${re}`); return false; }
  try { await b.click({ timeout: 4000 }); return true; } catch { problems.push(`could not click ${re}`); return false; }
};

// ---- A new game ------------------------------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage(); watch(page);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^New Save$/ }).first().waitFor({ timeout: 20000 }); await page.waitForTimeout(400);
  await click(page, /^New Save$/); await page.waitForTimeout(1200);
  const billed = page.getByRole('group', { name: 'Billed As' });
  if (await billed.count()) { await billed.getByRole('button', { name: 'Actress' }).click().catch(() => {}); await page.waitForTimeout(400); }
  const race = page.getByRole('group', { name: 'Race Or Ethnicity' });
  if (await race.count()) { await race.getByRole('button').first().click().catch(() => {}); await page.waitForTimeout(300); }
  await page.locator('#born-search').fill('New York').catch(() => {}); await page.waitForTimeout(800);
  await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click().catch(() => problems.push('no town chosen')); await page.waitForTimeout(600);
  // A citizenship, asked from brief 27 (2026-10-24); until brief 27's final runs this read stopped at step 1 for want of one.
  await page.getByRole('button', { name: /^Same As Your Place Of Birth: / }).first().click().catch(() => problems.push('no citizenship chosen')); await page.waitForTimeout(400);
  await read(page, 'Creation, Step 1');
  for (let s = 2; s <= 5; s++) {
    if (!(await click(page, /^Continue$/))) break;
    await page.waitForTimeout(1100);
    await read(page, `Creation, Step ${s}`);
  }
  if (await click(page, /^Begin$/)) {
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }).catch(() => {}); await page.waitForTimeout(3000);
    for (let ch = 0; ch < 20; ch++) {
      const dlg = page.getByRole('dialog').first();
      if (!(await dlg.isVisible().catch(() => false))) break;
      const head = ((await dlg.innerText().catch(() => '')).match(/CHAPTER (\d+) OF (\d+)\s*\n\s*([^\n]+)/i) || []);
      if (!head[1]) { problems.push('a guide chapter without its heading'); break; }
      await read(page, `Guide, Chapter ${head[1]} Of ${head[2]}, ${head[3]}`);
      const done = dlg.getByRole('button', { name: /^I.ve Read It$/ }).first();
      if (await done.count()) { await done.click().catch(() => {}); await page.waitForTimeout(1000); }
      if (head[1] === head[2]) break;
      const next = dlg.getByRole('button', { name: /^Next: / }).first();
      if (!(await next.count())) { problems.push(`no Next after chapter ${head[1]}`); break; }
      await next.click().catch(() => {}); await page.waitForTimeout(900);
    }
    if (await page.getByRole('dialog').first().isVisible().catch(() => false)) { await page.keyboard.press('Escape'); await page.waitForTimeout(600); }
    await read(page, 'Home, The First Day');
    if (await click(page, /^How This Works/)) { await page.waitForTimeout(1000); await read(page, 'How This Works, From A Panel'); await page.keyboard.press('Escape'); await page.waitForTimeout(500); }
    if (await click(page, /^Open Calendar$/)) { await page.waitForTimeout(1700); await read(page, 'Calendar, The First Day'); }
  }
  await ctx.close();
}

// ---- A save a year in --------------------------------------------------------------------------------------------
if (SAVE) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage(); watch(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(SAVE, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await page.waitForTimeout(4000);
  await read(page, 'Home, A Year In');
  const rail = (await page.locator('#rail').getByRole('button').allInnerTexts().catch(() => [])).map((x) => x.split('\n')[0].trim());
  for (const dest of rail.filter((x) => ['Player Profile', 'School', 'Money', 'Papers'].includes(x))) {
    await page.locator('#rail').getByRole('button', { name: new RegExp(`^${dest}`) }).first().click().catch(() => problems.push(`could not open ${dest}`)); await page.waitForTimeout(1000);
    const tabs = (await page.getByRole('tab').allInnerTexts().catch(() => [])).map((x) => x.split('\n')[0].trim()).filter(Boolean);
    const first = tabs.length ? (await page.getByRole('tab', { selected: true }).first().innerText().catch(() => '')).split('\n')[0].trim() : '';
    await read(page, first ? `${dest}, ${first}` : dest);
    for (const t of tabs) {
      const tb = page.getByRole('tab', { name: new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first();
      if (await tb.getAttribute('aria-selected') === 'true') continue;
      await tb.click().catch(() => problems.push(`could not open ${dest}: ${t}`)); await page.waitForTimeout(800);
      await read(page, `${dest}, ${t}`);
    }
  }
  await ctx.close();
}
writeFileSync(OUT, `${JSON.stringify({ base: BASE, problems, pages }, null, 1)}\n`);
console.log(`${pages.length} pages; problems: ${problems.length ? problems.join(' | ') : 'none'}`);
await browser.close();
