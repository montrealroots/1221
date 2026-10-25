// Brief 27, Area C (2026-10-24): every row of the foundation's completion matrix that isn't Implemented And Verified or
// Explicitly Deferred, read from the matrix as it stands and classified by what it lacks, as Area C asks: "For each
// outstanding row: Quote or reference its actual acceptance requirement. Identify the affected implementation.
// Determine whether it lacks behavior, proof, a product decision, or external evidence."
//
//   node docs/verification/career-universe-2026-10-24/foundation/outstanding.mjs
//
// Writes OUTSTANDING.md and outstanding.json beside it. The class is read from the row and its source, never typed per
// row: a measured criterion whose watched files changed since (`tools/completion-matrix.mjs`, `current`), an audit or
// checklist row reached only on a fixture abroad, one of the four rows that put a question to the owner, or one of
// brief 25's commands that no audit has read yet. The requirement is the row's own `goal`, quoted to its first 300
// characters; the implementation is the row's own.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../../..');
const matrix = JSON.parse(readFileSync(join(ROOT, 'docs/verification/integration-2026-10-16/completion-matrix.json'), 'utf8'));
const criteria = JSON.parse(readFileSync(join(ROOT, 'docs/verification/integration-2026-10-16/criteria.json'), 'utf8'));
const measured = new Map();
// A criterion's measurement is on its row, or on the override a later brief's final runs set (brief 22's, for the
// checklists' rows).
for (const r of [...criteria.rows, ...(criteria.overrides ?? [])]) if (r.measured) measured.set(r.id, r.measured);

const IVI = 'Implemented, Verification Incomplete';
const DR = 'Decision Required';

/** The four questions the owner holds, each with the record that asks it. */
const QUESTIONS = {
  'KS-bank-rows-scope': 'Whether the nine bank commands no Yale player reaches (an arranged overdraft, a switch and its steps, a money transfer, a canceled new account, an overrun loan) stay counted against completion or move to Explicitly Deferred, since lives abroad went in the scope reset of 2026-10-09 (docs/verification/CURRENT-SCOPE-2026-10-15.md, The Owner\'s Decisions, 2).',
  'banking.2.scope': 'The same decision, as brief 09\'s banking checklist asks it: six students keeping an account at home are refused each of the eight in its words (tests/remaining-09-banking.test.ts).',
  'coverage09.3-unresolved': 'The same decision for the three state-tax rows (Connecticut, the only state a student\'s return owes, has no catch-up, no lien in error a student can reach and no three-year penalty) and for tax.amend, which nothing in scope changes a filed year to reach.',
  'ST6-R2.e': 'A methodology question on brief 12\'s replacement criterion: whether "more" in (e2) reads where there\'s room above the even actor. On stage the restrained specialist\'s benefit shows only against the grain (13 of 57 against 0). The recommendation (close it) was seen after the run, so it was proposed, not adopted (docs/verification/resolution-2026-10-17/acting-result.json).',
};
/** The tax rows Connecticut's rules or the scope keep from a student's life. */
const TAX = new Set(['tax.amend', 'tax.catch_up_state_plan', 'tax.lien_dispute', 'tax.request_waiver']);

function classify(r) {
  if (r.status === DR) return { class: 'A product decision', lacks: QUESTIONS[r.id] ?? 'A question the row puts to the owner', action: 'Escalated (CHECKPOINT.md, Outstanding Decisions); nothing implemented ahead of the answer.' };
  const m = measured.get(r.id);
  if (m) return { class: 'Proof: a measurement behind the code', lacks: `Measured on ${m.commit} (${m.watch === 'judge' ? 'the judge\'s lanes' : m.watch === 'engine' ? 'brief 22\'s long runs, which read all of src/engine' : 'the built app and the gate'}); brief 25's merge and brief 27's work changed what it reads.`, action: 'Measured again on brief 27\'s finished commit (milestone F), with each figure beside the last; a figure that moves is read against its criterion before the row is called verified.' };
  if (TAX.has(r.id)) return { class: 'Proof in a played life, behind a product decision', lacks: 'Behavior exists and is tested on fixtures; no student\'s life reaches it under Connecticut\'s rules (the row\'s Open note).', action: 'Waits on coverage09.3-unresolved. Not deferred and not counted verified.' };
  if (r.source === 'audit' || r.source.includes('banking-checklist')) return { class: 'Proof in a played life, behind a product decision', lacks: 'Behavior exists and is tested on lives abroad (fixtures); every New Haven bank refuses it or has no such product.', action: 'Waits on KS-bank-rows-scope. Not deferred and not counted verified.' };
  if (r.group === 'Commands Traced Outside The Audit') return { class: 'Proof: no audit reading yet', lacks: `${B25.has(r.id) ? 'Brief 25' : 'Brief 27'}'s command, traced in connected-journey/TRACE.md and tested, but read by no audit row, so the matrix can\'t call it verified.`, action: 'Waits on an audit reading by a reader who wrote neither the command nor its tests, as the audit\'s rows require (`independent`); one agent builds brief 27 at the owner\'s word, so its builder\'s own reading can\'t be that, and the row stays Implemented, Verification Incomplete until such a reader reads it.' };
  return { class: 'Unclassified', lacks: 'Read the row', action: 'Read the row' };
}

