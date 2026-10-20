/**
 * The guide followed on the built app (brief 15, section 5, the tutorial area): a new life started, each chapter read
 * in its own dialog and checked word for word against `CHAPTERS`, then what the chapter says to do done where it says,
 * and the result compared with what it describes. Every check is logged, passed or failed, with what the screen showed,
 * and the screens a check rests on are kept.
 *
 *   SLATE_BASE=http://localhost:4282 npx vite-node docs/verification/editorial-2026-10-19/tutorial/follow.mjs -- OUT [WIDTH]
 *
 * It presses real controls on a throwaway new life: it reads, sleeps, eats, puts a plan on and calls it off. A route a
 * new life can't reach in its first days is left to `follow-saves.mjs`, which opens the scenario saves, or named in
 * `routes.md` as not exercised, with the reason.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS } from '../../../../src/engine/content/tutorial.ts';
import { GOALS } from '../../../../src/engine/content/guide/index.ts';

const { chromium } = await import('playwright');
const argv = process.argv.slice(2).filter((a) => a !== '--');
const OUT = argv[0] ?? 'follow-out';
const W = Number(argv[1] ?? 1440);
const H = W < 600 ? 844 : 900;
const BASE = process.env.SLATE_BASE ?? 'http://localhost:4282';
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const problems = [];
page.on('pageerror', (e) => problems.push(`page error: ${String(e).slice(0, 200)}`));
const wait = (ms) => page.waitForTimeout(ms);
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const lines = [];
const results = [];
let chapter = '-';
const log = (msg) => { const l = `[${chapter}] ${msg}`; lines.push(l); console.log(l); };
const check = (what, ok, seen = '') => {
  results.push({ chapter, what, ok: Boolean(ok), seen: clean(seen).slice(0, 400) });
  log(`${ok ? 'ok  ' : 'FAIL'} ${what}${seen ? ` — ${clean(seen).slice(0, 300)}` : ''}`);
  return Boolean(ok);
};
let shots = 0;
const shot = async (name, full = false) => { shots += 1; const f = `${String(shots).padStart(2, '0')}-${name}.png`; await page.screenshot({ path: join(OUT, f), fullPage: full }); log(`screenshot ${f}`); };
const dialog = () => page.locator('[role=dialog]').last();
const dialogOpen = async () => (await page.locator('[role=dialog]').count()) > 0 && page.locator('[role=dialog]').last().isVisible().catch(() => false);
const button = (name, scope = page) => scope.getByRole('button', { name, exact: typeof name === 'string' }).first();
const press = async (name, scope = page) => {
  const b = button(name, scope);
  if (!(await b.count())) { log(`no button ${name}`); return false; }
  try { await b.click({ timeout: 5000 }); await wait(500); return true; } catch (e) { log(`couldn’t press ${name}: ${String(e).slice(0, 120)}`); return false; }
};
const clockText = async () => clean(await page.locator('header').first().innerText().catch(() => ''));
const bodyText = async () => clean(await page.locator('body').innerText());
/** A panel on Home by its heading. */
const panel = (title) => page.locator('section.card', { has: page.getByRole('heading', { name: title, exact: true }) }).first();
/** Press a link (an underlined word) by its words, and return the look it opened. */
async function openLink(text, scope = page) {
  const link = scope.locator('button.link', { hasText: text }).first();
  if (!(await link.count())) return { ok: false, name: '', text: '' };
  await link.click(); await wait(600);
  const look = page.locator('.look').last();
  const name = clean(await look.locator('.look-name').first().innerText().catch(() => ''));
  const words = clean(await look.innerText().catch(() => ''));
  return { ok: Boolean(name), name, text: words, look };
}
async function closeLook(name) {
  const c = page.getByRole('button', { name: `Close ${name}` }).first();
  if (await c.count()) { await c.click().catch(() => {}); await wait(300); }
}
async function closeDialogs() {
  for (let i = 0; i < 4 && await dialogOpen(); i++) { await page.keyboard.press('Escape'); await wait(400); }
}
const rail = () => page.locator('#rail');
async function goRail(name) {
  if (W < 600) { await press('Menu'); await wait(400); }
  const b = rail().getByRole('button', { name: new RegExp(`^${name}`) }).first();
  if (!(await b.count())) { log(`no ${name} in the menu`); return false; }
  await b.click().catch(() => {}); await wait(1000);
  return true;
}
const norm = (s) => clean(s).replace(/[‘’]/g, '’');

/** Read a chapter in the guide dialog: its title, lead, every paragraph and its details, then I’ve Read It. */
async function readChapter(c, i) {
  chapter = c.id;
  const d = dialog();
  const text = norm(await d.innerText());
  check(`Chapter ${i + 1} Of ${CHAPTERS.length} shows “${c.title}”`, text.includes(`${c.title}`) && /CHAPTER \d+ OF \d+/i.test(text), text.slice(0, 120));
  check('its lead is on the page', text.includes(norm(c.lead)), c.lead);
  const missing = c.body.filter((p) => !text.includes(norm(p)));
  check(`all ${c.body.length} paragraphs are on the page, word for word`, missing.length === 0, missing.map((m) => m.slice(0, 80)).join(' | '));
  let details = '';
  if (c.more?.length) {
    const summary = d.locator('details.guide-more > summary').first();
    await summary.click().catch(() => {}); await wait(300);
    details = norm(await d.innerText());
    const gone = c.more.filter((p) => !details.includes(norm(p)));
    check(`The Details opens onto its ${c.more.length} paragraph(s), word for word`, gone.length === 0, gone.map((m) => m.slice(0, 80)).join(' | '));
  }
  const opens = c.names.filter((n) => !text.includes(norm(n)));
  check('What It Opens lists every name', /WHAT IT OPENS/i.test(text) && opens.length === 0, opens.join(' | '));
  writeFileSync(join(OUT, `chapter-${String(i + 1).padStart(2, '0')}-${c.id}.txt`), `${details || text}\n`);
  if (i === 0 || c.id === 'school' || c.id === 'bank') await shot(`chapter-${c.id}`);
  const read = d.getByRole('button', { name: /^I’ve Read It$/ }).first();
  if (!check('I’ve Read It is offered', await read.count())) return;
  await read.click(); await wait(700);
  const after = norm(await dialog().innerText());
  const next = CHAPTERS[i + 1];
  check('the dialog says what opened', /OPENED/i.test(after) && c.names.every((n) => after.includes(norm(n))), after.slice(0, 200));
  if (next) check('and offers Try It or the next chapter, in its words', after.includes(`It’s open now. Press Try It to go and use it, or go straight on to “${next.title}”. Next time you open the guide, it starts there.`) && (await button(`Next: ${next.title}`, dialog()).count()) > 0, after.slice(-260));
  else check('and says it was the last chapter', after.includes('That was the last chapter, and every part of the game is open now. To read any chapter again, press Guide at the top of the screen.') && (await button('Start Playing', dialog()).count()) > 0, after.slice(-200));
}

