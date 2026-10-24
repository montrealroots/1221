/**
 * The career's played-journey helpers for brief 25's tests, moved here from tests/career-world-sydney.test.ts on
 * 2026-10-23 so the drawn parts' journey (tests/career-drawn.test.ts) plays the same way. TEST SETUP where said: the body
 * tended as the clock moves, a graduate made through the School's own Commencement handler, a skilled actor's levels set
 * as years of work would leave them; the rest is the clock and the commands a player sends.
 */
import { expect } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { answerStop } from '@/engine/world/clock';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { COMMENCEMENT_KIND, EVALUATION_KIND, evenCraft } from '@/engine/systems/school';
import { attributesOf } from '@/engine/systems/attributes';
import { genreState } from '@/engine/systems/engagement';
import { PROJECTS } from '@/engine/content/careerwork';
import { BRIEFS } from '@/engine/content/briefs';
import type { Opportunity } from '@/engine/systems/pro';
import { roundToCome, tapeRefusal } from '@/engine/systems/projobs';
import { passportOf } from '@/engine/systems/documents';

export const zone = 'America/New_York';
export const SYD = 'Australia/Sydney';
export const at = (year: number, month: number, day: number, hour = 9, minute = 0, z = zone) => instantFromZoned({ year, month, day, hour, minute }, z);
export const student = (seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });
export const tend = (sim: Simulation) => {
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
};
/** TEST SETUP: rested, fed and awake each time the clock moves, six hours at a time. */
export const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) { tend(sim); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); }
};
/** Played as a player plays it from the top bar: stopping at every commitment that wants the player, and Go pressed. TEST SETUP: tended as it moves. */
export const played = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    tend(sim);
    const wanted = Math.min(until, sim.now + 6 * MS_HOUR);
    let r = sim.advanceTo(wanted, { stopOnPlayerRequired: true });
    for (let n = 0; r.interruptedBy && n < 50; n += 1) { tend(sim); r = answerStop(sim, { item: r.interruptedBy, wanted, sentFrom: r.sentFrom }, 'go').result!; }
  }
};
export const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
export const notices = (sim: Simulation, from = 0) => sim.universe.notifications.filter((n) => n.category === 'career' && n.at >= from).map((n) => `${n.title} | ${n.body}`);

/** TEST SETUP: a graduate of the class of 2029, by the School's own evaluation and Commencement, as tests/pro-work.test.ts makes one. */
export function graduate(seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) {
  const sim = student(seed, more);
  tended(sim, at(2026, 9, 1, 18));
  const school = sim.player.school!;
  Object.assign(school, { termsBegun: 6, enrolled: [0, 1, 2, 3, 4, 5], standing: 'good' });
  school.courses = { '5:DRAM 393b': { term: 5, code: 'DRAM 393b', name: 'Acting VI', meetings: 20, attended: 20, excused: 0 } } as never;
  sim.schedule({ at: sim.now + 60_000, kind: EVALUATION_KIND, label: 'Spring Term 2029 Evaluation', category: 'school', priority: 32, requiresPlayer: false, payload: { personId: sim.player.id, term: 5 } });
  sim.advanceTo(sim.now + 2 * 60_000);
  const booked = sim.universe.scheduled.filter((i) => i.kind === COMMENCEMENT_KIND && i.status === 'pending');
  sim.timeline.cancel(booked[0]!.id, sim.now);
  sim.schedule({ at: at(2026, 9, 3, 10), kind: COMMENCEMENT_KIND, label: 'Commencement', category: 'school', priority: 32, durationMinutes: 180, payload: booked[0]!.payload });
  tended(sim, at(2026, 9, 3, 13));
  expect(sim.player.school!.standing).toBe('graduated');
  return sim;
}

/** TEST SETUP: a skilled actor's levels, as years of work would leave them. */
export function skilled(sim: Simulation): void {
  sim.player.craft = evenCraft(92);
  const attrs = attributesOf(sim, sim.player) as unknown as Record<string, number>;
  for (const k of Object.keys(attrs)) if (typeof attrs[k] === 'number') attrs[k] = 95;
  for (const t of PROJECTS) for (const g of t.genres) genreState(sim.player, g).familiarity = 95;
}

/**
 * A passport, by Papers' own command, where the life began without one (most of the game's American lives do, by the
 * share that hold one), and the clock on until it's issued.
 */
export function passport(sim: Simulation): void {
  if (passportOf(sim.player, sim.now + 400 * MS_DAY)) return;
  const r = sim.execute({ kind: 'documents.apply_passport', payload: {} });
  expect(r.error).toBeUndefined();
  played(sim, (r.value as { readyAt: number }).readyAt + MS_HOUR);
  expect(passportOf(sim.player, sim.now)).toBeDefined();
}

/** Headshots, a résumé and a reel, by the Portfolio tab's and the Player Profile's commands, on a free morning. */
export function portfolio(sim: Simulation): void {
  let ten = at(zonedParts(sim.now, zone).year, zonedParts(sim.now, zone).month, zonedParts(sim.now, zone).day, 10);
  if (ten <= sim.now) ten += MS_DAY;
  played(sim, ten);
  sim.must({ kind: 'pro.headshots', payload: {} });
  played(sim, sim.now + 15 * 60_000);
  sim.must({ kind: 'pro.update_resume', payload: {} });
  const brief = BRIEFS.find((b) => b.medium === 'camera')!;
  sim.must({ kind: 'brief.choose', payload: { brief: brief.id, reading: brief.readings[0]!.id } });
  sim.must({ kind: 'practice.self_tape', payload: { genre: brief.kinds[0], brief: brief.id } });
  sim.must({ kind: 'pro.cut_reel', payload: { pieces: [`tape:${brief.id}:${sim.player.briefs![brief.id]!.takes[0]!.at}`] } });
}


/** The sides prepared, each step pressed until it can do no more, the time between tended. */
export function prepareAll(sim: Simulation, target: { opportunityId: string } | { engagementId: string }): void {
  for (let n = 0; n < 24; n += 1) {
    let any = false;
    for (const step of ['read', 'lines', 'rehearse']) {
      if (sim.execute({ kind: 'pro.prepare', payload: { ...target, step } }).ok) any = true;
      played(sim, sim.now + 30 * 60_000);
    }
    if (!any) break;
  }
}

/** A round on tape: the sides prepared, taped at the first free hour before it's due, then the clock on to casting's word. */
export function playRound(sim: Simulation, o: Opportunity): void {
  prepareAll(sim, { opportunityId: o.id });
  const r = roundToCome(o)!;
  for (let n = 0; n < 48 && tapeRefusal(sim, sim.player, o) && sim.now < r.at - 2 * MS_HOUR; n += 1) played(sim, sim.now + MS_HOUR);
  expect(sim.execute({ kind: 'pro.tape_audition', payload: { opportunityId: o.id } }).error).toBeUndefined();
  const rounds = o.rounds!.length;
  for (let k = 0; k < 20 && (o.status === 'audition' || o.status === 'callback') && o.rounds!.length === rounds; k += 1) played(sim, sim.now + MS_DAY);
}
