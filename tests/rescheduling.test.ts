/**
 * A production's schedule changed after casting (`systems/rescheduling.ts`,
 * from 2026-10-08): postponed and accepted, refused, let expire; a call's time
 * moved on notice with a forced call's pay; a day added; the rest cut part-way;
 * a clash refusing a change until it's called off; a call asked to move; the
 * superseded calls never firing; a classmate who can't make the new dates;
 * and pay, credits and the record each once. Which change a production makes
 * is the decider's draw (`career.schedule`); here it's chosen, marked SETUP.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { beginCareer, careerOf, unitRate, workDays, type Booking } from '@/engine/systems/career';
import { SCHEDULE, SCHEDULE_KIND, proposalsFor, type ChangeKind } from '@/engine/systems/rescheduling';
import { productionOf } from '@/engine/systems/companies';
import { contactsOf, knowTheClass } from '@/engine/systems/people';
import { diningQuote, restaurantsIn } from '@/engine/systems/dining';
import { signTheClass } from '@/engine/systems/rivals';
import { evenCraft } from '@/engine/systems/school';
import { saveCurrency } from '@/engine/core/money';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, NY);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const first = at(2026, 10, 5, 8);
/** SETUP: a graduate in New York, the class signed and known. */
function graduate(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  const school = sim.player.school!;
  for (const m of school.classmates) m.craft = evenCraft(75);
  school.standing = 'graduated';
  knowTheClass(sim, sim.player, school.classmates);
  signTheClass(sim, sim.player, 80);
  beginCareer(sim, sim.player);
  sim.player.currentLocationId = 'us-ny-newyork';
  return sim;
}
/** A job offered (SETUP) and taken by the public command; the production's own draw of a change taken off, so the one tested is the only one. */
function take(sim: Simulation, id: string, roleId: 'costar' | 'lort-b', units: number, starts = first): Booking {
  const b: Booking = { id, roleId, cityId: 'us-ny-newyork', starts, units, rehearsalWeeks: roleId === 'lort-b' ? 1 : 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, agentId: null };
  careerOf(sim.player).bookings.push(b);
  sim.must({ kind: 'career.accept', payload: { bookingId: id } });
  for (const x of sim.universe.scheduled) if (x.kind === SCHEDULE_KIND && x.status === 'pending') sim.timeline.cancel(x.id, sim.now);
  return careerOf(sim.player).bookings.find((x) => x.id === id)!;
}
/** SETUP: the production's decision, as its draw would make it, said in a minute. */
function decide(sim: Simulation, bookingId: string, change: ChangeKind, x = 0.3): void {
  sim.schedule({ at: sim.now + 60_000, kind: SCHEDULE_KIND, label: 'A Schedule Change', category: 'system', priority: 20, payload: { personId: sim.player.id, bookingId, change, x } });
  sim.advanceTo(sim.now + 2 * 60_000);
}
/** SETUP: the body kept going, up before each call. */
function workThrough(sim: Simulation, id: string, until: number): void {
  for (;;) {
    const next = sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.status === 'pending' && x.payload.bookingId === id && x.at < until).sort((a, b) => a.at - b.at)[0];
    const to = next ? next.at - 60_000 : until;
    while (sim.now < to) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR)); }
    if (!next) return;
    sim.player.awakeSince = sim.now;
    sim.advanceTo(next.at + 60_000);
  }
}
const pending = (sim: Simulation, id: string) => sim.universe.scheduled.filter((x) => x.kind === 'career.work' && x.status === 'pending' && x.payload.bookingId === id).map((x) => x.at).sort((a, b) => a - b);