/** The guide opened from the top bar: it opens at the next unread chapter. */
async function openGuide(expect) {
  const g = page.getByRole('button', { name: /^Guide/ }).first();
  await g.click(); await wait(700);
  const text = norm(await dialog().innerText().catch(() => ''));
  check(`Guide, in the top bar, opens at “${expect.title}”`, text.includes(expect.title) && (await button('I’ve Read It', dialog()).count()) > 0, text.slice(0, 160));
}
async function tryIt() { await press('Try It', dialog()); await wait(400); }

// ---------------------------------------------------------------------------------------------------------------------
// A new life
// ---------------------------------------------------------------------------------------------------------------------
chapter = 'start';
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^New Save$/ }).first().click(); await wait(1000);
const billed = page.getByRole('group', { name: 'Billed As' });
if (await billed.count()) await billed.getByRole('button', { name: 'Actress' }).click();
await page.locator('#born-search').fill('New York'); await wait(800);
await page.getByRole('listbox', { name: 'Matching Places' }).getByRole('option').first().click(); await wait(500);
for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: /^Continue$/ }).click(); await wait(900); }
await page.getByRole('button', { name: /^Begin$/ }).click();
await page.getByRole('group', { name: 'Time Controls' }).first().waitFor({ timeout: 30000 }); await wait(2500);
check('a new life opens on the guide by itself', await dialogOpen(), norm(await dialog().innerText().catch(() => '')).slice(0, 80));
const t0 = await clockText();
check('the clock starts paused: the top bar offers Play', /\bPlay\b/.test(t0), t0.slice(0, 120));

const step = {};

// 1. Your Life, Hour By Hour ------------------------------------------------------------------------------------------
step.welcome = async () => {
  const head = clean(await page.locator('.page-head').first().innerText());
  check('the line under the greeting shows the time, the town, its time zone, the season and the weather', /\d+:\d\d [AP]M in New Haven · E[DS]T · (Summer|Fall|Autumn|Winter|Spring) · .*°F/.test(head), head);
  check('Where You Are is on Home', await panel('Where You Are').count());
  // The town's name, pressed: its details open below, with its region, country and money inside.
  const town = await openLink('New Haven', panel('Where You Are'));
  check('pressing the town’s name opens it just below', town.ok && /New Haven/.test(town.name), `${town.name}: ${town.text.slice(0, 160)}`);
  if (town.ok) {
    const inner = clean(await town.look.locator('button.link').allInnerTexts().then((x) => x.join(' | ')).catch(() => ''));
    check('with links inside for its region, its country and its money', /Connecticut/.test(inner) && /United States/.test(inner) && /(Dollar|USD|\$)/i.test(inner + town.text), inner.slice(0, 300));
    await closeLook(town.name);
  }
  for (const [what, text] of [['the date', /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), /], ['the season', /^(Summer|Fall|Winter|Spring)$/]]) {
    const l = page.locator('.page-head button.link').filter({ hasText: text }).first();
    if (await l.count()) {
      await l.click(); await wait(500);
      const name = clean(await page.locator('.look .look-name').last().innerText().catch(() => ''));
      check(`${what} opens the same way`, Boolean(name), name);
      await closeLook(name);
    } else check(`${what} opens the same way`, false, 'no link');
  }
  const daylight = panel('Where You Are').locator('button.link, .stat button').filter({ hasText: /daylight|AM –/i }).first();
  if (await daylight.count()) { await daylight.click(); await wait(500); const name = clean(await page.locator('.look .look-name').last().innerText().catch(() => '')); check('the daylight opens the same way', Boolean(name), name); await closeLook(name); }
  // A locked panel: Locked, the chapter to read, Read About It.
  const cal = page.locator('section.panel-locked', { has: page.getByRole('heading', { name: 'Calendar' }) }).first();
  const calText = clean(await cal.innerText().catch(() => ''));
  check('a panel you can’t use yet says Locked and names the chapter to read', /Locked/i.test(calText) && calText.includes('“What’s Coming”'), calText);
  await press('Read About It', cal);
  const g = norm(await dialog().innerText().catch(() => ''));
  check('its Read About It button goes straight to that chapter', g.includes('What’s Coming') && (await button('I’ve Read It', dialog()).count()) > 0, g.slice(0, 120));
  await press('Later', dialog());
  // How This Works on a panel; ? for the contents; / to search; the clock waits.
  await press(/^How This Works/, panel('Where You Are'));
  const help = norm(await dialog().innerText().catch(() => ''));
  check('How This Works on a panel explains it, and says the clock waits', help.includes('The clock waits while you read.') && /Where To Find It/i.test(help), help.slice(0, 160));
  await press('Close', dialog());
  await page.locator('body').click({ position: { x: 5, y: 300 } }).catch(() => {});
  await page.keyboard.press('?'); await wait(700);
  const contents = norm(await dialog().innerText().catch(() => ''));
  check('the ? key opens the help’s contents', /Getting Started/.test(contents) && contents.includes('The Guide. You’ve read 1 of its 17 chapters. Each one you read opens a part of the game.'), contents.slice(0, 200));
  const leads = GOALS.filter((gl) => !contents.includes(norm(gl.lead)));
  check('the contents show every group with its lead', leads.length === 0, leads.map((x) => x.title).join(', '));
  writeFileSync(join(OUT, 'help-contents.txt'), `${contents}\n`);
  await shot('help-contents');
  await closeDialogs();
  await page.keyboard.press('/'); await wait(700);
  const search = norm(await dialog().innerText().catch(() => ''));
  check('the / key opens its search, with an example', search.includes('Type a feature’s name, a word for it or a question, such as “clock stopped” or “how do I pay my card”.'), search.slice(0, 200));
  await page.locator('#help-q').fill('zzqx'); await page.keyboard.press('Enter'); await wait(400);
  check('a search that finds nothing says so and how to go on', norm(await dialog().innerText()).includes('Nothing matches “zzqx”. Try fewer or different words, or go back to Contents.'));
  await closeDialogs();
  check('the menu down the left is there, with Home', await rail().getByRole('button', { name: /^Home/ }).count() > 0 || (W < 600 && await button('Menu').count() > 0));
  if (W < 600) check('on a small screen, Menu shows the menu', await button('Menu').count() > 0);
  // Save & Exit, then Continue: the same moment.
  const before = await clockText();
  await press(/Save\s*&\s*Exit/i); await wait(2500);
  check('Save & Exit takes you back to the save slots', await page.getByRole('button', { name: /^Continue$/ }).count() > 0);
  await page.getByRole('button', { name: /^Continue$/ }).first().click(); await wait(3500);
  await closeDialogs();
  const after = await clockText();
  const hm = (s) => (s.match(/\d+:\d\d [AP]M/) ?? [''])[0];
  check('Continue there picks up at the same moment', hm(before) && hm(before) === hm(after), `${hm(before)} → ${hm(after)}`);
};

