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

  for (const el of document.querySelectorAll(LABEL_SITES)) {
    // A name out of a real gazetteer is not a label the game wrote. It is
    // spelled the way the world spells it — Klagenfurt am Wörthersee, Rožnov
    // pod Radhoštěm, Town 'n' Country — and Title Case would make it wrong.
    if (el.closest('[data-source="gazetteer"]')) continue;
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

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});

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
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // The startup sequence, while it is still on screen.
  await page.waitForTimeout(700);
  await check('00-startup');
  await page.waitForTimeout(3200);
  await check('01-slots');

  await page.getByRole('button', { name: /new (save|game)|start|empty slot|create/i }).first().click().catch(() => {});
  await page.waitForTimeout(1000);
  for (const [label, value] of [[/first name/i, 'Alexandria'], [/last name/i, 'Castellanos']]) {
    const f = page.getByLabel(label).first();
    if (await f.count()) await f.fill(value).catch(() => {});
  }
  const pronouns = page.getByLabel(/pronouns/i).first();
  if (await pronouns.count()) await pronouns.selectOption('she/her').catch(() => {});
  const second = page.getByLabel(/second citizenship/i).first();
  if (await second.count()) await second.selectOption('ca').catch(() => {});
  await check('02-identity');

  const steps = ['03-personal', '04-company', '05-starting-point', '06-review'];
  for (const step of steps) {
    const next = page.getByRole('button', { name: /^(next|continue)/i }).first();
    if (!(await next.count())) break;
    await next.click().catch(() => {});
    await page.waitForTimeout(800);
    if (step === '03-personal') {
      for (const t of ['Night Owl', 'Holds Grudges', 'Disciplined', 'Generous']) {
        const b = page.locator('button.trait').filter({ hasText: new RegExp(`^${t}`) }).first();
        if (await b.count()) await b.click().catch(() => {});
      }
    }
    if (step === '04-company') {
      const nf = page.getByLabel(/what it is called/i).first();
      if (await nf.count()) await nf.fill('Castellanos Pictures').catch(() => {});
    }
    await check(step);
  }

  const begin = page.getByRole('button', { name: /it.s time to be great|begin|start save/i }).first();
  if (await begin.count()) { await begin.click().catch(() => {}); await page.waitForTimeout(3800); }
  const gotIt = page.getByRole('button', { name: /^got it$/i }).first();
  if (await gotIt.count()) { await gotIt.click().catch(() => {}); await page.waitForTimeout(400); }
  await check('07-home');

  // Every destination Home offers.
  const tiles = await page.evaluate(() =>
    [...document.querySelectorAll('.dest')].map((n) => n.getAttribute('aria-label') || ''));
  for (const label of tiles) {
    const name = label.split(',')[0].trim();
    if (!name) continue;
    const tile = page.locator(`.dest[aria-label^="${name}"]`).first();
    if (!(await tile.count())) continue;
    await tile.click().catch(() => {});
    await page.waitForTimeout(1100);
    const dismiss = page.getByRole('button', { name: /^got it$/i }).first();
    if (await dismiss.count()) { await dismiss.click().catch(() => {}); await page.waitForTimeout(300); }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await check(slug);

    // Every tab on the screen, not just the one it opens on. Most of the game
    // lives behind a second or third tab.
    const tabCount = await page.locator('.tab').count();
    for (let i = 1; i < tabCount; i++) {
      const tab = page.locator('.tab').nth(i);
      const tabName = ((await tab.textContent().catch(() => '')) || `tab${i}`)
        .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24) || `tab${i}`;
      await tab.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(700);
      await check(`${slug}--${tabName}`);
    }

    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /Go To Home/.test(x.getAttribute('aria-label') ?? ''));
      b?.click();
    });
    await page.waitForTimeout(600);
  }

  // A scene, several steps in: the panel above The City, then the gym desk,
  // the plan, the exercise list, and the cooldown.
  const city = page.locator('.dest[aria-label^="The City"]').first();
  if (await city.count()) {
    await city.click().catch(() => {});
    await page.waitForTimeout(1100);
    const dismissCity = page.getByRole('button', { name: /^got it$/i }).first();
    if (await dismissCity.count()) { await dismissCity.click().catch(() => {}); await page.waitForTimeout(300); }
    // Each step is named after the scene panel's own title, so a step that
    // did not open is visible in the log rather than silently "ok".
    const sceneTitle = async () => ((await page.locator('.scene h2').first().textContent().catch(() => '')) ?? '').trim() || 'no scene on screen';
    const sceneCheck = async (name) => check(`${name} (${await sceneTitle()})`);
    const pickScene = async (label) => {
      const c = page.locator('.scene-choice').filter({ has: page.locator('.scene-choice-label', { hasText: new RegExp(`^${label}$`) }) }).first();
      await c.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
      if (!(await c.count())) { console.log(`  scene: no choice "${label}" at "${await sceneTitle()}"`); return false; }
      const before = await sceneTitle();
      await c.click().catch(() => {});
      // Every choice the walk takes moves the scene to a new step with its own title.
      await page.waitForFunction((prev) => (document.querySelector('.scene h2')?.textContent ?? '').trim() !== prev, before, { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(300);
      return true;
    };
    const leaveScene = async () => {
      const leave = page.locator('.scene').getByRole('button', { name: /^Leave$/ }).first();
      if (await leave.count()) { await leave.click().catch(() => {}); await page.waitForTimeout(500); }
    };
    // Gyms sit under the Errands tab; a gym row carries its own Work Out.
    const errands = page.locator('.tab', { hasText: /^Errands$/ }).first();
    if (await errands.count()) { await errands.click().catch(() => {}); await page.waitForTimeout(500); }
    // The list is long and its journeys are planned on render; on a busy
    // machine it can take a moment, so wait for the row rather than guess.
    const workOut = page.getByRole('button', { name: /^Work Out$/ }).first();
    await workOut.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    if (!(await workOut.count())) {
      const tabs = await page.locator('.tab').allTextContents().catch(() => []);
      const rows = await page.locator('.list-item .small.strong').allTextContents().catch(() => []);
      const buttons = [...new Set(await page.locator('.list-item .btn').allTextContents().catch(() => []))];
      console.log(`  scene-gym: no gym row with Work Out on The City — scene not walked`);
      console.log(`  scene-gym: tabs [${tabs.map((t) => t.trim()).join(', ')}]; ${rows.length} rows; buttons [${buttons.join(', ')}]; first rows [${rows.slice(0, 6).map((r) => r.trim()).join(' | ')}]`);
    }
    if (await workOut.count()) {
      await workOut.click().catch(() => {});
      await page.waitForTimeout(800);
      await sceneCheck('scene-gym-arrive');
      for (const mode of ['Walk', 'Drive', 'Taxi', 'Transit']) { if (await pickScene(mode)) break; }
      await sceneCheck('scene-gym-desk');
      await pickScene('Buy A Day Pass');
      await sceneCheck('scene-gym-plan');
      await pickScene('Strength');
      await sceneCheck('scene-gym-pick');
      // One block: the first exercise on offer, at a steady effort. Finish Up
      // is only offered once something has been done.
      const firstExercise = ((await page.locator('.scene-choice .scene-choice-label').allTextContents().catch(() => []))
        .map((t) => t.trim()).find((t) => t && !/^(Something Else|Finish Up)$/.test(t))) ?? '';
      if (firstExercise) await pickScene(firstExercise.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await sceneCheck('scene-gym-effort');
      await pickScene('Steady');
      await sceneCheck('scene-gym-after-block');
      await pickScene('Finish Up');
      await sceneCheck('scene-gym-cooldown');
      await leaveScene();
    }

    // The dealership, on the same tab: the lot, a car, the numbers, the paperwork.
    // Lots open at nine and the day starts before that, so the clock moves on
    // an hour at a time until they are, through the same menu the player uses.
    for (let i = 0; i < 3; i++) {
      const closed = await page.locator('.scene-choice.is-disabled[title*="closed"]').count().catch(() => 0);
      const hour = Number(((await page.locator('.topbar-clock strong').textContent().catch(() => '')) ?? '').match(/^(\d+):/)?.[1] ?? 12);
      const morning = /AM$/.test(((await page.locator('.topbar-clock strong').textContent().catch(() => '')) ?? '').trim()) && hour < 9 && hour !== 12;
      if (!closed && !morning) break;
      await page.getByRole('button', { name: /^Advance/ }).first().click().catch(() => {});
      await page.waitForTimeout(300);
      await page.getByRole('menuitem', { name: /One Hour/ }).first().click().catch(() => {});
      await page.waitForTimeout(600);
      const anyway = page.getByRole('button', { name: /^Advance Anyway$/ }).first();
      if (await anyway.count()) { await anyway.click().catch(() => {}); await page.waitForTimeout(600); }
    }
    const lookAtCars = page.getByRole('button', { name: /^Look At The Cars$/ }).first();
    await lookAtCars.waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    if (!(await lookAtCars.count())) console.log('  scene-dealer: no dealership row with Look At The Cars on The City — scene not walked');
    if (await lookAtCars.count()) {
      await lookAtCars.click().catch(() => {});
      await page.waitForTimeout(800);
      await sceneCheck('scene-dealer-arrive');
      for (const mode of ['Walk', 'Drive', 'Taxi', 'Transit']) { if (await pickScene(mode)) break; }
      await sceneCheck('scene-dealer-lot');
      const firstCar = ((await page.locator('.scene-choice .scene-choice-label').allTextContents().catch(() => []))
        .map((t) => t.trim()).find((t) => t && t !== 'Walk Out')) ?? '';
      if (firstCar) await pickScene(firstCar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await sceneCheck('scene-dealer-car');
      await pickScene('Look It Over');
      await pickScene('Talk Numbers');
      await sceneCheck('scene-dealer-numbers');
      await pickScene('Accept .*');
      await sceneCheck('scene-dealer-agreed');
      await leaveScene();
    }
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /Go To Home/.test(x.getAttribute('aria-label') ?? ''));
      b?.click();
    });
    await page.waitForTimeout(600);
  }

  // The calendar's two modals.
  const calendar = page.locator('.dest[aria-label^="Calendar"]').first();
  if (await calendar.count()) {
    await calendar.click().catch(() => {});
    await page.waitForTimeout(1100);
    const dismissCal = page.getByRole('button', { name: /^got it$/i }).first();
    if (await dismissCal.count()) { await dismissCal.click().catch(() => {}); await page.waitForTimeout(300); }
    await page.locator('.cal-day[data-today="true"]').first().click().catch(() => {});
    await page.waitForTimeout(500);
    const planIt = page.getByRole('button', { name: /^Plan Something$/ }).first();
    if (await planIt.count()) {
      await planIt.click().catch(() => {});
      await page.waitForTimeout(500);
      await check('calendar-plan-form');
      await page.keyboard.press('Escape').catch(() => {});
      const never = page.getByRole('button', { name: /^Never Mind$/ }).first();
      if (await never.count()) await never.click().catch(() => {});
      await page.waitForTimeout(300);
    }
    const firstEntry = page.locator('.list-item').filter({ hasText: /Due|Listings|Inventory|Payout|Draw/ }).first();
    if (await firstEntry.count()) {
      await firstEntry.click().catch(() => {});
      await page.waitForTimeout(500);
      await check('calendar-entry-detail');
      await page.getByRole('button', { name: /^Close$/ }).first().click().catch(() => {});
      await page.waitForTimeout(300);
    }
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find((x) => /Go To Home/.test(x.getAttribute('aria-label') ?? ''));
      b?.click();
    });
    await page.waitForTimeout(600);
  }

  // Go Anywhere, open.
  await page.keyboard.press('/').catch(() => {});
  await page.waitForTimeout(600);
  await check('go-anywhere');
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);

  // Help, which nothing else opens.
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')]
      .find((x) => /help/i.test(x.getAttribute('aria-label') ?? x.textContent ?? ''));
    b?.click();
  });
  await page.waitForTimeout(700);
  await check('help');
  await page.keyboard.press('Escape').catch(() => {});

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
