// Brief 26's journey on the built app (2026-10-24, M10): a new life from the start to Home, the guide read through its
// first five chapters, and what each opens pressed, at a desktop window and on a phone on its side (touch, no hover).
//
//   SLATE_BASE=http://localhost:4173 node docs/verification/sweep-2026-10-24/walk/creation.mjs OUT SIZE
//     SIZE  1440x900 (a desktop window) or 844x390m (a phone on its side)
//
// It writes OUT/<size>/NN-<step>.jpg, the window alone at the window's own pixels, and OUT/<size>/creation.json: each
// step's headings, the clock's state, the lock words on the page, the dialog open, and any page or console error. The
// checks it makes are the guide's own promises: a new life starts paused with everything but the guide shut; I’ve Read
// It opens what the chapter names and nothing more; the next chapter is the only one it takes; Play starts the clock
// once “The Clock” is read; Advance's lines land where they say; a stop at the first commitment offers Go and Stand Here.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [OUT, SIZE = '1440x900'] = process.argv.slice(2);
const phone = SIZE.endsWith('m');
const [W, H] = SIZE.replace(/m$/, '').split('x').map(Number);
const dir = join(OUT, SIZE);
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch(launchOptions());
const ctx = await browser.newContext({ viewport: { width: W, height: H }, screen: { width: W, height: H }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) problems.push(`console: ${m.text().slice(0, 200)}`); });

const steps = [];
const checks = {};
let n = 0;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const wait = (ms) => page.waitForTimeout(ms);
async function press(locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  if (phone) await locator.tap({ timeout: 8000 }); else await locator.click({ timeout: 8000 });
  await wait(600);
}
const state = () => page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[inert], .sr-only'); };
  const dialog = [...document.querySelectorAll('[role=dialog]:not([data-rotate-screen])')].filter(vis).pop();
  const scope = dialog ?? document.querySelector('#main') ?? document.body;
  return {
    headings: [...scope.querySelectorAll('h1, h2, h3')].filter(vis).map((h) => h.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 30),
    dialog: dialog ? (dialog.getAttribute('aria-label') ?? dialog.querySelector('h2, h1')?.textContent?.trim() ?? 'dialog') : null,
    clock: document.querySelector('.topbar-clock strong')?.textContent ?? null,
    running: document.querySelector('.clock-state')?.textContent ?? null,
    timeButton: document.querySelector('[aria-label="Time Controls"] button')?.textContent?.trim() ?? null,
    locked: [...document.querySelectorAll('.lock-word')].filter(vis).map((el) => el.closest('button, section')?.textContent?.replace(/\s+/g, ' ').replace(/Locked$/, '').trim() ?? '').filter(Boolean).slice(0, 20),
    guideStrip: document.querySelector('.guide-strip')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
    rail: [...document.querySelectorAll('nav.rail .rail-item .grow')].map((el) => el.textContent.trim()),
    toasts: [...document.querySelectorAll('.toast')].map((t) => t.textContent.trim()),
    pageWider: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  };
});
async function step(name) {
  n += 1;
  await wait(400);
  const base = `${String(n).padStart(2, '0')}-${slug(name)}`;
  await page.screenshot({ path: join(dir, `${base}.jpg`), type: 'jpeg', quality: 70, scale: 'css' });
  const s = await state();
  steps.push({ n, step: name, file: `${SIZE}/${base}.jpg`, ...s, problems: problems.splice(0) });
  console.log(`${SIZE} ${base}${s.dialog ? ` [${s.dialog}]` : ''}${s.pageWider ? ` wider by ${s.pageWider}` : ''}`);
  return s;
}
const guide = () => page.locator('[role=dialog]').last();
async function readChapter(title) {
  // The chapter shown is the next one; I’ve Read It opens what it names and offers the one after.
  const heading = await guide().locator('h3').first().textContent().catch(() => '');
  const before = await state();
  await press(guide().getByRole('button', { name: /^I’ve Read It$/ }));
  const opened = await step(`${title}, Read`);
  const nextBtn = guide().getByRole('button', { name: /^Next: / }).first();
  const next = (await nextBtn.count()) ? (await nextBtn.textContent()).replace(/^Next: /, '') : null;
  return { heading: heading?.trim(), next, lockedBefore: before.locked, openedList: opened.headings, opened };
}

