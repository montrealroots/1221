/**
 * Living in a home (`systems/dwelling.ts`): the fixtures a home has by where
 * it is, the kinds of home, the clothes and the laundry, the state of the
 * place and a cleaner, a bath, a gym, a hot night without air conditioning,
 * and a landlord's deposit held to what each place's law allows.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { contactsOf, newContact } from '@/engine/systems/people';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { addCountryCities } from '@/engine/content/geography';
import type { Fixtures } from '@/engine/content/homes';
import { depositFor } from '@/engine/systems/household';
import { listingsIn } from '@/engine/systems/homes';
import { CLEANER_VISIT, LAUNDRY, TIDY, cleanerCost, cleanerGetsIn, drawRental, heatLoss, livingOf, placeOf } from '@/engine/systems/dwelling';
import { cleanOutfits, garmentsOf, washableDirty, wearTheDay } from '@/engine/systems/wardrobe';
import { applyLookingAfter, lookAfterRefusal } from '@/engine/systems/life';

function save(seed: string, city = 'us-ny-newyork', month = 1): Simulation {
  return quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'inherited', startYear: 2026, startMonth: month, startDay: 5 }, seed);
}

/** The place they rent, with these fixtures. */
function fitted(sim: Simulation, fixtures: Partial<Fixtures>): void {
  const unit = sim.player.home!.unit!;
  unit.fixtures = { ...unit.fixtures, ...fixtures };
}

const share = (list: boolean[]) => list.filter(Boolean).length / list.length;

describe('what a home has', () => {
  it('follows where it is: New York shares the building’s machines, London never does, Tokyo has a bath and air conditioning', () => {
    const sim = save('fixtures');
    const draw = (city: string) => Array.from({ length: 80 }, (_, n) => drawRental(sim, sim.player, city, false, n).fixtures);
    const ny = draw('us-ny-newyork');
    const london = draw('uk-eng-london');
    const tokyo = draw('jp-13-tokyo');
    expect(share(ny.map((f) => f.laundry === 'in-unit'))).toBeLessThan(0.5);
    expect(share(ny.map((f) => f.laundry === 'building'))).toBeGreaterThan(0.3);
    expect(share(london.map((f) => f.laundry !== 'none'))).toBeGreaterThan(0.9);
    expect(share(london.map((f) => f.laundry === 'building'))).toBe(0);
    expect(share(london.map((f) => f.cooling !== 'none'))).toBeLessThan(0.2);
    expect(share(tokyo.map((f) => f.bathtub))).toBeGreaterThan(0.8);
    expect(share(tokyo.map((f) => f.cooling !== 'none'))).toBeGreaterThan(0.8);
  });

  it('puts penthouses at the top of a big city’s market, and mansions at five thousand square feet and more', () => {
    const sim = save('kinds');
    const ny = listingsIn(sim, 'us-ny-newyork');
    expect(ny.some((h) => h.type === 'penthouse')).toBe(true);
    const penthouses = ny.filter((h) => h.type === 'penthouse');
    expect(Math.min(...penthouses.map((h) => h.rank))).toBeGreaterThan(40);
    expect(penthouses.every((h) => h.fixtures?.outdoor === 'terrace')).toBe(true);
    const mansions = [...listingsIn(sim, 'us-ct-newhaven'), ...ny].filter((h) => h.type === 'estate');
    expect(mansions.length).toBeGreaterThan(0);
    for (const m of mansions) expect(m.size).toBeGreaterThanOrEqual(5_000);
  });

  it('draws a rented place when they move in, and says what it has', () => {
    const sim = save('move');
    expect(sim.player.home?.unit).toBeDefined();
    expect(placeOf(sim, sim.player)?.fixtures).toEqual(sim.player.home!.unit!.fixtures);
  });
});

