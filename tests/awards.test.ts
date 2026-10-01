/**
 * Awards (`systems/awards.ts`, `content/awards.ts`, from 2026-10-01): which
 * work goes up for the Primetime Emmys and BAFTA Film, who enters it and
 * what it costs, the award year, the chances at a nomination and a win from
 * the published fields, and what a nomination does.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { beginCareer, careerOf, roleById, type Booking } from '@/engine/systems/career';
import { evenCraft } from '@/engine/systems/school';
import { attributesOf } from '@/engine/systems/attributes';
import { AWARD_EFFECT, announceNominations, awardChances, awardYear, categoryName, categoryOf, enterForThem, entriesOf, entryRefusal, standout } from '@/engine/systems/awards';

const LA = 'America/Los_Angeles';
function pro(seed: string, level = 70): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(level);
  beginCareer(sim, sim.player);
  return sim;
}
function worked(sim: Simulation, roleId: string, starts: number, genre?: string): Booking {
  const career = careerOf(sim.player);
  const b: Booking = { id: `w${career.bookings.length}`, roleId, cityId: 'us-ny-newyork', starts, units: 1, rehearsalWeeks: 0, status: 'worked', dueAt: starts, offeredAt: starts, worked: 1, owed: 0, ...(genre ? { genre } : {}) };
  career.bookings.push(b);
  return b;
}
const on = (y: number, m: number, d: number) => instantFromZoned({ year: y, month: m, day: d, hour: 9, minute: 0 }, LA);

describe('which work goes up', () => {
  it('a guest part, a recurring one and a series regular’s for the Emmys; a British feature for BAFTA; not a co-star’s few lines', () => {
    const sim = pro('aw-which');
    const t = sim.now;
    expect(categoryOf(worked(sim, 'guest-hour', t))).toEqual({ body: 'emmys', category: 'guest-drama', byNetwork: false });
    expect(categoryOf(worked(sim, 'guest-half', t))).toEqual({ body: 'emmys', category: 'guest-comedy', byNetwork: false });
    expect(categoryOf(worked(sim, 'recurring', t, 'comedy'))!.category).toBe('guest-comedy');
    expect(categoryOf(worked(sim, 'series-half', t))).toEqual({ body: 'emmys', category: 'supporting-comedy', byNetwork: true });
    expect(categoryOf(worked(sim, 'uk-film-major', t))!.body).toBe('bafta-film');
    expect(categoryOf(worked(sim, 'costar', t))).toBeUndefined();
    sim.player.performerTitle = 'actress';
    expect(categoryName(sim.player, { body: 'emmys', category: 'guest-drama' })).toBe('Outstanding Guest Actress In A Drama Series');
  });

  it('counts toward the Emmy year its last day falls in, June to May; BAFTA’s the next', () => {
    const sim = pro('aw-year');
    expect(awardYear(worked(sim, 'guest-hour', on(2026, 7, 10)), 'emmys')).toBe(2027);
    expect(awardYear(worked(sim, 'guest-hour', on(2027, 5, 10)), 'emmys')).toBe(2027);
    expect(awardYear(worked(sim, 'uk-film-major', on(2026, 9, 1)), 'bafta-film')).toBe(2027);
  });
});

describe('entering', () => {
  it('a guest performer enters themselves at the Academy’s $225, by the deadline; a network enters its regulars', () => {
    const sim = pro('aw-enter');
    const guest = worked(sim, 'guest-hour', sim.now - 2 * MS_DAY);
    const bank = () => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
    const before = bank();
    sim.must({ kind: 'career.enter_award', payload: { bookingId: guest.id } });
    expect(before - bank()).toBe(225_00);
    expect(entryRefusal(sim, sim.player, guest.id)).toBe('It’s entered.');
    const regular = worked(sim, 'series-hour', sim.now - 2 * MS_DAY);
    expect(entryRefusal(sim, sim.player, regular.id)).toBe('The production enters it.');
    const unentered = worked(sim, 'guest-half', sim.now - 2 * MS_DAY);
    expect(enterForThem(sim, sim.player)).toBe(1);
    // A guest part waits on the performer.
    expect(entriesOf(sim.player).some((e) => e.bookingId === unentered.id)).toBe(false);
    expect(entriesOf(sim.player).find((e) => e.bookingId === regular.id)).toMatchObject({ byThem: false, category: 'supporting-drama' });
    const old = worked(sim, 'guest-hour', on(2024, 7, 1));
    expect(entryRefusal(sim, sim.player, old.id)).toBe('Its entry deadline has passed.');
    const costar = worked(sim, 'costar', sim.now);
    expect(entryRefusal(sim, sim.player, costar.id)).toBe('It isn’t work any award SLATE keeps takes.');
  });
});

describe('the vote', () => {
  it('a nomination is the slots over the field, weighed by how far above the part they stood', () => {
    const sim = pro('aw-odds', roleById('guest-hour').bar);
    const b = worked(sim, 'guest-hour', sim.now);
    expect(standout(sim.player, b)).toBeCloseTo(1, 1);
    expect(awardChances(sim.player, b, 'emmys', 'guest-drama').nominated).toBeCloseTo((6 / 84) * standout(sim.player, b), 6);
    const strong = pro('aw-odds-strong', 100);
    const sb = worked(strong, 'guest-hour', strong.now);
    expect(standout(strong.player, sb)).toBe(4);
    expect(awardChances(strong.player, sb, 'emmys', 'guest-drama').won).toBeCloseTo(4 / 6, 6);
  });

  it('a nomination lifts recognition and reputation', () => {
    const sim = pro('aw-lift');
    const b = worked(sim, 'guest-hour', sim.now);
    entriesOf(sim.player).push({ bookingId: b.id, body: 'emmys', year: 2027, category: 'guest-drama', entered: sim.now, byThem: true });
    const before = { ...attributesOf(sim, sim.player) };
    expect(announceNominations(sim, sim.player, 'emmys', 2027, 1)).toBe(1);
    expect(attributesOf(sim, sim.player).recognition).toBeCloseTo(Math.min(100, before.recognition + AWARD_EFFECT.nominated.recognition), 6);
    expect(attributesOf(sim, sim.player).reputation).toBeGreaterThan(before.reputation);
    expect(sim.universe.notifications.some((n) => n.title === 'Nominated')).toBe(true);
  });

  it('is drawn on the body’s day: an entry from a strong actor’s year, nominated at the field’s odds', () => {
    const sim = pro('aw-day', 100);
    for (let i = 0; i < 30; i += 1) {
      const b = worked(sim, 'guest-hour', on(2026, 3, 1));
      entriesOf(sim.player).push({ bookingId: b.id, body: 'emmys', year: 2026, category: 'guest-drama', entered: sim.now, byThem: true });
    }
    // Played to the day after 8 July 2026, when the 78th's nominations were announced.
    while (sim.now < on(2026, 7, 9)) sim.advanceTo(Math.min(on(2026, 7, 9), sim.now + 5 * MS_DAY));
    const decided = entriesOf(sim.player).filter((e) => e.nominated !== undefined);
    expect(decided).toHaveLength(30);
    const share = decided.filter((e) => e.nominated).length / 30;
    expect(share).toBeGreaterThan(0.05);
    expect(share).toBeLessThan(0.6);
  });
});
