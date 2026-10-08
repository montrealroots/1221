/**
 * Schedule changes to a series, a commercial and a voice session, and a job
 * called off (`systems/rescheduling.ts`, from 2026-10-08, later). Until then
 * only stage and one-off screen jobs were ever changed. What a production
 * decides is the decider's draw (`career.schedule`); here it's chosen, marked
 * SETUP. Pay is read from the year's earnings by booking, so a payment made twice, or
 * not at all, shows.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { beginCareer, careerOf, roleById, unitRate, workDays, type Booking } from '@/engine/systems/career';
import { SCHEDULE, SCHEDULE_KIND, changeFor, familyOf, proposalsFor, type ChangeKind } from '@/engine/systems/rescheduling';
import { productionOf } from '@/engine/systems/companies';
import { yearOf } from '@/engine/systems/earnings';
import { evenCraft } from '@/engine/systems/school';
import { saveCurrency } from '@/engine/core/money';
import { ROLES } from '@/engine/content/career';

const NY = 'America/New_York';
const LA = 'America/Los_Angeles';
const at = (zone: string, year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour, minute: 0 }, zone);
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/** SETUP: an actor living in the town asked, the career begun, as `tests/fittings.test.ts` makes one. */
function actor(seed: string, cityId: string): Simulation {
  const sim = quickSave({ startLocationId: cityId, homeRegionId: cityId, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(75);
  beginCareer(sim, sim.player);
  return sim;
}
/** A job offered (SETUP) and taken by the public command, the production's own drawn change taken off. */
function take(sim: Simulation, id: string, roleId: string, cityId: string, units: number, starts: number): Booking {
  const b: Booking = { id, roleId, cityId: cityId as Booking['cityId'], starts, units, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0, agentId: null };
  careerOf(sim.player).bookings.push(b);
  sim.must({ kind: 'career.accept', payload: { bookingId: id } });
  for (const x of sim.universe.scheduled) if (x.kind === SCHEDULE_KIND && x.status === 'pending') sim.timeline.cancel(x.id, sim.now);
  return careerOf(sim.player).bookings.find((x) => x.id === id)!;
}
/** SETUP: the production's decision, said in a minute. */
function decide(sim: Simulation, bookingId: string, change: ChangeKind, x = 0.3): void {
  sim.schedule({ at: sim.now + 60_000, kind: SCHEDULE_KIND, label: 'A Schedule Change', category: 'system', priority: 20, payload: { personId: sim.player.id, bookingId, change, x } });
  sim.advanceTo(sim.now + 2 * 60_000);
}
/** SETUP: the body kept going, up before each call, to a time. */
function live(sim: Simulation, id: string, until: number): void {
  for (;;) {
    const next = sim.universe.scheduled.filter((x) => (x.kind === 'career.work' || x.kind === 'career.fitting') && x.status === 'pending' && x.payload.bookingId === id && x.at < until).sort((a, b) => a.at - b.at)[0];
    const to = next ? next.at - 60_000 : until;
    while (sim.now < to) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.advanceTo(Math.min(to, sim.now + 6 * MS_HOUR)); }
    if (!next) return;
    sim.player.awakeSince = sim.now;
    sim.advanceTo(next.at + 60_000);
  }
}
const pendingOf = (sim: Simulation, id: string, kind = 'career.work') => sim.universe.scheduled.filter((x) => x.kind === kind && x.status === 'pending' && x.payload.bookingId === id);
/** What a job has paid gross in a year, by its booking (`earnings.ts`'s employers). */
const earned = (sim: Simulation, year: number, bookingId: string) => yearOf(sim.player, year).employers[bookingId] ?? 0;

describe('each kind of job its own changes', () => {
  it('a series, a commercial and a voice session are changed now, and only in the ways that fit them', () => {
    const sim = actor('fam-kinds', 'us-ca-losangeles');
    const seen: Record<string, Set<string>> = {};
    for (const role of ROLES) {
      const family = familyOf(role);
      for (let n = 0; n < 400; n += 1) {
        const c = changeFor(sim, sim.player, { id: `k${role.id}${n}`, roleId: role.id } as Booking);
        if (c) (seen[family] ??= new Set()).add(c.kind);
      }
    }
    expect([...seen.series!].sort()).toEqual(['call_time', 'cancel', 'cut_rest', 'postpone', 'postpone_rest']);
    expect([...seen.commercial!].sort()).toEqual(['call_time', 'cancel', 'postpone']);
    expect([...seen.voice!].sort()).toEqual(['call_time', 'cancel', 'postpone']);
    expect(seen.stage!.has('add_day')).toBe(false);
    expect(seen.screen!.has('add_day')).toBe(true);
    expect([familyOf(roleById('series-hour')), familyOf(roleById('recurring')), familyOf(roleById('commercial')), familyOf(roleById('animation'))]).toEqual(['series', 'series', 'commercial', 'voice']);
  });
});

describe('a series', () => {
  it('its episode order cut part-way: the season’s days left go, the guaranteed episodes are paid all the same, once', () => {
    let sim = actor('fam-series', 'us-ny-newyork');
    const starts = at(NY, 2026, 11, 2, 7);
    const b = take(sim, 's1', 'series-hour', 'us-ny-newyork', 13, starts);
    const calls = workDays(b);
    const role = roleById('series-hour');
    // The season's rate on the day the cut takes effect, spread over its days, as the payroll pays a day.
    const perCall = (when: number) => Math.round((unitRate(b, when, saveCurrency(sim.universe)) * role.series!.episodes) / (role.series!.weeks * 5));
    // A month in, the order's cut.
    live(sim, 's1', calls[20]!.at + MS_HOUR);
    decide(sim, 's1', 'cut_rest', 0.4);
    const pr = proposalsFor(sim.player, 's1')[0]!;
    expect(pr.kind).toBe('cut_rest');
    expect(pr.mustRespond).toBe(false);
    expect(pr.consequences).toMatch(/^The episode order cut: \d+ of the season’s days go, and the episodes guaranteed are paid all the same/);
    sim = reload(sim);
    live(sim, 's1', pr.dueAt + MS_HOUR);
    const after = careerOf(sim.player).bookings.find((x) => x.id === 's1')!;
    expect(proposalsFor(sim.player, 's1')[0]!.status).toBe('applied');
    expect(pendingOf(sim, 's1').map((x) => x.at)).toEqual(workDays(after).slice(after.worked).map((c) => c.at));
    expect(workDays(after).length).toBe(calls.length - pr.affected.length);
    // Owed by the cut, and then paid once with the next check.
    expect(after.cancellationOwed ?? 0).toBe(perCall(pr.dueAt) * pr.affected.length);
    live(sim, 's1', workDays(after).at(-1)!.at + 10 * MS_DAY);
    const done = careerOf(sim.player).bookings.find((x) => x.id === 's1')!;
    expect([done.status, done.cancellationOwed]).toEqual(['worked', 0]);
    expect(careerOf(sim.player).credits.filter((c) => c.roleId === 'series-hour')).toHaveLength(1);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('a series’ calls aren’t the actor’s to move', () => {
    const sim = actor('fam-series-ask', 'us-ny-newyork');
    const b = take(sim, 's2', 'series-hour', 'us-ny-newyork', 13, at(NY, 2026, 11, 2, 7));
    expect(sim.execute({ kind: 'career.request_schedule', payload: { bookingId: 's2', callAt: workDays(b)[10]!.at } }).error).toBe('A series’ or a commercial’s calls aren’t yours to move.');
  });
});

describe('a commercial called off', () => {
  it('released before the shoot: its call and fitting off the calendar, its fee paid once, no use, no credit', () => {
    let sim = actor('fam-commercial', 'us-ny-newyork');
    const starts = at(NY, 2026, 10, 20, 7);
    const b = take(sim, 'c1', 'commercial', 'us-ny-newyork', 1, starts);
    const fee = unitRate(b, sim.now, saveCurrency(sim.universe));
    expect(pendingOf(sim, 'c1', 'career.fitting')).toHaveLength(1);
    decide(sim, 'c1', 'cancel');
    const pr = proposalsFor(sim.player, 'c1')[0]!;
    expect(pr).toMatchObject({ kind: 'cancel', mustRespond: false, status: 'pending' });
    expect(pr.consequences).toMatch(/^You’re released, and paid the booked day’s fee/);
    expect(sim.execute({ kind: 'career.answer_schedule', payload: { bookingId: 'c1', proposalId: pr.id, accept: false } }).error).toBe('It’s the production’s notice: it takes effect on its date.');
    sim = reload(sim);
    const year = 2026;
    const before = earned(sim, year, 'c1');
    live(sim, 'c1', pr.dueAt + 2 * MS_HOUR);
    const gone = careerOf(sim.player).bookings.find((x) => x.id === 'c1')!;
    expect(gone.status).toBe('released');
    expect(pendingOf(sim, 'c1')).toHaveLength(0);
    expect(pendingOf(sim, 'c1', 'career.fitting')).toHaveLength(0);
    live(sim, 'c1', starts + 20 * MS_DAY);
    // The fee, gross, once: a cancellation's pay is wages.
    expect(before).toBe(0);
    expect(earned(sim, year, 'c1')).toBe(fee);
    expect(careerOf(sim.player).residuals.filter((r) => r.bookingId === 'c1')).toHaveLength(0);
    expect(careerOf(sim.player).credits.filter((c) => c.roleId === 'commercial')).toHaveLength(0);
    expect(productionOf(sim.player, 'c1')!.history.some((h) => h.what.startsWith('Called off: the job called off'))).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a voice session', () => {
  it('postponed and accepted: the booth call moves, labeled as a booth’s; and the actor may ask to move one', () => {
    let sim = actor('fam-voice', 'us-ca-losangeles');
    const starts = at(LA, 2026, 11, 9, 10);
    const b = take(sim, 'v1', 'animation', 'us-ca-losangeles', 2, starts);
    const old = workDays(b).map((c) => c.at);
    decide(sim, 'v1', 'postpone', 0.2);
    const pr = proposalsFor(sim.player, 'v1')[0]!;
    expect(pr.to.map((c) => c.at)).toEqual(old.map((t) => t + SCHEDULE.postponeDays[0] * MS_DAY));
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'v1', proposalId: pr.id, accept: true } });
    sim = reload(sim);
    const moved = pendingOf(sim, 'v1');
    expect(moved.map((x) => x.at)).toEqual(pr.to.map((c) => c.at));
    expect(moved.every((x) => x.label === 'In The Booth: ' + roleById('animation').label)).toBe(true);
    // Asking to move a session: refused only by its own rules, not because it's a booth's.
    expect(sim.execute({ kind: 'career.request_schedule', payload: { bookingId: 'v1', callAt: moved[0]!.at } }).error).toBeUndefined();
    // And the production can move it: a request makes a change of a session, as of a screen call.
    decide(sim, 'v1', 'request', 0.2);
    const asked = proposalsFor(sim.player, 'v1').find((x) => x.kind === 'request');
    expect(asked?.affected).toEqual([moved[0]!.at]);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a fitting goes with its calls', () => {
  it('postponed, the fitting moves by the same days; released, it’s gone from the calendar', () => {
    const sim = actor('fam-fitting', 'us-ny-newyork');
    const b = take(sim, 'f1', 'costar', 'us-ny-newyork', 2, at(NY, 2026, 10, 26, 7));
    const fitting = pendingOf(sim, 'f1', 'career.fitting')[0]!;
    const was = fitting.at;
    decide(sim, 'f1', 'postpone', 0.2);
    const pr = proposalsFor(sim.player, 'f1')[0]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'f1', proposalId: pr.id, accept: true } });
    expect(pendingOf(sim, 'f1', 'career.fitting')[0]!.at).toBe(was + SCHEDULE.postponeDays[0] * MS_DAY);
    expect(workDays(careerOf(sim.player).bookings.find((x) => x.id === b.id)!)[0]!.at - pendingOf(sim, 'f1', 'career.fitting')[0]!.at).toBeGreaterThan(0);
    decide(sim, 'f1', 'postpone_rest', 0.2);
    const again = proposalsFor(sim.player, 'f1')[1]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'f1', proposalId: again.id, accept: false } });
    expect(careerOf(sim.player).bookings.find((x) => x.id === 'f1')!.status).toBe('released');
    expect(pendingOf(sim, 'f1', 'career.fitting')).toHaveLength(0);
  });
});

