/**
 * What a home watches, listens to and plays (`systems/homelife.ts`, from
 * 2026-10-02): services where you live at their own prices billed monthly,
 * Canada's tax on them, Britain's and Ireland's TV licenses and what each is
 * needed for, consoles, and unwinding in front of what you have.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { OUTAGE_HOURS, homeInternetPlan, internetDown, telecomOf } from '@/engine/systems/telecom';
import { exchange } from '@/engine/content/currency';
import { salesTaxRate } from '@/engine/content/tax';
import { SERVICES } from '@/engine/content/homelife';
import { consolesHere, licensed, planPrice, plansHere, subscriptionsOf, watchRefusal , gamesOwned } from '@/engine/systems/homelife';

const life = (city: string, seed: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, seed);
const into = (sim: Simulation, c: number, from: string) => { const cur = saveCurrency(sim.universe); return cur === from ? c : exchange(c, from, cur)!; };

describe('a service', () => {
  it('is its own price where you live, with Canada’s tax and none in New York, billed monthly until it’s canceled', () => {
    const ny = life('us-ny-newyork', 'stream-ny');
    const netflix = plansHere(ny.player).find((p) => /Netflix/.test(p.label))!;
    expect(planPrice(ny, ny.player, netflix)).toBe(into(ny, Math.round(netflix.monthly * 100), 'USD'));
    const to = life('ca-on-toronto', 'stream-to');
    const crave = plansHere(to.player).find((p) => /Crave/.test(p.label) && p.monthly > 0)!;
    expect(planPrice(to, to.player, crave)).toBe(into(to, Math.round(crave.monthly * (1 + salesTaxRate('ca-on-toronto', to.now, 'general')) * 100), 'CAD'));
    expect(ny.execute({ kind: 'home.subscribe', payload: { id: netflix.id } }).ok).toBe(true);
    expect(ny.execute({ kind: 'home.subscribe', payload: { id: netflix.id } }).error).toBe('You subscribe to it already.');
    ny.advanceBy(61 * MS_DAY);
    expect(ny.universe.transactions.filter((t) => t.memo === netflix.label)).toHaveLength(3);
    expect(ny.execute({ kind: 'home.unsubscribe', payload: { id: netflix.id } }).ok).toBe(true);
    ny.advanceBy(31 * MS_DAY);
    expect(ny.universe.transactions.filter((t) => t.memo === netflix.label)).toHaveLength(3);
    // Not one another market's.
    expect(ny.execute({ kind: 'home.subscribe', payload: { id: SERVICES.find((s) => s.market === 'uk')!.id } }).error).toBe('That isn’t offered where you live.');
  });
});

describe('the TV license', () => {
  it('in Britain is £180 a year for live TV, not for a service you stream', () => {
    const sim = life('uk-eng-london', 'licence-gb');
    expect(watchRefusal(sim, sim.player, 'live')).toBe('You need a TV license for that.');
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'unwind', how: 'live' } }).error).toBe('You need a TV license for that.');
    const netflix = plansHere(sim.player).find((p) => /Netflix/.test(p.label))!;
    sim.must({ kind: 'home.subscribe', payload: { id: netflix.id } });
    expect(watchRefusal(sim, sim.player, netflix.id)).toBeUndefined();
    const r = sim.execute<{ paid: number }>({ kind: 'home.tv_licence', payload: {} });
    expect(r.value!.paid).toBe(into(sim, 180_00, 'GBP'));
    expect(licensed(sim.player, sim.now + 364 * MS_DAY)).toBe(true);
    expect(licensed(sim.player, sim.now + 366 * MS_DAY)).toBe(false);
    expect(watchRefusal(sim, sim.player, 'live')).toBeUndefined();
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'unwind', how: 'live' } }).ok).toBe(true);
  });

  it('in Ireland is €160 for any TV at home, streaming too; America asks none', () => {
    const sim = life('ie-lei-dublin', 'licence-ie');
    const netflix = plansHere(sim.player).find((p) => /Netflix/.test(p.label))!;
    sim.must({ kind: 'home.subscribe', payload: { id: netflix.id } });
    expect(watchRefusal(sim, sim.player, netflix.id)).toMatch(/any TV at home needs one in Ireland/);
    expect(sim.execute<{ paid: number }>({ kind: 'home.tv_licence', payload: {} }).value!.paid).toBe(into(sim, 160_00, 'EUR'));
    expect(watchRefusal(sim, sim.player, netflix.id)).toBeUndefined();
    const ny = life('us-ny-newyork', 'licence-us');
    expect(watchRefusal(ny, ny.player, plansHere(ny.player)[0]!.id)).toBe('You don’t subscribe to it.');
    expect(ny.execute({ kind: 'home.tv_licence', payload: {} }).error).toBe('No TV license is needed where you live.');
    expect(watchRefusal(ny, ny.player, 'live')).toBeUndefined();
  });
});

describe('the internet at home', () => {
  it('in Dublin, on eir’s fiber, is down ComReg’s 16 hours a year, and a service isn’t streamed then; nowhere else is it drawn', () => {
    const sim = life('ie-lei-dublin', 'outage-ie');
    expect(homeInternetPlan(sim.player)?.id).toBe('eir-500');
    expect(OUTAGE_HOURS['eir-500']).toBe(16);
    const hours = 200_000;
    let down = 0;
    let downAt: number | undefined;
    let upAt: number | undefined;
    for (let h = 0; h < hours; h += 1) {
      const at = sim.now + h * MS_HOUR;
      if (internetDown(sim, sim.player, at)) { down += 1; downAt ??= at; } else upAt ??= at;
    }
    expect((down / hours) * 365.2425 * 24).toBeGreaterThan(12);
    expect((down / hours) * 365.2425 * 24).toBeLessThan(20);
    const netflix = plansHere(sim.player).find((p) => /Netflix/.test(p.label))!;
    sim.must({ kind: 'home.subscribe', payload: { id: netflix.id } });
    sim.must({ kind: 'home.tv_licence', payload: {} });
    sim.universe.now = downAt!;
    expect(watchRefusal(sim, sim.player, netflix.id)).toMatch(/^The internet at home is down \(eir\)/);
    // Live TV comes by the aerial.
    expect(watchRefusal(sim, sim.player, 'live')).toBeUndefined();
    sim.universe.now = upAt!;
    expect(watchRefusal(sim, sim.player, netflix.id)).toBeUndefined();
    // Virgin Media's cable publishes no rate, nor does New York.
    telecomOf(sim.player).internet = { planId: 'virgin-ie-500', since: sim.now, cityId: 'ie-lei-dublin' };
    sim.universe.now = downAt!;
    expect(internetDown(sim, sim.player, downAt!)).toBe(false);
    const ny = life('us-ny-newyork', 'outage-ny');
    for (let h = 0; h < 20_000; h += 1) expect(internetDown(ny, ny.player, ny.now + h * MS_HOUR)).toBe(false);
  });
});

describe('a console', () => {
  it('is bought at its maker’s price, and playing at home needs one', () => {
    const sim = life('us-ny-newyork', 'console');
    expect(watchRefusal(sim, sim.player, 'games')).toBe('You have no console.');
    const c = consolesHere(sim.player)[0]!;
    const r = sim.execute<{ paid: number }>({ kind: 'home.console', payload: { consoleId: c.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.paid).toBe(into(sim, Math.round(c.price * (1 + salesTaxRate('us-ny-newyork', sim.now, 'general')) * 100), 'USD'));
    // A console plays only with software (from 2026-10-03): its maker's game, service or bundle.
    expect(watchRefusal(sim, sim.player, 'games')).toBe('It needs a game of its own to play, or its maker’s subscription.');
    expect(subscriptionsOf(sim.player)).toEqual([]);
  });

  it('plays a game of its maker’s, at Nintendo’s own price, or through its maker’s service', () => {
    const sim = life('us-ny-newyork', 'console-games');
    const sw = consolesHere(sim.player).find((c) => c.maker === 'Nintendo' && c.edition === 'System')!;
    const ps = consolesHere(sim.player).find((c) => c.maker === 'Sony')!;
    sim.must({ kind: 'home.console', payload: { consoleId: ps.id } });
    // A Nintendo game doesn't play on a PlayStation.
    expect(sim.execute({ kind: 'home.buy_game', payload: { gameId: 'us-dk-bananza' } }).error).toBe('It plays on a Nintendo console, and you have none.');
    // PlayStation Plus has a catalog.
    sim.must({ kind: 'home.subscribe', payload: { id: 'us-playstation-plus-essential' } });
    expect(watchRefusal(sim, sim.player, 'games')).toBeUndefined();
    sim.must({ kind: 'home.unsubscribe', payload: { id: 'us-playstation-plus-essential' } });
    expect(watchRefusal(sim, sim.player, 'games')).toBeDefined();
    // Xbox's service is no use to a PlayStation.
    sim.must({ kind: 'home.subscribe', payload: { id: 'us-xbox-game-pass-essential' } });
    expect(watchRefusal(sim, sim.player, 'games')).toBeDefined();
    sim.must({ kind: 'home.console', payload: { consoleId: sw.id } });
    const paid = sim.must<{ paid: number }>({ kind: 'home.buy_game', payload: { gameId: 'us-dk-bananza' } }).paid;
    expect(paid).toBe(into(sim, Math.round(69.99 * (1 + salesTaxRate('us-ny-newyork', sim.now, 'general')) * 100), 'USD'));
    expect(gamesOwned(sim.player).map((i) => i.label)).toEqual(['Donkey Kong Bananza']);
    expect(watchRefusal(sim, sim.player, 'games')).toBeUndefined();
  });

  it('a bundle comes with its game', () => {
    const sim = life('us-ny-newyork', 'console-bundle');
    const bundle = consolesHere(sim.player).find((c) => /Bundle/.test(c.edition ?? ''))!;
    sim.must({ kind: 'home.console', payload: { consoleId: bundle.id } });
    expect(watchRefusal(sim, sim.player, 'games')).toBeUndefined();
  });
});
