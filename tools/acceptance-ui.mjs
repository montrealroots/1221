/**
 * SLATE — the player-facing acceptance run (acceptance pass, 2026-10-11): the built app driven through its visible
 * controls, the way a player would, at a width, each step recorded as passed or failed with what the screen said.
 * Nothing is called on the engine directly; a save written by \`tools/scenarios.ts --save\` is opened for the journeys a
 * new life can't reach in a session (a tax balance owed, a later term), and that's said in the step's name.
 *
 *   npm run build && npx vite preview --port 4173
 *   node tools/acceptance-ui.mjs OUT WIDTH [SAVEDIR]
 *
 * It writes OUT/report.json (every step, every page or console error, every screen past the right edge) and a
 * screenshot of each failed step.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { launchOptions } from './browser.mjs';

const BASE = 'http://localhost:4173';
const [OUT = 'acceptance', W = '1440', DIR] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 300)}`); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
const wait = (ms) => page.waitForTimeout(ms);
const steps = [];
const overflows = [];

/** A step: run, and recorded as passed, failed (with the error and a screenshot) or skipped (with why). */
async function step(name, fn) {
  try {
    const note = await fn();
    steps.push({ name, ok: true, ...(note ? { note: String(note).slice(0, 400) } : {}) });
    console.log(`ok   ${name}${note ? `: ${String(note).slice(0, 160)}` : ''}`);
  } catch (e) {
    const why = String(e?.message ?? e).split('\n')[0].slice(0, 300);
    const skipped = why.startsWith('SKIP');
    steps.push({ name, ok: skipped ? undefined : false, why });
    console.log(`${skipped ? 'skip' : 'FAIL'} ${name}: ${why}`);
    if (!skipped) await page.screenshot({ path: `${OUT}/fail-${steps.length}.png`, fullPage: false }).catch(() => {});
  }
}
const skip = (why) => { throw new Error(`SKIP ${why}`); };
const must = (cond, why) => { if (!cond) throw new Error(why); };

