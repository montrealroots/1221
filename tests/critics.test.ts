/**
 * Reception, counted the way it is actually counted.
 *
 * Real outlets with their own scales and tastes; a Tomatometer that is the
 * share of positive reviews; Certified Fresh by Rotten Tomatoes' rule;
 * a weighted Metascore with its bands and Must-See; CinemaScore only for a
 * wide opening; audiences and IMDb votes that arrive after the fact; an
 * embargo the distributor sets by confidence; and the world's own films
 * counted the same way.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Project } from '@/engine/domain/model';
import { AGGREGATOR_RULES, OUTLETS, cinemaScoreGrade, isFresh, letterGrade, metacriticBand, reviewTargets, scaleText } from '@/engine/content/critics';
import { defaultEmbargo, eligibleOutlets, quickReception, readsOf, receptionSummary } from '@/engine/systems/critics';
import { commissionProject } from '@/engine/systems/zeitgeist';
import { addDays, MS_DAY } from '@/engine/core/time';

function boot(): Simulation {
  return quickSave({ wealth: 'inherited' }, 'critics-seed');
}

/** A finished film of the player's, ready to release. */
function finished(sim: Simulation, quality: number, over: Partial<Project> = {}): Project {
  const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: over.title ?? `Quiet Harvest ${quality}`, format: over.format ?? 'feature', genres: over.genres ?? ['drama'], logline: 'A film.' } });
  expect(made.ok, made.error).toBe(true);
  const project = sim.universe.projects[made.value!.projectId]!;
  const rights = sim.execute({ kind: 'film.acquire_rights', payload: { projectId: project.id, title: project.title, sourceKind: 'original', acquisitionKind: 'purchase', cost: 0, holderId: sim.player.id, holderKind: 'person' } });
  expect(rights.ok, rights.error).toBe(true);
  Object.assign(project, { phase: 'post', finalQuality: quality, budget: 20_000_000_00, pictureLockedAt: sim.now, productionCountryId: 'us', language: 'en' }, over);
  return project;
}

function release(sim: Simulation, project: Project, strategy: string, days = 20, theaterCount?: number) {
  const opening = addDays(sim.now, days, sim.homeZone);
  const result = sim.execute<{ releaseId: Id; theaterCount: number }>({ kind: 'rel.set_distribution', payload: { projectId: project.id, strategy, openingDate: opening, theaterCount } });
  expect(result.ok, result.error).toBe(true);
  return { opening, releaseId: result.value!.releaseId };
}

describe('the outlets and the rules', () => {
  it('are real outlets, each with a scale, a taste and a timing', () => {
    expect(OUTLETS.all().length).toBeGreaterThan(50);
    expect(OUTLETS.get('variety')?.timing).toBe('festival');
    expect(OUTLETS.get('nyt')?.topCritic).toBe(true);
    expect(OUTLETS.get('bloody-disgusting')?.genreLean.horror).toBeGreaterThan(5);
    expect(OUTLETS.all().filter((o) => o.topCritic).length).toBeGreaterThan(25);
    for (const o of OUTLETS.all()) expect(o.note).toMatch(/no verdict here is attributed to a named critic/);
  });

  it('write scores the way each outlet writes them and count Fresh the way Rotten Tomatoes does', () => {
    expect(scaleText('stars5', 80)).toMatch(/★★★★☆ 4\/5/);
    expect(scaleText('stars4', 62)).toMatch(/2\.5\/4/);
    expect(scaleText('letter', 85)).toBe('B');
    expect(letterGrade(91)).toBe('A-');
    expect(isFresh('stars5', 60)).toBe(true);
    expect(isFresh('stars5', 50)).toBe(false);
    expect(isFresh('letter', 80)).toBe(true);
    expect(isFresh('letter', 77)).toBe(false);
    expect(metacriticBand(84).label).toBe('Universal Acclaim');
    expect(metacriticBand(55).colour).toBe('yellow');
    expect(metacriticBand(30).colour).toBe('red');
    expect(cinemaScoreGrade(94)).toBe('A+');
    expect(cinemaScoreGrade(66)).toBe('B');
    expect(cinemaScoreGrade(10)).toBe('F');
  });

  it('expect more reviews of a wide release than a limited one, and fewer of a season', () => {
    expect(reviewTargets('wide_theatrical', 3400, false).total).toBeGreaterThan(reviewTargets('limited_theatrical', 40, false).total);
    expect(reviewTargets('streaming_exclusive', 0, true).total).toBeLessThan(reviewTargets('streaming_exclusive', 0, false).total);
    expect(reviewTargets('wide_theatrical', 3400, false).certified).toBe('wide');
    expect(AGGREGATOR_RULES.rottenTomatoes.certifiedFresh.wide.reviews).toBe(80);
  });
});

