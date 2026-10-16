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
 *   node tools/completion-matrix.mjs --check   fails where the matrix is behind its sources, a row's status isn't one of
 *                                              the seven or lacks what it asks, evidence cited isn't there, a test title
 *                                              cited isn't in its file, a measurement was made before the code it reads
 *                                              last changed, a row is called more than its source bears out, a command
 *                                              has no row, or the handoff's completion line isn't the matrix's
 *
 * From brief 09 (2026-10-16), each row carries one of the seven statuses the owner named, its source's own word kept
 * beside it (`sourceStatus`). Until then a row carried its source's word (Verified, Met, Owner's Decision), the page
 * said "467 rows, none open", and the handoff listed unfinished work: a row assigned to the owner or proposed a new
 * criterion counted as settled. Only Implemented And Verified counts toward completion, out of every row not Explicitly
 * Deferred; the check also holds what each status needs (a verified row, a current test or measurement; any other, what
 * it lacks), that a measurement is still current (no file it reads changed since the commit it was made on, by git),
 * and that the handoff states the matrix's own completion line.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

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

/** The areas: each checklist item, with its result where the area has written one; the last pass's and brief 09's. */
function areas() {
  const rows = [];
  // brief 10's areas (`remaining-10/`) read from 2026-10-16, as brief 09's were.
  for (const dir of ['docs/verification/remaining', 'docs/verification/remaining-09', 'docs/verification/remaining-10']) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('-checklist.json')).sort()) {
    const key = f.replace('-checklist.json', '');
    const list = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    const items = Array.isArray(list) ? list : list.items;
    const resultPath = `${dir}/${key}-result.json`;
    const results = existsSync(resultPath) ? JSON.parse(readFileSync(resultPath, 'utf8')) : undefined;
    const resultItems = results ? (Array.isArray(results) ? results : results.items) : [];
    for (const it of items) rows.push({ key, dir, item: it, result: resultItems.find((r) => r.id === it.id) });
    // An item an area added to its result after its checklist (a follow-up's): read too. Until brief 09 only the
    // checklist's items were read, and the coverage area's three follow-up items had no row.
    for (const r of resultItems) if (!items.some((it) => it.id === r.id)) rows.push({ key, dir, item: { id: r.id, item: r.item ?? r.before ?? r.id, requirement: r.requirement, currentBehavior: r.before, plan: r.plan, classification: r.classification, affectedSystems: r.affectedSystems }, result: r });
  }
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
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { rows: [], overrides: [] };
}

// ---------------------------------------------------------------------------------------------------------------------
// The rows
// ---------------------------------------------------------------------------------------------------------------------
const IAV = 'Implemented And Verified', IVI = 'Implemented, Verification Incomplete', PI = 'Partially Implemented', NI = 'Not Implemented', BE = 'Blocked Externally', DR = 'Decision Required', ED = 'Explicitly Deferred';
const SEVEN = [IAV, IVI, PI, NI, BE, DR, ED];
/** What each status asks of a row besides its evidence. */
const NEEDS = { [IVI]: 'missing', [PI]: 'gap', [NI]: 'gap', [BE]: 'blocker', [DR]: 'decision', [ED]: 'deferredBy' };
/** The files a measurement reads, by what it measures: a criterion is current while none has changed since it was made. */
const WATCH = {
  judge: ['src/engine/systems/evaluation.ts', 'src/engine/systems/piece.ts', 'src/engine/systems/material.ts', 'src/engine/systems/interpretation.ts', 'src/engine/systems/interpretation-read.ts', 'src/engine/systems/ensemble.ts', 'src/engine/systems/briefs.ts', 'src/engine/systems/attributes.ts', 'src/engine/content/approaches.ts', 'src/engine/content/tasks.ts', 'src/engine/content/material.ts', 'src/engine/content/interpretation.ts', 'src/engine/content/abilities.ts', 'src/engine/content/piece.ts', 'src/engine/content/briefs', 'src/engine/content/plays.ts', 'src/engine/content/coursework.ts', 'src/engine/content/genres.ts', ...readdirSync('src/engine/content').filter((f) => /^scenes-.*\.ts$/.test(f)).map((f) => `src/engine/content/${f}`)],
  engine: ['src/engine'],
  app: ['src', 'index.html', 'vite.config.ts'],
};
const git = (...args) => { try { return { ok: true, out: execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }; } catch (e) { return { ok: false, code: e.status }; } };
const freshness = new Map();
/** Whether a measurement is current: its commit is in this history and no file it reads differs from it (the tree's own
 * uncommitted changes included). */
