/**
 * SLATE — the player-facing acceptance run (acceptance pass, 2026-10-11): the built app driven through its visible
 * controls, the way a player would, at a width, each step recorded as passed or failed with what the screen said.
 * Nothing is called on the engine directly; a save written by \`tools/scenarios.ts --save\` is opened for the journeys a
 * new life can't reach in a session (a tax balance owed, a decision waiting, a later term), and that's said in the
 * step's name.
 *
 *   npm run build && npx vite preview --port 4173
 *   node tools/acceptance-ui.mjs OUT WIDTH [SAVEDIR]
 *
 * SLATE_BASE names another address (from 2026-10-12, when a preview left running held 4173 on an older build).
 *
 * From 2026-10-12 it also plays the connected journey (the owner's brief of that day, section 16): How This Works opened
 * beside a feature, a connected system followed and Back, a search, Show Me Where and Back To Help, the keyboard's ? and
 * /, a half-typed form kept across it, and the live clock held while it's read; Work It Through on a scene, a problem
 * named, a way tried and kept; a brief taped with a classmate reading; a director's note on the craft worked one of its
 * ways; and the On The Way stop, where a commitment interrupts an advance.
 *
 * From 2026-10-13 it also opens the help from the top bar’s Advance and Look After Yourself menus and closes it both
 * ways, checks the screen and tab Show Me Where lands on and the trail Back To Help returns to, and loads a screen’s
 * address on its own, as a reload or a link does (the guide audit of that day). From later that day it reads the hour
 * practiced in Development History, and takes a decision from its card on a save that has one, where until then both
 * steps passed on finding a heading or no card (that day’s evidence pass). And from the third round of that day, these
 * check what their steps' names say, where until then each passed whatever happened: a step of preparation moves
 * the clock and its part’s figure, a way of playing and a table work answer are taken in the engine’s words,
 * Connecticut’s plan is asked for in its own panel, the IRS plan in force says what it covers and the IRS plan is asked
 * for from its own (on the lien save, which owes it with no plan), and the leave save’s first class’s productions and
 * evaluated terms are read.
 *
 * It writes OUT/report.json (every step, every page or console error, every screen past the right edge) and a
 * screenshot of each failed step.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { launchOptions } from './browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
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
/** The IRS Payment Plan panel on Papers' Tax Returns, by its heading. */
const irsPanel = () => page.locator('section.card').filter({ has: page.getByRole('heading', { name: /^IRS Payment Plan$/ }) }).first();
/** A figure in a panel, by its label: the label, the value and the note under it. */
const statIn = async (panel, label) => (await panel.locator('.stat').filter({ has: page.locator('.stat-label', { hasText: new RegExp(`^${label}$`) }) }).first().innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
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

/**
 * What Needs You on the first day (from 2026-10-13): a new life has no decision waiting, since the three a life raises
 * (a return on 1 February, a bank's notice before it hands an account to the state, a US status ending) come months or
 * years in; so this holds the panel's own words for none, and a decision is taken from its card on a save that has one
 * (`[save: decision scenario]`, below). Until then this step was "home: what needs you, and a decision taken from its
 * card": it passed with no card at all, asserted nothing after a press, and every recorded run said "no decision
 * waiting" (found by that day's evidence pass).
 */
await step('home: what needs you on the first day: no decision waiting, in the panel’s own words', async () => {
  const n = await page.locator('.decision').count();
  must(n === 0, `${n} decision cards on the first day`);
  const panel = page.locator('section.card', { has: page.getByRole('heading', { name: 'What Needs You', exact: true }) }).first();
  must(await panel.count(), 'no What Needs You on Home');
  must(await panel.getByText('No decision is waiting on you.', { exact: true }).count(), `What Needs You says “${(await panel.innerText()).replace(/\s+/g, ' ').slice(0, 160)}”`);
  return 'No decision is waiting on you.';
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
  // Grayed, the reason is on the screen, not only in a tooltip; then the evening, when it can be done.
  let why = '';
  if (await b.isDisabled()) {
    why = await page.locator('.why-not').first().innerText().catch(() => '');
    must(why.length > 0, 'preparation grayed with no reason on the screen');
    await advance('This Evening'); await rail('School'); await tab('Coursework');
    // A partner's request to rehearse comes first, as the reason says: answered, as a player would.
    if (/asked to rehearse: answer first/.test(await page.locator('.why-not').first().innerText().catch(() => ''))) {
      const yes = page.getByRole('button', { name: /^Say (Yes|No)/ }).first();
      if (await yes.count()) { await yes.click(); await wait(900); why += ' → answered the partner'; }
    }
    b = page.getByRole('button', { name: labels }).filter({ hasNot: page.locator('.is-locked') }).first();
    must(!(await b.isDisabled()), `still grayed in the evening: ${await page.locator('.why-not').first().innerText().catch(() => '')}`);
  }
  const label = (await b.innerText()).split('\n')[0];
  // The work’s card, by its title, and each part’s figure on it (from 2026-10-13: until then the step returned the clock
  // and the toast and checked neither, so it passed whatever the press did).
  const title = await b.locator('xpath=ancestor::section[contains(@class,"card")][1]').locator('h2').first().innerText();
  const card = page.locator('section.card').filter({ has: page.locator('h2', { hasText: title }) }).first();
  const parts = async () => Object.fromEntries(await card.locator('.stat').evaluateAll((els) => els.map((e) => [e.querySelector('.stat-label')?.textContent ?? '', parseFloat(e.querySelector('.stat-value')?.textContent ?? '')])));
  const was = await parts();
  const before = await clock();
  await b.click(); await wait(1500); await settleDialogs();
  const said = await toast();
  const moved = said.match(new RegExp(`${label}: \\d+ minutes, (.+?) up \\d+%\\.`));
  must(moved, `no word of “${label}” done: ${said || 'no toast'}`);
  const after = await clock();
  must(after !== before, `the clock didn’t move from ${before}`);
  const part = moved[1];
  const now = await parts();
  must(Number.isFinite(was[part]) && now[part] > was[part], `“${label}” left ${part} at ${was[part]}% (now ${now[part]}%)`);
  return `${why ? `grayed first (${why}); ` : ''}“${label}”: ${before} → ${after}; ${part} ${was[part]}% → ${now[part]}%; ${said}`;
});
await step('coursework: a way of playing it chosen and rehearsed in', async () => {
  const choose = page.getByRole('button', { name: /^(Play It This Way|Change How You Play It)$/ }).first();
  if (!(await choose.count())) skip('no scene with a playing chooser open');
  const radios = choose.locator('xpath=ancestor::*[self::section or contains(@class,"panel") or contains(@class,"col")][1]').getByRole('radio');
  // A way not already the one held, so the choice is a change the button takes.
  const n = await radios.count();
  for (let i = 0; i < n; i += 1) if (!(await radios.nth(i).isChecked())) { await radios.nth(i).check(); break; }
  await wait(300);
  must(!(await choose.isDisabled()), `“${await choose.innerText()}” still grayed after a way was picked`);
  await choose.click(); await wait(1000);
  // Said, as the engine took it (from 2026-10-13: until then the step returned the toast and checked nothing).
  const said = await toast();
  must(/Chosen: rehearsed in to \d+%\./.test(said), `no choice taken: ${said || 'no toast'}`);
  return said;
});
await step('coursework: table work answered from its select', async () => {
  // Table Work’s own select, under its heading: the first select on the tab can be a rehearsal’s day or hour.
  const sel = page.locator('[id^="school-pane-coursework"] .eyebrow', { hasText: /^Table Work$/ }).first().locator('xpath=ancestor::div[contains(@class,"col")][1]').locator('select').first();
  if (!(await sel.count())) skip('no table work open');
  must(!(await sel.isDisabled()), 'the table work select is grayed');
  const current = await sel.inputValue();
  const values = await sel.locator('option').evaluateAll((os) => os.map((o) => o.value));
  const chosen = values.find((v) => v && v !== current);
  if (chosen === undefined) skip('no other answer to give');
  await sel.selectOption(chosen); await wait(800);
  // The answer taken, and kept by the select (from 2026-10-13: until then the step returned the toast and checked
  // nothing, and passed with no toast, a refusal’s, or the select gone back).
  const said = await toast();
  must(/Decided at the table\./.test(said), `no answer taken: ${said || 'no toast'}`);
  must((await sel.inputValue()) === chosen, `the select went back to “${await sel.inputValue()}”`);
  return `${values.length} options, “${chosen}” taken; ${said}`;
});
/**
 * Work It Through on a piece (from 2026-10-12): each problem the forecast names in turn, until one has a way that can be
 * tried now (a way on the feet waits for the energy and the hour); the way tried, its evidence said, and kept or put
 * back; the try in the record.
 */
async function workThrough(wb) {
  // Each problem in turn, until one has a way that can be tried now (a way on the feet waits for the energy and the hour).
  const tried = [];
  let label = '';
  let way = wb.locator('li button:not([disabled])', { hasText: /\(\d+ Min\)$/ }).first();
  for (let i = 0; i < 6; i += 1) {
    const next = wb.locator('li button:not([disabled])').filter({ hasNotText: /\(\d+ Min\)$/ }).filter({ hasNotText: new RegExp(`^(${tried.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '\\u0000'})$`) }).first();
    if (!(await next.count())) break;
    label = await next.innerText();
    tried.push(label);
    await next.click(); await wait(800);
    must(/Working On:/.test(await wb.innerText()), `"${label}" isn’t shown as worked on`);
    way = wb.locator('li button:not([disabled])', { hasText: /\(\d+ Min\)$/ }).first();
    if (await way.count()) break;
  }
  if (!tried.length) skip(`nothing to work through: ${(await wb.innerText()).slice(0, 120)}`);
  if (!(await way.count())) skip(`no way at ${tried.join(', ')} can be tried now: ${(await wb.locator('.why-not').allInnerTexts()).join(' ').slice(0, 200)}`);
  const wayLabel = await way.innerText();
  const t0 = await clock();
  await way.click(); await wait(1200); await settleDialogs();
  const said = await toast();
  must(/: \d+(\.\d)? to \d+(\.\d)?\./.test(said), `no evidence said: ${said}`);
  const keep = wb.getByRole('button', { name: /^Keep It$/ }).first();
  if (await keep.count()) { await keep.click(); await wait(800); }
  must(await wb.locator('table[data-tries] tbody tr').count() >= 1, 'the try isn’t in the record');
  return `"${label}" → ${wayLabel}, ${t0} → ${await clock()}: ${said}`;
}
await step('coursework: Work It Through: a problem named, a way tried, its evidence shown, then kept or put back', async () => {
  const wb = page.locator('[data-workbook^="assignment:"]').first();
  if (!(await wb.count())) skip('no scene open to work through');
  return workThrough(wb);
});

// The guide's reference, beside the features it explains (from 2026-10-12).
const helpDialog = () => page.getByRole('dialog', { name: /How This Works/ }).last();
const entryTitle = async () => (await helpDialog().locator('article.help-entry h3').first().innerText().catch(() => '')).trim();
await step('help: How This Works beside Coursework opens its entry, a connected system followed, Back, Escape keeps the tab and the focus', async () => {
  await rail('School'); await tab('Coursework');
  const how = page.locator('[id^="school-pane-coursework"] button[aria-label^="How This Works:"]').first();
  must(await how.count(), 'no How This Works on the Coursework tab');
  const aria = await how.getAttribute('aria-label');
  const t0 = `${await dateText()} ${await clock()}`;
  await how.click(); await wait(700);
  must(await helpDialog().getByText('The clock waits while you read.').count(), 'the help doesn’t say the clock waits');
  const first = await entryTitle();
  must(first && aria.endsWith(first), `opened "${first}" from "${aria}"`);
  const connected = helpDialog().locator('details.help-section', { hasText: /^Connected Systems/ }).first();
  must(await connected.count(), `"${first}" shows no Connected Systems`);
  await connected.locator('summary').click(); await wait(300);
  const link = connected.locator('button.help-link').first();
  const to = await link.innerText();
  await link.click(); await wait(500);
  must((await entryTitle()) === to, `followed "${to}", showing "${await entryTitle()}"`);
  const trail = await helpDialog().getByRole('navigation', { name: 'Help Trail' }).innerText();
  must(trail.includes(first) && trail.includes(to), `the trail says "${trail.replace(/\s+/g, ' ')}"`);
  await helpDialog().getByRole('button', { name: /^Back$/ }).click(); await wait(400);
  must((await entryTitle()) === first, `Back went to "${await entryTitle()}"`);
  await page.keyboard.press('Escape'); await wait(500);
  must(!(await helpDialog().isVisible().catch(() => false)), 'Escape didn’t close it');
  const selected = await page.getByRole('tab', { selected: true }).first().innerText();
  must(/Coursework/.test(selected), `the tab came back as ${selected}`);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
  must(focused === aria, `focus went back to "${focused}"`);
  const t1 = `${await dateText()} ${await clock()}`;
  must(t0 === t1, `the clock moved while reading: ${t0} → ${t1}`);
  return `${first} → ${to} → Back; the tab and the focus kept; ${t1}`;
});
await step('help: the keyboard: ? opens the contents, / goes to the search, a word finds entries', async () => {
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.keyboard.press('?'); await wait(600);
  must(await helpDialog().isVisible().catch(() => false), '? opened nothing');
  must(await helpDialog().getByRole('heading', { name: 'Getting Started' }).count(), 'no contents by goal');
  await page.keyboard.press('Escape'); await wait(400);
  await page.keyboard.press('/'); await wait(600);
  const q = page.locator('#help-q');
  must(await q.count() && (await page.evaluate(() => document.activeElement?.id)) === 'help-q', '/ didn’t go to the search');
  await q.fill('partner'); await wait(200);
  await helpDialog().getByRole('button', { name: /^Search$/ }).click(); await wait(400);
  const found = helpDialog().locator('ul.help-results button.help-link');
  must(await found.count() > 0, 'searching "partner" found nothing');
  const n = await found.count();
  await page.keyboard.press('Escape'); await wait(400);
  return `${n} entries for "partner"`;
});
/**
 * Show Me Where, to A Card’s Offers, which “transfer” finds: Your Bank’s Cards tab, gone to from its Accounts tab so the
 * tab is seen to move. Stated here, as this script can’t read the guide; `tests/help-mechanics.test.ts` holds the
 * entry to it. Until 2026-10-13 this compared the address before and after, which differed whether Show Me Where went
 * anywhere or not (closing the help takes the entry out of it), checked no screen or tab, and checked the trail Back To
 * Help returned to only by the entry’s title (found by the guide audit of that day).
 */
await step('help: Show Me Where goes to the entry’s screen and tab, Back To Help returns to the same trail', async () => {
  await rail('Money'); await tab('Accounts');
  await page.keyboard.press('/'); await wait(500);
  await page.locator('#help-q').fill('transfer'); await page.keyboard.press('Enter'); await wait(400);
  const hit = helpDialog().locator('ul.help-results button.help-link', { hasText: /^A Card’s Offers$/ }).first();
  must(await hit.count(), 'searching “transfer” didn’t find A Card’s Offers');
  await hit.click(); await wait(400);
  const title = await entryTitle();
  must(title === 'A Card’s Offers', `opened “${title}”`);
  const trailText = async () => (await helpDialog().getByRole('navigation', { name: 'Help Trail' }).innerText()).replace(/\s+/g, ' ').trim();
  const trail = await trailText();
  await helpDialog().getByRole('button', { name: /^Show Me Where$/ }).click(); await wait(1000);
  must(!(await helpDialog().isVisible().catch(() => false)), 'Show Me Where left the help open');
  const to = new URL(page.url()).hash;
  must(to.split('?')[0] === '#/workspace/bank', `Show Me Where went to ${to}`);
  const selected = await page.getByRole('tab', { selected: true }).first().innerText();
  must(/^Cards/.test(selected), `Show Me Where turned to the tab “${selected}”`);
  const back = page.getByRole('button', { name: /^Back To Help$/ }).first();
  must(await back.count(), 'no Back To Help');
  await back.click(); await wait(600);
  must((await entryTitle()) === title, `Back To Help opened “${await entryTitle()}”`);
  const again = await trailText();
  must(again === trail, `Back To Help’s trail is “${again}”, not “${trail}”`);
  await page.keyboard.press('Escape'); await wait(400);
  return `“${title}”: Accounts → ${to}, ${selected}; back to ${again}`;
});
// Closed with Escape and, from 2026-10-13, with the help’s own Close as well.
await step('help: a half-typed amount kept across How This Works, closed with Escape and with Close', async () => {
  await rail('Money');
  const amount = page.locator('input[inputmode="decimal"], input[type="number"]').first();
  if (!(await amount.count())) skip('no amount field on the Money screen');
  await amount.fill('12.34'); await wait(200);
  const how = page.locator('button[aria-label^="How This Works:"]').first();
  must(await how.count(), 'no How This Works on the Money screen');
  for (const close of ['Escape', 'Close']) {
    await how.click(); await wait(600);
    if (close === 'Close') await helpDialog().locator('.modal-foot').getByRole('button', { name: /^Close$/ }).click();
    else await page.keyboard.press('Escape');
    await wait(400);
    must(!(await helpDialog().isVisible().catch(() => false)), `${close} didn’t close the help`);
    const kept = await amount.inputValue();
    must(kept === '12.34', `closed with ${close}, the amount came back as “${kept}”`);
  }
  await amount.fill(''); await wait(100);
  return 'kept: 12.34, closed with Escape and with Close';
});
/**
 * How This Works in a top-bar menu (from 2026-10-13): the help opens over the menu, and closed with its Close or with
 * Escape leaves the menu open and gives the focus back to the How This Works it was opened from. Until then either one
 * shut the menu under it, the button with it, and the focus fell to the page (found by the guide audit of that day).
 */
await step('help: opened from the Advance and Look After Yourself menus, closed with Close and with Escape: the menu still open, the focus on its How This Works', async () => {
  const seen = [];
  for (const [menu, name, how] of [
    [/^Advance/, 'Advance Time', 'How This Works: Moving Time On'],
    [/^Look After Yourself/, 'Look After Yourself', 'How This Works: Looking After Yourself'],
  ]) {
    for (const close of ['Close', 'Escape']) {
      await page.getByRole('button', { name: menu }).first().click(); await wait(300);
      const list = page.getByRole('menu', { name });
      must(await list.isVisible().catch(() => false), `the ${name} menu didn’t open`);
      await list.getByRole('button', { name: how }).click(); await wait(500);
      must(await helpDialog().isVisible().catch(() => false), `${how} opened nothing`);
      if (close === 'Close') await helpDialog().locator('.modal-foot').getByRole('button', { name: /^Close$/ }).click();
      else await page.keyboard.press('Escape');
      await wait(400);
      must(!(await helpDialog().isVisible().catch(() => false)), `${close} didn’t close the help`);
      must(await list.isVisible().catch(() => false), `the help’s ${close} closed the ${name} menu`);
      const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName || '');
      must(focused === how, `after the help’s ${close} the focus is on “${focused}”`);
      // With the help gone, Escape is the menu’s again.
      await page.keyboard.press('Escape'); await wait(300);
      must(!(await list.isVisible().catch(() => false)), `Escape didn’t close the ${name} menu once the help was closed`);
      seen.push(`${name}: ${close}`);
    }
  }
  return seen.join('; ');
});
if (!PHONE) {
  await step('help: reading it holds the live clock: a minute open, the same minute; closed, it moves; Pause stops it a minute', async () => {
    const play = page.getByRole('group', { name: 'Time Controls' }).getByRole('button', { name: /^Play$/ }).first();
    if (!(await play.count())) skip('no Play control');
    await play.click(); await wait(500);
    const how = page.locator('button[aria-label^="How This Works:"]').first();
    await how.click(); await wait(500);
    const open0 = await clock();
    await wait(65_000);
    const open1 = await clock();
    await page.keyboard.press('Escape'); await wait(500);
    must(open0 === open1, `the clock ran while the help was open: ${open0} → ${open1}`);
    await wait(65_000);
    const after = await clock();
    must(after !== open1, `the clock didn’t run again after: ${open1} → ${after}`);
    // Pause pressed on the running page stops it, the page not opened again (from 2026-10-13: the review found the unit
    // test of it remounted the provider, which restarts every effect, and so didn't show the press itself stops it).
    const pause = page.getByRole('group', { name: 'Time Controls' }).getByRole('button', { name: /^Pause$/ }).first();
    must(await pause.count(), 'no Pause on the running page');
    await pause.click(); await wait(300);
    const paused0 = await clock();
    await wait(65_000);
    const paused1 = await clock();
    must(paused0 === paused1, `the clock ran on after Pause: ${paused0} → ${paused1}`);
    return `open: ${open0} → ${open1}; closed: → ${after}; paused: ${paused0}, a minute on ${paused1}`;
  });
}