describe('a release', () => {
  it('lifts the embargo early when the studio is confident and on opening morning when it is not', () => {
    const sim = boot();
    const good = finished(sim, 82, { title: 'The Patient Shoreline' });
    const bad = finished(sim, 38, { title: 'Loud Retrograde' });
    const gr = release(sim, good, 'wide_theatrical', 30);
    const br = release(sim, bad, 'wide_theatrical', 30);
    const goodAt = defaultEmbargo(sim, good, sim.universe.releases[gr.releaseId]!);
    const badAt = defaultEmbargo(sim, bad, sim.universe.releases[br.releaseId]!);
    expect((gr.opening - goodAt) / MS_DAY).toBeGreaterThanOrEqual(6);
    expect(badAt).toBeGreaterThanOrEqual(br.opening);
    expect(good.reception?.embargoSetBy).toBe('distributor');
    expect(sim.universe.scheduled.filter((s) => s.kind === 'crit.wave' && s.payload.projectId === good.id).length).toBeGreaterThan(8);
  });

  it('counts a good wide release in waves: trades at the embargo, most on release, stragglers after, then audiences', () => {
    const sim = boot();
    const project = finished(sim, 84, { title: 'Northern Testament', genres: ['drama', 'thriller'], studioId: 'universal', distributorName: 'Universal Pictures' });
    const { opening, releaseId } = release(sim, project, 'wide_theatrical', 20);
    expect(sim.universe.releases[releaseId]!.theaterCount).toBeGreaterThanOrEqual(AGGREGATOR_RULES.cinemaScore.minimumTheaters);
    const embargoAt = project.reception!.embargoAt!;
    sim.advanceTo(embargoAt + 60 * 60 * 1000);
    const afterEmbargo = receptionSummary(sim, project.id)!;
    const embargoCount = afterEmbargo.reception!.reviewCount;
    expect(afterEmbargo.reception!.waves).toContain('embargo');
    expect(embargoCount).toBeGreaterThan(60);
    expect(afterEmbargo.reception!.tomatometer).toBeGreaterThan(60);
    expect(afterEmbargo.reviews.some((r) => r.outletId === 'variety')).toBe(true);
    expect(afterEmbargo.reviews.every((r) => r.scaleText && r.verdict && r.publicationName)).toBe(true);
    expect(afterEmbargo.reviews.every((r) => r.criticName === undefined)).toBe(true);
    expect(project.criticScore).toBe(afterEmbargo.reception!.metascore);
    expect(project.audienceScore).toBeUndefined();

    sim.advanceTo(addDays(opening, 2, sim.homeZone));
    const afterRelease = receptionSummary(sim, project.id)!;
    expect(afterRelease.reception!.waves).toEqual(expect.arrayContaining(['release', 'cinemascore']));
    expect(afterRelease.reception!.reviewCount).toBeGreaterThan(embargoCount);
    expect(afterRelease.reception!.cinemaScore).toMatch(/^[ABC][+-]?$/);
    expect(afterRelease.reception!.certifiedFresh).toBe(true);
    expect(afterRelease.status).toBe('Certified Fresh');
    expect(sim.universe.audits.some((a) => a.kind === 'crit.reception' && a.subjectId === project.id)).toBe(true);
    expect(sim.universe.audits.some((a) => a.kind === 'crit.cinemascore' && a.subjectId === project.id)).toBe(true);

    sim.advanceTo(addDays(opening, 16, sim.homeZone));
    const later = receptionSummary(sim, project.id)!;
    expect(later.reception!.waves).toEqual(expect.arrayContaining(['late', 'audience', 'imdb']));
    expect(later.reception!.reviewCount).toBeGreaterThanOrEqual(reviewTargets('wide_theatrical', later.reception!.reviewCount, false).total * 0.9);
    expect(later.reception!.audienceScore).toBeGreaterThan(50);
    expect(project.audienceScore).toBe(later.reception!.audienceScore);
    expect(later.reception!.imdbRating).toBeGreaterThan(6);
    expect(later.reception!.imdbVotes).toBeGreaterThan(0);
    // Sanity on the arithmetic: the Tomatometer is the fresh share.
    expect(later.reception!.tomatometer).toBe(Math.round((later.reception!.freshCount / later.reception!.reviewCount) * 100));
  });

  it('gives a bad film a Rotten score, no Certified Fresh, and no CinemaScore for a streaming premiere', () => {
    const sim = boot();
    const project = finished(sim, 34, { title: 'Hollow Alibi', genres: ['comedy'] });
    const { opening } = release(sim, project, 'streaming_exclusive', 12);
    sim.advanceTo(addDays(opening, 10, sim.homeZone));
    const r = receptionSummary(sim, project.id)!;
    expect(r.reception!.tomatometer).toBeLessThan(45);
    expect(r.status).toBe('Rotten');
    expect(r.reception!.certifiedFresh).toBe(false);
    expect(r.reception!.cinemaScore).toBeUndefined();
    expect(r.reception!.waves).not.toContain('cinemascore');
    expect(r.band?.colour).not.toBe('green');
  });

  it('reviews a season with television desks and fewer critics', () => {
    const sim = boot();
    const project = finished(sim, 76, { title: 'Sentinel Row', format: 'series', genres: ['crime'] });
    project.seasons = [{ number: 1, episodeCount: 8, orderedAt: sim.now, status: 'ordered' }];
    const { opening } = release(sim, project, 'streaming_exclusive', 10);
    sim.advanceTo(addDays(opening, 9, sim.homeZone));
    const r = receptionSummary(sim, project.id)!;
    expect(r.reception!.reviewCount).toBeLessThan(60);
    expect(r.reviews.some((o) => o.outletId === 'tvline' || o.outletId === 'hollywood-reporter-tv')).toBe(true);
    expect(r.reviews.some((o) => o.outletId === 'sight-and-sound')).toBe(false);
  });

  it('is the same every time for the same save', () => {
    const run = () => {
      const sim = boot();
      const project = finished(sim, 71, { title: 'Blueprint & Signal' });
      const { opening } = release(sim, project, 'limited_theatrical', 15);
      sim.advanceTo(addDays(opening, 12, sim.homeZone));
      const r = project.reception!;
      return [r.tomatometer, r.metascore, r.reviewCount, r.audienceScore, r.imdbRating, r.imdbVotes];
    };
    expect(run()).toEqual(run());
  });

  it('lets the player set the embargo only on a release they control, within three weeks of opening', () => {
    const sim = boot();
    const project = finished(sim, 70, { title: 'Golden Interval' });
    const { opening } = release(sim, project, 'limited_theatrical', 20);
    const early = sim.execute({ kind: 'crit.set_embargo', payload: { projectId: project.id, at: addDays(opening, -30, sim.homeZone) } });
    expect(early.ok).toBe(false);
    const set = sim.execute<{ embargoAt: number }>({ kind: 'crit.set_embargo', payload: { projectId: project.id, at: addDays(opening, -14, sim.homeZone) } });
    expect(set.ok, set.error).toBe(true);
    expect(project.reception?.embargoSetBy).toBe('player');
    project.studioId = 'universal';
    const theirs = sim.execute({ kind: 'crit.set_embargo', payload: { projectId: project.id, at: addDays(opening, -10, sim.homeZone) } });
    expect(theirs.ok).toBe(false);
    expect(theirs.error).toMatch(/sets the embargo/);
  });
});