describe('travel moves with the calls, once', () => {
  it('a week’s postponement moves the trip out a week, not two or three', () => {
    const sim = actor('fam-travel', 'us-ny-newyork');
    take(sim, 't1', 'costar', 'us-ca-losangeles', 2, at(LA, 2026, 11, 2, 7));
    const outs = () => sim.universe.scheduled.filter((x) => (x.kind === 'career.stay' || x.kind === 'career.travel') && x.status === 'pending' && x.payload.bookingId === 't1' && x.payload.direction === 'out').map((x) => x.at);
    const was = outs();
    expect(was.length).toBeGreaterThan(0);
    decide(sim, 't1', 'postpone', 0.2);
    const pr = proposalsFor(sim.player, 't1')[0]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 't1', proposalId: pr.id, accept: true } });
    expect(outs()).toEqual(was.map((t) => t + SCHEDULE.postponeDays[0] * MS_DAY));
  });
});

describe('a commercial’s own rules (SAG-AFTRA Commercials)', () => {
  it('postponed, it pays half a session fee whatever the new date, set against nothing', () => {
    // Two copies of one life and one shoot: the second postponed, both worked through. The difference is the half fee.
    const worked = (postpone: boolean) => {
      const sim = actor('fam-comm-postpone', 'us-ny-newyork');
      const b = take(sim, 'cp', 'commercial', 'us-ny-newyork', 1, at(NY, 2026, 10, 27, 7));
      const fee = unitRate(b, sim.now, saveCurrency(sim.universe));
      let end = workDays(b).at(-1)!.at;
      if (postpone) {
        decide(sim, 'cp', 'postpone', 0.2);
        const pr = proposalsFor(sim.player, 'cp')[0]!;
        expect(pr.consequences).toMatch(/^Postponed, it pays half a session fee/);
        sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'cp', proposalId: pr.id, accept: true } });
        expect(careerOf(sim.player).bookings.find((x) => x.id === 'cp')!.cancellationOwed).toBe(Math.round(fee / 2));
        end = pr.to.at(-1)!.at;
      }
      live(sim, 'cp', end + 15 * MS_DAY);
      return { fee, paid: earned(sim, 2026, 'cp') };
    };
    const kept = worked(false);
    const moved = worked(true);
    expect(moved.paid - kept.paid).toBe(Math.round(kept.fee / 2));
  });

  it('a screen job postponed owes nothing for it: only a commercial’s contract pays one', () => {
    const sim = actor('fam-screen-postpone', 'us-ny-newyork');
    take(sim, 'sp', 'costar', 'us-ny-newyork', 2, at(NY, 2026, 10, 27, 7));
    decide(sim, 'sp', 'postpone', 0.2);
    const pr = proposalsFor(sim.player, 'sp')[0]!;
    sim.must({ kind: 'career.answer_schedule', payload: { bookingId: 'sp', proposalId: pr.id, accept: true } });
    expect(careerOf(sim.player).bookings.find((x) => x.id === 'sp')!.cancellationOwed ?? 0).toBe(0);
  });
});
