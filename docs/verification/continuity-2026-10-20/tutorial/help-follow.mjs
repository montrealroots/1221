/**
 * Brief 17, section 9, the tutorial area (2026-10-20): what `follow.mjs` (brief 15's guide follow) doesn't press, followed
 * on the built app. "Links and back navigation work; reading help doesn't advance the clock; optional detail stays
 * reachable", and a blocked action says why and what to do.
 *
 *   SLATE_BASE=http://localhost:4301 npx vite-node docs/verification/continuity-2026-10-20/tutorial/help-follow.mjs -- OUT WIDTH SAVEDIR
 *
 * A new guided life: a locked control pressed, the guide's callout for a chapter that has to wait, an entry that isn't
 * open yet and its Read About It, the clock on Play while the help and the guide are open (each a minute of real time)
 * and while the Sleep dialog is, which the help says doesn't hold it. Then a scenario save with everything open
 * (`SAVEDIR/brief.json`, the coordinator's, written on brief 16's code): every How This Works entry found by its title,
 * opened, its Show Me Where pressed and the screen and tab it lands on compared with the entry's `where`, then Back To
 * Help and Back To the screen left; an entry's links, the trail, Back and Show Everything; the keys and the breadcrumb a
 * worked example names. It writes `log.txt` and `results.json` to OUT, and no screenshot.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS } from '../../../../src/engine/content/tutorial.ts';
import { GUIDE } from '../../../../src/engine/content/guide/index.ts';
import { SECTIONS } from '../../../../src/ui/shell/sections.ts';

const { chromium } = await import('playwright');
const argv = process.argv.slice(2).filter((a) => a !== '--');
const OUT = argv[0] ?? 'help-follow-out';
const W = Number(argv[1] ?? 1440);
const SAVES = argv[2];
const H = W < 600 ? 844 : 900;
const BASE = process.env.SLATE_BASE ?? 'http://localhost:4301';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
let page;
const problems = [];
const lines = [];
const results = [];
let part = '-';
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const norm = (s) => clean(s).replace(/[‘’]/g, '’');
const log = (m) => { const l = `[${part}] ${m}`; lines.push(l); console.log(l); };
const check = (what, ok, seen = '') => { results.push({ part, what, ok: Boolean(ok), seen: clean(seen).slice(0, 400) }); log(`${ok ? 'ok  ' : 'FAIL'} ${what}${seen ? ` — ${clean(seen).slice(0, 300)}` : ''}`); return Boolean(ok); };
const wait = (ms) => page.waitForTimeout(ms);
const dialog = () => page.locator('[role=dialog]').last();
const dialogOpen = async () => (await page.locator('[role=dialog]').count()) > 0;
const button = (name, scope = page) => scope.getByRole('button', { name, exact: typeof name === 'string' }).first();
const press = async (name, scope = page) => { const b = button(name, scope); if (!(await b.count())) { log(`no button ${name}`); return false; } try { await b.click({ timeout: 5000 }); await wait(500); return true; } catch (e) { log(`couldn’t press ${name}: ${String(e).slice(0, 120)}`); return false; } };
const hm = async () => (clean(await page.locator('header').first().innerText().catch(() => '')).match(/\d+:\d\d [AP]M/) ?? [''])[0];
const minutes = (t) => { const m = t.match(/(\d+):(\d\d) ([AP])M/); return m ? ((+m[1] % 12) + (m[3] === 'P' ? 12 : 0)) * 60 + +m[2] : NaN; };
const bar = () => page.locator('.topbar-time').first();
async function closeDialogs() { for (let i = 0; i < 5 && await dialogOpen(); i++) { await page.keyboard.press('Escape'); await wait(400); } }
const hashNow = () => page.evaluate(() => window.location.hash);

// ---------------------------------------------------------------------------------------------------------------------
// A new guided life
// ---------------------------------------------------------------------------------------------------------------------
part = 'new life';
page = await browser.newPage({ viewport: { width: W, height: H } });
page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^New Save$/ }).first().click(); await wait(1000);
const billed = page.getByRole('group', { name: 'Billed As' });
if (await billed.count()) await billed.getByRole('button', { name: 'Actress' }).click();
await page.locator('#born-search').fill('New York'); await wait(800);
await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: /^Continue$/ }).click(); await wait(900); }
await page.getByRole('button', { name: /^Begin$/ }).click();
await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
check('a new life opens on the guide, at its first chapter', await dialogOpen() && norm(await dialog().innerText()).includes(CHAPTERS[0].title));

// Home's locked panels, the guide closed: each says what it shows and the chapter that opens it (added on 2026-10-20 for
// the frame editor's finding, after the before run: until then each said its chapter's lead after the chapter's title,
// and Where You Are's was chapter 1's, “How SLATE works, and how to read Home”).
await closeDialogs();
const PANELS = { Calendar: 'ui.calendar', 'What Needs You': 'ui.needs', 'How You Are': 'ui.how', 'Where You Are': 'ui.where', Weather: 'ui.weather', Money: 'ui.money', School: 'ui.school', Papers: 'ui.papers' };
for (const [title, f] of Object.entries(PANELS)) {
  const c = CHAPTERS.find((x) => x.opens.includes(f));
  const t = norm(await page.locator(`section[aria-label="${title}, Locked"]`).first().innerText().catch(() => ''));
  const said = t.slice(t.search(/Locked/i) + 'Locked'.length, t.indexOf(' It opens when you read')).trim();
  check(`${title}, locked, says what it shows, then that “${c.title}” opens it, with Read About It`, said.length > 10 && t.includes(`It opens when you read “${c.title}” in the guide.`) && /Read About It/i.test(t) && !/how SLATE works/i.test(t), t);
}
await press('Read', page.locator('.guide-strip'));
check('Read on the strip opens the guide at its first chapter again', await dialogOpen() && norm(await dialog().innerText()).includes(CHAPTERS[0].title));

/** Read the next chapter: I’ve Read It, then Next. */
async function readOn(n) {
  for (let i = 0; i < n; i++) {
    const d = dialog();
    const read = d.getByRole('button', { name: /^I’ve Read It$/ }).first();
    if (!(await read.count())) { log('no I’ve Read It'); return; }
    await read.click(); await wait(600);
    const next = d.getByRole('button', { name: /^Next: / }).first();
    if (await next.count()) { await next.click(); await wait(500); }
  }
}
await readOn(3); // Your Life, What’s Coming, The Clock
const nowAt = clean(await dialog().innerText().catch(() => ''));
check('after three chapters the guide is at “Moving Time On”', nowAt.includes('Moving Time On'), nowAt.slice(0, 120));
await press('Later', dialog());
check('Later closes the guide', !(await dialogOpen()));
const strip = clean(await page.locator('.guide-strip').innerText().catch(() => ''));
check('the strip under the top bar names the next chapter, with Read', /Guide · 4 Of 17/i.test(strip) && strip.includes('Moving Time On') && await button('Read', page.locator('.guide-strip')).count() > 0, strip);

