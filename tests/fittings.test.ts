/**
 * A wardrobe fitting before screen work, and an actor's own wardrobe lent to
 * the production (`FITTING` and `fittingFor` in `systems/career.ts`,
 * `systems/fittings.ts`, from 2026-10-01): each union's fitting pay, the
 * fitting on the calendar and its pay with the job's, the allowance an
 * outfit a week, the clothes out of reach while lent and back worn.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { FITTING_KIND, beginCareer, careerOf, fittingFor, unitRate, type Booking } from '@/engine/systems/career';
import { allowanceFor, furnishRefusal, wardrobeBack } from '@/engine/systems/fittings';
import { garmentsOf } from '@/engine/systems/wardrobe';
import { reachable } from '@/engine/systems/items';
import { evenCraft } from '@/engine/systems/school';

const NY = 'America/New_York';
function pro(city: string, seed: string): Simulation {
  const sim = quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
  sim.player.craft = evenCraft(75);
  beginCareer(sim, sim.player);
  return sim;
}
function offer(sim: Simulation, roleId: string, cityId: string, units = 2): Booking {
  const career = careerOf(sim.player);
  const starts = instantFromZoned({ ...zonedParts(sim.now + 10 * MS_DAY, NY), hour: 7, minute: 0 }, NY);
  const b: Booking = { id: `f${career.bookings.length}`, roleId, cityId: cityId as Booking['cityId'], starts, units, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 2 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
  career.bookings.push(b);
  return b;
}
/** An outfit saved from the clothes a life begins with. */
function outfit(sim: Simulation, name: string, kinds: string[]): string {
  const g = garmentsOf(sim.player);
  const ids = kinds.map((k) => g.find((x) => x.garment.kind === k)!.id);
  return sim.must<{ outfitId: string }>({ kind: 'clothes.save_outfit', payload: { name, itemIds: ids } }).outfitId;
}

describe('a fitting', () => {
  it('pays as each union pays one: an hour at the day rate under SAG-AFTRA, none for a series regular', () => {
    const sim = pro('us-ny-newyork', 'fit-sag');
    const costar = offer(sim, 'costar', 'us-ny-newyork');
    expect(fittingFor(costar, costar.starts, 'USD')).toEqual({ pay: Math.round(unitRate(costar, costar.starts, 'USD') / 8), minutes: 60 });
    expect(fittingFor(offer(sim, 'series-hour', 'us-ny-newyork'), costar.starts, 'USD')).toEqual({ pay: 0, minutes: 60 });
    // A voice session isn't fitted.
    expect(fittingFor(offer(sim, 'commercial-vo', 'us-ny-newyork'), costar.starts, 'USD')).toBeUndefined();
    // Stage work isn't fitted here.
    expect(fittingFor(offer(sim, 'broadway', 'us-ny-newyork'), costar.starts, 'USD')).toBeUndefined();
  });

  it('pays ACTRA’s two hours, and Equity’s half a day capped at £161', () => {
    const to = pro('ca-on-toronto', 'fit-actra');
    const ca = offer(to, 'ca-actor', 'ca-on-toronto');
    expect(fittingFor(ca, instantFromZoned({ year: 2026, month: 6, day: 1, hour: 9 }, 'America/Toronto'), 'CAD')).toEqual({ pay: 2 * 121_25, minutes: 120 });
    const ldn = pro('uk-eng-london', 'fit-equity');
    const uk = offer(ldn, 'uk-tv', 'uk-eng-london');
    expect(fittingFor(uk, uk.starts, 'GBP')!.pay).toBe(Math.min(Math.round(unitRate(uk, uk.starts, 'GBP') / 2), 161_00));
  });

  it('is on the calendar the day before the first call, and its pay comes with the job’s', () => {
    const sim = pro('us-ny-newyork', 'fit-cal');
    const b = offer(sim, 'costar', 'us-ny-newyork');
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    const fit = sim.universe.scheduled.find((i) => i.kind === FITTING_KIND && i.payload.bookingId === b.id)!;
    expect(fit.durationMinutes).toBe(60);
    expect(zonedParts(fit.at, NY).hour).toBe(14);
    expect(b.starts - fit.at).toBeGreaterThan(12 * MS_HOUR);
    sim.advanceTo(fit.at + 2 * MS_HOUR);
    expect(b.fittingOwed).toBe(fittingFor(b, fit.at, 'USD')!.pay);
  });

  it('isn’t paid when they aren’t there for it', () => {
    const sim = pro('us-ny-newyork', 'fit-away');
    const b = offer(sim, 'costar', 'us-ny-newyork');
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    // SETUP: the production keeps its schedule (a change is `rescheduling.test.ts`'s).
    for (const x of sim.universe.scheduled) if (x.kind === 'career.schedule_change' && x.status === 'pending') sim.timeline.cancel(x.id, sim.now);
    const fit = sim.universe.scheduled.find((i) => i.kind === FITTING_KIND && i.payload.bookingId === b.id)!;
    sim.advanceTo(fit.at - MS_HOUR);
    sim.player.currentLocationId = 'us-ct-newhaven';
    sim.advanceTo(fit.at + 2 * MS_HOUR);
    expect(b.fittingOwed).toBeUndefined();
    expect(fit.status).toBe('missed');
    expect(sim.universe.notifications.some((n) => n.title === 'Missed The Fitting')).toBe(true);
  });

  it('owes nothing for a job let go before its fitting', () => {
    const sim = pro('us-ny-newyork', 'fit-let-go');
    const b = offer(sim, 'costar', 'us-ny-newyork');
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    const fit = sim.universe.scheduled.find((i) => i.kind === FITTING_KIND && i.payload.bookingId === b.id)!;
    b.status = 'released';
    sim.advanceTo(fit.at + 2 * MS_HOUR);
    expect(b.fittingOwed).toBeUndefined();
  });
});

