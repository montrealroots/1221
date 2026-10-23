// Where each contextual help action stands (brief 24, section 1): every visible How This Works, How Home Works, How The
// Weather Works and the rest (`HowItWorks`, `.how-it-works`), on every place on the menu, every tab, Home, Calendar and
// Updates by Home's own buttons, How This Works, the Sleep dialog and the bar's two menus, for each life at each size.
// The same script measures the build before the brief's changes and after them.
//
//   SLATE_BASE=http://localhost:4295 node docs/verification/ui-polish-2026-10-23/app/help-audit.mjs OUT LIVES SIZES
//     LIVES  name=path.json.gz,...   SIZES 1440x900,844x390m,... (m: a phone on its side, touch and no hover)
//
// What it measures is the help's words, not its button's box (a Range over its text), against what it lines up with:
// - in a card's head (`.panel-head`): the words' baseline against the heading's (a zero-size probe at each baseline), and
//   the space from the words' right end to the card's content edge, set beside the heading's own inset from the left;
//   on a second row, the words' left end against the heading's;
// - in a section's head (a label, then help, in one row): the same against the label;
// - beneath what it explains (first in its own row): the words' left end against that content's, and the space above;
// - in a row of buttons, a dialog's foot, a menu or a sentence: where it is, for the record; its box's size too.
// It writes `help-audit.json` (every help action found) and prints a summary by kind.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4295';
const [OUT, LIVES, SIZES] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const lives = LIVES.split(',').map((s) => s.split('='));
const sizes = SIZES.split(',');
const browser = await chromium.launch(launchOptions());
const found = [];
const problems = [];
const wait = (page, ms) => page.waitForTimeout(ms);

/** Every visible help action on the page as it stands, measured. */
function measure() {
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[inert], [aria-hidden="true"]') && getComputedStyle(el).visibility !== 'hidden'; };
  const textRect = (el) => {
    const range = document.createRange(); range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0);
    if (!rects.length) return el.getBoundingClientRect();
    const l = Math.min(...rects.map((r) => r.left)), t = Math.min(...rects.map((r) => r.top)), rt = Math.max(...rects.map((r) => r.right)), b = Math.max(...rects.map((r) => r.bottom));
    return { left: l, top: t, right: rt, bottom: b };
  };
  // The baseline of an element's first line of words: a zero-size inline-block at the start of its first text sits on
  // it. The text is wrapped in a span for the probe, since a button sets its words out as a flex item, where a probe
  // of its own would stand at the button's middle (the first run of this audit, 2026-10-23, read that), then unwrapped.
  const baseline = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const text = walker.nextNode();
    if (!text) return el.getBoundingClientRect().bottom;
    const wrap = document.createElement('span');
    const probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;padding:0;margin:0;border:0';
    text.parentNode.insertBefore(wrap, text);
    wrap.appendChild(probe); wrap.appendChild(text);
    const y = probe.getBoundingClientRect().top;
    wrap.parentNode.insertBefore(text, wrap); wrap.remove();
    return y;
  };
  const contentBox = (el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return { left: r.left + parseFloat(s.paddingLeft) + parseFloat(s.borderLeftWidth), right: r.right - parseFloat(s.paddingRight) - parseFloat(s.borderRightWidth), top: r.top, bottom: r.bottom };
  };
  const round = (n) => Math.round(n * 10) / 10;
  const out = [];
  for (const b of [...document.querySelectorAll('.how-it-works')].filter(vis)) {
    const box = b.getBoundingClientRect();
    const t = textRect(b);
    const rec = { label: b.textContent.trim(), w: Math.round(box.width), h: Math.round(box.height) };
    const head = b.closest('.panel-head');
    const parent = b.parentElement;
    const label = parent && [...parent.children].find((c) => c !== b && c.matches('.eyebrow, h4, h3'));
    if (head) {
      const h = head.querySelector('h2, h3');
      const card = head.closest('.card') ?? head;
      rec.kind = 'card head';
      rec.heading = h ? h.textContent.trim().slice(0, 40) : '';
      // A heading's link laid out as a flex box from brief 24 (its first line's baseline): one holding more than words
      // would lay its parts out as items, so it's recorded.
      const link = h?.querySelector(':scope > button.link');
      if (link && link.children.length) rec.mixedLink = [...link.children].map((c) => c.tagName.toLowerCase()).join(' ');
      if (h) {
        const ht = textRect(h);
        rec.secondRow = t.top > ht.bottom - 2;
        // On a second row, where the row starts: its first action's words if that's a ghost button, else its box, which
        // has a border. A help after other actions is a button among buttons; until this, its own left was read.
        const first = parent.firstElementChild;
        const start = first === b ? t.left : first.matches('.btn-ghost') ? textRect(first).left : first.getBoundingClientRect().left;
        if (rec.secondRow) rec.leftOff = round(start - ht.left);
        else rec.baselineOff = round(baseline(b) - baseline(h));
        // Both from the card's content edge, so a flush card's head, padded where the card isn't, mirrors the heading's
        // inset too. Until this the right end was read from the head's own content edge, and a flush card read -16 off.
        rec.rightInset = round(contentBox(card).right - t.right);
        rec.headingInset = round(ht.left - contentBox(card).left);
      }
    } else if (label && parent.matches('.row-between, .section-head')) {
      const lt = textRect(label);
      const edge = contentBox(parent);
      rec.kind = 'section head';
      rec.heading = label.textContent.trim().slice(0, 40);
      rec.secondRow = t.top > lt.bottom - 2;
      if (rec.secondRow) rec.leftOff = round(t.left - lt.left);
      else rec.baselineOff = round(baseline(b) - baseline(label));
      rec.rightInset = round(edge.right - t.right);
    } else if (b.closest('.modal-foot')) rec.kind = 'dialog foot';
    else if (b.closest('[role=menu]')) rec.kind = 'menu';
    else if (b.closest('p')) rec.kind = 'in a sentence';
    else if (parent && parent.firstElementChild === b) {
      // Beneath what it explains: the help starts its own row; what it explains is the block before that row.
      rec.kind = 'beneath';
      const row = parent.children.length === 1 || parent.matches('.row, .help-below, .wrap') ? parent : b;
      let prev = row.previousElementSibling;
      while (prev && !vis(prev)) prev = prev.previousElementSibling;
      if (prev) {
        const pt = prev.getBoundingClientRect();
        // The content's own left edge: its first visible text, where it starts with words.
        const pc = contentBox(prev);
        rec.after = (prev.className && String(prev.className).split(' ')[0]) || prev.tagName.toLowerCase();
        rec.leftOff = round(t.left - pc.left);
        rec.gapAbove = round(t.top - pt.bottom);
      }
    } else rec.kind = 'in a row';
    out.push(rec);
  }
  return out;
}

