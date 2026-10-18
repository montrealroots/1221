/**
 * The editorial review's check of what a screen reader names a few controls and lines, on the built app (2026-10-18).
 * The text walk records a control's aria-label or its text, which still holds an arrow drawn with aria-hidden; this asks
 * the browser for the accessible name itself (`getByRole`), and reads the lines the review rewrote on the saves that show
 * them.
 *
 *   SLATE_BASE=http://localhost:4231 node docs/verification/language-2026-10-17/editorial/names.mjs SAVEDIR OUT.json
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { launchOptions } from '../../../../tools/browser.mjs';

const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
const [DIR, OUT] = process.argv.slice(2);
const browser = await chromium.launch(launchOptions());
const result = {};

async function open(save) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(`${DIR}/${save}`, 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await page.waitForTimeout(2500);
  return page;
}
const tab = async (page, rail, name) => {
  await page.getByRole('link', { name: new RegExp(`^${rail}`) }).first().click().catch(() => page.getByRole('button', { name: new RegExp(`^${rail}`) }).first().click());
  await page.waitForTimeout(1200);
  if (name) { await page.getByRole('tab', { name }).first().click(); await page.waitForTimeout(1200); }
};
const main = (page) => page.locator('main').innerText();

{
  const page = await open('brief.json');
  result.advance = { exact: await page.getByRole('button', { name: 'Advance', exact: true }).count(), withArrow: await page.getByRole('button', { name: 'Advance ▾', exact: true }).count() };
  result.lookAfter = { exact: await page.getByRole('button', { name: 'Look After Yourself', exact: true }).count(), withArrow: await page.getByRole('button', { name: 'Look After Yourself ▾', exact: true }).count() };
  const home = await main(page);
  result.home = home.split('\n').filter((l) => /Your home\.|of 16 in the class|Worth \$/.test(l));
  await tab(page, 'School', 'Standing');
  result.standing = (await main(page)).split('\n').filter((l) => /attended|toward attendance|Year \d of/.test(l)).slice(0, 6);
  await page.close();
}
// Each line on a save that shows it (the walk's `after-1440` found where): the leave's terms on a student with a rehearsal
// to come, attendance with nothing yet to count at a term's start, the class's parts once casting is out, a profile whose
// record has a reading with a reader, and a worth with a debt beside it.
for (const [save, rail, name, re] of [
  ['rehearsal.json', 'School', 'Standing', /If it’s granted|While you’re on leave|Give notice of your return/],
  ['roundups.json', 'School', 'Standing', /toward attendance/],
  ['decision.json', 'School', 'Casting', /From the class with you/],
  ['decision.json', 'Player Profile', '', /Coursework: running it with a reader|Year \d of 3/],
  ['lien.json', 'Home', '', /after \$[\d,]+ owed|of 16 in the class|Your home\./],
]) {
  const page = await open(save);
  if (rail !== 'Home') await tab(page, rail, name);
  result[`${save} ${rail}${name ? ` / ${name}` : ''}`] = [...new Set((await main(page)).split('\n').filter((l) => re.test(l)).map((l) => l.slice(0, 400)))].slice(0, 6);
  await page.close();
}
await browser.close();
writeFileSync(OUT, `${JSON.stringify(result, null, 1)}\n`);
console.log(JSON.stringify(result, null, 1));
