/**
 * The rendered-text check: what the game actually printed, read for the faults a sentence built from parts can have
 * (from 2026-10-17, brief 14, section 7). `tools/text-inventory.mjs` reads the source; this reads the output: the
 * screens `tools/text-walk.mjs` recorded, and the notices and reviews a played journey kept (`tools/journeys.ts`).
 *
 *   node tools/text-render-check.mjs [--json OUT] FILE_OR_DIR...
 *
 * Each fault is counted by kind, with up to eight examples each and the file it came from. It exits 1 if it found any
 * fault outside ALLOWED. A fault isn't always wrong: a name a person spells with a capital inside it, a real domain
 * with a dot. Those are listed in ALLOWED with the reason, never silenced in the rule.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Names and forms that look like a fault and aren't, each with why. */
const ALLOWED = [
  [/\b(iQIYI|tvN|eBay|iPhone|iPad|YouTube|LinkedIn|McDonald|PayPal|DoorDash|GoFundMe|HealthCare|MasterCard|TikTok|WhatsApp|McKinsey|MacArthur|DeVos|LaGuardia|McCarter|MacDowell|DiCaprio|LeBlanc|DuBois|FedEx|JetBlue|SoHo|NoHo|TriBeCa|DeKalb|McNally|McCann|BlackRock|SmartBank|CaixaBank|ING|HSBC|BBVA|NatWest|BankAmericard|ePass|eSavings)\w*/g, 'a real name, spelled as its owner spells it'],
  [/\b[\w-]+\.(?:com|org|edu|gov|net|co\.uk|ac\.uk|gov\.uk|de|fr|is|mx|ca|jp|kr|es|it|nz|au|ie|nl|se|no|dk|fi|ch|at|be|pt|br|in|cn)\b/g, 'a web address'],
  [/\b(?:e\.g|i\.e|vs|St|Dr|Mr|Mrs|Ms|No|p|pp|a\.m|p\.m|U\.S|U\.K|Jr|Sr|Inc|Co|Ltd|approx|etc|Mt|Ave|Blvd|Rd)\.\s+[a-z]/g, 'an abbreviation, not a sentence’s end'],
];
const CHECKS = [
  ['a leaked value', /\bundefined\b|\bNaN\b|\[object Object\]|\bInvalid Date\b|\$\{|\{…\}|\bnull\b(?! and void)/],
  ['doubled punctuation', /(?<![.])([,;:!?])\1|\.\.(?!\.)|[,;:]\s*\.(?!\.)|\.\s*,|,\s*,/],
  ['a space before punctuation', /\S \s*[,;:.!?](?=\s|$)(?!\d)/],
  ['a doubled space', /\S {2,}\S/],
  ['a raw id', /\b[a-z]+(?:_[a-z0-9]+)+\b|\b(?:assignment|person|account|card|doc|plan|decision)_[0-9a-z]{4,}\b|\b(?:school|life|bank|card|health|tax|documents|world|calendar|practice|brief|genre|work|plays)\.[a-z_]+\b/],
  ['a lowercase word run into a capital', /\b[a-z]+[A-Z][a-z]+\b/],
  ['a doubled word', /\b(\w{2,}) \1\b/i],
  ['a plural that disagrees', /(?<![\d.,])\b1 (?:days|weeks|hours|minutes|pieces|times|terms|years|months|classes|nights|items|notices|courses|scenes|steps|sessions|questions|credits|payments)\b|\b(?:[02-9]|\d{2,}) (?:day|week|hour|minute|piece|term|year|month|class|night|item|notice|course|scene|step|session|question|credit|payment)(?=[.,;:!?)]|\s+(?:of|in|to|ago|left|later|before|after|from|and|or|is|was|are|were|a|an|the)\b|$)/],
  ['a sentence starting in lowercase', /[.!?] [a-z]/],
  ['an empty slot in a list', /, ,|\band and\b|\bor or\b|: \.|\(\s*\)|\band\.|, \.|\bthe the\b|\ba a\b|\ban an\b/],
  ['a timestamp in prose', /\b\d{4}-\d{2}-\d{2}T\d{2}/],
  ['money written oddly', /\$\d[\d,]*\.\d(?!\d)|\$-\d|-\$\d/],
];
function strip(t) { let s = t; for (const [re] of ALLOWED) s = s.replace(re, (m) => 'X'.repeat(m.length)); return s; }
function unbalanced(t) {
  const o = (t.match(/\(/g) ?? []).length, c = (t.match(/\)/g) ?? []).length;
  const q = (t.match(/“/g) ?? []).length, e = (t.match(/”/g) ?? []).length;
  return o !== c || q !== e;
}

