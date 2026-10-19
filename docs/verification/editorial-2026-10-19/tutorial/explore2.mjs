import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const SAVE = process.argv[3];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const wait = (ms) => page.waitForTimeout(ms);
await page.goto('http://localhost:4282', { waitUntil: 'networkidle' });
if (SAVE) {
  const { readFileSync } = await import('node:fs');
  const text = readFileSync(SAVE, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(4000);
} else {
  await page.getByRole('button', { name: /^New Save$/ }).first().click(); await wait(1000);
  await page.getByRole('group', { name: 'Billed As' }).getByRole('button', { name: 'Actress' }).click();
  await page.locator('#born-search').fill('New York'); await wait(800);
  await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
  for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: /^Continue$/ }).click(); await wait(900); }
  await page.getByRole('button', { name: /^Begin$/ }).click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
  for (let i = 0; i < 17; i++) {
    await page.locator('[role=dialog] button', { hasText: /^I’ve Read It$/ }).first().click(); await wait(400);
    if (i < 16) { await page.locator('[role=dialog] button', { hasText: /^Next: / }).first().click(); await wait(300); }
  }
  await page.keyboard.press('Escape'); await wait(500);
}
for (const dest of ['School', 'Player Profile', 'Money', 'Papers']) {
  await page.locator('#rail').getByRole('button', { name: new RegExp(`^${dest}`) }).first().click(); await wait(1200);
  const tabs = (await page.getByRole('tab').allInnerTexts()).map((x) => x.split('\n')[0].trim());
  for (const t of tabs.length ? tabs : ['']) {
    if (t) { await page.getByRole('tab', { name: new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).first().click(); await wait(900); }
    const text = await page.locator('main').innerText();
    const buttons = [...new Set((await page.locator('main button').allInnerTexts()).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean))];
    writeFileSync(`${OUT}/${dest}-${t || 'main'}.txt`.replace(/ /g, '_'), `${text}\n\n--- BUTTONS ---\n${buttons.join('\n')}\n`);
  }
}
await browser.close();
