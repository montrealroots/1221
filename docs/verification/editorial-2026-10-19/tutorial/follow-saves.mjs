/**
 * The guide's routes a new life can't reach in its first days, followed on the scenario saves (brief 15, the tutorial
 * area): `follow.mjs` reads every chapter and follows what a new life can do; this opens a save that has got further,
 * presses what the chapter names, where it names it, and logs what came of it.
 *
 *   SLATE_BASE=http://localhost:4282 node docs/verification/editorial-2026-10-19/tutorial/follow-saves.mjs OUT SAVEDIR
 *
 * The saves are `tools/scenario-saves.mjs`'s, written by today's game code. Each is opened in its own page, as slot 1,
 * with Continue, and changed only in that page's browser store.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const [OUT = 'follow-saves-out', DIR = '.'] = process.argv.slice(2);
const BASE = process.env.SLATE_BASE ?? 'http://localhost:4282';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const lines = [];
const results = [];
const problems = [];
let chapter = '-';
let page;
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const log = (msg) => { const l = `[${chapter}] ${msg}`; lines.push(l); console.log(l); };
const check = (what, ok, seen = '') => { results.push({ chapter, what, ok: Boolean(ok), seen: clean(seen).slice(0, 400) }); log(`${ok ? 'ok  ' : 'FAIL'} ${what}${seen ? ` — ${clean(seen).slice(0, 300)}` : ''}`); return Boolean(ok); };
const wait = (ms) => page.waitForTimeout(ms);
const button = (name, scope = page) => scope.getByRole('button', { name, exact: typeof name === 'string' }).first();
const press = async (name, scope = page) => { const b = button(name, scope); if (!(await b.count())) { log(`no button ${name}`); return false; } try { await b.click({ timeout: 5000 }); await wait(600); return true; } catch (e) { log(`couldn’t press ${name}: ${String(e).slice(0, 120)}`); return false; } };
const main = async () => clean(await page.locator('main').innerText().catch(() => ''));
const toast = async () => clean(await page.locator('.toast').last().innerText().catch(() => ''));
const dialog = () => page.locator('[role=dialog]').last();
let shots = 0;
const shot = async (name) => { shots += 1; const f = `${String(shots).padStart(2, '0')}-${name}.png`; await page.screenshot({ path: join(OUT, f) }); log(`screenshot ${f}`); };
const panel = (title) => page.locator('section.card', { has: page.getByRole('heading', { name: title, exact: true }) }).first();
async function rail(name) { const b = page.locator('#rail').getByRole('button', { name: new RegExp(`^${name}`) }).first(); await b.click().catch(() => {}); await wait(1100); }
async function tab(name) { const t = page.getByRole('tab', { name: new RegExp(`^${name}`) }).first(); if (!(await t.count())) return false; await t.click().catch(() => {}); await wait(900); return true; }
async function closeDialogs() { for (let i = 0; i < 4 && (await page.locator('[role=dialog]').count()); i++) { await page.keyboard.press('Escape'); await wait(400); } }

async function open(save) {
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => problems.push(`${save}: page error: ${String(e).slice(0, 200)}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(join(DIR, save), 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(4000);
  await closeDialogs();
  const head = clean(await page.locator('header').first().innerText().catch(() => ''));
  log(`opened ${save}: ${(head.match(/\d+:\d\d [AP]M · [A-Z][a-z]+ \d+, \d{4}/) ?? [head.slice(0, 60)])[0]}`);
}

// ---------------------------------------------------------------------------------------------------------------------
// Drama School and You As An Actor, on a life two weeks into its first term (brief.json, Saturday, September 12, 2026).
// ---------------------------------------------------------------------------------------------------------------------
chapter = 'school';
await open('brief.json');
await rail('School');
await tab('Classes');
log(`Call In Sick at 4 PM on a Saturday, the shift done: ${await button('Call In Sick').count() ? 'offered' : 'not offered'}`);
await tab('Coursework');
{
  const text = await main();
  check('Coursework shows each piece with Shown Today: what it would come to if shown today, and what’s still to finish', /Shown Today: if you showed it today/.test(text) && /Still to finish/.test(text), text.slice(0, 200));
  check('a scene has its Table Work, its parts, and How You’ll Play It', /TABLE WORK/i.test(text) && /HOW YOU’LL PLAY IT/i.test(text), '');
  check('a scene with a partner has Rehearsing With them: a day, a time and Ask with their name', /REHEARSING WITH/i.test(text) && (await page.locator('main button', { hasText: /^Ask [A-Z][a-z]+$/ }).count()) > 0, '');
  check('and Run It With A Reader', await page.locator('main button', { hasText: /^Run It With A Reader$/ }).count() > 0);
  // A step, pressed: it prepares a part, and Shown Today moves.
  const card = page.locator('main').getByText('Acting I: Scene Study', { exact: true }).first();
  const part = (t) => (t.match(/Acting I: Scene Study[\s\S]*?KNOWS THE SCENE (\d+)%/i) ?? [])[1];
  const before = part(text);
  const step = page.locator('main button', { hasText: /^Read The Scene$/ }).first();
  if (await card.count() && await step.count()) {
    await step.click().catch(() => {}); await wait(1500);
    const t = await toast();
    const after = part(await main());
    check('a step, Read The Scene, prepares its part of the piece, one step at a time', Boolean(t) && Number(after) > Number(before), `${t} · Knows The Scene ${before}% → ${after}%`);
  } else check('Acting I has Read The Scene', false);
  // Ask a partner, at a day and a time two hours ahead or more.
  const ask = page.locator('main button', { hasText: /^Ask [A-Z][a-z]+$/ }).first();
  if (await ask.count()) {
    const name = clean(await ask.innerText());
    await ask.click().catch(() => {}); await wait(1500);
    const t = await toast();
    check(`${name} asks for the evening chosen, and the answer comes back`, t.length > 0, t);
    await shot('asked-a-partner');
  }
  // Work It Through: a problem, pressed.
  const problem = page.locator('main button', { hasText: /Isn’t Secure$|Holds It Back$|Not There Yet$/ }).first();
  if (await problem.count()) {
    const name = clean(await problem.innerText());
    await problem.click().catch(() => {}); await wait(900);
    const shown = clean(await page.locator('body').innerText());
    check(`Work It Through names a problem (${name}); pressed, it offers ways at it with the figure before and after`, /before|after|→/i.test(shown), shown.slice(shown.indexOf(name), shown.indexOf(name) + 300));
    await shot('work-it-through');
    await closeDialogs();
  } else check('a scene shows its Work It Through problems', false);
  // Plays To Read: Read It, then Research It.
  const read = page.locator('main button', { hasText: /^Read It$/ }).first();
  if (await read.count() && !(await read.isDisabled())) {
    await read.click(); await wait(1500);
    const t = await toast();
    check('Plays To Read: Read It reads the library’s copy', t.length > 0, t);
    check('and once it’s read, Research It is offered', await page.locator('main button', { hasText: /^Research It$/ }).count() > 0);
  } else check('Plays To Read offers Read It', false, (await main()).slice((await main()).indexOf('Plays To Read'), (await main()).indexOf('Plays To Read') + 200));
}
await tab('Shifts And Pay');
{
  const text = await main();
  check('Shifts And Pay says the Saturday hours and the elective evenings, paid on Fridays', /Saturday/i.test(text) && /Friday/i.test(text), text.slice(0, 300));
}
await tab('Casting');
log(`Casting in the first fall: ${(await main()).slice(0, 300)}`);
// To Monday morning: the clock stops at nine at the day's classes. Stand Here, and Call In Sick is on Classes, grayed for
// someone well, with the reason under it.
{
  const bar = page.locator('.topbar-time').first();
  await bar.getByRole('button', { name: /^Advance/ }).first().click().catch(() => {}); await wait(500);
  await page.getByRole('menuitem', { name: /^Next Monday/ }).first().click().catch(() => {}); await wait(1200);
  for (let k = 0; k < 8 && (await page.locator('[role=dialog]').count()); k++) {
    const d = clean(await dialog().innerText());
    if (/On The Way/i.test(d)) { await press('Advance', dialog()); await wait(1200); continue; }
    if (/^Classes\b/.test(d) && await button('Stand Here', dialog()).count()) { log(`the clock stopped: ${d.slice(0, 120)}`); await press('Stand Here', dialog()); break; }
    if (await button('Go', dialog()).count()) { await press('Go', dialog()); await wait(1200); continue; }
    break;
  }
  await closeDialogs();
  await rail('School');
  await tab('Classes');
  const sick = button('Call In Sick');
  const why = clean((await page.locator('main .why-not').allInnerTexts().catch(() => [])).join(' '));
  if (!(await sick.count())) log(`Classes at the stop: ${(await main()).slice(0, 600)}`);
  const head = clean(await page.locator('header').first().innerText().catch(() => ''));
  const at = (head.match(/\d+:\d\d [AP]M · [A-Z][a-z]+ \d+, \d{4}/) ?? [''])[0];
  check('on a class day, when the clock stops at nine for the classes, Call In Sick is on Classes', await sick.count() > 0, at);
  if (await sick.count() && await sick.isDisabled()) check('for someone well, it’s grayed and says why', /well enough to go/.test(why), why);
  else if (await sick.count()) {
    await sick.click(); await wait(900);
    const t = await toast();
    check('for someone unwell (the flu, an injury that limits the work, or condition under 55), it excuses the day', /You called in sick\. Today’s absence is excused\./.test(t), t);
  }
  await shot('call-in-sick');
}

chapter = 'profile';
await rail('Player Profile');
{
  const text = await main();
  check('What To Work On Next is on the Player Profile once there’s work to forecast', /What To Work On Next/i.test(text), text.slice(text.indexOf('What To Work On'), text.indexOf('What To Work On') + 300));
  check('Your Work So Far looks across your pieces', /Your Work So Far/.test(text), '');
  const brief = page.locator('main button', { hasText: /^Open Its Brief$/ }).first();
  if (await brief.count()) {
    await brief.click(); await wait(1200);
    const pane = clean(await page.locator('body').innerText());
    for (const l of ['Break It Down', 'Learn The Lines', 'Rehearse It On Your Feet', 'Read It This Way', 'Read With', 'Tape It', 'The Genre Asks']) check(`the brief shows ${l}`, pane.includes(l));
    await shot('a-brief-in-progress');
    await closeDialogs();
  }
}
await page.close();

// ---------------------------------------------------------------------------------------------------------------------
// Drama School, a production in rehearsal (rehearsal.json, April 24, 2027).
// ---------------------------------------------------------------------------------------------------------------------
chapter = 'school';
await open('rehearsal.json');
await rail('School');
await tab('Casting');
{
  const text = await main();
  check('Casting shows your part and Why This Cast', /Why This Cast/.test(text), text.slice(0, 200));
  check('Learn The Part, Catch Up The Blocking and Work On The Note work on the part', ['Learn The Part', 'Catch Up The Blocking', 'Work On The Note'].every((l) => text.includes(l)));
  check('A Night Now and The Evening’s Workload say the night before the curtain', /A NIGHT NOW/i.test(text) && /The Evening’s Workload\./.test(text));
  const learn = page.locator('main button', { hasText: /^Learn The Part$/ }).first();
  if (await learn.count() && !(await learn.isDisabled())) { await learn.click(); await wait(1500); check('Learn The Part works on the part between calls', (await toast()).length > 0, await toast()); }
  else log(`Learn The Part: ${await learn.count() ? 'grayed' : 'absent'}: ${clean(await page.locator('main').getByText(/Learn The Part:/).first().innerText().catch(() => ''))}`);
  check('Join The Summer Company is offered in the spring of the first year', /Join The Summer Company/.test(text));
  await shot('casting-a-production');
}
await page.close();

// ---------------------------------------------------------------------------------------------------------------------
// What Needs You, a question; Cover, Benefits And Returns, a return to file (decision.json, February 12, 2027).
// ---------------------------------------------------------------------------------------------------------------------
chapter = 'needs';
await open('decision.json');
{
  const p = panel('What Needs You');
  const text = clean(await p.innerText().catch(() => ''));
  const dismiss = p.getByRole('button', { name: /^Dismiss/ }).first();
  check('a question in What Needs You has its answers on buttons, and Dismiss', await dismiss.count() > 0, text.slice(0, 300));
  if (await dismiss.count()) {
    const q = clean(await p.locator('.decision').first().innerText().catch(() => ''));
    await dismiss.click(); await wait(900);
    const after = clean(await p.innerText().catch(() => ''));
    check('Dismiss takes the question off the list', !after.includes(q.slice(0, 40)), `${q.slice(0, 80)} → ${after.slice(0, 160)}`);
  }
}
chapter = 'papers';
await rail('Papers');
await tab('Tax Returns');
{
  const text = await main();
  check('what the question was about still stands: the return is on Tax Returns, with File It', /File It/.test(text) || await button('File It').count() > 0, text.slice(0, 300));
  await shot('a-return-to-file');
}
await page.close();

// ---------------------------------------------------------------------------------------------------------------------
// Cover, Benefits And Returns, a long-term condition: no scenario save has one, so new lives are begun until one does
// (a new life's conditions are drawn at its start), the guide read through, and Your Long-Term Conditions followed (Your Conditions on a build without the papers area's rename).
// ---------------------------------------------------------------------------------------------------------------------
chapter = 'papers';
for (let attempt = 1; attempt <= 6; attempt++) {
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => problems.push(`new life ${attempt}: page error: ${String(e).slice(0, 200)}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^New Save$/ }).first().click(); await wait(1000);
  const billed = page.getByRole('group', { name: 'Billed As' });
  if (await billed.count()) await billed.getByRole('button', { name: 'Actress' }).click();
  await page.locator('#born-search').fill('New York'); await wait(800);
  await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
  for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: /^Continue$/ }).click(); await wait(900); }
  await page.getByRole('button', { name: /^Begin$/ }).click();
  await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
  for (let i = 0; i < 17; i++) {
    await page.locator('[role=dialog] button', { hasText: /^I’ve Read It$/ }).first().click().catch(() => {}); await wait(350);
    if (i < 16) { await page.locator('[role=dialog] button', { hasText: /^Next: / }).first().click().catch(() => {}); await wait(250); }
  }
  await closeDialogs();
  await rail('Papers');
  await tab('Health Cover');
  const health = await main();
  const letGo = button('Let It Go');
  if (!(await letGo.count())) { log(`new life ${attempt}: no long-term condition (${health.slice(health.search(/Your (Long-Term )?Conditions/), health.search(/Your (Long-Term )?Conditions/) + 60)})`); await page.close(); continue; }
  const which = health.slice(health.search(/Your (Long-Term )?Conditions/) + 15, health.search(/Your (Long-Term )?Conditions/) + 120);
  log(`new life ${attempt}: ${which}`);
  if (/Therapist/.test(health)) {
    const begin = button('Begin A Course Of 8 Sessions');
    check('depression: choose a Therapist where you live and press Begin A Course Of 8 Sessions', await begin.count() > 0);
    if (await begin.count() && !(await begin.isDisabled())) { await begin.click(); await wait(1000); check('and the first session is booked', /^Your first session is /.test(await toast()), await toast()); }
  }
  await letGo.click(); await wait(1000);
  check('Let It Go stops the care, and Keep It Up is offered to start it again', await button('Keep It Up').count() > 0, clean((await main()).slice((await main()).search(/Your (Long-Term )?Conditions/), (await main()).search(/Your (Long-Term )?Conditions/) + 160)));
  await press('Keep It Up'); await wait(800);
  check('Keep It Up starts it again', await button('Let It Go').count() > 0);
  await shot('your-conditions');
  await page.close();
  break;
}

writeFileSync(join(OUT, 'log.txt'), `${lines.join('\n')}\n`);
writeFileSync(join(OUT, 'results.json'), `${JSON.stringify({ base: BASE, problems, results }, null, 1)}\n`);
const failed = results.filter((r) => !r.ok);
console.log(`${results.length} checks, ${failed.length} failed; page errors: ${problems.length}`);
await browser.close();
process.exit(failed.length ? 1 : 0);
