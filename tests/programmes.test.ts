/**
 * A program watched at home (`systems/programmes.ts`, from 2026-10-03):
 * the market's own, on a service paid for or a broadcaster where the law's
 * license allows, its real episodes' minutes, and resumed where it was left.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { PROGRAMMES } from '@/engine/content/programmes';
import { SERVICES } from '@/engine/content/homelife';
import { episodeLeft, placeIn, programmeById, programmesHere, watchOn } from '@/engine/systems/programmes';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
type Watched = { watched: number; season: number; episode: number; minute: number; finished: boolean };

describe('a program', () => {
  it('is watched on a service paid for, an episode at its own minutes, and resumed where it was left', () => {
    const sim = life('us-ny-newyork', 'prog-ny');
    const reacher = programmeById('us-reacher')!;
    expect(programmesHere(sim.player).some((p) => p.market !== 'us')).toBe(false);
    expect(sim.execute({ kind: 'tv.watch', payload: { programmeId: reacher.id } }).error).toBe('It’s on Prime Video: you don’t subscribe to it.');
    sim.must({ kind: 'home.subscribe', payload: { id: SERVICES.find((s) => s.market === 'us' && s.service === 'Amazon Prime')!.id } });
    sim.player.wellbeing.stress = 60;
    const t0 = sim.now;
    const a = sim.must<Watched>({ kind: 'tv.watch', payload: { programmeId: reacher.id } });
    // Reacher's first season: 8 episodes, a median of 49 minutes.
    expect(reacher.seasons[0]).toEqual([8, 49]);
    expect(a).toEqual({ watched: 49, season: 0, episode: 1, minute: 0, finished: false });
    expect(sim.now - t0).toBe(49 * 60_000);
    expect(sim.player.wellbeing.stress).toBeLessThan(60);
    // An hour stops partway into the next, and picks up there.
    const b = sim.must<Watched>({ kind: 'tv.watch', payload: { programmeId: reacher.id, to: 'hour' } });
    expect(b).toMatchObject({ watched: 60, episode: 2, minute: 11 });
    expect(episodeLeft(reacher, placeIn(sim.player, reacher))).toBe(38);
    expect(sim.must<Watched>({ kind: 'tv.watch', payload: { programmeId: reacher.id } }).watched).toBe(38);
    // An episode unwinds by its share of the hour.
    sim.player.wellbeing.stress = 60;
    sim.must({ kind: 'tv.watch', payload: { programmeId: reacher.id, to: 'hour' } });
    const hour = 60 - sim.player.wellbeing.stress;
    sim.player.wellbeing.stress = 60;
    sim.must({ kind: 'tv.watch', payload: { programmeId: reacher.id } });
    const part = 60 - sim.player.wellbeing.stress;
    expect(part / hour).toBeLessThan(0.9);
    expect(part / hour).toBeGreaterThan(0.1);
    // Run out, it's done.
    const last = reacher.seasons.length - 1;
    sim.player.watching![reacher.id] = { season: last, episode: reacher.seasons[last]![0] - 1, minute: reacher.seasons[last]![1] - 1, at: sim.now };
    expect(sim.must<Watched>({ kind: 'tv.watch', payload: { programmeId: reacher.id } })).toMatchObject({ watched: 1, finished: true });
    expect(sim.execute({ kind: 'tv.watch', payload: { programmeId: reacher.id } }).error).toBe('You’ve watched all of Reacher.');
  });

  it('runs into the next season and ends', () => {
    const p = programmeById('us-reacher')!;
    expect(watchOn(p, { season: 0, episode: 7, minute: 40 }, 20)).toEqual({ to: { season: 1, episode: 0, minute: 11 }, watched: 20 });
    const last = p.seasons.length - 1;
    expect(watchOn(p, { season: last, episode: 7, minute: 40 }, 60)).toEqual({ to: { season: last + 1, episode: 0, minute: 0 }, watched: p.seasons[last]![1] - 40 });
  });

  it('on a British broadcaster needs the TV license, and starts at its latest series', () => {
    const sim = life('uk-eng-london', 'prog-uk');
    const traitors = programmeById('uk-the-traitors')!;
    expect(traitors.broadcast).toBe(true);
    expect(placeIn(sim.player, traitors).season).toBe(traitors.seasons.length - 1);
    expect(sim.execute({ kind: 'tv.watch', payload: { programmeId: traitors.id } }).error).toBe('You need a TV license for that.');
    sim.must({ kind: 'home.tv_licence', payload: {} });
    expect(sim.must<Watched>({ kind: 'tv.watch', payload: { programmeId: traitors.id } }).watched).toBe(traitors.seasons[traitors.seasons.length - 1]![1]);
    expect(sim.execute({ kind: 'tv.watch', payload: { programmeId: 'us-reacher' } }).error).toBe('That isn’t shown where you live.');
  });

  it('carries every market’s, each with a way to watch it', () => {
    for (const m of ['us', 'uk', 'ie', 'ca', 'mx']) expect(PROGRAMMES.filter((p) => p.market === m).length).toBeGreaterThan(5);
    expect(PROGRAMMES.every((p) => p.ways.length > 0 && p.seasons.every(([e, m]) => e > 0 && m > 0))).toBe(true);
  });
});
