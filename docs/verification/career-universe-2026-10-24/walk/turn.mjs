// Brief 27, Area D (2026-10-24): a phone turned, on the built app, with the rotate gate gone. A played life (brief 23's
// saves) opened on a phone on its side (844 x 390, touch, no hover), then turned upright (390 x 844) and back, with:
//   1. the clock running and the Advance menu pressed upright: nothing covers the game, the clock keeps running, a
//      control pressed upright works;
//   2. a dialog open (How This Works): kept through the turn, its close reachable, Escape closes it upright;
//   3. a form typed into (the help's find): the words kept, the field on screen;
//   4. a long page scrolled: the share of it kept upright, the pixel kept back on its side;
//   5. the keyboard up upright (a shorter window): the focused field and its screen's controls still reachable;
//   6. the text made larger (the root font at 125%): no page wider than the window, upright or on its side;
//   7. the page hidden and shown again (backgrounding): the save written, nothing asked twice, the clock caught up by
//      its own rule and stopped at what wants the player;
//   8. the page reloaded (a refresh) and Continue: the same life at the moment it was saved;
//   9. Tab upright: focus moves through the bar's controls, none skipped behind an overlay.
//
//   SLATE_BASE=http://localhost:4173 node docs/verification/career-universe-2026-10-24/walk/turn.mjs OUT LIFE=SAVE.json.gz
//
// Writes OUT/turn.json (each check and what it read) and OUT/NN-<step>.jpg. Emulation, not a phone: Chromium's touch
// and viewport emulation, which can't show a notch's safe area, a real on-screen keyboard or a browser's own bars.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [OUT, LIFE] = process.argv.slice(2);
const [lifeName, saveFile] = LIFE.split('=');
const dir = join(OUT, lifeName);
mkdirSync(dir, { recursive: true });
const SIDE = { width: 844, height: 390 };
const UP = { width: 390, height: 844 };

const browser = await chromium.launch(launchOptions());
const ctx = await browser.newContext({ viewport: SIDE, screen: SIDE, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) problems.push(`console: ${m.text().slice(0, 200)}`); });
const wait = (ms) => page.waitForTimeout(ms);
let n = 0;
const shot = async (name) => { n += 1; await page.screenshot({ path: join(dir, `${String(n).padStart(2, '0')}-${name}.jpg`), type: 'jpeg', quality: 70, scale: 'css' }); };
const turn = async (up) => { await page.setViewportSize(up ? UP : SIDE); await wait(1200); };
const tap = async (loc) => { await loc.scrollIntoViewIfNeeded().catch(() => {}); await loc.tap({ timeout: 8000 }); await wait(500); };
const state = () => page.evaluate(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const inView = (el) => { const r = el.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1; };
  const dialog = [...document.querySelectorAll('[role=dialog]')].filter(vis).pop();
  const main = document.querySelector('#main');
  return {
    rotate: !!document.querySelector('[data-rotate-screen]') || /Rotate Your Phone/.test(document.body.innerText),
    inert: !!document.querySelector('[inert]'),
    running: document.querySelector('.clock-state')?.textContent ?? null,
    clock: document.querySelector('.topbar-clock strong')?.textContent ?? null,
    dialog: dialog ? (dialog.getAttribute('aria-label') ?? dialog.querySelector('h2, h1')?.textContent?.trim() ?? 'dialog') : null,
    dialogClose: dialog ? [...dialog.querySelectorAll('button')].filter((b) => /close|done/i.test(b.getAttribute('aria-label') ?? b.textContent ?? '')).some(inView) : null,
    find: document.querySelector('[role=dialog] input[type=search], [role=dialog] input')?.value ?? null,
    findInView: (() => { const i = document.querySelector('[role=dialog] input'); return i ? inView(i) : null; })(),
    focus: document.activeElement?.getAttribute?.('aria-label') ?? document.activeElement?.textContent?.trim()?.slice(0, 40) ?? null,
    mainTop: main?.scrollTop ?? null, mainRoom: main ? main.scrollHeight - main.clientHeight : null,
    pageWider: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    bodyFont: parseFloat(getComputedStyle(document.body).fontSize),
    toasts: [...document.querySelectorAll('.toast')].map((t) => t.textContent.trim()),
    questions: document.querySelectorAll('[data-decision], .decision-row').length,
    controlsOut: [...document.querySelectorAll('button, a[href], [role=tab], input, select')].filter(vis).filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.right <= innerWidth + 1 && r.left >= -1) return false;
      // A control past the edge of a box that scrolls sideways is reachable by scrolling it.
      for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/auto|scroll/.test(s.overflowX) && p.scrollWidth > p.clientWidth) return false; }
      return true;
    }).map((el) => el.textContent.trim().slice(0, 30)).slice(0, 8),
  };
});
const checks = {};

