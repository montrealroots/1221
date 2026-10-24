/**
 * Brief 27's geographic coverage matrix (2026-10-24, the geographic preamble and Part 5: "Inventory every represented
 * country, territory, and location, and account for each in the geographic coverage matrix ... never silently omit a
 * location or fabricate local rules"). `tools/geo-coverage.mjs` writes it from the code; held here: the page and its data
 * are what the tool writes now, every country and territory of the gazetteer has a row, every place is counted once under
 * its country and the total is the gazetteer's, each row's coverage follows from what it has, and a country the game has
 * no rules for says so.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CITIES, CITIES_IN_THE_WORLD, COUNTRIES } from '@/engine/content/geography';
import { MARKETS } from '@/engine/content/slate';
import { jurisdictionOf } from '@/engine/content/jurisdictions';
// @ts-expect-error: a tool's module, plain JavaScript without types.
import { DATA, PAGE, build, places, render } from '../tools/geo-coverage.mjs';

type Row = { id: string; name: string; places: number; work: string; markets: string[]; unions: string[]; festivals: string[]; coverage: string; gaps: string[]; routes: string[] };
const data = build() as { totals: Record<string, unknown> & { places: number; gazetteer: number; countries: number }; rows: Row[]; markets: { id: string; cityId: string; nearestTo: number }[] };

describe('the geographic coverage matrix', () => {
  it('is what the tool writes from the code now, page and data', () => {
    expect(readFileSync(PAGE, 'utf8')).toBe(render(data));
    expect(JSON.parse(readFileSync(DATA, 'utf8'))).toEqual(JSON.parse(JSON.stringify(data)));
  });

  it('has a row for every country and territory of the gazetteer, and none it doesn’t know', () => {
    expect(data.rows.map((r) => r.id).sort()).toEqual(COUNTRIES.all().map((c) => c.id).sort());
    expect(data.totals.countries).toBe(252);
  });

  it('counts every place once, under its country, and the total is the gazetteer’s', () => {
    const all = places() as { id: string; country: string }[];
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
    expect(all.length).toBe(CITIES_IN_THE_WORLD);
    expect(data.totals.places).toBe(CITIES_IN_THE_WORLD);
    const counted = new Map<string, number>();
    for (const p of all) counted.set(p.country, (counted.get(p.country) ?? 0) + 1);
    for (const r of data.rows) expect(r.places, r.id).toBe(counted.get(r.id) ?? 0);
    // Every place nearest some market, the markets' counts summing to the places.
    expect(data.markets.reduce((a, m) => a + m.nearestTo, 0)).toBe(CITIES_IN_THE_WORLD);
  });

  it('gives each row the coverage its contents earn, and says what isn’t in the game', () => {
    for (const r of data.rows) {
      const researched = r.work === 'us-package' || r.work === 'verified' || r.markets.length > 0;
      const partly = r.work === 'partial' || r.unions.length > 0 || r.festivals.length > 0;
      expect(r.coverage, r.id).toBe(researched ? 'researched' : partly ? 'partly researched' : 'simulated');
      expect(r.work, r.id).toBe(r.id === 'us' ? 'us-package' : jurisdictionOf(r.id, r.name).research);
      // A country without its rules says so, never silently: its gaps name them.
      if (r.work === 'unsupported') expect(r.gaps, r.id).toContain('its rules for working there');
      if (!r.markets.length) expect(r.gaps, r.id).toContain('a market of its own');
      if (r.id !== 'us') expect(r.gaps.length, r.id).toBeGreaterThan(0);
    }
    // The markets the slate makes work in are each in a country the matrix calls researched.
    for (const m of MARKETS) {
      const country = CITIES.get(m.cityId)!.countryId;
      expect(data.rows.find((r) => r.id === country)!.coverage, m.id).toBe('researched');
    }
  });

  it('moves with what it reads (the falsifiability test): a country’s verified routes are its row’s', () => {
    const uk = data.rows.find((r) => r.id === 'uk')!;
    expect(uk.work).toBe('verified');
    expect(uk.routes).toEqual(jurisdictionOf('uk').routes.map((r) => r.name));
    const ie = data.rows.find((r) => r.id === 'ie')!;
    // Ireland has FIA's union and no rules the game has read: partly researched, and it says its rules aren't in the game.
    expect(ie.unions.length).toBeGreaterThan(0);
    expect(ie.coverage).toBe('partly researched');
    expect(ie.gaps).toContain('its rules for working there');
  });
});
