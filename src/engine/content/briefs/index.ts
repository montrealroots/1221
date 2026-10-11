/**
 * SLATE — every practice brief (`content/briefs/types.ts`), and each genre's.
 */

import type { Brief } from './types';
import { BRIEFS_A } from './briefs-a';
import { BRIEFS_B } from './briefs-b';
import { BRIEFS_C } from './briefs-c';
import { BRIEFS_D } from './briefs-d';
import { BRIEFS_E } from './briefs-e';
import { BRIEFS_F } from './briefs-f';

export type { Beat, Brief, Draw, Reading } from './types';

export const BRIEFS: readonly Brief[] = [...BRIEFS_A, ...BRIEFS_B, ...BRIEFS_C, ...BRIEFS_D, ...BRIEFS_E, ...BRIEFS_F];

export const BRIEF_BY_ID: Readonly<Record<string, Brief>> = Object.fromEntries(BRIEFS.map((b) => [b.id, b]));

/** A genre's briefs: the ones written for it first, then those it's listed on. */
export function briefsOf(genre: string): Brief[] {
  return [...BRIEFS.filter((b) => b.kinds[0] === genre), ...BRIEFS.filter((b) => b.kinds[0] !== genre && b.kinds.includes(genre))];
}