describe('clothes', () => {
  it('wash the way the home allows: the building’s machines for a fee, a rack overnight, or hours at the laundromat', () => {
    for (const laundry of ['building', 'washer-only', 'none'] as const) {
      const sim = save(`laundry-${laundry}`);
      fitted(sim, { laundry });
      // Eleven days worn from the wardrobe a life begins with.
      for (let i = 0; i < 11; i += 1) wearTheDay(sim, sim.player);
      const washing = washableDirty(sim, sim.player);
      expect(washing.length).toBeGreaterThan(0);
      const bank = () => sim.universe.accounts[sim.player.primaryAccountId!]!.balance;
      const before = bank();
      const start = sim.now;
      sim.must({ kind: 'life.look_after', payload: { action: 'laundry' } });
      expect(sim.now - start).toBe(LAUNDRY.minutes[laundry] * 60_000);
      expect(washableDirty(sim, sim.player)).toHaveLength(0);
      for (const g of washing) expect(g.garment.dryUntil! - sim.now).toBe(LAUNDRY.readyHours[laundry] * MS_HOUR);
      // The laundromat's dryers have it dry when they're done; a rack and a building's machines take their hours.
      expect(cleanOutfits(sim, sim.player) > 3).toBe(laundry === 'none');
      expect(before - bank() > 0).toBe(laundry !== 'washer-only');
    }
  });

  it('run out on working days, and a day without clean clothes weighs on the mood', () => {
    const day = (clean: boolean) => {
      const sim = save('worn');
      sim.player.living = { tidy: 90 };
      if (!clean) for (const g of garmentsOf(sim.player)) if (g.garment.slot === 'underwear') g.garment.dirty = true;
      // A long day of work behind them, so there was no time for the washing.
      sim.onSchedule('test.work', () => undefined);
      sim.schedule({ at: sim.now + 60_000, kind: 'test.work', label: 'A Long Day', category: 'career', requiresPlayer: true, durationMinutes: 600, payload: {} });
      sim.advanceBy(MS_DAY);
      return sim;
    };
    const worn = day(false);
    const fresh = day(true);
    expect(cleanOutfits(worn, worn.player)).toBe(0);
    expect(fresh.player.wellbeing.morale - worn.player.wellbeing.morale).toBeGreaterThan(0.5);
    expect(fresh.player.wellbeing.hygiene).toBeGreaterThan(worn.player.wellbeing.hygiene);
  });
});

describe('the place', () => {
  it('gets untidy, slower with a dishwasher, and a cleaner puts it right every week for a fee', () => {
    const decay = (dishwasher: boolean) => {
      const sim = save(`tidy-${dishwasher}`);
      fitted(sim, { dishwasher });
      // Without one, yesterday's dishes still in the sink (from 2026-10-03, `WASH_UP`).
      sim.player.living = { clean: 14, dirty: 0, drying: [], tidy: 100, ...(dishwasher ? {} : { dishes: 1 }) };
      sim.advanceBy(MS_DAY);
      return 100 - livingOf(sim.player).tidy;
    };
    expect(decay(true)).toBeLessThan(decay(false));
    const sim = save('cleaner');
    const cost = cleanerCost(sim, sim.player);
    expect(cost).toBeGreaterThan(0);
    sim.must({ kind: 'home.cleaner', payload: { on: true } });
    sim.player.living!.tidy = 45;
    // Day by day for a week: the cleaner leaves it spotless on their day, which a tidy-up of their own never does.
    let spotless = false;
    for (let d = 0; d < 8; d += 1) { sim.advanceBy(MS_DAY); if (livingOf(sim.player).tidy > TIDY.tidiedUp) spotless = true; }
    expect(spotless).toBe(true);
    const paid = Object.values(sim.universe.transactions).some((t) => t.memo === 'The cleaner');
    expect(paid).toBe(true);
    // And the visit is recorded, with what it cost (from 2026-10-03).
    const log = livingOf(sim.player).cleanerLog ?? [];
    expect(log.length).toBeGreaterThan(0);
    expect(log[0]!.paid ?? (log[0]!.shutOut ? 'shut' : 'unpaid')).toBe(cost);
  });

  it('a visit nobody let them in for is recorded as that, and not charged', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'cleaner-out');
    const p = sim.player;
    sim.must({ kind: 'home.cleaner', payload: { on: true } });
    // Held elsewhere through every visit, with no key.
    sim.onSchedule('test.busy', () => undefined);
    for (let d = 0; d < 9; d += 1) {
      const dayStart = sim.now - (sim.now % 86_400_000) + d * MS_DAY;
      sim.schedule({ at: dayStart + CLEANER_VISIT.hour * 3_600_000 - 3_600_000, kind: 'test.busy', label: 'Busy', category: 'career', priority: 10, requiresPlayer: true, durationMinutes: 600, payload: { personId: p.id } });
    }
    for (let d = 0; d < 8; d += 1) sim.advanceBy(MS_DAY);
    const log = livingOf(sim.player).cleanerLog ?? [];
    expect(log.length).toBeGreaterThan(0);
    expect(log[0]!.shutOut).toBe(true);
    expect(sim.universe.transactions.some((t) => t.memo === 'The cleaner')).toBe(false);
  });

  it('a mess weighs: stress climbs on working days in one, and not in a clean home', () => {
    const stressAfter = (tidy: number) => {
      const sim = save(`mess-${tidy}`);
      sim.player.living = { clean: 14, dirty: 0, drying: [], tidy };
      sim.player.wellbeing.stress = 30;
      sim.onSchedule('test.work', () => undefined);
    sim.schedule({ at: sim.now + 60_000, kind: 'test.work', label: 'A Long Day', category: 'career', requiresPlayer: true, durationMinutes: 600, payload: {} });
      sim.advanceBy(MS_DAY);
      return sim.player.wellbeing.stress;
    };
    expect(stressAfter(20)).toBeGreaterThan(stressAfter(95));
  });
});

