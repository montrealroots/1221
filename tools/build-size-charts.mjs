// Builds src/engine/content/sizecharts.ts from docs/research/world/research-size-charts.json (from 2026-10-02): each
// retailer's own size chart, by market and department, for tops and for bottoms, its sizes' bust, chest, waist and hip
// ranges in centimeters, and every label a size goes by on the chart.
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/engine/content/sizecharts.ts';
const j = JSON.parse(readFileSync('docs/research/world/research-size-charts.json', 'utf8'));
const GROUP = { tops: 'tops', 'tops-dresses': 'tops', dresses: 'tops', 'dresses-fine': 'tops', 'formal-shirts': 'tops', 'tops-petite': 'tops', 'tops-plus': 'tops', 'tops-fusion-fit': 'tops', bottoms: 'bottoms', jeans: 'bottoms', trousers: 'bottoms' };
const range = (v) => (Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number') ? v : typeof v === 'number' ? [v, v] : null);
const LABELS = ['size', 'US', 'UK', 'EU', 'MX', 'USjeans', 'alpha', 'us', 'uk', 'eu', 'mx'];
const charts = [];
for (const r of j.retailers) {
  const group = GROUP[r.garment];
  if (!group || (r.department !== 'women' && r.department !== 'men')) continue;
  const rows = (r.rows ?? []).map((row) => ({
    labels: [...new Set(LABELS.map((k) => row[k]).filter((v) => typeof v === 'string' || typeof v === 'number').map((v) => String(v).trim().toUpperCase()))],
    bust: range(row.bust), chest: range(row.chest), waist: range(row.waist), hip: range(row.hip),
  })).filter((row) => row.labels.length && (row.bust || row.chest || row.waist));
  if (rows.length < 2) continue;
  charts.push({ retailer: r.retailer, market: r.market, department: r.department, group, rows, source: r.source ?? null, confirmed: r.confirmed === true });
}

const body = `/**
 * SLATE — retailers' own size charts (from 2026-10-02), built by
 * \`tools/build-size-charts.mjs\` from \`docs/research/world/research-size-charts.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each chart is a retailer's for a market and a department, women's or
 * men's, for tops (dresses with them) or bottoms, read from its own size
 * guide (H&M's from its archived 2023 pages; a few from copies, marked
 * unconfirmed). Each size's ranges are centimeters, inches converted at
 * 2.54; every label it goes by (alpha, US, UK, EU) is kept.
 */

export type Range = readonly [number, number];
export interface ChartRow { labels: readonly string[]; bust: Range | null; chest: Range | null; waist: Range | null; hip: Range | null }
export interface SizeChart { retailer: string; market: string; department: 'women' | 'men'; group: 'tops' | 'bottoms'; rows: readonly ChartRow[]; source: string | null; confirmed: boolean }

export const SIZE_CHARTS: readonly SizeChart[] = JSON.parse(${JSON.stringify(JSON.stringify(charts))});
`;
writeFileSync(OUT, body);
console.log('charts', charts.length);
