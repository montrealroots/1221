/**
 * The real award bodies.
 *
 * Each body is the real one on its real date, applies its own eligibility,
 * contests the categories it actually has, and explains every result in its
 * own terms. Festivals ask for the premieres they really ask for. And a save
 * from before keeps every decided result exactly as it was.
 */

import { describe, expect, it } from 'vitest';
import { loadSave, migrate, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Project } from '@/engine/domain/model';
import {
  AWARD_BODIES, AWARD_BODY_BY_ID, FESTIVALS, FESTIVAL_BY_ID, bodyName, contestsFor, currentEditionFor, editionName,
  eligibleContests, festivalAdmits, festivalName, isEligible, whyNotContested,
} from '@/engine/systems/awards';
import { performerTitleOf } from '@/engine/core/performer';
import { MS_DAY, instantFromZoned, parseDateKey, zonedParts } from '@/engine/core/time';

const LA = 'America/Los_Angeles';
const day = (y: number, m: number, d: number) => instantFromZoned({ year: y, month: m, day: d, hour: 12 }, LA);
/** A release date six weeks into an edition's window, whatever the window is. */
const within = (edition: { eligibilityStart: number }) => edition.eligibilityStart + 42 * MS_DAY;

/** A finished, released film of the player's, with whatever the test needs changed. */
function makeFilm(sim: Simulation, over: Partial<Project> = {}): Project {
  const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: over.title ?? 'The Long Weekend', format: over.format ?? 'feature', genres: over.genres ?? ['drama'], logline: 'A film.' } });
  expect(made.ok).toBe(true);
  const project = sim.universe.projects[made.value!.projectId] as Project;
  const director = Object.values(sim.universe.people).find((p) => !p.isPlayer)!;
  Object.assign(project, {
    phase: 'released', finalQuality: 90, criticScore: 88, audienceScore: 82, budget: 20_000_000_00,
    boxOfficeDomestic: 80_000_000_00, boxOfficeInternational: 60_000_000_00, totalRevenue: 140_000_000_00, totalCost: 20_000_000_00,
    releaseDate: day(2025, 6, 6), releaseStrategy: 'wide_theatrical', castIds: [sim.player.id], directorId: director.id, writerIds: [sim.player.id],
    language: 'en', productionCountryId: 'us',
  }, over);
  project.attachments.push({ personId: sim.player.id, role: 'lead', attachedAt: sim.now, confirmed: true });
  return project;
}

describe('the bodies', () => {
  it('are the real ones, each with categories SLATE can contest', () => {
    expect(AWARD_BODIES.length).toBeGreaterThan(45);
    for (const body of AWARD_BODIES) {
      expect(contestsFor(body.id).length, `${body.name} has nothing to contest`).toBeGreaterThanOrEqual(3);
      expect(body.rules.eligibility.length).toBeGreaterThan(40);
    }
    const oscars = contestsFor('oscars').map((c) => c.name);
    expect(oscars).toEqual(expect.arrayContaining(['Best Picture', 'Best Actress', 'Best International Feature Film', 'Best Casting', 'Best Animated Short Film']));
    expect(contestsFor('primetime-emmys').map((c) => c.kind)).toEqual(expect.arrayContaining(['series_drama', 'series_comedy', 'tv_lead_actor_drama', 'tv_lead_actress_comedy', 'limited_series']));
    expect(contestsFor('actor-awards').map((c) => c.kind)).toEqual(expect.arrayContaining(['ensemble', 'stunt_ensemble', 'lead_actress']));
    expect(contestsFor('razzies').map((c) => c.kind)).toEqual(expect.arrayContaining(['worst_picture', 'worst_actress']));
    // The honours are listed, never contested.
    expect(contestsFor('oscars').some((c) => c.name.includes('Honorary'))).toBe(false);
    expect(whyNotContested('naacp-image-awards')).toMatch(/ethnicity/);
    expect(bodyName('vanguard')).toBe('The Vanguard Awards');
  });

  it('put every edition on the real date, in the body\'s own zone', () => {
    const sim = quickSave({}, 'awards-dates');
    const editions = Object.values(sim.universe.awardEditions);
    const oscars26 = editions.find((e) => e.bodyId === 'oscars' && e.year === 2026)!;
    expect(oscars26.ceremonyAt).toBe(parseDateKey('2026-03-15', LA, 17));
    expect(oscars26.editionNumber).toBe(98);
    expect(oscars26.finalised).toBe(false);
    expect(zonedParts(oscars26.eligibilityStart, LA)).toMatchObject({ year: 2025, month: 1, day: 1 });
    expect(zonedParts(oscars26.eligibilityEnd, LA)).toMatchObject({ year: 2025, month: 12, day: 31 });
    // Already happened when the save began: history, not simulated.
    const globes26 = editions.find((e) => e.bodyId === 'golden-globes' && e.year === 2026)!;
    expect(globes26.finalised).toBe(true);
    expect(globes26.predatesSave).toBe(true);
    // The Emmys judge June to May.
    const emmys26 = editions.find((e) => e.bodyId === 'primetime-emmys' && e.year === 2026)!;
    expect(zonedParts(emmys26.eligibilityStart, LA)).toMatchObject({ year: 2025, month: 6, day: 1 });
    expect(zonedParts(emmys26.eligibilityEnd, LA)).toMatchObject({ year: 2026, month: 5, day: 31 });
    // Next year is there too, projected from the pattern.
    expect(editions.some((e) => e.bodyId === 'oscars' && e.year === 2027)).toBe(true);
    expect(editionName(oscars26.editionNumber, bodyName('oscars'))).toBe('The 98th Academy Awards');
  });
});

