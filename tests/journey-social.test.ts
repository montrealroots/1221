/**
 * The long-term scenarios of the social life and the plays (from
 * 2026-10-09), each through public commands. What isn't a command is said:
 * the setup lines are marked SETUP, and nothing under test is set by hand.
 *
 * The rest of the list is held elsewhere: overlapping obligations and
 * another time offered (`school-social.test.ts`), declines, cancellations
 * and repair (`school-social.test.ts`, `classmates.test.ts`), classmates in
 * distinct parts, booked elsewhere, and a part replaced without a second
 * credit or pay (`collaborators.test.ts`), study material read, researched
 * and read again, and the facts kept apart from anything played
 * (`playreading.test.ts`). The lives over years are `tools/social-lives.mjs`.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import { CLASS_SOCIAL, contactsOf, type Contact } from '@/engine/systems/people';
import { CLASS } from '@/engine/systems/classmates';
import { bondMove } from '@/engine/systems/school';
import { NEW_HAVEN_OUTINGS } from '@/engine/systems/people';
import { auditionLevel, roleById } from '@/engine/systems/career';
import { railRoutes } from '@/engine/systems/rail';
import { planBy } from '@/engine/systems/journey';

const zone = 'America/New_York';
const at = (month: number, day: number, hour = 9, year = 2026) => instantFromZoned({ year, month, day, hour, minute: 0 }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** SETUP: the body kept going between the steps under test (sleep and meals aren't what's tested here). */
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const classmateOf = (sim: Simulation, i = 0): Contact => contactsOf(sim.player).find((c) => c.classmate === i)!;

