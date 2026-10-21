/**
 * The agent's screens on the built app (brief 19, G1, G6, G7 and V7, 2026-10-21), at a width, each read as the player has
 * it. The saves are `make-saves.ts`'s. Only the screen's own controls are pressed, the way a player presses them.
 *
 * - `unread.json`: Career from the menu, the tabs by the arrow keys to Representation; his panel with the notice; I've
 *   Read This; the panel after it, the notice behind Read The Notice Again, opened.
 * - `offered.json`: Representation; Show The Reasons; Why It Went This Way and The Agreement read.
 * - `meeting.json`: Representation and The Meeting; Advance, This Evening, and what On The Way says; Advance; the stop at
 *   the meeting and its choices; Ask To Move; where the clock went, and The Meeting again.
 *
 * At each screen: no page error, no horizontal scroll, and every button with an accessible name.
 *
 *   SLATE_BASE=http://localhost:4182 node docs/verification/career-2026-10-20/agent/agent-walk.mjs OUT.txt WIDTH SAVEDIR
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4182';
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
/** What every screen is held to: no horizontal scroll, and no button without a name. */
async function held(page, where) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 1) errors.push(`${where}: the page scrolls ${over}px sideways at ${WIDTH}`);
  const nameless = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => !(b.getAttribute('aria-label') || b.textContent || '').trim()).length);
  if (nameless) errors.push(`${where}: ${nameless} buttons with no name`);
}
/** Career from the menu (on a phone, behind the menu button), then its tabs by the keyboard to Representation. */
async function toRepresentation(page) {
  const rail = page.getByRole('link', { name: /^Career/ }).or(page.getByRole('button', { name: /^Career/ })).first();
  if (!(await rail.isVisible().catch(() => false))) {
    const menu = page.getByRole('button', { name: /^(Menu|Open The Menu|Open Menu)$/ }).first();
    if (await menu.count()) { await menu.click(); await page.waitForTimeout(400); }
  }
  await page.getByRole('link', { name: /^Career/ }).or(page.getByRole('button', { name: /^Career/ })).first().click();
  await page.waitForTimeout(800);
  const overview = page.getByRole('tab', { name: 'Overview' });
  await overview.click(); await overview.focus();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(500);
  const selected = await page.getByRole('tab', { selected: true }).innerText();
  if (selected !== 'Representation') errors.push(`the arrow keys reached ${selected}, not Representation`);
  const focused = await page.evaluate(() => document.activeElement?.textContent ?? '');
  if (focused !== 'Representation') errors.push(`the focus is on ${focused}, not the Representation tab`);
}
const pane = (page) => page.locator('#career-pane-representation');
/** A picture of the screen as it stands, beside the text: OUT's name with what it shows. */
const shot = (page, name) => page.screenshot({ path: OUT.replace(/\.txt$/, `-${name}.png`), fullPage: false });
const panel = (page, title) => page.locator('section.card', { has: page.getByRole('heading', { name: title, exact: true }) }).first();

// ---- G1: the notice where he first appears ---------------------------------------------------------------------------
{
  const page = await opened('unread.json');
  await toRepresentation(page);
  say('Representation, his panel never opened', await pane(page).innerText());
  await shot(page, 'notice');
  const note = await page.getByRole('note').count();
  if (note !== 1) errors.push(`the notice stood ${note} times above the panel, not once`);
  await held(page, 'unread');
  await page.getByRole('button', { name: 'I’ve Read This' }).click(); await page.waitForTimeout(800);
  if (await page.getByRole('note').count()) errors.push('the notice still stands above the panel after I’ve Read This');
  await page.getByText('Read The Notice Again', { exact: true }).click(); await page.waitForTimeout(300);
  say('After I’ve Read This, Read The Notice Again opened', await pane(page).innerText());
  await held(page, 'read');
  await page.close();
}

// ---- G6 and G7: Why It Went This Way, and the agreement in full ------------------------------------------------------
{
  const page = await opened('offered.json');
  await toRepresentation(page);
  await page.getByRole('button', { name: 'Show The Reasons' }).click(); await page.waitForTimeout(500);
  if ((await page.getByRole('button', { name: 'Hide The Reasons' }).getAttribute('aria-expanded')) !== 'true') errors.push('Show The Reasons opened nothing it says is open');
  say('Why It Went This Way, opened', await panel(page, 'Why It Went This Way').innerText());
  await panel(page, 'Why It Went This Way').scrollIntoViewIfNeeded(); await shot(page, 'reasons');
  say('The Agreement, before an answer', await panel(page, 'The Agreement').innerText());
  await held(page, 'offered');
  await page.close();
}

// ---- V7: the meeting, On The Way, the stop and Ask To Move ------------------------------------------------------------
{
  const page = await opened('meeting.json');
  await toRepresentation(page);
  say('The Meeting, the morning of it', await panel(page, 'The Meeting').innerText());
  await page.getByRole('button', { name: /^Advance/ }).first().click(); await page.waitForTimeout(400);
  await page.getByRole('menuitem', { name: /^This Evening/ }).first().click(); await page.waitForTimeout(1200);
  const dialog = page.locator('[role=dialog]:visible').last();
  say('This Evening pressed: On The Way', await dialog.innerText());
  await dialog.getByRole('button', { name: /^Advance$/ }).first().click(); await page.waitForTimeout(1500);
  const stop = page.locator('[role=dialog]:visible').last();
  say('The stop at the meeting', await stop.innerText());
  await shot(page, 'stop');
  const ask = stop.getByRole('button', { name: 'Ask To Move' });
  if (!(await ask.count())) errors.push('the stop at the meeting offers no Ask To Move');
  else { await ask.click(); await page.waitForTimeout(1500); }
  await toRepresentation(page);
  say('After Ask To Move: The Meeting, and where the clock is', `${await page.getByRole('group', { name: 'Time Controls' }).first().locator('xpath=..').innerText()}\n\n${await panel(page, 'The Meeting').innerText()}`);
  await held(page, 'meeting');
  await page.close();
}

writeFileSync(OUT, `${lines.join('\n')}\n${errors.length ? `ERRORS\n${errors.join('\n')}\n` : 'No page errors, no sideways scroll, every button named.\n'}`);
console.log(`${OUT}: ${lines.length} lines, ${errors.length} errors`);
for (const e of errors) console.log(`  ${e}`);
await browser.close();
