#!/usr/bin/env node
/**
 * Brief 27's lifecycle matrix (loop 55: "Create a lifecycle matrix mapping every supported loop to: Code. Entry screen.
 * Decisions. States and transitions. Immediate effects. Downstream consumers. Timed events. Exit and recovery paths.
 * Save/load behavior. Tests and interactive evidence"), written from `lifecycle.json` and the feature-to-effect matrix.
 *
 * Each loop's row in `lifecycle.json` names the features that carry it (each an effects row's id) and says, in its own
 * words, what the player decides, the states it moves through, what comes on the clock and the ways out. The rest is
 * joined from those features' effects rows (`../../audit-2026-10-21/effects/*.json`), never typed twice: the entry
 * screen from each row's `where`, the immediate effects from `changes`, the consumers from `consumers`, save and load from
 * `saveLoad`, and the tests from `evidence.tests`. So a loop's row says what the code's rows say.
 *
 *   node lifecycle.mjs           writes LIFECYCLE.md
 *   node lifecycle.mjs --check   exits 1 on a feature with no effects row, a test or document that isn't there, a status
 *                                not one of the owner's seven, a loop missing or twice, or a LIFECYCLE.md behind the rows
 *
 * Not one of the gate's checks: brief 27's F runs it, and its receipt says what it found.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../..');
const EFFECTS = join(ROOT, 'docs/verification/audit-2026-10-21/effects');
const STATUSES = ['Implemented And Verified', 'Implemented, Verification Incomplete', 'Partially Implemented', 'Not Implemented', 'Blocked Externally', 'Decision Required', 'Explicitly Deferred'];

const rows = new Map();
for (const f of readdirSync(EFFECTS).filter((x) => x.endsWith('.json'))) for (const r of JSON.parse(readFileSync(join(EFFECTS, f), 'utf8')).rows) rows.set(r.id, r);
const loops = JSON.parse(readFileSync(join(HERE, 'lifecycle.json'), 'utf8')).loops;

const problems = [];
const seen = new Set();
for (const l of loops) {
  if (seen.has(l.loop)) problems.push(`loop ${l.loop}: twice`);
  seen.add(l.loop);
  if (!STATUSES.includes(l.status)) problems.push(`loop ${l.loop}: status ${l.status} is not one of the owner's seven`);
  if (l.status !== 'Implemented And Verified' && !l.why) problems.push(`loop ${l.loop}: ${l.status} with no why`);
  for (const f of l.features) if (!rows.has(f)) problems.push(`loop ${l.loop}: no effects row ${f}`);
  for (const t of [...l.tests, ...l.docs]) if (!existsSync(join(ROOT, t))) problems.push(`loop ${l.loop}: no file ${t}`);
  if (!l.features.length && !l.tests.length && !l.docs.length) problems.push(`loop ${l.loop}: nothing carries it`);
  for (const k of ['decisions', 'states', 'timed', 'exits']) if (!l[k]) problems.push(`loop ${l.loop}: no ${k}`);
}
for (let n = 1; n <= 56; n += 1) if (!seen.has(n)) problems.push(`loop ${n}: missing`);

const uniq = (xs) => [...new Set(xs.filter(Boolean))];
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const count = (s) => loops.filter((l) => l.status === s).length;
const out = [
  '# The Lifecycle Matrix (Brief 27, Loop 55)',
  '',
  'Written by `lifecycle.mjs` from `lifecycle.json` and the feature-to-effect matrix (`../../audit-2026-10-21/effects/`): each',
  'of the supplement\'s 56 loops, the features that carry it, and, joined from those features\' own rows, where the player',
  'meets it, what it changes at once, what reads it later, how it saves and loads, and its tests. What the player decides,',
  'the states, what comes on the clock and the ways out are the loop\'s own row. A status is one of the owner\'s seven.',
  '',
  `**The loops:** ${STATUSES.map((s) => `${s} ${count(s)}`).join(', ')}.`,
  '',
];
for (const l of loops.sort((a, b) => a.loop - b.loop)) {
  const fr = l.features.map((f) => rows.get(f)).filter(Boolean);
  const tests = uniq([...l.tests, ...fr.flatMap((r) => r.evidence?.tests ?? [])]).filter((t) => existsSync(join(ROOT, t)));
  out.push(`## ${l.loop}. ${l.title}`, '', `**Status:** ${l.status}${l.why ? `. ${l.why}` : ''}`, '');
  out.push(`- **Code (features):** ${l.features.length ? l.features.map((f) => `\`${f}\``).join(', ') : 'none of its own'}`);
  out.push(`- **Entry:** ${cell(uniq([l.entry, ...fr.map((r) => r.where)]).join(' / ') || '—')}`);
  out.push(`- **Decisions:** ${cell(l.decisions)}`);
  out.push(`- **States and transitions:** ${cell(l.states)}`);
  out.push(`- **Immediate effects:** ${cell(uniq(fr.map((r) => r.changes)).join(' / ') || l.effects || '—')}`);
  out.push(`- **Downstream consumers:** ${cell(uniq(fr.flatMap((r) => (r.consumers ?? []).map((c) => `${c.what} (${c.at})`))).join('; ') || l.consumers || 'none named')}`);
  out.push(`- **Timed events:** ${cell(l.timed)}`);
  out.push(`- **Exit and recovery:** ${cell(l.exits)}`);
  out.push(`- **Save and load:** ${cell(uniq(fr.map((r) => r.saveLoad)).join(' / ') || l.saveLoad || '—')}`);
  out.push(`- **Tests and evidence:** ${[...tests.map((t) => `\`${t}\``), ...l.docs.map((d) => `\`${d}\``)].join(', ') || 'none'}`);
  if (l.notBuilt) out.push(`- **Not built, said why:** ${cell(l.notBuilt)}`);
  out.push('');
}
const text = `${out.join('\n')}`;
const PAGE = join(HERE, 'LIFECYCLE.md');
if (process.argv.includes('--check')) {
  if (!existsSync(PAGE) || readFileSync(PAGE, 'utf8') !== text) problems.push('LIFECYCLE.md is behind the rows: node lifecycle.mjs');
  for (const p of problems) console.log(p);
  console.log(problems.length ? `lifecycle: ${problems.length} problems` : `lifecycle: 56 loops, each carried and each status the owner's; ${STATUSES.map((s) => `${s} ${count(s)}`).join(', ')}`);
  process.exit(problems.length ? 1 : 0);
}
for (const p of problems) console.log(p);
writeFileSync(PAGE, text);
console.log(`wrote LIFECYCLE.md: ${STATUSES.map((s) => `${s} ${count(s)}`).join(', ')}${problems.length ? `; ${problems.length} problems` : ''}`);
