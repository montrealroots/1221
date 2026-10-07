/**
 * A friend who asks first (the master plan's §52.7–9, from 2026-10-06): a
 * friend in your home town asks you to a meal at seven, two to six days on;
 * said yes, it's kept like your own invitation, the meal paid at its price
 * and the hours counted; said no, or left to lapse, it's remembered and
 * they leave a fortnight before asking again. A rival, an acquaintance and
 * a friend in another town never ask.
 */
import { describe, expect, it } from 'vitest';
import { loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { breaches } from '@/engine/core/invariants';
import { ASKS, HALL } from '@/engine/content/people';
import { DINING_MINUTES } from '@/engine/content/dining';
import { contactsOf, declines, knowTheClass, type Contact } from '@/engine/systems/people';
import { diningQuote, restaurantById } from '@/engine/systems/dining';
import { askOdds, asksToday, mayAsk, whatTheyAsk } from '@/engine/systems/reachingout';

const NY = 'us-ny-newyork';
const life = (seed: string) => {
  const sim = quickSave({ startLocationId: NY, homeRegionId: NY, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  knowTheClass(sim, sim.player, [{ name: 'Maya Okafor', bond: 60 }, { name: 'Theo Reyes', bond: 10 }, { name: 'Ruth Adler', bond: -30 }]);
  return sim;
};
const banked = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
const named = (sim: Simulation, name: string): Contact => contactsOf(sim.player).find((c) => c.name === name)!;
/** Day by day until the friend asks, or the days run out. */
const untilAsked = (sim: Simulation, name: string, days: number) => {
  for (let d = 0; d < days && !named(sim, name).ask; d += 1) {
    sim.advanceBy(MS_DAY);
    // A meal asked for, here: from 2026-10-06 a friend may ask to other things, which another test reads.
    const c = named(sim, name);
    if (c.ask && c.ask.what !== 'meal') { delete c.ask; delete c.askedAt; }
  }
  return named(sim, name).ask;
};

describe('a friend who asks first', () => {
  it('asks a close friend to a meal at seven some days on; said yes, it is kept and paid like an invitation', () => {
    let sim = life('reach-yes');
    const ask = untilAsked(sim, 'Maya Okafor', 120);
    expect(ask).toBeDefined();
    const local = zonedParts(ask!.at, 'America/New_York');
    expect(local.hour).toBe(ASKS.hour);
    expect(ask!.at - ask!.made).toBeGreaterThan((ASKS.ahead.least - 1) * MS_DAY);
    expect(ask!.at - ask!.made).toBeLessThan((ASKS.ahead.most + 1) * MS_DAY);
    expect(sim.universe.notifications.some((n) => n.title === 'Maya Asked You Out To Eat')).toBe(true);
    // Saved and loaded, still asked.
    sim = loadSave(deserialise(serialise(sim.universe)) as never);
    const maya = named(sim, 'Maya Okafor');
    expect(maya.ask).toEqual(ask);
    const hours = maya.hours;
    const r = restaurantById(ask!.restaurantId!)!;
    const r1 = sim.must<{ at: number }>({ kind: 'social.answer', payload: { contactId: maya.id, yes: true } });
    expect(r1.at).toBe(ask!.at);
    expect(named(sim, 'Maya Okafor').ask).toBeUndefined();
    expect(sim.execute({ kind: 'social.answer', payload: { contactId: maya.id, yes: true } }).error).toBe('Maya hasn’t asked you to anything.');
    sim.advanceTo(ask!.at - MS_HOUR);
    const before = banked(sim);
    const price = diningQuote(sim, r, [ask!.item!], 'in')!.total;
    sim.advanceTo(ask!.at + 4 * MS_HOUR);
    // The meal at its price, and its hours together.
    expect(before - banked(sim)).toBe(price);
    expect(named(sim, 'Maya Okafor').hours).toBeCloseTo(hours + DINING_MINUTES[r.tier] / 60, 5);
    expect(named(sim, 'Maya Okafor').memory.some((m) => m.what === `A meal at ${r.name}, 7:00 PM`)).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('said no, or left, is remembered, and they wait a fortnight to ask again', () => {
    const sim = life('reach-no');
    const ask = untilAsked(sim, 'Maya Okafor', 120)!;
    const maya = named(sim, 'Maya Okafor');
    sim.must({ kind: 'social.answer', payload: { contactId: maya.id, yes: false } });
    const answered = sim.now;
    expect(maya.memory[0]!.what).toBe(`You said no to a meal at ${restaurantById(ask.restaurantId!)!.name}`);
    expect(sim.universe.scheduled.some((x) => x.status === 'pending' && x.kind === 'social.meet')).toBe(false);
    // No new ask inside the fortnight: not a lucky draw, they won't (`mayAsk`), and do once it's past.
    for (let d = 0; d < ASKS.pause - 1; d += 1) { sim.advanceBy(MS_DAY); expect(mayAsk(sim, sim.player, named(sim, 'Maya Okafor'))).toBe(false); }
    sim.advanceTo(answered + ASKS.pause * MS_DAY + MS_HOUR);
    expect(mayAsk(sim, sim.player, named(sim, 'Maya Okafor'))).toBe(true);
    // Asked again, and left: it lapses at its hour, remembered.
    const again = untilAsked(sim, 'Maya Okafor', 200)!;
    expect(again.made - answered).toBeGreaterThanOrEqual(ASKS.pause * MS_DAY - MS_DAY);
    sim.advanceTo(again.at + MS_DAY);
    expect(named(sim, 'Maya Okafor').ask).toBeUndefined();
    expect(named(sim, 'Maya Okafor').memory.some((m) => m.what === `Asked you to a meal at ${restaurantById(again.restaurantId!)!.name}; you never answered`)).toBe(true);
    expect(sim.execute({ kind: 'social.answer', payload: { contactId: 'nobody', yes: true } }).error).toBe('You don’t know them.');
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('never asks from a rival, an acquaintance, or a friend in another town', () => {
    const sim = life('reach-never');
    const theo = named(sim, 'Theo Reyes');
    theo.hours = HALL.casual - 1;
    const far = named(sim, 'Maya Okafor');
    far.cityId = 'uk-eng-london';
    for (let d = 0; d < 150; d += 1) sim.advanceBy(MS_DAY);
    // The falsifiability test: the same friend, near, asks within the same stretch above.
    for (const c of contactsOf(sim.player)) expect(c.memory.some((m) => m.what.startsWith('Asked you to'))).toBe(false);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('doesn’t ask with a meeting on the calendar, inside three days of one, or a week of being stood up', () => {
    const sim = life('reach-rules');
    const ask = untilAsked(sim, 'Maya Okafor', 120)!;
    const maya = () => named(sim, 'Maya Okafor');
    sim.must({ kind: 'social.answer', payload: { contactId: maya().id, yes: true } });
    // The fortnight set as passed, the meal still on the calendar: the meeting alone holds it.
    const meet = sim.universe.scheduled.find((x) => x.status === 'pending' && x.kind === 'social.meet')!;
    expect(meet.at).toBe(ask.at);
    maya().askedAt = sim.now - ASKS.pause * MS_DAY;
    expect(mayAsk(sim, sim.player, maya())).toBe(false);
    sim.advanceTo(ask.at + 4 * MS_HOUR);
    // Seen: three days' rest.
    maya().askedAt = undefined;
    expect(mayAsk(sim, sim.player, maya())).toBe(false);
    sim.advanceTo(ask.at + 3 * MS_DAY + MS_HOUR);
    expect(mayAsk(sim, sim.player, maya())).toBe(true);
    // Stood up: a week.
    maya().stoodUp = sim.now;
    expect(mayAsk(sim, sim.player, maya())).toBe(false);
    sim.advanceBy(7 * MS_DAY + MS_HOUR);
    expect(mayAsk(sim, sim.player, maya())).toBe(true);
    expect(breaches(sim.universe)).toEqual([]);
  });

  it('asks to a visit, a game on your court or a class too, only one they’d say yes to themselves', () => {
    const sim = life('reach-kinds');
    const maya = named(sim, 'Maya Okafor');
    const kinds = new Map<string, number>();
    for (let d = 0; d < 200; d += 1) {
      const a = whatTheyAsk(sim, maya, `kinds-${d}`);
      if (!a) continue;
      kinds.set(a.what!, (kinds.get(a.what!) ?? 0) + 1);
      if (a.what !== 'meal') expect(declines(sim.player, maya, { contactId: maya.id, at: a.at, what: a.what!, ...(a.classId ? { classId: a.classId } : {}), ...(a.court ? { court: a.court } : {}) }, sim)).toBeUndefined();
    }
    expect(kinds.get('meal') ?? 0).toBeGreaterThan(0);
    expect(kinds.get('visit') ?? 0).toBeGreaterThan(0);
    // Without a home of your own to come to, no visit is asked.
    sim.player.home = { ...sim.player.home!, kind: 'sofa' } as never;
    for (let d = 0; d < 50; d += 1) expect(whatTheyAsk(sim, maya, `sofa-${d}`)?.what).not.toBe('visit');
  });

  it('a visit asked and said yes to is on the calendar as your own would be', () => {
    const sim = life('reach-visit');
    const maya = named(sim, 'Maya Okafor');
    const day = Array.from({ length: 200 }, (_, d) => `v-${d}`).find((k) => whatTheyAsk(sim, maya, k)?.what === 'visit')!;
    maya.ask = whatTheyAsk(sim, maya, day)!;
    sim.must({ kind: 'social.answer', payload: { contactId: maya.id, yes: true } });
    expect(maya.memory[0]!.what).toBe('You said yes to a visit to your home');
    const meet = sim.universe.scheduled.find((x) => x.status === 'pending' && x.kind === 'social.meet')!;
    expect(meet.label).toBe('Maya Comes Over');
    expect(meet.payload.what).toBe('visit');
  });

  it('asks at about its odds a day: a close friend near one a fortnight, a casual one far less', () => {
    const sim = life('reach-odds');
    const close = named(sim, 'Maya Okafor');
    const casual = { ...named(sim, 'Theo Reyes'), hours: HALL.casual };
    const count = (c: Contact) => Array.from({ length: 2_000 }, (_, d) => asksToday(sim, c, `day-${d}`)).filter(Boolean).length;
    expect(askOdds(close)).toBeCloseTo(ASKS.weekly.close / 7, 10);
    const n = count(close);
    expect(n).toBeGreaterThan(2_000 * askOdds(close) * 0.75);
    expect(n).toBeLessThan(2_000 * askOdds(close) * 1.25);
    expect(count(casual)).toBeLessThan(n / 2);
  });
});
