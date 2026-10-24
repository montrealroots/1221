// Brief 27's research register as a page (2026-10-24): "Research with primary sources ... recorded with the URL, the
// organization, the date read, the edition or date of the page, the territory and the confidence" (Parts 3 and 4), and the
// owner's word on 2026-10-24: "Verify previously unread sources before treating their claims as confirmed."
//
//   node docs/verification/career-universe-2026-10-24/research/register.mjs
//
// Writes REGISTER.md beside it from register.json, which is kept by hand and by the fetch log: each entry is a page this
// build asked for, with every attempt, what came back (its HTTP status, its size and its SHA-256), and, for a page read,
// each fact it establishes with the page's own words. A page not read establishes nothing: its claims, brief 25's among
// them, aren't treated as confirmed, and `tests/b27-research-register.test.ts` fails one that does.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PAGE = join(HERE, 'REGISTER.md');
export const STATUSES = ['read', 'blocked', 'unreadable', 'unreached'];
const WHAT = {
  read: 'Read: the page came back whole and its text was kept; the facts below are what was read from it.',
  blocked: 'Blocked: the site refused this build (HTTP 403 or 429). Not worked around.',
  unreadable: 'Unreadable: the page came back, but its words load only in a browser, or it held nothing of the subject.',
  unreached: 'Unreached: no answer, a connection that failed, a certificate the proxy couldn’t verify, or no page at the address.',
};

const esc = (s) => String(s ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function render(reg = JSON.parse(readFileSync(join(HERE, 'register.json'), 'utf8'))) {
  const rows = reg.sources;
  const count = (f) => rows.filter(f).length;
  const b25 = rows.filter((r) => r.register === 'b25');
  const out = [
    '# Research Register (Brief 27)', '',
    'Written by `register.mjs` from `register.json`; `tests/b27-research-register.test.ts` fails when this page is behind it.', '',
    `**${rows.length} pages asked for:** ${STATUSES.map((s) => `${count((r) => r.status === s)} ${s}`).join(', ')}. **Facts established:** ${rows.reduce((a, r) => a + r.establishes.length, 0)}, each with the page's own words, from ${count((r) => r.establishes.length > 0)} pages read.`, '',
    `**Brief 25's unread sources, asked for again:** ${b25.length} (its dossier located them, or its build couldn't read them). ${count((r) => r.register === 'b25' && r.status === 'read')} came back whole, and each claim the game makes from one was checked against it: the facts below, from ${count((r) => r.register === 'b25' && r.establishes.length > 0)} of them. The rest the game cites only as what isn't in it yet (a country's gaps, an award whose rules weren't read), so nothing in them was taken as a rule. ${count((r) => r.register === 'b25' && r.status !== 'read')} didn't come back, and their claims stay unconfirmed: the game says so where it names them ("refused", "loads only in a browser", "located and not read"). Network access was full on 2026-10-24, and each was asked for again that evening; none that refused was worked around.`, '',
    ...STATUSES.map((s) => `- ${WHAT[s]}`), '',
    '## Facts Established', '',
    '| Source | Fact | The page’s words |', '|---|---|---|',
    ...rows.flatMap((r) => r.establishes.map((f) => `| \`${r.id}\` | ${esc(f.fact)} | “${esc(f.quote)}” |`)), '',
    '## Every Page', '',
    '| Id | Title | Organization | Territory | Status | Retrieved | Page dated | Confidence | Attempts | SHA-256 | Address |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| \`${r.id}\` | ${esc(r.title)} | ${esc(r.organization)} | ${esc(r.territory)} | ${r.status} (HTTP ${r.http}) | ${esc(r.retrieved)} | ${esc(r.updated)} | ${esc(r.confidence)} | ${(r.attempts ?? []).length} | ${r.status === 'read' ? `\`${r.sha256.slice(0, 12)}\`` : '—'} | ${esc(r.final ?? r.url)} |`),
    '',
  ];
  return out.join('\n');
}

if (!process.env.VITEST) {
  writeFileSync(PAGE, render());
  console.log(`wrote ${PAGE}`);
}