try {
  await page.goto(BASE, { waitUntil: 'networkidle' }); await wait(1500);
  await step('The Start');
  await press(page.getByRole('button', { name: /^New Save$/ }).first()); await wait(800);
  const billed = page.getByRole('group', { name: 'Billed As' });
  if (await billed.count()) await press(billed.getByRole('button', { name: 'Actress' }));
  await page.locator('#born-search').fill('New York'); await wait(900);
  await press(page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first());
  for (const name of ['Identity', 'Dispositions And Traits', 'Genres And Background', 'Starting Point']) {
    await page.evaluate(() => document.querySelector('.main')?.scrollTo(0, 0));
    await step(`Creation, ${name}`);
    await press(page.getByRole('button', { name: /^Continue$/ }));
  }
  await step('Creation, Review');
  await press(page.getByRole('button', { name: /^Begin$/ }));
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 60000 }); await wait(2500);
  const first = await step('The Guide Opens On Its First Chapter');
  // Play carries the lock word until “The Clock” is read, so the button reads “Play” and then “Locked”.
  checks.startsPaused = first.running === 'Paused' && /^Play/.test(first.timeButton ?? '');
  checks.playLockedAtStart = first.locked.some((l) => /^Play$/.test(l));
  checks.guideOpensFirst = first.dialog !== null && (first.headings.some((h) => /Your Life, Hour By Hour/.test(h)));

  // The first five chapters, each I’ve Read It then Next, and what each opens looked at.
  const read = [];
  read.push(await readChapter('Chapter 1'));
  checks.whereYouAreOpened = !read[0].opened.locked.some((l) => /Where You Are/.test(l));
  for (let k = 2; k <= 5; k += 1) {
    await press(guide().getByRole('button', { name: /^Next: / }).first());
    await step(`Chapter ${k}`);
    read.push(await readChapter(`Chapter ${k}`));
  }
  checks.chaptersInOrder = read.map((r) => r.heading);
  checks.nextOffered = read.map((r) => r.next);
  await press(guide().getByRole('button', { name: /^Try It$/ }).first()); await wait(600);
  const home = await step('Home, Five Chapters Read');
  checks.homeAfterFive = { locked: home.locked, strip: home.guideStrip, rail: home.rail, running: home.running };
  checks.upNextOpen = !home.locked.some((l) => /Up Next/.test(l));
  checks.needsOpen = !home.locked.some((l) => /What Needs You/.test(l));
  checks.howStillLocked = home.locked.some((l) => /How You Are/.test(l));

  // Play starts the clock; Pause stops it, and the state says so.
  const time = page.getByRole('group', { name: 'Time Controls' });
  await press(time.getByRole('button', { name: /^Play$/ }).first()); await wait(2500);
  const playing = await step('Play Pressed');
  await press(time.getByRole('button', { name: /^Pause$/ }).first()); await wait(500);
  const paused = await step('Pause Pressed');
  checks.playAndPause = { playing: playing.running, pausedAgain: paused.running, button: paused.timeButton };

  // Advance's lines, and On The Way or the stop at the first commitment.
  await press(time.getByRole('button', { name: /^Advance/ }).first());
  await step('Advance Menu');
  checks.advanceLines = await page.locator('[role=menu][aria-label="Advance Time"] .menu-item-label').allInnerTexts().catch(() => []);
  await press(page.getByRole('menuitem', { name: /^Tomorrow Morning/ }).first()); await wait(1500);
  const after = await step('Tomorrow Morning Pressed');
  checks.afterAdvance = { dialog: after.dialog, clock: after.clock, toasts: after.toasts };
  if (after.dialog && /On The Way/.test(after.dialog)) {
    await press(page.getByRole('dialog').getByRole('button', { name: /^Advance$/ }).first()); await wait(2500);
    const stopped = await step('The Clock Stopped Or Arrived');
    checks.afterOnTheWay = { dialog: stopped.dialog, clock: stopped.clock, headings: stopped.headings.slice(0, 6) };
    const go = page.getByRole('dialog').getByRole('button', { name: /^Go$/ }).first();
    const stand = page.getByRole('dialog').getByRole('button', { name: /^Stand Here$/ }).first();
    checks.stopOffers = { go: await go.count(), standHere: await stand.count() };
    if (await stand.count()) { await press(stand); await step('Stand Here Pressed'); }
  }
  // What Needs You and Recent Updates, and the Sleep dialog, as the chapters opened them.
  await step('Home At The End');
  const sleep = time.getByRole('button', { name: /^Sleep/ }).first();
  checks.sleepStillLocked = (await sleep.locator('.lock-word').count()) > 0;
  await press(sleep);
  const sleepDialog = await step('Sleep Pressed, Its Chapter Unread');
  checks.sleepOpensGuide = sleepDialog.dialog !== null && sleepDialog.headings.some((h) => /^Sleep$/.test(h));
  await page.keyboard.press('Escape'); await wait(300);
  // Save & Exit, and Continue: the same moment, the chapters kept.
  const toggle = page.locator('.rail-toggle');
  if (await toggle.isVisible().catch(() => false)) await press(toggle);
  await press(page.getByRole('button', { name: 'Save & Exit' }).first()); await wait(2500);
  const slots = await step('Your Saves After Save And Exit');
  await press(page.getByRole('button', { name: /^Continue$/ }).first());
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 60000 }); await wait(2000);
  const again = await step('Home After Continue');
  checks.resumed = { slotsShowName: slots.headings.concat([]).length > 0, clock: again.clock, strip: again.guideStrip, running: again.running, dialog: again.dialog };
} catch (e) {
  problems.push(`walk stopped: ${String(e).slice(0, 300)}`);
}
steps.push({ step: '(problems)', problems: problems.splice(0) });
await browser.close();
writeFileSync(join(dir, 'creation.json'), `${JSON.stringify({ size: SIZE, base: BASE, checks, steps }, null, 1)}\n`);
console.log(JSON.stringify(checks, null, 1));
