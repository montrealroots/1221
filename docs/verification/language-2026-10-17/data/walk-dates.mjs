/**
 * Brief 14, the research data's dates: every date a walked screen shows in a form the game doesn't write, outside a web
 * address, a file's name or a quotation, on two walks of the same saves (before the pass, and after it), screen by screen.
 *
 *   node docs/verification/language-2026-10-17/data/walk-dates.mjs <before-dir> <after-dir> [save.json ...]
 */
import { readFileSync } from 'node:fs';
const KEPT = /\bhttps?:\/\/\S+|\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/\S*|\S+\.(?:pdf|html?|jsp|php|aspx?)\b|"[^"]*"|“[^”]*”|‘[^’]*’|(?<=^|[\s([])'[^']*'(?=$|[\s.,;:)\]])/g;
const NOT = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b|\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.? \d{4}\b|(?<![\w/.-])\d{1,2}\/\d{1,2}\/\d{4}(?![\w/.-])|(?<![\w.])\d{1,2}\.\d{1,2}\.(?:19|20)\d{2}(?![\w.])/g;
const [before, after, ...saves] = process.argv.slice(2);
const found = (dir, save) => {
  const out = [];
  for (const s of JSON.parse(readFileSync(`${dir}/${save}`, 'utf8'))) {
    for (const line of [s.text ?? '', ...(s.dialogs ?? [])].join('\n').split('\n')) {
      for (const m of line.replace(KEPT, (k) => ' '.repeat(k.length)).matchAll(NOT)) out.push(`${s.screen}${s.tab ? ` / ${s.tab}` : ''}: …${line.slice(Math.max(0, m.index - 60), m.index + m[0].length + 20)}…`);
    }
  }
  return [...new Set(out)];
};
for (const save of saves) for (const [label, dir] of [['before', before], ['after', after]]) {
  const f = found(dir, save);
  console.log(`== ${save}, ${label}: ${f.length}`);
  for (const x of f) console.log(`  ${x}`);
}
