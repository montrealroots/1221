/**
 * SLATE — brief 13's interface playthroughs (2026-10-17): one player carried through many steps in order on the built
 * app, through its visible controls only, at a width, each step recorded with what was pressed, what the screen said,
 * the game's clock, and passed or failed. The three playthroughs and what each step must show were written first, in
 * `docs/verification/playthroughs-2026-10-17/interface-criteria.md`, and this plays them as written:
 *
 * - `normal`: a new life made through creation, through orientation week to the first scene shown and its feedback;
 * - `setback`: the `workload` scenario's save, the term's warning on coursework answered through to the scene's showing;
 * - `specialist`: the `specialist` scenario's save, a brief prepared, played, taped, its advice followed, and taped again.
 *
 * From 2026-10-17, brief 14's section 9 adds the three journeys those don't carry, written first in
 * `docs/verification/language-2026-10-17/journeys/criteria.md`, and its language checks, which only they run:
 *
 * - `banking`: the `roundups` save, a transfer refused for more than the account holds and then made, a meal paid by card
 *   pending until it posts, saved and continued, and the month's statement;
 * - `document`: the `brief` save, Connecticut's ID card applied for, on its way, saved and continued, and held;
 * - `health`: the `health` scenario's save, a sprained ankle, what it refuses, its care, the days it mends.
 *
 *   npm run build && npx vite preview --port 4187 --strictPort
 *   npx vite-node tools/scenarios.ts -- --scenario workload --seed sc-0 --save SAVEDIR/workload.json
 *   npx vite-node tools/scenarios.ts -- --scenario specialist --seed sc-0 --save SAVEDIR/specialist.json
 *   npx vite-node tools/scenarios.ts -- --scenario roundups --seed sc-0 --save SAVEDIR/roundups.json
 *   npx vite-node tools/scenarios.ts -- --scenario brief --seed sc-0 --save SAVEDIR/brief.json
 *   npx vite-node tools/scenarios.ts -- --scenario health --seed sc-0 --save SAVEDIR/health.json
 *   SLATE_BASE=http://localhost:4187 node tools/playthroughs-ui.mjs PLAYTHROUGH WIDTH [SAVEDIR] [OUTROOT]
 *
 * It writes OUTROOT/PLAYTHROUGH-WIDTH/trace.json (OUTROOT is `docs/verification/playthroughs-2026-10-17/interface` unless
 * given) and a few milestone screenshots beside it, small: the viewport alone, as JPEG. A step that fails is recorded with
 * a screenshot and the run goes on, so what came after is seen. It exits 1 where a step failed, where any of the six things
 * the brief names has no passed step, or on a page error or a screen past the right edge, and for brief 14's journeys on
 * a language check that fails (a label broken mid-word, a clipped control, a wall of text, a nameless control). Nothing is called on the
 * engine: a save is put in the browser's own store and opened with Continue, as `tools/acceptance-ui.mjs` opens one, and
 * that file's helpers are copied here rather than shared, so its 76 steps are as they were.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { execSync } from 'node:child_process';
import { launchOptions } from './browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4187';
const [WHICH, W = '1440', DIR = '', ROOT = 'docs/verification/playthroughs-2026-10-17/interface'] = process.argv.slice(2);
const SIX = ['navigation', 'drill-down', 'unavailable', 'confirmation', 'notification', 'save-continue'];
/** Brief 14's journeys (from 2026-10-17): the three that also run section 9's language checks. */
const JOURNEYS = ['banking', 'document', 'health'];
if (!['normal', 'setback', 'specialist', ...JOURNEYS].includes(WHICH)) {
  console.error('Usage: node tools/playthroughs-ui.mjs normal|setback|specialist|banking|document|health WIDTH [SAVEDIR] [OUTROOT]');
  process.exit(2);
}
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
const OUT = `${ROOT}/${WHICH}-${WIDTH}`;
mkdirSync(OUT, { recursive: true });
const git = (cmd) => { try { return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

const trace = {
  playthrough: WHICH, width: WIDTH, base: BASE,
  commit: git('rev-parse --short=8 HEAD'),
  // Tracked files changed since that commit: the build served is the tree's, which may be ahead of the commit.
  uncommitted: git('status --porcelain --untracked-files=no').split('\n').filter(Boolean).length,
  startedAt: new Date().toISOString(),
  startingPoint: {}, steps: [], milestones: [], dialogs: [], errors: [], overflows: [],
};

const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
page.on('pageerror', (e) => trace.errors.push(`pageerror: ${String(e).slice(0, 300)}`));
page.on('console', (m) => { if (m.type() === 'error') trace.errors.push(`console: ${m.text().slice(0, 300)}`); });
page.on('response', (r) => { if (r.status() >= 400) trace.errors.push(`http ${r.status()}: ${r.url()}`); });
// A control that isn't there fails its step in seconds, not the default half-minute.
page.setDefaultTimeout(8000);
const wait = (ms) => page.waitForTimeout(ms);
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const must = (cond, why) => { if (!cond) throw new Error(why); };

// --- The record.

let cur;
/** A step: its name, which of the six it exercises, run, and recorded with what it pressed and read, and the clock after. */
async function step(name, six, fn) {
  cur = { n: trace.steps.length + 1, name, exercises: six, pressed: [], said: [] };
  try {
    const note = await fn();
    if (note) said(note);
    cur.ok = true;
  } catch (e) {
    cur.ok = false;
    cur.why = String(e?.message ?? e).split('\n')[0].slice(0, 400);
    await shot(`fail-${cur.n}`, true);
  }
  cur.date = await dateText().catch(() => '');
  cur.clock = await clock().catch(() => '');
  trace.steps.push(cur);
  console.log(`${cur.ok ? 'ok  ' : 'FAIL'} ${cur.n}. ${name}${cur.ok ? '' : `: ${cur.why}`}  [${cur.date} ${cur.clock}]`);
  return cur.ok;
}
/** What the screen said, kept in the step's record. */
const said = (s) => { if (cur) cur.said.push(clean(s).slice(0, 700)); };
/** A control pressed, by its own words. */
async function press(loc, words) {
  const w = words ?? (clean(await loc.innerText().catch(() => '')) || clean(await loc.getAttribute('aria-label').catch(() => ''))).slice(0, 80);
  cur?.pressed.push(w);
  await loc.click();
}
/** A milestone screenshot (or a failed step's), small: the viewport, as JPEG. */
async function shot(name, failed = false) {
  const file = failed ? `${name}.jpg` : `${String(trace.milestones.length + 1).padStart(2, '0')}-${name}.jpg`;
  await page.screenshot({ path: `${OUT}/${file}`, type: 'jpeg', quality: 55 }).catch(() => {});
  const inGame = await page.getByRole('group', { name: 'Time Controls' }).count().catch(() => 0);
  if (!failed) trace.milestones.push({ file, step: cur?.n, at: inGame ? await when().catch(() => '') : '' });
}

/** Anything past the page's right edge outside a region made to scroll (as `tools/acceptance-ui.mjs` reads it). */
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
  if (over.length) trace.overflows.push({ where, step: cur?.n, over });
}

// --- Reading the screen (copied from `tools/acceptance-ui.mjs`).

const toast = async () => (await page.locator('[role="status"], .toast').allInnerTexts().catch(() => [])).map(clean).join(' | ');
/** The newest toast alone: they stack oldest first, and one from a press before can still be showing. */
const newestToast = async () => (await page.locator('.toasts > *').allInnerTexts().catch(() => [])).map(clean).at(-1) ?? '';
const clock = async () => (await page.getByRole('group', { name: 'Time Controls' }).locator('xpath=..').innerText({ timeout: 2000 }).catch(() => '')).match(/\d{1,2}:\d{2}\s?[AP]M/)?.[0] ?? '';
// The game's date as the bar holds it (`.topbar-clock-date`), shown or not: from 2026-10-23 (brief 24) the bar shows it
// only wider than 1024, and in a window 390 wide the first date this read in the header's words was a birth date in a
// card, the same through every step, so a step that moved the day read "still June 14, 2002". Until then the bar showed
// a shortened date there too.
const dateText = async () => ((await page.locator('header.topbar .topbar-clock-date').first().textContent({ timeout: 2000 }).catch(() => '')) ?? '').match(/[A-Z][a-z]+ \d{1,2}, \d{4}/)?.[0] ?? '';
const when = async () => `${await dateText()} ${await clock()}`;
async function rail(name) {
  const b = page.locator('#rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  // The menu opened only where it's shut (from 2026-10-23: a press in its foot can leave it open, and Menu then shut it).
  if (PHONE && !(await b.isVisible().catch(() => false))) { await press(page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first(), 'Menu'); await wait(400); }
  must(await b.count(), `no rail entry ${name}`);
  await press(b, name); await wait(900);
}
/**
 * A control of the bar's secondary side, the guide or Save & Exit, pressed: in the drawer's foot while the rail is a
 * drawer (from brief 23, 2026-10-23), so there the menu is opened first. Until then it stood in the bar at every width,
 * and on brief 23's commit Save & Exit timed out at 390 (brief 22's final runs played again, 2026-10-23).
 */
async function inBar(loc, words) {
  if (!(await loc.isVisible().catch(() => false))) { await press(page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first(), 'Menu'); await wait(400); }
  await press(loc, words);
}
async function tab(name) {
  const t = page.getByRole('tab', { name: new RegExp(`^${name}`) }).first();
  must(await t.count(), `no tab ${name}`);
  await press(t, `${name} (tab)`); await wait(700);
}
const selectedTab = async () => clean(await page.getByRole('tab', { selected: true }).first().innerText({ timeout: 2000 }).catch(() => ''));
const hash = () => new URL(page.url()).hash;

/**
 * Every dialog an advance leaves open: On The Way's Advance, a commitment's Go, else Escape. Each is recorded, its title
 * and what was pressed, so the trace says what the player went to on the way.
 */
async function settle() {
  for (let i = 0; i < 24; i += 1) {
    const d = page.locator('[role=dialog]:visible').last();
    if (!(await d.count()) || !(await d.isVisible().catch(() => false))) return;
    const title = clean((await d.innerText().catch(() => '')).split('\n')[0]).slice(0, 80);
    let pressed = 'Escape';
    for (const name of [/^Advance$/, /^Go$/]) {
      const b = d.getByRole('button', { name }).first();
      if (await b.count()) { pressed = clean(await b.innerText()); await b.click().catch(() => {}); break; }
    }
    if (pressed === 'Escape') await page.keyboard.press('Escape');
    await wait(700);
    trace.dialogs.push({ step: cur?.n, title, pressed, after: await when().catch(() => '') });
    cur?.pressed.push(`${title}: ${pressed}`);
  }
}
async function openAdvance(item) {
  await press(page.getByRole('button', { name: /^Advance/ }).first(), 'Advance'); await wait(300);
  const m = page.getByRole('menuitem', { name: new RegExp(`^${item}`) }).first();
  must(await m.count(), `no Advance item ${item}`);
  await press(m, item); await wait(1500);
}
/** An advance, every stop on the way gone to. */
async function advance(item) { await openAdvance(item); await settle(); }

/** A save written by `tools/scenarios.ts`, put in the browser's store as slot 1 and opened with Continue. */
async function openSave(file) {
  const path = `${DIR}/${file}`;
  must(DIR && existsSync(path), `no save at ${path}: write it with tools/scenarios.ts (see this file's head)`);
  const text = readFileSync(path, 'utf8');
  let seed = '';
  try { seed = JSON.parse(text)?.meta?.seed ?? ''; } catch { /* the seed is a note, not a check */ }
  trace.startingPoint = { kind: 'save', file, bytes: text.length, sha256: createHash('sha256').update(text).digest('hex'), seed };
  // Written over slot 1 in a fresh browser, as `tools/acceptance-ui.mjs` writes it: deleting the store first, while the
  // page holds it open, blocks the delete and the open behind it for good (this tool's first run, which hung there).
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(2000);
  await press(page.getByRole('button', { name: /^Continue$/ }).first(), 'Continue'); await wait(4000);
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 });
}
/** The seed a new life's save holds, read from the browser's store (packed as `src/engine/persistence/local.ts` packs it). */
async function savedSeed() {
  const raw = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('slate', 1); r.onerror = () => res(''); r.onsuccess = () => { try { const g = r.result.transaction('saves', 'readonly').objectStore('saves').get('slate.save.1'); g.onsuccess = () => res(g.result ?? ''); g.onerror = () => res(''); } catch { res(''); } }; })).catch(() => '');
  try {
    const PACKED = 'slate.gz1:';
    const text = String(raw).startsWith(PACKED) ? gunzipSync(Buffer.from(String(raw).slice(PACKED.length), 'base64')).toString('utf8') : String(raw);
    return JSON.parse(text)?.meta?.seed ?? '';
  } catch { return ''; }
}

// --- Home.

// From brief 23 (2026-10-23) Home's notices are Recent Updates, the four most important unread with a run of one notice on
// one line, and every notice is on Updates, reached by View All Updates; What Needs You keeps the questions and what to put
// right. Until then they were What Needs You's rows, six with Show All past them, and this read them there: on brief 23's
// commit it found none, and every step that reads a notice failed (the final runs played again, 2026-10-23).
const recentPanel = () => page.locator('section.card', { has: page.getByRole('heading', { name: 'Recent Updates', exact: true }) }).first();
/** A notice's line on the screen it's read on: Recent Updates' on Home, the list's on Updates. */
const noticeRows = () => recentPanel().locator('.list-item').or(page.locator('ul.notice-list > li.notice'));
const notices = async () => (await noticeRows().allInnerTexts().catch(() => [])).map(clean);
/** Home's notices as a fresh Home draws them, the four most important unread. */
async function homeAsOpened() {
  await rail('Home');
  return notices();
}
const noticeRow = (re) => noticeRows().filter({ has: page.locator('.strong', { hasText: re }) }).first();
/** A notice read by its title, on Home or else on Updates: its title and its words, or why it isn't there. */
async function readNotice(re) {
  await rail('Home');
  const row = noticeRow(re);
  // Past Recent Updates' four, by View All Updates, as a player looking for it does; on Updates, among the unread first
  // and then all of them, a notice already read being there too.
  if (!(await row.count())) await toUpdates(re);
  must(await row.count(), `no notice ${re} on Home or Updates: ${(await notices()).map((n) => n.slice(0, 60)).join(' | ') || 'none'}`);
  const title = clean(await row.locator('.strong').first().innerText());
  const body = clean(await row.locator('.xs.muted, .notice-body').first().innerText().catch(() => ''));
  said(`notice “${title}”: ${body}`);
  return { row, title, body };
}
/** View All Updates pressed from Home, and All pressed there where the unread don't hold the notice. */
async function toUpdates(re) {
  const view = recentPanel().getByRole('button', { name: /^View All Updates$/ });
  if (!(await view.count())) return;
  said(clean(await recentPanel().locator('.panel-foot').innerText().catch(() => '')) || 'View All Updates');
  await press(view, 'View All Updates'); await wait(600);
  if (await noticeRow(re).count()) return;
  const all = page.getByRole('group', { name: 'Show' }).getByRole('button', { name: /^All \(\d+\)$/ });
  if (await all.count()) { await press(all, 'All'); await wait(400); }
}

