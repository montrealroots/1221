/**
 * The cohesion walk.
 *
 * Plays the game the way a person meets it: startup, the save slots, character
 * creation, Home, every destination in the rail and every tab behind each
 * one, the phone and all four apps, Go Anywhere with a sentence typed in, a
 * scene played through its choices, the calendar's plan form, the help panel,
 * then Save & Exit and back in through the slot it was saved to. On every
 * screen it looks for the things that break the thread:
 *
 *   - a page error or a console error
 *   - an error screen, or the shell saying a workspace does not exist
 *   - text that leaks the machine: undefined, NaN, [object Object], null, an
 *     Invalid Date, a double space, a space before a full stop
 *   - a heading with nothing in it
 *   - the rail not marking the screen you are on after a navigation
 *   - a locked destination that does not say so
 *   - a scene with no choice and no way out
 *   - a save that does not come back as the same life
 *
 *   SLATE_URL=http://localhost:5186 npx vite-node tools/cohesion-walk.mjs
 *
 * It reports per screen and exits 1 when anything was found. Screenshots of
 * every screen land in cohesion-walk/ unless SLATE_WALK_SHOTS=0.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4173';
const OUT = process.env.SLATE_WALK_OUT ?? 'cohesion-walk';
const SHOTS = process.env.SLATE_WALK_SHOTS !== '0';
const FIRST = 'Alexandria';
mkdirSync(OUT, { recursive: true });

const LEAKS = [
  [/\bundefined\b/, 'undefined'], [/\bNaN\b/, 'NaN'], [/\[object Object\]/, '[object Object]'],
  [/(^|[\s(])null\b/, 'null'], [/\bInvalid Date\b/, 'Invalid Date'],
  [/[A-Za-z,] {2}[A-Za-z]/, 'a double space'], [/[A-Za-z] [.,;:](\s|$)/, 'a space before punctuation'],
  [/\$-?\d+(\.\d+)?e[+-]?\d+/i, 'money in scientific notation'],
];
const BENIGN_CONSOLE = /favicon|Failed to load resource.*404|ResizeObserver loop/i;

const findings = [];
const note = (screen, kind, detail) => {
  if (findings.some((f) => f.screen === screen && f.kind === kind && f.detail === detail)) return;
  findings.push({ screen, kind, detail });
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
let current = 'startup';
page.on('pageerror', (e) => note(current, 'page error', String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error' && !BENIGN_CONSOLE.test(m.text())) note(current, 'console error', m.text().slice(0, 300)); });

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'screen';
const settle = (ms = 800) => page.waitForTimeout(ms);
async function dismissCoachMark() {
  const gotIt = page.getByRole('button', { name: /^got it$/i }).first();
  if (await gotIt.count()) { await gotIt.click({ timeout: 3000 }).catch(() => {}); await settle(300); }
}

/** What a screen shows, in the ways a person would notice something wrong. */
async function inspect(screen) {
  current = screen;
  const facts = await page.evaluate(() => {
    const body = document.body.innerText ?? '';
    const heading = document.querySelector('main h1, main h2, .workspace h1, .workspace h2, .screen h1, h1')?.textContent?.trim() ?? '';
    const active = document.querySelector('.rail [aria-current="page"]');
    const rail = (active?.querySelector('.grow') ?? active)?.textContent?.trim() ?? '';
    const emptyHeadings = [...document.querySelectorAll('h1, h2, h3')].filter((h) => !(h.textContent ?? '').trim() && !h.querySelector('svg, img')).length;
    const toasts = [...document.querySelectorAll('.toast')].map((t) => t.textContent?.trim() ?? '');
    const boundary = /Something went wrong|Something Went Wrong|has crashed|An error occurred/i.test(body);
    const missing = /(doesn’t|does(n’t| not)) exist\. Use Go Anywhere/.test(body);
    return { body, heading, rail, emptyHeadings, toasts, boundary, missing };
  });
  for (const [re, label] of LEAKS) {
    const m = facts.body.match(re);
    if (m) note(screen, 'leak', `${label}: "…${facts.body.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ')}…"`);
  }
  if (facts.emptyHeadings) note(screen, 'empty heading', `${facts.emptyHeadings} heading(s) with no text`);
  if (facts.boundary) note(screen, 'error screen', 'the page shows an error screen');
  if (facts.missing) note(screen, 'missing route', 'the shell says this workspace does not exist');
  if (SHOTS) await page.screenshot({ path: `${OUT}/${slug(screen)}.png` }).catch(() => {});
  return facts;
}

