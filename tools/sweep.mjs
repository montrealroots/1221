/**
 * The connectivity sweep's register (from 2026-10-24, the owner's brief 26, "SLATE — Complete Game Connectivity, Logic, And
 * Functionality Sweep", §2 and §11): one row for every feature the game has, held to the code, each with the sweep's own
 * status, how it was verified (by reading the code, by a test the gate runs, by playing the built app) and the evidence.
 *
 * The features are the feature-to-effect matrix's (`tools/effects.mjs`, whose `--check` holds its rows to the code: every
 * command, scheduled kind, reactor, event, creation field, dial, ability, axis, trait, look, ui.* the guide names, tutorial
 * chapter, notice outside a handler, and every promise the guide makes between its entries), and what that matrix has no
 * row for and the brief names: each technique, each genre, each section of the Player Profile, each place the menu or Home
 * opens, and what saves, loads and brings a save forward. Each of those is found in the code too (EXTRAS says where), so a
 * feature added without a row fails the gate, and a row for a feature that's gone fails it.
 *
 * The register's own fields are in docs/verification/sweep-2026-10-24/register/<area>.json, by feature id: `status` (one of
 * STATUSES), `by` (one or more of BY), `on` (the commit the feature was read or played on), `evidence` (each a test the gate
 * runs, a measurement under the sweep's folder, or a place in the source, with words after it), `note` (what was found) and,
 * for Fixed And Verified, `fixed` (what was wrong, what changed and the commit). The nine fields of brief 26's §11 that the
 * effects row already carries (purpose, entry, reads and changes, consumers, consequences, feedback, save and load) are
 * joined from it, not typed twice.
 *
 *   node tools/sweep.mjs                     prints the totals
 *   node tools/sweep.mjs --seed              adds a Not Tested entry for every feature no file has
 *   node tools/sweep.mjs --mark <id|prefix*> <status> --by <kind[,kind]> [--on <commit>] [--note <text>] [--evidence <text>]...
 *                                            [--fixed <text>] [--with-tests]   records a status for the matching features;
 *                                            --with-tests puts each feature's own tests from its effects row (those the
 *                                            gate runs and that exist) before the evidence given
 *   node tools/sweep.mjs --write             writes docs/verification/sweep-2026-10-24/REGISTER.md
 *   node tools/sweep.mjs --todo [<area>]     lists the features still Not Tested, by area
 *   node tools/sweep.mjs --check             exits 1 on a feature with no entry, an entry for a feature that's gone, a status
 *                                            not one of the six, a `by` not one of the three, Verified or Fixed And Verified
 *                                            with no evidence or with evidence that isn't there (a test the gate doesn't run,
 *                                            a file or a source line that doesn't exist), Fixed And Verified with no `fixed`,
 *                                            Deferred that doesn't say who deferred, Failed or Blocked with no note, and
 *                                            REGISTER.md behind the entries
 */
import ts from 'typescript';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { features as effectsFeatures, areaOf } from './effects.mjs';

const DIR = 'docs/verification/sweep-2026-10-24';
const ROWS = `${DIR}/register`;
const PAGE = `${DIR}/REGISTER.md`;
const EFFECTS = 'docs/verification/audit-2026-10-21/effects';
const AREAS = ['creation', 'school', 'craft', 'money', 'benefits', 'papers', 'life', 'career', 'guide', 'persistence'];
export const STATUSES = ['Verified', 'Fixed And Verified', 'Failed', 'Blocked', 'Deferred', 'Not Tested'];
export const BY = ['inspection', 'automated', 'interactive'];
const IN_GATE = /^tests\/(?:[\w.-]+\/)*[\w.-]+\.test\.ts$/;

