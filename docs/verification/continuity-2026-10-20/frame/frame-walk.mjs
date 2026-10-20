/**
 * The frame's screens on the built app, as a new player meets them (brief 17, 2026-10-20). Brief 15's frame walk
 * (`docs/verification/editorial-2026-10-19/frame/frame-walk.mjs`), taken on to a life begun: the startup sequence over
 * three slots (this version's save, a newer version's, an older's), the slots and Delete Slot 1? (Keep It), a newer
 * save refused; creation from an empty slot step by step, the place picker's empty and no-match states on the way, to
 * Review, then Begin with Guide Me Through It and the first Home and the guide as it opens; then slot 1 continued:
 * Home, the Advance menu, On The Way, Next Event's stop dialog (Stand Here), Look After Yourself, Sleep (Not Yet),
 * Skip To Event (Cancel), the Calendar and its plan form (Cancel). Nothing that commits is pressed but Continue, Begin
 * and Advance's Next Event, which stops at a commitment before it runs.
 *
 *   SLATE_BASE=http://localhost:4302 node docs/verification/continuity-2026-10-20/frame/frame-walk.mjs OUT.json WIDTH SAVE.json
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4302';
const [OUT = 'walk17.json', W = '1440', SAVE = ''] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const browser = await chromium.launch(launchOptions());
const view = { width: WIDTH, height: PHONE ? 844 : 900 };
const out = [];
const errors = [];
const grab = (page) => page.evaluate(() => ({
  text: (document.body.innerText ?? '').replace(/\n{3,}/g, '\n\n').trim(),
  dialogs: [...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText.trim()).filter(Boolean),
  labels: [...new Set([...document.querySelectorAll('[aria-label], [alt], [title]')].map((el) => el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title')).filter(Boolean))],
  buttons: [...new Set([...document.querySelectorAll('button, [role=button], [role=menuitem], a[href]')].map((el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean))],
  placeholders: [...new Set([...document.querySelectorAll('[placeholder]')].map((el) => el.getAttribute('placeholder')))],
  overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
}));
const recorder = (page) => async (screen) => { try { out.push({ screen, ...(await grab(page)) }); } catch (e) { out.push({ screen, failed: String(e).slice(0, 200) }); } };
const shot = (page, name) => page.screenshot({ path: `${OUT.replace(/\.json$/, '')}-${name}.png`, fullPage: false }).catch(() => {});
const clickRole = async (page, role, name, opts = {}) => {
  const b = page.getByRole(role, { name }).first();
  if (!(await b.count())) { errors.push(`no ${role} ${name}`); return false; }
  try { await b.click({ timeout: 4000, ...opts }); return true; } catch (e) { errors.push(`could not click ${role} ${name}: ${String(e).slice(0, 100)}`); return false; }
};

const current = readFileSync(SAVE, 'utf8');
const version = Number(/"schemaVersion":(\d+)/.exec(current)?.[1] ?? 0);
const as = (v, slot) => current.replace(/"schemaVersion":\d+/, `"schemaVersion":${v}`).replace(/"slot":\d/, `"slot":${slot}`);

// ---- Startup and the slots -----------------------------------------------------------------------------------------
{
  const page = await browser.newPage({ viewport: view });
  page.on('pageerror', (e) => errors.push(`page error: ${String(e).slice(0, 200)}`));
  const record = recorder(page);
  const wait = (ms) => page.waitForTimeout(ms);
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
  await page.reload({ waitUntil: 'commit' });
  const seen = new Set();
  for (let i = 0; i < 80; i++) {
    const t = await page.evaluate(() => document.body.innerText ?? '').catch(() => '');
    const clean = t.replace(/\s+/g, ' ').trim();
    if (clean && !seen.has(clean)) { seen.add(clean); out.push({ screen: 'Startup', text: t.trim() }); }
    if (/Before You Continue|Startup Stopped|Slot 1/.test(t) && i > 5) break;
    await wait(80);
  }
  await wait(1000);
  if (await page.getByText('Before You Continue').count()) {
    await record('Startup, Before You Continue');
    await shot(page, 'startup-warnings');
    await page.locator('.startup').getByRole('button', { name: /^Continue$/ }).first().click().catch(() => {});
    await wait(1500);
  }
  await record('Save Slots');
  await shot(page, 'slots');
  await clickRole(page, 'button', /^Delete$/); await wait(500);
  await record('Save Slots, Delete Slot 1?');
  await clickRole(page, 'button', /^Keep It$/); await wait(400);
  await page.getByRole('button', { name: /^Continue$/ }).nth(1).click().catch(() => {}); await wait(1500);
  await record('Save Slots, a newer version’s save opened');

  // ---- Slot 1 continued: Home, the time controls, the stop, the calendar ------------------------------------------
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }).catch(() => {}); await wait(3500);
  await record('Home');
  await shot(page, 'home');
  if (PHONE) { /* the bar's controls are on the page at 390 too */ }
  if (await clickRole(page, 'button', /^Advance/)) {
    await wait(400); await record('Advance menu');
    await page.getByRole('menuitem', { name: /^One Week/ }).first().click().catch(() => {}); await wait(800);
    if (await page.getByRole('dialog', { name: 'On The Way' }).count()) {
      await record('On The Way');
      await shot(page, 'on-the-way');
      await page.getByRole('dialog', { name: 'On The Way' }).getByRole('button', { name: /^Cancel$/ }).click().catch(() => {}); await wait(400);
    } else { await page.keyboard.press('Escape').catch(() => {}); await wait(300); }
  }
  if (await clickRole(page, 'button', /^Look After Yourself/)) {
    await wait(400); await record('Look After Yourself menu');
    await page.keyboard.press('Escape').catch(() => {}); await wait(300);
  }
  const sleep = page.getByRole('button', { name: /^Sleep$/ }).first();
  if (await sleep.count() && await sleep.isEnabled()) {
    await sleep.click().catch(() => {}); await wait(600); await record('Sleep dialog');
    await shot(page, 'sleep');
    await clickRole(page, 'button', /^Not Yet$/); await wait(300);
  }
  if (await clickRole(page, 'button', /^Advance/)) {
    await wait(300);
    await page.getByRole('menuitem', { name: /^Choose An Event/ }).first().click().catch(() => {}); await wait(600);
    await record('Skip To Event');
    await shot(page, 'skip');
    await page.getByRole('dialog').getByRole('button', { name: /^Cancel$/ }).first().click().catch(() => {}); await wait(300);
  }
  if (await clickRole(page, 'button', /^Advance/)) {
    await wait(300);
    await page.getByRole('menuitem', { name: /^Next Event/ }).first().click().catch(() => {}); await wait(1200);
    await record('Next Event: the stop');
    await shot(page, 'stop');
    await clickRole(page, 'button', /^Stand Here$/); await wait(400);
    await record('After Stand Here');
  }
  await page.keyboard.press('c'); await wait(1200);
  await record('Calendar');
  await shot(page, 'calendar');
  await page.locator('.cal-day[data-today=true]').first().click().catch(() => {}); await wait(500);
  await record('Calendar, today opened');
  if (await clickRole(page, 'button', /^Put Something On It/)) {
    await wait(500); await record('Calendar, plan form');
    await shot(page, 'plan-form');
    await clickRole(page, 'button', /^Never Mind$/); await wait(300);
  }
  // Tomorrow, the day after today's cell: an entry opened, if there is one.
  const entry = page.locator('.list .list-item').first();
  if (await entry.count()) { await entry.click().catch(() => {}); await wait(500); await record('Calendar, an entry opened'); await page.keyboard.press('Escape').catch(() => {}); await wait(300); }
  await page.close();
}

