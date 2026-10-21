/**
 * The feature-to-effect matrix held to the code (from 2026-10-21, the owner's brief 20, "Perform A Complete Functional
 * And Downstream-Effects Audit Of SLATE"; docs/verification/audit-2026-10-21/criteria.md, S1, M1 to M3 and C3). Its rows
 * are in docs/verification/audit-2026-10-21/effects/<area>.json, one row a feature, each with the brief's nine fields:
 * where the player meets it, its prerequisites, the state it reads, what it changes at once, which systems read that
 * later (`consumers`, each with the file and line), when and how the player meets the consequence, what a save and a
 * load keep, the evidence, and what's missing; and whether it's a mechanic or presentation, and its status, one of the
 * owner's seven (brief 09). The guide's promises, each connection one entry makes to another, are rows too, in each
 * file's `promises`.
 *
 * The features are found in the code, not in a document: every command, scheduled kind, passage reactor and event the
 * inventory lists (`docs/COVERAGE-MATRIX.md`, which `tools/inventory.mjs --check` holds to the engine); every field of
 * creation's `NewSaveConfig`; every dial of `Wellbeing`; every ability; every personality axis and trait; every look;
 * every `ui.*` the guide names; every tutorial chapter; every guide entry's connections; and every place the engine sends
 * a notice outside a command's, a scheduled kind's or an event's own handler, by the file and the function (a notice
 * inside a handler is that feature's). A row may also be added for what the code holds no list of, a relationship, an
 * item or a status, as `kind` says.
 *
 *   node tools/effects.mjs            prints the totals
 *   node tools/effects.mjs --seed     adds a row for each feature found that no file has, to its area's file, its fields
 *                                     taken from the completion matrix where it has the feature, and marked `seeded`
 *   node tools/effects.mjs --write    writes docs/verification/audit-2026-10-21/EFFECTS.md
 *   node tools/effects.mjs --check    exits 1 on a feature no row names, a row for a feature that's gone, a row named
 *                                     twice, a field left empty, a status not one of the seven, a row still seeded, a
 *                                     consumer at a file or a line that isn't there, a test the gate doesn't run or that
 *                                     isn't there, a verified row with no test, a verified command none of whose tests
 *                                     issues it, or EFFECTS.md behind the rows
 *   node tools/effects.mjs --todo [<area>]  lists the rows still seeded, by area
 */
import ts from 'typescript';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'docs/verification/audit-2026-10-21';
const ROWS = `${DIR}/effects`;
const PAGE = `${DIR}/EFFECTS.md`;
const AREAS = ['creation', 'school', 'craft', 'money', 'benefits', 'papers', 'life', 'career', 'guide'];
const STATUSES = ['Implemented And Verified', 'Implemented, Verification Incomplete', 'Partially Implemented', 'Not Implemented', 'Blocked Externally', 'Decision Required', 'Explicitly Deferred'];
const DONE = STATUSES[0];
const DEFERRED = STATUSES[6];
/** The fields every row fills, the brief's nine and the ones that say what it is. */
const FIELDS = ['where', 'prerequisites', 'reads', 'changes', 'experienced', 'saveLoad', 'missing'];
/** A row for something the code keeps no list of. */
const EXTRA_KINDS = new Set(['relationship', 'item', 'status', 'other']);
/** A test the gate runs: a .test.ts under tests/, as vitest.config.ts includes. */
const IN_GATE = /^tests\/(?:[\w.-]+\/)*[\w.-]+\.test\.ts$/;

