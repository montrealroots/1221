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
 * record can still say which genre it was (`briefKinds`). Each also held its title and the id of the scene that
 * replaced it until 2026-10-20 (brief 17), which nothing read: a take keeps its own title on the work record, and the
 * replacements are in docs/verification/integration-2026-10-16/genres-09.md.
 */
export const RETIRED_BRIEFS: Readonly<Record<string, { kinds: readonly string[] }>> = {
  'brief-animated-2': { kinds: ['animated'] },
  'brief-christmas-2': { kinds: ['christmas'] },
  'brief-conspiracy_thriller-2': { kinds: ['conspiracy_thriller'] },
  'brief-farce-2': { kinds: ['farce'] },
  'brief-film_noir-2': { kinds: ['film_noir'] },
  'brief-gothic_horror-2': { kinds: ['gothic_horror'] },
  'brief-jukebox_musical-2': { kinds: ['jukebox_musical'] },
  'brief-new_wave-2': { kinds: ['new_wave'] },
  'brief-psychological_thriller-2': { kinds: ['psychological_thriller'] },
  'brief-samurai-2': { kinds: ['samurai'] },
  'brief-silent_film-2': { kinds: ['silent_film'] },
  'brief-sword_and_sorcery-2': { kinds: ['sword_and_sorcery'] },
  'brief-tragicomedy-2': { kinds: ['tragicomedy'] },
  'brief-yakuza-2': { kinds: ['yakuza'] },
};

/** The genres of a brief by its id, a brief offered now or one retired: what a take on the work record was in. */
export const briefKinds = (id: string): readonly string[] => BRIEF_BY_ID[id]?.kinds ?? RETIRED_BRIEFS[id]?.kinds ?? [];
