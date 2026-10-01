/**
 * Store hours (`systems/errands.ts`, `content/storehours.ts`, from
 * 2026-10-01): a store sells while it's open by its own hours in local
 * time, England's Sunday trading included; the day's restocking keeps to
 * open hours of its own accord.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { instantFromZoned } from '@/engine/core/time';
import { closedNow } from '@/engine/systems/errands';
import { groceryCatalog, groceryRefusal } from '@/engine/systems/kitchen';
import { toiletryRefusal, toiletryCatalog } from '@/engine/systems/hygiene';

const at = (y: number, m: number, d: number, h: number, zone: string) => instantFromZoned({ year: y, month: m, day: d, hour: h, minute: 0 }, zone);
const LDN = 'Europe/London';

describe('a store', () => {
  it('is open by its own hours: Tesco all night but six hours on an English Sunday', () => {
    // 2026-11-08 was a Sunday; 2026-11-09 a Monday.
    expect(closedNow('tesco-gb', 'Tesco', 'uk-eng-london', at(2026, 11, 9, 3, LDN))).toBeUndefined();
    expect(closedNow('tesco-gb', 'Tesco', 'uk-eng-london', at(2026, 11, 8, 10, LDN))).toBe('Tesco opens at 11:00.');
    expect(closedNow('tesco-gb', 'Tesco', 'uk-eng-london', at(2026, 11, 8, 17, LDN))).toMatch(/closed at 17:00/);
    expect(closedNow('tesco-gb', 'Tesco', 'uk-eng-london', at(2026, 11, 8, 12, LDN))).toBeUndefined();
    // Giant Tiger opens at eight; a chain whose hours aren't known is taken as open.
    expect(closedNow('gianttiger', 'Giant Tiger', 'ca-on-toronto', at(2026, 11, 9, 7, 'America/Toronto'))).toBe('Giant Tiger opens at 08:00.');
    expect(closedNow('nobody', 'A Shop', 'ca-on-toronto', at(2026, 11, 9, 3, 'America/Toronto'))).toBeUndefined();
  });

  it('refuses groceries and toiletries when shut; the day’s restocking isn’t held to the moment', () => {
    const sim = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'wealthy' }, 'shut');
    const night = at(2026, 11, 9, 23, 'America/Toronto');
    while (sim.now < night) sim.advanceTo(Math.min(night, sim.now + 3 * 86_400_000));
    const t = toiletryCatalog(sim, 'ca-on-toronto').find((e) => e.value.chain === 'gianttiger')!.value;
    expect(toiletryRefusal(sim.player, t.id, 1, sim.now)).toMatch(/Giant Tiger has closed/);
    expect(toiletryRefusal(sim.player, t.id, 1)).toBeUndefined();
    const g = groceryCatalog(sim, 'ca-on-toronto').find((e) => e.value.chain === 'gianttiger')!.value;
    expect(groceryRefusal(sim, sim.player, g.id, 1)).toMatch(/Giant Tiger has closed/);
  });
});
