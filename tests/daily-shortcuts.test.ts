/**
 * The day's own care as the player's choice (requirement E2, from
 * 2026-10-05): the night's meals, the morning's wash, dressing for the day
 * and for bed, and the dishwasher's run, each a shortcut. Until then every
 * night did them for the player unasked.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave, newLifeConfig, quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, startOfNextDay } from '@/engine/core/time';
import { DAILY_SHORTCUTS, doneFor, type Shortcut } from '@/engine/systems/automation';
import { HUNGER_SHOWS, lookAfterRefusal } from '@/engine/systems/life';
import { livingOf } from '@/engine/systems/dwelling';
import { garmentsOf, wornNow, type Garment } from '@/engine/systems/wardrobe';
import { addItem, homeKeyOf, itemsOf } from '@/engine/systems/items';
import { DISHWASHER_CYCLES_A_DAY, shortfallsFor } from '@/engine/systems/hygiene';
import type { Person } from '@/engine/domain/model';

/** A life as the game makes one, its shortcuts as chosen at creation. */
const made = (seed: string, shortcuts?: readonly Shortcut[]) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', ...(shortcuts ? { shortcuts } : {}) });
/** A test's or a tool's life, a home of its own in New York. */
const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, seed);
const midnight = (sim: ReturnType<typeof life>) => { sim.advanceBy(MS_DAY); };
const supply = (kind: string) => (p: Person) => itemsOf(p).filter((i) => i.supply?.kind === kind).reduce((n, i) => n + (i.supply?.left ?? 0), 0);
const toothpaste = supply('toothpaste');
const tablets = supply('dishwasher-detergent');

