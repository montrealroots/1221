#!/usr/bin/env node
/**
 * Days a month with more than 0.10 inch (2.54 mm) of precipitation, the day
 * a building contract counts as a weather day, at each SLATE town's main
 * station, from NOAA's Global Historical Climatology Network daily records
 * (GHCN-Daily, through NCEI's access service), 1996 to 2025.
 *
 * Usage: node tools/data/wetdays.mjs
 * Writes docs/research/world/derived-wetdays.json: per town, the station, the
 * years used, and the mean such days in each month. A month a station is
 * missing more than five days of is left out of that month's mean.
 */
import { writeFileSync } from 'node:fs';

const STATIONS = {
  'us-ny-newyork': { id: 'USW00094728', name: 'New York Central Park' },
  'us-ca-losangeles': { id: 'USW00023174', name: 'Los Angeles International Airport' },
  'us-ct-newhaven': { id: 'USW00014758', name: 'New Haven Tweed Airport' },
  'uk-eng-london': { id: 'UKM00003772', name: 'London Heathrow' },
  'ie-lei-dublin': { id: 'EI000003969', name: 'Dublin Airport' },
  'ca-on-toronto': { id: 'CA006158355', name: 'Toronto' },
  'ca-bc-vancouver': { id: 'CA001108447', name: 'Vancouver International Airport' },
  'mx-cmx-mexicocity': { id: 'MXM00076680', name: 'Mexico City International Airport' },
};
const FROM = 1996;
const TO = 2025;
const THRESHOLD_MM = 2.54;

async function fetchYears(id, from, to) {
  const url = `https://www.ncei.noaa.gov/access/services/data/v1?dataset=daily-summaries&stations=${id}&startDate=${from}-01-01&endDate=${to}-12-31&dataTypes=PRCP&format=json&units=metric`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(url);
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`NOAA refused ${id} ${from}-${to}`);
}

const out = { source: 'NOAA NCEI GHCN-Daily, https://www.ncei.noaa.gov/access/services/data/v1 (dataset daily-summaries, PRCP)', read: new Date().toISOString().slice(0, 10), threshold: '> 2.54 mm (0.10 in) in the day', years: `${FROM}-${TO}`, towns: {} };
for (const [cityId, st] of Object.entries(STATIONS)) {
  const rows = [];
  for (let y = FROM; y <= TO; y += 10) rows.push(...(await fetchYears(st.id, y, Math.min(TO, y + 9))));
  // year-month → { days recorded, wet days }
  const tally = new Map();
  for (const r of rows) {
    if (r.PRCP === undefined || r.PRCP === '') continue;
    const key = r.DATE.slice(0, 7);
    const t = tally.get(key) ?? { days: 0, wet: 0 };
    t.days += 1;
    if (Number(r.PRCP) > THRESHOLD_MM) t.wet += 1;
    tally.set(key, t);
  }
  const months = Array.from({ length: 12 }, () => ({ sum: 0, n: 0 }));
  for (const [key, t] of tally) {
    const [y, m] = key.split('-').map(Number);
    const inMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    if (t.days < inMonth - 5) continue;
    // Scaled to the whole month where a few days are missing.
    months[m - 1].sum += t.wet * (inMonth / t.days);
    months[m - 1].n += 1;
  }
  out.towns[cityId] = {
    station: `${st.id}, ${st.name}`,
    monthsUsed: months.map((m) => m.n),
    meanWetDays: months.map((m) => (m.n ? Math.round((m.sum / m.n) * 100) / 100 : null)),
  };
  console.log(cityId, out.towns[cityId].meanWetDays.join(' '), 'from', months.map((m) => m.n).join(','));
}
writeFileSync('docs/research/world/derived-wetdays.json', JSON.stringify(out, null, 1) + '\n');
console.log('wrote docs/research/world/derived-wetdays.json');

// And the engine's copy, which the gate's typecheck reads (`content/wetdays.ts`).
const ts = `/**
 * SLATE — the days a month with more than 0.10 inch (2.54 mm) of
 * precipitation, a building contract's weather day, at each town's main
 * station: NOAA GHCN-Daily, ${FROM} to ${TO}, the mean of each month a
 * station recorded (\`tools/data/wetdays.mjs\`, which writes this file and
 * \`docs/research/world/derived-wetdays.json\`; read ${out.read}).
 */

export const WET_DAYS: Readonly<Record<string, { station: string; days: readonly number[] }>> = {
${Object.entries(out.towns).map(([c, t]) => `  '${c}': { station: '${t.station.replace(/'/g, '’')}', days: [${t.meanWetDays.join(', ')}] },`).join('\n')}
};
`;
writeFileSync('src/engine/content/wetdays.ts', ts);
console.log('wrote src/engine/content/wetdays.ts');
