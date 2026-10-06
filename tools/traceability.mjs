/**
 * The traceable inventory (the owner's audit of 2026-10-06, §2): every player
 * command and every scheduled kind, read from the code, with how it's found,
 * what it refuses, what it changes, what it sets going later, and what proves
 * it; written to docs/TRACEABILITY.md, and checked by the gate against the
 * code so it can't drift.
 *
 * The statuses are the owner's, worked out from the evidence, never typed:
 *
 * - **Verified (journey)**: offered on a screen, and run in a connected
 *   journey that saves, loads and checks every law of the world
 *   (`core/invariants.ts`) at its end. What the screen shows of it is not
 *   machine-tested: SLATE has no tests of its screens.
 * - **Implemented But Unverified**: offered on a screen and run by a test, but
 *   in no connected journey.
 * - **Partially Implemented**: handled, but no screen offers it, or no test
 *   runs it.
 *
 *   node tools/traceability.mjs --write    write the document
 *   node tools/traceability.mjs            check it's current
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OUT = 'docs/TRACEABILITY.md';
const files = execSync('git ls-files --cached --others --exclude-standard "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' }).split('\n').filter(Boolean);
const src = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));
const tests = readdirSync('tests').filter((f) => f.endsWith('.test.ts')).map((f) => [f, readFileSync(`tests/${f}`, 'utf8')]);
const JOURNEYS = new Set(tests.filter(([f, s]) => /^(journey|journeys|connected-day)/.test(f) && s.includes('breaches(sim.universe)')).map(([f]) => f));

// The developer map's columns: screens and guide chapter, by command.
const devmap = new Map();
for (const l of readFileSync('docs/DEVMAP.md', 'utf8').split('\n')) {
  if (!l.startsWith('| `')) continue;
  const c = l.slice(1, -1).split(' | ').map((x) => x.trim());
  devmap.set(c[0].replace(/`/g, ''), { screens: c[2].replace(/`/g, ''), chapter: c[4] });
}

/** A handler's text: from its registration to the next registration in its file. */
function handlers(pattern) {
  const out = new Map();
  for (const [f, s] of src) {
    // The simulation's own generic registration isn't a command.
    if (!f.startsWith('src/engine/') || f === 'src/engine/core/simulation.ts') continue;
    const re = new RegExp(pattern, 'g');
    const hits = [...s.matchAll(re)];
    hits.forEach((m, i) => {
      const end = hits[i + 1]?.index ?? s.indexOf('\nexport ', m.index + 1);
      out.set(m[1], { file: f, body: s.slice(m.index, end > m.index ? end : s.length) });
    });
  }
  return out;
}
const kindConsts = new Map();
for (const [, s] of src) for (const m of s.matchAll(/export const (\w+_KIND)\s*=\s*'([\w.]+)'/g)) kindConsts.set(m[1], m[2]);
// Registered by its name or by a constant holding it (`tutorial.read` is `READ_KIND`).
const commands = new Map([...handlers("onCommand<[\\s\\S]*?>\\(\\s*([\\w.']+)")].map(([k, v]) => [kindConsts.get(k) ?? k.replace(/'/g, ''), v]));
const scheduled = handlers('onSchedule\\(\\s*([\\w.\']+)');
const schedKinds = new Map();
for (const [k, v] of scheduled) schedKinds.set(kindConsts.get(k) ?? k.replace(/'/g, ''), v);

const uniq = (xs) => [...new Set(xs)];
const cell = (xs, max = 6) => (xs.length ? xs.slice(0, max).join('; ') + (xs.length > max ? `; and ${xs.length - max} more` : '') : '—');
const esc = (s) => s.replace(/\|/g, '/').replace(/\s+/g, ' ');

function facts(body) {
  const refusals = uniq([...body.matchAll(/CommandError\(\s*(['`])([\s\S]*?)\1/g)].map((m) => m[2].replace(/\$\{[^}]*\}/g, '…').slice(0, 90)));
  const checks = uniq([...body.matchAll(/\b(\w+Refusal)\(/g)].map((m) => m[1]));
  const changes = uniq([...body.matchAll(/\b(?:person|p|player|s\.player|sim\.player|owned|v|booking|career|home|item|order)\.(\w+)\s*(?:=(?!=)|\?\?=|\+=|-=)/g)].map((m) => m[1]));
  const pushes = uniq([...body.matchAll(/(\w+)\((?:s|sim)?[^)]*\)\.push\(|\.(\w+)\.push\(/g)].map((m) => m[2] ?? m[1]).filter(Boolean));
  const money = /payFromBank|\bspend\(|\.post\(|chargeCard|drawFromBank/.test(body);
  const later = uniq([...body.matchAll(/kind:\s*(\w+_KIND|'[\w.]+')/g)].map((m) => kindConsts.get(m[1]) ?? m[1].replace(/'/g, '')));
  return { refusals, checks, changes: uniq([...changes, ...pushes.map((x) => `${x} (added to)`)]), money, later };
}

const named = (kind) => tests.filter(([, s]) => s.includes(`'${kind}'`)).map(([f]) => f);
const rows = [];
let tally = { 'Verified (journey)': 0, 'Implemented But Unverified': 0, 'Partially Implemented': 0 };
for (const kind of [...commands.keys()].sort()) {
  const { file, body } = commands.get(kind);
  const f = facts(body);
  const d = devmap.get(kind) ?? { screens: '', chapter: '' };
  const inTests = named(kind);
  const inJourneys = inTests.filter((t) => JOURNEYS.has(t));
  const onScreen = d.screens && d.screens !== '—';
  const status = !onScreen || !inTests.length ? 'Partially Implemented' : inJourneys.length ? 'Verified (journey)' : 'Implemented But Unverified';
  tally[status] += 1;
  rows.push(`| \`${kind}\` | ${status} | ${esc(d.chapter || '—')} | ${esc(d.screens || '—')} | \`${file.replace('src/engine/', '')}\` | ${esc(cell(f.refusals, 4))}${f.checks.length ? ` (also ${f.checks.join(', ')})` : ''} | ${esc(cell(f.changes, 5))} | ${f.money ? 'Yes' : '—'} | ${esc(cell(f.later, 4))} | ${inTests.length} | ${esc(cell(inJourneys, 3))} |`);
}

const sched = [];
for (const kind of [...schedKinds.keys()].sort()) {
  const { file, body } = schedKinds.get(kind);
  const f = facts(body);
  const by = uniq([...src].filter(([, s]) => s.includes(`kind: ${[...kindConsts].find(([, v]) => v === kind)?.[0] ?? '\u0000'}`) || s.includes(`kind: '${kind}'`)).map(([fl]) => fl.replace(/^src\/engine\//, '')));
  const inTests = named(kind).length + tests.filter(([, s]) => [...kindConsts].some(([c, v]) => v === kind && s.includes(c))).length;
  sched.push(`| \`${kind}\` | \`${file.replace('src/engine/', '')}\` | ${esc(cell(by, 3))} | ${esc(cell(f.changes, 5))} | ${f.money ? 'Yes' : '—'} | ${esc(cell(f.later, 3))} | ${inTests} |`);
}

const text = `# Traceability

Written by \`tools/traceability.mjs\` from the code, and checked by the gate; don't edit by hand. The owner's audit of
2026-10-06 (§2): every player command and every scheduled kind, how it's found and reached, what it refuses, what it
changes, whether it moves money, what it sets going later, and what proves it.

How it's read. **Chapter** is the guide chapter that opens it, which is how a player finds it; **Screens** are the
screens that run it. **Refuses** are the handler's own refusals, in the words the player sees (\`…\` where a value is
put in), and the refusal checks it calls. **Changes** are the fields it sets on what it acts on. **Money** says it
moves money through the ledger. **Later** are the scheduled kinds it sets going: its delayed consequences. **Tests**
counts the test files that name it; **Journeys** are the connected journeys that run it, save and load, and check
every law of the world (\`core/invariants.ts\`) at their end.

The statuses are worked out from that evidence, never typed. **Verified (journey)**: on a screen, and in a connected
journey. **Implemented But Unverified**: on a screen and tested, but in no connected journey. **Partially
Implemented**: no screen offers it, or no test runs it. No status here says a screen was checked in the running app:
SLATE has no tests of its screens, and nothing is deployed.

${Object.entries(tally).map(([k, v]) => `- ${k}: ${v}`).join('\n')}
- Commands in all: ${rows.length}

## Commands

| Command | Status | Chapter | Screens | Handled In | Refuses | Changes | Money | Later | Tests | Journeys |
|---|---|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

## Scheduled kinds

What time sets off: each kind, the file that handles it, the files that schedule it, what it changes, whether it moves
money, what it sets going next, and how many test files name it or its constant.

| Kind | Handled In | Scheduled By | Changes | Money | Later | Tests |
|---|---|---|---|---|---|---|
${sched.join('\n')}
`;

if (process.argv.includes('--write')) {
  writeFileSync(OUT, text);
  console.log(`Wrote ${OUT}: ${rows.length} commands (${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(', ')}), ${sched.length} scheduled kinds.`);
} else {
  const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (now !== text) { console.log(`${OUT} is behind the code: run node tools/traceability.mjs --write`); process.exit(1); }
  console.log(`${OUT} matches the code: ${rows.length} commands, ${sched.length} scheduled kinds.`);
}
