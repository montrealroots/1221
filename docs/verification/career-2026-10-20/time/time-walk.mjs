/**
 * The time area's screens on the built app (brief 19, D1 to D5, 2026-10-20): the stop, the Advance menu at 2 AM, and the
 * Sleep dialog at 7:15 AM and at 11 PM with a commitment the next morning, at a width, each read as the player has it.
 * The saves are `make-saves.ts`'s. Only the top bar's own controls are pressed, the way a player presses them.
 *
 * - `night.json`, Thursday 11:00 PM: the Advance menu; Tomorrow Morning, and On The Way; Advance, and the first stop (a
 *   plan of your own from 11:30 PM to 12:30 AM); Skip It, and where the clock goes; the second stop (2:00 AM); Stand Here;
 *   the Advance menu at 2:00 AM; Tomorrow Morning from there, and where it lands.
 * - `bedtime.json`, Thursday 11:00 PM: the Sleep dialog; then the clock set to Play, the Sleep dialog open for 65 seconds
 *   and the clock read inside it and after; Not Yet; 65 seconds more and the clock read again.
 * - `morning.json`, Saturday 7:15 AM: the Sleep dialog.
 *
 *   SLATE_BASE=http://localhost:4502 node docs/verification/career-2026-10-20/time/time-walk.mjs OUT.txt WIDTH SAVEDIR
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4502';
const [OUT = 'walk.txt', W = '1440', DIR = '.'] = process.argv.slice(2);
const WIDTH = Number(W);
const browser = await chromium.launch(launchOptions());
const view = { width: WIDTH, height: WIDTH < 600 ? 844 : 900 };
const lines = [];
const errors = [];
const clean = (s) => String(s ?? '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const say = (title, text) => { lines.push(`=========== ${title}`, clean(text), ''); };

async function opened(file) {
  const page = await browser.newPage({ viewport: view });
  page.on('pageerror', (e) => errors.push(`${file}: page error: ${String(e).slice(0, 200)}`));
  const text = readFileSync(`${DIR}/${file}`, 'utf8');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /^Continue$/ }).first().click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  return page;
}
const when = async (page) => {
  const bar = await page.getByRole('group', { name: 'Time Controls' }).locator('xpath=..').innerText({ timeout: 2000 }).catch(() => '');
  const head = await page.locator('header, .topbar, body').first().innerText({ timeout: 2000 }).catch(() => '');
  return `${head.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/)?.[0] ?? ''} ${bar.match(/\d{1,2}:\d{2}\s?[AP]M/)?.[0] ?? ''}`;
};
const dialog = (page) => page.locator('[role=dialog]:visible').last();
const dialogText = async (page) => ((await dialog(page).count()) ? dialog(page).innerText() : 'no dialog');
async function menu(page, title) {
  await page.getByRole('button', { name: /^Advance/ }).first().click(); await page.waitForTimeout(400);
  const items = await page.getByRole('menuitem').allInnerTexts();
  say(`${title} (the clock at ${await when(page)})`, items.map((t) => clean(t).replace(/\n/g, ' · ')).join('\n'));
}
async function line(page, name) {
  await page.getByRole('menuitem', { name: new RegExp(`^${name}`) }).first().click(); await page.waitForTimeout(1200);
}
async function pressIn(page, name) {
  const b = dialog(page).getByRole('button', { name: new RegExp(`^${name}$`) }).first();
  if (!(await b.count())) { errors.push(`no ${name} in “${clean(await dialogText(page)).slice(0, 60)}”`); return false; }
  await b.click(); await page.waitForTimeout(1200); return true;
}
const shot = (page, name) => page.screenshot({ path: `${OUT.replace(/\.txt$/, '')}-${name}.png` }).catch(() => {});

// ---- The night's two plans, the stops, and the Advance menu at 2 AM ------------------------------------------------
{
  const page = await opened('night.json');
  await menu(page, 'The Advance menu at 11:00 PM');
  await line(page, 'Tomorrow Morning');
  say(`Tomorrow Morning pressed: the dialog (the clock at ${await when(page)})`, await dialogText(page));
  await shot(page, 'on-the-way');
  await pressIn(page, 'Advance');
  say(`Advance pressed: the first stop (the clock at ${await when(page)})`, await dialogText(page));
  await shot(page, 'stop-plan');
  await pressIn(page, 'Skip It');
  say(`Skip It pressed: the clock at ${await when(page)}, and the dialog`, await dialogText(page));
  await shot(page, 'stop-second');
  await pressIn(page, 'Stand Here');
  say(`Stand Here pressed: the clock at ${await when(page)}`, await dialogText(page));
  await menu(page, 'The Advance menu at 2:00 AM');
  await shot(page, 'advance-2am');
  await line(page, 'Tomorrow Morning');
  const asked = await dialogText(page);
  say(`Tomorrow Morning pressed at 2:00 AM (the clock at ${await when(page)})`, asked);
  if (/On The Way/.test(asked)) { await pressIn(page, 'Advance'); say(`Advance pressed: the clock at ${await when(page)}, and the dialog`, await dialogText(page)); }
  await page.close();
}

// ---- The Sleep dialog at 11 PM, and whether it holds the clock -----------------------------------------------------
{
  const page = await opened('bedtime.json');
  await page.getByRole('button', { name: /^Sleep$/ }).first().click(); await page.waitForTimeout(700);
  say(`The Sleep dialog at ${await when(page)}`, await dialogText(page));
  await shot(page, 'sleep-11pm');
  await pressIn(page, 'Not Yet');
  await page.getByRole('button', { name: /^Play$/ }).first().click(); await page.waitForTimeout(500);
  const before = await when(page);
  await page.getByRole('button', { name: /^Sleep$/ }).first().click(); await page.waitForTimeout(65_000);
  const inside = (await dialogText(page)).match(/NOW\s*\n?\s*(\d{1,2}:\d{2} [AP]M)/i)?.[1] ?? '?';
  const during = await when(page);
  await pressIn(page, 'Not Yet');
  const closed = await when(page);
  await page.waitForTimeout(65_000);
  const after = await when(page);
  say('The live clock and the Sleep dialog', [
    `Play pressed; the clock at ${before}.`,
    `The Sleep dialog open for 65 seconds: its Now reads ${inside}, the top bar ${during}.`,
    `Not Yet pressed: the clock at ${closed}.`,
    `65 seconds after: the clock at ${after}.`,
  ].join('\n'));
  await page.close();
}

// ---- The Sleep dialog at 7:15 AM, up from a night ------------------------------------------------------------------
{
  const page = await opened('morning.json');
  await page.getByRole('button', { name: /^Sleep$/ }).first().click(); await page.waitForTimeout(700);
  say(`The Sleep dialog at ${await when(page)}`, await dialogText(page));
  await shot(page, 'sleep-715am');
  await page.close();
}

writeFileSync(OUT, `${lines.join('\n')}\n${errors.length ? `ERRORS\n${errors.join('\n')}\n` : ''}`);
console.log(`${OUT}: ${lines.length} lines, ${errors.length} errors`);
for (const e of errors) console.log(`  ${e}`);
await browser.close();
