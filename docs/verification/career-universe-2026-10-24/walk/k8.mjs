// Brief 27, F (2026-10-25): Productions And People (K8) and the ceremony's place on Charts And Awards (K7), on the built
// app, at a desk (1440 x 900), on a phone on its side (844 x 390) and upright (390 x 844), each from a long career's save
// (`tools/long-career.ts --keep`). At each size, pressed as a player presses it:
//   1. Career, then Productions And People: the front page, its lists and Find;
//   2. a project under Your Work, the latest whose page offers an action, and its company and Back to it;
//   3. that action, to the tab it names, then Productions And People again: the same page, the same trail;
//   4. the trail's first crumb to the front page, a series, its season under way and an episode, each a link on the
//      page before, and Back twice to the series;
//   5. Find a real person's name, and that person's page;
//   6. Charts And Awards, Your Recognition: the Actor Awards and, for a nomination, the ceremony's controls.
// At each step: no page error, nothing wider than the window, every control on screen or in a box that scrolls.
//
//   SLATE_BASE=http://localhost:4173 node docs/verification/career-universe-2026-10-24/walk/k8.mjs OUT SAVE.json.gz
//
// Writes OUT/k8.json (each size, each step and what it read) and OUT/<size>/NN-<step>.jpg. Emulation, not a phone:
// Chromium's touch and viewport emulation, which can't show a notch's safe area or a browser's own bars.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [OUT, SAVE] = process.argv.slice(2);
const SIZES = [
  { name: 'desk-1440x900', viewport: { width: 1440, height: 900 }, phone: false },
  { name: 'side-844x390', viewport: { width: 844, height: 390 }, phone: true },
  { name: 'upright-390x844', viewport: { width: 390, height: 844 }, phone: true },
];
const text = gunzipSync(readFileSync(SAVE)).toString('utf8');
const browser = await chromium.launch(launchOptions());
const report = { save: SAVE, base: BASE, sizes: [] };

