/**
 * The studios, live.
 *
 * The dated slate opens on the day and runs through the same box office as
 * the player's pictures; the weekend is counted and market share with it; a
 * crowded weekend costs an opening; standing moves and settles; a company
 * that thinks enough of you offers a deal whose terms live in the save; what
 * the record left pending resolves inside its window; seats change hands and
 * the successor is marked as SLATE's; an old save gets the studios' clocks.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, loadSave, migrate } from '@/engine';
import { createUniverse, defaultConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import type { Id, Project, Release } from '@/engine/domain/model';
import { addDays, dateKey, parseDateKey, zonedParts, MS_DAY } from '@/engine/core/time';
import { STUDIOS } from '@/engine/content/studios';
import { UPCOMING_SLATE } from '@/engine/content/upcoming-slate';
import { CORPORATE_EVENTS } from '@/engine/content/corporate-events';
import { competitionFactor } from '@/engine/systems/release';
import { adjustStanding, standingWith, studioState, networkState, marketShare, liveLeadership, activeDeal } from '@/engine/systems/studio-state';
import { releaseCalendar, upcomingFor } from '@/engine/systems/studios';

function funds(sim: Simulation): number {
  return sim.ledger.availableFunds(sim.player.primaryAccountId!);
}

function releasedByPlayer(sim: Simulation, title: string, format: Project['format'], criticScore = 72): Project {
  const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title, format, genres: ['drama'], logline: 'A picture.' } });
  const project = sim.universe.projects[made.value!.projectId]!;
  Object.assign(project, { phase: 'library', criticScore, audienceScore: 70, finalQuality: 74, budget: 10_000_000_00, totalCost: 10_000_000_00, totalRevenue: 25_000_000_00, releaseDate: sim.now - 30 * MS_DAY });
  return project;
}

describe('the dated slate', () => {
  it('is on the record: real titles, real dates, real studios, sorted, no duplicates', () => {
    expect(UPCOMING_SLATE.length).toBeGreaterThan(200);
    const seen = new Set<string>();
    let last = '';
    for (const t of UPCOMING_SLATE) {
      expect(STUDIOS.get(t.studioId), `${t.title} at ${t.studioId}`).toBeDefined();
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.date >= last).toBe(true);
      last = t.date;
      const key = `${t.studioId}|${t.qid}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(t.title.length).toBeGreaterThan(0);
    }
    expect(UPCOMING_SLATE.some((t) => t.budget && t.budget > 100_000_000)).toBe(true);
    expect(UPCOMING_SLATE.some((t) => t.franchise)).toBe(true);
  });

  it('opens on the day, runs through the box office, is counted on the weekend and never opens twice', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'slate-seed');
    const today = dateKey(sim.now, sim.homeZone);
    const next = UPCOMING_SLATE.find((t) => t.date > today && t.kind === 'feature' && STUDIOS.get(t.studioId)?.distributes)!;
    expect(next).toBeDefined();
    expect(releaseCalendar(sim, 365).some((t) => t.qid === next.qid)).toBe(true);
    expect(upcomingFor(sim, next.studioId).some((t) => t.qid === next.qid)).toBe(true);
    expect(sim.universe.scheduled.filter((s) => s.kind === 'studio.slate_release' && s.status === 'pending').length).toBeGreaterThan(100);

    const openingAt = parseDateKey(next.date, sim.homeZone, 9);
    sim.advanceTo(openingAt + 4 * MS_DAY);
    const project = Object.values(sim.universe.projects).find((p) => p.catalogueQid === next.qid)!;
    expect(project, next.title).toBeDefined();
    expect(project.title).toBe(next.title);
    expect(project.studioId).toBe(next.studioId);
    expect(project.phase).toBe('released');
    expect(project.reception?.tomatometer ?? project.criticScore).toBeDefined();
    const release = Object.values(sim.universe.releases).find((r) => r.projectId === project.id)!;
    expect(release.status).toBe('in_release');
    expect(release.dailyBoxOffice.length).toBeGreaterThanOrEqual(3);
    expect(release.totalDomestic).toBeGreaterThan(0);
    expect(upcomingFor(sim, next.studioId).some((t) => t.qid === next.qid)).toBe(false);
    // The world's picture is not the player's news.
    expect(sim.universe.notifications.some((n) => n.title.includes(next.title))).toBe(false);
    expect(sim.universe.trade.some((t) => t.kind === 'release' && t.projectId === project.id)).toBe(true);
    expect(studioState(sim, next.studioId).news.some((n) => n.projectId === project.id)).toBe(true);

    // Sunday night counts the weekend.
    sim.advanceTo(openingAt + 11 * MS_DAY);
    const weekend = sim.universe.boxOffice.weekends.find((w) => w.entries.some((e) => e.projectId === project.id));
    expect(weekend, 'the weekend was not counted').toBeDefined();
    const entry = weekend!.entries.find((e) => e.projectId === project.id)!;
    expect(entry.onRecord).toBe(true);
    expect(entry.yours).toBe(false);
    expect(entry.weekend).toBeGreaterThan(0);
    const year = zonedParts(openingAt, sim.homeZone).year;
    expect(marketShare(sim, year, STUDIOS.get(next.studioId)!.countryId).some((r) => r.studioId === next.studioId && r.gross > 0)).toBe(true);
    expect(entry.market).toBe(STUDIOS.get(next.studioId)!.countryId);
    expect(sim.universe.trade.some((t) => t.kind === 'weekend')).toBe(true);
    expect(Object.values(sim.universe.projects).filter((p) => p.catalogueQid === next.qid)).toHaveLength(1);
  });
});

describe('the box office', () => {
  it('takes a slice off an opening for what opens against it, and none for a clear weekend', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'competition-seed');
    const opening = addDays(sim.now, 60, sim.homeZone);
    const mine: Release = {
      id: 'rel-mine', saveId: sim.universe.meta.id, projectId: 'p-mine', strategy: 'wide_theatrical', distributorName: 'Me', distributorShare: 0.3, exhibitorShare: 0.5,
      openingDate: opening, theaterCount: 3000, maxTheaterCount: 3000, territories: [], windows: [], dailyBoxOffice: [], totalDomestic: 0, totalInternational: 0, netToDistributor: 0, netToProducer: 0, status: 'planned',
    };
    sim.universe.releases[mine.id] = mine;
    expect(competitionFactor(sim, mine).factor).toBe(1);
    const rivalProject = releasedByPlayer(sim, 'The Rival', 'feature');
    const rival: Release = { ...mine, id: 'rel-rival', projectId: rivalProject.id, distributorName: 'Them', openingDate: opening + MS_DAY, theaterCount: 4000 };
    sim.universe.releases[rival.id] = rival;
    sim.universe.marketingCampaigns['camp-rival'] = { id: 'camp-rival', saveId: sim.universe.meta.id, projectId: rivalProject.id, budget: 1, spent: 1, positioning: '', targetAudience: '', beats: [], awareness: 92, intent: 60, sentiment: 0, socialPostIds: [], startedAt: sim.now };
    const crowded = competitionFactor(sim, mine);
    expect(crowded.factor).toBeLessThan(1);
    expect(crowded.factor).toBeGreaterThanOrEqual(0.7);
    expect(crowded.detail).toContain('The Rival');
  });
});

describe('standing', () => {
  it('moves with what you bring, is remembered, and settles toward a stranger\'s over the months', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'standing-seed');
    expect(standingWith(sim, 'studio', 'a24')).toBe(30);
    const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'Small Hours', format: 'feature', genres: ['drama'], logline: 'A film.' } });
    sim.emit('film.pitch_interested', { projectId: made.value!.projectId, buyerId: 'a24', offerBudget: 1, producerFee: 1 });
    expect(standingWith(sim, 'studio', 'a24')).toBe(32);
    adjustStanding(sim, 'studio', 'a24', 40, 'A favour.');
    expect(studioState(sim, 'a24').standing).toBe(72);
    expect(studioState(sim, 'a24').standingLog.at(-1)?.note).toBe('A favour.');
    expect(studioState(sim, 'a24').news.some((n) => n.kind === 'standing')).toBe(true);
    sim.advanceTo(addDays(sim.now, 40, sim.homeZone));
    expect(studioState(sim, 'a24').standing).toBeLessThan(72);
    expect(studioState(sim, 'a24').standing).toBeGreaterThan(65);
  });

  it('opens doors: a studio that knows you takes a meeting it would otherwise refuse', () => {
    const cold = quickSave({ wealth: 'inherited' }, 'door-seed');
    const warm = quickSave({ wealth: 'inherited' }, 'door-seed');
    // A reputation just short of the door: standing is what gets it open.
    const threshold = STUDIOS.get('a24')!.accessDifficulty - 30;
    for (const sim of [cold, warm]) {
      sim.player.reputation.professionalReputation = Math.max(0, (threshold - 10) / 0.4);
      sim.player.reputation.publicFame = 0;
      sim.player.representation.agentId = undefined;
    }
    adjustStanding(warm, 'studio', 'a24', 60, 'They know you.');
    const pitch = (sim: Simulation) => {
      const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'Quiet Street', format: 'series', genres: ['drama'], logline: 'A series.' } });
      return sim.execute<{ pitches: { buyerId: string }[] }>({ kind: 'film.pitch', payload: { projectId: made.value!.projectId, buyerIds: ['a24'] } });
    };
    expect(pitch(cold).ok).toBe(false);
    const result = pitch(warm);
    expect(result.ok, result.error).toBe(true);
    expect(result.value!.pitches.map((p) => p.buyerId)).toEqual(['a24']);
  });
});

describe('deals', () => {
  it('are offered by a company that thinks enough of you, signed on the offer\'s own terms, paid once, and put them first in line', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'deal-seed');
    releasedByPlayer(sim, 'The First One', 'series', 80);
    adjustStanding(sim, 'network', 'hbo', 50, 'They love you.');
    expect(networkState(sim, 'hbo').standing).toBe(80);
    sim.advanceTo(addDays(sim.now, 35, sim.homeZone));
    const offer = Object.values(sim.universe.decisions).find((d) => d.refType === 'deal' && !d.resolvedAt);
    expect(offer, 'no deal was offered').toBeDefined();
    expect(offer!.refId).toBe('overall|hbo');
    const terms = offer!.actions[0]!.payload as { annualFee: number };
    expect(terms.annualFee).toBeGreaterThan(0);

    const before = funds(sim);
    const signed = sim.execute<{ dealId: Id; annualFee: number }>({ kind: 'studio.accept_deal', payload: { offerRef: 'overall|hbo', annualFee: 999_999_999_00 } });
    expect(signed.ok, signed.error).toBe(true);
    expect(signed.value!.annualFee).toBe(terms.annualFee);
    expect(funds(sim)).toBe(before + terms.annualFee);
    const deal = activeDeal(sim, { kind: 'overall' })!;
    expect(deal.counterpartyId).toBe('hbo');
    expect(deal.paidTotal).toBe(terms.annualFee);
    const twice = sim.execute({ kind: 'studio.accept_deal', payload: { offerRef: 'overall|hbo' } });
    expect(twice.ok).toBe(false);
    expect(funds(sim)).toBe(before + terms.annualFee);
    expect(sim.universe.scheduled.filter((s) => s.kind === 'studio.deal_fee' && s.status === 'pending')).toHaveLength(1);

    // Under the deal, HBO sees a series first and everyone else waits out the window.
    sim.player.reputation.professionalReputation = 70;
    const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'The Second One', format: 'series', genres: ['drama'], logline: 'A series.' } });
    const pitched = sim.execute<{ pitches: { buyerId: string; respondsAt: number }[] }>({ kind: 'film.pitch', payload: { projectId: made.value!.projectId } });
    expect(pitched.ok, pitched.error).toBe(true);
    const pitches = pitched.value!.pitches;
    expect(pitches[0]!.buyerId).toBe('hbo');
    const hboAt = pitches[0]!.respondsAt;
    for (const other of pitches.slice(1)) expect(other.respondsAt - hboAt).toBeGreaterThanOrEqual(18 * MS_DAY);
    expect(activeDeal(sim, { kind: 'overall' })!.projectsShown).toBe(1);

    const ended = sim.execute({ kind: 'studio.end_deal', payload: { dealId: deal.id } });
    expect(ended.ok).toBe(true);
    expect(activeDeal(sim, { kind: 'overall' })).toBeUndefined();
    expect(networkState(sim, 'hbo').standing).toBeLessThan(80);
  });
});

describe('what the record left pending', () => {
  it('has real events with outcomes that sum to one, and resolves a dated one on its day', () => {
    for (const event of CORPORATE_EVENTS) {
      const total = event.outcomes.reduce((s, o) => s + o.chance, 0);
      expect(Math.abs(total - 1), event.id).toBeLessThan(0.001);
      expect(event.from <= event.to).toBe(true);
      expect(event.subjectKind === 'studio' ? STUDIOS.get(event.subjectId) : true, event.id).toBeTruthy();
    }
    const sim = quickSave({ wealth: 'inherited' }, 'corporate-seed');
    expect(sim.universe.scheduled.some((s) => s.kind === 'studio.corporate_event' && s.payload.eventId === 'alcon-village-roadshow')).toBe(true);
    sim.advanceTo(parseDateKey('2026-05-02', sim.homeZone, 12));
    const alcon = studioState(sim, 'alcon');
    expect(alcon.corporate).toHaveLength(1);
    expect(alcon.corporate[0]!.eventId).toBe('alcon-village-roadshow');
    expect(alcon.statusOverride).toMatch(/Village Roadshow/);
    expect(alcon.slateMultiplier).toBeCloseTo(1.2);
    expect(sim.universe.trade.some((t) => t.kind === 'corporate' && t.studioId === 'alcon')).toBe(true);
    expect(sim.universe.audits.some((a) => a.kind === 'studio.corporate_event' && a.summary.includes('simulation'))).toBe(true);
  });
});

describe('a year in the industry', () => {
  it('reviews every studio, changes some seats with successors marked as SLATE\'s, and writes the year up in the trades', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'year-seed');
    sim.advanceTo(parseDateKey('2027-01-04', sim.homeZone, 12));
    const changed = Object.values(sim.universe.studios).filter((s) => s.leadershipChanges.length > 0);
    expect(changed.length).toBeGreaterThan(0);
    for (const state of changed) {
      for (const change of state.leadershipChanges) {
        expect(change.generated).toBe(true);
        const roster = liveLeadership(sim, 'studio', state.id);
        const seat = roster.find((l) => l.name === change.successor);
        expect(seat?.generated).toBe(true);
        expect(seat?.title).toBe(change.title);
      }
      expect(sim.universe.trade.some((t) => t.kind === 'leadership' && t.studioId === state.id)).toBe(true);
    }
    expect(sim.universe.trade.some((t) => t.kind === 'year')).toBe(true);
    expect(sim.universe.boxOffice.weekends.length).toBeGreaterThan(30);
    expect(sim.universe.boxOffice.weekends.length).toBeLessThanOrEqual(60);
    expect(marketShare(sim, 2026, 'us').length).toBeGreaterThan(5);
    // A Japanese studio's release is counted at home, not on the American chart.
    expect(marketShare(sim, 2026, 'jp').some((r) => r.studioId === 'toho' || r.studioId === 'toei' || r.studioId === 'shochiku')).toBe(true);
    expect(marketShare(sim, 2026, 'us').some((r) => r.studioId === 'toho')).toBe(false);
    expect(Object.values(sim.universe.studios).every((s) => s.news.length <= 60 && s.standingLog.length <= 40)).toBe(true);
    expect(sim.universe.trade.length).toBeLessThanOrEqual(160);
  });
});

describe('an older save', () => {
  it('gets the studios and their clocks without losing anything', () => {
    const { universe } = createUniverse(1, 'migrate-seed', defaultConfig());
    const record = universe as unknown as Record<string, unknown>;
    delete record['studios']; delete record['networks']; delete record['talentDeals']; delete record['boxOffice']; delete record['trade'];
    universe.meta.schemaVersion = 15;
    const projects = Object.keys(universe.projects).length;
    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(result.steps.some((s) => s.includes('studios and networks now act'))).toBe(true);
    expect(universe.studios).toEqual({});
    expect(universe.boxOffice.weekends).toEqual([]);
    const sim = loadSave(universe);
    expect(Object.keys(sim.universe.projects).length).toBe(projects);
    for (const kind of ['studio.weekend', 'studio.month', 'studio.year']) {
      expect(sim.universe.scheduled.filter((s) => s.kind === kind && s.status === 'pending'), kind).toHaveLength(1);
    }
    expect(sim.universe.scheduled.filter((s) => s.kind === 'studio.slate_release').length).toBeGreaterThan(100);
    // Loading twice does not double the clocks.
    const again = loadSave(sim.universe);
    expect(again.universe.scheduled.filter((s) => s.kind === 'studio.weekend' && s.status === 'pending')).toHaveLength(1);
  });
});

describe('asking the studio for more', () => {
  it('is one ask, decided on standing and the picture, and audited', () => {
    const sim = quickSave({ wealth: 'inherited' }, 'pa-seed');
    const made = sim.execute<{ projectId: Id }>({ kind: 'film.create_project', payload: { title: 'Long Weekend', format: 'feature', genres: ['thriller'], logline: 'A film.' } });
    const project = sim.universe.projects[made.value!.projectId]!;
    Object.assign(project, { phase: 'post', finalQuality: 78, budget: 20_000_000_00, studioId: 'universal', distributorName: 'Universal Pictures' });
    const refused = sim.execute({ kind: 'studio.request_pa', payload: { projectId: project.id } });
    expect(refused.error).toMatch(/Plan the campaign first/);
    const planned = sim.execute({ kind: 'rel.plan_campaign', payload: { projectId: project.id, budget: 5_000_000_00, positioning: 'A thriller', targetAudience: 'Adults', openingDate: addDays(sim.now, 60, sim.homeZone) } });
    expect(planned.ok, planned.error).toBe(true);
    adjustStanding(sim, 'studio', 'universal', 55, 'They like you.');
    const asked = sim.execute<{ granted: boolean; amount: number }>({ kind: 'studio.request_pa', payload: { projectId: project.id } });
    expect(asked.ok, asked.error).toBe(true);
    const campaign = Object.values(sim.universe.marketingCampaigns).find((c) => c.projectId === project.id)!;
    expect(campaign.studioPush?.granted).toBe(asked.value!.granted);
    if (asked.value!.granted) expect(campaign.budget).toBe(5_000_000_00 + asked.value!.amount);
    expect(sim.universe.audits.some((a) => a.kind === 'studio.pa_request')).toBe(true);
    const again = sim.execute({ kind: 'studio.request_pa', payload: { projectId: project.id } });
    expect(again.error).toMatch(/already asked/);
  });
});