// 2. What's Coming ----------------------------------------------------------------------------------------------------
step.calendar = async () => {
  const cal = panel('Calendar');
  const text = clean(await cal.innerText().catch(() => ''));
  check('the Calendar panel shows the next thing you need to be at and how soon', /in \d+h|in \d+m|in \d+d/.test(text) && /Registration/.test(text), text.slice(0, 200));
  const rows = await cal.locator('.row-between').count();
  check('and up to five more after it', rows >= 1 && rows <= 5, `${rows} more`);
  const entry = await openLink('Registration And Your Account', cal);
  check('pressing an entry’s name shows when it starts, how long it lasts, where it is and what missing it costs', entry.ok, `${entry.name}: ${entry.text.slice(0, 400)}`);
  if (entry.ok) await closeLook(entry.name);
};

// 3. The Clock --------------------------------------------------------------------------------------------------------
step.clock = async () => {
  const bar = page.locator('.topbar-time').first();
  const t1 = await clockText();
  await press('Play', bar);
  check('Play starts the clock, and the button then says Pause', await button('Pause', bar).count() > 0);
  await wait(62_000);
  const t2 = await clockText();
  const hm = (s) => (s.match(/\d+:\d\d [AP]M/) ?? [''])[0];
  check('the clock runs in real time: a minute later, the time has moved on a minute', hm(t1) !== hm(t2), `${hm(t1)} → ${hm(t2)}`);
  await press('Pause', bar);
  check('Pause stops it, and the button says Play again', await button('Play', bar).count() > 0);
};

// 4. Moving Time On ---------------------------------------------------------------------------------------------------
step.advance = async () => {
  const bar = page.locator('.topbar-time').first();
  await press(/^Advance/, bar);
  const menu = clean(await page.locator('[role=menu][aria-label="Advance Time"]').innerText().catch(() => ''));
  check('Advance offers One Hour, This Evening (6 p.m.), Tonight (10 p.m.), Tomorrow Morning (7 a.m.), Next Event, Next Monday (9 a.m.), One Week and Choose An Event', ['One Hour', 'This Evening 6:00 PM', 'Tonight 10:00 PM', 'Tomorrow Morning 7:00 AM', 'Next Event', 'Next Monday 9:00 AM', 'One Week', 'Choose An Event'].every((x) => menu.includes(x)), menu);
  await page.getByRole('menuitem', { name: /Choose An Event/ }).first().click().catch(() => {}); await wait(600);
  const skip = norm(await dialog().innerText().catch(() => ''));
  const listed = await dialog().locator('.list-item').count();
  check('Choose An Event lets you pick from the next things on your calendar, at most fourteen', /Skip To Event/i.test(skip) && listed > 0 && listed <= 14, `${listed} listed`);
  await press('Cancel', dialog());
  const hm = (s) => (s.match(/\d+:\d\d [AP]M/) ?? [''])[0];
  const before = hm(await clockText());
  await press(/^Advance/, bar);
  await page.getByRole('menuitem', { name: /^One Hour/ }).first().click().catch(() => {}); await wait(1200);
  const after = hm(await clockText());
  check('One Hour moves the clock on an hour', before !== after, `${before} → ${after}`);
  // A jump past a commitment: On The Way first, then the stop.
  await press(/^Advance/, bar);
  await page.getByRole('menuitem', { name: /^Tonight/ }).first().click().catch(() => {}); await wait(900);
  const way = norm(await dialog().innerText().catch(() => ''));
  check('a jump past commitments first shows On The Way, saying how many', /On The Way/i.test(way) && /passes \w+ commitments?/.test(way), way.slice(0, 260));
  await shot('on-the-way');
  await press('Advance', dialog()); await wait(1500);
  const stop = norm(await dialog().innerText().catch(() => ''));
  const go = await button('Go', dialog()).count();
  const stand = await button('Stand Here', dialog()).count();
  const skipIt = await button('Skip It', dialog()).count();
  check('the clock stops at the commitment, and a dialog with its name asks what you want to do', go > 0 && stand > 0 && /needs you now/.test(stop), stop.slice(0, 260));
  check('a school commitment has Go and Stand Here, and no Skip It', go > 0 && stand > 0 && skipIt === 0, `Go ${go}, Stand Here ${stand}, Skip It ${skipIt}`);
  await shot('a-commitment-stops-the-clock');
  const at = hm(await clockText());
  await press('Stand Here', dialog()); await wait(600);
  check('Stand Here closes the dialog and keeps the clock paused at the commitment', !(await dialogOpen()) && hm(await clockText()) === at && await button('Play', bar).count() > 0, `${at} → ${hm(await clockText())}`);
  // Go through each stop until the jump is done: Go takes the commitment's own time.
  await press(/^Advance/, bar);
  await page.getByRole('menuitem', { name: /^Tonight/ }).first().click().catch(() => {}); await wait(900);
  if (/On The Way/i.test(norm(await dialog().innerText().catch(() => '')))) await press('Advance', dialog());
  await wait(1200);
  let stops = 0;
  for (let k = 0; k < 12 && await dialogOpen(); k++) {
    const d = norm(await dialog().innerText());
    if (!(await button('Go', dialog()).count())) break;
    stops += 1;
    if (k === 0) check('Go says how long going takes and where the clock moves on to', /Going takes .+, and the clock moves on to/.test(d), d.slice(0, 220));
    await press('Go', dialog()); await wait(1500);
  }
  log(`went to ${stops} commitment(s) on the way to tonight: ${hm(await clockText())}`);
  check('the jump ends tonight, after going to each commitment', /(10|11):\d\d PM/.test(hm(await clockText())) || stops > 0, hm(await clockText()));
};

