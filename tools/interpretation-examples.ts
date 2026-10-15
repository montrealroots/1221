/**
 * SLATE — before and after, for the account (docs/verification/interpretation-2026-10-16/README.md): the same actor,
 * scene, reading and preparation, played each way, with the way of playing read against the scene (after) and without
 * it (before, `GRAIN` strength and rehearsal shift at 0, as the code stood until 2026-10-16).
 *
 *   npx vite-node tools/interpretation-examples.ts
 */
import { BRIEF_BY_ID, type Brief } from '../src/engine/content/briefs';
import { GRAIN } from '../src/engine/content/interpretation';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefMaterial, briefPiece, readingOf, sceneOf, type BriefRecord } from '../src/engine/systems/briefs';
import type { Performer } from '../src/engine/systems/evaluation';
import { judgePiece } from '../src/engine/systems/piece';
import { requiredFor, suitabilityOf } from '../src/engine/systems/interpretation';
import type { AxisValue } from '../src/engine/content/material';

const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const rec = (p: number): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });
const act = (ab: Record<string, number>, fill: number): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => 50 });
const ACTORS: Record<string, Performer> = { 'even at 55': act({}, 55), 'presence, voice and body at 80': act({ presence: 80, vocal: 80, physical: 80 }, 45), 'emotional depth at 80': act({ emotionalDepth: 80 }, 50) };
const score = (b: Brief, p: Performer, side: AxisValue, axis: string, reading: string, approach = 1) => {
  const ctx = briefContext(nobody, b, rec(1), { reading, playing: { [axis]: side, chosenAt: 0, prep: approach } as never, prep: { genre: 1, approach } });
  return judgePiece('examples', p, { ...ctx, condition: { readiness: 100 }, key: `ex:${b.id}`, expected: true }, briefPiece(b, { ...rec(1), reading }, reading)).overall;
};
const rows: string[] = ['| Scene | Reading | Actor | Side | Suitability | Before | After | Complete At |', '|---|---|---|---|---|---|---|---|'];
const cases: [string, string, [AxisValue, AxisValue], number?][] = [
  ['brief-nordic_noir', 'scale', ['restrained', 'expansive']],
  ['brief-melodrama', 'scale', ['restrained', 'expansive']],
  ['brief-alternate_history', 'scale', ['restrained', 'expansive']],
  ['brief-alternate_history-2', 'scale', ['restrained', 'expansive']],
  ['brief-social_realism', 'structure', ['set', 'open']],
  ['brief-docudrama-2', 'structure', ['set', 'open'], 0],
  ['brief-docudrama-2', 'structure', ['set', 'open'], 1],
  ['brief-slapstick', 'pace', ['measured', 'driven']],
];
for (const [id, axis, sides, ri] of cases) {
  const b = BRIEF_BY_ID[id]!;
  const r = b.readings[ri ?? 0]!;
  for (const [who, p] of Object.entries(ACTORS)) {
    if (who !== 'even at 55' && axis !== 'scale') continue;
    for (const side of sides) {
      const s = suitabilityOf(side, briefMaterial(b), sceneOf(b, readingOf(b, r.id)));
      const was = { ...GRAIN };
      Object.assign(GRAIN as Record<string, number>, { strength: 0, prep: 0 });
      const before = score(b, p, side, axis, r.id);
      Object.assign(GRAIN as Record<string, number>, was);
      const after = score(b, p, side, axis, r.id);
      rows.push(`| ${b.title} (${id.replace('brief-', '')}) | ${r.label} | ${who} | ${side} | ${s.band} (${s.s}): ${s.signals.slice(0, 2).map((g) => `${g.source} ${g.v > 0 ? '+' : ''}${g.v}`).join('; ')} | ${before.toFixed(1)} | ${after.toFixed(1)} | ${Math.round(requiredFor([side], briefMaterial(b), sceneOf(b, readingOf(b, r.id))) * 100)}% |`);
    }
  }
}
console.log(rows.join('\n'));