await step('navigation keeps context: School’s tab kept across Money and back', async () => {
  // The help steps before it end on Money (from 2026-10-12): School first.
  await rail('School');
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

// Practice from the Player Profile. The exercise practiced, by its name, for the history after it.
let practiced = '';
await step('practice: an exercise opened, its tier and focus set, an hour practised, and the hour explained', async () => {
  await rail('Player Profile');
  const open = page.locator('button:visible', { hasText: /…$/ }).first();
  must(await open.count(), 'no exercise to open');
  const name = (await open.innerText()).replace(/…$/, '').trim();
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
  practiced = name;
  return `${before} → ${await clock()}: ${said} | ${row.replace(/\s+/g, ' ').slice(0, 220)}`;
});
/**
 * The hour just practiced, read in Development History (from 2026-10-13): among its newest changes, one in the
 * exercise's name, with its day, the ability and the change to three places. Until then this step found the panel's
 * heading, which is drawn with no history at all, and said "shown" (found by that day's evidence pass).
 */
await step('profile: the development history shows the hour', async () => {
  must(practiced, 'no hour was practiced in the step before, so the history has nothing to show of it');
  const panel = page.locator('section.card', { has: page.getByRole('heading', { name: 'Development History', exact: true }) }).first();
  must(await panel.count(), 'no Development History');
  const items = (await panel.locator('li').allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').trim());
  must(items.length, `Development History has no change after the hour: ${(await panel.innerText()).replace(/\s+/g, ' ').slice(0, 160)}`);
  const newest = items.slice(0, 6);
  const hour = newest.find((t) => t.endsWith(`, ${practiced}`));
  must(hour, `no change from ${practiced} among the newest: ${newest.join(' | ').slice(0, 260)}`);
  must(/^[A-Z][a-z]+ \d{1,2}, \d{4}: .+ \+\d+\.\d{3}, /.test(hour), `the change reads “${hour}”`);
  return hour;
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
/**
 * A screen’s address loaded on its own, as a reload or a link loads it, and Continue pressed: the screen it names, at
 * the tab it names, and a guide entry it names open over that screen (from 2026-10-13: until then the help wrote Home
 * over the address before the game had read it, so either opened Home; found by the guide audit of that day). The
 * tab kept for a screen is the session’s, so a reload opens School at Standing And Craft unless the address says
 * otherwise.
 */
await step('address: School’s Coursework loaded by its address opens School at Coursework, not Home; an entry it names opens over School', async () => {
  const load = async (address) => {
    await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
    await page.goto(new URL(address, BASE).href); await page.reload({ waitUntil: 'networkidle' }); await wait(2000);
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
    return new URL(page.url()).hash;
  };
  const at = await load('#/workspace/school?tab=coursework');
  must(at === '#/workspace/school', `the address opened ${at}`);
  const selected = await page.getByRole('tab', { selected: true }).first().innerText({ timeout: 3000 }).catch(() => '');
  must(/^Coursework/.test(selected), `the address opened ${at} at “${selected || 'no tab'}”`);
  must(!(await helpDialog().isVisible().catch(() => false)), 'the help opened with no entry in the address');
  const over = await load('#/workspace/school?help=school.repeat');
  must(over === '#/workspace/school?help=school.repeat', `with the entry open the address is ${over}`);
  must((await entryTitle()) === 'Repeating, Extra Terms And Incompletes', `the address opened “${await entryTitle()}”`);
  await page.keyboard.press('Escape'); await wait(400);
  const closed = new URL(page.url()).hash;
  must(closed === '#/workspace/school', `closed, the address is ${closed}`);
  must(await page.getByRole('tab', { name: /^Standing And Craft/ }).count(), 'the screen under the entry isn’t School');
  return `${at} at ${selected}; ${over}, then ${closed}`;
});

// Skip To Content, reached from the keyboard as its reader reaches it: the screen kept and its address, the focus on the
// content. Until 2026-10-13 the link changed the address to #main, which the game read as Home (found by the help audit).
await step('address: Skip To Content, from the keyboard, moves the focus to the content and leaves School where it is', async () => {
  const before = new URL(page.url()).hash;
  must(before.startsWith('#/workspace/school'), `School isn’t open: ${before}`);
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); });
  await page.locator('a.skip-link').focus();
  await page.keyboard.press('Enter'); await wait(800);
  const after = new URL(page.url()).hash;
  must(after === before, `the address moved from ${before} to ${after}`);
  const focused = await page.evaluate(() => document.activeElement?.id ?? '');
  must(focused === 'main', `the focus went to “${focused || 'nothing'}”, not the content`);
  must(await page.getByRole('tab', { name: /^Standing And Craft/ }).count(), 'the screen isn’t School');
  return `${after}, the focus on #${focused}`;
});

await step('interruption: an advance past a commitment stops at it and asks; Stand Here leaves the clock where it is', async () => {
  await page.getByRole('button', { name: /^Advance/ }).first().click(); await wait(300);
  await page.getByRole('menuitem', { name: /^Next Monday/ }).first().click(); await wait(1500);
  const d = page.locator('[role=dialog]:visible').last();
  if (!(await d.count())) skip('nothing on the way to Next Monday');
  const title = ((await d.innerText()).split('\n')[0] ?? '').slice(0, 60);
  if (/^On The Way/.test(title)) {
    must(/on the way\. The clock stops at\s+each/.test(await d.innerText()), 'On The Way doesn’t say the clock stops');
    await d.getByRole('button', { name: /^Advance$/ }).first().click(); await wait(1500);
  }
  const due = page.locator('[role=dialog]:visible').last();
  if (!(await due.count())) skip(`no stop at a commitment after "${title}"`);
  const at = `${await dateText()} ${await clock()}`;
  const stand = due.getByRole('button', { name: /^Stand Here$/ }).first();
  if (!(await stand.count())) { await settleDialogs(); skip(`stopped at "${((await due.innerText()).split('\n')[0] ?? '').slice(0, 60)}" with no Stand Here`); }
  await stand.click(); await wait(800);
  const after = `${await dateText()} ${await clock()}`;
  must(at === after, `Stand Here moved the clock: ${at} → ${after}`);
  await advance('One Hour').catch(() => {});
  return `stopped at ${at}; Stand Here kept it there`;
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
    // The plan asked for, and said: until the remaining-gaps pass of 2026-10-11 the step passed with the button absent.
    // Connecticut’s own, in its panel: until 2026-10-13 it was the first Ask For The Plan on the tab, whoever’s it was.
    const ct = page.locator('section.card').filter({ has: page.locator('#state-plan-us-ct') }).first();
    must(await ct.count(), 'no Connecticut plan panel to ask in');
    const ask = ct.getByRole('button', { name: /^Ask For The Plan$/ }).first();
    must(await ask.count() && !(await ask.isDisabled()), 'Ask For The Plan not available');
    await ask.click(); await wait(1200);
    const asked = await toast();
    must(/Asked: \$[\d,.]+ a month, decided by/.test(asked), `asked: ${asked}`);
    return `${paid} / ${asked}`;
  });
  await overflow('papers tax (save)');
  // The save’s IRS plan is in force, asked for by the scenario, so its panel shows the plan and not the application, and
  // the sentence that says it covers federal tax only goes with the application: the lien save’s step below reads it,
  // and asks for the plan. Until 2026-10-13 this step was named for that sentence and passed on the panel’s heading.
  await step('[save: tax-plan scenario] papers: the IRS plan in force, its own panel saying what it covers, each month and the next payment', async () => {
    const irs = irsPanel();
    must(await irs.count(), 'no IRS Payment Plan panel');
    must(await irs.getByText(/^In force$/).count(), `the IRS plan isn’t in force: ${(await irs.innerText()).slice(0, 160)}`);
    const covers = await statIn(irs, 'Covers');
    const month = await statIn(irs, 'Each Month');
    const next = await statIn(irs, 'Next Payment');
    must(/\$[\d,]+\.\d\d/.test(covers), `Covers: ${covers || 'not shown'}`);
    must(/\$[\d,]+\.\d\d/.test(month), `Each Month: ${month || 'not shown'}`);
    must(/[A-Z][a-z]+ \d{1,2}, \d{4}/.test(next), `Next Payment: ${next || 'not shown'}`);
    return `${covers} / ${month} / ${next}`;
  });
}
if (DIR && existsSync(`${DIR}/leave.json`)) {
  await step('[save: leave scenario] school: Your Classes, the first class’s productions, the evaluations', async () => {
    await openSave('leave.json');
    await rail('School'); await tab('Standing And Craft');
    // Each part of the step’s name looked at (from 2026-10-13): until then it found Your Classes, said whether an
    // Evaluations panel was there and passed either way, and never opened the first class’s productions.
    must(await page.getByText('Your Classes', { exact: true }).count(), 'no Your Classes');
    must(await page.getByText(/^Your first class, the class of \d{4}, a year ahead of you since you rejoined on /).count(), 'Your Classes doesn’t name the first class');
    const played = page.locator('details').filter({ has: page.locator('summary', { hasText: /^What The Class Of \d{4} Played Without You$/ }) }).first();
    must(await played.count(), 'no productions of the first class');
    await played.locator('summary').click(); await wait(300);
    const productions = await played.locator('li').allInnerTexts();
    must(productions.length > 0 && productions.every((p) => /, [A-Z][a-z]+ \d{1,2}, \d{4}: \d+ of them/.test(p)), `the first class’s productions: ${productions.join(' | ').slice(0, 200) || 'none'}`);
    // Back from a leave, a term has been evaluated: the panel lists it, each row with its standing.
    const evaluations = page.locator('section.card').filter({ has: page.getByRole('heading', { name: /^Evaluations$/ }) }).first();
    must(await evaluations.count(), 'no Evaluations panel');
    const rows = await evaluations.locator('tbody tr').allInnerTexts();
    must(rows.length > 0, `no term evaluated on a save back from a leave: ${(await evaluations.innerText()).slice(0, 160)}`);
    must(rows.every((r) => /Good Standing|Academic Concern|Academic Warning/.test(r)), `a row with no standing: ${rows.join(' | ').slice(0, 200)}`);
    return `the first class’s ${productions.length} productions; ${rows.length} terms evaluated: ${rows.map((r) => r.split('\t').slice(0, 2).join(' ')).join('; ').slice(0, 200)}`;
  });
  await overflow('school standing (save)');
  await step('[save: leave scenario] casting: the rehearsal controls work, or say why not', async () => {
    await tab('Casting');
    const learn = page.getByRole('button', { name: /^Learn The Part$/ }).first();
    if (!(await learn.count())) skip('no part with calls in this save');
    if (await learn.isDisabled()) {
      const why = await page.locator('.why-not').first().innerText().catch(() => '');
      must(why.length > 0, 'grayed with no reason on the screen');
      return `grayed: ${why}`;
    }
    await learn.click(); await wait(1200);
    return await toast();
  });
  await overflow('school casting (save)');
}
// From the remaining-gaps pass of 2026-10-11: the rehearsal controls carried out, not only found grayed, from a save the
// `rehearsal` scenario wrote mid-rehearsal with the student's own work on the part left undone.
const pctIn = (s) => Number((s.match(/(\d+)%/) ?? [])[1] ?? NaN);
if (DIR && existsSync(`${DIR}/rehearsal.json`)) {
  await step('[save: rehearsal scenario] casting: Learn The Part, and the lines rise on the screen', async () => {
    await openSave('rehearsal.json');
    await rail('School'); await tab('Casting');
    const lines = page.getByText(/^Lines$/).first().locator('xpath=..');
    const before = pctIn(await lines.innerText());
    const learn = page.getByRole('button', { name: /^Learn The Part$/ }).first();
    must(await learn.count() && !(await learn.isDisabled()), 'Learn The Part not available');
    await learn.click(); await wait(1200);
    const said = await toast();
    must(/An hour on the part: lines at \d+%/.test(said), `no confirmation: ${said}`);
    const after = pctIn(await lines.innerText());
    must(after > before, `lines ${before}% → ${after}%`);
    return `${said}; lines ${before}% → ${after}%`;
  });
  await step('[save: rehearsal scenario] casting: Work On The Note, and the note is marked worked on', async () => {
    const work = page.getByRole('button', { name: /^Work On The Note/ }).first();
    must(await work.count() && !(await work.isDisabled()), 'Work On The Note not available');
    // A note on the craft (from 2026-10-12) offers its ways; the second, where there is one, is chosen.
    const ways = page.getByRole('combobox', { name: 'A Way At The Note' }).first();
    const offered = (await ways.count()) ? await ways.locator('option').allInnerTexts() : [];
    if (offered.length > 1) { await ways.selectOption({ index: 1 }); await wait(300); }
    await work.click(); await wait(1200);
    const said = await toast();
    must(/Worked on: the next call will show it|Worked [^:]+: \d+(\.\d)? to \d+(\.\d)?\./.test(said), `no confirmation: ${said}`);
    const keep = page.locator('[data-workbook^="part:"]').getByRole('button', { name: /^Keep It$/ }).first();
    if (await keep.count()) { await keep.click(); await wait(800); }
    must(await page.getByText(/· Worked On/).count(), 'the note isn’t marked worked on');
    must(await work.isDisabled(), 'still offered after it was done');
    return `${offered.length ? `ways offered: ${offered.join(', ')}; ` : ''}${said}`;
  });
  await step('[save: rehearsal scenario] casting: a way of playing chosen, then rehearsed in at the next call', async () => {
    const choose = page.getByRole('button', { name: /^Play It This Way$/ }).first();
    must(await choose.count(), 'no chooser');
    // The first way the material allows: a radio not marked as not fitting.
    const options = page.locator('table input[type=radio]');
    must(await options.count(), 'no ways to choose from');
    await options.first().check(); await wait(300);
    must(!(await choose.isDisabled()), 'Play It This Way still grayed after a choice');
    await choose.click(); await wait(1200);
    const said = await toast();
    must(/Chosen: rehearsed in to \d+%/.test(said), `no confirmation: ${said}`);
    const prepAt = async () => pctIn(((await page.getByText(/Your choice now is rehearsed in to \d+%/).first().innerText().catch(() => '')).match(/rehearsed in to \d+%/) ?? [''])[0]);
    const before = await prepAt();
    // On to the next call, gone to as a player does: Advance, and Go at the commitment. The save is a Saturday and its
    // next call the Tuesday afternoon, so up to five mornings: three stopped short of it (run of 2026-10-11).
    for (let i = 0; i < 5 && (await prepAt()) <= before; i += 1) { await advance('Tomorrow Morning'); await rail('School'); await tab('Casting'); }
    const after = await prepAt();
    must(after > before, `rehearsed in ${before}% → ${after}%`);
    return `${said}; then at the call: ${before}% → ${after}%`;
  });
  await overflow('school casting (rehearsal save)');
}

// A decision taken from its card on Home (from 2026-10-13), which a new life's first day can't show. The save is the
// `nonfiler` scenario's cut in February (`npx vite-node tools/scenarios.ts -- --scenario nonfiler --seed sc-0 --years
// 0.47 --save decision.json`, which stops on 12 February 2027): its TEST SETUP W-2 makes a 2026 return, raised on 1
// February as Your 2026 Tax Return with File It, and nothing has filed it. The step fails, never skips, when the card,
// its button or what it did isn't there: given a directory of saves, a missing decision save is a failure too.
if (DIR) {
  await step('[save: decision scenario] home: Your 2026 Tax Return on its card, File It pressed, the card gone and the return filed', async () => {
    must(existsSync(`${DIR}/decision.json`), 'no decision save: write it with tools/scenarios.ts --scenario nonfiler --years 0.47');
    await openSave('decision.json');
    await rail('Home');
    const cards = page.locator('.decision');
    const before = await cards.count();
    const card = () => cards.filter({ hasText: 'Your 2026 Tax Return' });
    must(await card().count(), `no Your 2026 Tax Return among ${before} decision cards`);
    const file = card().first().getByRole('button', { name: /^File It$/ });
    must(await file.count(), 'the return’s card has no File It');
    await file.click(); await wait(1200); await settleDialogs();
    const after = await cards.count();
    must(after === before - 1 && !(await card().count()), `${before} → ${after} cards after File It, the return’s ${await card().count() ? 'still there' : 'gone'}: ${await toast()}`);
    // What it did, where the return is kept: Papers says it's filed, and the day, where it said when it was due.
    await rail('Papers'); await tab('Tax Returns');
    const head = page.locator('section.card', { has: page.getByRole('heading', { name: '2026 Return', exact: true }) }).locator('.panel-head p').first();
    must(await head.count(), 'no 2026 Return on Tax Returns');
    const said = (await head.innerText()).trim();
    must(/^Filed [A-Z][a-z]+ \d{1,2}, \d{4}$/.test(said), `the 2026 return reads “${said}”`);
    return `${before} → ${after} cards; the 2026 Return: ${said}`;
  });
  await overflow('home and papers (decision save)');
}

// The director's craft note, through the screens (from 2026-10-13, the owner's brief of that day, section 3). The save is
// the `direction` scenario's (`tools/scenarios.ts`): a student cast in the first spring's festival who learns the part
// and catches up the blocking between calls, the notes left to the player, cut at nine on the first weekend morning
// with a craft note given and not worked, two ways or more at it (one a change of how the part is played) and a call
// ahead. No TEST SETUP in it. Every step fails, never skips, when the note, its ways or a control isn't there: given a
// directory of saves, a missing direction save is a failure too.
if (DIR) {
  const noteLine = () => page.getByText(/^The director’s last note,/).first();
  const ways = () => page.getByRole('combobox', { name: 'A Way At The Note' }).first();
  const workNote = () => page.getByRole('button', { name: /^Work On The Note/ }).first();
  const partBook = () => page.locator('[data-workbook^="part:"]').first();
  const history = () => page.locator('details[data-notes]').first();
  const nightNow = async () => Number(((await page.getByText(/^A Night Now$/).first().locator('xpath=..').innerText().catch(() => '')).match(/(\d+\.\d)/) ?? [])[1] ?? NaN);
  const noteCount = async () => { const t = await page.getByText(/^Notes taken: \d+ of \d+\.$/).first().innerText().catch(() => ''); return Number((t.match(/of (\d+)/) ?? [])[1] ?? 0); };
  let first = '';
  let tried = '';
  await step('[save: direction scenario] casting: a craft note from the director, its problem, its place and its figure, not yet worked', async () => {
    must(existsSync(`${DIR}/direction.json`), 'no direction save: write it with tools/scenarios.ts --scenario direction');
    await openSave('direction.json');
    await rail('School'); await tab('Casting');
    must(await noteLine().count(), 'no director’s note on the Casting tab');
    first = (await noteLine().innerText()).replace(/\s+/g, ' ');
    must(/Not Worked On Yet/.test(first), `the note isn’t waiting: ${first}`);
    // A craft note: a note on the lines or the blocking offers no ways.
    must(await ways().count(), 'no ways offered at the note: it isn’t a note on the craft');
    must((await ways().locator('option').count()) >= 2, 'fewer than two ways at the note');
    must(await page.locator('[data-segments]').count(), 'no Part By Part to read the note’s place against');
    return first.slice(0, 200);
  });
  await step('[save: direction scenario] help: the note’s How This Works, a connected system followed and back, the note and its ways as they were', async () => {
    const how = page.getByRole('button', { name: /^How This Works: The Director’s Notes$/ }).first();
    must(await how.count(), 'no How This Works beside the note');
    const way = await ways().inputValue();
    await how.click(); await wait(600);
    must((await entryTitle()) === 'The Director’s Notes', `opened "${await entryTitle()}"`);
    const connected = helpDialog().locator('details.help-section', { hasText: /^Connected Systems/ }).first();
    must(await connected.count(), 'no Connected Systems on the note’s entry');
    await connected.locator('summary').click(); await wait(300);
    const link = connected.locator('button.help-link').first();
    const to = await link.innerText();
    await link.click(); await wait(500);
    must((await entryTitle()) === to, `followed "${to}", showing "${await entryTitle()}"`);
    await helpDialog().getByRole('button', { name: /^Back$/ }).click(); await wait(400);
    must((await entryTitle()) === 'The Director’s Notes', 'Back didn’t return to the note’s entry');
    await page.keyboard.press('Escape'); await wait(500);
    must(/Casting/.test(await page.getByRole('tab', { selected: true }).first().innerText()), 'the Casting tab wasn’t kept');
    must((await noteLine().innerText()).replace(/\s+/g, ' ') === first, 'the note changed while help was open');
    must((await ways().inputValue()) === way, 'the way chosen changed while help was open');
    return `The Director’s Notes → ${to} → Back; the note and its way as they were`;
  });
  let rehearsedIn = NaN;
  await step('[save: direction scenario] casting: the ways inspected, a change of how it’s played tried, its evidence said, and kept', async () => {
    const options = await ways().locator('option').allInnerTexts();
    // A change of how the part is played, which is kept or put back: a segment played another way ("Play The …") or
    // places found to breathe. Until a run of 2026-10-13 this read the way's words beside the list, which for a way
    // played to a side are the side's own, and found none.
    const picked = options.findIndex((o) => /^Play |^Find Places To Breathe/.test(o));
    if (picked >= 0) { await ways().selectOption({ index: picked }); await wait(200); }
    must(picked >= 0, `no way that changes how the part is played among ${options.join(', ')}`);
    tried = options[picked];
    const t0 = await clock();
    must(!(await workNote().isDisabled()), `Work On The Note refused: ${await page.locator('.why-not').allInnerTexts()}`);
    await workNote().click(); await wait(1200); await settleDialogs();
    const said = await toast();
    must(/Worked .+: \d+(\.\d)? to \d+(\.\d)?\. Keep it or put it back, below\./.test(said), `no evidence said, or nothing to keep: ${said}`);
    must(/Worked On/.test(await noteLine().innerText()), 'the note isn’t marked worked on');
    must(await page.getByText(/^Worked .+: [\d.]+ before, [\d.]+ after\.$/).count(), 'the note’s answer isn’t shown');
    must((await partBook().locator('table[data-tries] tbody tr').count()) >= 1, 'the try isn’t in the record');
    const keep = partBook().getByRole('button', { name: /^Keep It$/ }).first();
    must(await keep.count(), 'no Keep It for the change tried');
    await keep.click(); await wait(800);
    must(/Kept: everything after reads it\./.test(await toast()), 'keeping it said nothing');
    const found = (await partBook().innerText()).match(/(\d+)% rehearsed in/);
    rehearsedIn = Number(found?.[1] ?? NaN);
    return `"${tried}" of ${options.length}; ${t0} → ${await clock()}: ${said.slice(0, 120)}; kept${Number.isNaN(rehearsedIn) ? '' : `, ${rehearsedIn}% rehearsed in`}`;
  });
  await step('[save: direction scenario] casting: worked once, Work On The Note is refused, its reason said in words, and pressing it does nothing', async () => {
    // Only once it was worked here: a refusal for another reason (an injury) doesn't show the note can't be worked twice.
    must(tried, 'the note wasn’t worked in the step before, so its refusal shows nothing');
    must(await workNote().isDisabled(), 'Work On The Note still offered after the note was worked');
    const why = (await page.locator('.why-not').allInnerTexts()).join(' ');
    must(/Work On The Note: (?!Not with)/.test(why) || /^Not now: (?!Not with)/.test(why), `no reason said, or one for something else: ${why}`);
    const before = `${await dateText()} ${await clock()}`;
    await workNote().click({ force: true }).catch(() => {}); await wait(600);
    must(`${await dateText()} ${await clock()}` === before, 'pressing the refused control moved the clock');
    return why.slice(0, 160);
  });
  let night = NaN;
  await step('[save: direction scenario] the next call: the change rehearsed in further, the note taken or still there, the night now, and the history', async () => {
    night = await nightNow();
    const notes = await noteCount();
    const callGone = async () => (await noteCount()) > notes || !/Worked On$|Worked On\s*$/.test((await noteLine().innerText()).trim());
    for (let i = 0; i < 5 && !(await callGone()); i += 1) { await advance('Tomorrow Morning'); await rail('School'); await tab('Casting'); }
    must(await callGone(), 'no call came within five mornings');
    // What came of the note: on its own line where it's still the last, or in the notes so far.
    const last = (await noteLine().innerText()).replace(/\s+/g, ' ');
    // From 2026-10-16 a craft note's outcome is one of four: Resolved, Taken: Better, Tried: Learned From, Not Moved, or Not Taken.
    const OUTCOME = /Resolved|Taken: Better|Learned From|Not Taken|· Taken/;
    let outcome = OUTCOME.test(last) && last.includes(first.split(': ').slice(1).join(': ').slice(0, 30)) ? last : '';
    if (!outcome) {
      must(await history().count(), 'the notes so far aren’t shown');
      await history().locator('summary').click(); await wait(300);
      const items = await history().locator('li').allInnerTexts();
      outcome = items.find((x) => /Worked /.test(x) && OUTCOME.test(x)) ?? '';
    }
    must(/at the next call/.test(outcome) && /· (Resolved|Taken: Better|Tried: Learned From, Not Moved|Not Taken|Taken)/.test(outcome), `the worked note’s outcome isn’t said: ${outcome || last}`);
    const after = Number(((await partBook().innerText()).match(/(\d+)% rehearsed in/) ?? [])[1] ?? NaN);
    if (!Number.isNaN(rehearsedIn)) must(after > rehearsedIn, `the kept change wasn’t rehearsed in at the call: ${rehearsedIn}% → ${after}%`);
    const nowNight = await nightNow();
    must(!Number.isNaN(nowNight), 'no A Night Now');
    const follow = /^The director’s last note,.*(Still:|Better since the last note\.)/.test(last) ? 'a follow-up on the same note' : 'a note on another thing';
    return `${outcome.replace(/\s+/g, ' ').slice(0, 160)}; rehearsed in ${rehearsedIn}% → ${after}%; a night now ${night} → ${nowNight}; next: ${follow}`;
  });
  await step('[save: direction scenario] save and exit, Continue: the note’s outcome and the try kept', async () => {
    const tries = await partBook().locator('table[data-tries] tbody tr').count();
    // Their text whether the list is open or closed: it was opened above, and a page opened again shows it closed.
    const seen = (await history().textContent().catch(() => '')) + (await noteLine().textContent());
    await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
    await rail('School'); await tab('Casting');
    must((await partBook().locator('table[data-tries] tbody tr').count()) === tries, 'the tries weren’t kept');
    const again = (await history().textContent().catch(() => '')) + (await noteLine().textContent());
    must(again.replace(/\s+/g, ' ') === seen.replace(/\s+/g, ' '), 'the notes read differently after the reload');
    return `${tries} tries kept, the notes as they were`;
  });
  await step('[save: direction scenario] left unanswered: at the next call the note is not taken, and comes again as still there or is shown so', async () => {
    await openSave('direction.json');
    await rail('School'); await tab('Casting');
    must(/Not Worked On Yet/.test(await noteLine().innerText()), 'the note isn’t waiting');
    const notes = await noteCount();
    for (let i = 0; i < 5 && (await noteCount()) <= notes && /Not Worked On Yet/.test(await noteLine().innerText()); i += 1) { await advance('Tomorrow Morning'); await rail('School'); await tab('Casting'); }
    const last = (await noteLine().innerText()).replace(/\s+/g, ' ');
    let said = /Not Taken/.test(last) ? last : /Still:/.test(last) ? last : '';
    if (!said && await history().count()) {
      await history().locator('summary').click(); await wait(300);
      said = (await history().locator('li').allInnerTexts()).find((x) => /Not Taken/.test(x)) ?? '';
    }
    must(said, `the note left alone isn’t said to be still there: ${last}`);
    return said.replace(/\s+/g, ' ').slice(0, 200);
  });
  await overflow('school casting (direction save)');
}


// Round-ups through the screens (from 2026-10-13, the owner's brief of that day, sections 4 and 5). The save is the
// `roundups` scenario's (`tools/scenarios.ts`): a New Haven student at Citi, round-ups not set up. Citi leaves how often
// and a minimum balance to the customer and states no default, so Round-Ups is refused, with why, until both are made;
// the guide's entry opened from the panel, searched, a connected entry followed and come back from, leaves the choices
// as they were and the clock where it was; turned on, a week moves the tally into savings, and a reload keeps it all.
// Every step fails, never skips, when the save, the panel or a control isn't there.
if (DIR) {
  const panel = () => page.locator('[data-roundups="us-citi"]').first();
  const often = () => panel().getByRole('combobox', { name: 'How Often' }).first();
  const minimum = () => panel().getByRole('spinbutton', { name: 'Minimum Balance' }).first();
  const toggle = () => panel().getByRole('button', { name: /^Round-Ups: (On|Off)/ }).first();
  await step('[save: roundups scenario] bank: Citi’s Spend & Save, its words, its choices, refused with why until they’re made', async () => {
    must(existsSync(`${DIR}/roundups.json`), 'no roundups save: write it with tools/scenarios.ts --scenario roundups');
    await openSave('roundups.json');
    await rail('Money'); await tab('Accounts');
    must(await panel().count(), 'no round-ups on Citi’s Accounts');
    const words = (await panel().innerText()).replace(/\s+/g, ' ');
    must(/Round-Ups, Spend & Save\./.test(words) && /at most \$15 a transfer/.test(words), `not Citi’s words: ${words.slice(0, 200)}`);
    must(await often().count() && await minimum().count(), 'no How Often or Minimum Balance');
    must(await toggle().isDisabled(), 'Round-Ups: Off offered before the choices are made');
    must(/Turn On: Choose how often it moves: daily, weekly\./.test(words) || /Not now: Choose how often it moves: daily, weekly\./.test(words), `no reason said: ${words.slice(0, 400)}`);
    await often().selectOption({ label: 'Weekly' }); await wait(200);
    must(await toggle().isDisabled(), 'turned on with no minimum balance');
    await minimum().fill('49'); await wait(200);
    must(/at least \$50\.00/.test(await panel().innerText()), 'a minimum under $50 isn’t refused with why');
    await minimum().fill('75'); await wait(200);
    must(!(await toggle().isDisabled()), `still refused with the choices made: ${(await panel().innerText()).replace(/\s+/g, ' ').slice(0, 300)}`);
    return words.slice(0, 160);
  });
  await step('[save: roundups scenario] help: the panel’s How This Works, searched, a connected entry and back; the choices and the clock as they were', async () => {
    const t0 = `${await dateText()} ${await clock()}`;
    await panel().getByRole('button', { name: /^How This Works: Round-Ups$/ }).first().click(); await wait(700);
    must((await entryTitle()) === 'Round-Ups', `opened "${await entryTitle()}"`);
    const connected = helpDialog().locator('details.help-section', { hasText: /^Connected Systems/ }).first();
    must(await connected.count(), 'no Connected Systems on Round-Ups');
    await connected.locator('summary').click(); await wait(300);
    const link = connected.locator('button.help-link').first();
    const to = await link.innerText();
    await link.click(); await wait(500);
    must((await entryTitle()) === to, `followed "${to}", showing "${await entryTitle()}"`);
    await helpDialog().getByRole('button', { name: /^Back$/ }).click(); await wait(400);
    must((await entryTitle()) === 'Round-Ups', 'Back didn’t return to Round-Ups');
    await page.locator('#help-q').fill('keep the change'); await page.keyboard.press('Enter'); await wait(400);
    const hits = await helpDialog().locator('ul.help-results button.help-link').allInnerTexts();
    must(hits.some((h) => /^Round-Ups/.test(h)), `searching "keep the change" found ${hits.join(', ') || 'nothing'}`);
    await page.keyboard.press('Escape'); await wait(500);
    must((await often().inputValue()) === 'week' && (await minimum().inputValue()) === '75', 'the choices changed while the guide was open');
    must(`${await dateText()} ${await clock()}` === t0, 'the clock moved while reading');
    return `Round-Ups → ${to} → Back; "keep the change" finds it; Weekly and $75 kept; ${t0}`;
  });
  // A week on, the panel says what came of it: a transfer of up to $15, or, where every purchase was whole dollars (a
  // New Haven student's groceries are $10.00 and a meal $5.00), that they rounded up to nothing. Its first run of
  // 2026-10-13 found the second, and the panel saying neither; it says it now.
  await step('[save: roundups scenario] bank: turned on, a week played: what came of it said, a transfer of up to $15 or purchases that rounded up to nothing', async () => {
    await toggle().click(); await wait(800);
    must(/^Round-Ups: On/.test(await toggle().innerText()), 'it didn’t turn on');
    for (let i = 0; i < 8; i += 1) { await advance('Tomorrow Morning'); await rail('Money'); await tab('Accounts'); }
    const last = (await panel().locator('[data-roundups-last]').innerText().catch(() => '')).replace(/\s+/g, ' ');
    const whole = (await panel().locator('[data-roundups-whole]').innerText().catch(() => '')).replace(/\s+/g, ' ');
    if (last) {
      const moved = Number((last.match(/^Last moved: \$(\d+\.\d\d) into savings/) ?? [])[1] ?? NaN);
      must(moved > 0 && moved <= 15, `not a transfer of up to $15: ${last}`);
      return last;
    }
    const n = Number((whole.match(/^(\d+) purchases since the last transfer were already a multiple of \$1\.00, so rounded up to nothing\.$/) ?? [])[1] ?? NaN);
    must(n >= 7, `a week, and neither a transfer nor whole purchases said: ${whole || '(nothing)'}`);
    return whole;
  });
  await step('[save: roundups scenario] save and exit, Continue: still on, its choices and its last transfer kept', async () => {
    const before = (await panel().innerText()).replace(/\s+/g, ' ');
    await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
    await rail('Money'); await tab('Accounts');
    must(/^Round-Ups: On/.test(await toggle().innerText()), 'off after the reload');
    must((await often().inputValue()) === 'week' && (await minimum().inputValue()) === '75', 'the choices weren’t kept');
    const after = (await panel().innerText()).replace(/\s+/g, ' ');
    must(after === before, `the panel reads differently after the reload: ${after.slice(0, 200)}`);
    return 'kept';
  });
  await overflow('bank accounts (round-ups save)');
}

// The term's warning on coursework and a piece's Shown Today, answered (from 2026-10-16, the owner's brief "Finish School
// Workload Balance"). The save is the `workload` scenario's (`tools/scenarios.ts -- --scenario workload --seed sc-0
// --save workload.json`): a student who prepared everything but the scenes' partner part, stopped the day A Word On Your
// Coursework came, with a scene still short of it. Given a directory of saves, a missing workload save is a failure too.
if (DIR) {
  const forecast = () => page.locator('[data-shown-today]').filter({ hasText: /Run It With A Reader/ }).first();
  const figure = async (id) => Number(((await page.locator(`[data-shown-today="${id}"]`).innerText()).match(/would come to about (\d+\.\d)/) ?? [])[1] ?? NaN);
  let id = '';
  let shown = NaN;
  await step('[save: workload scenario] home: A Word On Your Coursework, how many, the part most often short, what answers it and the review’s day', async () => {
    must(existsSync(`${DIR}/workload.json`), 'no workload save: write it with tools/scenarios.ts --scenario workload');
    await openSave('workload.json');
    await rail('Home');
    const item = page.locator('.list-item').filter({ hasText: /^A Word On Your Coursework/ }).first();
    must(await item.count(), 'no A Word On Your Coursework among the unread on Home');
    const words = (await item.innerText()).replace(/\s+/g, ' ');
    must(/\d+ of the \d+ pieces shown this term so far were Unready\. Most often short on them: [^.]+, on \d+ of the \d+\. .+ answers it\./.test(words), `not its count, cause and remedy: ${words.slice(0, 300)}`);
    must(/The faculty reviews the term on [^:]+: half the term’s pieces Unready by then/.test(words), `no review day: ${words.slice(0, 300)}`);
    await item.getByRole('button', { name: /^Go There$/ }).click(); await wait(1200);
    must(new URL(page.url()).hash.startsWith('#/workspace/school'), `Go There opened ${new URL(page.url()).hash}`);
    return words.slice(0, 220);
  });
  await step('[save: workload scenario] coursework: Due Soonest first, then a scene’s Shown Today, its figure, what holds it back and the part short with its remedy', async () => {
    await tab('Coursework');
    const soonest = (await page.locator('[data-due-soonest] li').first().innerText().catch(() => '')).replace(/\s+/g, ' ');
    must(/^[^:]+: .+, due .+: about \d+\.\d \((Unready|Working|Strong|Exceptional)\) shown today\. Short of complete: /.test(soonest), `no Due Soonest with the piece, its day, its figure and what’s short: ${soonest || '(nothing)'}`);
    must(await forecast().count(), 'no Shown Today naming Run It With A Reader on an open scene');
    id = await forecast().getAttribute('data-shown-today');
    const words = (await forecast().innerText()).replace(/\s+/g, ' ');
    must(/^Shown Today: on a good day it would come to about \d+\.\d \((Unready|Working|Strong|Exceptional)\)\./.test(words), `not its figure and band: ${words}`);
    must(/Short of complete: .*Run It With A Reader/.test(words), `not the part short with its remedy: ${words}`);
    shown = await figure(id);
    return `${soonest.slice(0, 140)} | ${words.slice(0, 200)}`;
  });
  await step('[save: workload scenario] coursework: Run It With A Reader pressed, and Shown Today rises', async () => {
    const panel = page.locator('section.card').filter({ has: page.locator(`[data-shown-today="${id}"]`) }).last();
    let b = panel.getByRole('button', { name: /^Run It With A Reader/ }).first();
    must(await b.count(), 'no Run It With A Reader on the scene');
    let waited = '';
    for (let i = 0; i < 3 && await b.isDisabled(); i += 1) {
      waited += ` [${(await panel.locator('.why-not').first().innerText().catch(() => '')).slice(0, 80)}]`;
      await advance('This Evening'); await rail('School'); await tab('Coursework');
      b = page.locator('section.card').filter({ has: page.locator(`[data-shown-today="${id}"]`) }).last().getByRole('button', { name: /^Run It With A Reader/ }).first();
      shown = await figure(id);
    }
    must(!(await b.isDisabled()), `still grayed:${waited}`);
    await b.click(); await wait(1500); await settleDialogs();
    const after = await figure(id);
    must(after > shown, `Shown Today ${shown} → ${after}`);
    shown = after;
    return `${waited ? `waited for the evening${waited}; ` : ''}${id}: Shown Today rose to ${after}`;
  });
  await step('[save: workload scenario] save and exit, Continue: Shown Today and the warning as they were', async () => {
    const before = (await page.locator(`[data-shown-today="${id}"]`).innerText()).replace(/\s+/g, ' ');
    await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
    await rail('School'); await tab('Coursework');
    const after = (await page.locator(`[data-shown-today="${id}"]`).innerText()).replace(/\s+/g, ' ');
    must(after === before, `${before} → ${after}`);
    return `kept at ${shown}`;
  });
  await overflow('school coursework (workload save)');
}

// From the limitations pass of 2026-10-11: a class left behind, and a return a state assessed itself.
if (DIR && existsSync(`${DIR}/withdraw.json`)) {
  await step('[save: withdraw scenario] school: the class left goes on, and says so', async () => {
    await openSave('withdraw.json');
    await rail('School'); await tab('Standing And Craft');
    must(await page.getByText('Your Classes').count(), 'no Your Classes');
    const said = page.getByText(/who went on without you after you left the School/).first();
    must(await said.count(), 'the class left isn’t said to go on');
    return (await said.innerText()).slice(0, 160);
  });
  await overflow('school standing (withdraw save)');
}
if (DIR && existsSync(`${DIR}/nonfiler.json`)) {
  await step('[save: nonfiler scenario] papers: Connecticut’s own assessment of a return never filed, and its rules in words', async () => {
    await openSave('nonfiler.json');
    await rail('Papers'); await tab('Tax Returns');
    const said = page.getByText(/Assessed by Connecticut DRS with no return from you/).first();
    must(await said.count(), 'no assessment said');
    must(await page.getByText(/12% a year, a month or part, simple/).count(), 'no interest in words');
    return (await said.innerText()).slice(0, 160);
  });
  await overflow('papers tax (nonfiler save)');
}
// From the attributes-and-genres pass of 2026-10-12: a genre's practice brief worked through the Player Profile, from a
// save the `brief` scenario wrote on a free Saturday: choose a genre, inspect its brief, prepare, choose a reading,
// tape, read the result, identify a weakness, train it, tape again, then save, exit and find it all there.
const briefPane = () => page.locator('[data-brief]').first();
const num = (s, re) => Number((s.match(re) ?? [])[1] ?? NaN);
async function openBrief(label) {
  await rail('Player Profile');
  const find = page.locator('#genres-find');
  must(await find.count(), 'no genre search');
  await find.fill(label); await wait(400);
  const rows = page.locator('tr', { has: page.getByRole('button', { name: /^Open Its Brief$/ }) });
  for (let i = 0; i < await rows.count(); i += 1) {
    const r = rows.nth(i);
    if ((await r.locator('td').first().innerText()).trim().replace(/, Loved$/, '') === label) { await r.getByRole('button', { name: /^Open Its Brief$/ }).click(); await wait(600); return; }
  }
  throw new Error(`no ${label} row`);
}
async function briefButton(re) {
  const b = briefPane().getByRole('button', { name: re }).first();
  must(await b.count(), `no button ${re}`);
  must(!(await b.isDisabled()), `${re} grayed: ${await b.getAttribute('title')}`);
  await b.click(); await wait(900); await settleDialogs();
  return await toast();
}
if (DIR && existsSync(`${DIR}/brief.json`)) {
  let first = NaN;
  await step('[save: brief scenario] profile: a genre’s brief opened, the scene and what it asks shown before any time is spent', async () => {
    await openSave('brief.json');
    await openBrief('Drama');
    const text = await briefPane().innerText();
    for (const want of ['The Scene', 'What You Want', 'What’s In The Way', 'Where It Turns', 'What The Take Weighs', 'Preparation', 'Your Reading', 'an original scene written for SLATE']) must(text.toLowerCase().includes(want.toLowerCase()), `no “${want}”`);
    must(/Choose a reading first/.test(text), 'the take isn’t held until a reading is chosen');
    const tape = briefPane().getByRole('button', { name: /^Tape It/ }).first();
    must(await tape.isDisabled(), 'Tape It offered before a reading is chosen');
    return text.split('\n').slice(0, 2).join(' / ').slice(0, 200);
  });
  await step('[save: brief scenario] brief: broken down, lines learned, a reading chosen and rehearsed, each spending its time', async () => {
    const t0 = await clock();
    const a = await briefButton(/^Break It Down/);
    must(/Break It Down: 30 minutes/.test(a), a);
    const b = await briefButton(/^Learn The Lines/);
    must(/Learn The Lines: \d+ minutes/.test(b), b);
    const radios = briefPane().locator('input[type=radio][name^="reading-"]');
    must(await radios.count() >= 2, 'fewer than two readings');
    await radios.nth(1).check(); await wait(300);
    const c = await briefButton(/^Read It This Way$/);
    must(/Reading it as/.test(c), c);
    const d = await briefButton(/^Rehearse It On Your Feet/);
    must(/Rehearse It On Your Feet: 45 minutes/.test(d), d);
    const text = await briefPane().innerText();
    must(/it would come to about \d+\.\d/.test(text), 'no forecast before the take');
    return `${t0} → ${await clock()}; ${text.match(/it would come to about [^.]+\.\d[^.]*\./)?.[0]}`;
  });
  await step('[save: brief scenario] brief: taped, the result read, what held it back and what to work on shown', async () => {
    const said = await briefButton(/^Tape It/);
    first = num(said, /Taped: (\d+\.\d)/);
    must(!Number.isNaN(first), `no result said: ${said}`);
    const text = await briefPane().innerText();
    // Headings render in capitals; their words are what count.
    must(/The Last Take/i.test(text), 'no last take');
    must(/A first take of it\./.test(text), 'its purpose isn’t said');
    must(/held back the|wasn’t complete|didn’t fit/.test(text), 'what held it back isn’t said');
    must(/What To Work On/i.test(text), 'no weakness named');
    must(await briefPane().locator('table[data-takes] tbody tr').count() === 1, 'the take isn’t in the takes table');
    return `${said} / ${text.match(/What To Work On\n[^\n]+/i)?.[0]?.slice(0, 160)}`;
  });
  await step('[save: brief scenario] brief: the weakness trained from the brief, an hour of practice', async () => {
    const open = briefPane().locator('button', { hasText: /…$/ }).first();
    if (!(await open.count())) skip('the weakness named is trained by a workout, not an exercise');
    await open.click(); await wait(400);
    const go = briefPane().getByRole('button', { name: /^Practice An Hour$/ }).first();
    must(await go.count() && !(await go.isDisabled()), `Practice An Hour not available: ${await go.getAttribute('title')}`);
    await go.click(); await wait(1200); await settleDialogs();
    const said = await toast();
    must(/: \+\d/.test(said), `no gain said: ${said}`);
    return said;
  });
  await step('[save: brief scenario] brief: prepared further and taped again, better, and the record says why', async () => {
    await briefButton(/^Break It Down/);
    await briefButton(/^Rehearse It On Your Feet/);
    await briefButton(/^Learn The Lines/);
    const said = await briefButton(/^Tape It/);
    const second = num(said, /Taped: (\d+\.\d)/);
    must(second > first, `${first} → ${second}`);
    const rows = briefPane().locator('table[data-takes] tbody tr');
    must(await rows.count() === 2, 'two takes not kept');
    const top = await rows.first().innerText();
    must(/Better prepared or better able/.test(top), `its purpose: ${top}`);
    return `${first} → ${second}: ${top.replace(/\s+/g, ' ').slice(0, 160)}`;
  });
  await step('[save: brief scenario] brief: Work It Through on its beats: a problem named, a way tried, its evidence shown, kept', async () => {
    const wb = briefPane().locator('[data-workbook^="brief:"]').first();
    if (!(await wb.count())) skip('no Work It Through on the brief');
    return workThrough(wb);
  });
  await step('[save: brief scenario] brief: a classmate chosen to read opposite, taped, the take together said beside your own', async () => {
    const who = briefPane().getByRole('combobox', { name: 'Who Reads Opposite You' }).first();
    if (!(await who.count())) skip('a voice brief: no reader');
    const opts = await who.locator('option').allInnerTexts();
    must(opts.length >= 2, `only ${opts.join(', ')} to read with`);
    await who.selectOption({ index: 1 }); await wait(300);
    const said = await briefButton(/^Read With Them$/);
    must(/Reading with /.test(said), `no confirmation: ${said}`);
    const taped = await briefButton(/^Tape It/);
    must(/Taped: \d+\.\d/.test(taped), `no take: ${taped}`);
    const text = await briefPane().innerText();
    must(/together|Together/.test(text), 'the take together isn’t said');
    return `${said}; ${taped}; ${text.match(/[^\n]*[Tt]ogether[^\n]*/)?.[0]?.slice(0, 160)}`;
  });
  await step('[save: brief scenario] save and exit, Continue: the brief, its takes and its preparation kept', async () => {
    // The takes as they stand before, however many the steps above made (the reader's take, from 2026-10-12, is a third).
    const kept = await briefPane().locator('table[data-takes] tbody tr').count();
    await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
    await openBrief('Drama');
    const rows = briefPane().locator('table[data-takes] tbody tr');
    must(kept >= 2 && await rows.count() === kept, `takes after reload: ${await rows.count()} of ${kept}`);
    must(/Chosen/.test(await briefPane().innerText()), 'the reading chosen isn’t kept');
    return 'kept';
  });
  await overflow('profile brief (brief save)');
}

// From the genre-differentiation pass of 2026-10-16: each genre's register on its brief, through the screens. The
// seven pairs whose briefs once read alike each opened, The Genre Asks read on both and found different; then Nordic
// Noir's brief and Social Realism's, two registers apart, prepared, read, rehearsed and taped, the take's note naming
// the genre's concern where one asked for what held it back, saved, continued, and taped again.
const PAIRS = [['Biker', 'Coming Of Age'], ['Children’s', 'Science Fantasy'], ['Christmas', 'Holiday'], ['Dystopian', 'Medical Drama'], ['Espionage', 'Neorealism'], ['Family', 'Steampunk'], ['Nordic Noir', 'Social Realism']];
async function genreAsks(label) {
  await openBrief(label);
  const text = await briefPane().innerText();
  const at = text.search(/The Genre Asks/i);
  must(at >= 0, `${label}: no The Genre Asks`);
  return text.slice(at, at + 400).split('\n').slice(1, 4).join(' ').trim();
}
if (DIR && existsSync(`${DIR}/brief.json`)) {
  await step('[save: brief scenario] genres: the seven pairs that once read alike each say a different register on their briefs', async () => {
    await openSave('brief.json');
    const said = [];
    for (const [a, b] of PAIRS) {
      const [x, y] = [await genreAsks(a), await genreAsks(b)];
      must(x && y && x !== y, `${a} and ${b} say the same: ${x}`);
      said.push(`${a}: ${x.split(':')[0]} / ${b}: ${y.split(':')[0]}`);
    }
    return said.join('; ').slice(0, 400);
  });
  for (const label of ['Nordic Noir', 'Social Realism']) {
    await step(`[save: brief scenario] genres: ${label}’s brief prepared, read, rehearsed and taped, the note read, saved, continued and taped again`, async () => {
      await openBrief(label);
      await briefButton(/^Break It Down/);
      await briefButton(/^Learn The Lines/);
      const radios = briefPane().locator('input[type=radio][name^="reading-"]');
      await radios.nth(0).check(); await wait(300);
      await briefButton(/^Read It This Way$/);
      await briefButton(/^Rehearse It On Your Feet/);
      const said = await briefButton(/^Tape It/);
      const first = num(said, /Taped: (\d+\.\d)/);
      must(!Number.isNaN(first), `no result said: ${said}`);
      const text = await briefPane().innerText();
      must(/The Last Take/i.test(text), 'no last take');
      must(/held back the|wasn’t complete|didn’t fit|asked more than/.test(text), 'what held it back isn’t said');
      const note = text.match(/[^\n.]*asks for it/)?.[0] ?? '(no concern behind the limit)';
      await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
      await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
      await openBrief(label);
      must(await briefPane().locator('table[data-takes] tbody tr').count() >= 1, 'the take isn’t kept after Continue');
      await briefButton(/^Rehearse It On Your Feet/);
      const again = await briefButton(/^Tape It/);
      must(/Taped: \d+\.\d/.test(again), `no second take: ${again}`);
      must(await briefPane().locator('table[data-takes] tbody tr').count() >= 2, 'two takes not kept');
      return `${said}; ${note.trim().slice(0, 120)}; after Continue: ${again}`;
    });
  }
  // From 2026-10-16: a way of playing read against the scene, and the advice forecast. Melodrama's brief, played the way
  // its scene suits: The Scene names each side's band and what it rests on, the chosen side's rehearsal mark, the take's
  // account of what the way gave apart from what the abilities cost, What To Work On's forecast, kept through a reload.
  await step('[save: brief scenario] interpretation: Melodrama played the way its scene suits, the take saying what the way gave, the advice forecast, saved and continued', async () => {
    await openBrief('Melodrama');
    await briefButton(/^Break It Down/);
    await briefButton(/^Learn The Lines/);
    await briefPane().locator('input[type=radio][name^="reading-"]').nth(0).check(); await wait(300);
    await briefButton(/^Read It This Way$/);
    const row = (side) => briefPane().locator('tr', { has: page.getByText(new RegExp(`^${side}$`)) }).first();
    const band = async (side) => (await row(side).locator('td[data-suit]').getAttribute('data-suit')) ?? '';
    const [ex, re] = [await band('Expansive'), await band('Restrained')];
    must(ex && re, 'no The Scene column');
    must(ex === 'suits' && re !== 'suits', `Melodrama’s scene: expansive ${ex}, restrained ${re}`);
    await briefPane().locator('input[type=radio][name="axis-scale"]').nth(1).check(); await wait(300);
    const mark = (await briefPane().innerText()).match(/This one is complete at (\d+)% rehearsed in: ([^.]+)/);
    must(mark && Number(mark[1]) < 90 && /with the grain/.test(mark[2]), `the mark isn’t said lower with the grain: ${mark?.[0]}`);
    await briefButton(/^Play It This Way$/);
    await briefButton(/^Rehearse It On Your Feet/);
    await briefButton(/^Rehearse It On Your Feet/);
    const said = await briefButton(/^Tape It/);
    must(/Taped: \d+\.\d/.test(said), `no take: ${said}`);
    const text = (await briefPane().innerText()).replace(/\s+/g, ' ');
    const grain = text.match(/Played that way it suited the scene \([^)]*\), which gave it [\d.]+ points; your abilities and techniques cost it [\d.]+\./)?.[0];
    must(grain, `the take doesn’t say what the way gave: ${text.slice(text.indexOf('The Last Take'), text.indexOf('The Last Take') + 400)}`);
    const advice = text.match(/(\d+) hours of its exercise would take it from \d+ to about \d+, worth about [\d.]+ points? a piece/)?.[0];
    must(advice, 'What To Work On isn’t forecast');
    await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
    await openBrief('Melodrama');
    const back = (await briefPane().innerText()).replace(/\s+/g, ' ');
    must(back.includes(grain), 'the take’s account isn’t kept after Continue');
    must(back.includes(advice), 'the advice isn’t the same after Continue');
    return `Expansive ${ex}, Restrained ${re}; ${mark[0]}; ${said}; ${grain.slice(0, 140)}; ${advice}`;
  });
  await overflow('profile brief (genre registers)');
}

