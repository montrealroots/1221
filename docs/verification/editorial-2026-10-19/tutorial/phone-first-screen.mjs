// A new life at 390 wide, its guide closed with Later: the first screen as a phone shows it, top bar and all.
//   node docs/verification/editorial-2026-10-19/tutorial/phone-first-screen.mjs OUT.png
import { chromium } from 'playwright';
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const wait = (ms) => page.waitForTimeout(ms);
await page.goto(process.env.SLATE_BASE ?? 'http://localhost:4282', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^New Save$/ }).first().click(); await wait(1000);
await page.getByRole('group', { name: 'Billed As' }).getByRole('button', { name: 'Actress' }).click();
await page.locator('#born-search').fill('New York'); await wait(800);
await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: /^Continue$/ }).click(); await wait(900); }
await page.getByRole('button', { name: /^Begin$/ }).click();
await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
await page.locator('[role=dialog] button', { hasText: /^Later$/ }).first().click(); await wait(600);
await page.screenshot({ path: out });
const bar = await page.locator('.topbar-time').first().evaluate((el) => [...el.querySelectorAll('button')].map((b) => ({ text: b.innerText.replace(/\s+/g, ' '), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })));
console.log(JSON.stringify(bar));
await browser.close();
