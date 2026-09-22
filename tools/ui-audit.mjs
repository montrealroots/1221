/**
 * Walks the running app and reports what the layout got wrong.
 *
 * A layout bug is hard to argue about from source. This opens the real app in
 * a real browser at several widths, clicks through startup and into the game,
 * and measures every element.
 *
 * Two kinds of fault. Text that escapes its box: content wider than the box
 * drawn for it, or sticking out past the viewport. And things that ought to
 * line up and do not — a heading and the row under it starting a few pixels
 * apart. The second kind is the one a person notices and cannot name, and it
 * is almost never a mistake in the markup: a chip's text sits inside its own
 * padding and border, so a chip under a label starts nine pixels to the right
 * of it while every plain paragraph starts level. Off by a few pixels is a
 * bug; off by a lot is an indent somebody meant.
 *
 * Screenshots are written alongside so the result can be looked at.
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
    // A menu hanging off a button is wider than the button, which is what a
    // menu is. The anchor's scrollWidth counts the absolutely positioned thing
    // inside it and calls that a two hundred pixel overflow.
    let popover = false;
    for (const inner of el.querySelectorAll('*')) {
      const is = getComputedStyle(inner);
      if (is.position !== 'absolute' && is.position !== 'fixed') continue;
      if (inner.getBoundingClientRect().width > rect.width) { popover = true; break; }
    }
    const overflowsX = !popover && el.scrollWidth - el.clientWidth > 1;
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

/**
 * Finds stacked blocks whose text does not start at the same place.
 *
 * Measures where the *text* begins — past the border and padding — rather than
 * where the box begins, because that is what the eye lines up. Anything from
 * half a pixel to twelve is reported: below that is rounding, above it is a
 * deliberate indent.
 */