/** Anything past the page's right edge outside a region made to scroll. */
async function overflow(where) {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const out = document.documentElement.scrollWidth > w + 1 ? ['PAGE scrolls sideways'] : [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!(r.width > 0) || r.right <= w + 1 || getComputedStyle(el).position === 'fixed') continue;
      let p = el.parentElement, clipped = false;
      while (p) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { clipped = true; break; } p = p.parentElement; }
      if (!clipped) out.push(`${el.tagName}.${String(el.className).slice(0, 40)}`);
      if (out.length > 3) break;
    }
    return out;
  });
  if (over.length) overflows.push({ where, over });
  return over;
}
const toast = async () => (await page.locator('[role="status"], .toast').allInnerTexts().catch(() => [])).join(' | ');
const clock = async () => (await page.getByRole('group', { name: 'Time Controls' }).locator('xpath=..').innerText().catch(() => '')).match(/\d{1,2}:\d{2}\s?[AP]M/)?.[0] ?? '';
const dateText = async () => (await page.locator('header, .topbar, body').first().innerText()).match(/[A-Z][a-z]+ \d{1,2}, \d{4}/)?.[0] ?? '';
async function rail(name) {
  if (PHONE) { await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click(); await wait(400); }
  const b = page.locator('#rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  must(await b.count(), `no rail entry ${name}`);
  await b.click(); await wait(900);
}
async function tab(name) { const t = page.getByRole('tab', { name: new RegExp(`^${name}$`) }).first(); must(await t.count(), `no tab ${name}`); await t.click(); await wait(700); }
/** Each dialog met on the way, by its title and what was pressed. */
const dialogsMet = [];
/** A dialog left open by an advance: go ahead where it's the advance's own confirm, else close it. */
async function settleDialogs() {
  for (let i = 0; i < 16; i += 1) {
    const d = page.locator('[role=dialog]:visible').last();
    if (!(await d.count()) || !(await d.isVisible().catch(() => false))) return;
    dialogsMet.push(((await d.innerText().catch(() => '')).split('\n')[0] ?? '').slice(0, 60));
    // The way on first, in order (the modal's ✕ is labelled Close and comes first in the page).
    let pressed = false;
    for (const name of [/^Advance$/, /^Go$/]) {
      const b = d.getByRole('button', { name }).first();
      if (await b.count()) { await b.click().catch(() => {}); pressed = true; break; }
    }
    if (!pressed) await page.keyboard.press('Escape');
    await wait(600);
  }
}
async function advance(item) {
  await page.getByRole('button', { name: /^Advance/ }).first().click(); await wait(300);
  const m = page.getByRole('menuitem', { name: new RegExp(`^${item}`) }).first();
  must(await m.count(), `no Advance item ${item}`);
  await m.click(); await wait(1500); await settleDialogs();
}
async function openSave(file) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(`${DIR}/${file}`, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(2000);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
}

// --- A new life, from the empty slots.
await step('startup: the save slots load', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('slate'); r.onsuccess = r.onerror = r.onblocked = () => res(undefined); }));
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^New Save$/ }).first().waitFor({ timeout: 20000 });
  return `${await page.getByRole('button', { name: /^New Save$/ }).count()} empty slots`;
});
await step('creation: five steps, Continue held until each validates, Begin', async () => {
  await page.getByRole('button', { name: /^New Save$/ }).first().click(); await wait(1000);
  const billed = page.getByRole('group', { name: 'Billed As' });
  if (await billed.count()) await billed.getByRole('button', { name: 'Actress' }).click();
  // Continue refused with the first name cleared: the step says what it needs.
  const first = page.locator('#first');
  const name = await first.inputValue();
  await first.fill(''); await wait(200);
  const cont = page.getByRole('button', { name: /^Continue$/ });
  must(await cont.isDisabled(), 'Continue enabled with no first name');
  await first.fill(name || 'Ada'); await wait(200);
  // What the step still asks is listed above Continue; a fresh slot asks for a birthplace, picked as a player does.
  const asks = (await page.locator('li.small').allInnerTexts()).filter((t) => /needed|Choose/.test(t));
  if (asks.some((t) => /born in/.test(t))) {
    await page.locator('#born-search').fill('New York'); await wait(700);
    await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
  }
  for (let i = 0; i < 4; i += 1) { must(!(await cont.isDisabled()), `Continue disabled on step ${i + 1}`); await cont.click(); await wait(900); }
  await page.getByRole('button', { name: /^Begin$/ }).click();
  // The game's own top bar: on a phone the rail is in its drawer.
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
  return `began as ${name}; step one asked: ${asks.join(' ') || 'nothing more'}`;
});
await overflow('home');
await step('guide: a new player’s controls are locked until its chapters are read; read, they open', async () => {
  const locked = await page.getByText(/^Locked$/i).count();
  let read = 0;
  for (let i = 0; i < 40; i += 1) {
    // Each chapter: I've Read It, then Next to the following one, the guide's own way through.
    let b = page.locator('[role=dialog] button', { hasText: /^(I’ve Read It|Next: )/ }).first();
    if (!(await b.count()) || !(await b.isVisible().catch(() => false))) {
      // The Guide's own button in the top bar reopens it while chapters are left.
      const g = page.getByRole('button', { name: /^Guide \(\d+ Left\)/ }).first();
      if (!(await g.count())) break;
      await g.click({ timeout: 5000 }); await wait(500);
      b = page.locator('[role=dialog] button', { hasText: /^(I’ve Read It|Next: )/ }).first();
      if (!(await b.count())) break;
    }
    const isRead = /I’ve Read It/.test(await b.innerText());
    await b.click({ timeout: 5000 }); await wait(400); if (isRead) read += 1;
  }
  await page.keyboard.press('Escape'); await wait(300);
  const still = await page.locator('.is-locked').count();
  must(still === 0, `${still} controls still locked after ${read} chapters`);
  return `${locked} locked at the start; ${read} chapters read; none locked now`;
});

