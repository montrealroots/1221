#!/usr/bin/env node
/**
 * What a household spends on energy a year outside America, against the
 * EIA's American figure (RECS 2020, $1,884, `content/energy-us.ts`), from
 * each country's own household spending survey, in US dollars at the year's
 * average exchange (FRED's annual series):
 *
 * - Ontario and British Columbia: Statistics Canada's Survey of Household
 *   Spending, 2019 (table 11-10-0222), electricity, natural gas and other
 *   fuel for the principal accommodation, water left out as the EIA's is.
 * - Britain: the ONS's Family Spending, April 2019 to March 2020 (workbook 1,
 *   table A1), electricity, gas and other fuels, £ a week.
 * - Ireland: the CSO's Household Budget Survey 2022-2023 (HBS01), fuel and
 *   light, € a week, brought back to 2020's prices by Eurostat's HICP for
 *   electricity, gas and other fuels (CP045), the survey's two years' mean.
 * - Mexico: INEGI's ENIGH 2020, electricity and fuels for the home, MX$1,523 a
 *   quarter, read by hand from INEGI's release (its API asks a token).
 *
 * And how far each place's household energy prices have moved from its
 * survey's year to the last full year (`PRICE_YEAR`): the BLS's CPI for
 * household energy (FRED CUUR0000SAH21) for America since 2020, the ONS's CPI
 * 04.5 (D7CH) for Britain, Eurostat's HICP CP045 for Ireland, and Statistics
 * Canada's CPI for electricity, natural gas and fuel oil (table 18-10-0004),
 * weighted by each province's own spending on them. Mexico's INPC isn't read
 * without INEGI's token, and its regulated electricity and LP gas stay at
 * 2020's prices.
 *
 * Usage: node tools/data/energy.mjs
 * Writes docs/research/world/derived-energy.json and
 * src/engine/content/energy-world.ts.
 */
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readSheets } from './xlsx.mjs';

