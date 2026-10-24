/**
 * Brief 25's coverage register held to the code (from 2026-10-23, the owner's brief 25, "SLATE — Master Career Build
 * Command"; docs/verification/career-world-2026-10-23/). One row a requirement of the brief's Parts 1 to 18 or a
 * scenario of the dossier's T01 to T100, each with the brief's fields (description, source and edition, applicability,
 * implementation, player entry point, state read, state written, downstream consumers, save behavior, tests, status,
 * blocker) and its six tracks kept apart (source located, source verified, rule extracted, implemented, tested,
 * externally blocked). The sources are the dossier's register, S01 to S110, in sources.json, each with what this build
 * itself retrieved or was refused.
 *
 *   node tools/career-register.mjs           prints the totals
 *   node tools/career-register.mjs --write   writes REGISTER.md and records any new row's id in register-ids.txt
 *   node tools/career-register.mjs --check   exits 1 on: a row recorded once and gone (Part 2: no completion bought by
 *                                            deleting a requirement); a field missing; a status not one of the owner's
 *                                            seven; a track not yes, no, partial or n/a; a file, test or evidence that
 *                                            isn't there; a test the gate doesn't run, or whose cited words it doesn't
 *                                            hold; a row called verified without tests (or evidence, for a process or a
 *                                            constraint), or a scenario called verified that no test names; a track
 *                                            said tested with no test, or implemented with nothing to point at; a
 *                                            source not in the register, or a source called verified that this build
 *                                            hasn't read; a blocked row with no blocker; a cover that isn't a row; or
 *                                            REGISTER.md behind the rows
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'docs/verification/career-world-2026-10-23';
const REGISTER = `${DIR}/register.json`;
const SOURCES = `${DIR}/sources.json`;
const IDS = `${DIR}/register-ids.txt`;
const PAGE = `${DIR}/REGISTER.md`;

const STATUSES = ['Implemented And Verified', 'Implemented, Verification Incomplete', 'Partially Implemented', 'Not Implemented', 'Blocked Externally', 'Decision Required', 'Explicitly Deferred'];
const TRACKS = ['sourceLocated', 'sourceVerified', 'ruleExtracted', 'implemented', 'tested', 'externallyBlocked'];
const TRACK_LABEL = { sourceLocated: 'Source Located', sourceVerified: 'Source Verified', ruleExtracted: 'Rule Extracted', implemented: 'Implemented', tested: 'Tested', externallyBlocked: 'Externally Blocked' };
const VALUES = ['yes', 'no', 'partial', 'n/a'];
const FIELDS = ['id', 'part', 'area', 'kind', 'description', 'sources', 'edition', 'applicability', 'implementation', 'entry', 'reads', 'writes', 'consumers', 'save', 'tests', 'evidence', 'status', 'blocker', 'tracks', 'covers'];
const KINDS = ['requirement', 'scenario', 'process', 'constraint'];
/** A test the gate runs: a .test.ts under tests/, as vitest.config.ts includes. */
const IN_GATE = /^tests\/(?:[\w.-]+\/)*[\w.-]+\.test\.ts$/;

const args = process.argv.slice(2);
const read = (f) => readFileSync(f, 'utf8');
const register = JSON.parse(read(REGISTER));
const rows = register.rows;
const sources = new Map(JSON.parse(read(SOURCES)).sources.map((s) => [s.id, s]));
const recorded = existsSync(IDS) ? read(IDS).split('\n').map((l) => l.trim()).filter(Boolean) : [];
const byId = new Map(rows.map((r) => [r.id, r]));

/** A test cited as `file` or `file#words`: the file, and the words its text must hold. */
const parseTest = (t) => { const i = t.indexOf('#'); return i < 0 ? { file: t } : { file: t.slice(0, i), needle: t.slice(i + 1) }; };

function problems() {
  const out = [];
  const say = (r, why) => out.push(`${r?.id ?? '?'}: ${why}`);
  const seen = new Set();
  for (const id of recorded) if (!byId.has(id)) out.push(`${id}: recorded in register-ids.txt and gone from the register (a requirement isn't deleted to finish)`);
  for (const r of rows) {
    if (seen.has(r.id)) say(r, 'named twice');
    seen.add(r.id);
    for (const f of FIELDS) if (!(f in r)) say(r, `no ${f}`);
    if (!KINDS.includes(r.kind)) say(r, `kind ${r.kind} isn't one of ${KINDS.join(', ')}`);
    if (!STATUSES.includes(r.status)) say(r, `status "${r.status}" isn't one of the owner's seven`);
    for (const k of ['description', 'entry', 'reads', 'writes', 'consumers', 'save']) if (typeof r[k] !== 'string' || !r[k].trim()) say(r, `${k} is empty`);
    for (const t of TRACKS) if (!VALUES.includes(r.tracks?.[t])) say(r, `track ${t} is "${r.tracks?.[t]}", not one of ${VALUES.join(', ')}`);
    for (const f of r.implementation ?? []) if (!existsSync(f)) say(r, `implementation ${f} isn't there`);
    for (const f of r.evidence ?? []) if (!existsSync(f)) say(r, `evidence ${f} isn't there`);
    for (const t of r.tests ?? []) {
      const { file, needle } = parseTest(t);
      if (!IN_GATE.test(file)) say(r, `test ${file} isn't one the gate runs`);
      else if (!existsSync(file)) say(r, `test ${file} isn't there`);
      else if (needle && !read(file).includes(needle)) say(r, `test ${file} doesn't hold "${needle}"`);
    }
    for (const s of r.sources ?? []) if (!sources.has(s)) say(r, `source ${s} isn't in sources.json`);
    if (r.tracks?.sourceVerified === 'yes') for (const s of r.sources ?? []) if (sources.get(s)?.status !== 'read') say(r, `source ${s} is called verified and this build hasn't read it`);
    if (r.tracks?.sourceLocated === 'yes' && !(r.sources ?? []).length) say(r, 'a source is called located and none is named');
    for (const c of r.covers ?? []) if (!byId.has(c)) say(r, `covers ${c}, which isn't a row`);
    const tested = (r.tests ?? []).length > 0;
    if (r.tracks?.tested === 'yes' && !tested) say(r, 'tested with no test named');
    if (r.tracks?.implemented === 'yes' && !(r.implementation ?? []).length && !(r.evidence ?? []).length) say(r, 'implemented with nothing to point at');
    if (r.status === 'Implemented And Verified') {
      if (r.kind === 'process' || r.kind === 'constraint') { if (!tested && !(r.evidence ?? []).length) say(r, 'verified with no test and no evidence'); }
      else {
        if (!tested) say(r, 'verified with no test');
        if (r.tracks?.implemented !== 'yes' || r.tracks?.tested !== 'yes') say(r, 'verified, and its implemented and tested tracks don’t both say yes');
      }
      if (r.kind === 'scenario') {
        const named = (r.tests ?? []).some((t) => { const { file } = parseTest(t); return existsSync(file) && new RegExp(`\\b${r.id}\\b`).test(read(file)); });
        if (!named) say(r, `a scenario called verified that no cited test names (${r.id})`);
      }
    }
    if (r.status === 'Blocked Externally' && (!r.blocker?.trim() || r.tracks?.externallyBlocked !== 'yes')) say(r, 'blocked with no blocker, or its externally blocked track not yes');
  }
  return out;
}