describe('a postponement', () => {
  it('accepted: the old calls stand until then, are canceled and never fire after; the new ones worked, paid and credited once', () => {
    let sim = graduate('rs-accept');
    const b = take(sim, 'p1', 'costar', 2);
    const before = workDays(b).map((c) => c.at);
    decide(sim, 'p1', 'postpone', 0.2);
    const pr = proposalsFor(sim.player, 'p1')[0]!;
    expect(pr).toMatchObject({ kind: 'postpone', status: 'pending', mustRespond: true, affected: before });
    expect(pr.to.map((c) => c.at)).toEqual(before.map((t) => t + SCHEDULE.postponeDays[0] * MS_DAY));
    expect(pr.consequences).toMatch(/Refused or unanswered, you’re released, and paid the 2 booked days not worked/);
    // Confirmed calls stand while it waits.
    expect(pending(sim, 'p1')).toEqual(before);
    sim = reload(sim);
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'p1', proposalId: pr.id, accept: true } });
    expect(pending(sim, 'p1')).toEqual(pr.to.map((c) => c.at));
    // SETUP: a superseded call that survived somehow (a save from mid-change): when it comes, it does nothing.
    sim.schedule({ at: before[0]!, kind: 'career.work', label: 'On Set: Old', category: 'career', priority: 34, requiresPlayer: true, durationMinutes: 60, locationId: 'us-ny-newyork', payload: { personId: sim.player.id, bookingId: 'p1', callAt: before[0]! } });
    // Past the old dates: nothing worked, nothing missed, still booked.
    workThrough(sim, 'p1', before.at(-1)! + 2 * MS_HOUR);
    const k = careerOf(sim.player).bookings.find((x) => x.id === 'p1')!;
    expect([k.status, k.worked]).toEqual(['accepted', 0]);
    sim = reload(sim);
    workThrough(sim, 'p1', pr.to.at(-1)!.at + 14 * MS_DAY);
    const w = careerOf(sim.player).bookings.find((x) => x.id === 'p1')!;
    expect([w.status, w.worked, w.owed]).toEqual(['worked', 2, 0]);
    expect(careerOf(sim.player).credits.filter((c) => c.productionId === productionOf(sim.player, 'p1')!.id)).toHaveLength(1);
    expect(productionOf(sim.player, 'p1')!.history.map((h) => h.what)).toEqual(expect.arrayContaining([expect.stringMatching(/^Schedule changed: the start postponed/)]));
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('refused: released, paid as a cancellation once, the part recast, no credit; unanswered, the same, as expired', () => {
    for (const how of ['refused', 'expired'] as const) {
      const sim = graduate(`rs-${how}`);
      take(sim, 'p2', 'lort-b', 3, at(2026, 11, 30, 8));
      decide(sim, 'p2', 'postpone', 0.8);
      const pr = proposalsFor(sim.player, 'p2')[0]!;
      // More than four weeks before the start: LORT's two weeks' salary.
      const weekly = unitRate(careerOf(sim.player).bookings.find((x) => x.id === 'p2')!, sim.now, saveCurrency(sim.universe));
      expect(pr.consequences).toContain(`paid ${SCHEDULE.lort.earlyWeeks} weeks’ salary`);
      if (how === 'refused') sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'p2', proposalId: pr.id, accept: false } });
      else workThrough(sim, 'p2', pr.dueAt + MS_HOUR);
      const b = careerOf(sim.player).bookings.find((x) => x.id === 'p2')!;
      expect(b.status).toBe('released');
      expect(pr.status).toBe(how);
      expect(pending(sim, 'p2')).toEqual([]);
      workThrough(sim, 'p2', sim.now + 3 * MS_DAY);
      const paid = sim.universe.transactions.filter((t) => t.category === 'salary' && t.memo.startsWith('A Play'));
      expect(paid).toHaveLength(1);
      expect(b.cancellationOwed).toBe(0);
      expect(paid[0]!.postings.find((p) => p.amount < 0 && p.accountId === sim.nominalAccount('income', 'Acting').id)!.amount).toBe(-weekly * SCHEDULE.lort.earlyWeeks);
      expect(productionOf(sim.player, 'p2')!.slots.find((s) => s.performer.kind === 'player')!.status).toBe('replaced');
      expect(careerOf(sim.player).credits.filter((c) => c.productionId === productionOf(sim.player, 'p2')!.id)).toEqual([]);
      // Answered, it can't be answered again.
      expect(sim.execute({ kind: 'career.answer_schedule', payload: { bookingId: 'p2', proposalId: pr.id, accept: true } }).error).toBe('There’s no such change waiting on you.');
    }
  });
});

describe('a clash', () => {
  it('a plan at a new call’s time refuses the change, naming it, until it’s called off; never double-booked', () => {
    const sim = graduate('rs-clash');
    const c = contactsOf(sim.player).find((x) => x.classmate === 0)!;
    take(sim, 'p3', 'costar', 1);
    const confirmed = pending(sim, 'p3');
    decide(sim, 'p3', 'postpone', 0.2);
    const pr = proposalsFor(sim.player, 'p3')[0]!;
    // Lunch with a classmate in New York, made after the proposal, in the new call's hours.
    const r = restaurantsIn('us-ny-newyork').find((x) => x.tier === 'casual' && x.menu.some((m) => m.price !== null && diningQuote(sim, x, [m.item], 'in')))!;
    const item = r.menu.find((m) => m.price !== null && diningQuote(sim, r, [m.item], 'in'))!.item;
    const answer = sim.must<{ accepted: boolean; reason?: string }>({ kind: 'social.invite', payload: { contactId: c.id, at: pr.to[0]!.at + 5 * MS_HOUR, what: 'meal', restaurantId: r.id, item } });
    expect(answer.accepted, answer.reason).toBe(true);
    const walk = sim.universe.scheduled.find((x) => x.kind === 'social.meet' && x.status === 'pending')!;
    const err = sim.execute({ kind: 'career.answer_schedule', payload: { bookingId: 'p3', proposalId: pr.id, accept: true } }).error!;
    expect(err.startsWith(`It clashes with ${r.name} With `)).toBe(true);
    expect(err.endsWith('. Call that off or move it first, or refuse the change.')).toBe(true);
    expect(pending(sim, 'p3')).toEqual(confirmed);
    sim.must({ kind: 'social.cancel', payload: { itemId: walk.id } });
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'p3', proposalId: pr.id, accept: true } });
    expect(pending(sim, 'p3')).toEqual([pr.to[0]!.at]);
  });
});

