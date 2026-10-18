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
const PAPERS = `${T} 'each passport’s fee and its note from abroad, each entry rule’s note, the permit’s issuer, each office abroad and each visa…' (no date left for the step, none slashed or dotted outside a number)`;
const GUIDE_T = `${T} 'every entry of the guide and every chapter of the tutorial, the papers guide’s built days among them'`;
const DRAWN = `${T} 'says the day a product, a card, its cash, its security and its term deposit were read…' (Chase, drawn) and 'says the day the bank’s terms and its round-up rule were read…' (Bank of America, drawn)`;
/** By the file a source is in: what changed, and how it was verified. */
const GROUPS = [
  [/^src\/engine\/content\/(cards|accountlife|cash|pending|security)\.ts#/, `its dates as the game writes them, and no space before a semicolon, by tools/research-dates.mjs --write (the words step for files whose generator isn't in the repository, BY_HAND for the slashed ones): ${T} 'the bank research made by scripts outside the repository: every field the screens show' (no date left for the step, none slashed or dotted outside a number); ${DRAWN}; docs/verification/language-2026-10-17/data/generated-diff.txt (no other value changed)`],
  [/^src\/engine\/content\/roundups\.ts#/, `its dates as the game writes them (docs/verification/language-2026-10-17/data/apply-hand.mjs, each read by hand): ${T} 'the bank research kept by hand…' and 'says the day the bank’s terms and its round-up rule were read…' (drawn); tests/roundups.test.ts 'the panel' (its Source line and the day it was checked, drawn)`],
  [/^src\/engine\/(content\/(banks-thirteen|banks-lending|banks-world-fees|banks-world-sheets|bankopening)\.ts|systems\/accountlife\.ts)#/, `its dates as the game writes them (docs/verification/language-2026-10-17/data/apply-hand.mjs, each read by hand, and the slashed ones by hand): ${T} 'the bank research kept by hand: each product’s, fee’s, overdraft’s, term’s, loan’s, round-up’s and opening’s source' (no date left for tools/research-dates.mjs, none slashed or dotted outside a number); ${DRAWN}`],
  [/^src\/ui\/bank\/BankCard\.tsx#CardPanel$/, `its Source line's day as the game writes it (formatDateKey), said once where the source already ends on it: ${T} 'says the day a product, a card, its cash, its security and its term deposit were read…' (drawn)`],
  // Batch 2: the papers research and the running times.
  [/^src\/engine\/content\/entry\.ts#/, `its notes' dates as the game writes them, by tools/build-entry.mjs's words step (gameDates from tools/research-dates.mjs on each note on the way in; the research file keeps its own): ${PAPERS}; the builder run (docs/verification/language-2026-10-17/data/build-entry.txt), its diff the notes alone`],
  [/^src\/engine\/content\/passports\.ts#/, `its fee's basis and its note from abroad with their dates as the game writes them, by tools/build-passports.mjs's words step (the research keeps its own): ${PAPERS}; the builder run (build-passports.txt), its diff those two fields alone; tests/remaining-papers.test.ts (Your Passport drawn)`],
  [/^src\/engine\/content\/licenses\.ts#/, `its permit issuer's date as the game writes it, by tools/build-licenses.mjs's words step; the builder now gives the committed file (it had dropped New York's MCTD district and Mexico City's name, both set by hand on 2026-10-06), its diff the one issuer (build-licenses.txt): ${PAPERS}`],
  [/^src\/engine\/content\/(passportsabroad|visas)\.ts#/, `its dates as the game writes them (docs/verification/language-2026-10-17/data/apply-hand.mjs, each read by hand): ${PAPERS}; tests/remaining-papers.test.ts, each office abroad drawn on Your Passport with its date ("£116.50 from April 8, 2026", "US$62 from July 1, 2026", "from May 2, 2025", "from June 1, 2026", "from May 1, 2026")`],
  [/^src\/engine\/content\/guide\/papers\.ts#/, `its days month first: the built ones (dayMonth, fullDay, the day Enroll opens) and the written ones: ${GUIDE_T}; tests/guide-examples-papers.test.ts (On August 1 a notice says…, From September 1…, Enrolled ahead, from <month day>…); tests/evidence2-b13.test.ts (Health Cover's reference drawn: "From January 1, 2027, …")`],
  [/^src\/engine\/content\/tutorial\.ts#/, `its day month first, "by the next January 31": ${GUIDE_T}`],
  [/^src\/engine\/content\/workload\.ts#/, `its running times' dates as the game writes them (apply-hand.mjs, each read by hand), as Source for the running time shows them: ${T} 'each production’s running time, as Source for the running time says it'`],
  [/^src\/ui\/workspaces\/PapersWorkspace\.tsx#ReturnsPane$/, `its days month first ("A return is due April 15 … June 15", "by April 30", "each January 31"): tests/defects-g8-8.test.ts 'the fine print gives the 1040-NR’s June date…' (drawn); ${GUIDE_T}`],
  [/^src\/ui\/workspaces\/PapersWorkspace\.tsx#(DentalPanel|PensionsPanel)$/, `its day month first: ${T} 'PLAYER JOURNEY: a student reads Health Cover’s dental plan and, with a UK pension claimed, the State Pension’s fine print' (drawn)`],
  // Batch 3: the genres' research.
  [/^src\/engine\/content\/genre-demands\.json#/, `its dates as the game writes them (how it was read, "reviewed October 10, 2026"; what's uncertain, "On review (October 10, 2026)"; a citation's day), by tools/build-attribute-content.mjs's words step (gameDates, never inside a quotation or a web address; the research keeps its own): ${T} 'each genre’s claim, reasons, what the research says…' and 'PLAYER JOURNEY: a first-year opens Horror and Adventure…' (the genre look drawn); the builder run (build-attribute-content.txt), its diff those three fields alone`],
  [/^src\/ui\/workspaces\/SchoolWorkspace\.tsx#WithdrawControl$/, `its day month first, "(August 1, for a fall term)": tests/defects-g8-4.test.ts (Withdraw drawn)`],
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