/** The strings a file holds, as a player read them: a walk's screens, a journey's notices and reviews, else any prose. */
function strings(file) {
  const j = JSON.parse(readFileSync(file, 'utf8'));
  const out = [];
  const push = (where, t) => { if (typeof t === 'string' && t.trim()) out.push({ where, text: t }); };
  if (Array.isArray(j) && j.length && j[0] && 'screen' in j[0]) {
    for (const s of j) {
      const where = `${s.screen}${s.tab ? ` / ${s.tab}` : ''}`;
      for (const line of String(s.text ?? '').split('\n')) push(where, line);
      for (const k of ['buttons', 'labels', 'placeholders']) for (const x of s[k] ?? []) push(`${where} (${k})`, x);
      for (const d of s.dialogs ?? []) for (const line of d.split('\n')) push(`${where} (dialog)`, line);
    }
  } else if (j && Array.isArray(j.notices)) {
    for (const n of j.notices) { push(`notice ${n[0]} title`, n[1]); push(`notice ${n[0]}`, n[2]); }
    for (const r of j.reviews ?? []) push(`review ${r.at}`, r.reason);
    for (const n of Array.isArray(j.shownNotices) ? j.shownNotices : []) for (const x of Array.isArray(n) ? n.slice(1) : [n]) push('shown notice', x);
  } else {
    const walk = (v, where) => { if (typeof v === 'string') { if (/[a-z]{2,} [a-z]{2,} [a-z]{2,}/i.test(v)) push(where, v); } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${where}.${k}`); };
    walk(j, '');
  }
  return out;
}
const files = (p) => (statSync(p).isDirectory() ? readdirSync(p).flatMap((f) => files(join(p, f))) : p.endsWith('.json') ? [p] : []);

const args = process.argv.slice(2);
const jsonAt = args.indexOf('--json');
const OUT = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const found = {};
let read = 0;
const seen = new Set();
for (const f of args.flatMap(files)) {
  if (/walk\.json$|summary\.json$|compare\.json$/.test(f)) continue;
  for (const s of strings(f)) {
    read++;
    const t = strip(s.text);
    const hits = CHECKS.filter(([, re]) => re.test(t)).map(([k]) => k);
    if (unbalanced(s.text)) hits.push('an unbalanced bracket or quote');
    for (const k of hits) {
      const key = `${k}\u0000${s.text}`;
      if (seen.has(key)) { found[k].count++; continue; }
      seen.add(key);
      (found[k] ??= { count: 0, distinct: 0, examples: [] }).count++;
      found[k].distinct++;
      if (found[k].examples.length < 8) found[k].examples.push({ file: f, where: s.where, text: s.text.slice(0, 300) });
    }
  }
}
for (const [k, v] of Object.entries(found)) {
  console.log(`\n${k}: ${v.count} (${v.distinct} distinct)`);
  for (const e of v.examples) console.log(`  ${e.file} ${e.where}: ${e.text}`);
}
const total = Object.values(found).reduce((n, v) => n + v.distinct, 0);
console.log(`\n${read} strings read, ${total} distinct faults`);
if (OUT) writeFileSync(OUT, `${JSON.stringify({ read, found }, null, 1)}\n`);
process.exit(total ? 1 : 0);