describe('notices and days', () => {
  it('a call moved on notice: taken at its date, with a forced call’s pay where it leaves less than twelve hours’ rest', () => {
    const sim = graduate('rs-forced');
    const b = take(sim, 'p4', 'costar', 2);
    const second = workDays(b)[1]!.at;
    // The second of two days, two hours earlier (x = 0.5: the second call, two hours back).
    decide(sim, 'p4', 'call_time', 0.5);
    const pr = proposalsFor(sim.player, 'p4')[0]!;
    expect(pr.mustRespond).toBe(false);
    expect(pr.consequences).toMatch(/^Less than 12 hours’ rest after the call before: a forced call, paid /);
    expect(sim.execute({ kind: 'career.answer_schedule', payload: { bookingId: 'p4', proposalId: pr.id, accept: true } }).error).toBe('It’s the production’s notice: it takes effect on its date.');
    workThrough(sim, 'p4', pr.dueAt + MS_HOUR);
    expect(pr.status).toBe('applied');
    expect(workDays(b)[1]!.at).toBe(second - 2 * MS_HOUR);
    const rate = unitRate(b, sim.now, saveCurrency(sim.universe));
    expect(b.cancellationOwed).toBe(Math.min(rate, 900_00));
    workThrough(sim, 'p4', first + 21 * MS_DAY);
    expect([b.status, b.worked, b.cancellationOwed]).toEqual(['worked', 2, 0]);
  });

  it('a day added, accepted: three days worked and paid, once', () => {
    const sim = graduate('rs-add');
    const b = take(sim, 'p5', 'costar', 2);
    decide(sim, 'p5', 'add_day');
    const pr = proposalsFor(sim.player, 'p5')[0]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'p5', proposalId: pr.id, accept: true } });
    expect(workDays(b)).toHaveLength(3);
    workThrough(sim, 'p5', first + 21 * MS_DAY);
    expect([b.status, b.worked, b.owed]).toEqual(['worked', 3, 0]);
    expect(careerOf(sim.player).credits.filter((c) => c.productionId === productionOf(sim.player, 'p5')!.id)).toHaveLength(1);
  });

  it('a day added, refused: the schedule stands, nothing owed', () => {
    const sim = graduate('rs-add-no');
    const b = take(sim, 'p6', 'costar', 2);
    decide(sim, 'p6', 'add_day');
    const pr = proposalsFor(sim.player, 'p6')[0]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'p6', proposalId: pr.id, accept: false } });
    expect([b.status, workDays(b).length, b.calls]).toEqual(['accepted', 2, undefined]);
  });

  it('cut part-way: the work done kept and paid, the cut days paid, the job finished once with its credit', () => {
    const sim = graduate('rs-cut');
    const b = take(sim, 'p7', 'costar', 4);
    const calls = workDays(b).map((c) => c.at);
    workThrough(sim, 'p7', calls[0]! + 2 * MS_HOUR);
    expect(b.worked).toBe(1);
    decide(sim, 'p7', 'cut_rest');
    const pr = proposalsFor(sim.player, 'p7')[0]!;
    // The calls within two days stay; the one past them is cut.
    expect(pr.affected).toEqual([calls[3]!]);
    workThrough(sim, 'p7', pr.dueAt + MS_HOUR);
    expect(workDays(b).map((c) => c.at)).toEqual(calls.slice(0, 3));
    workThrough(sim, 'p7', sim.now + 14 * MS_DAY);
    expect([b.status, b.worked]).toEqual(['worked', 3]);
    expect([b.owed, b.cancellationOwed]).toEqual([0, 0]);
    expect(careerOf(sim.player).credits.filter((c) => c.productionId === productionOf(sim.player, 'p7')!.id)).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('calls within two days aren’t moved: nothing’s proposed that couldn’t be answered', () => {
    const sim = graduate('rs-near');
    const b = take(sim, 'p11', 'costar', 2);
    workThrough(sim, 'p11', workDays(b)[0]!.at + 2 * MS_HOUR);
    decide(sim, 'p11', 'postpone_rest');
    expect(proposalsFor(sim.player, 'p11')).toEqual([]);
  });

  it('a call asked to move, once a screen job, answered the next day; a run’s don’t move for one actor', () => {
    const sim = graduate('rs-ask');
    take(sim, 'p8', 'costar', 2, first + 10 * MS_DAY);
    const stage = take(sim, 'p9', 'lort-b', 3, first + 60 * MS_DAY);
    expect(sim.execute({ kind: 'career.request_schedule', payload: { bookingId: 'p9', callAt: workDays(stage)[2]!.at } }).error).toBe('A run’s calls are the company’s: they don’t move for one actor.');
    const target = workDays(careerOf(sim.player).bookings.find((x) => x.id === 'p8')!)[0]!.at;
    sim.must({ kind: 'career.request_schedule', payload: { bookingId: 'p8', callAt: target } });
    expect(sim.execute({ kind: 'career.request_schedule', payload: { bookingId: 'p8', callAt: target } }).error).toBe('You’ve asked once already on this job.');
    workThrough(sim, 'p8', sim.now + MS_DAY + MS_HOUR);
    const moved = !pending(sim, 'p8').includes(target);
    expect(sim.universe.notifications.some((n) => n.title === (moved ? 'Your Call Moved' : 'The Production Can’t Move It'))).toBe(true);
    expect(pending(sim, 'p8')).toHaveLength(2);
  });
});

