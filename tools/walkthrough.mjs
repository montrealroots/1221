/**
 * Photographs every screen in the game, in the order a player meets them.
 *
 * Startup, the save slots, every creation step and the pickers inside them,
 * Home, the time controls and their dialogs, the calendar, and what the shell
 * looks like on a phone. Long screens are shot in viewport-sized sections
 * rather than one tall strip, because a strip is unreadable once it has been
 * scaled to fit anything.
 *
 *   npm run build && npx vite preview --port 4173
 *   node tools/walkthrough.mjs walkthrough
 *
 * It also reports anything the browser complained about on the way round: a
 * page error, a console error, or a request that came back 4xx or 5xx.
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.SLATE_URL ?? 'http://localhost:4173';
const OUT = process.argv[2] ?? 'walkthrough';
const CHROME = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

const WIDE = { width: 1440, height: 950 };
const NARROW = { width: 430, height: 900 };

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: WIDE });

const problems = [];
page.on('pageerror', (e) => problems.push(`page error - ${String(e).slice(0, 240)}`));
page.on('console', (m) => { if (m.type() === 'error') problems.push(`console - ${m.text().slice(0, 240)}`); });
page.on('response', (r) => { if (r.status() >= 400) problems.push(`http ${r.status()} - ${r.url()}`); });

const shots = [];
let step = 0;

async function shoot(name, note) {
  step += 1;
  const file = join(OUT, `${String(step).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file });
  shots.push({ n: step, file, name, note: note ?? '' });
  console.log(`  ${file}${note ? `  - ${note}` : ''}`);
}

/**
 * Works out what actually scrolls on this screen, and how far.
 *
 * The order matters. The document first, then `<body>` — which is the scroll
 * box on creation, because the shell sizes it to the viewport — and only then
 * the biggest inner scroller, which is how the shell works, where `.main`
 * owns the scrolling. Take the biggest scroller instead and it finds the city
 * list inside the location picker, scrolls that rather than the page, and
 * photographs the same screen eight times over.
 */
async function findScroller() {
  return page.evaluate(() => {
    document.querySelectorAll('[data-shot-scroller]').forEach((el) => el.removeAttribute('data-shot-scroller'));
    const docOver = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (docOver > 40) return { over: docOver, view: window.innerHeight, doc: true };

    const body = document.body;
    const bodyOver = body.scrollHeight - body.clientHeight;
    if (bodyOver > 40) {
      body.setAttribute('data-shot-scroller', '');
      return { over: bodyOver, view: body.clientHeight, doc: false };
    }

    let best = null;
    let bestOver = 8;
    for (const el of document.querySelectorAll('*')) {
      const style = getComputedStyle(el);
      if (!/auto|scroll/.test(style.overflowY)) continue;
      const over = el.scrollHeight - el.clientHeight;
      if (over > bestOver) { best = el; bestOver = over; }
    }
    if (!best) return { over: 0, view: window.innerHeight, doc: true };
    best.setAttribute('data-shot-scroller', '');
    return { over: bestOver, view: best.clientHeight, doc: false };
  });
}

async function scrollTo(y, doc) {
  await page.evaluate(({ y, doc }) => {
    if (doc) { window.scrollTo(0, y); return; }
    const el = document.querySelector('[data-shot-scroller]');
    if (el) el.scrollTop = y; else window.scrollTo(0, y);
  }, { y, doc });
}

/** One screen, top to bottom, in overlapping viewport-sized pieces. */
async function sections(name, note) {
  const { over, view, doc } = await findScroller();
  const stride = Math.max(240, view - 110);
  const count = over <= 8 ? 1 : Math.min(8, 1 + Math.ceil(over / stride));
  for (let i = 0; i < count; i++) {
    await scrollTo(Math.min(i * stride, over), doc);
    await page.waitForTimeout(340);
    await shoot(count === 1 ? name : `${name}-${i + 1}of${count}`, note);
  }
  await scrollTo(0, doc);
  await page.waitForTimeout(200);
}

const click = async (pattern) => {
  const target = page.getByRole('button', { name: pattern }).first();
  if (!(await target.count())) { console.log('   (nothing matched', String(pattern), ')'); return false; }
  await target.click().catch(() => {});
  return true;
};

// ---------------------------------------------------------------------------
// 1. Startup
// ---------------------------------------------------------------------------

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });

await page.waitForTimeout(300);
await shoot('startup-early', 'the boot sequence, part-way through its stages');
await page.waitForTimeout(400);
await shoot('startup-late', 'the same screen further along the bar');

// ---------------------------------------------------------------------------
// 2. Save slots, empty
// ---------------------------------------------------------------------------

