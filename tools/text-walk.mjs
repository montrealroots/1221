/**
 * The text walk: what the built app says on each screen, read from the page (from 2026-10-17, brief 14).
 *
 * For each scenario save in SAVEDIR (`tools/scenario-saves.mjs` writes them), it opens the save on the built app, then
 * Home, every destination the rail lists and every tab behind each, and records each screen's text as a player reads it,
 * each control's accessible name, and each placeholder. It opens the first few notices on Home, which only reads them
 * (`docs/DRILL-DOWN.md`, rule 14: nothing about looking is saved), and never presses anything that commits. So the
 * same walk on two builds sets their words side by side, and `tools/text-render-check.mjs` reads what it wrote.
 *
 *   SLATE_BASE=http://localhost:4173 node tools/text-walk.mjs OUT WIDTH SAVEDIR [save.json ...]
 *
 * It writes OUT/<save>.json, a list of screens, and OUT/walk.json, what it visited. A screen it couldn't reach is
 * recorded with why, and the walk goes on.
 */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { launchOptions } from './browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [OUT = 'text-walk', W = '1440', DIR = '', ...ONLY] = process.argv.slice(2);
const WIDTH = Number(W);
const PHONE = WIDTH < 600;
mkdirSync(OUT, { recursive: true });
const saves = (ONLY.length ? ONLY : readdirSync(DIR).filter((f) => f.endsWith('.json'))).sort();
const browser = await chromium.launch(launchOptions());
const visited = [];

async function screenText(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main') ?? document.body;
    const names = (sel) => [...document.querySelectorAll(sel)].map((el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    return {
      text: (main.innerText ?? '').replace(/\n{3,}/g, '\n\n').trim(),
      buttons: [...new Set(names('button, [role=button], [role=tab], [role=menuitem], a[href]'))],
      labels: [...new Set([...document.querySelectorAll('[aria-label], [alt], [title]')].map((el) => el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title')).filter(Boolean))],
      placeholders: [...new Set([...document.querySelectorAll('[placeholder]')].map((el) => el.getAttribute('placeholder')))],
      dialogs: [...document.querySelectorAll('[role=dialog]')].map((d) => d.innerText.trim()).filter(Boolean),
    };
  });
}

for (const save of saves) {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: PHONE ? 844 : 900 } });
  const wait = (ms) => page.waitForTimeout(ms);
  const screens = [];
  const record = async (screen, tab) => { try { screens.push({ screen, tab, ...(await screenText(page)) }); } catch (e) { screens.push({ screen, tab, failed: String(e).slice(0, 200) }); } };
  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const text = readFileSync(`${DIR}/${save}`, 'utf8');
    await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
    await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
    await record('Save Slots', '');
    await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3500);
    await record('Home', '');
    // A few notices opened in place, read only.
    const titles = page.locator('main').getByRole('button').filter({ hasText: /\S/ });
    const n = Math.min(await titles.count().catch(() => 0), 40);
    let opened = 0;
    for (let i = 0; i < n && opened < 4; i++) {
      const b = titles.nth(i);
      const name = ((await b.innerText().catch(() => '')) || '').trim();
      if (!name || /^(Mark|Dismiss|Go There|Show|Advance|Play|Pause|Sleep|Save|Menu|Toggle|Yes|No|Accept|Decline|Go|Skip|Stand Here|Close)/.test(name)) continue;
      if (!(await b.isVisible().catch(() => false))) continue;
      const inNeeds = await b.evaluate((el) => !!el.closest('section, .card') && /What Needs You/.test(el.closest('section, .card')?.innerText ?? '')).catch(() => false);
      if (!inNeeds) continue;
      await b.click().catch(() => {}); await wait(500);
      await record('Home', `notice: ${name.slice(0, 60)}`); opened++;
      await page.keyboard.press('Escape').catch(() => {}); await wait(300);
    }
    if (PHONE) { await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click().catch(() => {}); await wait(400); }
    const rail = await page.locator('#rail').getByRole('button').allInnerTexts().catch(() => []);
    if (PHONE) { await page.keyboard.press('Escape').catch(() => {}); await wait(300); }
    for (const raw of rail) {
      const name = raw.split('\n')[0].trim();
      if (!name || /^Save/.test(name)) continue;
      if (PHONE) { await page.getByRole('button', { name: /^(Toggle Navigation|Menu)$/ }).first().click().catch(() => {}); await wait(400); }
      const b = page.locator('#rail').getByRole('button', { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first();
      if (!(await b.count()) || await b.isDisabled().catch(() => false)) { screens.push({ screen: name, tab: '', unreachable: 'its rail entry is locked or gone' }); if (PHONE) await page.keyboard.press('Escape').catch(() => {}); continue; }
      await b.click().catch(() => {}); await wait(900);
      await record(name, '');
      const tabs = await page.getByRole('tab').allInnerTexts().catch(() => []);
      for (const t of tabs.map((x) => x.split('\n')[0].trim()).filter(Boolean)) {
        const tb = page.getByRole('tab', { name: new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first();
        if (!(await tb.count()) || await tb.getAttribute('aria-selected') === 'true') continue;
        await tb.click().catch(() => {}); await wait(600);
        await record(name, t);
      }
    }
  } catch (e) {
    screens.push({ screen: 'the walk', failed: String(e).slice(0, 300) });
  }
  writeFileSync(`${OUT}/${save}`, `${JSON.stringify(screens, null, 1)}\n`);
  visited.push({ save, screens: screens.length, failed: screens.filter((s) => s.failed || s.unreachable).map((s) => `${s.screen}: ${s.failed ?? s.unreachable}`) });
  console.log(`${save}: ${screens.length} screens`);
  await page.close();
}
writeFileSync(`${OUT}/walk.json`, `${JSON.stringify({ base: BASE, width: WIDTH, visited }, null, 1)}\n`);
await browser.close();
