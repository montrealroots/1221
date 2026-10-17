/**
 * The school's looks, held to the program a leave, a repeated year or an additional term leaves a student in, and the
 * assignment look held to what its figures are (from 2026-10-12, `ui/looks/school.tsx`):
 * - the course look looked for a course's next meeting in the calendar year's timetable, so back from a leave a
 *   first-year course had no Meets Next, and on a leave one met next anyway; the school look capped the calendar term
 *   at the sixth, so a third-year fall after a leave was named as the spring before it, with that spring's courses; and
 *   Terms Begun counted the calendar's terms, the leave's with them, past six;
 * - the assignment look headed its weights Of The Showing and said the showing weighs each part by its share and that
 *   what fades by the day is taken off; the result reads each part through the dimensions it bears on, and nothing
 *   fades.
 * PLAYER JOURNEYS play through commands; FIXTURES set a state by hand to reach a year three years on, and say so.
 */
import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactNode } from 'react';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, dateKey, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { COURSES, YALE_DRAMA } from '@/engine/content/school';
import { templateById } from '@/engine/content/coursework';
import { classPeriod, coursesFor, termLabel } from '@/engine/systems/school';
import { activitiesOf, courseworkOf, judgeWork, preparedParts, weightsOf } from '@/engine/systems/coursework';
import { healthOf } from '@/engine/systems/health';
import { Stat } from '@/ui/components/primitives';
import '@/ui/looks/all';
import { resolveLook, type Looked } from '@/ui/looks/registry';
import { at as subject } from '@/ui/looks/subject';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

