/**
 * The gameplay coverage matrix (from 2026-10-10): every retained feature the audit of that day traced, in
 * `docs/verification/audit/<area>.json`, from its entry through what it reads and changes to what consumes it, how it's
 * explained and what tests it, with its status as the repairs left it. Writes `docs/GAMEPLAY-COVERAGE.md`; the totals
 * are counted from the items, never typed.
 *
 *   node tools/coverage.mjs           writes docs/GAMEPLAY-COVERAGE.md
 *   node tools/coverage.mjs --check   fails when the page is behind the JSON
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const AREAS = [
  ['life', 'Life, Health And Time'],
  ['school', 'School'],
  ['money', 'Money'],
  ['papers', 'Papers'],
  ['ui', 'Creation, Profile, Home And The Looks'],
];
const ORDER = ['verified', 'partial', 'unresolved', 'informational'];
const cell = (v) => (v === undefined || v === null || v === '' ? '—' : String(Array.isArray(v) ? v.join('; ') : v).replace(/\|/g, '/').replace(/\n/g, ' '));

const totals = Object.fromEntries(ORDER.map((s) => [s, 0]));
const sections = [];
const rows = [];
for (const [area, title] of AREAS) {
  const a = JSON.parse(readFileSync(`docs/verification/audit/${area}.json`, 'utf8'));
  const count = Object.fromEntries(ORDER.map((s) => [s, 0]));
  for (const i of a.items) { count[i.status] = (count[i.status] ?? 0) + 1; totals[i.status] = (totals[i.status] ?? 0) + 1; }
  rows.push([title, a.items.length, ...ORDER.map((s) => count[s])]);
  const body = [
    `## ${title}`, '',
    `${a.items.length} items: ${ORDER.map((s) => `${count[s]} ${s}`).join(', ')}.`, '',
    '| Item | Kind | Entry | Reads | Changes | Downstream | Persists | Explained | Tested by | Status | Note |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...[...a.items].sort((x, y) => ORDER.indexOf(x.status) - ORDER.indexOf(y.status)).map((i) => `| ${cell(i.id)} | ${cell(i.kind)} | ${cell(i.entry)} | ${cell(i.reads)} | ${cell(i.changes)} | ${cell(i.downstream)} | ${cell(i.persistent)} | ${cell(i.explanation)} | ${cell(i.tests)} | ${i.status}${i.auditStatus && i.auditStatus !== i.status ? ` (was ${i.auditStatus})` : ''} | ${cell(i.settled ?? i.issue)} |`),
    '',
  ];
  sections.push(body.join('\n'));
}
const all = Object.values(totals).reduce((a, b) => a + b, 0);
const page = [
  '# Gameplay Coverage',
  '',
  'Every retained feature traced from where the player meets it to what it changes and who reads the change: entry, preconditions and state read, the calculation and the state changed, the downstream consumer, what persists, how it is explained, and what tests it. Audited on 2026-10-10 against `43d10f8b`; each status is as the repairs of that day left it, and an item whose status moved says what it was. Written by `node tools/coverage.mjs` from `docs/verification/audit/*.json`.',
  '',
  '**Verified**: traced end to end, and a test exercises it. Mutation-tested only where a repair’s commit says so; the rest were traced, not mutated. **Partial**: works, with a named gap (untested, or a consumer missing). **Unresolved**: declared or reachable only through systems the owner removed, reported rather than deleted. **Informational**: said back to the player and meant to decide nothing (a name, a portrait).',
  '',
  `## Totals`,
  '',
  '| Area | Items | Verified | Partial | Unresolved | Informational |',
  '|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.join(' | ')} |`),
  `| **All** | **${all}** | **${totals.verified}** | **${totals.partial}** | **${totals.unresolved}** | **${totals.informational}** |`,
  '',
  ...sections,
].join('\n');

const path = 'docs/GAMEPLAY-COVERAGE.md';
if (process.argv.includes('--check')) {
  if (!existsSync(path) || readFileSync(path, 'utf8') !== `${page}\n`) { console.error(`${path} is behind the audit: run node tools/coverage.mjs`); process.exit(1); }
  console.log(`${path} matches the audit: ${all} items.`);
} else {
  writeFileSync(path, `${page}\n`);
  console.log(`Wrote ${path}: ${all} items, ${ORDER.map((s) => `${totals[s]} ${s}`).join(', ')}.`);
}
