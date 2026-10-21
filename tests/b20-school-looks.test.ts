/**
 * Brief 20's School area: the School's looks say what the state is (2026-10-21, criteria M1's presentation rows and C2's
 * "text that says what the state is"). The last-term save of journey J01 (`tests/fixtures/journey-j01-last-term-8283f80c`,
 * 1 March 2029, in good standing) is opened, and the clock moved a week at a time to the term's review, once as it is and
 * once with every class morning of March slept through (`life.sleep` at seven, four hours). Each look is resolved as the
 * screens resolve it (`resolveLook`), and what it says is checked against the record it reads: the School's standing, a
 * course taken this term, a piece shown and its band, a classmate's trust, a judged piece of work and its figure.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { deserialise } from '@/engine/persistence/adapter';
import { YALE_DRAMA } from '@/engine/content/school';
import { coursesFor } from '@/engine/systems/school';
import { BAND_LABEL, courseworkOf, trustOf } from '@/engine/systems/coursework';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';
import { at, partsOf } from './setup/b20-school';

const RAW = gunzipSync(readFileSync('tests/fixtures/journey-j01-last-term-8283f80c.json.gz')).toString('utf8');
const open = (): Simulation => loadSave(deserialise(RAW) as never);
const weeks = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 7 * MS_DAY)); return sim; };
const look = (sim: Simulation, kind: string, id: string): Looked => {
  const found = resolveLook(sim, subject(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  return found;
};
const classDay = (sim: Simulation) => { const p = partsOf(sim); return coursesFor(sim.player.school!, { year: p.year, month: p.month, day: p.day }).length > 0; };

describe('the School’s looks say what the record holds (J01’s last-term save)', () => {
  const S = {} as { kept: Simulation; slept: Simulation; before: Simulation };
  beforeAll(() => {
    S.before = open();
    S.kept = weeks(open(), at(2029, 4, 28));
    const slept = open();
    slept.advanceTo(at(2029, 3, 2, 7));
    while (slept.now < at(2029, 3, 31)) {
      if (classDay(slept)) slept.execute({ kind: 'life.sleep', payload: { hours: 4 } });
      slept.advanceTo(at(partsOf(slept).year, partsOf(slept).month, partsOf(slept).day, 7) + MS_DAY);
    }
    S.slept = weeks(slept, at(2029, 4, 28));
  }, 60_000);

  it('look.school: the standing the record holds, in its words, and a change of standing changes them', () => {
    expect(look(S.before, 'school', YALE_DRAMA.id).summary).toMatch(/^You’re in your third year of three, in good standing, and /);
    expect(S.slept.player.school!.standing).toBe('concern');
    expect(look(S.slept, 'school', YALE_DRAMA.id).summary).toMatch(/^You’re in your third year of three, with a notice of academic concern, and /);
    // Whatever the standing, the words are its own.
    const said = { good: 'in good standing', concern: 'with a notice of academic concern', warning: 'on academic warning' } as Record<string, string>;
    for (const sim of [S.before, S.kept, S.slept]) expect(look(sim, 'school', YALE_DRAMA.id).summary).toContain(said[sim.player.school!.standing]!);
  });

  it('look.course: a course met this term says it’s being taken, and opens onto the School', () => {
    const p = partsOf(S.before);
    const course = coursesFor(S.before.player.school!, { year: p.year, month: p.month, day: p.day + 1 })[0] ?? coursesFor(S.before.player.school!, { year: 2029, month: 3, day: 5 })[0]!;
    const found = look(S.before, 'course', course.code);
    expect(found.summary).toMatch(/^You’re taking it this term, /);
    expect(found.parent).toEqual(subject('school', YALE_DRAMA.id));
  });

  it('look.assignment: a piece shown says so, with the band it was shown at', () => {
    const shown = courseworkOf(S.kept, S.kept.player)!.assignments.filter((a) => a.shown).slice(-3);
    expect(shown.length).toBe(3);
    for (const a of shown) expect(look(S.kept, 'assignment', a.id).summary).toContain(`Shown: ${BAND_LABEL[a.shown!.band]}.`);
  });

  it('look.classmate: the trust the record holds, as a number of a hundred', () => {
    const mates = S.kept.player.school!.classmates;
    for (let i = 0; i < 3; i += 1) expect(look(S.kept, 'classmate', String(i)).summary).toContain(`their trust in you is ${Math.round(trustOf(mates[i]!))} of 100`);
  });

  it('look.work: a judged piece says the figure and the day the record holds', () => {
    const work = S.kept.player.work!.slice(-3);
    expect(work.length).toBe(3);
    for (const w of work) expect(look(S.kept, 'work', w.inputs.key).summary.startsWith(`Judged ${w.overall.toFixed(1)} of 100`)).toBe(true);
  });
});
