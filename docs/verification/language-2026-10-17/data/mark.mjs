/**
 * Brief 14, the research data's dates: re-marks each source whose words this pass changed, by its own area, after its
 * last edit, through `tools/text-inventory.mjs --mark` (never by hand). The evidence says what was changed and what
 * verified it, and keeps the area's own review of the rest of the source after it.
 *
 *   node docs/verification/language-2026-10-17/data/mark.mjs [--dry]
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';

const dry = process.argv.includes('--dry');
const T = 'tests/language-data-dates.test.ts';
const DRAWN = `${T} 'says the day a product, a card, its cash, its security and its term deposit were read…' (Chase, drawn) and 'says the day the bank’s terms and its round-up rule were read…' (Bank of America, drawn)`;
/** By the file a source is in: what changed, and how it was verified. */
const GROUPS = [
  [/^src\/engine\/content\/(cards|accountlife|cash|pending|security)\.ts#/, `its dates as the game writes them, and no space before a semicolon, by tools/research-dates.mjs --write (the words step for files whose generator isn't in the repository, BY_HAND for the slashed ones): ${T} 'the bank research made by scripts outside the repository: every field the screens show' (no date left for the step, none slashed or dotted outside a number); ${DRAWN}; docs/verification/language-2026-10-17/data/generated-diff.txt (no other value changed)`],
  [/^src\/engine\/content\/roundups\.ts#/, `its dates as the game writes them (docs/verification/language-2026-10-17/data/apply-hand.mjs, each read by hand): ${T} 'the bank research kept by hand…' and 'says the day the bank’s terms and its round-up rule were read…' (drawn); tests/roundups.test.ts 'the panel' (its Source line and the day it was checked, drawn)`],
  [/^src\/engine\/(content\/(banks-thirteen|banks-lending|banks-world-fees|banks-world-sheets|bankopening)\.ts|systems\/accountlife\.ts)#/, `its dates as the game writes them (docs/verification/language-2026-10-17/data/apply-hand.mjs, each read by hand, and the slashed ones by hand): ${T} 'the bank research kept by hand: each product’s, fee’s, overdraft’s, term’s, loan’s, round-up’s and opening’s source' (no date left for tools/research-dates.mjs, none slashed or dotted outside a number); ${DRAWN}`],
  [/^src\/ui\/bank\/BankCard\.tsx#CardPanel$/, `its Source line's day as the game writes it (formatDateKey), said once where the source already ends on it: ${T} 'says the day a product, a card, its cash, its security and its term deposit were read…' (drawn)`],
];

const inv = (() => { execFileSync('node', ['tools/text-inventory.mjs', '--write']); const j = JSON.parse(readFileSync('docs/text/inventory.json', 'utf8')); execFileSync('git', ['checkout', '--', 'docs/text/inventory.json', 'docs/text/INVENTORY.md']); return j; })();
const owner = {}; const before = {};
for (const f of readdirSync('docs/text/statuses').filter((x) => x.endsWith('.json')).sort((a, b) => (a === 'baseline.json' ? -1 : b === 'baseline.json' ? 1 : a.localeCompare(b)))) {
  for (const [id, st] of Object.entries(JSON.parse(readFileSync(`docs/text/statuses/${f}`, 'utf8')))) { owner[id] = f.slice(0, -5); before[id] = st; }
}
const changed = inv.sources.filter((s) => s.status === 'Pending' && /^changed since/.test(s.why ?? ''));
let n = 0;
for (const s of changed) {
  const group = GROUPS.find(([re]) => re.test(s.id));
  if (!group) { console.error(`no group for ${s.id}`); process.exitCode = 1; continue; }
  const was = before[s.id];
  const area = owner[s.id] === 'baseline' ? s.subsystem : owner[s.id];
  const kept = was ? ` As the ${area} area ${was.status === 'Rewritten And Verified' ? 'verified the rest' : 'kept the rest'}: ${was.evidence ?? was.reason}` : '';
  const evidence = `${group[1][0].toUpperCase()}${group[1].slice(1)}.${kept}`;
  // A source's id is matched whole: its brackets and dots escaped by the tool, and no * in any id here.
  if (dry) console.log(`${area}\t${s.id}\n  ${evidence.slice(0, 300)}`);
  else execFileSync('node', ['tools/text-inventory.mjs', '--mark', s.id, 'Rewritten And Verified', '--by', area, '--evidence', evidence], { stdio: 'inherit' });
  n++;
}
console.log(`${n} sources ${dry ? 'would be' : ''} re-marked`);
