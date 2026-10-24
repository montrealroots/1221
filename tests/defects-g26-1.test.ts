/**
 * REAL ID's figures, until 2026-10-12. `content/identity.ts` declared the TSA's enforcement date (`enforcedFrom`),
 * ConfirmID's $45 and ten days (`confirmIdUsd`, `confirmIdDays`) and Connecticut's $30 early upgrade (`ctUpgradeUsd`).
 * What read them went on 2026-10-09: ConfirmID at the TSA's checkpoint (`atTheCheckpoint`, the date, the fee and the
 * days) and Papers' line naming the fee in that day's scope reset, and making a license REAL ID (`documents.real_id`,
 * the upgrade's fee) later that day. Nothing read the four after. They went, and the one figure a save still draws on,
 * a starting license's REAL ID share (`share`, through `realIdShare`), stayed.
 *
 * PLAYER JOURNEYS play through commands; FIXTURES set a state by hand, and say so.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { REAL_ID, realIdShare } from '@/engine/content/identity';
import { documentsOf } from '@/engine/systems/documents';

/** A Connecticut-born New Havener's starting license, from the first seed that draws one. */
function ctLicense(): { realId?: boolean } {
  for (let n = 0; n < 40; n += 1) {
    const sim = quickSave({ startLocationId: 'us-ct-newhaven', homeRegionId: 'us-ct-newhaven' }, `g26-license-${n}`);
    const license = documentsOf(sim.player).find((d) => d.kind === 'license' && d.issuer === 'us-ct');
    if (license) return license;
  }
  throw new Error('no seed drew a Connecticut license');
}

describe('REAL ID keeps only the figure a save reads (from 2026-10-12)', () => {
  it('declares a state’s REAL ID share and nothing else', () => {
    expect(Object.keys(REAL_ID)).toEqual(['share']);
  });

  it('gives a state’s published share, and another state the mean of the three', () => {
    expect(realIdShare('us-ca')).toBe(0.58);
    expect(realIdShare('us-ct')).toBe(0.73);
    expect(realIdShare('us-ny')).toBe(0.5);
    expect(realIdShare('us-tx')).toBeCloseTo((0.58 + 0.73 + 0.5) / 3, 12);
  });

  it('draws a starting license’s REAL ID from its state’s share: change the share and the license changes', () => {
    // FIXTURE: the share is set by hand to its two ends, and put back.
    const share = REAL_ID.share as Record<string, number>;
    const kept = realIdShare('us-ct');
    try {
      share['us-ct'] = 1;
      expect(ctLicense().realId).toBe(true);
      share['us-ct'] = 0;
      expect(ctLicense().realId).toBe(false);
    } finally {
      share['us-ct'] = kept;
    }
  });
});