const read = (f) => readFileSync(f, 'utf8');
const source = (f) => ts.createSourceFile(f, read(f), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const walk = (node, visit) => { visit(node); ts.forEachChild(node, (c) => walk(c, visit)); };
const text = (node) => (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined);
const prop = (obj, name) => obj.properties.find((p) => ts.isPropertyAssignment(p) && p.name && (p.name.text ?? p.name.escapedText) === name)?.initializer;

/** The `id` of each object, the first argument of each call, or each string, in the array a constant holds. */
function idsOf(file, constant) {
  const out = [];
  walk(source(file), (n) => {
    if (ts.isVariableDeclaration(n) && n.name.getText() === constant && n.initializer) {
      const arr = ts.isAsExpression(n.initializer) ? n.initializer.expression : n.initializer;
      if (ts.isArrayLiteralExpression(arr)) for (const e of arr.elements) {
        if (ts.isObjectLiteralExpression(e)) { const id = text(prop(e, 'id')); if (id) out.push(id); }
        // A genre is made by a call, `of('action', 'Action')`: its id is the first argument.
        else if (ts.isCallExpression(e) && text(e.arguments[0])) out.push(text(e.arguments[0]));
        else if (text(e)) out.push(text(e));
      }
    }
  });
  return out;
}
/** The keys of the object literal a constant holds. */
function keysOf(file, constant) {
  const out = [];
  walk(source(file), (n) => {
    if (ts.isVariableDeclaration(n) && n.name.getText() === constant && n.initializer) {
      const obj = ts.isAsExpression(n.initializer) ? n.initializer.expression : n.initializer;
      if (ts.isObjectLiteralExpression(obj)) for (const p of obj.properties) if (ts.isPropertyAssignment(p)) out.push(p.name.text ?? p.name.escapedText ?? p.name.getText().replace(/^['"]|['"]$/g, ''));
    }
  });
  return out;
}
/** The `route` of each item of each group in DESTINATIONS. */
function routesOf() {
  const out = [];
  walk(source('src/ui/shell/destinations.ts'), (n) => {
    if (ts.isObjectLiteralExpression(n)) { const route = text(prop(n, 'route')); const label = text(prop(n, 'label')); if (route && label && prop(n, 'feature')) out.push({ route, label, homeOnly: !!prop(n, 'homeOnly') }); }
  });
  return out;
}
/** Whether a file exports the symbol (a function, const, class or default), for the extras held by name. */
const exportsSymbol = (file, symbol) => existsSync(file) && new RegExp(`export (?:async )?(?:function|const|class|let)\\s+${symbol}\\b`).test(read(file));

/**
 * What the effects matrix keeps no row for, found in the code. Each says where it lives and, by `holds`, the file and the
 * exported symbol that must still exist for the row to stand.
 */
export function extras() {
  const out = [];
  for (const id of idsOf('src/engine/content/abilities.ts', 'TECHNIQUES')) out.push({ id: `technique.${id}`, kind: 'technique', area: 'craft', where: 'Player Profile, Techniques; the School’s classes and a piece’s demands (src/engine/content/abilities.ts, TECHNIQUES)' });
  for (const id of idsOf('src/engine/content/film-genres.ts', 'FILM_GENRES')) out.push({ id: `genre.${id}`, kind: 'genre', area: 'craft', where: 'Player Profile, Genres; a brief’s and a part’s genre (src/engine/content/film-genres.ts, src/engine/content/genres.ts)' });
  for (const id of idsOf('src/ui/workspaces/ProfileWorkspace.tsx', 'SECTIONS')) out.push({ id: `profile.${id}`, kind: 'profile', area: 'creation', where: 'Player Profile, On This Page (src/ui/workspaces/ProfileWorkspace.tsx, SECTIONS)' });
  out.push({ id: 'route./home', kind: 'route', area: 'guide', where: 'Home: the rail’s top, the brand, H (src/app/game-context.tsx)' });
  for (const r of routesOf()) out.push({ id: `route.${r.route}`, kind: 'route', area: 'guide', where: `${r.label}: ${r.homeOnly ? 'from Home alone, with Back To Home' : 'the menu'} (src/ui/shell/destinations.ts)` });
  const persist = [
    ['persist.create', 'src/engine/index.ts', 'createSave', 'A new life from creation’s choices: the universe built, the slot and seed kept, every system registered'],
    ['persist.load', 'src/engine/index.ts', 'loadSave', 'A save opened: brought forward, every system registered, the clock where it stood'],
    ['persist.migrate', 'src/engine/index.ts', 'migrate', 'An older save brought forward, step by step, to the schema this build writes; a newer one refused'],
    ['persist.validate', 'src/engine/index.ts', 'validateUniverse', 'A save checked for what this build can’t open'],
    ['persist.open-slot', 'src/engine/index.ts', 'openSlot', 'A slot opened from the store, migrated and validated, or refused with the reason'],
    ['persist.serialise', 'src/engine/persistence/adapter.ts', 'serialise', 'A universe written and read back as text, every map and date kept'],
    ['persist.local-store', 'src/engine/persistence/local.ts', 'movingStore', 'The browser’s store, and a save moved from the legacy store the first time it’s opened'],
    ['persist.base44', 'src/engine/persistence/base44.ts', 'resolveAdapter', 'The remote store where it’s deployed, the local one where it isn’t'],
    ['persist.guard', 'base44/shared/guard.js', 'inspectPayload', 'The deployment’s guard: a save in a newer format than it understands is refused; forward progress required'],
    ['persist.schema', 'src/engine/domain/model.ts', 'SAVE_SCHEMA_VERSION', 'The schema pin, moved by hand with the guard’s'],
    ['persist.slots', 'src/ui/saves/SaveSlots.tsx', 'SaveSlots', 'Your Saves: the three slots, Continue, New Life, Delete, the backup note'],
    ['persist.startup', 'src/ui/startup/StartupSequence.tsx', 'StartupSequence', 'The start: the store found, the saves read, the places and holidays loaded'],
  ];
  for (const [id, file, symbol, purpose] of persist) out.push({ id, kind: 'persistence', area: 'persistence', where: `${file}, ${symbol}`, purpose, holds: [file, symbol] });
  const world = [
    ['world.holidays', 'src/engine/content/holidays.ts', 'holidaysOn', 'life', 'The holidays of the country and region the player is in, read by the School’s calls, the bank’s days, the clinic and the calendar'],
    ['world.stops', 'src/engine/world/clock.ts', 'answerStop', 'life', 'A stop as time passes: what the clock stands at, the choices offered and the command each sends'],
    ['world.running-clock', 'src/engine/core/realclock.ts', 'createClockStepper', 'life', 'The clock running on its own at a speed, stepping the simulation in bounded steps'],
    ['world.zones', 'src/engine/core/time.ts', 'zoneAbbreviation', 'life', 'Each place’s time zone and the home zone: the bar’s clock, a call in another city’s own time'],
  ];
  for (const [id, file, symbol, area, purpose] of world) out.push({ id, kind: 'mechanic', area, where: `${file}, ${symbol}`, purpose, holds: [file, symbol] });
  return out;
}

/** Every feature, by id: the effects matrix's rows and promises, and the extras. */
export function features() {
  const out = new Map();
  for (const f of readdirSync(EFFECTS).filter((f) => f.endsWith('.json'))) {
    const j = JSON.parse(read(`${EFFECTS}/${f}`));
    for (const r of j.rows) out.set(r.id, { id: r.id, kind: r.kind, area: r.area ?? j.area, mechanic: r.mechanic, where: r.where, purpose: r.purpose ?? r.changes, effects: r.status, readAt: r.readAt, tests: r.evidence?.tests ?? [] });
    for (const p of j.promises ?? []) out.set(p.id, { id: p.id, kind: 'promise', area: j.area, mechanic: false, where: p.entryFile ?? '', purpose: p.claim, effects: p.status, tests: p.tests ?? [] });
  }
  for (const x of extras()) out.set(x.id, { ...x, effects: '' });
  return out;
}

function loadEntries() {
  const out = new Map();
  if (!existsSync(ROWS)) return out;
  for (const f of readdirSync(ROWS).filter((f) => f.endsWith('.json'))) for (const [id, e] of Object.entries(JSON.parse(read(`${ROWS}/${f}`)))) out.set(id, { ...e, file: f });
  return out;
}
function saveEntries(entries, all) {
  mkdirSync(ROWS, { recursive: true });
  const byArea = Object.fromEntries(AREAS.map((a) => [a, {}]));
  for (const [id, e] of [...entries].sort(([a], [b]) => a.localeCompare(b))) {
    const area = all.get(id)?.area ?? e.file?.replace(/\.json$/, '') ?? 'guide';
    const { file, ...rest } = e;
    (byArea[area] ??= {})[id] = rest;
  }
  for (const [a, rows] of Object.entries(byArea)) if (Object.keys(rows).length || existsSync(`${ROWS}/${a}.json`)) writeFileSync(`${ROWS}/${a}.json`, JSON.stringify(rows, null, 1) + '\n');
}

/** An evidence item holds when what it names is there: a test the gate runs, a file under the sweep's folder, or a source line. */
function evidenceProblem(item) {
  const head = String(item).split(/\s/)[0].replace(/[:,;]$/, '');
  if (IN_GATE.test(head)) return existsSync(head) ? '' : `cites ${head}, which isn't there`;
  if (head.startsWith(DIR + '/')) return existsSync(head) ? '' : `cites ${head}, which isn't there`;
  const m = head.match(/^((?:src|tools|base44|tests)\/[\w./-]+?)(?::(\d+)(?:-(\d+))?)?$/);
  if (m) {
    if (!existsSync(m[1])) return `cites ${m[1]}, which isn't there`;
    if (m[2]) { const lines = read(m[1]).split('\n').length; if (Number(m[3] ?? m[2]) > lines) return `cites ${head}, past the file's ${lines} lines`; }
    return '';
  }
  return `evidence "${String(item).slice(0, 60)}" names no test, measurement or source line first`;
}

export function problems() {
  const all = features();
  const entries = loadEntries();
  const out = [];
  for (const [id, f] of all) if (!entries.has(id)) out.push(`${f.area} ${id}: no entry (node tools/sweep.mjs --seed, then --mark)`);
  for (const [id, e] of entries) {
    const where = `${e.file} ${id}`;
    const f = all.get(id);
    if (!f) { out.push(`${where}: no such feature in the code`); continue; }
    if (f.holds && !exportsSymbol(...f.holds)) out.push(`${where}: ${f.holds[0]} no longer exports ${f.holds[1]}`);
    if (!STATUSES.includes(e.status)) out.push(`${where}: status "${e.status}" isn't one of the six`);
    const by = Array.isArray(e.by) ? e.by : e.by ? [e.by] : [];
    if (e.status !== 'Not Tested' && (!by.length || by.some((b) => !BY.includes(b)))) out.push(`${where}: by says inspection, automated or interactive`);
    if (['Verified', 'Fixed And Verified'].includes(e.status)) {
      const ev = Array.isArray(e.evidence) ? e.evidence : e.evidence ? [e.evidence] : [];
      if (!ev.length) out.push(`${where}: ${e.status} with no evidence`);
      for (const item of ev) { const p = evidenceProblem(item); if (p) out.push(`${where}: ${p}`); }
      if (by.includes('automated') && !ev.some((i) => IN_GATE.test(String(i).split(/\s/)[0]))) out.push(`${where}: automated, and no evidence is a test the gate runs`);
      if (!(e.on ?? '').trim()) out.push(`${where}: says the commit it was read or played on (on)`);
    }
    if (e.status === 'Fixed And Verified' && !(e.fixed ?? '').trim()) out.push(`${where}: Fixed And Verified says what was fixed (fixed)`);
    if (e.status === 'Deferred' && !/defer/i.test(e.note ?? '')) out.push(`${where}: Deferred says who deferred it (note)`);
    if (['Failed', 'Blocked'].includes(e.status) && !(e.note ?? '').trim()) out.push(`${where}: ${e.status} says what was found (note)`);
  }
  return out;
}

function totals(ids, entries) {
  const t = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const by = Object.fromEntries(BY.map((b) => [b, 0]));
  for (const id of ids) { const e = entries.get(id); const s = e && STATUSES.includes(e.status) ? e.status : 'Not Tested'; t[s] += 1; for (const b of e?.by ?? []) if (by[b] !== undefined) by[b] += 1; }
  const done = t.Verified + t['Fixed And Verified'];
  const inScope = ids.length - t.Deferred;
  return { t, by, done, inScope };
}
const pct = (a, b) => (b ? `${((100 * a) / b).toFixed(1)}%` : '—');
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const short = (s, n = 140) => { const c = cell(s); return c.length > n ? `${c.slice(0, n - 1)}…` : c; };

export function page() {
  const all = features();
  const entries = loadEntries();
  const ids = [...all.keys()];
  const a = totals(ids, entries);
  const lines = [
    '# The Connectivity Sweep’s Register',
    '',
    'Written by `node tools/sweep.mjs --write` from `register/*.json` and the feature-to-effect matrix; don’t edit it by hand. One row a',
    'feature the game has (the owner’s brief 26, 2026-10-24, §2 and §11), found in the code: the feature-to-effect matrix’s rows and',
    'promises (`../audit-2026-10-21/EFFECTS.md`, held to the code by the gate), and the techniques, genres, Profile sections, places,',
    'persistence and world mechanics that matrix has no row for. Each carries the sweep’s own status, how it was verified (by reading the',
    'code, by a test the gate runs, by playing the built app), the commit, the evidence and what was found. Only Verified and Fixed And',
    'Verified count as done, out of every row not Deferred. Not Tested is the honest default: nothing is counted done for having a row.',
    '',
    `**Coverage:** ${a.done} of ${a.inScope} in scope Verified or Fixed And Verified (${pct(a.done, a.inScope)}); ${STATUSES.map((s) => `${a.t[s]} ${s}`).join(', ')}. By ${BY.map((b) => `${b} ${a.by[b]}`).join(', ')}.`,
    '',
    '## Totals',
    '',
    `| Area | Rows | ${STATUSES.join(' | ')} | Inspection | Automated | Interactive |`,
    `|---|---|${STATUSES.map(() => '---').join('|')}|---|---|---|`,
  ];
  for (const area of AREAS) {
    const rs = ids.filter((id) => all.get(id).area === area);
    if (!rs.length) continue;
    const t = totals(rs, entries);
    lines.push(`| ${area} | ${rs.length} | ${STATUSES.map((s) => t.t[s] || '').join(' | ')} | ${t.by.inspection || ''} | ${t.by.automated || ''} | ${t.by.interactive || ''} |`);
  }
  lines.push(`| **All** | **${ids.length}** | ${STATUSES.map((s) => `**${a.t[s]}**`).join(' | ')} | **${a.by.inspection}** | **${a.by.automated}** | **${a.by.interactive}** |`, '');
  for (const area of AREAS) {
    const rs = ids.filter((id) => all.get(id).area === area);
    if (!rs.length) continue;
    lines.push(`## ${area[0].toUpperCase()}${area.slice(1)}`, '', '| Feature | Kind | Where | Effects matrix | Sweep | By | On | Evidence | Found |', '|---|---|---|---|---|---|---|---|---|');
    for (const id of rs) {
      const f = all.get(id); const e = entries.get(id);
      const ev = Array.isArray(e?.evidence) ? e.evidence : e?.evidence ? [e.evidence] : [];
      lines.push(`| \`${id}\` | ${f.kind} | ${short(f.where, 120)} | ${f.effects || '—'} | ${e?.status ?? 'Not Tested'} | ${(e?.by ?? []).join(', ')} | ${e?.on ?? ''} | ${short(ev.join('; '), 220)} | ${short([e?.fixed, e?.note].filter(Boolean).join(' '), 260)} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function seed() {
  const all = features();
  const entries = loadEntries();
  let n = 0;
  for (const id of all.keys()) if (!entries.has(id)) { entries.set(id, { status: 'Not Tested' }); n += 1; }
  saveEntries(entries, all);
  console.log(`seeded ${n} entries, ${entries.size} in all`);
}

function mark(args) {
  const all = features();
  const entries = loadEntries();
  const pattern = args[args.indexOf('--mark') + 1];
  const status = args[args.indexOf('--mark') + 2];
  if (!STATUSES.includes(status)) throw new Error(`status "${status}" isn't one of ${STATUSES.join(', ')}`);
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const evidence = args.flatMap((a, i) => (a === '--evidence' ? [args[i + 1]] : []));
  const by = (opt('--by') ?? '').split(',').filter(Boolean);
  const re = new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
  const ids = [...all.keys()].filter((id) => re.test(id));
  if (!ids.length) throw new Error(`no feature matches ${pattern}`);
  const withTests = args.includes('--with-tests');
  for (const id of ids) {
    const prev = entries.get(id) ?? {};
    const own = withTests ? (all.get(id).tests ?? []).filter((t) => IN_GATE.test(t) && existsSync(t)) : [];
    const ev = [...own, ...evidence];
    entries.set(id, { ...prev, status, by: by.length ? by : prev.by, on: opt('--on') ?? prev.on, note: opt('--note') ?? prev.note, evidence: ev.length ? ev : prev.evidence, fixed: opt('--fixed') ?? prev.fixed });
  }
  saveEntries(entries, all);
  console.log(`${ids.length} marked ${status}${by.length ? ` by ${by.join(', ')}` : ''}`);
}

const args = process.argv.slice(2);
const asCommand = process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;
if (!asCommand) { /* imported */ }
else if (args.includes('--seed')) seed();
else if (args.includes('--mark')) mark(args);
else if (args.includes('--write')) { mkdirSync(DIR, { recursive: true }); writeFileSync(PAGE, page()); console.log(`wrote ${PAGE}`); }
else if (args.includes('--todo')) {
  const area = args[args.indexOf('--todo') + 1];
  const all = features(); const entries = loadEntries();
  for (const [id, f] of all) if ((!entries.get(id) || entries.get(id).status === 'Not Tested') && (!area || area.startsWith('--') || f.area === area)) console.log(`${f.area} ${f.kind} ${id}`);
} else if (args.includes('--check')) {
  const out = problems();
  if (!existsSync(PAGE)) out.push(`${PAGE} isn't written: node tools/sweep.mjs --write`);
  else if (read(PAGE) !== page()) out.push(`${PAGE} is behind the entries: node tools/sweep.mjs --write`);
  for (const p of args.includes('--all') ? out : out.slice(0, 200)) console.log(p);
  console.log(out.length ? `sweep: ${out.length} problem${out.length === 1 ? '' : 's'}` : 'sweep: every feature in the code has a row with a status');
  process.exitCode = out.length ? 1 : 0;
} else {
  const all = features(); const entries = loadEntries();
  const counts = {};
  for (const [, f] of all) counts[f.kind] = (counts[f.kind] ?? 0) + 1;
  const a = totals([...all.keys()], entries);
  console.log(`${all.size} features:`, counts);
  console.log(`${a.done} of ${a.inScope} in scope verified; ${STATUSES.map((s) => `${a.t[s]} ${s}`).join(', ')}`);
}
