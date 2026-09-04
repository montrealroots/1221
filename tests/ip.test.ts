/**
 * Licensing real IP.
 *
 * A studio keeps a live crown jewel and licenses a resting library title; an
 * ask is one request answered in the studio's time; an offer's terms live in
 * the save and are charged once; a title from the franchise can be reused and
 * a title from anywhere else cannot; an offer lapses.
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Id } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';
import { addKnownTitles, addStudioCatalog, isStudioCatalogLoaded } from '@/engine/content/filmography';
import { STUDIOS } from '@/engine/content/studios';
import { franchiseOnRecord, licenceFee, licenceOdds, licenceRef, licenceStatus } from '@/engine/systems/ip';

const shipped = existsSync('public/industry/blumhouse.tsv') && existsSync('public/industry/lionsgate.tsv');
function load(id: string): void {
  if (!isStudioCatalogLoaded(id)) addStudioCatalog(id, readFileSync(`public/industry/${id}.tsv`, 'utf8'));
}
const PARANORMAL = 'Q2891967';
const HUNGER_GAMES = 'Q11885031';

function funds(sim: Simulation): number {
  return sim.ledger.availableFunds(sim.player.primaryAccountId!);
}

/** Asks until a seed produces an offer; the odds are high, so this is a few tries at most. */
function askUntilOffered(kind: 'remake' | 'sequel', title?: string): { sim: Simulation; ref: string } | undefined {
  for (const seed of ['ip-a', 'ip-b', 'ip-c', 'ip-d', 'ip-e', 'ip-f']) {
    const sim = quickSave({ wealth: 'inherited' }, seed);
    sim.player.reputation.professionalReputation = 85;
    sim.income(sim.player.primaryAccountId!, 5_000_000_00, 'Test Funds', 'other');
    const asked = sim.execute<{ respondsAt: number }>({ kind: 'film.request_ip_licence', payload: { studioId: 'blumhouse', franchiseQid: PARANORMAL, kind, format: 'feature', title } });
    if (!asked.ok) throw new Error(asked.error);
    sim.advanceTo(asked.value!.respondsAt + MS_DAY);
    if (licenceStatus(sim, 'blumhouse', PARANORMAL).state === 'offered') return { sim, ref: licenceRef('blumhouse', PARANORMAL) };
  }
  return undefined;
}

