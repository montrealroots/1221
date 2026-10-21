/**
 * The built app at a width, from the keyboard, on every surface brief 19 added (V17, 2026-10-21). The saves are
 * `make-saves.ts`'s: one life played from its first day at the School to its first pay. Each surface is reached the way
 * a keyboard reaches it (a control focused and Enter, the tabs by the arrow keys, a menu's items by Tab), read as the
 * player has it, pictured, and held to five things:
 *
 * - no page error and no console error;
 * - no sideways scroll (the page no wider than the window);
 * - every control named, and every one reachable by Tab: the Tab key pressed from the top of the page until it comes
 *   round again, each control it reaches noted, and every visible, enabled control it didn't reach listed (a tab the
 *   arrow keys move between, `tabindex="-1"`, is the tablist's own and not counted);
 * - focus visible: each control Tab reached drew the focus ring (`:focus-visible` and an outline);
 * - every grayed control saying why: a disabled button has its reason in its title, and its panel says it in words
 *   ("Not now: …" or "<its label>: …").
 *
 * Nothing that commits is pressed: the stop at a commitment is closed with Escape (Stand Here), the guide's chapters and
 * How This Works' entries are only read. The stop at the meeting is measured too: how far its buttons reach past the
 * dialog's right edge, as built and with the footer's wrapping taken away (`.modal-foot { flex-wrap: nowrap }`), which is
 * how it stood before this walk's fix.
 *
 *   SLATE_BASE=http://localhost:4187 node docs/verification/career-2026-10-20/app/app-walk.mjs OUTDIR WIDTH SAVEDIR
 *
 * Writes OUTDIR/WIDTH/NN-surface.txt (what the screen says, then what was found) and .jpg, and OUTDIR/walk-WIDTH.txt,
 * every surface's findings in one list.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4187';
const [OUT = 'walk', W = '1440', DIR = '.'] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const dir = `${OUT}/${WIDTH}`;
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch(launchOptions());
const view = { width: WIDTH, height: PHONE ? 844 : 900 };
const log = [];
let n = 0;
const clean = (s) => String(s ?? '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

/** A save opened as the game opens a slot: written to the slot, the page reloaded, Continue pressed by the keyboard. */
async function opened(file) {
  const page = await browser.newPage({ viewport: view });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`page error: ${String(e).slice(0, 240)}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console error: ${m.text().slice(0, 240)}`); });
  const text = readFileSync(`${DIR}/${file}`, 'utf8');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
  const cont = page.getByRole('button', { name: /^Continue$/ }).first();
  await cont.focus(); await page.keyboard.press('Enter');
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  return { page, errors, file };
}

/** A control focused and pressed with Enter, as a keyboard presses it. */
async function press(page, locator) { await locator.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500); }

/** A rail destination, by the keyboard: on a phone the menu first. */
async function rail(page, name) {
  const target = page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  if (!(await target.isVisible().catch(() => false))) {
    const menu = page.getByRole('button', { name: /^Menu$/ }).first();
    if (await menu.count()) await press(page, menu);
  }
  await press(page, page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first());
  await page.waitForTimeout(500);
}

/** A screen's tab, from its first by the arrow keys, checking the selection and the focus move with them. */
async function tab(page, list, label, found) {
  const tabs = page.getByRole('tablist', { name: list }).getByRole('tab');
  const names = await tabs.allInnerTexts();
  const target = names.findIndex((x) => clean(x) === label);
  if (target < 0) { found.push(`no ${label} tab on ${list} (tabs: ${names.join(', ')})`); return; }
  await tabs.first().focus(); await page.keyboard.press('Home'); await page.waitForTimeout(200);
  for (let i = 0; i < target; i += 1) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150); }
  await page.waitForTimeout(400);
  const sel = clean(await page.getByRole('tablist', { name: list }).getByRole('tab', { selected: true }).innerText());
  const focus = clean(await page.evaluate(() => document.activeElement?.textContent ?? ''));
  if (sel !== label) found.push(`the arrow keys selected ${sel}, not ${label}`);
  if (focus !== label) found.push(`the focus is on ${focus}, not the ${label} tab`);
}

