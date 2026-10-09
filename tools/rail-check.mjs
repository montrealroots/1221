/**
 * The rail in the running app, measured (from 2026-10-08) at four widths: every row at least 36 pixels tall, no name cut
 * short, no sideways scroll, the current page and section marked, a section opening its screen at its tab, a group
 * folding and opening, keyboard focus visible, and below a laptop the drawer over the screen's height, closed by Escape.
 * The exit is the count of failures.
 *
 *   npx vite build && npx vite preview --port 4173 &
 *   node tools/rail-check.mjs <save.json> <screenshot dir>
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { launchOptions } from './browser.mjs';
const [file, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(launchOptions());
let failures = 0;
const fail = (m) => { failures += 1; console.log('FAIL ' + m); };
for (const vp of [{ n: 'wide', width: 1440, height: 900 }, { n: 'laptop', width: 1024, height: 768 }, { n: 'tablet', width: 820, height: 1180 }, { n: 'phone', width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  page.on('pageerror', (e) => fail(`${vp.n} page error ${String(e).slice(0, 160)}`));
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
  await page.evaluate((text) => new Promise((resolve, reject) => { const req = indexedDB.open('slate', 1); req.onupgradeneeded = () => req.result.createObjectStore('saves'); req.onerror = () => reject(req.error); req.onsuccess = () => { const tx = req.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(text, 'slate.save.1'); tx.oncomplete = () => resolve(); }; }), readFileSync(file, 'utf8'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /^continue$/i }).first().click({ timeout: 8000 });
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape');
  const drawer = vp.width <= 900;
  const openRail = async () => { if (drawer) { await page.getByRole('button', { name: /Toggle Navigation/ }).click(); await page.waitForTimeout(400); } };
  await openRail();
  const measure = async (where) => {
    const m = await page.evaluate(() => {
      const rail = document.getElementById('rail');
      const rows = [...rail.querySelectorAll('button.rail-item, button.rail-group-head, #rail-find')];
      const shown = rows.filter((b) => b.offsetParent !== null);
      return {
        sideways: document.documentElement.scrollWidth > window.innerWidth + 1,
        short: shown.filter((b) => b.getBoundingClientRect().height < 36).map((b) => b.textContent.trim()),
        clipped: shown.filter((b) => [...b.querySelectorAll('.rail-label')].some((l) => l.scrollWidth > l.clientWidth + 1)).map((b) => b.textContent.trim()),
        railScrollsSideways: rail.scrollWidth > rail.clientWidth + 1,
        current: [...rail.querySelectorAll('[aria-current="page"]')].map((b) => b.textContent.trim()),
        rows: shown.length,
      };
    });
    if (m.sideways) fail(`${vp.n} ${where}: the page scrolls sideways`);
    if (m.railScrollsSideways) fail(`${vp.n} ${where}: the rail scrolls sideways`);
    if (m.short.length) fail(`${vp.n} ${where}: rows under 36px: ${m.short.join(', ')}`);
    if (m.clipped.length) fail(`${vp.n} ${where}: names cut short: ${m.clipped.join(', ')}`);
    return m;
  };
  const home = await measure('home');
  if (!home.current.some((c) => c.startsWith('Home'))) fail(`${vp.n}: Home isn't marked current: ${home.current}`);
  await page.screenshot({ path: `${out}/${vp.n}-1-home.png` });
  // Career's section Work, from the rail: the screen opens at its tab, and the rail marks both.
  await page.locator('#rail').getByRole('button', { name: /^Your Career/ }).click();
  await page.waitForTimeout(700);
  await openRail();
  const sectionButton = page.locator('#rail .rail-section', { hasText: 'Auditions' });
  if (!(await sectionButton.count())) fail(`${vp.n}: Career's sections aren't under it`);
  else {
    await sectionButton.click();
    await page.waitForTimeout(700);
    const tab = await page.locator('[role="tab"][aria-selected="true"]').first().textContent();
    if (tab?.trim() !== 'Auditions') fail(`${vp.n}: choosing Auditions opened ${tab}`);
    await openRail();
    const marked = await page.locator('#rail .rail-section[aria-current="true"]').first().textContent();
    if (marked?.trim() !== 'Auditions') fail(`${vp.n}: the rail marks ${marked} as showing`);
  }
  const career = await measure('career');
  if (!career.current.some((c) => c.startsWith('Your Career'))) fail(`${vp.n}: Your Career isn't marked current: ${career.current}`);
  await page.screenshot({ path: `${out}/${vp.n}-2-career.png` });
  // Folding a group away and back.
  const head = page.locator('#rail .rail-group-head', { hasText: 'Your Things' });
  await head.click();
  if ((await head.getAttribute('aria-expanded')) !== 'false') fail(`${vp.n}: Your Things didn't fold`);
  await head.click();
  if ((await head.getAttribute('aria-expanded')) !== 'true') fail(`${vp.n}: Your Things didn't open again`);
  // Keyboard: focus visible on a rail row.
  await page.locator('#rail .rail-group-head').first().focus();
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => { const el = document.activeElement; const s = getComputedStyle(el); return { inRail: Boolean(el.closest('#rail')), width: s.outlineWidth, style: s.outlineStyle }; });
  if (!outline.inRail || outline.style === 'none' || outline.width === '0px') fail(`${vp.n}: keyboard focus not visible in the rail (${JSON.stringify(outline)})`);
  await page.screenshot({ path: `${out}/${vp.n}-3-focus.png` });
  if (drawer) {
    const covers = await page.evaluate(() => { const r = document.getElementById('rail').getBoundingClientRect(); return r.top <= 0 && r.bottom >= window.innerHeight - 1; });
    if (!covers) fail(`${vp.n}: the drawer doesn't cover the screen's height`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const hidden = await page.evaluate(() => getComputedStyle(document.getElementById('rail')).visibility === 'hidden');
    if (!hidden) fail(`${vp.n}: Escape didn't close the drawer`);
  }
  console.log(`${vp.n}: ${home.rows} rows checked`);
  await page.close();
}
await browser.close();
console.log(failures ? `${failures} failed` : 'all passed');
process.exit(failures ? 1 : 0);
