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
      ['property', /^property$/i], ['projects', /projects/i], ['settings', /settings/i],
      ['casting', /^casting$/i], ['industry', /^industry$/i],
    ]) {
      await openRail();
      const link = page.getByRole('button', { name: pattern }).first();
      if (!(await link.count())) continue;
      await link.click().catch(() => {});
      await page.waitForTimeout(1100);
      scrollsSideways = (await probe(label)) || scrollsSideways;
    }
    await shoot('04-deep');

    // The markets board, which is the widest table in the industry tab.
    const markets = page.getByRole('tab', { name: /^Markets$/ }).first();
    if (await markets.count()) {
      await markets.click().catch(() => {});
      await page.waitForTimeout(1200);
      scrollsSideways = (await probe('industry markets')) || scrollsSideways;
      await page.locator('.list-item').first().click().catch(() => {});
      await page.waitForTimeout(700);
      scrollsSideways = (await probe('industry markets open')) || scrollsSideways;
    }

    // Modals hold the densest text in the game, so they are probed open.
    await openRail();
    const casting = page.getByRole('button', { name: /^casting$/i }).first();
    if (await casting.count()) {
      await casting.click().catch(() => {});
      await page.waitForTimeout(1200);
      const dossier = page.getByRole('button', { name: /^The Project$/ }).first();
      if (await dossier.count()) {
        await dossier.click().catch(() => {});
        await page.waitForTimeout(1000);
        scrollsSideways = (await probe('project dossier')) || scrollsSideways;
        await shoot('05-dossier');
        await page.getByRole('button', { name: /^Close$/ }).first().click().catch(() => {});
        await page.waitForTimeout(500);
      }
    }

    await openRail();
    const projects = page.getByRole('button', { name: /^projects$/i }).first();
    if (await projects.count()) {
      await projects.click().catch(() => {});
      await page.waitForTimeout(1000);
      const create = page.getByRole('button', { name: /Start something new/i }).first();
      if (await create.count()) {
        await create.click().catch(() => {});
        await page.waitForTimeout(900);
        const builder = page.getByRole('button', { name: /Build It From Bullet Points/i }).first();
        if (await builder.count()) {
          await builder.click().catch(() => {});
          await page.waitForTimeout(500);
          const example = page.getByRole('button', { name: /Fill It With An Example/i }).first();
          if (await example.count()) await example.click().catch(() => {});
          await page.waitForTimeout(900);
        }
        scrollsSideways = (await probe('new project and logline builder')) || scrollsSideways;
        await shoot('06-logline');

        // Make the project, then open the room where you go to somebody by
        // name. That dialog holds the densest new text in the game: a search
        // over the whole roster, a set of terms, and an audit underneath.
        const make = page.getByRole('button', { name: /^Create$/ }).first();
        if (await make.count()) {
          await make.click().catch(() => {});
          await page.waitForTimeout(1200);
          const castTab = page.getByRole('tab', { name: /^Cast/ }).first();
          if (await castTab.count()) {
            await castTab.click().catch(() => {});
            await page.waitForTimeout(900);
            scrollsSideways = (await probe('project cast tab')) || scrollsSideways;
            const approach = page.getByRole('button', { name: /^Approach Somebody$/ }).first();
            if (await approach.count()) {
              await approach.click().catch(() => {});
              await page.waitForTimeout(1600);
              // Pick somebody, so the terms panel and the meters are on screen.
              await page.locator('.modal .list-item').first().click().catch(() => {});
              await page.waitForTimeout(700);
              scrollsSideways = (await probe('approach a craft')) || scrollsSideways;
              await shoot('07-approach');
              await page.getByRole('button', { name: /^Close$/ }).first().click().catch(() => {});
              await page.waitForTimeout(500);
            }
          }
        }
      }
    }

    // The trade press: the front page and one publication's profile. The
    // stories here are set in each outlet's own face, which is the widest
    // range of type anywhere in the game and the likeliest place for a line
    // to break out of its box.
    await openRail();
    const industryForPress = page.getByRole('button', { name: /^industry$/i }).first();
    if (await industryForPress.count()) {
      await industryForPress.click().catch(() => {});
      await page.waitForTimeout(1200);
      const pressTab = page.getByRole('tab', { name: /The Press/ }).first();
      if (await pressTab.count()) {
        await pressTab.click().catch(() => {});
        await page.waitForTimeout(2200);
        scrollsSideways = (await probe('the press front page')) || scrollsSideways;
        await shoot('09-press');
        // The tab's accessible name carries its badge — 'The Publications 43' — so
        // an anchored match never finds it.
        const publications = page.getByRole('tab', { name: /The Publications/ }).first();
        if (await publications.count()) {
          await publications.click().catch(() => {});
          await page.waitForTimeout(900);
          scrollsSideways = (await probe('the publications list')) || scrollsSideways;
          await page.locator('.list-item').first().click().catch(() => {});
          await page.waitForTimeout(1600);
          scrollsSideways = (await probe('a publication profile')) || scrollsSideways;
          await shoot('10-outlet');
          await page.getByRole('button', { name: /^Close$/ }).first().click().catch(() => {});
          await page.waitForTimeout(400);
        }
      }
    }

    // A person's profile, and the tab that keeps the record and the save apart.
    await openRail();
    const industry = page.getByRole('button', { name: /^industry$/i }).first();
    if (await industry.count()) {
      await industry.click().catch(() => {});
      await page.waitForTimeout(1200);
      const people = page.getByRole('tab', { name: /^People/ }).first();
      if (await people.count()) {
        await people.click().catch(() => {});
        await page.waitForTimeout(1800);
        scrollsSideways = (await probe('the people tab')) || scrollsSideways;
        await page.locator('.list-item').first().click().catch(() => {});
        await page.waitForTimeout(1200);
        scrollsSideways = (await probe('a person profile')) || scrollsSideways;
        const inSave = page.getByRole('tab', { name: /In This Save/ }).first();
        if (await inSave.count()) {
          await inSave.click().catch(() => {});
          await page.waitForTimeout(700);
          scrollsSideways = (await probe('a person profile, in this save')) || scrollsSideways;
        }
        await shoot('08-profile');
        await page.getByRole('button', { name: /^Close$/ }).first().click().catch(() => {});
        await page.waitForTimeout(400);
      }
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
