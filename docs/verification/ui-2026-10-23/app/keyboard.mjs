// Brief 23's keyboard and zoom checks on the built app (criteria X2, X4 and L4): a desktop window driven by the keyboard
// alone, then the same life at 200% zoom. Playwright's Chromium, not a person at a keyboard, and not a screen reader:
// what it says is what the page does with key presses and where the focus goes.
//
//   SLATE_BASE=http://localhost:4292 node docs/verification/ui-2026-10-23/app/keyboard.mjs OUT.json SAVE.json.gz
//
// 1. Tab from the top: the skip link first, then the bar, the menu and the page, each control with a ring that shows and
//    none behind the bar; Enter on the skip link puts the focus in the page.
// 2. The menu says where you are (`aria-current`) in the words the page's head uses.
// 3. A menu (Advance) opens on Enter, says so (`aria-expanded`), and closes on Escape with the focus back on its button.
// 4. A dialog (Sleep) keeps the focus inside it both ways round, and gives it back to Sleep on Escape.
// 5. A tab bar (Money's) moves with the arrows, Home and End, the selected tab said (`aria-selected`).
// 6. At 200% (a 1280×720 window read at 640×360, as the browser lays it out): the bar's controls, the menu's eight places,
//    Home's five sections and every control Home has at 100% are there, and the page is no wider than the window.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4292';
const [OUT, SAVE] = process.argv.slice(2);
const browser = await chromium.launch(launchOptions());
const wait = (page, ms) => page.waitForTimeout(ms);
const out = { base: BASE, save: SAVE, checks: {}, problems: [] };

async function open(width, height, scale = 1) {
  const ctx = await browser.newContext({ viewport: { width, height }, screen: { width, height }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => out.problems.push(`page error: ${String(e).slice(0, 200)}`));
  const text = gunzipSync(readFileSync(SAVE)).toString('utf8');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(page, 1200);
  await page.getByRole('button', { name: /^Continue$/ }).first().click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 });
  await wait(page, 1200);
  // Paused, so nothing the clock does moves the page under the keys.
  const pause = page.getByRole('button', { name: /^Pause$/ }).first();
  if (await pause.count()) { await pause.click(); await wait(page, 300); }
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  return { ctx, page };
}

/** Where the focus is, and whether a ring shows on it. */
const focused = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
  const bar = document.querySelector('header.topbar')?.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    name: (el.getAttribute('aria-label') || el.innerText || el.value || el.id || '').replace(/\s+/g, ' ').trim().slice(0, 48),
    ring,
    inView: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
    // Covered, by the bar or anything else: what's on top at the control's centre isn't it or inside it. The skip link
    // sits over the bar, in front of it, which isn't covered.
    underBar: (() => { const x = r.left + r.width / 2, y = r.top + r.height / 2; if (y < 0 || y > innerHeight) return false; const top = document.elementFromPoint(x, y); return Boolean(top && top !== el && !el.contains(top) && bar && top.closest('header.topbar')); })(),
    where: el.closest('[role=dialog]') ? 'dialog' : el.closest('header.topbar') ? 'bar' : el.closest('nav.rail') ? 'menu' : el.closest('main') ? 'page' : el.classList.contains('skip-link') ? 'skip' : 'other',
  };
});

/**
 * The focus's starting point at the top of the page, as a page just opened has it: a press (Pause's) moves where the next
 * Tab starts from, and blurring doesn't move it back.
 */
const fromTop = (page) => page.evaluate(() => { const t = document.createElement('div'); t.tabIndex = -1; document.body.prepend(t); t.focus(); t.remove(); });

