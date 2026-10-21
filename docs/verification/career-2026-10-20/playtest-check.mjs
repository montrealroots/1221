// Run from the repository root, against `npx vite preview --port 4291` of a build with PLAYTEST.md's saves copied into dist/saves.
// Checks PLAYTEST.md's setup: its console snippet, taken from the file and run as written but for its name (`open` is
// the window's own, so it is defined as `open_` here), opens each save, Continue goes into it, and the Career screen opens.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { launchOptions } from '../../../tools/browser.mjs';
const doc = readFileSync('docs/verification/career-2026-10-20/PLAYTEST.md', 'utf8');
const snippet = doc.split('```js\n')[1].split('\n```')[0];
const browser = await chromium.launch(launchOptions());
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:4291/');
await page.waitForTimeout(2000);
for (const name of ['last-term.json', 'follow-up.json', 'paid.json']) {
  await Promise.all([page.waitForEvent('load'), page.evaluate(`(async () => { ${snippet.replace('const open =', 'window.open_ =')}; await window.open_('${name}'); })()`)]);
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.locator('nav.rail').getByRole('button', { name: /^Career/ }).first().click();
  await page.waitForTimeout(1500);
  const text = await page.evaluate(() => document.body.innerText);
  const date = text.match(/(January|February|March|April|May|June|July|August|September|October|November|December) \d+, 20\d\d/)?.[0];
  console.log(text.slice(0, 400).replace(/\n/g, ' / ')); console.log(name, '| first date on the page:', date, '| Career screen:', /Where you stand as a professional actor/.test(text), '| what it shows:', (text.match(/Where You Stand With Him\n+([^\n]+)/)?.[1] ?? text.match(/You’re an MFA candidate[^.]*\./)?.[0] ?? text.match(/Finished Engagements/)?.[0] ?? ''), '| length', text.length);
}
console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
