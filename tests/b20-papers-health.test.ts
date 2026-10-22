/**
 * Brief 20's papers area, B1 and B3 for health cover (docs/verification/audit-2026-10-21/criteria.md): four lives
 * alike but for what they do about their cover and their appointment, from the same seed, through the commands Papers
 * sends and the clock. Ada Cole, a citizen from a Scraping family, withdraws from the School on Friday 9 October 2026,
 * after the fifteenth day of classes, so Yale Health covers her thirty days more (Bulletin 2026–27 p.174). One presses
 * Enroll on Papers that day and is given HUSKY D; her twins don't. In November the same week sends all four to the
 * doctor, and each is booked at Fair Haven, New Haven's practice for anybody, 23.5 days on.
 *
 * The relevant side: the one HUSKY D covers is seen for nothing, and the uninsured twin is billed SLATE's uninsured
 * price, $183.98 (its $100 of 2024 grown by the physicians' services index to 2026 and marked up 1.75, as
 * tests/evidence-g05-life.test.ts works it), due thirty days on and paid from her checking account on its day; the
 * third, asleep at the appointment, isn't seen or billed, is told so and owes the visit, and is seen and billed once
 * when she books again; the fourth, uninsured, jumps the clock from the booking past the bill's day in one move, and is
 * seen, billed and paid once, as her twin is in steps. The no-leak side: the cover moves neither the week's draw nor the booking (the same day, hour
 * and practice for all four), and the bill is the only medical posting between the two who were seen.
 *
 * Each consequence is also reached across a save and a load, and in one jump of the clock, and happens once.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig` and the family as creation's `withFamily` gives it), at
 * Yale in New Haven from Monday 24 August 2026.
 *
 * TEST SETUP, said where it's done: the body kept fed, rested and awake as the clock moves (`tended`); the week's illness
 * draw on Monday 16 November forced to a doctor's visit for all three, as tests/evidence3-lifepapers.test.ts forces it
 * (which week brings illness is the draw's, tested apart); and the twin who misses the appointment sleeps through it
 * with Sleep, the command the Sleep dialog sends.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, formatDate, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig, withFamily } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { HEALTH_WEEK_KIND, coverOn, healthOf } from '@/engine/systems/health';
import { appointmentsOf } from '@/engine/systems/appointments';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, NY);
const life = (seed: string) => createSave(1, seed, withFamily({ ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' }, 'scraping'));
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const billPosts = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo.startsWith('Medical bill')).map((t) => [t.at, t.memo, t.postings.find((p) => p.accountId === sim.player.primaryAccountId)?.amount]);
const UNINSURED = 183_98;
const FAIR_HAVEN = 'us-ct-fhchc-grand';

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

/** TEST SETUP: the week's illness draw, in `illnessWeek`'s order, forced to a doctor's visit for one week (no stay, no emergency, a visit). */
function forceVisit(sim: Simulation, week: number): void {
  const real = sim.rng.bind(sim);
  Object.assign(sim, {
    rng: (stream: string, ...keys: (string | number)[]) => {
      const d = real(stream, ...keys);
      if (stream !== 'health.illness' || keys[1] !== String(week)) return d;
      const values = [0.999, 0.999, 0];
      let i = 0;
      return { ...d, next: () => values[i++] ?? 0.999 };
    },
  });
}

