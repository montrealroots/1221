/**
 * The cohesion walk.
 *
 * Plays the game the way a person meets it: startup, the save slots, character
 * creation end to end, Home, every destination the rail lists and every tab
 * behind each one, the calendar's plan form, then Save & Exit and back in
 * through the slot it was saved to. On every screen it looks for the things
 * that break the thread:
 *
 *   - a page error or a console error
 *   - an error screen, or the shell saying a workspace does not exist
 *   - text that leaks the machine: undefined, NaN, [object Object], null, an
 *     Invalid Date, a double space, a space before a full stop
 *   - a heading with nothing in it
 *   - the rail not marking the screen you are on after a navigation
 *   - a locked destination that does not say so
 *   - a save that does not come back as the same life
 *
 *   SLATE_URL=http://localhost:5186 npx vite-node tools/cohesion-walk.mjs
 *
 * It reports per screen and exits 1 when anything was found. Screenshots of
 * every screen land in cohesion-walk/ unless SLATE_WALK_SHOTS=0.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { launchOptions } from './browser.mjs';

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

const browser = await chromium.launch(launchOptions());
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
    // The guide's dialog: since brief 20 a locked entry opens its chapter there rather than toasting.
    const guide = Boolean(document.querySelector('[role=dialog][aria-label="Guide"]'));
    return { body, heading, rail, emptyHeadings, toasts, boundary, missing, guide };
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
// They/them is the default and settles no title, so Identity will not advance
// until a word is picked. A walk that does not pick never leaves the first
// step, and then reports the screens it never reached as broken.
const billed = page.getByRole('button', { name: /^(actor|actress)$/i }).first();
if (await billed.count()) { await billed.click({ timeout: 3000 }).catch(() => {}); await settle(300); }
else note('02-creation-identity', 'flow', 'Identity does not offer a billing to answer');
// Identity also asks where the character was born (brief 20's picker): a walk that
// types nothing stays on the first step, as this one did until 2026-10-24.
const born = page.locator('#born-search').first();
if (await born.count()) {
  await born.fill('New York').catch(() => {}); await settle(900);
  await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click({ timeout: 3000 }).catch(() => {});
  await settle(300);
}
await seen('02-creation-identity');

const stepName = () => page.locator('.creation-step[data-state="active"]').first().innerText().catch(() => '');
for (const step of ['03-creation-dispositions-and-traits', '04-creation-genres-and-background', '05-creation-starting-point', '06-creation-review']) {
  const before = await stepName();
  const next = page.getByRole('button', { name: /^(next|continue)/i }).first();
  if (!(await next.count())) { note(step, 'flow', 'no Next button to reach this step'); break; }
  await next.click({ timeout: 3000 }).catch(() => {});
  await settle(800);
  // A step that would not open is the finding. Walking on regardless turns one
  // fault into five.
  if ((await stepName()) === before) {
    const why = (await page.locator('.callout-warning').allInnerTexts()).join(' ').trim();
    note(step, 'flow', `the step would not open${why ? `: ${why}` : ', and Continue would not press'}`);
    break;
  }
  const facts = await seen(step);
  if (step === '06-creation-review' && !facts.body.includes(FIRST)) note(step, 'flow', 'the review does not show the name typed on the first step');
}
const begin = page.getByRole('button', { name: /^begin$|start save/i }).first();
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
  locked: Boolean(el.querySelector('.rail-lock')) || /^Locked/.test(el.getAttribute('title') ?? ''),
})));
// The rail had eighteen destinations before the first cleanup, and after the
// revamp it has Home alone: the calendar is a section of Home rather than a
// place to go. A hard number here was a standing false finding, so the walk
// asks only that every entry the rail does list opens.
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
    if (!facts.guide && !facts.toasts.some((t) => /under construction|locked/i.test(t))) note(s, 'locked', 'a locked destination did not say why it would not open');
    if (facts.guide) { await page.keyboard.press('Escape'); await settle(300); }
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

// --- The calendar's plan form -------------------------------------------------
const calendar = page.locator('.rail .rail-item', { hasText: /^Calendar/ }).first();
if (await calendar.count()) {
  await calendar.click({ timeout: 3000 }).catch(() => {});
  await settle(800);
  await page.locator('.cal-day[data-today="true"]').first().click({ timeout: 3000 }).catch(() => {});
  await settle(500);
  const plan = page.getByRole('button', { name: /put something on it/i }).first();
  if (await plan.count()) {
    await plan.click({ timeout: 3000 }).catch(() => {});
    await settle(600);
    await seen('calendar-plan-form');
    const neverMind = page.getByRole('button', { name: /never mind/i }).first();
    if (await neverMind.count()) await neverMind.click({ timeout: 3000 }).catch(() => {});
    else await page.keyboard.press('Escape');
    await settle(400);
    if (await page.getByRole('button', { name: /never mind/i }).count()) note('calendar-plan-form', 'flow', 'the plan form did not close');
  } else note('calendar', 'flow', 'no way to put something on the day');
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
