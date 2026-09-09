/**
 * Every class the phone puts in the markup has a rule, and every rule is used.
 *
 * This exists because of a real mistake. The video app's Settings screen was
 * rebuilt against a screenshot, and it took over `.ph-set-row` — a class the
 * phone's own Settings, the photo app and the short video app were all already
 * using. Nothing failed. Three screens quietly lost the rule that put a value
 * on the right, and only a browser would have shown it.
 *
 * So: a class named in the markup with no rule anywhere is an error, and a rule
 * nothing names is an error. Neither can be argued with, and neither needs a
 * screenshot to catch.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const UI = 'src/ui/phone';
const files = readdirSync(UI);
const tsx = files.filter((name) => name.endsWith('.tsx'));
const css = files.filter((name) => name.endsWith('.css'));

/** Classes that are set from outside this folder, or read by a test or tour. */
const OUTSIDE = new Set([
  // The workspace that frames the handset styles the shell around it.
  'ph-device', 'ph-screen', 'ph-app-screen', 'ph-body',
]);

/** The value of one `className=` attribute, braces balanced. */
function classAttributes(text) {
  const out = [];
  const marker = 'className=';
  let at = text.indexOf(marker);
  while (at !== -1) {
    let k = at + marker.length;
    if (text[k] === '"' || text[k] === "'") {
      const quote = text[k];
      const end = text.indexOf(quote, k + 1);
      if (end !== -1) out.push(text.slice(k + 1, end));
      at = text.indexOf(marker, end === -1 ? k + 1 : end);
    } else if (text[k] === '{') {
      let depth = 0;
      let end = k;
      while (end < text.length) {
        if (text[end] === '{') depth += 1;
        else if (text[end] === '}') { depth -= 1; if (depth === 0) break; }
        end += 1;
      }
      out.push(text.slice(k + 1, end));
      at = text.indexOf(marker, end + 1);
    } else {
      at = text.indexOf(marker, k);
    }
  }
  return out;
}

/**
 * Every `ph-` class named in the markup.
 *
 * Only from `className`, plus quoted strings that are nothing but class names,
 * which is how a class reaches a component through a prop. Ids and label
 * targets are stripped first, because `id="ph-days"` is not a class and
 * treating it as one would send this checker looking for a rule that should
 * not exist.
 */
const used = new Set();
for (const name of tsx) {
  const text = readFileSync(join(UI, name), 'utf8')
    .replace(/\b(?:id|htmlFor|aria-labelledby|aria-controls|aria-describedby)=(?:"[^"]*"|\{[^}]*\})/g, '');
  for (const body of classAttributes(text)) {
    for (const [, word] of body.matchAll(/(ph-[a-z0-9-]+)/g)) used.add(word);
  }
  for (const [, quoted] of text.matchAll(/['"]((?:\s*ph-[a-z0-9-]+)+\s*)['"]/g)) {
    for (const [, word] of quoted.matchAll(/(ph-[a-z0-9-]+)/g)) used.add(word);
  }
}

/** Every `ph-` class a rule actually selects. */
const styled = new Set();
for (const name of css) {
  const text = readFileSync(join(UI, name), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, word] of text.matchAll(/\.(ph-[a-z0-9-]+)/g)) styled.add(word);
}

const unstyled = [...used].filter((one) => !styled.has(one) && !OUTSIDE.has(one)).sort();
const unused = [...styled].filter((one) => !used.has(one) && !OUTSIDE.has(one)).sort();

let bad = false;
if (unstyled.length > 0) {
  bad = true;
  console.error(`${unstyled.length} classes in the markup have no rule:`);
  for (const one of unstyled) console.error(`  .${one}`);
}
if (unused.length > 0) {
  bad = true;
  console.error(`${unused.length} rules nothing in the markup names:`);
  for (const one of unused) console.error(`  .${one}`);
}
if (bad) process.exit(1);

console.log(`Every one of the ${used.size} phone classes has a rule, and every rule is used.`);