const ALIGNMENT_PROBE = `(() => {
  const problems = [];
  const seen = new Set();

  /** A box you can see the edge of: it has a border or a filled background. */
  const isDrawn = (cs) => {
    const bordered = parseFloat(cs.borderLeftWidth) > 0 && cs.borderLeftStyle !== 'none';
    const filled = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
    return bordered || filled;
  };

  /**
   * Where a block reads as starting.
   *
   * A big drawn box — a card, a table of days — carries its own edge, and the
   * eye lines up on that edge whatever the padding does inside it. A small
   * drawn box is a chip, and a chip reads as a word with a highlight behind
   * it, so the eye lines up on the word. Everything else is plain text and
   * starts where its content starts. Measuring the wrong one of these reports
   * the calendar as broken because "Sun" is padded inside its cell.
   */
  const textLeft = (el) => {
    let probe = el;
    let guard = 0;
    for (;;) {
      const cs = getComputedStyle(probe);
      const rect = probe.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      if (isDrawn(cs)) {
        // Height alone says pill or box, and a plain number says it better
        // than a multiple of the font size did: a highlighted navigation item
        // is thirty-four pixels tall and its highlight is a highlight, while a
        // calendar cell is ninety-six and its background is a container.
        const short = rect.height <= 40;
        return short
          ? rect.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft)
          : rect.left;
      }
      // Centered text has no left edge to line anything up with. A tab strip
      // sits under a heading and its first tab's words float in the middle of
      // their own cell; that is the design, not a fault.
      if (cs.textAlign === 'center' || cs.textAlign === 'right') return null;
      let next = null;
      if (guard++ < 12) {
        for (const child of probe.children) {
          const ccs = getComputedStyle(child);
          if (ccs.display === 'none' || ccs.visibility === 'hidden') continue;
          if (ccs.position === 'absolute' || ccs.position === 'fixed') continue;
          if (!(child.textContent || '').trim()) continue;
          next = child;
          break;
        }
      }
      if (!next) return rect.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
      probe = next;
    }
  };

  const name = (el) => el.tagName.toLowerCase()
    + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');

  for (const parent of document.querySelectorAll('body *')) {
    const ps = getComputedStyle(parent);
    if (ps.display === 'none' || ps.visibility === 'hidden') continue;
    // Only stacks. A row lays things out side by side and they share a top,
    // not a left, so a left-edge check has nothing to say about one.
    const stacks = ps.display === 'block'
      || ((ps.display === 'flex' || ps.display === 'inline-flex') && ps.flexDirection === 'column');
    if (!stacks) continue;

    const kids = [];
    for (const child of parent.children) {
      const cs = getComputedStyle(child);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      if (cs.position === 'absolute' || cs.position === 'fixed') continue;
      if (cs.float !== 'none') continue;
      if (!(child.textContent || '').trim()) continue;
      const rect = child.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      // A child narrower than its parent is not trying to fill the column and
      // has no business lining up with it — a centered button, a short pill.
      if (rect.width < parent.getBoundingClientRect().width * 0.5) continue;
      // Nor is a whole region of the page a label and the content under it.
      // The top bar and the body below it are both children of the shell and
      // have no reason on earth to share a left edge.
      if (rect.height > 220) continue;
      if (cs.textAlign === 'center' || cs.textAlign === 'right') continue;
      const left = textLeft(child);
      if (left === null) continue;
      kids.push({ child, left });
    }
    if (kids.length < 2) continue;

    const lefts = kids.map((k) => k.left);
    const spread = Math.max(...lefts) - Math.min(...lefts);
    if (spread <= 0.5 || spread > 12) continue;

    const worst = kids.reduce((a, b) => (b.left > a.left ? b : a));
    const base = kids.reduce((a, b) => (b.left < a.left ? b : a));
    // Two of the same thing are a list, not a heading and its content. A
    // selected row in a list carries a highlight the others do not, and that
    // is a state, not a misalignment.
    if (name(worst.child) === name(base.child)) continue;
    if (worst.child.tagName === base.child.tagName
      && worst.child.classList[0] && worst.child.classList[0] === base.child.classList[0]) continue;
    const key = name(parent) + '|' + name(worst.child);
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({
      el: name(worst.child),
      text: (worst.child.textContent || '').trim().slice(0, 60),
      kind: 'starts ' + spread.toFixed(1) + 'px right of ' + name(base.child) + ' above it',
      by: Math.round(spread),
    });
  }
  return problems;
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
  page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 200)));

  const screens = [];
  const shoot = async (name) => {
    await page.screenshot({ path: `${OUT}/${size.name}-${name}.png`, fullPage: false });
    screens.push(name);
  };

  const findings = [];
  const probe = async (where) => {
    const over = await page.evaluate(OVERFLOW_PROBE);
    for (const one of over.problems) findings.push({ ...one, where });
    for (const one of await page.evaluate(ALIGNMENT_PROBE)) findings.push({ ...one, where });
    return over.pageScrollsSideways;
  };

  /** Clicks, and says whether it landed. A swallowed miss measures the wrong screen. */
  const click = async (pattern) => {
    const target = page.getByRole('button', { name: pattern }).first();
    if (!(await target.count())) return false;
    try { await target.click({ timeout: 4000 }); return true; } catch { return false; }
  };

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^New Save$/ }).first().waitFor({ timeout: 25000 });
  await page.waitForTimeout(400);
  await shoot('01-save-slots');
  let scrollsSideways = await probe('save slots');

  // Creation.
  await click(/^New Save$/);
  await page.waitForTimeout(1200);
  // They/them settles no title, so Continue stays shut until one is picked.
  const billed = page.getByRole('group', { name: 'Billed As' });
  if (await billed.count()) {
    await billed.getByRole('button', { name: 'Actress' }).click().catch(() => {});
    await page.waitForTimeout(300);
  }
  const race = page.getByRole('group', { name: 'Race Or Ethnicity' });
  if (await race.count()) {
    await race.getByRole('button', { name: 'Black Or African' }).click().catch(() => {});
    await page.waitForTimeout(200);
  }
  await shoot('02-creation-identity');
  scrollsSideways = (await probe('creation, identity')) || scrollsSideways;

  const STEPS = ['who you are', 'starting point', 'review'];
  for (const step of STEPS) {
    if (!(await click(/^Continue$/))) break;
    await page.waitForTimeout(900);
    scrollsSideways = (await probe(`creation, ${step}`)) || scrollsSideways;
  }
  await shoot('03-creation-review');

  if (await click(/^Begin$/)) {
    await page.waitForTimeout(4000);
    await shoot('04-home');
    scrollsSideways = (await probe('home')) || scrollsSideways;

    if (await click(/^Open Calendar$/)) {
      await page.waitForTimeout(1500);
      await shoot('05-calendar');
      scrollsSideways = (await probe('the calendar')) || scrollsSideways;
      const day = page.locator('.cal-day:has(.cal-event)').first();
      if (await day.count()) {
        await day.scrollIntoViewIfNeeded().catch(() => {});
        await day.click().catch(() => {});
        await page.waitForTimeout(800);
        scrollsSideways = (await probe('a day, opened')) || scrollsSideways;
      }
    }

    // The time controls, which is where the widest menus are.
    if (await click(/^Advance/)) {
      await page.waitForTimeout(600);
      scrollsSideways = (await probe('the Advance menu')) || scrollsSideways;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    if (await click(/^Sleep$/)) {
      await page.waitForTimeout(800);
      scrollsSideways = (await probe('the sleep dialog')) || scrollsSideways;
      await click(/^Not Yet$/);
      await page.waitForTimeout(300);
    }
  }

  const overflow = findings.filter((one) => !one.kind.startsWith('starts '));
  const misaligned = findings.filter((one) => one.kind.startsWith('starts '));
  totalProblems += findings.length;

  console.log(`\n${size.name} (${size.width}x${size.height})`);
  console.log(`  screens: ${screens.join(', ')}`);
  console.log(`  page scrolls sideways: ${scrollsSideways ? 'YES — this is a bug' : 'no'}`);
  if (consoleErrors.length) console.log(`  page errors: ${consoleErrors.slice(0, 3).join(' | ')}`);

  for (const [title, list] of [['overflowing', overflow], ['misaligned', misaligned]]) {
    if (list.length === 0) { console.log(`  nothing ${title}`); continue; }
    console.log(`  ${list.length} ${title}:`);
    for (const one of list.slice(0, 12)) {
      console.log(`    [${one.where}] ${one.kind}${title === 'overflowing' ? ` by ${one.by}px` : ''} — ${one.el}`);
      if (one.text) console.log(`      "${one.text}"`);
    }
    if (list.length > 12) console.log(`    ... and ${list.length - 12} more`);
  }
  await context.close();
}

await browser.close();
console.log(`\n${totalProblems} layout problem(s) in total. Screenshots in ${OUT}/`);
process.exit(totalProblems > 0 ? 1 : 0);