// Brief 25's commands an audit hasn't read; the rest in that class are brief 27's (K3's voice demo, K4's asks, K7's awards and ceremony).
const B25 = new Set(['pro.apply_work_visa', 'pro.ask_pay', 'pro.award_enter', 'pro.watch_ceremony', 'pro.work_choice']);
const rows = matrix.rows.filter((r) => r.status === IVI || r.status === DR).map((r) => ({
  id: r.id, group: r.group, status: r.status,
  // The goal in the house's spelling, as `tools/spelling.mjs` holds it: a British double l in a row's "canceled" goes.
  requirement: String(r.goal ?? '').replace(/\s+/g, ' ').replace(/\bcancel{2}ed\b/g, 'canceled').slice(0, 300) + (String(r.goal ?? '').length > 300 ? '…' : ''),
  implementation: String(r.implementation ?? 'Not recorded').replace(/\s+/g, ' ').slice(0, 160),
  ...classify(r),
}));
const B27 = rows.filter((r) => r.class === 'Proof: no audit reading yet' && !B25.has(r.id)).map((r) => r.id);
const byClass = {};
for (const r of rows) byClass[r.class] = (byClass[r.class] ?? 0) + 1;
writeFileSync(join(HERE, 'outstanding.json'), JSON.stringify({ written: 'by outstanding.mjs, from completion-matrix.json and criteria.json', completion: matrix.completion, byClass, rows }, null, 1) + '\n');

const esc = (s) => String(s).replace(/\|/g, '\\|');
const out = [
  '# The Foundation Matrix\'s Outstanding Rows (Brief 27, Area C)', '',
  'Written by `outstanding.mjs` from `../../integration-2026-10-16/completion-matrix.json` as it stands; nothing here is',
  'typed per row. This is the foundation matrix\'s accounting only: the career expansion is counted in its own matrix, and',
  'completing these rows isn\'t completing the career build.', '',
  `**The matrix:** ${matrix.completion}`, '',
  '| Class | Rows |', '|---|---|',
  ...Object.entries(byClass).map(([k, v]) => `| ${k} | ${v} |`), '',
  'Before brief 25\'s merge the matrix had 24 such rows (634 of 658): the 20 rows reached only on fixtures and the 4',
  `decisions. Brief 25 added 5 commands no audit has read and brief 27 ${B27.length} more (${B27.map((id) => `\`${id}\``).join(', ')}), and their changes`,
  `to \`src/engine\` left ${byClass['Proof: a measurement behind the code'] ?? 0} measured criteria behind the code; none of those is a defect found, and each is measured or read`,
  'again before it is called verified.', '',
  '| Row | Group | Status | Class | Requirement (the row\'s goal) | Implementation | What it lacks | What happens |',
  '|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| \`${r.id}\` | ${esc(r.group)} | ${r.status} | ${r.class} | ${esc(r.requirement)} | ${esc(r.implementation)} | ${esc(r.lacks)} | ${esc(r.action)} |`),
  '',
];
writeFileSync(join(HERE, 'OUTSTANDING.md'), out.join('\n'));
console.log(`${rows.length} rows: ${Object.entries(byClass).map(([k, v]) => `${v} ${k}`).join('; ')}`);
