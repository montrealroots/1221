/**
 * The IRS's substitute return on a reload (the integration pass of 2026-10-16), found by the school area's twins
 * (docs/verification/remaining/school-result.json, `outsideArea`) and fixed outside the tax area, which had finished.
 *
 * Played, an unfiled return puts the IRS's substitute return on the calendar at its due date only where the IRS's own part
 * is owed (`TAX_DUE_KIND`, systems/taxreturn.ts): a state's tax isn't the IRS's to assess. On every load, `armCollection`
 * put it there where the return's whole balance was owed, Connecticut's part with it. So a Scraping student who owed
 * Connecticut alone and never filed, reloaded between the due date and the year after it, was told on 14 April 2028 “The
 * IRS Figured Your 2026 Return … $0.00” and assessed $0.00, where played straight she never was.
 *
 * Twins on each life: one played straight, one reloaded (`loadSave` of its serialised save) on 1 June 2027, past the due
 * date and before the IRS's year is up. The student owing the IRS (born in London, on an F-1) is the check that the fix
 * didn't take the substitute return away: both of hers are told once.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned } from '@/engine/core/time';
import { newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { TAX_SFR_KIND } from '@/engine/systems/taxreturn';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 12) => instantFromZoned({ year, month, day, hour }, NY);
const life = (seed: string, extra: Partial<NewSaveConfig> = {}): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });

/** The life to 1 May 2028, its 2026 return never filed; reloaded on 1 June 2027 where `reload` asks. */
function played(seed: string, extra: Partial<NewSaveConfig>, reload: boolean) {
  let sim = life(seed, extra);
  sim.advanceTo(at(2027, 2, 1));
  const owedTo = sim.player.returns!['2026']!.figures.owedTo!;
  sim.advanceTo(at(2027, 6, 1));
  if (reload) sim = loadSave(deserialise(serialise(sim.universe)));
  sim.advanceTo(at(2028, 5, 1));
  const told = sim.universe.notifications.filter((n) => n.title === 'The IRS Figured Your 2026 Return').map((n) => n.body);
  const coming = sim.universe.scheduled.filter((i) => i.kind === TAX_SFR_KIND && i.status === 'pending' && i.payload.year === 2026).length;
  return { owedTo, told, coming, filed: sim.player.returns!['2026']!.filedAt };
}

describe('the IRS’s substitute return, across a reload', () => {
  it('PLAYER JOURNEY: a Scraping student owing Connecticut alone, her 2026 return never filed, is never told the IRS figured it, played straight or reloaded on 1 June 2027', () => {
    // TEST SETUP: none beyond creation's Scraping family, whose living scholarship is under 2026's standard deduction.
    const straight = played('itr-ct', { family: undefined, wealth: 'scraping' }, false);
    expect(straight.owedTo.irs).toBe(0);
    expect(straight.owedTo.states['us-ct']).toBeGreaterThan(0);
    expect(straight.told).toEqual([]);
    expect(straight.coming).toBe(0);
    // Until 2026-10-16 the reloaded twin was told “… worked out $0.00 …” on 14 April 2028, a year and a day past the due date.
    const reloaded = played('itr-ct', { family: undefined, wealth: 'scraping' }, true);
    expect(reloaded.told).toEqual([]);
    expect(reloaded.coming).toBe(0);
    expect(reloaded.filed).toBe(straight.filed);
  }, 300_000);

  it('PLAYER JOURNEY: a student owing the IRS, her 2026 return never filed, is told once that the IRS figured it, played straight or reloaded, in the same words', () => {
    // Born in London, on an F-1: her taxable scholarship is taxed with no standard deduction, as tests/evidence2-b12.test.ts's.
    const straight = played('itr-irs', { homeRegionId: 'uk-eng-london' }, false);
    expect(straight.owedTo.irs).toBeGreaterThan(0);
    expect(straight.told).toHaveLength(1);
    const reloaded = played('itr-irs', { homeRegionId: 'uk-eng-london' }, true);
    expect(reloaded.told).toEqual(straight.told);
  }, 300_000);
});
