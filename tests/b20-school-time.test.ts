/**
 * Brief 20's School area: time and the School's obligations (2026-10-21, criteria D1's "time skipping an obligation").
 * One attentive student's fall (seed `b20-school-time`, a New York student of modest means) is played to Sunday 13
 * September 2026 at eight in the evening and saved. From that save the clock is moved a week, and a month, three ways:
 * in one jump; a day at a time; and as the screen moves it, stopping at each commitment that wants the player and
 * answered Go (`answerStop`, `world/clock.ts`). Every class day, lab, rehearsal with a partner, work-study shift and
 * piece due in the window falls due once, settled, never dropped and never counted twice, and the three ways end alike.
 * A morning slept through is missed, and counted as missed, once.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, zonedParts } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { answerStop } from '@/engine/world/clock';
import { CLASSES_KIND, LAB_KIND, SHIFT_KIND, keyOf } from '@/engine/systems/school';
import { PARTNER_KIND, courseworkOf } from '@/engine/systems/coursework';
import { ZONE, at, balances, play, reload, student, tallyOf, titled } from './setup/b20-school';

const open = (raw: string): Simulation => loadSave(deserialise(raw) as never);
/** Everything a jump could drop or count twice: the tally, the course records, each piece and its rehearsals, the work-study hours and the money. */
const state = (sim: Simulation) => JSON.stringify({ tally: tallyOf(sim), courses: sim.player.school!.courses, work: courseworkOf(sim, sim.player)!.assignments.map((a) => [a.id, a.status, a.shown?.band, a.shown?.at, a.rehearsals.map((r) => r.status)]), money: balances(sim), ws: sim.player.school!.workStudy });
const SCHOOL = [CLASSES_KIND, LAB_KIND, PARTNER_KIND, SHIFT_KIND];