// --- A look, opened in place.

const lookNamed = (name) => page.locator('.look').filter({ has: page.locator(':scope > .look-head .look-name', { hasText: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }) }).first();
async function openLook(button) {
  const words = clean(await button.innerText());
  await press(button, words); await wait(600);
  const look = page.locator('.look').filter({ has: page.locator(':scope > .look-head .look-name') }).last();
  must(await look.count(), `pressing “${words}” opened nothing`);
  const name = clean(await look.locator(':scope > .look-head .look-name').innerText());
  const kind = clean(await look.locator(':scope > .look-head .eyebrow').innerText().catch(() => ''));
  const summary = clean(await look.locator(':scope > .look-inner > .look-summary').innerText().catch(() => ''));
  must(summary.length > 0, `“${name}” has no summary`);
  said(`look “${name}” (${kind}): ${summary}`);
  return { look: lookNamed(name), name, kind, summary };
}
/** The first way further in a look offers, followed: the look inside it, its trail naming the outer. */
async function wayIn(outer) {
  const way = outer.look.locator(':scope > .look-inner .look-way button.link').first();
  must(await way.count(), `“${outer.name}” offers no way further in`);
  const label = clean(await way.innerText());
  await press(way, label); await wait(500);
  const inner = outer.look.locator('.look').filter({ has: page.locator(':scope > .look-head .look-name') }).first();
  must(await inner.count(), `“${label}” didn’t open inside “${outer.name}”`);
  const name = clean(await inner.locator(':scope > .look-head .look-name').innerText());
  const trail = clean(await inner.locator(':scope > .look-head .look-trail').innerText().catch(() => ''));
  must(trail.includes(outer.name), `the inner look’s trail is “${trail}”, not naming “${outer.name}”`);
  said(`inside “${outer.name}”: “${name}”: ${clean(await inner.locator(':scope > .look-inner > .look-summary').innerText().catch(() => '')).slice(0, 200)}; trail “${trail}”`);
  return name;
}
async function closeLook(name) {
  const before = await when();
  await press(page.getByRole('button', { name: `Close ${name}` }).first(), `Close ${name}`); await wait(400);
  must(!(await lookNamed(name).count()), `“${name}” still open after Close`);
  must((await when()) === before, `the clock moved while a look was open: ${before} → ${await when()}`);
}

// --- Coursework.

const cardOf = (id) => page.locator('section.card').filter({ has: page.locator(`[data-shown-today="${id}"]`) }).last();
const shownToday = async (id) => clean(await page.locator(`[data-shown-today="${id}"]`).innerText({ timeout: 2000 }).catch(() => ''));
// "of 100" from brief 15 (f67198f7), which wrote the figure in whole points for a while; these read NaN until matched to
// them (e5fdacb7), and the figure is a tenth again from brief 15's final runs, as it was before.
const figureOf = (s) => Number((s.match(/would come to about (\d+\.\d) of 100 /) ?? [])[1] ?? NaN);
const bandOf = (s) => (s.match(/would come to about \d+\.\d of 100 \((\w+)\)/) ?? [])[1] ?? '';
/** A card's step buttons: the row under its Shown Today. */
const stepsOf = (card) => card.locator('[data-shown-today] + div').getByRole('button');
const whyOf = async (card) => clean(await card.locator('[data-shown-today] ~ .why-not').first().innerText({ timeout: 1000 }).catch(() => ''));
const partsOf = async (card) => Object.fromEntries((await card.locator('.stat').evaluateAll((els) => els.map((e) => [e.querySelector('.stat-label')?.textContent ?? '', e.querySelector('.stat-value')?.textContent ?? '']))).map(([k, v]) => [clean(k), clean(v)]));
/** A card's title, by its heading. */
const titleOf = async (card) => clean(await card.locator('h2').first().innerText().catch(() => ''));
async function toCoursework() { await rail('School'); await tab('Coursework'); }
/**
 * Every step a piece's card offers that the game allows now, one at a time, each pressed as a player presses it: a
 * partner's request to rehearse answered yes first, as the card asks. Returns what each said.
 */
async function workCard(id, only) {
  const done = [];
  for (let i = 0; i < 10; i += 1) {
    const card = cardOf(id);
    if (!(await card.count())) break;
    const yes = card.getByRole('button', { name: /^Say Yes/ }).first();
    if ((await yes.count()) && !(await yes.isDisabled())) { await press(yes); await wait(1000); await settle(); done.push(`answered yes: ${(await newestToast()).slice(0, 90)}`); continue; }
    // The table work, each question not yet decided answered with its first reading, once the text allows it.
    const open = card.locator(`select[id^="${id}-"]:not([disabled])`).filter({ has: page.locator('option[value=""]:checked') });
    if (!only && await open.count()) {
      const sel = open.first();
      const option = (await sel.locator('option').evaluateAll((os) => os.map((o) => [o.value, o.textContent ?? '']))).find(([v]) => v);
      if (option) {
        await sel.selectOption(option[0]); cur?.pressed.push(`Table Work: ${clean(option[1]).slice(0, 60)}`); await wait(800);
        done.push(`Table Work: ${(await newestToast()).slice(0, 90)}`);
        continue;
      }
    }
    const steps = stepsOf(card);
    let pressed = false;
    for (let j = 0; j < await steps.count(); j += 1) {
      const b = steps.nth(j);
      const label = clean(await b.innerText());
      if (only && !only.test(label)) continue;
      if (await b.isDisabled()) continue;
      await press(b, label); await wait(1300); await settle();
      done.push(`${label}: ${(await newestToast()).slice(0, 120)}`);
      pressed = true;
      break;
    }
    if (!pressed) break;
  }
  return done;
}
/** A grayed control: its reason in words on the screen, and a forced press that leaves the clock where it was. */
async function refused(button, reason) {
  must(await button.count(), 'no such control');
  must(await button.isDisabled(), `“${clean(await button.innerText())}” is offered, not refused`);
  const why = clean(await reason());
  must(why.length > 0, `“${clean(await button.innerText())}” is grayed with no reason on the screen`);
  const before = await when();
  cur?.pressed.push(`${clean(await button.innerText())} (grayed, forced)`);
  await button.click({ force: true }).catch(() => {}); await wait(600);
  must((await when()) === before, `pressing the refused control moved the clock: ${before} → ${await when()}`);
  return why;
}

/** On The Way, asked before an advance past commitments: what it names, then Cancel, and the clock where it was. */
async function onTheWayCancelled(item) {
  const before = await when();
  await openAdvance(item);
  const d = page.getByRole('dialog', { name: 'On The Way' }).first();
  must(await d.isVisible().catch(() => false), `no On The Way before ${item}: ${clean(await page.locator('[role=dialog]:visible').first().innerText().catch(() => 'no dialog'))}`);
  const words = clean(await d.innerText());
  must(/passes \w+ commitments?\. The clock stops at (?:it|each one) so you can choose/.test(words), `On The Way says: ${words.slice(0, 240)}`);
  said(`On The Way: ${words.replace(/^On The Way /, '').slice(0, 400)}`);
  await press(d.getByRole('button', { name: /^Cancel$/ }).first(), 'Cancel'); await wait(600);
  must(!(await page.locator('[role=dialog]:visible').count()), 'a dialog still open after Cancel');
  must((await when()) === before, `Cancel moved the clock: ${before} → ${await when()}`);
  return words;
}

/** Save & Exit, then Continue: the same moment comes back. */
async function saveAndContinue() {
  const before = await when();
  await inBar(page.getByRole('button', { name: /^Save & Exit$/ }).first(), 'Save & Exit'); await wait(1500);
  await press(page.getByRole('button', { name: /^Continue$/ }).first(), 'Continue'); await wait(4000);
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 });
  const after = await when();
  must(before === after, `Save & Exit and Continue: ${before} → ${after}`);
  return after;
}
/** Save & Exit, Delete on the slot, Confirm Deletion read and Keep It, the slot still there, then Continue. */
async function deleteKeptThenContinue() {
  const before = await when();
  await inBar(page.getByRole('button', { name: /^Save & Exit$/ }).first(), 'Save & Exit'); await wait(1500);
  const del = page.getByRole('button', { name: /^Delete$/ }).first();
  must(await del.count(), 'no Delete on the slot');
  await press(del, 'Delete'); await wait(500);
  const d = page.getByRole('dialog', { name: 'Confirm Deletion' });
  must(await d.isVisible().catch(() => false), 'no Confirm Deletion');
  const words = clean(await d.innerText());
  must(/^Delete Slot 1\?/.test(words) && /This deletes (?:.+’s life from the slot, with everything that happened in it|the save in this slot)\./.test(words) && /(SLATE keeps a backup|This slot has no backup)/.test(words), `Confirm Deletion says: ${words.slice(0, 300)}`);
  said(`Confirm Deletion: ${words}`);
  await shot('confirm-deletion');
  await press(d.getByRole('button', { name: /^Keep It$/ }), 'Keep It'); await wait(600);
  must(!(await d.isVisible().catch(() => false)), 'Confirm Deletion still open after Keep It');
  const slot = clean(await page.locator('.slot').first().innerText());
  must(/Continue/.test(slot) && !/New Save/.test(slot), `slot 1 after Keep It: ${slot.slice(0, 160)}`);
  said(`slot 1 kept: ${slot.slice(0, 200)}`);
  await press(page.getByRole('button', { name: /^Continue$/ }).first(), 'Continue'); await wait(4000);
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 });
  const after = await when();
  must(before === after, `Save & Exit, Keep It and Continue: ${before} → ${after}`);
  return after;
}

// ===========================================================================================================
// Playthrough 1: a normal student.
// ===========================================================================================================