describe('the cast', () => {
  it('a classmate cast who can’t make the new dates withdraws, a company actor in the part; the casting’s credit given back', () => {
    const sim = graduate('rs-cast');
    // Find a job whose production casts a classmate (the casting is its own draw).
    let id = '';
    for (let n = 0; n < 400 && !id; n += 1) {
      const b = take(sim, `c${n}`, 'lort-b', 3, first + 30 * MS_DAY + n * 100 * MS_DAY);
      if (productionOf(sim.player, b.id)!.slots.some((s) => s.performer.kind === 'classmate')) id = b.id;
      else b.status = 'released';
    }
    expect(id).not.toBe('');
    const p = productionOf(sim.player, id)!;
    const slot = p.slots.find((s) => s.performer.kind === 'classmate')!;
    const i = (slot.performer as { i: number }).i;
    // SETUP: the classmate holds a part in another production in the weeks after, where the new dates go.
    const other = take(sim, 'other', 'lort-b', 3, slot.until + 2 * MS_DAY);
    for (const x of sim.universe.scheduled) if (x.status === 'pending' && x.payload.bookingId === 'other') sim.timeline.cancel(x.id, sim.now);
    productionOf(sim.player, 'other')!.slots[1]!.performer = { kind: 'classmate', i };
    other.status = 'released';
    productionOf(sim.player, 'other')!.slots[1]!.from = slot.until + 2 * MS_DAY;
    const credits = sim.player.school!.classmates[i]!.career!.credits.length;
    decide(sim, id, 'postpone', 0.8);
    const pr = proposalsFor(sim.player, id)[0]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: id, proposalId: pr.id, accept: true } });
    expect(slot.status).toBe('replaced');
    expect(p.slots.filter((s) => s.status === 'cast' && s.part === slot.part).map((s) => s.performer.kind)).toEqual(['company']);
    expect(p.history.some((h) => /couldn’t make the new dates and withdrew/.test(h.what))).toBe(true);
    expect(sim.player.school!.classmates[i]!.career!.credits.length).toBe(credits - 1);
  });
});

describe('a save from before', () => {
  it('a booking without calls or proposals loads and is worked as it was', () => {
    const sim = graduate('rs-old');
    take(sim, 'p10', 'costar', 1);
    const raw = JSON.parse(serialise(sim.universe));
    for (const pr of Object.values(raw.people) as { career?: { productions?: { proposals?: unknown }[] } }[]) for (const p of pr.career?.productions ?? []) delete p.proposals;
    for (const x of raw.scheduled as { kind: string; payload: { callAt?: unknown } }[]) if (x.kind === 'career.work') delete x.payload.callAt;
    const old = loadSave(deserialise(JSON.stringify(raw)) as never);
    workThrough(old, 'p10', first + 14 * MS_DAY);
    expect(careerOf(old.player).bookings.find((x) => x.id === 'p10')!.status).toBe('worked');
  });
});