try {
  // The life, opened through Your Saves on a phone on its side.
  const text = gunzipSync(readFileSync(saveFile)).toString('utf8');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(1200);
  await tap(page.getByRole('button', { name: /^Continue$/ }).first());
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 });
  await wait(1500);
  const time = page.getByRole('group', { name: 'Time Controls' });
  await shot('on-its-side');

  // 1. The clock running, turned upright: nothing covers it, and a control pressed upright works.
  if (await time.getByRole('button', { name: /^Play$/ }).count()) await tap(time.getByRole('button', { name: /^Play$/ }).first());
  await wait(1500);
  const r0 = await state();
  await turn(true);
  const r1 = await state();
  await shot('upright-running');
  await wait(3000);
  const r2 = await state();
  // Pause it upright, then Advance one hour from the menu, upright.
  await tap(time.getByRole('button', { name: /^Pause$/ }).first());
  const before = await state();
  await tap(time.getByRole('button', { name: /^Advance/ }).first());
  await shot('upright-advance-menu');
  const hour = page.getByRole('menuitem', { name: /^One Hour/ }).first();
  const menuShown = await hour.isVisible().catch(() => false);
  if (menuShown) await tap(hour);
  await wait(1500);
  // A stop or On The Way may answer first; either is the game's own, shown over nothing else.
  const after = await state();
  if (after.dialog) { await page.keyboard.press('Escape'); await wait(400); }
  await turn(false);
  const r3 = await state();
  checks.running = {
    sideways: r0.running, upright: r1.running, uprightLater: r2.running, backOnSide: r3.running,
    noGate: !r1.rotate && !r1.inert && !r2.rotate,
    keptRunning: r0.running === 'Running' && r1.running === 'Running' && r2.running === 'Running',
    menuShownUpright: menuShown, clockBefore: before.clock, clockAfter: after.clock, answeredUpright: after.dialog ?? null,
  };

  // 2. A dialog open (How This Works), turned upright: kept, closable, Escape reaches it.
  await page.keyboard.press('?'); await wait(800);
  const d0 = await state();
  await turn(true);
  const d1 = await state();
  await shot('upright-help-open');
  await page.keyboard.press('Escape'); await wait(500);
  const d2 = await state();
  await turn(false);
  checks.dialog = { before: d0.dialog, upright: d1.dialog, closeInView: d1.dialogClose, escapeClosedUpright: d1.dialog !== null && d2.dialog === null, noGate: !d1.rotate && !d1.inert };

  // 3. A form typed into (the help's find), turned upright: the words kept and the field on screen.
  await page.keyboard.press('/'); await wait(700);
  const field = page.locator('[role=dialog] input').first();
  if (await field.count()) { await field.fill('drama'); await wait(300); }
  const f0 = await state();
  await turn(true);
  const f1 = await state();
  await shot('upright-find-typed');
  // 5. The keyboard up, upright: the window shorter by it, the field still reachable.
  await page.setViewportSize({ width: UP.width, height: 520 }); await wait(900);
  const k1 = await state();
  await shot('upright-keyboard-up');
  await page.setViewportSize(UP); await wait(600);
  await page.keyboard.press('Escape'); await wait(400);
  await turn(false);
  checks.form = { typed: f0.find, upright: f1.find, kept: f0.find === 'drama' && f1.find === 'drama', fieldInViewUpright: f1.findInView };
  checks.keyboard = { find: k1.find, fieldInView: k1.findInView, pageWider: k1.pageWider, noGate: !k1.rotate };

  // 4. A long page scrolled: Updates, 300 pixels down, turned upright and back.
  const toggle = page.locator('.rail-toggle');
  const goTo = async (name) => {
    if (await toggle.isVisible().catch(() => false)) await tap(toggle);
    const item = page.locator('nav.rail .rail-item', { hasText: new RegExp(`^${name}`) }).first();
    if (await item.count()) { await tap(item); return true; }
    const home = page.getByRole('button', { name: new RegExp(`View All ${name}|Open ${name}`) }).first();
    if (await home.count()) { await tap(home); return true; }
    return false;
  };
  const reached = await goTo('Career') || await goTo('School');
  await wait(800);
  await page.evaluate(() => { const m = document.querySelector('#main'); if (m) m.scrollTop = Math.min(300, m.scrollHeight - m.clientHeight); });
  await wait(600);
  const s0 = await state();
  await turn(true);
  const s1 = await state();
  await shot('upright-scrolled');
  await turn(false);
  const s2 = await state();
  const share = (s) => (s.mainRoom > 0 ? s.mainTop / s.mainRoom : 0);
  checks.scroll = {
    reached, sideways: s0.mainTop, upright: s1.mainTop, back: s2.mainTop,
    shareSideways: Number(share(s0).toFixed(3)), shareUpright: Number(share(s1).toFixed(3)),
    shareKept: Math.abs(share(s0) - share(s1)) < 0.05, pixelBack: s0.mainTop === s2.mainTop,
  };

  // 9. Tab upright: focus moves through the controls.
  await turn(true);
  const tabbed = [];
  for (let i = 0; i < 6; i += 1) { await page.keyboard.press('Tab'); await wait(120); tabbed.push((await state()).focus); }
  checks.tab = { focused: tabbed, moved: new Set(tabbed.filter(Boolean)).size >= 3 };

  // The portrait page as it stands: nothing wider than the window, no control past an edge that can't be scrolled to,
  // the text at the size it has on its side.
  const up = await state();
  await turn(false);
  const side = await state();
  checks.layout = { pageWiderUpright: up.pageWider, controlsOutUpright: up.controlsOut, bodyFontUpright: up.bodyFont, bodyFontSideways: side.bodyFont, sameText: up.bodyFont === side.bodyFont };

  // 6. The text made larger: the root font at 125%, upright and on its side.
  await page.addStyleTag({ content: 'html { font-size: 125% !important; }' }); await wait(600);
  const big1 = await state();
  await turn(true);
  const big2 = await state();
  await shot('upright-larger-text');
  await turn(false);
  checks.largerText = { pageWiderSideways: big1.pageWider, pageWiderUpright: big2.pageWider, controlsOutUpright: big2.controlsOut };

  // 7. Hidden and shown again: the save written on the way out, nothing asked twice.
  await goTo('Home'); await wait(800);
  const h0 = await state();
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide')); });
  await wait(1500);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await wait(1500);
  const h1 = await state();
  checks.background = { questionsBefore: h0.questions, questionsAfter: h1.questions, sameQuestions: h0.questions === h1.questions, running: h1.running, clockBefore: h0.clock, clockAfter: h1.clock, noGate: !h1.rotate };

  // 8. Reloaded, and Continue: the same life at the moment the save holds.
  const savedClock = h1.clock;
  await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
  const cont = page.getByRole('button', { name: /^Continue$/ }).first();
  if (await cont.count()) await tap(cont);
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 });
  await wait(1500);
  const re = await state();
  await shot('after-refresh');
  checks.refresh = { before: savedClock, after: re.clock, running: re.running };
} catch (e) {
  problems.push(`walk stopped: ${String(e).slice(0, 300)}`);
}
await browser.close();
writeFileSync(join(dir, 'turn.json'), `${JSON.stringify({ life: lifeName, base: BASE, checks, problems }, null, 1)}\n`);
console.log(JSON.stringify({ life: lifeName, checks, problems }, null, 1));