async function normal() {
  trace.startingPoint = { kind: 'new life', how: 'creation in a browser with no saves: billed as Actress, the first name as offered, born in New York, the rest as offered' };
  await step('the save slots, emptied first: New Save offered', [], async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('slate'); r.onsuccess = r.onerror = r.onblocked = () => res(undefined); }));
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^New Save$/ }).first().waitFor({ timeout: 20000 });
    return `${await page.getByRole('button', { name: /^New Save$/ }).count()} slots offer New Save`;
  });
  let name = '';
  await step('creation: Continue grayed with what the step needs listed; the five steps; Review names the choices; Begin', ['unavailable'], async () => {
    await press(page.getByRole('button', { name: /^New Save$/ }).first(), 'New Save'); await wait(1000);
    const billed = page.getByRole('group', { name: 'Billed As' });
    if (await billed.count()) await press(billed.getByRole('button', { name: 'Actress' }), 'Actress');
    const first = page.locator('#first');
    name = (await first.inputValue()) || 'Ada';
    await first.fill(''); cur.pressed.push('First Name: cleared'); await wait(300);
    const cont = page.getByRole('button', { name: /^Continue$/ });
    const asks = async () => (await page.locator('li.small').allInnerTexts()).map(clean).filter((t) => /needed|Choose/.test(t));
    const needs = await refused(cont, async () => (await asks()).join(' '));
    must(await first.isVisible(), 'a forced Continue left the first step');
    said(`grayed, the step says: ${needs}`);
    await first.fill(name); cur.pressed.push(`First Name: ${name}`); await wait(300);
    if ((await asks()).some((t) => /born in/.test(t))) {
      await page.locator('#born-search').fill('New York'); cur.pressed.push('Born In: New York'); await wait(800);
      await press(page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first()); await wait(500);
    }
    for (let i = 0; i < 4; i += 1) { must(!(await cont.isDisabled()), `Continue grayed on step ${i + 1}: ${(await asks()).join(' ')}`); await press(cont, 'Continue'); await wait(900); }
    const review = clean(await page.locator('main, body').first().innerText());
    must(review.includes(name) && /New York/.test(review), `Review doesn’t name ${name} or New York: ${review.slice(0, 200)}`);
    await shot('creation-review');
    await press(page.getByRole('button', { name: /^Begin$/ }), 'Begin');
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
    return `began as ${name}`;
  });
  await overflow('home, the first morning');
  await step('the guide: controls locked until its chapters are read; read, none locked', [], async () => {
    const locked = await page.getByText(/^Locked$/i).count();
    let read = 0;
    for (let i = 0; i < 40; i += 1) {
      let b = page.locator('[role=dialog] button', { hasText: /^(I’ve Read It|Next: )/ }).first();
      if (!(await b.count()) || !(await b.isVisible().catch(() => false))) {
        const g = page.getByRole('button', { name: /^Guide \(\d+ Left\)/ }).first();
        if (!(await g.count())) break;
        await inBar(g); await wait(500);
        b = page.locator('[role=dialog] button', { hasText: /^(I’ve Read It|Next: )/ }).first();
        if (!(await b.count())) break;
      }
      if (/I’ve Read It/.test(await b.innerText())) read += 1;
      await b.click({ timeout: 5000 }); await wait(400);
    }
    cur.pressed.push(`I’ve Read It ×${read}`);
    await page.keyboard.press('Escape'); await wait(300);
    const still = await page.locator('.is-locked').count();
    must(still === 0, `${still} controls still locked after ${read} chapters`);
    trace.startingPoint.seed = await savedSeed();
    return `${locked} locked at the start; ${read} chapters read; none locked now`;
  });
  await step('Home, the first morning: Welcome To The Class Of 2029 read; its look opened and closed', ['notification', 'drill-down'], async () => {
    const { row, body } = await readNotice(/^Welcome To The Class Of 2029$/);
    must(/MFA in Acting/.test(body), `the welcome doesn’t name the MFA in Acting: ${body.slice(0, 200)}`);
    const look = await openLook(row.locator('.strong button.link').first());
    // The kind is drawn in capitals by the stylesheet, and innerText reads it so.
    must(look.name === 'Welcome To The Class Of 2029' && look.kind.toLowerCase() === 'notice', `opened “${look.name}” (${look.kind})`);
    must(/^It came in [^.]+(, and it’s your only unread notice|\. It’s \w+ of your [\w,]+ unread notices)\.$/.test(look.summary), `its summary: ${look.summary}`);
    await shot('home-notice-look');
    await closeLook(look.name);
  });
  await step('Home: How You Are’s sentence opened into your own look, Readiness inside it, the outer Close shutting both', ['drill-down'], async () => {
    const how = page.locator('section.card', { has: page.getByRole('heading', { name: 'How You Are', exact: true }) }).first();
    const outer = await openLook(how.locator('p button.link').first());
    const way = outer.look.locator('.look-ways button.link', { hasText: /^Readiness$/ }).first();
    must(await way.count(), `“${outer.name}” offers no way to Readiness`);
    await press(way, 'Readiness'); await wait(500);
    const inner = outer.look.locator('.look').filter({ has: page.locator(':scope > .look-head .look-name', { hasText: /^Readiness$/ }) }).first();
    must(await inner.count(), 'Readiness didn’t open inside the look');
    const trail = clean(await inner.locator('.look-trail').innerText().catch(() => ''));
    must(trail.includes(outer.name), `the inner look’s trail is “${trail}”, not naming “${outer.name}”`);
    said(`Readiness, inside “${outer.name}”: ${clean(await inner.locator('.look-summary').first().innerText())}; trail “${trail}”`);
    await closeLook(outer.name);
    must(!(await page.locator('.look').count()), 'a look still open after the outer Close');
  });
  await step('Tomorrow Morning, asked before the orientation: On The Way names it, Cancel leaves the clock', ['confirmation'], async () => {
    const words = await onTheWayCancelled('Tomorrow Morning');
    must(/Orientation|Registration/i.test(words), `On The Way doesn’t name the orientation: ${words.slice(0, 200)}`);
  });
  await step('Tomorrow Morning, taken: On The Way’s Advance, the orientation’s stop and Go, Tuesday morning; Registration And Your Account on Home', ['confirmation', 'notification'], async () => {
    const day = await dateText();
    await openAdvance('Tomorrow Morning');
    const way = page.getByRole('dialog', { name: 'On The Way' }).first();
    must(await way.isVisible().catch(() => false), 'no On The Way');
    await press(way.getByRole('button', { name: /^Advance$/ }), 'Advance'); await wait(1500);
    const stop = page.locator('[role=dialog]:visible').last();
    must(await stop.count(), 'the clock didn’t stop at the orientation');
    const words = clean(await stop.innerText());
    must(/this needs you now/.test(words) && await stop.getByRole('button', { name: /^Go$/ }).count() && await stop.getByRole('button', { name: /^Stand Here$/ }).count(), `the stop says: ${words.slice(0, 240)}`);
    said(`stopped: ${words.slice(0, 300)}`);
    await press(stop.getByRole('button', { name: /^Go$/ }), 'Go'); await wait(1500); await settle();
    must((await dateText()) !== day && /^7:00\s?AM$/.test(await clock()), `after Go: ${await when()}`);
    const { body } = await readNotice(/^Registration And Your Account$/);
    must(/Your tuition/.test(body) && /Yale Health/.test(body), `the registration notice says: ${body.slice(0, 200)}`);
  });
  await step('the orientation week: each morning to the weekend, each stop gone to', [], async () => {
    const days = [];
    for (let i = 0; i < 6 && !/^Saturday|^Sunday/.test(await weekday()); i += 1) { await advance('Tomorrow Morning'); days.push(await when()); }
    must(/^Saturday/.test(await weekday()), `not at the weekend: ${await when()}`);
    return days.join(' → ');
  });
  let scene = '';
  let sceneTitle = '';
  let due = '';
  await step('the work set: the courses’ notices on Home; Go There opens School; Coursework lists each piece with its day', ['notification', 'navigation'], async () => {
    // The criteria named The Courses And What They Ask; where it isn't listed, the step fails and says what Home lists.
    const { row, body } = await readNotice(/^The Courses And What They Ask$/);
    must(/gave you (its|their) first piece/.test(body), `it says: ${body}`);
    await press(row.getByRole('button', { name: /^Go There$/ }), 'Go There'); await wait(1200);
    must(hash().startsWith('#/workspace/school'), `Go There opened ${hash()}`);
    await tab('Coursework');
    const cards = page.locator('[data-shown-today]');
    must(await cards.count() >= 1, 'no piece on Coursework');
    const titles = [];
    for (let i = 0; i < await cards.count(); i += 1) {
      const id = await cards.nth(i).getAttribute('data-shown-today');
      const c = cardOf(id);
      const t = await titleOf(c);
      const sub = clean(await c.locator('.panel-head p').first().innerText().catch(() => ''));
      titles.push(`${t} (${sub.match(/Due [^·]+/)?.[0]?.trim() ?? 'no day'})`);
      if (!scene && /^Acting I: /.test(t)) { scene = id; sceneTitle = t; due = sub.match(/Due ([^·]+)/)?.[1]?.trim() ?? ''; }
    }
    must(scene, `no Acting I scene among ${titles.join('; ')}`);
    must(titles.every((t) => !/no day/.test(t)), `a piece with no day: ${titles.join('; ')}`);
    return `${titles.length} pieces: ${titles.join('; ')}`;
  });
  await step('the first step of preparation on the scene: its minutes, the clock and its part’s figure; a step refused, its reason on the card', ['unavailable'], async () => {
    must(scene, 'no scene was found in the step before');
    await toCoursework();
    const card = cardOf(scene);
    const was = await partsOf(card);
    const t0 = await clock();
    let first;
    for (let i = 0; i < await stepsOf(card).count(); i += 1) if (!(await stepsOf(card).nth(i).isDisabled())) { first = stepsOf(card).nth(i); break; }
    must(first, `no step the scene allows now: ${await whyOf(card)}`);
    const label = clean(await first.innerText());
    await press(first, label); await wait(1300); await settle();
    const said1 = (await newestToast()).match(new RegExp(`${label}: (\\d+) minutes, (.+?) up (\\d+)%\\.`));
    must(said1, `no word of “${label}” done: ${await newestToast()}`);
    const now = await partsOf(cardOf(scene));
    const part = said1[2];
    must(parseFloat(now[part]) > parseFloat(was[part] ?? '0'), `“${label}” left ${part} at ${was[part]} (now ${now[part]})`);
    must((await clock()) !== t0, `the clock didn’t move from ${t0}`);
    said(`${label}: ${t0} → ${await clock()}; ${part} ${was[part]} → ${now[part]}`);
    await shot('first-preparation');
    // A step the scene refuses now, by its own words under the steps.
    let gray;
    for (let i = 0; i < await stepsOf(cardOf(scene)).count(); i += 1) if (await stepsOf(cardOf(scene)).nth(i).isDisabled()) { gray = stepsOf(cardOf(scene)).nth(i); break; }
    must(gray, 'every step still offered: nothing refused to read');
    const grayLabel = clean(await gray.innerText());
    const why = await refused(gray, async () => {
      const all = await whyOf(cardOf(scene));
      return all.match(new RegExp(`${grayLabel}: [^:]+?(?=( [A-Z][\\w’ ]+: )|$)`))?.[0] ?? (/^Not now: /.test(all) ? all : '');
    });
    return `refused: ${why}`;
  });
  const figures = [];
  await step('to the first showing: each day every step the scene allows, a partner answered, each stop gone to; Shown Today rises on each day of work', [], async () => {
    must(scene, 'no scene was found in the step before');
    for (let day = 0; day < 14; day += 1) {
      await toCoursework();
      // Shown: gone from the open work, or open again to be shown again with its note.
      if (!(await cardOf(scene).count()) || /, To Show Again$/.test(await titleOf(cardOf(scene)))) break;
      const before = figureOf(await shownToday(scene));
      const done = await workCard(scene);
      const after = figureOf(await shownToday(scene));
      figures.push({ at: await when(), before, after, done: done.length });
      said(`${await when()}: ${before} → ${after} (${done.length} steps${done.length ? `: ${done.map((d) => d.split(':')[0]).join(', ')}` : ''})`);
      if (done.length) must(after > before, `${await when()}: ${done.length} steps done and Shown Today ${before} → ${after}`);
      await advance('Tomorrow Morning');
    }
    must(!(await cardOf(scene).count()) || /To Show Again/.test(await titleOf(cardOf(scene))), `the scene is still open after the days: ${await titleOf(cardOf(scene))}`);
    must(figures.some((f) => f.done > 0), 'no day’s work was done on the scene');
    return `${figures.length} days; Shown Today ${figures[0]?.before} → ${figures.at(-1)?.after}`;
  });
  await step('the showing: “Shown: …” on Home, Go There, the scene’s feedback with its band and score; Working or better; steps refused until it’s read', ['notification', 'navigation', 'unavailable'], async () => {
    must(sceneTitle, 'no scene was found before');
    const short = sceneTitle.replace(/^Acting I: /, '');
    const { row, title, body } = await readNotice(new RegExp(`^Shown: ${short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}, (Unready|Working|Strong|Exceptional)$`));
    await shot('showing-notice');
    const band = title.split(', ').at(-1);
    must(/Well prepared: |Simulated note from /.test(body), `the showing’s words: ${body.slice(0, 200)}`);
    await press(row.getByRole('button', { name: /^Go There$/ }), 'Go There'); await wait(1200);
    must(hash().startsWith('#/workspace/school'), `Go There opened ${hash()}`);
    await tab('Coursework');
    // Shown again where the course revises it: the card is open again, “To Show Again”, its steps waiting on the feedback.
    const again = page.locator('section.card').filter({ has: page.locator('h2', { hasText: `${sceneTitle}, To Show Again` }) }).first();
    let feedback = '';
    if (await again.count()) {
      feedback = clean(await again.locator('.eyebrow', { hasText: /^Feedback: / }).first().innerText());
      const gray = again.locator('[data-shown-today] + div').getByRole('button').first();
      const why = await refused(gray, async () => clean(await again.locator('[data-shown-today] ~ .why-not').first().innerText()));
      must(/There’s new feedback on this piece\. Read it, then press Mark As Read\./.test(why), `refused for another reason: ${why}`);
      await press(again.getByRole('button', { name: /^Mark As Read$/ }), 'Mark As Read'); await wait(800);
      must(!/new feedback/.test(clean(await again.locator('[data-shown-today] ~ .why-not').first().innerText({ timeout: 1000 }).catch(() => ''))), 'the steps still wait on the feedback after Mark As Read');
      const note = again.getByRole('button', { name: /^Work On The Note$/ }).first();
      must(await note.count() && !(await note.isDisabled()), `Work On The Note not open after Mark As Read: ${clean(await again.locator('[data-shown-today] ~ .why-not').first().innerText({ timeout: 1000 }).catch(() => ''))}`);
      await press(note, 'Work On The Note'); await wait(1300); await settle();
      said(`To Show Again: refused “${why}”, then Mark As Read, and Work On The Note: ${await newestToast()}`);
    } else {
      const shown = page.locator('section.card', { has: page.getByRole('heading', { name: 'Work Shown', exact: true }) }).first();
      feedback = clean(await shown.innerText().catch(() => '')).slice(0, 300);
    }
    // The eyebrow is drawn in capitals by the stylesheet, and innerText reads it so.
    must(/Feedback: (Unready|Working|Strong|Exceptional), \d+ Of 100|Working|Strong|Exceptional|Unready/i.test(feedback), `no feedback with its band: ${feedback.slice(0, 200)}`);
    said(`feedback: ${feedback.slice(0, 200)}`);
    must(band !== 'Unready', `the scene, prepared every day it was open, was shown ${band}`);
    return `${title}`;
  });
  await overflow('school coursework, after the showing');
  await step('Papers and Money by the rail, and School’s tab kept on the way back', ['navigation'], async () => {
    await rail('School'); await tab('Casting');
    await rail('Papers'); must(hash().startsWith('#/workspace/papers'), `Papers at ${hash()}`);
    await rail('Money'); must(hash().startsWith('#/workspace/bank'), `Money at ${hash()}`);
    await rail('School');
    must(/^Casting/.test(await selectedTab()), `School came back at ${await selectedTab()}`);
    return 'School at Casting, kept across Papers and Money';
  });
  await step('Save & Exit; Delete asked and kept; Continue: the same moment, the scene’s showing as it was', ['confirmation', 'save-continue'], async () => {
    await rail('Home');
    const before = await homeAsOpened();
    const at = await deleteKeptThenContinue();
    await rail('Home');
    const after = await homeAsOpened();
    must(JSON.stringify(after) === JSON.stringify(before), `Home’s notices read differently after Continue: ${after.join(' | ').slice(0, 200)}`);
    trace.startingPoint.seed ||= await savedSeed();
    return `${at}; ${after.length} notices as they were`;
  });
}
const weekday = async () => (await page.locator('header, .topbar, body').first().innerText({ timeout: 2000 })).match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)?.[1] ?? '';

// ===========================================================================================================
// Playthrough 2: a setback and its recovery.
// ===========================================================================================================

