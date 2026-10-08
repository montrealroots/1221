/**
 * Representation and a production's schedule together, through the commands
 * a player has (from 2026-10-08): an approach answered and met, an offer
 * signed and the move made, then a job booked under the old agency postponed
 * after the new one begins, worked and paid with the old agency's commission;
 * a trip of the player's own in the way of a change; a job in another town
 * whose lodging moves with it before anything's paid; and a notice the
 * production withdraws when something now stands in its way. What isn't a
 * command is marked SETUP.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { STAY_KIND, beginCareer, careerOf, represent, workDays, type Booking } from '@/engine/systems/career';
import { answerOf, approachesOf, offersAfterMeeting } from '@/engine/systems/representation';
import { SCHEDULE_KIND, proposalsFor, type ChangeKind } from '@/engine/systems/rescheduling';
import { productionOf } from '@/engine/systems/companies';
import { railRoutes } from '@/engine/systems/rail';
import { planBy } from '@/engine/systems/journey';
import { evenCraft } from '@/engine/systems/school';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** SETUP: a graduate in New York with headshots, signed with an agency. */
function actor(seed: string, agencyId: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  sim.player.school!.standing = 'graduated';
  sim.player.craft = evenCraft(88);
  beginCareer(sim, sim.player);
  sim.player.currentLocationId = 'us-ny-newyork';
  careerOf(sim.player).headshotsAt = sim.now;
  represent(sim, sim.player, { agencyId, cityId: 'us-ny-newyork', until: sim.now });
  return sim;
}
/** SETUP: the body kept going, up before each call. */
function live(sim: Simulation, until: number, id?: string): void {
  for (;;) {
    const next = id ? sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.status === 'pending' && x.payload.bookingId === id && x.at < until).sort((a, b) => a.at - b.at)[0] : undefined;
    const to = next ? next.at - 60_000 : until;
    while (sim.now < to) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR)); }
    if (!next) return;
    sim.player.awakeSince = sim.now;
    sim.advanceTo(next.at + 60_000);
  }
}
/** A job offered (SETUP: as an audition would bring it, under the agency of the day) and taken by the command, the production's own draw of a change taken off. */
function take(sim: Simulation, id: string, starts: number, cityId: 'us-ny-newyork' | 'us-ca-losangeles' = 'us-ny-newyork'): Booking {
  const c = careerOf(sim.player);
  c.bookings.push({ id, roleId: 'costar', cityId, starts, units: 2, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, agentId: c.agencyId ?? null });
  sim.must({ kind: 'career.accept', payload: { bookingId: id } });
  for (const x of sim.universe.scheduled) if (x.kind === SCHEDULE_KIND && x.status === 'pending') sim.timeline.cancel(x.id, sim.now);
  return c.bookings.find((b) => b.id === id)!;
}
/** SETUP: the production's decision, as its draw would make it. */
function decide(sim: Simulation, bookingId: string, change: ChangeKind, x = 0.2): void {
  sim.schedule({ at: sim.now + 60_000, kind: SCHEDULE_KIND, label: 'A Schedule Change', category: 'system', priority: 20, payload: { personId: sim.player.id, bookingId, change, x } });
  sim.advanceTo(sim.now + 2 * 60_000);
}