describe('eligibility', () => {
  it('needs a theatrical run for the Oscars but not for the Globes', () => {
    const sim = quickSave({}, 'awards-theatrical');
    const oscars = currentEditionFor(sim, 'oscars')!;
    const globes = currentEditionFor(sim, 'golden-globes')!;
    const theatrical = makeFilm(sim);
    expect(isEligible(sim, theatrical, oscars)).toEqual({ ok: true });
    const streaming = makeFilm(sim, { title: 'Night Feed', releaseStrategy: 'streaming_exclusive' });
    const verdict = isEligible(sim, streaming, oscars);
    expect(verdict.ok).toBe(false);
    expect((verdict as { reason: string }).reason).toMatch(/theatrical/i);
    // The Globes' next edition judges 2026; move the film into it.
    streaming.releaseDate = day(2026, 2, 1);
    expect(isEligible(sim, streaming, globes)).toEqual({ ok: true });
  });

  it('holds the window, and says which dates it covers', () => {
    const sim = quickSave({}, 'awards-window');
    const oscars = currentEditionFor(sim, 'oscars')!;
    const old = makeFilm(sim, { releaseDate: day(2024, 6, 6) });
    const verdict = isEligible(sim, old, oscars);
    expect(verdict.ok).toBe(false);
    expect((verdict as { reason: string }).reason).toMatch(/January 1, 2025.*December 31, 2025/);
  });

  it('keeps television and film apart, and counts the Emmys\' episodes', () => {
    const sim = quickSave({}, 'awards-tv');
    const emmys = currentEditionFor(sim, 'primetime-emmys')!;
    const film = makeFilm(sim);
    expect((isEligible(sim, film, emmys) as { reason: string }).reason).toMatch(/television body/);
    const series = makeFilm(sim, { title: 'Harbour Lights', format: 'series', releaseStrategy: 'streaming_exclusive', releaseDate: day(2025, 9, 10), seasons: [{ number: 1, episodeCount: 8, orderedAt: 0, status: 'aired' }] });
    expect(isEligible(sim, series, emmys)).toEqual({ ok: true });
    expect(eligibleContests(sim, series, emmys).map((c) => c.kind)).toEqual(expect.arrayContaining(['series_drama']));
    expect(eligibleContests(sim, series, emmys).map((c) => c.kind)).not.toEqual(expect.arrayContaining(['series_comedy']));
    const short = makeFilm(sim, { title: 'Four Nights', format: 'series', releaseStrategy: 'streaming_exclusive', releaseDate: day(2025, 9, 10), seasons: [{ number: 1, episodeCount: 4, orderedAt: 0, status: 'aired' }] });
    expect((isEligible(sim, short, emmys) as { reason: string }).reason).toMatch(/six episodes/);
    const oscars = currentEditionFor(sim, 'oscars')!;
    expect((isEligible(sim, series, oscars) as { reason: string }).reason).toMatch(/film body/);
  });

  it('applies the Spirit Awards\' budget cap and independence', () => {
    const sim = quickSave({}, 'awards-spirit');
    const spirit = currentEditionFor(sim, 'spirit-awards')!;
    expect(isEligible(sim, makeFilm(sim, { budget: 10_000_000_00, releaseDate: within(spirit) }), spirit)).toEqual({ ok: true });
    const big = makeFilm(sim, { title: 'Tentpole', budget: 90_000_000_00, releaseDate: within(spirit) });
    expect((isEligible(sim, big, spirit) as { reason: string }).reason).toMatch(/under \$30/);
  });

  it('reads country and language: a French film at the Césars and at the Oscars', () => {
    const sim = quickSave({}, 'awards-country');
    const cesars = currentEditionFor(sim, 'cesar-awards')!;
    const oscars = currentEditionFor(sim, 'oscars')!;
    const american = makeFilm(sim, { releaseDate: within(cesars) });
    // An American film can only be the Césars' foreign film.
    expect(isEligible(sim, american, cesars)).toEqual({ ok: true });
    expect(eligibleContests(sim, american, cesars).map((c) => c.kind)).toEqual(['international']);
    const americanForOscars = makeFilm(sim, { title: 'Stateside', releaseDate: within(oscars) });
    expect(eligibleContests(sim, americanForOscars, oscars).map((c) => c.kind)).not.toContain('international');
    const french = makeFilm(sim, { title: 'La Rive', language: 'fr', productionCountryId: 'fr', releaseDate: within(cesars) });
    const atCesars = eligibleContests(sim, french, cesars).map((c) => c.kind);
    expect(atCesars).toEqual(expect.arrayContaining(['picture', 'director']));
    expect(atCesars).not.toContain('international');
    const frenchForOscars = makeFilm(sim, { title: 'La Rive II', language: 'fr', productionCountryId: 'fr', releaseDate: within(oscars) });
    expect(eligibleContests(sim, frenchForOscars, oscars).map((c) => c.kind)).toEqual(expect.arrayContaining(['international', 'picture']));
    // Hong Kong's academy has no foreign category at all, so an American film gets a plain answer.
    const hkfa = currentEditionFor(sim, 'hong-kong-film-awards')!;
    expect((isEligible(sim, makeFilm(sim, { title: 'Stateside II', releaseDate: within(hkfa) }), hkfa) as { reason: string }).reason).toMatch(/Hong Kong/);
  });

  it('names a performer only for the category their title admits', () => {
    const sim = quickSave({}, 'awards-gender');
    const oscars = currentEditionFor(sim, 'oscars')!;
    const film = makeFilm(sim);
    const kinds = eligibleContests(sim, film, oscars).map((c) => c.kind);
    const title = performerTitleOf(sim.player);
    expect(kinds).toContain(title === 'actress' ? 'lead_actress' : 'lead_actor');
    expect(kinds).not.toContain(title === 'actress' ? 'lead_actor' : 'lead_actress');
  });

  it('names the worst only among wide releases that were badly reviewed', () => {
    const sim = quickSave({}, 'awards-razzies');
    const razzies = currentEditionFor(sim, 'razzies')!;
    const flop = makeFilm(sim, { title: 'Dune Buggy 4', finalQuality: 22, criticScore: 14, audienceScore: 30, releaseDate: within(razzies) });
    expect(eligibleContests(sim, flop, razzies).map((c) => c.kind)).toEqual(expect.arrayContaining(['worst_picture']));
    const small = makeFilm(sim, { title: 'Quiet Failure', finalQuality: 22, criticScore: 14, releaseStrategy: 'limited_theatrical', releaseDate: within(razzies) });
    expect((isEligible(sim, small, razzies) as { reason: string }).reason).toMatch(/opened wide|admits/);
  });
});