const isPhone = (size) => size.endsWith('m');
async function press(page, phone, loc) { await loc.scrollIntoViewIfNeeded().catch(() => {}); if (phone) await loc.tap({ timeout: 6000 }); else await loc.click({ timeout: 6000 }); await wait(page, 600); }
async function drawer(page, phone, open) {
  const t = page.locator('.rail-toggle');
  if (!(await t.isVisible().catch(() => false))) return;
  if (((await t.getAttribute('aria-expanded')) === 'true') !== open) await press(page, phone, t);
}
async function go(page, phone, name) {
  await drawer(page, phone, true);
  const b = page.locator('nav.rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
  if (await b.count() && await b.isVisible()) { await press(page, phone, b); await drawer(page, phone, false); return true; }
  await drawer(page, phone, false);
  // Calendar and Updates are Home's from brief 24: reached as a player reaches them, by Home's own buttons.
  const home = page.locator('nav.rail').getByRole('button', { name: /^Home/ }).first();
  await drawer(page, phone, true); if (await home.count()) await press(page, phone, home); await drawer(page, phone, false);
  const via = { Calendar: /^Open Calendar$/, Updates: /^View All Updates$/ }[name];
  if (!via) return false;
  const btn = page.getByRole('button', { name: via }).first();
  if (!(await btn.count())) return false;
  await press(page, phone, btn); return true;
}
const tabs = async (page) => {
  const tl = page.locator('main.main [role=tablist]').first();
  if (!(await tl.count())) return [];
  return (await tl.getByRole('tab').allInnerTexts()).map((t) => t.split('\n')[0].trim());
};
async function record(page, life, size, where) {
  await wait(page, 300);
  const m = await page.evaluate(measure).catch((e) => { problems.push(`${life} ${size} ${where}: ${String(e).slice(0, 160)}`); return []; });
  for (const r of m) found.push({ life, size, where, ...r });
}

for (const [life, file] of lives) {
  for (const size of sizes) {
    const phone = isPhone(size);
    const [w, h] = size.replace(/m$/, '').split('x').map(Number);
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, screen: { width: w, height: h }, deviceScaleFactor: 1, isMobile: phone, hasTouch: phone });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => problems.push(`${life} ${size}: page error ${String(e).slice(0, 160)}`));
    try {
      const text = gunzipSync(readFileSync(file)).toString('utf8');
      await page.goto(BASE, { waitUntil: 'networkidle' });
      await page.evaluate((t) => new Promise((res) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
      await page.reload({ waitUntil: 'networkidle' }); await wait(page, 1000);
      await press(page, phone, page.getByRole('button', { name: /^Continue$/ }).first());
      await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 }); await wait(page, 1000);
      while (await page.locator('[role=dialog]:not([data-rotate-screen])').count()) { await page.keyboard.press('Escape'); await wait(page, 300); }
      await record(page, life, size, 'Home');
      for (const dest of ['Player Profile', 'Calendar', 'Updates', 'School', 'Career', 'Money', 'Papers']) {
        if (!(await go(page, phone, dest))) { problems.push(`${life} ${size}: no way to ${dest}`); continue; }
        const names = await tabs(page);
        if (!names.length) { await record(page, life, size, dest); continue; }
        for (const n of names) {
          const t = page.locator('main.main [role=tablist]').first().getByRole('tab', { name: n, exact: true }).first();
          if (!(await t.count())) continue;
          await press(page, phone, t);
          await record(page, life, size, `${dest}, ${n}`);
        }
      }
      await go(page, phone, 'Home');
      for (const menu of ['Look After Yourself', 'Advance']) {
        const b = page.getByRole('group', { name: 'Time Controls' }).getByRole('button', { name: new RegExp(`^${menu}`) }).first();
        if (await b.count()) { await press(page, phone, b); await record(page, life, size, `${menu} menu`); await page.keyboard.press('Escape'); await wait(page, 300); }
      }
      const sleep = page.getByRole('group', { name: 'Time Controls' }).getByRole('button', { name: /^Sleep/ }).first();
      if (await sleep.count() && await sleep.isEnabled()) { await press(page, phone, sleep); await record(page, life, size, 'Sleep dialog'); await page.keyboard.press('Escape'); await wait(page, 300); }
    } catch (e) { problems.push(`${life} ${size}: stopped ${String(e).slice(0, 200)}`); }
    await ctx.close();
    console.log(`${life} ${size}: ${found.filter((f) => f.life === life && f.size === size).length} help actions`);
  }
}
await browser.close();