describe('the day’s own care, chosen', () => {
  it('a life the game makes has none of it on; a test’s or a tool’s has the day’s four', () => {
    expect(made('daily-made').player.automation).toEqual({});
    expect(made('daily-chosen', ['meals', 'dress']).player.automation).toEqual({ meals: true, dress: true });
    const t = life('daily-test');
    for (const k of DAILY_SHORTCUTS) expect(t.player.automation?.[k]).toBe(true);
  });

  it('without Feed Me, the night doesn’t feed them, and they’re told they’re hungry; with it, the day starts fed', () => {
    const sim = life('daily-meals');
    delete sim.player.automation!.meals;
    const told = () => sim.universe.notifications.filter((n) => n.title === 'You’re Hungry').length;
    sim.player.wellbeing.nourishment = 50;
    // Stepped through as the clock goes, three hours at a time, so the night nobody chose is paid at the stop after it.
    for (let h = 0; h < 24; h += 3) sim.advanceBy(3 * MS_HOUR);
    // Two points an hour awake and less asleep, and nothing eaten: not the 40 a night paid late gave until 2026-10-05.
    expect(sim.player.wellbeing.nourishment).toBeLessThan(10);
    // Gone hungry by midnight, they were told that morning.
    expect(told()).toBe(1);
    sim.player.automation!.meals = true;
    sim.player.wellbeing.nourishment = 50;
    midnight(sim);
    expect(sim.player.wellbeing.nourishment).toBeGreaterThan(50);
    // Fed by the shortcut, nobody tells them.
    sim.player.wellbeing.nourishment = HUNGER_SHOWS - 1;
    midnight(sim);
    expect(told()).toBe(1);
  });

  it('without Wash Me, the night doesn’t wash them; a shower by hand does the day’s teeth once', () => {
    const sim = life('daily-wash');
    delete sim.player.automation!.morningWash;
    sim.player.wellbeing.hygiene = 60;
    midnight(sim);
    expect(sim.player.wellbeing.hygiene).toBeLessThan(60);
    sim.advanceBy(8 * MS_HOUR);
    const paste = toothpaste(sim.player);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).ok).toBe(true);
    expect(toothpaste(sim.player)).toBeLessThan(paste);
    // A second shower the same day brushes no more.
    const after = toothpaste(sim.player);
    sim.player.wellbeing.hygiene = 40;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).ok).toBe(true);
    expect(toothpaste(sim.player)).toBe(after);
    // The shower's shortfalls name the toothpaste, once there's none.
    const tubes = itemsOf(sim.player).filter((i) => i.supply?.kind === 'toothpaste').map((i) => [i, i.supply!.left] as const);
    for (const [i] of tubes) i.supply!.left = 0;
    expect(shortfallsFor(sim, sim.player, 'wash').map((x) => x.label)).toContain('Toothpaste');
    for (const [i, left] of tubes) i.supply!.left = left;
    // With Wash Me on, the night's wash did the day's teeth: a shower by hand that morning brushes no more.
    sim.player.automation!.morningWash = true;
    midnight(sim);
    sim.advanceBy(8 * MS_HOUR);
    const washed = toothpaste(sim.player);
    expect(washed).toBeGreaterThan(0);
    sim.player.wellbeing.hygiene = 40;
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).ok).toBe(true);
    expect(toothpaste(sim.player)).toBe(washed);
  });

  it('without Dress Me, a day not changed out of is a day more in the same clothes, and weighs when they’re due a wash', () => {
    const sim = life('daily-dress');
    midnight(sim);
    const on = wornNow(sim.player).map((g) => g.id);
    expect(on.length).toBeGreaterThan(0);
    delete sim.player.automation!.dress;
    const wears = new Map(wornNow(sim.player).map((g) => [g.id, g.garment.wears]));
    midnight(sim);
    // Still in them, each a wear more.
    expect(wornNow(sim.player).map((g) => g.id)).toEqual(on);
    for (const g of wornNow(sim.player)) expect(g.garment.wears).toBe(wears.get(g.id)! + 1);
    // Past a wash, the day costs the mood that having nothing clean did: against the same life dressed fresh each day
    // by the shortcut. (Underwear and socks are due a wash after one wear, so a day unchanged is soon a day in them.)
    const twin = life('daily-dress');
    midnight(twin);
    midnight(twin);
    for (const g of wornNow(sim.player)) g.garment.dirty = true;
    for (const one of [sim, twin]) one.player.wellbeing.morale = 70;
    midnight(sim);
    midnight(twin);
    expect(sim.player.wellbeing.morale).toBeLessThan(twin.player.wellbeing.morale);
    expect(garmentsOf(sim.player).length).toBeGreaterThan(0);
  });

  it('without Dress Me, a night slept by hand at home is in their own sleepwear, and with it the night puts it on', () => {
    const sim = life('daily-sleep');
    delete sim.player.automation!.dress;
    // A pair of pajamas bought: a life begins with none.
    addItem(sim, sim.player, { kind: 'test:pajamas', label: 'Pajamas', quantity: 1, condition: 1, at: { kind: 'home', home: homeKeyOf(sim.player.home)!, spot: 'drawers' }, acquiredAt: sim.now, garment: { kind: 'pajamas', slot: 'sleep', care: 'wash', wears: 0, washes: 0 } as Garment });
    const pair = () => garmentsOf(sim.player).filter((g) => g.garment.slot === 'sleep');
    const wears = () => pair().reduce((n, g) => n + g.garment.wears, 0);
    expect(pair()).toHaveLength(1);
    sim.advanceBy(14 * MS_HOUR);
    const before = wears();
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(wears()).toBe(before + 1);
    // Not slept by hand, the night nobody chose isn't in them.
    const night = wears();
    midnight(sim);
    expect(wears()).toBe(night);
    // With Dress Me, the night puts them on, and a night slept by hand across it doesn't again: once a night.
    sim.player.automation!.dress = true;
    sim.advanceTo(startOfNextDay(sim.now, sim.homeZone) - 2 * MS_HOUR);
    const dressed = wears();
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(wears()).toBe(dressed + 1);
  });

  it('without the dishwasher’s shortcut the dishes wait in the sink; Run The Dishwasher takes them, with its tablets', () => {
    const sim = life('daily-dishes');
    if (!sim.player.home || livingOf(sim.player) === undefined) throw new Error('no home');
    delete sim.player.automation!.dishwasher;
    midnight(sim);
    const l = livingOf(sim.player);
    // This life's rented flat has one.
    expect(sim.player.home!.unit!.fixtures.dishwasher).toBe(true);
    expect(l.dishes).toBe(1);
    expect(lookAfterRefusal(sim, 'dishwasher')).toBeUndefined();
    const loads = l.loads?.dishwasher ?? 0;
    const before = tablets(sim.player);
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'dishwasher' } }).ok).toBe(true);
    expect(l.dishes).toBeUndefined();
    expect(l.loads!.dishwasher).toBeCloseTo(loads + DISHWASHER_CYCLES_A_DAY, 9);
    // A day's dishes, a day's share of its cycles' tablets.
    expect(before - tablets(sim.player)).toBeCloseTo(DISHWASHER_CYCLES_A_DAY, 9);
    expect(lookAfterRefusal(sim, 'dishwasher')).toBe('There’s nothing to wash up.');
    // Out of tablets, it's refused, and what's short is offered to buy.
    midnight(sim);
    for (const i of itemsOf(sim.player)) if (i.supply?.kind === 'dishwasher-detergent') i.supply.left = 0;
    expect(lookAfterRefusal(sim, 'dishwasher')).toBe('There aren’t the dishwasher tablets at home for it.');
    expect(shortfallsFor(sim, sim.player, 'dishwasher').length).toBe(1);
    // A home without one: refused, and washed up by hand instead.
    sim.player.home!.unit!.fixtures = { ...sim.player.home!.unit!.fixtures, dishwasher: false };
    expect(lookAfterRefusal(sim, 'dishwasher')).toBe('There’s no dishwasher at home.');
    // Away from home, it isn't their kitchen.
    sim.player.currentLocationId = 'uk-eng-london';
    expect(lookAfterRefusal(sim, 'dishwasher')).toBe('It isn’t your kitchen.');
  });

  it('is the player’s: the life’s other people live their days as before', () => {
    const sim = life('daily-others');
    const other = { ...sim.player, id: 'someone-else', automation: {} } as Person;
    expect(doneFor(other, sim.universe.playerId, 'meals')).toBe(true);
    delete sim.player.automation!.meals;
    expect(doneFor(sim.player, sim.universe.playerId, 'meals')).toBe(false);
  });

  it('a save from before was fed, washed and dressed every day, and keeps it as shortcuts', () => {
    const sim = life('daily-old');
    const old = JSON.parse(JSON.stringify(sim.universe));
    const me = old.people[old.playerId];
    me.automation = { laundry: true };
    delete me.shortcutsVersion;
    const back = loadSave(old);
    expect(back.player.automation).toMatchObject({ laundry: true, meals: true, morningWash: true, dress: true, dishwasher: true });
    // A save from after keeps what it chose.
    const now = JSON.parse(JSON.stringify(sim.universe));
    now.people[now.playerId].automation = {};
    expect(loadSave(now).player.automation).toEqual({});
  });
});