let screens = 0;
const seen = async (screen) => { screens += 1; return inspect(screen); };

// --- Startup, and the three slots -------------------------------------------
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await settle(900);
await seen('00-startup');
await settle(3200);
await seen('01-save-slots');
const slotCount = await page.getByRole('button', { name: /empty slot|new save|new game|create/i }).count();
if (slotCount !== 3) note('01-save-slots', 'slots', `expected three empty slots, found ${slotCount}`);

// --- Creation, end to end -------------------------------------------------------
await page.getByRole('button', { name: /empty slot|new save|new game|start|create/i }).first().click({ timeout: 3000 }).catch(() => {});
await settle(1000);
for (const [label, value] of [[/first name/i, FIRST], [/last name/i, 'Castellanos']]) {
  const f = page.getByLabel(label).first();
  if (await f.count()) await f.fill(value).catch(() => {});
}
await seen('02-creation-identity');
for (const step of ['03-creation-personal', '04-creation-career', '05-creation-starting-point', '06-creation-review']) {
  const next = page.getByRole('button', { name: /^(next|continue)/i }).first();
  if (!(await next.count())) { note(step, 'flow', 'no Next button to reach this step'); break; }
  await next.click({ timeout: 3000 }).catch(() => {});
  await settle(800);
  if (step === '03-creation-personal') {
    for (const t of ['Night Owl', 'Holds Grudges', 'Disciplined', 'Generous']) {
      const b = page.locator('button.trait').filter({ hasText: new RegExp(`^${t}`) }).first();
      if (await b.count()) await b.click({ timeout: 3000 }).catch(() => {});
    }
  }
  if (step === '04-creation-career') {
    const nf = page.getByLabel(/what it is called|what it’s called/i).first();
    if (await nf.count()) await nf.fill('Castellanos Pictures').catch(() => {});
  }
  const facts = await seen(step);
  if (step === '06-creation-review' && !facts.body.includes(FIRST)) note(step, 'flow', 'the review does not show the name typed on the first step');
}
const begin = page.getByRole('button', { name: /it.s time to be great|begin|start save/i }).first();
if (!(await begin.count())) note('06-creation-review', 'flow', 'no way to begin the life from the review');
await begin.click({ timeout: 3000 }).catch(() => {});
await settle(3800);
await dismissCoachMark();
const guidedOff = page.getByRole('button', { name: /turn guided mode off/i }).first();
if (await guidedOff.count()) { await guidedOff.click({ timeout: 3000 }).catch(() => {}); await settle(400); }
const home = await seen('07-home');
if (!home.body.includes(FIRST)) note('07-home', 'flow', 'Home does not greet the character that was just made');
if (!/^Home/.test(home.rail)) note('07-home', 'rail', `the rail marks "${home.rail}" rather than Home`);

