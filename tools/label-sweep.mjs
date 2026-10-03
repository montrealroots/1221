/**
 * Finds every label in the game that does not start each word with a capital.
 *
 * The Title Case tool covers labels written in the interface. This covers the
 * other half: the names inside the content registries — genres, certificates,
 * attributes, traits, awards, professions, brands — which are rendered as
 * labels wherever they appear, and which no amount of care in a component can
 * fix if the data itself is lowercase.
 *
 * It reports rather than rewrites, because a name in a registry may be a real
 * one — "iPhone", "n-th", "de Havilland" — and those are spelled the way the
 * world spells them.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * Words that stay lowercase inside a real name.
 *
 * SLATE's own labels are Title Case to the letter — "D23 Day At Angel
 * Stadium". A real organization's name is spelled the way that organization
 * spells it: "The Producers Guild of America Awards", "The Globe and Mail",
 * "Sight and Sound". Capitalising those would not be tidier, it would be
 * wrong, so the joining words inside a name are allowed — never at the front.
 */
const JOINING_WORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'de', 'del', 'della', 'alla', 'di', 'da', 'du', 'for', 'from', 'in',
  'la', 'le', 'of', 'on', 'or', 'the', 'to', 'van', 'von', 'with', 'bin', 'al',
  'à',  // Banque Internationale à Luxembourg, as the bank writes it.
]);

/**
 * Real names that are not Title Case, and must not be "corrected".
 *
 * The house rule is Title Case for every label SLATE writes. It does not
 * apply to a real company's own name: dm is lowercase on the shopfront and
 * Pick n Pay has a lowercase n on the sign, and rewriting either of them
 * would make the game wrong rather than tidy. Anything added here has to be
 * a name somebody else chose, verifiable on their own signage.
 */
const REAL_NAMES_AS_WRITTEN = new Set([
  'dm',                 // German drugstore chain; lowercase in its own logo.
  'Pick n Pay',         // South African grocer; the n is lowercase on the sign.
  'iRobot Roomba j9+',  // Product name as the manufacturer writes it.
  'Arion banki',        // Icelandic bank; banki is lowercase in its own name and signage.
  // parkrun writes its own name lowercase, and each event as '<Place> parkrun' (`content/clubs.ts`).
  // hi sonrisa, the Mexico City dental clinic, writes its name in lower case (from 2026-10-03).
  'hi sonrisa',
  'Brooklyn Bridge parkrun', 'Battersea parkrun', 'Bushy parkrun', 'Fairview parkrun', 'Budapest Park parkrun', 'Spanish Banks Beach parkrun',
  // Public examinations, written the way the country that sets them writes
  // them. A Chinese, Korean, Japanese, Hebrew or Arabic name has no capital
  // letters to check, and the Spanish, Portuguese and Indian ones carry
  // joining words that are part of the real name.
  '普通高等学校招生全国统一考试',                              // The Gaokao.
  '初中学业水平考试',                                          // The Zhongkao.
  '대학수학능력시험',                                          // The Suneung.
  '大学入学共通テスト',                                        // The Japanese Common Test.
  'الثانوية العامة',                                          // Thanaweya Amma.
  'בגרות',                                                    // The Bagrut.
  'Единый Государственный Экзамен',                            // The EGE.
  'Основной Государственный Экзамен',                          // The OGE.
  'La Evaluación de Bachillerato para el Acceso a la Universidad',
  'O Exame Nacional do Ensino Médio',
  'El Examen Nacional de Ingreso a la Educación Superior',
  'The National Eligibility cum Entrance Test',
]);

/**
 * Fields that hold a label rather than prose or a key. `category` and `group`
 * are deliberately absent: those are identifiers with their own label maps,
 * and capitalising them would break every lookup that uses them.
 */
const LABEL_KEYS = /\b(name|shortName|label|title|heading|tab|cta|actionLabel)\b/;

/**
 * Fields that hold a *list* of labels. These reach the screen as chips, one
 * word each, and a lowercase one shows up there exactly the way a lowercase
 * `name` does — but no scalar rule catches them, because the label is inside
 * an array rather than after a colon.
 */
const LABEL_ARRAY_KEYS = /\b(features|amenities|perks|highlights|inclusions|equipment|facilities|includes|benefits|palette|materials|finishes|colours)\b/;

const WRITE = process.argv.includes('--write');

