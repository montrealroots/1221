/**
 * The Work tab and Papers' Your Work And Your Permission on the built app (brief 19's pay, 2026-10-21), read as the player
 * has them, at a width. The saves are `make-saves.ts`'s. Only the screen's own controls are pressed: the menu's Career,
 * the Work tab (and the arrow keys from Portfolio), the menu's Papers and its Permission To Work tab.
 *
 *   SLATE_BASE=http://localhost:4184 node docs/verification/career-2026-10-20/pay/work-walk.mjs OUTDIR WIDTH SAVEDIR
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4184';
const [OUT = '.', W = '1440', DIR = '.'] = process.argv.slice(2);
const WIDTH = Number(W);
const browser = await chromium.launch(launchOptions());
const view = { width: WIDTH, height: WIDTH < 600 ? 844 : 900 };
const log = [];
const clean = (s) => String(s ?? '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

async function opened(file) {
  const page = await browser.newPage({ viewport: view });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  const text = readFileSync(`${DIR}/${file}`, 'utf8');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /^Continue$/ }).first().click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1000);
  return { page, errors };
}
async function rail(page, name) {
  const menu = page.getByRole('button', { name: /^Menu$/ });
  if (await menu.count() && await menu.first().isVisible()) { await menu.first().click(); await page.waitForTimeout(300); }
  await page.getByRole('link', { name: new RegExp(`^${name}`) }).or(page.getByRole('button', { name: new RegExp(`^${name}`) })).first().click();
  await page.waitForTimeout(800);
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const [file, name] of [['work-none.json', 'none'], ['work-paid.json', 'paid']]) {
  const { page, errors } = await opened(file);
  await rail(page, 'Career');
  const tabs = await page.getByRole('tab').allInnerTexts();
  log.push(`${name} at ${WIDTH}: tabs ${JSON.stringify(tabs.map(clean))}`);
  await page.getByRole('tab', { name: 'Portfolio' }).click(); await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
  const selected = await page.locator('[role=tab][aria-selected=true]').innerText();
  log.push(`ArrowRight from Portfolio selects: ${clean(selected)}`);
  const text = await page.getByRole('tabpanel').innerText();
  writeFileSync(`${OUT}/work-${name}-${WIDTH}.txt`, `${clean(text)}\n`);
  await page.screenshot({ path: `${OUT}/work-${name}-${WIDTH}.png`, fullPage: true });
  log.push(`work-${name} at ${WIDTH}: ${clean(text).length} characters, horizontal overflow ${await overflow(page)}px`);
  const joinButton = page.getByRole('button', { name: /^Join SAG-AFTRA/ });
  log.push(`Join SAG-AFTRA: ${await joinButton.count()} button, disabled ${await joinButton.first().isDisabled().catch(() => 'n/a')}`);
  const details = page.getByText('Sources And Estimates').first();
  await details.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  log.push(`Sources And Estimates opened by Enter: ${await page.locator('details.fine').first().evaluate((d) => d.open)}`);
  if (name === 'paid') {
    await rail(page, 'Papers');
    await page.getByRole('tab', { name: 'Permission To Work' }).click(); await page.waitForTimeout(500);
    const papers = await page.getByRole('tabpanel').innerText();
    writeFileSync(`${OUT}/papers-${name}-${WIDTH}.txt`, `${clean(papers)}\n`);
    log.push(`papers-${name} at ${WIDTH}: ${clean(papers).length} characters, horizontal overflow ${await overflow(page)}px, Your Work And Your Permission shown: ${papers.includes('Your Work And Your Permission')}`);
  }
  log.push(`${name} at ${WIDTH}: page errors ${errors.length ? errors.join('; ') : 'none'}`);
  await page.close();
}
await browser.close();
writeFileSync(`${OUT}/walk-${WIDTH}.txt`, `${log.join('\n')}\n`);
console.log(log.join('\n'));
