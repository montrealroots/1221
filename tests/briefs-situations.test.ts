/**
 * A genre's two briefs are different situations as play, not only as words (from 2026-10-12; the owner's brief of that
 * day, section 7: "multiple meaningfully different situations per genre"). `tests/briefs-content.test.ts` holds that the
 * two differ in what they say and on two axes or more; this holds that they meet different actors differently.
 *
 * Four actors of the same budget (TEST SETUP: an even actor, and a feeling, a body and a partner specialist, each with
 * four abilities at 90 and three techniques at 85, the rest lower to match), each at their best reading of each brief,
 * fully prepared, with no draw. For every genre, the difference between its two briefs' results isn't the same for all
 * four: it spreads by at least the game's own floor for a difference worth naming (`RECOMMEND.floor`, half a point).
 * Results are kept to a tenth, so the spread is compared at a tenth. Measured when this was written: the spread ran
 * from 0.5 (caper) to 14.4 points, median 4.2, and in 65 of the 149 genres the actors disagreed about which of the two
 * suited them better.
 */
import { describe, expect, it } from 'vitest';
import { BRIEFS, type Brief } from '@/engine/content/briefs';
import { TECHNIQUES } from '@/engine/content/abilities';
import type { Person } from '@/engine/domain/model';
import { briefContext, briefPiece, type BriefRecord } from '@/engine/systems/briefs';
import type { Performer } from '@/engine/systems/evaluation';
import { RECOMMEND } from '@/engine/systems/experience';
import { judgePiece } from '@/engine/systems/piece';

const AB = ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'vocal', 'physical', 'discipline', 'stamina'];
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const rec: BriefRecord = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
function actor(strong: string[], techs: string[]): Performer {
  const rest = (750 - 90 * strong.length) / (AB.length - strong.length);
  const tRest = (55 * TECHNIQUES.length - 85 * techs.length) / (TECHNIQUES.length - techs.length);
  return { ability: (id) => (strong.includes(id) ? 90 : rest), full: () => 100, technique: (s) => (techs.includes(s) ? 85 : tRest) };
}
const ACTORS: Performer[] = [
  actor([], []),
  actor(['emotionalDepth', 'composure', 'imagination', 'presence'], ['scene', 'screen', 'classical']),
  actor(['physical', 'stamina', 'vocal', 'presence'], ['combat', 'dance', 'singing', 'clown']),
  actor(['listening', 'adaptability', 'focus', 'memory'], ['improv', 'comedy', 'scene']),
];
const best = (p: Performer, b: Brief) => Math.max(...b.readings.map((r) => judgePiece('situations', p, { ...briefContext(nobody, b, { ...rec }, { reading: r.id, prep: { genre: 1 } }), condition: { readiness: 100 }, key: `situations:${b.id}`, expected: true }, briefPiece(b, { ...rec, reading: r.id }, r.id)).overall));

describe('a genre’s two briefs, as play', () => {
  it('meet different actors differently, by at least the floor for a difference worth naming', () => {
    const genres = [...new Set(BRIEFS.map((b) => b.kinds[0]!))];
    const flat: string[] = [];
    for (const g of genres) {
      const [a, b] = BRIEFS.filter((x) => x.kinds[0] === g);
      const d = ACTORS.map((p) => best(p, a!) - best(p, b!));
      const spread = Math.round((Math.max(...d) - Math.min(...d)) * 10) / 10;
      if (spread < RECOMMEND.floor) flat.push(`${g}: ${spread}`);
    }
    expect(flat).toEqual([]);
  });
});
