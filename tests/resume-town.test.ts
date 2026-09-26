/**
 * A save made in a town outside the bundled gazetteer (`loadPlacesFor` in
 * `engine/index.ts`). Until 2026-09-26 the save screen checked the save
 * before its country's towns were loaded, and a life begun in Pittsburgh
 * was refused as being in an unknown location. In a file of its own, so no
 * other test has loaded the country first.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadPlacesFor } from '@/engine';
import { CITIES, addCountryCities, isCountryLoaded } from '@/engine/content/geography';
import type { SaveUniverse } from '@/engine/domain/model';

const universe = (cityId: string) => ({ people: { p: { currentLocationId: cityId, homeRegionId: cityId } } }) as unknown as SaveUniverse;

describe('a save in a town the gazetteer doesn’t bundle', () => {
  it('loads the country of a town it doesn’t know, and only that, before the save is checked', async () => {
    expect(CITIES.get('us-pa-pittsburgh')).toBeUndefined();
    const asked: string[] = [];
    await loadPlacesFor(universe('us-pa-pittsburgh'), async (id) => {
      asked.push(id);
      return addCountryCities(id, readFileSync(`public/geo/${id}.tsv`, 'utf8'));
    });
    expect(asked).toEqual(['us']);
    expect(isCountryLoaded('us')).toBe(true);
    expect(CITIES.get('us-pa-pittsburgh')?.name).toBe('Pittsburgh');
  });

  it('asks for nothing where the town is already known', async () => {
    const asked: string[] = [];
    await loadPlacesFor(universe('us-pa-pittsburgh'), async (id) => { asked.push(id); return 0; });
    expect(asked).toEqual([]);
  });
});