function counts() {
  const by = (f) => rows.reduce((m, r) => { const k = f(r); m[k] = (m[k] ?? 0) + 1; return m; }, {});
  return { status: by((r) => r.status), kind: by((r) => r.kind), tracks: Object.fromEntries(TRACKS.map((t) => [t, by((r) => r.tracks[t])])) };
}

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
function page() {
  const c = counts();
  const reqs = rows.filter((r) => r.kind !== 'scenario');
  const scen = rows.filter((r) => r.kind === 'scenario');
  const verified = (list) => list.filter((r) => r.status === STATUSES[0]).length;
  const L = [];
  L.push('# Brief 25’s Coverage Register', '');
  L.push('Written by `node tools/career-register.mjs --write` from `register.json`, never by hand; `--check` holds it to the code.', '');
  L.push(`${rows.length} rows: ${reqs.length} requirements, process rows and constraints from the brief’s Parts 1 to 18, and ${scen.length} scenarios from the dossier (T01 to T100). ${verified(reqs)} of the ${reqs.length} and ${verified(scen)} of the ${scen.length} are Implemented And Verified.`, '');
  L.push('| Status | Rows |', '|---|---|');
  for (const s of STATUSES) L.push(`| ${s} | ${c.status[s] ?? 0} |`);
  L.push('', '| Track | Yes | Partial | No | n/a |', '|---|---|---|---|---|');
  for (const t of TRACKS) L.push(`| ${TRACK_LABEL[t]} | ${c.tracks[t].yes ?? 0} | ${c.tracks[t].partial ?? 0} | ${c.tracks[t].no ?? 0} | ${c.tracks[t]['n/a'] ?? 0} |`);
  const areas = [...new Set(rows.map((r) => r.area))];
  for (const a of areas) {
    const list = rows.filter((r) => r.area === a);
    L.push('', `## ${a.charAt(0).toUpperCase() + a.slice(1)} (${list.length})`, '');
    L.push('| ID | Status | Requirement | Where | Tests | Tracks | Blocker |', '|---|---|---|---|---|---|---|');
    for (const r of list) {
      const tracks = TRACKS.map((t) => `${TRACK_LABEL[t].split(' ').map((w) => w[0]).join('')}: ${r.tracks[t]}`).join(', ');
      L.push(`| ${r.id} | ${r.status} | ${esc(r.description)}${r.sources.length ? ` (${r.sources.join(', ')})` : ''} | ${esc(r.implementation.map((f) => `\`${f}\``).join(', ') || '—')} | ${esc(r.tests.map((t) => `\`${t}\``).join(', ') || (r.evidence.length ? r.evidence.map((f) => `\`${f}\``).join(', ') : '—'))} | ${tracks} | ${esc(r.blocker) || '—'} |`);
    }
  }
  L.push('');
  return L.join('\n');
}

if (args.includes('--write')) {
  writeFileSync(PAGE, page());
  const fresh = rows.map((r) => r.id).filter((id) => !recorded.includes(id));
  if (fresh.length) writeFileSync(IDS, [...recorded, ...fresh].join('\n') + '\n');
  console.log(`wrote ${PAGE}${fresh.length ? `, recorded ${fresh.length} new ids` : ''}`);
}
const found = problems();
if (args.includes('--check')) {
  if (!existsSync(PAGE) || read(PAGE) !== page()) found.push('REGISTER.md is behind the rows: node tools/career-register.mjs --write');
  for (const p of found.slice(0, 200)) console.log(p);
  if (found.length) { console.log(`${found.length} problems`); process.exit(1); }
}
const c = counts();
console.log(`${rows.length} rows; ${STATUSES.map((s) => `${c.status[s] ?? 0} ${s}`).join(', ')}.`);
if (!args.includes('--check') && found.length) console.log(`${found.length} problems (--check to list)`);
