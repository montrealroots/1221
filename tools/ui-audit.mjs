/**
 * Walks the running app and reports anything whose text escapes its box.
 *
 * A layout bug is hard to argue about from source. This opens the real app in
 * a real browser at several widths, clicks through startup and into the game,
 * and measures every element: if its content is wider than the box drawn for
 * it, or it sticks out past the viewport, it is reported with the text that
 * did it. Screenshots are written alongside so the result can be looked at.
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4173';
const OUT = process.argv[2] ?? 'ui-audit';
mkdirSync(OUT, { recursive: true });

const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 },
];

/** Finds elements whose content does not fit the box drawn for them. */
const OVERFLOW_PROBE = `(() => {
  const problems = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (style.overflow === 'auto' || style.overflow === 'scroll') continue;
    if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue;
    // Deliberate truncation is not bleed. An ellipsis means the text is longer
    // than the box on purpose and is being cut cleanly, which is the fix, not
    // the fault. Same for a line clamp.
    if (style.textOverflow === 'ellipsis' && style.overflow === 'hidden') continue;
    if (style.webkitLineClamp && style.webkitLineClamp !== 'none') continue;
    // Inside an SVG a bounding rect is the shape's geometry, not a layout box:
    // a country path that runs past the viewBox is clipped by the SVG viewport
    // and nothing escapes onto the page. Measuring those reports the whole of
    // Asia as bleeding off the right edge of a map showing the Atlantic.
    if (el.ownerSVGElement) continue;
    // An element clipped to a pixel on purpose — a screen-reader-only input —
    // has content wider than its box by definition.
    if (style.clip && style.clip !== 'auto') continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    // Inside something that scrolls sideways on purpose — a tab strip, a wide
    // table — sitting past the right edge is how scrolling looks, not bleed.
    // The container itself is still measured; its children are not.
    let scrollableAncestor = false;
    for (let parent = el.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const ps = getComputedStyle(parent);
      if (ps.overflowX === 'auto' || ps.overflowX === 'scroll' || ps.overflow === 'auto' || ps.overflow === 'scroll') {
        scrollableAncestor = true;
        break;
      }
    }
    if (scrollableAncestor) continue;

    const text = (el.textContent || '').trim().slice(0, 70);
    const label = el.tagName.toLowerCase()
      + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
    const key = label + '|' + text;
    if (seen.has(key)) continue;

    // Content wider or taller than the box that was drawn for it.
    const overflowsX = el.scrollWidth - el.clientWidth > 1;
    const overflowsY = style.overflowY === 'hidden' && el.scrollHeight - el.clientHeight > 1;
    // Or sticking out past the right edge of the window.
    const escapesViewport = rect.right > window.innerWidth + 1;

    // A column squeezed so narrow that its words break a few characters at a
    // time reads as broken even though nothing has technically overflowed —
    // "Ezr a…" stacked down the page is not a wrapped word, it is a bug. The
    // test: a leaf holding real text, no wider than a short word, and much
    // taller than it is wide.
    const leaf = el.children.length === 0 && text.length >= 10;
    const longestWord = leaf ? Math.max(...text.split(/\s+/).map((w) => w.length)) : 0;
    const crushed = leaf
      && rect.width > 0 && rect.width < 72
      && rect.height > rect.width * 1.8
      && longestWord >= 5;

    if (overflowsX || overflowsY || escapesViewport || crushed) {
      seen.add(key);
      problems.push({
        el: label,
        text,
        kind: overflowsX ? 'content wider than box'
          : overflowsY ? 'content taller than box'
          : escapesViewport ? 'past the right edge'
          : 'column crushed too narrow to read',
        by: Math.round(overflowsX ? el.scrollWidth - el.clientWidth
          : overflowsY ? el.scrollHeight - el.clientHeight
          : escapesViewport ? rect.right - window.innerWidth
          : rect.width),
      });
    }
  }
  const doc = document.documentElement;
  return { problems, pageScrollsSideways: doc.scrollWidth > doc.clientWidth + 1 };
})()`;

// The environment ships a Chromium that may not match this Playwright build,
// so point at it rather than downloading another one.
const EXECUTABLE = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXECUTABLE });
let totalProblems = 0;

