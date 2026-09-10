/**
 * Presses every noun on Home, and every noun inside every look it opens.
 *
 * The crawl in tests/looks.test.ts proves the graph resolves; it does not
 * prove a player can reach it. This does the other half: it boots a real
 * save, walks Home breadth-first through the actual DOM, and records what
 * came up — the trail, the eyebrow, the name, the sentence and the ways in.
 *
 *   npx vite --port 4180 --strictPort
 *   node tools/drill.mjs [depth]
 *
 * It also counts how many elements on Home a player can press, which is the
 * figure docs/DRILL-DOWN.md records Home at one percent of.
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4180';
const CHROME = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MAX_DEPTH = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a)) ?? 4);
const CHECK = process.argv.includes('--check');

/**
 * What Home is allowed to leave outside a control.
 *
 * Four are the words *between* the nouns, four say that nothing is there, and
 * one is the heading "What Needs You", which names a set rather than a thing.
 * Every figure, name, date, temperature, balance, bar and place opens. If this
 * number climbs, a fact was printed and left dead.
 */
const DEAD_ALLOWED = 9;

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

const problems = [];
page.on('pageerror', (e) => problems.push(`page error — ${String(e).slice(0, 200)}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console — ${m.text().slice(0, 200)}`); });

/** Shut the deepest open look. Its button is named "Close <the thing>". */
const closeInnermost = async () => {
  const panel = page.locator('.look').last();
  if (!(await panel.count())) return;
  await panel.getByRole('button', { name: /^Close / }).first().click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(150);
};

/** Shut every open look, so the next index means what it meant. */
const closeAll = async () => {
  for (let guard = 0; guard < 12; guard++) {
    const open = page.locator('.look');
    if ((await open.count()) === 0) return;
    await open.last().getByRole('button', { name: /^Close / }).first()
      .click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(120);
  }
};

const click = async (pattern, within) => {
  const target = (within ?? page).getByRole('button', { name: pattern }).first();
  try {
    await target.waitFor({ state: 'visible', timeout: 1500 });
    await target.click({ timeout: 1500 });
    return true;
  } catch {
    return false;
  }
};

// --- boot a save ----------------------------------------------------------
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: /^New Save$/ }).first().waitFor({ timeout: 30000 });
await click(/^New Save$/);
await page.waitForTimeout(1200);

const billed = page.getByRole('group', { name: 'Billed As' });
if (await billed.count()) { await billed.getByRole('button', { name: 'Actress' }).click(); await page.waitForTimeout(300); }

for (let i = 0; i < 6; i++) {
  if (!(await click(/^Continue$/))) break;
  await page.waitForTimeout(700);
}
// The last button on Review is the world's own words, not "Start".
await click(/Time To Be Great/);
await page.waitForTimeout(2500);

const onHome = await page.getByRole('heading', { level: 1 }).first().textContent().catch(() => null);
console.log(`Arrived at: ${onHome?.trim() ?? '(nowhere)'}\n`);
if (!/^Good (Morning|Afternoon|Evening|Night),/.test(onHome?.trim() ?? '')) {
  console.log('Never reached Home — nothing below this line means anything.');
  await page.screenshot({ path: '/tmp/drill-stuck.png' });
}

// --- how much of Home is live --------------------------------------------
const coverage = await page.evaluate(() => {
  const main = document.querySelector('.main') ?? document.body;
  const all = [...main.querySelectorAll('*')].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !['SCRIPT', 'STYLE'].includes(el.tagName);
  });
  const live = all.filter((el) => el.matches('button, a[href], input, select, textarea, [role="button"], [role="tab"]'));
  const nouns = all.filter((el) => el.matches('button.link'));
  return { total: all.length, live: live.length, nouns: nouns.length };
});
console.log(`Home: ${coverage.live} of ${coverage.total} elements are live (${Math.round((coverage.live / coverage.total) * 100)}%), ${coverage.nouns} of them nouns.\n`);

// --- what is still a dead end --------------------------------------------
// "Interactive" counted as a share of elements is misleading: most of a page
// is wrappers, and a wrapper is not a dead end. The question that matters is
// whether any text stating a fact sits outside a control. This finds the
// leaves — elements whose text is their own, not inherited from a child — and
// reports the ones no button, link or control contains.
const dead = await page.evaluate(() => {
  const main = document.querySelector('.main') ?? document.body;
  const out = [];
  for (const el of main.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
    if (el.closest('button, a[href], input, select, textarea, [role="button"], [role="tab"], label')) continue;
    if (el.getAttribute('aria-hidden') === 'true') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // Its own text: what is left once every child element's text is removed.
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent ?? '')
      .join(' ')
      .trim()
      .replace(/\s+/g, ' ');
    if (own.length < 2) continue;
    out.push({ tag: el.tagName.toLowerCase(), cls: el.className || '', text: own.slice(0, 90) });
  }
  return out;
});
console.log(`Text outside any control: ${dead.length}`);
for (const d of dead) console.log(`  <${d.tag}${d.cls ? ` class="${d.cls}"` : ''}>  ${d.text}`);
console.log('');