// From the remaining-gaps pass of 2026-10-11: a lien's lifecycle and a plan's recovery, carried out through the screens.
const lienLine = () => page.getByText(/Connecticut Tax Lien · /).first();
if (DIR && existsSync(`${DIR}/lien.json`)) {
  await step('[save: lien scenario] papers: Connecticut’s lien filed, its release refused with why until it’s paid', async () => {
    await openSave('lien.json');
    await rail('Papers'); await tab('Tax Returns');
    must(await lienLine().count(), 'no lien shown');
    const said = await lienLine().innerText();
    must(/· Filed\./.test(said) && /recorded with the town clerk/.test(said), `lien said: ${said.slice(0, 200)}`);
    const ask = page.getByRole('button', { name: /^Ask For Its Release$/ }).first();
    must(await ask.isDisabled(), 'release offered before it’s paid');
    const why = page.getByText(/once the balance it secures is paid in full/).first();
    must(await why.count(), 'grayed with no reason on the screen');
    return `${said.slice(0, 120)} / ${(await why.innerText()).slice(0, 120)}`;
  });
  await step('[save: lien scenario] papers: paid in full, then its release asked, and the lien says so', async () => {
    const pay = page.locator('[id^="tax-pay-us-ct-"]').first();
    must(await pay.count(), 'no Connecticut pay field');
    await pay.locator('xpath=ancestor::div[contains(@class,"row")][1]').getByRole('button', { name: /^Pay$/ }).click(); await wait(900);
    const paid = await toast();
    must(/Paid Connecticut DRS in full/.test(paid), `paid: ${paid}`);
    must(/· Paid: Release To Come\./.test(await lienLine().innerText()), `lien: ${(await lienLine().innerText()).slice(0, 160)}`);
    const ask = page.getByRole('button', { name: /^Ask For Its Release$/ }).first();
    must(!(await ask.isDisabled()), 'release still grayed after payment');
    await ask.click(); await wait(900);
    const asked = await toast();
    must(/Asked: released by [A-Z][a-z]+ \d{1,2}, \d{4}/.test(asked), `asked: ${asked}`);
    must(/To be released by/.test(await lienLine().innerText()), 'no release date on the lien');
    must(await ask.isDisabled(), 'release still offered once asked');
    return `${paid} / ${asked}`;
  });
  await step('[save: lien scenario] save and exit, Continue, and weeks on: released', async () => {
    await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
    await rail('Papers'); await tab('Tax Returns');
    must(/To be released by/.test(await lienLine().innerText()), 'the request didn’t survive the reload');
    for (let i = 0; i < 8 && !/· Released\./.test(await lienLine().innerText()); i += 1) { await advance('One Week'); await rail('Papers'); await tab('Tax Returns'); }
    const said = await lienLine().innerText();
    must(/· Released\. .*Released [A-Z][a-z]+ \d{1,2}, \d{4}/s.test(said), `lien: ${said.slice(0, 200)}`);
    must(!(await page.getByRole('button', { name: /^Ask For Its Release$/ }).count()) || await page.getByRole('button', { name: /^Ask For Its Release$/ }).first().isDisabled(), 'release still offered');
    return said.slice(0, 200);
  });
  // The IRS’s own plan, from its own panel (from 2026-10-13): the lien save owes the IRS too and asked for no plan, so
  // its panel says what the plan covers and offers it. Until then no step asked for the IRS plan: the tax-plan save’s
  // pressed Connecticut’s Ask For The Plan, and its IRS step passed on the panel’s heading.
  await step('[save: lien scenario] papers: the IRS plan says it covers federal tax only, a state’s being the state’s, and is applied for from its own panel', async () => {
    await rail('Papers'); await tab('Tax Returns');
    const irs = irsPanel();
    must(await irs.count(), 'no IRS Payment Plan panel');
    must(await irs.getByText(/federal tax only, a state’s being the state’s, with a plan of its own/).count(), 'the IRS plan panel doesn’t say it covers federal tax only');
    const apply = irs.getByRole('button', { name: /^Apply$/ }).first();
    must(await apply.count(), 'no Apply in the IRS plan panel');
    must(!(await apply.isDisabled()), `Apply grayed: ${(await irs.innerText()).slice(-200)}`);
    await apply.click(); await wait(900);
    const said = await toast();
    must(/Applied: answered by [A-Z][a-z]+ \d{1,2}, \d{4}/.test(said), `applied: ${said || 'no toast'}`);
    must(!(await irs.getByRole('button', { name: /^Apply$/ }).count()), 'Apply still offered once applied');
    must(await irs.getByText(/^(With the IRS|In force)$/).count(), `the IRS plan isn’t with the IRS or in force: ${(await irs.innerText()).slice(0, 160)}`);
    return said;
  });
  await overflow('papers tax (lien save)');
}
if (DIR && existsSync(`${DIR}/missed-plan.json`)) {
  await step('[save: missed-plan scenario] papers: the IRS plan in default, caught up, and back in force', async () => {
    await openSave('missed-plan.json');
    await rail('Papers'); await tab('Tax Returns');
    must(await page.getByText(/^Caught Up By$/).count(), 'no Caught Up By date');
    const catchUp = page.getByRole('button', { name: /^Catch Up$/ }).first();
    must(await catchUp.count() && !(await catchUp.isDisabled()), 'Catch Up not available');
    await catchUp.click(); await wait(900);
    const said = await toast();
    must(/Caught up: \$[\d,.]+ paid\./.test(said), `no confirmation: ${said}`);
    must(!(await page.getByRole('button', { name: /^Catch Up$/ }).count()), 'Catch Up still offered');
    must(await page.getByText(/^Next Payment$/).count(), 'no next payment shown');
    await page.getByRole('button', { name: /^Save & Exit$/ }).first().click(); await wait(1500);
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
    await rail('Papers'); await tab('Tax Returns');
    must(!(await page.getByRole('button', { name: /^Catch Up$/ }).count()) && await page.getByText(/^Next Payment$/).count(), 'not in force after the reload');
    return said;
  });
  await overflow('papers tax (missed-plan save)');
}
/**
 * An account kept at home (from 2026-10-16, modules 6 and 7 of that day's banking work): a new life in another slot,
 * born and raised in London, at Yale on an F-1, keeping HSBC UK, made through creation's Before Yale card with its
 * checkboxes ticked from the keyboard; then money moved from Chase to HSBC UK by Move Money, its quote read, and both
 * currencies on the bank screen and Home's money line. Nothing in the steps before it changed.
 */