describe('a season', () => {
  it('nominates, decides, explains, and never changes its mind', () => {
    const sim = quickSave({}, 'awards-season');
    const film = makeFilm(sim);
    const oscars = currentEditionFor(sim, 'oscars')!;
    // Campaign for it, then run through the 98th Academy Awards.
    const campaign = sim.execute({ kind: 'award.campaign', payload: { projectId: film.id, bodyId: 'oscars', categories: ['Best Picture', 'Best Original Screenplay'], spend: 800_00 } });
    expect(campaign.ok, JSON.stringify(campaign)).toBe(true);
    const lateForCritics = sim.execute({ kind: 'award.campaign', payload: { projectId: film.id, bodyId: 'nyfcc', categories: ['Best Film'], spend: 10_000_00 } });
    expect(lateForCritics.ok).toBe(false);
    sim.advanceTo(oscars.ceremonyAt + MS_DAY);

    const edition = sim.universe.awardEditions[oscars.id]!;
    expect(edition.finalised).toBe(true);
    const nominations = Object.values(sim.universe.awardNominations).filter((n) => n.editionId === edition.id && n.announcedAt > 0);
    expect(nominations.length).toBeGreaterThan(5);
    const picture = nominations.filter((n) => n.category === 'Best Picture');
    expect(picture.length).toBeLessThanOrEqual(10);
    expect(picture.filter((n) => n.won).length).toBe(1);
    expect(picture.some((n) => n.projectId === film.id)).toBe(true);
    // Nobody is nominated as an actor who is not one.
    for (const n of nominations.filter((n) => n.kind === 'lead_actor' || n.kind === 'supporting_actor')) {
      expect(performerTitleOf(sim.universe.people[n.personId!]!)).toBe('actor');
    }
    for (const n of nominations.filter((n) => n.kind === 'lead_actress' || n.kind === 'supporting_actress')) {
      expect(performerTitleOf(sim.universe.people[n.personId!]!)).toBe('actress');
    }
    // Every result of the player's is explained in the Academy's terms.
    const audits = sim.universe.audits ? Object.values(sim.universe.audits) : [];
    const mine = audits.filter((a) => ['award.nominated', 'award.won', 'award.lost', 'award.not_nominated'].includes(a.kind));
    expect(mine.length).toBeGreaterThan(0);
    for (const a of mine) {
      expect(a.factors.map((f) => f.label)).toEqual(expect.arrayContaining(['The Work', 'The Reviews', 'The Ballots']));
      expect(a.factors.find((f) => f.label === 'The Ballots')?.knowable).toBe(false);
    }
    // The Academy's own results are explained as the Academy's.
    const oscarNominationIds = new Set(nominations.map((n) => n.id));
    const academy = mine.filter((a) => oscarNominationIds.has(a.subjectId));
    expect(academy.length).toBeGreaterThan(0);
    for (const a of academy) expect(a.summary).toMatch(/Academy/);
    // Finalised history: a later campaign is refused.
    const late = sim.execute({ kind: 'award.campaign', payload: { projectId: film.id, bodyId: 'oscars', categories: ['Best Picture'], spend: 1_000_00 } });
    expect(late.ok).toBe(false);
  });

  it('reaches the same winners twice from the same seed', () => {
    const run = () => {
      const sim = quickSave({}, 'awards-determinism');
      makeFilm(sim);
      sim.advanceTo(currentEditionFor(sim, 'oscars')!.ceremonyAt + MS_DAY);
      return Object.values(sim.universe.awardNominations).filter((n) => n.won).map((n) => `${n.category}:${n.projectId}`).sort();
    };
    expect(run()).toEqual(run());
  });
});