describe('a week and a month moved at once: each School obligation falls due once (seed b20-school-time)', () => {
  const S = {} as { raw: string; from: number };
  beforeAll(() => {
    const sim = play(student('b20-school-time', { wealth: 'modest' }), at(2026, 9, 13, 20));
    S.raw = serialise(sim.universe);
    S.from = sim.now;
  }, 60_000);

  for (const days of [7, 30]) {
    it(`${days} days: every class day, lab, rehearsal, shift and piece due in them settled once; one jump, a day at a time and stopping at each, alike`, () => {
      const to = S.from + days * MS_DAY;
      const one = open(S.raw);
      const before = tallyOf(one);
      const cancelledBefore = new Set(one.universe.scheduled.filter((i) => i.status === 'cancelled').map((i) => i.id));
      one.advanceTo(to);
      // The window's School items, those the week's planning put on the calendar on the way among them (`planWeek`, each
      // Sunday evening): every one came, and was kept or missed; none left pending, none called off on the way.
      const window = one.universe.scheduled.filter((i) => i.payload.personId === one.player.id && i.at >= S.from && i.at < to && SCHOOL.includes(i.kind) && !cancelledBefore.has(i.id));
      const count = (kind: string) => window.filter((i) => i.kind === kind).length;
      expect(count(CLASSES_KIND)).toBeGreaterThanOrEqual(days === 7 ? 5 : 20);
      expect(count(SHIFT_KIND)).toBeGreaterThan(0);
      for (const i of window) expect([i.kind, i.status]).toEqual([i.kind, expect.stringMatching(/^(done|missed)$/)]);
      // Each class day and each shift on the calendar once: a day booked twice would be counted twice.
      expect(new Set(window.filter((i) => i.kind === CLASSES_KIND).map((i) => i.payload.day)).size).toBe(count(CLASSES_KIND));
      expect(new Set(window.filter((i) => i.kind === SHIFT_KIND).map((i) => i.at)).size).toBe(count(SHIFT_KIND));
      const after = tallyOf(one);
      // Each class day counted once, each lab once among the calls, each assigned shift once.
      expect(after.classDays - before.classDays).toBe(count(CLASSES_KIND));
      expect((after.attended - before.attended) + (after.excused - before.excused) + window.filter((i) => i.kind === CLASSES_KIND && i.status === 'missed').length).toBe(count(CLASSES_KIND));
      expect(after.calls - before.calls).toBe(count(LAB_KIND));
      expect(after.shifts - before.shifts).toBe(count(SHIFT_KIND));
      // Each piece due in the window, set before it or in it, shown on its day at nine, once; none still open past it.
      const end = zonedParts(to, ZONE);
      const endKey = keyOf({ year: end.year, month: end.month, day: end.day });
      const startKey = keyOf({ year: 2026, month: 9, day: 14 });
      const now = courseworkOf(one, one.player)!.assignments;
      const due = now.filter((a) => a.dueOn >= startKey && a.dueOn < endKey);
      expect(due.length).toBeGreaterThan(days === 7 ? 3 : 10);
      for (const a of due) {
        expect(a.status, a.id).not.toBe('open');
        if (a.shown) expect(zonedParts(a.shown.at, ZONE).hour).toBe(9);
      }
      // Each rehearsal booked in the window resolved, kept or missed by one side.
      expect(count(PARTNER_KIND)).toBeGreaterThan(0);
      for (const i of window.filter((x) => x.kind === PARTNER_KIND)) {
        const r = now.flatMap((a) => a.rehearsals).find((x) => x.id === i.payload.rehearsalId)!;
        expect(r.status).not.toBe('booked');
      }
      // A day at a time, and the screen's way, stopping at each commitment that wants the player and answered Go.
      const daily = open(S.raw);
      while (daily.now < to) daily.advanceTo(Math.min(to, daily.now + MS_DAY));
      const screen = open(S.raw);
      let stops = 0;
      let r = screen.advanceTo(to, { stopOnPlayerRequired: true });
      while (r.interruptedBy) {
        stops += 1;
        const next = answerStop(screen, { item: r.interruptedBy, wanted: to, sentFrom: r.sentFrom }, 'go').result;
        if (!next) break;
        r = next;
      }
      expect(stops).toBeGreaterThanOrEqual(count(CLASSES_KIND));
      expect(screen.now).toBe(to);
      expect(state(daily)).toBe(state(one));
      expect(state(screen)).toBe(state(one));
      // And saved and opened halfway: the same.
      const halfway = open(S.raw);
      halfway.advanceTo(S.from + Math.floor(days / 2) * MS_DAY);
      const reopened = reload(halfway);
      reopened.advanceTo(to);
      expect(state(reopened)).toBe(state(one));
    }, 60_000);
  }

  it('how rested the student comes sets how much a class grows them: a class day with nothing due, after a night’s sleep against none', () => {
    // Tuesday 15 September: classes, and no piece due at them, so each meeting's growth is an ordinary class's, weighed
    // by nothing but the focus the student brings (`focusAt`); Monday is lived alike in both.
    const tuesday = keyOf({ year: 2026, month: 9, day: 15 });
    const base = open(S.raw);
    base.advanceTo(at(2026, 9, 14, 23));
    expect(courseworkOf(base, base.player)!.assignments.filter((a) => (a.status === 'open' || a.status === 'revising') && (a.status === 'revising' ? a.revision!.dueOn : a.dueOn) === tuesday)).toEqual([]);
    const raw = serialise(base.universe);
    const rested = open(raw);
    rested.must({ kind: 'life.sleep', payload: { hours: 8 } });
    // Up all night: the clock moved to Tuesday morning with no sleep.
    const tired = open(raw);
    tired.advanceTo(at(2026, 9, 15, 8));
    const craftBefore = { ...tired.player.craft! };
    const grown = (sim: Simulation) => { sim.advanceTo(at(2026, 9, 15, 16)); return Object.entries(sim.player.craft!).reduce((n, [k, v]) => n + (v - craftBefore[k as keyof typeof craftBefore]), 0); };
    const a = grown(rested);
    const b = grown(tired);
    // Both were in class, and counted alike.
    expect(tallyOf(tired)).toEqual(tallyOf(rested));
    expect(a).toBeGreaterThan(0);
    expect(b).toBeLessThan(a * 0.9);
  });

  it('a Monday slept through is missed and counted as missed, once, and said; the week’s other days are kept', () => {
    const sim = open(S.raw);
    const monday = at(2026, 9, 14);
    const classes = sim.universe.scheduled.find((i) => i.kind === CLASSES_KIND && i.status === 'pending' && i.at === monday)!;
    expect(classes).toBeDefined();
    const before = tallyOf(sim);
    const coursesBefore = structuredClone(sim.player.school!.courses!);
    // To bed at eight on Sunday evening for sixteen hours, through Monday's classes at nine.
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 16 } }).ok).toBe(true);
    expect(classes.status).toBe('missed');
    sim.advanceTo(S.from + 7 * MS_DAY);
    const after = tallyOf(sim);
    const days = sim.universe.scheduled.filter((i) => i.kind === CLASSES_KIND && i.payload.personId === sim.player.id && i.at > S.from && i.at < S.from + 7 * MS_DAY);
    expect(after.classDays - before.classDays).toBe(days.length);
    expect(after.attended - before.attended).toBe(days.length - 1);
    expect(titled(sim, 'You Missed Classes').filter((n) => n.at === monday)).toHaveLength(1);
    expect(titled(sim, /^You Slept Through/).at(-1)!.body).toMatch(/Classes/);
    // Each of Monday's courses has one more meeting, not attended.
    const mondays = Object.entries(sim.player.school!.courses!).filter(([k, r]) => r.meetings > (coursesBefore[k]?.meetings ?? 0) && r.attended - (coursesBefore[k]?.attended ?? 0) < r.meetings - (coursesBefore[k]?.meetings ?? 0));
    expect(mondays.length).toBeGreaterThan(0);
    for (const [k, r] of mondays) expect(r.meetings - r.attended - r.excused).toBe((coursesBefore[k]?.meetings ?? 0) - (coursesBefore[k]?.attended ?? 0) - (coursesBefore[k]?.excused ?? 0) + 1);
  }, 60_000);
});
