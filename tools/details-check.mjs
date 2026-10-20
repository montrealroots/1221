/**
 * SLATE — the details a screen folds away, checked from the keyboard (from 2026-10-20, the owner's brief 17, section 11:
 * "Verify expandable details, keyboard navigation, accessibility labels, overflow, and mobile readability").
 *
 * For each save, on the built app at a width: the School's Coursework tab and the Player Profile, each opened from the
 * rail as a player opens them. On each, every native disclosure (`<details>`, which `Fine` and the advice card's Why This
 * Recommendation are) is checked: its summary has words to name it; it can be reached with Tab; Enter opens it and Enter
 * again closes it. The page is checked for a screen past the right edge (the document wider than the window) and for any
 * element in `main` that runs past it. A screenshot is taken of the first view with every disclosure shut, and of the
 * same screen with its first two opened, so a summary and its details can be looked at side by side.
 *
 *   npm run build && node node_modules/vite/bin/vite.js preview --port 4310 --strictPort &
 *   SLATE_BASE=http://localhost:4310 node tools/details-check.mjs OUT WIDTH SAVEDIR save.json [save.json ...]
 *
 * It writes OUT/details-<width>.json and the screenshots beside it, and exits with the count of failures, so a pipe
 * can't hide one.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from './browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [OUT, W = '1440', DIR, ...SAVES] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch(launchOptions());
const results = [];
let failures = 0;

async function open(page, name, tab) {
  const wait = (ms) => page.waitForTimeout(ms);
  if (PHONE) { await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click().catch(() => {}); await wait(400); }
  await page.locator('#rail').getByRole('button', { name: new RegExp(`^${name}`) }).first().click({ timeout: 8000 });
  await wait(900);
  if (tab) { await page.getByRole('tab', { name: new RegExp(`^${tab}$`) }).first().click({ timeout: 8000 }); await wait(700); }
}

for (const save of SAVES) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
  const wait = (ms) => page.waitForTimeout(ms);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(`${DIR}/${save}`, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3500);
  for (const [screen, tab] of [['School', 'Coursework'], ['Player Profile', '']]) {
    const at = `${save.replace(/\.json$/, '')} ${screen}${tab ? ` ${tab}` : ''}`;
    const row = { save, screen, tab, width: WIDTH, details: 0, unnamed: [], unreachable: [], wontOpen: [], wontClose: [], overflow: [], errors: [] };
    try {
      await open(page, screen, tab);
      const slug = `${save.replace(/\.json$/, '')}-${screen.replace(/\s+/g, '-').toLowerCase()}${tab ? `-${tab.toLowerCase()}` : ''}-${WIDTH}`;
      await page.screenshot({ path: `${OUT}/${slug}-shut.jpg`, type: 'jpeg', quality: 70 });
      const n = await page.locator('main details > summary').count();
      row.details = n;
      for (let i = 0; i < n; i += 1) {
        const s = page.locator('main details > summary').nth(i);
        const name = ((await s.innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
        if (!name) row.unnamed.push(i);
        // Reached by Tab: focus the element before it in the page's order, then one Tab lands on it.
        const reached = await s.evaluate((el) => {
          const all = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.hasAttribute('disabled') && x.offsetParent !== null);
          const k = all.indexOf(el);
          if (k > 0) all[k - 1].focus(); else document.body.focus();
          return k >= 0;
        });
        if (!reached) { row.unreachable.push(name || i); continue; }
        await page.keyboard.press('Tab');
        const focused = await s.evaluate((el) => document.activeElement === el);
        if (!focused) { row.unreachable.push(name || i); continue; }
        const wasOpen = await s.evaluate((el) => el.parentElement.open);
        await page.keyboard.press('Enter'); await wait(150);
        const opened = await s.evaluate((el) => el.parentElement.open);
        if (opened === wasOpen) row.wontOpen.push(name);
        await page.keyboard.press('Enter'); await wait(150);
        const closed = await s.evaluate((el) => el.parentElement.open);
        if (closed !== wasOpen) row.wontClose.push(name);
      }
      // The first two opened, for the picture of a summary beside its details.
      for (let i = 0; i < Math.min(2, n); i += 1) await page.locator('main details > summary').nth(i).evaluate((el) => { el.parentElement.open = true; });
      await wait(300);
      if (n) await page.locator('main details').first().scrollIntoViewIfNeeded().catch(() => {});
      await page.screenshot({ path: `${OUT}/${slug}-open.jpg`, type: 'jpeg', quality: 70 });
      row.overflow = await page.evaluate(() => {
        const out = [];
        if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`the page is ${document.documentElement.scrollWidth}px wide in a ${window.innerWidth}px window`);
        for (const el of document.querySelectorAll('main *')) {
          const r = el.getBoundingClientRect();
          if (r.width && r.right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed') {
            let p = el.parentElement; let scrolls = false;
            while (p) { const o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') { scrolls = true; break; } p = p.parentElement; }
            if (!scrolls) out.push(`${el.tagName.toLowerCase()} “${(el.innerText ?? '').slice(0, 50)}” ends at ${Math.round(r.right)}px`);
          }
          if (out.length > 8) break;
        }
        return out;
      });
    } catch (e) { row.errors.push(String(e).slice(0, 200)); }
    row.errors.push(...errors.splice(0));
    const bad = row.unnamed.length + row.unreachable.length + row.wontOpen.length + row.wontClose.length + row.overflow.length + row.errors.length;
    failures += bad;
    results.push({ ...row, failures: bad });
    console.log(`${at} at ${WIDTH}: ${row.details} disclosures, ${bad} failures`);
  }
  await page.close();
}
await browser.close();
writeFileSync(`${OUT}/details-${WIDTH}.json`, `${JSON.stringify({ base: BASE, width: WIDTH, failures, results }, null, 1)}\n`);
process.exit(Math.min(failures, 100));
