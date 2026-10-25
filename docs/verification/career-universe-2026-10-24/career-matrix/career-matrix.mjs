#!/usr/bin/env node
/**
 * Brief 27's career feature matrix (Part 20: "Career feature matrix ... For each feature record implementation, downstream
 * consumers, persistence, interface, tests, and evidence status"), kept apart from the foundation's completion matrix
 * (Area C: "Maintain separate accounting for: 1. The existing foundation matrix. 2. The new career expansion matrix").
 *
 * Nothing here is typed per feature. Each row is a career feature's row in the feature-to-effect matrix
 * (`../../audit-2026-10-21/effects/career.json`, and the Career screen's `ui.career*` rows in `guide.json`), which the
 * gate holds to the code (`tools/effects.mjs`). Joined to it: where each command or scheduled kind is handled
 * (`docs/TRACEABILITY.md`, which the gate writes from the code), and the connectivity sweep's status for it
 * (`../../sweep-2026-10-24/register/`). The interface is the row's `where`, the consumers its `consumers`, the persistence
 * its `saveLoad`, the tests its `evidence.tests`, and what's still missing its `missing`, said beside a verified status.
 *
 *   node career-matrix.mjs           writes CAREER-MATRIX.md
 *   node career-matrix.mjs --check   exits 1 on a CAREER-MATRIX.md behind the rows, or a feature with no sweep entry
 *
 * Not one of the gate's checks: brief 27's F runs it, and its receipt says what it found.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../..');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const career = read('docs/verification/audit-2026-10-21/effects/career.json');
const guide = read('docs/verification/audit-2026-10-21/effects/guide.json');
const rows = [...career.rows, ...guide.rows.filter((r) => r.id.startsWith('ui.career'))];
const sweep = { ...read('docs/verification/sweep-2026-10-24/register/career.json'), ...read('docs/verification/sweep-2026-10-24/register/guide.json') };

// Where each command and scheduled kind is handled, as the traceability page has it (its first column the id, in
// backticks, and its "Handled In" the fifth for commands).
const handled = new Map();
for (const line of readFileSync(join(ROOT, 'docs/TRACEABILITY.md'), 'utf8').split('\n')) {
  const m = line.match(/^\| `([\w.-]+)` \|/);
  if (!m) continue;
  const cells = line.split('|').map((c) => c.trim());
  const file = cells.find((c) => /^`(systems|world|ui|content)\/[\w./-]+`$/.test(c));
  if (file && !handled.has(m[1])) handled.set(m[1], file.replace(/`/g, ''));
}

const problems = [];
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const short = (s, n = 220) => { const t = cell(s); return t.length > n ? `${t.slice(0, n - 1)}…` : t; };
const by = (key) => rows.reduce((m, r) => { const k = key(r); m[k] = (m[k] ?? 0) + 1; return m; }, {});
for (const r of rows) if (!sweep[r.id]) problems.push(`${r.id}: no entry in the sweep's register`);
const effectsStatus = by((r) => r.status);
const sweepStatus = by((r) => sweep[r.id]?.status ?? 'No Entry');
const withGap = rows.filter((r) => r.missing && !/^None found\.?$/i.test(r.missing));
const kinds = by((r) => r.kind);

const out = [
  '# The Career Feature Matrix (Brief 27, Part 20)',
  '',
  'Written by `career-matrix.mjs` from the feature-to-effect matrix\'s career rows, which the gate holds to the code, with',
  'where each is handled (`docs/TRACEABILITY.md`) and the connectivity sweep\'s status (`../../sweep-2026-10-24/register/`).',
  'This is the career expansion\'s own accounting, apart from the foundation\'s completion matrix: completing either isn\'t',
  'completing the other (Area C).',
  '',
  `**Features:** ${rows.length} (${Object.entries(kinds).map(([k, v]) => `${v} ${k}`).join(', ')}).`,
  `**By the effects matrix:** ${Object.entries(effectsStatus).map(([k, v]) => `${k} ${v}`).join(', ')}.`,
  `**By the sweep's register:** ${Object.entries(sweepStatus).map(([k, v]) => `${k} ${v}`).join(', ')}.`,
  `**Verified, with something still missing said beside it:** ${withGap.length} of ${rows.length}; each says what in its Missing column.`,
  '',
  'The lifecycle matrix (`../lifecycle/LIFECYCLE.md`) reads the same rows loop by loop; the research register',
  '(`../research/REGISTER.md`) holds every real fact they rest on; the geographic coverage matrix',
  '(`../geography/`) every place they can happen.',
  '',
  '| Feature | Kind | Interface | Implementation | Downstream Consumers | Persistence | Tests | Effects Status | Sweep Status | Missing |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.sort((a, b) => a.id.localeCompare(b.id)).map((r) => `| \`${r.id}\` | ${r.kind} | ${short(r.where, 160)} | ${handled.get(r.id) ? `\`${handled.get(r.id)}\`` : '—'} | ${short((r.consumers ?? []).map((c) => `${c.what} (${c.at})`).join('; ') || 'none named', 260)} | ${short(r.saveLoad, 160)} | ${(r.evidence?.tests ?? []).map((t) => `\`${t}\``).join(', ') || '—'} | ${r.status} | ${sweep[r.id]?.status ?? 'No Entry'} | ${short(r.missing, 160)} |`),
  '',
];
const text = out.join('\n');
const PAGE = join(HERE, 'CAREER-MATRIX.md');
if (process.argv.includes('--check')) {
  if (!existsSync(PAGE) || readFileSync(PAGE, 'utf8') !== text) problems.push('CAREER-MATRIX.md is behind the rows: node career-matrix.mjs');
  for (const p of problems) console.log(p);
  console.log(problems.length ? `career matrix: ${problems.length} problems` : `career matrix: ${rows.length} features, each with its sweep status`);
  process.exit(problems.length ? 1 : 0);
}
for (const p of problems) console.log(p);
writeFileSync(PAGE, text);
console.log(`wrote CAREER-MATRIX.md: ${rows.length} features; ${Object.entries(effectsStatus).map(([k, v]) => `${k} ${v}`).join(', ')}; sweep ${Object.entries(sweepStatus).map(([k, v]) => `${k} ${v}`).join(', ')}; ${withGap.length} with a gap said`);
