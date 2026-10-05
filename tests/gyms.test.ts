/**
 * A gym membership (`systems/gyms.ts`, `content/gyms.ts`, from 2026-10-01):
 * joined in person in its town, on a tier the age allows, while it's open,
 * at its fees with the place's tax; billed each month and each year after;
 * a minimum term's months paid on leaving early; and a workout or a swim
 * there doing what a gym's does.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { gymById } from '@/engine/content/gyms';
import { gymHere, joinRefusal, joiningCost, leavingCost, taxed } from '@/engine/systems/gyms';
import { TRAINING, swimRefusal, trainingAt } from '@/engine/systems/dwelling';
import { addItem } from '@/engine/systems/items';

const NY = 'America/New_York';
const YEAR = 365.2425 * MS_DAY;
const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const at = (d: number, h: number) => instantFromZoned({ year: 2026, month: 1, day: d, hour: h, minute: 0 }, NY);
const usd = (sim: Simulation, c: number) => { const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur)!; };
const paidTo = (sim: Simulation, memo: string) => sim.universe.transactions.filter((t) => t.memo === memo).length;

describe('joining a gym', () => {
  it('is in person, in its town, on a tier the age allows, while it’s open', () => {
    const sim = life('gym-join');
    sim.advanceTo(at(12, 10));
    sim.player.birthInstant = sim.now - 30 * YEAR;
    expect(joinRefusal(sim, sim.player, 'mcburney-ymca', 'Adult')).toBeUndefined();
    expect(joinRefusal(sim, sim.player, 'mcburney-ymca', 'Senior')).toBe('Senior is from 65.');
    sim.player.birthInstant = sim.now - 70 * YEAR;
    expect(joinRefusal(sim, sim.player, 'mcburney-ymca', 'Adult')).toBe('Adult is to 64.');
    expect(joinRefusal(sim, sim.player, 'puregym-holborn', 'Core')).toBe('You join in person, in its town.');
    sim.player.birthInstant = sim.now - 30 * YEAR;
    sim.advanceTo(at(12, 22));
    expect(joinRefusal(sim, sim.player, 'mcburney-ymca', 'Adult')).toMatch(/has closed for the day/);
    // PureGym never closes.
    expect(joinRefusal(sim, sim.player, 'puregym-park-slope', 'Core')).toBeUndefined();
  });

  it('pays the joining fee, the first month and the annual fee, with New York City’s 4.5%, and is billed each month', () => {
    const sim = life('gym-pay');
    sim.advanceTo(at(12, 10));
    const pf = gymById('planet-fitness-union-square')!;
    const classic = pf.tiers.find((t) => t.name === 'Classic')!;
    expect(joiningCost(sim, pf, classic)).toBe(usd(sim, Math.round((59 + 19 + 59) * 1.045 * 100)));
    const r = sim.execute<{ paid: number }>({ kind: 'gym.join', payload: { gymId: pf.id, tier: 'Classic' } });
    expect(r.ok, r.error).toBe(true);
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'mcburney-ymca', tier: 'Adult' } }).error).toMatch(/member of Planet Fitness/);
    sim.advanceBy(65 * MS_DAY);
    expect(paidTo(sim, 'Planet Fitness Union Square, the month')).toBe(2);
    expect(taxed(sim, pf, 19)).toBe(usd(sim, Math.round(19 * 1.045 * 100)));
  });

  it('left inside its minimum term pays the months left of it, and outside none', () => {
    const sim = life('gym-leave');
    sim.advanceTo(at(12, 10));
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'planet-fitness-union-square', tier: 'Classic' } }).ok).toBe(true);
    sim.advanceBy(3 * YEAR / 12 + MS_DAY);
    // Twelve months' term, three and a day gone: nine left.
    expect(leavingCost(sim, sim.player)).toBe(taxed(sim, gymById('planet-fitness-union-square')!, 9 * 19));
    const r = sim.execute<{ paid: number }>({ kind: 'gym.leave', payload: {} });
    expect(r.value!.paid).toBe(taxed(sim, gymById('planet-fitness-union-square')!, 9 * 19));
    expect(sim.player.gym).toBeUndefined();
    const before = paidTo(sim, 'Planet Fitness Union Square, the month');
    sim.advanceBy(65 * MS_DAY);
    expect(paidTo(sim, 'Planet Fitness Union Square, the month')).toBe(before);
    // Rejoined, it's billed once a month, the old month gone with the leaving.
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'planet-fitness-union-square', tier: 'PF Black Card' } }).ok).toBe(true);
    const rejoined = paidTo(sim, 'Planet Fitness Union Square, the month');
    sim.advanceBy(32 * MS_DAY);
    expect(paidTo(sim, 'Planet Fitness Union Square, the month')).toBe(rejoined + 1);
    // A membership with no term costs nothing to leave.
    const free = life('gym-leave-free');
    free.advanceTo(at(12, 10));
    expect(free.execute({ kind: 'gym.join', payload: { gymId: 'mcburney-ymca', tier: 'Adult' } }).ok).toBe(true);
    expect(leavingCost(free, free.player)).toBe(0);
  });
});

describe('leaving and rejoining', () => {
  it('in the same month bills the month once, the old one gone with the leaving', () => {
    const sim = life('gym-rejoin');
    sim.advanceTo(at(12, 10));
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'mcburney-ymca', tier: 'Adult' } }).ok).toBe(true);
    sim.advanceBy(10 * MS_DAY);
    expect(sim.execute({ kind: 'gym.leave', payload: {} }).ok).toBe(true);
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'mcburney-ymca', tier: 'Adult' } }).ok).toBe(true);
    sim.advanceBy(32 * MS_DAY);
    expect(paidTo(sim, 'McBurney YMCA, the month')).toBe(1);
  });
});

describe('a year at the gym', () => {
  it('bills the annual fee with the twelfth month, and a term past costs nothing to leave', () => {
    const sim = life('gym-year');
    sim.advanceTo(at(12, 10));
    const pf = gymById('planet-fitness-union-square')!;
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: pf.id, tier: 'Classic' } }).ok).toBe(true);
    sim.advanceBy(12 * YEAR / 12 + MS_DAY);
    const months = sim.universe.transactions.filter((t) => t.memo === 'Planet Fitness Union Square, the month');
    expect(months).toHaveLength(12);
    const amount = (t: (typeof months)[number]) => t.postings.filter((q) => q.accountId === sim.player.primaryAccountId).reduce((a, q) => a - q.amount, 0);
    expect(amount(months[0]!)).toBe(taxed(sim, pf, 19));
    expect(amount(months[11]!)).toBe(taxed(sim, pf, 19 + 59));
    expect(leavingCost(sim, sim.player)).toBe(0);
  });
});

describe('a member’s gym', () => {
  it('trains as a gym does and swims in its pool while open, and not in another town or after closing', () => {
    const sim = life('gym-use');
    sim.advanceTo(at(12, 10));
    expect(sim.execute({ kind: 'gym.join', payload: { gymId: 'mcburney-ymca', tier: 'Adult' } }).ok).toBe(true);
    expect(trainingAt(sim, sim.player)).toEqual({ where: 'gym', builds: TRAINING.gym });
    // A swim is in a swimsuit of one's own (from 2026-10-03).
    expect(swimRefusal(sim, sim.player)).toBe('You have no clean swimsuit to hand: one is bought with the clothes.');
    addItem(sim, sim.player, { kind: 'test:swimsuit', label: 'Swimsuit', quantity: 1, condition: 1, at: { kind: 'person' }, acquiredAt: sim.now, garment: { kind: 'swimsuit', slot: 'active', care: 'wash', wears: 0, washes: 0 } });
    expect(swimRefusal(sim, sim.player)).toBeUndefined();
    // Shut, or in another town, it's as if there were none: whatever the home or the weather gives.
    const withoutIt = () => { const m = sim.player.gym; delete sim.player.gym; const r = trainingAt(sim, sim.player); sim.player.gym = m; return r; };
    sim.player.homes = [];
    sim.player.home = { ...sim.player.home!, kind: 'sofa' };
    expect(trainingAt(sim, sim.player)).toEqual({ where: 'gym', builds: TRAINING.gym });
    sim.advanceTo(at(12, 22));
    sim.player.home = { ...sim.player.home, kind: 'sofa' };
    expect(trainingAt(sim, sim.player)).toEqual(withoutIt());
    expect(withoutIt().where).not.toBe('gym');
    expect(swimRefusal(sim, sim.player)).toBe('You have no pool.');
    sim.advanceTo(at(13, 10));
    sim.player.home = { ...sim.player.home, kind: 'sofa' };
    expect(gymHere(sim, sim.player)?.id).toBe('mcburney-ymca');
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(trainingAt(sim, sim.player)).toEqual(withoutIt());
    expect(gymHere(sim, sim.player)).toBeUndefined();
  });
});

describe('leaving by the gym’s own terms (from 2026-10-05)', () => {
  const lifeIn = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  const on = (zone: string, month: number, day: number, hour = 10) => instantFromZoned({ year: 2026, month, day, hour, minute: 0 }, zone);
  const join = (sim: Simulation, gymId: string, tier: string) => { const r = sim.execute({ kind: 'gym.join', payload: { gymId, tier } }); expect(r.ok, r.error).toBe(true); };
  const bank = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;

  it('gives Third Space a full calendar month’s notice: asked after the 1st, it ends with the next month, billed till then', () => {
    const LDN = 'Europe/London';
    const sim = lifeIn('uk-eng-london', 'gym-third-space');
    sim.advanceTo(on(LDN, 1, 12));
    join(sim, 'third-space-islington', 'Club');
    const r = sim.execute<{ paid: number; endsAt: number }>({ kind: 'gym.leave', payload: {} });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.endsAt).toBe(on(LDN, 3, 1, 0));
    expect(sim.player.gym?.endsAt).toBe(on(LDN, 3, 1, 0));
    expect(sim.execute({ kind: 'gym.leave', payload: {} }).error).toMatch(/^You’ve given notice: it ends/);
    // Still a member, and billed for February; not for March.
    sim.advanceTo(on(LDN, 2, 20));
    expect(sim.player.gym).toBeDefined();
    expect(paidTo(sim, 'Third Space Islington, the month')).toBe(1);
    sim.advanceTo(on(LDN, 3, 20));
    expect(sim.player.gym).toBeUndefined();
    expect(paidTo(sim, 'Third Space Islington, the month')).toBe(1);
    expect(sim.universe.notifications.some((n) => n.title === 'Your Gym Membership Has Ended')).toBe(true);
  });

  it('gives back what joining PureGym paid inside its 14-day cooling-off, and after it charges the $60 buy-out, not the months', () => {
    const sim = life('gym-cooling-off');
    sim.advanceTo(at(12, 10));
    const g = gymById('puregym-park-slope')!;
    const core = g.tiers.find((t) => t.name === 'Core')!;
    const before = bank(sim);
    join(sim, g.id, 'Core');
    expect(before - bank(sim)).toBe(joiningCost(sim, g, core));
    sim.advanceBy(10 * MS_DAY);
    const r = sim.execute<{ paid: number; back: number }>({ kind: 'gym.leave', payload: {} });
    expect(r.value).toMatchObject({ paid: 0, back: joiningCost(sim, g, core) });
    // Back into the current account, as a posting of its own.
    const back = sim.universe.transactions.find((t) => t.memo === 'PureGym Park Slope, money back')!;
    expect(back.postings.find((q) => q.accountId === sim.player.primaryAccountId)!.amount).toBe(joiningCost(sim, g, core));
    expect(sim.player.gym).toBeUndefined();
    const later = life('gym-buy-out');
    later.advanceTo(at(12, 10));
    join(later, g.id, 'Core');
    later.advanceBy(40 * MS_DAY);
    expect(leavingCost(later, later.player)).toBe(usd(later, 60_00));
    const out = later.execute<{ paid: number; endsAt: number }>({ kind: 'gym.leave', payload: {} });
    expect(out.value!.paid).toBe(usd(later, 60_00));
    expect(out.value!.endsAt).toBe(later.now);
    expect(later.player.gym).toBeUndefined();
  });

  it('counts business days for PureGym’s notice past its term: seven weekdays from a Friday is the Tuesday week', () => {
    const sim = life('gym-business-days');
    sim.advanceTo(at(12, 10));
    join(sim, 'puregym-park-slope', 'Core');
    // Thirteen months on, the term is past; a Friday.
    sim.advanceTo(instantFromZoned({ year: 2027, month: 2, day: 19, hour: 10, minute: 0 }, NY));
    expect(new Date(Date.UTC(2027, 1, 19)).getUTCDay()).toBe(5);
    const r = sim.execute<{ paid: number; endsAt: number }>({ kind: 'gym.leave', payload: {} });
    expect(r.value!.paid).toBe(0);
    expect(r.value!.endsAt).toBe(instantFromZoned({ year: 2027, month: 3, day: 2, hour: 10, minute: 0 }, NY));
  });

  it('takes PureGym’s seven days before the next dues date: notice given exactly then, that month isn’t charged', () => {
    const sim = life('gym-dues-day');
    sim.advanceTo(at(12, 10));
    join(sim, 'puregym-park-slope', 'Premium, No Commitment');
    const dues = sim.player.gym!.since + YEAR / 12;
    sim.advanceTo(dues - 7 * MS_DAY);
    const r = sim.execute<{ endsAt: number }>({ kind: 'gym.leave', payload: {} });
    expect(r.value!.endsAt).toBe(dues);
    sim.advanceTo(dues + 3 * MS_DAY);
    expect(paidTo(sim, 'PureGym Park Slope, the month')).toBe(0);
    expect(sim.player.gym).toBeUndefined();
  });

  it('charges the YWCA’s $45 and runs its two weeks; leaves a gym that published nothing at once', () => {
    const VAN = 'America/Vancouver';
    const sim = lifeIn('ca-bc-vancouver', 'gym-ywca');
    sim.advanceTo(on(VAN, 1, 12));
    join(sim, 'ywca-health-fitness-vancouver', 'All-Inclusive');
    sim.advanceBy(40 * MS_DAY);
    const r = sim.execute<{ paid: number; endsAt: number }>({ kind: 'gym.leave', payload: {} });
    const cur = saveCurrency(sim.universe);
    expect(r.value!.paid).toBe(cur === 'CAD' ? 45_00 : exchange(45_00, 'CAD', cur)!);
    expect(r.value!.endsAt - sim.now).toBe(14 * MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === `${gymById('ywca-health-fitness-vancouver')!.name}, the cancellation fee`)).toBe(true);
    const ny = life('gym-nothing-published');
    ny.advanceTo(at(12, 10));
    join(ny, 'mcburney-ymca', 'Adult');
    expect(ny.execute<{ endsAt: number }>({ kind: 'gym.leave', payload: {} }).value!.endsAt).toBe(ny.now);
    expect(ny.player.gym).toBeUndefined();
  });
});