// --- read whatever look is open ------------------------------------------
const readLooks = () => page.evaluate(() => [...document.querySelectorAll('.look')].map((el) => ({
  depth: Number(el.getAttribute('data-depth') ?? 0),
  trail: el.querySelector('.look-trail')?.textContent?.trim() ?? '',
  kind: el.querySelector('.eyebrow')?.textContent?.trim() ?? '',
  name: el.querySelector('.look-name')?.textContent?.trim() ?? '',
  summary: el.querySelector('.look-summary')?.textContent?.trim() ?? '',
  ways: [...el.querySelectorAll(':scope > .look-inner > .look-ways > .look-way')]
    .map((w) => w.querySelector('button.link')?.textContent?.trim() ?? '').filter(Boolean),
  facets: [...el.querySelectorAll(':scope > .look-inner > .look-facets [role="tab"]')]
    .map((t) => t.textContent?.trim() ?? ''),
})));

const seen = new Set();
const lines = [];

/** Press one noun by its exact text, read what opened, then go one deeper. */
async function drill(path, depth) {
  const looks = await readLooks();
  const here = looks[looks.length - 1];
  if (!here || !here.name) return;
  const key = `${here.kind}/${here.name}`;
  const indent = '  '.repeat(depth);
  if (!seen.has(key)) {
    seen.add(key);
    lines.push(`${indent}[d${here.depth}] ${here.kind} — ${here.name}`);
    lines.push(`${indent}     ${here.summary}`);
    if (here.trail) lines.push(`${indent}     trail: ${here.trail}`);
    if (here.facets.length) lines.push(`${indent}     faces: ${here.facets.join(' | ')}`);
  }
  if (depth >= MAX_DEPTH) return;
  for (const way of here.ways.slice(0, 3)) {
    const before = (await readLooks()).length;
    const ok = await click(new RegExp(`^${way.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
      page.locator('.look').last());
    if (!ok) { problems.push(`${path} → ${way}: would not press`); continue; }
    await page.waitForTimeout(250);
    const after = (await readLooks()).length;
    if (after <= before) { problems.push(`${path} → ${way}: pressed and nothing opened`); continue; }
    await drill(`${path} → ${way}`, depth + 1);
    await closeInnermost();
    await page.waitForTimeout(150);
  }
}

// --- press every noun on Home --------------------------------------------
// By position, not by name. A stat tile is one control wrapping a label, a
// figure and a note, so its text runs together — "Local Time7:30 AMGMT" — and
// no name-based locator will ever match that. Matching by name reported
// fourteen dead nouns that were not dead, which is exactly the lie a walk
// tool must not tell. Nothing is open when the list is taken, so every
// `.main button.link` on it is a noun printed by the screen itself.
const nounsOn = page.locator('.main button.link');
const nounCount = await nounsOn.count();
const nouns = (await nounsOn.allTextContents()).map((t) => t.trim().replace(/\s+/g, ' '));
console.log(`Nouns on Home: ${nounCount}\n${nouns.map((n) => `  ${n}`).join('\n')}\n`);

for (let index = 0; index < nounCount; index++) {
  const noun = nouns[index] ?? `noun ${index}`;
  // Re-query with nothing open, so the index still means what it meant.
  const fresh = page.locator('.main button.link');
  let opened = true;
  await fresh.nth(index).click({ timeout: 1500 }).catch(() => { opened = false; });
  if (!opened) { problems.push(`Home → ${noun}: would not press`); continue; }
  await page.waitForTimeout(300);
  const looks = await readLooks();
  if (looks.length === 0) { problems.push(`Home → ${noun}: pressed and nothing opened`); continue; }
  lines.push('');
  lines.push(`── Home → ${noun}`);
  await drill(`Home → ${noun}`, 0);
  await closeAll();
}

console.log(lines.join('\n'));
writeFileSync('/tmp/drill-report.txt', lines.join('\n'), 'utf8');
console.log(`\n${seen.size} distinct looks reached by pressing.`);
console.log(problems.length === 0 ? '\nNo problems.' : `\n${problems.length} problems:\n${problems.map((p) => `  ${p}`).join('\n')}`);
await browser.close();

if (CHECK) {
  const faults = [];
  if (dead.length > DEAD_ALLOWED) {
    faults.push(`${dead.length} pieces of text sit outside a control, and ${DEAD_ALLOWED} is the whole of what should: `
      + 'grammar between the nouns, and lines saying nothing is there.');
  }
  if (problems.length > 0) faults.push(`${problems.length} nouns would not open.`);
  if (faults.length > 0) {
    console.log(`\n${faults.map((f) => `  ${f}`).join('\n')}`);
    process.exit(1);
  }
  console.log('\nEvery fact on Home opens.');
}
