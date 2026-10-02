/**
 * A spreadsheet's rows, for the data tools: an .xlsx is a zip of XML, read
 * here with the system's `unzip` (no library), its shared strings resolved.
 * readSheets(path) gives each sheet by its name as rows of cell strings.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const column = (ref) => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

export function readSheets(path) {
  const dir = mkdtempSync(join(tmpdir(), 'xlsx-'));
  execFileSync('unzip', ['-o', '-q', path, '-d', dir]);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  const shared = readdirSync(join(dir, 'xl')).includes('sharedStrings.xml')
    ? [...read('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => unescape([...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((x) => x[1]).join('')))
    : [];
  const rels = Object.fromEntries([...read('xl/_rels/workbook.xml.rels').matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)].map((m) => [m[1], m[2].replace(/^\/?xl\//, '')]));
  const sheets = {};
  for (const m of read('xl/workbook.xml').matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)) {
    const xml = read(`xl/${rels[m[2]]}`);
    const rows = [];
    for (const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const c of row[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const v = /<v>([^<]*)<\/v>/.exec(c[3] ?? '')?.[1];
        const inline = /<is>[\s\S]*?<t[^>]*>([^<]*)<\/t>/.exec(c[3] ?? '')?.[1];
        cells[column(c[1])] = /t="s"/.test(c[2]) && v !== undefined ? shared[Number(v)] : unescape(v ?? inline ?? '');
      }
      rows.push(Array.from(cells, (x) => x ?? ''));
    }
    sheets[unescape(m[1]).trim()] = rows;
  }
  return sheets;
}