// A locked control whose chapter has to wait for another.
const lookAfter = bar().getByRole('button', { name: /^Look After Yourself/ }).first();
check('Look After Yourself, before its chapter, says Locked', /Locked/i.test(clean(await lookAfter.innerText().catch(() => ''))), clean(await lookAfter.innerText().catch(() => '')));
await lookAfter.click().catch(() => {}); await wait(700);
const waitText = norm(await dialog().innerText().catch(() => ''));
check('pressed, it opens the guide at its chapter, saying which chapter comes first', waitText.includes('Looking After Yourself') && waitText.includes('This chapter opens what you pressed. The chapters open in order, so read “Moving Time On” first.') && await button('Next Unread: Moving Time On', dialog()).count() > 0, waitText.slice(0, 260));
check('a chapter read ahead has no I’ve Read It', !(await button('I’ve Read It', dialog()).count()));
await press('Next Unread: Moving Time On', dialog());
check('Next Unread goes to the chapter that comes first, with I’ve Read It', norm(await dialog().innerText()).includes('Moving Time On') && await button('I’ve Read It', dialog()).count() > 0);
await closeDialogs();

// An entry not open yet, in How This Works.
await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
await page.keyboard.press('/'); await wait(600);
await page.locator('#help-q').fill('Sleep'); await page.keyboard.press('Enter'); await wait(500);
const sleepLink = dialog().locator('button.help-link', { hasText: /^Sleep$/ }).first();
check('search finds the Sleep entry, marked Locked on a life that hasn’t read its chapter', await sleepLink.count() > 0 && /Locked/i.test(clean(await dialog().locator('.help-results li').filter({ has: page.locator('button.help-link', { hasText: /^Sleep$/ }) }).first().innerText().catch(() => ''))));
await sleepLink.click().catch(() => {}); await wait(500);
const entryText = norm(await dialog().innerText().catch(() => ''));
check('the entry says it isn’t open yet, and which chapter opens it', entryText.includes('This isn’t open yet. Read “Sleep” in the guide to open it.'), entryText.slice(0, 260));
check('its summary, Where To Find It and Show Me Where are there to read before it opens', /Where To Find It/i.test(entryText) && await button('Show Me Where', dialog()).count() > 0);
await press('Read About It', dialog());
const ga = norm(await dialog().innerText().catch(() => ''));
check('Read About It opens the guide at that chapter', /Chapter 7 Of 17/i.test(ga) && ga.includes('Sleep'), ga.slice(ga.search(/Chapter \d+ Of/i), ga.search(/Chapter \d+ Of/i) + 160));
await closeDialogs();