function current(m) {
  const key = `${m.commit} ${m.watch}`;
  if (freshness.has(key)) return freshness.get(key);
  const paths = WATCH[m.watch];
  let verdict;
  if (!paths) verdict = `reads "${m.watch}", which the matrix doesn't know`;
  else if (!git('cat-file', '-e', `${m.commit}^{commit}`).ok) verdict = `was measured on ${m.commit}, which isn't in this repository's history`;
  else if (!git('merge-base', '--is-ancestor', m.commit, 'HEAD').ok) verdict = `was measured on ${m.commit}, which isn't an ancestor of HEAD`;
  else {
    const d = git('diff', '--name-only', m.commit, '--', ...paths);
    verdict = !d.ok ? `couldn't be compared with ${m.commit}` : d.out ? `was measured on ${m.commit}, and what it reads has changed since (${d.out.split('\n').slice(0, 3).join(', ')}${d.out.split('\n').length > 3 ? ', …' : ''}): measure it again` : '';
  }
  freshness.set(key, verdict);
  return verdict;
}
const tr = traceability();
const dec = decisions();
const { byCommand } = capabilities();
const rows = [];
const testCited = (text) => /tests\/[\w.-]+\.test\.ts/.test(String(text ?? '')) && !/^\s*None\b/.test(String(text ?? ''));

/** An audit row's status, from the status `tools/coverage.mjs` holds it to on `docs/GAMEPLAY-COVERAGE.md`. */
function auditStatus(a) {
  const gaps = a.review?.gaps?.length ? a.review.gaps.join('; ') : '';
  switch (a.status) {
    case 'verified': return { status: IAV };
    case 'partial': return { status: IVI, missing: clean(join(a.issue, gaps)) };
    case 'unresolved': {
      const unfinished = a.acceptance?.unfinished;
      if (unfinished && !/^\s*None\b/.test(unfinished)) return { status: PI, gap: clean(unfinished) };
      return { status: IVI, missing: clean(join(a.acceptance?.player ?? a.issue, a.acceptance?.engine ? `tested on fixtures: ${a.acceptance.engine}` : '')) };
    }
    case 'deferred': return { status: ED, deferredBy: clean(join(a.issue, 'the owner’s scope reset of 2026-10-09 (docs/REQUIREMENTS.md)')) };
    case 'legacy': case 'informational':
      return testCited(a.tests) ? { status: IAV } : { status: IVI, missing: clean(join(a.issue, a.tests, 'no test reaches it')) };
    default: return { status: NI, gap: `an audit status the matrix doesn't know: ${a.status}` };
  }
}

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
    sourceStatus: a.status,
    ...auditStatus(a),
  });
}

// A command no audit row covers: its connected-journey trace entry, its capability and its traceability, so none is
// missed. No audit row has read it against the page's standard, so it's at most Implemented, Verification Incomplete,
// whatever its capability says.
const traced = trace();
for (const [id, t] of tr.commands) {
  if (rows.some((r) => r.id === id)) continue;
  const cap = byCommand.get(id);
  const x = traced.get(id);
  rows.push({
    id, group: 'Commands Traced Outside The Audit', kind: 'command', source: x ? `docs/verification/connected-journey/TRACE.md (${x.title})` : 'docs/TRACEABILITY.md',
    goal: join(cap?.goal, x?.title), entry: join(x?.action, `guide: ${t.chapter}`, t.screens), preconditions: join(x?.preconditions, cap?.preconditions, `refused where: ${t.refuses}`), reads: join(cap?.state),
    decisions: join(dec.get(id)?.length ? `chooses: ${dec.get(id).join(', ')}` : ''), validation: join(`refusals: ${t.refuses}`, x?.costs, t.money === 'Yes' ? 'moves money through the ledger' : '', cap?.effects ? `costs: ${cap.effects}` : ''),
    changes: join(x?.state, t.changes), later: join(x?.later, t.later), systems: join(x?.consumer, cap?.readers), sees: join(x?.feedback, cap?.looks), saveLoad: join(x?.history, cap?.persists),
    failure: join(`refusals said in the player's words: ${t.refuses}`, cap?.limits), implementation: join(t.handled, t.screens), evidence: join(x?.tested, `${t.tests} test files`, t.journeys),
    sourceStatus: cap ? `capability ${cap.status}` : t.status,
    status: IVI, missing: 'No audit row has read it against the standard on docs/GAMEPLAY-COVERAGE.md; its capability’s limits say what no test checks',
  });
}

