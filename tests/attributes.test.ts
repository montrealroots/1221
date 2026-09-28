/**
 * The attributes (`systems/attributes.ts`): presence, composure, reputation
 * and recognition, each drawn or earned as the business has it, and each
 * read by an outcome.
 */

import { describe, expect, it } from 'vitest';
import { createSave, loadSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { ROLES } from '@/engine/content/career';
import { ATTRIBUTES, earn, fadeRecognition, nerves, overscaleOf, presenceSwing, sendsFactor } from '@/engine/systems/attributes';
import { beginCareer, bookingChance, careerOf, offersFor, recognitionFrom, roleById, unitRate, weekOfAuditions, rateOf } from '@/engine/systems/career';
import { evaluate } from '@/engine/systems/school';
import type { Craft } from '@/engine/systems/school';

const craft = (level: number): Craft => ({ acting: level, voice: level, speech: level, body: level, text: level, singing: level, screen: level });
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
function pro(seed: string): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = craft(75);
  beginCareer(sim, sim.player);
  return sim;
}

describe('drawn at the start of a life', () => {
  it('gives the faculty’s first choice a presence of 55 to 80, a composure by their stability, and no name yet', () => {
    const presences: number[] = [];
    for (let n = 0; n < 20; n += 1) {
      const sim = life(`attr-draw-${n}`);
      const a = sim.player.attrs!;
      presences.push(a.presence);
      expect(a.presence).toBeGreaterThanOrEqual(55);
      expect(a.presence).toBeLessThanOrEqual(80);
      expect(a.composure).toBeCloseTo(ATTRIBUTES.composureStart.base + ATTRIBUTES.composureStart.perStability * sim.player.personality.emotionalStability, 0);
      expect(a.reputation).toBe(0);
      expect(a.recognition).toBe(0);
    }
    // Two lives, two draws; the same life, the same draw.
    expect(new Set(presences).size).toBeGreaterThan(10);
    expect(life('attr-draw-3').player.attrs!.presence).toBe(presences[3]);
  });

  it('draws them for a save from before them when it opens', () => {
    const sim = life('attr-old');
    const before = sim.player.attrs!;
    delete sim.player.attrs;
    const opened = loadSave(JSON.parse(JSON.stringify(sim.universe)));
    expect(opened.player.attrs).toEqual(before);
  });
});

describe('composure', () => {
  it('puts nerves before an event: stress by how little composure there is, the work taken down, and composure grown by it', () => {
    const sim = life('attr-nerves');
    const p = sim.player;
    p.wellbeing.stress = 0;
    p.attrs!.composure = 20;
    const kept = nerves(sim, p, 'audition');
    expect(kept).toBeCloseTo(1 - ATTRIBUTES.nerves.focusCost * 0.8, 10);
    const shaky = p.wellbeing.stress;
    expect(shaky).toBeGreaterThan(0);
    expect(p.attrs!.composure).toBeCloseTo(20 + 80 * ATTRIBUTES.composureGain.audition, 10);
    p.wellbeing.stress = 0;
    p.attrs!.composure = 90;
    expect(nerves(sim, p, 'audition')).toBeGreaterThan(kept);
    expect(p.wellbeing.stress).toBeLessThan(shaky);
    // A showcase weighs more than an audition.
    p.wellbeing.stress = 0;
    p.attrs!.composure = 20;
    nerves(sim, p, 'showcase');
    expect(p.wellbeing.stress).toBeGreaterThan(shaky);
  });

  it('keeps stress off zero for a student through a term of performing', () => {
    const sim = life('attr-term');
    sim.player.wellbeing.stress = 0;
    for (let n = 0; n < 5; n += 1) nerves(sim, sim.player, 'performance');
    expect(sim.player.wellbeing.stress).toBeGreaterThan(0);
  });
});