// The clock while help and the guide are open: a minute of real time each, on Play.
const play = bar().getByRole('button', { name: /^Play$/ }).first();
check('Play is open after “The Clock”', await play.count() > 0);
await play.click(); await wait(800);
check('Play runs the clock: the button says Pause', await button('Pause', bar()).count() > 0);
await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
let t0 = await hm();
await page.keyboard.press('?'); await wait(500);
check('? opens How This Works over the running clock, which says the clock waits', norm(await dialog().innerText().catch(() => '')).includes('The clock waits while you read.'));
await wait(65_000);
let t1 = await hm();
check('with How This Works open for 65 seconds, the clock doesn’t move', minutes(t1) - minutes(t0) <= 0, `${t0} → ${t1}`);
await press('Close', dialog());
await wait(63_000);
let t2 = await hm();
check('closed, the clock runs on: a minute later it has moved', minutes(t2) > minutes(t1), `${t1} → ${t2}`);
await page.getByRole('button', { name: /^Guide/ }).first().click(); await wait(500);
t0 = await hm();
await wait(65_000);
t1 = await hm();
check('with the guide open for 65 seconds, the clock doesn’t move', minutes(t1) - minutes(t0) <= 0 && await dialogOpen(), `${t0} → ${t1}`);
await closeDialogs();
await wait(1000);
// Read on to Sleep, so the Sleep dialog opens: the help says it doesn’t hold the clock.
if (await button('Pause', bar()).count()) await press('Pause', bar());
await page.getByRole('button', { name: /^Guide/ }).first().click(); await wait(500);
await readOn(3); // Moving Time On, What Needs You, How You Are
const sleepNext = norm(await dialog().innerText().catch(() => ''));
if (/Chapter 7 Of 17/i.test(sleepNext)) await readOn(1);
await closeDialogs();
// How You Are's entry, its panel open from “How You Are” and its own page from “A Whole Life” (added 2026-10-20, after
// the before run: the before build said the whole entry wasn't open).
await page.getByRole('button', { name: 'How This Works: How You Are' }).first().click().catch(() => {}); await wait(600);
const partly = norm(await dialog().innerText().catch(() => ''));
check('How This Works on How You Are, its panel open, says only the rest waits on “A Whole Life”', partly.includes('Part of this isn’t open yet. Read “A Whole Life” in the guide to open the rest.') && !partly.includes('This isn’t open yet.'), partly.slice(partly.search(/open yet/) - 40, partly.search(/open yet/) + 120));
await closeDialogs();
await press(/^Play$/, bar());
await press(/^Sleep/, bar());
const sleepDialog = norm(await dialog().innerText().catch(() => ''));
t0 = await hm();
await wait(63_000);
t1 = await hm();
check('the Sleep dialog doesn’t hold the clock, as The Clock’s entry says: a minute later it has moved', /You’d Wake At/i.test(sleepDialog) && minutes(t1) > minutes(t0), `${t0} → ${t1}`);
await press('Not Yet', dialog());
if (await button('Pause', bar()).count()) await press('Pause', bar());
await closeDialogs();
await page.close();