describe('the bath, the gym, the heat', () => {
  it('offers a bath only where there’s a tub, and a soak takes off more stress than a shower', () => {
    const sim = save('bath');
    sim.player.wellbeing.hygiene = 40;
    fitted(sim, { bathtub: false });
    expect(lookAfterRefusal(sim, 'bathe')).toMatch(/no bath/);
    fitted(sim, { bathtub: true });
    expect(lookAfterRefusal(sim, 'bathe')).toBeUndefined();
    const a = structuredClone(sim.player);
    const b = structuredClone(sim.player);
    a.wellbeing.stress = 60; b.wellbeing.stress = 60;
    applyLookingAfter(a, 'bathe');
    applyLookingAfter(b, 'wash');
    expect(a.wellbeing.stress).toBeLessThan(b.wellbeing.stress);
  });

  it('builds more fitness in a gym than at home with nothing', () => {
    const sim = save('gym');
    const a = structuredClone(sim.player);
    const b = structuredClone(sim.player);
    applyLookingAfter(a, 'exercise', undefined, 1.2);
    applyLookingAfter(b, 'exercise', undefined, 1);
    expect(a.wellbeing.fitness).toBeGreaterThan(b.wellbeing.fitness);
  });

  it('sleeps a hot night worse without air conditioning, and not with central air', () => {
    addCountryCities('us', readFileSync('public/geo/us.tsv', 'utf8'));
    const sim = save('heat', 'us-az-phoenix', 7);
    const night = instantFromZoned({ year: 2026, month: 7, day: 10, hour: 23 }, 'America/Phoenix');
    fitted(sim, { cooling: 'none' });
    const none = Array.from({ length: 10 }, (_, n) => heatLoss(sim, sim.player, night + n * MS_DAY));
    fitted(sim, { cooling: 'central' });
    const central = Array.from({ length: 10 }, (_, n) => heatLoss(sim, sim.player, night + n * MS_DAY));
    expect(Math.max(...none)).toBeGreaterThan(0);
    expect(Math.max(...central)).toBe(0);
  });
});

describe('a deposit', () => {
  it('is held to a month in New York even for a poor record, and two months in Connecticut', () => {
    const ny = save('deposit-ny');
    ny.player.credit!.score = 550;
    const nyRent = depositFor(ny, { ...ny.player, credit: { ...ny.player.credit!, score: 800 } }, 'own');
    expect(depositFor(ny, ny.player, 'own')).toBe(nyRent);
    const ct = save('deposit-ct', 'us-ct-newhaven');
    const ctRent = depositFor(ct, { ...ct.player, credit: { ...ct.player.credit!, score: 800 } }, 'own');
    ct.player.credit!.score = 550;
    expect(depositFor(ct, ct.player, 'own')).toBe(ctRent * 2);
  });
});

describe('the cleaner’s key', () => {
  it('lets them in when nobody’s home; without it, a visit held up by a commitment is missed and not charged', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'cleaner-key');
    const p = sim.player;
    sim.must({ kind: 'home.cleaner', payload: { on: true, day: 5 } });
    const dayStart = sim.now - (sim.now % 86_400_000);
    // Home and free: they get in.
    expect(cleanerGetsIn(sim, p, dayStart)).toBe(true);
    // Held elsewhere through the visit, no key: they don't.
    sim.onSchedule('test.busy', () => undefined);
    sim.schedule({ at: dayStart + CLEANER_VISIT.hour * 3_600_000 - 3_600_000, kind: 'test.busy', label: 'Busy', category: 'career', priority: 10, requiresPlayer: true, durationMinutes: 600, payload: { personId: p.id } });
    expect(cleanerGetsIn(sim, p, dayStart)).toBe(false);
    sim.must({ kind: 'home.cleaner_key', payload: { give: true } });
    expect(cleanerGetsIn(sim, p, dayStart)).toBe(true);
    sim.must({ kind: 'home.cleaner_key', payload: { give: false } });
    expect(livingOf(p).cleaner!.key).toBeUndefined();
    // A partner who lives with you lets them in.
    const partner = newContact(sim, p, 'us-ny-newyork', 'cleaner-partner', { at: sim.now, how: 'school' });
    partner.livesWith = sim.now;
    contactsOf(p).push(partner);
    expect(cleanerGetsIn(sim, p, dayStart)).toBe(true);
    p.contacts = contactsOf(p).filter((c) => c.id !== partner.id);
    // Away from town with nothing on, no key: they don't.
    const away = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'cleaner-away');
    away.must({ kind: 'home.cleaner', payload: { on: true, day: 5 } });
    expect(cleanerGetsIn(away, away.player, dayStart)).toBe(true);
    away.player.currentLocationId = 'us-ca-losangeles';
    expect(cleanerGetsIn(away, away.player, dayStart)).toBe(false);
  });
});