const { rows: criteriaRows = [], overrides = [] } = criteria();
/** The tools the gate runs (package.json's gate): a check one of them makes is evidence the gate holds, as a test is. */
const GATE_TOOLS = new Set([...(JSON.parse(readFileSync('package.json', 'utf8')).scripts?.gate ?? '').matchAll(/tools\/[\w.-]+\.mjs/g)].map((m) => m[0]));
const gateEvidence = (c) => (/^tests\/[\w.-]+\.test\.ts$/.test(c.file.split(':')[0]) && c.title) || GATE_TOOLS.has(c.file.split(':')[0]);
const DISPOSITION = { fixed: IAV, verified: IAV, implemented: IAV, 'guard kept and tested': IAV, 'older-save compatibility kept and tested': IAV, 'control corrected': IAV, 'removed as redundant': IAV, 'verified as it stands': IAV, 'uncertainty recorded': IVI, 'owner decision': DR, reported: NI };
const lead = (d) => Object.keys(DISPOSITION).find((k) => d === k || d?.startsWith(`${k} `) || d?.startsWith(`${k},`) || d?.startsWith(`${k};`));
for (const { key, dir, item, result } of areas()) {
  const ev = result?.evidence?.map((e) => `${e.file}${e.title ? ` ‘${e.title}’` : ''}${e.kind ? ` (${e.kind})` : ''}`) ?? [];
  const override = overrides.find((o) => o.id === item.id);
  // An area of brief 09 gives its own status, one of the seven; the last pass's areas gave a disposition, read by its
  // leading words ("fixed (…)", "control corrected (words)"), the whole disposition kept beside it.
  let own = SEVEN.includes(result?.status) ? result.status : result ? DISPOSITION[lead(result.disposition)] ?? NI : NI;
  // Called verified, it cites a gate test by its title or a check the gate runs; an area that verified an item by
  // reading or by its sources says so, and the item is Implemented, Verification Incomplete (from brief 09: until then
  // "verified as it stands" with no test cited counted as verified).
  const cites = result?.evidence?.map((e) => ({ file: e.file, title: e.title })) ?? [];
  const unproven = own === IAV && !cites.some((c) => gateEvidence(c) && !titled(c));
  if (unproven) own = IVI;
  const status = override?.status ?? own;
  const why = clean(join(override?.why, result?.disposition));
  rows.push({
    id: item.id, group: `${dir.endsWith('-10') ? 'Brief 10' : dir.endsWith('-09') ? 'Brief 09' : 'Remaining'} Area: ${key}`, kind: 'area item', source: `${dir}/${key}-checklist.json`,
    goal: clean(item.item), entry: join(item.affectedSystems), preconditions: clean(item.requirement), reads: clean(item.currentBehavior), decisions: clean(item.plan),
    validation: clean(item.classification), changes: join(result?.fixes?.map((f) => f.summary)), later: NONE, systems: join(item.affectedSystems), sees: join(result?.guide, result?.tutorial),
    saveLoad: NONE, failure: join(result?.assumptions), implementation: join(result?.fixes?.map((f) => f.where)), evidence: ev.length ? ev.join('; ') : join(item.acceptance),
    sourceStatus: result ? clean(result.disposition ?? result.status) : 'no result yet',
    status, disposition: result?.disposition, override: override?.why,
    citations: [...(result?.evidence?.map((e) => ({ file: e.file, title: e.title })) ?? []), ...(override?.citations ?? [])],
    ...(status === IVI ? { missing: clean(join(unproven ? `the area called it ${result.disposition} and cites no gate test that holds it` : '', result?.missing, result?.assumptions, unproven ? '' : why)) } : {}),
    ...(status === PI || status === NI ? { gap: clean(join(result?.gap, result ? why : 'the area has written no result for it')) } : {}),
    ...(status === DR ? { decision: result?.decision ?? (result?.ownerDecision ? { question: result.ownerDecision, evidence: `${dir}/${key}-result.json`, recommendation: result?.recommendation ?? NONE } : undefined) } : {}),
    ...(status === BE ? { blocker: result?.blocker } : {}),
    ...(status === ED ? { deferredBy: result?.deferredBy } : {}),
  });
}