/** The five checks, on the page or a dialog. */
async function held(page, scope, found) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 1) found.push(`the page scrolls ${over}px sideways`);
  const r = await page.evaluate((sel) => {
    const root = sel ? document.querySelector(sel) : document;
    const visible = (el) => { if (!el.getClientRects().length) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none'; };
    const nameOf = (el) => {
      const own = el.getAttribute('aria-label') || (el.getAttribute('aria-labelledby') ? document.getElementById(el.getAttribute('aria-labelledby'))?.textContent : '');
      if (own) return own.trim();
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) { const l = el.id ? document.querySelector(`label[for="${el.id}"]`) : el.closest('label'); return (l?.textContent ?? el.getAttribute('title') ?? '').trim(); }
      return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    };
    const all = [...root.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]')].filter(visible);
    let i = 0;
    for (const el of all) el.setAttribute('data-w', String(i++));
    // A radio group is one stop for Tab, at its checked radio, or its first where none is checked (the arrow keys move
    // inside it): its others aren't counted. A group is judged where a player sees it, its name within its own table or
    // fieldset, so two groups on a screen that share a name are two groups, each of which needs a stop of its own.
    const box = (el) => el.closest('table, fieldset, [role=radiogroup], form, section') ?? document.body;
    const radioStop = (el) => {
      if (el.type !== 'radio') return true;
      const mates = [...box(el).querySelectorAll('input[type=radio]')].filter((x) => x.name === el.name);
      return mates.some((x) => x.checked) ? el.checked : mates[0] === el;
    };
    const candidates = all.filter((el) => !el.disabled && el.getAttribute('tabindex') !== '-1' && !(el.tagName === 'DIV' && el.getAttribute('role') === 'dialog') && radioStop(el));
    const nameless = all.filter((el) => !nameOf(el)).map((el) => `${el.tagName.toLowerCase()}${el.className ? `.${String(el.className).split(' ')[0]}` : ''}`);
    // A grayed control: its reason in its title, and in words in its panel.
    const grayed = all.filter((el) => el.tagName === 'BUTTON' && el.disabled).map((el) => {
      const label = nameOf(el);
      const panel = el.closest('section, article, .card, [role=dialog], li') ?? el.parentElement;
      const words = [...(panel?.querySelectorAll('.why-not') ?? [])].map((w) => w.textContent ?? '').join(' ');
      const title = el.getAttribute('title') ?? '';
      // Said in words: a "Not now: …" or "<label>: …" line, or the reason itself in the panel's own text.
      return { label, title, said: words.includes(`${label}:`) || words.startsWith('Not now:') || / Not now:/.test(words) || (!!title && (panel?.textContent ?? '').includes(title)) };
    });
    return { candidates: candidates.map((el) => ({ w: el.getAttribute('data-w'), name: nameOf(el).slice(0, 60) })), nameless, grayed, controls: all.length };
  }, scope ?? null);
  for (const x of r.nameless) found.push(`a control with no name: ${x}`);
  for (const g of r.grayed) {
    if (!g.title) found.push(`grayed "${g.label}" has no reason in its title`);
    if (!g.said) found.push(`grayed "${g.label}" has no reason said in its panel`);
  }
  // Tab from the top of the page (or into the dialog) until it comes round again.
  await page.evaluate((sel) => { const root = sel ? document.querySelector(sel) : null; (document.activeElement)?.blur?.(); if (root) root.focus(); else document.body.focus(); }, scope ?? null);
  const reached = new Map();
  let first;
  for (let k = 0; k < 900; k += 1) {
    await page.keyboard.press('Tab');
    const at = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return undefined;
      const s = getComputedStyle(el);
      return { w: el.getAttribute('data-w'), ring: el.matches(':focus-visible') && s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 };
    });
    if (!at || at.w === null) continue;
    if (at.w === first) break;
    first ??= at.w;
    reached.set(at.w, at.ring);
  }
  const unreached = r.candidates.filter((c) => !reached.has(c.w));
  for (const c of unreached) found.push(`Tab never reached "${c.name}"`);
  const ringless = r.candidates.filter((c) => reached.get(c.w) === false);
  for (const c of ringless) found.push(`no focus ring on "${c.name}"`);
  return `${r.controls} controls; Tab reached ${reached.size} of the ${r.candidates.length} it can; ${r.grayed.length} grayed`;
}

/** A surface recorded: its text, a picture, and the checks. */
async function surface(o, name, read, scope) {
  n += 1;
  const found = [];
  const { page, errors } = o;
  let text = '';
  try { text = await read(found); } catch (e) { found.push(`couldn't read it: ${String(e).slice(0, 200)}`); }
  let counts = '';
  try { counts = await held(page, scope, found); } catch (e) { found.push(`couldn't check it: ${String(e).slice(0, 200)}`); }
  found.push(...errors.splice(0));
  const id = `${String(n).padStart(2, '0')}-${name}`;
  await page.screenshot({ path: `${dir}/${id}.jpg`, type: 'jpeg', quality: 55 }).catch(() => {});
  writeFileSync(`${dir}/${id}.txt`, `${name} (${o.file}, ${WIDTH} wide)\n\n${clean(text)}\n\n----- ${counts}\n${found.length ? found.map((f) => `FOUND: ${f}`).join('\n') : 'Nothing found.'}\n`);
  log.push(`${id} (${o.file}): ${counts}${found.length ? `\n  ${found.join('\n  ')}` : ' — nothing found'}`);
  console.log(log.at(-1));
}