describe('festivals', () => {
  it('are the real ones and police their premieres', () => {
    expect(FESTIVALS.length).toBeGreaterThan(45);
    const sim = quickSave({}, 'awards-festivals');
    const released = makeFilm(sim);
    const cannes = FESTIVAL_BY_ID.cannes!;
    expect((festivalAdmits(sim, released, cannes) as { reason: string }).reason).toMatch(/world premiere/);
    const fresh = makeFilm(sim, { title: 'Unseen', releaseDate: undefined, releaseStrategy: undefined, phase: 'post' });
    delete fresh.releaseDate;
    expect(festivalAdmits(sim, fresh, cannes)).toEqual({ ok: true });
    expect((festivalAdmits(sim, fresh, FESTIVAL_BY_ID.annecy!) as { reason: string }).reason).toMatch(/animation/);
    expect((festivalAdmits(sim, fresh, FESTIVAL_BY_ID['fantastic-fest']!) as { reason: string }).reason).toMatch(/genre/);
    expect(festivalName('meridian_fest')).toBe('Meridian Festival');
  });

  it('take a submission, decide it on the line-up day, and let a jury give real prizes', () => {
    const sim = quickSave({}, 'awards-cannes');
    const fresh = makeFilm(sim, { title: 'Unseen', releaseStrategy: undefined, phase: 'post', finalQuality: 96, criticScore: 95 });
    delete fresh.releaseDate;
    const submitted = sim.execute<{ submissionId: Id; fee: number }>({ kind: 'fest.submit', payload: { projectId: fresh.id, festivalId: 'cannes' } });
    expect(submitted.ok, JSON.stringify(submitted)).toBe(true);
    expect(submitted.value!.fee).toBe(0);
    sim.advanceTo(parseDateKey('2026-05-25', 'Europe/Paris', 12));
    const submission = sim.universe.festivalSubmissions[submitted.value!.submissionId]!;
    expect(['rejected', 'screened', 'selected']).toContain(submission.status);
    expect(submission.decisionAt).toBeDefined();
    if (submission.status === 'screened') {
      expect(['Competition', 'Un Certain Regard']).toContain(submission.section);
      for (const prize of submission.awardsWon) expect(FESTIVAL_BY_ID.cannes!.spec.prizes).toContain(prize);
    }
    const audits = Object.values(sim.universe.audits ?? {}).filter((a) => a.kind === 'fest.decision' && a.subjectId === fresh.id);
    expect(audits.length).toBe(1);
    expect(audits[0]!.factors.some((f) => f.label === 'The Rest Of The Slate' && !f.knowable)).toBe(true);
  });
});

