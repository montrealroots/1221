#!/usr/bin/env node
/**
 * The developer map (Stage 15 of docs/BACKLOG.md, from 2026-10-01), read
 * from the code: each command the player can run, the engine file that
 * handles it, the screens that run it, the tests that run it, and the
 * guide's chapter that opens it.
 *
 *   node tools/devmap.mjs --write   writes docs/DEVMAP.md
 *   node tools/devmap.mjs --check   fails where the doc is behind the code
 *
 * A command no test runs is said so in the map: it's the list to work down,
 * not a figure to hide.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';

const OUT = 'docs/DEVMAP.md';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = `${dir}/${name}`;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(full)) out.push(full);
  }
  return out;
}

const read = (f) => readFileSync(f, 'utf8');
const engine = walk('src/engine');
const ui = walk('src/ui').concat(walk('src/app'));
const tests = walk('tests');

// Each command and the file that registers it, read as tools/inventory.mjs reads them: a kind is a literal or a named constant.
const named = new Map();
for (const f of engine) for (const m of read(f).matchAll(/const ([A-Z][A-Z0-9_]*) = '([a-z0-9_]+\.[a-z0-9_]+)'/g)) named.set(m[1], m[2]);
const kindOf = (token) => (token.startsWith("'") ? token.slice(1, -1) : named.get(token));
const commands = new Map();
for (const f of [...engine].sort()) {
  for (const m of read(f).matchAll(/onCommand(?:<[^(]*?>)?\(\s*('[a-z0-9_.]+'|[A-Z][A-Z0-9_]*)/gs)) {
    const kind = kindOf(m[1]);
    if (kind && !commands.has(kind)) commands.set(kind, f);
  }
}

// The guide's chapters, and the commands each opens.
const tutorial = read('src/engine/content/tutorial.ts');
const chapterOf = new Map();
for (const m of tutorial.matchAll(/title: '((?:[^'\\]|\\.)*)',[\s\S]*?opens: \[([^\]]*)\]/g)) {
  for (const k of m[2].matchAll(/'([a-z_.]+)'/g)) if (!chapterOf.has(k[1])) chapterOf.set(k[1], m[1].replace(/\\'/g, "'"));
}

const quoted = (kind) => new RegExp(`['"\`]${kind.replace(/\./g, '\\.')}['"\`]`);
// By the kind's own words, or by the constant that holds it (from 2026-10-06; until then the guide's `READ_KIND` in
// `Guide.tsx` went uncounted and `tutorial.read` was listed as on no screen).
const constOf = (kind) => [...named].filter(([, v]) => v === kind).map(([c]) => new RegExp(`\\b${c}\\b`));
const usedIn = (files, kind) => files.filter((f) => { const s = read(f); return quoted(kind).test(s) || constOf(kind).some((re) => re.test(s)); }).map((f) => f.split('/').pop()).sort();

const groups = new Map();
for (const [kind, file] of [...commands.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const prefix = kind.split('.')[0];
  if (!groups.has(prefix)) groups.set(prefix, []);
  groups.get(prefix).push({ kind, file, screens: usedIn(ui, kind), tests: usedIn(tests, kind), chapter: chapterOf.get(kind) ?? null });
}

const all = [...groups.values()].flat();
const untested = all.filter((c) => c.tests.length === 0);
const lines = [
  '# The Developer Map',
  '',
  'Built by `tools/devmap.mjs --write` from the code, and checked by the gate (`--check`). Don’t edit by hand.',
  '',
  'Each command the player can run: the engine file that handles it, the screens that run it, the tests that run it, and the guide’s chapter that opens it. A test counts where it names the command; a command a test reaches only through another isn’t counted.',
  '',
  `${all.length} commands; ${all.length - untested.length} named by a test, ${untested.length} not.`,
  '',
];
for (const [prefix, list] of groups) {
  lines.push(`## ${prefix}`, '', '| Command | Handled In | Screens | Tests | Guide Chapter |', '|---|---|---|---|---|');
  for (const c of list) lines.push(`| \`${c.kind}\` | \`${c.file}\` | ${c.screens.map((s) => `\`${s}\``).join(' ') || '—'} | ${c.tests.map((s) => `\`${s}\``).join(' ') || '**none**'} | ${c.chapter ?? '—'} |`);
  lines.push('');
}
const doc = lines.join('\n');

if (process.argv.includes('--write')) {
  writeFileSync(OUT, doc);
  console.log(`${OUT}: ${all.length} commands, ${untested.length} not named by a test.`);
} else if (process.argv.includes('--check')) {
  let current = '';
  try { current = read(OUT); } catch { /* missing */ }
  if (current !== doc) {
    console.log(`${OUT} is behind the code. Run: node tools/devmap.mjs --write`);
    process.exit(1);
  }
  console.log(`${OUT} matches the code: ${all.length} commands.`);
} else {
  console.log(`${all.length} commands, ${untested.length} not named by a test:`);
  for (const c of untested) console.log(`  ${c.kind}  (${c.file})`);
}
