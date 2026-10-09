/**
 * The entertainment database's index (`world/database.ts`, from 2026-10-08):
 * one record a thing, search and its filters, suggestions, pages, the counts
 * it reports, the real-world file's own facts, and how long a large index
 * takes to search.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { ROLES } from '@/engine/content/career';
import { COMPANIES } from '@/engine/content/industry';
import { castPerformer, industryOf, newProject } from '@/engine/systems/industry';
import { counts, entries, filmographies, routeOf, search, suggest, titlesOf, type RealWorld } from '@/engine/world/database';
import realFile from '@/engine/content/realworld/titles.json';

const real = realFile as unknown as RealWorld;
const costar = ROLES.find((r) => r.id === 'costar')!;

describe('the real-world records', () => {
  it('say their source, license and date; every credit names somebody in the file; every title is one of the ten’s', () => {
    expect(real.source).toMatch(/Wikidata.*CC0/);
    expect(real.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const ids = new Set(real.titles.map((t) => t.id));
    expect(ids.size).toBe(real.titles.length);
    for (const t of real.titles) {
      for (const c of t.cast) expect(real.people[c.person]).toBeDefined();
      for (const d of t.directors) expect(real.people[d]).toBeDefined();
      expect(t.companies.length).toBeGreaterThan(0);
      for (const c of t.companies) expect(COMPANIES.some((x) => x.id === c)).toBe(true);
      // A running time in minutes, as a person would read one: until the import read Wikidata's normalized
      // amount, Oppenheimer's said 10,809 (its seconds).
      if (t.minutes !== undefined) expect(t.minutes).toBeLessThan(400);
    }
  });

  it('a person’s filmography is every title they’re credited on in the file, as cast or director', () => {
    const work = filmographies(real);
    const someone = real.titles[0]!.cast[0]!.person;
    const theirs = real.titles.filter((t) => t.cast.some((c) => c.person === someone) || t.directors.includes(someone));
    expect(work.get(someone)!.map((w) => w.title.id).sort()).toEqual([...new Set(theirs.map((t) => t.id))].sort());
    expect(titlesOf(real, 'netflix').every((t) => t.companies.includes('netflix'))).toBe(true);
  });
});

describe('the index', () => {
  it('holds each thing once: a project, a performer, a classmate, you, a company, a real title or person', () => {
    const sim = quickSave({}, 'db-once');
    const p = newProject(sim, costar, 'us-ny-newyork', sim.now, 'o1');
    castPerformer(sim, p, p.parts[1]!, sim.now, sim.now + 5 * MS_DAY, 'o');
    const all = entries(sim, real);
    const keys = all.map((e) => `${e.kind}:${e.id}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(all.filter((e) => e.kind === 'company')).toHaveLength(COMPANIES.length);
    expect(all.filter((e) => e.kind === 'you')).toHaveLength(1);
    expect(all.filter((e) => e.kind === 'project' && e.id === p.id)).toHaveLength(1);
    expect(routeOf('title', 'Q1')).toBe('/workspace/industry/title/Q1');
  });

  it('without the real records, holds the save’s and the companies, and nothing real in their place', () => {
    const sim = quickSave({}, 'db-none');
    newProject(sim, costar, 'us-ny-newyork', sim.now, 'n1');
    const all = entries(sim);
    expect(all.some((e) => e.source === 'real')).toBe(false);
    expect(all.some((e) => e.kind === 'project')).toBe(true);
    const n = counts(sim);
    expect([n.realTitles, n.realPeople]).toEqual([undefined, undefined]);
    expect(n.projects).toBe(1);
  });

  it('searches by name, best match first, filtered by kind, source, company and years, a page at a time', () => {
    const sim = quickSave({}, 'db-search');
    const all = entries(sim, real);
    const oppenheimer = search(all, { text: 'oppenheimer' });
    expect(oppenheimer.rows[0]!.name).toBe('Oppenheimer');
    const films = search(all, { kinds: ['title'], source: 'real', from: 2020, to: 2021, sort: 'oldest', per: 10 });
    expect(films.rows.every((e) => e.kind === 'title' && e.year! >= 2020 && e.year! <= 2021)).toBe(true);
    expect(films.rows.map((e) => e.year)).toEqual([...films.rows.map((e) => e.year)].sort());
    const netflix = search(all, { kinds: ['title'], company: 'netflix', per: 1000 });
    expect(netflix.total).toBe(titlesOf(real, 'netflix').filter((t) => t.companies[0] === 'netflix').length);
    const page2 = search(all, { kinds: ['person'], per: 25, page: 2 });
    expect([page2.page, page2.rows.length]).toEqual([2, 25]);
    expect(search(all, { kinds: ['person'], per: 25, page: 9999 }).page).toBe(page2.pages);
    expect(search(all, { text: 'zzzzqqqq' }).total).toBe(0);
    expect(suggest(all, 'o')).toEqual([]);
    expect(suggest(all, 'oppen').length).toBeGreaterThan(0);
  });

  it('stays quick as a save grows: hundreds of projects and performers beside the real records', () => {
    const sim = quickSave({}, 'db-big');
    for (let n = 0; n < 400; n += 1) {
      const p = newProject(sim, costar, n % 2 ? 'us-ny-newyork' : 'us-ca-losangeles', sim.now + n * MS_DAY, `big-${n}`);
      castPerformer(sim, p, p.parts[1]!, sim.now + n * MS_DAY, sim.now + (n + 3) * MS_DAY, 'b');
    }
    expect(industryOf(sim).projects.length).toBeGreaterThanOrEqual(400);
    const t0 = performance.now();
    const all = entries(sim, real);
    for (const q of ['the', 'a', 'qu', 'harbor', 'smith']) search(all, { text: q, page: 2 });
    const took = performance.now() - t0;
    // Building the index once and five searches over it: well under what a keystroke can wait.
    expect(took).toBeLessThan(400);
  });
});
