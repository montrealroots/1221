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

    if (overflowsX || overflowsY || escapesViewport) {
      seen.add(key);
      problems.push({
        el: label,
        text,
        kind: overflowsX ? 'content wider than box' : overflowsY ? 'content taller than box' : 'past the right edge',
        by: Math.round(overflowsX ? el.scrollWidth - el.clientWidth
          : overflowsY ? el.scrollHeight - el.clientHeight
          : rect.right - window.innerWidth),
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

    for (const [label, pattern] of [
      ['world', /^world$/i], ['calendar', /calendar/i], ['bank', /^bank$/i],
      ['character', /character/i], ['relationships', /relationships/i],
      ['property', /^property$/i], ['projects', /projects/i], ['settings', /settings/i],
    ]) {
      const link = page.getByRole('button', { name: pattern }).first();
      if (!(await link.count())) continue;
      await link.click().catch(() => {});
      await page.waitForTimeout(1100);
      scrollsSideways = (await probe(label)) || scrollsSideways;
    }
    await shoot('04-deep');
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
