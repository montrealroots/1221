// Brief 23's walk of the built app: every destination and every tab, a few dialogs and menus, for each life at each
// size, with a viewport image of each (and a whole-page image where asked) and a measurement of what the brief names as
// a defect: the page pushed sideways, text or a control past its card, a label cut off, a tab half shown, a squeezed
// column, a fixed height cutting content, a touch target under 44 pixels, the bar's height, whether the clock runs.
//
// The same script walks the app before brief 23's changes and after them, so the two audits compare step for step.
//
//   SLATE_BASE=http://localhost:4291 node docs/verification/ui-2026-10-23/app/capture.mjs OUT LIVES SIZES [FULL] [SHOTS]
//     LIVES  name=path.json.gz,... (a save as the game writes a slot, gzipped)
//     SIZES  1440x900,844x390m,...  (m: a phone, touch and no hover, its screen the size given)
//     FULL   the sizes that also get a whole-page image of each page (default none)
//     SHOTS  all | none | pages,... (default all): which steps keep a viewport image
//
// A whole page is captured by letting the document grow to hold the screen (the shell's fixed height and the main
// column's own scroller set aside for the image only), so a phone's window never turns upright to fit it.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4291';
const [OUT, LIVES, SIZES, FULL = '', SHOTS = 'all'] = process.argv.slice(2);
const lives = LIVES.split(',').map((s) => s.split('='));
const sizes = SIZES.split(',');
const fullSizes = new Set(FULL.split(',').filter(Boolean));
const shots = SHOTS === 'all' ? null : new Set(SHOTS.split(',').filter(Boolean));
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(launchOptions());
const audit = [];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const wait = (page, ms) => page.waitForTimeout(ms);