describe('a move between agencies, and a job that moves after it', () => {
  it('booked under Gersh, moved to CAA, then postponed: worked on the new dates, Gersh’s to commission, once', () => {
    // A seed whose approach to CAA meets and offers (the draws are the decider's).
    let sim: Simulation | undefined;
    for (let n = 0; n < 200 && !sim; n += 1) {
      const s = actor(`ja-${n}`, 'gersh');
      const a = { id: `ap${careerOf(s.player).seq + 1}`, agencyId: 'caa', via: 'submission' as const };
      if (answerOf(s, s.player, a) === 'meeting' && offersAfterMeeting(s, s.player, a)) sim = s;
    }
    expect(sim).toBeDefined();
    let s = sim!;
    // SETUP: a renewal, little work in the last 91 days: free to leave.
    careerOf(s.player).initialTerm = false;
    careerOf(s.player).signedAt = s.now - 500 * MS_DAY;
    s.must({ kind: 'career.approach_agency', payload: { agencyId: 'caa' } });
    const job = take(s, 'g1', s.now + 70 * MS_DAY);
    expect(job.agentId).toBe('gersh');
    s = reload(s);
    live(s, approachesOf(s.player)[0]!.answerAt + MS_HOUR);
    live(s, approachesOf(s.player)[0]!.meetingAt! + 2 * MS_HOUR);
    s = reload(s);
    s.must({ kind: 'career.sign', payload: { agencyId: 'caa', cityId: 'us-ny-newyork' } });
    expect(careerOf(s.player).agencyId).toBe('caa');
    const b = careerOf(s.player).bookings.find((x) => x.id === 'g1')!;
    expect([b.status, b.agentId]).toEqual(['accepted', 'gersh']);
    decide(s, 'g1', 'postpone', 0.8);
    const pr = proposalsFor(s.player, 'g1')[0]!;
    s = reload(s);
    s.must({ kind: 'career.answer_schedule', payload: { bookingId: 'g1', proposalId: pr.id, accept: true } });
    live(s, pr.to.at(-1)!.at + 14 * MS_DAY, 'g1');
    const done = careerOf(s.player).bookings.find((x) => x.id === 'g1')!;
    expect([done.status, done.worked, done.owed, done.agentId]).toEqual(['worked', 2, 0, 'gersh']);
    const commission = s.nominalAccount('expense', 'Agent Commission').id;
    const checks = s.universe.transactions.filter((t) => t.category === 'salary' && t.memo.startsWith('Co-Star'));
    expect(checks.length).toBeGreaterThan(0);
    const gross = -checks.flatMap((t) => t.postings).filter((p) => p.accountId === s.nominalAccount('income', 'Acting').id).reduce((n, p) => n + p.amount, 0);
    const taken = checks.flatMap((t) => t.postings).filter((p) => p.accountId === commission).reduce((n, p) => n + p.amount, 0);
    // One agency's commission, at most ten percent of the work, one posting a check: never two agencies'.
    expect(taken).toBeGreaterThan(0);
    expect(taken).toBeLessThanOrEqual(Math.ceil(gross * 0.1));
    expect(checks.map((t) => t.postings.filter((p) => p.accountId === commission).length)).toEqual(checks.map(() => 1));
    expect(breaches(s.universe)).toEqual([]);
  });
});

describe('the player’s own plans in the way', () => {
  it('a trip of their own elsewhere on a new date refuses the change until it’s dealt with', () => {
    const sim = actor('ja-trip', 'gersh');
    const b = take(sim, 't1', at(2026, 10, 19, 8));
    decide(sim, 't1', 'postpone', 0.2);
    const pr = proposalsFor(sim.player, 't1')[0]!;
    // A weekend in New Haven, booked by train, there on the new first call's day.
    const day = pr.to[0]!.at - 2 * MS_DAY;
    const route = railRoutes('us-ny-newyork', 'us-ct-newhaven')[0]!;
    const slot = Array.from({ length: route.perDay }, (_, i) => i).find((i) => { const legs = planBy(sim, route.id, 'us-ny-newyork', 'us-ct-newhaven', day, i, 0); return typeof legs !== 'string' && legs[0]!.departAt > day + 9 * MS_HOUR; })!;
    sim.must({ kind: 'travel.book', payload: { toCity: 'us-ct-newhaven', day: day - (day % MS_DAY), by: route.id, slot, nights: 4 } });
    const err = sim.execute({ kind: 'career.answer_schedule', payload: { bookingId: 't1', proposalId: pr.id, accept: true } }).error!;
    expect(err).toMatch(/Your journey: you’ll be in New Haven on /);
    // Refused instead: released, paid as a cancellation; the trip untouched.
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 't1', proposalId: pr.id, accept: false } });
    expect(b.status).toBe('released');
    expect(sim.player.journeys!.some((j) => j.toCity === 'us-ct-newhaven' && j.status === 'booked')).toBe(true);
  });

  it('a call-time notice the production withdraws, keeping the old time, when something of theirs now clashes', () => {
    const sim = actor('ja-withdraw', 'gersh');
    const b = take(sim, 'w1', at(2026, 10, 19, 8));
    const second = workDays(b)[1]!.at;
    decide(sim, 'w1', 'call_time', 0.5);
    const pr = proposalsFor(sim.player, 'w1')[0]!;
    expect(pr.mustRespond).toBe(false);
    // SETUP: a meeting with an agency in the hours the moved call would take.
    sim.schedule({ at: second - 2 * MS_HOUR, kind: 'career.agency_meeting', label: 'Meeting CAA', category: 'career', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id, approachId: 'none' } });
    live(sim, pr.dueAt + MS_HOUR);
    expect(pr.status).toBe('withdrawn');
    expect(workDays(b)[1]!.at).toBe(second);
    expect(productionOf(sim.player, 'w1')!.history.some((h) => h.what.startsWith('The production kept the old time: It clashes with Meeting CAA'))).toBe(true);
  });
});