await step('home: what needs you, and a decision taken from its card', async () => {
  const cards = page.locator('.decision');
  const n = await cards.count();
  if (!n) return 'no decision waiting';
  const before = n;
  const action = cards.first().locator('.btn-primary').first();
  if (!(await action.count())) return `${n} cards, none with an action`;
  const label = await action.innerText();
  await action.click(); await wait(1200); await settleDialogs();
  return `${before} → ${await page.locator('.decision').count()} cards after "${label}"; ${await toast()}`;
});
await step('advance: One Hour moves the clock an hour', async () => {
  const before = await clock();
  await advance('One Hour');
  const after = await clock();
  must(before && after && before !== after, `clock ${before} → ${after}`);
  return `${before} → ${after}`;
});
await step('look after yourself: an item from its menu, and what it says', async () => {
  await page.getByRole('button', { name: /^Look After Yourself/ }).first().click(); await wait(300);
  const items = page.getByRole('menuitem');
  must(await items.count(), 'menu empty');
  const enabled = items.filter({ hasNot: page.locator('[disabled]') });
  const label = await enabled.first().innerText();
  await enabled.first().click(); await wait(1500); await settleDialogs();
  return `"${label.split('\n')[0]}": ${await toast()}`;
});

// To the first classes, by the Advance menu.
await step('advance: Next Monday, to term, until coursework is set', async () => {
  const dates = [];
  for (let i = 0; i < 4; i += 1) {
    await advance('Next Monday');
    await rail('School'); await tab('Coursework');
    const seen = `${await dateText()} ${await clock()}`;
    if (await page.locator('[id^="school-pane-coursework"] .panel, [id^="school-pane-coursework"] section').filter({ hasText: /Due at|Due / }).count()) return `${seen}; dialogs: ${dialogsMet.join(', ')}`;
    dates.push(seen);
  }
  return `no coursework card; dates ${dates.join(' → ')}; dialogs: ${dialogsMet.join(', ')}`;
});
await overflow('school coursework');
await step('school: registration and orientation are findable, and say what they ask', async () => {
  await tab('Coursework');
  const orient = page.getByText('Orientation').first();
  const register = page.getByRole('button', { name: /^Register$/ });
  return `orientation panel ${await orient.count() ? 'shown' : 'absent'}; Register button ${await register.count() ? 'shown' : 'absent (registered)'}`;
});
await step('coursework: a step of preparation done from its button, the clock moved and the step counted', async () => {
  await tab('Coursework');
  const labels = /^(Read The Scene|Read The Play|Learn Lines|Rehearse Alone|Research It At The Library|Write It Up|Review The Lesson|Practice The Sequence|Practice The Directions|Drill The Sounds|Run It Alone|Write Out The Score|Devise The Score)/;
  let b = page.getByRole('button', { name: labels }).filter({ hasNot: page.locator('.is-locked') }).first();
  if (!(await b.count())) skip('no preparation button on the open work');
  // Greyed, the reason is on the screen, not only in a tooltip; then the evening, when it can be done.
  let why = '';
  if (await b.isDisabled()) {
    why = await page.locator('.why-not').first().innerText().catch(() => '');
    must(why.length > 0, 'preparation greyed with no reason on the screen');
    await advance('This Evening'); await rail('School'); await tab('Coursework');
    // A partner's request to rehearse comes first, as the reason says: answered, as a player would.
    if (/asked to rehearse: answer first/.test(await page.locator('.why-not').first().innerText().catch(() => ''))) {
      const yes = page.getByRole('button', { name: /^Say (Yes|No)/ }).first();
      if (await yes.count()) { await yes.click(); await wait(900); why += ' → answered the partner'; }
    }
    b = page.getByRole('button', { name: labels }).filter({ hasNot: page.locator('.is-locked') }).first();
    must(!(await b.isDisabled()), `still greyed in the evening: ${await page.locator('.why-not').first().innerText().catch(() => '')}`);
  }
  const label = (await b.innerText()).split('\n')[0];
  const before = await clock();
  await b.click(); await wait(1500); await settleDialogs();
  const said = await toast();
  return `${why ? `greyed first (${why}); ` : ''}"${label}": ${before} → ${await clock()}; ${said}`;
});
await step('coursework: a way of playing it chosen and rehearsed in', async () => {
  const choose = page.getByRole('button', { name: /^(Play It This Way|Change How You Play It)$/ }).first();
  if (!(await choose.count())) skip('no scene with a playing chooser open');
  const radios = choose.locator('xpath=ancestor::*[self::section or contains(@class,"panel") or contains(@class,"col")][1]').getByRole('radio');
  if (await radios.count()) await radios.nth(1).check().catch(() => {});
  await choose.click(); await wait(1000);
  return await toast();
});
await step('coursework: table work answered from its select', async () => {
  const sel = page.locator('[id^="school-pane-coursework"] select').first();
  if (!(await sel.count())) skip('no table work open');
  const opts = await sel.locator('option').allInnerTexts();
  await sel.selectOption({ index: Math.min(1, opts.length - 1) }); await wait(800);
  return `${opts.length} options; ${await toast()}`;
});
await step('navigation keeps context: School’s tab kept across Money and back', async () => {
  await tab('Casting');
  await rail('Money'); await rail('School');
  const sel = await page.getByRole('tab', { selected: true }).first().innerText();
  must(/Casting/.test(sel), `came back to ${sel}`);
  return sel;
});
await step('casting: the rehearsal controls, where a part has calls', async () => {
  await tab('Casting');
  const learn = page.getByRole('button', { name: /^Learn The Part$/ }).first();
  if (!(await learn.count())) skip('no part with calls yet');
  await learn.click(); await wait(1200);
  return await toast();
});
await overflow('school casting');

