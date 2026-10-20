/**
 * SLATE — the text coverage matrix (from 2026-10-20, the owner's brief 17, "Final Comprehensive Writing And Continuity
 * Pass", section 2): each surface a player can reach that shows text, the sources it draws on, the states a player meets
 * it in, what reading it in context found, what changed, and the evidence the words were read where the player reads
 * them. The text inventory (`tools/text-inventory.mjs`) knows every source; this knows where each is met.
 *
 *   node tools/surfaces.mjs            writes docs/text/SURFACES.md from docs/text/surfaces/*.json
 *   node tools/surfaces.mjs --check    exits 1 on what's below
 *
 * A row is `{ surface, where, sources, states, outcome, why, changes, evidence }`:
 * - `sources`: inventory ids (`file#decl`), or a pattern ending in `*` (`src/ui/bank/BankCard.tsx#*`);
 * - `states`: from STATES, the brief's list (section 2);
 * - `outcome`: Revised (words changed in this pass; `changes` says what) or Kept (`why` says what it does well);
 * - `evidence`: `{ kind, ref }`, kind one of EVIDENCE; a `ref` is a path that exists, and for a test, `path: 'name'`
 *   whose name is in that file.
 *
 * `--check` fails a source of player text no row claims, a row whose source or pattern matches nothing, a state outside
 * the list, an outcome that isn't one of the two, a Revised row that says no change, a Kept row with no reason of eight
 * words, and a row with no evidence or with evidence that isn't there.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { inventory } from './text-inventory.mjs';

const DIR = 'docs/text/surfaces';
export const STATES = [
  'first use', 'ordinary', 'repeated', 'success', 'partial', 'setback', 'failure',
  'empty', 'unavailable', 'locked', 'overdue', 'error', 'confirmation', 'warning',
  'notification', 'details', 'recommendation', 'forecast', 'explanation',
  'teacher', 'director', 'classmate', 'history', 'returning', 'assembled',
];
export const EVIDENCE = ['test', 'transcript', 'screen', 'walk', 'run', 'source'];
const OUTCOMES = ['Revised', 'Kept'];

const args = process.argv.slice(2);
const sources = inventory();
const ids = new Set(sources.map((s) => s.id));
const snapshot = existsSync('docs/text/inventory.json') ? JSON.parse(readFileSync('docs/text/inventory.json', 'utf8')).sources : [];
const areaOf = new Map(snapshot.map((s) => [s.id, s.area2]));
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.json')).sort() : [];
const rows = files.flatMap((f) => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')).map((r, i) => ({ ...r, file: f, n: i + 1 })));

const matches = (pattern) => (pattern.endsWith('*') ? sources.filter((s) => s.id.startsWith(pattern.slice(0, -1))).map((s) => s.id) : ids.has(pattern) ? [pattern] : []);
const problems = [];
const claimed = new Map();
const testNames = new Map();
const testHas = (path, name) => {
  if (!testNames.has(path)) testNames.set(path, existsSync(path) ? readFileSync(path, 'utf8') : null);
  const t = testNames.get(path);
  return t !== null && (!name || t.includes(name));
};
for (const r of rows) {
  const at = `${r.file} row ${r.n} (${r.surface ?? 'no surface'})`;
  if (!r.surface || !r.where) problems.push(`${at}: a row names its surface and where the player meets it`);
  for (const p of r.sources ?? []) {
    const m = matches(p);
    if (!m.length) problems.push(`${at}: no source of player text is ${p}`);
    for (const id of m) (claimed.get(id) ?? claimed.set(id, []).get(id)).push(at);
  }
  if (!(r.sources ?? []).length) problems.push(`${at}: a row names the sources it draws on`);
  if (!(r.states ?? []).length) problems.push(`${at}: a row names the states it's met in`);
  for (const s of r.states ?? []) if (!STATES.includes(s)) problems.push(`${at}: "${s}" isn't a state the brief lists (${STATES.join(', ')})`);
  if (!OUTCOMES.includes(r.outcome)) problems.push(`${at}: the outcome is Revised or Kept, not "${r.outcome}"`);
  if (r.outcome === 'Revised' && !(r.changes ?? '').trim()) problems.push(`${at}: a Revised row says what changed`);
  if (r.outcome === 'Kept' && (r.why ?? '').trim().split(/\s+/).length < 8) problems.push(`${at}: a Kept row says, in at least eight words, what reading it in context found`);
  if (!(r.evidence ?? []).length) problems.push(`${at}: a row cites its evidence`);
  for (const e of r.evidence ?? []) {
    if (!EVIDENCE.includes(e.kind)) { problems.push(`${at}: evidence is one of ${EVIDENCE.join(', ')}, not "${e.kind}"`); continue; }
    const [path, ...rest] = String(e.ref ?? '').split(/:\s*'/);
    const name = rest.length ? rest.join(":'").replace(/'$/, '') : '';
    const file = path.replace(/:\d+(?:-\d+)?$/, '').trim();
    if (!file || !existsSync(file)) problems.push(`${at}: its ${e.kind} evidence, ${e.ref}, isn't there`);
    else if (e.kind === 'test' && name && !testHas(file, name)) problems.push(`${at}: ${file} has no test named '${name}'`);
  }
}
const unclaimed = sources.filter((s) => !claimed.has(s.id));
if (args.includes('--check')) {
  for (const s of unclaimed) problems.push(`${s.id} (${areaOf.get(s.id) ?? 'a new source'}): no surface claims it`);
}

const byArea = {};
for (const s of sources) {
  const a = areaOf.get(s.id) ?? 'new';
  const e = (byArea[a] ??= { sources: 0, claimed: 0 });
  e.sources += 1; if (claimed.has(s.id)) e.claimed += 1;
}
const md = ['# The Text Coverage Matrix', '',
  'Every surface a player can reach that shows text, written by `tools/surfaces.mjs` from `surfaces/*.json` (from 2026-10-20, the owner\'s brief 17, section 2). Each row says where the player meets it, the sources it draws on, the states it\'s met in, what reading it in context found, what changed, and the evidence. `--check` fails a source no row claims.', '',
  `**${rows.length} surfaces; ${sources.length - unclaimed.length} of ${sources.length} sources claimed; ${rows.filter((r) => r.outcome === 'Revised').length} revised, ${rows.filter((r) => r.outcome === 'Kept').length} kept.**`, '',
  '| Area | Sources | Claimed |', '|---|---|---|',
  ...Object.entries(byArea).sort().map(([a, e]) => `| ${a} | ${e.sources} | ${e.claimed} |`), ''];
for (const f of files) {
  md.push(`## ${f.replace(/\.json$/, '')}`, '', '| Surface | Where | States | Outcome | What reading it found, and what changed | Evidence |', '|---|---|---|---|---|---|');
  for (const r of rows.filter((x) => x.file === f)) {
    const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
    md.push(`| ${cell(r.surface)} | ${cell(r.where)} | ${cell((r.states ?? []).join(', '))} | ${r.outcome} | ${cell(r.why)}${r.changes ? ` **Changed:** ${cell(r.changes)}` : ''} | ${cell((r.evidence ?? []).map((e) => `${e.kind}: ${e.ref}`).join('; '))} |`);
  }
  md.push('');
}
if (!args.includes('--check')) writeFileSync('docs/text/SURFACES.md', `${md.join('\n')}\n`);
if (args.includes('--check')) {
  const current = existsSync('docs/text/SURFACES.md') ? readFileSync('docs/text/SURFACES.md', 'utf8') : '';
  if (current !== `${md.join('\n')}\n`) problems.push('docs/text/SURFACES.md isn’t the matrix as it stands: run node tools/surfaces.mjs');
}
console.log(`${rows.length} surfaces; ${sources.length - unclaimed.length} of ${sources.length} sources claimed; ${problems.length} problems.`);
for (const p of problems.slice(0, 60)) console.log(`  ${p}`);
if (problems.length > 60) console.log(`  … and ${problems.length - 60} more`);
if (args.includes('--check') && problems.length) process.exit(1);
