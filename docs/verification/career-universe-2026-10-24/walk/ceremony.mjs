// Brief 27, F (2026-10-25): a ceremony played on the built app (K7, loop 46), from a long career's save (`tools/long-career.ts
// --keep`, with `--until-invited` for one whose invitation is still to answer). At each size, as a player presses it:
//   1. Career, Charts And Awards: the invitation, and Go To The Ceremony pressed once (a save already answered says so);
//   2. every nomination at the show reads going, with no second question;
//   3. Prepare Your Remarks pressed once: every nomination reads the same preparation (or, ready, why it can't be);
//   4. the clock moved on with the Advance menu's Next Event, Go pressed at each stop, until the show's own stop, Go;
//   5. each win's stop, if any comes, a minute apart: Go Up And Accept pressed, and the speech said;
//   6. Charts And Awards after the show: what each nomination says now.
// At each step: no page error, nothing wider than the window, every control on screen or in a box that scrolls.
//
//   SLATE_BASE=http://localhost:4173 node docs/verification/career-universe-2026-10-24/walk/ceremony.mjs OUT SAVE.json.gz
//
// Writes OUT/ceremony.json and OUT/<size>/NN-<step>.jpg. Emulation, not a phone: Chromium's touch and viewport emulation.
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
  const press = async (loc) => { await loc.scrollIntoViewIfNeeded().catch(() => {}); if (size.phone) await loc.tap({ timeout: 8000 }); else await loc.click({ timeout: 8000 }); await wait(600); };
  const layout = () => page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    return {
      pageWider: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      controlsOut: [...document.querySelectorAll('#main button, #main a[href], #main [role=tab], #main input, [role=dialog] button')].filter(vis).filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.right <= innerWidth + 1 && r.left >= -1) return false;
        for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/auto|scroll/.test(s.overflowX) && p.scrollWidth > p.clientWidth) return false; }
        return true;
      }).map((el) => el.textContent.trim().slice(0, 30)).slice(0, 8),
      clock: `${document.querySelector('.topbar-clock')?.textContent?.trim() ?? ''}`,
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
  const awards = async () => { await rail('Career'); await tab('Charts And Awards'); };
  const body = async () => (await page.locator('#main').innerText()).replace(/\s+/g, ' ');
  const count = (s, re) => (s.match(re) ?? []).length;
  const toasts = async () => (await page.locator('.toast').allTextContents()).map((t) => t.trim());
  const dialog = () => page.getByRole('dialog').last();

  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
    await page.reload({ waitUntil: 'networkidle' }); await wait(1200);
    await press(page.getByRole('button', { name: /^Continue$/ }).first());
    const time = page.getByRole('group', { name: 'Time Controls' }).first();
    await time.waitFor({ timeout: 90000 });
    await wait(1200);
    for (let i = 0; i < 6; i += 1) { if (!(await page.getByRole('dialog').count())) break; await page.keyboard.press('Escape'); await wait(400); }
    // The clock paused, so nothing moves but what's pressed.
    const pause = time.getByRole('button', { name: /^Pause$/ });
    if (await pause.count()) await press(pause.first());

    // The show's name as the invitation or the answer says it, and as its stop is titled.
    const SHOW = /You’re (?:invited to|going to) (the \d+\w+ (?:Creative Arts Emmys|Emmy Awards|Actor Awards))/;
    const GOING = /You’re going to the \d+\w+ (?:Creative Arts Emmys|Emmy Awards|Actor Awards) on/g;
    let show = null;
    await step('invitation', async () => {
      await awards();
      const b = await body();
      show = b.match(SHOW)?.[1] ?? null;
      return { show, invited: count(b, /You’re invited to/g), going: count(b, GOING), goButtons: await page.getByRole('button', { name: /^Go To The Ceremony$/ }).count() };
    });
    await step('go', async () => {
      const go = page.getByRole('button', { name: /^Go To The Ceremony$/ });
      if (!(await go.count())) return { skipped: 'answered in the save', going: count(await body(), GOING) };
      await press(go.first());
      const said = await toasts();
      const b = await body();
      const left = await page.getByRole('button', { name: /^Go To The Ceremony$/ }).count();
      if (left) throw new Error(`${left} Go To The Ceremony still offered after one answer`);
      return { toast: said.at(-1) ?? null, going: count(b, GOING), invitedStill: count(b, /You’re invited to/g) };
    });
    await step('prepare', async () => {
      const prep = page.getByRole('button', { name: /^Prepare Your Remarks/ }).first();
      const before = await body();
      if (await prep.isDisabled()) return { skipped: before.match(/Not now: (Your remarks are as ready as they’ll get\.)/)?.[1] ?? 'grayed', prepared: Number(before.match(/Your remarks are (\d+)% prepared/)?.[1]) };
      await press(prep);
      const said = await toasts();
      const b = await body();
      const ready = [...b.matchAll(/Your remarks are (\d+)% prepared/g)].map((x) => Number(x[1]));
      if (new Set(ready).size !== 1) throw new Error(`remarks read ${[...new Set(ready)].join(', ')}% across the show`);
      return { toast: said.at(-1) ?? null, prepared: ready[0], nominations: ready.length };
    });
    const passed = [];
    const speeches = [];
    let atShow = false;
    await step('to-the-show', async () => {
      // Next Event, again and again; at each stop, Go (and at a win's stop, Go Up And Accept). Ends a stop after the show.
      for (let i = 0; i < 200; i += 1) {
        if (await page.getByRole('dialog').count()) {
          const d = dialog();
          const title = (await d.getAttribute('aria-label')) ?? '';
          const accept = d.getByRole('button', { name: /^Go Up And Accept$/ });
          if (await accept.count()) {
            await shot('speech-stop');
            await press(accept.first());
            speeches.push({ stop: title, toast: (await toasts()).at(-1) ?? null });
            continue;
          }
          if (title === 'On The Way') { await press(d.locator('.btn-primary').first()); continue; }
          const go = d.getByRole('button', { name: /^Go$/ });
          if (await go.count()) {
            passed.push(title);
            const isShow = show && title.toLowerCase() === show.toLowerCase();
            if (isShow) await shot('show-stop');
            await press(go.first());
            if (isShow) { atShow = true; await wait(1500); }
            continue;
          }
          await page.keyboard.press('Escape'); await wait(400);
          continue;
        }
        // After the show's Go, the clock ran the evening: each win's stop, a minute apart, halted it; with none left, the
        // evening is over.
        if (atShow) break;
        await press(time.getByRole('button', { name: /^Advance/ }).first());
        await press(page.getByRole('menuitem', { name: /^Next Event/ }).first());
        await wait(500);
      }
      return { stops: passed.length, atShow, show, last: passed.slice(-4), speeches: speeches.length };
    });
    if (speeches.length) await step('speech', async () => ({ speeches }));
    await step('after', async () => {
      for (let i = 0; i < 4; i += 1) { if (!(await page.getByRole('dialog').count())) break; await page.keyboard.press('Escape'); await wait(400); }
      await awards();
      const b = await body();
      return {
        won: count(b, /It’s you: you won|you won Outstanding/g),
        speechWords: (b.match(/Your speech (was the night’s|landed)|You said what you’d meant to|You lost your place halfway/g) ?? []),
        stillGoing: count(b, GOING),
        watch: await page.getByRole('button', { name: /^Watch/ }).count(),
      };
    });
  } catch (e) {
    steps.push({ step: 'open', ok: false, error: String(e.message ?? e).slice(0, 300) });
  }
  report.sizes.push({ size: size.name, ok: steps.every((s) => s.ok), steps, problems });
  await ctx.close();
}
await browser.close();
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'ceremony.json'), `${JSON.stringify(report, null, 1)}\n`);
console.log(report.sizes.map((s) => `${s.size}: ${s.steps.filter((x) => x.ok).length} of ${s.steps.length} steps ok`).join('; '));
process.exit(report.sizes.every((s) => s.ok) ? 0 : 1);