await page.getByRole('button', { name: /^New Save$/ }).first().waitFor({ timeout: 20000 });
await page.waitForTimeout(300);
await sections('save-slots-empty', 'three slots, nothing in any of them');

// ---------------------------------------------------------------------------
// 3. Character creation
// ---------------------------------------------------------------------------

await click(/^New Save$/);
await page.waitForTimeout(1100);

// The default pronouns are they/them, which settles neither title, so the step
// will not advance until one is picked. Pick one here rather than changing the
// pronouns, so the walk goes through the branch a player actually meets.
const billed = page.getByRole('group', { name: 'Billed As' });
if (await billed.count()) {
  await billed.getByRole('button', { name: 'Actress' }).click();
  await page.waitForTimeout(400);
}

// Something to say about who she is, so the field is photographed filled in
// rather than empty.
const race = page.getByRole('group', { name: 'Race Or Ethnicity' });
if (await race.count()) {
  await race.getByRole('button', { name: 'Black Or African' }).click();
  await page.waitForTimeout(300);
}

await sections('creation-1-identity', 'step 1 of 5: name, portrait, where you are from');

const dataUrl = await page.evaluate(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 480; canvas.height = 640;
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, '#3b4a63'); sky.addColorStop(1, '#8a6a52');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 480, 640);
  ctx.fillStyle = '#d8c3a5'; ctx.beginPath(); ctx.arc(240, 250, 118, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2f2a26'; ctx.beginPath(); ctx.arc(240, 560, 190, Math.PI, 0); ctx.fill();
  return canvas.toDataURL('image/png');
});
const upload = page.locator('input[type=file]').first();
if (await upload.count()) {
  await upload.setInputFiles({
    name: 'headshot.png', mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  });
  await page.waitForTimeout(1100);
  await shoot('creation-1-portrait', 'a photo dropped in, cropped to the headshot frame');
}

const map = page.locator('svg').last();
if (await map.count()) {
  await map.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(1500);
  await shoot('creation-1-map-world', 'the geography map, whole world, the country marked');
  if (await click(/^Zoom In$/)) {
    await page.waitForTimeout(1300);
    await shoot('creation-1-map-zoomed', 'the same map zoomed to the country');
    await click(/^Whole World$/);
    await page.waitForTimeout(800);
  }
  const hide = page.getByRole('button', { name: /^Hide Map$/ }).first();
  if (await hide.count()) {
    await hide.click().catch(() => {});
    await page.waitForTimeout(700);
    await shoot('creation-1-map-hidden', 'the picker with the map folded away');
    await click(/^Show Map$/);
    await page.waitForTimeout(1000);
  }
}

const town = page.getByPlaceholder(/start typing a town name/i).first();
if (await town.count()) {
  await town.scrollIntoViewIfNeeded().catch(() => {});
  await town.fill('port');
  await page.waitForTimeout(900);
  await shoot('creation-1-town-search', 'the town search with a query typed into it');
  await town.fill('');
  await page.waitForTimeout(500);
}

const STEPS = [
  ['creation-2-who-you-are', 'step 2 of 5: personality, traits, interests, genres and background'],
  ['creation-3-my-skills', 'step 3 of 5: the craft, and how far along it already is'],
  ['creation-4-starting-point', 'step 4 of 5: the city, the housing and the money'],
  ['creation-5-review', 'step 5 of 5: all of it, before it becomes a save'],
];
for (const [name, note] of STEPS) {
  if (!(await click(/^Continue$/))) break;
  await page.waitForTimeout(1000);
  await sections(name, note);
}

// ---------------------------------------------------------------------------
// 4. Home
// ---------------------------------------------------------------------------

await click(/it.s time to be great/i);
await page.waitForTimeout(4500);
await sections('home', 'the hub: the day, what needs you, how you are, where you are, the weather, money');

// ---------------------------------------------------------------------------
// 5. The time controls
// ---------------------------------------------------------------------------

