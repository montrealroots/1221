import { BRIEFS, BRIEF_BY_ID } from '../src/engine/content/briefs';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefMaterial, briefPiece, sceneOf, readingOf, type BriefRecord } from '../src/engine/systems/briefs';
import type { Performer } from '../src/engine/systems/evaluation';
import { judgePiece } from '../src/engine/systems/piece';
import { suitabilityOf } from '../src/engine/systems/interpretation';
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const rec = (p: number): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });
const act = (ab: Record<string, number>, fill: number): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => 50 });
const EVEN = act({}, 55), SPEC = act({ presence: 80, vocal: 80, physical: 80 }, 45);
const sc = (b: any, p: Performer, r: string, sides: any) => { const ctx = briefContext(nobody, b, rec(1), { reading: r, playing: { ...sides, chosenAt: 0, prep: 1 }, prep: { genre: 1, approach: 1 } }); return judgePiece('x', p, { ...ctx, condition: { readiness: 100 }, key: 'k', expected: true }, briefPiece(b, { ...rec(1), reading: r }, r)).overall; };
const s = (b: any, side: any, r?: string) => suitabilityOf(side, briefMaterial(b), sceneOf(b, readingOf(b, r ?? b.readings[0].id))).s;
// genres with differing scale between their briefs, gap large
const by = new Map<string, any[]>(); for (const b of BRIEFS) by.set(b.kinds[0], [...(by.get(b.kinds[0]) ?? []), b]);
const flips: string[] = [];
for (const [g, bs] of by) if (bs.length > 1) { const v = bs.map((b) => s(b, 'restrained') - s(b, 'expansive')); if (Math.max(...v) > 0.3 && Math.min(...v) < -0.3) flips.push(`${g}: ${bs.map((b, i) => `${b.id} ${v[i].toFixed(2)} d=${(sc(b, EVEN, b.readings[0].id, { scale: 'restrained' }) - sc(b, EVEN, b.readings[0].id, { scale: 'expansive' })).toFixed(1)}`).join(' | ')}`); }
console.log('scale flips within genre:', flips.length); console.log(flips.slice(0, 6).join('\n'));
// reading flips structure
const rf: string[] = [];
for (const b of BRIEFS) { const v = b.readings.map((r: any) => s(b, 'set', r.id) - s(b, 'open', r.id)); if (Math.max(...v) > 0.15 && Math.min(...v) < -0.15) rf.push(`${b.id}: ${b.readings.map((r: any, i: number) => `${r.id} ${v[i].toFixed(2)} d=${(sc(b, EVEN, r.id, { structure: 'set' }) - sc(b, EVEN, r.id, { structure: 'open' })).toFixed(1)}`).join(' | ')}`); }
console.log('reading flips structure:', rf.length); console.log(rf.slice(0, 5).join('\n'));
for (const id of ['brief-nordic_noir', 'brief-social_realism', 'brief-melodrama', 'brief-slapstick']) { const b = BRIEF_BY_ID[id]!; const r = b.readings[0]!.id; console.log(id, 'sR', s(b, 'restrained'), 'sE', s(b, 'expansive'), 'even R-E', (sc(b, EVEN, r, { scale: 'restrained' }) - sc(b, EVEN, r, { scale: 'expansive' })).toFixed(1), 'spec R-E', (sc(b, SPEC, r, { scale: 'restrained' }) - sc(b, SPEC, r, { scale: 'expansive' })).toFixed(1)); }