// ---- Creation, a new life begun -----------------------------------------------------------------------------------
{
  const fresh = await browser.newPage({ viewport: view });
  fresh.on('pageerror', (e) => errors.push(`page error: ${String(e).slice(0, 200)}`));
  const record = recorder(fresh);
  const wait = (ms) => fresh.waitForTimeout(ms);
  await fresh.goto(BASE, { waitUntil: 'networkidle' });
  await fresh.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('slate'); r.onsuccess = r.onerror = r.onblocked = () => res(undefined); }));
  await fresh.evaluate(() => { try { localStorage.clear(); } catch { /* none */ } });
  await fresh.reload({ waitUntil: 'networkidle' }); await wait(2500);
  await record('Save Slots, empty');
  await clickRole(fresh, 'button', /^New Save$/); await wait(1200);
  await record('Creation, Identity, untouched');
  await shot(fresh, 'creation-identity-empty');
  await fresh.locator('#first').fill('Ada').catch(() => {});
  await fresh.locator('#last').fill('Cole').catch(() => {});
  await fresh.locator('#pronouns').selectOption('they/them').catch(() => {}); await wait(300);
  await record('Creation, Identity, They/Them');
  await fresh.locator('#pronouns').selectOption('she/her').catch(() => {});
  await fresh.locator('#born-search').fill('Qqqzx').catch(() => {}); await wait(800);
  await record('Creation, Identity, a search that finds nothing');
  await fresh.locator('#born-search').fill('').catch(() => {});
  await fresh.locator('#born-search').fill('Manchester').catch(() => {}); await wait(900);
  await fresh.locator('.picker-results [role=option]').first().click().catch(() => {}); await wait(400);
  await record('Creation, Identity, filled');
  await shot(fresh, 'creation-identity');
  for (const step of ['Dispositions & Traits', 'Genres & Background', 'Starting Point']) {
    await clickRole(fresh, 'button', /^Continue$/); await wait(1200);
    await record(`Creation, ${step}`);
    await shot(fresh, `creation-${step.replace(/\W+/g, '-').toLowerCase()}`);
    if (step === 'Starting Point') {
      // Before Yale: lived where born, kept an account.
      await fresh.locator('#lived-born').check().catch(() => {}); await wait(500);
      await fresh.locator('#kept-account').check().catch(() => {}); await wait(500);
      await record('Creation, Starting Point, Before Yale with an account kept');
    }
  }
  await clickRole(fresh, 'button', /^Continue$/); await wait(1200);
  await record('Creation, Review');
  await shot(fresh, 'creation-review');
  await clickRole(fresh, 'button', /^Begin$/); await wait(5000);
  await record('First Home, guided');
  await shot(fresh, 'first-home');
  // The guide, if it opened on its own; otherwise from the Guide button.
  if (!(await fresh.getByRole('dialog').count())) { await clickRole(fresh, 'button', /^Guide/); await wait(800); }
  await record('The guide, as it opens');
  await shot(fresh, 'guide');
  await fresh.keyboard.press('Escape').catch(() => {}); await wait(400);
  await record('First Home, guide closed');
  // The time controls on a new, guided life: Locked or not.
  if (await clickRole(fresh, 'button', /^Advance/)) { await wait(400); await record('First Home, Advance pressed'); await fresh.keyboard.press('Escape').catch(() => {}); await wait(300); }
  await fresh.close();
}

writeFileSync(OUT, `${JSON.stringify({ errors, out }, null, 1)}\n`);
console.log(`${OUT}: ${out.length} records, ${errors.length} errors`);
for (const e of errors) console.log(`  ${e}`);
await browser.close();