async function setback() {
  let scene = '';
  let sceneTitle = '';
  let start = NaN;
  await step('[save: workload scenario] continued: A Word On Your Coursework on Home, its count, its cause, its remedy and the review’s day', ['notification', 'save-continue'], async () => {
    await openSave('workload.json');
    trace.startingPoint.command = 'npx vite-node tools/scenarios.ts -- --scenario workload --seed sc-0 --save SAVEDIR/workload.json';
    const { body } = await readNotice(/^A Word On Your Coursework$/);
    must(/So far this term, \d+ of the \d+ pieces (you’ve shown|due) were Unready/.test(body), `no count: ${body.slice(0, 200)}`);
    must(/(?:The part most often left unfinished was [^,]+, on [^.]+|“[^”]+” was left unfinished on the one you showed Unready)\. To work on it: .*Run It With A Reader.*\./.test(body), `no cause and remedy naming Run It With A Reader: ${body.slice(0, 300)}`);
    must(/(One piece is|(?:Two|Three|Four|Five|Six|Seven|Eight|Nine|\d+) pieces are) set and still to be shown/.test(body), `no pieces still to be shown: ${body.slice(0, 300)}`);
    must(/This is a warning\. The term review is on [A-Z][a-z]+ \d{1,2}, \d{4}\. If half or more of the term’s pieces are Unready or not shown by then, the review would (give you a notice of academic concern|put you on academic warning|keep you on academic warning|dismiss you from the School|not recommend your degree)\./.test(body), `no review day: ${body.slice(0, 400)}`);
    await shot('warning-on-home');
  });
  await step('the warning opened in place: its look, who sent it and when, and Close', ['drill-down'], async () => {
    const row = noticeRow(/^A Word On Your Coursework$/);
    const look = await openLook(row.locator('.strong button.link').first());
    must(look.kind.toLowerCase() === 'notice' && look.name === 'A Word On Your Coursework', `opened “${look.name}” (${look.kind})`);
    const stats = clean(await look.look.locator('.stat').allInnerTexts().then((a) => a.join(' | ')));
    must(/About/i.test(stats) && /Importance/i.test(stats), `the look’s figures: ${stats}`);
    said(`its figures: ${stats}`);
    await closeLook(look.name);
  });
  await step('Go There: School at Coursework; Due Soonest; the scene with a partner the warning names, Shown Today Unready', ['navigation'], async () => {
    const row = noticeRow(/^A Word On Your Coursework$/);
    await press(row.getByRole('button', { name: /^Go There$/ }), 'Go There'); await wait(1200);
    must(hash().startsWith('#/workspace/school'), `Go There opened ${hash()}`);
    await tab('Coursework');
    const soonest = (await page.locator('[data-due-soonest] li').allInnerTexts()).map(clean);
    must(soonest.length > 0 && soonest.every((s) => /, due .+\. Shown today, it would come to about \d+\.\d of 100 \((Unready|Working|Strong|Exceptional)\)\./.test(s)), `Due Soonest: ${soonest.join(' | ').slice(0, 300)}`);
    said(`Due Soonest: ${soonest.join(' | ')}`);
    const forecast = page.locator('[data-shown-today]').filter({ hasText: /Run It With A Reader/ }).first();
    must(await forecast.count(), 'no open scene whose Shown Today names Run It With A Reader');
    scene = await forecast.getAttribute('data-shown-today');
    sceneTitle = await titleOf(cardOf(scene));
    const words = await shownToday(scene);
    start = figureOf(words);
    said(`${sceneTitle}: ${words}`);
    must(bandOf(words) === 'Unready', `the scene stands ${bandOf(words)} when the warning comes`);
    await shot('scene-before-the-remedy');
    return `${sceneTitle}, ${clean(await cardOf(scene).locator('.panel-head p').first().innerText())}: ${start} (Unready)`;
  });
  // The warning's look offers no way further in (it says so: nothing in the world names what a notice is about yet), so
  // the way further in is the scene's own How This Works, as the criteria allow: its entry, a connected system and Back.
  await step('the scene’s How This Works: its entry, a connected system followed and Back, then closed with the tab and the clock as they were', ['drill-down'], async () => {
    const help = () => page.getByRole('dialog', { name: /How This Works/ }).last();
    const title = async () => clean(await help().locator('article.help-entry h3').first().innerText().catch(() => ''));
    const how = cardOf(scene).locator('button[aria-label^="How This Works:"]').first();
    must(await how.count(), 'no How This Works on the scene’s card');
    const t0 = await when();
    await press(how, clean(await how.getAttribute('aria-label'))); await wait(700);
    const first = await title();
    must(first, 'How This Works opened no entry');
    const connected = help().locator('details.help-section', { hasText: /^How It Connects/ }).first();
    must(await connected.count(), `“${first}” shows no How It Connects`);
    await press(connected.locator('summary'), 'How It Connects'); await wait(300);
    const link = connected.locator('button.help-link').first();
    const to = clean(await link.innerText());
    await press(link, to); await wait(500);
    must((await title()) === to, `followed “${to}”, showing “${await title()}”`);
    const trail = clean(await help().getByRole('navigation', { name: 'Help Trail' }).innerText());
    must(trail.includes(first) && trail.includes(to), `the trail says “${trail}”`);
    await press(help().getByRole('button', { name: /^Back$/ }), 'Back'); await wait(400);
    must((await title()) === first, `Back went to “${await title()}”`);
    await page.keyboard.press('Escape'); cur.pressed.push('Escape'); await wait(500);
    must(!(await help().isVisible().catch(() => false)), 'Escape didn’t close the help');
    must(/^Coursework/.test(await selectedTab()), `the tab came back as ${await selectedTab()}`);
    must((await when()) === t0, `the clock moved while reading: ${t0} → ${await when()}`);
    return `${first} → ${to} → Back; trail “${trail}”; Coursework and ${t0} kept`;
  });
  await step('Run It With A Reader: an hour, Shown Today rises; again the same day it’s refused, its reason on the card', ['unavailable'], async () => {
    const reader = cardOf(scene).getByRole('button', { name: /^Run It With A Reader$/ }).first();
    must(await reader.count(), 'no Run It With A Reader on the scene');
    // The save's 9:30 falls in the day's classes, nine to three: refused, its reason said, and on to the evening as the
    // reason says (the criteria didn't foresee it: the probe's times were read in UTC, where classes begin at 13:00).
    const waited = [];
    for (let i = 0; i < 3 && await reader.isDisabled(); i += 1) {
      waited.push(await refused(reader, async () => whyOf(cardOf(scene))));
      await advance('This Evening'); await toCoursework();
      start = figureOf(await shownToday(scene));
    }
    must(!(await reader.isDisabled()), `Run It With A Reader still refused: ${await whyOf(cardOf(scene))}`);
    if (waited.length) said(`refused first: ${waited.join(' / ')}; then the evening`);
    const t0 = await clock();
    await press(reader, 'Run It With A Reader'); await wait(1300); await settle();
    said(await newestToast());
    const after = figureOf(await shownToday(scene));
    must(after > start, `Shown Today ${start} → ${after}`);
    const why = await refused(cardOf(scene).getByRole('button', { name: /^Run It With A Reader$/ }).first(), async () => whyOf(cardOf(scene)));
    must(/Run It With A Reader: You’ve done this today\. It builds over several days, not in one long session\./.test(why) || /^Not now: You’ve done this today/.test(why), `refused for another reason: ${why}`);
    await shot('reader-refused-today');
    return `${t0} → ${await clock()}; Shown Today ${start} → ${after}; then refused: ${why.slice(0, 200)}`;
  });
  // The remedy is done in the evening (above), when nothing lies between it and the morning: so the question is asked the
  // next morning, with the day's classes and calls ahead (the criteria had it asked on the save's own day, before the
  // classes, which the save's 9:30 is already inside).
  await step('the next morning, Tomorrow Morning asked: On The Way lists the day’s classes and calls, Cancel leaves the clock', ['confirmation'], async () => {
    await advance('Tomorrow Morning');
    const words = await onTheWayCancelled('Tomorrow Morning');
    must(/Classes —/.test(words), `On The Way doesn’t list the day’s classes: ${words.slice(0, 300)}`);
  });
  const days = [];
  await step('the days to the scene’s meeting: every step the scene allows each morning, then on, each stop gone to; Shown Today rises on each day of work, Working by the eve', ['confirmation'], async () => {
    let eve = NaN;
    for (let day = 0; day < 16; day += 1) {
      await toCoursework();
      if (!(await cardOf(scene).count())) break;
      const before = figureOf(await shownToday(scene));
      const done = await workCard(scene);
      const words = await shownToday(scene);
      const after = figureOf(words);
      const parts = await partsOf(cardOf(scene));
      days.push({ at: await when(), before, after, band: bandOf(words), done: done.map((d) => d.split(':')[0]), parts });
      said(`${await when()}: ${before} → ${after} (${bandOf(words)}); ${done.length ? done.map((d) => d.split(':')[0]).join(', ') : 'nothing allowed'}; ${Object.entries(parts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      if (done.length) must(after > before, `${await when()}: ${done.length} steps done and Shown Today ${before} → ${after}`);
      eve = after;
      // Tomorrow, On The Way's Advance taken and Go at each stop.
      await advance('Tomorrow Morning');
    }
    must(cur.pressed.some((p) => /^On The Way: Advance$/.test(p)), 'no On The Way taken on the way to the meeting');
    must(eve >= 50, `Shown Today the day before its meeting: ${eve}, short of Working (50)`);
    return `${days.length} days; Shown Today ${start} → ${eve}`;
  });
  await step('the scene shown: “Shown: …, Working or better” on Home; the other pieces shown on the way recorded', ['notification'], async () => {
    const short = sceneTitle.replace(/^[^:]+: /, '').replace(/, To Show Again$/, '');
    // A last advance where the meeting hasn't come yet: the scene's card still open.
    if (await (async () => { await toCoursework(); return cardOf(scene).count(); })()) await advance('Tomorrow Morning');
    const { title, body } = await readNotice(new RegExp(`^Shown: ${short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(, Round [^,]+)?, (Unready|Working|Strong|Exceptional)$`));
    await shot('scene-shown');
    const band = title.split(', ').at(-1);
    const others = (await notices()).filter((n) => /^Shown: /.test(n) && !n.startsWith(title)).map((n) => n.slice(0, 80));
    said(`other pieces shown on the way: ${others.join(' | ') || 'none listed'}`);
    must(band !== 'Unready', `the scene was shown ${band}: ${body.slice(0, 200)}`);
    return `${title}: ${body.slice(0, 200)}`;
  });
  await step('Save & Exit, Continue: the same moment, the showing’s notice and Coursework as they were', ['save-continue'], async () => {
    await rail('Home');
    const before = await homeAsOpened();
    await toCoursework();
    const work = clean(await page.locator('[id^="school-pane-coursework"]').first().innerText().catch(() => ''));
    const at = await saveAndContinue();
    await rail('Home');
    const after = await homeAsOpened();
    must(JSON.stringify(after) === JSON.stringify(before), `Home’s notices read differently after Continue: ${after.length} for ${before.length}`);
    await toCoursework();
    must(clean(await page.locator('[id^="school-pane-coursework"]').first().innerText().catch(() => '')) === work, 'Coursework reads differently after Continue');
    return at;
  });
}

// ===========================================================================================================
// Playthrough 3: a specialist's preparation, performance, advice and training.
// ===========================================================================================================

const briefPane = () => page.locator('[data-brief]').first();
async function openBrief(label) {
  await rail('Player Profile');
  const find = page.locator('#genres-find');
  must(await find.count(), 'no genre search');
  await find.fill(label); cur.pressed.push(`Find A Genre: ${label}`); await wait(400);
  const rows = page.locator('tr', { has: page.getByRole('button', { name: /^Open Its Brief$/ }) });
  for (let i = 0; i < await rows.count(); i += 1) {
    const r = rows.nth(i);
    if (clean(await r.locator('td').first().innerText()).replace(/\s*Mastered$/, '').replace(/, Loved$/, '') === label) { await press(r.getByRole('button', { name: /^Open Its Brief$/ }), `Open Its Brief (${label})`); await wait(700); return; }
  }
  throw new Error(`no ${label} row`);
}
async function briefButton(re) {
  const b = briefPane().getByRole('button', { name: re }).first();
  must(await b.count(), `no button ${re}`);
  must(!(await b.isDisabled()), `${re} grayed: ${await b.getAttribute('title')}`);
  await press(b); await wait(1000); await settle();
  return newestToast();
}
const STRENGTHS = ['Emotional Depth', 'Composure', 'Imagination', 'Presence'];
const abilityRow = (label) => page.locator('tr', { has: page.getByRole('button', { name: new RegExp(`^${label}$`) }) }).first();
const abilityNow = async (label) => Number(clean(await abilityRow(label).locator('td').nth(1).innerText({ timeout: 3000 }).catch(() => '')) || NaN);

async function specialist() {
  let firstTake = NaN;
  let named = '';
  let trains = '';
  await step('[save: specialist scenario] continued: the first term’s showings on Home, one read', ['notification'], async () => {
    await openSave('specialist.json');
    trace.startingPoint.command = 'npx vite-node tools/scenarios.ts -- --scenario specialist --seed sc-0 --save SAVEDIR/specialist.json';
    trace.startingPoint.testSetup = 'emotional depth, composure, imagination and presence at 90; memory, voice, movement, listening, focus, adaptability and discipline at 49 (tools/brief-journeys.ts’s specialist), on the first morning';
    const { title, body } = await readNotice(/^Shown: .+, (Unready|Working|Strong|Exceptional)$/);
    must(/Well prepared: |Simulated note from /.test(body), `the showing’s words: ${body.slice(0, 200)}`);
    return title;
  });
  await step('the Player Profile: the four strengths at 90.0 and the rest about 49; Composure opened, its look, a way further in, Close', ['navigation', 'drill-down'], async () => {
    await rail('Player Profile');
    must(hash().startsWith('#/workspace/profile'), `the Profile at ${hash()}`);
    const levels = {};
    for (const label of [...STRENGTHS, 'Memory', 'Focus', 'Listening And Responsiveness', 'Vocal Expression', 'Physical Expression', 'Adaptability', 'Discipline']) levels[label] = await abilityNow(label);
    said(`abilities: ${Object.entries(levels).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    must(STRENGTHS.every((s) => levels[s] === 90), `the strengths aren’t at 90.0: ${STRENGTHS.map((s) => `${s} ${levels[s]}`).join(', ')}`);
    must(Object.entries(levels).filter(([k]) => !STRENGTHS.includes(k)).every(([, v]) => v >= 45 && v <= 55), 'an unrelated ability isn’t about 49');
    await shot('profile-abilities');
    const look = await openLook(abilityRow('Composure').getByRole('button', { name: /^Composure$/ }));
    must(look.name === 'Composure' && /^You’re at 90\.0 of 100/.test(look.summary), `Composure’s look: ${look.summary}`);
    const body = clean(await look.look.locator(':scope > .look-inner').innerText());
    must(/How it grows\./.test(body) && /To practice it\./.test(body), `the look doesn’t say what develops it or how to practice it: ${body.slice(0, 200)}`);
    await wayIn(look);
    await closeLook('Composure');
    must(!(await page.locator('.look').count()), 'a look still open after Composure’s Close');
  });
  await step('Nordic Noir’s brief: the scene, what the take weighs, its readings; Tape It refused until a reading is chosen', ['unavailable'], async () => {
    await openBrief('Nordic Noir');
    const text = clean(await briefPane().innerText());
    for (const want of ['The Scene', 'What The Tape Is Judged On', 'Your Reading']) must(text.toLowerCase().includes(want.toLowerCase()), `no “${want}”`);
    const tape = briefPane().getByRole('button', { name: /^Tape It/ }).first();
    const why = await refused(tape, async () => (/Choose a reading first\./.test(clean(await briefPane().innerText())) ? 'Choose a reading first.' : ''));
    await shot('brief-before-the-take');
    return `refused: ${why}`;
  });
  await step('prepared: broken down, the lines learned, a reading chosen; the side The Scene says suits it chosen, its mark said; rehearsed on the feet', [], async () => {
    const t0 = await clock();
    said(await briefButton(/^Break It Down/));
    said(await briefButton(/^Learn The Lines/));
    const radios = briefPane().locator('input[type=radio][name^="reading-"]');
    must(await radios.count() >= 1, 'no reading to choose');
    await radios.first().check(); cur.pressed.push(`reading: ${clean(await radios.first().locator('xpath=ancestor::label[1]').innerText().catch(() => 'the first'))}`); await wait(300);
    said(await briefButton(/^Read It This Way$/));
    const row = (side) => briefPane().locator('tr', { has: page.getByText(new RegExp(`^${side}$`)) }).first();
    const suit = async (side) => (await row(side).locator('td[data-suit]').getAttribute('data-suit').catch(() => '')) ?? '';
    const [re, ex] = [await suit('Restrained'), await suit('Expansive')];
    said(`The Scene: Restrained ${re}, Expansive ${ex}`);
    const side = re === 'suits' ? 'Restrained' : ex === 'suits' ? 'Expansive' : '';
    must(side, `neither side of the scale suits the scene: Restrained ${re}, Expansive ${ex}`);
    await row(side).locator('input[type=radio]').check(); cur.pressed.push(`${side} (the side that suits)`); await wait(300);
    const mark = clean(await briefPane().innerText()).match(/This choice is complete once it’s rehearsed to (\d+)%: ([^.]+)/);
    must(mark && /it suits the scene, so it asks less/.test(mark[2]), `the side’s mark isn’t said with the grain: ${mark?.[0]}`);
    said(mark[0]);
    said(await briefButton(/^Play It This Way$/));
    said(await briefButton(/^Rehearse It On Your Feet/));
    must(side === 'Restrained', `the scene suits ${side}, where Nordic Noir’s restraint was expected to suit Restrained`);
    return `${t0} → ${await clock()}; played ${side}`;
  });
  await step('taped: the figure, what the way gave apart from what the abilities cost, what held it back; one take in the table', [], async () => {
    const said1 = await briefButton(/^Tape It/);
    firstTake = Number((said1.match(/Taped: (\d+\.\d)/) ?? [])[1] ?? NaN);
    must(!Number.isNaN(firstTake), `no result said: ${said1}`);
    const text = clean(await briefPane().innerText());
    const grain = text.match(/Played that way, it suited the scene \([^)]*\) and added [\d.]+ points\. Your abilities and techniques cost it [\d.]+ points\./)?.[0];
    must(grain, `the take doesn’t say what the way gave: ${text.slice(text.search(/The Last Take/i), text.search(/The Last Take/i) + 400)}`);
    must(/held back your [a-z]|wasn’t complete|didn’t fit|didn’t suit|asked more than/.test(text), 'what held it back isn’t said');
    must(await briefPane().locator('table[data-takes] tbody tr').count() === 1, 'the take isn’t the one row in the takes table');
    said(grain);
    return said1;
  });
  await step('the advice: What To Work On names what to train, its forecast, what it assumes, and what deserves attention; none of the four strengths', [], async () => {
    const work = briefPane().locator('.eyebrow', { hasText: /^What To Work On$/ }).locator('xpath=../..');
    must(await work.count(), 'no What To Work On on the brief');
    named = clean(await work.locator('p strong').first().innerText());
    const first = clean(await work.locator('p').first().innerText());
    // From brief 16 (2026-10-20) the reasoning is behind Why This Recommendation, opened here as a player opens it.
    const why = work.locator('details[data-why]').first();
    must(await why.count(), 'no Why This Recommendation');
    await press(why.locator('summary'), 'Why This Recommendation'); await wait(300);
    must((await why.getAttribute('open')) !== null, 'Why This Recommendation didn’t open');
    const assumes = clean(await work.locator('[data-assumes]').innerText().catch(() => ''));
    const attention = clean(await work.locator('[data-attention]').innerText().catch(() => ''));
    must(/Estimate: \d+ hours(?:, an hour a day,)? would take it from \d+ to about \d+, worth about [\d.]+ points? a piece on your recent work\.|an estimated [\d.]+ points? a piece for \d+ hours, from \d+ to about \d+\./.test(clean(await work.innerText())), `no estimate in hours and points: ${first.slice(0, 300)}`);
    must(/^(?:Your last piece was |Of your last \d+ pieces, )/.test(assumes), `what it assumes: ${assumes || 'nothing'}`);
    must(/(is|are) worth your time now|^Neither preparation nor training/.test(attention), `what deserves attention: ${attention || 'nothing'}`);
    const ex = work.locator('button', { hasText: /…$/ }).first();
    trains = (await ex.count()) ? clean(await ex.innerText()).replace(/…$/, '') : '';
    said(`${first} / ${assumes} / ${attention} / its exercise: ${trains || 'none offered here'}`);
    await shot('take-and-advice');
    must(!STRENGTHS.includes(named), `the advice names ${named}, one of the specialist’s strengths at 90`);
    return `names ${named}${trains ? `, trained by ${trains}` : ''}`;
  });
  let level0 = NaN;
  await step('trained: the exercise the advice names, an hour at a time until the day’s practice is spent; then refused, its reason under it', ['unavailable'], async () => {
    must(trains, `What To Work On offers no exercise for ${named}`);
    // Its level before the hours, read on the Profile to the tenth (the forecast's words round it to the whole).
    await rail('Player Profile');
    level0 = await abilityNow(named);
    said(`${named} before the hours: ${level0}`);
    await openBrief('Nordic Noir');
    const work = briefPane().locator('.eyebrow', { hasText: /^What To Work On$/ }).locator('xpath=../..');
    await press(work.locator('button', { hasText: /…$/ }).first(), `${trains}…`); await wait(400);
    const go = () => work.getByRole('button', { name: /^Practice An Hour$/ }).first();
    const gains = [];
    for (let i = 0; i < 6 && !(await go().isDisabled()); i += 1) {
      await press(go(), 'Practice An Hour'); await wait(1300); await settle();
      const t = await newestToast();
      must(new RegExp(`^${trains}: \\+\\d+\\.\\d\\d\\.$`).test(t), `no gain said: ${t}`);
      gains.push(t.replace(/\.$/, ''));
    }
    must(gains.length >= 1, `Practice An Hour refused before any hour: ${await go().getAttribute('title')}`);
    const why = await refused(go(), async () => clean(await go().locator('xpath=following-sibling::span[contains(@class,"dim")][1]').innerText().catch(() => '')));
    must(/You’ve practiced 4 hours today|too tired|at .+ until|asleep/.test(why), `refused for an unexpected reason: ${why}`);
    return `${gains.length} hours (${gains.join(', ')}); then refused: ${why}`;
  });
  await step('One Week, asked: On The Way lists Monday’s labs, Cancel leaves the clock', ['confirmation'], async () => {
    // Each commitment listed by its course and its time. (The criteria said “labs”, the engine's kind for them; the list
    // names them by their course, and the run of 2026-10-17 found the tool's first check looking for the word.)
    const words = await onTheWayCancelled('One Week');
    must(/— September 14, 2026 at \d{1,2}:\d{2}\s?[AP]M/.test(words), `On The Way lists nothing on Monday 14 September: ${words.slice(0, 300)}`);
  });
  await step('Sunday: Tomorrow Morning, the exercise practiced again, and what it trains higher than at the first take', [], async () => {
    const day = await dateText();
    await advance('Tomorrow Morning');
    must((await dateText()) !== day, `still ${day}`);
    await openBrief('Nordic Noir');
    const work = briefPane().locator('.eyebrow', { hasText: /^What To Work On$/ }).locator('xpath=../..');
    const ex = work.locator('button', { hasText: new RegExp(`^${trains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}…$`) }).first();
    const go = () => work.getByRole('button', { name: /^Practice An Hour$/ }).first();
    let gains = 0;
    // The exercise as it was left the day before, open, or its name to open it by.
    if ((await go().count()) || (await ex.count())) {
      if (!(await go().count())) { await press(ex, `${trains}…`); await wait(400); }
      for (let i = 0; i < 4 && !(await go().isDisabled()); i += 1) { await press(go(), 'Practice An Hour'); await wait(1300); await settle(); said(await newestToast()); gains += 1; }
    } else said(`What To Work On no longer names ${named}: ${clean(await work.locator('p').first().innerText()).slice(0, 200)}`);
    await rail('Player Profile');
    const now = await abilityNow(named);
    said(`${named} now ${now}, from ${level0} before Saturday’s hours`);
    must(gains > 0, 'no hour practiced on Sunday');
    must(now > level0, `${named} at ${now}, not above ${level0}`);
    return `${gains} hours more; ${named} ${now}`;
  });
  await step('taped again: prepared further, the second take above the first, two rows, the newest better prepared or better able; the advice read again', [], async () => {
    await openBrief('Nordic Noir');
    for (const re of [/^Break It Down/, /^Learn The Lines/, /^Rehearse It On Your Feet/]) {
      const b = briefPane().getByRole('button', { name: re }).first();
      if ((await b.count()) && !(await b.isDisabled())) said(await briefButton(re));
    }
    const said2 = await briefButton(/^Tape It/);
    const second = Number((said2.match(/Taped: (\d+\.\d)/) ?? [])[1] ?? NaN);
    const rows = briefPane().locator('table[data-takes] tbody tr');
    must(await rows.count() === 2, `${await rows.count()} takes in the table`);
    const top = clean(await rows.first().innerText());
    must(/Better prepared or better able/.test(top), `the newest take’s purpose: ${top}`);
    const work = briefPane().locator('.eyebrow', { hasText: /^What To Work On$/ }).locator('xpath=../..');
    said(`What To Work On now: ${clean(await work.innerText().catch(() => '')).slice(0, 400)}`);
    await shot('second-take');
    must(second > firstTake, `the second take ${second} isn’t above the first ${firstTake}`);
    return `${firstTake} → ${second}: ${top.slice(0, 160)}`;
  });
  await step('Save & Exit; Delete asked and kept; Continue: the same moment, the brief’s two takes, its reading and its last take as they were', ['confirmation', 'save-continue'], async () => {
    const before = clean(await briefPane().innerText());
    const at = await deleteKeptThenContinue();
    await openBrief('Nordic Noir');
    const after = clean(await briefPane().innerText());
    must(await briefPane().locator('table[data-takes] tbody tr').count() === 2, 'the two takes weren’t kept');
    const last = (s) => s.slice(s.search(/The Last Take/i), s.search(/The Last Take/i) + 300);
    must(last(after) === last(before), `the last take reads differently: ${last(after).slice(0, 160)}`);
    must(/Chosen/.test(after), 'the reading chosen isn’t kept');
    return at;
  });
}

// ===========================================================================================================
// Brief 14's journeys (from 2026-10-17): section 9's banking, document and health journeys, and its language checks.
// They find a control by its role, its element id or its place in a panel, and check a sentence against what it must
// agree with elsewhere (a figure, a date, a name, the same refusal word for word), since the money, school and profile
// areas merge their new words after these were written. Each word they still match is listed in
// `docs/verification/language-2026-10-17/journeys/README.md`, Matchers.
// ===========================================================================================================

/** What section 9's checks found, each once a run: `fails` fail the run, `recorded` are for a reader to judge. */
const lang = { fails: [], recorded: [] };
const langSeen = new Set();
function langNote(fail, kind, where, what) {
  const key = `${kind}|${what}`;
  if (langSeen.has(key)) return;
  langSeen.add(key);
  (fail ? lang.fails : lang.recorded).push({ kind, step: cur?.n, where, what });
}
/** The roles a control or a container a player reaches must be named in (Playwright's ARIA snapshot names them as the browser does). */
const NAMED_ROLES = 'button|link|tab|menuitem|menuitemcheckbox|menuitemradio|textbox|searchbox|combobox|listbox|option|checkbox|radio|switch|slider|spinbutton|dialog';
/**
 * Section 9's language checks on the screen as it stands, with any dialog or menu open (criteria.md, The Language
 * Checks): a label's word split across two lines; a control past the screen's edge outside a region made to scroll, cut
 * off by its container, or with its words wider than it; a block of running text over 120 words (80 to 120 recorded as
 * long); a control with no accessible name. A label that wraps between words is recorded, not failed.
 */
async function language(where) {
  const found = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = { broken: [], wrapped: [], clipped: [], walls: [], long: [] };
    const shown = (el) => { const r = el.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return false; const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none'; };
    const words = (s) => (s.match(/\S+/g) ?? []).length;
    const said = (el) => (el.innerText ?? '').replace(/\s+/g, ' ').trim();
    const tag = (el) => (el.getAttribute('role') ?? el.tagName.toLowerCase());
    // A label's words, each read for the lines it lies on.
    for (const el of document.querySelectorAll('button, [role=tab], [role=menuitem], a, h1, h2, h3, h4, label, th, summary, .eyebrow, .stat-label, .chip')) {
      if (!shown(el)) continue;
      const scope = el.matches('[role=menuitem]') ? (el.querySelector('.menu-item-label') ?? el) : el;
      const label = said(scope).slice(0, 90);
      if (!label) continue;
      // Each run of its words read for the lines it lies on: a label laid out in two parts, a name over a subtitle, isn't
      // a label that wraps; one run of words on two lines is.
      let wraps = 0;
      let broken = '';
      const walk = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const tops = new Set();
        for (const m of (n.textContent ?? '').matchAll(/\S+/g)) {
          const r = document.createRange();
          r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
          const lines = new Set([...r.getClientRects()].filter((x) => x.width > 0.5).map((x) => Math.round(x.top)));
          lines.forEach((y) => tops.add(y));
          if (lines.size > 1 && !broken) broken = m[0];
        }
        wraps = Math.max(wraps, tops.size);
      }
      // A break at a hyphen or a slash is where a word may wrap; anywhere else, it breaks the label.
      if (broken && !/[-‐–—/]/.test(broken)) out.broken.push(`${tag(el)} “${label}”: “${broken}” split across two lines`);
      else if (wraps > 1 && el.matches('button:not(.link), [role=tab], [role=menuitem], th, .stat-label, .chip, .eyebrow')) out.wrapped.push(`${tag(el)} “${label}” on ${wraps} lines`);
    }
    // A control past the edge, cut off, or with its words wider than it.
    for (const el of document.querySelectorAll('button, [role=tab], [role=menuitem], select, input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea')) {
      if (!shown(el)) continue;
      const r = el.getBoundingClientRect();
      const name = (said(el) || el.getAttribute('aria-label') || el.id || tag(el)).slice(0, 80);
      let scrolls = false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll') { scrolls = true; break; }
        if (o === 'hidden' || o === 'clip') {
          const pr = p.getBoundingClientRect();
          if (r.right > pr.right + 1 || r.left < pr.left - 1) out.clipped.push(`${tag(el)} “${name}” cut off by the ${p.tagName.toLowerCase()}${p.className ? `.${String(p.className).split(' ')[0]}` : ''} around it`);
          break;
        }
      }
      if (!scrolls && getComputedStyle(el).position !== 'fixed' && (r.right > vw + 1 || r.left < -1)) out.clipped.push(`${tag(el)} “${name}” past the screen’s edge`);
      const s = getComputedStyle(el);
      if (!el.matches('select, input, textarea') && el.scrollWidth > el.clientWidth + 1 && (s.overflowX === 'hidden' || s.overflowX === 'clip' || s.textOverflow === 'ellipsis')) out.clipped.push(`${tag(el)} “${name}”: its words wider than it`);
    }
    // Running text: each block that holds no other block, its words counted.
    const BLOCK = new Set(['block', 'list-item', 'table-cell', 'flex', 'grid', 'table', 'flow-root']);
    const all = [...document.body.querySelectorAll('*')].filter((el) => shown(el) && BLOCK.has(getComputedStyle(el).display));
    const parents = new Set();
    for (const el of all) for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { if (parents.has(p)) break; parents.add(p); }
    for (const el of all) {
      if (parents.has(el) || el.matches('button, [role=menuitem], select, option, script, style')) continue;
      const t = said(el);
      const n = words(t);
      if (n > 120) out.walls.push(`${n} words in one ${tag(el)}: “${t.slice(0, 110)}…”`);
      else if (n >= 80) out.long.push(`${n} words in one ${tag(el)}: “${t.slice(0, 110)}…”`);
    }
    return out;
  }).catch((e) => ({ error: String(e).slice(0, 200) }));
  if (found.error) { langNote(true, 'check failed', where, found.error); return; }
  for (const w of found.broken) langNote(true, 'label broken', where, w);
  for (const w of found.clipped) langNote(true, 'control clipped', where, w);
  for (const w of found.walls) langNote(true, 'wall of text', where, w);
  for (const w of found.wrapped) langNote(false, 'label wraps', where, w);
  for (const w of found.long) langNote(false, 'long text', where, w);
  const snap = await page.locator('body').ariaSnapshot({ timeout: 8000 }).catch(() => '');
  const lines = snap.split('\n');
  lines.forEach((line, i) => {
    const m = line.match(new RegExp(`^\\s*- (${NAMED_ROLES})(\\s*$|\\s*\\[|:)`));
    if (m) langNote(true, 'no accessible name', where, `a ${m[1]}${line.includes('[') ? ` ${line.slice(line.indexOf('['))}` : ''}, after “${clean(lines.slice(Math.max(0, i - 2), i).join(' ')).slice(0, 120)}”`);
  });
}
/** A journey's step, and section 9's checks on the screen it ends on. */
async function play(name, six, fn) {
  const ok = await step(name, six, fn);
  await language(`after step ${trace.steps.length}`);
  await overflow(`after step ${trace.steps.length}`);
  return ok;
}

