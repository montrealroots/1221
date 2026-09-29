/**
 * The NHS for someone ordinarily resident in the UK (`nhsShareOf` in
 * `systems/health.ts`): free at the point of use, England's prescription
 * charge, the dental bands; everyone else billed as before.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { exchange } from '@/engine/content/currency';
import { nhsShareOf, shareOf } from '@/engine/systems/health';

const pounds = (cur: string, x: number) => (cur === 'GBP' ? x : exchange(x, 'GBP', cur)!);

describe('the NHS', () => {
  it('charges a Londoner nothing for a stay in hospital, £9.90 a prescription item, and the dental bands', () => {
    const sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true }, 'nhs');
    const cur = saveCurrency(sim.universe);
    for (const care of ['visit', 'urgent', 'emergency', 'stay'] as const) expect(shareOf(sim.player, care, sim.now, cur)).toBe(0);
    expect(shareOf(sim.player, 'rx-brand', sim.now, cur)).toBe(pounds(cur, 9_90));
    expect(shareOf(sim.player, 'cleaning', sim.now, cur)).toBe(pounds(cur, 27_90));
    expect(shareOf(sim.player, 'filling', sim.now, cur)).toBe(pounds(cur, 76_60));
    // At 60 a prescription is free in England.
    expect(nhsShareOf(sim.player, 'rx-generic', sim.player.birthInstant + 61 * 365.25 * MS_DAY, cur)).toBe(0);
  });

  it('charges nothing for a prescription in Scotland, and leaves a New Yorker’s care as it was', () => {
    const scot = quickSave({ startLocationId: 'uk-sct-glasgow', homeRegionId: 'uk-sct-glasgow', livesWhereBorn: true }, 'nhs-sct');
    expect(shareOf(scot.player, 'rx-generic', scot.now, saveCurrency(scot.universe))).toBe(0);
    const ny = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true }, 'nhs-ny');
    expect(nhsShareOf(ny.player, 'stay', ny.now, 'USD')).toBeUndefined();
    const visaHolder = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true }, 'nhs-visa');
    visaHolder.player.citizenshipId = 'us';
    expect(nhsShareOf(visaHolder.player, 'stay', visaHolder.now, 'USD')).toBeUndefined();
  });
});
