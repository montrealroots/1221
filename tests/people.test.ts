/**
 * The people a life knows (`systems/people.ts`, `content/people.ts`, from
 * 2026-10-01): the class known at the degree by its bonds, a castmate from
 * a job named as their country names people, an invitation answered yes or
 * no for a stated reason, time together that makes a friend, a meeting
 * missed and remembered, and living alone in the life table.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { HALL, NAMES } from '@/engine/content/people';
import { RESTAURANTS } from '@/engine/content/restaurants';
import { contactsOf, declines, inviteRefusal, knowTheClass, levelOf, livesAlone, livingFactor, metAtWork, type Contact, type Invitation } from '@/engine/systems/people';
import { diningQuote } from '@/engine/systems/dining';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const NY = 'America/New_York';
/** An evening a few days on, at an hour, in New York. */
const evening = (sim: Simulation, days: number, hour = 19) => { const p = zonedParts(sim.now + days * MS_DAY, NY); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, NY); };
const priced = (city: string, tier: string) => RESTAURANTS.find((r) => r.cityId === city && r.tier === tier && r.menu.some((m) => m.price !== null))!;
const meal = (c: Contact, at: number, r = priced('us-ny-newyork', 'casual')): Invitation => ({ contactId: c.id, at, what: 'meal', restaurantId: r.id, item: r.menu.find((m) => m.price !== null)!.item });
const bank = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal).reduce((t, a) => t + a.balance, 0);

describe('who you know', () => {
  it('is the class at the degree, each as near as the three years made them', () => {
    const sim = life('us-ny-newyork', 'pp-class');
    knowTheClass(sim, sim.player, [{ name: 'Maya Okafor', bond: 60 }, { name: 'Theo Reyes', bond: 30 }, { name: 'Grace Chen', bond: 0 }, { name: 'Owen Park', bond: -25 }]);
    const c = contactsOf(sim.player);
    expect(c.map((x) => [x.name, x.hours, levelOf(x)])).toEqual([
      ['Maya Okafor', HALL.close, 'Close Friend'], ['Theo Reyes', HALL.friend, 'Friend'], ['Grace Chen', HALL.casual, 'Casual Friend'], ['Owen Park', HALL.casual, 'Rival'],
    ]);
    expect(c.every((x) => x.cityId === 'us-ny-newyork' && x.met.how === 'school')).toBe(true);
  });

  it('is a castmate from a job, named as their country names people', () => {
    const sim = life('uk-eng-london', 'pp-work');
    const c = metAtWork(sim, sim.player, 'uk-eng-london', 'b1', 'Guest Star');
    const [given, family] = c.name.split(' ');
    expect([...NAMES.uk.female, ...NAMES.uk.male]).toContain(given);
    expect(NAMES.uk.family).toContain(family);
    expect(c).toMatchObject({ cityId: 'uk-eng-london', hours: 0, met: { how: 'work', what: 'Guest Star' } });
    expect(levelOf(c)).toBe('Acquaintance');
    expect(Math.abs(c.born - sim.player.birthInstant)).toBeLessThanOrEqual(5 * 365.2425 * MS_DAY);
  });
});