describe('a job in another town', () => {
  it('postponed before the trip: the trip there and home moved with it, nothing paid for it yet', () => {
    const sim = actor('ja-la', 'gersh');
    const b = take(sim, 'l1', at(2026, 10, 26, 8), 'us-ca-losangeles');
    const stays = () => sim.universe.scheduled.filter((x) => x.kind === STAY_KIND && x.status === 'pending' && x.payload.bookingId === 'l1').map((x) => [x.payload.direction, x.at] as const);
    const before = stays();
    expect(before.length).toBe(2);
    const spent = sim.universe.transactions.length;
    decide(sim, 'l1', 'postpone', 0.2);
    const pr = proposalsFor(sim.player, 'l1')[0]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'l1', proposalId: pr.id, accept: true } });
    const delta = pr.to[0]!.at - workDays({ ...b, calls: undefined } as Booking)[0]!.at;
    const after = stays();
    expect(after.find(([d]) => d === 'out')![1]).toBe(before.find(([d]) => d === 'out')![1] + delta);
    expect(after.find(([d]) => d === 'back')![1]).toBe(pr.to.at(-1)!.at + MS_DAY);
    // Accepting spent nothing.
    expect(sim.universe.transactions.length).toBe(spent);
  });
});

describe('staying, withdrawing and asking', () => {
  it('an approach withdrawn, an offer declined to stay, a call asked to move: each recorded, the agency kept', () => {
    let sim: Simulation | undefined;
    for (let n = 0; n < 200 && !sim; n += 1) {
      const s = actor(`js-stay-${n}`, 'gersh');
      const a = { id: `ap${careerOf(s.player).seq + 2}`, agencyId: 'wme', via: 'submission' as const };
      if (answerOf(s, s.player, a) === 'meeting' && offersAfterMeeting(s, s.player, a)) sim = s;
    }
    sim = sim!;
    sim.must({ kind: 'career.approach_agency', payload: { agencyId: 'uta' } });
    sim.must({ kind: 'career.withdraw_approach', payload: { agencyId: 'uta' } });
    sim.must({ kind: 'career.approach_agency', payload: { agencyId: 'wme' } });
    const wme = approachesOf(sim.player).find((a) => a.agencyId === 'wme')!;
    live(sim, wme.answerAt + MS_HOUR);
    live(sim, wme.meetingAt! + 2 * MS_HOUR);
    sim = reload(sim);
    sim.must({ kind: 'career.decline_agency', payload: { agencyId: 'wme' } });
    expect(careerOf(sim.player).agencyId).toBe('gersh');
    expect(approachesOf(sim.player).map((a) => [a.agencyId, a.status])).toEqual([['uta', 'withdrawn'], ['wme', 'declined']]);
    const job = take(sim, 'q1', sim.now + 20 * MS_DAY);
    sim.must({ kind: 'career.request_schedule', payload: { bookingId: 'q1', callAt: workDays(job)[0]!.at } });
    live(sim, sim.now + MS_DAY + MS_HOUR);
    expect(workDays(job)).toHaveLength(2);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