describe('a plan and a trip at once', () => {
  it('a coffee said yes to, then a night in New York booked over it: missed, remembered, and made right in New Haven', () => {
    let sim = life('js-trip');
    tended(sim, at(9, 1, 12));
    const c = classmateOf(sim);
    const b0 = sim.player.school!.classmates[0]!.bond ?? 0;
    // Sunday the sixth, seven in the evening: no classes, no shift.
    expect(sim.must<{ accepted: boolean }>({ kind: 'social.invite', payload: { contactId: c.id, at: at(9, 6, 19), what: 'coffee' } }).accepted).toBe(true);
    // The trip is booked like any other, by train, and paid.
    const route = railRoutes('us-ct-newhaven', 'us-ny-newyork').find((r) => r.id === 'mnr-nhv-gct')!;
    // A train at midday, in New York by the afternoon, back on Monday (Labor Day): the calendar refuses a journey over a plan, not being in another town at its hour.
    const slot = (day: number, after: number) => Array.from({ length: route.perDay }, (_, i) => i).find((i) => { const legs = planBy(sim, route.id, 'us-ct-newhaven', 'us-ny-newyork', day, i, 0); return typeof legs !== 'string' && legs[0]!.departAt >= after; })!;
    sim.must({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day: at(9, 6, 0), by: route.id, slot: slot(at(9, 6, 0), at(9, 6, 12)), returnDay: at(9, 7, 0), returnSlot: slot(at(9, 7, 0), at(9, 7, 12)) } });
    sim = reload(sim);
    tended(sim, at(9, 6, 21));
    expect(classmateOf(sim).stoodUp).toBe(at(9, 6, 19));
    expect(classmateOf(sim).memory[0]!.what).toBe('You didn’t come');
    expect(sim.player.school!.classmates[0]!.bond).toBeCloseTo(b0 + bondMove(sim.player, CLASS_SOCIAL.missed), 5);
    // Not from New York: they're in New Haven.
    expect(sim.execute({ kind: 'school.make_amends', payload: { mate: 0 } }).error).toMatch(/is in New Haven/);
    tended(sim, at(9, 7, 21));
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    sim.must({ kind: 'school.make_amends', payload: { mate: 0 } });
    // Back by what the miss took, short of where it was: a miss costs more than an apology gives.
    expect(sim.player.school!.classmates[0]!.bond).toBeCloseTo(b0 + bondMove(sim.player, CLASS_SOCIAL.missed) + bondMove(sim.player, CLASS.amends.missed.bond), 5);
    expect(sim.player.school!.classmates[0]!.bond!).toBeLessThan(b0 + 1e-9);
    expect(classmateOf(sim).stoodUp).toBeUndefined();
    expect(sim.execute({ kind: 'school.make_amends', payload: { mate: 0 } }).error).toBe('There’s nothing between you to make right.');
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a day there and back', () => {
  it('a Sunday in New York, back that night, asks no hotel and is paid as the trains alone; one way still asks for a bed', () => {
    const sim = life('js-daytrip');
    tended(sim, at(9, 1, 12));
    const route = railRoutes('us-ct-newhaven', 'us-ny-newyork').find((r) => r.id === 'mnr-nhv-gct')!;
    const slot = (day: number, after: number) => Array.from({ length: route.perDay }, (_, i) => i).find((i) => { const legs = planBy(sim, route.id, 'us-ct-newhaven', 'us-ny-newyork', day, i, 0); return typeof legs !== 'string' && legs[0]!.departAt >= after; })!;
    expect(sim.execute({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day: at(9, 6, 0), by: route.id, slot: slot(at(9, 6, 0), at(9, 6, 10)) } }).error).toMatch(/Somewhere to sleep/);
    const trip = sim.must<{ journeyId: string; total: number }>({ kind: 'travel.book', payload: { toCity: 'us-ny-newyork', day: at(9, 6, 0), by: route.id, slot: slot(at(9, 6, 0), at(9, 6, 10)), returnDay: at(9, 6, 0), returnSlot: slot(at(9, 6, 0), at(9, 6, 17)) } });
    const j = sim.player.journeys!.find((x) => x.id === trip.journeyId)!;
    expect(j.hotel).toBeUndefined();
    tended(sim, at(9, 6, 15));
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    tended(sim, at(9, 6, 23));
    expect(sim.player.currentLocationId).toBe('us-ct-newhaven');
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('with no money', () => {
  it('a coffee kept is still paid, owed where the bank can’t: nothing is free', () => {
    const sim = life('js-broke');
    tended(sim, at(9, 1, 12));
    // SETUP: the money spent elsewhere first.
    for (const a of Object.values(sim.universe.accounts).filter((x) => x.ownerId === sim.player.id && (x.kind === 'checking' || x.kind === 'savings' || x.kind === 'cash') && x.balance > 0)) {
      sim.post({ memo: 'SETUP: spent elsewhere', category: 'personal', postings: [{ accountId: sim.nominalAccount('expense', 'Personal').id, amount: a.balance }, { accountId: a.id, amount: -a.balance }] });
    }
    const c = classmateOf(sim);
    sim.must({ kind: 'social.invite', payload: { contactId: c.id, at: at(9, 2, 19), what: 'coffee' } });
    tended(sim, at(9, 2, 21));
    const paid = sim.universe.transactions.filter((t) => t.memo === 'Atticus Market, a coffee');
    expect(paid).toHaveLength(1);
    expect(paid[0]!.postings.filter((p) => p.amount > 0).reduce((n, p) => n + p.amount, 0)).toBe(NEW_HAVEN_OUTINGS.coffee.price);
    expect(breaches(sim.universe)).toEqual([]);
  });
});

describe('a save from before', () => {
  it('without plays read or productions loads and carries on: the plays read from nothing, the credits kept as they were', () => {
    const sim = life('js-old');
    tended(sim, at(9, 5, 18));
    sim.must({ kind: 'plays.read', payload: { playId: 'proof' } });
    // SETUP: the fields this work added, taken out, as a save from before has them.
    const raw = JSON.parse(serialise(sim.universe));
    for (const p of Object.values(raw.people) as { plays?: unknown; career?: { productions?: unknown } }[]) { delete p.plays; if (p.career) delete p.career.productions; }
    const old = loadSave(deserialise(JSON.stringify(raw)) as never);
    expect(old.player.plays).toBeUndefined();
    const r = old.must<{ note: string }>({ kind: 'plays.read', payload: { playId: 'proof' } });
    expect(r.note.startsWith('Proof, by David Auburn, read through.')).toBe(true);
    expect(breaches(old.universe)).toEqual([]);
  });
});

describe('the plays, by the screens’ way', () => {
  it('after the degree: moved to New York, a library card, a play read and researched, kept through a save, and the room reads the craft', () => {
    let sim = life('js-plays');
    tended(sim, at(9, 5, 18));
    // SETUP: the degree, which takes three years to come by.
    sim.player.school!.standing = 'graduated';
    expect(sim.execute({ kind: 'plays.read', payload: { playId: 'sweat' } }).error).toBe('A copy is borrowed from a library: a card where you live (Belongings).');
    sim.must({ kind: 'career.relocate', payload: { cityId: 'us-ny-newyork', kind: 'shared' } });
    tended(sim, sim.now + MS_DAY);
    expect(sim.player.home?.cityId).toBe('us-ny-newyork');
    sim.must({ kind: 'reading.library_card', payload: {} });
    const role = roleById('lort-b');
    const before = auditionLevel(sim.player.craft!, role, 'room');
    sim.must({ kind: 'plays.read', payload: { playId: 'sweat' } });
    sim.must({ kind: 'plays.research', payload: { playId: 'sweat' } });
    sim = reload(sim);
    const s = sim.player.plays!['sweat']!;
    expect([s.reads, Boolean(s.researchedAt), s.notes.length]).toEqual([1, true, 2]);
    expect(auditionLevel(sim.player.craft!, role, 'room')).toBeGreaterThan(before);
    expect(breaches(sim.universe)).toEqual([]);
  });
});