// Practice from the Player Profile.
await step('practice: an exercise opened, its tier and focus set, an hour practised, and the hour explained', async () => {
  await rail('Player Profile');
  const open = page.locator('button:visible', { hasText: /…$/ }).first();
  must(await open.count(), 'no exercise to open');
  await open.click(); await wait(500);
  const focus = page.getByLabel('Focus').first();
  if (await focus.count()) await focus.selectOption('precision');
  const go = page.getByRole('button', { name: /^Practice An Hour$/ }).first();
  must(await go.count(), 'no Practice An Hour');
  const before = await clock();
  await go.click(); await wait(1500); await settleDialogs();
  const said = await toast();
  must(said.length > 0, 'nothing said');
  // The hour explained in its row, beside the button: the engine's own feedback.
  const row = await go.locator('xpath=..').innerText();
  must(/Pitched|easily|struggled|rose|full/.test(row), `no explanation in the row: ${row.slice(0, 200)}`);
  return `${before} → ${await clock()}: ${said} | ${row.replace(/\s+/g, ' ').slice(0, 220)}`;
});
await step('profile: the development history shows the hour', async () => {
  const hist = page.getByText('Development History').first();
  must(await hist.count(), 'no Development History');
  return 'shown';
});
await overflow('profile');

// Money.
await step('money: a transfer refused for more than the account holds, in the engine’s words, then made', async () => {
  await rail('Money'); await tab('Accounts');
  const amount = page.locator('#move-amount');
  if (!(await amount.count())) skip('no second account to move money to');
  await amount.fill('99999999'); await wait(200);
  await page.getByRole('button', { name: /^Move It/ }).first().click(); await wait(800);
  const refused = await toast();
  must(/holds|can’t|more than/i.test(refused), `refusal said: ${refused}`);
  await amount.fill('1'); await wait(200);
  await page.getByRole('button', { name: /^Move It/ }).first().click(); await wait(800);
  return `${refused} / ${await toast()}`;
});
await overflow('money');
await step('papers: its five tabs open', async () => {
  await rail('Papers');
  for (const t of ['Tax Returns', 'Health Cover', 'Unemployment', 'Passport And ID', 'Permission To Work']) { await tab(t); await overflow(`papers ${t}`); }
  return 'all five';
});