// A measurement is verification only while what it reads is unchanged since it was made: one made before is said to be
// Implemented, Verification Incomplete, with what to measure again (from brief 09: until then a criterion stayed Met
// after the code it measured changed).
for (const c of criteriaRows) {
  const r = { source: `${DIR}/criteria.json`, ...c, citations: c.citations ?? [] };
  if (r.status === IAV && r.measured) { const v = current(r.measured); if (v) Object.assign(r, { status: IVI, missing: `It ${v}` }); }
  rows.push(r);
}

// ---------------------------------------------------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------------------------------------------------
const problems = [];
const FIELDS = ['goal', 'entry', 'preconditions', 'reads', 'decisions', 'validation', 'changes', 'later', 'systems', 'sees', 'saveLoad', 'failure', 'implementation', 'evidence', 'status'];
function titled(c) {
  const file = c.file.split(':')[0];
  if (!existsSync(file)) return `cites ${file}, which isn't there`;
  // A title is cited as vitest names it, its describes before it (`describe > it`), and cut short anywhere with “…” or
  // "...": each piece of it, cut at those, is in the file. Until later on 2026-10-16 the title's first 60 characters had
  // to be, which no `describe > it` citation was.
  // A piece written by a template (`${g}: its briefs are different situations`) is there where it's the whole of one of
  // the file's template titles, each `${…}` standing for any words; until the genres of brief 09 came in on 2026-10-16
  // only a title written out was, and none of the fourteen genres' was.
  if (c.title && file.endsWith('.ts')) {
    const text = readFileSync(file, 'utf8');
    const templates = [...text.matchAll(/\b(?:it|test|describe)(?:\.\w+)*\(\s*`((?:[^`\\]|\\.)*)`/g)]
      .filter((m) => m[1].includes('${'))
      .map((m) => new RegExp(`^${m[1].split(/\$\{[^}]*\}/).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+')}$`));
    const pieces = c.title.split(' > ').flatMap((p) => p.split(/…|\.\.\./)).map((p) => p.trim()).filter((p) => p.length >= 8);
    const missing = pieces.find((p) => !text.includes(p) && !templates.some((t) => t.test(p)));
    if (!pieces.length || missing) return `${file} has no test titled ‘${(missing ?? c.title).slice(0, 60)}’`;
  }
  return '';
}
for (const r of rows) {
  for (const f of FIELDS) if (r[f] === undefined) problems.push(`${r.id}: no ${f}`);
  if (!SEVEN.includes(r.status)) { problems.push(`${r.id}: status “${r.status}” isn't one of the seven`); continue; }
  const need = NEEDS[r.status];
  if (need) {
    const v = r[need];
    const empty = v === undefined || v === null || (typeof v === 'string' && clean(v) === NONE) || (need === 'decision' && (!v.question || !v.evidence || !v.recommendation));
    if (empty) problems.push(`${r.id}: called ${r.status} without its ${need === 'decision' ? 'decision (the question, the evidence and the recommendation)' : need}`);
  }
  for (const c of r.citations ?? []) { const p = titled(c); if (p) problems.push(`${r.id}: ${p}`); }
  if (r.status === IAV) {
    // Verified on what's current: an audit row by `tools/coverage.mjs`'s own standard (in the gate); a measurement by
    // the commit it was made on, still current; anything else by a gate test it cites by its title.
    if (r.source === 'audit') { if (!['verified', 'legacy', 'informational'].includes(r.sourceStatus)) problems.push(`${r.id}: called ${IAV} where the audit says ${r.sourceStatus}`); }
    else if (r.measured) { const v = current(r.measured); if (v) problems.push(`${r.id}: ${v}`); }
    else if (!(r.citations ?? []).some((c) => gateEvidence(c) && !titled(c))) problems.push(`${r.id}: called ${IAV} without a gate test cited by its title, or a check the gate runs`);
  }
  if (r.kind === 'command' && r.source !== 'audit' && r.status === IAV) problems.push(`${r.id}: a command no audit row has read can't be called ${IAV}`);
}
for (const o of overrides) if (!rows.some((r) => r.id === o.id && r.override)) problems.push(`${o.id}: an override for no area item`);
for (const id of tr.commands.keys()) if (!rows.some((r) => r.id === id)) problems.push(`${id}: a command with no row`);
// The owner's brief 10 left decision 4 as brief 09 did: the twelve rows out of a player's reach stay unresolved in the
// audit, counted in the totals here as Implemented, Verification Incomplete, and their decision stays three rows of
// Decision Required. Held from 2026-10-16 so no change moves them unseen; until the owner decides, not after.
const DECISION_4 = ['bank.arrange_overdraft', 'bank.cancel_new', 'bank.switch', 'bank.switch_complete', 'bank.cancel_switch', 'bank.stop_balance_transfer', 'bank.take_overrun_loan', 'card.money_transfer', 'tax.amend', 'tax.catch_up_state_plan', 'tax.lien_dispute', 'tax.request_waiver'];
for (const id of DECISION_4) {
  const r = rows.find((x) => x.id === id && x.source === 'audit');
  if (!r) problems.push(`${id}: decision 4's row is gone from the audit`);
  else if (r.sourceStatus !== 'unresolved' || r.status !== IVI) problems.push(`${id}: decision 4's row moved (audit ${r.sourceStatus}, here ${r.status}), which the owner hasn't decided`);
}
for (const id of ['coverage09.3-unresolved', 'KS-bank-rows-scope', 'banking.2.scope']) if (!rows.some((r) => r.id === id && r.status === DR)) problems.push(`${id}: decision 4 isn't Decision Required here, which the owner hasn't decided`);

