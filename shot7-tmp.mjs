import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 });
page.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 200)));
await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(4000);
await page.getByRole('button', { name: /new (save|game)|start|empty slot|create/i }).first().click();
await page.waitForTimeout(1200);
for (let i = 0; i < 2; i++) {
  await page.getByRole('button', { name: /^(next|continue)/i }).first().click();
  await page.waitForTimeout(900);
}
console.log('career cards:', (await page.locator('.trait-name').allInnerTexts()).join(' | '));
const h = await page.evaluate(() => document.querySelector('.main').scrollHeight);
await page.setViewportSize({ width: 1440, height: Math.min(h + 40, 6000) });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/career-full.png` });
console.log('captured full height', h);
await browser.close();