/** Money as the screen writes it, as a number of its units: “−$1,234.50” is −1234.5. */
const amountOf = (s) => { const m = String(s).match(/([−-])?\s*[$£€]\s?([\d,]+(?:\.\d+)?)/); return m ? (m[1] ? -1 : 1) * Number(m[2].replace(/,/g, '')) : NaN; };
/** Every amount of money a text gives, in its order. */
const amountsIn = (s) => [...String(s).matchAll(/[$£€]\s?[\d,]+(?:\.\d\d)?/g)].map((m) => amountOf(m[0]));
const DATE = /[A-Z][a-z]+ \d{1,2}, \d{4}/g;
/** Every date a text gives, as the game writes one (“October 9, 2026”), in its order. */
const datesIn = (s) => String(s).match(DATE) ?? [];
const dayOf = (d) => Date.parse(`${d} 12:00 UTC`);
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A screen's tab by its element id (`<screen>-tab-<id>`), checked selected: the tab's words are the area's to change. */
async function tabById(screen, id) {
  const t = page.locator(`#${screen}-tab-${id}`).first();
  must(await t.count(), `no tab #${screen}-tab-${id}`);
  await press(t, `${clean(await t.innerText())} (tab)`); await wait(700);
  must(await t.getAttribute('aria-selected') === 'true', `#${screen}-tab-${id} isn’t selected after pressing it`);
}
const panelWith = (inner) => page.locator('section.card', { has: inner }).first();
const panelHeaded = (title) => page.locator('section.card', { has: page.getByRole('heading', { name: title, exact: true }) }).first();
/** The newest toast's words and its tone (`data-tone`, positive or negative): a refusal is told by its tone, not its words. */
async function newestToastWithTone() {
  const t = page.locator('.toasts > .toast').last();
  if (!(await t.count())) return { text: '', tone: '' };
  return { text: clean(await t.innerText().catch(() => '')), tone: (await t.getAttribute('data-tone').catch(() => '')) ?? '' };
}
/** A notice by its title, on Home or else on Updates, or nothing (until brief 23, on Home with Show All). */
async function findNotice(re) {
  await rail('Home');
  if (await noticeRow(re).count()) return noticeRow(re);
  await toUpdates(re);
  return (await noticeRow(re).count()) ? noticeRow(re) : undefined;
}
/** Look After Yourself opened: the menu, for a step to read and press in. */
async function lookAfterMenu() {
  await press(page.getByRole('button', { name: /^Look After Yourself/ }).first(), 'Look After Yourself'); await wait(500);
  const menu = page.getByRole('menu', { name: 'Look After Yourself' }).first();
  must(await menu.isVisible().catch(() => false), 'Look After Yourself didn’t open');
  return menu;
}
/** A menu item's reason, or what it would do: its last part after the time and the price (“1 hr · <reason>”). */
const itemWhy = async (item) => clean(await item.locator('.menu-item-detail').first().innerText().catch(() => '')).split(' · ').at(-1) ?? '';
/** Work Out in Look After Yourself, read and closed: offered or not, and its reason. */
async function workOut() {
  const menu = await lookAfterMenu();
  const item = menu.getByRole('menuitem', { name: /^Work Out/ }).first();
  must(await item.count(), 'no Work Out in Look After Yourself');
  const state = { refused: await item.isDisabled(), why: await itemWhy(item) };
  await page.keyboard.press('Escape'); await wait(300);
  if (await menu.isVisible().catch(() => false)) await press(page.getByRole('button', { name: /^Look After Yourself/ }).first(), 'Look After Yourself');
  return state;
}
/** How This Works from a panel: its entry, a connected entry from How It Connects and Back, closed with the tab and the clock as they were. */
async function helpRoundTrip(button, tabSelected) {
  const help = () => page.getByRole('dialog', { name: /How This Works/ }).last();
  const title = async () => clean(await help().locator('article.help-entry h3').first().innerText().catch(() => ''));
  must(await button.count(), 'no How This Works here');
  const t0 = await when();
  await press(button, clean(await button.getAttribute('aria-label'))); await wait(700);
  const first = await title();
  must(first, 'How This Works opened no entry');
  await language('How This Works, its entry');
  const connected = help().locator('details.help-section', { hasText: /^How It Connects/ }).first();
  must(await connected.count(), `“${first}” shows no How It Connects`);
  await press(connected.locator('summary'), 'How It Connects'); await wait(300);
  const link = connected.locator('button.help-link').first();
  must(await link.count(), `“${first}” connects to nothing`);
  const to = clean(await link.innerText());
  await press(link, to); await wait(500);
  must((await title()) === to, `followed “${to}”, showing “${await title()}”`);
  const trail = clean(await help().getByRole('navigation', { name: 'Help Trail' }).innerText());
  must(trail.includes(first) && trail.includes(to), `the trail says “${trail}”`);
  await language('How This Works, a connected entry');
  await press(help().getByRole('button', { name: /^Back$/ }), 'Back'); await wait(400);
  must((await title()) === first, `Back went to “${await title()}”`);
  await page.keyboard.press('Escape'); cur.pressed.push('Escape'); await wait(500);
  must(!(await help().isVisible().catch(() => false)), 'Escape didn’t close the help');
  must(await tabSelected(), 'the tab came back changed');
  must((await when()) === t0, `the clock moved while reading: ${t0} → ${await when()}`);
  return `${first} → ${to} → Back; trail “${trail}”`;
}
/**
 * On The Way asked before an advance, as `onTheWayCancelled` asks it, then Cancel and the clock where it was. Where the
 * advance isn't asked first and the clock runs to a commitment and stops there, Stand Here leaves it waiting at that stop
 * and the step fails, saying so, so the journey goes on from a moment it can name.
 */