const main = (page) => page.locator('main').innerText();

/** Career's five tabs on a save, each its own surface. */
async function career(file, tabs = ['Overview', 'Portfolio', 'Representation', 'Opportunities', 'Work']) {
  const o = await opened(file);
  await rail(o.page, 'Career');
  for (const t of tabs) await surface(o, `career-${t.toLowerCase()}-${file.replace('.json', '')}`, async (found) => { await tab(o.page, 'Career', t, found); return main(o.page); });
  return o;
}

/** The stop at the next commitment, reached by the keyboard: Advance, a line of its menu, On The Way's Advance; read, measured, closed with Escape. */
async function stop(file, line, name) {
  const o = await opened(file);
  const { page } = o;
  await surface(o, `stop-${name}`, async (found) => {
    await press(page, page.locator('.topbar-time').getByRole('button', { name: /^Advance/ }).first());
    for (let k = 0; k < 12; k += 1) {
      const on = clean(await page.evaluate(() => document.activeElement?.textContent ?? ''));
      if (on.startsWith(line)) break;
      await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
    let said = '';
    const way = page.locator('[role=dialog]:visible').last();
    if (await way.count() && /On The Way|passes/.test(await way.innerText())) {
      said += `ON THE WAY\n${await way.innerText()}\n\n`;
      await press(page, way.getByRole('button', { name: /^Advance$/ }).first()); await page.waitForTimeout(1800);
    }
    const dlg = page.locator('[role=dialog]:visible').last();
    if (!(await dlg.count())) { found.push('the clock didn’t stop'); return said; }
    said += `THE STOP\n${await dlg.innerText()}`;
    // The footer against the dialog's right edge: as built, and without the footer's wrapping.
    const measure = () => page.evaluate(() => {
      const d = [...document.querySelectorAll('[role=dialog]')].at(-1);
      const foot = d.querySelector('.modal-foot');
      const box = d.getBoundingClientRect();
      // Past either edge: a row that doesn't fit, pushed to the end (`justify-content: flex-end`), spills off the left.
      const rects = [...foot.querySelectorAll('button')].map((b) => b.getBoundingClientRect());
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      return { past: Math.round(Math.max(box.left - left, right - box.right) * 10) / 10, rows: new Set(rects.map((r) => Math.round(r.top))).size, buttons: [...foot.querySelectorAll('button')].map((b) => (b.getAttribute('aria-label') || b.textContent).trim()) };
    });
    const built = await measure();
    const style = await page.addStyleTag({ content: '.modal-foot { flex-wrap: nowrap !important; }' });
    const before = await measure();
    await style.evaluate((el) => el.remove());
    said += `\n\nMEASURED: buttons ${JSON.stringify(built.buttons)}; as built, ${built.rows} ${built.rows === 1 ? 'row' : 'rows'}, the buttons reach ${built.past}px past the dialog's nearer edge (negative is inside); without the footer's wrapping, ${before.rows} row, ${before.past}px past it`;
    if (built.past > 0) found.push(`the stop's buttons run ${built.past}px past the dialog's edge`);
    return said;
  }, '[role=dialog]:last-of-type');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.close();
}

// ---- Career, its five tabs, as the career goes on --------------------------------------------------------------------
for (const [file, tabs] of [
  ['last-term.json', undefined], ['follow-up.json', ['Representation']], ['meeting.json', ['Representation']],
  ['offered.json', ['Overview', 'Representation']], ['audition.json', ['Opportunities']], ['offer.json', ['Opportunities']],
  ['work-day.json', ['Opportunities', 'Work']], ['paid.json', undefined],
]) {
  const o = await career(file, tabs);
  // His reasons and the agreement, opened by the keyboard where there's an offer.
  if (file === 'offered.json') {
    await surface(o, 'career-representation-reasons-offered', async (found) => {
      await tab(o.page, 'Career', 'Representation', found);
      await press(o.page, o.page.getByRole('button', { name: 'Show The Reasons' }));
      if ((await o.page.getByRole('button', { name: 'Hide The Reasons' }).getAttribute('aria-expanded')) !== 'true') found.push('Show The Reasons opened nothing it says is open');
      return main(o.page);
    });
  }
  await o.page.close();
}

// ---- The School: the showcase on Coursework, Finishing Early on Terms And Award --------------------------------------
for (const [file, tabs] of [['last-term.json', ['Coursework', 'Terms And Award']], ['after-new-york.json', ['Coursework']]]) {
  const o = await opened(file);
  await rail(o.page, 'School');
  for (const t of tabs) await surface(o, `school-${t.toLowerCase().replace(/ /g, '-')}-${file.replace('.json', '')}`, async (found) => { await tab(o.page, 'School', t, found); return main(o.page); });
  await o.page.close();
}

// ---- Papers' Your Work And Your Permission, and Money's pay lines ----------------------------------------------------
{
  const o = await opened('paid.json');
  await rail(o.page, 'Papers');
  await surface(o, 'papers-permission-to-work-paid', async (found) => { await tab(o.page, 'Papers', 'Permission To Work', found); return main(o.page); });
  await rail(o.page, 'Money');
  await surface(o, 'money-statements-paid', async (found) => { await tab(o.page, 'Your Bank', 'Statements', found); return main(o.page); });
  await o.page.close();
}

// ---- The stop at a meeting, an audition and a work day ----------------------------------------------------------------
await stop('meeting.json', 'This Evening', 'meeting');
await stop('audition.json', 'This Evening', 'audition');
await stop('work-day.json', 'This Evening', 'work-day');

// ---- The Calendar with the career's items, and one opened -----------------------------------------------------------
for (const file of ['meeting.json', 'work-day.json']) {
  const o = await opened(file);
  await press(o.page, o.page.getByRole('button', { name: 'Open Calendar' }));
  await o.page.waitForTimeout(800);
  await surface(o, `calendar-${file.replace('.json', '')}`, async () => main(o.page));
  const item = o.page.locator('main .list-item').filter({ hasText: file === 'meeting.json' ? 'Meeting At Stewart Talent' : 'Shoot Day' }).first();
  if (await item.count()) {
    await press(o.page, item);
    await surface(o, `calendar-entry-${file.replace('.json', '')}`, async () => o.page.locator('[role=dialog]:visible').last().innerText(), '[role=dialog]:last-of-type');
    await o.page.keyboard.press('Escape');
  }
  await o.page.close();
}

// ---- The guide's chapters, and the career's How This Works entries ----------------------------------------------------
{
  const o = await opened('last-term.json');
  const { page } = o;
  for (const chapter of ['Drama School', 'Your Career', 'Representation', 'Finding Work']) {
    await press(page, page.getByRole('button', { name: 'Guide' }));
    const g = page.locator('[role=dialog][aria-label=Guide]');
    await press(page, g.getByRole('button', { name: new RegExp(`^\\d+\\. ${chapter},`) }).first());
    // The Details, folded away under each chapter, opened by the keyboard.
    for (const d of await g.locator('details summary').all()) { await d.focus(); await page.keyboard.press('Enter'); }
    await surface(o, `guide-${chapter.toLowerCase().replace(/ /g, '-')}`, async () => {
      const t = await g.innerText();
      return t.slice(t.indexOf('CHAPTER '));
    }, '[role=dialog][aria-label=Guide]');
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  }
  // Every entry of the career's goal (`content/guide/career.ts`) and the showcase's (`content/guide/showcase.ts`).
  const entries = ['The Career Screen', 'Your Professional Profile', 'Headshots', 'Your Résumé', 'Your Reel', 'The Agent And How To Reach Him', 'His Office’s Answers And The Meeting', 'Why It Went This Way', 'The Agreement', 'Your Work And Its Pay', 'Commission', 'Your Unions', 'Finding Work And Submitting', 'Auditions And Callbacks', 'Offers And Booked Work', 'Work While You’re At The School', 'The Actor Showcase'];
  await page.keyboard.press('?'); await page.waitForTimeout(800);
  const help = page.locator('[role=dialog][aria-label="How This Works"]');
  const listed = (await help.getByRole('button').allInnerTexts()).map(clean);
  for (const entry of entries) {
    const b = help.getByRole('button', { name: entry, exact: true }).first();
    if (!(await b.count())) { log.push(`How This Works has no entry called ${entry}; it lists: ${listed.filter((x) => /Career|Agent|Agree|Pay|Union|Role|Audition|Offer|Work|Showcase|Head|Résumé|Reel|Office|Why/.test(x)).join(', ')}`); continue; }
    await press(page, b);
    const all = help.getByRole('button', { name: 'Show Everything' });
    if (await all.count()) await press(page, all);
    await surface(o, `help-${entry.toLowerCase().replace(/[^a-z]+/g, '-')}`, async () => help.innerText(), '[role=dialog][aria-label="How This Works"]');
    const back = help.getByRole('button', { name: /^Back$/ }).first();
    if (await back.count()) await press(page, back); else { await page.keyboard.press('Escape'); await page.keyboard.press('?'); await page.waitForTimeout(500); }
  }
  await page.close();
}

writeFileSync(`${OUT}/walk-${WIDTH}.txt`, `The built app at ${WIDTH} wide (${BASE}): ${n} surfaces.\n\n${log.join('\n')}\n`);
await browser.close();