// --- Every destination in the rail, and every tab behind it -------------------
const items = await page.evaluate(() => [...document.querySelectorAll('.rail .rail-item')].map((el) => ({
  label: (el.querySelector('.grow')?.textContent ?? el.textContent ?? '').trim(),
  locked: Boolean(el.querySelector('.rail-lock')),
})));
if (items.length < 20) note('rail', 'rail', `only ${items.length} destinations in the rail`);
for (const item of items) {
  if (!item.label || item.label === 'Home') continue;
  const link = page.locator('.rail .rail-item', { hasText: new RegExp(`^${item.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first();
  if (!(await link.count())) { note(item.label, 'rail', 'no rail entry'); continue; }
  await link.click({ timeout: 3000 }).catch(() => {});
  await settle(900);
  await dismissCoachMark();
  const s = slug(item.label);
  const facts = await seen(s);
  if (item.locked) {
    if (!facts.toasts.some((t) => /under construction|locked/i.test(t))) note(s, 'locked', 'a locked destination did not say why it would not open');
    continue;
  }
  if (!facts.rail.startsWith(item.label)) note(s, 'rail', `after opening ${item.label} the rail marks "${facts.rail}"`);
  if (!facts.heading) note(s, 'heading', 'no heading on the workspace');
  const tabCount = await page.locator('.tab').count();
  for (let i = 1; i < Math.min(tabCount, 14); i++) {
    const tab = page.locator('.tab').nth(i);
    const tabName = ((await tab.textContent().catch(() => '')) || `tab${i}`).trim();
    await tab.click({ timeout: 4000 }).catch(() => {});
    await settle(450);
    await dismissCoachMark();
    await seen(`${s}--${slug(tabName)}`);
  }
}

// --- The phone, and all four apps ---------------------------------------------
const phone = page.locator('.rail .rail-item', { hasText: /^Phone/ }).first();
if (await phone.count()) {
  await phone.click({ timeout: 3000 }).catch(() => {});
  await settle(900);
  await dismissCoachMark();
  for (const app of ['YouTube', 'X', 'Instagram', 'TikTok']) {
    const icon = page.locator(`button.ph-app[aria-label="${app}"]`).first();
    if (!(await icon.count())) { note('phone', 'phone', `no ${app} on the home screen`); continue; }
    await icon.click({ timeout: 3000 }).catch(() => {});
    await settle(900);
    await seen(`phone-${slug(app)}`);
    // The app's own bar, not the handset's home bar under it.
    const bar = page.locator('.ph-screen [class*="-bar"]:not(.ph-home-bar) button:not([aria-label="Close The App"])');
    const n = Math.min(await bar.count(), 6);
    for (let i = 0; i < n; i++) {
      const label = (await bar.nth(i).getAttribute('aria-label').catch(() => null)) ?? (await bar.nth(i).textContent().catch(() => '')) ?? `tab${i}`;
      await bar.nth(i).click({ timeout: 3000 }).catch(() => {});
      await settle(500);
      await seen(`phone-${slug(app)}--${slug(label.trim() || `tab${i}`)}`);
    }
    // The handset's home bar has to be reachable under whatever the app put
    // at the bottom of its screen, or there is no way out of the app.
    const covered = await page.evaluate(() => {
      const pill = document.querySelector('button[aria-label="Close The App"]');
      if (!pill) return 'missing';
      pill.scrollIntoView({ block: 'center' });
      const box = pill.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return hit === pill || pill.contains(hit) ? '' : `${hit?.tagName.toLowerCase()}.${String(hit?.className ?? '').split(' ')[0]}`;
    });
    if (covered === 'missing') note(`phone-${slug(app)}`, 'phone', 'no way to close the app');
    else if (covered) note(`phone-${slug(app)}`, 'phone', `the handset's home bar is covered by ${covered}`);
    const close = page.locator('button[aria-label="Close The App"]').first();
    if (await close.count()) { await close.click({ timeout: 3000, force: Boolean(covered) }).catch(() => {}); await settle(500); }
  }
}

// --- Go Anywhere, with a sentence, into a scene -------------------------------
const search = page.getByRole('button', { name: /go anywhere/i }).first();
if (await search.count()) {
  await search.click({ timeout: 3000 }).catch(() => {});
  await settle(600);
  await page.keyboard.type('work out at the gym');
  await settle(800);
  const asked = await seen('go-anywhere-ask');
  const results = page.locator('.search-results button, .search-results [role="option"], .search-result');
  const options = await results.count();
  if (options === 0) note('go-anywhere-ask', 'ask', 'a plain sentence produced no result at all');
  else await results.first().click({ timeout: 3000 }).catch(() => {});
  await settle(800);
  // A plan is a proposal until it is run: the box says what it will do and
  // waits for the row to be opened again. Enter opens the highlighted row.
  for (let round = 0; round < 3 && (await page.locator('.search-panel').count()) && (await results.count()); round++) {
    await seen(`ask-proposal-${round + 1}`);
    await results.first().click({ timeout: 3000 }).catch(() => {});
    await settle(1200);
  }
  await settle(600);
  await dismissCoachMark();
  await seen('after-ask');
  void asked;
  if (await page.locator('.search-panel').count()) {
    note('after-ask', 'ask', 'the sentence did not resolve to anything, and the dialog stayed open');
    await page.keyboard.press('Escape');
    await settle(400);
  }
  // The ask lands on the gym's door in The City, where Work Out opens the scene.
  const workOut = page.getByRole('button', { name: /^work out$/i }).first();
  if (await workOut.count()) { await workOut.click({ timeout: 3000 }).catch(() => {}); await settle(1000); await seen('scene-opened'); }
  else note('after-ask', 'flow', 'arriving at the gym did not offer Work Out');
  if (!(await page.locator('.scene-choices button').count())) note('scene-opened', 'scene', 'Work Out did not open a scene with choices');
  // A scene, if one opened: play it through its choices, then leave.
  for (let turn = 0; turn < 8; turn++) {
    const choices = page.locator('.scene-choices button');
    const n = await choices.count();
    if (n === 0) break;
    const labels = await choices.allTextContents();
    const pick = labels.findIndex((l) => !/leave it|skip to the end/i.test(l));
    if (pick === -1) {
      if (turn === 0) note('scene', 'scene', 'a scene opened with nothing to choose but leaving');
      break;
    }
    await choices.nth(pick).click({ timeout: 3000 }).catch(() => {});
    await settle(700);
    await seen(`scene-turn-${turn + 1}`);
  }
  const leave = page.getByRole('button', { name: /^leave( it)?$/i }).first();
  if (await leave.count()) { await leave.click({ timeout: 3000 }).catch(() => {}); await settle(600); await seen('scene-left'); }
}

// --- The calendar's plan form, and the help panel -----------------------------
const calendar = page.locator('.rail .rail-item', { hasText: /^Calendar/ }).first();
if (await calendar.count()) {
  await calendar.click({ timeout: 3000 }).catch(() => {});
  await settle(800);
  await page.locator('.cal-day[data-today="true"]').first().click({ timeout: 3000 }).catch(() => {});
  await settle(500);
  const plan = page.getByRole('button', { name: /plan something/i }).first();
  if (await plan.count()) {
    await plan.click({ timeout: 3000 }).catch(() => {});
    await settle(600);
    await seen('calendar-plan-form');
    const neverMind = page.getByRole('button', { name: /never mind/i }).first();
    if (await neverMind.count()) await neverMind.click({ timeout: 3000 }).catch(() => {});
    else await page.keyboard.press('Escape');
    await settle(400);
    if (await page.getByRole('button', { name: /never mind/i }).count()) note('calendar-plan-form', 'flow', 'the plan form did not close');
  } else note('calendar', 'flow', 'no Plan Something on the calendar');
}
const help = page.getByRole('button', { name: /^help$|^\?$/i }).first();
if (await help.count()) {
  await help.click({ timeout: 3000 }).catch(() => {});
  await settle(800);
  await seen('help');
  await page.keyboard.press('Escape');
  await settle(400);
}

// --- Save, leave, and come back as the same life ----------------------------------
const exit = page.getByRole('button', { name: /save & exit|save and exit/i }).first();
if (await exit.count()) {
  await exit.click({ timeout: 3000 }).catch(() => {});
  await settle(2500);
  const back = await seen('save-slots-after-exit');
  if (!back.body.includes(FIRST)) note('save-slots-after-exit', 'save', 'the slot does not show the life that was just saved to it');
  const resume = page.getByRole('button', { name: new RegExp(`${FIRST}|continue|resume`, 'i') }).first();
  if (await resume.count()) {
    await resume.click({ timeout: 3000 }).catch(() => {});
    await settle(3500);
    await dismissCoachMark();
    const again = await seen('home-resumed');
    if (!again.body.includes(FIRST)) note('home-resumed', 'save', 'the life did not come back with its name');
  } else note('save-slots-after-exit', 'save', 'no way to resume the saved life');
} else note('shell', 'flow', 'no Save & Exit in the bar');

await browser.close();

// --- The report -------------------------------------------------------------------
console.log(`\n${screens} screens walked.`);
if (findings.length === 0) {
  console.log('Nothing broke the thread: no errors, no leaks, every handoff landed.');
  process.exit(0);
}
const byKind = new Map();
for (const f of findings) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
console.log(`${findings.length} finding(s):`);
for (const [kind, n] of [...byKind].sort((a, b) => b[1] - a[1])) console.log(`  ${kind}: ${n}`);
console.log('');
for (const f of findings) console.log(`  [${f.kind}] ${f.screen}: ${f.detail}`);
process.exit(1);