describe('B1 and B3: health cover, enrolled or not, and an appointment kept or missed', () => {
  it('PLAYER JOURNEY: the same visit, booked alike for all four, is free under HUSKY D, $183.98 uninsured and paid on its day once across a reload and a jump, kept and billed once by a jump of the clock past it, and slept through is neither seen nor billed until it’s booked again; every notice of it goes to Papers', () => {
    const covered = life('b20-papers-care');
    const bare = life('b20-papers-care');
    const asleep = life('b20-papers-care');
    const jumper = life('b20-papers-care');
    const all = [covered, bare, asleep, jumper];
    for (const sim of all) {
      tended(sim, at(2026, 10, 9, 9));
      expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(false);
    }
    // Enroll on Papers: HUSKY D on September's income, from the first of the month after Yale Health's end, 8 November.
    const enrolled = covered.must<{ from: number; kind: string }>({ kind: 'health.enroll', payload: {} });
    expect(enrolled).toEqual({ kind: 'medicaid', from: at(2026, 12, 1, 0) });

    // Monday 16 November's health week, after Yale Health's thirty days: the same draw sends each to the doctor.
    const week = at(2026, 11, 16, 9);
    for (const sim of all) {
      tended(sim, at(2026, 11, 15, 12));
      expect(sim.universe.scheduled.some((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.at === week)).toBe(true);
      forceVisit(sim, week);
      tended(sim, week + MS_HOUR);
    }
    // Between Yale Health's end and HUSKY D's first day, neither is covered when the week books the visit.
    expect(coverOn(covered.player, covered.now)).toBeUndefined();
    expect(coverOn(bare.player, bare.now)).toBeUndefined();
    // No leak: the cover moves nothing about the booking. The same day, hour and practice for all three.
    const booked = all.map((sim) => appointmentsOf(sim.player).map((a) => [a.at, a.what, a.clinicId]));
    expect(booked[0]).toEqual([[at(2026, 12, 10, 10), 'A doctor’s visit', FAIR_HAVEN]]);
    for (const b of booked.slice(1)) expect(b).toEqual(booked[0]);
    const visit = at(2026, 12, 10, 10);
    expect(coverOn(covered.player, visit)).toBe('medicaid');
    expect(coverOn(bare.player, visit)).toBeUndefined();

    // The third sleeps through it: Sleep at six that morning for eight hours.
    tended(asleep, at(2026, 12, 10, 6));
    asleep.must({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(titled(asleep, 'Missed The Doctor').map((n) => n.body)).toEqual(['You weren’t there for your doctor’s appointment, so you weren’t seen. To book again, press Book An Appointment on Papers, under Health Cover.']);
    expect(healthOf(asleep.player).owedVisit).toBe('A doctor’s visit');
    expect(healthOf(asleep.player).bills.filter((b) => b.at === visit)).toEqual([]);

    // The two who are there: the same visit, priced by the cover.
    for (const sim of [covered, bare]) tended(sim, visit + MS_HOUR);
    const seen = (sim: Simulation) => (healthOf(sim.player).careLog ?? []).filter((c) => c.at === visit).map((c) => [c.what, c.share]);
    expect(seen(covered)).toEqual([['A doctor’s visit, Fair Haven Community Health Care', 0]]);
    expect(seen(bare)).toEqual([['A doctor’s visit, Fair Haven Community Health Care', UNINSURED]]);
    expect(titled(covered, 'A Doctor’s Visit').at(-1)!.body).toBe('You saw a doctor at Fair Haven Community Health Care. There’s nothing to pay.');
    const due = visit + 30 * MS_DAY;
    expect(titled(bare, 'A Doctor’s Visit').at(-1)!.body).toBe(`You saw a doctor at Fair Haven Community Health Care. You owe $183.98. It’s taken from your checking account on ${formatDate(due, NY)}, and if there isn’t enough then, it becomes medical debt.`);
    expect(healthOf(covered.player).bills.filter((b) => b.at === visit)).toEqual([]);
    const bill = healthOf(bare.player).bills.find((b) => b.at === visit)!;
    expect([bill.amount, bill.dueAt, bill.paid]).toEqual([UNINSURED, due, undefined]);

    // The bill on its day: saved and opened between, and jumped there in one move, against the life played on; paid once.
    tended(bare, visit + 10 * MS_DAY);
    const opened = reload(bare);
    tended(bare, due + MS_DAY);
    opened.advanceTo(due + MS_DAY);
    tended(covered, due + MS_DAY);
    const MEMO = 'Medical bill: A doctor’s visit, Fair Haven Community Health Care';
    for (const sim of [bare, opened]) {
      expect(billPosts(sim).filter((b) => b[1] === MEMO)).toEqual([[due, MEMO, -UNINSURED]]);
      expect(healthOf(sim.player).bills.find((b) => b.id === bill.id)!.paid).toBe(true);
    }
    expect(billPosts(covered).filter((b) => b[1] === MEMO)).toEqual([]);
    // The fourth, uninsured as her twin, jumps from the week's booking past the bill's day in one move of the clock: the
    // appointment is kept once, billed once and paid once, on the same days as her twin's played in steps.
    jumper.advanceTo(due + MS_DAY);
    expect((healthOf(jumper.player).careLog ?? []).filter((c) => c.at === visit).map((c) => c.share)).toEqual([UNINSURED]);
    expect(billPosts(jumper).filter((b) => b[1] === MEMO)).toEqual([[due, MEMO, -UNINSURED]]);
    expect(titled(jumper, 'Missed The Doctor')).toEqual([]);

    // No leak: the cover changes what the visit costs and nothing else. Both had the same care on the same days (the
    // weeks' draws read no cover), each priced alike while Yale Health covered both, and differ only in this visit.
    const log = (sim: Simulation) => (healthOf(sim.player).careLog ?? []).map((c) => [c.at, c.care, c.what, c.at === visit ? 'this visit' : c.share]);
    expect(log(covered)).toEqual(log(bare));
    expect(log(bare).length).toBeGreaterThan(1);
    expect(billPosts(covered)).toEqual(billPosts(bare).filter((b) => b[1] !== MEMO));

    // The one who slept books again on Papers: 24 days on, kept, billed once, and owes the visit no more. In January the
    // price is 2027's, the index grown another year: $187.20.
    tended(asleep, at(2026, 12, 11, 12));
    const again = asleep.must<{ at: number }>({ kind: 'health.book', payload: {} }).at;
    expect(again).toBe(at(2027, 1, 4, 10));
    expect(asleep.execute({ kind: 'health.book', payload: {} }).error).toBe('There’s nothing to see a doctor about.');
    tended(asleep, again + MS_HOUR);
    expect(healthOf(asleep.player).owedVisit).toBeUndefined();
    expect(healthOf(asleep.player).bills.filter((b) => b.what === 'A doctor’s visit, Fair Haven Community Health Care').map((b) => [b.at, b.amount])).toEqual([[again, 187_20]]);

    // Every notice about her cover, her care and its bills carries Go There to Papers (the papers guide's promise).
    for (const sim of all) {
      const health = sim.universe.notifications.filter((n) => n.category === 'health');
      expect(health.length).toBeGreaterThan(2);
      for (const n of health) expect([n.title, n.route]).toEqual([n.title, '/workspace/papers']);
    }
  }, 120_000);
});
