/**
 * Batch 5's follow-up on the generated files' source lines: a web server's status code where the research said a page
 * couldn't be read ("(HTTP 403)", "page returned 403", "live site 403") is a diagnostic, not a source; each says the
 * page couldn't be opened. And Bankinter's pending source ended on a stop before the day, so the screen read "dates.,
 * read …". FILE names the content file (security, accountlife or pending); the edits are worked out from its current
 * words, so a second run changes nothing.
 */
import { readFileSync } from 'node:fs';

const SAID = [
  ['card FAQs (HTTP 403). None states hold periods or value dates., read', 'card FAQs, which couldn’t be opened; none of them gives hold periods or value dates; read'],
  ['bbva.es card documents refused automated access (HTTP 403)', 'bbva.es card documents, which couldn’t be opened'],
  ['(search summary; page returned 403)', '(a search summary; the page couldn’t be opened)'],
  ['via search excerpt; page returned 403)', 'via search excerpt; the page couldn’t be opened)'],
  ['(live site returned 403)', '(the live site couldn’t be opened)'],
  ['as ptsb.ie returns 403', 'as ptsb.ie couldn’t be opened'],
  ['live site returns 403', 'the live site couldn’t be opened'],
  ['(via web.archive.org; live site 403)', '(via web.archive.org; the live site couldn’t be opened)'],
  ['Consulta de saldos y movimientos (HTTP 403)', 'Consulta de saldos y movimientos, which couldn’t be opened'],
  ['(search excerpts; site returned 403 to direct fetches)', '(search excerpts; the site itself couldn’t be opened)'],
  ['(pages returned 403; read via search snippets)', '(read through search snippets, as the pages couldn’t be opened)'],
];

const file = `src/engine/content/${process.env.FILE}.ts`;
const src = readFileSync(file, 'utf8');
const edits = {};
for (const m of src.matchAll(/export const (\w+)\b[^=]*= JSON\.parse\(("(?:[^"\\]|\\.)*")\);/g)) {
  const data = JSON.parse(JSON.parse(m[2]));
  for (const [key, entry] of Object.entries(data)) {
    if (typeof entry?.source !== 'string') continue;
    let text = entry.source;
    for (const [was, now] of SAID) text = text.split(was).join(now);
    if (text !== entry.source) ((edits[m[1]] ??= {})[key] = { source: text });
  }
}
export default edits;