const read = (f) => readFileSync(f, 'utf8');
const source = (f) => ts.createSourceFile(f, read(f), ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const walk = (node, visit) => { visit(node); ts.forEachChild(node, (c) => walk(c, visit)); };
const filesUnder = (dir, test) => readdirSync(dir, { recursive: true }).map((p) => join(dir, String(p)).replace(/\\/g, '/')).filter((p) => test.test(p));
const text = (node) => (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined);
const prop = (obj, name) => obj.properties.find((p) => ts.isPropertyAssignment(p) && p.name && (p.name.text ?? p.name.escapedText) === name)?.initializer;

/** The members of an interface, by its name in a file. */
function membersOf(file, name) {
  const out = [];
  walk(source(file), (n) => {
    if (ts.isInterfaceDeclaration(n) && n.name.text === name) for (const m of n.members) if (m.name) out.push(m.name.text ?? m.name.escapedText);
  });
  return out;
}

/** The kinds the inventory lists, by its table. */
function inventory() {
  const matrix = read('docs/COVERAGE-MATRIX.md');
  const inv = matrix.slice(matrix.indexOf('<!-- inventory:begin -->'), matrix.indexOf('<!-- inventory:end -->'));
  const table = (title) => {
    const at = inv.indexOf(`### ${title}`);
    if (at < 0) return [];
    const next = inv.indexOf('\n### ', at + 4);
    return [...new Set([...inv.slice(at, next < 0 ? undefined : next).matchAll(/`([a-z0-9_]+\.[a-z0-9_]+)`/g)].map((m) => m[1]))];
  };
  const commands = table('Commands');
  return {
    command: commands,
    // A kind both a command and scheduled (`school.cabaret`, `school.orientation`) is the command's row.
    scheduled: table('Scheduled kinds').filter((k) => !commands.includes(k)),
    reactor: table('Passage reactors'),
    event: table('Events emitted'),
  };
}

/** Each exported constant that holds a kind (`export const WORK_DAY_KIND = 'pro.work_day'`), by its name. */
function kindConstants() {
  const out = new Map();
  for (const f of filesUnder('src/engine', /\.ts$/)) for (const m of read(f).matchAll(/(?:export )?const ([A-Z][A-Z0-9_]*) = '([a-z0-9_]+\.[a-z0-9_]+)'/g)) out.set(m[1], m[2]);
  return out;
}

/**
 * Where the engine sends a notice outside a handler of its own: the file and the top-level function or constant around
 * the call. A call inside `onCommand`, `onSchedule`, `onEvent` or `onPassage` is that kind's, and its row says so.
 */
function noticeSites(constants) {
  const out = new Set();
  for (const f of filesUnder('src/engine', /\.ts$/)) {
    const sf = source(f);
    walk(sf, (n) => {
      if (!ts.isCallExpression(n) || !ts.isPropertyAccessExpression(n.expression) || n.expression.name.text !== 'notify') return;
      let at = n.parent;
      let owner;
      while (at && at !== sf) {
        if (ts.isCallExpression(at) && ts.isPropertyAccessExpression(at.expression) && ['onCommand', 'onSchedule', 'onEvent', 'onPassage'].includes(at.expression.name.text)) {
          const first = at.arguments[0];
          owner = text(first) ?? (first && ts.isIdentifier(first) ? constants.get(first.text) : undefined) ?? 'handler';
          break;
        }
        if (at.parent === sf) {
          const name = ts.isFunctionDeclaration(at) ? at.name?.text : ts.isVariableStatement(at) ? at.declarationList.declarations[0]?.name.getText() : undefined;
          owner = `notice.${f.replace(/^src\/engine\//, '').replace(/\.ts$/, '')}#${name ?? 'top'}`;
          break;
        }
        at = at.parent;
      }
      if (owner?.startsWith('notice.')) out.add(owner);
    });
  }
  return [...out];
}

/** The ids of an array of objects a constant holds (`CHAPTERS`, `PERSONALITY_TRAITS`). */
function idsOf(file, constant) {
  const out = [];
  walk(source(file), (n) => {
    if (ts.isVariableDeclaration(n) && n.name.getText() === constant && n.initializer) {
      const arr = ts.isAsExpression(n.initializer) ? n.initializer.expression : n.initializer;
      if (ts.isArrayLiteralExpression(arr)) for (const e of arr.elements) if (ts.isObjectLiteralExpression(e)) { const id = text(prop(e, 'id')); if (id) out.push(id); }
    }
  });
  return out;
}

/** The guide's entries and each connection one makes to another. */
function guide() {
  const entries = [];
  const promises = [];
  for (const f of filesUnder('src/engine/content/guide', /\.ts$/)) {
    walk(source(f), (n) => {
      if (!ts.isObjectLiteralExpression(n)) return;
      const id = text(prop(n, 'id'));
      const connections = prop(n, 'connections');
      if (!id || !prop(n, 'covers')) return;
      entries.push(id);
      if (connections && ts.isArrayLiteralExpression(connections)) {
        for (const c of connections.elements) {
          if (!ts.isObjectLiteralExpression(c)) continue;
          const to = text(prop(c, 'to'));
          if (to) promises.push({ id: `promise.${id}>${to}`, kind: text(prop(c, 'kind')) ?? '', claim: prop(c, 'why')?.getText().replace(/^[`'"]|[`'"]$/g, '') ?? '', file: f });
        }
      }
    });
  }
  return { entries, promises };
}

/** Every feature the code has, by id, with its kind. */
export function features() {
  const constants = kindConstants();
  const inv = inventory();
  const out = new Map();
  for (const [kind, ids] of Object.entries(inv)) for (const id of ids) out.set(id, kind);
  for (const k of membersOf('src/engine/world/bootstrap.ts', 'NewSaveConfig')) out.set(`create.${k}`, 'creation');
  for (const k of membersOf('src/engine/domain/model.ts', 'Wellbeing')) out.set(`dial.${k}`, 'dial');
  for (const k of membersOf('src/engine/domain/model.ts', 'Personality')) out.set(`axis.${k}`, 'axis');
  for (const m of read('src/engine/content/abilities.ts').match(/export type AbilityId =([^;]+);/)[1].matchAll(/'([a-zA-Z]+)'/g)) out.set(`ability.${m[1]}`, 'ability');
  for (const id of idsOf('src/engine/content/personality-traits.ts', 'PERSONALITY_TRAITS')) out.set(`trait.${id}`, 'trait');
  for (const f of filesUnder('src/ui/looks', /\.tsx$/)) for (const m of read(f).matchAll(/defineLook(?:<[^>]*>)?\('([a-z-]+)'/g)) out.set(`look.${m[1]}`, 'look');
  for (const f of filesUnder('src/engine/content/guide', /\.ts$/)) for (const m of read(f).matchAll(/'(ui\.[a-z-]+)'/g)) out.set(m[1], 'ui');
  for (const id of idsOf('src/engine/content/tutorial.ts', 'CHAPTERS')) out.set(`chapter.${id}`, 'chapter');
  for (const id of noticeSites(constants)) out.set(id, 'notice');
  return { features: out, promises: guide().promises, constants };
}

/** Which area a feature belongs to. */
export function areaOf(id) {
  const [head, rest = ''] = id.split('.');
  if (['create', 'axis', 'trait', 'ability'].includes(head)) return 'creation';
  if (head === 'dial') return 'life';
  if (['chapter', 'promise', 'ui', 'tutorial'].includes(head)) return 'guide';
  if (head === 'look') {
    if (['ability', 'skill', 'trait', 'genre', 'person', 'readiness'].includes(rest)) return 'creation';
    if (['assignment', 'course', 'classmate', 'school', 'work'].includes(rest)) return 'school';
    if (['account', 'bank', 'currency', 'debt', 'networth', 'transaction'].includes(rest)) return 'money';
    if (['document', 'region', 'country', 'place'].includes(rest)) return 'papers';
    if (['decision', 'notification'].includes(rest)) return 'guide';
    return 'life';
  }
  if (head === 'notice') {
    const file = rest.split('#')[0];
    return areaOfFile(file.replace(/^systems\/|^world\/|^content\//, ''));
  }
  if (['school', 'brief', 'practice', 'plays', 'genre', 'work'].includes(head)) return 'school';
  if (['bank', 'card', 'cash', 'finance'].includes(head)) return 'money';
  if (['tax', 'benefits', 'pension'].includes(head)) return 'benefits';
  // Health cover and the doctor are under Papers in the guide, beside the passport and permission to work.
  if (['documents', 'citizenship', 'health'].includes(head)) return 'papers';
  if (head === 'pro') return 'career';
  if (id === 'world.tick') return 'life';
  if (head === 'world') return 'guide';
  return 'life';
}

const FILE_AREAS = {
  career: /^(pro|proagent|projobs|propay|proshowcase)$/,
  school: /^(school|coursework|courserecord|classmates|ensemble|evaluation|feedback|briefs|practice|playreading|production|piece|workpieces|workbook|workload|learning|experience|engagement|enjoyment|interpretation|interpretation-read|artistry|leave|register|material|advice|next-steps|attributes)$/,
  money: /^(banking|bankmoves|banknumber|cardlife|cardoffers|cash|credit|finance|lending|payments|roundups|security|statements|accountlife|abroad|homeaccount|spending|obligations)$/,
  benefits: /^(taxreturn|statetax|withholding|earnings|assistance|unemployment|universalcredit|eiself|homebenefits|homepensions|imss|socialsecurity|statepension)$/,
  papers: /^(documents|citizenship|residence|permission|taxid|identity|papervisits|routing|health|appointments|therapy|clinics)$/,
};
/** A promise's area: the area of the guide's file the entry making it is in. */
const PROMISE_AREAS = { body: 'life', day: 'life', career: 'career', showcase: 'career', coursework: 'craft', craft: 'craft', productions: 'craft', school: 'school', money: 'money', taxes: 'benefits', papers: 'papers', documents: 'papers', start: 'guide' };
function areaOfFile(stem) {
  for (const [area, re] of Object.entries(FILE_AREAS)) if (re.test(stem)) return area;
  return 'life';
}

function loadRows() {
  const rows = [];
  const promises = [];
  if (!existsSync(ROWS)) return { rows, promises };
  for (const f of readdirSync(ROWS).filter((x) => x.endsWith('.json')).sort()) {
    const j = JSON.parse(read(join(ROWS, f)));
    for (const r of j.rows ?? []) rows.push({ ...r, file: f });
    for (const p of j.promises ?? []) promises.push({ ...p, file: f });
  }
  return { rows, promises };
}

/** Each test a row's evidence names, from its `tests` and from any `tests/….test.ts` written in its other evidence. */
const testsOf = (r) => [...new Set([...(r.evidence?.tests ?? []), ...JSON.stringify({ ...r.evidence, tests: undefined }).matchAll(/tests\/[\w./-]+\.test\.ts/g)].map((m) => (typeof m === 'string' ? m : m[0])))];

function problems() {
  const { features: found, promises: promised, constants } = features();
  const { rows, promises } = loadRows();
  const out = [];
  const seen = new Map();
  const byKind = new Map();
  for (const [k, v] of constants) byKind.set(v, [...(byKind.get(v) ?? []), k]);
  const issues = (t, k) => t.includes(`'${k}'`) || (byKind.get(k) ?? []).some((name) => new RegExp(`kind:\\s*${name}\\b`).test(t));
  for (const r of rows) {
    const where = `${r.file} ${r.id}`;
    if (seen.has(r.id)) out.push(`${where}: named again (first in ${seen.get(r.id)})`);
    seen.set(r.id, r.file);
    if (!found.has(r.id) && !EXTRA_KINDS.has(r.kind)) out.push(`${where}: no such feature in the code (a row for what the code keeps no list of says kind relationship, item, status or other)`);
    if (r.area !== r.file.replace(/\.json$/, '')) out.push(`${where}: its area says ${r.area}, its file ${r.file}`);
    if (!STATUSES.includes(r.status)) out.push(`${where}: status "${r.status}" isn't one of the seven`);
    if (typeof r.mechanic !== 'boolean') out.push(`${where}: mechanic or presentation isn't said`);
    if (r.seeded) out.push(`${where}: still seeded, not read against the code`);
    for (const f of FIELDS) if (!(typeof r[f] === 'string' && r[f].trim())) out.push(`${where}: ${f} is empty`);
    if (r.status !== DEFERRED && !r.mechanic && !(r.purpose ?? '').trim()) out.push(`${where}: a presentation row says its purpose`);
    if (r.status !== DONE && r.status !== DEFERRED && !(r.why ?? '').trim()) out.push(`${where}: a row not verified says why (what's missing, who decides, who deferred)`);
    if (r.status === DEFERRED && !/defer/i.test(r.why ?? '')) out.push(`${where}: Explicitly Deferred says who deferred it`);
    for (const c of r.consumers ?? []) {
      const m = /^([\w./-]+):(\d+)$/.exec(c.at ?? '');
      if (!m) { out.push(`${where}: consumer "${c.what}" has no file:line`); continue; }
      if (!existsSync(m[1])) out.push(`${where}: consumer at ${c.at}, no such file`);
      else if (Number(m[2]) > read(m[1]).split('\n').length) out.push(`${where}: consumer at ${c.at}, past the file's end`);
    }
    if (r.mechanic && [DONE, STATUSES[1]].includes(r.status) && !(r.consumers ?? []).length) out.push(`${where}: a mechanic says what reads its change (consumers)`);
    const tests = testsOf(r);
    for (const t of tests) {
      if (!IN_GATE.test(t)) out.push(`${where}: ${t} isn't a test the gate runs`);
      else if (!existsSync(t)) out.push(`${where}: ${t} isn't there`);
    }
    if (r.status === DONE && !tests.length) out.push(`${where}: verified with no test`);
    if (r.status === DONE && found.get(r.id) === 'command' && tests.length && !tests.some((t) => existsSync(t) && issues(read(t), r.id))) out.push(`${where}: verified, and none of its tests issues ${r.id}`);
  }
  for (const [id, kind] of found) if (!seen.has(id)) out.push(`${areaOf(id)}.json ${id}: a ${kind} no row names`);
  const pseen = new Set();
  for (const p of promises) {
    const where = `${p.file} ${p.id}`;
    if (pseen.has(p.id)) out.push(`${where}: named again`);
    pseen.add(p.id);
    if (!promised.some((x) => x.id === p.id)) out.push(`${where}: no such connection in the guide`);
    if (!STATUSES.includes(p.status)) out.push(`${where}: status "${p.status}" isn't one of the seven`);
    if (p.seeded) out.push(`${where}: still seeded, not read against the code`);
    if (!(p.holds ?? '').trim()) out.push(`${where}: says what in the code keeps the promise (holds)`);
    for (const t of testsOf(p)) if (!IN_GATE.test(t) || !existsSync(t)) out.push(`${where}: ${t} isn't a test the gate runs`);
    if (p.status === DONE && !testsOf(p).length) out.push(`${where}: verified with no test`);
    if (p.status !== DONE && p.status !== DEFERRED && !(p.why ?? '').trim()) out.push(`${where}: says why it isn't verified`);
  }
  for (const p of promised) if (!pseen.has(p.id)) out.push(`guide.json ${p.id}: a promise no row names`);
  return out;
}

function totals(list) {
  const t = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of list) if (t[r.status] !== undefined) t[r.status] += 1;
  const inScope = list.length - t[DEFERRED];
  return { t, inScope, done: t[DONE] };
}

const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—');
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

function page() {
  const { rows, promises } = loadRows();
  const all = totals(rows);
  const pr = totals(promises);
  const lines = [
    '# The Feature-To-Effect Matrix',
    '',
    'Written by `node tools/effects.mjs --write` from `effects/*.json`; don\'t edit it by hand. One row a feature the code has, found',
    'in the code (`tools/effects.mjs`, S1 of `criteria.md`), each read against it for the owner\'s brief 20: where the player',
    'meets it, what it needs, what it reads, what it changes at once, which systems read that change later and where, when',
    'and how the player meets the consequence, what a save keeps, the evidence and what\'s missing. The guide\'s promises, each',
    'connection one entry makes to another, are counted apart. Only Implemented And Verified counts as done, out of every row',
    'not Explicitly Deferred.',
    '',
    `**Features:** ${all.done} of ${all.inScope} in scope Implemented And Verified (${pct(all.done, all.inScope)}); ${STATUSES.slice(1).map((s) => `${all.t[s]} ${s}`).join(', ')}. ${rows.filter((r) => r.mechanic).length} mechanics, ${rows.filter((r) => !r.mechanic).length} presentation.`,
    '',
    `**The guide's promises:** ${pr.done} of ${pr.inScope} in scope Implemented And Verified (${pct(pr.done, pr.inScope)}); ${STATUSES.slice(1).map((s) => `${pr.t[s]} ${s}`).join(', ')}.`,
    '',
    '## Totals',
    '',
    `| Area | Rows | ${STATUSES.join(' | ')} | Promises | Promises verified |`,
    `|---|---|${STATUSES.map(() => '---').join('|')}|---|---|`,
  ];
  for (const a of AREAS) {
    const rs = rows.filter((r) => r.area === a);
    const ps = promises.filter((p) => p.file === `${a}.json`);
    const t = totals(rs);
    lines.push(`| ${a} | ${rs.length} | ${STATUSES.map((s) => t.t[s] || '').join(' | ')} | ${ps.length} | ${totals(ps).done} |`);
  }
  lines.push(`| **All** | **${rows.length}** | ${STATUSES.map((s) => `**${all.t[s]}**`).join(' | ')} | **${promises.length}** | **${pr.done}** |`, '');
  for (const a of AREAS) {
    const rs = rows.filter((r) => r.area === a);
    if (!rs.length) continue;
    lines.push(`## ${a[0].toUpperCase()}${a.slice(1)}`, '', '| Feature | Kind | Where | Prerequisites | Reads | Changes | Read later by | Experienced | Save And Load | Evidence | Missing | Status |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const r of rs) {
      const consumers = (r.consumers ?? []).map((c) => `${c.what} (\`${c.at}\`)`).join('; ');
      const ev = [testsOf(r).map((t) => `\`${t}\``).join(', '), r.evidence?.comparisons?.length ? `comparisons: ${r.evidence.comparisons.join('; ')}` : '', r.evidence?.mutations?.length ? `mutations: ${r.evidence.mutations.join(', ')}` : '', r.evidence?.journeys?.length ? `journeys: ${r.evidence.journeys.join(', ')}` : ''].filter(Boolean).join('; ');
      lines.push(`| \`${r.id}\` | ${r.kind}${r.mechanic ? '' : ` (presentation: ${cell(r.purpose)})`} | ${cell(r.where)} | ${cell(r.prerequisites)} | ${cell(r.reads)} | ${cell(r.changes)} | ${cell(consumers)} | ${cell(r.experienced)} | ${cell(r.saveLoad)} | ${cell(ev)} | ${cell(r.missing)} | ${r.status}${r.why ? `: ${cell(r.why)}` : ''} |`);
    }
    lines.push('');
    const ps = promises.filter((p) => p.file === `${a}.json`);
    if (ps.length) {
      lines.push(`### ${a[0].toUpperCase()}${a.slice(1)}: The Guide's Promises`, '', '| Promise | What It Says | What Keeps It | Evidence | Status |', '|---|---|---|---|---|');
      for (const p of ps) lines.push(`| \`${p.id}\` | ${cell(p.claim)} | ${cell(p.holds)} | ${testsOf(p).map((t) => `\`${t}\``).join(', ')} | ${p.status}${p.why ? `: ${cell(p.why)}` : ''} |`);
      lines.push('');
    }
  }
  return lines.join('\n') + '\n';
}

/** The completion matrix's row for a feature, where it has one (its id, or creation's and the dials' own names). */
function priorRows() {
  const cm = JSON.parse(read('docs/verification/integration-2026-10-16/completion-matrix.json')).rows;
  const by = new Map(cm.map((r) => [r.id, r]));
  const alias = { 'create.firstName': 'c-names', 'create.lastName': 'c-names', 'create.middleName': 'c-names', 'create.displayName': 'c-displayName', 'create.pronouns': 'c-pronouns', 'create.performerTitle': 'c-performerTitle', 'create.birthYear': 'c-birthdate', 'create.birthMonth': 'c-birthdate', 'create.birthDay': 'c-birthdate', 'create.homeRegionId': 'c-birthplace', 'create.raceEthnicity': 'c-race', 'create.raceEthnicityOwn': 'c-race', 'create.portrait': 'c-portrait', 'create.personalityTraits': 'c-traits', 'create.genres': 'c-genres', 'create.background': 'c-background', 'create.heightCm': 'c-body', 'create.weightKg': 'c-body', 'create.startLocationId': 'c-whereLive', 'create.livesWhereBorn': 'c-livesWhereBorn', 'create.wealth': 'c-wealth', 'create.family': 'c-family', 'create.bankId': 'c-bank', 'create.startYear': 'c-startDate', 'create.startMonth': 'c-startDate', 'create.startDay': 'c-startDate', 'create.tutorial': 'c-tutorial' };
  return (id) => by.get(id) ?? by.get(alias[id]) ?? (id.startsWith('dial.') ? by.get(id.slice(5)) : undefined) ?? (id.startsWith('axis.') ? by.get(`c-disp-${id.slice(5)}`) : undefined);
}

function seed() {
  const { features: found, promises: promised } = features();
  const { rows, promises } = loadRows();
  const have = new Set(rows.map((r) => r.id));
  const phave = new Set(promises.map((p) => p.id));
  const prior = priorRows();
  mkdirSync(ROWS, { recursive: true });
  const files = Object.fromEntries(AREAS.map((a) => [a, existsSync(`${ROWS}/${a}.json`) ? JSON.parse(read(`${ROWS}/${a}.json`)) : { area: a, rows: [], promises: [] }]));
  let added = 0;
  for (const [id, kind] of found) {
    if (have.has(id)) continue;
    const p = prior(id);
    const a = areaOf(id);
    files[a].rows.push({
      id, kind, area: a, mechanic: true, seeded: true,
      where: p?.entry ?? '', prerequisites: p?.preconditions ?? '', reads: p?.reads ?? '', changes: p?.changes ?? '',
      consumers: [], laterText: [p?.later, p?.systems].filter((x) => x && x !== 'Not recorded').join(' | '),
      experienced: p?.sees ?? '', saveLoad: p?.saveLoad ?? '',
      evidence: { tests: [...new Set([...(p?.evidence ?? '').matchAll(/tests\/[\w./-]+\.test\.ts/g)].map((m) => m[0]))], comparisons: [], mutations: [], journeys: [] },
      missing: '', status: p?.status ?? 'Implemented, Verification Incomplete', why: p && p.status !== DONE ? (p.failure ?? '') : '',
      prior: p ? p.id : null,
    });
    added += 1;
  }
  for (const p of promised) {
    if (phave.has(p.id)) continue;
    const a = PROMISE_AREAS[p.file.replace(/^.*\/|\.ts$/g, '')] ?? 'guide';
    files[a].promises.push({ id: p.id, kind: p.kind, claim: p.claim, entryFile: p.file, holds: '', tests: [], status: 'Implemented, Verification Incomplete', why: '', seeded: true });
    added += 1;
  }
  for (const a of AREAS) writeFileSync(`${ROWS}/${a}.json`, JSON.stringify(files[a], null, 1) + '\n');
  console.log(`seeded ${added} rows`);
}

const args = process.argv.slice(2);
if (args.includes('--seed')) seed();
else if (args.includes('--write')) { writeFileSync(PAGE, page()); console.log(`wrote ${PAGE}`); }
else if (args.includes('--todo')) {
  const area = args[args.indexOf('--todo') + 1];
  const { rows, promises } = loadRows();
  for (const r of [...rows, ...promises].filter((x) => x.seeded && (!area || x.file === `${area}.json`))) console.log(`${r.file} ${r.id}`);
} else if (args.includes('--check')) {
  const out = problems();
  if (existsSync(PAGE) && read(PAGE) !== page()) out.push(`${PAGE} is behind the rows: node tools/effects.mjs --write`);
  if (!existsSync(PAGE)) out.push(`${PAGE} isn't written: node tools/effects.mjs --write`);
  for (const p of out.slice(0, 200)) console.log(p);
  console.log(out.length ? `effects: ${out.length} problem${out.length === 1 ? '' : 's'}` : 'effects: every feature found in the code has a row read against it');
  process.exitCode = out.length ? 1 : 0;
} else {
  const { features: found, promises: promised } = features();
  const counts = {};
  for (const [, k] of found) counts[k] = (counts[k] ?? 0) + 1;
  console.log(`${found.size} features in the code:`, counts, `and ${promised.length} promises`);
  const { rows, promises } = loadRows();
  const t = totals(rows);
  console.log(`${rows.length} rows: ${t.done} of ${t.inScope} verified; ${rows.filter((r) => r.seeded).length} still seeded; ${promises.length} promises, ${promises.filter((p) => p.seeded).length} seeded`);
}