const PRICE_YEAR = 2025;
const UA = { 'User-Agent': 'Mozilla/5.0' };
const dir = mkdtempSync(join(tmpdir(), 'energy-'));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round4 = (x) => Math.round(x * 10_000) / 10_000;
async function download(url, name) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const path = join(dir, name);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  return path;
}
async function unzipCsv(url, name, file) {
  const zip = await download(url, `${name}.zip`);
  execFileSync('unzip', ['-o', '-q', zip, '-d', join(dir, name)]);
  return csvRows(readFileSync(join(dir, name, file), 'utf8'));
}
function csvRows(text) {
  return text.split(/\r?\n/).filter(Boolean).map((l) => l.split('","').map((x) => x.replace(/^﻿?"|"$/g, '')));
}
// The year's average exchange: US dollars for one of the money.
async function usdPer(series, year) {
  const text = await (await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`, { headers: UA })).text();
  const v = Number(text.split('\n').find((l) => l.startsWith(`${year}-`))?.split(',')[1]);
  if (!v) throw new Error(`FRED ${series} ${year}`);
  return series === 'AEXUSUK' || series === 'AEXUSEU' ? v : 1 / v;
}

const out = { read: new Date().toISOString().slice(0, 10), priceYear: PRICE_YEAR, usHousehold: 1884, places: {} };

// Canada: spending in 2019, and prices since, by each province's own fuels.
{
  const shs = await unzipCsv('https://www150.statcan.gc.ca/n1/tbl/csv/11100222-eng.zip', 'shs', '11100222.csv');
  const cpi = await unzipCsv('https://www150.statcan.gc.ca/n1/tbl/csv/18100004-eng.zip', 'cpi', '18100004.csv');
  const rate = await usdPer('AEXCAUS', 2019);
  for (const [key, geo] of [['ca-08', 'Ontario'], ['ca-02', 'British Columbia']]) {
    const line = (item) => Number(shs.find((r) => r[0] === '2019' && r[1] === geo && r[3] === 'Average expenditure per household' && r[4] === item)?.[11]);
    const weights = { Electricity: line('Electricity for principal accommodation'), 'Natural gas': line('Natural gas for principal accommodation'), 'Fuel oil and other fuels': line('Other fuel for principal accommodation') };
    const cad = Object.values(weights).reduce((a, b) => a + b, 0);
    const idx = (item, year) => mean(cpi.filter((r) => r[0].startsWith(`${year}-`) && r[1] === geo && r[3] === item).map((r) => Number(r[10])));
    const priceFactor = round4(Object.entries(weights).reduce((a, [item, w]) => a + (w / cad) * (idx(item, PRICE_YEAR) / idx(item, 2019)), 0));
    out.places[key] = { local: cad, currency: 'CAD', year: 2019, usd: Math.round(cad * rate), priceFactor, weights, source: 'Statistics Canada, Survey of Household Spending 2019 (11-10-0222); CPI (18-10-0004)' };
  }
}
// Britain.
{
  const path = await download('https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/personalandhouseholdfinances/expenditure/datasets/familyspendingworkbook1detailedexpenditureandtrends/fye2020/familyspendingworkbook1detailedexpenditureandtrends.xlsx', 'ons.xlsx');
  const row = readSheets(path).A1.find((r) => r.includes('Electricity, gas and other fuels'));
  const weekly = Number(row.find((c, i) => i > 1 && c !== '' && !Number.isNaN(Number(c))));
  const gbp = Math.round(weekly * 52.18 * 100) / 100;
  const ons = await (await fetch('https://www.ons.gov.uk/generator?format=csv&uri=/economy/inflationandpriceindices/timeseries/d7ch/mm23', { headers: UA })).text();
  const onsYear = (y) => Number(ons.split('\n').find((l) => l.startsWith(`"${y}"`))?.split(',')[1]?.replace(/"/g, ''));
  out.places.uk = { local: gbp, currency: 'GBP', year: 2019, weekly, usd: Math.round(gbp * (await usdPer('AEXUSUK', 2019))), priceFactor: round4(onsYear(PRICE_YEAR) / onsYear(2019)), source: 'ONS, Family Spending FYE 2020 (workbook 1, A1, 4.4); CPI 04.5 (D7CH)' };
}
// Ireland.
{
  const rows = csvRows(await (await fetch('https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/HBS01/CSV/1.0/en', { headers: UA })).text());
  const weekly = Number(rows.find((r) => r[5] === 'All Areas' && r[7] === 'Total fuel and light (04)')?.[9]);
  const hicp = await (await fetch('https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_aind?format=JSON&geo=IE&coicop=CP045&unit=INX_A_AVG&lang=en')).json();
  const idx = (y) => hicp.value[hicp.dimension.time.category.index[String(y)]];
  const back = idx(2020) / ((idx(2022) + idx(2023)) / 2);
  const eur = Math.round(weekly * 52.18 * back * 100) / 100;
  out.places.ie = { local: eur, currency: 'EUR', year: 2020, weekly2023: weekly, deflator: round4(back), usd: Math.round(eur * (await usdPer('AEXUSEU', 2020))), priceFactor: round4(idx(PRICE_YEAR) / idx(2020)), source: 'CSO, Household Budget Survey 2022-2023 (HBS01), at 2020 prices by Eurostat HICP CP045' };
}
// Mexico.
{
  const mxn = 1_523 * 4;
  out.places.mx = { local: mxn, currency: 'MXN', year: 2020, usd: Math.round(mxn * (await usdPer('AEXMXUS', 2020))), priceFactor: 1, source: 'INEGI, ENIGH 2020, electricidad y combustibles, MX$1,523 a quarter (read by hand)' };
}
// America's own prices since RECS 2020.
{
  const text = await (await fetch('https://fred.stlouisfed.org/graph/fredgraph.csv?id=CUUR0000SAH21', { headers: UA })).text();
  const year = (y) => mean(text.split('\n').filter((l) => l.startsWith(`${y}-`)).map((l) => Number(l.split(',')[1])));
  out.usPriceFactor = round4(year(PRICE_YEAR) / year(2020));
}

console.log('us prices x', out.usPriceFactor);
for (const [k, v] of Object.entries(out.places)) console.log(k, v.local, v.currency, '→ $', v.usd, `(${(v.usd / out.usHousehold).toFixed(3)} of America's)`, 'prices x', v.priceFactor);
writeFileSync('docs/research/world/derived-energy.json', JSON.stringify(out, null, 1) + '\n');
writeFileSync('src/engine/content/energy-world.ts', `/**
 * SLATE — what a household spends on energy a year outside America, in US
 * dollars at the year's exchange, beside the EIA's American $1,884
 * (\`content/energy-us.ts\`), from each country's own household spending
 * survey, and how far household energy prices have moved since each to
 * ${PRICE_YEAR} (\`tools/data/energy.mjs\`, which writes this file and
 * \`docs/research/world/derived-energy.json\`; read ${out.read}):
${Object.entries(out.places).map(([k, v]) => ` * - ${k}: ${v.local.toLocaleString('en-US')} ${v.currency} (${v.year}), ${v.source}.`).join('\n')}
 * Keyed by province where Canada's differ, by country elsewhere.
 */

export const ENERGY_ABROAD_USD: Readonly<Record<string, number>> = {
${Object.entries(out.places).map(([k, v]) => `  '${k}': ${v.usd},`).join('\n')}
};

/** Household energy prices in ${PRICE_YEAR} against each survey's year: America's against RECS's 2020, and each place's. */
export const ENERGY_PRICES_SINCE: Readonly<Record<string, number>> = {
  us: ${out.usPriceFactor},
${Object.entries(out.places).map(([k, v]) => `  '${k}': ${v.priceFactor},`).join('\n')}
};
`);
console.log('wrote docs/research/world/derived-energy.json and src/engine/content/energy-world.ts');
