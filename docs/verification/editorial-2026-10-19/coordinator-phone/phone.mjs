// Brief 15's coordinator: the first screen at 390 wide, and the guide at its longest chapter, after the phone fixes in
// src/styles/app.css. The tutorial area's phone-first-screen.mjs, with the guide opened and its page's room measured.
//   SLATE_BASE=http://localhost:PORT node docs/verification/editorial-2026-10-19/coordinator-phone/phone.mjs OUTDIR
import { chromium } from 'playwright';
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const wait = (ms) => page.waitForTimeout(ms);
await page.goto(process.env.SLATE_BASE ?? 'http://localhost:4291', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^New Save$/ }).first().click(); await wait(1000);
await page.getByRole('group', { name: 'Billed As' }).getByRole('button', { name: 'Actress' }).click();
await page.locator('#born-search').fill('New York'); await wait(800);
await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: /^Continue$/ }).click(); await wait(900); }
await page.getByRole('button', { name: /^Begin$/ }).click();
await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
// The guide as it opens on a new life: chapter 1, its page's room measured before Later closes it.
const room = async () => page.locator('.guide-page').first().evaluate((el) => {
  const dialog = el.closest('[role=dialog]'); const r = el.getBoundingClientRect(); const body = el.closest('.modal-body');
  return { pageHeight: Math.round(r.height), pageScrolls: el.scrollHeight > el.clientHeight + 1, bodyScrolls: body ? body.scrollHeight > body.clientHeight + 1 : null, dialogHeight: dialog ? Math.round(dialog.getBoundingClientRect().height) : null };
});
const opened = await room();
await page.screenshot({ path: `${out}/guide-chapter-1-390.png` });
await page.locator('[role=dialog] button', { hasText: /^Later$/ }).first().click(); await wait(600);
await page.screenshot({ path: `${out}/first-screen-390.png` });
const bar = await page.locator('.topbar-time').first().evaluate((el) => [...el.querySelectorAll('button')].map((b) => ({ text: b.innerText.replace(/\s+/g, ' '), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })));
const overlap = await page.evaluate(() => {
  const a = document.querySelector('.topbar-clock')?.getBoundingClientRect(); const g = document.querySelector('.topbar-group')?.getBoundingClientRect();
  return a && g ? { clockRight: Math.round(a.right), clockBottom: Math.round(a.bottom), groupLeft: Math.round(g.left), groupTop: Math.round(g.top), overlaps: a.right > g.left && a.bottom > g.top && g.bottom > a.top } : null;
});
console.log(JSON.stringify({ opened, bar, overlap }, null, 1));
await browser.close();
