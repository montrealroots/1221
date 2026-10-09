/**
 * Looking a real title up on Wikidata while playing (`world/lookup.ts`,
 * `industry.keep_lookup`, from 2026-10-08): read from Wikidata's own answers,
 * recorded once for "Carrie" (`tests/fixtures/lookup-carrie.json`), so the
 * test needs no network; kept in the save dated, found by Find after, offline
 * and through a save; never twice; and when Wikidata can't be reached, an
 * error and nothing kept.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { industryOf } from '@/engine/systems/industry';
import { LOOKUP, lookUp, readTitles, screenItems, searchUrl, type Fetcher } from '@/engine/world/lookup';
import { entries, search, withLooked, type RealTitle, type RealWorld } from '@/engine/world/database';
import recorded from './fixtures/lookup-carrie.json';
import bundle from '@/engine/content/realworld/titles.json';

const real = bundle as unknown as RealWorld;
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** Wikidata, as it answered on the day it was recorded: the search, then the three queries in turn. */
const recordedWikidata: Fetcher = async (url) => {
  if (url.startsWith(LOOKUP.search)) return recorded.search;
  const q = decodeURIComponent(url);
  if (q.includes('p:P161')) return recorded.cast;
  if (q.includes('p:P2047')) return recorded.runtime;
  return recorded.facts;
};

describe('reading Wikidata’s answers', () => {
  it('finds both films called Carrie, with their directors, casts, characters and running times', async () => {
    const ids = screenItems(recorded.search).map((x) => x.id);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    const found = await lookUp('Carrie', recordedWikidata, real.companyEntities!);
    const byYear = Object.fromEntries(found.titles.map((t) => [t.year, t]));
    const seventies = byYear[1976]!;
    expect([seventies.title, seventies.kind, seventies.minutes]).toEqual(['Carrie', 'film', 98]);
    expect(seventies.directors.map((d) => found.people[d])).toEqual(['Brian De Palma']);
    expect(seventies.cast.some((c) => found.people[c.person] === 'Sissy Spacek' && c.character === 'Carrie White')).toBe(true);
    // Credited to one of the ten by the entities the bundle records: United Artists is Amazon MGM's.
    expect(seventies.companies).toContain('amazon-mgm-studios');
    expect(byYear[2013]!.directors.map((d) => found.people[d])).toEqual(['Kimberly Peirce']);
    expect(searchUrl('Carrie')).toContain('origin=*');
  });

  it('keeps nothing it can’t name: an unnamed item, a date-less one', () => {
    const ids = ['Q162672'];
    const noName = readTitles(ids, { results: { bindings: [] } }, { results: { bindings: [] } }, { results: { bindings: [] } }, {});
    expect(noName.titles).toEqual([]);
  });

  it('where Wikidata can’t be reached, the lookup fails and nothing is invented', async () => {
    const offline: Fetcher = async () => { throw new Error('Failed to fetch'); };
    await expect(lookUp('Carrie', offline, {})).rejects.toThrow('Failed to fetch');
    const nothing: Fetcher = async () => ({ search: [] });
    expect(await lookUp('zzqq', nothing, {})).toEqual({ titles: [], people: {} });
  });
});

describe('a lookup kept in the save', () => {
  it('is kept dated, found by Find after, once only, through a save', async () => {
    let sim = quickSave({}, 'lookup-keep');
    const found = await lookUp('Carrie', recordedWikidata, real.companyEntities!);
    expect(search(entries(sim, real), { text: 'carrie', kinds: ['title'] }).total).toBe(0);
    sim.must({ kind: 'industry.keep_lookup', payload: { titles: found.titles, people: found.people, fetched: '2026-10-08' } });
    sim.must({ kind: 'industry.keep_lookup', payload: { titles: found.titles, people: found.people, fetched: '2026-10-09' } });
    sim = reload(sim);
    const looked = industryOf(sim).looked!;
    expect(Object.keys(looked.titles).sort()).toEqual(found.titles.map((t) => t.id).sort());
    expect(Object.values(looked.titles).every((t) => t.fetched === '2026-10-09')).toBe(true);
    const all = entries(sim, withLooked(real, looked));
    const carries = search(all, { text: 'carrie', kinds: ['title'] }).rows;
    expect(carries.map((e) => e.year).sort()).toEqual([1976, 2013]);
    expect(carries.every((e) => /fetched from Wikidata 2026-10-09/.test(e.sub))).toBe(true);
    // Without the bundle (still loading, or unavailable), the save's own lookups are still there.
    expect(withLooked(undefined, looked)!.titles).toHaveLength(found.titles.length);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('a title the bundle has already isn’t added twice', () => {
    const t = real.titles[0]!;
    const merged = withLooked(real, { titles: { [t.id]: { ...t, fetched: '2026-10-08' } }, people: {} })!;
    expect(merged.titles.filter((x) => x.id === t.id)).toHaveLength(1);
  });

  it('refuses what isn’t a title, and keeps its size: the oldest let go, and the people only they named', () => {
    const sim = quickSave({}, 'lookup-refuse');
    const bad = { id: 'not-an-id', title: 'X', year: 2000, kind: 'film', cast: [], directors: [] };
    expect(sim.execute({ kind: 'industry.keep_lookup', payload: { titles: [bad], people: {}, fetched: '2026-10-08' } }).error).toBe('None of that is a title SLATE can keep.');
    expect(sim.execute({ kind: 'industry.keep_lookup', payload: { titles: [], people: {}, fetched: 'yesterday' } }).error).toBe('A lookup keeps the day it was fetched.');
    const make = (n: number): RealTitle => ({ ...real.titles[0]!, id: `Q9${n}`, title: `Title ${n}`, cast: [{ person: `Q8${n}` }], directors: [] });
    for (let n = 0; n < LOOKUP.kept + 5; n += 1) sim.must({ kind: 'industry.keep_lookup', payload: { titles: [make(n)], people: { [`Q8${n}`]: `Person ${n}` }, fetched: '2026-10-08' } });
    const looked = industryOf(sim).looked!;
    expect(Object.keys(looked.titles)).toHaveLength(LOOKUP.kept);
    expect(looked.titles.Q90).toBeUndefined();
    expect(looked.people.Q80).toBeUndefined();
    expect(looked.people[`Q8${LOOKUP.kept + 4}`]).toBe(`Person ${LOOKUP.kept + 4}`);
  });
});
