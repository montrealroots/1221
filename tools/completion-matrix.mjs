/**
 * SLATE — the completion matrix (from 2026-10-16, the integration pass; the owner's brief "Implement SLATE’s Complete
 * Integration And Acceptance Pass", section 2). One traceable row for every requirement the pass is judged by, each
 * with the player's goal and entry point, the preconditions, the state read, the decisions, the validation and costs,
 * the changes and what they set going, the systems reached, what the player sees and can drill into, save and load,
 * failure and recovery, where it's implemented, its evidence and its status.
 *
 * Nothing in it is typed twice. A command's row is joined from what the gate already holds to the code:
 * `docs/TRACEABILITY.md` (its refusals in the player's words, what it changes, whether it moves money, what it sets
 * going, its screens and guide chapter), `docs/capabilities.json` (its capability's goal, entry, preconditions, costs,
 * what persists and who reads it), and the audit (`docs/verification/audit/*.json`: what it reads, its downstream, its
 * explanation, its tests and its status, read against the standard on `docs/GAMEPLAY-COVERAGE.md`). The creation
 * selections, the traits and knobs, the panels and the scheduled kinds are the audit's rows too. The six remaining
 * areas are their checklists and results (`docs/verification/remaining/`), and the criteria, the integration rows and
 * what this pass added are `docs/verification/integration-2026-10-16/criteria.json`. Where a source records nothing for
 * a field, the row says so ("Not recorded") rather than inventing it.
 *
 *   node tools/completion-matrix.mjs           writes integration-2026-10-16/COMPLETION-MATRIX.md and completion-matrix.json
 *   node tools/completion-matrix.mjs --check   fails where the matrix is behind its sources, a row cites evidence that
 *                                              isn't there, a test title cited isn't in its file, a row called verified
 *                                              or met has no evidence, or a command has no row
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const DIR = 'docs/verification/integration-2026-10-16';
const MD = `${DIR}/COMPLETION-MATRIX.md`;
const JSON_OUT = `${DIR}/completion-matrix.json`;
const NONE = 'Not recorded';
const clean = (s) => (s === undefined || s === null || String(s).trim() === '' || String(s).trim() === '—' ? NONE : String(s).replace(/\s+/g, ' ').trim());
const join = (...xs) => { const ys = xs.map((x) => (Array.isArray(x) ? x.join('; ') : x)).filter((x) => x && String(x).trim() && String(x).trim() !== '—'); return ys.length ? clean(ys.join(' | ')) : NONE; };

// ---------------------------------------------------------------------------------------------------------------------
// The sources
// ---------------------------------------------------------------------------------------------------------------------
/** `docs/TRACEABILITY.md`'s two tables, by command and by scheduled kind. */
function traceability() {
  const text = readFileSync('docs/TRACEABILITY.md', 'utf8');
  const commands = new Map();
  const scheduled = new Map();
  let table = '';
  for (const line of text.split('\n')) {
    if (line.startsWith('## Commands')) table = 'commands';
    else if (line.startsWith('## Scheduled')) table = 'scheduled';
    if (!line.startsWith('| `')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    const id = cells[0].replace(/`/g, '');
    if (table === 'commands') {
      const [, status, chapter, screens, handled, refuses, changes, money, later, tests, journeys] = cells;
      commands.set(id, { status, chapter, screens, handled, refuses, changes, money, later, tests, journeys });
    } else if (table === 'scheduled') {
      const [, handled, by, changes, money, later, tests] = cells;
      scheduled.set(id, { handled, by, changes, money, later, tests });
    }
  }
  return { commands, scheduled };
}

/** Each command's payload fields, from its handler's source: what the player decides when they issue it. */
function decisions() {
  const out = new Map();
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.endsWith('.ts') ? [`${d}/${e.name}`] : []));
  const consts = new Map();
  const files = walk('src/engine');
  const texts = files.map((f) => [f, readFileSync(f, 'utf8')]);
  for (const [, s] of texts) for (const m of s.matchAll(/export const (\w+)\s*=\s*'([\w.]+)'/g)) consts.set(m[1], m[2]);
  for (const [, s] of texts) {
    for (const m of s.matchAll(/onCommand<([^>]*)>\(\s*([\w.']+)/g)) {
      const kind = m[2].startsWith("'") ? m[2].replace(/'/g, '') : consts.get(m[2]) ?? m[2];
      const fields = [...m[1].matchAll(/(\w+)\??\s*:/g)].map((x) => x[1]);
      if (fields.length) out.set(kind, [...new Set([...(out.get(kind) ?? []), ...fields])]);
    }
  }
  return out;
}

function audit() {
  const rows = [];
  for (const f of readdirSync('docs/verification/audit').filter((x) => x.endsWith('.json')).sort()) {
    const area = { 'life.json': 'Life, Health And Time', 'money.json': 'Money', 'papers.json': 'Papers', 'school.json': 'School', 'ui.json': 'Creation, Profile, Home And The Looks' }[f] ?? f;
    for (const item of JSON.parse(readFileSync(`docs/verification/audit/${f}`, 'utf8')).items) rows.push({ ...item, area });
  }
  return rows;
}

function capabilities() {
  const caps = JSON.parse(readFileSync('docs/capabilities.json', 'utf8')).capabilities.filter((c) => c.status !== 'Retired');
  const byCommand = new Map();
  for (const c of caps) for (const k of c.commands ?? []) if (!byCommand.has(k)) byCommand.set(k, c);
  return { caps, byCommand };
}

/** The six areas: each checklist item, with its result where the area has written one. */
function areas() {
  const rows = [];
  const dir = 'docs/verification/remaining';
  if (!existsSync(dir)) return rows;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('-checklist.json')).sort()) {
    const key = f.replace('-checklist.json', '');
    const list = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    const items = Array.isArray(list) ? list : list.items;
    const resultPath = `${dir}/${key}-result.json`;
    const results = existsSync(resultPath) ? JSON.parse(readFileSync(resultPath, 'utf8')) : undefined;
    const resultItems = results ? (Array.isArray(results) ? results : results.items) : [];
    for (const it of items) rows.push({ key, item: it, result: resultItems.find((r) => r.id === it.id) });
  }
  return rows;
}

/**
 * The connected-journey trace (`docs/verification/connected-journey/TRACE.md`, written by `tools/trace.ts`): each entry's
 * Action, Preconditions, Costs, State, Consumer, Feedback, History, Later consequence and Tested by, by the commands its
 * Action names. The commands the audit has no row for are traced there.
 */
function trace() {
  const out = new Map();
  const text = readFileSync('docs/verification/connected-journey/TRACE.md', 'utf8');
  for (const block of text.split(/\n(?=### )/).slice(1)) {
    const field = (name) => { const m = block.match(new RegExp(`- \\*\\*${name}[^*]*:\\*\\*([\\s\\S]*?)(?=\\n- \\*\\*|$)`)); return m ? m[1].replace(/\n\s*- /g, '; ').replace(/\s+/g, ' ').trim().replace(/^;\s*/, '') : ''; };
    const action = field('Action');
    const entry = { title: block.split('\n')[0].replace(/^### /, ''), action, preconditions: field('Preconditions'), costs: field('Costs'), state: field('State'), consumer: field('Consumer'), feedback: field('Feedback'), history: field('History'), later: field('Later consequence'), tested: field('Tested by') };
    for (const m of action.matchAll(/`([a-z_]+\.[a-z_]+)`/g)) if (!out.has(m[1])) out.set(m[1], entry);
  }
  return out;
}

function criteria() {
  const p = `${DIR}/criteria.json`;
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')).rows : [];
}

// ---------------------------------------------------------------------------------------------------------------------
// The rows
// ---------------------------------------------------------------------------------------------------------------------
const STATUS = {
  verified: 'Verified', partial: 'Partial', unresolved: 'Unresolved', deferred: 'Deferred', legacy: 'Legacy', informational: 'Informational',
};
const tr = traceability();
const dec = decisions();
const { byCommand } = capabilities();
const rows = [];

for (const a of audit()) {
  const t = a.kind === 'command' ? tr.commands.get(a.id) : a.kind === 'scheduled' ? tr.scheduled.get(a.id) : undefined;
  const cap = a.kind === 'command' ? byCommand.get(a.id) : undefined;
  const gaps = a.review?.gaps?.length ? `Open: ${a.review.gaps.join('; ')}` : '';
  rows.push({
    id: a.id, group: a.area, kind: a.kind, source: 'audit',
    goal: join(cap?.goal, a.review?.claim),
    entry: join(a.entry, t?.chapter && t.chapter !== '—' ? `guide: ${t.chapter}` : '', t?.screens),
    preconditions: join(cap?.preconditions, a.kind === 'command' && t ? `refused where: ${t.refuses}` : ''),
    reads: clean(a.reads),
    decisions: a.kind === 'command' ? join(dec.get(a.id)?.length ? `chooses: ${dec.get(a.id).join(', ')}` : 'issued with no choice beyond the control') : a.kind === 'scheduled' ? 'none: the clock sets it off' : join(a.kind === 'creation' ? 'chosen on the creation screen' : ''),
    validation: join(t?.refuses ? `refusals: ${t.refuses}` : '', t?.money === 'Yes' ? 'moves money through the ledger' : '', cap?.effects ? `costs: ${cap.effects}` : ''),
    changes: join(a.changes, t?.changes),
    later: join(t?.later, a.kind === 'scheduled' && t?.by ? `scheduled by ${t.by}` : ''),
    systems: join(a.downstream, cap?.readers),
    sees: join(a.explanation, cap?.looks?.length ? `looks: ${cap.looks.join(', ')}` : ''),
    saveLoad: join(a.persistent, cap?.persists),
    failure: join(t?.refuses && a.kind === 'command' ? `each refusal said in the player's words (above)` : '', gaps),
    implementation: join(t?.handled, a.entry),
    evidence: join(a.tests, t?.journeys && t.journeys !== '—' ? `journeys: ${t.journeys}` : ''),
    status: STATUS[a.status] ?? a.status,
  });
}

// A command no audit row covers: its connected-journey trace entry, its capability and its traceability, so none is
// missed. Its status is its capability's, which isn't the audit's standard: Implemented stays Implemented here.
const traced = trace();
for (const [id, t] of tr.commands) {
  if (rows.some((r) => r.id === id)) continue;
  const cap = byCommand.get(id);
  const x = traced.get(id);
  rows.push({
    id, group: 'Commands Traced Outside The Audit', kind: 'command', source: x ? `docs/verification/connected-journey/TRACE.md (${x.title})` : 'docs/TRACEABILITY.md',
    goal: join(cap?.goal, x?.title), entry: join(x?.action, `guide: ${t.chapter}`, t.screens), preconditions: join(x?.preconditions, cap?.preconditions, `refused where: ${t.refuses}`), reads: join(x?.consumer ? '' : '', cap?.state),
    decisions: join(dec.get(id)?.length ? `chooses: ${dec.get(id).join(', ')}` : ''), validation: join(`refusals: ${t.refuses}`, x?.costs, t.money === 'Yes' ? 'moves money through the ledger' : '', cap?.effects ? `costs: ${cap.effects}` : ''),
    changes: join(x?.state, t.changes), later: join(x?.later, t.later), systems: join(x?.consumer, cap?.readers), sees: join(x?.feedback, cap?.looks), saveLoad: join(x?.history, cap?.persists),
    failure: join(`refusals said in the player's words: ${t.refuses}`, cap?.limits), implementation: join(t.handled, t.screens), evidence: join(x?.tested, `${t.tests} test files`, t.journeys),
    status: cap ? ({ Verified: 'Verified', Partial: 'Partial', Implemented: 'Implemented', Missing: 'Missing', Blocked: 'Blocked' }[cap.status] ?? cap.status) : t.status,
  });
}

const DISPOSITION = { fixed: 'Verified', implemented: 'Verified', 'guard kept and tested': 'Verified', 'older-save compatibility kept and tested': 'Verified', 'control corrected': 'Verified', 'removed as redundant': 'Verified', 'verified as it stands': 'Verified', 'uncertainty recorded': 'Partial', 'owner decision': "Owner's Decision" };
for (const { key, item, result } of areas()) {
  const ev = result?.evidence?.map((e) => `${e.file}${e.title ? ` ‘${e.title}’` : ''}${e.kind ? ` (${e.kind})` : ''}`) ?? [];
  rows.push({
    id: item.id, group: `Remaining Area: ${key}`, kind: 'area item', source: `docs/verification/remaining/${key}-checklist.json`,
    goal: clean(item.item), entry: join(item.affectedSystems), preconditions: clean(item.requirement), reads: clean(item.currentBehavior), decisions: clean(item.plan),
    validation: clean(item.classification), changes: join(result?.fixes?.map((f) => f.summary)), later: NONE, systems: join(item.affectedSystems), sees: join(result?.guide, result?.tutorial),
    saveLoad: NONE, failure: join(result?.assumptions), implementation: join(result?.fixes?.map((f) => f.where)), evidence: ev.length ? ev.join('; ') : join(item.acceptance),
    status: result ? (DISPOSITION[result.disposition] ?? result.disposition) : 'Open',
    citations: result?.evidence?.map((e) => ({ file: e.file, title: e.title })) ?? [],
  });
}

for (const c of criteria()) rows.push({ source: `${DIR}/criteria.json`, ...c, citations: c.citations ?? [] });

// ---------------------------------------------------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------------------------------------------------
const problems = [];
const FIELDS = ['goal', 'entry', 'preconditions', 'reads', 'decisions', 'validation', 'changes', 'later', 'systems', 'sees', 'saveLoad', 'failure', 'implementation', 'evidence', 'status'];
for (const r of rows) {
  for (const f of FIELDS) if (r[f] === undefined) problems.push(`${r.id}: no ${f}`);
  if ((r.status === 'Verified' || r.status === 'Met') && clean(r.evidence) === NONE) problems.push(`${r.id}: called ${r.status} with no evidence`);
  for (const c of r.citations ?? []) {
    const file = c.file.split(':')[0];
    if (!existsSync(file)) { problems.push(`${r.id}: cites ${file}, which isn't there`); continue; }
    if (c.title && file.endsWith('.ts') && !readFileSync(file, 'utf8').includes(c.title.slice(0, 60))) problems.push(`${r.id}: ${file} has no test titled ‘${c.title.slice(0, 60)}’`);
  }
}
for (const id of tr.commands.keys()) if (!rows.some((r) => r.id === id)) problems.push(`${id}: a command with no row`);

// ---------------------------------------------------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------------------------------------------------
const groups = [...new Set(rows.map((r) => r.group))];
const statuses = [...new Set(rows.map((r) => r.status))].sort();
const count = (g, s) => rows.filter((r) => (g === undefined || r.group === g) && r.status === s).length;
const esc = (s) => String(s).replace(/\|/g, '/').replace(/\n/g, ' ');
const short = (s, n = 140) => { const x = esc(s); return x.length > n ? `${x.slice(0, n - 1)}…` : x; };
const page = `# The Completion Matrix

Written by \`tools/completion-matrix.mjs\` from the sources it names; don't edit it by hand. The owner's brief of
2026-10-16, section 2: one traceable row for every exposed command and scheduled kind, every creation selection, trait
and knob, every panel, the six remaining areas, the attributes', genres', interpretation's and the stage's criteria,
and the integration rows. Every row's thirteen fields (goal and entry, preconditions, state read, decisions, validation
and costs, changes and what they set going, systems reached, what the player sees, save and load, failure and
recovery, implementation, evidence, status) are in \`completion-matrix.json\`; this page carries the totals, each row's
status and evidence, and, for every row not verified or met, what's left.

A command's or a panel's status is the audit's, held by \`tools/coverage.mjs\` to the standard on
\`docs/GAMEPLAY-COVERAGE.md\`. A criterion's is what its measurement came to, with the file it's in. "Not Met" is
reported as measured, beside any corrected criterion proposed; a proposal isn't counted met. "Deferred" is the owner's
scope reset of 2026-10-09; "Unresolved" is behavior kept in the engine that no life at Yale reaches.

## Totals

| Group | Rows | ${statuses.join(' | ')} |
|---|---|${statuses.map(() => '---').join('|')}|
${groups.map((g) => `| ${g} | ${rows.filter((r) => r.group === g).length} | ${statuses.map((s) => count(g, s) || '').join(' | ')} |`).join('\n')}
| **All** | **${rows.length}** | ${statuses.map((s) => `**${count(undefined, s)}**`).join(' | ')} |

${groups.map((g) => `## ${g}

| Row | Goal | Status | Evidence |
|---|---|---|---|
${rows.filter((r) => r.group === g).map((r) => `| \`${esc(r.id)}\` | ${short(r.goal)} | ${r.status} | ${short(r.evidence, 160)} |`).join('\n')}
`).join('\n')}
## What's Left

Every row not verified or met, with what its own fields say is open.

${rows.filter((r) => !['Verified', 'Met', 'Deferred', 'Informational', 'Legacy'].includes(r.status)).map((r) => `- **\`${esc(r.id)}\`** (${r.group}, ${r.status}): ${short(r.failure !== NONE ? r.failure : r.validation, 400)}`).join('\n')}
`;

const json = `${JSON.stringify({ written: 'tools/completion-matrix.mjs', fields: FIELDS, rows: rows.map(({ citations: _c, ...r }) => r) }, null, 1)}\n`;
if (process.argv.includes('--check')) {
  const stale = !existsSync(MD) || readFileSync(MD, 'utf8') !== page || !existsSync(JSON_OUT) || readFileSync(JSON_OUT, 'utf8') !== json;
  if (stale) problems.push(`${MD} or ${JSON_OUT} is behind its sources: run node tools/completion-matrix.mjs`);
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log(`The completion matrix holds: ${rows.length} rows, ${statuses.map((s) => `${count(undefined, s)} ${s}`).join(', ')}.`);
} else {
  writeFileSync(MD, page);
  writeFileSync(JSON_OUT, json);
  console.log(`Wrote ${MD}: ${rows.length} rows. ${problems.length ? `${problems.length} problems:\n${problems.join('\n')}` : 'No problems.'}`);
}
