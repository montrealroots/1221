// Brief 14, the research data's dates: the inventory's strings (a `--show "*"` listing, argv[2]) that still hold a date the game doesn't write outside a quotation, an address or a file name, by file.
// The inventory's strings that still hold a date the game doesn't write outside a quotation, an address or a file name.
import { readFileSync } from 'node:fs';
const KEPT = /\bhttps?:\/\/\S+|\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/\S*|\S+\.(?:pdf|html?|jsp|php|aspx?)\b|"[^"]*"|“[^”]*”|‘[^’]*’|(?<=^|[\s([])'[^']*'(?=$|[\s.,;:)\]])/g;
const NOT = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b|\b(?:Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.? \d{4}\b|(?<![\w/.-])\d{1,2}\/\d{1,2}\/\d{4}(?![\w/.-])|(?<![\w/.-])(?:0[1-9]|1[0-2])\/(?:19|20)\d{2}(?![\w/.-])|(?<![\w.])\d{1,2}\.\d{1,2}\.(?:19|20)\d{2}(?![\w.])/;
let src = null; const by = {}; let n = 0;
for (const l of readFileSync(process.argv[2], 'utf8').split('\n')) {
  const h = l.match(/^## (.+?)  \[/); if (h) { src = h[1]; continue; }
  const s = l.match(/^\s+(\d+) (\S+)\s+(.*)$/); if (!s || !src) continue;
  // JSON.parse strings are JSON text: their escaped quotes are read as quotes.
  const t = s[3].replace(/\\"/g, '"');
  const m = t.replace(KEPT, ' ').match(NOT);
  if (m) { n++; const f = src.split('#')[0]; (by[f] ??= []).push(m[0]); }
}
console.log(n);
for (const [f, xs] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) console.log(String(xs.length).padStart(4), f, '  e.g.', [...new Set(xs)].slice(0, 4).join(' | '));
