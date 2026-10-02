#!/usr/bin/env node
/**
 * What the IMSS charges somebody without rights to it, by its unit costs for
 * the year, published in the Diario Oficial (the 2026 costs, DOF 10 December
 * 2025, posted by the IMSS as a PDF): at a second-level unit, a family
 * doctor's consultation, an emergency, and a day in hospital.
 *
 * The PDF's text comes out with its names and its figures in two columns that
 * pdftotext doesn't keep side by side, but in the same order, so the second
 * level's names are paired with its figures in turn.
 *
 * Usage: node tools/data/imss.mjs  (needs pdftotext, which Git for Windows has)
 * Writes docs/research/world/derived-imss.json and src/engine/content/imsscosts.ts.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = 'https://www.imss.gob.mx/sites/all/statics/pdf/otros/10122025-AS3-HCT-251125-344-otros.pdf';
const YEAR = 2026;
const dir = mkdtempSync(join(tmpdir(), 'imss-'));
const pdf = join(dir, 'imss.pdf');
writeFileSync(pdf, Buffer.from(await (await fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })).arrayBuffer()));
execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdf, join(dir, 'imss.txt')]);
const { readFileSync } = await import('node:fs');
const lines = readFileSync(join(dir, 'imss.txt'), 'utf8').split(/\r?\n/);
const start = lines.findIndex((l) => /SEGUNDO NIVEL/.test(l));
const end = lines.findIndex((l, i) => i > start && /TERCER NIVEL/.test(l));
const names = [];
const figures = [];
for (const l of lines.slice(start + 1, end)) {
  const name = l.replace(/\s{2,}[\d,()a-z]+\s*$/i, '').trim();
  if (/[A-Za-zÁÉÍÓÚáéíóúñ]{3}/.test(name) && !/DIARIO OFICIAL|TIPO DE SERVICIO|ACTUALIZADO/.test(name)) names.push(name.replace(/[\d*]+$/, '').trim());
  const fig = /\s([\d,]+)\s*$/.exec(l)?.[1];
  if (fig && fig !== String(YEAR)) figures.push(Number(fig.replace(/,/g, '')));
}
const table = Object.fromEntries(names.map((n, i) => [n, figures[i]]));
const pick = (re) => { const k = Object.keys(table).find((n) => re.test(n)); if (!k) throw new Error(`IMSS: no ${re}`); return table[k]; };
const out = { source: URL, year: YEAR, read: new Date().toISOString().slice(0, 10), level: 'segundo nivel', visit: pick(/^Consulta de Medicina Familiar/), emergency: pick(/^Atenci.n de Urgencias/), stayDay: pick(/^D.a Paciente en Hospitalizaci.n/), table };
console.log('visit', out.visit, 'emergency', out.emergency, 'day', out.stayDay);
writeFileSync('docs/research/world/derived-imss.json', JSON.stringify(out, null, 1) + '\n');
writeFileSync('src/engine/content/imsscosts.ts', `/**
 * SLATE — what the IMSS charges somebody without rights to it, ${YEAR}: its
 * unit costs at a second-level unit, from the Diario Oficial of 10 December
 * 2025 (\`tools/data/imss.mjs\`, which writes this file and
 * \`docs/research/world/derived-imss.json\`; read ${out.read}).
 */

export const IMSS_NON_MEMBER = { visit: ${out.visit}, emergency: ${out.emergency}, stayDay: ${out.stayDay}, year: ${YEAR} } as const;
`);
console.log('wrote docs/research/world/derived-imss.json and src/engine/content/imsscosts.ts');
