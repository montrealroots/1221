/**
 * The geographic coverage matrix (from 2026-10-24, the owner's brief 27: "Treat the game's entire existing world map as the
 * geographic scope. Inventory every represented country, territory, and location, and account for each in the geographic
 * coverage matrix ... Document unavailable information and unsupported functionality honestly; never silently omit a
 * location or fabricate local rules"; Part 5: "Provide a geographic coverage matrix showing researched support, simulated
 * support, and gaps").
 *
 * Every country and territory of the gazetteer (`content/geography.ts`, 252), and every one of its places (the town files in
 * `public/geo/`, one a country, and the towns the game bundles), each read against what the career world has for it:
 * - **its work rules**: the US package (`systems/permission.ts`), a verified route (`content/jurisdictions.ts`), sources
 *   found and not read (partly researched), or nothing (unsupported: work there can't be accepted, and the game says so);
 * - **the game's markets** in it (`content/slate.ts`), where the slate makes work;
 * - **the organizations official lists name** in it (`content/industry.ts`): FIA's performers' unions and FIAPF's
 *   accredited festivals;
 * - **how each place connects to the career world**, by a rule shared everywhere and said as the game's: work in any market
 *   is a journey from home within `TRIP.minKm` and a trip the production books beyond it; a self-tape goes to any market
 *   from anywhere; an open in-person audition beyond that reaches nobody (`SLATE_REACH`); work needs the work rules of the
 *   market's country. Each country's row gives its places' nearest market by great-circle distance, and how far it is.
 *
 * Each country's coverage is the most its row has: **researched** (verified work rules or a game market), **partly
 * researched** (rules located and not read, or an official list names an organization there), or **simulated** (only the
 * shared rules: travel by distance, its currency and time zones, a self-tape from there). Written to
 * `docs/verification/career-universe-2026-10-24/geography/COVERAGE.md` and `coverage.json`.
 *
 *   npx vite-node tools/geo-coverage.mjs           prints the totals
 *   npx vite-node tools/geo-coverage.mjs --write   writes the matrix
 *
 * `tests/b27-geo-coverage.test.ts` fails when the matrix isn't what this writes, when a country or place goes unaccounted,
 * and when the places counted aren't the gazetteer's.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { CITIES, COUNTRIES, REGIONS, CITIES_IN_THE_WORLD, distanceKm } from '../src/engine/content/geography.ts';
import { jurisdictionOf } from '../src/engine/content/jurisdictions.ts';
import { MARKETS } from '../src/engine/content/slate.ts';
import { PERFORMER_UNIONS, ACCREDITED_FESTIVALS } from '../src/engine/content/industry.ts';
import { TERRITORY_CITIZENSHIP } from '../src/engine/domain/citizenship.ts';
import { TRIP } from '../src/engine/systems/worktrip.ts';

export const DIR = 'docs/verification/career-universe-2026-10-24/geography';
export const PAGE = `${DIR}/COVERAGE.md`;
export const DATA = `${DIR}/coverage.json`;

const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** Every place the gazetteer knows: each country's town file, and the bundled towns no file holds. */
export function places() {
  const out = new Map();
  for (const f of readdirSync('public/geo').filter((x) => x.endsWith('.tsv'))) {
    const country = f.replace(/\.tsv$/, '');
    for (const line of readFileSync(`public/geo/${f}`, 'utf8').split(/\r?\n/)) {
      if (!line) continue;
      const [id, name, , lat, lon] = line.split('\t');
      if (!id || !name) continue;
      out.set(id, { id, country, lat: Number(lat), lon: Number(lon) });
    }
  }
  for (const c of CITIES.all()) if (!out.has(c.id)) out.set(c.id, { id: c.id, country: c.countryId, lat: c.latitude, lon: c.longitude });
  return [...out.values()];
}

/** The market nearest a place, and how far. */
function nearest(p, markets) {
  let best;
  for (const m of markets) {
    const d = distanceKm({ latitude: p.lat, longitude: p.lon }, m);
    if (!best || d < best.km) best = { market: m.id, km: d };
  }
  return best;
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };

export function build() {
  const markets = MARKETS.map((m) => { const c = CITIES.get(m.cityId); return { id: m.id, city: m.city, cityId: m.cityId, country: c.countryId, latitude: c.latitude, longitude: c.longitude }; });
  const all = places();
  const byCountry = new Map();
  const nearestCount = {};
  for (const p of all) {
    const n = nearest(p, markets);
    nearestCount[n.market] = (nearestCount[n.market] ?? 0) + 1;
    const row = byCountry.get(p.country) ?? { places: 0, km: [], byMarket: {}, trips: 0 };
    row.places += 1;
    row.km.push(n.km);
    row.byMarket[n.market] = (row.byMarket[n.market] ?? 0) + 1;
    if (n.km > TRIP.minKm) row.trips += 1;
    byCountry.set(p.country, row);
  }
  const regions = new Map();
  for (const r of REGIONS.all()) regions.set(r.parentId, (regions.get(r.parentId) ?? 0) + 1);

  const rows = COUNTRIES.all().slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => {
    const p = byCountry.get(c.id) ?? { places: 0, km: [], byMarket: {}, trips: 0 };
    const j = jurisdictionOf(c.id, c.name);
    const work = c.id === 'us' ? 'us-package' : j.research;
    const inMarkets = markets.filter((m) => m.country === c.id).map((m) => m.city);
    const unions = PERFORMER_UNIONS.filter((u) => u.country === c.id).map((u) => u.name);
    const festivals = ACCREDITED_FESTIVALS.filter((f) => f.country === c.id).map((f) => f.name);
    const coverage = work === 'us-package' || work === 'verified' || inMarkets.length ? 'researched'
      : work === 'partial' || unions.length || festivals.length ? 'partly researched' : 'simulated';
    const territoryOf = TERRITORY_CITIZENSHIP[c.id];
    const kind = c.id === 'aq' ? 'no citizens' : territoryOf ? `territory of ${COUNTRIES.get(territoryOf)?.name ?? territoryOf}` : 'country';
    const top = Object.entries(p.byMarket).sort((a, b) => b[1] - a[1])[0];
    const gaps = [];
    if (work === 'unsupported') gaps.push('its rules for working there');
    if (work === 'partial') gaps.push(...j.gaps);
    if (work === 'verified') gaps.push(...j.gaps);
    if (!inMarkets.length) gaps.push('a market of its own');
    return {
      id: c.id, iso2: c.iso2, name: c.name, kind, continent: c.continent, currency: c.currency,
      regions: regions.get(c.id) ?? 0, places: p.places,
      work, routes: j.routes.map((r) => r.name), markets: inMarkets, unions, festivals,
      nearest: top ? { market: top[0], places: top[1] } : null,
      km: p.places ? { min: Math.round(Math.min(...p.km)), median: Math.round(median(p.km)), max: Math.round(Math.max(...p.km)) } : null,
      trips: p.trips, coverage, gaps,
    };
  });
  const totals = {
    countries: rows.length,
    territories: rows.filter((r) => r.kind.startsWith('territory')).length,
    places: rows.reduce((a, r) => a + r.places, 0),
    gazetteer: CITIES_IN_THE_WORLD,
    coverage: { researched: rows.filter((r) => r.coverage === 'researched').length, partly: rows.filter((r) => r.coverage === 'partly researched').length, simulated: rows.filter((r) => r.coverage === 'simulated').length },
    work: { 'us-package': rows.filter((r) => r.work === 'us-package').length, verified: rows.filter((r) => r.work === 'verified').length, partial: rows.filter((r) => r.work === 'partial').length, unsupported: rows.filter((r) => r.work === 'unsupported').length },
    markets: markets.length, unions: PERFORMER_UNIONS.length, festivals: ACCREDITED_FESTIVALS.length,
    placesInMarketCountries: rows.filter((r) => r.markets.length).reduce((a, r) => a + r.places, 0),
  };
  return { totals, markets: markets.map((m) => ({ ...m, nearestTo: nearestCount[m.id] ?? 0 })), rows };
}