describe('an invitation', () => {
  const friend = (sim: Simulation, hours: number = HALL.friend): Contact => { const c = metAtWork(sim, sim.player, 'us-ny-newyork', `b-${hours}`, 'A Job'); c.hours = hours; c.spends = 'mid'; return c; };

  it('is answered no, and says why', () => {
    const sim = life('us-ny-newyork', 'pp-no');
    const c = friend(sim);
    const at = evening(sim, 3);
    const first = c.name.split(' ')[0];
    expect(declines(sim.player, c, meal(c, at))).toBeUndefined();
    expect(declines(sim.player, { ...c, rival: true }, meal(c, at))).toBe(`${first} would rather not.`);
    expect(declines(sim.player, { ...c, cityId: 'us-ca-losangeles' }, meal(c, at))).toBe(`${first} lives in Los Angeles.`);
    expect(declines(sim.player, { ...c, hours: HALL.casual - 1 }, { contactId: c.id, at, what: 'visit' })).toMatch(/know you well enough/);
    expect(declines(sim.player, { ...c, hours: HALL.casual }, { contactId: c.id, at, what: 'visit' })).toBeUndefined();
    expect(declines(sim.player, c, meal(c, evening(sim, 3, 9)))).toBe(`That’s too early for ${first}.`);
    expect(declines(sim.player, c, meal(c, evening(sim, 3, 10)))).toBeUndefined();
    expect(declines(sim.player, c, meal(c, evening(sim, 3, 22)))).toBe(`That’s too late for ${first}.`);
    expect(declines(sim.player, c, meal(c, evening(sim, 3, 21)))).toBeUndefined();
    const dear = priced('us-ny-newyork', 'upscale');
    expect(declines(sim.player, c, meal(c, at, dear))).toBe(`${dear.name} is more than ${first} would spend.`);
    expect(declines(sim.player, { ...c, spends: 'upscale' }, meal(c, at, dear))).toBeUndefined();
    expect(declines(sim.player, { ...c, lastSeen: at - 2 * MS_DAY }, meal(c, at))).toMatch(/another time/);
    expect(declines(sim.player, { ...c, lastSeen: at - 3 * MS_DAY }, meal(c, at))).toBeUndefined();
    expect(declines(sim.player, { ...c, stoodUp: at - 6 * MS_DAY }, meal(c, at))).toMatch(/didn’t come last time/);
    expect(declines(sim.player, { ...c, stoodUp: at - 7 * MS_DAY }, meal(c, at))).toBeUndefined();
  });

  it('isn’t made for a time gone, without a dish, or over another commitment', () => {
    const sim = life('us-ny-newyork', 'pp-ref');
    const c = friend(sim);
    expect(inviteRefusal(sim, sim.player, meal(c, sim.now - 1))).toBe('Choose a time to come.');
    // To come over, there has to be a home: not a friend's sofa.
    expect(inviteRefusal(sim, sim.player, { contactId: c.id, at: evening(sim, 3), what: 'visit' })).toBeUndefined();
    sim.player.home = { ...sim.player.home!, kind: 'sofa' };
    expect(inviteRefusal(sim, sim.player, { contactId: c.id, at: evening(sim, 3), what: 'visit' })).toBe('You have no home of your own to ask them to.');
    sim.player.home = { ...sim.player.home, kind: 'shared' };
    expect(inviteRefusal(sim, sim.player, { ...meal(c, evening(sim, 3)), item: 'A Thing Not On The Menu' })).toMatch(/Choose what you’ll have/);
    const at = evening(sim, 3);
    sim.schedule({ at: at - 30 * 60_000, kind: 'social.meet', label: 'A Rehearsal', category: 'career', priority: 30, requiresPlayer: true, durationMinutes: 120, payload: { personId: sim.player.id } });
    expect(inviteRefusal(sim, sim.player, meal(c, at))).toBe('You have A Rehearsal then.');
  });

  it('said yes, is kept: the hours added, your meal paid, the mood lifted, and remembered', () => {
    const sim = life('us-ny-newyork', 'pp-yes');
    const c = friend(sim, 40);
    const inv = meal(c, evening(sim, 2));
    const r = sim.execute<{ accepted: boolean }>({ kind: 'social.invite', payload: { ...inv } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.accepted).toBe(true);
    const restaurant = RESTAURANTS.find((x) => x.id === inv.restaurantId)!;
    sim.advanceTo(inv.at - 60_000);
    sim.player.currentLocationId = 'us-ny-newyork';
    sim.player.wellbeing.morale = 50;
    sim.player.wellbeing.nourishment = 30;
    sim.player.wellbeing.stress = 60;
    const before = bank(sim);
    sim.advanceTo(inv.at + 1);
    const minutes = { fast: 20, casual: 50, mid: 80, upscale: 150 }[restaurant.tier];
    expect(c.hours).toBeCloseTo(40 + minutes / 60, 9);
    expect(c.lastSeen).toBe(inv.at);
    expect(before - bank(sim)).toBe(diningQuote(sim, restaurant, [inv.item!], 'in')!.total);
    expect(sim.player.wellbeing.morale).toBeGreaterThan(50);
    expect(sim.player.wellbeing.stress).toBeLessThan(60);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(30);
    expect(c.memory[0]!.what).toMatch(new RegExp(`A meal at ${restaurant.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });

  it('said no, puts nothing on the calendar', () => {
    const sim = life('us-ny-newyork', 'pp-said-no');
    const c = friend(sim);
    c.rival = true;
    const r = sim.execute<{ accepted: boolean; reason: string }>({ kind: 'social.invite', payload: { ...meal(c, evening(sim, 2)) } });
    expect(r.value).toEqual({ accepted: false, reason: `${c.name.split(' ')[0]} would rather not.` });
    expect(sim.universe.scheduled.some((x) => x.kind === 'social.meet' && x.status === 'pending')).toBe(false);
    expect(c.memory[0]!.what).toMatch(/^Said no to a meal at/);
  });

  it('kept at home eases stress and lifts the mood, against the same visit missed', () => {
    const visit = (there: boolean) => {
      const sim = life('us-ny-newyork', 'pp-visit');
      const c = friend(sim, HALL.friend);
      const at = evening(sim, 2);
      expect(sim.execute({ kind: 'social.invite', payload: { contactId: c.id, at, what: 'visit' } }).ok).toBe(true);
      sim.advanceTo(at - 60_000);
      sim.player.currentLocationId = there ? 'us-ny-newyork' : 'us-ct-newhaven';
      Object.assign(sim.player.wellbeing, { stress: 60, morale: 50 });
      sim.advanceTo(at + 1);
      return { stress: sim.player.wellbeing.stress, morale: sim.player.wellbeing.morale, hours: c.hours };
    };
    const kept = visit(true);
    const missed = visit(false);
    expect(missed.stress - kept.stress).toBeCloseTo(3, 1);
    expect(kept.morale).toBeGreaterThan(missed.morale);
    expect(kept.hours - missed.hours).toBe(2);
  });

  it('missed, is remembered, and adds no hours', () => {
    const sim = life('us-ny-newyork', 'pp-missed');
    const c = friend(sim, 40);
    const inv = meal(c, evening(sim, 2));
    expect(sim.execute({ kind: 'social.invite', payload: { ...inv } }).ok).toBe(true);
    sim.advanceTo(inv.at - 60_000);
    sim.player.currentLocationId = 'us-ct-newhaven';
    sim.advanceTo(inv.at + 1);
    expect(c.hours).toBe(40);
    expect(c.stoodUp).toBe(inv.at);
    expect(c.memory[0]!.what).toBe('You didn’t come');
  });
});

describe('living alone', () => {
  it('is a place of your own with nobody in its spare rooms, and weighs on the life table', () => {
    const sim = life('us-ny-newyork', 'pp-alone');
    const p = sim.player;
    const spread = 1 + 0.32 * 38.5 / 262;
    p.home = { ...p.home!, kind: 'shared' };
    expect(livesAlone(p)).toBe(false);
    expect(livingFactor(p)).toBeCloseTo(1 / spread, 12);
    p.home = { ...p.home, kind: 'own' };
    expect(livesAlone(p)).toBe(true);
    expect(livingFactor(p)).toBeCloseTo(1.32 / spread, 12);
    p.home = { ...p.home, kind: 'sofa' };
    expect(livesAlone(p)).toBe(false);
    p.homes = [{ id: 'h1', lodgers: [{}] } as never];
    p.home = { ...p.home, kind: 'owned', homeId: 'h1' };
    expect(livesAlone(p)).toBe(false);
    p.homes = [{ id: 'h1', lodgers: [] } as never];
    expect(livesAlone(p)).toBe(true);
  });
});
