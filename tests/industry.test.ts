/**
 * The real studios.
 *
 * The universe operates around the real companies: their parents, their
 * homes, their leadership, their labels and their catalogues. Their taste is
 * measured from what they actually made. Nothing made in a save may share a
 * title with a real film or series. And a save from before keeps every deal
 * it did under the name it did it with.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createUniverse, defaultConfig } from '@/engine/world/bootstrap';
import { loadSave, migrate } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';
import { NETWORKS } from '@/engine/content/networks';
import { STUDIOS, STUDIO_TIER_ORDER, studioForLabel } from '@/engine/content/studios';
import { STUDIO_STATS } from '@/engine/content/studio-stats';
import { BUYERS, LEGACY_BUYER_NAMES } from '@/engine/content/industry';
import { CITIES, COUNTRIES } from '@/engine/content/geography';
import {
  addImdbRatings, addKnownTitles, addStudioCatalog, addStudioCredits, creditsFor, franchisesIn, knownTitleCount, normaliseTitle, studioCatalog, titleTaken,
} from '@/engine/content/filmography';
import { generateProjectTitle } from '@/engine/content/names';
import { makeRng } from '@/engine/core/rng';
import { studioForBackgroundProject } from '@/engine/systems/casting';
import { commissionProject } from '@/engine/systems/zeitgeist';

const INDUSTRY = new URL('../public/industry/', import.meta.url);
const file = (name: string) => new URL(name, INDUSTRY);

function boot(): Simulation {
  const { universe } = createUniverse(1, 'industry-seed', defaultConfig());
  return loadSave(universe);
}

describe('the studios', () => {
  it('are the real ones, each with a parent, a home, leadership and labels', () => {
    const studios = STUDIOS.all();
    expect(studios.length).toBeGreaterThanOrEqual(50);
    for (const studio of studios) {
      expect(COUNTRIES.get(studio.countryId), `${studio.name} country`).toBeDefined();
      const inBundle = CITIES.get(studio.locationId);
      const geoFile = new URL(`../public/geo/${studio.countryId}.tsv`, import.meta.url);
      const inFile = existsSync(geoFile) && readFileSync(geoFile, 'utf8').includes(`${studio.locationId}\t`);
      expect(inBundle || inFile, `${studio.name} home ${studio.locationId}`).toBeTruthy();
      expect(studio.city.length).toBeGreaterThan(1);
      expect(studio.leadership.length, `${studio.name} leadership`).toBeGreaterThan(0);
      for (const leader of studio.leadership) {
        expect(leader.title).toMatch(/^[A-Z]/);
        expect(leader.title.split(' ').every((w) => /^[A-Z0-9(]/.test(w) || ['And', 'Of', 'The', 'For'].includes(w)), `${leader.title}`).toBe(true);
        if (leader.source) expect(leader.source).toMatch(/^https?:\/\//);
      }
      expect(studio.labels.length, `${studio.name} labels`).toBeGreaterThan(0);
      expect(studio.budgetFloor).toBeLessThan(studio.budgetCeiling);
      expect(studio.wants.length).toBeGreaterThanOrEqual(2);
      expect(STUDIO_TIER_ORDER).toContain(studio.type);
    }
    expect(STUDIOS.get('disney')?.parent?.name).toBe('The Walt Disney Company');
    expect(STUDIOS.get('warner')?.status).toMatch(/Paramount Skydance/);
    expect(STUDIOS.get('ruyi')?.aliases).toContain('Wanda Pictures');
    expect(studioForLabel('New Line Cinema')?.id).toBe('warner');
    expect(studioForLabel('Pixar')?.id).toBe('disney');
  });

  it('measure their taste from their own catalogue when the record allows', () => {
    const measured = STUDIOS.all().filter((s) => s.measured.wants);
    for (const studio of measured) {
      const stats = STUDIO_STATS[studio.id]!;
      const top = Object.keys(stats.genreShares)[0];
      // The genre they make most is one they want, unless it is one they avoid.
      if (top && !studio.avoids.includes(top)) expect(studio.wants).toContain(top);
    }
    for (const studio of STUDIOS.all().filter((s) => s.measured.budgets)) {
      expect(studio.budgetCeiling).toBeLessThanOrEqual(studio.maxBudget);
    }
  });

  it('are the buyers a pitch goes to, alongside the real networks, with no placeholders left', () => {
    const buyers = BUYERS.all();
    expect(buyers.filter((b) => b.studioId).length).toBe(STUDIOS.all().length);
    expect(buyers.filter((b) => !b.studioId && !b.networkId)).toEqual([]);
    for (const legacy of Object.keys(LEGACY_BUYER_NAMES)) expect(BUYERS.get(legacy)).toBeUndefined();
    expect(BUYERS.get('disney')?.name).toBe('Walt Disney Studios');
    expect(BUYERS.get('a24')?.type).toBe('indie');
    expect(BUYERS.get('netflix')?.type).toBe('streamer');
  });
});

describe('the catalogue', () => {
  const shipped = existsSync(file('neon.tsv')) && readFileSync(file('neon.tsv'), 'utf8').split('\n').length > 2;

  it('parses a studio index with every column the record carries', () => {
    if (!shipped) { console.warn('public/industry/neon.tsv is not built; catalogue parsing not exercised'); return; }
    const count = addStudioCatalog('neon', readFileSync(file('neon.tsv'), 'utf8'));
    expect(count).toBeGreaterThan(20);
    const titles = studioCatalog('neon')!;
    const parasite = titles.find((t) => t.title === 'Parasite');
    expect(parasite).toBeDefined();
    expect(parasite!.year).toBe(2019);
    expect(parasite!.directors).toContain('Bong Joon-ho');
    expect(parasite!.languages).toContain('Korean');
    expect(parasite!.tomatometer).toBeGreaterThan(90);
    expect(parasite!.metacritic).toBeGreaterThan(90);
    expect(parasite!.boxOffice).toBeGreaterThan(200_000_000);
    expect(parasite!.boxOfficeUnit).toBe('United States dollar');
    expect(parasite!.imdbId).toMatch(/^tt\d+/);
    expect(parasite!.roles.some((r) => r.label === 'Neon')).toBe(true);
    expect(parasite!.awardCount).toBeGreaterThan(5);
    // Every real title is now a title nothing generated may use.
    expect(titleTaken('Parasite')).toBe(true);
    expect(titleTaken('PARASITE!')).toBe(true);
    expect(knownTitleCount()).toBeGreaterThanOrEqual(count);
  });

  it('loads credits by decade and knows who did what on a title', () => {
    if (!shipped) { console.warn('catalogue not built; credits not exercised'); return; }
    addStudioCatalog('neon', readFileSync(file('neon.tsv'), 'utf8'));
    const parasite = studioCatalog('neon')!.find((t) => t.title === 'Parasite')!;
    addStudioCredits('neon', '2010s', readFileSync(file('neon-credits-2010s.tsv'), 'utf8'));
    const credits = creditsFor(parasite.qid)!;
    expect(credits.some((c) => c.role === 'director' && c.name === 'Bong Joon-ho')).toBe(true);
    expect(credits.some((c) => c.role === 'composer' && c.name === 'Jung Jae-il')).toBe(true);
    expect(credits.filter((c) => c.role === 'cast').length).toBeGreaterThan(5);
    expect(credits.some((c) => c.role === 'award' && /Palme/.test(c.name))).toBe(true);
  });

  it('overlays IMDb ratings only from the separate, deletable file', () => {
    if (!shipped || !existsSync(file('imdb.tsv'))) { console.warn('imdb.tsv not built; overlay not exercised'); return; }
    addStudioCatalog('neon', readFileSync(file('neon.tsv'), 'utf8'));
    const text = readFileSync(file('imdb.tsv'), 'utf8');
    expect(text.split('\n')[0]).toMatch(/non-commercial/);
    addImdbRatings(text);
    const parasite = studioCatalog('neon')!.find((t) => t.title === 'Parasite')!;
    expect(parasite.imdb).toBeGreaterThan(8);
    expect(parasite.imdbVotes).toBeGreaterThan(500_000);
  });

  it('groups franchises with their gross and span', () => {
    if (!shipped) return;
    for (const name of readdirSync(INDUSTRY).filter((f) => /^(disney|warner|universal)\.tsv$/.test(f))) {
      const id = name.replace('.tsv', '');
      addStudioCatalog(id, readFileSync(file(name), 'utf8'));
      const titles = studioCatalog(id)!;
      if (titles.length < 100) continue;
      const franchises = franchisesIn(titles);
      expect(franchises.length).toBeGreaterThan(3);
      expect(franchises[0]!.titles.length).toBeGreaterThanOrEqual(2);
      expect(franchises[0]!.gross).toBeGreaterThan(0);
    }
  });
});

describe('titles', () => {
  it('never generate a duplicate of a real film, a real series or another project', () => {
    addKnownTitles('the sentinel\nsundown\nthe lost harvest\n');
    expect(titleTaken('The Sentinel')).toBe(true);
    expect(titleTaken('Sundown!')).toBe(true);
    expect(normaliseTitle('Émilie & the Fault-Line')).toBe('emilie the fault line');
    const rng = makeRng('titles');
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const title = generateProjectTitle(rng, (t) => titleTaken(t) || seen.has(normaliseTitle(t)));
      expect(titleTaken(title), title).toBe(false);
      expect(seen.has(normaliseTitle(title)), title).toBe(false);
      seen.add(normaliseTitle(title));
    }
  });

  it('refuse a project named after an existing title unless it belongs to the same series or franchise', () => {
    const sim = boot();
    addKnownTitles('inception\n');
    const dup = sim.execute({ kind: 'film.create_project', payload: { title: 'Inception', format: 'feature', genres: ['thriller'], logline: 'No.' } });
    expect(dup.ok).toBe(false);
    expect(dup.error).toMatch(/already a film or series/);
    const first = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'The Long Weekend', format: 'feature', genres: ['drama'], logline: 'A film.' } });
    expect(first.ok).toBe(true);
    const again = sim.execute({ kind: 'film.create_project', payload: { title: 'the long weekend', format: 'feature', genres: ['drama'], logline: 'A film.' } });
    expect(again.ok).toBe(false);
    const sequel = sim.execute({ kind: 'film.create_project', payload: { title: 'The Long Weekend', format: 'series', genres: ['drama'], logline: 'A series.', parentSeriesId: first.value!.projectId } });
    expect(sequel.ok).toBe(true);
    const generated = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { format: 'feature', genres: ['drama'], logline: 'Untitled.' } });
    expect(generated.ok).toBe(true);
    const title = sim.universe.projects[generated.value!.projectId]!.title;
    expect(titleTaken(title)).toBe(false);
  });
});

describe('the world', () => {
  it('puts a real studio behind its own projects, one that makes that kind of thing', () => {
    const sim = boot();
    const seen = new Set<string>();
    for (let i = 0; i < 24; i++) {
      const project = commissionProject(sim, 'us', i);
      if (!project) continue;
      if (project.format === 'short') continue;
      expect(project.studioId, project.title).toBeDefined();
      const studio = STUDIOS.get(project.studioId!)!;
      // A film is released by its studio; a series is made by one and aired by a network.
      const television = project.format === 'series' || project.format === 'limited_series' || project.format === 'tv_movie';
      if (television && project.networkId) expect(project.distributorName).toBe(NETWORKS.get(project.networkId)?.name);
      else expect(project.distributorName).toBe(studio.name);
      expect(studio.formats).toContain(project.format);
      expect(project.genres.some((g) => studio.avoids.includes(g))).toBe(false);
      seen.add(studio.id);
    }
    expect(seen.size).toBeGreaterThan(3);
    // A Korean film goes to a Korean studio far more often than not.
    const rng = sim.rng('probe');
    let korean = 0;
    for (let i = 0; i < 60; i++) {
      const studio = studioForBackgroundProject(sim.rng('probe', i), { format: 'feature', genres: ['thriller'], productionCountryId: 'kr', budget: 5_000_000_00 } as never);
      if (studio?.countryId === 'kr') korean++;
    }
    expect(rng).toBeDefined();
    expect(korean).toBeGreaterThan(30);
  });

  it('pitches to the real studios and sets the studio on an accepted offer', () => {
    const sim = boot();
    const player = sim.player;
    player.reputation.professionalReputation = 95;
    player.reputation.publicFame = 90;
    const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'Northern Patience', format: 'feature', genres: ['horror'], logline: 'A house.' } });
    const projectId = made.value!.projectId;
    const project = sim.universe.projects[projectId]!;
    project.packageValue = 90;
    project.currentDraftId = 'draft';
    project.rightsId = 'rights';
    const pitched = sim.execute<{ pitches: { buyerId: string }[] }>({ kind: 'film.pitch', payload: { projectId, buyerIds: ['blumhouse', 'a24', 'neon'] } });
    expect(pitched.ok, pitched.error).toBe(true);
    expect(pitched.value!.pitches.map((p) => p.buyerId)).toEqual(expect.arrayContaining(['blumhouse']));
    const accepted = sim.execute({ kind: 'film.accept_buyer_offer', payload: { projectId, buyerId: 'blumhouse', budget: 8_000_000_00, fee: 200_000_00 } });
    expect(accepted.ok, accepted.error).toBe(true);
    expect(project.studioId).toBe('blumhouse');
    expect(project.distributorName).toBe('Blumhouse Productions');
  });

  it('keeps every deal an older save did, and lapses only what the fictional buyers still owed', () => {
    const sim = boot();
    const universe = sim.universe;
    const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'Fading Tributary', format: 'feature', genres: ['drama'], logline: 'A river.' } });
    const project = universe.projects[made.value!.projectId]!;
    project.distributorName = 'Meridian Pictures';
    project.greenlitAt = sim.now;
    universe.scheduled.push({ id: 'sched-legacy', at: sim.now + 1, kind: 'film.pitch_response', label: 'Meridian Pictures Response', category: 'career', payload: { projectId: project.id, buyerId: 'meridian', ask: 1 }, priority: 1 } as never);
    universe.decisions['dec-legacy'] = { id: 'dec-legacy', saveId: universe.meta.id, urgency: 1, category: 'career', title: 'Northgate wants it', detail: '', route: '/', actions: [{ label: 'Take', commandKind: 'film.accept_buyer_offer', payload: { buyerId: 'northgate' } }], createdAt: sim.now } as never;
    universe.meta.schemaVersion = 14;
    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(result.steps.join(' ')).toMatch(/real ones/);
    expect(project.distributorName).toBe('Meridian Pictures');
    expect(universe.scheduled.some((s) => s.id === 'sched-legacy')).toBe(false);
    expect((universe.decisions['dec-legacy'] as { dismissedAt?: number }).dismissedAt).toBeDefined();
  });
});