describe('an actor’s own wardrobe', () => {
  it('under ACTRA, the first two changes are free, then CA$30 each', () => {
    const sim = pro('ca-on-toronto', 'own-actra');
    const b = offer(sim, 'ca-actor', 'ca-on-toronto');
    const ids = [outfit(sim, 'One', ['t-shirt', 'jeans']), outfit(sim, 'Two', ['shirt', 'trousers']), outfit(sim, 'Three', ['t-shirt', 'trousers'])];
    expect(allowanceFor(sim, sim.player, b, ids.slice(0, 2))).toBe(0);
    expect(allowanceFor(sim, sim.player, b, ids)).toBe(30_00);
  });

  it('comes back worn after work, and unworn and unpaid from a job that never began', () => {
    const sim = pro('us-ny-newyork', 'own-unit');
    const b = offer(sim, 'costar', 'us-ny-newyork');
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    sim.must({ kind: 'career.furnish_wardrobe', payload: { bookingId: b.id, outfitIds: [outfit(sim, 'Casual', ['t-shirt', 'jeans'])] } });
    const lent = b.furnished!.itemIds.map((id) => sim.player.items!.find((i) => i.id === id)!);
    b.status = 'released';
    expect(wardrobeBack(sim.player, b)).toBe(lent.length);
    expect(b.wardrobeOwed).toBe(0);
    expect(lent.every((i) => !i.garment!.dirty)).toBe(true);
    const worked = offer(sim, 'costar', 'us-ny-newyork');
    worked.status = 'accepted';
    sim.must({ kind: 'career.furnish_wardrobe', payload: { bookingId: worked.id, outfitIds: [outfit(sim, 'Again', ['t-shirt', 'jeans'])] } });
    const again = worked.furnished!.itemIds.map((id) => sim.player.items!.find((i) => i.id === id)!);
    worked.worked = 2;
    wardrobeBack(sim.player, worked);
    expect(again.every((i) => i.garment!.dirty && i.garment!.wears === 1)).toBe(true);
    expect(worked.wardrobeOwed).toBeGreaterThan(0);
    // And once work has begun, nothing more is lent.
    const begun = offer(sim, 'costar', 'us-ny-newyork');
    begun.status = 'accepted';
    begun.worked = 1;
    expect(furnishRefusal(sim, sim.player, begun.id, [outfit(sim, 'Late', ['shirt', 'trousers'])])).toBe('The work has started.');
  });

  it('is paid SAG-AFTRA’s $12 an outfit a week, $27 formal, and is with the production till after the last call', () => {
    const sim = pro('us-ny-newyork', 'own');
    const b = offer(sim, 'costar', 'us-ny-newyork');
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    const casual = outfit(sim, 'Casual', ['t-shirt', 'jeans']);
    expect(allowanceFor(sim, sim.player, b, [casual])).toBe(12_00);
    const allowance = sim.must<{ allowance: number }>({ kind: 'career.furnish_wardrobe', payload: { bookingId: b.id, outfitIds: [casual] } }).allowance;
    expect(allowance).toBe(12_00);
    expect(b.wardrobeOwed).toBe(12_00);
    const lent = b.furnished!.itemIds.map((id) => sim.player.items!.find((i) => i.id === id)!);
    expect(lent.every((i) => !reachable(sim, sim.player, i.at))).toBe(true);
    expect(sim.execute({ kind: 'career.furnish_wardrobe', payload: { bookingId: b.id, outfitIds: [casual] } }).error).toBe('You’ve lent it clothes already.');
    // Formal: a suit in it. The starter wardrobe has none, so one is made.
    const suit = garmentsOf(sim.player).find((g) => g.garment.kind === 'trousers')!;
    suit.garment.kind = 'suit';
    const formal = outfit(sim, 'Formal', ['shirt', 'suit']);
    expect(allowanceFor(sim, sim.player, b, [formal])).toBe(27_00);
  });

  it('comes back worn and for the wash once the work is done, and the allowance with the pay', () => {
    const sim = pro('us-ny-newyork', 'own-back');
    const b = offer(sim, 'costar', 'us-ny-newyork');
    sim.must({ kind: 'career.accept', payload: { bookingId: b.id } });
    const casual = outfit(sim, 'Casual', ['t-shirt', 'jeans']);
    sim.must({ kind: 'career.furnish_wardrobe', payload: { bookingId: b.id, outfitIds: [casual] } });
    const ids = b.furnished!.itemIds;
    while (sim.now < b.furnished!.backAt + 10 * MS_DAY) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80 }); sim.advanceTo(sim.now + 6 * MS_HOUR, { stopOnPlayerRequired: true }); }
    const back = ids.map((id) => sim.player.items!.find((i) => i.id === id)!);
    expect(back.every((i) => i.at.kind === 'home')).toBe(true);
    expect(back.some((i) => i.garment!.wears > 0 || i.garment!.washes > 0)).toBe(true);
    expect(b.worked).toBeGreaterThan(0);
    expect(Object.values(sim.universe.transactions).some((t) => t.memo.includes('with the wardrobe allowance'))).toBe(true);
  });

  it('isn’t lent for stage work, a job not taken, or clothes not clean and to hand', () => {
    const sim = pro('us-ny-newyork', 'own-no');
    const stage = offer(sim, 'broadway', 'us-ny-newyork');
    const casual = outfit(sim, 'Casual', ['t-shirt', 'jeans']);
    expect(furnishRefusal(sim, sim.player, stage.id, [casual])).toBe('That isn’t a job you’ve taken.');
    stage.status = 'accepted';
    expect(furnishRefusal(sim, sim.player, stage.id, [casual])).toBe('Only screen work asks for clothes of your own here.');
    const b = offer(sim, 'costar', 'us-ny-newyork');
    b.status = 'accepted';
    for (const g of garmentsOf(sim.player)) if (g.garment.kind === 't-shirt') g.garment.dirty = true;
    expect(furnishRefusal(sim, sim.player, b.id, [casual])).toMatch(/isn’t clean and to hand/);
    expect(furnishRefusal(sim, sim.player, b.id, [])).toBe('From one outfit to six.');
  });
});