// ---------------------------------------------------------------------------------------------------------------------
// The totals, and the line the handoff states
// ---------------------------------------------------------------------------------------------------------------------
const groups = [...new Set(rows.map((r) => r.group))];
const count = (g, s) => rows.filter((r) => (g === undefined || r.group === g) && r.status === s).length;
const inScope = rows.length - count(undefined, ED);
const done = count(undefined, IAV);
const completion = `**Completion, by the matrix:** ${done} of ${inScope} rows in scope Implemented And Verified (${(Math.floor((1000 * done) / inScope) / 10).toFixed(1)}%); ${SEVEN.slice(1).map((s) => `${count(undefined, s)} ${s}`).join(', ')}.`;
// The handoff's top section, up to the next section of the same depth, says the matrix's own line, so the two can't
// disagree about what's done (until brief 09 the matrix said "none open" while the handoff listed what was).
const handoff = existsSync('SLATE_CURRENT_MASTER_HANDOFF.md') ? readFileSync('SLATE_CURRENT_MASTER_HANDOFF.md', 'utf8') : '';
const top = handoff.split(/\n# /)[0];
if (!top.includes(completion)) problems.push(`SLATE_CURRENT_MASTER_HANDOFF.md's top section doesn't state the matrix's completion line: ${completion}`);

// ---------------------------------------------------------------------------------------------------------------------
// The page
// ---------------------------------------------------------------------------------------------------------------------
const esc = (s) => String(s).replace(/\|/g, '/').replace(/\n/g, ' ');
const short = (s, n = 140) => { const x = esc(s); return x.length > n ? `${x.slice(0, n - 1)}…` : x; };
const needText = (r) => { const v = r[NEEDS[r.status]]; return typeof v === 'object' && v ? `${v.question} Evidence: ${v.evidence}. Recommended: ${v.recommendation}` : v; };
const page = `# The Completion Matrix

Written by \`tools/completion-matrix.mjs\` from the sources it names; don't edit it by hand. One traceable row for every
exposed command and scheduled kind, every creation selection, trait and knob, every panel, every area's item, every
criterion the passes are judged by, the integration rows, and every known shortfall and missing test. Every row's
fields (goal and entry, preconditions, state read, decisions, validation and costs, changes and what they set going,
systems reached, what the player sees, save and load, failure and recovery, implementation, evidence, status) are in
\`completion-matrix.json\`; this page carries the totals, each row's status and evidence, and what every row not done
still needs.

**The seven statuses** (the owner's brief 09, 2026-10-16). *Implemented And Verified*: a gate test reaches it and checks
it, or a measurement made on code it still reads. *Implemented, Verification Incomplete*: built, and what's missing to
prove it is said. *Partially Implemented* and *Not Implemented*: the gap is said. *Blocked Externally*: what outside the
repository stops it. *Decision Required*: the question, the evidence and the recommendation for the owner.
*Explicitly Deferred*: who deferred it. A row's source keeps its own word beside the status (the audit's, a capability's,
an area's disposition, a criterion's Met or Not Met). Until brief 09 the page carried those words alone and said "none
open"; documenting, classifying or giving a row to the owner never made it done.

${completion}

## Totals

Only Implemented And Verified counts as done, out of every row not Explicitly Deferred.

| Group | Rows | ${SEVEN.join(' | ')} |
|---|---|${SEVEN.map(() => '---').join('|')}|
${groups.map((g) => `| ${g} | ${rows.filter((r) => r.group === g).length} | ${SEVEN.map((s) => count(g, s) || '').join(' | ')} |`).join('\n')}
| **All** | **${rows.length}** | ${SEVEN.map((s) => `**${count(undefined, s)}**`).join(' | ')} |

${groups.map((g) => `## ${g}

| Row | Goal | Status | Source's Word | Evidence |
|---|---|---|---|---|
${rows.filter((r) => r.group === g).map((r) => `| \`${esc(r.id)}\` | ${short(r.goal)} | ${r.status} | ${short(r.sourceStatus ?? '', 40)} | ${short(r.evidence, 160)} |`).join('\n')}
`).join('\n')}
## What's Left

Every row in scope not Implemented And Verified, with what its status says it needs.

${SEVEN.slice(1, -1).map((s) => `### ${s} (${count(undefined, s)})

${rows.filter((r) => r.status === s).map((r) => `- **\`${esc(r.id)}\`** (${r.group}): ${short(needText(r) ?? '', 600)}`).join('\n') || 'None.'}
`).join('\n')}
### ${ED} (${count(undefined, ED)})

${rows.filter((r) => r.status === ED).map((r) => `- \`${esc(r.id)}\` (${r.group}): ${short(r.deferredBy ?? '', 240)}`).join('\n') || 'None.'}
`;

const json = `${JSON.stringify({ written: 'tools/completion-matrix.mjs', statuses: SEVEN, completion: completion.replace(/\*\*/g, ''), fields: FIELDS, rows: rows.map(({ citations: _c, ...r }) => r) }, null, 1)}\n`;
if (process.argv.includes('--check')) {
  const stale = !existsSync(MD) || readFileSync(MD, 'utf8') !== page || !existsSync(JSON_OUT) || readFileSync(JSON_OUT, 'utf8') !== json;
  if (stale) problems.push(`${MD} or ${JSON_OUT} is behind its sources: run node tools/completion-matrix.mjs`);
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log(`The completion matrix holds: ${rows.length} rows. ${completion.replace(/\*\*/g, '')}`);
} else {
  writeFileSync(MD, page);
  writeFileSync(JSON_OUT, json);
  console.log(`Wrote ${MD}: ${rows.length} rows. ${completion.replace(/\*\*/g, '')} ${problems.length ? `${problems.length} problems:\n${problems.join('\n')}` : 'No problems.'}`);
}