async function askedFirst(item) {
  const before = await when();
  await openAdvance(item);
  const d = page.getByRole('dialog', { name: 'On The Way' }).first();
  if (!(await d.isVisible().catch(() => false))) {
    const stop = page.locator('[role=dialog]:visible').last();
    const words = clean(await stop.innerText().catch(() => '')) || 'no dialog';
    const stand = stop.getByRole('button', { name: /^Stand Here$/ }).first();
    const stood = (await stand.count()) > 0;
    if (stood) { await press(stand, 'Stand Here'); await wait(700); }
    throw new Error(`${item} wasn’t asked first: the clock ran from ${before} to ${await when()} and stopped at “${words.slice(0, 220)}”${stood ? '; Stand Here pressed' : ''}`);
  }
  await language('On The Way');
  const words = clean(await d.innerText());
  must(/passes \w+ commitments?\. The clock stops at (?:it|each one) so you can choose/.test(words), `On The Way says: ${words.slice(0, 240)}`);
  said(`On The Way: ${words.replace(/^On The Way /, '').slice(0, 400)}`);
  await press(d.getByRole('button', { name: /^Cancel$/ }).first(), 'Cancel'); await wait(600);
  must(!(await page.locator('[role=dialog]:visible').count()), 'a dialog still open after Cancel');
  must((await when()) === before, `Cancel moved the clock: ${before} → ${await when()}`);
  return words;
}
/** Each morning by Tomorrow Morning, every stop gone to, until `done` says so or the days run out: the mornings taken. */
async function mornings(most, done) {
  for (let i = 1; i <= most; i += 1) {
    await advance('Tomorrow Morning');
    if (await done(i)) return i;
  }
  return most + 1;
}

// ===========================================================================================================
// Playthrough 4: a banking action with a restriction and a pending state.
// ===========================================================================================================

const movePanel = () => panelWith(page.locator('#move-amount'));
/** Each everyday account by Move Money's From list, which gives each one's balance: name → balance. */
async function balances() {
  const options = (await page.locator('#move-from option').allInnerTexts()).map(clean);
  return Object.fromEntries(options.map((o) => [o.split(' ···')[0], amountsIn(o).at(-1)]));
}
const statementPanel = () => panelWith(page.locator('#statement-account'));
/** The statement on screen: its figures by label, and its lines, each with its date, what, amount, the balance after, and the day it posts where it's pending. */
async function statementNow() {
  const panel = statementPanel();
  const figures = Object.fromEntries((await panel.locator('.stat').evaluateAll((els) => els.map((e) => [e.querySelector('.stat-label')?.textContent ?? '', e.querySelector('.stat-value')?.textContent ?? '']))).map(([k, v]) => [clean(k), clean(v)]));
  const rows = panel.locator('.statement-lines > .row-between.small');
  const lines = [];
  for (let i = 0; i < await rows.count(); i += 1) {
    const cells = (await rows.nth(i).locator(':scope > span').allInnerTexts()).map(clean);
    const note = clean(await rows.nth(i).locator(':scope > span').nth(1).locator('.xs').first().innerText({ timeout: 500 }).catch(() => ''));
    const memo = clean(await rows.nth(i).locator(':scope > span').nth(1).locator('button.link').first().innerText({ timeout: 500 }).catch(() => cells[1]));
    lines.push({ i, date: cells[0], memo, what: cells[1], amount: amountOf(cells[2]), after: amountOf(cells[3]), pending: /Pending/i.test(note), posts: /Pending/i.test(note) ? datesIn(note)[0] ?? '' : '' });
  }
  return { figures, lines, period: clean(await page.locator('#statement-period option:checked').innerText().catch(() => '')) };
}
const figure = (st, re) => amountOf(Object.entries(st.figures).find(([k]) => re.test(k))?.[1] ?? '');
/** Statements, the current account (`name`), the period at `index` (0 is this month's). */
async function toStatement(name, index = 0) {
  await rail('Money'); await tabById('bank', 'statements');
  const value = await page.locator('#statement-account option').evaluateAll((os, n) => os.find((o) => (o.textContent ?? '').startsWith(n))?.value ?? '', name);
  must(value, `no ${name} among the statements’ accounts`);
  await page.locator('#statement-account').selectOption(value); cur.pressed.push(`Account: ${name}`); await wait(400);
  await page.locator('#statement-period').selectOption({ index }); cur.pressed.push(`Period: ${clean(await page.locator('#statement-period option:checked').innerText())}`); await wait(400);
  return statementNow();
}

