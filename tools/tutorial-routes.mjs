/**
 * The tutorial's routes, checked against the built app (from 2026-10-17, the owner's brief 14, section 5: "Verify every
 * navigation path and instruction against the built application").
 *
 * It reads what the tutorials tell a player to go to or press: every chapter of the guide (`content/tutorial.ts`), its
 * names, its paragraphs and its details, and every How This Works entry (`content/guide/`), its `where.label` and its
 * steps. From each it takes the screen labels: the runs of Title Case words ("Put Something On It", "Call It Off") and
 * the quoted ones. Then it looks for each on the built app, in the screens `tools/text-walk.mjs` recorded for the
 * scenario saves (their text, their controls' names, their labels and dialogs), and in the menus and dialogs this tool
 * opens itself (`--capture`), which the text walk doesn't. A where label's parts are looked for on the entry's own
 * screen and tab first.
 *
 * Each label comes out as one of:
 * - **on its screen**: a where label's part on the screen and tab the entry sends the player to;
 * - **on a screen**: on some screen the walk or the capture read;
 * - **in the code only**: on no screen these saves reached, but written in the game's code outside the tutorials, so a
 *   state they didn't reach shows it (a button for a term these lives weren't in, say);
 * - **nowhere**: on no screen and in no code but the tutorials' own words. That's a wrong instruction: a label the game
 *   doesn't have. `--check` fails on one.
 *
 *   SLATE_BASE=http://localhost:4202 npx vite-node tools/tutorial-routes.mjs -- --capture OUT SAVEDIR [save.json ...]
 *   npx vite-node tools/tutorial-routes.mjs -- WALKDIR [WALKDIR ...] [--out REPORT.md] [--json REPORT.json] [--check]
 *
 * A capture opens, for each save, the top bar's Advance and Look After Yourself menus, the Sleep dialog, the Calendar
 * screen and a day on it with its plan form, the guide and How This Works' contents, and records each as the text walk
 * records a screen. Like the walk it never presses anything that commits: each menu and dialog is closed unused, and
 * the plan form with Never Mind.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS } from '../src/engine/content/tutorial.ts';
import { GUIDE } from '../src/engine/content/guide/index.ts';
import { SECTIONS } from '../src/ui/shell/sections.ts';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const flag = (name) => { const i = argv.indexOf(name); if (i < 0) return undefined; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const has = (name) => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };

// ---------------------------------------------------------------------------------------------------------------------
// The capture: menus and dialogs the text walk doesn't open.
// ---------------------------------------------------------------------------------------------------------------------

async function capture(out, dir, only) {
  const { chromium } = await import('playwright');
  const { launchOptions } = await import('./browser.mjs');
  const BASE = process.env.SLATE_BASE ?? 'http://localhost:4173';
  mkdirSync(out, { recursive: true });
  const saves = (only.length ? only : readdirSync(dir).filter((f) => f.endsWith('.json'))).sort();
  const browser = await chromium.launch(launchOptions());
  for (const save of saves) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const wait = (ms) => page.waitForTimeout(ms);
    const screens = [];
    const read = (sel) => page.evaluate((s) => {
      const names = (root, q) => [...root.querySelectorAll(q)].map((el) => (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
      const root = document.querySelector(s) ?? document.body;
      return {
        text: (root.innerText ?? '').replace(/\n{3,}/g, '\n\n').trim(),
        buttons: [...new Set(names(root, 'button, [role=button], [role=tab], [role=menuitem], a[href], summary'))],
        labels: [...new Set([...root.querySelectorAll('[aria-label], [title], label')].map((el) => el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent?.trim()).filter(Boolean))],
        placeholders: [...new Set([...root.querySelectorAll('[placeholder]')].map((el) => el.getAttribute('placeholder')))],
        dialogs: [],
      };
    }, sel);
    const record = async (screen, sel) => { try { screens.push({ screen, tab: '', ...(await read(sel)) }); } catch (e) { screens.push({ screen, tab: '', failed: String(e).slice(0, 200) }); } };
    const escape = async () => { await page.keyboard.press('Escape').catch(() => {}); await wait(300); };
    try {
      await page.goto(BASE, { waitUntil: 'networkidle' });
      const text = readFileSync(`${dir}/${save}`, 'utf8');
      await page.evaluate((t) => new Promise((res, rej) => { const r = indexedDB.open('slate', 1); r.onupgradeneeded = () => r.result.createObjectStore('saves'); r.onerror = () => rej(r.error); r.onsuccess = () => { const tx = r.result.transaction('saves', 'readwrite'); tx.objectStore('saves').put(t, 'slate.save.1'); tx.oncomplete = () => res(undefined); }; }), text);
      await page.reload({ waitUntil: 'networkidle' }); await wait(1500);
      await page.getByRole('button', { name: /^Continue$/ }).first().click({ timeout: 8000 }); await wait(3000);
      // The clock paused first, if it runs, so nothing comes due while the menus are read.
      const pause = page.locator('.topbar-time').getByRole('button', { name: /^Pause$/ }).first();
      if (await pause.count()) { await pause.click().catch(() => {}); await wait(400); }
      for (const [name, button, menu] of [['Advance Menu', /^Advance/, 'Advance Time'], ['Look After Yourself Menu', /^Look After Yourself/, 'Look After Yourself']]) {
        const b = page.locator('.topbar-time').getByRole('button', { name: button }).first();
        if (!(await b.count())) { screens.push({ screen: name, tab: '', unreachable: 'no button' }); continue; }
        await b.click().catch(() => {}); await wait(500);
        await record(name, `[role=menu][aria-label="${menu}"]`);
        await escape();
      }
      const sleep = page.locator('.topbar-time').getByRole('button', { name: /^Sleep$/ }).first();
      if (await sleep.count() && !(await sleep.isDisabled().catch(() => true))) {
        await sleep.click().catch(() => {}); await wait(600);
        await record('Sleep Dialog', '[role=dialog]');
        await escape();
      }
      // The guide, and each of its chapters, pressed in its list one by one: reading them changes nothing.
      const guide = page.getByRole('button', { name: /^Guide/ }).first();
      if (await guide.count()) {
        await guide.click().catch(() => {}); await wait(600);
        await record('Guide', '[role=dialog]');
        const toc = page.locator('[role=dialog] nav[aria-label="Chapters"] button');
        for (let i = 0; i < await toc.count(); i++) {
          const title = ((await toc.nth(i).getAttribute('aria-label')) ?? '').replace(/^\d+\.\s*/, '').replace(/, \w+$/, '');
          await toc.nth(i).click().catch(() => {}); await wait(250);
          await record(`Guide: ${title}`, '[role=dialog]');
        }
        await escape();
      }
      await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
      await page.keyboard.press('?'); await wait(600);
      await record('How This Works', '[role=dialog]');
      await escape();
      const cal = page.getByRole('button', { name: /^Open Calendar/ }).first();
      if (await cal.count()) {
        await cal.click().catch(() => {}); await wait(900);
        await record('Calendar', 'main');
        const days = page.locator('button.cal-day');
        const n = await days.count();
        // A day a week on, where a plan can still be put: the form opened and closed with Never Mind.
        for (let i = Math.min(n - 1, 20); i >= 0; i--) {
          const d = days.nth(i);
          if (await d.isDisabled().catch(() => true)) continue;
          await d.click().catch(() => {}); await wait(500);
          const put = page.getByRole('button', { name: /^Put Something On It/ }).first();
          if (!(await put.count())) continue;
          await record('Calendar Day', 'main');
          await put.click().catch(() => {}); await wait(500);
          await record('Calendar Plan Form', '[role=dialog]');
          await page.getByRole('button', { name: /^Never Mind$/ }).first().click().catch(() => {}); await wait(300);
          break;
        }
      }
    } catch (e) {
      screens.push({ screen: 'the capture', failed: String(e).slice(0, 300) });
    }
    writeFileSync(`${out}/${save}`, `${JSON.stringify(screens, null, 1)}\n`);
    console.log(`${save}: ${screens.length} captured`);
    await page.close();
  }
  await browser.close();
}