// 1-5 at 1440×900.
{
  const { ctx, page } = await open(1440, 900);
  await fromTop(page);
  const order = [];
  // The skip link slides in over 150 ms (`.skip-link`'s transition), so the first stop is read once it has.
  for (let i = 0; i < 70; i++) { await page.keyboard.press('Tab'); if (i === 0) await wait(page, 300); order.push(await focused(page)); }
  const real = order.filter(Boolean);
  const firstOf = (w) => real.findIndex((f) => f.where === w);
  out.checks.tabOrder = {
    stops: real.length,
    first: real[0],
    sequence: [...new Set(real.map((f) => f.where))],
    orderSensible: firstOf('skip') === 0 && firstOf('bar') < firstOf('menu') && firstOf('menu') < firstOf('page'),
    withoutRing: real.filter((f) => !f.ring).map((f) => `${f.where}: ${f.name}`),
    behindBar: real.filter((f) => f.underBar).map((f) => `${f.where}: ${f.name}`),
    outOfView: real.filter((f) => !f.inView).map((f) => `${f.where}: ${f.name}`),
  };
  await fromTop(page);
  await page.keyboard.press('Tab');
  const skip = await focused(page);
  await page.keyboard.press('Enter'); await wait(page, 300);
  out.checks.skipLink = { first: skip?.name ?? null, focusIn: await page.evaluate(() => (document.activeElement?.closest('main') ? 'page' : document.activeElement?.tagName ?? null)) };

  // Each place on the menu, opened from the keyboard: the menu marks it, and the trail at the page's head ends on its name.
  // Your name at the menu's foot opens the Player Profile, and is said to (its label), so the Profile is what it marks.
  const places = await page.evaluate(() => [...document.querySelectorAll('nav.rail .rail-item')].map((b, i) => ({ i, label: b.textContent.replace(/\s+/g, ' ').replace(/\d+\+?$/, '').trim(), opens: /Open Your Player Profile/.test(b.getAttribute('aria-label') ?? '') ? 'Player Profile' : null })));
  out.checks.current = [];
  for (const { i, label, opens } of places) {
    await page.locator('nav.rail .rail-item').nth(i).focus();
    await page.keyboard.press('Enter'); await wait(page, 700);
    const place = opens ?? label;
    out.checks.current.push(await page.evaluate(({ label, place }) => {
      const marked = document.querySelector('nav.rail [aria-current="page"]')?.textContent?.replace(/\s+/g, ' ').replace(/\d+\+?$/, '').trim() ?? null;
      const crumbs = [...document.querySelectorAll('nav.breadcrumbs > span')].map((c) => c.textContent.replace('›', '').trim());
      return { pressed: label, marked, trail: crumbs.at(-1) ?? null, same: marked === place && (crumbs.length === 0 ? place === 'Home' : crumbs.at(-1) === place) };
    }, { label, place }));
  }

  const advance = page.getByRole('button', { name: /^Advance/ }).first();
  await advance.focus(); await page.keyboard.press('Enter'); await wait(page, 400);
  const opened = await page.evaluate(() => ({ expanded: document.activeElement?.closest('[aria-expanded]')?.getAttribute('aria-expanded') ?? document.querySelector('[aria-haspopup][aria-expanded="true"]')?.getAttribute('aria-expanded') ?? null, menu: document.querySelectorAll('[role=menu]').length, items: document.querySelectorAll('[role=menuitem]').length }));
  await page.keyboard.press('Escape'); await wait(page, 300);
  const closed = await page.evaluate(() => ({ menu: document.querySelectorAll('[role=menu]').length, focus: (document.activeElement?.textContent ?? '').replace(/\s+/g, ' ').trim() }));
  out.checks.menu = { opened, closed, returnsFocus: /^Advance/.test(closed.focus), closesOnEscape: closed.menu === 0 && opened.menu > 0 };

  const sleep = page.getByRole('button', { name: /^Sleep$/ }).first();
  await sleep.focus(); await page.keyboard.press('Enter'); await wait(page, 600);
  const inside = [];
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); inside.push((await focused(page))?.where ?? 'none'); }
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Shift+Tab'); inside.push((await focused(page))?.where ?? 'none'); }
  await page.keyboard.press('Escape'); await wait(page, 400);
  const after = await page.evaluate(() => ({ dialogs: document.querySelectorAll('[role=dialog]').length, focus: (document.activeElement?.textContent ?? '').trim() }));
  out.checks.dialog = { stops: inside.length, allInside: inside.every((w) => w === 'dialog'), outside: inside.filter((w) => w !== 'dialog'), closesOnEscape: after.dialogs === 0, returnsFocus: after.focus === 'Sleep' };

  const money = page.locator('nav.rail').getByRole('button', { name: /^Money/ }).first();
  await money.focus(); await page.keyboard.press('Enter'); await wait(page, 900);
  const selected = () => page.evaluate(() => document.querySelector('main [role=tablist] [aria-selected="true"]')?.textContent?.trim() ?? null);
  const tabs = await page.evaluate(() => [...document.querySelectorAll('main [role=tablist] [role=tab]')].map((t) => t.textContent.trim()));
  await page.locator('main [role=tablist] [aria-selected="true"]').first().focus();
  const start = await selected();
  await page.keyboard.press('ArrowRight'); await wait(page, 300); const right = await selected();
  await page.keyboard.press('End'); await wait(page, 300); const end = await selected();
  await page.keyboard.press('Home'); await wait(page, 300); const home = await selected();
  out.checks.tabs = { tabs, start, right, end, home, moves: right === tabs[1] && end === tabs.at(-1) && home === tabs[0] };
  await ctx.close();
}

// 6. Home at 100% and at 200%.
async function homeAt(width, height, scale) {
  const { ctx, page } = await open(width, height, scale);
  const menuButton = page.getByRole('button', { name: /^Menu$/ }).first();
  const drawer = await menuButton.count() && await menuButton.isVisible();
  if (drawer) { await menuButton.click(); await wait(page, 400); }
  const seen = await page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const names = (sel) => [...document.querySelectorAll(sel)].filter(visible).map((el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').replace(/\d[\d,.:]*/g, '#').trim()).filter(Boolean);
    return {
      bar: names('header.topbar button'),
      menu: names('nav.rail .rail-item'),
      sections: names('main h2'),
      controls: names('main button, main a[href], main [role=tab], main select, main input'),
      pageWider: document.documentElement.scrollWidth - innerWidth,
      mainTop: Math.round(document.querySelector('main')?.getBoundingClientRect().top ?? -1),
      barBottom: Math.round(document.querySelector('header.topbar')?.getBoundingClientRect().bottom ?? -1),
    };
  });
  await ctx.close();
  return { drawer: Boolean(drawer), ...seen };
}
const at100 = await homeAt(1280, 720, 1);
const at200 = await homeAt(640, 360, 2);
const missing = (a, b) => [...new Set(a)].filter((x) => !b.includes(x));
out.checks.zoom = {
  at100: { sections: at100.sections, menu: at100.menu.length, controls: at100.controls.length, pageWider: at100.pageWider },
  at200: { drawer: at200.drawer, bar: at200.bar, sections: at200.sections, menu: at200.menu, controls: at200.controls.length, pageWider: at200.pageWider, mainBelowBar: at200.mainTop >= at200.barBottom },
  sectionsLost: missing(at100.sections, at200.sections),
  menuLost: missing(at100.menu, at200.menu),
  controlsLost: missing(at100.controls, at200.controls),
  barControls: ['Pause', 'Play', 'Sleep', 'Look After Yourself', 'Advance', 'Menu'].filter((n) => at200.bar.some((b) => b.startsWith(n))),
};

await browser.close();
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.checks, null, 1));
console.log(out.problems.length ? out.problems.join('\n') : 'no page errors');