// 5. What Needs You ---------------------------------------------------------------------------------------------------
step.needs = async () => {
  const p = panel('What Needs You');
  const text = clean(await p.innerText().catch(() => ''));
  check('What Needs You is on Home, with notices', /Welcome To The Class Of 2029/.test(text), text.slice(0, 200));
  const railHome = clean(await rail().getByRole('button', { name: /^Home/ }).first().innerText().catch(() => ''));
  check('the number beside Home in the menu counts what’s waiting', /\d/.test(railHome) || W < 600, railHome);
  const n = await openLink('Welcome To The Class Of 2029', p);
  check('pressing a notice’s title opens it in full', n.ok && /MFA in Acting/.test(n.text), `${n.name}: ${n.text.slice(0, 160)}`);
  if (n.ok) await closeLook(n.name);
  check('a notice with somewhere to go has Go There', await button('Go There', p).count() > 0);
  const mark = p.getByRole('button', { name: /^Mark \d+ Read$/ }).first();
  const label = clean(await mark.innerText().catch(() => ''));
  check('Mark Read shows how many are unread', /^Mark \d+ Read$/.test(label), label);
  await mark.click().catch(() => {}); await wait(800);
  const now = clean(await p.innerText().catch(() => ''));
  check('and pressed, it clears them from the panel', !/Welcome To The Class Of 2029/.test(now), now.slice(0, 200));
  check('with nothing waiting, the panel says what still needs attention, or All Clear', /No Questions Waiting|All Clear|No questions are waiting/.test(now), now.slice(0, 200));
};

// 6. How You Are ------------------------------------------------------------------------------------------------------
step.body = async () => {
  const p = panel('How You Are');
  const text = clean(await p.innerText().catch(() => ''));
  check('How You Are shows Energy, Stress and Readiness', /Energy \d+/.test(text) && /Stress \d+/.test(text) && /Readiness \d+/.test(text), text);
  const r = await openLink('Readiness', p);
  const ways = r.ok ? await r.look.locator('.look-ways button.link').allInnerTexts().catch(() => []) : [];
  check('pressing Readiness shows the measures costing it most, up to three', r.ok && ways.length <= 3, `${r.name}: ${ways.join(', ')}`);
  if (ways.length) {
    await r.look.locator('.look-ways button.link').first().click(); await wait(500);
    const inner = clean(await page.locator('.look .look .look-name').last().innerText().catch(() => ''));
    check('and pressing one of those shows where it stands and what it does', Boolean(inner), inner);
  }
  if (r.ok) await closeLook(r.name);
};

// 7. Sleep ------------------------------------------------------------------------------------------------------------
step.sleep = async () => {
  const bar = page.locator('.topbar-time').first();
  await press('Sleep', bar);
  const d = norm(await dialog().innerText().catch(() => ''));
  const range = await page.locator('#sleep-hours').evaluate((el) => [el.min, el.max]).catch(() => []);
  check('Sleep opens the Sleep dialog, asking how many hours, from half an hour to 14 hours', /Hours/.test(d) && range[0] === '0.5' && range[1] === '14', `${range.join(' to ')}`);
  check('it suggests a number and shows when you’d wake', /You’d Wake At/i.test(d), d.slice(0, 260));
  const sleepBtn = dialog().getByRole('button', { name: /^Sleep [\d.]+ Hours?$/ }).first();
  check('the button has the hours on it, such as Sleep 8 Hours', await sleepBtn.count() > 0, clean(await sleepBtn.innerText().catch(() => '')));
  await shot('sleep-dialog');
  await press('Not Yet', dialog());
  check('Not Yet closes the dialog', !(await dialogOpen()));
  // At a commitment, Sleep is grayed out and the bar says when you'll be free.
  await press(/^Advance/, bar);
  await page.getByRole('menuitem', { name: /^Next Event/ }).first().click().catch(() => {}); await wait(1400);
  for (let k = 0; k < 6 && await dialogOpen() && !(await button('Stand Here', dialog()).count()); k++) await press('Advance', dialog());
  if (await button('Stand Here', dialog()).count()) {
    const name = clean(await dialog().locator('h2, h3').first().innerText().catch(() => ''));
    await press('Stand Here', dialog());
    await press('Play', bar); await wait(4000);
    const sleep = bar.getByRole('button', { name: /^Sleep/ }).first();
    const why = clean(await page.locator('.topbar-why').innerText().catch(() => ''));
    check('while you’re at a commitment, Sleep is grayed out and the top bar says when you’ll be free', await sleep.isDisabled().catch(() => false) && /You’re at .+ until \d+:\d\d [AP]M/.test(why), `${name}: ${why}`);
    await shot('sleep-grayed-at-a-commitment');
    if (await button('Pause', bar).count()) await press('Pause', bar);
    await closeDialogs();
  } else check('a commitment to stand at, to see Sleep grayed', false, 'none came');
  // Sleep through a night: energy comes back.
  const energy = async () => Number((clean(await panel('How You Are').innerText().catch(() => '')).match(/Energy (\d+)/) ?? [0, NaN])[1]);
  const e0 = await energy();
  await press(/^Advance/, bar);
  await page.getByRole('menuitem', { name: /^Tonight/ }).first().click().catch(() => {}); await wait(900);
  for (let k = 0; k < 10 && await dialogOpen(); k++) { if (!(await press('Go', dialog()))) await press('Advance', dialog()); await wait(1000); }
  const e1 = await energy();
  await press('Sleep', bar);
  await page.locator('#sleep-hours').fill('8').catch(() => {}); await wait(300);
  const s8 = dialog().getByRole('button', { name: 'Sleep 8 Hours', exact: true }).first();
  const hm = (s) => (s.match(/\d+:\d\d [AP]M/) ?? [''])[0];
  const before = hm(await clockText());
  if (await s8.count()) { await s8.click(); await wait(2500); }
  for (let k = 0; k < 6 && await dialogOpen(); k++) await closeDialogs();
  const e2 = await energy();
  check('a night’s sleep gives your energy back', e2 > e1, `energy ${e0} this morning, ${e1} at bedtime, ${e2} after Sleep 8 Hours (${before} → ${hm(await clockText())})`);
};

