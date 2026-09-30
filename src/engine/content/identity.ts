/**
 * SLATE — proving who one is where it's asked (docs/WORLD.md, stage 1c), from
 * 2026-09-30, from `docs/research/world/research-documents-safetynet.json`.
 *
 * REAL ID: since 7 May 2025 the TSA has asked a REAL ID-compliant license or
 * ID card, or a passport, at its checkpoints. A traveler with neither pays
 * $45 for TSA ConfirmID, good for ten days of travel, and is screened
 * further. A license or ID card issued or renewed from then costs the same
 * as a REAL ID one in New York, Connecticut and California, and SLATE issues
 * REAL ID. Connecticut upgrades one before its renewal for its $30 duplicate
 * fee; New York's and California's off-cycle price wasn't read.
 *
 * A starting license is REAL ID at its state's published share of holders
 * (`docs/research/world/research-home-effects.json`): California's 58% (DMV,
 * May 2025), Connecticut's about 73% (its DMV, to CT Mirror), New York's
 * "more than half" of 8.6 million REAL ID and Enhanced holders (May 2026),
 * taken at half, its floor; another state's, the mean of the three. The TSA's
 * 94% of travelers by December 2025 counts passports too, and isn't a share
 * of licenses.
 *
 * A state ID card, for someone the state hasn't licensed to drive: New York's
 * non-driver ID, $14 for eight years under 62; Connecticut's, $28, up to
 * seven years to the birthday, SLATE's six; California's, $40, six
 * birthdays. Each is REAL ID.
 */

export const REAL_ID = {
  enforcedFrom: Date.UTC(2025, 4, 7),
  confirmIdUsd: 45,
  confirmIdDays: 10,
  ctUpgradeUsd: 30,
  /** The share of a state's licenses that are REAL ID or Enhanced, where published. */
  share: { 'us-ca': 0.58, 'us-ct': 0.73, 'us-ny': 0.5 } as Readonly<Record<string, number>>,
} as const;

/** A state's REAL ID share, or the mean of those published. */
export const realIdShare = (jurisdiction: string): number => REAL_ID.share[jurisdiction] ?? Object.values(REAL_ID.share).reduce((a, x) => a + x, 0) / Object.values(REAL_ID.share).length;

export const ID_CARDS: Readonly<Record<string, { name: string; fee: number; years: number }>> = {
  'us-ny': { name: 'Non-Driver ID Card', fee: 14, years: 8 },
  'us-ct': { name: 'Non-Driver Identification Card', fee: 28, years: 6 },
  'us-ca': { name: 'Identification Card', fee: 40, years: 6 },
};
