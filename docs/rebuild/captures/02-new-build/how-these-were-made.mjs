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
// Fill Identity so the steps can be walked, and the mock shows chosen values.
await page.getByRole('group', { name: 'Billed As' }).getByRole('button', { name: 'Actress' }).click();
await page.locator('#born-search').fill('New York'); await wait(800);
await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
await page.getByRole('button', { name: /^Same As Your Place Of Birth: / }).click(); await wait(400);
// Walk to step 3 to copy the Languages card, then come back.
await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(900);
await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(900);
const languagesHtml = await page.evaluate(() => [...document.querySelectorAll('.creation .card')].find((c) => c.querySelector('h2')?.textContent === 'Languages').innerHTML);
await page.getByRole('button', { name: /^Back$/ }).first().click(); await wait(600);
await page.getByRole('button', { name: /^Back$/ }).first().click(); await wait(900);

const fixSteps = (active) => page.evaluate((active) => {
  const steps = [...document.querySelectorAll('.creation-step')];
  steps.find((s) => /Dispositions/.test(s.textContent))?.remove();
  const g = steps.find((s) => /Genres/.test(s.textContent)); if (g) g.textContent = 'Background';
  let seen = false; for (const s of document.querySelectorAll('.creation-step')) { const on = s.textContent.trim() === active; if (on) { s.setAttribute('data-state', 'active'); seen = true; } else if (!seen) s.setAttribute('data-state', 'done'); else s.removeAttribute('data-state'); }
  const p = document.querySelector('.creation .row-between p.muted.small'); if (p) p.textContent = 'SLATE is a life simulator. Here you create the person you’ll play.';
}, active);

// ---- Identity, in the decided order.
await fixSteps('Identity');
await page.evaluate((languagesHtml) => {
  const card = document.querySelector('.creation > .card');
  const kids = () => [...card.children];
  // Billed As goes.
  [...card.querySelectorAll('.identity-fields .field-row')].find((r) => /Billed As/.test(r.textContent)).remove();
  // The age line moves under the birth date.
  const birth = kids().find((k) => k.querySelector && k.querySelector('#birth-year'));
  const age = kids().find((k) => k.classList.contains('callout') && /when you start/.test(k.textContent));
  birth.after(age);
  // Race or Ethnicity moves to the end, after Languages.
  const race = kids().find((k) => k.querySelector && k.querySelector('[aria-label="Race Or Ethnicity"]'));
  const hrBefore = race.previousElementSibling; if (hrBefore && hrBefore.tagName === 'HR') hrBefore.remove();
  race.remove();
  // Languages comes in after Citizenship.
  const cit = kids().find((k) => k.querySelector && k.querySelector('#citizenship'));
  const hr1 = document.createElement('hr'); hr1.className = 'divider';
  const lang = document.createElement('div'); lang.innerHTML = languagesHtml;
  const h2 = lang.querySelector('h2'); if (h2) { const h3 = document.createElement('h3'); h3.textContent = 'Languages'; h2.replaceWith(h3); }
  const hr2 = document.createElement('hr'); hr2.className = 'divider';
  cit.after(hr1, lang, hr2, race);
  // The step's needs list loses the Billed As line.
  for (const li of document.querySelectorAll('.callout-warning li')) if (/billed/.test(li.textContent)) li.remove();
  const warn = document.querySelector('.callout-warning'); if (warn && !warn.querySelector('li')) warn.remove();
}, languagesHtml);
await page.evaluate(() => { for (const p of document.querySelectorAll('.creation .panel-head p')) if (/before Yale/.test(p.textContent)) p.textContent = 'Where you were born, which isn’t always where you live now. It’s what you tell people when they ask. It doesn’t decide your citizenship: you say that yourself.'; });
console.log('strip', await page.evaluate(() => [...document.querySelectorAll('.creation-step')].map((s) => s.textContent.trim() + ':' + (s.getAttribute('data-state') || '-')).join(' | ')));
await wait(300); await shot('02-identity-new');

// ---- Background, three cards.
await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(900);
await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(900);
await fixSteps('Background');
await page.evaluate(() => {
  const col = document.querySelector('.creation .col.gap-5');
  const cards = [...col.querySelectorAll(':scope > .card')];
  const byH2 = (t) => cards.find((c) => c.querySelector('h2')?.textContent === t);
  byH2('Genres')?.remove(); byH2('Background')?.remove(); byH2('Languages')?.remove();
  const fam = byH2('Your Family');
  fam.querySelector('h2').textContent = 'The Family You Were Born Into';
  fam.querySelector('.panel-head p').textContent = 'The family you come from decides the money in your name on the first morning.';
  const ps = fam.querySelectorAll('.callout p'); if (ps[1]) ps[1].remove();
  // What your family did.
  const did = fam.cloneNode(true);
  did.querySelector('h2').textContent = 'What Your Family Did';
  did.querySelector('.panel-head p').textContent = 'The work your family lived by.';
  did.querySelector('label').textContent = 'Their Work'; did.querySelector('label').htmlFor = 'family-did';
  const sel = did.querySelector('select'); sel.id = 'family-did'; sel.innerHTML = '';
  for (const o of ['Choose', 'Farming or fishing', 'A trade', 'A shop or a restaurant', 'An office', 'Teaching', 'Medicine or nursing', 'The law', 'The arts', 'Public service', 'The military', 'Nothing steady']) { const e = document.createElement('option'); e.textContent = o; sel.appendChild(e); }
  did.querySelector('.callout')?.remove();
  // Where you grew up.
  const grew = fam.cloneNode(true);
  grew.querySelector('h2').textContent = 'Where You Grew Up';
  grew.querySelector('.panel-head p').textContent = 'Where you spent the years that gave you your accent, if that isn’t where you were born.';
  grew.querySelector('.field').remove(); grew.querySelector('.callout')?.remove();
  const row = document.createElement('div'); row.className = 'row gap-2';
  const b1 = document.createElement('button'); b1.className = 'btn btn-primary'; b1.textContent = 'Same As Where You Were Born: New York';
  const b2 = document.createElement('button'); b2.className = 'btn'; b2.textContent = 'Somewhere Else';
  row.append(b1, b2); grew.append(row);
  col.append(did, grew);
});
console.log('strip', await page.evaluate(() => [...document.querySelectorAll('.creation-step')].map((s) => s.textContent.trim() + ':' + (s.getAttribute('data-state') || '-')).join(' | ')));
await wait(300); await shot('03-background-new');

// ---- The slots screen with a life in it, the title line redefined.
await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(900);
await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(900);
await page.getByRole('button', { name: /^Begin$/ }).click();
await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(3000);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: /^Continue$/ }).first().waitFor({ timeout: 30000 }); await wait(600);
await page.evaluate(() => { const t = document.querySelector('.slot .muted.small'); if (t) t.textContent = '24 · New York'; for (const st of document.querySelectorAll('.slot .stat')) if (/Location/.test(st.textContent)) st.querySelector('.small').textContent = 'New York'; });
await shot('01-slots-new');
await browser.close();