/** What the brief names as a defect, measured on the page as it stands. */
function measure() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    if (el.closest('[inert], [hidden], [aria-hidden="true"], .sr-only')) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05;
  };
  const what = (el) => {
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
    const text = (el.innerText ?? el.value ?? '').replace(/\s+/g, ' ').trim().slice(0, 48);
    return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${text ? ` "${text}"` : ''}`;
  };
  // Inside a box that scrolls or clips sideways on purpose (a wide table's own scroller), or inside the closed drawer.
  const xContained = (el) => {
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/auto|scroll|hidden|clip/.test(s.overflowX)) return p;
    }
    return null;
  };
  const out = { vw, vh };
  const dialog = [...document.querySelectorAll('[role=dialog]')].find(visible);
  out.dialog = dialog ? (dialog.getAttribute('aria-label') ?? 'dialog') : null;
  if (dialog) {
    const r = dialog.getBoundingClientRect();
    out.dialogFits = r.top >= -1 && r.left >= -1 && r.bottom <= vh + 1 && r.right <= vw + 1;
    const foot = dialog.querySelector('.modal-foot');
    out.dialogFootVisible = foot ? foot.getBoundingClientRect().bottom <= vh + 1 : null;
  }
  const header = document.querySelector('header.topbar');
  out.headerH = header && visible(header) ? Math.round(header.getBoundingClientRect().height) : 0;
  const main = document.querySelector('main.main');
  out.mainTop = main ? Math.round(main.getBoundingClientRect().top) : null;
  out.mainW = main ? Math.round(main.getBoundingClientRect().width) : null;
  out.contentShare = main ? Math.round((main.getBoundingClientRect().height / vh) * 100) : null;
  const rail = document.querySelector('nav.rail');
  out.railShown = rail ? visible(rail) && rail.getBoundingClientRect().right > 4 : false;
  // The page pushed sideways, with the stylesheet's own clipping set aside for the measure.
  const keep = [document.documentElement.style.overflowX, document.body.style.overflowX];
  document.documentElement.style.overflowX = 'visible'; document.body.style.overflowX = 'visible';
  out.pageWider = Math.max(0, document.documentElement.scrollWidth - vw);
  [document.documentElement.style.overflowX, document.body.style.overflowX] = keep;

  const all = [...document.querySelectorAll('body *')].filter((el) => !['SCRIPT', 'STYLE', 'svg', 'path', 'BR'].includes(el.tagName) && visible(el));
  const bleed = [], cut = [], squeezed = [], clipped = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    const box = xContained(el);
    if (!box && r.right > vw + 1 && !el.closest('.toasts')) bleed.push(`${what(el)} ${Math.round(r.right - vw)}px past the window`);
    else {
      const card = el.parentElement?.closest('.card, .panel, .modal');
      if (card && (!box || card.contains(box) === false) && r.right > card.getBoundingClientRect().right + 1) bleed.push(`${what(el)} ${Math.round(r.right - card.getBoundingClientRect().right)}px past its card`);
    }
    const s = getComputedStyle(el);
    if (s.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) cut.push(what(el));
    if (/hidden|clip/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 2 && !/clamp-|truncate/.test(String(el.className))
      && el !== document.body && el !== document.documentElement && !el.matches('.rail, .shell, .shell-body')) clipped.push(`${what(el)} ${el.scrollHeight - el.clientHeight}px cut`);
    // A column too narrow for its words: the element's own text set in four or more lines in under 120 pixels, counted
    // by the lines its text runs over (a table cell's box is as tall as its row, so the box alone can't say it).
    const ownNodes = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    const own = ownNodes.map((n) => n.textContent).join('').trim();
    if (own.length > 14 && r.width < 120) {
      const tops = new Set();
      for (const n of ownNodes) { const range = document.createRange(); range.selectNodeContents(n); for (const rect of range.getClientRects()) if (rect.width > 0) tops.add(Math.round(rect.top)); }
      if (tops.size >= 4) squeezed.push(`${what(el)} ${Math.round(r.width)}px wide, ${tops.size} lines`);
    }
  }
  out.bleed = bleed.slice(0, 12); out.bleedCount = bleed.length;
  out.cut = cut.slice(0, 12); out.cutCount = cut.length;
  out.squeezed = squeezed.slice(0, 12); out.squeezedCount = squeezed.length;
  out.clipped = clipped.slice(0, 12); out.clippedCount = clipped.length;

  // Touch targets: every visible control, a link in running text set apart (WCAG 2.5.8 excepts it).
  const controls = [...document.querySelectorAll('button, a[href], [role=tab], [role=button], [role=menuitem], summary, input:not([type=hidden]), select, textarea')].filter(visible);
  const small = [];
  let inline = 0;
  for (const el of controls) {
    const r = el.getBoundingClientRect();
    if (el.matches('button.link, a') && el.parentElement?.closest('p, li, dd, td, .prose')) { inline += 1; continue; }
    if (el.matches('input[type=checkbox], input[type=radio]')) { const l = el.closest('label'); if (l) { const lr = l.getBoundingClientRect(); if (lr.height >= 44) continue; } }
    if (r.height < 43.5 || r.width < 43.5) small.push(`${what(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  out.controls = controls.length; out.inlineLinks = inline;
  out.small = small.slice(0, 16); out.smallCount = small.length;

  out.tabs = [...document.querySelectorAll('[role=tablist]')].filter(visible).map((list) => {
    const lr = list.getBoundingClientRect();
    const active = list.querySelector('[aria-selected=true]');
    const ar = active?.getBoundingClientRect();
    const tabs = [...list.querySelectorAll('[role=tab]')];
    const half = tabs.filter((t) => { const r = t.getBoundingClientRect(); return (r.left < lr.left - 1 && r.right > lr.left + 1) || (r.right > lr.right + 1 && r.left < lr.right - 1); }).map((t) => t.innerText.trim());
    return {
      name: list.getAttribute('aria-label'), tabs: tabs.length,
      overflows: list.scrollWidth > list.clientWidth + 1,
      activeVisible: ar ? ar.left >= lr.left - 1 && ar.right <= lr.right + 1 : null,
      halfShown: half,
      cue: !!list.closest('[data-overflow]') || list.matches('[data-overflow]'),
    };
  });
  out.wideTables = [...document.querySelectorAll('table')].filter(visible).map((t) => {
    const box = xContained(t);
    return box ? { scrolls: box.scrollWidth > box.clientWidth + 1, by: box.scrollWidth - box.clientWidth } : { scrolls: false, by: Math.max(0, Math.round(t.getBoundingClientRect().right - vw)) };
  }).filter((t) => t.by > 1);
  const play = document.querySelector('[aria-label="Time Controls"] button');
  out.clock = document.querySelector('.topbar-clock strong')?.textContent ?? null;
  out.timeButton = play?.textContent?.trim() ?? null;
  out.rotate = !!document.querySelector('[data-rotate-screen]');
  out.textLen = (main?.innerText ?? '').length;
  return out;
}

async function shoot(page, file, full) {
  if (!full) { await page.screenshot({ path: file, type: 'jpeg', quality: 72, scale: 'css' }); return; }
  await page.addStyleTag({ content: 'html,body,#root,.shell{height:auto!important;overflow:visible!important}.shell-body{min-height:0}.main{overflow:visible!important;flex:none!important}' }).then((h) => h.evaluate((n) => n.setAttribute('data-cap-full', '')));
  await wait(page, 300);
  await page.screenshot({ path: file, type: 'jpeg', quality: 72, scale: 'css', fullPage: true });
  await page.evaluate(() => document.querySelectorAll('[data-cap-full]').forEach((n) => n.remove()));
  await wait(page, 200);
}

async function step(ctx, name, { full = true } = {}) {
  const { page, life, size, dir } = ctx;
  ctx.n += 1;
  const base = `${String(ctx.n).padStart(2, '0')}-${slug(name)}`;
  await wait(page, 350);
  const m = await page.evaluate(measure).catch((e) => ({ error: String(e).slice(0, 200) }));
  const files = [];
  if (!shots || shots.has(slug(name))) {
    await shoot(page, join(dir, `${base}.jpg`), false); files.push(`${base}.jpg`);
    if (full && fullSizes.has(size) && !m.dialog) { await shoot(page, join(dir, `${base}-full.jpg`), true); files.push(`${base}-full.jpg`); }
  }
  audit.push({ life, size, step: name, files: files.map((f) => `${life}/${size}/${f}`), ...m });
  const flag = [m.pageWider && `wider ${m.pageWider}`, m.bleedCount && `bleed ${m.bleedCount}`, m.cutCount && `cut ${m.cutCount}`, m.squeezedCount && `squeezed ${m.squeezedCount}`, m.clippedCount && `clipped ${m.clippedCount}`, m.smallCount && `small ${m.smallCount}`].filter(Boolean).join(', ');
  console.log(`${life} ${size} ${base}${flag ? `: ${flag}` : ''}`);
}

const isPhone = (size) => size.endsWith('m');
async function press(ctx, locator) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  if (isPhone(ctx.size)) await locator.tap({ timeout: 5000 }); else await locator.click({ timeout: 5000 });
  await wait(ctx.page, 600);
}
async function drawer(ctx, open) {
  const toggle = ctx.page.locator('.rail-toggle');
  if (!(await toggle.isVisible().catch(() => false))) return;
  const expanded = (await toggle.getAttribute('aria-expanded')) === 'true';
  if (expanded !== open) await press(ctx, toggle);
}
async function rail(ctx, name) {
  await drawer(ctx, true);
  const b = ctx.page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  if (!(await b.count())) {
    // The calendar was reached from Home's Open Calendar alone until brief 23.
    await drawer(ctx, false);
    if (name !== 'Calendar' || !(await rail(ctx, 'Home'))) { ctx.problems.push(`no ${name} on the rail`); return false; }
    const open = ctx.page.getByRole('button', { name: /^Open Calendar$/ }).first();
    if (!(await open.count())) { ctx.problems.push('no Calendar on the rail or Home'); return false; }
    await press(ctx, open); await wait(ctx.page, 800);
    ctx.problems.push('Calendar reached from Home (not on the rail)');
    return true;
  }
  await press(ctx, b);
  await drawer(ctx, false);
  await ctx.page.evaluate(() => document.querySelector('main.main')?.scrollTo(0, 0));
  return true;
}
// A screen's own tabs: the first tab list in the page's main column (Money's is named Your Bank).
const tabList = (ctx) => ctx.page.locator('main.main [role=tablist]').first();
async function tabs(ctx, list) {
  const tl = tabList(ctx);
  if (!(await tl.count())) return [];
  return (await tl.getByRole('tab').allInnerTexts()).map((t) => t.split('\n')[0].trim());
}
async function tab(ctx, list, label) {
  let t = tabList(ctx).getByRole('tab', { name: label, exact: true }).first();
  if (!(await t.count())) t = tabList(ctx).getByRole('tab', { name: label }).first();
  if (!(await t.count())) { ctx.problems.push(`${list}: no ${label} tab`); return false; }
  await press(ctx, t);
  await ctx.page.evaluate(() => document.querySelector('main.main')?.scrollTo(0, 0));
  return true;
}

async function open(life, file, size) {
  const [w, h] = size.replace(/m$/, '').split('x').map(Number);
  const phone = isPhone(size);
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, screen: { width: w, height: h },
    deviceScaleFactor: phone ? 3 : 1, isMobile: phone, hasTouch: phone,
  });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 200)}`); });
  const text = gunzipSync(readFileSync(file)).toString('utf8');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(page, 1200);
  const cont = page.getByRole('button', { name: /^Continue$/ }).first();
  if (phone) await cont.tap(); else await cont.click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 }).catch(() => problems.push('no Time Controls after Continue'));
  await wait(page, 1200);
  const dir = join(OUT, life, size); mkdirSync(dir, { recursive: true });
  return { browserCtx: ctx, page, life, size, dir, n: 0, problems };
}

// Updates came with brief 23; on the app before it the walk records it as missing from the rail.
const WORKSPACES = [['Player Profile', null], ['Calendar', null], ['Updates', null], ['School', 'School'], ['Career', 'Career'], ['Money', 'Money'], ['Papers', 'Papers']];

/**
 * Turning a phone upright and back (brief 23, section 2), from the landscape the game is opened in: with the clock
 * running and a menu open, then with a dialog open, then with a form typed into, then with the clock paused, then while
 * Save & Exit is writing the save. Each says what it found, as `checks` in the audit.
 */
const TURN_WAIT = Number(process.env.TURN_WAIT ?? 65_000);
async function turnSuite(life, file, size) {
  const [pw, ph] = size.replace(/m$/, '').split('x').map(Number);
  const ctx = await open(life, file, `${ph}x${pw}m`);
  ctx.size = size; ctx.dir = join(OUT, life, size); mkdirSync(ctx.dir, { recursive: true });
  const { page } = ctx;
  const checks = {};
  const turn = async (upright) => { await page.setViewportSize(upright ? { width: pw, height: ph } : { width: ph, height: pw }); await wait(page, 900); };
  const state = () => page.evaluate(() => ({
    here: document.querySelector('.topbar-here')?.textContent ?? null,
    tab: document.querySelector('main [role=tab][aria-selected=true]')?.textContent?.trim() ?? null,
    scroll: Math.round(document.querySelector('#main')?.scrollTop ?? 0),
    clock: document.querySelector('.topbar-clock strong')?.textContent ?? null,
    running: document.querySelector('.clock-state')?.textContent ?? null,
    button: document.querySelector('[aria-label="Time Controls"] button')?.textContent?.trim() ?? null,
    menu: !!document.querySelector('[role=menu]'),
    dialog: [...document.querySelectorAll('[role=dialog]:not([data-rotate-screen])')].map((d) => d.getAttribute('aria-label')),
    rotate: !!document.querySelector('[data-rotate-screen]'),
    inert: !!document.querySelector('.turn-frame[inert]'),
    focusOnRotate: document.activeElement?.hasAttribute?.('data-rotate-screen') ?? false,
    toast: [...document.querySelectorAll('.toast')].map((t) => t.textContent),
    find: document.querySelector('input[placeholder="Type a name"]')?.value ?? null,
    saved: document.querySelector('[aria-label="Your Save"] span')?.textContent ?? null,
  }));
  try {
    // 1. Running, on Career's Work tab scrolled down, the Advance menu open.
    await rail(ctx, 'Career'); await tab(ctx, 'Career', 'Work');
    await page.evaluate(() => document.querySelector('#main')?.scrollTo(0, 300)); await wait(page, 300);
    const play = page.getByRole('group', { name: 'Time Controls' }).getByRole('button').first();
    if ((await play.innerText()).trim() === 'Play') await press(ctx, play);
    await wait(page, 2500);
    await press(ctx, page.getByRole('group', { name: 'Time Controls' }).getByRole('button', { name: /^Advance/ }).first());
    const before = await state();
    await turn(true);
    const upright = await state();
    await step(ctx, 'Upright, The Clock Was Running', { full: false });
    // A tap and a key behind it reach nothing.
    await page.mouse.click(ph / 4, pw / 2).catch(() => {});
    await page.keyboard.press('Escape'); await page.keyboard.press('h');
    await wait(page, TURN_WAIT);
    const stillUpright = await state();
    await turn(false);
    const back = await state();
    await step(ctx, 'Back In Landscape, Paused', { full: false });
    checks.running = {
      before, upright, stillUpright, back,
      rotateShown: upright.rotate && upright.inert && upright.focusOnRotate,
      pausedUpright: upright.running === 'Paused' && stillUpright.clock === upright.clock,
      keptPlace: back.here === before.here && back.tab === before.tab && Math.abs(back.scroll - before.scroll) <= 2,
      menuKept: back.menu === before.menu,
      stillPaused: back.running === 'Paused' && back.button === 'Play' && back.clock === upright.clock,
      saidWhy: back.toast.some((t) => /upright/.test(t)),
      savedWhileUpright: stillUpright.saved,
    };
    await page.keyboard.press('Escape'); await wait(page, 300);
    await press(ctx, play); await wait(page, 3000);
    const resumed = await state();
    const mins = (t) => { const m = /(\d+):(\d+) (AM|PM)/.exec(t ?? ''); return m ? ((Number(m[1]) % 12) + (m[3] === 'PM' ? 12 : 0)) * 60 + Number(m[2]) : NaN; };
    checks.running.resumed = resumed;
    checks.running.noJump = resumed.running === 'Running' && mins(resumed.clock) - mins(back.clock) <= 1;

    // 2. A dialog open: Sleep.
    const sleep = page.getByRole('group', { name: 'Time Controls' }).getByRole('button', { name: /^Sleep/ }).first();
    if (await sleep.isEnabled()) {
      await press(ctx, sleep);
      const d0 = await state(); await turn(true); await wait(page, 1500); await turn(false); const d1 = await state();
      checks.dialog = { before: d0.dialog, after: d1.dialog, kept: JSON.stringify(d0.dialog) === JSON.stringify(d1.dialog) && d0.dialog.length > 0 };
      await page.keyboard.press('Escape'); await wait(page, 300);
    }
    // 3. A form typed into: the Profile's genre Find.
    if (await rail(ctx, 'Player Profile')) {
      const find = page.locator('input[placeholder="Type a name"]').first();
      if (await find.count()) {
        await find.tap(); await find.fill('drama'); await wait(page, 300);
        // The keyboard up in landscape: a shorter window, the same screen, no rotate screen.
        await page.setViewportSize({ width: ph, height: Math.round(pw * 0.55) }); await wait(page, 600);
        const kb = await state();
        await page.setViewportSize({ width: ph, height: pw }); await wait(page, 600);
        const f0 = await state(); await turn(true); await wait(page, 1500); await turn(false); const f1 = await state();
        checks.form = { keyboardUp: { rotate: kb.rotate }, before: f0.find, after: f1.find, kept: f0.find === 'drama' && f1.find === 'drama', noRotateForKeyboard: !kb.rotate };
      }
    }
    // 4. Paused already: stays paused, nothing said.
    const p0 = await state();
    if (p0.button === 'Pause') { await press(ctx, play); await wait(page, 500); }
    const p1 = await state(); await turn(true); await wait(page, 1500); await turn(false); await wait(page, 400); const p2 = await state();
    checks.paused = { before: p1.running, after: p2.running, quiet: !p2.toast.some((t) => /upright/.test(t)) || p1.toast.some((t) => /upright/.test(t)), kept: p2.running === 'Paused' && p2.clock === p1.clock };
    // 5. Saving: Save & Exit pressed, the phone turned as it writes.
    await drawer(ctx, true);
    const exit = page.getByRole('button', { name: 'Save & Exit' }).first();
    if (await exit.count()) {
      await exit.tap(); await turn(true); const s0 = await state(); await wait(page, 2500); await turn(false); await wait(page, 1200);
      const slots = await page.getByRole('button', { name: /^Continue$/ }).count();
      checks.saving = { rotateDuringSave: s0.rotate, reachedTheSaves: slots > 0 };
      await step(ctx, 'After Save And Exit, Turned During The Save', { full: false });
    }
  } catch (e) {
    ctx.problems.push(`turn suite stopped: ${String(e).slice(0, 240)}`);
  }
  audit.push({ life, size, step: 'turn-suite', checks });
  audit.push({ life, size, step: '(problems)', problems: ctx.problems });
  console.log(`${life} ${size} turn suite: ${JSON.stringify(Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === 'boolean'))])))}`);
  await ctx.browserCtx.close();
}

for (const [life, file] of lives) {
  for (const size of sizes) {
    const [sw, sh] = size.replace(/m$/, '').split('x').map(Number);
    if (isPhone(size) && sh > sw) {
      // Upright: before brief 23 the game played upright, so it's walked as any size; after, it's the turn suite.
      if (process.env.UPRIGHT === 'walk') { /* walked below */ } else { await turnSuite(life, file, size); continue; }
    }
    const ctx = await open(life, file, size);
    const { page } = ctx;
    try {
      await step(ctx, 'Home');
      if (isPhone(ctx.size) && await page.locator('.rail-toggle').isVisible().catch(() => false)) { await drawer(ctx, true); await step(ctx, 'Navigation Open', { full: false }); await drawer(ctx, false); }
      for (const [dest, list] of WORKSPACES) {
        if (!(await rail(ctx, dest))) continue;
        const names = list ? await tabs(ctx, list) : [];
        if (!names.length) { await step(ctx, dest); continue; }
        for (const label of names) if (await tab(ctx, list, label)) await step(ctx, `${dest} ${label}`);
      }
      // Menus and dialogs, from Home.
      await rail(ctx, 'Home');
      for (const menu of ['Look After Yourself', 'Advance']) {
        const b = page.getByRole('group', { name: 'Time Controls' }).getByRole('button', { name: new RegExp(`^${menu}`) }).first();
        if (await b.count()) { await press(ctx, b); await step(ctx, `${menu} Menu`, { full: false }); await page.keyboard.press('Escape'); await wait(page, 300); }
      }
      const help = page.getByRole('group', { name: 'Your Save' }).getByRole('button', { name: /Guide|How This Works/ }).first();
      await page.keyboard.press('?'); await wait(page, 800);
      if (await page.locator('[role=dialog]').count()) { await step(ctx, 'How This Works', { full: false }); await page.keyboard.press('Escape'); await wait(page, 300); }
      else if (await help.count()) { await press(ctx, help); await step(ctx, 'Guide', { full: false }); await page.keyboard.press('Escape'); await wait(page, 300); }
      const sleep = page.getByRole('group', { name: 'Time Controls' }).getByRole('button', { name: /^Sleep/ }).first();
      if (await sleep.count() && await sleep.isEnabled()) { await press(ctx, sleep); if (await page.locator('[role=dialog]').count()) { await step(ctx, 'Sleep Dialog', { full: false }); await page.keyboard.press('Escape'); await wait(page, 300); } }
    } catch (e) {
      ctx.problems.push(`walk stopped: ${String(e).slice(0, 240)}`);
    }
    audit.push({ life, size, step: '(problems)', problems: ctx.problems });
    if (ctx.problems.length) console.log(`${life} ${size} problems: ${ctx.problems.join(' | ')}`);
    await ctx.browserCtx.close();
  }
}
await browser.close();
writeFileSync(join(OUT, 'audit.json'), `${JSON.stringify(audit, null, 1)}\n`);
console.log(`${audit.length} entries written to ${join(OUT, 'audit.json')}`);