const files = execSync('git ls-files --cached --others --exclude-standard "src/engine/**/*.ts" "src/engine/*.ts"', { encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter((f) => !/world-data|records|market-profiles|premise|logline|holidays-data|geography-data/.test(f));

const problems = [];

/** Whether one label reads as Title Case. Returns the words that do not. */
function lowercaseWordsIn(value) {
  if (/[.?!]$/.test(value)) return [];
  return value.split(/\s+/).filter((word, i) => {
    // Strip leading punctuation and quotes, but not letters: "Île" starts
    // with a capital, and stripping the accent off it would say otherwise.
    const cleaned = word.replace(/^[^\p{L}]+/u, '');
    const first = cleaned[0];
    if (!first) return false;
    if (first !== first.toLowerCase()) return false;
    // A name that carries its own capital — tvN, iQIYI, iPhone — is spelled
    // that way on purpose.
    if (/[A-Z]/.test(cleaned)) return false;
    // So is a model designation with a number in it: the Angénieux Optimo
    // Ultra 12x, the Aputure LS 600d, where the letter means something to
    // the maker. The digits are checked on the word itself, because the
    // leading ones are stripped before the first letter is looked at.
    if (/\d/.test(word)) return false;
    if (i > 0 && JOINING_WORDS.has(cleaned.toLowerCase())) return false;
    return true;
  });
}

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');

  // Lists of labels: features: ['Elevator', 'Shared laundry'].
  lines.forEach((line, index) => {
    if (!LABEL_ARRAY_KEYS.test(line)) return;
    const arrays = /\b(features|amenities|perks|highlights|inclusions|equipment|facilities|includes|benefits|palette|materials|finishes|colours):\s*\[([^\]]*)\]/g;
    let outer;
    while ((outer = arrays.exec(line)) !== null) {
      const [, key, body] = outer;
      // A list of lists is a list of ids, not labels: facilities: [['weights', 'floor'], ...].
      if (body.trim().startsWith('[')) continue;
      for (const entry of body.matchAll(/'((?:[^'\\]|\\.){2,70})'/g)) {
        const value = entry[1];
        const bad = lowercaseWordsIn(value);
        if (bad.length > 0 && !REAL_NAMES_AS_WRITTEN.has(value)) problems.push({ file, line: index + 1, key, value, bad });
      }
    }
  });

  lines.forEach((line, index) => {
    if (!LABEL_KEYS.test(line)) return;
    const re = /\b(name|shortName|label|title|heading|tab|cta|actionLabel):\s*'((?:[^'\\\\]|\\\\.){2,70})'/g;
    let match;
    while ((match = re.exec(line)) !== null) {
      const [, key, value] = match;
      // Prose in a label field is caught by the other tool; here we only want
      // words that begin lowercase.
      const bad = lowercaseWordsIn(value);
      if (bad.length > 0 && !REAL_NAMES_AS_WRITTEN.has(value)) problems.push({ file, line: index + 1, key, value, bad });
    }
    // A title built from a template — `${bill.name} Is Unpaid` — reaches the
    // screen the same way. The slots are set aside and the words around them
    // are held to the same rule; a slot stands in as a capitalised word so a
    // possessive after it ("'s Birthday") reads as one, and the words around
    // it still have to carry their own capital.
    const template = /\b(title|label|heading|cta|actionLabel):\s*`([^`]{2,160})`/g;
    while ((match = template.exec(line)) !== null) {
      const [, key, raw] = match;
      const value = raw.replace(/\$\{[^}]*\}/g, 'Slot').replace(/\s+/g, ' ').trim();
      if (!value) continue;
      const bad = lowercaseWordsIn(value);
      if (bad.length > 0) problems.push({ file, line: index + 1, key, value: raw, bad, template: true });
    }
  });
}

/**
 * Title Case for one label: every word starts with a capital, and anything
 * spelled with its own capitals — iPhone, tvN, LS 600d — is left alone.
 */
function toTitleCase(value) {
  return value.replace(/\S+/g, (word) => {
    const at = word.search(/\p{L}/u);
    if (at < 0) return word;
    const rest = word.slice(at + 1);
    if (/\p{Lu}/u.test(rest)) return word;
    if (/\d/.test(word)) return word;
    return word.slice(0, at) + word[at].toUpperCase() + rest;
  });
}

if (WRITE) {
  const byFileLines = new Map();
  for (const problem of problems) {
    if (!byFileLines.has(problem.file)) byFileLines.set(problem.file, readFileSync(problem.file, 'utf8').split('\n'));
    const lines = byFileLines.get(problem.file);
    const index = problem.line - 1;
    if (problem.template) continue;
    const fixed = toTitleCase(problem.value);
    if (fixed === problem.value) continue;
    lines[index] = lines[index].split(`'${problem.value}'`).join(`'${fixed}'`);
  }
  for (const [file, lines] of byFileLines) writeFileSync(file, lines.join('\n'));
  console.log(`Rewrote ${problems.length} label${problems.length === 1 ? '' : 's'} across ${byFileLines.size} file${byFileLines.size === 1 ? '' : 's'}.`);
  process.exit(0);
}

console.log(`${problems.length} label${problems.length === 1 ? '' : 's'} with a lowercase word`);
const byFile = new Map();
for (const problem of problems) byFile.set(problem.file, (byFile.get(problem.file) ?? 0) + 1);
for (const [file, count] of [...byFile.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${count.toString().padStart(4)}  ${file}`);
console.log('');
for (const problem of problems.slice(0, 40)) {
  console.log(`  ${problem.file}:${problem.line}  ${problem.key}: "${problem.value}"  (${problem.bad.join(', ')})`);
}

process.exit(problems.length > 0 ? 1 : 0);