for (const size of WIDTHS) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Let the startup sequence run.
  await page.waitForTimeout(3500);

  const screens = [];
  const shoot = async (name) => {
    await page.screenshot({ path: `${OUT}/${size.name}-${name}.png`, fullPage: false });
    screens.push(name);
  };

  await shoot('01-startup');

  // Into a new save.
  const newGame = page.getByRole('button', { name: /new (save|game)|start|empty slot|create/i }).first();
  if (await newGame.count()) {
    await newGame.click().catch(() => {});
    await page.waitForTimeout(1200);
    await shoot('02-creation');
  }

  // Into the game itself, which is where nearly all of the text lives.
  const findings = [];
  const probe = async (where) => {
    const r = await page.evaluate(OVERFLOW_PROBE);
    for (const p of r.problems) findings.push({ ...p, where });
    return r.pageScrollsSideways;
  };

  let scrollsSideways = await probe('creation');

  for (let i = 0; i < 4; i++) {
    const next = page.getByRole('button', { name: /^(next|continue)/i }).first();
    if (!(await next.count())) break;
    await next.click().catch(() => {});
    await page.waitForTimeout(700);
    scrollsSideways = (await probe(`creation step ${i + 2}`)) || scrollsSideways;
  }

  const begin = page.getByRole('button', { name: /it.s time to be great|begin|start save/i }).first();
  if (await begin.count()) {
    await begin.click().catch(() => {});
    await page.waitForTimeout(3000);
    await shoot('03-home');
    scrollsSideways = (await probe('home')) || scrollsSideways;

    // Guided mode covers the screen it is explaining, and on a narrow window
    // the navigation is behind a button. Both have to be dealt with or the
    // audit only ever measures the home screen.
    const gotIt = page.getByRole('button', { name: /^got it$/i }).first();
    if (await gotIt.count()) { await gotIt.click().catch(() => {}); await page.waitForTimeout(400); }
    const openRail = async () => {
      const toggle = page.getByRole('button', { name: /toggle navigation/i }).first();
      if (!(await toggle.count())) return;
      const railVisible = await page.locator('nav.rail[data-open="true"]').count();
      if (railVisible === 0) { await toggle.click().catch(() => {}); await page.waitForTimeout(400); }
    };
    await openRail();

    for (const [label, pattern] of [
      ['world', /^world$/i], ['calendar', /calendar/i], ['bank', /^bank$/i],
      ['character', /character/i], ['relationships', /relationships/i],
      ['property', /^property$/i], ['vehicles', /^vehicles$/i],
      ['travel', /^travel$/i], ['work', /^work$/i], ['health', /^health$/i],
      ['education', /education/i], ['shopping', /shopping/i],
      ['insurance', /insurance/i], ['social', /^social$/i],
      ['history', /^history$/i], ['settings', /settings/i],
    ]) {
      await openRail();
      const link = page.getByRole('button', { name: pattern }).first();
      if (!(await link.count())) continue;
      await link.click().catch(() => {});
      await page.waitForTimeout(1100);
      scrollsSideways = (await probe(label)) || scrollsSideways;
    }
    await shoot('04-deep');


  // The city: where you are, what is here, and everywhere you could go.
  await openRail();
  const cityNav = page.getByRole('button', { name: /^the city$/i }).first();
  if (await cityNav.count()) {
    await cityNav.click().catch(() => {});
    await page.waitForTimeout(1400);
    scrollsSideways = (await probe('the city')) || scrollsSideways;
    await shoot('15-city');
    const menu = page.getByRole('button', { name: /See The Menu/i }).first();
    const firstPlace = page.getByRole('button', { name: /^(Drive|Walk|Taxi|Transit)$/ }).first();
    if (await firstPlace.count()) {
      await firstPlace.click().catch(() => {});
      await page.waitForTimeout(1400);
      scrollsSideways = (await probe('somewhere in the city')) || scrollsSideways;
      const menuNow = page.getByRole('button', { name: /See The Menu/i }).first();
      if (await menuNow.count()) {
        await menuNow.click().catch(() => {});
        await page.waitForTimeout(900);
        scrollsSideways = (await probe('a menu')) || scrollsSideways;
        await shoot('16-menu');
        await page.getByRole('button', { name: /^Leave It$/ }).first().click().catch(() => {});
        await page.waitForTimeout(300);
      }
    }
    void menu;
  }

  // God mode, which puts everything in gold and every number on the two
  // hundred scale. The widest text and the biggest numbers in the game, so if
  // anything is going to bleed it is this.
  await openRail();
  const settingsForGod = page.getByRole('button', { name: /settings/i }).first();
  if (await settingsForGod.count()) {
    await settingsForGod.click().catch(() => {});
    await page.waitForTimeout(900);
    const godToggle = page.getByRole('checkbox').filter({ hasNot: page.locator('[disabled]') });
    const labels = page.locator('label').filter({ hasText: /^God Mode$/ });
    if (await labels.count()) {
      await labels.first().locator('input[type="checkbox"]').click().catch(() => {});
      await page.waitForTimeout(1400);
      scrollsSideways = (await probe('settings, with god mode on')) || scrollsSideways;
      await shoot('22-god-settings');

      await openRail();
      const character = page.getByRole('button', { name: /^character$/i }).first();
      if (await character.count()) {
        await character.click().catch(() => {});
        await page.waitForTimeout(1000);
        scrollsSideways = (await probe('every attribute in gold, out of two hundred')) || scrollsSideways;
        await shoot('23-god-attributes');
        const traitsTab = page.getByRole('tab', { name: /^Traits$/ }).first();
        if (await traitsTab.count()) {
          await traitsTab.click().catch(() => {});
          await page.waitForTimeout(800);
          scrollsSideways = (await probe('every trait in gold')) || scrollsSideways;
          await shoot('24-god-traits');
        }
      }

    }
    void godToggle;
  }

  }

  const result = { problems: findings, pageScrollsSideways: scrollsSideways };
  totalProblems += result.problems.length;

  console.log(`\n${size.name} (${size.width}x${size.height})`);
  console.log(`  screens: ${screens.join(', ')}`);
  console.log(`  page scrolls sideways: ${result.pageScrollsSideways ? 'YES — this is a bug' : 'no'}`);
  if (consoleErrors.length) console.log(`  page errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  if (result.problems.length === 0) {
    console.log('  no overflow');
  } else {
    console.log(`  ${result.problems.length} overflowing element(s):`);
    for (const p of result.problems.slice(0, 12)) {
      console.log(`    [${p.where}] ${p.kind} by ${p.by}px — ${p.el}`);
      if (p.text) console.log(`      "${p.text}"`);
    }
  }
  await context.close();
}

await browser.close();
console.log(`\n${totalProblems} overflowing element(s) in total. Screenshots in ${OUT}/`);