describe('a save from before', () => {
  it('keeps every decided result and retires only what could never be decided', () => {
    const sim = quickSave({}, 'awards-migrate');
    const universe = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    const film = Object.values(universe.projects)[0]!;
    delete film.language; delete film.productionCountryId;
    universe.awardEditions['legacy_done'] = { id: 'legacy_done', saveId: universe.meta.id, bodyId: 'vanguard', editionNumber: 97, year: 2026, ceremonyAt: 1, nominationsAnnouncedAt: 1, eligibilityStart: 0, eligibilityEnd: 1, status: 'complete', finalised: true };
    universe.awardNominations['legacy_won'] = { id: 'legacy_won', saveId: universe.meta.id, editionId: 'legacy_done', bodyId: 'vanguard', category: 'Best Picture', projectId: film.id, announcedAt: 1, decidedAt: 1, won: true, campaignSpend: 0 };
    universe.awardEditions['legacy_open'] = { id: 'legacy_open', saveId: universe.meta.id, bodyId: 'beacon', editionNumber: 78, year: 2027, ceremonyAt: 9e12, nominationsAnnouncedAt: 9e12, eligibilityStart: 0, eligibilityEnd: 1, status: 'upcoming', finalised: false };
    universe.awardNominations['legacy_pending'] = { id: 'legacy_pending', saveId: universe.meta.id, editionId: 'legacy_open', bodyId: 'beacon', category: 'Outstanding Drama Series', projectId: film.id, announcedAt: 0, campaignSpend: 5_000_00 };
    universe.scheduled.push({ id: 'sched_legacy', saveId: universe.meta.id, at: 9e12, kind: 'award.ceremony', payload: { editionId: 'legacy_open' }, status: 'pending', priority: 22, label: 'The 78th Beacon Awards', category: 'awards' } as never);
    universe.meta.schemaVersion = 13;

    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(result.steps.join(' ')).toMatch(/real ones/);
    expect(universe.awardEditions['legacy_done']).toBeDefined();
    expect(universe.awardNominations['legacy_won']?.won).toBe(true);
    expect(universe.awardEditions['legacy_open']).toBeUndefined();
    expect(universe.awardNominations['legacy_pending']).toBeUndefined();
    expect(universe.scheduled.some((s) => s.id === 'sched_legacy')).toBe(false);
    expect(film.language).toBe('en');
    expect(film.productionCountryId).toBe('us');

    const loaded = loadSave(universe);
    expect(Object.values(loaded.universe.awardEditions).some((e) => e.bodyId === 'oscars')).toBe(true);
    expect(bodyName('beacon')).toBe('The Beacon Awards');
    expect(AWARD_BODY_BY_ID.vanguard).toBeUndefined();
  });
});
