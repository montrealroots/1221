/**
 * The text caps sweep.
 *
 * Walks every screen in the game at every width the interface claims to
 * support and finds text that does not fit: clipped, crushed, bleeding out of
 * its box, or dragging the page sideways.
 *
 * Deliberate truncation is not a fault. A calendar cell that ellipsises a long
 * event name and carries the whole thing in its title attribute is doing the
 * right thing, so anything with `text-overflow: ellipsis` and a title is
 * skipped. Everything else that overflows is a bug.
 *
 * It also sweeps the other half of the same rule: capitals. Anything that is
 * not a complete sentence — a heading, a button, a chip, a label, a column
 * head — starts every word with a capital. Prose does not, and is left alone.
 * The source-side tools cover strings written in the code; this covers what
 * actually reaches the screen, including labels assembled at runtime out of
 * two halves that were each fine on their own.
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { launchOptions } from './browser.mjs';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4173';
const OUT = 'text-caps';
const MAX_SHOWN = Number(process.env.SLATE_MAX_SHOWN ?? 4);
mkdirSync(OUT, { recursive: true });

const ONLY = (process.env.SLATE_WIDTHS ?? '').split(',').map((w) => w.trim()).filter(Boolean);

const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'phablet', width: 480, height: 900 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'wide', width: 1920, height: 1080 },
];

/** What counts as a fault, measured in the page. */
const PROBE = () => {
  const faults = [];
  const seen = new Set();
  const note = (kind, el, detail) => {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!text) return;
    const key = `${kind}:${text.slice(0, 60)}`;
    if (seen.has(key)) return;
    seen.add(key);
    faults.push({
      kind,
      text: text.slice(0, 70),
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === 'string' ? el.className : '').slice(0, 40),
      detail,
    });
  };

  const clips = (style) => style.overflowX === 'hidden' || style.overflowX === 'clip'
    || style.overflowY === 'hidden' || style.overflowY === 'clip';
  const scrolls = (style) => style.overflowX === 'auto' || style.overflowX === 'scroll'
    || style.overflowY === 'auto' || style.overflowY === 'scroll';

  // Anything reachable by scrolling a pane is not lost, so it is not a fault.
  const inScrollable = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (scrolls(getComputedStyle(p))) return true;
    }
    return false;
  };

  // The nearest ancestor that would cut this element's text off, if any.
  // An ancestor that ellipsises and carries the whole string is doing the
  // right thing on purpose, and so is everything inside it.
  const clipper = (el) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (scrolls(s)) return null;
      if (s.textOverflow === 'ellipsis' && (p.title || p.getAttribute('aria-label'))) return null;
      if (clips(s)) return p;
    }
    return null;
  };

  for (const el of document.querySelectorAll('body *')) {
    // A map, a chart, an icon: vector art is allowed to run past its frame.
    if (el instanceof SVGElement) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;

    const leaf = el.children.length === 0;
    const text = (el.textContent || '').trim();
    if (!text) continue;

    const over = el.scrollWidth > el.clientWidth + 1;
    const ellipsis = style.textOverflow === 'ellipsis';
    const hasFullText = Boolean(el.title || el.getAttribute('aria-label'));

    // 1. Ellipsised with nowhere to read the rest. Truncation is fine; blind
    //    truncation is a fault, because the words are simply gone.
    if (over && ellipsis && !hasFullText) {
      note('truncated-blind', el, `${el.scrollWidth}px of text in ${el.clientWidth}px, no title`);
    }

    // 2. Clipped: the box hides what does not fit, and offers no ellipsis and
    //    no way to scroll to it.
    if (over && !ellipsis && clips(style) && !scrolls(style)) {
      note('clipped', el, `${el.scrollWidth}px of text in ${el.clientWidth}px`);
    }

    // 3. Cut off vertically by its own box.
    if (leaf && el.scrollHeight > el.clientHeight + 2 && (style.overflowY === 'hidden' || style.overflowY === 'clip')) {
      note('cut-off', el, `${el.scrollHeight}px of text in ${el.clientHeight}px`);
    }

    // 4. Cut off by an ancestor: the text spills visibly out of its own box and
    //    the first box above it that clips is narrower than the spill.
    if (leaf && !ellipsis) {
      const anc = clipper(el);
      if (anc) {
        const a = anc.getBoundingClientRect();
        if (box.right > a.right + 1.5 || box.left < a.left - 1.5) {
          note('cut-off-by-parent', el, `spans ${Math.round(box.left)}..${Math.round(box.right)} inside ${Math.round(a.left)}..${Math.round(a.right)}`);
        }
      }
    }

    // 5. Crushed: a column so narrow the text cannot lay out in it. A short
    //    word in a small box is not crushed, it is short, so this only counts
    //    when the text genuinely does not fit.
    if (leaf && text.length > 6 && box.width < 34 && over) {
      note('crushed', el, `${Math.round(box.width)}px wide for ${el.scrollWidth}px of text`);
    }

    // 6. A single word broken across two lines. Wrapping a sentence is
    //    normal; wrapping "SUN" into "SU" and "N", or the seventeenth into
    //    "1" and "7", is a column too narrow for what is in it. Nothing is
    //    clipped, so no overflow check sees it — only the layout does.
    if (leaf && !/\s/.test(text) && text.length <= 12) {
      const range = document.createRange();
      range.selectNodeContents(el);
      // One rect per text node, not per line: "{value}°{unit}" is three nodes
      // sitting side by side. What matters is how many distinct lines they
      // occupy, so the rects are grouped by where their tops land.
      const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
      if (tops.size > 1) {
        note('word-broken', el, `"${text}" laid out across ${tops.size} lines in ${Math.round(box.width)}px`);
      }
    }

    // 7. Bleeding out of the viewport, with no pane to scroll it back.
    if ((box.right > window.innerWidth + 1 || box.left < -1) && !inScrollable(el)) {
      note('bleeding', el, `spans ${Math.round(box.left)}..${Math.round(box.right)} in ${window.innerWidth}px`);
    }
  }

  // --- Capitals ------------------------------------------------------------
  // Every label site in the interface. A fragment here starts every word with
  // a capital; a complete sentence does not have to.
  const LABEL_SITES = 'h1, h2, h3, h4, th, label, button, .chip, .eyebrow, .stat-label, '
    + '.trait-name, .dest-label, .attr-name, .tab, [role="tab"], .kv-key, .field-label, option, '
    + '.scene-choice-label, .scene .eyebrow, summary';

  // Left alone: it is already capitalised, it is a number or symbol, it is an
  // acronym or a real spelling with internal capitals, or it is a unit that
  // belongs lowercase after a figure.
  // Abbreviations only. A unit spelled out is a word — "27 Minutes", not
  // "27 minutes" — and stays subject to the rule.
  const UNITS = new Set(['mi', 'km', 'kg', 'lb', 'lbs', 'ft', 'in', 'hr', 'hrs', 'h', 'm', 'min',
    'mins', 'sec', 's', 'am', 'pm', 'st', 'nd', 'rd', 'th', 'x', 'v', 'vs', 'ea',
    'hp', 'mpg', 'mph', 'kph', 'rpm', 'kw', 'nm', 'db', 'sqft', 'sq', 'oz', 'ml', 'l', 'g']);

  /*
   * Particles inside a real name. SLATE's own labels are Title Case to the
   * letter, but a place is spelled the way the world spells it: Rio de
   * Janeiro, Isle of Man, Dar es Salaam, Fond du Lac, les Escaldes. Those
   * come out of a gazetteer, and capitalising them would not be tidier, it
   * would be wrong.
   */
  const PARTICLES = new Set(['a', 'an', 'and', 'at', 'by', 'da', 'das', 'de', 'del', 'della',
    'des', 'di', 'do', 'dos', 'du', 'el', 'es', 'for', 'from', 'in', 'la', 'las', 'le', 'les',
    'los', 'na', 'nad', 'of', 'on', 'or', 'te', 'the', 'to', 'ter', 'van', 'von', 'bin', 'al',
    'ap', 'ibn', 'och', 'sur', 'sous', 'upon', 'y', "'n", "'n'"]);

  const wordIsFine = (word) => {
    const cleaned = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!cleaned) return true;
    if (!/\p{Ll}/u.test(cleaned)) return true;
    const first = cleaned[0];
    if (!/\p{L}/u.test(first)) return true;
    if (/\p{Lu}/u.test(first)) return true;
    // Internal capitals: iPhone, McKinsey, e-Type.
    if (/\p{Lu}/u.test(cleaned.slice(1))) return true;
    // A unit hanging off a figure: 6 mi, 27 min, 9 am.
    if (UNITS.has(cleaned.toLowerCase())) return true;
    // A particle inside a real name. Checked before and after stripping the
    // punctuation, because "'n'" in Town 'n' Country is one of them.
    if (PARTICLES.has(cleaned.toLowerCase())) return true;
    if (PARTICLES.has(word.toLowerCase())) return true;
    // A descriptor the gazetteer appends to disambiguate a place, which is
    // part of the source data rather than a label the game wrote.
    if (/^\(.*\)$/.test(word)) return true;
    return false;
  };

  // A complete sentence is exempt. Ends in terminal punctuation, or is long
  // enough that no label would be written that way.
  const isSentence = (t) => /[.!?]$/.test(t) || t.split(/\s+/).length > 12;

  /**
   * A relative date is a value, not a label.
   *
   * The depth engine makes a date openable, so "6 days ago" arrives here as a
   * `button.link` that is the whole of its parent and reads as a label by
   * position. It is not one: the capitals rule exists so that headings, chips
   * and controls are Title Case, and "6 Days Ago" is worse English than what it
   * replaced. Same reasoning as the gazetteer exemption above — a value the
   * world supplies is spelled the way the world spells it.
   */
  const isRelativeDate = (t) => (
    /^(in\s+)?[\d.,]+\s+(second|minute|hour|day|week|month|year)s?(\s+ago)?$/i.test(t)
    || /^(just now|today|tomorrow|yesterday|now|overdue)$/i.test(t)
  );

  /**
   * A noun in the middle of a sentence, which happens to open.
   *
   * The depth engine renders a pressable word as `button.link`, so a control
   * and a word are now the same element and the capitals rule cannot treat
   * every button as a label. "Nothing scheduled. The Day is yours." is worse
   * English than what it replaced, not better.
   *
   * The test is where it sits, not what it is: a link with other words beside
   * it inside its parent is part of a sentence and is left alone. A link that
   * is the whole of its parent — a stat's label, a bar's label, a way in — is
   * a label and is held to Title Case like every other label.
   */
  const isWordInProse = (el) => {
    if (!el.matches('button.link')) return false;
    const parent = el.parentElement;
    if (!parent) return false;
    const around = [...parent.childNodes]
      .filter((n) => n !== el)
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
    return around.length > 0;
  };

  for (const el of document.querySelectorAll(LABEL_SITES)) {
    // A name out of a real gazetteer is not a label the game wrote. It is
    // spelled the way the world spells it — Klagenfurt am Wörthersee, Rožnov
    // pod Radhoštěm, Town 'n' Country — and Title Case would make it wrong.
    if (el.closest('[data-source="gazetteer"]')) continue;
    if (isWordInProse(el)) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    if (style.textTransform === 'uppercase' || style.textTransform === 'capitalize') continue;
    // Only the element's own text, not a whole card's worth of children.
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent)
      .join(' ')
      .trim()
      .replace(/\s+/g, ' ');
    if (!own || own.length < 2) continue;
    // The game's convention for a choice is "Label — what it means". The half
    // before the dash is the label; the half after it is a sentence.
    const label = own.split(/\s+—\s+/)[0].trim();
    if (!label || label.length < 2) continue;
    if (isSentence(label)) continue;
    if (isRelativeDate(label)) continue;
    const bad = label.split(/\s+/).filter((w) => !wordIsFine(w));
    if (bad.length > 0) note('lowercase', el, `lowercase: ${bad.join(', ')}`);
  }

  return {
    faults,
    sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  };
};