await step('home account: a London-raised F-1 keeps HSBC UK through Before Yale, moves money to it, and the pounds and dollars both show', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle' }); await wait(1500);
  const slot = page.getByRole('button', { name: /^New Save$/ }).first();
  if (!(await slot.count())) skip('no empty slot for a second life');
  await slot.click(); await wait(1000);
  const billed = page.getByRole('group', { name: 'Billed As' });
  if (await billed.count()) await billed.getByRole('button', { name: 'Actress' }).click();
  if (!(await page.locator('#first').inputValue())) await page.locator('#first').fill('Ada');
  const uk = await page.locator('#born-country option').evaluateAll((os) => os.find((o) => /United Kingdom|Britain/.test(o.textContent ?? ''))?.value);
  must(uk, 'no United Kingdom among the countries');
  await page.locator('#born-country').selectOption(uk); await wait(1500);
  await page.locator('#born-search').fill('London'); await wait(1200);
  const london = page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option', { name: /^London/ }).first();
  must(await london.count(), 'no London, England among the places');
  await london.click(); await wait(500);
  const cont = page.getByRole('button', { name: /^Continue$/ });
  for (let i = 0; i < 3 && !(await page.locator('#lived-born').count()); i += 1) { await cont.click(); await wait(900); }
  must(await page.locator('#lived-born').count(), 'no Before Yale on Starting Point');
  // From the keyboard: focus each box and press Space, as a player without a mouse does.
  await page.locator('#lived-born').focus(); await page.keyboard.press('Space'); await wait(400);
  await page.locator('#kept-account').focus(); await page.keyboard.press('Space'); await wait(400);
  await page.locator('#home-bank').selectOption({ label: 'HSBC UK' }); await wait(400);
  const kept = (await page.getByText(/^Kept At HSBC UK/).first().innerText().catch(() => '')).trim();
  must(/£[\d,]+(\.\d{2})? In /.test(kept), `the savings kept said: ${kept}`);
  await overflow('creation before yale');
  await cont.click(); await wait(900);
  const review = await page.locator('body').innerText();
  must(/Before Yale/.test(review) && /HSBC UK/.test(review), 'Review left out Before Yale or the bank');
  await page.getByRole('button', { name: /^Begin$/ }).click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
  // A new life's guide, read as the guide step reads it, where its controls are locked until it is.
  for (let i = 0; i < 40; i += 1) {
    let b = page.locator('[role=dialog] button', { hasText: /^(I’ve Read It|Next: )/ }).first();
    if (!(await b.count()) || !(await b.isVisible().catch(() => false))) {
      const g = page.getByRole('button', { name: /^Guide \(\d+ Left\)/ }).first();
      if (!(await g.count())) break;
      await g.click({ timeout: 5000 }); await wait(500);
      b = page.locator('[role=dialog] button', { hasText: /^(I’ve Read It|Next: )/ }).first();
      if (!(await b.count())) break;
    }
    await b.click({ timeout: 5000 }); await wait(400);
  }
  await page.keyboard.press('Escape'); await wait(300);
  await rail('Money'); await tab('Accounts');
  const panels = await page.locator('section.card').filter({ hasText: 'Held From Abroad' }).allInnerTexts();
  must(panels.length >= 2, `${panels.length} panels held from abroad`);
  must(panels.every((p) => /£[\d,]+/.test(p) && /in dollars, at SLATE’s rate/.test(p)), 'a home account’s panel without both currencies');
  await page.locator('#move-from').selectOption({ label: (await page.locator('#move-from option', { hasText: 'Chase Total Checking' }).first().innerText()).trim() }); await wait(400);
  await page.locator('#move-to').selectOption({ label: (await page.locator('#move-to option', { hasText: 'HSBC Bank Account' }).first().innerText()).trim() }); await wait(400);
  await page.locator('#move-amount').fill('100'); await wait(500);
  const quote = (await page.locator('p.xs.dim', { hasText: /receives/ }).first().innerText().catch(() => '')).trim();
  must(/\$100\.00/.test(quote) && /£[\d,]+/.test(quote), `the quote said: ${quote}`);
  await overflow('money move abroad');
  await page.getByRole('button', { name: /^Move It/ }).first().click(); await wait(800);
  const sent = await toast();
  must(/Sent \$100(\.00)?: it arrives/.test(sent), `the toast said: ${sent}`);
  await rail('Home');
  const line = (await page.locator('body').innerText()).match(/Chase Total Checking: [^\n]*/)?.[0] ?? '';
  must(/at HSBC UK/.test(line) && /£/.test(line) && /\$/.test(line), `Home's money line said: ${line}`);
  return `${kept} / ${quote} / ${sent} / ${line}`;
});

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