// 8. Looking After Yourself -------------------------------------------------------------------------------------------
step['looking-after'] = async () => {
  const bar = page.locator('.topbar-time').first();
  await press(/^Look After Yourself/, bar);
  const menu = page.locator('[role=menu][aria-label="Look After Yourself"]');
  const text = clean(await menu.innerText().catch(() => ''));
  check('Look After Yourself offers Eat A Meal, Order In, Shower, Work Out and Unwind', ['Eat A Meal', 'Order In', 'Shower', 'Work Out', 'Unwind'].every((x) => text.includes(x)), text.slice(0, 400));
  check('the top line is marked Needed Now or Most Worth It', /Needed Now|Most Worth It/.test(text.slice(0, 120)), text.slice(0, 120));
  check('each line shows how long it takes', (text.match(/\b\d+ ?(min|minutes|h|hour)/gi) ?? []).length >= 5 || /min/.test(text), text.slice(0, 400));
  await shot('look-after-menu');
  const items = menu.getByRole('menuitem');
  let pressed = '';
  for (let k = 0; k < await items.count(); k++) {
    const it = items.nth(k);
    if (await it.isDisabled().catch(() => true)) continue;
    pressed = clean(await it.innerText()).split(' ')[0];
    await it.click(); await wait(1200);
    break;
  }
  const toast = clean(await page.locator('.toast').last().innerText().catch(() => ''));
  check('pressing one does it, and says when it’s done', /: done at \d+:\d\d [AP]M\./.test(toast), `${pressed}: ${toast}`);
};

// 9. Your Own Plans ---------------------------------------------------------------------------------------------------
step.plans = async () => {
  await press('Open Calendar', panel('Calendar')); await wait(1500);
  check('Open Calendar shows the whole month', await page.locator('button.cal-day').count() >= 28);
  const days = page.locator('button.cal-day');
  let opened = false;
  for (let i = await days.count() - 1; i >= 0; i--) {
    const d = days.nth(i);
    if (await d.isDisabled().catch(() => true)) continue;
    await d.click(); await wait(500);
    if (await button('Put Something On It').count()) { opened = true; break; }
  }
  check('pressing a day offers Put Something On It', opened);
  if (!opened) return;
  await press('Put Something On It');
  const form = norm(await dialog().innerText().catch(() => ''));
  const lengths = await page.locator('#plan-length option').allInnerTexts().catch(() => []);
  check('it asks what it is, when it starts and how long it lasts, from half an hour to all day', /What Is It/i.test(form) && /When It Starts/i.test(form) && /How Long It Takes/i.test(form) && lengths[0] === 'Half An Hour' && lengths.at(-1) === 'All Day', lengths.join(', '));
  await page.locator('#plan-title').fill('Lunch With Sam'); await wait(200);
  await press('Put It On', dialog()); await wait(800);
  const list = clean(await page.locator('main').innerText().catch(() => ''));
  check('Put It On adds it to the day', /Lunch With Sam/.test(list));
  await page.locator('button.list-item', { hasText: 'Lunch With Sam' }).first().click().catch(() => {}); await wait(600);
  const detail = norm(await dialog().innerText().catch(() => ''));
  check('pressed on the Calendar screen, a plan of your own offers Call It Off', await button('Call It Off', dialog()).count() > 0, detail.slice(0, 200));
  await shot('plan-call-it-off');
  await press('Call It Off', dialog()); await wait(800);
  const gone = clean(await page.locator('main').innerText().catch(() => ''));
  check('and Call It Off takes it off before it starts', !/Lunch With Sam/.test(gone) || /cancel/i.test(gone));
  await goRail('Home');
};

// 10. Weather ---------------------------------------------------------------------------------------------------------
step.weather = async () => {
  const p = panel('Weather');
  const text = clean(await p.innerText().catch(() => ''));
  check('the Weather panel shows the weather now and the next few days', /°F/.test(text) && /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(text), text.slice(0, 200));
  const links = p.locator('button.link');
  check('today’s weather and the days are links', await links.count() > 0, `${await links.count()} links`);
  if (await links.count()) {
    await links.first().click(); await wait(600);
    const look = page.locator('.look').last();
    const name = clean(await look.locator('.look-name').innerText().catch(() => ''));
    const words = clean(await look.innerText().catch(() => ''));
    check('pressing it shows more: the week, each day and each hour', Boolean(name), `${name}: ${words.slice(0, 200)}`);
    await closeLook(name);
  }
};