async function banking() {
  let from = '';
  let to = '';
  let price = NaN;
  let posts = '';
  let held = {};
  // The payment's line by its day and its words as the statement gives them, so a fee of the same amount isn't taken for it.
  let paid = { date: '', memo: '' };
  await play('[save: roundups scenario] Money by the rail: Accounts, each account’s balance, Move Money offered', ['navigation'], async () => {
    await openSave('roundups.json');
    trace.startingPoint.command = 'npx vite-node tools/scenarios.ts -- --scenario roundups --seed sc-0 --save SAVEDIR/roundups.json';
    await rail('Money');
    must(hash().startsWith('#/workspace/bank'), `Money at ${hash()}`);
    await tabById('bank', 'accounts');
    must(await page.locator('#move-amount').count(), 'no Move Money');
    from = clean(await page.locator('#move-from option:checked').innerText()).split(' ···')[0];
    to = clean(await page.locator('#move-to option:checked').innerText()).split(' ···')[0];
    held = await balances();
    must(from && to && Number.isFinite(held[from]) && Number.isFinite(held[to]), `balances read: ${JSON.stringify(held)}`);
    return `${Object.entries(held).map(([k, v]) => `${k} $${v.toLocaleString('en-US')}`).join(', ')}; Move Money from ${from} to ${to}`;
  });
  await play('more than the current account holds, refused in words, naming what it holds; nothing moved, the clock as it was', ['unavailable'], async () => {
    const t0 = await when();
    const asked = held[from] + 1000;
    await page.locator('#move-amount').fill(String(asked)); cur.pressed.push(`Amount: ${asked}`); await wait(300);
    await press(movePanel().locator('button.btn-primary').first(), 'Move It'); await wait(900);
    const { text, tone } = await newestToastWithTone();
    said(`refused (${tone}): ${text}`);
    must(tone === 'negative', `the press wasn’t refused: “${text}” (${tone || 'no toast'})`);
    // The refusal names it to the cent, the From list in whole dollars (from 2026-10-17, brief 14's editorial review).
    must(amountsIn(text).some((a) => Math.abs(a - held[from]) < 1), `the refusal doesn’t name the $${held[from].toLocaleString('en-US')} ${from} holds: ${text}`);
    await movePanel().scrollIntoViewIfNeeded().catch(() => {});
    await shot('transfer-refused');
    const now = await balances();
    must(JSON.stringify(now) === JSON.stringify(held), `a balance moved: ${JSON.stringify(held)} → ${JSON.stringify(now)}`);
    must((await when()) === t0, `the clock moved: ${t0} → ${await when()}`);
    return text;
  });
  await play('$500 moved: the toast says it, the current account $500 less and savings $500 more, the clock as it was', [], async () => {
    const t0 = await when();
    await page.locator('#move-amount').fill('500'); cur.pressed.push('Amount: 500'); await wait(300);
    await press(movePanel().locator('button.btn-primary').first(), 'Move It'); await wait(900);
    const { text, tone } = await newestToastWithTone();
    must(tone === 'positive' && amountsIn(text).includes(500), `the toast: “${text}” (${tone})`);
    const now = await balances();
    must(now[from] === held[from] - 500 && now[to] === held[to] + 500, `${from} $${held[from]} → $${now[from]}, ${to} $${held[to]} → $${now[to]}`);
    must((await when()) === t0, `the clock moved: ${t0} → ${await when()}`);
    held = now;
    return `${text} ${from} $${now[from].toLocaleString('en-US')}, ${to} $${now[to].toLocaleString('en-US')}`;
  });
  await play('a card payment: Look After Yourself, the first item with a price and offered, pressed', [], async () => {
    const menu = await lookAfterMenu();
    await language('Look After Yourself, open');
    const items = menu.getByRole('menuitem');
    let chosen;
    for (let i = 0; i < await items.count(); i += 1) {
      const it = items.nth(i);
      if (await it.isDisabled()) continue;
      const cost = amountsIn(clean(await it.locator('.menu-item-detail').first().innerText().catch(() => '')))[0];
      if (cost > 0) { chosen = it; price = cost; break; }
    }
    must(chosen, 'nothing in Look After Yourself costs money and is offered now');
    const label = clean(await chosen.locator('.menu-item-label').innerText().catch(() => '')).replace(/(Needed Now|Most Worth It)$/, '').trim();
    await press(chosen, label); await wait(1000); await settle();
    const { text, tone } = await newestToastWithTone();
    must(tone === 'positive', `“${label}” said: ${text} (${tone})`);
    return `${label}, $${price.toFixed(2)}: ${text}`;
  });
  await play('pending, not available: Statements, the current account this month; what’s available and the posted balance differ by what’s pending; the payment pending, its day to post; its line’s look says so', ['navigation', 'drill-down'], async () => {
    const st = await toStatement(from, 0);
    const pending = st.lines.filter((l) => l.pending);
    const avail = figure(st, /Available/i);
    const posted = figure(st, /Posted/i);
    said(`${st.period}: ${Object.entries(st.figures).map(([k, v]) => `${k} ${v}`).join(', ')}; pending: ${pending.map((l) => `${l.what} ${l.amount}`).join('; ')}`);
    must(pending.length > 0, 'no line marked pending');
    must(Number.isFinite(avail) && Number.isFinite(posted), `no available and posted figures: ${JSON.stringify(st.figures)}`);
    const sum = pending.reduce((s, l) => s + l.amount, 0);
    must(Math.abs(posted + sum - avail) < 0.005, `available ${avail} isn’t the posted ${posted} less what’s pending (${sum.toFixed(2)})`);
    const today = await dateText();
    const meal = pending.find((l) => Math.abs(-l.amount - price) < 0.005 && l.date === today);
    must(meal, `no pending line of $${price.toFixed(2)} dated ${today}: ${pending.map((l) => `${l.date} ${l.what} ${l.amount}`).join('; ')}`);
    paid = { date: meal.date, memo: meal.memo };
    posts = meal.posts;
    must(posts, `the payment’s line gives no day it posts: ${meal.what}`);
    await statementPanel().scrollIntoViewIfNeeded().catch(() => {});
    await shot('statement-pending');
    const row = statementPanel().locator('.statement-lines > .row-between.small').nth(meal.i);
    const look = await openLook(row.locator(':scope > span').nth(1).locator('button.link').first());
    const words = clean(await look.look.innerText());
    must(words.includes(posts), `the line’s look doesn’t give the day it posts (${posts}): ${words.slice(0, 300)}`);
    await language('a statement line’s look');
    await closeLook(look.name);
    return `${meal.what}, −$${price.toFixed(2)}, posts ${posts}; available $${avail}, posted $${posted}`;
  });
  await play('Statement Ready turned on, the clock as it was', [], async () => {
    const t0 = await when();
    const toggle = page.getByRole('button', { name: /^Statement Ready:/ }).first();
    must(await toggle.count(), 'no Statement Ready');
    const was = clean(await toggle.innerText());
    must(/Off$/.test(was), `Statement Ready reads “${was}”`);
    await press(toggle, was); await wait(600);
    const now = clean(await page.getByRole('button', { name: /^Statement Ready:/ }).first().innerText());
    must(/On$/.test(now), `after pressing it reads “${now}”`);
    must((await when()) === t0, `the clock moved: ${t0} → ${await when()}`);
    return `${was} → ${now}`;
  });
  await play('Save & Exit; Delete asked and kept; Continue: the same moment, the same lines pending on the same days, the same figures, Statement Ready still on', ['confirmation', 'save-continue'], async () => {
    const before = await statementNow();
    const at = await deleteKeptThenContinue();
    const after = await toStatement(from, 0);
    must(JSON.stringify(after.figures) === JSON.stringify(before.figures), `the figures read differently: ${JSON.stringify(after.figures)}`);
    must(JSON.stringify(after.lines.filter((l) => l.pending)) === JSON.stringify(before.lines.filter((l) => l.pending)), 'the pending lines read differently');
    must(/On$/.test(clean(await page.getByRole('button', { name: /^Statement Ready:/ }).first().innerText())), 'Statement Ready isn’t on after Continue');
    return `${at}; ${after.lines.filter((l) => l.pending).length} lines pending as they were`;
  });
  await play('One Week, asked: On The Way names what’s on the way, Cancel leaves the clock', ['confirmation'], async () => {
    const words = await askedFirst('One Week');
    must(datesIn(words).length > 0, `On The Way lists nothing dated: ${words.slice(0, 200)}`);
  });
  let notice = NaN;
  await play('to the day after the payment posts, each stop gone to: the month’s statement for the current account on Home, its balance at the close; Go There opens Money', ['notification', 'navigation'], async () => {
    must(posts, 'no posting day was read before');
    const days = await mornings(8, async () => dayOf(await dateText()) > dayOf(posts));
    must(days <= 8, `still not past ${posts} after 8 mornings: ${await when()}`);
    const re = new RegExp(`Statement.*${escapeRe(from)}|${escapeRe(from)}.*Statement`);
    const row = await findNotice(re);
    must(row, `no statement for ${from} among Home’s notices: ${(await notices()).map((n) => n.slice(0, 50)).join(' | ')}`);
    const { title, body } = await readNotice(re);
    notice = amountsIn(body)[0];
    must(Number.isFinite(notice), `the notice gives no balance: ${body}`);
    await shot('statement-notice');
    await press(noticeRow(re).getByRole('button', { name: /^Go There$/ }), 'Go There'); await wait(1200);
    must(hash().startsWith('#/workspace/bank'), `Go There opened ${hash()}`);
    return `${days} mornings, to ${await when()}: “${title}”: ${body}`;
  });
  await play('posted: the payment’s line no longer pending; the closed month’s closing balance is the notice’s figure, to the cent', ['drill-down'], async () => {
    const st = await toStatement(from, 1);
    const meal = st.lines.find((l) => l.date === paid.date && l.memo === paid.memo && Math.abs(-l.amount - price) < 0.005);
    must(meal, `no line “${paid.memo}” of $${price.toFixed(2)} dated ${paid.date} in ${st.period}: ${st.lines.map((l) => `${l.date} ${l.what} ${l.amount}`).join('; ').slice(0, 300)}`);
    must(!meal.pending, `the payment is still pending: ${meal.what}`);
    const closing = figure(st, /Closing/i);
    said(`${st.period}: ${Object.entries(st.figures).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    must(Math.abs(closing - notice) < 0.005, `${st.period}’s closing balance $${closing} isn’t the notice’s $${notice}`);
    await statementPanel().scrollIntoViewIfNeeded().catch(() => {});
    await shot('statement-posted');
    return `${st.period}: ${meal.what} posted; closing $${closing}, the notice’s $${notice}`;
  });
}

// ===========================================================================================================
// Playthrough 5: a document applied for, on its way, and held.
// ===========================================================================================================

const idPanel = () => panelHeaded('Your ID');
const getButton = () => idPanel().getByRole('button', { name: /^Get / }).first();
/** A grayed control's reason, where it's in words on the screen beside it: its tooltip's words found in the panel's own text, outside the button. */
async function reasonOnScreen(panel, button) {
  const tip = clean(await button.getAttribute('title').catch(() => '') ?? '');
  const inside = clean(await button.innerText());
  const text = clean(await panel.innerText()).replace(inside, '');
  return tip && text.includes(tip) ? tip : '';
}
async function cardRow() {
  const row = idPanel().locator('tbody tr').first();
  must(await row.count(), 'no card in Your ID’s list');
  const cells = (await row.locator('td').allInnerTexts()).map(clean);
  return { row, name: cells[0], issued: cells[2], runsOut: cells[3], status: cells[4] };
}
async function primaryBalance() {
  await rail('Money'); await tabById('bank', 'accounts');
  const o = clean(await page.locator('#move-from option:checked').innerText());
  return { name: o.split(' ···')[0], balance: amountsIn(o).at(-1) };
}

async function documentJourney() {
  let card = '';
  let comes = '';
  let until = '';
  let pendingStatus = '';
  let refusal = '';
  let paid = NaN;
  const toPassport = async () => { await rail('Papers'); await tabById('papers', 'passport'); };
  await play('[save: brief scenario] Papers by the rail, Passport And ID: Your ID names the card, none held, Get offered', ['navigation'], async () => {
    await openSave('brief.json');
    trace.startingPoint.command = 'npx vite-node tools/scenarios.ts -- --scenario brief --seed sc-0 --save SAVEDIR/brief.json';
    const bank = await primaryBalance();
    paid = bank.balance;
    await toPassport();
    must(hash().startsWith('#/workspace/papers'), `Papers at ${hash()}`);
    must(await idPanel().count(), 'no Your ID panel');
    card = clean(await idPanel().locator('.panel-head p').first().innerText());
    must(card && clean(await getButton().innerText()).endsWith(card), `the subtitle names “${card}”, the button “${clean(await getButton().innerText().catch(() => ''))}”`);
    must(!(await idPanel().locator('tbody tr').count()), 'a card is already listed');
    must(!(await getButton().isDisabled()), `Get is grayed: ${await getButton().getAttribute('title')}`);
    return `${card}; ${bank.name} $${bank.balance.toLocaleString('en-US')} before`;
  });
  await play('Your ID’s How This Works: its entry, a connected entry and Back, closed with the tab and the clock as they were', ['drill-down'], async () => {
    return helpRoundTrip(idPanel().locator('button[aria-label^="How This Works:"]').first(), async () => (await page.locator('#papers-tab-passport').getAttribute('aria-selected')) === 'true');
  });
  await play('applied: the toast names the card, its fee, the day it comes and the day it’s good until; the fee off the current account', [], async () => {
    await press(getButton(), `Get ${card}`); await wait(1000);
    const { text, tone } = await newestToastWithTone();
    must(tone === 'positive', `Get said: ${text} (${tone})`);
    must(text.includes(card), `the toast doesn’t name ${card}: ${text}`);
    const fee = amountsIn(text)[0];
    [comes, until] = datesIn(text);
    must(fee === 28 && comes === 'October 9, 2026' && until === 'June 14, 2034', `expected $28.00, October 9, 2026 and June 14, 2034: ${text}`);
    await idPanel().scrollIntoViewIfNeeded().catch(() => {});
    await shot('applied');
    const bank = await primaryBalance();
    must(bank.balance === paid - fee, `${bank.name} $${paid} → $${bank.balance}, where the fee was $${fee}`);
    paid = fee;
    return text;
  });
  await play('applied isn’t held: the row not in force and not issued; Get grayed, its reason on the screen; the card’s look gives the day it comes and isn’t issued', ['unavailable', 'drill-down'], async () => {
    await toPassport();
    const r = await cardRow();
    pendingStatus = r.status;
    said(`row: ${r.name} | ${r.issued} | ${r.runsOut} | ${r.status}`);
    must(r.name.startsWith(card), `the row is “${r.name}”`);
    must(!/In Force/i.test(r.status) && !datesIn(r.issued).length, `the row reads ${r.status}, issued ${r.issued}`);
    await idPanel().scrollIntoViewIfNeeded().catch(() => {});
    await shot('on-its-way');
    refusal = await refused(getButton(), async () => reasonOnScreen(idPanel(), getButton())).catch(async (e) => { throw new Error(`${e.message}${/no reason/.test(e.message) ? ` (its tooltip: “${await getButton().getAttribute('title')}”)` : ''}`); });
    const look = await openLook(r.row.locator('td').first().locator('button.link').first());
    must(look.summary.includes(comes), `its look doesn’t give ${comes}: ${look.summary}`);
    const issued = clean(await look.look.locator('.stat', { has: page.locator('.stat-label', { hasText: /Issued/i }) }).first().locator('.stat-value').innerText().catch(() => ''));
    must(issued && !datesIn(issued).length, `its look says issued “${issued}”`);
    await language('the card’s look');
    await closeLook(look.name);
    return `${r.status}; refused: ${refusal}; look: ${look.summary}`;
  });
  await play('Save & Exit; Delete asked and kept; Continue: the same moment, the row, the look’s day and Get’s refusal as they were', ['confirmation', 'save-continue'], async () => {
    const before = await cardRow();
    const at = await deleteKeptThenContinue();
    await toPassport();
    const after = await cardRow();
    must(after.status === before.status && after.issued === before.issued && after.runsOut === before.runsOut, `the row reads ${after.status}, ${after.issued}, ${after.runsOut}`);
    must((await getButton().isDisabled()) && (await reasonOnScreen(idPanel(), getButton())) === refusal, `Get after Continue: ${await getButton().isDisabled() ? 'grayed' : 'offered'}, “${await reasonOnScreen(idPanel(), getButton())}”`);
    const look = await openLook(after.row.locator('td').first().locator('button.link').first());
    must(look.summary.includes(comes), `its look after Continue: ${look.summary}`);
    await closeLook(look.name);
    return `${at}; still ${after.status}`;
  });
  await play('One Week, asked: On The Way names the week’s commitments, Cancel leaves the clock', ['confirmation'], async () => {
    const words = await askedFirst('One Week');
    must(datesIn(words).length > 0, `On The Way lists nothing dated: ${words.slice(0, 200)}`);
  });
  let arrived = '';
  await play('the days to its coming, each stop gone to: Home lists its arrival, naming the card, on the day the toast gave', ['notification'], async () => {
    const re = new RegExp(`^${escapeRe(card)}`);
    const days = await mornings(35, async () => Boolean(await findNotice(re)));
    must(days <= 35, `no arrival after 35 mornings: ${await when()}`);
    arrived = await dateText();
    const { title, body } = await readNotice(re);
    must(body.length > 0, 'the notice has no words');
    const late = (dayOf(arrived) - dayOf(comes)) / 86_400_000;
    must(late >= 0 && late <= 1, `listed first on ${arrived}, where it was to come ${comes}`);
    await shot('arrived');
    return `${days} mornings; on ${arrived}: “${title}”: ${body}`;
  });
  await play('held: Go There opens Papers; the row in force from the day it came, to the day the toast gave; Get grayed with its reason on the screen; the look says so', ['navigation', 'unavailable'], async () => {
    const re = new RegExp(`^${escapeRe(card)}`);
    await findNotice(re);
    await press(noticeRow(re).getByRole('button', { name: /^Go There$/ }), 'Go There'); await wait(1200);
    must(hash().startsWith('#/workspace/papers'), `Go There opened ${hash()}`);
    await tabById('papers', 'passport');
    const r = await cardRow();
    said(`row: ${r.name} | ${r.issued} | ${r.runsOut} | ${r.status}`);
    must(r.status !== pendingStatus && r.issued === comes && r.runsOut === until, `the row reads ${r.status}, issued ${r.issued}, runs out ${r.runsOut}`);
    const why = await refused(getButton(), async () => reasonOnScreen(idPanel(), getButton())).catch(async (e) => { throw new Error(`${e.message}${/no reason/.test(e.message) ? ` (its tooltip: “${await getButton().getAttribute('title')}”)` : ''}`); });
    must(why !== refusal, `the reason is still “${why}”`);
    const look = await openLook(r.row.locator('td').first().locator('button.link').first());
    must(look.summary.includes(until), `its look doesn’t give ${until}: ${look.summary}`);
    await closeLook(look.name);
    await idPanel().scrollIntoViewIfNeeded().catch(() => {});
    await shot('held');
    return `${r.status} from ${r.issued} to ${r.runsOut}; refused: ${why}; look: ${look.summary}`;
  });
}

// ===========================================================================================================
// Playthrough 6: a health interruption and its consequences.
// ===========================================================================================================

async function health() {
  let injury = '';
  let days = NaN;
  let refusal = '';
  let mends = '';
  let hurtOn = '';
  const INJURY = /^A Sprained Ankle$/;
  await play('[save: health scenario] the injury’s notice on Home: its name, the days it takes to mend and what it keeps you from', ['notification'], async () => {
    await openSave('health.json');
    trace.startingPoint.command = 'npx vite-node tools/scenarios.ts -- --scenario health --seed sc-0 --save SAVEDIR/health.json';
    trace.startingPoint.testSetup = 'a fall forced through the game’s own mayHurt, with a chance of one, on the first morning from Saturday 12 September 2026 at nine on which a fall would be a sprained ankle (tools/scenarios.ts, health); the run stopped right after it';
    const { title, body } = await readNotice(INJURY);
    injury = title;
    hurtOn = await dateText();
    days = Number((body.match(/(\d+) days?/) ?? [])[1] ?? NaN);
    must(days === 7, `the notice gives ${days} days to mend, where 7 were expected: ${body}`);
    must(/work out/i.test(body), `the notice doesn’t say it keeps you from working out: ${body}`);
    await shot('injury-notice');
    return `“${title}”: ${body}`;
  });
  await play('the notice opened in place: its look, Close, the clock as it was', ['drill-down'], async () => {
    const look = await openLook(noticeRow(INJURY).locator('.strong button.link').first());
    must(look.kind.toLowerCase() === 'notice' && look.name === injury, `opened “${look.name}” (${look.kind})`);
    await language('the notice’s look');
    await closeLook(look.name);
  });
  await play('How You Are into the injury: your look, its way to the injury, the day it mends and what it keeps you from, a way further in, the outer Close shutting all', ['drill-down'], async () => {
    const t0 = await when();
    const how = panelHeaded('How You Are');
    const outer = await openLook(how.locator('p button.link').first());
    const way = outer.look.locator(':scope > .look-inner .look-way button.link', { hasText: /Injury/i }).first();
    must(await way.count(), `“${outer.name}” offers no way to the injury`);
    await press(way, clean(await way.innerText())); await wait(500);
    const inner = outer.look.locator('.look').filter({ has: page.locator(':scope > .look-head .look-name', { hasText: new RegExp(`^${escapeRe(injury)}$`) }) }).first();
    must(await inner.count(), `no look named ${injury} opened inside “${outer.name}”`);
    const summary = clean(await inner.locator(':scope > .look-inner > .look-summary').innerText());
    const trail = clean(await inner.locator(':scope > .look-head .look-trail').innerText().catch(() => ''));
    mends = datesIn(summary)[0] ?? '';
    must(mends === 'September 19, 2026', `its look gives “${mends}” for the day it mends: ${summary}`);
    must(/work out/i.test(summary), `its look doesn’t say what it keeps you from: ${summary}`);
    must(trail.includes(outer.name), `its trail is “${trail}”`);
    said(`“${injury}”: ${summary}; trail “${trail}”`);
    await shot('injury-look');
    const further = await wayIn({ look: inner, name: injury });
    await language('your look, the injury’s look inside it');
    await closeLook(outer.name);
    must(!(await page.locator('.look').count()), 'a look still open after the outer Close');
    must((await when()) === t0, `the clock moved: ${t0} → ${await when()}`);
    return `${outer.name} → ${injury} → ${further}`;
  });
  await play('Work Out refused: grayed in Look After Yourself, its reason in its own line naming the injury and its days; forced, the clock stays', ['unavailable'], async () => {
    const menu = await lookAfterMenu();
    const item = menu.getByRole('menuitem', { name: /^Work Out/ }).first();
    must(await item.count(), 'no Work Out');
    refusal = await refused(item, async () => itemWhy(item));
    await language('Look After Yourself, Work Out refused');
    await shot('work-out-refused');
    if (await menu.isVisible().catch(() => false)) await page.keyboard.press('Escape');
    await wait(300);
    must(refusal.toLowerCase().includes(injury.toLowerCase()), `the reason doesn’t name ${injury}: ${refusal}`);
    must(new RegExp(`\\b${days} days?\\b`).test(refusal), `the reason doesn’t give the notice’s ${days} days: ${refusal}`);
    return refusal;
  });
  await play('a class’s work refused for it: School, Coursework, a step on the feet refused with Work Out’s words; forced, the clock stays', ['navigation', 'unavailable'], async () => {
    await rail('School'); await tabById('school', 'coursework');
    const ids = await page.locator('[data-shown-today]').evaluateAll((els) => els.map((e) => e.getAttribute('data-shown-today')));
    const hits = [];
    for (const id of ids) {
      const card = cardOf(id);
      const why = await whyOf(card);
      if (!why.includes(refusal)) continue;
      for (let i = 0; i < await stepsOf(card).count(); i += 1) {
        const b = stepsOf(card).nth(i);
        const label = clean(await b.innerText());
        if ((await b.isDisabled()) && why.includes(`${label}: ${refusal}`)) hits.push({ id, label, title: await titleOf(card) });
      }
    }
    must(hits.length, `no step on Coursework refused with “${refusal}”`);
    const first = hits[0];
    const b = stepsOf(cardOf(first.id)).filter({ hasText: new RegExp(`^${escapeRe(first.label)}$`) }).first();
    await refused(b, async () => (await whyOf(cardOf(first.id))).includes(refusal) ? refusal : '');
    await cardOf(first.id).scrollIntoViewIfNeeded().catch(() => {});
    await shot('coursework-refused');
    return hits.map((h) => `${h.title}: ${h.label}`).join('; ');
  });
  await play('its care and its cost: the notice’s Go There opens Papers; Health Cover; what urgent care costs you now, and no bill for it unless the notice named a share', ['navigation'], async () => {
    const { body } = await readNotice(INJURY);
    await press(noticeRow(INJURY).getByRole('button', { name: /^Go There$/ }), 'Go There'); await wait(1200);
    must(hash().startsWith('#/workspace/papers'), `Go There opened ${hash()}`);
    await tabById('papers', 'health');
    const doctor = clean(await panelHeaded('Your Doctor').innerText().catch(() => ''));
    const line = doctor.match(/urgent care[^,.·]*?([$£€][\d,]+\.\d\d)/i);
    must(line, `Your Doctor gives no price for urgent care: ${doctor.slice(0, 300)}`);
    const urgent = amountOf(line[1]);
    const share = amountsIn(body)[0];
    const bills = (await panelHeaded('Care And Its Bills').locator('tbody tr').allInnerTexts().catch(() => [])).map(clean);
    const thatDay = bills.filter((b) => b.includes(hurtOn));
    said(`urgent care now $${urgent.toFixed(2)}; the notice’s share: ${Number.isFinite(share) ? `$${share}` : 'none'}; bills that day: ${thatDay.join(' | ') || 'none'}`);
    if (Number.isFinite(share)) must(thatDay.some((b) => amountsIn(b).includes(share)), `the notice’s $${share} isn’t a bill from that day: ${bills.join(' | ')}`);
    else must(urgent === 0 && !thatDay.some((b) => amountsIn(b).some((a) => a > 0)), `the notice names no share, yet urgent care is $${urgent} and that day’s bills are ${thatDay.join(' | ') || 'none'}`);
    await panelHeaded('Your Doctor').scrollIntoViewIfNeeded().catch(() => {});
    await shot('health-cover');
    return `urgent care $${urgent.toFixed(2)}; ${Number.isFinite(share) ? `a share of $${share}` : 'no share, no bill'}`;
  });
  await play('Tomorrow Morning, asked: On The Way names the 10:00 AM work-study shift, Cancel leaves the clock', ['confirmation'], async () => {
    const words = await askedFirst('Tomorrow Morning');
    must(/10:00\s?AM/.test(words), `On The Way doesn’t name the 10:00 AM shift: ${words.slice(0, 300)}`);
  });
  await play('a day on, saved and continued: Work Out’s refusal the same, word for word', ['save-continue'], async () => {
    await advance('Tomorrow Morning');
    const before = await workOut();
    must(before.refused, `Work Out offered the next morning: ${before.why}`);
    const at = await saveAndContinue();
    const after = await workOut();
    must(after.refused && after.why === before.why, `after Continue: ${after.refused ? 'refused' : 'offered'}, “${after.why}”, where it was “${before.why}”`);
    return `${at}: “${after.why}”`;
  });
  await play('the days it mends: each morning Work Out’s days never rise, and it’s offered the first morning after the day the look gave; your look then offers no way to an injury', [], async () => {
    must(mends, 'no mending day was read before');
    const seen = [];
    let last = Infinity;
    const took = await mornings(10, async () => {
      const w = await workOut();
      const left = Number((w.why.match(/(\d+) days?/) ?? [])[1] ?? NaN);
      seen.push(`${await dateText()}: ${w.refused ? `refused, “${w.why}”` : 'offered'}`);
      if (w.refused) {
        must(w.why.toLowerCase().includes(injury.toLowerCase()), `refused on ${await dateText()} for another reason: ${w.why}`);
        must(!(left > last), `${await dateText()}: ${left} days, up from ${last}`);
        last = left;
        return false;
      }
      return true;
    });
    said(seen.join('; '));
    must(took <= 10, `Work Out still refused after 10 mornings: ${seen.at(-1)}`);
    const first = await dateText();
    must(dayOf(first) > dayOf(mends) && dayOf(first) - dayOf(mends) <= 86_400_000, `offered first on ${first}, where it mends ${mends}`);
    await rail('Home');
    const outer = await openLook(panelHeaded('How You Are').locator('p button.link').first());
    must(!(await outer.look.locator(':scope > .look-inner .look-way button.link', { hasText: /Injury/i }).count()), 'your look still offers a way to an injury');
    await closeLook(outer.name);
    return `offered on ${first}, after ${took} mornings`;
  });
  await play('Save & Exit; Delete asked and kept; Continue: the same moment, Work Out still offered, Home’s notices as they were', ['confirmation', 'save-continue'], async () => {
    const before = await homeAsOpened();
    const at = await deleteKeptThenContinue();
    const after = await homeAsOpened();
    must(JSON.stringify(after) === JSON.stringify(before), `Home’s notices read differently after Continue: ${after.length} for ${before.length}`);
    const w = await workOut();
    must(!w.refused, `Work Out refused after Continue: ${w.why}`);
    return `${at}; Work Out offered`;
  });
}

// --- Run it, and write the trace.

if (WHICH === 'normal') await normal();
else if (WHICH === 'setback') await setback();
else if (WHICH === 'specialist') await specialist();
else if (WHICH === 'banking') await banking();
else if (WHICH === 'document') await documentJourney();
else await health();

const failed = trace.steps.filter((s) => !s.ok);
trace.exercised = Object.fromEntries(SIX.map((k) => [k, trace.steps.filter((s) => s.ok && s.exercises.includes(k)).map((s) => s.n)]));
const missing = SIX.filter((k) => trace.exercised[k].length === 0);
trace.summary = { steps: trace.steps.length, passed: trace.steps.length - failed.length, failed: failed.length, sixMissing: missing, errors: trace.errors.length, overflows: trace.overflows.length };
// Section 9's language checks, which brief 14's journeys alone run (from 2026-10-17).
const journey = JOURNEYS.includes(WHICH);
if (journey) { trace.language = lang; trace.summary.languageFails = lang.fails.length; trace.summary.languageRecorded = lang.recorded.length; }
trace.finishedAt = new Date().toISOString();
writeFileSync(`${OUT}/trace.json`, `${JSON.stringify(trace, null, 1)}\n`);
console.log(`\n${WHICH} at ${WIDTH}: ${trace.summary.passed} of ${trace.summary.steps} passed; six missing: ${missing.join(', ') || 'none'}; ${trace.errors.length} errors; ${trace.overflows.length} overflows${journey ? `; ${lang.fails.length} language checks failed, ${lang.recorded.length} recorded` : ''}`);
await browser.close();
process.exit(failed.length || missing.length || trace.errors.length || trace.overflows.length || (journey && lang.fails.length) ? 1 : 0);