for (const size of SIZES) {
  const dir = join(OUT, size.name);
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: size.viewport, screen: size.viewport, deviceScaleFactor: size.phone ? 3 : 1, isMobile: size.phone, hasTouch: size.phone });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) problems.push(`console: ${m.text().slice(0, 200)}`); });
  const wait = (ms) => page.waitForTimeout(ms);
  let n = 0;
  const steps = [];
  const shot = async (name) => { n += 1; await page.screenshot({ path: join(dir, `${String(n).padStart(2, '0')}-${name}.jpg`), type: 'jpeg', quality: 70, scale: 'css' }); };
  const press = async (loc) => { await loc.scrollIntoViewIfNeeded().catch(() => {}); if (size.phone) await loc.tap({ timeout: 8000 }); else await loc.click({ timeout: 8000 }); await wait(700); };
  const layout = () => page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    return {
      pageWider: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      controlsOut: [...document.querySelectorAll('#main button, #main a[href], #main [role=tab], #main input')].filter(vis).filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.right <= innerWidth + 1 && r.left >= -1) return false;
        for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/auto|scroll/.test(s.overflowX) && p.scrollWidth > p.clientWidth) return false; }
        return true;
      }).map((el) => el.textContent.trim().slice(0, 30)).slice(0, 8),
      heading: document.querySelector('#main h2')?.textContent?.trim() ?? null,
      tab: document.querySelector('[role=tab][aria-selected=true]')?.textContent?.trim() ?? null,
    };
  });
  const step = async (name, fn) => {
    const before = problems.length;
    let error = null;
    let read = null;
    try { read = await fn(); } catch (e) { error = String(e.message ?? e).slice(0, 300); }
    const l = await layout().catch(() => ({}));
    await shot(name).catch(() => {});
    steps.push({ step: name, ok: !error && problems.length === before && !l.pageWider && !(l.controlsOut ?? []).length, error, read, ...l, problems: problems.slice(before) });
  };
  const rail = async (name) => {
    const b = page.locator('#rail').getByRole('button', { name: new RegExp(`^${name}`) }).first();
    if (size.phone && !(await b.isVisible().catch(() => false))) { await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click(); await wait(400); }
    await b.click({ timeout: 8000 }); await wait(900);
  };
  const tab = async (name) => { await press(page.getByRole('tab', { name: new RegExp(`^${name}$`) }).first()); };
  const link = (re) => page.locator('#main button.link').filter({ hasText: re }).first();

  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
    await page.reload({ waitUntil: 'networkidle' }); await wait(1200);
    await press(page.getByRole('button', { name: /^Continue$/ }).first());
    await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 90000 });
    await wait(1200);
    for (let i = 0; i < 6; i += 1) { const d = page.locator('[role=dialog]:visible').last(); if (!(await d.count())) break; await page.keyboard.press('Escape'); await wait(400); }

    await step('front-page', async () => {
      await rail('Career'); await tab('Productions And People');
      const groups = await page.locator('#main .panel-head h2').allTextContents();
      return { groups };
    });
    let project = null;
    await step('project', async () => {
      // The latest project under Your Work whose page offers an action, else the latest: each opened, newest first, and Back
      // if it has none. A long career's oldest work is past the record's bound (`keepBounded`), its credit kept and its
      // posting and work gone, so it has nothing to act on.
      const panel = () => page.locator('#main section, #main .card').filter({ has: page.getByRole('heading', { name: /^Your Work$/ }) }).first();
      const all = panel().getByRole('button', { name: /^Show All/ });
      if (await all.count()) await press(all.first());
      const entries = () => panel().locator('button.link');
      const total = await entries().count();
      const count = Math.min(8, total);
      for (let i = 0; i < count; i += 1) {
        const e = entries().nth(total - 1 - i);
        project = (await e.textContent())?.trim();
        await press(e);
        if (await page.getByRole('heading', { name: /^What You Can Do$/ }).count()) return { project, withAction: true, tried: i + 1 };
        if (i < count - 1) await press(page.getByRole('button', { name: /^Back$/ }).first());
      }
      return { project, withAction: false };
    });
    await step('company-and-back', async () => {
      const c = page.locator('#main dd button.link').first();
      if (!(await c.count())) return { skipped: 'no linked company on this page' };
      const name = (await c.textContent())?.trim();
      await press(c);
      const opened = (await page.locator('#main h2').first().textContent())?.trim();
      await press(page.getByRole('button', { name: /^Back$/ }).first());
      const h = (await page.locator('#main h2').first().textContent())?.trim() ?? '';
      if (project && !h.startsWith(project)) throw new Error(`Back reached “${h}”, not “${project}”`);
      return { opened: name, heading: opened, backTo: h };
    });
    await step('action-and-return', async () => {
      const action = page.locator('#main button').filter({ hasText: /^Open (Opportunities|Work|Charts And Awards|Representation|Portfolio)$/ }).first();
      if (!(await action.count())) return { skipped: 'no action on this page' };
      const label = (await action.textContent())?.trim();
      await press(action);
      const opened = (await page.locator('[role=tab][aria-selected=true]').first().textContent())?.trim();
      await tab('Productions And People');
      const h = (await page.locator('#main h2').first().textContent())?.trim() ?? '';
      if (project && !h.startsWith(project)) throw new Error(`came back to “${h}”, not “${project}”`);
      return { pressed: label, opened, cameBackTo: h };
    });
    await step('series', async () => {
      await press(page.locator('nav[aria-label="Pages followed"] button.link').filter({ hasText: /^Productions And People$/ }).first());
      await press(page.locator('#main section, #main .card').filter({ has: page.getByRole('heading', { name: /^Series$/ }) }).first().locator('button.link').filter({ hasText: /^The Calloway Files$/ }).first());
      return { heading: (await page.locator('#main h2').first().textContent())?.trim() };
    });
    await step('season', async () => {
      const seasons = page.locator('#main button.link').filter({ hasText: /shot from|shooting from|to shoot from/ });
      const s = (await page.locator('#main button.link').filter({ hasText: /shooting from/ }).count()) ? page.locator('#main button.link').filter({ hasText: /shooting from/ }).first() : seasons.last();
      await press(s);
      return { heading: (await page.locator('#main h2').first().textContent())?.trim() };
    });
    await step('episode', async () => {
      await press(link(/^First shot on/));
      return { heading: (await page.locator('#main h2').first().textContent())?.trim() };
    });
    await step('back-to-series', async () => {
      await press(page.getByRole('button', { name: /^Back$/ }).first());
      await press(page.getByRole('button', { name: /^Back$/ }).first());
      const h = (await page.locator('#main h2').first().textContent())?.trim() ?? '';
      if (!h.startsWith('The Calloway Files')) throw new Error(`Back reached “${h}”`);
      return { heading: h };
    });
    await step('find-a-person', async () => {
      await press(page.locator('nav[aria-label="Pages followed"] button.link').filter({ hasText: /^Productions And People$/ }).first());
      await page.locator('#reference-find').fill('Minear'); await wait(500);
      const hit = page.locator('#main button.link').filter({ hasText: /^Tim Minear$/ }).first();
      await press(hit);
      return { heading: (await page.locator('#main h2').first().textContent())?.trim() };
    });
    await step('recognition', async () => {
      await tab('Charts And Awards');
      const body = await page.locator('#main').innerText();
      return { actorAwards: /Actor Awards/.test(body), ceremony: /(Go To The Ceremony|Watch From Home|Prepare Your Remarks|Go Up And Accept|Then the envelope is opened|You went up)/.test(body) };
    });
  } catch (e) {
    steps.push({ step: 'open', ok: false, error: String(e.message ?? e).slice(0, 300) });
  }
  report.sizes.push({ size: size.name, ok: steps.every((s) => s.ok), steps, problems });
  await ctx.close();
}
await browser.close();
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'k8.json'), `${JSON.stringify(report, null, 1)}\n`);
console.log(report.sizes.map((s) => `${s.size}: ${s.steps.filter((x) => x.ok).length} of ${s.steps.length} steps ok`).join('; '));
process.exit(report.sizes.every((s) => s.ok) ? 0 : 1);