describe('the world\'s own films', () => {
  it('are counted by the same outlets and rules, without a paper trail', () => {
    const sim = boot();
    let counted = 0;
    for (let i = 0; i < 12; i++) {
      const project = commissionProject(sim, 'us', 100 + i);
      if (!project || project.format === 'short') continue;
      project.finalQuality = 60 + i;
      project.releaseStrategy = i % 2 === 0 ? 'wide_theatrical' : 'streaming_exclusive';
      const reception = quickReception(sim, project, sim.rng('probe', i));
      expect(reception.reviewCount).toBeGreaterThan(20);
      expect(reception.tomatometer).toBeGreaterThanOrEqual(0);
      expect(reception.metascore).toBeDefined();
      expect(project.criticScore).toBe(reception.metascore);
      expect(project.audienceScore).toBe(reception.audienceScore);
      if (project.releaseStrategy === 'wide_theatrical') expect(reception.cinemaScore).toBeDefined(); else expect(reception.cinemaScore).toBeUndefined();
      expect(Object.values(sim.universe.reviews).filter((r) => r.projectId === project.id).length).toBe(0);
      counted++;
    }
    expect(counted).toBeGreaterThan(4);
  });

  it('send a horror film to the horror desks and a festival drama to the prestige desks', () => {
    const sim = boot();
    const horror = finished(sim, 65, { title: 'Sudden Residue', genres: ['horror'] });
    const drama = finished(sim, 80, { title: 'The Cartographer Of Elm', genres: ['drama'] });
    const h = eligibleOutlets(horror, undefined, readsOf(sim, horror)).map((o) => o.id);
    const d = eligibleOutlets(drama, undefined, readsOf(sim, drama)).map((o) => o.id);
    expect(h).toContain('bloody-disgusting');
    expect(d).not.toContain('bloody-disgusting');
    expect(d).toContain('sight-and-sound');
    expect(h).toContain('variety');
  });
});