const look = (sim: Simulation, kind: string, id: string): Looked => {
  const found = resolveLook(sim, subject(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  return found;
};

/** Every element under a node, depth first. */
function elements(node: ReactNode, out: { type: unknown; props: Record<string, unknown> }[] = []): { type: unknown; props: Record<string, unknown> }[] {
  if (Array.isArray(node)) { for (const n of node) elements(n as ReactNode, out); return out; }
  if (!isValidElement(node)) return out;
  const props = node.props as Record<string, unknown>;
  out.push({ type: node.type, props });
  elements(props.children as ReactNode, out);
  return out;
}

/** The words a node shows, its Stats' figures left out. */
function text(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map((n) => text(n as ReactNode)).join('');
  if (!isValidElement(node)) return '';
  return text((node.props as { children?: ReactNode }).children);
}

const stat = (l: Looked, label: string) => elements(l.body).find((e) => e.type === Stat && e.props.label === label)?.props as { value: string; note: string } | undefined;
const meetsNext = (l: Looked) => (l.ways ?? []).find((w) => w.label.startsWith('Meets Next'));
const dayOf = (key: string) => { const [year, month, day] = key.split('-').map(Number); return { year: year!, month: month!, day: day! }; };

describe('PLAYER JOURNEY: the school’s looks across a leave', () => {
  it('on the leave, no course is taken or meets next; back a year below, a first-year course meets next on its own day, and Terms Begun counts the program’s', () => {
    const sim = student('g10-leave');
    tended(sim, at(2026, 10, 5));
    // FIXTURE: the flu, as `careFor` gives one, so a medical leave can be asked for.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave!.status).toBe('on');
    // The fall's class days go on without them: Acting I isn't theirs this term, and doesn't meet next for them.
    const away = look(sim, 'course', 'DRAM 103a/b');
    expect(away.summary).not.toMatch(/^You’re taking it this term/);
    expect(meetsNext(away)).toBeUndefined();
    const leaving = look(sim, 'school', YALE_DRAMA.id);
    expect(text(leaving.body)).toMatch(/you’re on leave until Fall Term 2027/);
    expect((leaving.ways ?? []).filter((w) => w.to.kind === 'course')).toHaveLength(0);
    // The fall left is taken again on return, so none of the program's terms is begun yet: not one less than none.
    // Until a second reading the same day this held only through a clamp at 0, the figure itself one short through
    // any two-term leave; the leaves after the first term are held in `tests/defects-r3-1.test.ts`.
    expect(stat(leaving, 'Terms Begun')).toMatchObject({ value: `0 of ${YALE_DRAMA.terms}` });

    tended(sim, at(2027, 5, 1));
    sim.must({ kind: 'school.return_notice', payload: {} });
    tended(sim, at(2027, 8, 25, 12));
    sim.must({ kind: 'school.reregister', payload: {} });
    tended(sim, at(2027, 9, 1, 12));
    const school = sim.player.school!;
    expect(school.offset).toBe(2);

    // Acting I again, in the second fall: taken, and its next meeting a day it meets for them.
    const back = look(sim, 'course', 'DRAM 103a/b');
    expect(back.summary).toMatch(/^You’re taking it this term/);
    const next = meetsNext(back);
    expect(next).toBeDefined();
    expect(coursesFor(school, dayOf(next!.to.id)).map((c) => c.code)).toContain('DRAM 103a/b');

    // The school: this fall, its first-year courses, and one term of the program begun, the leave's two noted.
    const home = look(sim, 'school', YALE_DRAMA.id);
    expect(text(home.body)).toMatch(/This is Fall Term 2027/);
    expect(stat(home, 'Terms Begun')).toMatchObject({ value: `1 of ${YALE_DRAMA.terms}` });
    expect(stat(home, 'Terms Begun')!.note).toMatch(/2 on leave or repeated/);
  }, 120_000);
});

describe('the school’s looks past the sixth calendar term', () => {
  /** FIXTURE: the clock and the record brought to a calendar term, as playing three years would. */
  const placed = (seed: string, term: number, record: Record<string, unknown>) => {
    const sim = student(seed);
    Object.assign(sim.player.school!, record);
    sim.universe.now = instantFromZoned({ ...classPeriod(term).from, hour: 7 }, zone);
    return sim;
  };

  it('a third-year fall after a leave is that fall, with its courses, and the program’s fifth term begun of six', () => {
    const sim = placed('g10-third', 6, { termsBegun: 7, offset: 2, enrolled: [2, 3, 4, 5, 6] });
    const home = look(sim, 'school', YALE_DRAMA.id);
    expect(text(home.body)).toMatch(new RegExp(`This is ${termLabel(6)}`));
    expect(termLabel(6)).toBe('Fall Term 2029');
    // Its courses are the third year's fall, not the spring before.
    const fall = COURSES.filter((c) => c.year === 3 && c.terms.includes('fall')).map((c) => c.code).sort();
    const listed = (home.ways ?? []).filter((w) => w.to.kind === 'course').map((w) => w.to.id).sort();
    expect(listed).toEqual(fall);
    expect(stat(home, 'Terms Begun')).toMatchObject({ value: `5 of ${YALE_DRAMA.terms}` });
    // A third-year fall course is taken, and meets next on a day it meets for them.
    const only = COURSES.find((c) => c.year === 3 && c.terms.length === 1 && c.terms[0] === 'fall')!;
    const course = look(sim, 'course', only.code);
    expect(course.summary).toMatch(/^You’re taking it this term/);
    expect(coursesFor(sim.player.school!, dayOf(meetsNext(course)!.to.id)).map((c) => c.code)).toContain(only.code);
  });

  it('an additional term retakes its course, which meets next, and Terms Begun stays at six with the term noted', () => {
    const sim = placed('g10-extra', 6, { termsBegun: 7, enrolled: [0, 1, 2, 3, 4, 5, 6], extra: { term: 6, courses: [{ code: 'DRAM 153a', academic: 0, name: 'Play' }] } });
    const home = look(sim, 'school', YALE_DRAMA.id);
    expect(text(home.body)).toMatch(/This is Fall Term 2029, your additional term, and you’re retaking Play in it/);
    expect((home.ways ?? []).filter((w) => w.to.kind === 'course').map((w) => w.to.id)).toEqual(['DRAM 153a']);
    expect(stat(home, 'Terms Begun')).toMatchObject({ value: `${YALE_DRAMA.terms} of ${YALE_DRAMA.terms}` });
    expect(stat(home, 'Terms Begun')!.note).toMatch(/one additional term/);
    const play = look(sim, 'course', 'DRAM 153a');
    expect(play.summary).toMatch(/^You’re taking it this term/);
    expect(coursesFor(sim.player.school!, dayOf(meetsNext(play)!.to.id)).map((c) => c.code)).toEqual(['DRAM 153a']);
  });
});

describe('the assignment look says what its figures are', () => {
  it('heads the weights Weighs, as the coursework panel does, and says nothing fades and the weights choose the note', () => {
    const sim = student('g10-weighs');
    tended(sim, at(2026, 9, 16, 18));
    const a = courseworkOf(sim, sim.player)!.assignments.find((x) => x.status === 'open' && templateById(x.template)!.dims.familiarity)!;
    expect(a).toBeDefined();
    const act = activitiesOf(a).find((x) => x.dim === 'familiarity')!;
    sim.must({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: act.id } });
    const l = look(sim, 'assignment', a.id);
    const heads = elements(l.body).filter((e) => e.type === 'th').map((e) => text(e.props.children as ReactNode));
    expect(heads).toEqual(['Part', 'Prepared', 'Note Priority']);
    expect(l.provenance).not.toMatch(/fades by then|weighs each part by its share/);
    expect(l.provenance).toMatch(/nothing fades/);
    expect(l.provenance).toMatch(/when the teacher picks what to note/);

    // What the provenance says, measured. Nothing fades: a part reads the same today as on the day it's due.
    const today = dateKey(sim.now, zone);
    expect(preparedParts(sim.player, a, a.dueOn)).toEqual(preparedParts(sim.player, a, today));
    expect(a.prep.familiarity).toBeGreaterThan(0);
    // And the weights reach the note, not the result: the template's weights turned about, the result is the same.
    const t = templateById(a.template)!;
    const before = judgeWork(sim, sim.player, a, a.dueOn, sim.now, 'g10');
    const shares = weightsOf(a);
    const kept = Object.fromEntries(Object.entries(t.dims).map(([d, v]) => [d, v!.weight]));
    const dims = Object.keys(kept);
    try {
      dims.forEach((d, i) => { (t.dims as Record<string, { weight: number }>)[d]!.weight = kept[dims[dims.length - 1 - i]!]! + i; });
      expect(weightsOf(a)).not.toEqual(shares);
      expect(judgeWork(sim, sim.player, a, a.dueOn, sim.now, 'g10').overall).toBe(before.overall);
    } finally {
      for (const d of dims) (t.dims as Record<string, { weight: number }>)[d]!.weight = kept[d]!;
    }
  });
});