// ---------------------------------------------------------------------------------------------------------------------
// A save with everything open: every entry’s Show Me Where, and the way back
// ---------------------------------------------------------------------------------------------------------------------
async function openSave(file) {
  page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => problems.push(`${file}: page error: ${String(e).slice(0, 200)}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const text = readFileSync(join(SAVES, file), 'utf8');
  await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
  await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
  await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3500);
  await closeDialogs();
  if (await button('Pause', bar()).count()) await press('Pause', bar());
}
const sectionLabel = (route, tab) => SECTIONS[route]?.find((s) => s.id === tab)?.label;
const routeOfHash = (h) => (h.startsWith('#/') ? h.slice(1).split('?')[0] : '/home');

if (SAVES) {
  part = 'show me where';
  await openSave('brief.json');
  const clock0 = await hm();
  const day0 = clean(await page.locator('header').first().innerText().catch(() => ''));
  let landed = 0;
  for (const e of GUIDE) {
    await closeDialogs();
    // Start each from Home, so a way back to another screen is offered where the entry's screen isn't Home.
    if (routeOfHash(await hashNow()) !== '/home') { await page.keyboard.press('h'); await wait(700); }
    await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
    await page.keyboard.press('/'); await wait(400);
    await page.locator('#help-q').fill(e.title); await page.keyboard.press('Enter'); await wait(400);
    const link = dialog().locator('.help-results button.help-link').filter({ hasText: new RegExp(`^${e.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first();
    if (!(await link.count())) { check(`“${e.title}” is found by its own title`, false); continue; }
    await link.click(); await wait(400);
    const head = clean(await dialog().locator('.help-entry h3').first().innerText().catch(() => ''));
    if (!check(`“${e.title}” opens from the search`, head === e.title, head)) continue;
    await press('Show Me Where', dialog()); await wait(700);
    const hash = await hashNow();
    const route = routeOfHash(hash);
    const want = sectionLabel(e.where.route, e.where.tab);
    const tab = want ? clean(await page.locator('main [role=tab][aria-selected=true]').first().innerText().catch(() => '')) : '';
    const ok = route === e.where.route && (!want || tab.startsWith(want));
    if (ok) landed += 1;
    check(`Show Me Where for “${e.title}” lands on ${e.where.route}${want ? `, ${want}` : ''}`, ok, `${hash} ${tab}`);
    const back = page.locator('.help-return');
    const backTo = clean(await back.innerText().catch(() => ''));
    if (e.where.route !== '/home') check(`and offers Back To Help and Back To Home`, /Back To Help/.test(backTo) && /Back To Home/.test(backTo), backTo);
    else check('and offers Back To Help', /Back To Help/.test(backTo), backTo);
    await press('Back To Help', back);
    const again = clean(await dialog().locator('.help-entry h3').first().innerText().catch(() => ''));
    check('Back To Help reopens the entry', again === e.title, again);
    await closeDialogs();
    if (e.where.route !== '/home' && await button('Back To Home').count()) {
      await press('Back To Home'); await wait(600);
      check('Back To Home returns to Home', routeOfHash(await hashNow()) === '/home', await hashNow());
    }
  }
  log(`${landed} of ${GUIDE.length} entries’ Show Me Where landed on their screen and tab`);
  const clock1 = await hm();
  check('reading 70 entries and following each Show Me Where moved no clock', clock0 === clock1 && day0.slice(0, 40) === clean(await page.locator('header').first().innerText().catch(() => '')).slice(0, 40), `${clock0} → ${clock1}`);

  part = 'links and back';
  await closeDialogs();
  await page.keyboard.press('h'); await wait(600);
  await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
  await page.keyboard.press('/'); await wait(400);
  await page.locator('#help-q').fill('Feedback And Your Notes'); await page.keyboard.press('Enter'); await wait(400);
  await dialog().locator('.help-results button.help-link', { hasText: /^Feedback And Your Notes$/ }).first().click(); await wait(400);
  const shut = await dialog().locator('details.help-section').count();
  const openNow = await dialog().locator('details.help-section[open]').count();
  check('an entry opens with What To Press showing and its other sections shut', openNow === 1 && shut > 1, `${openNow} of ${shut} open`);
  await press('Show Everything', dialog());
  check('Show Everything opens every section, and says Show Less', await dialog().locator('details.help-section[open]').count() === shut && await button('Show Less', dialog()).count() > 0);
  await press('Show Less', dialog());
  check('Show Less shuts them again, What To Press still open', await dialog().locator('details.help-section[open]').count() === 1);
  const summaries = dialog().locator('details.help-section > summary');
  const nth = await summaries.count();
  await summaries.nth(nth - 1).click(); await wait(300);
  check('a shut section opens on its own when pressed: A Worked Example', /What comes of it\./.test(clean(await dialog().locator('details.help-section[open]').last().innerText().catch(() => ''))));
  await summaries.filter({ hasText: 'How It Connects' }).first().click(); await wait(300);
  const linkTo = dialog().locator('details.help-section[open] button.help-link').first();
  const linkName = clean(await linkTo.innerText().catch(() => ''));
  await linkTo.click().catch(() => {}); await wait(400);
  const now = clean(await dialog().locator('.help-entry h3').first().innerText().catch(() => ''));
  const trail = clean(await dialog().locator('nav.help-trail').innerText().catch(() => ''));
  check('a link under How It Connects opens that entry, with the trail behind it', now === linkName && trail.includes('Feedback And Your Notes') && trail.includes(linkName), `${linkName}; trail: ${trail}`);
  await press('Back', dialog());
  check('Back returns to the entry it came from', clean(await dialog().locator('.help-entry h3').first().innerText().catch(() => '')) === 'Feedback And Your Notes');
  await dialog().locator('nav.help-trail button', { hasText: 'Contents' }).first().click().catch(() => {}); await wait(400);
  check('the trail’s Contents goes back to the contents', /Getting Started/.test(clean(await dialog().innerText().catch(() => ''))) && /On This Screen|Your Day And The Clock/.test(clean(await dialog().innerText().catch(() => ''))));
  await closeDialogs();

  part = 'keys and breadcrumbs';
  // Finding Your Way's worked example, followed as the entry says it (from the after run, 2026-10-20: the before run
  // followed the example's old steps, H and then a School breadcrumb, and failed). Both ways are tried, and the example
  // is checked to name the one that works.
  const ex = GUIDE.find((e) => e.id === 'start.find').example;
  log(`Finding Your Way’s example: ${ex.setup} ${ex.steps.join(' ')}`);
  const crumbBar = () => page.locator('nav.breadcrumbs[aria-label=Breadcrumb]');
  const tabShown = async () => clean(await page.locator('main [role=tab][aria-selected=true]').first().innerText().catch(() => ''));
  const toSchoolCoursework = async () => {
    await page.keyboard.press('h'); await wait(500);
    if (W < 600) { await press('Menu'); await wait(400); }
    await page.locator('#rail').getByRole('button', { name: /^School/ }).first().click().catch(() => {}); await wait(900);
    await page.getByRole('tab', { name: /^Coursework/ }).first().click().catch(() => {}); await wait(700);
    await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  };
  await toSchoolCoursework();
  await page.keyboard.press('h'); await wait(700);
  check('H goes to Home', routeOfHash(await hashNow()) === '/home', await hashNow());
  const viaH = await crumbBar().locator('button', { hasText: /^School$/ }).count() > 0;
  log(`H from School’s Coursework: ${viaH ? 'a School breadcrumb on Home' : 'no School breadcrumb on Home'} (${clean(await crumbBar().innerText().catch(() => '')) || 'no breadcrumbs shown'})`);
  await toSchoolCoursework();
  await page.keyboard.press('p'); await wait(800);
  const pCrumbs = clean(await crumbBar().innerText().catch(() => ''));
  const pCrumb = crumbBar().locator('button', { hasText: /^School$/ }).first();
  let viaP = false;
  if (await pCrumb.count()) { await pCrumb.click(); await wait(800); viaP = routeOfHash(await hashNow()) === '/workspace/school' && (await tabShown()).startsWith('Coursework'); }
  log(`P from School’s Coursework, then School in the breadcrumbs (${pCrumbs}): ${viaP ? 'School, on Coursework' : `${await hashNow()} ${await tabShown()}`}`);
  const saysH = /^Press H\b/.test(ex.steps[0] ?? '');
  check('Finding Your Way’s worked example, followed as it says, comes back to School on Coursework', saysH ? viaH : viaP, `the example ${saysH ? 'presses H, and Home ' + (viaH ? 'has' : 'has no') + ' School breadcrumb' : 'presses P, and the School breadcrumb ' + (viaP ? 'opens School on Coursework' : 'didn’t')}`);
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.keyboard.press('c'); await wait(800);
  check('C opens the Calendar screen', routeOfHash(await hashNow()) === '/workspace/calendar', await hashNow());
  await page.keyboard.press('p'); await wait(800);
  check('P opens the Player Profile', /profile/.test(routeOfHash(await hashNow())), await hashNow());
  await page.goBack().catch(() => {}); await wait(800);
  check('the browser’s Back returns to the screen before', routeOfHash(await hashNow()) === '/workspace/calendar', await hashNow());
  const mark = page.getByRole('button', { name: 'SLATE, Go To Home' }).first();
  if (await mark.count()) { await mark.click().catch(() => {}); await wait(700); check('the SLATE mark at the top left goes Home', routeOfHash(await hashNow()) === '/home', await hashNow()); }
  else check('the SLATE mark at the top left is a control', false, clean(await page.locator('header').first().innerText()).slice(0, 120));
  await page.close();
}

writeFileSync(join(OUT, 'log.txt'), `${lines.join('\n')}\n`);
writeFileSync(join(OUT, 'results.json'), `${JSON.stringify({ base: BASE, width: W, problems, results }, null, 1)}\n`);
const failed = results.filter((r) => !r.ok);
console.log(`${results.length} checks, ${failed.length} failed; page errors: ${problems.length}`);
await browser.close();
process.exit(failed.length || problems.length ? 1 : 0);
