/**
 * A mark leaving the record (`markRecord` and `marksFallOff` in
 * `systems/credit.ts`, docs/WORLD.md stage 3e, from 2026-09-30): seven years
 * in America, six in Britain, five in Ireland, none elsewhere, and the CFPB's
 * 25 points back when one goes.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { MARK_GONE_GIVES, markRecord, marksFallOff } from '@/engine/systems/credit';

const YEAR = 365.2425 * MS_DAY;
const save = (city: string, name: string) => quickSave({ startLocationId: city, homeRegionId: city, livesWhereBorn: true, wealth: 'wealthy' }, name);

describe('a mark on the record', () => {
  it('takes its points, and leaves an American record after seven years with 25 back', () => {
    const sim = save('us-ny-newyork', 'marks-us');
    const record = sim.player.credit!;
    record.score = 700;
    markRecord(sim.player, 100, sim.now, 'us-ny-newyork');
    expect(record.score).toBe(600);
    expect(marksFallOff(sim.player, sim.now + 7 * YEAR - MS_DAY)).toBe(0);
    expect(record.marks).toHaveLength(1);
    expect(marksFallOff(sim.player, sim.now + 7 * YEAR)).toBe(1);
    expect(record.marks).toHaveLength(0);
    expect(record.score).toBe(600 + MARK_GONE_GIVES);
  });

  it('keeps Britain’s six years, Canada’s six and Ireland’s five, and a mark where no period was researched', () => {
    const sim = save('us-ny-newyork', 'marks-abroad');
    const record = sim.player.credit!;
    record.score = 700;
    markRecord(sim.player, 50, sim.now, 'uk-eng-london');
    markRecord(sim.player, 50, sim.now, 'ie-lei-dublin');
    markRecord(sim.player, 50, sim.now, 'ca-on-toronto');
    markRecord(sim.player, 50, sim.now, 'jp-13-tokyo');
    expect(marksFallOff(sim.player, sim.now + 5 * YEAR)).toBe(1);
    expect(marksFallOff(sim.player, sim.now + 6 * YEAR)).toBe(2);
    expect(marksFallOff(sim.player, sim.now + 30 * YEAR)).toBe(0);
    expect(record.marks).toHaveLength(1);
  });

  it('keeps a Mexican mark by its debt in UDIs: a year to 25, two to 500, four to 1,000, six past it or unknown', () => {
    const sim = save('us-ny-newyork', 'marks-mx');
    const record = sim.player.credit!;
    record.score = 700;
    const udi = 8.834094;
    markRecord(sim.player, 10, sim.now, 'mx-cmx-mexicocity', 20 * udi);
    markRecord(sim.player, 10, sim.now, 'mx-cmx-mexicocity', 400 * udi);
    markRecord(sim.player, 10, sim.now, 'mx-cmx-mexicocity', 900 * udi);
    markRecord(sim.player, 10, sim.now, 'mx-cmx-mexicocity', 5_000 * udi);
    markRecord(sim.player, 10, sim.now, 'mx-cmx-mexicocity');
    expect(marksFallOff(sim.player, sim.now + YEAR - MS_DAY)).toBe(0);
    expect(marksFallOff(sim.player, sim.now + YEAR)).toBe(1);
    expect(marksFallOff(sim.player, sim.now + 2 * YEAR)).toBe(1);
    expect(marksFallOff(sim.player, sim.now + 4 * YEAR)).toBe(1);
    expect(marksFallOff(sim.player, sim.now + 6 * YEAR)).toBe(2);
    // Outside Mexico the debt doesn't matter.
    markRecord(sim.player, 10, sim.now, 'us-ny-newyork', 20 * udi);
    expect(record.marks!.at(-1)!.udis).toBeUndefined();
  });

  it('never gives back past 850', () => {
    const sim = save('us-ny-newyork', 'marks-cap');
    const record = sim.player.credit!;
    markRecord(sim.player, 10, sim.now, 'us-ny-newyork');
    record.score = 845;
    marksFallOff(sim.player, sim.now + 8 * YEAR);
    expect(record.score).toBe(850);
  });

  it('goes as the months are reported: a played record loses an old mark on its own', () => {
    // A save whose life runs the seven years (another's ended in 2032).
    const sim = save('us-ny-newyork', 'dbg');
    const at = sim.now;
    markRecord(sim.player, 60, at, 'us-ny-newyork');
    const target = at + 7 * YEAR + 60 * MS_DAY;
    for (let guard = 0; sim.now < target && guard < 50; guard += 1) sim.advanceBy(target - sim.now);
    expect(sim.now).toBeGreaterThanOrEqual(target);
    // Seven idle years bring marks of their own; the first is gone.
    expect((sim.player.credit!.marks ?? []).some((m) => m.at === at)).toBe(false);
  });
});