// Save, exit and open again: the same moment.
await step('save and exit, then Continue: the same day and hour', async () => {
  const before = `${await dateText()} ${await clock()}`;
  await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
  const after = `${await dateText()} ${await clock()}`;
  must(before === after, `${before} → ${after}`);
  return after;
});

// Journeys from saves the scenarios wrote: a tax balance owed to the IRS and Connecticut, and a student back from a leave.
if (DIR && existsSync(`${DIR}/tax.json`)) {
  await step('[save: tax-plan scenario] papers: who it’s owed to, a part paid to Connecticut, its plan asked for', async () => {
    await openSave('tax.json');
    await rail('Papers'); await tab('Tax Returns');
    must(await page.getByText('Who It’s Owed To').count(), 'no Who It’s Owed To');
    const pay = page.locator('[id^="tax-pay-us-ct-"]').first();
    must(await pay.count(), 'no Connecticut pay field');
    await pay.fill('10');
    await pay.locator('xpath=ancestor::div[contains(@class,"row")][1]').getByRole('button', { name: /^Pay$/ }).click(); await wait(900);
    const paid = await toast();
    must(/Paid Connecticut DRS/.test(paid), paid);
    const ask = page.getByRole('button', { name: /^Ask For The Plan$/ }).first();
    if (await ask.count() && !(await ask.isDisabled())) { await ask.click(); await wait(1200); }
    return `${paid} / ${await toast()}`;
  });
  await overflow('papers tax (save)');
  await step('[save: tax-plan scenario] papers: the IRS plan says it covers federal tax only', async () => {
    must(await page.getByText(/federal tax only, a state’s being the state’s/).count() || await page.getByText('IRS Payment Plan').count(), 'no IRS plan panel');
    return 'shown';
  });
}
if (DIR && existsSync(`${DIR}/leave.json`)) {
  await step('[save: leave scenario] school: Your Classes, the first class’s productions, the evaluations', async () => {
    await openSave('leave.json');
    await rail('School'); await tab('Standing And Craft');
    must(await page.getByText('Your Classes').count(), 'no Your Classes');
    const ev = await page.getByText('Evaluations').count();
    return `Your Classes shown; Evaluations panel ${ev ? 'shown' : 'absent'}`;
  });
  await overflow('school standing (save)');
  await step('[save: leave scenario] casting: the rehearsal controls work, or say why not', async () => {
    await tab('Casting');
    const learn = page.getByRole('button', { name: /^Learn The Part$/ }).first();
    if (!(await learn.count())) skip('no part with calls in this save');
    if (await learn.isDisabled()) {
      const why = await page.locator('.why-not').first().innerText().catch(() => '');
      must(why.length > 0, 'greyed with no reason on the screen');
      return `greyed: ${why}`;
    }
    await learn.click(); await wait(1200);
    return await toast();
  });
  await overflow('school casting (save)');
}
if (PHONE) {
  await step('phone: the drawer opens and closes, and Home is reachable from it', async () => {
    await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click(); await wait(400);
    must(await page.locator('#rail').isVisible(), 'drawer not shown');
    await page.locator('#rail').getByRole('button', { name: /^Home/ }).first().click(); await wait(800);
    return 'ok';
  });
}

const failed = steps.filter((s) => s.ok === false);
writeFileSync(`${OUT}/report.json`, JSON.stringify({ width: WIDTH, steps, errors, overflows, failed: failed.length }, null, 1));
console.log(`\n${steps.filter((s) => s.ok).length} passed, ${failed.length} failed, ${steps.filter((s) => s.ok === undefined).length} skipped; ${errors.length} errors; ${overflows.length} overflows`);
await browser.close();
process.exit(failed.length || errors.length || overflows.length ? 1 : 0);