if (await click(/^Advance/)) {
  await page.waitForTimeout(600);
  await shoot('time-advance-menu', 'the Advance menu, and every jump it offers');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

if (await click(/^Sleep$/)) {
  await page.waitForTimeout(800);
  await shoot('time-sleep', 'the sleep dialog: how long, and what it would cost');
  await click(/^Not Yet$/);
  await page.waitForTimeout(400);
}

if (await click(/^Advance/)) {
  await page.waitForTimeout(500);
  const choose = page.getByRole('menuitem', { name: /choose an event/i }).first();
  if (await choose.count()) {
    await choose.click().catch(() => {});
    await page.waitForTimeout(800);
    await shoot('time-skip-to-event', 'Skip To Event, and whatever it has to offer');
    await click(/^Cancel$/);
    await page.waitForTimeout(400);
  } else {
    await page.keyboard.press('Escape');
  }
}

if (await click(/^Pause$/)) {
  await page.waitForTimeout(500);
  await shoot('time-paused', 'the clock stopped');
  await click(/^Play$/);
  await page.waitForTimeout(400);
}

if (await click(/^Sleep$/)) {
  await page.waitForTimeout(700);
  // The confirm button reads "Sleep 7.5 hours"; the one in the bar is just
  // "Sleep", and it comes first in the document.
  await click(/^Sleep \d/);
  await page.waitForTimeout(3200);
  await sections('home-after-sleep', 'Home the next morning, after a night was really slept');
}

// ---------------------------------------------------------------------------
// 6. The calendar
// ---------------------------------------------------------------------------

if (await click(/^Calendar$/)) {
  await page.waitForTimeout(1700);
  await sections('calendar', 'the month, its legend, and the next thirty days');

  const holiday = page.locator('.cal-day:has(.cal-event)').first();
  if (await holiday.count()) {
    await holiday.scrollIntoViewIfNeeded().catch(() => {});
    await holiday.click().catch(() => {});
    await page.waitForTimeout(900);
    await sections('calendar-day-open', 'a day with an observance on it, opened');
  }

  const entry = page.locator('.list-item').first();
  if (await entry.count()) {
    await entry.click().catch(() => {});
    await page.waitForTimeout(800);
    await shoot('calendar-entry-detail', 'one entry, opened');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  } else {
    console.log('   (no calendar entry could be opened - nothing schedules one any more)');
  }

  const forward = page.locator('button[aria-label="Next Month"]').first();
  if (await forward.count()) {
    await forward.click().catch(() => {});
    await page.waitForTimeout(900);
    await shoot('calendar-next-month', 'the month after this one');
    await click(/^Today$/);
    await page.waitForTimeout(600);
  }
}

// ---------------------------------------------------------------------------
// 7. Save and exit, and the slots with something in them
// ---------------------------------------------------------------------------

if (await click(/save\s*&\s*exit/i)) {
  await page.waitForTimeout(2400);
  await sections('save-slots-filled', 'the slots again, with slot 1 holding a save');

  const del = page.getByRole('button', { name: 'Delete', exact: true }).first();
  if (await del.count()) {
    await del.scrollIntoViewIfNeeded().catch(() => {});
    await del.click().catch(() => {});
    await page.waitForTimeout(800);
    await shoot('save-slots-delete', 'the confirmation before a save is destroyed');
    await click(/^Keep It$/);
    await page.waitForTimeout(500);
  } else {
    console.log('   (no Delete button on the filled slots)');
  }
}

// ---------------------------------------------------------------------------
// 8. Startup when a slot will not read
// ---------------------------------------------------------------------------

await page.evaluate(() => { localStorage.setItem('slate.save.2', 'this is not a universe'); });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
await shoot('startup-warnings', 'startup holding at the end, because a slot would not read');
if (await click(/^Continue$/)) {
  await page.waitForTimeout(1000);
  await sections('save-slots-unreadable', 'the slot that would not read, and what it offers instead');
}

// ---------------------------------------------------------------------------
// 9. The same game on a phone
// ---------------------------------------------------------------------------

await page.setViewportSize(NARROW);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1400);
await shoot('narrow-startup', 'startup at phone width');
await page.waitForTimeout(1400);

if (await click(/^Continue$/)) await page.waitForTimeout(1000);
await sections('narrow-save-slots', 'the slots at phone width');

if (await click(/^Continue$/)) {
  await page.waitForTimeout(4500);
  await sections('narrow-home', 'Home at phone width, with the rail folded away');
  if (await click(/toggle navigation/i)) {
    await page.waitForTimeout(800);
    await shoot('narrow-rail', 'the navigation drawer the Menu button opens');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
  if (await click(/^Calendar$/)) {
    await page.waitForTimeout(1600);
    await sections('narrow-calendar', 'the calendar at phone width');
  }
}

// ---------------------------------------------------------------------------

writeFileSync(join(OUT, 'index.json'), JSON.stringify({ shots, problems }, null, 2));
await browser.close();

console.log(`\n${step} screens captured in ${OUT}/`);
if (problems.length === 0) {
  console.log('The browser reported nothing: no page errors, no console errors, no failed requests.');
} else {
  console.log(`\nThe browser complained ${problems.length} time${problems.length === 1 ? '' : 's'}:`);
  for (const problem of [...new Set(problems)]) console.log('  ', problem);
}