// The summary: by kind, how far each kind's words stand from where they line up, at each size.
const summary = {};
for (const f of found) {
  const k = `${f.size} ${f.kind}`;
  const s = (summary[k] ??= { n: 0, baselineOff: [], rightInsetMinusHeadingInset: [], leftOff: [], gapAbove: [], secondRow: 0, smallOnPhone: 0 });
  s.n += 1;
  if (f.baselineOff !== undefined) s.baselineOff.push(f.baselineOff);
  if (f.rightInset !== undefined && f.kind === 'card head' && !f.secondRow) s.rightInsetMinusHeadingInset.push(Math.round((f.rightInset - f.headingInset) * 10) / 10);
  if (f.rightInset !== undefined && f.kind === 'section head' && !f.secondRow) s.rightInsetMinusHeadingInset.push(f.rightInset);
  if (f.leftOff !== undefined) s.leftOff.push(f.leftOff);
  if (f.gapAbove !== undefined) s.gapAbove.push(f.gapAbove);
  if (f.secondRow) s.secondRow += 1;
  if (f.size.endsWith('m') && (f.w < 43.5 || f.h < 43.5)) s.smallOnPhone += 1;
}
const range = (a) => a.length ? { min: Math.min(...a), max: Math.max(...a), distinct: [...new Set(a)].sort((x, y) => x - y).slice(0, 12) } : null;
const table = Object.fromEntries(Object.entries(summary).sort().map(([k, s]) => [k, { n: s.n, secondRow: s.secondRow, smallOnPhone: s.smallOnPhone, baselineOff: range(s.baselineOff), rightInset: range(s.rightInsetMinusHeadingInset), leftOff: range(s.leftOff), gapAbove: range(s.gapAbove) }]));
writeFileSync(join(OUT, 'help-audit.json'), `${JSON.stringify({ base: BASE, summary: table, problems, found }, null, 1)}\n`);
for (const [k, s] of Object.entries(table)) console.log(k, JSON.stringify(s));
console.log(`${found.length} help actions; ${problems.length} problems${problems.length ? `: ${problems.join(' | ')}` : ''}`);
