import { chromium } from '/home/user/1221/node_modules/playwright/index.mjs';
import { launchOptions } from '/home/user/1221/tools/browser.mjs';
const OUT = process.argv[2];
const browser = await chromium.launch(launchOptions());
const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
const wait = (ms) => page.waitForTimeout(ms);
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
await page.goto('http://localhost:5199', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('slate'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: /^New Save$/ }).first().waitFor({ timeout: 30000 }); await wait(300);
await page.getByRole('button', { name: /^New Save$/ }).first().click(); await wait(1200);
await page.getByRole('group', { name: 'Billed As' }).getByRole('button', { name: 'Actress' }).click();
await page.locator('#born-search').fill('New York'); await wait(800);
await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
await page.getByRole('button', { name: /^Same As Your Place Of Birth: / }).click(); await wait(400);
for (let i = 0; i < 4; i += 1) { await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(900); }
await page.getByText(/I Know SLATE/).first().click(); await wait(300);
await page.getByRole('button', { name: /^Begin$/ }).click();
await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
await shot('07-home-no-tutorial');
// Close the guide if it's open, to see Home itself.
const dialog = page.locator('[role=dialog]');
if (await dialog.count()) { await page.keyboard.press('Escape'); await wait(500); }
console.log('guide-ish', await page.evaluate(() => [...document.querySelectorAll('button, a')].map((b) => b.textContent.trim()).filter((t) => /Guide|How .* Works|Read/.test(t)).join(' | ')));
console.log(JSON.stringify({ dialogs: await page.locator('[role=dialog]').count(), url: page.url() }));
await browser.close();
