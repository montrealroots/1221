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
import { SECOND_A } from './second-a';
import { SECOND_B } from './second-b';
import { SECOND_C } from './second-c';
import { SECOND_D } from './second-d';
import { SECOND_E } from './second-e';
import { SECOND_F } from './second-f';

export type { Beat, Brief, Draw, Reading } from './types';

// Each genre's second situation follows its first in a genre's list (`briefsOf`), from 2026-10-12.
export const BRIEFS: readonly Brief[] = [...BRIEFS_A, ...BRIEFS_B, ...BRIEFS_C, ...BRIEFS_D, ...BRIEFS_E, ...BRIEFS_F, ...SECOND_A, ...SECOND_B, ...SECOND_C, ...SECOND_D, ...SECOND_E, ...SECOND_F];

export const BRIEF_BY_ID: Readonly<Record<string, Brief>> = Object.fromEntries(BRIEFS.map((b) => [b.id, b]));

/** A genre's briefs: the ones written for it first, then those it's listed on. */
export function briefsOf(genre: string): Brief[] {
  return [...BRIEFS.filter((b) => b.kinds[0] === genre), ...BRIEFS.filter((b) => b.kinds[0] !== genre && b.kinds.includes(genre))];
}

/**
 * The briefs written on 2026-10-12 and retired on 2026-10-16, each with the scene that took its place (the owner's brief
 * 09, section 3; docs/verification/integration-2026-10-16/genres-09.md). Each asked of the actor what its genre's first
 * brief did in three or more of the six parts `tools/genre-pairs.ts` reads, and was replaced by a new scene under a new
 * id, so nothing a save holds of the old one is read as the new one's: a record kept under a retired id stays in the
 * save as it was (its takes, its reading, a callback), and nothing offers it again. Kept here only so what's in the
 * record can still say which genre and which scene it was (`briefKinds`).
 */
export const RETIRED_BRIEFS: Readonly<Record<string, { title: string; kinds: readonly string[]; replacedBy: string }>> = {
  'brief-animated-2': { title: 'The Puddle On Larch Street', kinds: ['animated'], replacedBy: 'brief-animated-3' },
  'brief-christmas-2': { title: 'The Box With His Name On It', kinds: ['christmas'], replacedBy: 'brief-christmas-3' },
  'brief-conspiracy_thriller-2': { title: 'The Revised Forecast', kinds: ['conspiracy_thriller'], replacedBy: 'brief-conspiracy_thriller-3' },
  'brief-farce-2': { title: 'The Sideways Presentation', kinds: ['farce'], replacedBy: 'brief-farce-3' },
  'brief-film_noir-2': { title: 'The Number He Left', kinds: ['film_noir'], replacedBy: 'brief-film_noir-3' },
  'brief-gothic_horror-2': { title: 'The Locked Organ', kinds: ['gothic_horror'], replacedBy: 'brief-gothic_horror-3' },
  'brief-jukebox_musical-2': { title: 'The Resignation Number', kinds: ['jukebox_musical'], replacedBy: 'brief-jukebox_musical-3' },
  'brief-new_wave-2': { title: 'Five Minutes Before The Lights', kinds: ['new_wave'], replacedBy: 'brief-new_wave-3' },
  'brief-psychological_thriller-2': { title: 'The Overnight Study', kinds: ['psychological_thriller'], replacedBy: 'brief-psychological_thriller-3' },
  'brief-samurai-2': { title: 'The First Form', kinds: ['samurai'], replacedBy: 'brief-samurai-3' },
  'brief-silent_film-2': { title: 'Her First Sitting Alone', kinds: ['silent_film'], replacedBy: 'brief-silent_film-3' },
  'brief-sword_and_sorcery-2': { title: 'The Last Night On Guard', kinds: ['sword_and_sorcery'], replacedBy: 'brief-sword_and_sorcery-3' },
  'brief-tragicomedy-2': { title: 'The Soup Lesson', kinds: ['tragicomedy'], replacedBy: 'brief-tragicomedy-3' },
  'brief-yakuza-2': { title: 'Five Years From The Day', kinds: ['yakuza'], replacedBy: 'brief-yakuza-3' },
};

/** The genres of a brief by its id, a brief offered now or one retired: what a take on the work record was in. */
export const briefKinds = (id: string): readonly string[] => BRIEF_BY_ID[id]?.kinds ?? RETIRED_BRIEFS[id]?.kinds ?? [];
