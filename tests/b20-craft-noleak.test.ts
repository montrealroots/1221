/**
 * Brief 20, the craft area's no-leak side (criterion B1, "irrelevant differences do not leak into unrelated outcomes";
 * docs/verification/audit-2026-10-21/areas/craft): twins made by creation's own config, alike but for one thing that
 * mustn't change how work is judged or who is cast, played through the same commands and the same clock, and the
 * judgments asserted equal.
 *
 * - Race and ethnicity, the background text and the portrait: kept on the person and shown, read by no judgment.
 * - A loved genre (creation's genres): the owner's rule of 2026-09-24 (`systems/enjoyment.ts`) is that a preference may
 *   change how much somebody gets out of doing a thing, never how good they are at it. A rehearsal or a night of a play
 *   of the kind lifts the mood after it; a take, a showing and the chair's read don't read it at all.
 *
 * The take is taped at commands alone, the day held rested (TEST SETUP, as tests/b20-craft-bite.test.ts); the showing
 * and the casting are reached through the clock (`live`), the twins tended alike.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { courseworkOf } from '@/engine/systems/coursework';
import { at, clearDay, live, run, student, workScene } from './fakes/craft-life';

const B = BRIEF_BY_ID['brief-absurdist']!;
const T = at(2026, 8, 29, 14);
const rest = (sim: Simulation) => { clearDay(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); };

/** What each twin's work came to: a take of a brief in a genre the one twin loves, the first Scene Study shown, and the first spring's cast. */
function judged(over: Parameters<typeof student>[1]) {
  const tape = student('b20c-noleak', over);
  for (const [kind, payload] of [['brief.choose', { brief: B.id, reading: B.readings[0]!.id }], ...['read', 'lines', 'lines', 'rehearse'].map((step) => ['brief.prepare', { brief: B.id, step }] as const)] as const) { rest(tape); run(tape, kind, payload); }
  rest(tape); tape.advanceTo(T); rest(tape);
  const take = run<{ overall: number; band: string }>(tape, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
  const life = student('b20c-noleak', over);
  live(life, at(2026, 9, 8, 12), { evening: (s) => workScene(s, ['read', 'learn', 'reader', 'rehearse']) });
  const shown = courseworkOf(life, life.player)!.assignments.find((a) => a.course === 'DRAM 103a/b')!.shown!;
  live(life, at(2027, 1, 26));
  const s = life.player.school!;
  const kept = { race: life.player.raceEthnicity, background: life.player.background, portrait: life.player.portrait, genres: life.player.genres };
  return { judged: { take, shown: { band: shown.band, score: shown.score, strengths: shown.strengths }, castRead: s.castRead, casting: s.casting, castable: s.castable, classmates: s.classmates.map((m) => m.name) }, kept };
}

describe('B1, no leak: what isn\'t read by a judgment doesn\'t move it', () => {
  const base = judged({});
  it('race and ethnicity', () => {
    const twin = judged({ raceEthnicity: ['black', 'hispanic'], raceEthnicityOwn: 'Afro-Dominican' });
    expect(twin.kept.race).toEqual(['black', 'hispanic']);
    expect(twin.kept.race).not.toEqual(base.kept.race);
    expect(twin.judged).toEqual(base.judged);
  });
  it('the background text', () => {
    const twin = judged({ background: 'Grew up over a bakery in Queens, and did every school play there was.' });
    expect(twin.kept.background).not.toBe(base.kept.background);
    expect(twin.judged).toEqual(base.judged);
  });
  it('the portrait', () => {
    const twin = judged({ portrait: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' });
    expect(twin.kept.portrait).toMatch(/^data:image/);
    expect(base.kept.portrait).toBeUndefined();
    expect(twin.judged).toEqual(base.judged);
  });
  it('a loved genre, the brief\'s own: the take, the showing and the cast are the same', () => {
    const twin = judged({ genres: [B.kinds[0]!, 'drama', 'comedy'] });
    expect(twin.kept.genres).toContain(B.kinds[0]);
    expect(base.kept.genres).toEqual([]);
    expect(twin.judged).toEqual(base.judged);
  });
});