// ---------------------------------------------------------------------------------------------------------------------
// What the tutorials say to go to or press.
// ---------------------------------------------------------------------------------------------------------------------

/** Words a Title Case run is made of: a capitalised word, a figure, or the ampersand of Save & Exit. */
const WORD = String.raw`(?:[\p{Lu}0-9][\p{L}\p{N}_’'.\-]*[\p{L}\p{N}_’']|[\p{Lu}0-9]|&)`;
const RUN = new RegExp(`${WORD}(?:[ \\u00a0]${WORD})*(?:…)?`, 'gu');
/** Where a sentence begins, so its first word's capital is the sentence's, not a label's. */
const STARTS = /(^|[.!?:;]\s+|\(\s*|“)$/;

/** Each label a piece of tutorial text names: its quoted labels and its Title Case runs. */
function labelsIn(text) {
  const found = [];
  for (const m of text.matchAll(/“([^”]{2,80})”/g)) if (/^[A-Z0-9]/.test(m[1])) found.push({ label: m[1], quoted: true });
  // The runs outside the quotes, each ended at a possessive: "Yale’s aid" is Yale's, "Home’s Money" two things.
  const unquoted = text.replace(/“[^”]*”/g, (q) => ' '.repeat(q.length));
  for (const m of unquoted.matchAll(RUN)) {
    const before = unquoted.slice(0, m.index);
    for (const [i, piece] of m[0].split(/(?<=[’']s)\s/).entries()) {
      const run = piece.replace(/[’']s$/, '').replace(/[.’']+$/, '').replace(/…$/, '');
      const initial = i === 0 && STARTS.test(before);
      const words = run.split(/[ \u00a0]/);
      // A sentence's first word, alone, is the sentence's capital.
      if (initial && words.length === 1) continue;
      if (/^[A-Z]{1,2}$/.test(run) || /^\d/.test(run) || !run) continue; // an initial, a figure
      found.push({ label: run, initial });
    }
  }
  return found;
}

/** A where label's parts: "School, Coursework, Plays To Read" is School, Coursework and Plays To Read. */
function whereParts(label) {
  return label.split(/,\s*|;\s*|:\s*/).map((p) => p.trim()
    .replace(/^(?:And|Or|From|Under|On|In)\s+/, '')
    .replace(/^The Top Bar’s\s+/, '').replace(/^The\s+/, '').replace(/^Each\s+/, '')
    .replace(/\s+On (?:Home|School|Money|Papers|The Player Profile)$/, '')
    .replace(/\s+(?:Panel|Tab|Screen|Menu|Button|Line|Column|Dialog)$/, '')).filter((p) => /^[A-Z0-9]/.test(p));
}

/** Every label the tutorials name, with where it came from. */
function claims() {
  const out = [];
  for (const c of CHAPTERS) {
    for (const n of c.names) for (const l of labelsIn(n)) out.push({ ...l, from: `chapter ${c.id}`, part: 'names' });
    for (const p of [...c.body, ...(c.more ?? [])]) for (const l of labelsIn(p)) out.push({ ...l, from: `chapter ${c.id}`, part: 'words' });
  }
  for (const e of GUIDE) {
    for (const part of whereParts(e.where.label)) {
      // Two places named in one part ("SNAP And Your Claim") are each looked for, if the part isn't a label itself.
      const pieces = part.split(/\s+(?:And|Or)\s+/).map((x) => x.replace(/^(?:The|Each|Your)\s+(?=[A-Z])/, '')).filter((x) => /^[A-Z0-9]/.test(x));
      out.push({ label: part, from: `entry ${e.id}`, part: 'where', route: e.where.route, tab: e.where.tab, pieces: pieces.length > 1 ? pieces : undefined });
    }
    for (const s of e.steps) for (const l of labelsIn(s)) out.push({ ...l, from: `entry ${e.id}`, part: 'steps' });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Where the built app says them.
// ---------------------------------------------------------------------------------------------------------------------

const norm = (s) => String(s ?? '').replace(/[’']/g, "'").replace(/[\s\u00a0]+/g, ' ').replace(/[▾…]/g, '').trim();
const SCREEN_OF_ROUTE = { '/home': 'Home', '/workspace/school': 'School', '/workspace/bank': 'Money', '/workspace/papers': 'Papers', '/workspace/profile': 'Player Profile', '/workspace/calendar': 'Calendar' };

function screensIn(dirs) {
  const screens = [];
  for (const dir of dirs) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json') && x !== 'walk.json')) {
      const list = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (!Array.isArray(list)) continue;
      for (const s of list) {
        if (!s.text && !s.buttons) continue;
        const parts = [s.text, ...(s.buttons ?? []), ...(s.labels ?? []), ...(s.placeholders ?? []), ...(s.dialogs ?? [])];
        screens.push({ save: f, screen: s.screen, tab: s.tab ?? '', body: norm(parts.join('\n')), lower: norm(parts.join('\n')).toLowerCase() });
      }
    }
  }
  return screens;
}

/** The game's own words outside the tutorials: every source but the chapters and the entries. */
function codeText() {
  const files = [];
  const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(ts|tsx)$/.test(f) && !/\.test\./.test(f)) files.push(p.split('\\').join('/')); } };
  walk('src');
  return files.filter((f) => !/src\/engine\/content\/tutorial\.ts$|src\/engine\/content\/guide\//.test(f)).map((f) => norm(readFileSync(f, 'utf8'))).join('\n');
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** A word as a pattern: a figure, or the N a step writes for one, matches any figure. */
const wordRe = (w, code) => (/^(?:N|\d+)$/.test(w) ? (code ? String.raw`(?:\d+|\{[^}]*\}|\$\{[^}]*\})` : String.raw`\d+`) : escapeRe(w));
/** A label as the code may build it, in its own capitals: its words, with a template's part or a line break allowed between any two. */
const GAP = String.raw`(?:\s+|\s*\{[^}]*\}\s*|\s*\$\{[^}]*\}\s*|['"\`]\s*\+?\s*['"\`]?\s*)`;
const TEMPLATE = String.raw`(?:\{[^}]*\}|\$\{[^}]*\})`;
const inCode = (code, label) => {
  const words = norm(label).split(' ').map((w) => wordRe(w, true));
  // Its words as written, or with its last words, or its first, standing for a template's part: "Apply For HUSKY D" is
  // "Apply For {PROGRAM_NAMES[state].medicaid}".
  const forms = [words, ...words.slice(1).map((_, k) => [...words.slice(0, k + 1), TEMPLATE]), ...words.slice(1).map((_, k) => [TEMPLATE, ...words.slice(k + 1)])]
    .filter((f) => f.filter((w) => w !== TEMPLATE).length >= 2 || f.length === words.length);
  return forms.some((f) => new RegExp(`(?<![A-Za-z])${f.join(GAP)}(?![a-z])`).test(code));
};
const onScreen = (s, label) => {
  const pattern = norm(label).split(' ').map((w) => wordRe(w, false)).join(' ');
  return new RegExp(`(?<![A-Za-z])${pattern}(?![a-z])`).test(s.body) || new RegExp(`(?<![a-z])${pattern.toLowerCase()}(?![a-z])`).test(s.lower);
};

function check(dirs) {
  const screens = screensIn(dirs);
  const code = codeText();
  const tabLabel = (route, tab) => SECTIONS[route]?.find((x) => x.id === tab)?.label ?? '';
  const ownScreens = (c) => (c.route ? screens.filter((s) => s.screen === SCREEN_OF_ROUTE[c.route] && (!c.tab || s.tab === tabLabel(c.route, c.tab) || (s.tab === '' && SECTIONS[c.route]?.[0]?.id === c.tab))) : []);
  const places = (list) => [...new Set(list.map((s) => `${s.screen}${s.tab ? `, ${s.tab}` : ''}`))];
  /** Where one label is: on the entry's own screen, on any, in the code only, or nowhere. */
  const find = (label, c) => {
    const tries = [label];
    // A sentence's first word may be an instruction ("Press Go"), not the label's.
    if (c.initial) tries.push(label.split(' ').slice(1).join(' '));
    for (const t of tries.filter(Boolean)) {
      const own = ownScreens(c).filter((s) => onScreen(s, t));
      if (own.length) return { status: 'on its screen', as: t, where: places(own) };
      const any = screens.filter((s) => onScreen(s, t));
      if (any.length) return { status: 'on a screen', as: t, where: places(any).slice(0, 4) };
    }
    const coded = tries.find((t) => t && inCode(code, t));
    return coded ? { status: 'in the code only', as: coded, where: [] } : { status: 'nowhere', where: [] };
  };
  const results = [];
  const seen = new Map();
  for (const c of claims()) {
    const key = `${c.label}|${c.route ?? ''}|${c.tab ?? ''}|${c.initial ? 1 : 0}`;
    let verdict = seen.get(key);
    if (!verdict) { verdict = find(c.label, c); seen.set(key, verdict); }
    if (verdict.status !== 'on its screen' && verdict.status !== 'on a screen' && c.pieces) {
      // Not a label itself: each place it names, on its own.
      for (const piece of c.pieces) results.push({ ...c, label: piece, pieces: undefined, of: c.label, ...find(piece, c) });
      continue;
    }
    results.push({ ...c, ...verdict });
  }
  return { results, screens: screens.length, saves: new Set(screens.map((s) => s.save)).size };
}

// ---------------------------------------------------------------------------------------------------------------------

const capDir = flag('--capture');
if (capDir) {
  const [dir, ...only] = argv;
  await capture(capDir, dir, only);
} else {
  const outMd = flag('--out');
  const outJson = flag('--json');
  const strict = has('--check');
  const dirs = argv.filter((d) => existsSync(d));
  if (!dirs.length) { console.error('Name the text walk\'s folders (and a capture\'s): npx vite-node tools/tutorial-routes.mjs -- WALKDIR [...]'); process.exit(2); }
  const { results, screens, saves } = check(dirs);
  const order = ['nowhere', 'in the code only', 'on a screen', 'on its screen'];
  const count = (st) => results.filter((r) => r.status === st).length;
  const distinct = (st) => new Set(results.filter((r) => r.status === st).map((r) => r.label)).size;
  const lines = [
    '# The Tutorial’s Routes On The Built App',
    '',
    `Written by \`tools/tutorial-routes.mjs\` from ${screens} screens of ${saves} saves (${dirs.join(', ')}).`,
    '',
    '| Status | Labels | Distinct |',
    '|---|---|---|',
    ...order.map((st) => `| ${st} | ${count(st)} | ${distinct(st)} |`),
    '',
  ];
  for (const st of order.slice(0, 2)) {
    const rows = results.filter((r) => r.status === st);
    if (!rows.length) continue;
    lines.push(`## ${st[0].toUpperCase()}${st.slice(1)}`, '', '| Label | Where It’s Said | Part |', '|---|---|---|');
    const byLabel = new Map();
    for (const r of rows) { const k = r.label; byLabel.set(k, [...(byLabel.get(k) ?? []), r]); }
    for (const [label, rs] of [...byLabel].sort((a, b) => a[0].localeCompare(b[0]))) lines.push(`| ${label} | ${[...new Set(rs.map((r) => r.from))].join(', ')} | ${[...new Set(rs.map((r) => r.part))].join(', ')} |`);
    lines.push('');
  }
  const report = `${lines.join('\n')}\n`;
  if (outMd) writeFileSync(outMd, report);
  if (outJson) writeFileSync(outJson, `${JSON.stringify(results, null, 1)}\n`);
  console.log(order.map((st) => `${st}: ${count(st)} (${distinct(st)} distinct)`).join('; '));
  if (!outMd) console.log(report);
  if (strict && count('nowhere') > 0) process.exit(1);
}