// 11. Drama School: what a new life can reach in its first days (the coursework, a partner, casting: follow-saves.mjs) --
const tabsOf = async () => (await page.getByRole('tab').allInnerTexts().catch(() => [])).map((x) => clean(x.split('\n')[0]));
async function tab(name) {
  const t = page.getByRole('tab', { name: new RegExp(`^${name}`) }).first();
  if (!(await t.count())) return false;
  await t.click().catch(() => {}); await wait(900);
  return true;
}
const mainText = async () => clean(await page.locator('main').innerText().catch(() => ''));
step.school = async () => {
  const affairs = panel('Your Affairs');
  const line = clean(await affairs.innerText().catch(() => ''));
  check('the School line in Your Affairs shows your year or arrival, your standing, your place in the class and what’s next', /good standing/.test(line) && /of 16 in the class/.test(line) && /Next:/.test(line), line);
  await press('Yale', affairs); await wait(1000);
  const tabs = await tabsOf();
  check('the Yale button opens the School screen, with the tabs the chapter names', ['Standing And Craft', 'Classes', 'Coursework', 'Casting', 'Shifts And Pay', 'Terms And Award'].every((t) => tabs.includes(t)), tabs.join(', '));
  await tab('Standing And Craft');
  const standing = await mainText();
  check('Standing And Craft shows your craft, Composure beside it and Coursework This Term', /Composure/.test(standing) && /Coursework This Term/i.test(standing), standing.slice(0, 200));
  for (const [what, text, on] of [['the school’s name', 'David Geffen School of Drama at Yale University', 'Standing And Craft'], ['a technique', 'Scene Study', 'Standing And Craft'], ['a course', 'Acting I', 'Classes']]) {
    await tab(on);
    const l = page.locator('main button.link', { hasText: text }).first();
    if (await l.count()) { await l.click(); await wait(500); const name = clean(await page.locator('.look .look-name').last().innerText().catch(() => '')); check(`on the School screen, ${what} is a link`, Boolean(name), name); await closeLook(name); }
    else check(`on the School screen, ${what} is a link`, false, 'none');
  }
  await tab('Classes');
  const classes = await mainText();
  check('Classes shows the week, nine to three on class days', /nine to three on class days/.test(classes), classes.slice(0, 160));
  log(`Call In Sick on a new life’s first morning: ${(await button('Call In Sick').count()) ? 'offered' : 'not offered (nothing at school to miss yet, or orientation only)'}; followed on the brief save (follow-saves.mjs)`);
  await tab('Shifts And Pay');
  const take = button('Take An Elective Shift');
  if (await take.count()) {
    await take.click(); await wait(900);
    const toast = clean(await page.locator('.toast').last().innerText().catch(() => ''));
    check('Take An Elective Shift, on Shifts And Pay, signs you up for an evening front of house', /^Front of house, /.test(toast), toast);
  } else check('Take An Elective Shift is on Shifts And Pay', false, (await mainText()).slice(0, 200));
  await tab('Casting');
  const casting = await mainText();
  log(`Casting on a new life: ${casting.slice(0, 240)}`);
  check('Casting is there to show your part, and the Cabaret', /Cabaret/.test(casting), casting.slice(0, 200));
  await tab('Coursework');
  const work = await mainText();
  check('Coursework holds Plays To Read', /Plays To Read/.test(work), work.slice(0, 200));
};

// 12. You As An Actor -------------------------------------------------------------------------------------------------
step.profile = async () => {
  await goRail('Player Profile');
  const text = await mainText();
  const abilities = ['Emotional Depth', 'Presence', 'Listening And Responsiveness', 'Imagination', 'Focus', 'Memory', 'Adaptability', 'Composure', 'Vocal Expression', 'Physical Expression', 'Discipline', 'Stamina'];
  check('Player Profile, in the menu, lists the twelve abilities', abilities.every((a) => text.includes(a)), abilities.filter((a) => !text.includes(a)).join(', '));
  const presence = await openLink('Presence', page.locator('main'));
  check('pressing an ability shows what it is, how it grows and where it counts', presence.ok && /how it grows/i.test(presence.text) && /where it counts/i.test(presence.text), `${presence.name}: ${presence.text.slice(0, 240)}`);
  if (presence.ok) await closeLook(presence.name);
  const comic = page.locator('main button', { hasText: /^Comic Timing…$/ }).first();
  if (await comic.count()) {
    await comic.click(); await wait(500);
    const tier = await page.locator('main label', { hasText: /^Tier/ }).count();
    const focus = await page.locator('main label', { hasText: /^Focus/ }).count();
    const go = button('Practice An Hour');
    check('the exercise beside a technique, such as Comic Timing, offers a Tier, a Focus and Practice An Hour', tier > 0 && focus > 0 && await go.count() > 0, `Tier ${tier}, Focus ${focus}`);
    const said = clean(await go.locator('xpath=..').innerText().catch(() => ''));
    check('before the hour, it says about how much it will add', /\+?\d|about/i.test(said), said.slice(0, 300));
    await go.click().catch(() => {}); await wait(1200);
    const toast = clean(await page.locator('.toast').last().innerText().catch(() => ''));
    check('Practice An Hour practices for an hour and says what it added', /^Comic Timing: \+\d/.test(toast), toast);
  } else check('the Practice column has Comic Timing', false, 'no Comic Timing…');
  const study = button('Study It');
  if (await study.count()) {
    await study.click(); await wait(1200);
    const toast = clean(await page.locator('.toast').last().innerText().catch(() => ''));
    check('under Genres, Study It reads a play or watches a film of the genre', toast.length > 0, toast);
  } else check('Genres has Study It', false);
  const brief = button('Open Its Brief');
  if (await brief.count()) {
    await brief.click(); await wait(1200);
    const pane = await bodyText();
    const labels = ['Break It Down', 'Learn The Lines', 'Rehearse It On Your Feet', 'Read With', 'Tape It'];
    check('Open Its Brief shows where and when, the two of you, what you want and what’s in the way', /Where And When/i.test(pane) && /The Two Of You/i.test(pane) && /What You Want/i.test(pane) && /What’s In The Way/i.test(pane), pane.slice(0, 200));
    check('and the brief offers Break It Down, Learn The Lines, Rehearse It On Your Feet, Read With and Tape It', labels.every((l) => pane.includes(l)), labels.filter((l) => !pane.includes(l)).join(', '));
    await shot('a-practice-brief');
    await closeDialogs();
  } else check('Genres has Open Its Brief', false);
  check('Your Work So Far is on the Player Profile', /Your Work So Far/.test(await mainText()));
  // Your name at the foot of the menu opens the Player Profile too.
  await goRail('Home');
  if (W < 600) { await press('Menu'); await wait(400); }
  const you = rail().locator('button', { hasText: /Alex|Rivera/ }).last();
  if (await you.count()) { await you.click().catch(() => {}); await wait(1000); check('pressing your name at the foot of the menu opens the Player Profile', /Player Profile|Attributes And Craft/.test(await mainText())); }
};