describe('licensing real IP', () => {
  it('keeps a live crown jewel and licenses a resting library title', () => {
    if (!shipped) { console.warn('public/industry catalogues are not built; licensing not exercised'); return; }
    load('blumhouse'); load('lionsgate');
    const sim = quickSave({ wealth: 'inherited' }, 'ip-odds');
    sim.player.reputation.professionalReputation = 75;
    const lionsgate = STUDIOS.get('lionsgate')!;
    const blumhouse = STUDIOS.get('blumhouse')!;
    const hungerGames = franchiseOnRecord(sim, 'lionsgate', HUNGER_GAMES)!;
    const paranormal = franchiseOnRecord(sim, 'blumhouse', PARANORMAL)!;
    expect(hungerGames.gross).toBeGreaterThan(2_000_000_000);
    expect(paranormal.titles.length).toBeGreaterThanOrEqual(2);

    const jewel = licenceOdds(sim, lionsgate, hungerGames, 'sequel', 'feature', sim.player.id, 'person');
    const library = licenceOdds(sim, blumhouse, paranormal, 'remake', 'feature', sim.player.id, 'person');
    expect(jewel.probability).toBeLessThan(0.12);
    expect(library.probability).toBeGreaterThan(0.5);
    expect(jewel.factors.some((f) => f.label === 'How Big It Is' && f.detail.includes('crown jewel'))).toBe(true);
    // Everything but the studio's own plans is something a producer can read.
    expect(jewel.factors.filter((f) => !f.knowable).map((f) => f.label)).toEqual(['Their Own Plans For It']);
    // A sequel to a giant costs far more than a remake of a resting title.
    expect(licenceFee(hungerGames, 'sequel', 0)).toBeGreaterThan(licenceFee(paranormal, 'remake', 5) * 10);
    expect(licenceFee(paranormal, 'remake', 5) % 10_000_00).toBe(0);
  });

  it('is one request, answered in the studio\'s time, and never asked twice at once', () => {
    if (!shipped) return;
    load('blumhouse');
    const sim = quickSave({ wealth: 'inherited' }, 'ip-ask');
    const before = funds(sim);
    const asked = sim.execute<{ respondsAt: number; fee: number }>({ kind: 'film.request_ip_licence', payload: { studioId: 'blumhouse', franchiseQid: PARANORMAL, kind: 'remake', format: 'feature' } });
    expect(asked.ok, asked.error).toBe(true);
    expect(asked.value!.respondsAt).toBeGreaterThan(sim.now + 13 * MS_DAY);
    expect(funds(sim)).toBe(before);
    expect(licenceStatus(sim, 'blumhouse', PARANORMAL).state).toBe('asked');
    const again = sim.execute({ kind: 'film.request_ip_licence', payload: { studioId: 'blumhouse', franchiseQid: PARANORMAL, kind: 'sequel', format: 'feature' } });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already asked/);
    const nowhere = sim.execute({ kind: 'film.request_ip_licence', payload: { studioId: 'blumhouse', franchiseQid: 'Q1', kind: 'remake', format: 'feature' } });
    expect(nowhere.error).toMatch(/no such franchise/);
    const short = sim.execute({ kind: 'film.request_ip_licence', payload: { studioId: 'blumhouse', franchiseQid: PARANORMAL, kind: 'remake', format: 'short' } });
    expect(short.error).toMatch(/feature, a series or a limited series/);
    sim.advanceTo(asked.value!.respondsAt + MS_DAY);
    expect(['offered', 'none']).toContain(licenceStatus(sim, 'blumhouse', PARANORMAL).state);
    expect(sim.universe.audits.some((a) => a.kind === 'ip.licence_decided')).toBe(true);
  });

  it('charges the offer on record once, reuses a franchise title, and refuses a title from anywhere else', () => {
    if (!shipped) return;
    load('blumhouse');
    addKnownTitles('Get Out\n');
    const stolen = quickSave({ wealth: 'inherited' }, 'ip-title');
    const refused = stolen.execute({ kind: 'film.request_ip_licence', payload: { studioId: 'blumhouse', franchiseQid: PARANORMAL, kind: 'remake', format: 'feature', title: 'Get Out' } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/already a film or series outside/);

    const offered = askUntilOffered('remake', 'Paranormal Activity');
    expect(offered, 'no seed produced an offer').toBeDefined();
    const { sim, ref } = offered!;
    const status = licenceStatus(sim, 'blumhouse', PARANORMAL);
    expect(status.fee).toBeGreaterThan(0);
    const before = funds(sim);

    // The caller's numbers do not matter; the offer's do.
    const taken = sim.execute<{ rightsId: Id; franchiseId: Id; projectId: Id; fee: number }>({ kind: 'film.accept_ip_licence', payload: { offerRef: ref, fee: 1 } });
    expect(taken.ok, taken.error).toBe(true);
    expect(taken.value!.fee).toBe(status.fee);
    expect(funds(sim)).toBe(before - status.fee!);

    const rights = sim.universe.rights[taken.value!.rightsId]!;
    expect(rights.acquisitionKind).toBe('license');
    expect(rights.sourceKind).toBe('remake');
    expect(rights.acquiredFrom).toBe('Blumhouse Productions');
    expect(rights.licensorStudioId).toBe('blumhouse');
    expect(rights.scope.sequelRights).toBe(false);
    const franchise = sim.universe.franchises[taken.value!.franchiseId]!;
    expect(franchise.studioId).toBe('blumhouse');
    expect(franchise.catalogueQid).toBe(PARANORMAL);
    expect(franchise.name).toBe('Paranormal Activity');
    expect(franchise.projectIds).toEqual([taken.value!.projectId]);
    const project = sim.universe.projects[taken.value!.projectId]!;
    expect(project.title).toBe('Paranormal Activity');
    expect(project.franchiseId).toBe(franchise.id);
    expect(project.studioId).toBe('blumhouse');
    expect(project.distributorName).toBe('Blumhouse Productions');
    expect(project.rightsId).toBe(rights.id);
    expect(project.phase).toBe('rights');
    expect(licenceStatus(sim, 'blumhouse', PARANORMAL)).toEqual({ state: 'licensed', franchiseId: franchise.id });

    // Taking it again changes nothing.
    const twice = sim.execute({ kind: 'film.accept_ip_licence', payload: { offerRef: ref } });
    expect(twice.ok).toBe(false);
    expect(twice.error).toMatch(/no offer standing/);
    expect(funds(sim)).toBe(before - status.fee!);
    expect(Object.values(sim.universe.franchises).filter((f) => f.catalogueQid === PARANORMAL)).toHaveLength(1);
    expect(Object.values(sim.universe.projects).filter((p) => p.title === 'Paranormal Activity')).toHaveLength(1);
    expect(Object.values(sim.universe.decisions).filter((d) => d.refType === 'ip' && !d.resolvedAt)).toHaveLength(0);
  });

  it('lets an offer lapse after three weeks', () => {
    if (!shipped) return;
    load('blumhouse');
    const offered = askUntilOffered('remake');
    expect(offered, 'no seed produced an offer').toBeDefined();
    const { sim, ref } = offered!;
    sim.advanceTo(sim.now + 23 * MS_DAY);
    expect(licenceStatus(sim, 'blumhouse', PARANORMAL).state).toBe('none');
    const late = sim.execute({ kind: 'film.accept_ip_licence', payload: { offerRef: ref } });
    expect(late.ok).toBe(false);
    expect(sim.universe.notifications.some((n) => n.title === 'A licence offer lapsed')).toBe(true);
  });
});
