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
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * Words that stay lowercase inside a real name.
 *
 * SLATE's own labels are Title Case to the letter — "D23 Day At Angel
 * Stadium". A real organisation's name is spelled the way that organisation
 * spells it: "The Producers Guild of America Awards", "The Globe and Mail",
 * "Sight and Sound". Capitalising those would not be tidier, it would be
 * wrong, so the joining words inside a name are allowed — never at the front.
 */
const JOINING_WORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'de', 'del', 'della', 'di', 'da', 'du', 'for', 'from', 'in',
  'la', 'le', 'of', 'on', 'or', 'the', 'to', 'van', 'von', 'with', 'bin', 'al',
]);

/**
 * Fields that hold a label rather than prose or a key. `category` and `group`
 * are deliberately absent: those are identifiers with their own label maps,
 * and capitalising them would break every lookup that uses them.
 */
const LABEL_KEYS = /\b(name|shortName|label|title|heading|tab|cta|actionLabel)\b/;

const files = execSync('git ls-files "src/engine/content/*.ts" "src/engine/domain/*.ts" "src/engine/content/**/*.ts"', { encoding: 'utf8' })
  .split('\n').filter(Boolean)
  .filter((f) => !/world-data|records|market-profiles|premise|logline/.test(f));

const problems = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (!LABEL_KEYS.test(line)) return;
    const re = /\b(name|shortName|label|title|heading|tab|cta|actionLabel):\s*'((?:[^'\\\\]|\\\\.){2,70})'/g;
    let match;
    while ((match = re.exec(line)) !== null) {
      const [, key, value] = match;
      // Prose in a label field is caught by the other tool; here we only want
      // words that begin lowercase. A comma means it is a phrase describing
      // something — "Bell Media, part of BCE" — rather than a label.
      if (/[.?!]$/.test(value) || value.includes(',')) continue;
      const words = value.split(/\s+/);
      const bad = words.filter((word, i) => {
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
      if (bad.length > 0) problems.push({ file, line: index + 1, key, value, bad });
    }
  });
}

console.log(`${problems.length} label${problems.length === 1 ? '' : 's'} with a lowercase word`);
const byFile = new Map();
for (const problem of problems) byFile.set(problem.file, (byFile.get(problem.file) ?? 0) + 1);
for (const [file, count] of [...byFile.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${count.toString().padStart(4)}  ${file}`);
console.log('');
for (const problem of problems.slice(0, 40)) {
  console.log(`  ${problem.file}:${problem.line}  ${problem.key}: "${problem.value}"  (${problem.bad.join(', ')})`);
}
