/**
 * A soup kitchen, a pantry or a food bank for someone the bank can't feed
 * (`systems/foodhelp.ts`, `content/foodhelp.ts`, from 2026-10-01): each
 * city's published help, and a day fed or eaten short by it.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { mealsFromHelp } from '@/engine/systems/foodhelp';
import { buyTheDaysFood } from '@/engine/systems/household';
import { settle } from '@/engine/systems/body';

const DAY = 86_400_000;
const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true }, seed);
const broke = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal) { if (a.balance > 0) a.balance = 0; if (a.kind === 'credit_card') a.creditLimit = 0; if (a.kind === 'checking') a.balance = -1_000_000_00; } };
// Noon UTC on a Monday, 5 October 2026, and the days after it.
const MONDAY = Date.UTC(2026, 9, 5, 17);

describe('help where they are', () => {
  it('gives New York’s weekday lunch and a pantry’s nine meals every fourteen days', () => {
    const sim = life('us-ny-newyork', 'fh-ny');
    // Monday: the lunch, and the pantry's package, two of it taken.
    expect(mealsFromHelp(sim, sim.player, MONDAY)).toBe(3);
    expect(sim.player.foodHelp!.store).toBe(7);
    // Saturday: no kitchen, three from the store.
    expect(mealsFromHelp(sim, sim.player, MONDAY + 5 * DAY)).toBe(3);
    expect(sim.player.foodHelp!.store).toBe(4);
    for (let d = 6; d < 9; d += 1) mealsFromHelp(sim, sim.player, MONDAY + d * DAY);
    // The store gone and the fortnight not, a weekday is the lunch alone.
    expect(sim.player.foodHelp!.store).toBe(0);
    expect(mealsFromHelp(sim, sim.player, MONDAY + 10 * DAY)).toBe(1);
    expect(mealsFromHelp(sim, sim.player, MONDAY + 12 * DAY)).toBe(0);
    // Fourteen days on, another package.
    expect(mealsFromHelp(sim, sim.player, MONDAY + 14 * DAY)).toBe(3);
  });

  it('feeds three a day in Los Angeles, one in New Haven, two in Dublin but on Sunday, and nothing where none is kept', () => {
    const la = life('us-ca-losangeles', 'fh-la');
    expect(mealsFromHelp(la, la.player, MONDAY + 6 * DAY)).toBe(3);
    const nh = life('us-ct-newhaven', 'fh-nh');
    expect(mealsFromHelp(nh, nh.player, MONDAY)).toBe(1);
    const dub = life('ie-lei-dublin', 'fh-dub');
    expect(mealsFromHelp(dub, dub.player, MONDAY)).toBe(2);
    expect(mealsFromHelp(dub, dub.player, MONDAY + 6 * DAY)).toBe(0);
    const van = life('ca-bc-vancouver', 'fh-van');
    expect(mealsFromHelp(van, van.player, MONDAY)).toBe(0);
  });

  it('gives a Trussell parcel three times in six months, and Daily Bread weekly', () => {
    const sim = life('uk-eng-london', 'fh-ldn');
    let parcels = 0;
    for (let d = 0; d < 180; d += 1) { const before = sim.player.foodHelp?.visits.length ?? 0; mealsFromHelp(sim, sim.player, MONDAY + d * DAY); if ((sim.player.foodHelp?.visits.length ?? 0) > before) parcels += 1; }
    expect(parcels).toBe(3);
    const to = life('ca-on-toronto', 'fh-to');
    let visits = 0;
    for (let d = 0; d < 28; d += 1) { const before = to.player.foodHelp?.visits.length ?? 0; mealsFromHelp(to, to.player, MONDAY + d * DAY); if ((to.player.foodHelp?.visits.length ?? 0) > before) visits += 1; }
    expect(visits).toBe(4);
  });

  it('charges Mexico City’s comedor MXN 11 where the bank has it', () => {
    const sim = life('mx-cmx-mexicocity', 'fh-mx');
    expect(mealsFromHelp(sim, sim.player, MONDAY)).toBe(1);
    const meal = sim.universe.transactions.find((t) => t.memo === 'A meal at a comedor comunitario')!;
    const cur = saveCurrency(sim.universe);
    expect(meal.postings.find((p) => p.amount > 0)!.amount).toBe(cur === 'MXN' ? 11_00 : exchange(11_00, 'MXN', cur));
    expect(mealsFromHelp(sim, sim.player, MONDAY + 5 * DAY)).toBe(0);
  });
});

describe('a day the bank can’t pay for', () => {
  it('is fed by three meals of help, and eaten short by fewer, the help’s share on top of a broke day’s', () => {
    const la = life('us-ca-losangeles', 'fh-day-la');
    broke(la);
    expect(buyTheDaysFood(la, la.player)).toBe(true);
    expect(la.player.home!.fedOn).toBe(la.now);
    const nh = life('us-ct-newhaven', 'fh-day-nh');
    broke(nh);
    expect(buyTheDaysFood(nh, nh.player)).toBe(false);
    expect(nh.player.foodHelp!.today).toBe(1);
    const van = life('ca-bc-vancouver', 'fh-day-van');
    broke(van);
    expect(buyTheDaysFood(van, van.player)).toBe(false);
    expect(van.player.foodHelp!.today).toBe(0);
  });

  it('fetches a pantry’s package only once the last is eaten', () => {
    const sim = life('us-ny-newyork', 'fh-store');
    sim.player.foodHelp = { store: 5, visits: [MONDAY - 20 * DAY] };
    // Saturday, no kitchen: three of the five left, and no new package though the fortnight's past.
    expect(mealsFromHelp(sim, sim.player, MONDAY + 5 * DAY)).toBe(3);
    expect(sim.player.foodHelp.visits).toHaveLength(1);
    expect(sim.player.foodHelp.store).toBe(2);
  });

  it('keeps a broke life fed by one meal a day heavier than one fed by none', () => {
    const run = (city: string, seed: string) => {
      const sim = life(city, seed);
      broke(sim);
      // The same body in each, to weigh the plate alone.
      sim.player.body = settle({ heightCm: 170, weightKg: 70 }, sim.player, sim.now);
      const start = sim.player.body.weightKg;
      for (let d = 0; d < 60; d += 1) { broke(sim); sim.advanceBy(DAY); }
      return start - sim.player.body!.weightKg;
    };
    // New Haven's evening meal against Vancouver's nothing kept.
    expect(run('us-ct-newhaven', 'fh-weight')).toBeLessThan(run('ca-bc-vancouver', 'fh-weight'));
  });
});