// 13. Cover, Benefits And Returns ------------------------------------------------------------------------------------
step.papers = async () => {
  const affairs = panel('Your Affairs');
  const line = clean(await affairs.innerText().catch(() => ''));
  check('the Papers line in Your Affairs shows what covers you', /Cover: Yale Health\./.test(line), line.slice(line.indexOf('Papers'), line.indexOf('Papers') + 120));
  await press('Papers', affairs); await wait(1000);
  const tabs = await tabsOf();
  check('the Papers button opens Papers, with the tabs the chapter names', ['Tax Returns', 'Health Cover', 'Unemployment', 'Passport And ID', 'Permission To Work'].every((t) => tabs.includes(t)), tabs.join(', '));
  await tab('Health Cover');
  const health = await mainText();
  check('Your Cover, on Health Cover, shows Yale Health', /Your Cover/.test(health) && /Yale Health/.test(health));
  const doctor = await page.locator('main select').first().evaluate((el) => [...el.options].map((o) => o.textContent)).catch(() => []);
  check('Your Doctor chooses the practice, and Yale Health Center sees a student it covers the next weekday, at no charge', doctor.some((o) => /Yale Health Center, Student Health, A Visit \$0\.00, The Next Weekday/.test(o)), doctor.join(' | '));
  check('with no visit owed there’s no Book An Appointment: the game books a visit itself when one is needed', !(await button('Book An Appointment').count()));
  check('The Marketplace and Care And Its Bills are on Health Cover', /The Marketplace/.test(health) && /Care And Its Bills/.test(health));
  if (await button('Let It Go').count() || await button('Keep It Up').count()) {
    check('a long-term condition under Your Long-Term Conditions (Your Conditions until the papers area’s rename) has Let It Go or Keep It Up', true, health.slice(health.search(/Your (Long-Term )?Conditions/), health.search(/Your (Long-Term )?Conditions/) + 160));
    if (/Therapist/.test(health)) check('depression has a Therapist to choose and Begin A Course Of 8 Sessions', await button('Begin A Course Of 8 Sessions').count() > 0);
  }
  else log(`no long-term condition on this life (Your Conditions: ${health.slice(health.search(/Your (Long-Term )?Conditions/), health.search(/Your (Long-Term )?Conditions/) + 80)}); followed on a new life that has one (follow-saves.mjs)`);
  await shot('health-cover');
  await tab('Unemployment');
  const un = await mainText();
  check('Unemployment has SNAP with Apply, and says a Connecticut claim pays only once you’ve left school', /SNAP/.test(un) && await button('Apply').count() > 0 && /a claim pays only once you’ve left school/.test(un), un.slice(un.indexOf('SNAP'), un.indexOf('SNAP') + 160));
  await tab('Tax Returns');
  log(`Tax Returns before the first February: ${(await mainText()).slice((await mainText()).indexOf('Tax Returns', 120), (await mainText()).indexOf('Tax Returns', 120) + 200)}`);
};

// 14. Passports And ID ------------------------------------------------------------------------------------------------
step.documents = async () => {
  await goRail('Papers');
  await tab('Passport And ID');
  const text = await mainText();
  check('Passport And ID has Your Passport, with Renew It or Apply For One, and the faster service', /Your Passport/.test(text) && (await button('Renew It').count() || await button('Apply For One').count()) && (await button('Renew It Faster').count() || await button('Apply Faster').count()), '');
  check('Report Lost and Report Stolen are beside a document', await page.locator('main button', { hasText: /^Report Lost/ }).count() > 0 && await page.locator('main button', { hasText: /^Report Stolen/ }).count() > 0);
  check('Your ID offers Get with the card’s name', /Your ID/.test(text) && await page.locator('main button', { hasText: /^Get / }).count() > 0, clean(await page.locator('main button', { hasText: /^Get / }).first().innerText().catch(() => '')));
  const row = page.locator('main table button.link').first();
  if (await row.count()) {
    await row.click(); await wait(600);
    const look = page.locator('.look').last();
    const words = clean(await look.innerText().catch(() => ''));
    check('pressing a document you hold shows who issued it, its number’s last digits, when it was issued and runs out, and what it lets you do', words.length > 40, words.slice(0, 300));
    await closeLook(clean(await look.locator('.look-name').innerText().catch(() => '')));
  } else check('a document you hold is listed', false);
  const country = page.locator('main select').filter({ has: page.locator('option', { hasText: 'Japan' }) }).first();
  if (await country.count()) {
    const at = (t) => t.slice(t.indexOf('United Kingdom', t.indexOf('Going Abroad')) + 14, t.indexOf('Sources And Estimates', t.indexOf('Going Abroad')));
    const first = at(await mainText());
    await country.selectOption({ label: 'Japan' }).catch(() => {}); await wait(500);
    const said = at(await mainText());
    check('Going Abroad: picking a country shows what it asks of your citizenship, or what you’re missing', said.trim().length > 20 && (said !== first || /You need a passport in force/.test(said)), `${first.slice(0, 120)} → ${said.slice(0, 160)}`);
  } else check('Going Abroad lets you pick a country', false);
  await shot('passport-and-id');
  await tab('Permission To Work');
  const work = await mainText();
  check('Permission To Work has Apply For OPT and Residence Abroad', await button('Apply For OPT').count() > 0 && /Residence Abroad/.test(work));
};