export function render(data = build()) {
  const { totals: t, rows } = data;
  const out = [
    '# Geographic Coverage Matrix',
    '',
    'Written by `npx vite-node tools/geo-coverage.mjs --write` from the code; `tests/b27-geo-coverage.test.ts` fails when this page is behind it. Brief 27 (the geographic preamble; Part 5).',
    '',
    `**Scope:** the gazetteer's ${t.countries} countries and territories (${t.territories} of them territories), and its ${t.places.toLocaleString('en-US')} places, every one accounted for below by its country${t.places === t.gazetteer ? `: the ${t.gazetteer.toLocaleString('en-US')} the gazetteer counts` : ` (the gazetteer counts ${t.gazetteer.toLocaleString('en-US')})`}.`,
    '',
    `**Coverage:** ${t.coverage.researched} researched, ${t.coverage.partly} partly researched, ${t.coverage.simulated} simulated. **Work rules:** the US package, ${t.work.verified} verified, ${t.work.partial} partly researched, ${t.work.unsupported} unsupported. **Markets:** ${t.markets}. **Official lists:** ${t.unions} performers' unions (FIA), ${t.festivals} accredited festivals (FIAPF).`,
    '',
    '## How Every Place Connects',
    '',
    '- **A self-tape** goes to any market from any place, so every place is in the career world for screen work cast that way.',
    `- **In person** (an audition, a rehearsal, a performance, a shoot): work in a market within ${TRIP.minKm} km of a place is a journey from home, and farther it's a trip the production books, its flights the game's (\`systems/worktrip.ts\`). An open in-person audition that far reaches nobody there, and an agent puts a client up for one half as often (\`SLATE_REACH\`, \`systems/projobs.ts\`). The nearest-market column says how far each country's places are from the closest market.`,
    '- **Work** needs the work rules of the market\'s country: the US package for the US, a verified route abroad. A country whose rules aren\'t in the game gives no permission, and the game says so rather than assume one.',
    '- **Shared everywhere:** each place\'s time zone, its country\'s currency, and travel by distance. These are the game\'s rules, not a country\'s; where a country\'s own rule matters and isn\'t researched, the row says so.',
    '',
    '## Coverage',
    '',
    '- **Researched:** verified work rules (the US package, or a route read from the government\'s own page) or a market of the game\'s.',
    '- **Partly researched:** work rules located and not read, or an official list (FIA, FIAPF) names an organization there.',
    '- **Simulated:** only the shared rules. Its actors are reached by the markets\' work like anyone\'s; work in it can\'t be accepted, since it has no market and no rules in the game.',
    '',
    '## Markets',
    '',
    '| Market | Country | Places nearest it |',
    '| --- | --- | --- |',
    ...data.markets.map((m) => `| ${m.city} | ${COUNTRIES.get(m.country)?.name ?? m.country} | ${m.nearestTo.toLocaleString('en-US')} |`),
    '',
    '## Every Country And Territory',
    '',
    '| Country | Kind | Places | Work rules | Markets | Unions (FIA) | Festivals (FIAPF) | Nearest market for most places | Km to it (median, max) | Coverage | Not in the game |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => `| ${cell(r.name)} (${r.iso2}) | ${r.kind} | ${r.places.toLocaleString('en-US')} | ${WORK_WORDS[r.work]}${r.routes.length ? `: ${cell(r.routes.join('; '))}` : ''} | ${cell(r.markets.join(', ') || '—')} | ${r.unions.length || '—'} | ${r.festivals.length || '—'} | ${r.nearest ? `${cell(data.markets.find((m) => m.id === r.nearest.market)?.city ?? r.nearest.market)} (${r.nearest.places.toLocaleString('en-US')})` : '—'} | ${r.km ? `${r.km.median.toLocaleString('en-US')}, ${r.km.max.toLocaleString('en-US')}` : '—'} | ${r.coverage} | ${cell(r.gaps.join('; ') || '—')} |`),
    '',
  ];
  return out.join('\n');
}

const WORK_WORDS = { 'us-package': 'US package', verified: 'verified', partial: 'partly researched', unsupported: 'unsupported' };

/** The matrix and the data it's written from. */
export function writeAll() {
  const data = build();
  return { data, text: render(data) };
}

// Run as a tool, not loaded by the test: vite-node takes the file's own name out of process.argv, so it's told by VITEST.
if (!process.env.VITEST) {
  const { data, text } = writeAll();
  if (process.argv.includes('--write')) {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(PAGE, text);
    writeFileSync(DATA, JSON.stringify(data, null, 1) + '\n');
  }
  const t = data.totals;
  console.log(`${t.countries} countries and territories, ${t.places} places: ${t.coverage.researched} researched, ${t.coverage.partly} partly, ${t.coverage.simulated} simulated${process.argv.includes('--write') ? `; wrote ${PAGE}` : ''}`);
}
