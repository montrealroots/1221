/**
 * What the 2026-09-28 playthrough found and what was fixed: a sleep that
 * slept through the next call, an offer that kept a Take It it couldn't
 * honor, and a statement notice every month for every account.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { suggestedSleep } from '@/engine/systems/life';
import { beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { alertsOf, statementReady } from '@/engine/systems/statements';
import { evenCraft } from '@/engine/systems/school';

const pro = (seed: string) => {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(75);
  beginCareer(sim, sim.player);
  return sim;
};

describe('the sleep suggestion', () => {
  it('never sleeps through the next thing: with a call three hours off, it suggests what’s left before getting up for it', () => {
    const sim = pro('fix-sleep');
    const call = sim.schedule({ at: sim.now + 3 * MS_HOUR, kind: 'career.week', label: 'A Call', category: 'career', priority: 30, requiresPlayer: true, payload: {} });
    const { hours } = suggestedSleep(sim);
    expect(hours).toBe(1.5);
    expect(sim.now + hours * MS_HOUR).toBeLessThan(call.at);
    // Half an hour at the least, where even that's nearly all that's left.
    sim.timeline.cancel(call.id, sim.now);
    sim.schedule({ at: sim.now + 1.5 * MS_HOUR, kind: 'career.week', label: 'Soon', category: 'career', priority: 30, requiresPlayer: true, payload: {} });
    expect(suggestedSleep(sim).hours).toBe(0.5);
  });
});

describe('an offer that can no longer be taken', () => {
  it('drops its Take It and says why once a clashing job is taken', () => {
    const sim = pro('fix-offers');
    const career = careerOf(sim.player);
    const starts = sim.now + 7 * MS_DAY;
    const make = (id: string): Booking => ({ id, roleId: 'costar', cityId: 'us-ny-newyork', starts, units: 1, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 });
    career.bookings.push(make('one'), make('two'));
    sim.requireDecision({ urgency: 95, category: 'career', title: 'Booked: Two', detail: 'A day. Answer by tomorrow.', refType: 'booking', refId: 'two', actions: [{ label: 'Take It', commandKind: 'career.accept', payload: { bookingId: 'two' } }, { label: 'Pass', commandKind: 'career.pass', payload: { bookingId: 'two' } }] });
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: 'one' } }).ok).toBe(true);
    const d = Object.values(sim.universe.decisions).find((x) => x.refId === 'two')!;
    expect(d.actions.map((a) => a.label)).toEqual(['Pass']);
    expect(d.detail).toMatch(/You can’t take it now: /);
    expect(d.detail).not.toMatch(/Answer by/);
  });
});

describe('statement notices', () => {
  it('tells of a statement with a payment due always, and of the rest only where asked', () => {
    const sim = pro('fix-statements');
    const p = sim.player;
    expect(alertsOf(p).statements).toBe(false);
    const account = Object.values(sim.universe.accounts).find((a) => a.ownerId === p.id)!;
    const count = () => sim.universe.notifications.filter((n) => n.title.startsWith('Statement Ready')).length;
    statementReady(sim, p, account, 'Nothing owed.');
    expect(count()).toBe(0);
    statementReady(sim, p, account, '$40 to pay.', true);
    expect(count()).toBe(1);
    sim.must({ kind: 'bank.set_alerts', payload: { statements: true } });
    statementReady(sim, p, account, 'Nothing owed.');
    expect(count()).toBe(2);
  });
});