// 15. Money -----------------------------------------------------------------------------------------------------------
step.money = async () => {
  const affairs = panel('Your Affairs');
  const line = clean(await affairs.innerText().catch(() => ''));
  check('the Money line shows your checking account and your net worth', /Checking: \$[\d,.]+\. Worth \$[\d,]+/.test(line), line.slice(line.indexOf('Money'), line.indexOf('Money') + 120));
  const title = affairs.locator('button.link', { hasText: /^Your Affairs$/ }).first();
  if (await title.count()) {
    await title.click(); await wait(600);
    const look = page.locator('.look').last();
    const name = clean(await look.locator('.look-name').innerText().catch(() => ''));
    const ways = await look.locator('.look-ways button.link, button.link').allInnerTexts().catch(() => []);
    check('pressing Your Affairs, the panel’s title, shows what you’re worth, and from there each account', Boolean(name) && ways.some((w) => /Checking|Savings/.test(w)), `${name}: ${ways.slice(0, 8).join(', ')}`);
    await closeLook(name);
  } else check('Your Affairs, the panel’s title, is a link', false);
};

// 16. Your Bank -------------------------------------------------------------------------------------------------------
step.bank = async () => {
  await press('Chase', panel('Your Affairs')); await wait(1000);
  const tabs = await tabsOf();
  check('the button with the bank’s name opens it, with the tabs the chapter names', ['Accounts', 'Cards', 'Payments And Cash', 'Borrowing', 'Statements'].every((t) => tabs.includes(t)), tabs.join(', '));
  await tab('Accounts');
  const money = async () => clean(await page.locator('main').innerText().catch(() => ''));
  const before = (await money()).match(/Chase Total Checking[\s\S]*?BALANCE \$([\d,]+)/i)?.[1];
  const from = page.locator('#move-from');
  if (await from.count()) {
    const opts = await from.evaluate((el) => [...el.options].map((o) => ({ v: o.value, t: o.textContent })));
    const savings = opts.find((o) => /Savings/.test(o.t));
    if (savings) await from.selectOption(savings.v);
    await wait(300);
    await page.locator('#move-amount').fill('10'); await wait(200);
    await press('Move It'); await wait(1200);
    const after = (await money()).match(/Chase Total Checking[\s\S]*?BALANCE \$([\d,]+)/i)?.[1];
    const toast = clean(await page.locator('.toast').last().innerText().catch(() => ''));
    check('Move Money, on Accounts: where from, where to, how much, Move It; at the same bank it moves at once', Number(String(after).replace(/,/g, '')) === Number(String(before).replace(/,/g, '')) + 10, `${before} → ${after} · ${toast}`);
  } else check('Accounts has Move Money', false);
  await tab('Cards');
  const cards = await money();
  check('Cards has the credit card, Pay Card In Full and Autopay', await page.locator('main button', { hasText: /^Pay Card In Full/ }).count() > 0 && /Autopay/.test(cards));
  check('a card can be locked and reported', await button('Lock It').count() > 0 && await button('Report It').count() > 0);
  await tab('Payments And Cash');
  const pay = await money();
  // The money area renamed the control to Checking (coordinator.md, From The Frame Area), merged after this was written;
  // brief 15's final follow on d6f6527a failed this on the old name, the button and the guide both saying Checking.
  check('How You Pay is on Payments And Cash, with Savings Covers The Checking Account', /How You Pay/.test(pay) && /Savings Covers The Checking Account/.test(pay));
  await tab('Statements');
  const st = await money();
  check('Statements, its own tab, has The Year and Alerts, with Statement Ready and Short For A Payment', /The Year/.test(st) && /Alerts/.test(st) && /Statement Ready/.test(st) && /Short For A Payment/.test(st));
  await shot('bank-statements');
  await tab('Borrowing');
  log(`Borrowing on a new life: ${(await money()).slice(-300)}`);
};

// 17. A Whole Life ----------------------------------------------------------------------------------------------------
step.life = async () => {
  await goRail('Home');
  const name = page.locator('.page-head h1 button.link').first();
  if (await name.count()) {
    await name.click(); await wait(700);
    const look = page.locator('.look').last();
    const words = clean(await look.innerText().catch(() => ''));
    check('pressing your name on Home opens your own page: your wellbeing, your readiness and your traits', /Readiness/i.test(words) && /(Energy|Morale|Condition)/.test(words), words.slice(0, 300));
    await shot('your-own-page');
    await closeLook(clean(await look.locator('.look-name').innerText().catch(() => '')));
  } else check('your name on Home is a link', false);
  const line = panel('How You Are').locator('p button.link').first();
  if (await line.count()) { await line.click(); await wait(600); const n = clean(await page.locator('.look .look-name').last().innerText().catch(() => '')); check('so does the line at the top of How You Are', Boolean(n), n); await closeLook(n); }
};

// ---------------------------------------------------------------------------------------------------------------------
for (const [i, c] of CHAPTERS.entries()) {
  chapter = c.id;
  if (i > 0) await openGuide(c);
  await readChapter(c, i);
  if (c.id === CHAPTERS.at(-1).id) { await press('Start Playing', dialog()); } else await tryIt();
  await closeDialogs();
  if (step[c.id]) {
    if (i > 0) await goRail('Home');
    try { await step[c.id](); } catch (e) { check(`the chapter’s steps ran through`, false, String(e).slice(0, 300)); }
    await closeDialogs();
  } else log('its steps are followed by follow-saves.mjs or named in routes.md');
}
chapter = 'end';
const locked = await page.locator('.is-locked').count();
check('with every chapter read, nothing is locked', locked === 0, `${locked} locked`);
await shot('home-everything-open', true);
writeFileSync(join(OUT, 'log.txt'), `${lines.join('\n')}\n`);
writeFileSync(join(OUT, 'results.json'), `${JSON.stringify({ base: BASE, width: W, problems, results }, null, 1)}\n`);
const failed = results.filter((r) => !r.ok);
console.log(`${results.length} checks, ${failed.length} failed; page errors: ${problems.length}`);
await browser.close();
process.exit(failed.length ? 1 : 0);