describe('at school', () => {
  it('puts nerves before a performance, and gives a Yale Rep night to the reputation', () => {
    const sim = life('attr-school-show');
    const p = sim.player;
    p.school!.casting = { production: 'A Test Play', role: 'A Part In A New Play', kind: 'carlotta', term: 0, performed: 0 };
    p.school!.rep = { production: 'The Seagull', role: 'Konstantin', kind: 'role', term: 0, performed: 0 };
    p.awakeSince = sim.now - 60_000;
    p.wellbeing.stress = 0;
    const composure = p.attrs!.composure;
    sim.schedule({ at: sim.now + 60_000, kind: 'school.call', label: 'A Test Play: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 150, payload: { personId: p.id, call: 'performance' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(p.school!.casting!.performed).toBe(1);
    expect(p.wellbeing.stress).toBeGreaterThan(0);
    expect(p.attrs!.composure).toBeGreaterThan(composure);
    expect(p.attrs!.reputation).toBe(0);
    sim.schedule({ at: sim.now + 60_000, kind: 'school.call', label: 'The Seagull: Performance', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 180, payload: { personId: p.id, call: 'performance', which: 'rep' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    expect(p.attrs!.reputation).toBe(ATTRIBUTES.reputation.repPerformance);
  });
});

describe('presence', () => {
  it('moves an audition’s read above or below the bar, fully in the room and half on tape', () => {
    const role = ROLES.find((r) => r.id === 'costar')!;
    const low = bookingChance(craft(role.bar), role, 1, 'room', true, false, 30);
    const mid = bookingChance(craft(role.bar), role, 1, 'room', true, false, 50);
    const high = bookingChance(craft(role.bar), role, 1, 'room', true, false, 80);
    expect(low).toBeLessThan(mid);
    expect(high).toBeGreaterThan(mid);
    expect(presenceSwing(80, 'tape')).toBeCloseTo(presenceSwing(80, 'room') / 2, 10);
    expect(presenceSwing(50, 'room')).toBe(0);
  });
});

describe('reputation', () => {
  it('is earned less the nearer the top, and lost in points', () => {
    const sim = pro('attr-earn');
    earn(sim, sim.player, 10);
    expect(sim.player.attrs!.reputation).toBe(10);
    earn(sim, sim.player, 10);
    expect(sim.player.attrs!.reputation).toBe(19);
    earn(sim, sim.player, -25);
    expect(sim.player.attrs!.reputation).toBe(0);
  });

  it('calls an actor in more the better known to the offices', () => {
    expect(sendsFactor(0)).toBe(ATTRIBUTES.reputationSends.at0);
    expect(sendsFactor(100)).toBe(ATTRIBUTES.reputationSends.at100);
    const count = (reputation: number) => {
      const sim = pro('attr-sends');
      sim.player.attrs!.reputation = reputation;
      careerOf(sim.player).sites = { 'casting-networks': { until: sim.now + 5_000 * MS_DAY, renews: true } };
      let n = 0;
      for (let w = 0; w < 200; w += 1) n += weekOfAuditions(sim, sim.player, sim.now + w * 7 * MS_DAY, undefined, 'us-ny-newyork', 5).length;
      return n;
    };
    expect(count(100)).toBeGreaterThan(count(0) * 1.3);
  });

  it('reads beside a showing: an agency whose bar the showing misses takes a known name', () => {
    const sim = pro('attr-offers');
    const seen = (reputation: number) => {
      sim.player.attrs!.reputation = reputation;
      let n = 0;
      for (let k = 0; k < 40; k += 1) n += offersFor(sim, sim.player, 58, `k${k}`).length;
      return n;
    };
    expect(seen(0)).toBe(0);
    expect(seen(100)).toBeGreaterThan(0);
  });

  it('is given by the degree, and taken by a dismissal', () => {
    const grad = life('attr-degree');
    grad.player.school!.standing = 'good';
    const p = grad.player;
    for (const term of [0, 1, 2, 3, 4, 5]) { Object.assign(p.school!.tally, { classDays: 10, attended: 10, excused: 0, calls: 0, answered: 0, shifts: 0, worked: 0 }); p.school!.tally.craftAtStart = { ...p.craft!, acting: p.craft!.acting - 20 }; evaluate(grad, p, term); }
    expect(p.school!.standing).toBe('good');
    // Commencement, brought to now: the degree is on the record.
    const commencement = grad.universe.scheduled.find((i) => i.kind === 'school.commencement' && i.status === 'pending')!;
    grad.timeline.reschedule(commencement.id, grad.now + 60_000);
    grad.advanceTo(grad.now + 2 * 60_000);
    expect(p.school!.standing).toBe('graduated');
    expect(p.attrs!.reputation).toBe(ATTRIBUTES.reputation.degree);
    const out = life('attr-out');
    const q = out.player;
    q.attrs!.reputation = 20;
    for (const term of [0, 1, 2]) { Object.assign(q.school!.tally, { classDays: 20, attended: 10, excused: 0 }); evaluate(out, q, term); }
    expect(q.school!.standing).toBe('dismissed');
    expect(q.attrs!.reputation).toBe(20 + ATTRIBUTES.reputation.dismissed);
  });
});

describe('recognition', () => {
  it('comes from screen work by its reach, and Broadway, and nothing from a regional stage', () => {
    expect(recognitionFrom(roleById('series-hour'))).toBe(ATTRIBUTES.recognition.series);
    expect(recognitionFrom(roleById('recurring'))).toBe(ATTRIBUTES.recognition.arc);
    expect(recognitionFrom(roleById('guest-hour'))).toBe(ATTRIBUTES.recognition.guest);
    expect(recognitionFrom(roleById('film-weekly'))).toBe(ATTRIBUTES.recognition.studioFilm);
    expect(recognitionFrom(roleById('film-low'))).toBe(ATTRIBUTES.recognition.film);
    expect(recognitionFrom(roleById('broadway'))).toBe(ATTRIBUTES.recognition.broadway);
    expect(recognitionFrom(roleById('lort-b'))).toBe(0);
  });

  it('fades each month without new work', () => {
    const sim = pro('attr-fade');
    sim.player.attrs!.recognition = 50;
    fadeRecognition(sim, sim.player);
    expect(sim.player.attrs!.recognition).toBeCloseTo(50 * (1 - ATTRIBUTES.recognition.fadePerMonth), 2);
  });

  it('pays a known name above scale, and quotes it on the offer', () => {
    expect(overscaleOf(0)).toBe(1);
    expect(overscaleOf(ATTRIBUTES.overscale.from)).toBe(1);
    expect(overscaleOf(100)).toBe(1 + ATTRIBUTES.overscale.most);
    const sim = pro('attr-quote');
    sim.player.attrs!.recognition = 60;
    const career = careerOf(sim.player);
    career.auditions.push({ id: 'aud-q', roleId: 'costar', at: sim.now, mode: 'room', cityId: 'us-ny-newyork', status: 'booked' });
    sim.schedule({ at: sim.now + 60_000, kind: 'career.offer', label: 'An Offer', category: 'system', priority: 20, payload: { personId: sim.player.id, auditionId: 'aud-q' } });
    sim.advanceTo(sim.now + 2 * 60_000);
    const booking = career.bookings.find((b) => b.status === 'offered')!;
    const scale = rateOf(roleById('costar'), booking.starts, 'us-ny-newyork', 'USD');
    expect(unitRate(booking, booking.starts, 'USD')).toBe(Math.round(scale * overscaleOf(60)));
  });
});