// The container this was written in keeps its browser at a fixed path, and
// this sweep fell back to whatever Playwright installed when that path was not
// there. The other browser tools do the same now, through tools/browser.mjs.
const browser = await chromium.launch(launchOptions());

let totalFaults = 0;
const summary = [];

for (const size of WIDTHS.filter((w) => ONLY.length === 0 || ONLY.includes(w.name))) {
  try {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
  page.on('pageerror', (e) => console.log(`  PAGE ERROR: ${String(e).slice(0, 160)}`));

  const check = async (screen) => {
    await page.waitForTimeout(450);
    const got = await page.evaluate(PROBE);
    if (process.env.SLATE_VERBOSE && got.faults.length === 0 && !got.sideways) console.log(`  ${screen}: ok`);
    if (got.faults.length > 0 || got.sideways) {
      totalFaults += got.faults.length;
      summary.push({ size: size.name, screen, ...got });
      console.log(`  ${screen}: ${got.faults.length} fault(s)${got.sideways ? ', page scrolls sideways' : ''}`);
      for (const f of got.faults.slice(0, MAX_SHOWN)) {
        console.log(`      [${f.kind}] <${f.tag} class="${f.cls}"> ${f.detail}`);
        console.log(`         "${f.text}"`);
      }
      await page.screenshot({ path: `${OUT}/${size.name}-${screen}.png`, fullPage: true });
    }
  };

  console.log(`\n${size.name} (${size.width}x${size.height})`);

  /** Clicks and says whether it landed, so a miss cannot read as a screen. */
  const click = async (pattern) => {
    const target = page.getByRole('button', { name: pattern }).first();
    if (!(await target.count())) return false;
    try { await target.click({ timeout: 4000 }); return true; } catch { return false; }
  };

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await check('00-startup');
  await page.getByRole('button', { name: /^New Save$/ }).first().waitFor({ timeout: 25000 });
  await page.waitForTimeout(400);
  await check('01-slots');

  // Creation. A long surname on purpose: the longest names are where a label
  // is most likely to clip.
  await click(/^New Save$/);
  await page.waitForTimeout(1100);
  for (const [selector, value] of [['#first', 'Alexandria'], ['#last', 'Kristjánsdóttir']]) {
    const field = page.locator(selector).first();
    if (await field.count()) await field.fill(value).catch(() => {});
  }
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
  await check('02-identity');

  for (const [step, screen] of [
    ['dispositions and traits', '03-dispositions-and-traits'],
    ['genres and background', '04-genres-and-background'],
    ['starting point', '05-starting-point'],
    ['review', '06-review'],
  ]) {
    if (!(await click(/^Continue$/))) { console.log(`  (could not reach ${step})`); break; }
    await page.waitForTimeout(900);
    await check(screen);
  }

  if (await click(/^Begin$/)) {
    await page.waitForTimeout(4000);
    await check('07-home');

    if (await click(/^Open Calendar$/)) {
      await page.waitForTimeout(1500);
      await check('08-calendar');
      const day = page.locator('.cal-day:has(.cal-event)').first();
      if (await day.count()) {
        await day.scrollIntoViewIfNeeded().catch(() => {});
        await day.click().catch(() => {});
        await page.waitForTimeout(700);
        await check('09-calendar-day');
      }
      const entry = page.locator('.list-item').first();
      if (await entry.count()) {
        await entry.click().catch(() => {});
        await page.waitForTimeout(700);
        await check('10-calendar-entry');
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    if (await click(/^Advance/)) {
      await page.waitForTimeout(600);
      await check('11-advance-menu');
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(300);
    }
    if (await click(/^Sleep$/)) {
      await page.waitForTimeout(800);
      await check('12-sleep');
      await click(/^Not Yet$/);
      await page.waitForTimeout(300);
    }
    if (await click(/save\s*&\s*exit/i)) {
      await page.waitForTimeout(2200);
      await check('13-slots-filled');
    }
  }

  await page.close();
  } catch (err) {
    console.log(`  SWEEP ERROR at ${size.name}: ${String(err).split('\n')[0].slice(0, 200)}`);
  }
}

await browser.close();

writeFileSync(`${OUT}/report.json`, JSON.stringify(summary, null, 2));

console.log(`\n${'='.repeat(60)}`);
if (totalFaults === 0 && summary.every((s) => !s.sideways)) {
  console.log('No text caps. Nothing clipped, crushed, cut off or bleeding at any width.');
} else {
  const byKind = new Map();
  for (const s of summary) for (const f of s.faults) byKind.set(f.kind, (byKind.get(f.kind) ?? 0) + 1);
  console.log(`${totalFaults} fault(s) across ${summary.length} screen/width combination(s)`);
  for (const [kind, n] of [...byKind].sort((a, b) => b[1] - a[1])) console.log(`  ${kind}: ${n}`);
  console.log(`Screenshots of every one in ${OUT}/`);
}
